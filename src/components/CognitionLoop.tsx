"use client";

import { useState } from "react";

type DimensionEvaluation = {
  dimension: string;
  score: number;
  evaluatorConfidence: string;
  evidence: string[];
  misconceptions: string[];
  missingNuance: string[];
  rationale: string;
  nextTestPrompt: string;
};

type EvaluationData = {
  overallUnderstandingScore?: number;
  relatedConcepts?: string[];
  dimensionEvaluations?: DimensionEvaluation[];
  summary?: {
    overallFeedback?: string;
    calibrationAssessment?: string;
    nextLearningStep?: string;
  };
};

export function CognitionLoop() {
  const [concept, setConcept] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [userExplanation, setUserExplanation] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [evaluationMode, setEvaluationMode] = useState<"quick" | "full">("quick");
  const [result, setResult] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function evaluate() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    
        body: JSON.stringify({ concept, sourceText, userExplanation, confidence, evaluationMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ?? "Evaluation failed");
      }
      setResult(data.evaluation ?? data);
    } catch (error) {
        setError(error instanceof Error ? error.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">OCII v0</p>
          <h1 className="text-4xl font-semibold tracking-tight">Cognitive Integrity Loop</h1>
          <p className="max-w-2xl text-neutral-400">
            Test whether a concept is actually understood, not just fluently repeated.
          </p>
        </header>

        <section className="space-y-5 rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
          <Field label="Concept" placeholder="Second-order effects" value={concept} onChange={setConcept} />
          <TextArea label="Source Material" placeholder="Paste the original idea, paragraph, or definition here." value={sourceText} onChange={setSourceText} />
          <TextArea label="Your Explanation" placeholder="Explain it from memory, in your own words." value={userExplanation} onChange={setUserExplanation} />

          <label className="block space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-300">Confidence</span>
              <span className="text-neutral-500">{confidence}/5</span>
            </div>
            <input type="range" min="1" max="5" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full" />
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Mode</span>
            <div className="flex rounded-xl border border-neutral-700 bg-neutral-950 p-1 text-sm">
              {(["quick", "full"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEvaluationMode(m)}
                  className={`rounded-lg px-3 py-1 transition ${
                    evaluationMode === m
                      ? "bg-white text-neutral-950 font-medium"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {m === "quick" ? "Quick" : "Full Audit"}
                </button>
              ))}
            </div>
            <span className="text-xs text-neutral-600">
              {evaluationMode === "quick" ? "3 dimensions · fast" : "7 dimensions · deep"}
            </span>
          </div>

          <button
            onClick={evaluate}
            disabled={loading}
            className="w-full rounded-2xl bg-white px-5 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Evaluating..." : "Evaluate Understanding"}
          </button>
          {loading && (
  <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
    Running cognitive audit… this may take a few seconds.
  </div>
)}

{error && (
  <div className="rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
    {error}
  </div>
)}
        </section>

        {result && <EvaluationResult data={result} />}
      </div>
    </main>
  );
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <input
        className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-neutral-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-300">{label}</span>
      <textarea
        className="h-36 w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-neutral-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function EvaluationResult({ data }: { data: EvaluationData }) {
  const top = data.dimensionEvaluations?.slice(0, 3) ?? [];

  return (
    <section className="space-y-6 rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Cognitive Verification</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Understanding Receipt</h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-400">
            Evidence-based evaluation of recall, reasoning, transfer, and calibration.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Score</p>
          <p className="mt-1 text-4xl font-semibold text-white">{data.overallUnderstandingScore ?? "—"}</p>
          <p className="text-xs text-neutral-500">/100</p>
        </div>
      </div>

      {!!data.relatedConcepts?.length && (
        <div className="flex flex-wrap gap-2">
          {data.relatedConcepts.map((concept) => (
            <span key={concept} className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs text-neutral-300">
              {concept}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {top.map((item) => (
          <div key={item.dimension} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{formatDimension(item.dimension)}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.score.toFixed(1)}/5</p>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-400">{item.rationale}</p>
          </div>
        ))}
      </div>

      {data.summary && (
        <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Verdict</p>
            <p className="mt-2 leading-relaxed text-neutral-100">{data.summary.overallFeedback}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MiniBlock label="Calibration" text={data.summary.calibrationAssessment ?? ""} />
            <MiniBlock label="Next Test" text={data.summary.nextLearningStep ?? ""} />
          </div>
        </div>
      )}

      <details className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        <summary className="cursor-pointer text-sm font-medium text-neutral-300">
          View full cognitive audit
        </summary>

        <div className="mt-5 space-y-4">
          {data.dimensionEvaluations?.map((item) => (
            <div key={item.dimension} className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-white">{formatDimension(item.dimension)}</h3>
                <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-200">{item.score}/5</span>
              </div>

              <p className="text-sm text-neutral-500">Evaluator confidence: {item.evaluatorConfidence}</p>

              <ResultList title="Evidence" items={item.evidence} />
              <ResultList title="Missing Nuance" items={item.missingNuance} />
              <ResultList title="Misconceptions" items={item.misconceptions} />

              <ResultBlock title="Rationale" text={item.rationale} />
              <ResultBlock title="Next Test Prompt" text={item.nextTestPrompt} />
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function MiniBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-200">{text}</p>
    </div>
  );
}

function ResultBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-sm font-medium text-neutral-400">{title}</p>
      <p className="mt-2 leading-relaxed text-neutral-100">{text}</p>
    </div>
  );
}

function ResultList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;

  return (
    <div>
      <p className="text-sm font-medium text-neutral-400">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-200">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function formatDimension(value: string) {
  return value.replaceAll("_", " ");
}