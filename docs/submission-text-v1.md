# Submission text draft v1 (Cerebral Valley form)

Draft for the submission form. Field names are assumed; align with the actual form at submission time (2026-11-02).

## Project name

[To be decided]

## One-line description

An AI development and execution platform that improves the development process through records, audits, and human judgement, demonstrated by a job-posting fact-checking workflow that stops on contradictions.

## What it does / how to use it

The platform runs a job-posting fact-checking workflow for editorial staff: the source text is pinned, FACTs are extracted and reconciled against it, a human approves the result, and only then is the listing page generated and re-verified. To try it, open the public preview linked below, or clone the repository, set the model API key as an environment variable, and run the integrated demo command from the README. Everything runs on fictional data, so no real postings or personal information are involved.

## What it demonstrates

Quality through controls: every stage's pass or fail is decided by that stage's own tool output, and a later stage runs only when the earlier one passed. Design that stops: contradictions and expired approvals halt the run instead of producing text, while unstated items are shown only as not stated and never as claims, and a passing re-verification permits only an in-demo preview, never publication. Improvement through records: each pass leaves inputs, models, artifacts, audit results, costs, and durations in the loop records, and confirmed findings feed back into the next round of development.

## Links

- Repository: https://github.com/bonno-420/meta-hackathon-lab
- Live preview: https://meta-hackathon-lab-demo.pages.dev/
- Demo video: [To be added after the demo video is produced on 2026-11-01]
