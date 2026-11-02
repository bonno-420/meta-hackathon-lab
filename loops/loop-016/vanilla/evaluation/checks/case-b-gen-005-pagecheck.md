# Page check (Layer 1 adapted) — C-B pipeline-gen-005

- source: `previews/case-B-gen-005-complete.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:23.042Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=7, hasHero=true, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 7 |
| duplicate occurrences total | 15 |
| verification phrase groups | 2 |
| verification hits total | 2 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `registered nurse (full-time, general ward)`

- example: Registered Nurse (full-time, general ward)
- occurrences:
  - `header` / "Registered Nurse (full-time, general ward)" — Registered Nurse (full-time, general ward)
  - `about` / "The Basics 募集の基本" — Registered Nurse (full-time, general ward)

### [2] count=3 — `work hours`

- example: Work hours
- occurrences:
  - `header` / "Registered Nurse (full-time, general ward)" — Work hours
  - `about` / "The Basics 募集の基本" — Work hours
  - `check` / "Check Before You Apply 応募前の確認" — Work hours

### [3] count=2 — `full-time (permanent)`

- example: Full-time (permanent)
- occurrences:
  - `header` / "Registered Nurse (full-time, general ward)" — Full-time (permanent)
  - `about` / "The Basics 募集の基本" — Full-time (permanent)

### [4] count=2 — `day shift 08:30-17:00, 5 days/week; no scheduled night duty`

- example: Day shift 08:30-17:00, 5 days/week; no scheduled night duty
- occurrences:
  - `header` / "Registered Nurse (full-time, general ward)" — Day shift 08:30-17:00, 5 days/week; no scheduled night duty
  - `about` / "The Basics 募集の基本" — Day shift 08:30-17:00, 5 days/week; no scheduled night duty

### [5] count=2 — `yokohama, minato mirai area`

- example: Yokohama, Minato Mirai area
- occurrences:
  - `header` / "Registered Nurse (full-time, general ward)" — Yokohama, Minato Mirai area
  - `about` / "The Basics 募集の基本" — Yokohama, Minato Mirai area

### [6] count=2 — `annual 5,200,000 jpy`

- example: Annual 5,200,000 JPY
- occurrences:
  - `header` / "Registered Nurse (full-time, general ward)" — Annual 5,200,000 JPY
  - `about` / "The Basics 募集の基本" — Annual 5,200,000 JPY

### [7] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / "Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま" — 0, no text in image
  - `location` / "Place &amp; Access 勤務地" — 0, no text in image

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / "Check Before You Apply 応募前の確認" — …+ quarterly skills workshop All conditions above are from the 10 sentences of C-B gen-005.…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / "Check Before You Apply 応募前の確認" — …10 sentences of C-B gen-005. No new facts are added. Apply with license copy — r…

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Registered Nurse (full-time, general ward) | (none) |
| `about` | The Basics 募集の基本 | (none) |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | (none) |
| `location` | Place &amp; Access 勤務地 | (none) |
| `team` | Team &amp; Support チーム・サポート | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-B — expected label: **Day shift 08:30-17:00**
- verdict: **PRESENT** — hero tag found
- hero text excerpt (400 chars):

  > Full-time (permanent) · Yokohama, Minato Mirai area Registered Nurse (full-time, general ward) Work hours Day shift 08:30-17:00 · No nights This is a fictional posting for Full-time Healthcare Registered Nurse (fictitious, EN-only). No application function. Full-time (permanent) Day shift 08:30-17:00, 5 days/week; no scheduled night duty Yokohama, Minato Mirai area Annual 5,200,000 JPY

- checks:
  - pattern `/08:30-17:00/i` — FOUND — …al ward) Work hours Day shift 08:30-17:00 · No nights This is a fictional postin…
  - pattern `/Day shift/i` — FOUND — …ime, general ward) Work hours Day shift 08:30-17:00 · No nights This is a fictio…
- missing: (none)

---

*Candidate — permanence requires owner approval.*
