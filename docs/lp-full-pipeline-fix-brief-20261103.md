# Fix brief: make the full LP pipeline one run (2026-11-03, coordinator — user's decision)

## Why

"Hand over a job posting, and this is what you get" is the product's promise. Today the body has a seam: the core runner (src/run-demo.mjs) covers extraction → cross-check → approval → text generation → re-verification, but image generation and LP assembly live in the loop-015/016 tooling, outside the core stage list and its definition of done. A session can therefore "finish" an LP with text only. Fix the seam first; the real-screen take is recorded after this fix.

## Change

- Connect the stages into the core run: after text generation, image generation (muse-image-1.0; images carry no text/numbers; hero and section images per the LP design), then LP assembly (a complete LP), then re-verification.
- Re-verification judges against a completion definition: text present, images present, page assembled, grounding pass. Anything missing = incomplete: stop and record it (missing output is a stop condition, same doctrine as contradictions).
- Record image API cost per run (calculated, $0.01/image) in the run record as usual.

## Invariants

- Do not change the existing behavior of fact extraction, cross-check, approval, or stopping on contradictions. Fictional data only.
- All existing test suites keep passing; add tests for the new stages and the completion check.
- The body stays submittable at every step; keep the change minimal and reversible.

## Flow and done

Design → audit → implementation → audit (standard flow; acceptance by the user and the coordinator). Done when one run, from posting input alone, produces a complete LP with images for FICT-J01 (or an equivalent fictional posting) — that run is then recorded as the video's real-screen take.
