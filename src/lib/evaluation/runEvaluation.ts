import { EvaluationInputSchema } from "@/lib/schemas/cognition";
import { evaluateUnderstanding } from "@/lib/ai/evaluateUnderstanding";
import { runEnsembleEvaluation } from "@/lib/evaluation/ensembleEvaluation";

export async function runEvaluation(input: unknown) {
  const parsed = EvaluationInputSchema.parse(input);

  if (parsed.evaluationMode === "ensemble") {
    return runEnsembleEvaluation(parsed);
  }

  return evaluateUnderstanding(parsed);
}
