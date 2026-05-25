import { describe, it, expect } from "vitest";
import {
  computeFluencyRisk,
  computeParaphraseRisk,
  computeHallucinationRisk,
  computeTransferBluffRisk,
  computeVagueJargonRisk,
  computeCausalInversionRisk,
  detectAdversarialRisk,
  type EvaluationForDetection,
  type InputForDetection,
} from "@/lib/evaluation/adversarialDetection";

// --- Fixtures ---

const makeDim = (
  dimension: string,
  score: number,
  evidence: string[] = ["some evidence item here"]
) => ({
  dimension,
  score,
  evaluatorConfidence: "medium" as const,
  evidence,
});

const makeEval = (
  overallUnderstandingScore: number,
  dims: ReturnType<typeof makeDim>[]
): EvaluationForDetection => ({ overallUnderstandingScore, dimensionEvaluations: dims });

const makeInput = (
  overrides: Partial<InputForDetection> = {}
): InputForDetection => ({
  concept: "Spaced Repetition",
  sourceText:
    "Spaced repetition is a technique where review sessions are spread out over increasing intervals. Memory retention improves when material is revisited just as it is about to be forgotten.",
  userExplanation:
    "Spaced repetition improves memory by reviewing material at increasing intervals, exploiting the spacing effect.",
  confidence: 3,
  ...overrides,
});

// --- computeFluencyRisk ---

describe("computeFluencyRisk", () => {
  it("returns 0 for low overall score even with sparse evidence", () => {
    const evaluation = makeEval(40, [makeDim("conceptual_accuracy", 2, [])]);
    const { score } = computeFluencyRisk(evaluation);
    expect(score).toBe(0);
  });

  it("flags high score with no evidence items", () => {
    const evaluation = makeEval(80, [
      makeDim("conceptual_accuracy", 4, []),
      makeDim("mechanistic_reasoning", 4, []),
    ]);
    const { score, flags } = computeFluencyRisk(evaluation);
    expect(score).toBeGreaterThan(0.4);
    expect(flags.length).toBeGreaterThan(0);
  });

  it("returns low risk when evidence is present and substantive", () => {
    const evaluation = makeEval(75, [
      makeDim("conceptual_accuracy", 4, [
        "Correctly identifies metric distortion as the core mechanism",
        "Notes that gaming is a consequence not a cause",
      ]),
      makeDim("mechanistic_reasoning", 4, [
        "Explains the feedback loop between measurement and behavior",
      ]),
    ]);
    const { score } = computeFluencyRisk(evaluation);
    expect(score).toBeLessThan(0.3);
  });

  it("flags very short evidence items even when there are enough of them", () => {
    const evaluation = makeEval(72, [
      makeDim("conceptual_accuracy", 4, ["ok", "yes", "good"]),
    ]);
    const { score } = computeFluencyRisk(evaluation);
    expect(score).toBeGreaterThan(0);
  });
});

// --- computeParaphraseRisk ---

describe("computeParaphraseRisk", () => {
  it("returns high risk for near-verbatim paraphrase", () => {
    // Both texts are long enough that bigram overlap is meaningful.
    // Only a handful of words are substituted; the sentence structure is preserved.
    const input = makeInput({
      sourceText:
        "Spaced repetition is a learning technique in which review sessions are spread out over increasing time intervals rather than massed together. Memory retention improves when material is revisited just as it is about to be forgotten, exploiting the spacing effect to make retrieval effortful yet successful. The technique is most effective when combined with active recall rather than passive re-reading.",
      userExplanation:
        "Spaced repetition is a study method in which review sessions are spread out over increasing time gaps rather than massed together. Memory retention improves when material is reviewed just as it is about to be forgotten, exploiting the spacing effect to make recall effortful yet successful. The approach is most effective when combined with active recall rather than passive re-reading of material.",
    });
    const { score } = computeParaphraseRisk(input);
    expect(score).toBeGreaterThan(0.4);
  });

  it("returns low risk for genuinely different language", () => {
    const input = makeInput({
      sourceText:
        "Spaced repetition is a learning technique where review sessions are spread out over increasing time intervals.",
      userExplanation:
        "Think of it like watering a plant: you don't dump all the water at once. You revisit the knowledge right before the memory would fade, which makes the retrieval effort count.",
    });
    const { score } = computeParaphraseRisk(input);
    expect(score).toBeLessThan(0.25);
  });

  it("flag text mentions both unigram and bigram percentages", () => {
    const srcText = "spaced repetition distributes review sessions over increasing intervals for better retention";
    const expText = "spaced repetition distributes sessions over increasing intervals for better recall";
    const input = makeInput({ sourceText: srcText, userExplanation: expText });
    const { flags } = computeParaphraseRisk(input);
    expect(flags.some((f) => f.includes("%"))).toBe(true);
  });

  it("returns 0 when explanation and source share almost no words", () => {
    const input = makeInput({
      sourceText: "entropy increases in closed systems according to thermodynamics",
      userExplanation: "cognitive load overwhelms working memory during complex tasks",
    });
    const { score } = computeParaphraseRisk(input);
    expect(score).toBe(0);
  });
});

