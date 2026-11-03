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

## Script — content level (coordinator, 2026-11-03)

Content is fixed here; fine expression (exact staging, motion, transitions) is delegated to UltraFlame. Narration texts are the audited final script (design v1, F1/F2 applied) — wording changes go back through design → audit.

1. **Opening (title / infographic)** — Disclosure + definition.
   "The concept predates the hackathon; everything built for it was created during the event. This is Loopwright, a platform that improves AI development through records, audits, and human judgement."
2. **Workflow overview (infographic)** — The five steps, then into the real screen.
   "Loopwright runs an editorial workflow for job postings — fictional ones only. The source is pinned by hash. Facts are extracted with a Meta model, cross-checked against the source, approved by a human, turned into page copy, and then re-verified by an independent check. Every step is recorded."
3. **REAL SCREEN segment** — The time-lapse capture: posting in → extraction and cross-check → human approval (operated by the user) → generation → re-verification. Labeled as a sped-up recording. No overlays on the footage.
   "Here is a passing run. The extractor pulls the facts: employer, location, pay, hours — each tied to a source line. Anything the source does not state stays unstated: contract renewal and housing come out as null, not guesses. I approve the fact set — approval is a human act here, and it expires if the source changes. Generation writes nine sentences, each traceable to an approved fact. Re-verification then checks every sentence against its source lines: pass — which permits a preview inside the demo, never publication."
4. **The stop (infographic)** — Source ¥1,500 vs summary ¥1,700; the stop, stated plainly.
   "Now the same workflow, with one change: the summary claims an hourly wage of 1,700 yen, while the source says 1,500. The cross-check catches the contradiction — and the workflow stops. No approval, no generation, no preview. A system that writes recruiting copy cannot be allowed to smooth over a wrong wage; stopping is the feature."
5. **An audit changed the output (infographic, before → after)** — Unstated values: string/empty → null under prompt v1.1.
   "The process itself is also audited. Early extraction runs represented unstated items inconsistently — sometimes a string, sometimes empty. An audit flagged it; a one-factor experiment fixed the prompt, and the records show the before and after. Findings like this go into a learnings ledger, with the fix recorded next to the finding. The platform does not improve itself in secret — every change is a recorded, reviewed experiment."
6. **Records and experiments (infographic)** — The loop list (12 folders, numbered to Loop 16), the ledger; Baseten series shown as separate experiments.
   "Every loop is recorded in the repository — inputs, models, prompts, outputs, audit verdicts, costs. Later loops tested a pattern library and reader personas, and a separate verification series ran on Baseten with Muse Spark Open. Those are experiments, kept distinct from the platform — and disclosed as such."
7. **Close (card)** — One line + repository and preview links + TTS credit.
   "Loopwright: AI does the work, records make it checkable, and humans keep the judgement. The repository and the recorded preview are public — links in the description."
