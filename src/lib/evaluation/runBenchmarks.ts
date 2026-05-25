import { benchmarkCases, adversarialCases } from "@/lib/evaluation/benchmarkCases";
import { runEvaluation } from "@/lib/evaluation/runEvaluation";
import { scoreBenchmarkResult } from "@/lib/evaluation/scoreBenchmarkResult";

type BenchmarkScore = ReturnType<typeof scoreBenchmarkResult>;

type BenchmarkResult = {
  concept: string;
  evaluationMode: string;
  isAdversarial: boolean;
  adversarialType?: string;
  evaluation: Awaited<ReturnType<typeof runEvaluation>>;
  expected: (typeof benchmarkCases)[number]["expectedCharacteristics"];
  durationMs: number;
  benchmarkScore: BenchmarkScore;
};

export async function runBenchmarks() {
  const results: BenchmarkResult[] = [];

  const allCases = [...benchmarkCases, ...adversarialCases];

  for (const testCase of allCases) {
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
      testCase.expectedCharacteristics,
      testCase.isAdversarial ?? false
    );

    results.push({
      concept: testCase.concept,
      evaluationMode: mode,
      isAdversarial: testCase.isAdversarial ?? false,
      adversarialType: testCase.adversarialType,
      evaluation,
      expected: testCase.expectedCharacteristics,
      durationMs,
      benchmarkScore,
    });
  }

  return results;
}
