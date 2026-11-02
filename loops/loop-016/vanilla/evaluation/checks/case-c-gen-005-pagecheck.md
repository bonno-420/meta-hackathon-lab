# Page check (Layer 1 adapted) — C-C pipeline-gen-005

- source: `previews/case-C-gen-005-complete.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:23.211Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=7, hasHero=true, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 10 |
| duplicate occurrences total | 22 |
| verification phrase groups | 2 |
| verification hits total | 2 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `brand specialist (12-month fixed-term contract)`

- example: Brand Specialist (12-month fixed-term contract)
- occurrences:
  - `header` / "Brand Specialist (12-month fixed-term contract)" — Brand Specialist (12-month fixed-term contract)
  - `about` / "The Basics 募集の基本" — Brand Specialist (12-month fixed-term contract)

### [2] count=3 — `employment type`

- example: Employment type
- occurrences:
  - `header` / "Brand Specialist (12-month fixed-term contract)" — Employment type
  - `about` / "The Basics 募集の基本" — Employment type
  - `check` / "Check Before You Apply 応募前の確認" — Employment type

### [3] count=3 — `contract terms`

- example: Contract terms
- occurrences:
  - `header` / "Brand Specialist (12-month fixed-term contract)" — Contract terms
  - `about` / "The Basics 募集の基本" — Contract terms
  - `check` / "Check Before You Apply 応募前の確認" — Contract terms

### [4] count=2 — `contract, 12 months`

- example: Contract, 12 months
- occurrences:
  - `header` / "Brand Specialist (12-month fixed-term contract)" — Contract, 12 months
  - `about` / "The Basics 募集の基本" — Contract, 12 months

### [5] count=2 — `renewal review at month 11; no automatic conversion`

- example: Renewal review at month 11; no automatic conversion
- occurrences:
  - `header` / "Brand Specialist (12-month fixed-term contract)" — Renewal review at month 11; no automatic conversion
  - `about` / "The Basics 募集の基本" — Renewal review at month 11; no automatic conversion

### [6] count=2 — `tokyo, shibuya`

- example: Tokyo, Shibuya
- occurrences:
  - `header` / "Brand Specialist (12-month fixed-term contract)" — Tokyo, Shibuya
  - `about` / "The Basics 募集の基本" — Tokyo, Shibuya

### [7] count=2 — `monthly 380,000 jpy`

- example: Monthly 380,000 JPY
- occurrences:
  - `header` / "Brand Specialist (12-month fixed-term contract)" — Monthly 380,000 JPY
  - `about` / "The Basics 募集の基本" — Monthly 380,000 JPY

### [8] count=2 — `everfield & co.`

- example: Everfield & Co.
- occurrences:
  - `about` / "The Basics 募集の基本" — Everfield & Co.
  - `location` / "Place &amp; Access 勤務地" — Everfield & Co.

### [9] count=2 — `work hours`

- example: Work hours
- occurrences:
  - `about` / "The Basics 募集の基本" — Work hours
  - `check` / "Check Before You Apply 応募前の確認" — Work hours

### [10] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / "Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま" — 0, no text in image
  - `location` / "Place &amp; Access 勤務地" — 0, no text in image

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / "Check Before You Apply 応募前の確認" — …9:00, avg 2 days remote/week All conditions above are from the 9 sentences of C-C gen-005. N…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / "Check Before You Apply 応募前の確認" — …e 9 sentences of C-C gen-005. No new facts are added. Apply with one portfolio li…

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Brand Specialist (12-month fixed-term contract) | (none) |
| `about` | The Basics 募集の基本 | (none) |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | (none) |
| `location` | Place &amp; Access 勤務地 | (none) |
| `team` | Team &amp; Support チーム・サポート | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-C — expected label: **Contract 12 months**
- verdict: **PRESENT** — hero tag found
- hero text excerpt (400 chars):

  > Contract, 12 months · Tokyo, Shibuya Brand Specialist (12-month fixed-term contract) Employment type Contract Contract terms 12 months · review M11 This is a fictional posting for Contract Marketing Brand Specialist 12-month (fictitious, EN-only). No application function. Contract, 12 months Renewal review at month 11; no automatic conversion Tokyo, Shibuya Monthly 380,000 JPY

- checks:
  - pattern `/12 months/i` — FOUND — …Contract, 12 months · Tokyo, Shibuya Brand Specialist (12-mo…
  - pattern `/Contract/i` — FOUND — …Contract, 12 months · Tokyo, Shibuya Brand Special…
- missing: (none)

---

*Candidate — permanence requires owner approval.*
