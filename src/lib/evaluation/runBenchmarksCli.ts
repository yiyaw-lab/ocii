import { runBenchmarks } from "@/lib/evaluation/runBenchmarks";

async function main() {
  console.log("Running benchmarks...\n");

  const results = await runBenchmarks();

  const total = results.length;
  const passed = results.filter((r) => r.benchmarkScore.passed).length;
  const failed = total - passed;
  const avgLatencyMs =
    total > 0
      ? Math.round(results.reduce((sum, r) => sum + r.durationMs, 0) / total)
      : 0;

  const agreementScores = results
    .map((r) => (r as { benchmarkScore: { evaluatorAgreementScore?: number } }).benchmarkScore.evaluatorAgreementScore)
    .filter((s): s is number => typeof s === "number");
  const avgAgreement =
    agreementScores.length > 0
      ? (agreementScores.reduce((a, b) => a + b, 0) / agreementScores.length).toFixed(3)
      : null;

  const failedNames = results
    .filter((r) => !r.benchmarkScore.passed)
    .map((r) => r.concept);

  console.log("=== Benchmark Summary ===");
  console.log(`Total cases:    ${total}`);
  console.log(`Passed:         ${passed}`);
  console.log(`Failed:         ${failed}`);
  console.log(`Avg latency:    ${avgLatencyMs}ms`);
  if (avgAgreement !== null) {
    console.log(`Avg agreement:  ${avgAgreement}`);
  }

  if (failedNames.length > 0) {
    console.log("\nFailed cases:");
    for (const name of failedNames) {
      console.log(`  - ${name}`);
    }
  }

  console.log("\n=== Per-Case Results ===");
  for (const result of results) {
    const { concept, benchmarkScore, durationMs } = result;
    const status = benchmarkScore.passed ? "PASS" : "FAIL";
    const score = benchmarkScore.actualOverallScore;
    const range = benchmarkScore.expectedRange.join("–");
    console.log(`\n[${status}] ${concept}`);
    console.log(`  Overall score: ${score} (expected ${range})`);
    console.log(`  Latency: ${durationMs}ms`);

    if (!benchmarkScore.overallInRange) {
      console.log(`  ✗ Score out of range`);
    }
    for (const check of benchmarkScore.highDimensionChecks) {
      const mark = check.passed ? "✓" : "✗";
      console.log(`  ${mark} High: ${check.dimension} = ${check.score ?? "missing"}`);
    }
    for (const check of benchmarkScore.lowDimensionChecks) {
      const mark = check.passed ? "✓" : "✗";
      console.log(`  ${mark} Low:  ${check.dimension} = ${check.score ?? "missing"}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Benchmark run failed:", err);
  process.exit(1);
});
