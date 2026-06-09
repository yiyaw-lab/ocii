import fs from "fs";
import path from "path";
import type { BenchmarkSnapshot } from "@/lib/benchmarks/snapshotSchema";
import type { runBenchmarks } from "@/lib/evaluation/runBenchmarks";

// Note: fs writes work in Next.js dev/standalone. Not available in edge runtime.
const SNAPSHOTS_DIR = path.join(process.cwd(), "benchmarks", "snapshots");
const CONF_MAP: Record<string, number> = { low: 1, medium: 2, high: 3 };
const EVALUATOR_MODEL = "gpt-4.1-mini";
const SUITE_VERSION = "baseline-v1";

type BenchmarkResults = Awaited<ReturnType<typeof runBenchmarks>>;

export function buildSnapshot(results: BenchmarkResults): BenchmarkSnapshot {
  const now = new Date().toISOString();

  const cases = results.map((r) => {
    const dims = r.evaluation.dimensionEvaluations;
    const dimensionScores = Object.fromEntries(
      dims.map((d) => [d.dimension, d.score])
    );

    const confVals = dims.map(
      (d) => CONF_MAP[(d as { evaluatorConfidence?: string }).evaluatorConfidence ?? "medium"] ?? 2
    );
    const avgEvaluatorConfidence =
      confVals.length > 0
        ? Math.round((confVals.reduce((a, b) => a + b, 0) / confVals.length) * 100) / 100
        : null;

    const pc = r.benchmarkScore.pressureCheck;
    const pressureScore = pc ? pc.actualPressureScore : null;
    const evidenceOfParaphrase = pc ? pc.evidenceOfParaphrase : null;
    const deceptionScore =
      pressureScore !== null
        ? Math.round(r.evaluation.overallUnderstandingScore - pressureScore)
        : null;

    return {
      concept: r.concept,
      category: r.category,
      evaluationMode: r.evaluation.evaluationMode,
      overallScore: r.evaluation.overallUnderstandingScore,
      durationMs: r.durationMs,
      passed: r.benchmarkScore.passed,
      dimensionScores,
      avgEvaluatorConfidence,
      pressureScore,
      evidenceOfParaphrase,
      deceptionScore,
    };
  });

  const latencies = cases.map((c) => c.durationMs);
  const scores = cases.map((c) => c.overallScore);
  const pressureCases = cases.filter((c) => c.pressureScore !== null);
  const confCases = cases.filter((c) => c.avgEvaluatorConfidence !== null);

  return {
    runId: now,
    timestamp: now,
    suiteVersion: SUITE_VERSION,
    evaluatorModel: EVALUATOR_MODEL,
    summary: {
      totalCases: cases.length,
      passed: cases.filter((c) => c.passed).length,
      failed: cases.filter((c) => !c.passed).length,
      passRate: Math.round((cases.filter((c) => c.passed).length / cases.length) * 1000) / 1000,
      avgLatencyMs: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
      avgOverallScore:
        Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      avgPressureScore:
        pressureCases.length > 0
          ? Math.round(
              (pressureCases.reduce((a, c) => a + (c.pressureScore ?? 0), 0) /
                pressureCases.length) * 10
            ) / 10
          : null,
      avgDeceptionScore:
        pressureCases.length > 0
          ? Math.round(
              (pressureCases.reduce((a, c) => a + (c.deceptionScore ?? 0), 0) /
                pressureCases.length) * 10
            ) / 10
          : null,
      avgEvaluatorConfidence:
        confCases.length > 0
          ? Math.round(
              (confCases.reduce((a, c) => a + (c.avgEvaluatorConfidence ?? 0), 0) /
                confCases.length) * 100
            ) / 100
          : null,
    },
    cases,
  };
}

export function saveSnapshot(snapshot: BenchmarkSnapshot): string {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
  const safe = snapshot.runId.replace(/[:.]/g, "-");
  const filePath = path.join(SNAPSHOTS_DIR, `${safe}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  return filePath;
}
