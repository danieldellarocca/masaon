import type { CompiledArea } from "./area";
import { haversineKm, type LatLng } from "./geometry";

export interface GameLocation {
  panoId: string;
  lat: number;
  lng: number;
  heading: number;
  description: string;
}

export class LocationSearchError extends Error {
  constructor(
    message: string,
    readonly reason: "no-coverage" | "denied" | "network" | "aborted",
  ) {
    super(message);
  }
}

const BATCH_SIZE = 6;
const MAX_BATCHES = 15;
const MAX_RADIUS_M = 100_000;

interface FindOptions {
  exclude: GameLocation[];
  signal?: AbortSignal;
}

// מגריל נקודות באזור ומחפש לידן פנורמת Street View רשמית של גוגל, עד שנמצאת אחת שנמצאת בתוך האזור.
export async function findLocation(area: CompiledArea, options: FindOptions): Promise<GameLocation> {
  const service = new google.maps.StreetViewService();
  const usedPanos = new Set(options.exclude.map((l) => l.panoId));
  // מרחק מינימלי מסבבים קודמים, כדי לא לקבל את אותה פינת רחוב פעמיים.
  const minSeparationKm = Math.min(0.5, area.scaleKm / 100);
  // כמה בקשות קיבלו תשובה אמיתית מגוגל (גם "אין כאן כלום"), כדי להבדיל בין אזור בלי כיסוי לבין בעיית תקשורת.
  let answered = 0;

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    if (options.signal?.aborted) throw new LocationSearchError("החיפוש בוטל", "aborted");
    // אחרי כמה סבבים כושלים מרחיבים את רדיוס החיפוש.
    const radiusFactor = 1 + Math.floor(batch / 3);

    const attempts = Array.from({ length: BATCH_SIZE }, async () => {
      const candidate = area.sample();
      if (!candidate) return null;
      let data: google.maps.StreetViewPanoramaData;
      try {
        const res = await service.getPanorama({
          location: candidate.point,
          radius: Math.min(MAX_RADIUS_M, candidate.searchRadiusM * radiusFactor),
          preference: google.maps.StreetViewPreference.NEAREST,
          sources: [google.maps.StreetViewSource.GOOGLE, google.maps.StreetViewSource.OUTDOOR],
        });
        data = res.data;
        answered++;
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        if (["REQUEST_DENIED", "PERMISSION_DENIED"].includes(code)) {
          throw new LocationSearchError("גוגל דחתה את הבקשה – בדקו שהמפתח מורשה ל-Maps JavaScript API", "denied");
        }
        if (["OVER_QUERY_LIMIT", "RESOURCE_EXHAUSTED"].includes(code)) {
          throw new LocationSearchError("חרגתם ממכסת הבקשות של גוגל. נסו שוב מאוחר יותר.", "denied");
        }
        if (code !== "ZERO_RESULTS") return null;
        answered++;
        area.report(candidate.code, false);
        return null;
      }

      const latLng = data.location?.latLng;
      const panoId = data.location?.pano;
      if (!latLng || !panoId) {
        area.report(candidate.code, false);
        return null;
      }
      const point: LatLng = { lat: latLng.lat(), lng: latLng.lng() };
      const inside = area.contains(point);
      area.report(candidate.code, inside);
      if (!inside || usedPanos.has(panoId)) return null;
      // פנורמה בלי קישורים היא בדרך כלל תמונה בודדת ולא כביש.
      const links = (data.links ?? []).filter((l): l is google.maps.StreetViewLink => !!l);
      if (links.length === 0) return null;
      if (options.exclude.some((l) => haversineKm(l, point) < minSeparationKm)) return null;

      const link = links[Math.floor(Math.random() * links.length)];
      const heading = ((link.heading ?? Math.random() * 360) + (Math.random() * 40 - 20) + 360) % 360;
      return {
        panoId,
        lat: point.lat,
        lng: point.lng,
        heading,
        description: data.location?.description ?? "",
      } satisfies GameLocation;
    });

    const results = await Promise.all(attempts);
    const found = results.find((r): r is GameLocation => r !== null);
    if (found) return found;
    if (batch >= 1 && answered === 0) break; // אף בקשה לא נענתה – כנראה בעיית רשת
  }

  if (answered === 0) {
    throw new LocationSearchError("אין תשובה מ-Google Street View. בדקו את החיבור לאינטרנט ונסו שוב.", "network");
  }
  throw new LocationSearchError(
    "לא הצלחנו למצוא מיקום עם Street View באזור הזה. ייתכן שאין בו כמעט כיסוי של גוגל.",
    "no-coverage",
  );
}
