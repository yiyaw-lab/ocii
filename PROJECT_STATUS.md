# OCII Project Status

*Last updated: 2026-05-25. 97 passing tests.*

---

## What OCII Does

OCII (Open Cognitive Integrity Infrastructure) evaluates whether a person genuinely understands a concept or is producing fluent but hollow AI-assisted output.

A user submits:
- A concept name (e.g., "Confirmation Bias")
- Source material (a short authoritative passage)
- Their own explanation of the concept
- A self-reported confidence rating (1–5)

OCII returns per-dimension scores, supporting evidence, identified misconceptions, an overall understanding score (0–100), and a suggested next learning step.

---

## Core Architecture

```
User input
→ EvaluationInputSchema (Zod validation)
→ runEvaluation
  → evaluateUnderstanding (quick or full)  OR  runEnsembleEvaluation
    → gpt-4.1-mini via OpenAI API
    → EvaluationOutputSchema (Zod)
    → normalizeEvaluation
    → calculateOverallScore (weighted average, scaled to 0–100)
→ detectAdversarialRisk (deterministic, no LLM — second stage only)
→ saveEvaluation (Supabase, JSONB)
→ render receipt + expandable audit
```

**Evaluation modes:**

| Mode | Dimensions scored | LLM calls | Use case |
|---|---|---|---|
| quick | 3 (conceptual_accuracy, mechanistic_reasoning, retrieval_robustness) | 1 | Normal UX |
| full | 5 most relevant (chosen by evaluator) | 1 | Benchmark, adversarial testing |
| ensemble | 3 (quick ×3 at temperatures 0.5, 0.6, 0.7) | 3 | Disagreement analysis |

**Overall score formula:** weighted average of dimension scores, scaled to 0–100. Weights: `conceptual_accuracy` 1.4×, `mechanistic_reasoning` 1.2×, `abstraction_compression` 1.1×, `retrieval_robustness` 1.1×, `transfer_capability` 0.9×, `metacognitive_calibration` 0.8×, `epistemic_awareness` 0.7×.

**Adversarial detector:** runs after every evaluation, deterministic heuristics only. Outputs six risk subscores (0–1), an `overallAdversarialRiskScore = max(subscores)`, risk flags, and a recommended pressure-test question. Does not modify the understanding score.

---

## Rubric Dimensions

Seven dimensions, each scored 0.0–5.0 by the LLM:

| Dimension | What it measures |
|---|---|
| `conceptual_accuracy` | Core concept correctly represented without distortion |
| `mechanistic_reasoning` | Causal explanation of how/why the concept works |
| `abstraction_compression` | Own-language reconstruction beyond source paraphrase |
| `transfer_capability` | Applying the concept in a novel domain |
| `retrieval_robustness` | Reconstructed from memory vs. recognized/copied |
| `metacognitive_calibration` | Confidence aligned with demonstrated understanding |
| `epistemic_awareness` | Awareness of limits, assumptions, and boundary conditions |

---

## Benchmark Categories

**Standard cases (2):**

| Concept | Mode | Expected range |
|---|---|---|
| Goodhart's Law | quick | 60–75 |
| Goodhart's Law | ensemble | 55–80 |

**Adversarial cases (6):** all use `full` mode. A benchmark **passes** when the evaluator correctly assigns low scores (deception caught). It **fails** when the evaluator is fooled.

| Concept | Adversarial type | Expected range | Target low dimensions |
|---|---|---|---|
| Cognitive Load Theory | fluent_nonsense | 0–38 | conceptual_accuracy, mechanistic_reasoning |
| Retrieval-Induced Forgetting | confident_hallucination | 0–35 | conceptual_accuracy, epistemic_awareness, metacognitive_calibration |
| Spaced Repetition | memorized_paraphrase | 0–42 | abstraction_compression, transfer_capability |
| Loss Aversion | transfer_bluffing | 0–40 | transfer_capability, mechanistic_reasoning, epistemic_awareness |
| Metacognition | vague_intellectual_sounding | 0–30 | conceptual_accuracy, mechanistic_reasoning, abstraction_compression |
| Confirmation Bias | causally_inverted | 0–45 | mechanistic_reasoning, conceptual_accuracy |

**Scoring for adversarial cases:**

- `deceptionScore` (0–1): `missedCatches × 0.6 + normalizedOverall × 0.4`. Higher = more fooled.
- `evaluatorCaughtDeception = deceptionScore < 0.30`
- `RISK_FLAG_THRESHOLD = 0.40` — adversarial detector fires above this
- `HIGH_RISK_THRESHOLD = 0.70` — urgent intervention threshold

---

## Test Status

**97 tests passing across 6 files.**

| File | Tests | Coverage |
|---|---|---|
| `adversarialDetection.test.ts` | 65 | All 6 heuristics, integration, edge cases |
| `calibration.test.ts` | 32 | Frozen benchmark fixtures, threshold semantics |
| `scoreBenchmarkResult.test.ts` | — | deceptionScore formula, pass/fail gates |
| `calculateOverallScore.test.ts` | — | Weighted scoring, edge cases |
| `aggregateEnsemble.test.ts` | — | Consensus aggregation |
| `disagreementAnalysis.test.ts` | — | Variance and agreement score computation |

---

## Known Evaluator Failure Modes

