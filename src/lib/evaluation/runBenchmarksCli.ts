import { runBenchmarks } from "@/lib/evaluation/runBenchmarks";

async function main() {
  console.log("Running benchmarks...\n");

  const results = await runBenchmarks();

  const standardResults = results.filter((r) => !r.isAdversarial);
  const adversarialResults = results.filter((r) => r.isAdversarial);

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

  const deceptionScores = adversarialResults
    .map((r) => (r.benchmarkScore as { deceptionScore?: number }).deceptionScore)
    .filter((s): s is number => typeof s === "number");
  const avgDeceptionScore =
    deceptionScores.length > 0
      ? (deceptionScores.reduce((a, b) => a + b, 0) / deceptionScores.length).toFixed(3)
      : null;
  const adversarialCaught = adversarialResults.filter((r) => r.benchmarkScore.passed).length;

  console.log("=== Benchmark Summary ===");
  console.log(`Total cases:       ${total}`);
  console.log(`  Standard:        ${standardResults.length}`);
  console.log(`  Adversarial:     ${adversarialResults.length}`);
  console.log(`Passed:            ${passed}`);
  console.log(`Failed:            ${failed}`);
  console.log(`Avg latency:       ${avgLatencyMs}ms`);
  if (avgAgreement !== null) {
    console.log(`Avg agreement:     ${avgAgreement}`);
  }

  if (adversarialResults.length > 0) {
    console.log(`\n=== Adversarial Summary ===`);
    console.log(`Deceptions caught: ${adversarialCaught}/${adversarialResults.length}`);
    if (avgDeceptionScore !== null) {
      console.log(`Avg deception score: ${avgDeceptionScore} (0=caught, 1=fooled)`);
    }
  }

  const failedNames = results
    .filter((r) => !r.benchmarkScore.passed)
    .map((r) => (r.isAdversarial ? `${r.concept} [adversarial: ${r.adversarialType}]` : r.concept));

  if (failedNames.length > 0) {
    console.log("\nFailed cases:");
    for (const name of failedNames) {
      console.log(`  - ${name}`);
    }
  }

  if (standardResults.length > 0) {
    console.log("\n=== Standard Cases ===");
    for (const result of standardResults) {
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
  }

  if (adversarialResults.length > 0) {
    console.log("\n=== Adversarial Cases ===");
    for (const result of adversarialResults) {
      const { concept, benchmarkScore, durationMs, adversarialType } = result;
      const score = benchmarkScore as typeof benchmarkScore & {
        deceptionScore?: number;
        evaluatorCaughtDeception?: boolean;
      };
      const caught = score.evaluatorCaughtDeception ?? benchmarkScore.passed;
      const status = caught ? "CAUGHT" : "FOOLED";
      const overall = benchmarkScore.actualOverallScore;
      const range = benchmarkScore.expectedRange.join("–");
      const deception =
        score.deceptionScore !== undefined
          ? score.deceptionScore.toFixed(3)
          : "n/a";

      console.log(`\n[${status}] ${concept}  (${adversarialType})`);
      console.log(`  Overall score:  ${overall} (expected range ${range})`);
      console.log(`  Deception score: ${deception} (0=caught, 1=fooled)`);
      console.log(`  Latency: ${durationMs}ms`);

      if (!benchmarkScore.overallInRange) {
        console.log(`  ✗ Score out of expected low range — evaluator may have been deceived`);
      }
      for (const check of benchmarkScore.lowDimensionChecks) {
        const mark = check.passed ? "✓" : "✗";
        const note = check.passed ? "correctly scored low" : "evaluator missed deception";
        console.log(`  ${mark} ${check.dimension} = ${check.score ?? "missing"}  (${note})`);
      }
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Benchmark run failed:", err);
  process.exit(1);
});
