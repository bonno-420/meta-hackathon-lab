# Page check (Layer 1 adapted) — C-A vanilla-spark

- source: `vanilla/spark/case-a.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:22.664Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=4, hasHero=false, headingApplicable=false

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
| `section-no-id` | Team | (none) |
| `section-no-id` | Workplace | (none) |
| `section-no-id` | Benefits | (none) |
| `section-no-id` | Posting Summary | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-A — expected label: **Annual 4,800,000 JPY**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Northbridge Labs - Software Engineer (Full-time, SaaS Product Team) Northbridge Labs Software Engineer (full-time, SaaS product team) Northbridge Labs — Osaka, Umeda district — Full-time (permanent) Annual 4,800,000 JPY. Mon-Fri, 10:00-18:30 (flex core 11:00-16:00). Role Software Engineer (full-time, SaaS product team) Employment Type: Full-time (permanent) Compensation Annual 4,800,000 JPY Locati

- checks:
  - pattern `/4,?800,?000/i` — FOUND — …Full-time (permanent) Annual 4,800,000 JPY. Mon-Fri, 10:00-18:30 (flex core 11:…
  - pattern `/Annual/i` — FOUND — …trict — Full-time (permanent) Annual 4,800,000 JPY. Mon-Fri, 10:00-18:30 (flex c…
- missing: (none)

---

*Candidate — permanence requires owner approval.*