// --- computeHallucinationRisk ---

describe("computeHallucinationRisk", () => {
  it("flags confident numerical claims", () => {
    const input = makeInput({
      userExplanation:
        "Across 14 replication studies the effect size averages 0.73, confirming the mechanism.",
    });
    const evaluation = makeEval(60, [makeDim("mechanistic_reasoning", 3)]);
    const { score, flags } = computeHallucinationRisk(input, evaluation);
    expect(score).toBeGreaterThan(0.3);
    expect(flags.some((f) => f.toLowerCase().includes("confident"))).toBe(true);
  });

  it("raises risk further when confident claims + low mechanistic score", () => {
    const input = makeInput({
      userExplanation:
        "The pathway was demonstrated by Smith and Jones (2003), proving the mechanism.",
    });
    const evalLowMech = makeEval(60, [makeDim("mechanistic_reasoning", 2)]);
    const evalHighMech = makeEval(60, [makeDim("mechanistic_reasoning", 4)]);
    const { score: lowScore } = computeHallucinationRisk(input, evalLowMech);
    const { score: highScore } = computeHallucinationRisk(input, evalHighMech);
    expect(lowScore).toBeGreaterThan(highScore);
  });

  it("flags novel named entities absent from source", () => {
    const input = makeInput({
      sourceText: "Spaced repetition exploits the spacing effect.",
      userExplanation:
        "Ebbinghaus and Bjork demonstrated this via the HippocampalConsolidation pathway in the Anderson-Miller theorem.",
    });
    const evaluation = makeEval(60, [makeDim("mechanistic_reasoning", 2)]);
    const { flags } = computeHallucinationRisk(input, evaluation);
    expect(flags.some((f) => f.toLowerCase().includes("named entities"))).toBe(true);
  });

  it("returns 0 for plain explanation with no confident claim patterns", () => {
    const input = makeInput({
      userExplanation:
        "Reviewing material after longer and longer gaps helps you remember it better.",
    });
    const evaluation = makeEval(55, [makeDim("mechanistic_reasoning", 2.5)]);
    const { score } = computeHallucinationRisk(input, evaluation);
    expect(score).toBe(0);
  });
});

// --- computeTransferBluffRisk ---

describe("computeTransferBluffRisk", () => {
  it("returns high risk when conceptual is high and transfer is very low", () => {
    const evaluation = makeEval(70, [
      makeDim("conceptual_accuracy", 4),
      makeDim("transfer_capability", 1.5),
    ]);
    const { score } = computeTransferBluffRisk(evaluation);
    expect(score).toBeGreaterThanOrEqual(0.85);
  });

  it("returns moderate risk when gap is present but not extreme", () => {
    const evaluation = makeEval(65, [
      makeDim("conceptual_accuracy", 3.2),
      makeDim("transfer_capability", 2.4),
    ]);
    const { score } = computeTransferBluffRisk(evaluation);
    expect(score).toBeGreaterThan(0.4);
    expect(score).toBeLessThan(0.8);
  });

  it("returns 0 when both dimensions score well", () => {
    const evaluation = makeEval(80, [
      makeDim("conceptual_accuracy", 4),
      makeDim("transfer_capability", 3.5),
    ]);
    const { score } = computeTransferBluffRisk(evaluation);
    expect(score).toBe(0);
  });

  it("returns 0 when either dimension is missing", () => {
    const evaluation = makeEval(70, [makeDim("conceptual_accuracy", 4)]);
    const { score } = computeTransferBluffRisk(evaluation);
    expect(score).toBe(0);
  });
});

// --- computeVagueJargonRisk ---

