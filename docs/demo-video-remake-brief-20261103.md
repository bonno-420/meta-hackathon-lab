# Demo video remake brief (2026-11-03, coordinator — direction by the user)

v1 (loops/loop-017/demo-video-v1.mp4) is a narrated slideshow: static cards held for 20–30 seconds each. The user directs a remake with presentation craft. v1 stays as the fallback; the remake replaces it only when it passes the same flow: design → audit → production → audit.

## Direction (the user's staging requirements)

1. Evidence footage stays real and unmodified: the actual execution (model calls, usage, verdicts appearing) and the records' content. Do not fabricate or alter what they show. Presentation artifacts we made to display information (e.g. the public preview page) are display material — their information must stay accurate, but their form may be cut and recomposed freely; they are not evidence.
2. Information is shown as cards / infographics that reveal progressively in the narration's order, with motion at a speed the eye can follow. No long static holds.
3. Transitions vary by scene and carry meaning; do not repeat one pattern. (The design decides which transition means what, scene by scene.)
4. The signature staging pattern: move in on the real artifact → highlight the point of interest → cut to the improved version (before → after).
5. Unchanged from v1: the audited script line, facts, disclosures (opening line, TTS credit, Baseten separation), recordings labeled as recordings, message within the time budget, English TTS disclosed. Any script wording change goes back through design → audit.

## Audit points for the remake (in addition to the v1 audit points)

- Every transition has a stated meaning in the design; motion speed lets a first-time viewer follow the reveal order
- Real screens are the actual artifacts (no regenerated look-alikes)
- The zoom → highlight → after pattern is used where a before/after exists in the records

## Production route: UltraFlame (user's direction, 2026-11-03)

The remake is produced with UltraFlame (bonno-420/ultraframes; planning-led pipeline, HyperFrames video renderer). Production input = the materials below plus the staging requirements above. The finished video returns to this project's flow for the step-4 audit.

### Materials specification

- Display material (recomposable): the public preview, English edition — https://meta-hackathon-lab-demo.pages.dev/ (the 9 recorded sentences, verification panel). Made and published to display the information; not an untouchable real screen
- Real screen 2: the actual run — the integrated runner output with the model name and usage visible (a live run was captured during v1 production on 2026-11-03; materials are in the loop-017 working files on the user's PC)
- Records: loops/loop-010 (approval FICT-J01-approval-1, generated-lp-v1.json — the 9 sentences, verification result), loops/loop-002 (the E02 stop records), experiments/exp-002-fact-extract-prompt-v1.1.md (before/after for the null change), docs/learnings.md (ledger entries), loops/INDEX.md (the loop list — 12 folders, numbered to Loop 16)
- Script: the final script in docs/design/demo-video-design-v1.md (audit fixes F1/F2 applied). Wording changes go back through design → audit
- Voice: English TTS, disclosed (v1 used Kokoro-82M, voice af_heart, local synthesis — same voice preferred for continuity; any change is disclosed the same way)
- Output: MP4, 1920×1080, total ≤ 3:00 with the message complete within 2:55. Upload is done by the user after the step-4 audit

## Composition rules (settled with the user, 2026-11-03)

What went wrong in the first UltraFlame pass: the brief said "real screens as-is" too broadly, so the real screen was placed full-frame, UltraFlame's text-overlap detection (an existing UltraFlame function) correctly blocked infographic overlays that would collide with the screen's own text, and the result fell back to slight subtitle-like additions. The detection was not missing — the composition was wrong.

Rules for the remake:

- The real screen is the run itself: one continuous capture from posting input through extraction, checks, human approval, and generation (re-verification where shown), presented sped up and labeled as a sped-up recording. The human approval is operated by the user himself in the capture.
- Real-screen footage gets its own segments, shown as-is. Nothing is overlaid on it.
- Information cards and infographics get their own segments, recomposed from the display material and records — never drawn on top of the real screen.
- Transitions connect the segments (varied, meaningful — per the staging requirements above).
- Each material carries its designation: REAL SCREEN (as-is, own segment) or DISPLAY (recomposable). The public preview is DISPLAY.
- Text-overlap detection stays on as a production/audit check; with this composition it should pass by construction.
