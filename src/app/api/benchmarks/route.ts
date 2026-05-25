import { NextResponse } from "next/server";
import { runBenchmarks } from "@/lib/evaluation/runBenchmarks";

export async function GET() {
  try {
    const results = await runBenchmarks();
    return NextResponse.json({ results });
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