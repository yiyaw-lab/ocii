export type RubricDimension =
  | "conceptual_accuracy"
  | "mechanistic_reasoning"
  | "abstraction_compression"
  | "transfer_capability"
  | "retrieval_robustness"
  | "metacognitive_calibration"
  | "epistemic_awareness";

  export type ScoreBand = number;

export interface DimensionEvaluation {
  dimension: RubricDimension;
  score: ScoreBand;
  evaluatorConfidence: "low" | "medium" | "high";
  evidence: string[];
  misconceptions: string[];
  missingNuance: string[];
  rationale: string;
  nextTestPrompt: string;
}

export interface RubricCriteria {
  dimension: RubricDimension;
  displayName: string;
  researchBasis: string;
  description: string;
  evaluationQuestions: string[];
  evidenceSignals: string[];
  failureModes: string[];
  scoringGuide: Record<ScoreBand, string>;
}

export const cognitionRubric: RubricCriteria[] = [
  {
    dimension: "conceptual_accuracy",
    displayName: "Conceptual Accuracy",
    researchBasis:
      "Grounded in learning science work on conceptual understanding, schema formation, and misconception detection.",
    description:
      "Evaluates whether the learner correctly represents the core concept without distorting its meaning.",
    evaluationQuestions: [
      "Does the explanation preserve the central meaning of the concept?",
      "Are major claims factually or conceptually correct?",
      "Are there critical misconceptions or contradictions?",
      "Does the explanation distinguish the concept from nearby ideas?"
    ],
    evidenceSignals: [
      "Correct use of core terms",
      "Preservation of key relationships",
      "Accurate distinction from adjacent concepts",
      "Absence of central misconceptions"
    ],
    failureModes: [
      "Fluent but incorrect explanation",
      "Surface paraphrase with hidden misunderstanding",
      "Confusing the concept with a related but different idea",
      "Omitting the central mechanism"
    ],
    scoringGuide: {
      0: "No meaningful understanding demonstrated.",
      1: "Major misunderstanding or severe distortion of the concept.",
      2: "Partial understanding with important inaccuracies.",
      3: "Mostly correct but incomplete or imprecise.",
      4: "Accurate and clear with only minor omissions.",
      5: "Precise, complete, and conceptually well-differentiated."
    }
  },

  {
    dimension: "mechanistic_reasoning",
    displayName: "Mechanistic / Causal Reasoning",
    researchBasis:
      "Grounded in deep learning research distinguishing surface recall from explanation of mechanisms, causes, and system dynamics.",
    description:
      "Evaluates whether the learner explains how or why the concept works rather than merely describing it.",
    evaluationQuestions: [
      "Does the explanation include cause-and-effect reasoning?",
      "Does the learner explain mechanisms rather than only outcomes?",
      "Are system dynamics or interactions represented?",
      "Can the learner explain why the concept matters?"
    ],
    evidenceSignals: [
      "Use of because, leads to, depends on, causes, constrains, enables",
      "Clear causal chains",
      "Awareness of feedback loops or system adaptation",
      "Explanation of underlying mechanism"
    ],
    failureModes: [
      "Pure definition without mechanism",
      "Listing effects without explaining why they occur",
      "Confusing correlation with causation",
      "Overly linear reasoning for a nonlinear concept"
    ],
    scoringGuide: {
      0: "No causal reasoning present.",
      1: "Mechanism is absent or incorrect.",
      2: "Some causal language but reasoning is shallow or vague.",
      3: "Basic mechanism is explained correctly.",
      4: "Strong causal explanation with clear relationships.",
      5: "Deep mechanistic reasoning with system-level insight."
    }
  },

  {
    dimension: "abstraction_compression",
    displayName: "Abstraction & Compression",
    researchBasis:
      "Grounded in transfer learning and conceptual abstraction research: durable understanding requires compression beyond surface examples.",
    description:
      "Evaluates whether the learner can generalize the idea beyond original wording and compress it into a reusable mental model.",
    evaluationQuestions: [
      "Does the learner explain the idea in their own words?",
      "Is the explanation more than a paraphrase of the source?",
      "Can the learner express the concept at a higher level of abstraction?",
      "Does the explanation become reusable across contexts?"
    ],
    evidenceSignals: [
      "Elegant simplification",
      "Own-language reconstruction",
      "General principle extracted from example",
      "Conceptual compression without losing meaning"
    ],
    failureModes: [
      "Near-copying the source text",
      "Example-bound understanding",
      "Overgeneralization that loses accuracy",
      "Vague abstraction without explanatory power"
    ],
    scoringGuide: {
      0: "No abstraction; response is empty or irrelevant.",
      1: "Mostly copied or memorized wording.",
      2: "Some paraphrase but still surface-bound.",
      3: "Adequate own-language reconstruction.",
      4: "Clear abstraction that preserves the concept.",
      5: "Elegant, portable mental model with high explanatory power."
    }
  },

  {
    dimension: "transfer_capability",
    displayName: "Transfer Capability",
    researchBasis:
      "Grounded in near/far transfer research: robust learning is shown by applying knowledge in new contexts.",
    description:
      "Evaluates whether the learner can apply the concept beyond the original example or domain.",
    evaluationQuestions: [
      "Can the learner apply the concept to a novel context?",
      "Can they map the underlying structure across domains?",
      "Do they recognize where the concept does and does not apply?",
      "Can they generate a valid new example?"
    ],
    evidenceSignals: [
      "New example from another domain",
      "Analogical mapping",
      "Boundary-aware application",
      "Recognition of structural similarity across contexts"
    ],
    failureModes: [
      "Only repeats the original example",
      "Applies the concept too broadly",
      "Uses an example with the wrong underlying structure",
      "Cannot distinguish near transfer from far transfer"
    ],
    scoringGuide: {
      0: "No evidence of transfer.",
      1: "Cannot apply beyond the given example.",
      2: "Attempts transfer but with weak or incorrect mapping.",
      3: "Valid near-transfer example.",
      4: "Strong transfer to a meaningfully different context.",
      5: "Flexible multi-domain transfer with boundary awareness."
    }
  },

  {
    dimension: "retrieval_robustness",
    displayName: "Retrieval Robustness",
    researchBasis:
      "Grounded in retrieval practice research: durable learning depends on reconstructing knowledge, not merely recognizing it.",
    description:
      "Evaluates whether the learner can reconstruct the concept from memory under recall pressure.",
    evaluationQuestions: [
      "Does the answer appear reconstructed rather than recognized?",
      "Is the recall complete enough to preserve the concept?",
      "Does the learner retrieve key components without source dependence?",
      "Would the answer likely remain stable after delay?"
    ],
    evidenceSignals: [
      "Coherent reconstruction from memory",
      "Key components recalled without prompting",
      "Stable structure despite different wording",
      "No obvious dependence on copied phrasing"
    ],
    failureModes: [
      "Recognition mistaken for recall",
      "Fluent but incomplete reconstruction",
      "Dependence on source wording",
      "Missing key elements under recall pressure"
    ],
    scoringGuide: {
      0: "No recall demonstrated.",
      1: "Very weak recall with major omissions.",
      2: "Partial recall but unstable or incomplete.",
      3: "Adequate reconstruction of the core idea.",
      4: "Strong recall with most key components preserved.",
      5: "Robust reconstruction likely to survive delay and variation."
    }
  },

  {
    dimension: "metacognitive_calibration",
    displayName: "Metacognitive Calibration",
    researchBasis:
      "Grounded in metacognition and calibration research: learners must accurately judge what they know and do not know.",
    description:
      "Evaluates whether the learner's confidence aligns with their demonstrated understanding.",
    evaluationQuestions: [
      "Does confidence match demonstrated competence?",
      "Is there evidence of overconfidence or underconfidence?",
      "Does the learner acknowledge uncertainty appropriately?",
      "Can the learner identify what remains unclear?"
    ],
    evidenceSignals: [
      "Confidence aligned with quality",
      "Appropriate uncertainty language",
      "Recognition of partial understanding",
      "Awareness of missing pieces"
    ],
    failureModes: [
      "High confidence with shallow understanding",
      "Low confidence despite strong demonstrated grasp",
      "No awareness of uncertainty",
      "False certainty produced by fluent wording"
    ],
    scoringGuide: {
      0: "No basis for calibration judgment.",
      1: "Severe mismatch between confidence and performance.",
      2: "Noticeable calibration gap.",
      3: "Moderately calibrated.",
      4: "Well-calibrated confidence.",
      5: "Excellent self-monitoring and uncertainty awareness."
    }
  },

  {
    dimension: "epistemic_awareness",
    displayName: "Epistemic Awareness",
    researchBasis:
      "Grounded in epistemic cognition research: mature understanding includes awareness of limits, assumptions, evidence, and context.",
    description:
      "Evaluates whether the learner understands the boundaries, assumptions, and conditions of the concept.",
    evaluationQuestions: [
      "Does the learner recognize limits or exceptions?",
      "Do they understand when the concept applies?",
      "Do they avoid absolutist or overgeneralized claims?",
      "Do they show awareness of evidence, uncertainty, or context?"
    ],
    evidenceSignals: [
      "Boundary conditions",
      "Context-sensitive language",
      "Recognition of assumptions",
      "Avoidance of overclaiming"
    ],
    failureModes: [
      "Treating the concept as universally true",
      "Ignoring context and constraints",
      "Overgeneralizing from one example",
      "Lacking awareness of uncertainty or evidence quality"
    ],
    scoringGuide: {
      0: "No epistemic awareness demonstrated.",
      1: "Rigid or absolutist understanding.",
      2: "Limited awareness of conditions or exceptions.",
      3: "Some context sensitivity.",
      4: "Clear awareness of boundaries and assumptions.",
      5: "Sophisticated epistemic judgment with nuance and restraint."
    }
  }
];

