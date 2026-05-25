import { describe, it, expect } from "vitest";
import { calculateOverallScore } from "@/lib/evaluation/calculateOverallScore";

describe("calculateOverallScore", () => {
  it("returns 0 for empty dimensions", () => {
    expect(calculateOverallScore([])).toBe(0);
  });

  it("converts a perfect score of 5 to 100", () => {
    const dims = [{ dimension: "conceptual_accuracy", score: 5 }];
    expect(calculateOverallScore(dims)).toBe(100);
  });

  it("converts a zero score to 0", () => {
    const dims = [{ dimension: "conceptual_accuracy", score: 0 }];
    expect(calculateOverallScore(dims)).toBe(0);
  });

  it("applies dimension weights — higher weight pulls score toward that dim", () => {
    // conceptual_accuracy weight=1.4, transfer_capability weight=0.9
    // If conceptual_accuracy=5 and transfer_capability=0, weighted avg > unweighted avg
    const weighted = calculateOverallScore([
      { dimension: "conceptual_accuracy", score: 5 },
      { dimension: "transfer_capability", score: 0 },
    ]);
    const unweighted = Math.round(((5 + 0) / 2 / 5) * 100);
    expect(weighted).toBeGreaterThan(unweighted);
  });

  it("uses DEFAULT_WEIGHT=1 for unknown dimensions", () => {
    const result = calculateOverallScore([
      { dimension: "unknown_dimension", score: 5 },
    ]);
    expect(result).toBe(100);
  });

  it("rounds to nearest integer", () => {
    const result = calculateOverallScore([
      { dimension: "conceptual_accuracy", score: 3 },
      { dimension: "mechanistic_reasoning", score: 2 },
    ]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("uniform mid-scores produce ~60 on 0–100 scale", () => {
    const dims = [
      "conceptual_accuracy",
      "mechanistic_reasoning",
      "abstraction_compression",
      "transfer_capability",
      "retrieval_robustness",
      "metacognitive_calibration",
      "epistemic_awareness",
    ].map((d) => ({ dimension: d, score: 3 }));
    // 3/5 = 60%
    expect(calculateOverallScore(dims)).toBe(60);
  });
});
