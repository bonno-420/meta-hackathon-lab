# Page check (Layer 1 adapted) — C-E vanilla-spark

- source: `vanilla/spark/case-e.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:23.416Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=2, hasHero=false, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 2 |
| duplicate occurrences total | 4 |
| verification phrase groups | 0 |
| verification hits total | 0 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `cafe crew (part-time, short hours)`

- example: Cafe Crew (part-time, short hours)
- occurrences:
  - `section-no-id` / "memo" — Cafe Crew (part-time, short hours)
  - `section-no-id` / "memo" — Cafe Crew (part-time, short hours)

### [2] count=2 — `hourly 1,250 jpy`

- example: Hourly 1,250 JPY
- occurrences:
  - `section-no-id` / "memo" — Hourly 1,250 JPY
  - `section-no-id` / "memo" — Hourly 1,250 JPY

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `section-no-id` | memo | (none) |
| `section-no-id` | memo | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-E — expected label: **From 3 hours + Futako-Tamagawa**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Morningside Coffee — Cafe Crew (part-time, short hours) | Setagaya, Futako-Tamagawa Morningside Coffee Setagaya, Futako-Tamagawa Part-time Now hiring — Part-time, short hours Cafe Crew (part-time, short hours) Morningside Coffee — Setagaya, Futako-Tamagawa Hourly 1,250 JPY From 3 hours / day 2–4 days / week No experience required Work options: 08:00–11:00 or 11:00–14:00 Pay Hourly 1,250 JPY Employ

- checks:
  - pattern `/3 hours/i` — FOUND — …amagawa Hourly 1,250 JPY From 3 hours / day 2–4 days / week No experience requir…
  - pattern `/08:00-11:00/i` — FOUND — …om 3 hours/day, 2-4 days/week 08:00-11:00 or 11:00-14:00 3-day onboarding with b…
  - pattern `/Futako-Tamagawa/i` — FOUND — …ime, short hours) | Setagaya, Futako-Tamagawa Morningside Coffee Setagaya, Futak…
- missing: (none)

---

*Candidate — permanence requires owner approval.*
