type DimensionScore = {
    dimension: string;
    score: number;
  };
  
  const DEFAULT_WEIGHT = 1;
  
  const DIMENSION_WEIGHTS: Record<string, number> = {
    conceptual_accuracy: 1.4,
    mechanistic_reasoning: 1.2,
    abstraction_compression: 1.1,
    retrieval_robustness: 1.1,
    transfer_capability: 0.9,
    metacognitive_calibration: 0.8,
    epistemic_awareness: 0.7,
  };
  
  export function calculateOverallScore(dimensions: DimensionScore[]) {
    if (dimensions.length === 0) return 0;
  
    const weighted = dimensions.reduce(
      (acc, dimension) => {
        const weight =
          DIMENSION_WEIGHTS[dimension.dimension] ?? DEFAULT_WEIGHT;
  
        return {
          weightedScore:
            acc.weightedScore + dimension.score * weight,
          totalWeight:
            acc.totalWeight + weight,
        };
      },
      { weightedScore: 0, totalWeight: 0 }
    );
  
    const average = weighted.weightedScore / weighted.totalWeight;
  
    return Math.round((average / 5) * 100);
  }