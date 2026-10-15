import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { MultiPolygon, Polygon } from "geojson";
import { BOUNDARY_NAME_ALIASES, COUNTRY_BY_NUMERIC } from "./countries";
import { destination, makePart, partContains, type LatLng, type PolygonPart, type Ring } from "./geometry";

export interface CountryShape {
  code: string;
  parts: PolygonPart[];
  areaKm2: number;
}

export type Boundaries = Map<string, CountryShape>;

// גבולות מדינות בקנה מידה 1:50M (Natural Earth דרך world-atlas), נטען פעם אחת מתיקיית public.
const BOUNDARIES_URL = "/geo/countries-50m.json";

let cache: Promise<Boundaries> | null = null;

export function loadBoundaries(): Promise<Boundaries> {
  if (!cache) {
    cache = fetch(BOUNDARIES_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`טעינת גבולות המדינות נכשלה (${res.status})`);
        return res.json() as Promise<Topology>;
      })
      .then(buildBoundaries)
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

export function buildBoundaries(topology: Topology): Boundaries {
  const collection = feature(topology, topology.objects.countries as GeometryCollection<{ name: string }>);
  const shapes: Boundaries = new Map();

  for (const f of collection.features) {
    const code =
      (f.id != null ? COUNTRY_BY_NUMERIC[String(f.id)]?.code : undefined) ??
      BOUNDARY_NAME_ALIASES[f.properties?.name ?? ""];
    if (!code || !f.geometry) continue;

    const geometry = f.geometry as Polygon | MultiPolygon;
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    const parts = polygons.map((rings) => makePart(rings as Ring[]));

    const existing = shapes.get(code);
    if (existing) {
      existing.parts.push(...parts);
      existing.areaKm2 += parts.reduce((s, p) => s + p.areaKm2, 0);
    } else {
      shapes.set(code, { code, parts, areaKm2: parts.reduce((s, p) => s + p.areaKm2, 0) });
    }
  }
  return shapes;
}

// באיזו מדינה נמצאת הנקודה (או null בים / באזור לא מזוהה).
export function countryAt(boundaries: Boundaries, lat: number, lng: number): string | null {
  for (const shape of boundaries.values()) {
    if (shape.parts.some((p) => partContains(p, lng, lat))) return shape.code;
  }
  return null;
}

// כמו countryAt, אבל נקודה על קו החוף שהגבולות הגסים "שמים בים" משויכת למדינה הקרובה.
export function countryNear(boundaries: Boundaries, lat: number, lng: number, maxKm = 10): string | null {
  const exact = countryAt(boundaries, lat, lng);
  if (exact) return exact;
  for (const point of nearbyPoints({ lat, lng }, maxKm)) {
    const code = countryAt(boundaries, point.lat, point.lng);
    if (code) return code;
  }
  return null;
}

// טבעות של נקודות סביב נקודה, מהקרובה לרחוקה.
export function nearbyPoints(center: LatLng, maxKm: number): LatLng[] {
  const points: LatLng[] = [];
  for (const km of [0.5, 1.5, 4, 10].filter((d) => d <= maxKm)) {
    for (let bearing = 0; bearing < 360; bearing += 45) points.push(destination(center, km, bearing));
  }
  return points;
}
