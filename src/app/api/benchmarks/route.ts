import { NextResponse } from "next/server";
import { runBenchmarks } from "@/lib/evaluation/runBenchmarks";

export async function GET() {
  try {
    const results = await runBenchmarks();
    const allPassed = results.every((r) => r.benchmarkScore.passed);

    return NextResponse.json({ allPassed, results });
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
