# Paraphrase Inflation and Abstraction Pressure Tests

**Date:** 2026-05-25
**Status:** Implemented, benchmark-verified

---

## 1. Problem discovered

The OCII rubric evaluator consistently scores near-verbatim paraphrases of concept definitions at the same level as genuine explanations demonstrating mechanistic reasoning and novel transfer.

Two cases from the benchmark suite illustrate this:

| Explanation type | Concept | Overall score |
|---|---|---|
| Strong understanding | Dunning-Kruger Effect | 100 |
| Strong understanding | Natural Selection | 88 |
| Strong understanding | Opportunity Cost | 94 |
| Near-verbatim paraphrase | Cognitive Dissonance | 97 |
| Near-verbatim paraphrase | Confirmation Bias | 94 |

The paraphrase cases scored *above* several strong-understanding cases. There is no meaningful signal separation between the two groups on overall score.

---

## 2. Benchmark evidence

The Cognitive Dissonance paraphrase case is the clearest example. The learner explanation is a lightly reworded copy of the source definition:

**Source material:**
> Cognitive dissonance is the psychological discomfort experienced when a person holds two or more contradictory beliefs, values, or attitudes simultaneously. People are motivated to reduce this discomfort by changing a belief, adding new information, or reducing the importance of the conflict.

**Learner explanation (paraphrase):**
> Cognitive dissonance is when a person holds two or more contradictory beliefs, values, or attitudes at the same time, which causes psychological discomfort. People try to reduce this discomfort by changing one of the beliefs, finding new information, or deciding the conflict isn't that important.

Evaluator dimension scores in quick mode (conceptual_accuracy, mechanistic_reasoning, retrieval_robustness):

| Dimension | Score |
|---|---|
| conceptual_accuracy | 5.0 |
| mechanistic_reasoning | 4.5 |
| retrieval_robustness | 5.0 |
| **Overall** | **97** |

The evaluator correctly noted that the explanation "accurately captures core definition." It did not flag that the explanation reproduced the source rather than reconstructed from memory.

---

## 3. Why source-visible evaluation fails

The evaluator sees the source material and the learner explanation together. This creates a structural problem: a paraphrase that correctly reproduces the source text *is* accurate, *does* include whatever mechanism the source mentioned, and *does* demonstrate that the learner can reproduce the key content.

The evaluator cannot penalize this because it has no counterfactual. It cannot tell whether the learner would produce the same explanation without the source present.

Three dimensions are particularly vulnerable:

**conceptual_accuracy** — A correct paraphrase is accurate by definition. The definition is correct; so is the copy.

**mechanistic_reasoning** — If the source explains the mechanism (as most good definitions do), a paraphrase inherits that mechanism automatically. The evaluator sees mechanism in the output and scores it; it cannot tell whether the learner understands the mechanism or copied it.

**retrieval_robustness** — Defined as reconstructing rather than recognizing. But when the source is present, copying is indistinguishable from recall. The dimension is measuring whether the output is coherent, not whether it was reconstructed from memory.

This is not a failure of the rubric. It is a structural property of evaluation-with-source. No rubric can resolve it without additional information.

---

## 4. Why abstraction pressure helps

The pressure test removes the source material from the second evaluation stage. The learner is given a challenge that cannot be answered by restating the definition:

- **Analogy** — map the concept structure to a different domain
- **Transfer** — apply the concept to a novel, specific situation
- **Compression** — state the essential logical structure in different words
- **Reframing** — explain to a skeptic or non-expert

Because the pressure scorer receives only `(concept name, challenge, response)` — not the source text — paraphrase no longer helps. The learner must demonstrate structural knowledge.

Benchmark results for the three pressure test cases:

| Concept | Overall score (standard eval) | pressureScore | evidenceOfParaphrase |
|---|---|---|---|
| Cognitive Dissonance (paraphrase restated) | 94 | 0 | true |
| Opportunity Cost (buzzword compression) | 87 | 40 | true |
| Natural Selection (vague transfer evasion) | 91 | 20 | true |

All three were detected as paraphrase or evasion. The standard evaluator saw scores of 87–94; the pressure scorer saw scores of 0–40. The gap between the two signals is the paraphrase inflation estimate.

The three scripted response patterns tested:

1. **Fluent paraphrase** — challenge asked for an analogy; learner restated the definition verbatim. pressureScore: 0.
2. **Borrowed sophistication** — challenge asked for compression without economic language; learner produced buzzword-dense prose ("decision-theoretic mental model," "future optionality preservation"). pressureScore: 40. The scorer detected paraphrase but gave partial credit for the attempt at technical framing.
3. **Vague intellectual wording** — challenge asked for transfer to programming language evolution; learner responded with philosophical language about "adaptation and entropy in complex systems." pressureScore: 20.

---

## 5. Remaining limitations

**Pressure scoring is not source-free at the concept level.** The scorer receives the concept name. A learner who knows the label but not the structure could potentially generate plausible-sounding responses. This is partially mitigated by requiring structural specificity in the challenge (e.g., "identify which element plays the role of variation, heritability, and differential reproduction").

**Pressure score variance.** The scorer is an LLM call and introduces its own variance. In two runs of the Opportunity Cost buzzword case, pressureScore ranged from 40 to 40 (stable in that instance, but calibrated to a wider range of [0, 50] to account for run-to-run variation). The pressure scorer needs its own variance characterization.

**Two-stage interaction not yet in UI.** The pressure test requires a second user interaction: the challenge is generated after the initial evaluation, the learner must respond, and then the response is scored. The infrastructure supports this but the UI does not yet present the challenge or collect the response.

**Coverage is limited to three evasion patterns.** The current benchmark tests: direct paraphrase, buzzword compression, and vague transfer evasion. Patterns not yet tested: plausible-but-wrong analogy, partially correct transfer, compression that captures one aspect but loses the critical invariant.

**Quick mode does not generate a pressure challenge.** The challenge is only produced in full-mode evaluation. Quick mode remains fully vulnerable to paraphrase inflation.

---

## 6. Open research questions

**Q1: What is the distribution of paraphrase inflation across concepts?**
The Cognitive Dissonance case showed an inflation of approximately 94 points (standard score) vs. 0 (pressure score). Is this typical? Does inflation scale with definition quality — i.e., do well-written definitions produce more inflation because they include more mechanism?

**Q2: Can a pressure challenge be constructed that is immune to LLM-assisted responses?**
A learner using an LLM to answer the pressure challenge can potentially generate a structurally correct analogy without genuine understanding. The challenge design needs to be evaluated against LLM-assisted responses specifically.

**Q3: What pressureScore threshold separates genuine abstraction from evasion?**
The current ranges treat ≤40 as low and ≥60 as high. These thresholds are calibrated from three cases and should be validated against a broader set of known-genuine and known-paraphrase responses.

**Q4: Does pressureScore correlate with future retrieval?**
If the pressure test is genuinely detecting structural understanding, learners who score high should show more durable retrieval on the same concept at a later session. This is testable with longitudinal data.

**Q5: Should the pressure challenge type be adaptive?**
Currently the challenge type (analogy, transfer, compression, reframing) is selected by the evaluator. It is not clear whether some types are harder to fake than others for specific concept categories. Transfer may be harder to fake for empirical concepts; compression may be harder to fake for abstract principles.
