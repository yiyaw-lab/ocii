export type BenchmarkCase = {
  concept: string;
  sourceMaterial: string;
  userExplanation: string;
  evaluationMode?: "quick" | "full" | "ensemble";
  isAdversarial?: boolean;
  adversarialType?: string;
  expectedCharacteristics: {
    shouldScoreHighOn: string[];
    shouldScoreLowOn: string[];
    expectedOverallRange: [number, number];
  };
};

export const benchmarkCases: BenchmarkCase[] = [
  {
    concept: "Goodhart's Law",

    sourceMaterial:
      "Goodhart's Law states that when a measure becomes a target, it ceases to be a good measure. Metrics that initially reflect a valuable outcome often become distorted once people start optimizing specifically for the metric itself.",

    userExplanation:
      "Goodhart's Law means metrics stop being reliable when people optimize directly for them. The behavior shifts toward improving the number rather than preserving the original goal.",

    expectedCharacteristics: {
      shouldScoreHighOn: ["conceptual_accuracy"],
      shouldScoreLowOn: ["transfer_capability"],
      expectedOverallRange: [60, 75],
    },
  },

  {
    concept: "Goodhart's Law",
    evaluationMode: "ensemble",

    sourceMaterial:
      "Goodhart's Law states that when a measure becomes a target, it ceases to be a good measure. Metrics that initially reflect a valuable outcome often become distorted once people start optimizing specifically for the metric itself.",

    userExplanation:
      "Goodhart's Law means metrics stop being reliable when people optimize directly for them. The behavior shifts toward improving the number rather than preserving the original goal.",

    expectedCharacteristics: {
      shouldScoreHighOn: ["conceptual_accuracy"],
      shouldScoreLowOn: ["transfer_capability"],
      expectedOverallRange: [55, 80],
    },
  },
];

