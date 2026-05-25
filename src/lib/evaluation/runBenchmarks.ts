import { benchmarkCases } from "@/lib/evaluation/benchmarkCases";
import { runEvaluation } from "@/lib/evaluation/runEvaluation";
import { scoreBenchmarkResult } from "@/lib/evaluation/scoreBenchmarkResult";

type BenchmarkScore = ReturnType<typeof scoreBenchmarkResult>;

type BenchmarkResult = {
  concept: string;
  evaluationMode: string;
  evaluation: Awaited<ReturnType<typeof runEvaluation>>;
  expected: (typeof benchmarkCases)[number]["expectedCharacteristics"];
  durationMs: number;
  benchmarkScore: BenchmarkScore;
};

export async function runBenchmarks() {
  const results: BenchmarkResult[] = [];

  for (const testCase of benchmarkCases) {
    const startedAt = Date.now();
    const mode = testCase.evaluationMode ?? "quick";

    const evaluation = await runEvaluation({
      concept: testCase.concept,
      sourceText: testCase.sourceMaterial,
      userExplanation: testCase.userExplanation,
      confidence: 3,
      evaluationMode: mode,
    });

    const durationMs = Date.now() - startedAt;

    const benchmarkScore = scoreBenchmarkResult(
      evaluation,
      testCase.expectedCharacteristics
    );

    results.push({
      concept: testCase.concept,
      evaluationMode: mode,
      evaluation,
      expected: testCase.expectedCharacteristics,
      durationMs,
      benchmarkScore,
    });
  }

  return results;
}
