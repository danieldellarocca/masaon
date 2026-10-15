import { countryAt, nearbyPoints, type Boundaries } from "./boundaries";
import { COUNTRIES, COUNTRY_BY_CODE } from "./countries";
import {
  bboxContains,
  bboxDiagonalKm,
  bboxIntersection,
  bboxSphericalArea,
  haversineKm,
  normalizeLng,
  partContains,
  randomPointInBBox,
  randomPointInCircle,
  unionBBox,
  weightedIndex,
  type LatLng,
  type PolygonPart,
} from "./geometry";
import { DEFAULT_CLIPS, PRESET_BY_ID, type AreaEntry, type BBox } from "./regions";

export type AreaSpec =
  | { kind: "world" }
  | { kind: "preset"; presetId: string }
  | { kind: "countries"; codes: string[] }
  | { kind: "circle"; center: LatLng; radiusKm: number };

export interface Candidate {
  point: LatLng;
  searchRadiusM: number;
  code: string | null;
}

export interface CompiledArea {
  label: string;
  // קנה המידה לניקוד: אלכסון המלבן החוסם של האזור (כמו ב-GeoGuessr).
  scaleKm: number;
  bounds: BBox;
  sample(): Candidate | null;
  contains(point: LatLng): boolean;
  // משוב על ניסיון חיפוש, כדי להוריד משקל ממדינות שלא נמצא בהן כיסוי.
  report(code: string | null, found: boolean): void;
}

export const WORLD_SCALE_KM = 14916.862;
const WORLD_BOUNDS: BBox = [-180, -60, 180, 80];

const COVERAGE_WEIGHT = [0.03, 0.3, 1] as const;

export function areaLabel(spec: AreaSpec): string {
  switch (spec.kind) {
    case "world":
      return "כל העולם";
    case "preset":
      return PRESET_BY_ID[spec.presetId]?.name ?? "אזור";
    case "countries": {
      const names = spec.codes.map((c) => COUNTRY_BY_CODE[c]?.name ?? c);
      if (names.length <= 3) return names.join(", ");
      return `${names.slice(0, 2).join(", ")} ועוד ${names.length - 2}`;
    }
    case "circle":
      return `אזור מותאם · רדיוס ${formatRadius(spec.radiusKm)}`;
  }
}

export function formatRadius(km: number): string {
  return km < 10 ? `${km.toFixed(1).replace(/\.0$/, "")} ק״מ` : `${Math.round(km).toLocaleString("he-IL")} ק״מ`;
}

export function areaKey(spec: AreaSpec): string {
  switch (spec.kind) {
    case "world":
      return "world";
    case "preset":
      return `preset:${spec.presetId}`;
    case "countries":
      return `countries:${[...spec.codes].sort().join(",")}`;
    case "circle":
      return `circle:${spec.center.lat.toFixed(3)},${spec.center.lng.toFixed(3)},${spec.radiusKm}`;
  }
}

interface CompiledEntry {
  code: string;
  clip: BBox | null;
  parts: PolygonPart[];
  partBoxes: BBox[];
  partWeights: number[];
  areaKm2: number;
  baseWeight: number;
  attempts: number;
  hits: number;
}

function compileEntry(entry: AreaEntry, boundaries: Boundaries, explicit: boolean): CompiledEntry | null {
  const shape = boundaries.get(entry.code);
  const info = COUNTRY_BY_CODE[entry.code];
  if (!shape || !info) return null;

  const clip = entry.clip ?? DEFAULT_CLIPS[entry.code] ?? null;
  const parts: PolygonPart[] = [];
  const partBoxes: BBox[] = [];
  const partWeights: number[] = [];
  for (const part of shape.parts) {
    const box = clip ? bboxIntersection(part.bbox, clip) : part.bbox;
    if (!box) continue;
    const fullArea = bboxSphericalArea(part.bbox);
    const fraction = clip && fullArea > 0 ? Math.min(1, bboxSphericalArea(box) / fullArea) : 1;
    const area = part.areaKm2 * fraction;
    if (area <= 0) continue;
    parts.push(part);
    partBoxes.push(box);
    partWeights.push(area);
  }
  if (parts.length === 0) return null;

  const areaKm2 = partWeights.reduce((a, b) => a + b, 0);
  // מדינות בלי כיסוי ידוע נכללות רק כשנבחרו במפורש (ואז במשקל נמוך).
  const coverageWeight = info.coverage === 0 && !explicit ? 0 : COVERAGE_WEIGHT[info.coverage];
  return {
    code: entry.code,
    clip,
    parts,
    partBoxes,
    partWeights,
    areaKm2,
    // שורש השטח: מדינות גדולות מופיעות יותר, אבל לא משתלטות על המשחק.
    baseWeight: Math.sqrt(areaKm2) * coverageWeight,
    attempts: 0,
    hits: 0,
  };
}

function entryContains(e: CompiledEntry, p: LatLng): boolean {
  if (e.clip && !bboxContains(e.clip, p.lng < e.clip[0] ? p.lng + 360 : p.lng, p.lat)) return false;
  return e.parts.some((part) => partContains(part, p.lng, p.lat));
}

