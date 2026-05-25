import { runBenchmarks } from "@/lib/evaluation/runBenchmarks";
import { RISK_FLAG_THRESHOLD } from "@/lib/evaluation/adversarialDetection";

function fmt(n: number) {
  return n.toFixed(3);
}

function riskBar(score: number): string {
  const filled = Math.round(score * 10);
  return "[" + "█".repeat(filled) + "░".repeat(10 - filled) + "]";
}

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

  // Adversarial detector: how many adversarial cases were flagged above threshold
  const detectorFlaggedAdversarial = adversarialResults.filter(
    (r) => r.adversarialDetection.overallAdversarialRiskScore >= RISK_FLAG_THRESHOLD
  ).length;
  const detectorFlaggedStandard = standardResults.filter(
    (r) => r.adversarialDetection.overallAdversarialRiskScore >= RISK_FLAG_THRESHOLD
  ).length;
  const avgDetectorRisk =
    results.length > 0
      ? (
          results.reduce((s, r) => s + r.adversarialDetection.overallAdversarialRiskScore, 0) /
          results.length
        ).toFixed(3)
      : null;

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
    console.log(`\n=== Adversarial Evaluator Summary ===`);
    console.log(`Deceptions caught (evaluator score): ${adversarialCaught}/${adversarialResults.length}`);
    if (avgDeceptionScore !== null) {
      console.log(`Avg deception score:                 ${avgDeceptionScore} (0=caught, 1=fooled)`);
    }
  }

  console.log(`\n=== Adversarial Detector Summary (second-stage heuristics) ===`);
  console.log(`Note: detector risk is SEPARATE from understanding score — it does not alter evaluation output.`);
  console.log(`Adversarial cases flagged:  ${detectorFlaggedAdversarial}/${adversarialResults.length} (threshold ≥${RISK_FLAG_THRESHOLD})`);
  console.log(`Standard cases flagged:     ${detectorFlaggedStandard}/${standardResults.length}`);
  if (avgDetectorRisk !== null) {
    console.log(`Avg overall risk score:     ${avgDetectorRisk}`);
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
      const { concept, benchmarkScore, durationMs, adversarialDetection } = result;
      const status = benchmarkScore.passed ? "PASS" : "FAIL";
      const score = benchmarkScore.actualOverallScore;
      const range = benchmarkScore.expectedRange.join("–");
      const risk = adversarialDetection.overallAdversarialRiskScore;
      const riskLabel = risk >= RISK_FLAG_THRESHOLD ? " ⚠ RISK FLAGGED" : "";
      console.log(`\n[${status}] ${concept}${riskLabel}`);
      console.log(`  Overall score: ${score} (expected ${range})`);
      console.log(`  Adversarial risk: ${fmt(risk)} ${riskBar(risk)}`);
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
      if (adversarialDetection.riskFlags.length > 0) {
        console.log(`  Risk flags:`);
        for (const flag of adversarialDetection.riskFlags) {
          console.log(`    · ${flag}`);
        }
      }
    }
  }

  if (adversarialResults.length > 0) {
    console.log("\n=== Adversarial Cases ===");
    for (const result of adversarialResults) {
      const { concept, benchmarkScore, durationMs, adversarialType, adversarialDetection } = result;
      const score = benchmarkScore as typeof benchmarkScore & {
        deceptionScore?: number;
        evaluatorCaughtDeception?: boolean;
      };
      const caught = score.evaluatorCaughtDeception ?? benchmarkScore.passed;
      const evaluatorStatus = caught ? "CAUGHT" : "FOOLED";
      const overall = benchmarkScore.actualOverallScore;
      const range = benchmarkScore.expectedRange.join("–");
      const deception =
        score.deceptionScore !== undefined ? score.deceptionScore.toFixed(3) : "n/a";

      const detRisk = adversarialDetection.overallAdversarialRiskScore;
      const detectorStatus =
        detRisk >= RISK_FLAG_THRESHOLD ? "DETECTOR FLAGGED" : "detector missed";

      console.log(`\n[${evaluatorStatus}] ${concept}  (${adversarialType})`);
      console.log(`  Evaluator score:  ${overall} (expected range ${range})`);
      console.log(`  Deception score:  ${deception} (0=caught, 1=fooled)`);
      console.log(`  Detector risk:    ${fmt(detRisk)} ${riskBar(detRisk)}  → ${detectorStatus}`);
      console.log(`  Latency: ${durationMs}ms`);

      // Per-risk-type breakdown
      console.log(`  Risk breakdown:`);
      console.log(`    fluency       ${fmt(adversarialDetection.fluencyRiskScore)}`);
      console.log(`    paraphrase    ${fmt(adversarialDetection.paraphraseRiskScore)}`);
      console.log(`    hallucination ${fmt(adversarialDetection.hallucinationRiskScore)}`);
      console.log(`    transferBluff ${fmt(adversarialDetection.transferBluffRiskScore)}`);
      console.log(`    vagueJargon   ${fmt(adversarialDetection.vagueJargonRiskScore)}`);
      console.log(`    causalInvert  ${fmt(adversarialDetection.causalInversionRiskScore)}`);

      if (!benchmarkScore.overallInRange) {
        console.log(`  ✗ Evaluator score out of expected low range`);
      }
      for (const check of benchmarkScore.lowDimensionChecks) {
        const mark = check.passed ? "✓" : "✗";
        const note = check.passed ? "correctly scored low" : "evaluator missed";
        console.log(`  ${mark} ${check.dimension} = ${check.score ?? "missing"}  (${note})`);
      }
      if (adversarialDetection.riskFlags.length > 0) {
        console.log(`  Detector flags:`);
        for (const flag of adversarialDetection.riskFlags) {
          console.log(`    · ${flag}`);
        }
      }
      console.log(`  Pressure test: ${adversarialDetection.recommendedPressureTest}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Benchmark run failed:", err);
  process.exit(1);
});