describe("computeVagueJargonRisk", () => {
  it("flags high jargon density without causal connectors", () => {
    const input = makeInput({
      userExplanation:
        "Metacognition represents the recursive epistemic architecture through which higher-order cognitive modalities interface with the foundational substrate of experiential awareness, instantiating self-referential regulatory coherence.",
    });
    const evaluation = makeEval(60, [makeDim("mechanistic_reasoning", 2)]);
    const { score, flags } = computeVagueJargonRisk(input, evaluation);
    expect(score).toBeGreaterThan(0.5);
    expect(flags.some((f) => f.toLowerCase().includes("causal"))).toBe(true);
  });

  it("returns lower risk when causal connectors are present", () => {
    const input = makeInput({
      userExplanation:
        "The epistemic framework is useful because it leads to better calibration, therefore helping learners recognize gaps.",
    });
    const evaluation = makeEval(65, [makeDim("mechanistic_reasoning", 3.5)]);
    const { score } = computeVagueJargonRisk(input, evaluation);
    expect(score).toBeLessThan(0.5);
  });

  it("returns 0 for plain causal explanation with no jargon", () => {
    const input = makeInput({
      userExplanation:
        "When you review material just before you forget it, the retrieval effort causes stronger memory encoding because the brain reinforces what it successfully recalls.",
    });
    const evaluation = makeEval(70, [makeDim("mechanistic_reasoning", 4)]);
    const { score } = computeVagueJargonRisk(input, evaluation);
    expect(score).toBe(0);
  });

  it("is proportional to jargon count", () => {
    // Use texts long enough that jargonRate (per 25 words) is not distorted by short-text division.
    const fewJargon = makeInput({
      userExplanation:
        "Thinking about your own thinking is useful. When you study, you should monitor what you understand and what you do not understand, then adjust your approach based on what is working.",
    });
    const manyJargon = makeInput({
      userExplanation:
        "The epistemic substrate instantiates recursive modalities through phenomenological scaffolding that constitutes the foundational representational layer of metacognitive processing, enabling self-referential regulatory coherence across higher-order cognitive modalities.",
    });
    const evalBase = makeEval(60, [makeDim("mechanistic_reasoning", 2)]);
    const { score: few } = computeVagueJargonRisk(fewJargon, evalBase);
    const { score: many } = computeVagueJargonRisk(manyJargon, evalBase);
    expect(many).toBeGreaterThan(few);
  });
});

// --- computeCausalInversionRisk ---

describe("computeCausalInversionRisk", () => {
  it("flags large gap between conceptual accuracy and mechanistic reasoning", () => {
    const evaluation = makeEval(60, [
      makeDim("conceptual_accuracy", 3.5),
      makeDim("mechanistic_reasoning", 1.5),
    ]);
    const input = makeInput();
    const { score, flags } = computeCausalInversionRisk(input, evaluation);
    expect(score).toBeGreaterThan(0.3);
    expect(flags.some((f) => f.toLowerCase().includes("causal"))).toBe(true);
  });

  it("returns 0 when conceptual accuracy is very low", () => {
    const evaluation = makeEval(30, [
      makeDim("conceptual_accuracy", 1.5),
      makeDim("mechanistic_reasoning", 1.0),
    ]);
    const { score } = computeCausalInversionRisk(makeInput(), evaluation);
    expect(score).toBe(0);
  });

  it("returns 0 when mechanistic reasoning is also adequate", () => {
    const evaluation = makeEval(70, [
      makeDim("conceptual_accuracy", 3.5),
      makeDim("mechanistic_reasoning", 3.0),
    ]);
    const { score } = computeCausalInversionRisk(makeInput(), evaluation);
    expect(score).toBe(0);
  });

  it("adds sequential pattern flag when mechanistic is low", () => {
    const input = makeInput({
      userExplanation:
        "People first form a strong belief, and only after it consolidates do they then start seeking confirming information.",
    });
    const evaluation = makeEval(55, [
      makeDim("conceptual_accuracy", 3.0),
      makeDim("mechanistic_reasoning", 2.0),
    ]);
    const { score, flags } = computeCausalInversionRisk(input, evaluation);
    expect(score).toBeGreaterThan(0.3);
    expect(flags.some((f) => f.toLowerCase().includes("sequential"))).toBe(true);
  });

  it("does not flag sequential language when mechanistic score is adequate", () => {
    const input = makeInput({
      userExplanation:
        "People first encounter information, then evaluate it — but because confirmation bias operates automatically, the evaluation is already skewed.",
    });
    const evaluation = makeEval(70, [
      makeDim("conceptual_accuracy", 4),
      makeDim("mechanistic_reasoning", 3.5),
    ]);
    const { flags } = computeCausalInversionRisk(input, evaluation);
    expect(flags.some((f) => f.toLowerCase().includes("sequential"))).toBe(false);
  });
});

// --- detectAdversarialRisk (integration) ---