**Transfer bluffing (confirmed empirically):** The evaluator awarded `transfer_capability = 4.0` to Loss Aversion text that enumerated three domains (investing, sports, procrastination) without explaining why the same mechanism operates in each. The evaluator rewards domain coverage, not mechanism bridging. Mitigation: the text heuristic catches this evaluation-independently.

**Memorized paraphrase (partial miss):** The evaluator may score `abstraction_compression` low but not always low enough to push the overall score outside the expected range. Near-verbatim synonym substitution is the hardest adversarial type for the detector — the paraphrase heuristic returns a moderate risk score (0.25), which does not cross `RISK_FLAG_THRESHOLD`. The evaluator's own `abstraction_compression` score is the primary catch mechanism.

**Vague jargon (partially fooled):** Dense pseudo-academic vocabulary can produce moderate overall scores (40–55) when the evaluator rewards apparent sophistication. The adversarial detector reliably catches this (vagueJargonRiskScore ≥ 0.75), but the evaluator's own score is not always below the expected range.

**Causal inversion (partially caught):** The evaluator typically reduces `mechanistic_reasoning` but may retain moderate `conceptual_accuracy`, leaving the overall score in an ambiguous band. Sequential temporal framing ("first…then", "only activates after") is a reliable text signal.

**Fluent nonsense (reliably caught):** Explicit mechanism inversions (e.g., "high extraneous load improves germane processing") are consistently flagged with very low scores. The detector does not need to fire — the evaluator catches it directly.

---

## Most Important Empirical Findings

1. **Clear conceptual inversions are reliably caught.** When the adversarial text directly contradicts the source mechanism, the evaluator scores `conceptual_accuracy` ≤ 2.0. Deception score ≈ 0.08 for fluent_nonsense — well below the caught threshold.

2. **The evaluator is fooled by confident specificity.** Invented statistics, named theorems, and neurobiological pathways (confident_hallucination case) produced higher scores. The hallucination heuristic catches this from text alone: it fires at hallucinationRiskScore = 1.0 when confident claims + low mechanistic reasoning + novel named entities are all present.

3. **Domain enumeration fools transfer scoring.** Loss Aversion bluffing obtained `transfer_capability = 4.0` despite zero mechanism bridging. This means dimension-gap heuristics are insufficient when the evaluator itself was deceived. Evaluation-independent text analysis (application claim counting) is necessary.

4. **Max-of-subscores outperforms mean for overall adversarial risk.** A hallucination subcore of 1.0 averaged with five zero subscores gives 0.17 — below the flag threshold. Using `max(subscores)` preserves the strongest signal and avoids dilution.

5. **Ensemble temperature variance is a quality signal.** Three evaluations at temperatures 0.5–0.7 produce an agreement score and identify low-consensus dimensions. High variance on a dimension is evidence that the evaluator is uncertain, which may itself be informative about explanation quality.

6. **Threshold gap is stable.** Clean explanations produce `overallAdversarialRiskScore < 0.10`; adversarial cases produce ≥ 0.40 (except memorized_paraphrase at 0.25). The 0.30+ gap provides reliable separation without LLM assistance.

---

## Next Recommended Engineering Steps

1. **Reduce evaluation latency.** Full mode runs ~20–30 seconds. Profile where time is spent (LLM call vs. parsing vs. DB write). Consider streaming partial results to the UI.

2. **Fix remaining TypeScript `unknown` types** in UI components and DB persistence layer (`evaluations.ts`).

3. **Make `/api/benchmarks` return structured pass/fail JSON** suitable for CI and external consumers. Currently output is only readable via the CLI formatter.

4. **Upgrade memorized_paraphrase detection.** Combine `paraphraseRiskScore ≥ 0.25` with `abstraction_compression ≤ 2.0` to cross the flag threshold jointly. This requires the benchmark runner to pass dimension scores to the detector's composite calculation.

5. **Add adversarial cases to ensemble mode.** Currently adversarial benchmarks all use `full` mode. Running them in ensemble would measure whether evaluator agreement is lower for adversarial inputs — a potentially useful signal.

6. **Fix `/history` backward compatibility** for flat-score v0 rows vs. JSONB v1 rows.

---

## Next Recommended Research Questions

1. **Discriminative validity of rubric dimensions.** Which dimensions most reliably distinguish genuine understanding from surface fluency? Do `mechanistic_reasoning` and `epistemic_awareness` consistently outperform `transfer_capability` as adversarial catches?

2. **Evaluator agreement as an adversarial signal.** Does low ensemble agreement correlate with adversarial input? If adversarial cases produce higher variance across temperatures, the agreement score could augment the deterministic detector without an additional LLM call.

3. **False positive rate on confident-but-correct explanations.** The hallucination heuristic fires on any text with specific empirical claims paired with low mechanistic scores. A genuine expert explanation may contain specific numbers. What is the false positive rate on high-quality explanations?

4. **Causal inversion text detection without evaluation scores.** The current causal inversion heuristic depends on `conceptual_accuracy` and `mechanistic_reasoning` from the LLM. Can sequential temporal framing detection alone (evaluation-independent) achieve reliable flagging?

5. **Cross-domain concept generalization.** Current benchmarks cover cognitive science and economics concepts. Do the rubric weights and adversarial heuristics generalize to different domains (e.g., biology, physics, software engineering)?

6. **Longitudinal stability.** If the same user is evaluated on the same concept at T0 and T+7 days, does the evaluation score change predictably with learning? This would validate that the score measures durable understanding rather than short-term recall.
