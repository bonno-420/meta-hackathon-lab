# Gap-fill brief (2026-11-03, coordinator — user's instruction)

Goal: close the realistic part of the gap between what the user wants to build and the current implementation. Hard deadline: 2026-11-05 11:00 JST. Minimal-token throughout: short documents, no sprawl.

## Step 0 — verbalize the intent (before anything else)

Design line drafts `docs/design/intent-statement.md`: what the user wants to build, in the user's own terms, drawn from the project instruction, decision D1, and the user's statements of 2026-11-03 — a tool: hand over a job posting, it is scrutinized, and a complete LP (text + images + assembly) comes out; the same result whoever runs it; a tool, not a session's performance. Half a page at most. The user confirms or corrects it. Nothing below proceeds until the statement is confirmed; the confirmed statement is the baseline for the gap.

Status: the intent statement was confirmed by the user on 2026-11-03.

## Step 0b — verbalize the two flows (added 2026-11-03, user's instruction)

Design line also drafts, each short and in the same document series:
- `docs/design/generation-flow-statement.md` — the flow of actual generation: what happens, in order, from a posting being handed over to a complete LP counting as done (stages, where a human judges, where the run stops, what is recorded).
- `docs/design/learning-flow-statement.md` — the flow by which learnings are learned: how what a run produces (evaluations, failures, the user's annotations) becomes learnings, how learnings are consolidated, and how they feed the next plan and the next gate (candidate → verification → approval, per decision D8).
Each is a draft for the user's confirmation, like Step 0. They are baselines for judging the gap alongside the intent statement.

## Step 1 — investigate, then design

Design line: investigate, then design, in one short document (docs/design/gap-fill-design-v1.md), measured against the confirmed intent statement.

Investigation — for each candidate gap, judge implementation size and risk against the standard flow (design → audit → implementation → audit) fitting before the deadline. Cut what does not fit, one line per cut:
(a) Input is pinned to FICT-J01's artifact set (original JSON, FACTs, approval record). A general entry that takes a posting as text.
(b) The full pipeline (loop-018: text + images + assembly + completion check) has never run live on the real API.
(c) Page-quality detection (loop-016 pagecheck, P1–P6) is not connected to the completion check, so pages with repetition / verifier text / record exposure can pass as complete.

Design — only for what survives the investigation. Minimal changes. Preserve the existing invariants: fact extraction and cross-check, approval and its invalidation, stopping on contradiction, fictional data only. State explicitly anything you propose to change in verify.mjs semantics, if any.

Then: audit line audits the design; production line implements after a pass. Live runs (real API) only with the user's approval, as before.
