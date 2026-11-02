# Page check (Layer 1 adapted) — C-F vanilla-spark

- source: `vanilla/spark/case-f.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:23.611Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=2, hasHero=false, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 0 |
| duplicate occurrences total | 0 |
| verification phrase groups | 0 |
| verification hits total | 0 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2)

(none)

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `section-no-id` | At a glance | (none) |
| `section-no-id` | Posting details | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-F — expected label: **6 weeks: 2026-12-01 to 2027-01-11**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Crestline Outdoor — Seasonal Sales Associate (Nagoya, Sakae district) Crestline Outdoor Nagoya, Sakae district &bull; Casual / seasonal Seasonal — 6 weeks: 2026-12-01 to 2027-01-11 Seasonal Sales Associate (casual, storefront) Storefront seasonal role in Nagoya, Sakae district. Facts below are from the posting only. Hourly 1,300 JPY 3–5 days/week, 4–7 hours/day Weekends preferred Pay Hourly 1,300 

- checks:
  - pattern `/2026-12-01/i` — FOUND — …seasonal Seasonal — 6 weeks: 2026-12-01 to 2027-01-11 Seasonal Sales Associate…
  - pattern `/6 weeks/i` — FOUND — …Casual / seasonal Seasonal — 6 weeks: 2026-12-01 to 2027-01-11 Seasonal Sales A…
- missing: (none)

---

*Candidate — permanence requires owner approval.*
