import type { RubricDimension } from "@/lib/evaluation/rubric";

export type EvaluationMode = "quick" | "full";

export type BenchmarkCategory =
  | "strong_understanding"
  | "surface_paraphrase"
  | "confident_but_wrong"
  | "good_recall_weak_transfer";

export type BenchmarkCase = {
  category: BenchmarkCategory;
  reason: string;
  concept: string;
  sourceMaterial: string;
  userExplanation: string;
  confidence: number;
  evaluationMode: EvaluationMode;
  expectedCharacteristics: {
    shouldScoreHighOn: RubricDimension[];
    shouldScoreLowOn: RubricDimension[];
    expectedOverallRange: [number, number];
  };
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
];
