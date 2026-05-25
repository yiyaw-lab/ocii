import { getEvaluations } from "@/lib/db/evaluations";

export default async function HistoryPage() {
  const evaluations = await getEvaluations();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            OCII
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Cognitive Timeline
          </h1>

          <p className="mt-2 text-neutral-400">
            Longitudinal cognition history across evaluations.
          </p>
        </div>

        <div className="space-y-4">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-500">
                    {new Date(
                      evaluation.created_at
                    ).toLocaleString()}
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    {evaluation.concept}
                  </h2>
                </div>

                <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-center">
                  <p className="text-xs text-neutral-500">
                    Understanding
                  </p>

                  <p className="text-2xl font-semibold">
                    {evaluation.understanding_score}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Retrieval"
                  value={evaluation.retrieval_quality}
                />

                <Metric
                  label="Reasoning"
                  value={evaluation.reasoning_clarity}
                />

                <Metric
                  label="Transfer"
                  value={evaluation.transfer_readiness}
                />

                <Metric
                  label="Confidence"
                  value={evaluation.confidence}
                />
              </div>

              <div className="mt-5 space-y-3">
                <Block
                  title="Feedback"
                  text={evaluation.feedback}
                />

                <Block
                  title="Next Prompt"
                  text={evaluation.next_prompt}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Block({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-sm font-medium text-neutral-500">
        {title}
      </p>

      <p className="mt-2 leading-relaxed text-neutral-100">
        {text}
      </p>
    </div>
  );
}