import { NextResponse } from "next/server";
import { listSnapshots, loadBaseline } from "@/lib/benchmarks/loadSnapshots";
import { compareSnapshots } from "@/lib/benchmarks/compareSnapshots";

export async function GET() {
  try {
    const snapshots = listSnapshots();
    const baseline = loadBaseline();

    const history = snapshots.map((snap, i) => {
      const previous = i > 0 ? snapshots[i - 1] : baseline;
      const comparison = previous ? compareSnapshots(previous, snap) : null;
      return {
        runId: snap.runId,
        timestamp: snap.timestamp,
        summary: snap.summary,
        comparison: comparison
          ? {
              overallTrend: comparison.overallTrend,
              avgScoreDelta: comparison.avgScoreDelta,
              newFailures: comparison.newFailures,
              newPasses: comparison.newPasses,
              driftedCount: comparison.drifted.length,
            }
          : null,
      };
    });

    return NextResponse.json({ baseline: baseline?.summary ?? null, history });
  } catch (error) {
    return NextResponse.json(
      { error: "History load failed", details: String(error) },
      { status: 500 }
    );
  }
}
