import { describe, it, expect } from "vitest";
import { scoreBenchmarkResult } from "@/lib/evaluation/scoreBenchmarkResult";

const makeEvaluation = (
  overallUnderstandingScore: number,
  dims: { dimension: string; score: number }[]
) => ({ overallUnderstandingScore, dimensionEvaluations: dims });

describe("scoreBenchmarkResult", () => {
  it("passes when overall score is in range and no dimension checks", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(65, []),
      { shouldScoreHighOn: [], shouldScoreLowOn: [], expectedOverallRange: [60, 70] }
    );
    expect(result.passed).toBe(true);
    expect(result.overallInRange).toBe(true);
  });

  it("fails when overall score is below range", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(50, []),
      { shouldScoreHighOn: [], shouldScoreLowOn: [], expectedOverallRange: [60, 70] }
    );
    expect(result.passed).toBe(false);
    expect(result.overallInRange).toBe(false);
  });

  it("fails when overall score is above range", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(80, []),
      { shouldScoreHighOn: [], shouldScoreLowOn: [], expectedOverallRange: [60, 70] }
    );
    expect(result.passed).toBe(false);
  });

  it("passes high-dimension check when score >= 3.5", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(65, [{ dimension: "conceptual_accuracy", score: 4 }]),
      {
        shouldScoreHighOn: ["conceptual_accuracy"],
        shouldScoreLowOn: [],
        expectedOverallRange: [60, 70],
      }
    );
    expect(result.highDimensionChecks[0].passed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("fails high-dimension check when score < 3.5", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(65, [{ dimension: "conceptual_accuracy", score: 3 }]),
      {
        shouldScoreHighOn: ["conceptual_accuracy"],
        shouldScoreLowOn: [],
        expectedOverallRange: [60, 70],
      }
    );
    expect(result.highDimensionChecks[0].passed).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("passes low-dimension check when score <= 2.5", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(65, [{ dimension: "transfer_capability", score: 2 }]),
      {
        shouldScoreHighOn: [],
        shouldScoreLowOn: ["transfer_capability"],
        expectedOverallRange: [60, 70],
      }
    );
    expect(result.lowDimensionChecks[0].passed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("fails low-dimension check when score > 2.5", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(65, [{ dimension: "transfer_capability", score: 3 }]),
      {
        shouldScoreHighOn: [],
        shouldScoreLowOn: ["transfer_capability"],
        expectedOverallRange: [60, 70],
      }
    );
    expect(result.lowDimensionChecks[0].passed).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("treats missing dimension as score=0 for high checks (fails)", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(65, []),
      {
        shouldScoreHighOn: ["conceptual_accuracy"],
        shouldScoreLowOn: [],
        expectedOverallRange: [60, 70],
      }
    );
    expect(result.highDimensionChecks[0].passed).toBe(false);
  });

  it("treats missing dimension as score=5 for low checks (fails)", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(65, []),
      {
        shouldScoreHighOn: [],
        shouldScoreLowOn: ["transfer_capability"],
        expectedOverallRange: [60, 70],
      }
    );
    expect(result.lowDimensionChecks[0].passed).toBe(false);
  });

  it("returns actualOverallScore and expectedRange in output", () => {
    const result = scoreBenchmarkResult(
      makeEvaluation(65, []),
      { shouldScoreHighOn: [], shouldScoreLowOn: [], expectedOverallRange: [60, 70] }
    );
    expect(result.actualOverallScore).toBe(65);
    expect(result.expectedRange).toEqual([60, 70]);
  });
});
