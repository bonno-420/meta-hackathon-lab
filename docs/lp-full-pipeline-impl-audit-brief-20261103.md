# Implementation audit brief: LP full pipeline (loop-018, 2026-11-03, coordinator)

Audit target: the loop-018 implementation (working tree, uncommitted) against `docs/design/lp-full-pipeline-design-v1.md` (with audit fixes M1–M3, N3 applied) and the design audit's conditions. Audit only — no live API run (that is a separate, user-approved step after this audit).

Check:

1. Scope and invariants: verify.mjs is unmodified (not in the diff); changes confined to src/generate-images.mjs (new), src/run-demo.mjs, their tests, loops/loop-018/run-record.md, loops/INDEX.md. No loop-015/016 or Baseten code imported (API shape reimplemented only). Existing behavior of extraction, cross-check, facts comparison, approval, and the E02 stop is unchanged.
2. M2 constraint: the completion check lives on the runner side (run-demo.mjs); the record integration goes through the stages.verification extension.
3. M1: a page missing part of the text is judged incomplete by C1 only (T3 asserts this, not C3).
4. Image plan soundness (design-audit N2): decideImagePlan derives the image set from the generation record — hero plus sections for source lines with stated content; unstated-only lines excluded (FICT-J01: 6 images, L06 excluded). Image prompts carry no facts, numbers, or text to be baked in. Check how prompts are actually derived in code.
5. Failure semantics: image-generation failure marks the stage failed with cost 0 and the run stops as incomplete at verification (T1); a record whose image file is missing fails C2 (T2); assembly references only files that exist; generated sentences are placed unedited and in order.
6. Records: costs are calculated values ($0.01/image, counts shown, totals consistent — T6); the completion record and run-record state that image meaning is out of scope (N3); loop-018's record matches what the code does.
7. Suites: re-run or verify the reported results — generate-images 14, run-demo 86 (incl. T1–T6), and the existing suites (extract-and-check 12, offline 6, approve 11, generate 23, verify 52, generate-typed 25, generate-persona 39).

Verdict: 合格 / 修正 / 差し戻し. After a pass: landing via the write line, then the live FICT-J01 run (user-approved, real API) as both the Done-condition measurement and the video's real-screen take.
