import { benchmarkCases } from "@/lib/evaluation/benchmarkCases";
import { runEvaluation } from "@/lib/evaluation/runEvaluation";
import { scoreBenchmarkResult } from "@/lib/evaluation/scoreBenchmarkResult";

type BenchmarkResult = {
    concept: string;
    evaluation: unknown;
    expected: unknown;
    durationMs: number;
    benchmarkScore: unknown;
  };

export async function runBenchmarks() {
  const results: BenchmarkResult[] = [];

  for (const testCase of benchmarkCases) {
    const startedAt = Date.now();

    const evaluation = await runEvaluation({
      concept: testCase.concept,
      sourceText: testCase.sourceMaterial,
      userExplanation: testCase.userExplanation,
      confidence: 3,
    });

    const durationMs = Date.now() - startedAt;

    const benchmarkScore = scoreBenchmarkResult(
        evaluation,
        testCase.expectedCharacteristics
      );

      results.push({
        concept: testCase.concept,
        evaluation,
        expected: testCase.expectedCharacteristics,
        durationMs,
        benchmarkScore,
      });

    
  }

  return results;
}