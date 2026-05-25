import { evaluateUnderstanding } from "@/lib/ai/evaluateUnderstanding";

export async function runEvaluation(input: unknown) {
  const result = await evaluateUnderstanding(input);

  return result;
}