import { NextResponse } from "next/server";
import { runBenchmarks } from "@/lib/evaluation/runBenchmarks";
import { buildSnapshot, saveSnapshot } from "@/lib/benchmarks/saveSnapshot";
import { loadPreviousSnapshot, loadBaseline } from "@/lib/benchmarks/loadSnapshots";
import { compareSnapshots } from "@/lib/benchmarks/compareSnapshots";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const compareAgainst = searchParams.get("compare") ?? "previous"; // "previous" | "baseline"

    const results = await runBenchmarks();
    const allPassed = results.every((r) => r.benchmarkScore.passed);

    const snapshot = buildSnapshot(results);
    const filePath = saveSnapshot(snapshot);

    const reference =
      compareAgainst === "baseline"
        ? loadBaseline()
        : loadPreviousSnapshot(snapshot.runId);

    const comparison = reference ? compareSnapshots(reference, snapshot) : null;

    return NextResponse.json({
      allPassed,
      results,
      snapshot: {
        runId: snapshot.runId,
        summary: snapshot.summary,
        savedTo: filePath,
      },
      comparison,
    });
  } catch (error) {
    console.error("BENCHMARK_ERROR:", error);
    return NextResponse.json(
      {
        error: "Benchmark failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
