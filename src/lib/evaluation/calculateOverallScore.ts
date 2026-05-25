const MAX_DIMENSION_SCORE = 5;

export function calculateOverallScore(
  dimensionScores: number[]
) {
  if (dimensionScores.length === 0) {
    return 0;
  }

  const average =
    dimensionScores.reduce(
      (sum, score) => sum + score,
      0
    ) / dimensionScores.length;

  return Math.round(
    (average / MAX_DIMENSION_SCORE) * 100
  );
}