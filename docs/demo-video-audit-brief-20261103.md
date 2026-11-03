# Demo video — audit brief for the design (step 2, 2026-11-03, coordinator)

Audit target: `docs/design/demo-video-design-v1.md` (in the working tree, uncommitted). Audit only — do not proceed to production.

Check, against the repository records:

1. Facts: numbers, dates, model names, the approval record and timestamps match the records. In particular the loop-count phrasing (folders: 12, numbered up to Loop 16 — no count claim that the records do not support), the 9 generated sentences, the `null` handling of unstated items, the E02 stop, and the exp-002 history.
2. Disclosures: the opening pre-existing / in-period line, the TTS credit, and the Baseten experiments kept separate from the platform.
3. Screen design: the working product is shown (not slides), a real Meta model call is visible, and anything replayed from records is labeled as a recording.
4. Runtime: the design keeps the full message within 2:55, with a plan to verify by TTS measurement at production; misreading hotspots are ¥1,500 / ¥1,700, FICT-J01, null.
5. English accuracy of the final script and on-screen text.

Verdict: 合格 / 修正 / 差し戻し, with each finding tied to its record. Report the verdict and findings; production starts only after this audit passes.
