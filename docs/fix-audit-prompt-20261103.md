# Audit prompt — fix implementation audit (2026-11-03, coordinator)

Audit the implementation of `docs/fix-plan-20261103.md` against the baselines. Audit only; do not edit the implementation.

## Baselines

- `docs/design/intent-statement.md` (confirmed): a tool — a posting goes in, it is scrutinized, a complete LP comes out; the same result whoever runs it.
- `docs/design/generation-flow-statement.md` (confirmed): order — source pinned, extraction, reconciliation, fact approval, checkpoint set settled up front, planning → key visual → text → real images → assembly; previews always shown (text included); bounded self-correction, then holds carried to the preview; contradictions stop the run.
- `docs/design/learning-flow-statement.md` (confirmed): routine fixes close at audit; the user's approval is reserved for gate promotion/withdrawal and recorded decisions; feedback reaches the next generation (today: as an input file, recorded).
- The gap-fill design (audited, passed) incl. the R1 stage table, the R2 presentation/confirmation record, M2 layering, M3 key-visual confirmation record; and the loop-020 return material (key visual non-conforming; the fix is the correspondence definition and its inspection, not prompt wording).

## Change points to verify (one verdict each)

- C1 Text entry (F1): a posting text is pinned as a new source (id, version, sha256, numbered lines); extraction and reconciliation run unchanged; the run stops at approval with the fact set as candidate; the runner creates no approval anywhere in the code.
- C2 Planning input (F2): accepted and recorded by file and hash; missing planning stops the run after approval as a checkpoint (marked not-a-failure); no code path invents planning content.
- C3 Correspondence (F3): the correspondence table is produced before the key-visual prompt; every element names a basis (planning item or FACT); prohibited motifs come from the planning's "not say" list and the standing bans; the prompt contains only correspondence elements. Test: a planning with unstated housing yields no residence element in the table or the prompt.
- C4 Key-visual stop and resume (F3/F6): the run stops at the key-visual checkpoint and writes the presentation record; resume requires the confirmed key visual (file and hash match the confirmation record) and refuses an unconfirmed or mismatched file.
- C5 Real images (F4): prompts derive from the correspondence and the confirmed key visual; the hardcoded templates in `decideImagePlan` are gone or no longer used by the pipeline; no text/numbers in any prompt.
- C6 C5 page quality (F5): the deterministic checks run inside `checkCompletion` on the runner side; `verify.mjs` is byte-identical to before; dictionaries are versioned under `src/dicts/` and the version is named in the run record; a page with repetition, a verifier phrase, or a record label fails C5 and is recorded incomplete.
- C7 Checkpoints and presentation records (F6): the checkpoint set is chosen before the run and recorded; each selected checkpoint stops the run and writes an R2-format record (presented items, holds, per-checkpoint judgement fields); a run cannot reach "done" with a selected preview unpresented.
- C8 Retries and holds (F7): the R1 stage table is implemented as specified — no retries on extraction / reconciliation / FACT comparison / approval; bounded retries on text / images / assembly; holds are recorded with stage and failed condition and presented with the preview; a hold is never counted as complete.
- C9 Feedback input (F8): a feedback memo file is accepted, recorded by file and hash, and included in the text-generation input; the run record states that compiling the memo is a human/coordinator act.
- C10 Invariants and regressions: approval invalidation still refuses generation; E02 still stops at reconciliation with no later stage executed; unstated items appear only as "not stated"; all pre-existing suites pass; no API key or secret appears in any file, record, or prompt artifact.

## Live verification (after the code audit passes; the user's approval covers the spend)

- L1 One new fictional posting (not FICT-J01) through the text entry: pinned, extracted, reconciled, stopped at approval. Record the candidate.
- L2 With a human approval recorded and a planning input: run to the key-visual checkpoint; check the key visual element-by-element against the planning (the loop-020 checklist: building identity, unstated-implication motifs, invented specifics such as clock times or amounts, cash imagery). Any non-conformance is recorded and the run does not proceed.
- L3 Resume from the confirmed key visual to a complete LP; the assembled page is presented with any holds; C1–C5 all recorded; the per-checkpoint judgements are recorded in R2 format.

## Verdict

合格 / 修正 / 差し戻し, per change point. A 差し戻し on any of C1–C4 or C10 stops the landing; the rest follow the usual fix-and-re-audit cycle (the same route twice → escalate to the user).
