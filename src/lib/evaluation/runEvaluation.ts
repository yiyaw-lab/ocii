import { EvaluationInputSchema } from "@/lib/schemas/cognition";
import { evaluateUnderstanding } from "@/lib/ai/evaluateUnderstanding";

export async function runEvaluation(input: unknown) {
  const parsed = EvaluationInputSchema.parse(input);
  return evaluateUnderstanding(parsed);
}
