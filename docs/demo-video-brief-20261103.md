# Demo video brief (2026-11-03, coordinator)

Build the submission demo video for Loopwright. Flow: design → audit → production → audit (the standard flow; the audit line audits, acceptance by the user and the coordinator). The subject is not a job posting, but the flow is the same one used for job postings.

## Requirements (the deliverable must satisfy these; method is the line's design choice)

- All English. Narration: English TTS, disclosed (TTS use and tool name in the video description and credits)
- Length: the full message within 2:55 (judges stop watching at 3:00)
- Show the working product, not slides: screen recordings of the actual demo run, with a real Meta model call visible
- Anything replayed from records is labeled as a recording
- If a production skill is needed, it may be procured (source per the user's direction); record the procurement in the production record
- Deliverables: video file + public link (opens without login; Loom or YouTube), duration in seconds, TTS tool name

## Script draft (coordinator's draft — input to the design step, not final)

0:00–0:10 "The concept predates the hackathon; everything built for it was created during the event. This is Loopwright, a platform that improves AI development through records, audits, and human judgement."

0:10–0:35 "Loopwright runs an editorial workflow for job postings — fictional ones only. The source is pinned by hash. Facts are extracted with a Meta model, cross-checked against the source, approved by a human, turned into page copy, and then re-verified by an independent check. Every step is recorded."

0:35–1:10 "Here is a passing run. The extractor pulls the facts: employer, location, pay, hours — each tied to a source line. Anything the source does not state stays unstated: contract renewal and housing come out as null, not guesses. I approve the fact set — approval is a human act here, and it expires if the source changes. Generation writes nine sentences, each traceable to an approved fact. Re-verification then checks every sentence against its source lines: pass — which permits a preview inside the demo, never publication."

1:10–1:40 "Now the same workflow, with one change: the summary claims an hourly wage of 1,700 yen, while the source says 1,500. The cross-check catches the contradiction — and the workflow stops. No approval, no generation, no preview. A system that writes recruiting copy cannot be allowed to smooth over a wrong wage; stopping is the feature."

1:40–2:15 "The process itself is also audited. Early extraction runs represented unstated items inconsistently — sometimes a string, sometimes empty. An audit flagged it; a one-factor experiment fixed the prompt, and the records show the before and after. Findings like this go into a learnings ledger, and audited gates are added so the same failure cannot quietly return. The platform does not improve itself in secret — every change is a recorded, reviewed experiment."

2:15–2:45 "Sixteen loops are recorded in the repository — inputs, models, prompts, outputs, audit verdicts, costs. Later loops tested a pattern library and reader personas, and a separate verification series ran on Baseten with Muse Spark Open. Those are experiments, kept distinct from the platform — and disclosed as such."

2:45–3:00 "Loopwright: AI does the work, records make it checkable, and humans keep the judgement. The repository and the recorded preview are public — links in the description."

## Audit points (for the audit step)

- Facts match the records (numbers, dates, model names, the approval record); facts are not changed by rewording
- Disclosures present: opening pre-existing/in-period line, TTS credit, Baseten experiments kept separate
- TTS misreading check on numbers and proper nouns (¥1,500 / ¥1,700, FICT-J01, null)
- Recordings labeled as recordings; message fits within 2:55

## Appendix: video-production know-how (accumulate here)

- Script sized from the time limit: message within 2:55, ~445 English words allocated across the 7 segments before writing sentences
- Disclosures consolidated into the opening line, not scattered later
- Experiments (Baseten) stated as separate on-script
- The flow does not depend on the subject: design → audit → production → audit, even when the subject is not a job posting
- (add what production teaches: TTS quirks, recording technique, actual durations, returns)
