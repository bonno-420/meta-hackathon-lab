# D17 — Gate promotion G-E: stated-value repetition scan

- Date: 2026-11-04
- Decided by: the user (promotion approved after the candidate's verification was presented)

## The gate

A stated fact's value appearing in two or more body sentences fails the deterministic page check (C5). Body sentences are the rows, bands, and headline; the details table (which carries every value) and the cards/chips (the allowed summary of deciding conditions) are not counted. The marked income example counts as one occurrence of its components, like any other sentence.

## Path (the learning flow)

- Finding: FICT-E03 run9 — "16 working days" appeared in the income-example sentence and again in a second prose sentence; the judgement-layer criterion (natural-and-sufficient) did not catch it (recorded as I-16).
- Extraction: fact values are known deterministically, so the repetition is machine-countable — a deterministic check, not another judgement.
- Candidate: implemented in pagecheck v5 as a reported count only (not enforced), presented with verification.
- Verification: on the real pages — run9 hit (monthlyDaysAssumption ×2), run10 (accepted as publishable) zero hits, run4 one hit.
- Promotion: the user approved; the scan is now part of pagecheck's pass/fail. After promotion, run9's page fails the check and run10's still passes.
