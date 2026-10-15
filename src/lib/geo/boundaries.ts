import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { MultiPolygon, Polygon } from "geojson";
import { BOUNDARY_NAME_ALIASES, COUNTRY_BY_NUMERIC } from "./countries";
import { makePart, partContains, type PolygonPart, type Ring } from "./geometry";

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
