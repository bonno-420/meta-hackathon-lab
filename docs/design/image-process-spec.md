# Image process specification (traced from the previous generation process)

- Recorded: 2026-11-03 (coordinator), at the user's instruction to trace the previous generation process rather than check against a new design
- Sources: `docs/design/generation-flow-statement.md` (confirmed), `loops/loop-016/tools/loop16-images.mjs` and `loops/loop-016/run-record.md` (the previous process as run), the loop-020 return material (element checklist)

## The key visual (1枚画)

- A single overall key visual that fixes the look of the whole page (generation flow statement). It is generated once, from the planning input, before the copy, and the run stops at its preview checkpoint for the user's confirmation.
- It is the specification for the look. It is not a part assembled into the page: the page is assembled from the copy and the real images.
- Before presentation it is checked element by element (the loop-020 checklist): building identity (a workplace must not read as a house or dormitory), motifs that imply unstated items, invented specifics (a clock showing a specific time, a vehicle implying a commute mode, cash imagery), and conformance to the planning.

## The real images

- Specs are written per posting from the planning and the approved facts, in the loop-016 form: the workplace itself, the work scene, and the surrounding place at most one. Photorealistic, and every prompt carries "no text, no numbers, no logos".
- Generated once and reused. Later stages change the assembly, not the images.
- Work content comes first; a place image is at most one.

## What this replaces

- The loop-021 implementation treated the key visual as a hero photograph and assembled it into the page, and checked the prompt text against a correspondence table. That was a new design, not a trace of the previous process, and it contradicts the flow statement on both points (overall, and real images generated to the key visual's specification). This specification restores the recorded process as the standing method for the image stages, for any session or line that runs them.
