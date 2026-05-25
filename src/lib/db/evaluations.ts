import { supabaseAdmin } from "@/lib/supabase/admin";

type SaveEvaluationInput = {
  concept: string;
  sourceText: string;
  userExplanation: string;
  confidence: number;

  result: {
    overallUnderstandingScore: number;

    relatedConcepts: string[];

    dimensionEvaluations: {
      dimension: string;
      score: number;
      evaluatorConfidence: string;
      evidence: string[];
      misconceptions: string[];
      missingNuance: string[];
      rationale: string;
      nextTestPrompt: string;
    }[];

    summary: {
      strongestDimension: string;
      weakestDimension: string;
      calibrationAssessment: string;
      overallFeedback: string;
      nextLearningStep: string;
    };
  };
};

export async function saveEvaluation(
  input: SaveEvaluationInput
) {
  const { data, error } = await supabaseAdmin
    .from("evaluations")
    .insert({
      concept: input.concept,

      source_text: input.sourceText,

      user_explanation:
        input.userExplanation,

      confidence: input.confidence,

      overall_understanding_score:
        input.result.overallUnderstandingScore,

      dimension_evaluations:
        input.result.dimensionEvaluations,

      summary:
        input.result.summary,

      related_concepts:
        input.result.relatedConcepts,
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
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}