import OpenAI from "openai";
import {
  EvaluationInputSchema,
  EvaluationOutputSchema,
} from "@/lib/schemas/cognition";
import { formatCompactRubricForPrompt } from "@/lib/evaluation/rubric";
import { calculateOverallScore } from "@/lib/evaluation/calculateOverallScore";
import { normalizeEvaluation } from "@/lib/evaluation/normalizeEvaluation";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function evaluateUnderstanding(input: unknown) {
  const parsed = EvaluationInputSchema.parse(input);
  const rubric = formatCompactRubricForPrompt();

  const prompt = `
You are a rigorous cognitive evaluator.

Your task is NOT to reward polished writing.
Your task is to detect evidence of genuine understanding.
Dimension scores must be decimals from 0.0 to 5.0. Use one decimal place when useful.
Evaluate only the 5 most relevant dimensions.
Return at most 2 evidence items, 2 missing nuance items, and 1 misconception per dimension.
Keep each rationale under 35 words.

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
    max_tokens: 1600,
  });

  const raw = JSON.parse(response.choices[0].message.content || "{}");

  const validated = normalizeEvaluation(EvaluationOutputSchema.parse(raw));
  
  const overallUnderstandingScore = calculateOverallScore(
    validated.dimensionEvaluations.map((dimension) => ({
      dimension: dimension.dimension,
      score: dimension.score,
    }))
  );
  
  return {
    ...validated,
    overallUnderstandingScore,
  };
}