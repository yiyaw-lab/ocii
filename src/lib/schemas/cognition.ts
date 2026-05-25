import { z } from "zod";

export const EvaluationInputSchema = z.object({
  concept: z.string().min(2),
  sourceText: z.string().min(10),
  userExplanation: z.string().min(10),
  confidence: z.number().min(1).max(5),
  evaluationMode: z.enum(["quick", "full", "ensemble"]).default("quick"),
});

export const DimensionEvaluationSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(5),
  evaluatorConfidence: z.enum(["low", "medium", "high"]),
  evidence: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  missingNuance: z.array(z.string()).default([]),
  rationale: z.string(),
  nextTestPrompt: z.string(),
});

export const EnsembleMetaSchema = z.object({
  evaluatorVariance: z.number(),
  lowConsensusDimensions: z.array(z.string()),
  evaluatorAgreementScore: z.number().min(0).max(1),
});

export type EnsembleMeta = z.infer<typeof EnsembleMetaSchema>;

export const EvaluationOutputSchema = z.object({
  relatedConcepts: z.array(z.string()).default([]),

  dimensionEvaluations: z.array(DimensionEvaluationSchema).min(1),

  summary: z.object({
    strongestDimension: z.string(),
    weakestDimension: z.string(),
    calibrationAssessment: z.string(),
    overallFeedback: z.string(),
    nextLearningStep: z.string(),
  }),
});