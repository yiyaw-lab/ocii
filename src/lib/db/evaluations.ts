import { supabaseAdmin } from "@/lib/supabase/admin";

type SaveEvaluationInput = {
  concept: string;
  sourceText: string;
  userExplanation: string;
  confidence: number;
  result: {
    understandingScore: number;
    retrievalQuality: number;
    reasoningClarity: number;
    transferReadiness: number;
    calibrationGap: string;
    feedback: string;
    nextPrompt: string;
  };
};

export async function saveEvaluation(input: SaveEvaluationInput) {
  const { data, error } = await supabaseAdmin
    .from("evaluations")
    .insert({
      concept: input.concept,
      source_text: input.sourceText,
      user_explanation: input.userExplanation,
      confidence: input.confidence,

      understanding_score: input.result.understandingScore,
      retrieval_quality: input.result.retrievalQuality,
      reasoning_clarity: input.result.reasoningClarity,
      transfer_readiness: input.result.transferReadiness,

      calibration_gap: input.result.calibrationGap,
      feedback: input.result.feedback,
      next_prompt: input.result.nextPrompt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEvaluations() {
  const { data, error } = await supabaseAdmin
    .from("evaluations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}