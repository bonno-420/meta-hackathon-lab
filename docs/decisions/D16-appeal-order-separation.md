# D16 — Appeal order and first-check order are separate responsibilities

- Date: 2026-11-04
- Decided by: the user (confirmation of the coordinator's diagnosis, after FICT-E03 runs 5 and 6 stopped at the planning review with opposite findings)

## Background

Two consecutive drafted plannings for the same posting stopped at the planning review with findings that contradicted each other:

- Run5: the wage appeal — a declared first check — sat fifth in the appeal sequence, behind scene appeals. Finding: the order fights the reader's decision order.
- Run6: after a deterministic reorder forced first-check appeals to the front, the sequence opened with a conditions appeal (part-time, hourly wage) ahead of the work itself. Findings: as the client this plan could not be approved (it leads with a condition instead of the job), and the posting's distinctive advantage — a schedule that fits school hours — was outranked by an ordinary wage.

## Decision

The two orders are different responsibilities and are judged separately:

1. **firstCheckKeys govern the page furniture** — the hero chips and the first cards. They are chosen by decision impact: what this reader checks first when deciding.
2. **The appeals' sequence is a narrative**: it opens with the work itself, then the posting's distinctive advantage for the reader, then the rest. A first-check fact appearing later in the sequence is not a defect; a conditions appeal opening the sequence ahead of the work is.

## Wiring

- The drafting prompt states the separation and orders the appeals as work → distinctive advantage → rest.
- The only deterministic part is mechanical: the work appeal (the key-visual spec's basis appeal) is moved to the front of the drafted sequence, IDs renumbered and image-spec references remapped. firstCheckKeys are never reordered into the sequence.
- The planning review's decision-order criterion names the two orders and fails only the one that is actually wrong; advantage-conversion places the distinctive advantage early in the sequence, right after the work.
- Review prompt version lp-review-v7.
