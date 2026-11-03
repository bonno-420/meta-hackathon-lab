# Audit prompt — fix implementation audit (2026-11-03, coordinator)

Audit the implementation of `docs/fix-plan-20261103.md` (v2) against the baselines. Read every changed file and every file the changes touch, from start to finish. There are no out-of-scope areas in this audit: where something cannot be checked, state what is needed to check it — do not declare it excluded.

## Baselines

- `docs/design/intent-statement.md` (confirmed): a tool — a posting goes in, it is scrutinized, a complete LP comes out; the same result whoever runs it.
- `docs/design/generation-flow-statement.md` (confirmed): order — source pinned, extraction, reconciliation, fact approval, checkpoint set settled up front, planning → key visual → text → real images → assembly; previews always shown (text included); bounded self-correction, then holds carried to the preview; contradictions stop the run.
- `docs/design/learning-flow-statement.md` (confirmed): routine fixes close at audit; the user's approval is reserved for gate promotion/withdrawal and recorded decisions; feedback reaches the next generation as a recorded input.
- The gap-fill design (audited, passed) incl. the R1 stage table, the R2 presentation/confirmation record, M2 layering, M3 key-visual confirmation record; the loop-020 return material (the fix is the correspondence definition and its inspection, not prompt wording); the loop-015/016 method as recorded (per-case plan as data, per-case image specs, insights/research/reflection as recorded generation inputs, facts-built hero, each sentence placed once).

## Change points to verify (one verdict each)

- C1 Text entry (F1): extraction is parameterized (no hardcoded input id or original path in the entry path); a posting text is pinned in the existing original format with sha256; schema, verbatim, and self-reconciliation run; artifacts are written in the existing shapes so the approval draft tooling works unchanged; the run stops at approval with the candidate; no code path creates an approval. FICT-J01 behavior, including the E02 stop, is unchanged (existing suites are the evidence).
- C2 Planning input (F2): accepted and recorded by file and hash; the generation intent layer is read from the file, not hardcoded (the previous hardcoded INTENT is gone from the pipeline path or demonstrably unused by it); missing planning stops the run after approval as a checkpoint marked not-a-failure; no code path invents planning content.
- C3 Correspondence (F3): the correspondence is produced before the key-visual prompt; every element names a basis (planning item or FACT) and a role; prohibited motifs derive from the planning's not-say list and the standing bans; the prompt contains only correspondence elements. Test evidence: a planning with unstated housing yields no residence element in the correspondence or the prompt, and no cash imagery or specific clock time appears.
- C4 Key-visual check, stop, resume (F3/F7): before presentation, the deterministic correspondence/prompt check runs and is recorded, and the presentation record carries the element-by-element visual-check fields (building identity, unstated-implication motifs, invented specifics, cash imagery — the loop-020 checklist). The run stops at the checkpoint. Resume requires the confirmed key visual: file and hash match the confirmation record; an unconfirmed or mismatched file is refused.
- C5 Real images and assembly (F4/F5): image prompts come from the planning's specs and the confirmed key visual (work content first; place at most one); the hardcoded templates in `decideImagePlan` are not used by the pipeline path; the assembled page has the hero block with first-check values as chips, each sentence exactly once, and no verifier or record furniture.
- C6 C5 page quality (F6): the deterministic checks run inside `checkCompletion` on the runner side; `verify.mjs` is byte-identical to before the fix; dictionaries are versioned under `src/dicts/` and the version is named in the run record; a page with repetition, a verifier phrase, or a record label fails C5 and is recorded incomplete.
- C7 Checkpoints and presentation records (F7): the checkpoint set is chosen before the run and recorded; each selected checkpoint stops the run and writes an R2-format record (presented items, holds, per-checkpoint judgement fields, corrections verbatim); "done" is unreachable while a selected preview is unpresented.
- C8 Retries and holds (F8): the R1 stage table as implemented — no retries on extraction / reconciliation / FACT comparison / approval; bounded retries on text / images / assembly; holds recorded with stage and failed condition, presented with the preview, never counted as complete.
- C9 Grounding generalization (F9): numeric representations derive from the cited FACTs; test evidence shows a posting with values other than 1,500 / 10,000 passing grounding on its own values, and a wrong value failing.
- C10 Feedback input (F10): a feedback memo file is accepted, recorded by file and hash, and included in the intent layer of text generation; the run record states that compiling the memo is a human/coordinator act.
- C11 Invariants and regressions: approval invalidation still refuses generation before any API call; unstated items are never asserted (the assertion-pattern checks still run); no API key or secret in any file, record, or prompt artifact; all pre-existing suites pass with their prior expectations; every new test listed in the plan exists and passes.

## Live verification (after the code audit passes; the user's approval covers the spend)

- L1 A new fictional posting (not FICT-J01) through the text entry: pinned, extracted, reconciled, stopped at approval; the candidate and its artifacts are recorded.
- L2 After a human approval is recorded, with a planning input: run to the key-visual checkpoint; check the generated key visual element-by-element against the planning correspondence and the loop-020 checklist; record the result either way; on non-conformance the run does not proceed.
- L3 Resume from the confirmed key visual to a complete LP; C1–C5 recorded; the assembled LP and any holds are presented; per-checkpoint judgements are recorded in R2 format.

## Verdict

合格 / 修正 / 差し戻し, per change point, with the evidence (file, test, or record) named for each. A 差し戻し on C1–C4 or C11 stops the landing. The same route returning twice escalates to the user.
