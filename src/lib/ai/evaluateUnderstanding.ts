import OpenAI from "openai";
import {
  EvaluationInputSchema,
  EvaluationOutputSchema,
} from "@/lib/schemas/cognition";
import { formatRubricForPrompt } from "@/lib/evaluation/rubric";
import { calculateOverallScore } from "@/lib/evaluation/calculateOverallScore";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function evaluateUnderstanding(input: unknown) {
  const parsed = EvaluationInputSchema.parse(input);
  const rubric = formatRubricForPrompt();

  const prompt = `
You are a rigorous cognitive evaluator.

Your task is NOT to reward polished writing.
Your task is to detect evidence of genuine understanding.
Dimension scores must be decimals from 0.0 to 5.0. Use one decimal place when useful.

Evaluate the learner using the following cognitive rubric:

${rubric}

CONCEPT:
${parsed.concept}

SOURCE MATERIAL:
${parsed.sourceText}

USER EXPLANATION:
${parsed.userExplanation}

USER CONFIDENCE:
${parsed.confidence}/5

Return ONLY valid JSON.

Required structure:

{
  "relatedConcepts": string[],

  "dimensionEvaluations": [
    {
      "dimension": string,
      "score": number,
      "evaluatorConfidence": "low" | "medium" | "high",
      "evidence": string[],
      "misconceptions": string[],
      "missingNuance": string[],
      "rationale": string,
      "nextTestPrompt": string
    }
  ],

  "summary": {
    "strongestDimension": string,
    "weakestDimension": string,
    "calibrationAssessment": string,
    "overallFeedback": string,
    "nextLearningStep": string
  }
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 2500,
  });

  const raw = JSON.parse(response.choices[0].message.content || "{}");

  const validated = EvaluationOutputSchema.parse(raw);
  
  const overallUnderstandingScore = calculateOverallScore(
    validated.dimensionEvaluations.map((dimension) => dimension.score)
  );
  
  return {
    ...validated,
    overallUnderstandingScore,
  };
}