// Adversarial risk detection — a second-stage detector that runs on top of the
// normal evaluation output to identify whether a high score may reflect surface
// fluency rather than genuine understanding.
//
// IMPORTANT: adversarial risk scores are entirely separate from
// overallUnderstandingScore. They do NOT modify the understanding score in any
// way. They produce a risk profile meant to be surfaced alongside the evaluation
// receipt for human review or follow-up prompting.
//
// Architecture: deterministic heuristics run first and always. An optional async
// LLM-assisted refinement is available via detectAdversarialRiskWithLLM for the
// causal inversion signal, which is the hardest to detect from structure alone.

// --- Input / output types ---

export type DimensionForDetection = {
  dimension: string;
  score: number;
  evaluatorConfidence: "low" | "medium" | "high";
  evidence: string[];
};

export type EvaluationForDetection = {
  overallUnderstandingScore: number;
  dimensionEvaluations: DimensionForDetection[];
};

export type InputForDetection = {
  concept: string;
  sourceText: string;
  userExplanation: string;
  confidence: number;
};

export type AdversarialDetectionResult = {
  // Individual risk scores (0–1). Higher = more likely that the evaluator was
  // deceived by the corresponding pattern. None of these alter the understanding score.
  fluencyRiskScore: number;
  paraphraseRiskScore: number;
  hallucinationRiskScore: number;
  transferBluffRiskScore: number;
  vagueJargonRiskScore: number;
  causalInversionRiskScore: number;
  // Weighted composite of the six subscores. Does not modify overallUnderstandingScore.
  overallAdversarialRiskScore: number;
  // Human-readable descriptions of triggered heuristic rules.
  riskFlags: string[];
  // Suggested follow-up question targeting the highest-confidence risk signal.
  recommendedPressureTest: string;
};

// --- Internal constants ---

// Common English words excluded from lexical overlap analysis.
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "shall", "not", "no", "its", "it", "that", "this",
  "these", "those", "which", "who", "what", "when", "where", "how", "why",
  "more", "most", "some", "any", "all", "each", "such", "than", "then", "so",
  "if", "about", "up", "out", "into", "over", "through", "i", "we", "they",
  "them", "their", "our", "you", "your", "can", "also", "just", "very",
]);

// Words that sound academic but are frequently deployed in content-free
// explanations. Presence alone is not disqualifying; high density without
// causal content is the trigger.
const VAGUE_JARGON_TERMS = [
  "epistemic", "ontological", "phenomenological", "recursive", "substrate",
  "modalities", "modality", "paradigm", "scaffold", "scaffolding",
  "constitutes", "instantiate", "instantiating", "instantiated", "reflexive",
  "meta-level", "metalevel", "higher-order", "foundational", "representational",
  "epistemic states", "epistemic structures", "regulatory coherence",
  "emergent", "phenomenological constraints", "experiential awareness",
  "cognitive architecture", "self-referential",
];

// Patterns that signal confident, specific empirical claims. Risk is elevated
// when these appear alongside a low mechanistic reasoning score.
const CONFIDENT_CLAIM_PATTERNS: RegExp[] = [
  /\b\d+\s*(studies|experiments?|replications?|trials?|participants?)\b/i,
  /\bcoefficient\s+(of\s+)?[\d.]+\b/i,
  /\b[\d.]+\s*%\b/,
  /\b(theorem|lemma|axiom|law)\s+of\b/i,
  /\b(proven|demonstrated|established)\s+(that|to|by)\b/i,
  /\b(pathway|pathways)\b/i,
  /\b(GABAergic|dopaminergic|serotonergic|hippocampal|prefrontal|amygdala)\b/i,
  /\b[A-Z][a-z]+\s+(and|&)\s+[A-Z][a-z]+\s*\(\d{4}\)/,   // Author and Author (year)
  /\b[A-Z][a-z]+-[A-Z][a-z]+\s+(theorem|effect|model|law)\b/i,
];

// Causal connectors that indicate genuine mechanistic reasoning.
const CAUSAL_CONNECTORS = [
  "because", "therefore", "leads to", "causes", "results in", "due to",
  "which means", "this means", "consequently", "as a result", "hence",
  "thus", "so that", "the reason", "mechanism", "drives", "triggers",
  "produces", "forces", "enables", "prevents",
];

