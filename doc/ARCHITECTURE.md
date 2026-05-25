# OCII — Open Cognitive Integrity Infrastructure
## Vision
OCII is an open cognitive infrastructure system designed to evaluate, strengthen, and track genuine human understanding in the AGI era.
The project exists to address a growing problem:
> AI can increasingly generate intelligent-looking outputs without requiring genuine human understanding.
This creates:
- illusion of learning
- cognitive outsourcing
- shallow reasoning
- weak transfer capability
- overconfidence
- degraded metacognition
OCII attempts to measure and strengthen:
- conceptual understanding
- mechanistic reasoning
- retrieval robustness
- transfer capability
- metacognitive calibration
- epistemic awareness
The system is intentionally designed as:
- infrastructure-first
- rubric-driven
- benchmarkable
- longitudinal
- interpretable
- research-oriented
---
# Core Principles
## 1. Understanding is not output fluency
A polished explanation is not necessarily evidence of:
- durable memory
- causal understanding
- transfer ability
- calibrated reasoning
OCII evaluates cognitive structure, not writing polish.
---
## 2. Cognition should be inspectable
The evaluator should:
- provide evidence
- identify missing nuance
- detect misconceptions
- explain rationale
The system should avoid:
- opaque scoring
- magical “AI judgment”
- untraceable evaluations
---
## 3. Evaluation should be benchmarkable
Every evaluator can drift.
OCII therefore includes:
- benchmark cases
- expected ranges
- evaluator scoring harnesses
- variance groundwork
The evaluator itself is continuously evaluated.
---
## 4. Scoring should be deterministic where possible
LLMs generate dimension-level evaluations.
The system computes:
- weighted aggregation
- overall score
- benchmark pass/fail
This reduces:
- evaluator inconsistency
- score drift
- hallucinated percentages
---
# Architecture Overview
## Evaluation Pipeline
```txt
User Input
→ Input Validation
→ Evaluation Orchestration
→ LLM Cognitive Evaluation
→ Schema Validation
→ Normalization
→ Deterministic Scoring
→ Persistence
→ Rendering
→ Benchmark Comparison

⸻

Current System Components

1. Frontend

Location

src/components/CognitionLoop.tsx

Responsibilities

* user input
* evaluation submission
* loading/error states
* rendering evaluation receipt
* expandable cognitive audit
* displaying benchmarkable outputs

Current UI Philosophy

* high signal density
* dark research-lab aesthetic
* screenshot-worthy “understanding receipt”
* compact summary first
* full audit expandable

⸻

2. Evaluation Orchestration

Location

src/lib/evaluation/runEvaluation.ts

Responsibilities

Acts as orchestration boundary between:

* model generation
* validation
* normalization
* scoring
* persistence

This layer exists to prevent:

* evaluation logic becoming tightly coupled to model implementation

Future responsibilities:

* multi-pass evaluation
* ensemble evaluation
* evaluator comparison
* retry logic
* variance analysis
* benchmark replay

⸻

3. LLM Evaluation Layer

Location

src/lib/ai/evaluateUnderstanding.ts

Responsibilities

* builds cognitive evaluation prompt
* invokes model
* validates raw output
* normalizes evaluation
* computes deterministic score

Current Model

gpt-4.1-mini

Future Possibilities

* evaluator ensembles
* local models
* benchmark-specific evaluators
* evaluator specialization by domain

⸻

Rubric System

Location

src/lib/evaluation/rubric.ts

Current Rubric Dimensions

Core

* conceptual_accuracy
* mechanistic_reasoning
* abstraction_compression
* retrieval_robustness

Advanced

* transfer_capability
* metacognitive_calibration
* epistemic_awareness

⸻

Scoring Philosophy

Internal Scale

0.0–5.0

Dimension-level evaluation uses decimals.

External Scale

0–100

Overall score shown to users.

⸻

Weighted Scoring

Location

src/lib/evaluation/calculateOverallScore.ts

Dimension weights prioritize:

* conceptual understanding
* mechanistic reasoning
* retrieval

while still incorporating:

* transfer
* calibration
* epistemic awareness

⸻

Validation Layer

Location

src/lib/schemas/cognition.ts

Responsibilities

* validates evaluator outputs
* prevents malformed structures
* enforces evaluation contracts
* stabilizes downstream rendering/storage

Implemented using:

zod

⸻

Normalization Layer

Location

src/lib/evaluation/normalizeEvaluation.ts

Responsibilities

* text cleanup
* whitespace normalization
* typo correction
* response sanitation

Pipeline principle:

generate
→ validate
→ normalize
→ score
→ persist

⸻

Persistence Layer

Database

Supabase / Postgres

Table

evaluations

Current Stored Data

* concepts
* source material
* user explanation
* confidence
* overall score
* dimension evaluations
* summary
* related concepts

⸻

Benchmark System

Goal

The evaluator itself must be testable.

OCII includes:

* benchmark cases
* expected score ranges
* expected strong/weak dimensions
* pass/fail scoring

⸻

Benchmark Runner

Location

src/lib/evaluation/runBenchmarks.ts

API Route

/api/benchmarks

Current Outputs

* evaluation result
* duration
* benchmark score
* pass/fail

⸻

Benchmark Scoring

Location

src/lib/evaluation/scoreBenchmarkResult.ts

Responsibilities

Checks:

* expected score range
* expected high dimensions
* expected low dimensions

⸻

Current Technical Debt

1. Latency

Current evaluations are too slow (~20–30s).

Need:

* smaller prompts
* evaluator specialization
* staged evaluation
* caching
* parallelization

⸻

2. Over-Evaluation

Full rubric is too heavy for normal UX.

Solution:

evaluationMode
→ quick
→ full

Quick:

* 3 dimensions
* fast receipt

Full:

* full audit
* research/debug use

⸻

3. Evaluator Variance

Single-run evaluations remain unstable.

Future:

* multiple evaluation passes
* variance calculation
* evaluator confidence modeling
* ensemble aggregation

⸻

Future Directions

Cognitive Graphs

Link:

* concepts
* transfer pathways
* recurring weaknesses
* abstraction patterns

⸻

Longitudinal Cognition

Track:

* score evolution
* retention decay
* calibration drift
* transfer growth

⸻

Benchmark Expansion

Create:

* gold-standard datasets
* adversarial examples
* shallow vs deep explanation sets
* hallucination traps

⸻

Research Directions

Potential areas:

* cognitive integrity
* metacognitive measurement
* transfer evaluation
* retrieval robustness
* AI-assisted learning degradation
* evaluator calibration systems

⸻

Guiding Philosophy

OCII is not intended to become:

* another AI tutor
* another flashcard app
* another productivity tool

It is intended to become:

infrastructure for preserving and strengthening human cognition in the AGI era.

