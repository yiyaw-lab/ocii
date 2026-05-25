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
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">OCII v0</h1>
        <p className="text-sm text-gray-500">
          Open Cognitive Integrity Infrastructure
        </p>
      </div>

      <input
        className="w-full border rounded-xl p-3"
        placeholder="Concept"
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
      />

      <textarea
        className="w-full border rounded-xl p-3 h-36"
        placeholder="Source material"
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
      />

      <textarea
        className="w-full border rounded-xl p-3 h-36"
        placeholder="Explain from memory, in your own words"
        value={userExplanation}
        onChange={(e) => setUserExplanation(e.target.value)}
      />

      <label className="block">
        Confidence: {confidence}/5
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
        className="rounded-xl px-5 py-3 bg-black text-white disabled:opacity-50"
      >
        {loading ? "Evaluating..." : "Evaluate Understanding"}
      </button>

      {result && (
        <pre className="bg-gray-100 rounded-xl p-4 overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}