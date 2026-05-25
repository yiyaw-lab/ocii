# Paraphrase Detection: Research Notes

## Why paraphrase detection is difficult

### The core problem

A surface paraphrase of a well-written definition is nearly indistinguishable from genuine understanding when scored on accuracy alone.
Consider the definition of cognitive dissonance:

> Cognitive dissonance is the psychological discomfort experienced when a person holds two or more contradictory beliefs simultaneously. People reduce this discomfort by changing a belief, adding new information, or minimizing the conflict.

A learner who copies this verbatim and a learner who genuinely understands it will produce explanations that score identically on `conceptual_accuracy` — because both are correct. The definition itself encodes the mechanism. Paraphrase inherits that correctness for free.

This is not a bug in the evaluator; it is a structural property of concept definitions:
**Definitions are compressed explanations. Decompressing them accurately requires understanding — or access to the original text.**

Since we always provide the source material to the evaluator, a near-copy cannot be distinguished from reconstruction without additional evidence.

---

### Why quick-mode evaluation is especially vulnerable

Quick mode evaluates 3 dimensions: `conceptual_accuracy`, `mechanistic_reasoning`, `retrieval_robustness`.

All three reward paraphrase:
- `conceptual_accuracy`: a correct paraphrase is accurate by definition
- `mechanistic_reasoning`: if the source text states the mechanism, the paraphrase includes it
- `retrieval_robustness`: a paraphrase demonstrates that the learner can retrieve the definition — which is precisely what it tests

In benchmark runs, surface paraphrase cases in quick mode scored 87–97. Strong understanding cases scored 91–94. The distributions overlap almost completely.

**Quick mode cannot reliably detect paraphrase.** It is designed for speed, not depth.

---

### Why the evaluator inflates scores for "borrowed" sophistication

LLM evaluators are trained on text that rewards fluent, technically correct writing. When a learner uses sophisticated-sounding language — even vacuously — the evaluator interprets it as evidence of understanding rather than evidence of inflation.

Examples of borrowed sophistication that inflate scores:
- "It's fundamentally about cognitive framing and the mental model we apply..."
- "This reflects the tension between representation and reality at the systemic level..."
- "It's an emergent property of the optimization landscape..."

These phrases are fluent, technically adjacent to the concept, and unverifiable as genuine understanding vs. LLM-assisted output. Current evaluators reward them.

---

## Why transfer and abstraction are harder to fake

### Transfer requires structural mapping

To transfer a concept to a novel domain, a learner must:
1. Identify the abstract structure underneath the original example
2. Find an isomorphic structure in a new domain
3. Map the roles correctly

A learner who only knows the surface definition cannot do step 1. They know what cognitive dissonance *is called*, not what structural property produces it. When asked "give an analogy from a non-psychological domain," a paraphrase-only learner will:
- Repeat the definition
- Use vague language ("it's like when systems conflict")
- Produce a structurally wrong analogy

This is detectable. A correct analogy from a different domain demonstrates structural knowledge that the definition alone cannot provide.

### Abstraction compression is generative, not reproductive

When asked to compress a concept to its essential logical structure, a learner must extract the invariant that survives across all instances of the concept. This is a generative act — the output is not a substring of the source. Paraphrase produces a substring. Genuine compression produces something new.

A learner who understands opportunity cost will produce:
> "Every choice that commits a resource removes all alternatives that resource could have enabled."

A learner who only paraphrased will produce:
> "The value of the best alternative forgone when making a choice because resources are scarce."

The first is generative. The second is reproductive. The structure is different even though both are "correct."

### Reframing requires perspective-taking

Explaining a concept to a skeptic or a child requires modeling the other person's knowledge state and building a bridge from there. This requires understanding what *makes* the concept surprising or non-obvious — something that cannot be extracted from a definition without grasping its implications.

---

## Current evaluator limitations

### 1. Source text contamination

The evaluator always receives the source material. This means:
- It cannot distinguish recall from reading
- A copy of the source scores identically to a reconstruction from memory
- Any paraphrase that correctly reproduces the source receives full `retrieval_robustness` credit

**Mitigation**: Abstraction pressure tests do not receive the source text. The scorer evaluates only `(challenge, response)` against the concept name — the source is not available to crib from.

### 2. Evaluator confidence miscalibration

In benchmark runs, the evaluator frequently reported `evaluatorConfidence: "high"` for paraphrase cases.  
It expressed the same confidence when scoring a near-verbatim copy and a novel mechanistic explanation.

This suggests the evaluator conflates text quality with epistemic quality — fluent text triggers high evaluator confidence regardless of whether understanding is demonstrated.

### 3. Dimension score granularity is insufficient at the top

The 0–5 scale compresses genuine understanding and polished paraphrase into the same top band (4.0–5.0). With only 3 dimensions in quick mode and a weighted average, a case where all three dimensions score 4.5 produces an overall score of 90, indistinguishable from a case with genuine mechanistic understanding.

**The top of the scale needs more resolution, or paraphrase detection needs a separate signal.**

### 4. `epistemic_awareness` is not reliably evaluated in full mode

Full mode asks the evaluator to pick its "5 most relevant" dimensions. `epistemic_awareness` is frequently not selected, making it unreliable for benchmark assertions. Cases that expected it to score low (paraphrase cases have no boundary awareness) failed when the dimension was simply not evaluated.

---

## The abstraction pressure test design

### Design principle

An abstraction pressure test is a challenge constructed so that it **cannot be answered by restating the definition**. The challenge must require one of:

| Type | What it demands | Why it resists paraphrase |
|---|---|---|
| **Analogy** | A structurally correct example from a different domain | Requires extracting invariant structure |
| **Transfer** | Apply the concept to a novel, specific situation | Requires structural mapping + domain knowledge |
| **Compression** | State the essential logical structure in different words | Must be generative, not reproductive |
| **Reframing** | Explain to a skeptic or a non-expert | Requires modeling their knowledge gap |

### Scoring philosophy

The pressure scorer does not have access to the source material. It evaluates:
- Does the response actually fulfill the challenge type?
- Is the response paraphrase of the definition (detectable by structural similarity)?
- Is there evidence of genuine mapping, transfer, or compression?

The pressure score is weighted heavily against paraphrase. A response that correctly states the definition but ignores a transfer challenge scores near zero.

### Known limitation of the pressure approach

The pressure test is a second-round interaction. In the current pipeline:
1. Evaluation generates a challenge
2. The user would need to respond
3. The response would then be scored

This means the pressure score is only available after a two-step interaction, which adds latency. For benchmarks, the challenge and response are pre-scripted (fixed in the test case), so no round-trip is needed. For UI integration, the challenge appears after evaluation and the learner's response is scored separately.

---

## References and grounding

- **Paraphrase vs. understanding**: Bloom's Taxonomy (1956, revised 2001) distinguishes *remembering* (reproduction) from *understanding* (interpretation and comparison) as separate cognitive processes. Our evaluator currently does not reliably separate these.
- **Transfer**: Detterman & Sternberg (1993) showed that near-transfer (same domain, different examples) is far more common than far-transfer (different domains). Our transfer pressure tests use far-transfer challenges specifically because near-transfer is achievable via paraphrase.
- **Source material contamination**: Karpicke & Blunt (2011) on retrieval practice showed that recall (without the source present) is more predictive of long-term learning than re-reading (with the source present). Our evaluation currently conflates both.
- **Fluency illusion**: Koriat & Bjork (2005) documented that subjective fluency inflates confidence and perceived understanding. LLM evaluators appear to share this bias.
