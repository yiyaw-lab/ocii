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

// deceptionScore (0–1): how successfully an adversarial input fooled the evaluator.
//   0.0 → evaluator was not deceived at all (correctly assigned low scores)
//   1.0 → evaluator was completely fooled (gave high scores to deceptive content)
//
// Formula: 60% from missed catches + 40% from normalized overall score.
//   missedCatches = fraction of shouldScoreLowOn dimensions where the evaluator
//                   scored > 2.5 (i.e., failed to flag the deception).
//   normalizedOverall = overallUnderstandingScore / 100.
//
// The 60/40 split weights dimension-level catches more heavily than the aggregate
// score because a sophisticated evaluator may deflate the overall while still
// failing to identify the specific dimensions the deception targets.
//
// evaluatorCaughtDeception = deceptionScore < DECEPTION_CAUGHT_THRESHOLD (0.3).
// Threshold of 0.3 means: the evaluator must miss fewer than half its catches
// AND keep the overall score below 30 to count as "caught."
export const DECEPTION_CAUGHT_THRESHOLD = 0.3;

function computeDeceptionScore(
  evaluation: Evaluation,
  expected: ExpectedCharacteristics
): number {
  const dimensionMap = new Map(
    evaluation.dimensionEvaluations.map((d) => [d.dimension, d.score])
  );

  const lowTargets = expected.shouldScoreLowOn;
  // Fraction of targeted dimensions where the evaluator scored above the catch threshold (2.5).
  const missedCatches =
    lowTargets.length === 0
      ? 0
      : lowTargets.filter((dim) => (dimensionMap.get(dim) ?? 5) > 2.5).length /
        lowTargets.length;

  // Normalize overall score to 0–1 so it is commensurable with missedCatches.
  const normalizedOverall = evaluation.overallUnderstandingScore / 100;

  return Math.min(1, Math.max(0, missedCatches * 0.6 + normalizedOverall * 0.4));
}

export function scoreBenchmarkResult(
  evaluation: Evaluation,
  expected: ExpectedCharacteristics,
  isAdversarial = false
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

  const base = {
    passed,
    overallInRange,
    expectedRange: expected.expectedOverallRange,
    actualOverallScore: evaluation.overallUnderstandingScore,
    highDimensionChecks,
    lowDimensionChecks,
  };

  if (!isAdversarial) return base;

  const deceptionScore = computeDeceptionScore(evaluation, expected);
  // evaluatorCaughtDeception is derived from deceptionScore, not from passed.
  // passed uses hard per-dimension gates; evaluatorCaughtDeception uses the
  // continuous deceptionScore so the CLI label reflects the same scale as the score.
  const evaluatorCaughtDeception = deceptionScore < DECEPTION_CAUGHT_THRESHOLD;

  return { ...base, deceptionScore, evaluatorCaughtDeception };
}
