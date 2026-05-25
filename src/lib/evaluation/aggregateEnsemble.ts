import { z } from "zod";
import {
  DimensionEvaluationSchema,
  EvaluationOutputSchema,
} from "@/lib/schemas/cognition";
import { calculateOverallScore } from "@/lib/evaluation/calculateOverallScore";

type EvaluationResult = z.infer<typeof EvaluationOutputSchema> & {
  overallUnderstandingScore: number;
};
type DimensionEvaluation = z.infer<typeof DimensionEvaluationSchema>;

const CONFIDENCE_RANK: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function aggregateEnsemble(evaluations: EvaluationResult[]): EvaluationResult {
  if (evaluations.length === 0) throw new Error("Cannot aggregate empty evaluations");

  const allDimensions = new Set<string>(
    evaluations.flatMap((e) => e.dimensionEvaluations.map((d) => d.dimension))
  );

  const dimensionEvaluations: DimensionEvaluation[] = [];

  for (const dimensionName of allDimensions) {
    const candidates = evaluations
      .map((e) => e.dimensionEvaluations.find((d) => d.dimension === dimensionName))
      .filter((d): d is DimensionEvaluation => d !== undefined);

    if (candidates.length === 0) continue;

    const avgScore =
      Math.round(
        (candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length) * 10
      ) / 10;

    // Pick evidence + rationale from the evaluator with the highest declared confidence.
    const anchor = candidates.reduce((best, current) =>
      (CONFIDENCE_RANK[current.evaluatorConfidence] ?? 0) >
      (CONFIDENCE_RANK[best.evaluatorConfidence] ?? 0)
        ? current
        : best
    );

    const avgRank =
      candidates.reduce(
        (sum, c) => sum + (CONFIDENCE_RANK[c.evaluatorConfidence] ?? 0),
        0
      ) / candidates.length;
    const aggregateConfidence: "low" | "medium" | "high" =
      avgRank >= 2.5 ? "high" : avgRank >= 1.5 ? "medium" : "low";

    dimensionEvaluations.push({
      dimension: dimensionName,
      score: avgScore,
      evaluatorConfidence: aggregateConfidence,
      evidence: anchor.evidence,
      misconceptions: anchor.misconceptions,
      missingNuance: anchor.missingNuance,
      rationale: anchor.rationale,
      nextTestPrompt: anchor.nextTestPrompt,
    });
  }

  // Use the evaluator closest to the median score as the summary anchor.
  const scores = evaluations.map((e) => e.overallUnderstandingScore).sort((a, b) => a - b);
  const medianScore = scores[Math.floor(scores.length / 2)];
  const summaryAnchor = evaluations.reduce((closest, current) =>
    Math.abs(current.overallUnderstandingScore - medianScore) <
    Math.abs(closest.overallUnderstandingScore - medianScore)
      ? current
      : closest
  );

  // Deduplicated union of all evaluators' related concepts.
  const relatedConcepts = [
    ...new Set(evaluations.flatMap((e) => e.relatedConcepts)),
  ];

  const overallUnderstandingScore = calculateOverallScore(
    dimensionEvaluations.map((d) => ({ dimension: d.dimension, score: d.score }))
  );

  return {
    relatedConcepts,
    dimensionEvaluations,
    summary: summaryAnchor.summary,
    overallUnderstandingScore,
  };
}
