import OpenAI from "openai";
import { EvaluationInputSchema } from "@/lib/schemas/cognition";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function evaluateUnderstanding(input: unknown) {
  const parsed = EvaluationInputSchema.parse(input);

  const prompt = `
You are evaluating genuine human understanding.

Concept:
${parsed.concept}

Source material:
${parsed.sourceText}

User explanation:
${parsed.userExplanation}

User confidence: ${parsed.confidence}/5

Evaluate whether the user truly understands the concept, not whether the explanation sounds polished.

Return JSON only with:
{
  "understandingScore": number 0-100,
  "retrievalQuality": number 0-100,
  "reasoningClarity": number 0-100,
  "transferReadiness": number 0-100,
  "calibrationGap": string,
  "feedback": string,
  "nextPrompt": string
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}