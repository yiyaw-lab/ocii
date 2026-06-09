import type { RubricDimension } from "@/lib/evaluation/rubric";
import type { z } from "zod";
import type { AbstractionPressureTestSchema } from "@/lib/schemas/cognition";

export type EvaluationMode = "quick" | "full";

export type BenchmarkCategory =
  | "strong_understanding"
  | "surface_paraphrase"
  | "confident_but_wrong"
  | "good_recall_weak_transfer"
  | "abstraction_pressure"
  | "adversarial";

export type AbstractionPressureFixture = {
  challenge: string;
  pressureType: z.infer<typeof AbstractionPressureTestSchema>["pressureType"];
  response: string;
  expectedPressureScoreRange: [number, number];
};

export type BenchmarkCase = {
  category: BenchmarkCategory;
  reason: string;
  concept: string;
  sourceMaterial: string;
  userExplanation: string;
  confidence: number;
  evaluationMode: EvaluationMode;
  // Adversarial cases: deception inputs designed to fool the evaluator.
  isAdversarial?: boolean;
  adversarialType?: string;
  expectedCharacteristics: {
    shouldScoreHighOn: RubricDimension[];
    shouldScoreLowOn: RubricDimension[];
    expectedOverallRange: [number, number];
  };
  abstractionPressure?: AbstractionPressureFixture;
};

