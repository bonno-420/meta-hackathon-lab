# Page check (Layer 1 adapted) — C-F vanilla-wonder

- source: `vanilla/wonder/case-f.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:23.608Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=4, hasHero=false, headingApplicable=false

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
| hero P6 missing patterns | 1 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `dec 1 - jan 11`

- example: Dec 1 — Jan 11
- occurrences:
  - `glance` / "Everything stated, nothing added." — Dec 1 — Jan 11
  - `section-no-id` / "Orientation first. A buddy in week 1." — Dec 1 — Jan 11

### [2] count=2 — `weekends preferred.`

- example: Weekends preferred.
- occurrences:
  - `glance` / "Everything stated, nothing added." — Weekends preferred.
  - `section-no-id` / "Orientation first. A buddy in week 1." — Weekends preferred.

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `glance` | Everything stated, nothing added. | (none) |
| `schedule` | schedule | (none) |
| `perks` | Clear perks, for the term. | (none) |
| `section-no-id` | Orientation first. A buddy in week 1. | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-F — expected label: **6 weeks: 2026-12-01 to 2027-01-11**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Crestline Outdoor — Seasonal Sales Associate | Nagoya, Sakae ⛰ CRESTLINE OUTDOOR At a glance Schedule & pay Perks Full details View details ↓ Now recruiting · Casual / Seasonal A 6-week season at Crestline Outdoor. Seasonal Sales Associate (casual, storefront) in Nagoya’s Sakae district — from 1 December 2026 to 11 January 2027. ¥ 1,300 JPY / hour 📍 Nagoya, Sakae district 🗓 2026-12-01 → 2027-01-

- checks:
  - pattern `/2026-12-01/i` — FOUND — …📍 Nagoya, Sakae district 🗓 2026-12-01 → 2027-01-11 Estimate your pay → See al…
  - pattern `/6 weeks/i` — NOT FOUND
- missing patterns: /6 weeks/i

---

*Candidate — permanence requires owner approval.*