// Sequential/temporal framing that may indicate a causally inverted account.
// These are suspicious when mechanistic reasoning is already low and the concept
// is fundamentally concurrent or automatic (confirmation bias, cognitive load, etc.).
const SEQUENTIAL_PATTERNS: RegExp[] = [
  /\bfirst\b.{5,80}\bthen\b/,
  /\bonce\b.{5,80}(,\s*)?\bthen\b/,
  /\bonly\s+(activates?|applies?|works?|operates?|kicks?\s+in)\b/i,
  /\bonly\s+(after|once|when)\b/i,
  /\bsubsequently\b/i,
  /\bit\s+(only\s+)?(begins?|starts?|operates?)\s+(after|once|when)\b/i,
];

// --- Helpers ---

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function bigrams(tokens: string[]): string[] {
  return tokens.slice(0, -1).map((t, i) => `${t} ${tokens[i + 1]}`);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function dimScore(
  evaluation: EvaluationForDetection,
  dimension: string
): number | undefined {
  return evaluation.dimensionEvaluations.find((d) => d.dimension === dimension)?.score;
}

// --- Individual heuristics ---
// Each returns a score in [0, 1] and any triggered flag strings.

// High overall score with sparse or very short evidence items.
// A genuinely understood concept should yield concrete, specific evidence;
// surface fluency tends to impress the evaluator without leaving traceable evidence.
export function computeFluencyRisk(
  evaluation: EvaluationForDetection
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const { overallUnderstandingScore, dimensionEvaluations } = evaluation;

  // Only meaningful when the score is already high — low scores need no fluency flag.
  if (overallUnderstandingScore < 55) return { score: 0, flags };

  const allEvidence = dimensionEvaluations.flatMap((d) => d.evidence);
  const avgEvidencePerDim =
    dimensionEvaluations.length > 0
      ? allEvidence.length / dimensionEvaluations.length
      : 0;

  const avgEvidenceWordLen =
    allEvidence.length > 0
      ? allEvidence.reduce((s, e) => s + e.trim().split(/\s+/).length, 0) /
        allEvidence.length
      : 0;

  let risk = 0;

  if (overallUnderstandingScore >= 70 && avgEvidencePerDim < 1.0) {
    risk += 0.55;
    flags.push(
      `Score ${overallUnderstandingScore} with <1 evidence item per dimension on average — evaluator may have rewarded fluency`
    );
  } else if (overallUnderstandingScore >= 60 && avgEvidencePerDim < 1.5) {
    risk += 0.3;
    flags.push(`Score ${overallUnderstandingScore} with sparse evidence (avg ${avgEvidencePerDim.toFixed(1)} items/dim)`);
  }

  if (avgEvidenceWordLen > 0 && avgEvidenceWordLen < 5) {
    risk += 0.2;
    flags.push(`Evidence items average <5 words — too brief to be specific`);
  }

  return { score: clamp01(risk), flags };
}

// Lexical overlap between userExplanation and sourceText.
// Unigram similarity detects word reuse; bigram similarity detects phrase copying.
// Bigrams are weighted more heavily because they catch structural paraphrasing.
export function computeParaphraseRisk(
  input: InputForDetection
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const srcTokens = tokenize(input.sourceText);
  const expTokens = tokenize(input.userExplanation);

  const unigramSim = jaccardSimilarity(new Set(srcTokens), new Set(expTokens));
  const bigramSim = jaccardSimilarity(
    new Set(bigrams(srcTokens)),
    new Set(bigrams(expTokens))
  );

  // 40/60 split: bigrams carry more diagnostic weight.
  const combined = unigramSim * 0.4 + bigramSim * 0.6;

  let risk = 0;

  if (combined > 0.45) {
    // Normalize: 0.45 → ~0, 0.80 → ~1
    risk = clamp01((combined - 0.45) / 0.35);
    flags.push(
      `High lexical overlap with source — unigram ${(unigramSim * 100).toFixed(0)}%, bigram ${(bigramSim * 100).toFixed(0)}%`
    );
  } else if (combined > 0.28) {
    risk = 0.25;
    flags.push(
      `Moderate lexical overlap with source — unigram ${(unigramSim * 100).toFixed(0)}%, bigram ${(bigramSim * 100).toFixed(0)}%`
    );
  }

  return { score: clamp01(risk), flags };
}

// Confident specific empirical claims combined with low mechanistic reasoning.
// Also detects named entities in the explanation that are absent from the source,
// which is a proxy for invented references.
export function computeHallucinationRisk(
  input: InputForDetection,
  evaluation: EvaluationForDetection
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const explanation = input.userExplanation;

  const matchedPatterns = CONFIDENT_CLAIM_PATTERNS.filter((p) => p.test(explanation));
  const mechanistic = dimScore(evaluation, "mechanistic_reasoning");

  let risk = 0;

  if (matchedPatterns.length > 0) {
    risk += 0.35 + Math.min(0.15, matchedPatterns.length * 0.05);
    flags.push(
      `Explanation contains confident specific claims (${matchedPatterns.length} pattern${matchedPatterns.length > 1 ? "s" : ""} matched)`
    );

    if (mechanistic !== undefined && mechanistic <= 2.5) {
      risk += 0.35;
      flags.push(
        `Confident claims paired with low mechanistic reasoning score (${mechanistic}) — may indicate invented mechanisms`
      );
    }
  }

  // Named entities in the explanation not present in the source are a rough
  // proxy for references the learner invented rather than derived from the material.
  const sourceEntities = new Set(
    input.sourceText.match(/\b[A-Z][a-zA-Z]{3,}(?:\s+[A-Z][a-zA-Z]{3,})*/g) ?? []
  );
  const explanationEntities =
    explanation.match(/\b[A-Z][a-zA-Z]{3,}(?:\s+[A-Z][a-zA-Z]{3,})*/g) ?? [];
  const novelEntities = [...new Set(explanationEntities)].filter(
    (e) => !sourceEntities.has(e) && !/^(The|This|These|That|It|In|At|On|By)$/.test(e)
  );

  if (novelEntities.length >= 2) {
    risk += 0.15;
    flags.push(
      `Explanation introduces named entities not present in source: ${novelEntities.slice(0, 3).join(", ")}`
    );
  }

  return { score: clamp01(risk), flags };
}

// High conceptual accuracy score alongside low transfer capability.
// Indicates the learner can describe the concept accurately in context but
// cannot apply the underlying structure to a new domain — a classic bluff pattern.
export function computeTransferBluffRisk(
  evaluation: EvaluationForDetection
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const conceptual = dimScore(evaluation, "conceptual_accuracy");
  const transfer = dimScore(evaluation, "transfer_capability");

  if (conceptual === undefined || transfer === undefined) {
    return { score: 0, flags };
  }

  let risk = 0;

  if (conceptual >= 3.5 && transfer <= 2.0) {
    risk = 0.9;
    flags.push(
      `High conceptual accuracy (${conceptual}) with very low transfer (${transfer}) — strong bluff signal`
    );
  } else if (conceptual >= 3.0 && transfer <= 2.5) {
    risk = 0.55;
    flags.push(
      `Good conceptual accuracy (${conceptual}) but weak transfer capability (${transfer})`
    );
  }

  return { score: clamp01(risk), flags };
}

// High density of abstract academic vocabulary without causal connectors.
// Absence of causal language ("because", "leads to", etc.) alongside many
// domain-neutral academic terms is a strong signal of contentless prose.
export function computeVagueJargonRisk(
  input: InputForDetection,
  evaluation: EvaluationForDetection
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const explanation = input.userExplanation.toLowerCase();
  const wordCount = Math.max(1, explanation.trim().split(/\s+/).length);

  const matchedJargon = VAGUE_JARGON_TERMS.filter((term) =>
    explanation.includes(term.toLowerCase())
  );
  // Normalize by explanation length so short texts aren't unfairly flagged.
  // Math.max guards against very short texts inflating the rate unfairly.
  const jargonRate = matchedJargon.length / Math.max(wordCount / 25, 1);

  const causalMatches = CAUSAL_CONNECTORS.filter((c) =>
    explanation.includes(c.toLowerCase())
  );

  const mechanistic = dimScore(evaluation, "mechanistic_reasoning");

  let risk = 0;

  if (matchedJargon.length >= 3 || jargonRate >= 1.5) {
    risk += 0.45;
    flags.push(
      `High-density abstract vocabulary: ${matchedJargon.slice(0, 4).join(", ")}`
    );

    if (causalMatches.length === 0) {
      risk += 0.35;
      flags.push("No causal connectors found — explanation lacks mechanistic structure");
    } else if (causalMatches.length <= 1) {
      risk += 0.15;
      flags.push(`Only ${causalMatches.length} causal connector found — thin mechanistic structure`);
    }

    if (mechanistic !== undefined && mechanistic <= 2.5) {
      risk += 0.15;
      flags.push(
        `Jargon-heavy language combined with low mechanistic reasoning score (${mechanistic})`
      );
    }
  } else if (matchedJargon.length >= 1 && causalMatches.length === 0) {
    risk = 0.2;
    flags.push("Academic vocabulary present but no causal reasoning language detected");
  }

  return { score: clamp01(risk), flags };
}

// Explanation scores reasonable on conceptual accuracy but poorly on mechanistic
// reasoning, with sequential temporal framing suggesting the causal direction
// may be inverted. The gap between conceptual and mechanistic scores is the
// primary heuristic signal.
export function computeCausalInversionRisk(
  input: InputForDetection,
  evaluation: EvaluationForDetection
): { score: number; flags: string[] } {
  const flags: string[] = [];
  const conceptual = dimScore(evaluation, "conceptual_accuracy");
  const mechanistic = dimScore(evaluation, "mechanistic_reasoning");

  // Requires both dimensions to be scored; a purely wrong explanation is not an inversion.
  if (conceptual === undefined || mechanistic === undefined) return { score: 0, flags };
  if (conceptual < 2.0) return { score: 0, flags };

  let risk = 0;

  if (conceptual >= 2.5 && mechanistic <= 2.5) {
    // Larger gap → more likely the conceptual framing is correct but the mechanism is wrong.
    const gap = conceptual - mechanistic;
    if (gap >= 1.0) {
      risk += clamp01(gap / 3.5);
      flags.push(
        `Conceptual accuracy (${conceptual}) significantly exceeds mechanistic score (${mechanistic}) — possible causal inversion`
      );
    }
  }

  const explanation = input.userExplanation.toLowerCase();
  const sequentialMatches = SEQUENTIAL_PATTERNS.filter((p) => p.test(explanation));

  if (sequentialMatches.length > 0 && mechanistic !== undefined && mechanistic <= 2.5) {
    risk += 0.25;
    flags.push(
      "Sequential/temporal framing detected for a process that may be concurrent or automatic"
    );
  }

  return { score: clamp01(risk), flags };
}

// --- Composite score and pressure test recommendation ---

const SUBSCORE_KEYS = [
  "fluencyRiskScore",
  "paraphraseRiskScore",
  "hallucinationRiskScore",
  "transferBluffRiskScore",
  "vagueJargonRiskScore",
  "causalInversionRiskScore",
] as const;

type SubscoreKey = (typeof SUBSCORE_KEYS)[number];

// overallAdversarialRiskScore = max(subscores).
//
// Rationale: each subcore detects a distinct deception pattern independently.
// Any single high-confidence signal is sufficient to flag the case — averaging
// them would dilute a score of 1.0 on hallucination to 0.17 when the other
// five subscores are 0. The max preserves the strongest signal.
function computeOverallRisk(
  scores: Pick<AdversarialDetectionResult, SubscoreKey>
): number {
  return clamp01(Math.max(...SUBSCORE_KEYS.map((k) => scores[k])));
}

// Maps the highest individual risk to a targeted follow-up question.
const PRESSURE_TESTS: Record<string, string> = {
  paraphraseRiskScore:
    "Ask the learner to explain the concept from scratch in a completely different domain, without referencing the source material.",
  hallucinationRiskScore:
    "Ask the learner to identify the original source for each specific claim or named mechanism in their explanation.",
  vagueJargonRiskScore:
    "Ask the learner to re-explain the concept in plain everyday language without any technical vocabulary.",
  fluencyRiskScore:
    "Ask the learner for a specific, concrete real-world example where this concept caused an observable outcome.",
  transferBluffRiskScore:
    "Ask the learner to apply this concept to an unfamiliar domain and explain why the same underlying mechanism operates there.",
  causalInversionRiskScore:
    "Ask the learner to walk through the causal sequence step-by-step and identify which event or state comes first.",
};

function recommendPressureTest(
  scores: Pick<AdversarialDetectionResult, SubscoreKey>
): string {
  const ranked = SUBSCORE_KEYS
    .map((k) => ({ key: k, score: scores[k] }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  if (top.score < 0.3) {
    return "No specific risk flagged. Consider asking for a novel example to confirm generalization.";
  }

  return PRESSURE_TESTS[top.key] ?? "Ask the learner to explain the concept in a new context.";
}

// --- Public API ---

// Synchronous deterministic detector. Safe to call in any context — no network I/O.
export function detectAdversarialRisk(
  input: InputForDetection,
  evaluation: EvaluationForDetection
): AdversarialDetectionResult {
  const fluency = computeFluencyRisk(evaluation);
  const paraphrase = computeParaphraseRisk(input);
  const hallucination = computeHallucinationRisk(input, evaluation);
  const transferBluff = computeTransferBluffRisk(evaluation);
  const vagueJargon = computeVagueJargonRisk(input, evaluation);
  const causalInversion = computeCausalInversionRisk(input, evaluation);

  const scores = {
    fluencyRiskScore: round3(fluency.score),
    paraphraseRiskScore: round3(paraphrase.score),
    hallucinationRiskScore: round3(hallucination.score),
    transferBluffRiskScore: round3(transferBluff.score),
    vagueJargonRiskScore: round3(vagueJargon.score),
    causalInversionRiskScore: round3(causalInversion.score),
  };

  const allFlags = [
    ...fluency.flags,
    ...paraphrase.flags,
    ...hallucination.flags,
    ...transferBluff.flags,
    ...vagueJargon.flags,
    ...causalInversion.flags,
  ];

  return {
    ...scores,
    overallAdversarialRiskScore: round3(computeOverallRisk(scores)),
    riskFlags: allFlags,
    recommendedPressureTest: recommendPressureTest(scores),
  };
}

// Optional LLM-assisted refinement for causal inversion risk specifically.
// Only runs when the deterministic causalInversionRiskScore is ambiguous (0.15–0.7),
// saving API calls for clear cases. Requires an OpenAI client to be passed in.
export async function detectAdversarialRiskWithLLM(
  input: InputForDetection,
  evaluation: EvaluationForDetection,
  options: {
    // Caller supplies the client to avoid coupling this module to OpenAI directly.
    callLLM: (prompt: string) => Promise<string>;
    // Only refine when deterministic causal inversion score is in this range.
    refinementWindow?: [number, number];
  }
): Promise<AdversarialDetectionResult> {
  const base = detectAdversarialRisk(input, evaluation);
  const [lo, hi] = options.refinementWindow ?? [0.15, 0.70];

  // Skip LLM call if the heuristic result is already clear.
  if (base.causalInversionRiskScore < lo || base.causalInversionRiskScore > hi) {
    return base;
  }

  const prompt = buildCausalInversionPrompt(input, evaluation);

  let llmScore = base.causalInversionRiskScore;
  let llmFlag: string | null = null;

  try {
    const raw = await options.callLLM(prompt);
    const parsed = parseLLMCausalRisk(raw);
    if (parsed !== null) {
      llmScore = parsed.score;
      if (parsed.reason) {
        llmFlag = `[LLM] ${parsed.reason}`;
      }
    }
  } catch {
    // LLM failure is non-fatal — fall back to the deterministic score.
  }

  const updatedScores = {
    ...base,
    causalInversionRiskScore: round3(llmScore),
    riskFlags: llmFlag ? [...base.riskFlags, llmFlag] : base.riskFlags,
  };

  return {
    ...updatedScores,
    overallAdversarialRiskScore: round3(
      computeOverallRisk({
        fluencyRiskScore: updatedScores.fluencyRiskScore,
        paraphraseRiskScore: updatedScores.paraphraseRiskScore,
        hallucinationRiskScore: updatedScores.hallucinationRiskScore,
        transferBluffRiskScore: updatedScores.transferBluffRiskScore,
        vagueJargonRiskScore: updatedScores.vagueJargonRiskScore,
        causalInversionRiskScore: updatedScores.causalInversionRiskScore,
      })
    ),
    recommendedPressureTest: recommendPressureTest({
      fluencyRiskScore: updatedScores.fluencyRiskScore,
      paraphraseRiskScore: updatedScores.paraphraseRiskScore,
      hallucinationRiskScore: updatedScores.hallucinationRiskScore,
      transferBluffRiskScore: updatedScores.transferBluffRiskScore,
      vagueJargonRiskScore: updatedScores.vagueJargonRiskScore,
      causalInversionRiskScore: updatedScores.causalInversionRiskScore,
    }),
  };
}

function buildCausalInversionPrompt(
  input: InputForDetection,
  evaluation: EvaluationForDetection
): string {
  const mechanistic = dimScore(evaluation, "mechanistic_reasoning") ?? "not scored";
  const conceptual = dimScore(evaluation, "conceptual_accuracy") ?? "not scored";

  return `You are checking whether an explanation inverts the causal direction of a concept.

CONCEPT: ${input.concept}

SOURCE MATERIAL:
${input.sourceText}

USER EXPLANATION:
${input.userExplanation}

EVALUATOR SCORES:
- conceptual_accuracy: ${conceptual}/5
- mechanistic_reasoning: ${mechanistic}/5

Does the user's explanation reverse the causal mechanism (e.g., present as sequential/retrospective something that is actually automatic/concurrent)?

Respond with JSON only:
{ "causalInversionRisk": <number 0.0–1.0>, "reason": "<one sentence or empty string>" }`;
}

function parseLLMCausalRisk(
  raw: string
): { score: number; reason: string } | null {
  try {
    const json = JSON.parse(raw.trim());
    const score = typeof json.causalInversionRisk === "number" ? json.causalInversionRisk : null;
    if (score === null || score < 0 || score > 1) return null;
    return { score, reason: typeof json.reason === "string" ? json.reason : "" };
  } catch {
    return null;
  }
}