function searchRadiusFor(areaKm2: number): number {
  const km = Math.min(100, Math.max(1, Math.sqrt(areaKm2) * 0.04));
  return km * 1000;
}

function compileEntries(
  label: string,
  entries: AreaEntry[],
  boundaries: Boundaries,
  options: { explicit: boolean; anywhere: boolean; scaleKm?: number; bounds?: BBox },
): CompiledArea {
  let compiled = entries
    .map((e) => compileEntry(e, boundaries, options.explicit))
    .filter((e): e is CompiledEntry => e !== null);
  // אם לאף מדינה באזור אין כיסוי ידוע, ננסה בכל זאת את כולן.
  if (compiled.length > 0 && compiled.every((e) => e.baseWeight === 0)) {
    compiled = entries
      .map((e) => compileEntry(e, boundaries, true))
      .filter((e): e is CompiledEntry => e !== null);
  }
  if (compiled.length === 0) throw new Error("לא נמצאו גבולות לאזור שנבחר");

  const active = compiled.filter((e) => e.baseWeight > 0);
  const bounds = options.bounds ?? unionBBox(active.flatMap((e) => e.partBoxes)) ?? WORLD_BOUNDS;
  const scaleKm =
    options.scaleKm ?? Math.min(WORLD_SCALE_KM, Math.max(1, bboxDiagonalKm(bounds)));

  const weightOf = (e: CompiledEntry) => {
    // מדינה שלא הניבה אף מיקום אחרי כמה ניסיונות כנראה בלי כיסוי – כמעט מוציאים אותה מההגרלה.
    const penalty = e.hits === 0 && e.attempts >= 8 ? 0.05 : 1;
    return e.baseWeight * penalty;
  };

  return {
    label,
    scaleKm,
    bounds,
    sample() {
      const idx = weightedIndex(active.map(weightOf));
      if (idx < 0) return null;
      const e = active[idx];
      const partIdx = weightedIndex(e.partWeights);
      const part = e.parts[partIdx];
      const box = e.partBoxes[partIdx];
      for (let i = 0; i < 60; i++) {
        const p = randomPointInBBox(box);
        if (partContains(part, p.lng, p.lat)) {
          return { point: { lat: p.lat, lng: normalizeLng(p.lng) }, searchRadiusM: searchRadiusFor(e.areaKm2), code: e.code };
        }
      }
      return null;
    },
    contains(p) {
      if (options.anywhere) return true;
      if (compiled.some((e) => entryContains(e, p))) return true;
      // פנורמה על קו החוף שהגבולות הגסים מסמנים כים: מקבלים אותה אם היא צמודה למדינה שנבחרה
      // ולא נמצאת בתוך מדינה אחרת.
      if (countryAt(boundaries, p.lat, p.lng) !== null) return false;
      return nearbyPoints(p, 4).some((q) => compiled.some((e) => entryContains(e, q)));
    },
    report(code, found) {
      const e = compiled.find((x) => x.code === code);
      if (!e) return;
      e.attempts++;
      if (found) e.hits++;
    },
  };
}

export function compileArea(spec: AreaSpec, boundaries: Boundaries): CompiledArea {
  const label = areaLabel(spec);
  switch (spec.kind) {
    case "world":
      return compileEntries(
        label,
        COUNTRIES.map((c) => ({ code: c.code })),
        boundaries,
        { explicit: false, anywhere: true, scaleKm: WORLD_SCALE_KM, bounds: WORLD_BOUNDS },
      );
    case "preset": {
      const preset = PRESET_BY_ID[spec.presetId];
      if (!preset) throw new Error("האזור שנבחר לא קיים");
      return compileEntries(label, preset.entries, boundaries, { explicit: false, anywhere: false });
    }
    case "countries":
      if (spec.codes.length === 0) throw new Error("לא נבחרו מדינות");
      return compileEntries(
        label,
        spec.codes.map((code) => ({ code })),
        boundaries,
        { explicit: true, anywhere: false },
      );
    case "circle":
      return compileCircle(label, spec.center, spec.radiusKm);
  }
}

function compileCircle(label: string, center: LatLng, radiusKm: number): CompiledArea {
  const latDelta = (radiusKm / 6371) * (180 / Math.PI);
  const lngDelta = latDelta / Math.max(0.05, Math.cos((center.lat * Math.PI) / 180));
  const bounds: BBox = [
    center.lng - lngDelta,
    Math.max(-85, center.lat - latDelta),
    center.lng + lngDelta,
    Math.min(85, center.lat + latDelta),
  ];
  return {
    label,
    scaleKm: Math.min(WORLD_SCALE_KM, Math.max(1, 2 * Math.SQRT2 * radiusKm)),
    bounds,
    sample() {
      return {
        point: randomPointInCircle(center, radiusKm),
        searchRadiusM: Math.min(50, Math.max(0.1, radiusKm * 0.1)) * 1000,
        code: null,
      };
    },
    contains(p) {
      return haversineKm(center, p) <= radiusKm;
    },
    report() {},
  };
}
