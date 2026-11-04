---
name: loopwright
description: Produce a job-posting landing page (LP) with the Loopwright pipeline. Use whenever the user asks to make, generate, or produce an LP or listing page from a posting — in any wording, including "Loopwrightで作って".
---

# Loopwright LP production

An LP is produced ONLY by the pipeline. The single entry point is:

```
node make-lp.mjs <posting.txt> [--language English] [--audience "..."]
```

which drives `src/run-demo.mjs`. Follow its stops:

- The pipeline stops at human checkpoints (approval, key visual, text, assembled LP) and at deterministic gates. A stop is a RESULT: report where and why it stopped, and what the next human step is (make-lp prints it).
- NEVER assemble a page by hand, hand-write the copy, adapt the checks, or generate images outside the pipeline to "complete" an LP. A hand-made page under the Loopwright name is a defect, not a deliverable.
- NEVER fabricate an approval or a confirmation. Those are human acts; if one is missing, stop and report that it is missing.
- If the posting file or a required key is missing, stop and report exactly what is missing.

Report at the end: the run directory, the pipeline's own status/stop reason, and the checks the pipeline itself recorded — not a substitute summary.
