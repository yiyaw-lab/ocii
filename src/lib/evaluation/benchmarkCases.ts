export type BenchmarkCase = {
  concept: string;
  sourceMaterial: string;
  userExplanation: string;
  evaluationMode?: "quick" | "full" | "ensemble";
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
