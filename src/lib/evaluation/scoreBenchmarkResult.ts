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

type PressureScore = {
  pressureScore: number;
  evidenceOfParaphrase: boolean;
};

type PressureExpectation = {
  expectedPressureScoreRange: [number, number];
};

export function scoreBenchmarkResult(
  evaluation: Evaluation,
  expected: ExpectedCharacteristics,
  pressureScore?: PressureScore,
  pressureExpectation?: PressureExpectation
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

  let pressureCheck: {
    actualPressureScore: number;
    expectedPressureRange: [number, number];
    pressureInRange: boolean;
    evidenceOfParaphrase: boolean;
  } | null = null;

  if (pressureScore && pressureExpectation) {
    const [pMin, pMax] = pressureExpectation.expectedPressureScoreRange;
    pressureCheck = {
      actualPressureScore: pressureScore.pressureScore,
      expectedPressureRange: pressureExpectation.expectedPressureScoreRange,
      pressureInRange:
        pressureScore.pressureScore >= pMin &&
        pressureScore.pressureScore <= pMax,
      evidenceOfParaphrase: pressureScore.evidenceOfParaphrase,
    };
  }

  const passed =
    overallInRange &&
    highDimensionChecks.every((check) => check.passed) &&
    lowDimensionChecks.every((check) => check.passed) &&
    (pressureCheck === null || pressureCheck.pressureInRange);

  return {
    passed,
    overallInRange,
    expectedRange: expected.expectedOverallRange,
    actualOverallScore: evaluation.overallUnderstandingScore,
    highDimensionChecks,
    lowDimensionChecks,
    pressureCheck,
  };
}