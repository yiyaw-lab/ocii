import { z } from "zod";
import { EvaluationInputSchema } from "@/lib/schemas/cognition";
import { evaluateUnderstanding } from "@/lib/ai/evaluateUnderstanding";
import { analyzeDisagreement } from "@/lib/evaluation/disagreementAnalysis";
import { aggregateEnsemble } from "@/lib/evaluation/aggregateEnsemble";

type EvaluationInput = z.infer<typeof EvaluationInputSchema>;

// Three members with varied temperatures to induce scoring diversity.
const ENSEMBLE_TEMPERATURES = [0.5, 0.6, 0.7] as const;

export async function runEnsembleEvaluation(input: EvaluationInput) {
  // Each ensemble member runs as a quick evaluation so latency stays bounded.
  const memberInput: EvaluationInput = { ...input, evaluationMode: "quick" };

  const evaluations = await Promise.all(
    ENSEMBLE_TEMPERATURES.map((temperature) =>
      evaluateUnderstanding(memberInput, { temperature })
    )
  );

  const disagreement = analyzeDisagreement(evaluations);
  const consensus = aggregateEnsemble(evaluations);

  return {
    ...consensus,
    evaluationMode: "ensemble" as const,
    evaluatorVariance: disagreement.evaluatorVariance,
    lowConsensusDimensions: disagreement.lowConsensusDimensions,
    evaluatorAgreementScore: disagreement.evaluatorAgreementScore,
  };
}
