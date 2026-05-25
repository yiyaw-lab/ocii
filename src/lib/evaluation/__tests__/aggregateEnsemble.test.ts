import { describe, it, expect } from "vitest";
import { aggregateEnsemble } from "@/lib/evaluation/aggregateEnsemble";

const makeDim = (
  dimension: string,
  score: number,
  confidence: "low" | "medium" | "high" = "medium"
) => ({
  dimension,
  score,
  evaluatorConfidence: confidence,
  evidence: ["e"],
  misconceptions: [],
  missingNuance: [],
  rationale: "r",
  nextTestPrompt: "np",
});

const makeEval = (
  dims: ReturnType<typeof makeDim>[],
  overall = 60,
  summaryOverride?: Partial<{
    strongestDimension: string;
    weakestDimension: string;
    calibrationAssessment: string;
    overallFeedback: string;
    nextLearningStep: string;
  }>
) => ({
  dimensionEvaluations: dims,
  overallUnderstandingScore: overall,
  relatedConcepts: ["concept_a"],
  summary: {
    strongestDimension: "conceptual_accuracy",
    weakestDimension: "transfer_capability",
    calibrationAssessment: "ok",
    overallFeedback: "good",
    nextLearningStep: "study more",
    ...summaryOverride,
  },
});

describe("aggregateEnsemble", () => {
  it("throws on empty input", () => {
    expect(() => aggregateEnsemble([])).toThrow();
  });

  it("returns the single evaluation unchanged in structure for a single input", () => {
    const e = makeEval([makeDim("conceptual_accuracy", 4)], 80);
    const result = aggregateEnsemble([e]);
    expect(result.dimensionEvaluations).toHaveLength(1);
    expect(result.dimensionEvaluations[0].dimension).toBe("conceptual_accuracy");
    expect(result.dimensionEvaluations[0].score).toBe(4);
  });

  it("averages scores across evaluators", () => {
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 2)]),
      makeEval([makeDim("conceptual_accuracy", 4)]),
    ];
    const result = aggregateEnsemble(evals);
    expect(result.dimensionEvaluations[0].score).toBe(3);
  });

  it("picks evidence from the highest-confidence evaluator", () => {
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 3, "low")]),
      makeEval([{ ...makeDim("conceptual_accuracy", 3, "high"), evidence: ["high-conf-evidence"] }]),
    ];
    const result = aggregateEnsemble(evals);
    expect(result.dimensionEvaluations[0].evidence).toContain("high-conf-evidence");
  });

  it("deduplicates relatedConcepts across evaluators", () => {
    const e1 = { ...makeEval([makeDim("conceptual_accuracy", 3)]), relatedConcepts: ["a", "b"] };
    const e2 = { ...makeEval([makeDim("conceptual_accuracy", 3)]), relatedConcepts: ["b", "c"] };
    const result = aggregateEnsemble([e1, e2]);
    expect(result.relatedConcepts).toContain("a");
    expect(result.relatedConcepts).toContain("b");
    expect(result.relatedConcepts).toContain("c");
    const bCount = result.relatedConcepts.filter((x) => x === "b").length;
    expect(bCount).toBe(1);
  });

  it("recalculates overallUnderstandingScore from aggregated dimension scores", () => {
    // Both evaluators give score=5 for conceptual_accuracy → aggregate score=5 → overall=100
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 5)], 100),
      makeEval([makeDim("conceptual_accuracy", 5)], 100),
    ];
    const result = aggregateEnsemble(evals);
    expect(result.overallUnderstandingScore).toBe(100);
  });

  it("uses median-closest evaluator for summary", () => {
    // scores 40, 60, 80 → median = 60
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 2)], 40, { overallFeedback: "low" }),
      makeEval([makeDim("conceptual_accuracy", 3)], 60, { overallFeedback: "median" }),
      makeEval([makeDim("conceptual_accuracy", 4)], 80, { overallFeedback: "high" }),
    ];
    const result = aggregateEnsemble(evals);
    expect(result.summary.overallFeedback).toBe("median");
  });

  it("aggregateConfidence is high when all evaluators are high confidence", () => {
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 3, "high")]),
      makeEval([makeDim("conceptual_accuracy", 3, "high")]),
    ];
    const result = aggregateEnsemble(evals);
    expect(result.dimensionEvaluations[0].evaluatorConfidence).toBe("high");
  });

  it("aggregateConfidence is low when all evaluators are low confidence", () => {
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 3, "low")]),
      makeEval([makeDim("conceptual_accuracy", 3, "low")]),
    ];
    const result = aggregateEnsemble(evals);
    expect(result.dimensionEvaluations[0].evaluatorConfidence).toBe("low");
  });
});
