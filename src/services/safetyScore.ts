export interface SafetyFactors {
  suspiciousReports: number;
  sosReports: number;
  policeNearby: number;
  safePlacesNearby: number;
}

export function calculateSafetyScore({
  suspiciousReports,
  sosReports,
  policeNearby,
  safePlacesNearby,
}: SafetyFactors): number {
  let score = 100;

  // Negative factors
  score -= suspiciousReports * 15;
  score -= sosReports * 30;

  // Positive factors
  score += policeNearby * 8;
  score += safePlacesNearby * 5;

  // Keep score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return score;
}