describe("detectAdversarialRisk", () => {
  it("returns all required fields", () => {
    const result = detectAdversarialRisk(makeInput(), makeEval(60, [makeDim("conceptual_accuracy", 3)]));
    expect(result).toHaveProperty("fluencyRiskScore");
    expect(result).toHaveProperty("paraphraseRiskScore");
    expect(result).toHaveProperty("hallucinationRiskScore");
    expect(result).toHaveProperty("transferBluffRiskScore");
    expect(result).toHaveProperty("vagueJargonRiskScore");
    expect(result).toHaveProperty("causalInversionRiskScore");
    expect(result).toHaveProperty("overallAdversarialRiskScore");
    expect(result).toHaveProperty("riskFlags");
    expect(result).toHaveProperty("recommendedPressureTest");
  });

  it("all scores are in [0, 1]", () => {
    const result = detectAdversarialRisk(makeInput(), makeEval(75, [
      makeDim("conceptual_accuracy", 4),
      makeDim("mechanistic_reasoning", 2),
      makeDim("transfer_capability", 1.5),
    ]));
    const scoreFields = [
      result.fluencyRiskScore,
      result.paraphraseRiskScore,
      result.hallucinationRiskScore,
      result.transferBluffRiskScore,
      result.vagueJargonRiskScore,
      result.causalInversionRiskScore,
      result.overallAdversarialRiskScore,
    ];
    for (const s of scoreFields) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it("accumulates flags from triggered heuristics", () => {
    // High score, near-verbatim paraphrase, no evidence — should trigger fluency + paraphrase
    const input = makeInput({
      sourceText:
        "Spaced repetition is a learning technique where sessions are spread over increasing intervals.",
      userExplanation:
        "Spaced repetition is a study method where sessions are distributed across growing intervals.",
    });
    const evaluation = makeEval(82, [makeDim("conceptual_accuracy", 4, [])]);
    const { riskFlags } = detectAdversarialRisk(input, evaluation);
    expect(riskFlags.length).toBeGreaterThan(0);
  });

  it("overallAdversarialRiskScore is low when all heuristics clear", () => {
    // overallAdversarialRiskScore = max(subscores), so this verifies every subcore is low.
    const cleanInput = makeInput({
      userExplanation:
        "I think of it as watering plants: too much water at once doesn't help, but returning at the right moment makes each encounter count. The brain reinforces memories most effectively when retrieval is effortful but successful.",
    });
    const cleanEval = makeEval(68, [
      makeDim("conceptual_accuracy", 3.5, ["Uses novel plant analogy", "Links retrieval effort to encoding strength"]),
      makeDim("mechanistic_reasoning", 3, ["Identifies the mechanism: effortful successful retrieval"]),
      makeDim("transfer_capability", 3.5, ["Applies to physical skill learning as well"]),
    ]);
    const { overallAdversarialRiskScore } = detectAdversarialRisk(cleanInput, cleanEval);
    expect(overallAdversarialRiskScore).toBeLessThan(0.4);
  });

  it("overallAdversarialRiskScore equals max of subscores", () => {
    // A single high subcore should dominate the overall score.
    const input = makeInput({
      sourceText: "Spaced repetition exploits the spacing effect.",
      userExplanation:
        "Ebbinghaus and Bjork demonstrated this via 14 studies with coefficient 0.73 and GABAergic pathways proven in 1994.",
    });
    const evaluation = makeEval(60, [makeDim("mechanistic_reasoning", 2)]);
    const result = detectAdversarialRisk(input, evaluation);
    const subscoreMax = Math.max(
      result.fluencyRiskScore,
      result.paraphraseRiskScore,
      result.hallucinationRiskScore,
      result.transferBluffRiskScore,
      result.vagueJargonRiskScore,
      result.causalInversionRiskScore
    );
    expect(result.overallAdversarialRiskScore).toBeCloseTo(subscoreMax, 3);
  });

  it("recommendedPressureTest is a non-empty string", () => {
    const result = detectAdversarialRisk(makeInput(), makeEval(60, []));
    expect(typeof result.recommendedPressureTest).toBe("string");
    expect(result.recommendedPressureTest.length).toBeGreaterThan(10);
  });

  it("adversarial risk does not alter the evaluation object", () => {
    const evaluation = makeEval(75, [makeDim("conceptual_accuracy", 4)]);
    const before = evaluation.overallUnderstandingScore;
    detectAdversarialRisk(makeInput(), evaluation);
    expect(evaluation.overallUnderstandingScore).toBe(before);
  });
});
