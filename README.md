# meta-hackathon-lab

## 1. Positioning

An AI development and execution platform that improves the AI development process through records, audits, and human judgement, and feeds what it learns back into the next round of development.

It does not claim to improve itself autonomously. At the same time, it is not merely an AI development management tool. It shows, with concrete examples, that the scope of improvement extends beyond code to requirements definition, work breakdown, quality control, planning, and how the work is presented.

Solo entry on the Indie track ([D2](docs/decisions/D2-track.md)). The submission is an integrated demo: the platform (L1) running an editorial workflow (L2) ([D1](docs/decisions/D1-submission-positioning.md)).

## 2. Live demo (L2)

The demo is a job-posting fact-checking workflow for editorial staff: before a job listing page (LP) is generated, the text is extracted into FACTs, reconciled against the pinned source, and held for human approval. When a summary contradicts the source, the run stops instead of generating.

- Public preview: https://meta-hackathon-lab-demo.pages.dev/
- Repository: https://github.com/bonno-420/meta-hackathon-lab
- All data is fictional. No real job postings, companies, applicants, or personal information are used.

## 3. How it works

The pipeline runs five stages in order: source fixed -> FACT extraction/reconciliation and contradiction detection -> human approval -> LP generation -> re-verification.

- The source job posting is pinned (fixed bytes with a recorded hash); approval stands only for that fixed source-and-FACT pair.
- The run stops on contradiction (e.g. an hourly wage of 1,700 yen in a summary against 1,500 yen in the source stops at reconciliation and is never approved or generated).
- Items not stated in the source are not generated as claims; they are recorded as unstated and rendered only as "not stated".
- Expired approval or input mismatch refuses generation before any API call; there is no path that skips ahead with a warning ignored.
- Re-verification re-runs input-identity and grounding checks independently of the generator's own report, plus a human confirmation of every sentence. A passing verdict permits only an in-demo preview, not publication.

## 4. Process improvement in practice

Improvement here covers more than code. Each item below links to the record that demonstrates it:

- Requirements definition: [docs/learnings.md](docs/learnings.md) (L-027: draft the intended final text early so implementers share the picture).
- Work breakdown: [docs/decisions/D11-working-arrangement.md](docs/decisions/D11-working-arrangement.md) (design, audit, writing, and production split across lines under user-and-coordinator direction).
- Quality control: [experiments/exp-003-audit-model-comparison.md](experiments/exp-003-audit-model-comparison.md) (measured comparison of audit quality between two models).
- Planning: [docs/decisions/D10-design-and-expansion-policy.md](docs/decisions/D10-design-and-expansion-policy.md) (design policy and how expansion work is kept from blocking the submittable main line).
- Presentation: [docs/design/appeal-design-draft-v0.md](docs/design/appeal-design-draft-v0.md) (appeal design: refusal by design, every sentence traceable to the source).

## 5. Evidence

The records themselves are the evidence:

- [loops/](loops/) — per-pass records: inputs, models, artifacts, audit results, costs, durations.
- [docs/learnings.md](docs/learnings.md) — ledger of confirmed findings and handoffs.
- [docs/decisions/](docs/decisions/) — decision records (D1–D11).
- [experiments/](experiments/) — experiment records, including accuracy and audit-model comparisons.
- [docs/design/overall-audit-20261028.md](docs/design/overall-audit-20261028.md) — the project-wide audit before submission work began, with open items listed.
- [docs/design/overall-audit-20261028-r2.md](docs/design/overall-audit-20261028-r2.md) — the follow-up audit (round 2, Spark): closure of the first audit's items confirmed, submission shape verified.

## 6. Running it

Prerequisites: Node.js, and a `MODEL_API_KEY` environment variable for the Meta Model API (the key value is never written to any file, log, or record).

Integrated run (calls the Meta Model API for extraction and generation, and writes run records under `loops/loop-010/`):

```sh
node src/run-demo.mjs --out-dir loops/loop-010
```

Offline tests (these use stubs and fixtures and do not call the live API):

```sh
node src/run-demo.test.mjs
node src/verify.test.mjs
node src/generate.test.mjs
node src/approve.test.mjs
node src/extract-and-check.test.mjs
```

All five suites pass (51, 42, 23, 11, and 12 cases respectively).

## 7. Models and costs

Product execution (extraction and generation) runs on Muse Spark 1.3 Contributor; Muse Wonder is used at design and audit checkpoints ([D4](docs/decisions/D4-model-assignment.md)). Costs are recorded in the loop records. For example, one integrated run in [loops/loop-010/run-record.md](loops/loop-010/run-record.md) cost $0.0018187 calculated from usage (a calculated value, not the final billed cost; the final figures are reconciled against Billing separately).

## 8. License

MIT. See [LICENSE](LICENSE).
