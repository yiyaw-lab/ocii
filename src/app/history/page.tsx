import { getEvaluations } from "@/lib/db/evaluations";

export default async function HistoryPage() {
  const evaluations = await getEvaluations();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            OCII
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Cognitive Timeline
          </h1>
          <p className="mt-2 text-neutral-400">
            Longitudinal record of understanding, calibration, and transfer.
          </p>
        </header>

        <div className="space-y-4">
          {evaluations.map((evaluation) => {
            const score =
              evaluation.overall_understanding_score ??
              evaluation.understanding_score ??
              "—";

            const summary = evaluation.summary ?? {};
            const dimensions = evaluation.dimension_evaluations ?? [];

            return (
              <article
                key={evaluation.id}
                className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">
                      {new Date(evaluation.created_at).toLocaleString()}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {evaluation.concept}
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-center">
                    <p className="text-xs text-neutral-500">Score</p>
                    <p className="text-2xl font-semibold">{score}</p>
                    <p className="text-xs text-neutral-500">/100</p>
                  </div>
                </div>

                {evaluation.related_concepts?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {evaluation.related_concepts.map((concept: string) => (
                      <span
                        key={concept}
                        className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs text-neutral-300"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                )}

                {dimensions.length > 0 && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dimensions.slice(0, 3).map((dimension: any) => (
                      <div
                        key={dimension.dimension}
                        className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                      >
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          {dimension.dimension.replaceAll("_", " ")}
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {Number(dimension.score).toFixed(1)}/5
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Feedback
                  </p>
                  <p className="mt-2 leading-relaxed text-neutral-100">
                    {summary.overallFeedback ??
                      evaluation.feedback ??
                      "No feedback saved."}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}