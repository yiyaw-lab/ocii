import { benchmarkCases } from "@/lib/evaluation/benchmarkCases";
import { runEvaluation } from "@/lib/evaluation/runEvaluation";
import { scoreBenchmarkResult } from "@/lib/evaluation/scoreBenchmarkResult";
import { scoreAbstractionPressure } from "@/lib/ai/scoreAbstractionPressure";

type BenchmarkScore = ReturnType<typeof scoreBenchmarkResult>;

type BenchmarkResult = {
  category: (typeof benchmarkCases)[number]["category"];
  concept: string;
  evaluation: Awaited<ReturnType<typeof runEvaluation>>;
  expected: (typeof benchmarkCases)[number]["expectedCharacteristics"];
  durationMs: number;
  benchmarkScore: BenchmarkScore;
};

export async function runBenchmarks() {
  const results: BenchmarkResult[] = [];

  for (const testCase of benchmarkCases) {
    const startedAt = Date.now();

    const evaluation = await runEvaluation({
      concept: testCase.concept,
      sourceText: testCase.sourceMaterial,
      userExplanation: testCase.userExplanation,
      confidence: testCase.confidence,
      evaluationMode: testCase.evaluationMode,
    });

    let pressureScore: Awaited<ReturnType<typeof scoreAbstractionPressure>> | undefined;

    if (testCase.abstractionPressure) {
      const { challenge, pressureType, response } = testCase.abstractionPressure;
      pressureScore = await scoreAbstractionPressure({
        concept: testCase.concept,
        challenge,
        pressureType,
        response,
      });
    }

    const durationMs = Date.now() - startedAt;

    const benchmarkScore = scoreBenchmarkResult(
      evaluation,
      testCase.expectedCharacteristics,
      pressureScore,
      testCase.abstractionPressure
        ? { expectedPressureScoreRange: testCase.abstractionPressure.expectedPressureScoreRange }
        : undefined
    );

    results.push({
      category: testCase.category,
      concept: testCase.concept,
      evaluation,
      expected: testCase.expectedCharacteristics,
      durationMs,
      benchmarkScore,
    });
  }

  return results;
}