export function formatRubricForPrompt() {
  return cognitionRubric
    .map((criterion) => {
      return `
Dimension: ${criterion.displayName}
ID: ${criterion.dimension}
Description: ${criterion.description}
Evaluate:
${criterion.evaluationQuestions.map((q) => `- ${q}`).join("\n")}
Evidence signals:
${criterion.evidenceSignals.map((s) => `- ${s}`).join("\n")}
Failure modes:
${criterion.failureModes.map((f) => `- ${f}`).join("\n")}
Scoring guide:
${Object.entries(criterion.scoringGuide)
  .map(([score, guide]) => `${score}: ${guide}`)
  .join("\n")}
`;
    })
    .join("\n---\n");
}

export function formatCompactRubricForPrompt() {
    return cognitionRubric
      .map((criterion) => {
        return `
  ${criterion.dimension}: ${criterion.description}
  Score 0-5 based on: ${criterion.evaluationQuestions.join(" ")}
  `;
      })
      .join("\n");
  }

export const QUICK_DIMENSIONS: RubricDimension[] = [
  "conceptual_accuracy",
  "mechanistic_reasoning",
  "retrieval_robustness",
];

export function formatQuickRubricForPrompt() {
  return cognitionRubric
    .filter((c) => QUICK_DIMENSIONS.includes(c.dimension))
    .map((c) => `${c.dimension}: ${c.description}\nScore 0–5.`)
    .join("\n\n");
}