// adversarialCases: inputs designed to deceive the evaluator.
// A benchmark PASSES when the evaluator correctly assigns low scores (caught the deception).
// A benchmark FAILS when the evaluator was fooled by surface fluency.
export const adversarialCases: BenchmarkCase[] = [
  {
    concept: "Cognitive Load Theory",
    isAdversarial: true,
    evaluationMode: "full" as const,
    adversarialType: "fluent_nonsense",

    sourceMaterial:
      "Cognitive Load Theory distinguishes three types of load on working memory: intrinsic load (complexity inherent to the material), extraneous load (unnecessary cognitive effort caused by poor instructional design), and germane load (effort devoted to forming schemas and long-term learning). Effective instruction minimizes extraneous load and uses freed capacity for germane processing.",

    // Sounds authoritative but inverts the core relationship: claims extraneous load is beneficial
    // and that maximizing total load expands working memory capacity.
    userExplanation:
      "Cognitive Load Theory shows that working memory performs best when all three load types are simultaneously activated. Extraneous load provides the additional cognitive friction that forces the brain to build richer schemas, so high extraneous load actually improves germane processing. The theory suggests instructional designers should maximize total cognitive load to push learners toward expanded working memory capacity.",

    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["conceptual_accuracy", "mechanistic_reasoning"],
      expectedOverallRange: [0, 38],
    },
  },

  {
    concept: "Retrieval-Induced Forgetting",
    isAdversarial: true,
    evaluationMode: "full" as const,
    adversarialType: "confident_hallucination",

    sourceMaterial:
      "Retrieval-induced forgetting (RIF) is the finding that recalling some items from a studied set impairs later recall of related, non-retrieved items from the same set. It is thought to occur because retrieval suppresses competing memories to reduce interference during the recall attempt.",

    // Invents specific statistics, a non-existent theorem, and a fabricated neurobiological pathway.
    userExplanation:
      "Retrieval-induced forgetting is well-established: across 14 replication studies the inhibition coefficient averages 0.73, indicating robust suppression. The mechanism is the Anderson-Bjork suppression theorem (1994), which demonstrated that non-retrieved items are actively inhibited via direct GABAergic pathways in the hippocampal CA3 region. This inhibition is permanent for items suppressed more than three times, which is why distributed retrieval practice must avoid re-testing the same material within a 48-hour window.",

    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["conceptual_accuracy", "epistemic_awareness", "metacognitive_calibration"],
      expectedOverallRange: [0, 35],
    },
  },

  {
    concept: "Spaced Repetition",
    isAdversarial: true,
    evaluationMode: "full" as const,
    adversarialType: "memorized_paraphrase",

    sourceMaterial:
      "Spaced repetition is a learning technique in which review sessions are spread out over increasing time intervals rather than massed together. Memory retention improves when material is revisited just as it is about to be forgotten, exploiting the spacing effect to make retrieval effortful yet successful. The technique is most effective when combined with active recall rather than passive re-reading.",

    // Near-verbatim copy with only synonym substitutions; no own-language reconstruction,
    // no new examples, no abstraction beyond the source.
    userExplanation:
      "Spaced repetition is a study method where review sessions are distributed across growing time gaps rather than clustered together. Retention of information improves when material is reviewed just before it is about to be forgotten, taking advantage of the spacing effect to make recall effortful yet successful. The approach is most effective when paired with active recall rather than passive re-reading of material.",

    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["abstraction_compression", "transfer_capability"],
      expectedOverallRange: [0, 42],
    },
  },

  {
    concept: "Loss Aversion",
    isAdversarial: true,
    evaluationMode: "full" as const,
    adversarialType: "transfer_bluffing",

    sourceMaterial:
      "Loss aversion is the tendency for people to feel the pain of a loss more strongly than the pleasure of an equivalent gain — typically estimated at roughly twice as intense. It is a component of prospect theory and explains why people are often reluctant to accept gambles with positive expected value when they involve possible losses.",

    // Correctly names the concept but misapplies it to situations governed by different mechanisms.
    // Conflates loss aversion with risk aversion and fear of failure.
    userExplanation:
      "Loss aversion applies across many domains. In investing, it explains why people prefer a guaranteed $50 over a 50% chance of $150 — the potential loss of the guaranteed amount looms larger than the upside. In sports, athletes consistently outperform under loss-aversion conditions: a tennis player who is 'one point from losing' demonstrates loss aversion by trying harder than someone playing to win. Loss aversion also explains procrastination: the perceived loss of free time makes starting tasks painful, which is why people delay.",

    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["transfer_capability", "mechanistic_reasoning", "epistemic_awareness"],
      expectedOverallRange: [0, 40],
    },
  },

  {
    concept: "Metacognition",
    isAdversarial: true,
    evaluationMode: "full" as const,
    adversarialType: "vague_intellectual_sounding",

    sourceMaterial:
      "Metacognition refers to thinking about one's own thinking. It includes both metacognitive knowledge (what one knows about learning and memory) and metacognitive regulation (monitoring and controlling one's own cognitive processes). Research shows that effective learners actively monitor their comprehension and adjust strategies when understanding breaks down.",

    // Dense academic-sounding vocabulary but says nothing concrete about what metacognition is,
    // how it works, or what distinguishes it from ordinary cognition.
    userExplanation:
      "Metacognition represents the recursive epistemic architecture through which higher-order cognitive modalities interface with the foundational substrate of experiential processing. By instantiating self-referential feedback loops across the representational hierarchy, the cognitive system achieves reflexive integration of its own epistemic states. This self-referential scaffolding enables the dynamic reconfiguration of cognitive resources in response to emergent phenomenological constraints, thereby constituting the meta-level substrate from which intentional knowledge-states derive their regulatory coherence.",

    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["conceptual_accuracy", "mechanistic_reasoning", "abstraction_compression"],
      expectedOverallRange: [0, 30],
    },
  },

  {
    concept: "Confirmation Bias",
    isAdversarial: true,
    evaluationMode: "full" as const,
    adversarialType: "causally_inverted",

    sourceMaterial:
      "Confirmation bias is the tendency to search for, interpret, and recall information in a way that confirms one's pre-existing beliefs. It operates automatically during evidence evaluation: people assign greater credibility to confirming evidence, dismiss disconfirming evidence more readily, and selectively seek out sources that agree with their views.",

    // Gets the phenomenon roughly right but inverts the causal mechanism: presents confirmation
    // bias as a rational sequential process (neutral evidence → strong belief → then search becomes
    // biased) rather than an automatic perceptual distortion operating during evidence evaluation.
    userExplanation:
      "Confirmation bias works as follows: people are first exposed to a broad range of information and, through rational deliberation, form an initial belief. Once that belief becomes sufficiently strong, it then causes them to preferentially seek confirming sources going forward. The bias is therefore a downstream consequence of belief strength — it only activates after a belief has been consolidated, which is why it is most visible in people with well-established views rather than those still forming opinions.",

    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["mechanistic_reasoning", "conceptual_accuracy"],
      expectedOverallRange: [0, 45],
    },
  },
];
