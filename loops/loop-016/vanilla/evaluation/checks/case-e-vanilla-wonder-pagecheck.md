# Page check (Layer 1 adapted) — C-E vanilla-wonder

- source: `vanilla/wonder/case-e.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:23.413Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=4, hasHero=false, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 5 |
| duplicate occurrences total | 12 |
| verification phrase groups | 0 |
| verification hits total | 0 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 1 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `08:00-11:00`

- example: 08:00–11:00
- occurrences:
  - `shifts` / "Choose a 3-hour slot." — 08:00–11:00
  - `shifts` / "Choose a 3-hour slot." — 08:00–11:00

### [2] count=2 — `3 hours / day · 2-4 days / week`

- example: 3 hours / day · 2–4 days / week
- occurrences:
  - `shifts` / "Choose a 3-hour slot." — 3 hours / day · 2–4 days / week
  - `shifts` / "Choose a 3-hour slot." — 3 hours / day · 2–4 days / week

### [3] count=3 — `onboarding`

- example: Onboarding
- occurrences:
  - `start` / "No experience required. You won’t start alone." — Onboarding
  - `start` / "No experience required. You won’t start alone." — Onboarding
  - `start` / "No experience required. You won’t start alone." — Onboarding

### [4] count=3 — `with buddy`

- example: with buddy
- occurrences:
  - `start` / "No experience required. You won’t start alone." — with buddy
  - `start` / "No experience required. You won’t start alone." — with buddy
  - `start` / "No experience required. You won’t start alone." — with buddy

### [5] count=2 — `staff drink free on shift`

- example: Staff drink free on shift
- occurrences:
  - `location` / "2 minutes from the station." — Staff drink free on shift
  - `details` / "Everything stated in the posting." — Staff drink free on shift

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `shifts` | Choose a 3-hour slot. | (none) |
| `start` | No experience required. You won’t start alone. | (none) |
| `location` | 2 minutes from the station. | (none) |
| `details` | Everything stated in the posting. | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-E — expected label: **From 3 hours + Futako-Tamagawa**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Morningside Coffee — Cafe Crew (Part-time, Short Hours) | Futako-Tamagawa ☕ Morningside Coffee Setagaya · Futako-Tamagawa Shifts Getting Started Location Job Details Part-Time · Short Hours Morningside Coffee — Now Introducing This Role Cafe Crew, in just 3 hours a day. A part-time, short-hours Cafe Crew role in Setagaya, Futako-Tamagawa — 2–4 days a week , in the morning or at midday. Hourly 1,25

- checks:
  - pattern `/3 hours/i` — FOUND — …This Role Cafe Crew, in just 3 hours a day. A part-time, short-hours Cafe Crew…
  - pattern `/08:00-11:00/i` — NOT FOUND
  - pattern `/Futako-Tamagawa/i` — FOUND — …ew (Part-time, Short Hours) | Futako-Tamagawa ☕ Morningside Coffee Setagaya · Fu…
- missing patterns: /08:00-11:00/i

---

*Candidate — permanence requires owner approval.*
