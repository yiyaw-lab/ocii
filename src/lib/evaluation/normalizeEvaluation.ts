import { z } from "zod";
import { EvaluationOutputSchema } from "@/lib/schemas/cognition";

type EvaluationResult = z.infer<typeof EvaluationOutputSchema>;

function cleanText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\bgrasph\b/gi, "grasp")
    .trim();
}

function cleanList(items: string[]) {
  return items.map(cleanText).filter(Boolean);
}

export function normalizeEvaluation(result: EvaluationResult): EvaluationResult {
  return {
    relatedConcepts: cleanList(result.relatedConcepts),

    dimensionEvaluations: result.dimensionEvaluations.map((dimension) => ({
      ...dimension,
      evidence: cleanList(dimension.evidence),
      misconceptions: cleanList(dimension.misconceptions),
      missingNuance: cleanList(dimension.missingNuance),
      rationale: cleanText(dimension.rationale),
      nextTestPrompt: cleanText(dimension.nextTestPrompt),
    })),

    summary: {
      strongestDimension: cleanText(result.summary.strongestDimension),
      weakestDimension: cleanText(result.summary.weakestDimension),
      calibrationAssessment: cleanText(result.summary.calibrationAssessment),
      overallFeedback: cleanText(result.summary.overallFeedback),
      nextLearningStep: cleanText(result.summary.nextLearningStep),
    },
  };
}
