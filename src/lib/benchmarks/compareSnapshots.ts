import type {
  BenchmarkSnapshot,
  CaseDiff,
  SnapshotComparison,
} from "@/lib/benchmarks/snapshotSchema";

// A change beyond this threshold is flagged as meaningful drift.
const DRIFT_THRESHOLD = 8;

export function compareSnapshots(
  previous: BenchmarkSnapshot,
  current: BenchmarkSnapshot
): SnapshotComparison {
  const prevMap = new Map(previous.cases.map((c) => [`${c.category}::${c.concept}`, c]));

  const caseDiffs: CaseDiff[] = [];

  for (const curr of current.cases) {
    const key = `${curr.category}::${curr.concept}`;
    const prev = prevMap.get(key);
    if (!prev) continue; // new case — not in previous suite, skip comparison

    const delta = curr.overallScore - prev.overallScore;
    let trend: CaseDiff["trend"] = "unchanged";
    if (!curr.passed && prev.passed) trend = "regressed";
    else if (curr.passed && !prev.passed) trend = "improved";
    else if (delta >= DRIFT_THRESHOLD) trend = "improved";
    else if (delta <= -DRIFT_THRESHOLD) trend = "regressed";

    caseDiffs.push({
      concept: curr.concept,
      category: curr.category,
      previousScore: prev.overallScore,
      currentScore: curr.overallScore,
      scoreDelta: delta,
      previousPassed: prev.passed,
      currentPassed: curr.passed,
      trend,
    });
  }

  const newFailures = caseDiffs
    .filter((d) => !d.currentPassed && d.previousPassed)
    .map((d) => d.concept);

  const newPasses = caseDiffs
    .filter((d) => d.currentPassed && !d.previousPassed)
    .map((d) => d.concept);

  const drifted = caseDiffs.filter((d) => d.trend !== "unchanged");

  const regressionCount = caseDiffs.filter((d) => d.trend === "regressed").length;
  const improvementCount = caseDiffs.filter((d) => d.trend === "improved").length;

  let overallTrend: SnapshotComparison["overallTrend"];
  if (regressionCount > 0) {
    overallTrend = "regressed";
  } else if (improvementCount > 0) {
    overallTrend = "improved";
  } else {
    overallTrend = "unchanged";
  }

  const deltas = caseDiffs.map((d) => d.scoreDelta);
  const avgScoreDelta =
    deltas.length > 0
      ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
      : 0;

  return {
    previousRunId: previous.runId,
    currentRunId: current.runId,
    overallTrend,
    avgScoreDelta,
    newFailures,
    newPasses,
    drifted,
    caseDiffs,
  };
}
