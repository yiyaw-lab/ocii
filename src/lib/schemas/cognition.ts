import { z } from "zod";

export const EvaluationInputSchema = z.object({
  concept: z.string().min(2),
  sourceText: z.string().min(10),
  userExplanation: z.string().min(10),
  confidence: z.number().min(1).max(5),
});

export const EvaluationOutputSchema = z.object({
  understandingScore: z.number().min(0).max(100),
  retrievalQuality: z.number().min(0).max(100),
  reasoningClarity: z.number().min(0).max(100),
  transferReadiness: z.number().min(0).max(100),
  calibrationGap: z.string(),
  feedback: z.string(),
  nextPrompt: z.string(),
});