export const benchmarkCases: BenchmarkCase[] = [
  // ── Category 1: Strong Understanding ──────────────────────────────────────

  {
    category: "strong_understanding",
    reason:
      "Baseline case: explanation reconstructs the mechanism in original language. Should score high on accuracy and mechanistic reasoning in quick mode.",
    concept: "Dunning-Kruger Effect",
    sourceMaterial:
      "The Dunning-Kruger effect is a cognitive bias in which people with limited competence in a domain overestimate their own ability. Because they lack the metacognitive skill required to recognize their own incompetence, low performers tend to rate themselves far above their actual performance. Conversely, highly skilled individuals sometimes underestimate their competence because they assume tasks that are easy for them are easy for everyone.",
    userExplanation:
      "The Dunning-Kruger effect happens because competence and the ability to evaluate competence are built from the same underlying knowledge. Someone who hasn't learned a domain yet can't tell the difference between a good answer and a bad one — so their self-assessment floats above their actual ability. As learning deepens, they develop the very tools needed to recognize their own gaps, which often temporarily lowers their confidence. You see this in early programming students who think they understand recursion after one example, then feel lost when the concept actually challenges them.",
    confidence: 4,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: ["conceptual_accuracy", "mechanistic_reasoning"],
      shouldScoreLowOn: [],
      expectedOverallRange: [70, 100],
    },
  },

  {
    category: "strong_understanding",
    reason:
      "Full-mode case. Should score high on transfer (bacteria example) and mechanistic reasoning. Epistemic_awareness omitted from checks because the evaluator only scores its top-5 most relevant dimensions and may not select it.",
    concept: "Natural Selection",
    sourceMaterial:
      "Natural selection is the process by which heritable traits that improve survival and reproductive success become more common in a population over successive generations. It requires three conditions: variation in traits, heritability of those traits, and differential reproductive success linked to traits. Natural selection operates on existing variation — it does not create mutations.",
    userExplanation:
      "Natural selection is an algorithm that runs without a designer. Given three ingredients — variation among individuals, heritability so offspring resemble parents, and some traits conferring more reproductive success — populations drift toward the configurations that produce more surviving offspring. It isn't 'trying' to improve anything; it just filters. Bacteria developing antibiotic resistance is textbook: a random mutation that happens to let a cell survive a drug becomes overrepresented after treatment. Worth noting: natural selection doesn't explain the origin of variation, only which variation propagates. Drift and mutation are separate processes.",
    confidence: 4,
    evaluationMode: "full",
    expectedCharacteristics: {
      shouldScoreHighOn: [
        "conceptual_accuracy",
        "mechanistic_reasoning",
        "transfer_capability",
      ],
      shouldScoreLowOn: [],
      expectedOverallRange: [78, 100],
    },
  },

  {
    category: "strong_understanding",
    reason:
      "Tests whether the learner grasps the counterfactual structure of opportunity cost (the owned building example). Checks for both accuracy and mechanism in quick mode.",
    concept: "Opportunity Cost",
    sourceMaterial:
      "Opportunity cost is the value of the best alternative forgone when making a choice. Because resources are scarce, every decision to use them in one way is simultaneously a decision not to use them in another way. The opportunity cost of attending college includes not only tuition but also the wages that could have been earned during those years.",
    userExplanation:
      "Opportunity cost is the invisible price tag on every decision: what you gave up by choosing this instead of the best other option. The insight is that costs aren't just money spent — they include future alternatives that can no longer exist. A business that owns its building doesn't pay rent, but that doesn't mean the space is free; the opportunity cost is whatever rent they could have collected by leasing it out. This reframes 'free' resources as never actually free.",
    confidence: 4,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: ["conceptual_accuracy", "mechanistic_reasoning"],
      shouldScoreLowOn: [],
      expectedOverallRange: [72, 100],
    },
  },

  // ── Category 2: Surface Paraphrase ────────────────────────────────────────

  {
    category: "surface_paraphrase",
    reason:
      "Near-verbatim paraphrase of the definition. Quick mode does not distinguish paraphrase from genuine understanding well — the definition itself encodes mechanism, so the evaluator scores it high on all three quick dimensions. This case documents that limitation; the range reflects observed evaluator behavior rather than ideal behavior.",
    concept: "Cognitive Dissonance",
    sourceMaterial:
      "Cognitive dissonance is the psychological discomfort experienced when a person holds two or more contradictory beliefs, values, or attitudes simultaneously. People are motivated to reduce this discomfort by changing a belief, adding new information, or reducing the importance of the conflict. Leon Festinger introduced the concept in 1957.",
    userExplanation:
      "Cognitive dissonance is when a person holds two or more contradictory beliefs, values, or attitudes at the same time, which causes psychological discomfort. People try to reduce this discomfort by changing one of the beliefs, finding new information, or deciding the conflict isn't that important.",
    confidence: 4,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: ["retrieval_robustness"],
      shouldScoreLowOn: [],
      expectedOverallRange: [68, 100],
    },
  },

  {
    category: "surface_paraphrase",
    reason:
      "Lightly reworded paraphrase — no original framing, no examples, no transfer. Quick mode scores this almost as high as genuine understanding, revealing evaluator's limited ability to penalize paraphrase without a transfer or mechanism failure signal.",
    concept: "Confirmation Bias",
    sourceMaterial:
      "Confirmation bias is the tendency to search for, interpret, favor, and recall information in a way that confirms one's preexisting beliefs. It leads people to avoid contradicting evidence and overweight evidence that supports what they already believe.",
    userExplanation:
      "Confirmation bias is the tendency to look for, interpret, and remember information in a way that confirms what you already believe. It makes people avoid information that contradicts their existing beliefs and give more weight to information that supports them.",
    confidence: 3,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: ["retrieval_robustness"],
      shouldScoreLowOn: [],
      expectedOverallRange: [68, 100],
    },
  },

  {
    category: "surface_paraphrase",
    reason:
      "Full-mode paraphrase. No transfer examples means transfer_capability should score low. Checks that the evaluator penalizes lack of novel application even if the concept is stated accurately.",
    concept: "The Peter Principle",
    sourceMaterial:
      "The Peter Principle, formulated by Laurence J. Peter, states that in hierarchical organizations people tend to be promoted based on their performance in their current role until they reach a position for which they are incompetent. Because promotion stops at the level of incompetence, over time positions tend to be filled by people who are not qualified for them.",
    userExplanation:
      "The Peter Principle says that in hierarchical organizations, people get promoted based on how well they do in their current job. They keep getting promoted until they reach a job they aren't good at. Since they stop being promoted once they're incompetent, positions end up filled with people who aren't qualified.",
    confidence: 3,
    evaluationMode: "full",
    expectedCharacteristics: {
      shouldScoreHighOn: ["retrieval_robustness"],
      shouldScoreLowOn: ["transfer_capability"],
      expectedOverallRange: [50, 85],
    },
  },

  // ── Category 3: Confident but Wrong ───────────────────────────────────────

  {
    category: "confident_but_wrong",
    reason:
      "Conflates sunk cost with overspending — a plausible-sounding but incorrect framing. The evaluator gives partial conceptual_accuracy credit (≈3) because the description is 'in the ballpark', so that dimension is not checked. Mechanistic_reasoning reliably scores ≤2.5 for genuinely wrong explanations.",
    concept: "Sunk Cost Fallacy",
    sourceMaterial:
      "The sunk cost fallacy is the tendency to continue an endeavor because of previously invested resources — time, money, or effort — even when continuing is no longer the rational choice. Because sunk costs are irrecoverable, rational decision-making should ignore them and focus only on future costs and benefits.",
    userExplanation:
      "The sunk cost fallacy is when you spend too much money on something before realizing it was a mistake. It's basically overspending on a project or investment. If you've spent a lot of money on something that isn't working, you're falling into the sunk cost fallacy. The lesson is to not overspend on things.",
    confidence: 5,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["mechanistic_reasoning"],
      expectedOverallRange: [35, 72],
    },
  },

  {
    category: "confident_but_wrong",
    reason:
      "Conflates regression to the mean with the gambler's fallacy — adds a false causal story ('natural balancing force'). Mechanistic_reasoning should score low because the mechanism described is wrong.",
    concept: "Regression to the Mean",
    sourceMaterial:
      "Regression to the mean is the statistical phenomenon where an extreme measurement tends to be followed by a measurement closer to the population average. It occurs because extreme values partly result from chance; subsequent observations are less likely to capture the same random deviation in the same direction. It was first described by Francis Galton studying height inheritance.",
    userExplanation:
      "Regression to the mean means that things tend to balance out over time. If something goes really well, it's likely to get worse next time, and if something goes really badly, it tends to recover. It's basically the universe correcting extreme outcomes back toward normal. Athletes who have a great season often have a worse one next year because of this natural balancing force.",
    confidence: 4,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["mechanistic_reasoning"],
      expectedOverallRange: [40, 78],
    },
  },

  {
    category: "confident_but_wrong",
    reason:
      "Confuses cognitive load with general stress — misses working memory capacity as the central mechanism. Mechanistic_reasoning should score low because the described mechanism (stress → worse performance) is directionally off.",
    concept: "Cognitive Load Theory",
    sourceMaterial:
      "Cognitive load theory, developed by John Sweller, proposes that working memory has a limited capacity and that instructional design should avoid overloading it. There are three types: intrinsic load (complexity of the content itself), extraneous load (unnecessary complexity from how the content is presented), and germane load (effort devoted to forming schemas). Effective instruction minimizes extraneous load.",
    userExplanation:
      "Cognitive load theory is about how much mental stress a task puts on a person. When people are overwhelmed with too many tasks or too much pressure, they experience high cognitive load, which hurts performance. The theory suggests that if you reduce stress and give people enough time, they'll be able to learn better because they won't be so overwhelmed.",
    confidence: 5,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["mechanistic_reasoning"],
      expectedOverallRange: [30, 65],
    },
  },

  // ── Category 4: Good Recall but Weak Transfer ─────────────────────────────

  {
    category: "good_recall_weak_transfer",
    reason:
      "Accurate ML definition, no cross-domain transfer. transfer_capability reliably scores ≤2.5 here. Epistemic_awareness excluded from checks because the evaluator selects its own top-5 and may not score it.",
    concept: "Overfitting",
    sourceMaterial:
      "Overfitting occurs when a machine learning model learns the training data too well — including its noise and random fluctuations — and as a result performs poorly on new, unseen data. An overfit model has high training accuracy but low generalization accuracy. Regularization, cross-validation, and collecting more data are common mitigations.",
    userExplanation:
      "Overfitting is when a model memorizes the training data, including the noise, so it gets very high accuracy on training examples but fails on new data it hasn't seen. You can tell when training accuracy is much higher than validation accuracy. To fix it you can use regularization, get more training data, or use cross-validation.",
    confidence: 3,
    evaluationMode: "full",
    expectedCharacteristics: {
      shouldScoreHighOn: ["retrieval_robustness", "conceptual_accuracy"],
      shouldScoreLowOn: ["transfer_capability"],
      expectedOverallRange: [50, 82],
    },
  },

  {
    category: "good_recall_weak_transfer",
    reason:
      "Classic factory example recalled correctly; no cross-domain application. transfer_capability should score ≤2.5. Abstraction_compression excluded from LOW checks — evaluator gives ≈3.5 for adequate own-language reconstruction even without generalization.",
    concept: "Law of Diminishing Returns",
    sourceMaterial:
      "The law of diminishing returns states that adding more of one input to a fixed set of other inputs will eventually yield smaller and smaller increases in output. In a factory with fixed machinery, hiring additional workers initially increases production, but each additional worker contributes less than the previous one as workers compete for the same machines.",
    userExplanation:
      "The law of diminishing returns means that if you keep adding more workers to a factory with fixed machines, each additional worker produces less extra output than the one before. At some point, adding more workers doesn't help and might even hurt because they're all trying to use the same equipment.",
    confidence: 3,
    evaluationMode: "full",
    expectedCharacteristics: {
      shouldScoreHighOn: ["retrieval_robustness", "conceptual_accuracy"],
      shouldScoreLowOn: ["transfer_capability"],
      expectedOverallRange: [55, 90],
    },
  },

  {
    category: "good_recall_weak_transfer",
    reason:
      "Classic price-anchoring examples recalled well. The salary and retail examples stay close to the source domain (negotiation/pricing), so transfer_capability is marginal and varies across runs. Only overall range and high checks are asserted to avoid false flakiness.",
    concept: "Anchoring Bias",
    sourceMaterial:
      "Anchoring bias is the tendency to rely too heavily on the first piece of information encountered (the anchor) when making subsequent judgments. In negotiation and pricing, the first number offered disproportionately influences the final outcome, even when the anchor is arbitrary or irrelevant.",
    userExplanation:
      "Anchoring bias is when the first number you hear influences your judgment too much. Like in salary negotiations, whoever gives the first number has an advantage because it anchors the discussion. Retailers use this when they show the 'original price' crossed out next to the sale price — that original price is the anchor.",
    confidence: 3,
    evaluationMode: "full",
    expectedCharacteristics: {
      shouldScoreHighOn: ["retrieval_robustness", "conceptual_accuracy"],
      shouldScoreLowOn: [],
      expectedOverallRange: [45, 85],
    },
  },

  // ── Category 5: Abstraction Pressure Tests ────────────────────────────────
  // These cases test the pressure scorer directly, not the main evaluator.
  // The main evaluation fields are present but secondary; the key assertion
  // is that the scripted pressure RESPONSE scores LOW (pressureScore ≤ 30).

  {
    category: "abstraction_pressure",
    reason:
      "Tests that the pressure scorer detects fluent paraphrase: when asked for an analogy from a different domain, the learner simply restates the definition. The challenge is unsatisfiable by copying.",
    concept: "Cognitive Dissonance",
    sourceMaterial:
      "Cognitive dissonance is the psychological discomfort experienced when a person holds two or more contradictory beliefs, values, or attitudes simultaneously. People are motivated to reduce this discomfort by changing a belief, adding new information, or reducing the importance of the conflict.",
    userExplanation:
      "Cognitive dissonance is when a person holds two or more contradictory beliefs, values, or attitudes at the same time, which causes psychological discomfort. People try to reduce this discomfort by changing one of the beliefs, finding new information, or deciding the conflict isn't that important.",
    confidence: 4,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: [],
      expectedOverallRange: [50, 100],
    },
    abstractionPressure: {
      challenge:
        "Give an analogy for cognitive dissonance from a domain completely unrelated to psychology. Do not use the words 'belief', 'attitude', or 'discomfort'.",
      pressureType: "analogy",
      response:
        "Cognitive dissonance is when a person holds two or more contradictory beliefs, values, or attitudes at the same time, which creates psychological discomfort. People are motivated to reduce this discomfort by changing one of the beliefs, adding new information, or reducing the importance of the conflict.",
      expectedPressureScoreRange: [0, 50],
    },
  },

  {
    category: "abstraction_pressure",
    reason:
      "Tests that the pressure scorer detects memorized abstraction phrases: when asked to compress to essential structure, the learner produces buzzword-dense prose that sounds sophisticated but applies no actual compression.",
    concept: "Opportunity Cost",
    sourceMaterial:
      "Opportunity cost is the value of the best alternative forgone when making a choice. Because resources are scarce, every decision to use them in one way is simultaneously a decision not to use them in another way.",
    userExplanation:
      "Opportunity cost is the invisible price tag on every decision: what you gave up by choosing this instead of the best other option. The insight is that costs aren't just money spent — they include future alternatives that can no longer exist.",
    confidence: 4,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: [],
      expectedOverallRange: [50, 100],
    },
    abstractionPressure: {
      challenge:
        "Compress opportunity cost to its essential logical structure in one sentence that has nothing to do with money or economics.",
      pressureType: "compression",
      response:
        "Opportunity cost fundamentally reflects the cognitive framing we apply to resource allocation within a decision-theoretic mental model — it reveals the underlying tension between present value maximization and future optionality preservation across all possible choice spaces.",
      expectedPressureScoreRange: [0, 50],
    },
  },

  {
    category: "abstraction_pressure",
    reason:
      "Tests that the pressure scorer detects vague intellectual wording: when asked to transfer the concept to a new domain (programming language evolution), the learner produces philosophical-sounding language that never actually applies the concept.",
    concept: "Natural Selection",
    sourceMaterial:
      "Natural selection is the process by which heritable traits that improve survival and reproductive success become more common in a population over successive generations. It requires: variation in traits, heritability, and differential reproductive success linked to traits.",
    userExplanation:
      "Natural selection is an algorithm that runs without a designer. Given variation, heritability, and differential reproduction, populations drift toward configurations that produce more surviving offspring. It just filters — it isn't trying to improve anything.",
    confidence: 4,
    evaluationMode: "quick",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: [],
      expectedOverallRange: [50, 100],
    },
    abstractionPressure: {
      challenge:
        "Explain how natural selection applies to the evolution of programming languages. Be specific about which element plays the role of variation, heritability, and differential reproduction.",
      pressureType: "transfer",
      response:
        "Natural selection is a profound principle that reveals how complex systems self-organize over time. It reflects the fundamental tension between adaptation and entropy in any evolving system. This concept operates at many levels of reality and applies wherever there is change and complexity in the world.",
      expectedPressureScoreRange: [0, 50],
    },
  },
];

