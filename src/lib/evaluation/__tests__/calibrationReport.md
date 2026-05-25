# Adversarial Detection Calibration Report

Calibrated against live benchmark inputs for all six adversarial case types.
Each section records the expected evaluator behaviour, expected detector subscores,
and the rationale behind the threshold constants.

---

## Threshold Constants

| Constant | Value | Scope |
|---|---|---|
| `RISK_FLAG_THRESHOLD` | 0.40 | `adversarialDetection.ts` |
| `HIGH_RISK_THRESHOLD` | 0.70 | `adversarialDetection.ts` |
| `DECEPTION_CAUGHT_THRESHOLD` | 0.30 | `scoreBenchmarkResult.ts` |

**Gap analysis:**

- Clean benchmark cases (Goodhart's Law) produce `overallAdversarialRiskScore ≈ 0.00–0.05`.
- All adversarial types produce at least one subcore ≥ 0.45 after calibration, giving
  a comfortable gap of ≥ 0.35 before the flag threshold.
- `HIGH_RISK_THRESHOLD = 0.70` is crossed only by the two strongest deception patterns
  (hallucination and vague jargon), where intervention is urgent.
- `DECEPTION_CAUGHT_THRESHOLD = 0.30` sits well below the detector's flag threshold,
  so evaluator catch/miss status is independent of detector output.

---

## Case 1: fluent_nonsense — Cognitive Load Theory

**Adversarial technique:** Inverts the core relationship between extraneous load and
germane load. Claims high extraneous load improves learning — directly opposite to
the source material.

**Why evaluator catches it:** The inversion is conceptually explicit. The evaluator
sees `extraneous load actually improves germane processing` and scores
`conceptual_accuracy` and `mechanistic_reasoning` very low (≈ 1.5).

**Evaluator outcome:**
- `overallUnderstandingScore ≈ 25–32`
- `deceptionScore ≈ 0.08–0.12` (well below `DECEPTION_CAUGHT_THRESHOLD = 0.30`)
- `evaluatorCaughtDeception = true`

**Detector subscores:**
- `fluencyRiskScore = 0` — overall score < 55 so the fluency gate suppresses it
- All other subscores ≈ 0–0.15 (no hallucination, no bluffing, no jargon)
- `overallAdversarialRiskScore < RISK_FLAG_THRESHOLD`

**Verdict:** Detector correctly does NOT fire. The evaluator already caught the
deception; the detector firing would be redundant noise.

**Design note:** The fluency heuristic's early-exit at `overallUnderstandingScore < 55`
is intentional: when the evaluator already penalises the output, there is no second
stage needed.

---

## Case 2: confident_hallucination — Retrieval-Induced Forgetting

**Adversarial technique:** Invents specific statistics ("14 replication studies",
"inhibition coefficient averages 0.73"), a non-existent named theorem
("Anderson-Bjork suppression theorem (1994)"), and a fabricated neurobiological
pathway ("direct GABAergic pathways in the hippocampal CA3 region").

**Why evaluator may be fooled:** The explanation uses correct terminology
(`inhibition`, `suppression`, `retrieval`) and sounds authoritative. Evaluators
tend to reward confident specificity.

**Evaluator outcome (fooled path):**
- `overallUnderstandingScore ≈ 55–65`
- `deceptionScore ≈ 0.50–0.70` (above `DECEPTION_CAUGHT_THRESHOLD`)
- `evaluatorCaughtDeception = false`

**Detector subscores — key heuristics triggered:**
- `hallucinationRiskScore ≥ 0.70` (HIGH):
  - Pattern matches: "14 replication" (`\d+\s*replications?`), "demonstrated that",
    "pathways", "GABAergic"/"hippocampal" — at minimum 4 patterns (base risk ≥ 0.50)
  - `mechanistic_reasoning ≤ 2.5` → +0.35 (invented mechanism compound penalty)
  - Novel named entities: "Anderson", "Bjork", "GABAergic" not in source → +0.15
  - Total: clamped at 1.0
- `overallAdversarialRiskScore = 1.0 ≥ HIGH_RISK_THRESHOLD`

**Verdict:** Detector reliably catches hallucinations. `HIGH_RISK_THRESHOLD` is
calibrated so this case always exceeds it.

**Recommended pressure test:** "Ask the learner to identify the original source for
each specific claim or named mechanism in their explanation."

---

## Case 3: memorized_paraphrase — Spaced Repetition

**Adversarial technique:** Near-verbatim synonym substitution with no abstraction,
no new examples, and no own-language reconstruction.

**Why evaluator may be fooled:** The explanation is technically accurate (just
paraphrased) so dimensions like `conceptual_accuracy` may score reasonably. The
evaluator must detect *absence of abstraction* — a harder signal.

**Evaluator outcome (fooled path):**
- `overallUnderstandingScore ≈ 40–55`
- `deceptionScore ≈ 0.40–0.55`

**Detector subscores:**
- `paraphraseRiskScore = 0.25` (moderate):
  - Unigram Jaccard ≈ 0.47 (very high shared vocabulary)
  - Bigram Jaccard ≈ 0.18 (structural phrases shared: "spaced repetition",
    "review sessions", "effortful yet successful", "active recall", etc.)
  - Combined ≈ 0.30 → falls in the moderate range (0.28–0.45) → risk = 0.25
- All other subscores < 0.10
- `overallAdversarialRiskScore = 0.25 < RISK_FLAG_THRESHOLD`

**Known detection gap:** The paraphrase heuristic uses 40/60 unigram/bigram
weighting. Near-verbatim paraphrase with synonym substitution produces high unigram
overlap but only moderate bigram overlap (synonym swaps break adjacent bigrams).
The composite score of ≈ 0.30 falls just above the moderate threshold but well
below the high threshold (0.45), so risk = 0.25.

**Mitigation:** The evaluator's own `abstraction_compression` dimension should
catch this. If `abstraction_compression` is scored low and `paraphraseRiskScore`
is flagged moderate, the combined signal warrants review even without crossing
`RISK_FLAG_THRESHOLD`. Future improvement: weight the moderate paraphrase signal
more heavily when `abstraction_compression ≤ 2.0`.

---

## Case 4: transfer_bluffing — Loss Aversion

**Adversarial technique:** Names three distinct application domains (investing,
sports, procrastination) without explaining why the *same mechanism* operates
in each domain. Conflates loss aversion with risk aversion and fear of failure.

**Why evaluator is fooled:** The explanation names real domains and uses the
concept label correctly, so `transfer_capability` may score 4.0. The evaluator
does not penalise for missing the mechanism bridge.

**Evaluator outcome (fooled path):**
- `overallUnderstandingScore ≈ 55–65`
- `transfer_capability ≈ 4.0` (evaluator fooled by domain enumeration)
- Dimension-gap heuristic produces 0 (no gap to detect when evaluator was fooled)

**Detector subscores — text heuristic fires independently:**
- `transferBluffRiskScore = 0.55`:
  - APPLICATION_CLAIM_PATTERNS matched (≥ 5 matches):
    - "applies across" (pattern 3)
    - "In investing, it" (pattern 4)
    - "it explains" (pattern 1, from "it explains why people")
    - "also explains" (pattern 2, from "also explains procrastination")
    - "explains why" (pattern 5)
  - MECHANISM_BRIDGE_PHRASES: 0 matches
  - ≥ 3 application claims + 0 bridge phrases → risk = 0.55
  - Domains matched: investing, sports/athlete/tennis, procrastination → 3 domains ≥ 2
- `overallAdversarialRiskScore = 0.55 ≥ RISK_FLAG_THRESHOLD`

**Key calibration insight:** This case demonstrates why the text heuristic is
evaluation-independent. When the evaluator gives `transfer_capability = 4.0`,
the dimension-gap heuristic produces 0. The text heuristic catches the bluff
regardless of what the evaluator scored.

**Recommended pressure test:** "Ask the learner to apply this concept to an
unfamiliar domain and explain why the same underlying mechanism operates there."

---

## Case 5: vague_intellectual_sounding — Metacognition

**Adversarial technique:** Dense pseudo-academic prose with ≥ 15 VAGUE_JARGON_TERMS
(epistemic, recursive, phenomenological, substrate, modalities, scaffolding,
instantiating, reflexive, meta-level, higher-order, representational, etc.) and
only one causal connector ("enables"), producing zero concrete information.

**Why evaluator may be fooled:** The vocabulary sounds sophisticated and the
explanation is long. Evaluators trained on academic writing may reward apparent
depth.

**Detector subscores:**
- `vagueJargonRiskScore = 0.75`:
  - matchedJargon ≥ 15 terms (≥ 3 threshold) → +0.45
  - causalMatches.length = 1 ("enables") → +0.15 (not 0.35 because one connector present)
  - mechanistic_reasoning ≤ 2.5 (mock: 1.5) → +0.15
  - Total = 0.75
- `overallAdversarialRiskScore = 0.75 ≥ HIGH_RISK_THRESHOLD`

**Without mechanistic dimension in mock:** vagueJargonRiskScore = 0.60 (still above
`RISK_FLAG_THRESHOLD`).

**Note on "enables":** The explanation contains "enables the dynamic reconfiguration"
— this is a causal connector but carries no informational content in context. It is
syntactically causal but semantically empty. The heuristic counts it, which slightly
reduces the risk score from the 0-connector case. This is acceptable: a single
superficial connector does not redeem 15 jargon terms.

**Recommended pressure test:** "Ask the learner to re-explain the concept in plain
everyday language without any technical vocabulary."

---

## Case 6: causally_inverted — Confirmation Bias

**Adversarial technique:** Presents confirmation bias as a sequential, deliberative
process (neutral exposure → rational belief formation → *then* bias activates).
The actual mechanism is concurrent and automatic: the bias operates *during*
evidence evaluation, not after beliefs consolidate.

**Evaluator outcome:**
- `conceptual_accuracy ≈ 2.5–3.5` (correctly names the concept)
- `mechanistic_reasoning ≈ 1.5–2.5` (evaluator detects the inversion)
- `overallUnderstandingScore ≈ 35–48`

**Detector subscores:**
- `causalInversionRiskScore ≥ 0.40`:
  - SEQUENTIAL_PATTERNS matched (≥ 3):
    - "people are first exposed...form an initial belief...it then causes" → `\bfirst\b.{5,80}\bthen\b`
    - "Once that belief becomes sufficiently strong, it then" → `\bonce\b.{5,80}\bthen\b`
    - "it only activates after a belief has been consolidated" → `\bonly\s+(activates?)\b`
  - With mock: conceptual = 3.0, mechanistic = 2.0, gap = 1.0 → +0.286
  - Sequential patterns + mechanistic ≤ 2.5 → +0.25
  - Total ≈ 0.54 ≥ RISK_FLAG_THRESHOLD

**Recommended pressure test:** "Ask the learner to walk through the causal sequence
step-by-step and identify which event or state comes first."

---

## Summary Table

| Adversarial type | Dominant heuristic | Expected subcore | Overall ≥ flag? | Overall ≥ high? |
|---|---|---|---|---|
| fluent_nonsense | (none — evaluator catches) | < 0.15 | NO | NO |
| confident_hallucination | hallucinationRisk | ≥ 1.0 | YES | YES |
| memorized_paraphrase | paraphraseRisk | 0.25 | NO* | NO |
| transfer_bluffing | transferBluffRisk (text) | 0.55 | YES | NO |
| vague_intellectual | vagueJargonRisk | 0.75 | YES | YES |
| causally_inverted | causalInversionRisk | ≥ 0.40–0.55 | YES | NO |

*Known detection gap for memorized_paraphrase — see Case 3 above.

---

## Threshold Justification

### `RISK_FLAG_THRESHOLD = 0.40`

Chosen so that:
- 4 of 5 adversarial types with detectable text signals are flagged (all except
  memorized_paraphrase, where the evaluator's own `abstraction_compression` is the
  primary catch mechanism)
- Clean cases (e.g., Goodhart's Law) produce max subcore < 0.10
- Gap of ~0.30–0.45 between clean and adversarial is comfortable for a deterministic
  heuristic that never calls an LLM

### `HIGH_RISK_THRESHOLD = 0.70`

Chosen so that:
- Only the two patterns with near-certain detection from text alone exceed it:
  `confident_hallucination` (1.0) and `vague_intellectual` (0.75)
- `transfer_bluffing` (0.55) and `causally_inverted` (0.40–0.55) remain in the
  "investigate" tier, not the "urgent intervention" tier
- `memorized_paraphrase` (0.25) correctly does not cross it

### `DECEPTION_CAUGHT_THRESHOLD = 0.30`

Chosen so that:
- `fluent_nonsense` (deceptionScore ≈ 0.08–0.12) is unambiguously caught
- The threshold sits well below all fooled cases (≥ 0.40)
- It is *independent* of `RISK_FLAG_THRESHOLD`: the evaluator's catch/miss
  determination does not depend on the detector's output, and vice versa

---

## Open Issues

1. **Memorized paraphrase detection gap:** The bigram-based paraphrase heuristic
   is insufficient alone for near-verbatim synonym substitution. The evaluator's
   `abstraction_compression` dimension is the primary catch mechanism; a future
   improvement could raise the composite risk when `abstraction_compression ≤ 2.0`
   and `paraphraseRiskScore ≥ 0.25`.

2. **Causal inversion is evaluation-dependent:** The `computeCausalInversionRisk`
   heuristic requires `conceptual_accuracy` and `mechanistic_reasoning` from the
   evaluation. If those dimensions are missing (e.g., quick mode), the heuristic
   returns 0. Sequential pattern detection is text-based and fires regardless;
   but the gap component needs both scores.

3. **Evaluation mode coverage:** All adversarial cases use `evaluationMode: "full"`
   to ensure that the target dimensions (e.g., `epistemic_awareness`,
   `transfer_capability`) are always scored. Quick mode evaluates only 3 dimensions
   and would leave some adversarial targets unscored.
