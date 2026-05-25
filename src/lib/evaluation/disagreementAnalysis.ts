import { z } from "zod";
import { EvaluationOutputSchema } from "@/lib/schemas/cognition";
import { calculateScoreVariance } from "@/lib/evaluation/evaluationConsistency";

type EvaluationResult = z.infer<typeof EvaluationOutputSchema> & {
  overallUnderstandingScore: number;
};

// Variance above this threshold marks a dimension as low-consensus.
// On a 0–5 score scale, variance of 0.5 ≈ ±0.7 std dev — meaningful disagreement.
const LOW_CONSENSUS_THRESHOLD = 0.5;

// Theoretical max variance on a 0–5 scale (all evaluators at opposite extremes).
const MAX_POSSIBLE_VARIANCE = 6.25;

export type DisagreementAnalysis = {
  evaluatorVariance: number;
  lowConsensusDimensions: string[];
  evaluatorAgreementScore: number;
  dimensionVariances: Record<string, number>;
};

export function analyzeDisagreement(
  evaluations: EvaluationResult[]
): DisagreementAnalysis {
  if (evaluations.length === 0) {
    return {
      evaluatorVariance: 0,
      lowConsensusDimensions: [],
      evaluatorAgreementScore: 1,
      dimensionVariances: {},
    };
  }

  const allDimensions = new Set<string>(
    evaluations.flatMap((e) => e.dimensionEvaluations.map((d) => d.dimension))
  );

  const dimensionVariances: Record<string, number> = {};

  for (const dimension of allDimensions) {
    const scores = evaluations
      .map((e) => e.dimensionEvaluations.find((d) => d.dimension === dimension)?.score)
      .filter((s): s is number => s !== undefined);

    dimensionVariances[dimension] = round3(calculateScoreVariance(scores));
  }

  const variances = Object.values(dimensionVariances);
  const evaluatorVariance =
    variances.length > 0
      ? round3(variances.reduce((a, b) => a + b, 0) / variances.length)
      : 0;

  const lowConsensusDimensions = Object.entries(dimensionVariances)
    .filter(([, v]) => v > LOW_CONSENSUS_THRESHOLD)
    .sort(([, a], [, b]) => b - a)
    .map(([dim]) => dim);

  const evaluatorAgreementScore = round3(
    Math.max(0, 1 - evaluatorVariance / MAX_POSSIBLE_VARIANCE)
  );

  return {
    evaluatorVariance,
    lowConsensusDimensions,
    evaluatorAgreementScore,
    dimensionVariances,
  };
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
