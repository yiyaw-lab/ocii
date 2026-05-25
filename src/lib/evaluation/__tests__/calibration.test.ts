// Calibration tests — frozen fixtures derived from live benchmark inputs.
//
// Purpose: confirm that threshold constants match observed detector behaviour on
// real benchmark texts, so any future heuristic change that silently breaks
// calibration is caught immediately.
//
// These tests do NOT run the LLM evaluator. They pair the actual adversarial
// input texts with plausible mock evaluation objects (representing what the
// evaluator would return for each case) and assert on the deterministic
// heuristic output.
//
// See __tests__/calibrationReport.md for the full per-case analysis and
// threshold justification.

import { describe, it, expect } from "vitest";
import {
  RISK_FLAG_THRESHOLD,
  HIGH_RISK_THRESHOLD,
  computeParaphraseRisk,
  computeHallucinationRisk,
  computeTransferBluffRisk,
  computeVagueJargonRisk,
  computeCausalInversionRisk,
  detectAdversarialRisk,
  type EvaluationForDetection,
  type InputForDetection,
} from "@/lib/evaluation/adversarialDetection";
import { DECEPTION_CAUGHT_THRESHOLD } from "@/lib/evaluation/scoreBenchmarkResult";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeDim = (
  dimension: string,
  score: number,
  evidence: string[] = ["evidence item"]
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

// ---------------------------------------------------------------------------
// Frozen benchmark input texts (verbatim from benchmarkCases.ts)
// ---------------------------------------------------------------------------

const COGNITIVE_LOAD_SOURCE =
  "Cognitive Load Theory distinguishes three types of load on working memory: intrinsic load (complexity inherent to the material), extraneous load (unnecessary cognitive effort caused by poor instructional design), and germane load (effort devoted to forming schemas and long-term learning). Effective instruction minimizes extraneous load and uses freed capacity for germane processing.";

const COGNITIVE_LOAD_ADVERSARIAL_EXPLANATION =
  "Cognitive Load Theory shows that working memory performs best when all three load types are simultaneously activated. Extraneous load provides the additional cognitive friction that forces the brain to build richer schemas, so high extraneous load actually improves germane processing. The theory suggests instructional designers should maximize total cognitive load to push learners toward expanded working memory capacity.";

const RIF_SOURCE =
  "Retrieval-induced forgetting (RIF) is the finding that recalling some items from a studied set impairs later recall of related, non-retrieved items from the same set. It is thought to occur because retrieval suppresses competing memories to reduce interference during the recall attempt.";

const RIF_ADVERSARIAL_EXPLANATION =
  "Retrieval-induced forgetting is well-established: across 14 replication studies the inhibition coefficient averages 0.73, indicating robust suppression. The mechanism is the Anderson-Bjork suppression theorem (1994), which demonstrated that non-retrieved items are actively inhibited via direct GABAergic pathways in the hippocampal CA3 region. This inhibition is permanent for items suppressed more than three times, which is why distributed retrieval practice must avoid re-testing the same material within a 48-hour window.";

const SPACED_REP_SOURCE =
  "Spaced repetition is a learning technique in which review sessions are spread out over increasing time intervals rather than massed together. Memory retention improves when material is revisited just as it is about to be forgotten, exploiting the spacing effect to make retrieval effortful yet successful. The technique is most effective when combined with active recall rather than passive re-reading.";

const SPACED_REP_PARAPHRASE_EXPLANATION =
  "Spaced repetition is a study method where review sessions are distributed across growing time gaps rather than clustered together. Retention of information improves when material is reviewed just before it is about to be forgotten, taking advantage of the spacing effect to make recall effortful yet successful. The approach is most effective when paired with active recall rather than passive re-reading of material.";

const LOSS_AVERSION_SOURCE =
  "Loss aversion is the tendency for people to feel the pain of a loss more strongly than the pleasure of an equivalent gain — typically estimated at roughly twice as intense. It is a component of prospect theory and explains why people are often reluctant to accept gambles with positive expected value when they involve possible losses.";

const LOSS_AVERSION_TRANSFER_BLUFF_EXPLANATION =
  "Loss aversion applies across many domains. In investing, it explains why people prefer a guaranteed $50 over a 50% chance of $150 — the potential loss of the guaranteed amount looms larger than the upside. In sports, athletes consistently outperform under loss-aversion conditions: a tennis player who is 'one point from losing' demonstrates loss aversion by trying harder than someone playing to win. Loss aversion also explains procrastination: the perceived loss of free time makes starting tasks painful, which is why people delay.";

const METACOGNITION_SOURCE =
  "Metacognition refers to thinking about one's own thinking. It includes both metacognitive knowledge (what one knows about learning and memory) and metacognitive regulation (monitoring and controlling one's own cognitive processes). Research shows that effective learners actively monitor their comprehension and adjust strategies when understanding breaks down.";

const METACOGNITION_JARGON_EXPLANATION =
  "Metacognition represents the recursive epistemic architecture through which higher-order cognitive modalities interface with the foundational substrate of experiential processing. By instantiating self-referential feedback loops across the representational hierarchy, the cognitive system achieves reflexive integration of its own epistemic states. This self-referential scaffolding enables the dynamic reconfiguration of cognitive resources in response to emergent phenomenological constraints, thereby constituting the meta-level substrate from which intentional knowledge-states derive their regulatory coherence.";

const CONFIRMATION_BIAS_SOURCE =
  "Confirmation bias is the tendency to search for, interpret, and recall information in a way that confirms one's pre-existing beliefs. It operates automatically during evidence evaluation: people assign greater credibility to confirming evidence, dismiss disconfirming evidence more readily, and selectively seek out sources that agree with their views.";

const CONFIRMATION_BIAS_INVERTED_EXPLANATION =
  "Confirmation bias works as follows: people are first exposed to a broad range of information and, through rational deliberation, form an initial belief. Once that belief becomes sufficiently strong, it then causes them to preferentially seek confirming sources going forward. The bias is therefore a downstream consequence of belief strength — it only activates after a belief has been consolidated, which is why it is most visible in people with well-established views rather than those still forming opinions.";

const GOODHARTS_SOURCE =
  "Goodhart's Law states that when a measure becomes a target, it ceases to be a good measure. Metrics that initially reflect a valuable outcome often become distorted once people start optimizing specifically for the metric itself.";

const GOODHARTS_GENUINE_EXPLANATION =
  "Goodhart's Law means metrics stop being reliable when people optimize directly for them. The behavior shifts toward improving the number rather than preserving the original goal.";

// ---------------------------------------------------------------------------
// Threshold constant values
// ---------------------------------------------------------------------------

describe("threshold constants", () => {
  it("RISK_FLAG_THRESHOLD is 0.40", () => {
    expect(RISK_FLAG_THRESHOLD).toBe(0.40);
  });

  it("HIGH_RISK_THRESHOLD is 0.70", () => {
    expect(HIGH_RISK_THRESHOLD).toBe(0.70);
  });

  it("DECEPTION_CAUGHT_THRESHOLD is 0.30", () => {
    expect(DECEPTION_CAUGHT_THRESHOLD).toBe(0.30);
  });

  it("RISK_FLAG_THRESHOLD is below HIGH_RISK_THRESHOLD", () => {
    expect(RISK_FLAG_THRESHOLD).toBeLessThan(HIGH_RISK_THRESHOLD);
  });

  it("DECEPTION_CAUGHT_THRESHOLD is below RISK_FLAG_THRESHOLD", () => {
    expect(DECEPTION_CAUGHT_THRESHOLD).toBeLessThan(RISK_FLAG_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// fluent_nonsense (Cognitive Load Theory)
// Evaluator correctly scores this low → detector should NOT fire (evaluator
// already caught it; low overall score suppresses fluency risk).
// ---------------------------------------------------------------------------

describe("fluent_nonsense — Cognitive Load Theory", () => {
  const input: InputForDetection = {
    concept: "Cognitive Load Theory",
    sourceText: COGNITIVE_LOAD_SOURCE,
    userExplanation: COGNITIVE_LOAD_ADVERSARIAL_EXPLANATION,
    confidence: 3,
  };

  // When the evaluator correctly catches the deception, it assigns low scores.
  const caughtEval = makeEval(28, [
    makeDim("conceptual_accuracy", 1.5),
    makeDim("mechanistic_reasoning", 1.5),
    makeDim("transfer_capability", 2.0),
  ]);

  it("fluency heuristic is silent when overall score is low (evaluator caught it)", () => {
    const { overallAdversarialRiskScore } = detectAdversarialRisk(input, caughtEval);
    // Detector risk should stay low — the evaluator's own scores already reflect the deception.
    expect(overallAdversarialRiskScore).toBeLessThan(RISK_FLAG_THRESHOLD);
  });

  it("riskFlags are empty or minimal when the evaluator already caught the deception", () => {
    const { riskFlags } = detectAdversarialRisk(input, caughtEval);
    // No individual heuristic should trigger hard when overall score is < 55.
    expect(riskFlags.length).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// confident_hallucination (Retrieval-Induced Forgetting)
// Text contains invented statistics, non-existent theorem, and fabricated
// neurobiological pathway → hallucinationRiskScore should reach HIGH_RISK_THRESHOLD.
// ---------------------------------------------------------------------------

describe("confident_hallucination — Retrieval-Induced Forgetting", () => {
  const input: InputForDetection = {
    concept: "Retrieval-Induced Forgetting",
    sourceText: RIF_SOURCE,
    userExplanation: RIF_ADVERSARIAL_EXPLANATION,
    confidence: 3,
  };

  // When the evaluator is fooled, it gives higher scores but may still flag
  // mechanistic reasoning because the invented mechanism is implausible.
  const fooledEval = makeEval(58, [
    makeDim("conceptual_accuracy", 3.5),
    makeDim("mechanistic_reasoning", 2.0, ["references Anderson-Bjork theorem"]),
    makeDim("epistemic_awareness", 1.5),
  ]);

  it("hallucinationRiskScore reaches HIGH_RISK_THRESHOLD", () => {
    const { score } = computeHallucinationRisk(input, fooledEval);
    expect(score).toBeGreaterThanOrEqual(HIGH_RISK_THRESHOLD);
  });

  it("overall risk exceeds HIGH_RISK_THRESHOLD", () => {
    const { overallAdversarialRiskScore } = detectAdversarialRisk(input, fooledEval);
    expect(overallAdversarialRiskScore).toBeGreaterThanOrEqual(HIGH_RISK_THRESHOLD);
  });

  it("riskFlags mention specific claims", () => {
    const { score, flags } = computeHallucinationRisk(input, fooledEval);
    expect(score).toBeGreaterThan(0);
    expect(flags.some((f) => f.toLowerCase().includes("claim"))).toBe(true);
  });

  it("novel named entities are flagged (Anderson-Bjork not in source)", () => {
    const { flags } = computeHallucinationRisk(input, fooledEval);
    expect(flags.some((f) => f.toLowerCase().includes("named entit"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// memorized_paraphrase (Spaced Repetition)
// Near-verbatim synonym substitution → paraphrase heuristic detects moderate
// overlap. Note: overallAdversarialRiskScore may not exceed RISK_FLAG_THRESHOLD
// from paraphrase alone — this is a known detection gap documented in the report.
// ---------------------------------------------------------------------------

describe("memorized_paraphrase — Spaced Repetition", () => {
  const input: InputForDetection = {
    concept: "Spaced Repetition",
    sourceText: SPACED_REP_SOURCE,
    userExplanation: SPACED_REP_PARAPHRASE_EXPLANATION,
    confidence: 3,
  };

  it("paraphraseRiskScore is non-zero (overlap detected)", () => {
    const { score } = computeParaphraseRisk(input);
    expect(score).toBeGreaterThan(0);
  });

  it("paraphrase flags describe lexical overlap", () => {
    const { flags } = computeParaphraseRisk(input);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags[0].toLowerCase()).toMatch(/overlap/);
  });
});

// ---------------------------------------------------------------------------
// transfer_bluffing (Loss Aversion)
// Text claims cross-domain application in investing, sports, and procrastination
// without mechanistic bridging → text heuristic should fire above RISK_FLAG_THRESHOLD.
// This is the key case for the evaluation-independent text heuristic.
// ---------------------------------------------------------------------------

describe("transfer_bluffing — Loss Aversion", () => {
  const input: InputForDetection = {
    concept: "Loss Aversion",
    sourceText: LOSS_AVERSION_SOURCE,
    userExplanation: LOSS_AVERSION_TRANSFER_BLUFF_EXPLANATION,
    confidence: 3,
  };

  // The evaluator was fooled: it gave high transfer scores because the explanation
  // named real domains. The dimension-gap heuristic produces 0 in this case.
  // The text heuristic must independently catch the bluff.
  const fooledEval = makeEval(62, [
    makeDim("conceptual_accuracy", 3.5),
    makeDim("transfer_capability", 4.0),
    makeDim("mechanistic_reasoning", 3.0),
  ]);

  it("transferBluffRiskScore >= RISK_FLAG_THRESHOLD via text heuristic", () => {
    const { score } = computeTransferBluffRisk(fooledEval, input);
    expect(score).toBeGreaterThanOrEqual(RISK_FLAG_THRESHOLD);
  });

  it("transferBluffRiskScore reaches 0.55 (calibration target)", () => {
    const { score } = computeTransferBluffRisk(fooledEval, input);
    expect(score).toBeGreaterThanOrEqual(0.55);
  });

  it("flags describe cross-domain claims without mechanism bridging", () => {
    const { flags } = computeTransferBluffRisk(fooledEval, input);
    expect(flags.some((f) => f.toLowerCase().includes("application claim"))).toBe(true);
  });

  it("overall risk exceeds RISK_FLAG_THRESHOLD even when evaluator was fooled", () => {
    const { overallAdversarialRiskScore } = detectAdversarialRisk(input, fooledEval);
    expect(overallAdversarialRiskScore).toBeGreaterThanOrEqual(RISK_FLAG_THRESHOLD);
  });

  it("text heuristic fires without evaluation object", () => {
    const noEval = makeEval(0, []);
    const { score } = computeTransferBluffRisk(noEval, input);
    expect(score).toBeGreaterThanOrEqual(0.55);
  });
});

// ---------------------------------------------------------------------------
// vague_intellectual_sounding (Metacognition)
// Dense academic vocabulary with no causal connectors and no concrete claims
// → vagueJargonRiskScore should reach HIGH_RISK_THRESHOLD.
// ---------------------------------------------------------------------------

describe("vague_intellectual_sounding — Metacognition", () => {
  const input: InputForDetection = {
    concept: "Metacognition",
    sourceText: METACOGNITION_SOURCE,
    userExplanation: METACOGNITION_JARGON_EXPLANATION,
    confidence: 3,
  };

  const fooledEval = makeEval(45, [
    makeDim("conceptual_accuracy", 2.5),
    makeDim("mechanistic_reasoning", 1.5),
    makeDim("abstraction_compression", 2.0),
  ]);

  it("vagueJargonRiskScore >= RISK_FLAG_THRESHOLD", () => {
    const { score } = computeVagueJargonRisk(input, fooledEval);
    expect(score).toBeGreaterThanOrEqual(RISK_FLAG_THRESHOLD);
  });

  it("vagueJargonRiskScore reaches HIGH_RISK_THRESHOLD with low mechanistic score", () => {
    const { score } = computeVagueJargonRisk(input, fooledEval);
    expect(score).toBeGreaterThanOrEqual(HIGH_RISK_THRESHOLD);
  });

  it("flags list the dense abstract vocabulary", () => {
    const { flags } = computeVagueJargonRisk(input, fooledEval);
    expect(flags.some((f) => f.toLowerCase().includes("abstract vocabulary"))).toBe(true);
  });

  it("overall risk exceeds HIGH_RISK_THRESHOLD", () => {
    const { overallAdversarialRiskScore } = detectAdversarialRisk(input, fooledEval);
    expect(overallAdversarialRiskScore).toBeGreaterThanOrEqual(HIGH_RISK_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// causally_inverted (Confirmation Bias)
// Sequential framing ("first...then", "only activates after") for a process
// that is actually automatic → causalInversionRiskScore above RISK_FLAG_THRESHOLD.
// ---------------------------------------------------------------------------

describe("causally_inverted — Confirmation Bias", () => {
  const input: InputForDetection = {
    concept: "Confirmation Bias",
    sourceText: CONFIRMATION_BIAS_SOURCE,
    userExplanation: CONFIRMATION_BIAS_INVERTED_EXPLANATION,
    confidence: 3,
  };

  // Evaluator partially caught the inversion (low mechanistic) but
  // retained some conceptual accuracy score.
  const partiallyFooledEval = makeEval(42, [
    makeDim("conceptual_accuracy", 3.0),
    makeDim("mechanistic_reasoning", 2.0),
  ]);

  it("causalInversionRiskScore exceeds RISK_FLAG_THRESHOLD", () => {
    const { score } = computeCausalInversionRisk(input, partiallyFooledEval);
    expect(score).toBeGreaterThanOrEqual(RISK_FLAG_THRESHOLD);
  });

  it("flags describe sequential framing", () => {
    const { flags } = computeCausalInversionRisk(input, partiallyFooledEval);
    expect(flags.some((f) => f.toLowerCase().includes("sequential"))).toBe(true);
  });

  it("flags describe conceptual–mechanistic gap", () => {
    const { flags } = computeCausalInversionRisk(input, partiallyFooledEval);
    expect(flags.some((f) => f.toLowerCase().includes("causal inversion"))).toBe(true);
  });

  it("overall risk exceeds RISK_FLAG_THRESHOLD", () => {
    const { overallAdversarialRiskScore } = detectAdversarialRisk(input, partiallyFooledEval);
    expect(overallAdversarialRiskScore).toBeGreaterThanOrEqual(RISK_FLAG_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// Clean case (Goodhart's Law)
// A genuine explanation should produce very low risk across all subscores.
// ---------------------------------------------------------------------------

describe("clean case — Goodhart's Law", () => {
  const input: InputForDetection = {
    concept: "Goodhart's Law",
    sourceText: GOODHARTS_SOURCE,
    userExplanation: GOODHARTS_GENUINE_EXPLANATION,
    confidence: 3,
  };

  const cleanEval = makeEval(68, [
    makeDim("conceptual_accuracy", 4.0, [
      "Correctly identifies that optimization for the metric distorts its validity",
      "Notes that behavior shifts toward the number, not the underlying goal",
    ]),
    makeDim("mechanistic_reasoning", 3.5, [
      "Explains the feedback loop: once a metric is targeted, agents optimize it directly",
    ]),
  ]);

  it("overallAdversarialRiskScore is well below RISK_FLAG_THRESHOLD", () => {
    const { overallAdversarialRiskScore } = detectAdversarialRisk(input, cleanEval);
    expect(overallAdversarialRiskScore).toBeLessThan(RISK_FLAG_THRESHOLD);
  });

  it("no individual subcore reaches RISK_FLAG_THRESHOLD", () => {
    const result = detectAdversarialRisk(input, cleanEval);
    expect(result.fluencyRiskScore).toBeLessThan(RISK_FLAG_THRESHOLD);
    expect(result.paraphraseRiskScore).toBeLessThan(RISK_FLAG_THRESHOLD);
    expect(result.hallucinationRiskScore).toBeLessThan(RISK_FLAG_THRESHOLD);
    expect(result.transferBluffRiskScore).toBeLessThan(RISK_FLAG_THRESHOLD);
    expect(result.vagueJargonRiskScore).toBeLessThan(RISK_FLAG_THRESHOLD);
    expect(result.causalInversionRiskScore).toBeLessThan(RISK_FLAG_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// Threshold semantics — structural guarantees
// ---------------------------------------------------------------------------

describe("threshold semantics", () => {
  it("overallAdversarialRiskScore equals max(subscores)", () => {
    const input: InputForDetection = {
      concept: "Retrieval-Induced Forgetting",
      sourceText: RIF_SOURCE,
      userExplanation: RIF_ADVERSARIAL_EXPLANATION,
      confidence: 3,
    };
    const eval_ = makeEval(58, [
      makeDim("conceptual_accuracy", 3.5),
      makeDim("mechanistic_reasoning", 2.0),
    ]);
    const result = detectAdversarialRisk(input, eval_);
    const maxSubcore = Math.max(
      result.fluencyRiskScore,
      result.paraphraseRiskScore,
      result.hallucinationRiskScore,
      result.transferBluffRiskScore,
      result.vagueJargonRiskScore,
      result.causalInversionRiskScore
    );
    expect(result.overallAdversarialRiskScore).toBeCloseTo(maxSubcore, 3);
  });

  it("any score above HIGH_RISK_THRESHOLD is also above RISK_FLAG_THRESHOLD", () => {
    expect(HIGH_RISK_THRESHOLD).toBeGreaterThan(RISK_FLAG_THRESHOLD);
  });

  it("DECEPTION_CAUGHT_THRESHOLD of 0.30 sits clearly below RISK_FLAG_THRESHOLD gap", () => {
    // Evaluator's own catch threshold is separate from the detector's flag threshold.
    // A caught deception (score < 0.30) does not depend on adversarial detector output.
    expect(DECEPTION_CAUGHT_THRESHOLD).toBeLessThan(RISK_FLAG_THRESHOLD);
  });

  it("pressure test is recommended when top subcore >= 0.30", () => {
    const input: InputForDetection = {
      concept: "Metacognition",
      sourceText: METACOGNITION_SOURCE,
      userExplanation: METACOGNITION_JARGON_EXPLANATION,
      confidence: 3,
    };
    const eval_ = makeEval(45, [makeDim("mechanistic_reasoning", 1.5)]);
    const { recommendedPressureTest } = detectAdversarialRisk(input, eval_);
    expect(recommendedPressureTest).not.toContain("No specific risk flagged");
  });
});
