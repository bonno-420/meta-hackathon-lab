# Submission text draft v1 (Cerebral Valley form)

Draft for the submission form. Field names are assumed; align with the actual form at submission time (2026-11-02).

## Project name

Loopwright

## One-line description

A development platform that turns failures in AI-assisted production into quality controls for the next run — every failure is recorded, aggregated, and, only with human approval, promoted into a gate or review criterion later productions must pass. Demonstrated on a job-posting production workflow; the postings are the test workload, not the product.

## What it does / how to use it

The platform runs a job-posting fact-checking workflow for editorial staff: the source text is pinned, FACTs are extracted and reconciled against it, a human approves the result, and only then is the listing page generated and re-verified. To try it, open the public preview linked below, or clone the repository, set the model API key as an environment variable, and run the integrated demo command from the README. Everything runs on fictional data, so no real postings or personal information are involved.

## What it demonstrates

Quality through controls: every stage's pass or fail is decided by that stage's own tool output, and a later stage runs only when the earlier one passed. Design that stops: contradictions and expired approvals halt the run instead of producing text, while unstated items are shown only as not stated and never as claims, and a passing re-verification permits only an in-demo preview, never publication. Failures become quality controls: each pass leaves inputs, models, artifacts, audit results, costs, and durations in the loop records; confirmed findings are aggregated, and the generalizable ones are wired into the production path or — with human approval — promoted into deterministic gates (for example, a duplicated figure a review model missed became a gate that now fails any page repeating a stated value).

## Links

- Repository: https://github.com/bonno-420/meta-hackathon-lab
- Live preview: https://meta-hackathon-lab-demo.pages.dev/
- Demo video: [link added at submission]

## Models

Product execution and automated checks run on Muse Spark 1.3 Contributor. The pipeline also runs against Muse Spark Open via Baseten when the endpoint is overridden; the verification runs in loops/loop-024 – loop-027 and the experiments in loops/loop-015/ and loops/loop-016/ used that route, and each run record states the model and endpoint it actually used.
