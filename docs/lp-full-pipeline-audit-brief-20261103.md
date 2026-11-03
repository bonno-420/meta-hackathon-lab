# Audit brief: LP full-pipeline design v1 (2026-11-03, coordinator)

Audit target: `docs/design/lp-full-pipeline-design-v1.md` (working tree, uncommitted). Against: `docs/lp-full-pipeline-fix-brief-20261103.md` and the current body (src/run-demo.mjs, src/verify.mjs and their suites). Audit only — no implementation.

Check:

1. Brief conformance: the completion definition (text / images / assembled page / grounding pass — all required, missing = stop and record), image cost recorded as calculated values, E02 stop path untouched, loop-015/016 tooling not imported into the body.
2. Architectural consistency: new stages follow the existing deps-injection pattern; verify.mjs verdict semantics unchanged, with the completion check added on the integrated-runner side and included in the verification record; the existing preview stays separate and optional, with completion judged at LP assembly.
3. Image stage soundness: muse-image-1.0, no text/numbers baked into images; the image set (hero + section images) is derived from the generation record, not invented or padded.
4. Test conditions T1–T6: do they cover the failure modes that matter — generation failure injected (T1), record present but file missing (T2), page missing part of the text (T3), happy path (T4), E02 isolation (T5), cost record (T6)?
5. Scope statements: human semantic confirmation remains for text only (images' meaning out of scope this time) — judge whether that is acceptable for the completion claim, and say so explicitly.

Verdict: 合格 / 修正 / 差し戻し, findings tied to brief or record lines. Implementation starts only after this audit passes.
