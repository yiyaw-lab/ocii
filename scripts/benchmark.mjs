#!/usr/bin/env node
/**
 * Benchmark runner CLI.
 * Requires the dev server to be running: npm run dev
 *
 * Usage:
 *   node scripts/benchmark.mjs              # compare to previous run
 *   node scripts/benchmark.mjs --baseline   # compare to baseline-v1
 *   node scripts/benchmark.mjs --port 3001  # custom port (default: 3000)
 */

const args = process.argv.slice(2);
const useBaseline = args.includes("--baseline");
const portArg = args.indexOf("--port");
const port = portArg >= 0 ? args[portArg + 1] : "3000";

const compare = useBaseline ? "baseline" : "previous";
const url = `http://localhost:${port}/api/benchmarks?compare=${compare}`;

// ANSI colour helpers
const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const cyan   = (s) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;

const sign = (n) => (n > 0 ? `+${n}` : `${n}`);

console.log(dim(`\nRunning benchmarks against ${url} …\n`));

let data;
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(600_000) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(red(`\nBenchmark request failed (${res.status}): ${err.details ?? res.statusText}`));
    process.exit(1);
  }
  data = await res.json();
} catch (e) {
  console.error(red(`\nCould not reach ${url}`));
  console.error(dim("Make sure the dev server is running: npm run dev"));
  process.exit(1);
}

const { snapshot, comparison, results, allPassed } = data;
const s = snapshot.summary;

// ── Header ──────────────────────────────────────────────────────────────────
console.log(bold("BENCHMARK SNAPSHOT"));
console.log(dim(`Run ID : ${snapshot.runId}`));
console.log(dim(`Suite  : ${s.totalCases} cases  |  Passed: ${s.passed}  Failed: ${s.failed}`));
console.log(dim(`Scores : avg overall ${s.avgOverallScore}  |  avg latency ${s.avgLatencyMs}ms`));
if (s.avgPressureScore !== null) {
  console.log(dim(`Pressure: avg ${s.avgPressureScore}  |  avg deception ${s.avgDeceptionScore}`));
}
console.log(dim(`Evaluator confidence: avg ${s.avgEvaluatorConfidence} (1=low 2=med 3=high)`));
console.log();

// ── Per-case table ───────────────────────────────────────────────────────────
const colW = { concept: 32, cat: 25, score: 6, pressure: 10, passed: 6 };
const header = [
  "Concept".padEnd(colW.concept),
  "Category".padEnd(colW.cat),
  "Score".padStart(colW.score),
  "Pressure".padStart(colW.pressure),
  "Pass",
].join("  ");
console.log(dim(header));
console.log(dim("─".repeat(header.length)));

for (const r of results) {
  const bs = r.benchmarkScore;
  const pc = bs.pressureCheck;
  const passStr = bs.passed ? green("PASS") : red("FAIL");
  const pressureStr = pc !== null ? String(pc.actualPressureScore).padStart(colW.pressure) : dim("  —".padStart(colW.pressure));
  const scoreStr = String(bs.actualOverallScore).padStart(colW.score);
  const conceptStr = r.concept.slice(0, colW.concept).padEnd(colW.concept);
  const catStr = (r.category ?? "").slice(0, colW.cat).padEnd(colW.cat);
  console.log(`${conceptStr}  ${catStr}  ${scoreStr}  ${pressureStr}  ${passStr}`);
}

console.log();

// ── Comparison ───────────────────────────────────────────────────────────────
if (!comparison) {
  console.log(cyan("── First run — baseline established ──"));
  console.log(dim(`Snapshot saved. Future runs will compare against this.`));
} else {
  const ref = useBaseline ? "baseline-v1" : comparison.previousRunId.slice(0, 24);
  const deltaStr = sign(comparison.avgScoreDelta);

  if (comparison.overallTrend === "regressed") {
    console.log(bold(red(`✗  benchmark regressed`)));
  } else if (comparison.overallTrend === "improved") {
    console.log(bold(green(`✓  benchmark improved`)));
  } else {
    console.log(bold(cyan(`─  benchmark unchanged`)));
  }

  console.log(dim(`   vs ${ref}  |  avg score delta: ${deltaStr}`));

  if (comparison.newFailures.length > 0) {
    console.log(red(`\n   New failures (${comparison.newFailures.length}):`));
    comparison.newFailures.forEach((c) => console.log(red(`     ✗ ${c}`)));
  }
  if (comparison.newPasses.length > 0) {
    console.log(green(`\n   Newly passing (${comparison.newPasses.length}):`));
    comparison.newPasses.forEach((c) => console.log(green(`     ✓ ${c}`)));
  }
  if (comparison.drifted.length > 0) {
    console.log(yellow(`\n   Score drift (>${8} pts, ${comparison.drifted.length} cases):`));
    comparison.drifted.forEach((d) => {
      const arrow = d.trend === "improved" ? green("▲") : red("▼");
      console.log(`     ${arrow} ${d.concept.padEnd(32)} ${d.previousScore} → ${d.currentScore} (${sign(d.scoreDelta)})`);
    });
  }
}

console.log();
process.exit(allPassed ? 0 : 1);
