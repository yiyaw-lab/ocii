type ExpectedCharacteristics = {
  shouldScoreHighOn: string[];
  shouldScoreLowOn: string[];
  expectedOverallRange: number[];
};

type Evaluation = {
  overallUnderstandingScore: number;
  dimensionEvaluations: {
    dimension: string;
    score: number;
  }[];
};

export function scoreBenchmarkResult(
  evaluation: Evaluation,
  expected: ExpectedCharacteristics
) {
  const [min, max] = expected.expectedOverallRange;

  const overallInRange =
    evaluation.overallUnderstandingScore >= min &&
    evaluation.overallUnderstandingScore <= max;

  const dimensionMap = new Map(
    evaluation.dimensionEvaluations.map((dimension) => [
      dimension.dimension,
      dimension.score,
    ])
  );

  const highDimensionChecks =
    expected.shouldScoreHighOn.map((dimension) => ({
      dimension,
      score: dimensionMap.get(dimension),
      passed: (dimensionMap.get(dimension) ?? 0) >= 3.5,
    }));

  const lowDimensionChecks =
    expected.shouldScoreLowOn.map((dimension) => ({
      dimension,
      score: dimensionMap.get(dimension),
      passed: (dimensionMap.get(dimension) ?? 5) <= 2.5,
    }));

  const passed =
    overallInRange &&
    highDimensionChecks.every((check) => check.passed) &&
    lowDimensionChecks.every((check) => check.passed);

  return {
    passed,
    overallInRange,
    expectedRange: expected.expectedOverallRange,
    actualOverallScore: evaluation.overallUnderstandingScore,
    highDimensionChecks,
    lowDimensionChecks,
  };
}