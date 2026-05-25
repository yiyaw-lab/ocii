export function calculateScoreVariance(
    scores: number[]
  ) {
    if (scores.length === 0) return 0;
  
    const mean =
      scores.reduce((a, b) => a + b, 0) /
      scores.length;
  
    const variance =
      scores.reduce(
        (sum, score) =>
          sum + Math.pow(score - mean, 2),
        0
      ) / scores.length;
  
    return variance;
  }