# Page check (Layer 1 adapted) — C-B vanilla-spark

- source: `vanilla/spark/case-b.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:22.839Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=1, hasHero=false, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 11 |
| duplicate occurrences total | 27 |
| verification phrase groups | 0 |
| verification hits total | 0 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

> applicability note: vanilla HTML has no <section id> — duplication/heading checks are fallback single-section; heading mismatch not applicable

## 1) 重複文 (normalized, count≥2)

### [1] count=3 — `harborview general hospital`

- example: Harborview General Hospital
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Harborview General Hospital
  - `body` / "Body (no sections detected — vanilla structure)" — Harborview General Hospital
  - `body` / "Body (no sections detected — vanilla structure)" — Harborview General Hospital

### [2] count=4 — `full-time (permanent)`

- example: Full-time (permanent)
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Full-time (permanent)
  - `body` / "Body (no sections detected — vanilla structure)" — Full-time (permanent)
  - `body` / "Body (no sections detected — vanilla structure)" — Full-time (permanent)
  - `body` / "Body (no sections detected — vanilla structure)" — Full-time (permanent)

### [3] count=3 — `annual 5,200,000 jpy`

- example: Annual 5,200,000 JPY
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Annual 5,200,000 JPY
  - `body` / "Body (no sections detected — vanilla structure)" — Annual 5,200,000 JPY
  - `body` / "Body (no sections detected — vanilla structure)" — Annual 5,200,000 JPY

### [4] count=2 — `registered nurse (full-time, general ward)`

- example: Registered Nurse (full-time, general ward)
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Registered Nurse (full-time, general ward)
  - `body` / "Body (no sections detected — vanilla structure)" — Registered Nurse (full-time, general ward)

### [5] count=2 — `yokohama, minato mirai area`

- example: Yokohama, Minato Mirai area
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Yokohama, Minato Mirai area
  - `body` / "Body (no sections detected — vanilla structure)" — Yokohama, Minato Mirai area

### [6] count=2 — `employment type`

- example: Employment type
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Employment type
  - `body` / "Body (no sections detected — vanilla structure)" — Employment type

### [7] count=2 — `work hours`

- example: Work hours
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Work hours
  - `body` / "Body (no sections detected — vanilla structure)" — Work hours

### [8] count=2 — `day shift 08:30-17:00, 5 days/week; no scheduled night duty`

- example: Day shift 08:30-17:00, 5 days/week; no scheduled night duty
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Day shift 08:30-17:00, 5 days/week; no scheduled night duty
  - `body` / "Body (no sections detected — vanilla structure)" — Day shift 08:30-17:00, 5 days/week; no scheduled night duty

### [9] count=3 — `12-nurse ward with dedicated handover lead`

- example: 12-nurse ward with dedicated handover lead
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — 12-nurse ward with dedicated handover lead
  - `body` / "Body (no sections detected — vanilla structure)" — 12-nurse ward with dedicated handover lead
  - `body` / "Body (no sections detected — vanilla structure)" — 12-nurse ward with dedicated handover lead

### [10] count=2 — `8-min walk from sakuragicho station; commuter pass reimbursed in full`

- example: 8-min walk from Sakuragicho Station; commuter pass reimbursed in full
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — 8-min walk from Sakuragicho Station; commuter pass reimbursed in full
  - `body` / "Body (no sections detected — vanilla structure)" — 8-min walk from Sakuragicho Station; commuter pass reimbursed in full

### [11] count=2 — `two paid training days per year + quarterly skills workshop`

- example: Two paid training days per year + quarterly skills workshop
- occurrences:
  - `body` / "Body (no sections detected — vanilla structure)" — Two paid training days per year + quarterly skills workshop
  - `body` / "Body (no sections detected — vanilla structure)" — Two paid training days per year + quarterly skills workshop

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `body` | Body (no sections detected — vanilla structure) | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-B — expected label: **Day shift 08:30-17:00**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Registered Nurse (full-time, general ward) - Harborview General Hospital Harborview General Hospital Full-time (permanent) Yokohama, Minato Mirai area &bull; General Ward Registered Nurse (full-time, general ward) Full-time (permanent) Annual 5,200,000 JPY Day shift 08:30–17:00 At a glance Company Harborview General Hospital Role Registered Nurse (full-time, general ward) Location Yokohama, Minato

- checks:
  - pattern `/08:30-17:00/i` — FOUND — …pattern Work hours Day shift 08:30-17:00, 5 days/week; no scheduled night duty…
  - pattern `/Day shift/i` — FOUND — …rmanent) Annual 5,200,000 JPY Day shift 08:30–17:00 At a glance Company Harborvi…
- missing: (none)

---

*Candidate — permanence requires owner approval.*
