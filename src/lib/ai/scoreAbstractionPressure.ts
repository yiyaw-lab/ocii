import OpenAI from "openai";
import { z } from "zod";
import {
  AbstractionPressureInputSchema,
  AbstractionPressureScoreSchema,
} from "@/lib/schemas/cognition";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type PressureInput = z.infer<typeof AbstractionPressureInputSchema>;
type PressureScore = z.infer<typeof AbstractionPressureScoreSchema>;

export async function scoreAbstractionPressure(
  input: PressureInput
): Promise<PressureScore> {
  const parsed = AbstractionPressureInputSchema.parse(input);

  const prompt = buildPressurePrompt(parsed);

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 400,
  });

  const raw = JSON.parse(response.choices[0].message.content || "{}");
  return AbstractionPressureScoreSchema.parse(raw);
}

function buildPressurePrompt(input: PressureInput): string {
  const { concept, challenge, pressureType, response } = input;
  return `You are a rigorous cognitive evaluator specializing in detecting surface paraphrase vs. genuine abstraction.

CONCEPT: ${concept}
PRESSURE TYPE: ${pressureType}
CHALLENGE GIVEN TO LEARNER: ${challenge}
LEARNER RESPONSE: ${response}

Your task: evaluate whether the learner's response genuinely fulfills the challenge or merely rephrases the original definition.

Specifically detect:
- Paraphrase inflation: restating the definition instead of meeting the challenge
- Borrowed abstraction: using sophisticated-sounding words (mental model, emergent, fundamental tension) without substance
- Challenge evasion: ignoring the required ${pressureType} and defaulting to description

Score the response 0.0–5.0 on how well it meets the ${pressureType} challenge specifically:
  5: Fully meets the challenge with novel, apt content
  4: Mostly meets it with minor gaps
  3: Partially meets it; some genuine ${pressureType} attempt
  2: Minimal ${pressureType}; mostly paraphrase or evasion
  1: Ignores the challenge; restates definition
  0: No meaningful response

Return ONLY valid JSON:
{
  "score": number,
  "pressureScore": number (score / 5 * 100, rounded to integer),
  "evidenceOfParaphrase": boolean,
  "evidenceOfTransfer": boolean,
  "rationale": string (under 30 words)
}`;
}
