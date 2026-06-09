import { NextResponse } from "next/server";
import { runEvaluation } from "@/lib/evaluation/runEvaluation";
import { saveEvaluation } from "@/lib/db/evaluations";
import { EvaluationInputSchema } from "@/lib/schemas/cognition";
import { detectAdversarialRisk } from "@/lib/evaluation/adversarialDetection";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = EvaluationInputSchema.parse(body);

    const result = await runEvaluation(parsed);

    const adversarialDetection = detectAdversarialRisk(
      {
        concept: parsed.concept,
        sourceText: parsed.sourceText,
        userExplanation: parsed.userExplanation,
        confidence: parsed.confidence,
      },
      result
    );

    const saved = await saveEvaluation({
      concept: parsed.concept,
      sourceText: parsed.sourceText,
      userExplanation: parsed.userExplanation,
      confidence: parsed.confidence,
      result,
    });

    return NextResponse.json({
      evaluation: { ...result, adversarialDetection },
      saved,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Evaluation failed", details: String(error) },
      { status: 500 }
    );
  }
}