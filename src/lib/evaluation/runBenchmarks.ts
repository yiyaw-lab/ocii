import { benchmarkCases, adversarialCases } from "@/lib/evaluation/benchmarkCases";
import { runEvaluation } from "@/lib/evaluation/runEvaluation";
import { scoreBenchmarkResult } from "@/lib/evaluation/scoreBenchmarkResult";
import {
  detectAdversarialRisk,
  type AdversarialDetectionResult,
} from "@/lib/evaluation/adversarialDetection";
import { scoreAbstractionPressure } from "@/lib/ai/scoreAbstractionPressure";

type BenchmarkScore = ReturnType<typeof scoreBenchmarkResult>;

type BenchmarkResult = {
  category: (typeof benchmarkCases)[number]["category"];
  concept: string;
  evaluationMode: string;
  isAdversarial: boolean;
  adversarialType?: string;
  evaluation: Awaited<ReturnType<typeof runEvaluation>>;
  expected: (typeof benchmarkCases)[number]["expectedCharacteristics"];
  durationMs: number;
  benchmarkScore: BenchmarkScore;
  // Abstraction-pressure scoring, present only when the case carries a fixture.
  pressureScore?: Awaited<ReturnType<typeof scoreAbstractionPressure>>;
  // Adversarial risk detection is a separate second-stage analysis.
  // It does NOT modify benchmarkScore or the evaluation output.
  adversarialDetection: AdversarialDetectionResult;
};

export async function runBenchmarks() {
  const results: BenchmarkResult[] = [];

  const allCases = [...benchmarkCases, ...adversarialCases];

  for (const testCase of allCases) {
    const startedAt = Date.now();
    const mode = testCase.evaluationMode;

    const evaluation = await runEvaluation({
      concept: testCase.concept,
      sourceText: testCase.sourceMaterial,
      userExplanation: testCase.userExplanation,
      confidence: testCase.confidence,
      evaluationMode: mode,
    });

    // Abstraction-pressure cases carry a scripted challenge/response that the
    // pressure scorer evaluates without access to the source material.
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
      testCase.isAdversarial ?? false,
      pressureScore,
      testCase.abstractionPressure
        ? { expectedPressureScoreRange: testCase.abstractionPressure.expectedPressureScoreRange }
        : undefined
    );

    // Adversarial risk detection runs on every case as an independent second-stage
    // analysis; it never alters benchmarkScore or the evaluation.
    const adversarialDetection = detectAdversarialRisk(
      {
        concept: testCase.concept,
        sourceText: testCase.sourceMaterial,
        userExplanation: testCase.userExplanation,
        confidence: testCase.confidence,
      },
      evaluation
    );

    results.push({
      category: testCase.category,
      concept: testCase.concept,
      evaluationMode: mode,
      isAdversarial: testCase.isAdversarial ?? false,
      adversarialType: testCase.adversarialType,
      evaluation,
      expected: testCase.expectedCharacteristics,
      durationMs,
      benchmarkScore,
      pressureScore,
      adversarialDetection,
    });
  }

  return results;
}
