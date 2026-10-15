import type { BBox } from "./regions";

export interface LatLng {
  lat: number;
  lng: number;
}

export type Ring = [number, number][]; // [lng, lat]

export interface PolygonPart {
  rings: Ring[]; // הטבעת הראשונה היא החיצונית, השאר חורים
  bbox: BBox;
  areaKm2: number;
}

const EARTH_RADIUS_KM = 6371.0088;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// נקודה במרחק ובכיוון נתונים מנקודת מוצא (על פני כדור).
export function destination(origin: LatLng, distanceKm: number, bearingDeg: number): LatLng {
  const delta = distanceKm / EARTH_RADIUS_KM;
  const theta = toRad(bearingDeg);
  const phi1 = toRad(origin.lat);
  const lambda1 = toRad(origin.lng);
  const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
  const lambda2 =
    lambda1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(phi1), Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));
  return { lat: toDeg(phi2), lng: ((toDeg(lambda2) + 540) % 360) - 180 };
}

// שטח טבעת על פני כדור (קמ"ר).
function ringAreaKm2(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];
    sum += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((sum * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

// פוליגון שחוצה את קו התאריך (רוסיה, פיג'י) מגיע עם קפיצה מ-180 ל-180-.
// "פורשים" אותו לטווח רציף (קו אורך עד 360), אחרת הצלע הקופצת חוצה את כל המפה ובדיקת ההכלה משתבשת.
function unwrapRings(rings: Ring[]): Ring[] {
  const outer = rings[0];
  const crosses = outer.some(([lng], i) => i > 0 && Math.abs(lng - outer[i - 1][0]) > 180);
  if (!crosses) return rings;
  return rings.map((ring) => ring.map(([lng, lat]) => [lng < 0 ? lng + 360 : lng, lat] as [number, number]));
}

export const normalizeLng = (lng: number) => (lng > 180 ? lng - 360 : lng);

export function makePart(sourceRings: Ring[]): PolygonPart {
  const rings = unwrapRings(sourceRings);
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of rings[0]) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const outer = ringAreaKm2(rings[0]);
  const holes = rings.slice(1).reduce((sum, r) => sum + ringAreaKm2(r), 0);
  return { rings, bbox: [minLng, minLat, maxLng, maxLat], areaKm2: Math.max(0, outer - holes) };
}

export function bboxContains(b: BBox, lng: number, lat: number): boolean {
  return lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3];
}

export function bboxIntersection(a: BBox, b: BBox): BBox | null {
  const r: BBox = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
  return r[0] < r[2] && r[1] < r[3] ? r : null;
}

// שטח מלבן גיאוגרפי ביחידות יחסיות (מספיק להשוואה בין מלבנים).
export function bboxSphericalArea(b: BBox): number {
  return toRad(b[2] - b[0]) * (Math.sin(toRad(b[3])) - Math.sin(toRad(b[1])));
}

function ringContains(ring: Ring, lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function partContains(part: PolygonPart, lng: number, lat: number): boolean {
  if (part.bbox[2] > 180 && lng < 0) lng += 360; // חלק "פרוש" מעבר לקו התאריך
  if (!bboxContains(part.bbox, lng, lat)) return false;
  if (!ringContains(part.rings[0], lng, lat)) return false;
  for (let i = 1; i < part.rings.length; i++) {
    if (ringContains(part.rings[i], lng, lat)) return false;
  }
  return true;
}

// נקודה אקראית בתוך מלבן, בהתפלגות אחידה לפי שטח על פני הכדור.
export function randomPointInBBox(b: BBox): LatLng {
  const lng = b[0] + Math.random() * (b[2] - b[0]);
  const s1 = Math.sin(toRad(b[1]));
  const s2 = Math.sin(toRad(b[3]));
  const lat = toDeg(Math.asin(s1 + Math.random() * (s2 - s1)));
  return { lat, lng };
}

// נקודה אקראית בתוך עיגול, בהתפלגות אחידה לפי שטח.
export function randomPointInCircle(center: LatLng, radiusKm: number): LatLng {
  return destination(center, radiusKm * Math.sqrt(Math.random()), Math.random() * 360);
}

// מלבן חוסם לאוסף מלבנים, עם טיפול בקו התאריך: אם המלבן "הקצר" חוצה את קו 180,
// מוחזר מלבן שבו west > east (כמו ב-LatLngBounds של גוגל).
export function unionBBox(boxes: BBox[]): BBox | null {
  if (boxes.length === 0) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minA = Infinity;
  let maxA = -Infinity;
  let minB = Infinity;
  let maxB = -Infinity;
  const shift = (lng: number) => (lng < 0 ? lng + 360 : lng);
  for (const [w, s, e, n] of boxes) {
    minLat = Math.min(minLat, s);
    maxLat = Math.max(maxLat, n);
    minA = Math.min(minA, w);
    maxA = Math.max(maxA, e);
    minB = Math.min(minB, shift(w), shift(e));
    maxB = Math.max(maxB, shift(w), shift(e));
  }
  if (maxB - minB < maxA - minA) return [normalizeLng(minB), minLat, normalizeLng(maxB), maxLat];
  return [normalizeLng(minA), minLat, normalizeLng(maxA), maxLat];
}

export function bboxDiagonalKm(b: BBox): number {
  return haversineKm({ lat: b[1], lng: b[0] }, { lat: b[3], lng: b[2] });
}

export function weightedIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return -1;
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
