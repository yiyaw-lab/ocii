import OpenAI from "openai";
import { z } from "zod";
import {
  EvaluationInputSchema,
  EvaluationOutputSchema,
} from "@/lib/schemas/cognition";
import {
  formatCompactRubricForPrompt,
  formatQuickRubricForPrompt,
  QUICK_DIMENSIONS,
} from "@/lib/evaluation/rubric";
import { calculateOverallScore } from "@/lib/evaluation/calculateOverallScore";
import { normalizeEvaluation } from "@/lib/evaluation/normalizeEvaluation";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type EvaluationInput = z.infer<typeof EvaluationInputSchema>;

export async function evaluateUnderstanding(input: EvaluationInput) {
  const isQuick = input.evaluationMode === "quick";
  const rubric = isQuick
    ? formatQuickRubricForPrompt()
    : formatCompactRubricForPrompt();

  const prompt = isQuick
    ? buildQuickPrompt(input, rubric)
    : buildFullPrompt(input, rubric);

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: isQuick ? 700 : 1900,
  });

  const raw = JSON.parse(response.choices[0].message.content || "{}");
  const validated = normalizeEvaluation(EvaluationOutputSchema.parse(raw));

  const overallUnderstandingScore = calculateOverallScore(
    validated.dimensionEvaluations.map((d) => ({
      dimension: d.dimension,
      score: d.score,
    }))
  );

  return { ...validated, overallUnderstandingScore, evaluationMode: input.evaluationMode };
}

function buildQuickPrompt(input: EvaluationInput, rubric: string) {
  const dims = QUICK_DIMENSIONS.join(", ");
  return `You are a rigorous cognitive evaluator.

Evaluate ONLY these 3 dimensions: ${dims}.
Score each 0.0–5.0 (one decimal).
Per dimension return: 1 evidence item, empty arrays for misconceptions and missingNuance, rationale under 15 words, nextTestPrompt as empty string "".
Return at most 2 relatedConcepts.

Rubric:
${rubric}

CONCEPT: ${input.concept}
SOURCE MATERIAL: ${input.sourceText}
USER EXPLANATION: ${input.userExplanation}
USER CONFIDENCE: ${input.confidence}/5

Return ONLY valid JSON:
{
  "relatedConcepts": string[],
  "dimensionEvaluations": [
    {
      "dimension": string,
      "score": number,
      "evaluatorConfidence": "low" | "medium" | "high",
      "evidence": string[],
      "misconceptions": [],
      "missingNuance": [],
      "rationale": string,
      "nextTestPrompt": ""
    }
  ],
  "summary": {
    "strongestDimension": string,
    "weakestDimension": string,
    "calibrationAssessment": string,
    "overallFeedback": string,
    "nextLearningStep": string
  }
}`;
}

function buildFullPrompt(input: EvaluationInput, rubric: string) {
  return `You are a rigorous cognitive evaluator.

Your task is NOT to reward polished writing.
Your task is to detect evidence of genuine understanding.
Dimension scores must be decimals from 0.0 to 5.0. Use one decimal place when useful.
Evaluate only the 5 most relevant dimensions.
Return at most 2 evidence items, 2 missing nuance items, and 1 misconception per dimension.
Keep each rationale under 35 words.

Evaluate the learner using the following cognitive rubric:

${rubric}

CONCEPT:
${input.concept}

SOURCE MATERIAL:
${input.sourceText}

USER EXPLANATION:
${input.userExplanation}

USER CONFIDENCE:
${input.confidence}/5

After evaluation, generate one abstraction pressure test that would expose whether the learner genuinely understands the concept or merely paraphrased it. The challenge must require one of: analogy (from a different domain), transfer (novel application), compression (essential structure in one sentence), or reframing (explain to a skeptic or child).
The challenge must be impossible to answer by restating the definition.
Set pressureType to the challenge type used.
Include 1–2 requiredElements the response must contain to pass.

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
  },

  "abstractionPressureTest": {
    "challenge": string,
    "pressureType": "analogy" | "transfer" | "compression" | "reframing",
    "requiredElements": string[]
  }
}`;
}
