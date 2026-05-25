# OCII

**Open Cognitive Integrity Infrastructure** — a research platform for evaluating genuine human understanding rather than fluent AI-assisted output.

---

## What It Does

OCII takes a free-text response to a concept prompt and evaluates it across seven cognitive dimensions using an LLM rubric. Dimension scores feed into a deterministic weighted scoring pipeline. The overall score is computed without LLM involvement — separating evaluator judgment from aggregation to limit hallucinated percentages and inconsistency drift.

---

## Cognitive Dimensions

| Dimension | What it measures |
|---|---|
| Conceptual Accuracy | Whether the core idea is correctly represented |
| Mechanistic Reasoning | Whether the learner explains how/why, not just what |
| Abstraction & Compression | Whether the learner can generalize beyond original wording |
| Transfer Capability | Whether the concept applies in a novel context |
| Retrieval Robustness | Whether the learner reconstructs rather than recognizes |
| Metacognitive Calibration | Whether confidence aligns with demonstrated understanding |
| Epistemic Awareness | Whether the learner understands the concept's boundaries and assumptions |

---

## Evaluation Pipeline

```
User Input
→ EvaluationInputSchema        (zod validation)
→ runEvaluation
→ evaluateUnderstanding        (LLM rubric, quick or full mode)
→ EvaluationOutputSchema       (zod validation)
→ normalizeEvaluation          (normalize raw LLM output)
→ calculateOverallScore        (deterministic weighted aggregation)
→ saveEvaluation               (Supabase persistence)
→ render receipt / audit UI
```

**Quick mode** evaluates a subset of dimensions. **Full mode** evaluates all seven. Quick mode reduces latency; full mode is used for benchmarking and research.

---

## Benchmark System

OCII includes a benchmark harness for evaluating the evaluator itself.

```
GET /api/benchmarks
```

Returns per-case results and a top-level `allPassed` field. Each benchmark case specifies:

- Expected score range
- Expected strong and weak dimensions
- Pass/fail consistency threshold
- Latency expectation

Run benchmarks to detect evaluator drift, calibration shifts, or regressions after rubric or model changes.

---

## Setup

```bash
npm install
npm run dev
```

Required environment variables:

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/evaluate` | POST | Run an evaluation on a concept + response |
| `/api/benchmarks` | GET | Run the benchmark suite |
| `/history` | GET | View past evaluations (backward-compatible with v0 and v1 schema) |

---

## Database Schema

Evaluations are persisted to Supabase. The schema evolved from a flat v0 score format to a rubric v1 JSONB format. The `/history` route handles both.

---

## Known Limitations

- Evaluator latency: ~10–30s depending on mode and model
- Benchmark case coverage is small; calibration is experimental
- Evaluator variance across runs is under active investigation
- Quick and full mode benchmark thresholds are not yet separately defined

---

## Research Directions

- Evaluator variance modeling and consistency scoring
- Longitudinal cognition tracking across sessions
- Ensemble evaluators with disagreement analysis
- Transfer graphs linking concepts by structural similarity
- Retrieval robustness measurement over time
