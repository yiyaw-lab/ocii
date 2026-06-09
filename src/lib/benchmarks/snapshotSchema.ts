export type CaseSnapshot = {
  concept: string;
  category: string;
  evaluationMode: string;
  overallScore: number;
  durationMs: number;
  passed: boolean;
  dimensionScores: Record<string, number>;
  // Average of evaluatorConfidence mapped to 1 (low) / 2 (medium) / 3 (high)
  avgEvaluatorConfidence: number | null;
  pressureScore: number | null;
  evidenceOfParaphrase: boolean | null;
  // For abstraction_pressure cases: overallScore − pressureScore.
  // High deceptionScore means the standard evaluator was fooled by paraphrase.
  deceptionScore: number | null;
};

export type BenchmarkSnapshot = {
  runId: string;
  timestamp: string;
  suiteVersion: string;
  evaluatorModel: string;
  summary: {
    totalCases: number;
    passed: number;
    failed: number;
    passRate: number;
    avgLatencyMs: number;
    avgOverallScore: number;
    avgPressureScore: number | null;
    avgDeceptionScore: number | null;
    avgEvaluatorConfidence: number | null;
  };
  cases: CaseSnapshot[];
};

export type CaseDiff = {
  concept: string;
  category: string;
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  previousPassed: boolean;
  currentPassed: boolean;
  trend: "improved" | "regressed" | "unchanged";
};

export type SnapshotComparison = {
  previousRunId: string;
  currentRunId: string;
  overallTrend: "improved" | "regressed" | "unchanged";
  avgScoreDelta: number;
  newFailures: string[];
  newPasses: string[];
  drifted: CaseDiff[];
  caseDiffs: CaseDiff[];
};