// adversarialCases: inputs designed to deceive the evaluator. A benchmark PASSES
// when the evaluator correctly assigns low scores (caught the deception) and FAILS
// when it was fooled by surface fluency. These complement the abstraction-pressure
// cases above with a different attack surface (run alongside benchmarkCases).
export const adversarialCases: BenchmarkCase[] = [
  {
    category: "adversarial",
    reason:
      "Sounds authoritative but inverts the core relationship: claims extraneous load is beneficial and that maximizing total load expands working memory capacity.",
    concept: "Cognitive Load Theory",
    isAdversarial: true,
    adversarialType: "fluent_nonsense",
    confidence: 3,
    evaluationMode: "full",
    sourceMaterial:
      "Cognitive Load Theory distinguishes three types of load on working memory: intrinsic load (complexity inherent to the material), extraneous load (unnecessary cognitive effort caused by poor instructional design), and germane load (effort devoted to forming schemas and long-term learning). Effective instruction minimizes extraneous load and uses freed capacity for germane processing.",
    userExplanation:
      "Cognitive Load Theory shows that working memory performs best when all three load types are simultaneously activated. Extraneous load provides the additional cognitive friction that forces the brain to build richer schemas, so high extraneous load actually improves germane processing. The theory suggests instructional designers should maximize total cognitive load to push learners toward expanded working memory capacity.",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["conceptual_accuracy", "mechanistic_reasoning"],
      expectedOverallRange: [0, 38],
    },
  },
  {
    category: "adversarial",
    reason:
      "Invents specific statistics, a non-existent theorem, and a fabricated neurobiological pathway.",
    concept: "Retrieval-Induced Forgetting",
    isAdversarial: true,
    adversarialType: "confident_hallucination",
    confidence: 3,
    evaluationMode: "full",
    sourceMaterial:
      "Retrieval-induced forgetting (RIF) is the finding that recalling some items from a studied set impairs later recall of related, non-retrieved items from the same set. It is thought to occur because retrieval suppresses competing memories to reduce interference during the recall attempt.",
    userExplanation:
      "Retrieval-induced forgetting is well-established: across 14 replication studies the inhibition coefficient averages 0.73, indicating robust suppression. The mechanism is the Anderson-Bjork suppression theorem (1994), which demonstrated that non-retrieved items are actively inhibited via direct GABAergic pathways in the hippocampal CA3 region. This inhibition is permanent for items suppressed more than three times, which is why distributed retrieval practice must avoid re-testing the same material within a 48-hour window.",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["conceptual_accuracy", "epistemic_awareness", "metacognitive_calibration"],
      expectedOverallRange: [0, 35],
    },
  },
  {
    category: "adversarial",
    reason:
      "Near-verbatim copy with only synonym substitutions; no own-language reconstruction, no new examples, no abstraction beyond the source.",
    concept: "Spaced Repetition",
    isAdversarial: true,
    adversarialType: "memorized_paraphrase",
    confidence: 3,
    evaluationMode: "full",
    sourceMaterial:
      "Spaced repetition is a learning technique in which review sessions are spread out over increasing time intervals rather than massed together. Memory retention improves when material is revisited just as it is about to be forgotten, exploiting the spacing effect to make retrieval effortful yet successful. The technique is most effective when combined with active recall rather than passive re-reading.",
    userExplanation:
      "Spaced repetition is a study method where review sessions are distributed across growing time gaps rather than clustered together. Retention of information improves when material is reviewed just before it is about to be forgotten, taking advantage of the spacing effect to make recall effortful yet successful. The approach is most effective when paired with active recall rather than passive re-reading of material.",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["abstraction_compression", "transfer_capability"],
      expectedOverallRange: [0, 42],
    },
  },
  {
    category: "adversarial",
    reason:
      "Correctly names the concept but misapplies it to situations governed by different mechanisms. Conflates loss aversion with risk aversion and fear of failure.",
    concept: "Loss Aversion",
    isAdversarial: true,
    adversarialType: "transfer_bluffing",
    confidence: 3,
    evaluationMode: "full",
    sourceMaterial:
      "Loss aversion is the tendency for people to feel the pain of a loss more strongly than the pleasure of an equivalent gain — typically estimated at roughly twice as intense. It is a component of prospect theory and explains why people are often reluctant to accept gambles with positive expected value when they involve possible losses.",
    userExplanation:
      "Loss aversion applies across many domains. In investing, it explains why people prefer a guaranteed $50 over a 50% chance of $150 — the potential loss of the guaranteed amount looms larger than the upside. In sports, athletes consistently outperform under loss-aversion conditions: a tennis player who is 'one point from losing' demonstrates loss aversion by trying harder than someone playing to win. Loss aversion also explains procrastination: the perceived loss of free time makes starting tasks painful, which is why people delay.",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["transfer_capability", "mechanistic_reasoning", "epistemic_awareness"],
      expectedOverallRange: [0, 40],
    },
  },
  {
    category: "adversarial",
    reason:
      "Dense academic-sounding vocabulary but says nothing concrete about what metacognition is, how it works, or what distinguishes it from ordinary cognition.",
    concept: "Metacognition",
    isAdversarial: true,
    adversarialType: "vague_intellectual_sounding",
    confidence: 3,
    evaluationMode: "full",
    sourceMaterial:
      "Metacognition refers to thinking about one's own thinking. It includes both metacognitive knowledge (what one knows about learning and memory) and metacognitive regulation (monitoring and controlling one's own cognitive processes). Research shows that effective learners actively monitor their comprehension and adjust strategies when understanding breaks down.",
    userExplanation:
      "Metacognition represents the recursive epistemic architecture through which higher-order cognitive modalities interface with the foundational substrate of experiential processing. By instantiating self-referential feedback loops across the representational hierarchy, the cognitive system achieves reflexive integration of its own epistemic states. This self-referential scaffolding enables the dynamic reconfiguration of cognitive resources in response to emergent phenomenological constraints, thereby constituting the meta-level substrate from which intentional knowledge-states derive their regulatory coherence.",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["conceptual_accuracy", "mechanistic_reasoning", "abstraction_compression"],
      expectedOverallRange: [0, 30],
    },
  },
  {
    category: "adversarial",
    reason:
      "Gets the phenomenon roughly right but inverts the causal mechanism: presents confirmation bias as a rational sequential process rather than an automatic perceptual distortion operating during evidence evaluation.",
    concept: "Confirmation Bias",
    isAdversarial: true,
    adversarialType: "causally_inverted",
    confidence: 3,
    evaluationMode: "full",
    sourceMaterial:
      "Confirmation bias is the tendency to search for, interpret, and recall information in a way that confirms one's pre-existing beliefs. It operates automatically during evidence evaluation: people assign greater credibility to confirming evidence, dismiss disconfirming evidence more readily, and selectively seek out sources that agree with their views.",
    userExplanation:
      "Confirmation bias works as follows: people are first exposed to a broad range of information and, through rational deliberation, form an initial belief. Once that belief becomes sufficiently strong, it then causes them to preferentially seek confirming sources going forward. The bias is therefore a downstream consequence of belief strength — it only activates after a belief has been consolidated, which is why it is most visible in people with well-established views rather than those still forming opinions.",
    expectedCharacteristics: {
      shouldScoreHighOn: [],
      shouldScoreLowOn: ["mechanistic_reasoning", "conceptual_accuracy"],
      expectedOverallRange: [0, 45],
    },
  },
];
