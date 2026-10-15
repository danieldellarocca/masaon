export const MAX_ROUND_SCORE = 5000;

// הנוסחה של GeoGuessr: 5000·e^(-10·d/D), כאשר D הוא אלכסון המפה.
// במפת העולם (D≈14,917 ק״מ) זה יוצא 5000·e^(-d/1492.7).
export function scoreForDistance(distanceKm: number, scaleKm: number): number {
  if (distanceKm <= 0.025) return MAX_ROUND_SCORE;
  return Math.round(MAX_ROUND_SCORE * Math.exp((-10 * distanceKm) / scaleKm));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000).toLocaleString("he-IL")} מ׳`;
  if (km < 10) return `${km.toFixed(1)} ק״מ`;
  return `${Math.round(km).toLocaleString("he-IL")} ק״מ`;
}

export function formatScore(score: number): string {
  return score.toLocaleString("he-IL");
}
