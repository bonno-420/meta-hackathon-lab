# Gap-fill brief (2026-11-03, coordinator — user's instruction)

Goal: close the realistic part of the gap between the product definition — hand over a job posting, and a checked, complete LP comes out — and the current implementation. Hard deadline: 2026-11-05 11:00 JST. Keep this minimal-token: short documents, no sprawl.

Design line: investigate first, then design, in one short document (docs/design/gap-fill-design-v1.md).

Investigation — for each candidate gap, judge implementation size and risk against the standard flow (design → audit → implementation → audit) fitting before the deadline. Cut what does not fit, one line per cut:
(a) Input is pinned to FICT-J01's artifact set (original JSON, FACTs, approval record). A general entry that takes a posting as text.
(b) The full pipeline (loop-018: text + images + assembly + completion check) has never run live on the real API.
(c) Page-quality detection (loop-016 pagecheck, P1–P6) is not connected to the completion check, so pages with repetition / verifier text / record exposure can pass as complete.

Design — only for what survives the investigation. Minimal changes. Preserve the existing invariants: fact extraction and cross-check, approval and its invalidation, stopping on contradiction, fictional data only. State explicitly anything you propose to change in verify.mjs semantics, if any.

Then: audit line audits the design; production line implements after a pass. Live runs (real API) only with the user's approval, as before.
