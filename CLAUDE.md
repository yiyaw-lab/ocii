@AGENTS.md

# Claude Code Handoff: OCII

## Mission

Stabilize the OCII codebase without changing the core product philosophy.

OCII is an Open Cognitive Integrity Infrastructure project. It evaluates whether a person genuinely understands a concept instead of merely producing fluent AI-assisted output.

## Current Priorities

1. Implement quick/full evaluation modes.
2. Reduce evaluation latency. Current benchmark latency is ~20–30 seconds.
3. Clean TypeScript types across:
   - evaluation pipeline
   - benchmark runner
   - UI components
   - DB persistence
4. Preserve the evaluation pipeline:
   input → validation → evaluation → normalization → deterministic scoring → persistence → rendering
5. Preserve the receipt UI + expandable full audit.
6. Make `/api/benchmarks` return clear pass/fail output.
7. Do not add unnecessary features.

## Constraints

- Do not change the core rubric philosophy without asking.
- Do not remove benchmark infrastructure.
- Do not remove normalization.
- Do not make the UI more complex.
- Do not introduce auth yet.
- Do not introduce a new database provider.
- Prefer small, readable commits.
- Keep the project simple and inspectable.

## Known Issues

- Evaluation latency is too high.
- Full rubric evaluation is too heavy for normal UX.
- Quick mode should evaluate fewer dimensions.
- Benchmark expectations need clearer moderate/high/low thresholds.
- Some TypeScript types still use `unknown`.
- Database schema evolved from flat v0 scores to rubric v1 JSONB.
- `/history` should remain backward-compatible with old and new rows.

## Desired Architecture

Evaluation should flow through:

```txt
User input
→ EvaluationInputSchema
→ runEvaluation
→ evaluateUnderstanding
→ EvaluationOutputSchema
→ normalizeEvaluation
→ calculateOverallScore
→ saveEvaluation
→ render receipt/audit
```
