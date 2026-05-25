"use client";

import { useState } from "react";

export function CognitionLoop() {
  const [concept, setConcept] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [userExplanation, setUserExplanation] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function evaluate() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept, sourceText, userExplanation, confidence }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            OCII v0
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Cognitive Integrity Loop
          </h1>
          <p className="max-w-2xl text-neutral-400">
            Test whether a concept is actually understood, not just fluently repeated.
          </p>
        </header>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-5">
          <Field
            label="Concept"
            placeholder="Second-order effects"
            value={concept}
            onChange={setConcept}
          />

          <TextArea
            label="Source Material"
            placeholder="Paste the original idea, paragraph, or definition here."
            value={sourceText}
            onChange={setSourceText}
          />

          <TextArea
            label="Your Explanation"
            placeholder="Explain it from memory, in your own words."
            value={userExplanation}
            onChange={setUserExplanation}
          />

          <label className="block space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-300">Confidence</span>
              <span className="text-neutral-500">{confidence}/5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <button
            onClick={evaluate}
            disabled={loading}
            className="w-full rounded-2xl bg-white px-5 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Evaluating..." : "Evaluate Understanding"}
          </button>
        </section>

        {result && <EvaluationResult data={result.evaluation ?? result} />}
      </div>
    </main>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
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

function TextArea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
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

function EvaluationResult({ data }: { data: any }) {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Evaluation
        </p>
        <h2 className="text-2xl font-semibold text-white">
          Cognitive State Snapshot
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Score label="Understanding" value={data.understandingScore} />
        <Score label="Retrieval" value={data.retrievalQuality} />
        <Score label="Reasoning" value={data.reasoningClarity} />
        <Score label="Transfer" value={data.transferReadiness} />
      </div>

      <div className="space-y-3">
        <ResultBlock title="Calibration Gap" text={data.calibrationGap} />
        <ResultBlock title="Feedback" text={data.feedback} />
        <ResultBlock title="Next Prompt" text={data.nextPrompt} />
      </div>
    </section>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
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