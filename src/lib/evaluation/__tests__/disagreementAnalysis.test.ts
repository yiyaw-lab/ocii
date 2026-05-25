import { describe, it, expect } from "vitest";
import { analyzeDisagreement } from "@/lib/evaluation/disagreementAnalysis";

const makeDim = (
  dimension: string,
  score: number,
  confidence: "low" | "medium" | "high" = "medium"
) => ({
  dimension,
  score,
  evaluatorConfidence: confidence,
  evidence: [],
  misconceptions: [],
  missingNuance: [],
  rationale: "",
  nextTestPrompt: "",
});

const makeEval = (
  dims: ReturnType<typeof makeDim>[],
  overall = 60
) => ({
  dimensionEvaluations: dims,
  overallUnderstandingScore: overall,
  relatedConcepts: [],
  summary: {
    strongestDimension: "",
    weakestDimension: "",
    calibrationAssessment: "",
    overallFeedback: "",
    nextLearningStep: "",
  },
});

describe("analyzeDisagreement", () => {
  it("returns perfect agreement for empty list", () => {
    const result = analyzeDisagreement([]);
    expect(result.evaluatorAgreementScore).toBe(1);
    expect(result.evaluatorVariance).toBe(0);
    expect(result.lowConsensusDimensions).toEqual([]);
    expect(result.dimensionVariances).toEqual({});
  });

  it("returns perfect agreement when all evaluators agree", () => {
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 4)]),
      makeEval([makeDim("conceptual_accuracy", 4)]),
    ];
    const result = analyzeDisagreement(evals);
    expect(result.evaluatorVariance).toBe(0);
    expect(result.evaluatorAgreementScore).toBe(1);
    expect(result.lowConsensusDimensions).toEqual([]);
  });

  it("detects low consensus when variance exceeds 0.5", () => {
    // Scores 0 and 5 → variance = 6.25, well above 0.5
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 0)]),
      makeEval([makeDim("conceptual_accuracy", 5)]),
    ];
    const result = analyzeDisagreement(evals);
    expect(result.lowConsensusDimensions).toContain("conceptual_accuracy");
  });

  it("evaluatorAgreementScore is between 0 and 1", () => {
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 0)]),
      makeEval([makeDim("conceptual_accuracy", 5)]),
    ];
    const { evaluatorAgreementScore } = analyzeDisagreement(evals);
    expect(evaluatorAgreementScore).toBeGreaterThanOrEqual(0);
    expect(evaluatorAgreementScore).toBeLessThanOrEqual(1);
  });

  it("scores rounded to 3 decimal places", () => {
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 1)]),
      makeEval([makeDim("conceptual_accuracy", 4)]),
    ];
    const result = analyzeDisagreement(evals);
    const asString = result.evaluatorVariance.toString();
    const decimals = asString.split(".")[1] ?? "";
    expect(decimals.length).toBeLessThanOrEqual(3);
  });

  it("handles multiple dimensions independently", () => {
    const evals = [
      makeEval([makeDim("conceptual_accuracy", 5), makeDim("transfer_capability", 3)]),
      makeEval([makeDim("conceptual_accuracy", 5), makeDim("transfer_capability", 3)]),
    ];
    const result = analyzeDisagreement(evals);
    expect(result.dimensionVariances["conceptual_accuracy"]).toBe(0);
    expect(result.dimensionVariances["transfer_capability"]).toBe(0);
    expect(result.lowConsensusDimensions).toEqual([]);
  });

  it("sorts lowConsensusDimensions by variance descending", () => {
    // dim_a: scores 0,5 → variance=6.25; dim_b: scores 2,3 → variance=0.25
    const evals = [
      makeEval([makeDim("dim_a", 0), makeDim("dim_b", 2)]),
      makeEval([makeDim("dim_a", 5), makeDim("dim_b", 3)]),
    ];
    const result = analyzeDisagreement(evals);
    expect(result.lowConsensusDimensions[0]).toBe("dim_a");
  });
});
