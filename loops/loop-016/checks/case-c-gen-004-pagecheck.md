# Page check (Layer 1 rule-based) — C-C gen-004

- source: `loops/loop-016/previews/case-C-gen-004-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T11:37:49.490Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 9 |
| duplicate occurrences total | 24 |
| verification phrase groups | 2 |
| verification hits total | 2 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=4 — `renewal review at month 11; no automatic conversion`

- example: Renewal review at month 11; no automatic conversion
- occurrences:
  - `header` / “Brand Specialist (12-month fixed-term contract)” — Renewal review at month 11; no automatic conversion
  - `header` / “Brand Specialist (12-month fixed-term contract)” — Renewal review at month 11; no automatic conversion
  - `about` / “The Basics 募集の基本” — Renewal review at month 11; no automatic conversion
  - `check` / “Check Before You Apply 応募前の確認” — Renewal review at month 11; no automatic conversion

### [2] count=4 — `contract, 12 months`

- example: Contract, 12 months
- occurrences:
  - `header` / “Brand Specialist (12-month fixed-term contract)” — Contract, 12 months
  - `header` / “Brand Specialist (12-month fixed-term contract)” — Contract, 12 months
  - `about` / “The Basics 募集の基本” — Contract, 12 months
  - `check` / “Check Before You Apply 応募前の確認” — Contract, 12 months

### [3] count=3 — `monthly 380,000 jpy`

- example: Monthly 380,000 JPY
- occurrences:
  - `header` / “Brand Specialist (12-month fixed-term contract)” — Monthly 380,000 JPY
  - `about` / “The Basics 募集の基本” — Monthly 380,000 JPY
  - `check` / “Check Before You Apply 応募前の確認” — Monthly 380,000 JPY

### [4] count=3 — `everfield & co.`

- example: Everfield & Co.
- occurrences:
  - `about` / “The Basics 募集の基本” — Everfield & Co.
  - `location` / “Place &amp; Access 勤務地” — Everfield & Co.
  - `team` / “Team &amp; Support チーム・サポート” — Everfield & Co.

### [5] count=2 — `is hiring a brand specialist (12-month fixed-term contract) in tokyo, shibuya.`

- example: is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya.
- occurrences:
  - `location` / “Place &amp; Access 勤務地” — is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya.
  - `team` / “Team &amp; Support チーム・サポート” — is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya.

### [6] count=2 — `brand specialist (12-month fixed-term contract)`

- example: Brand Specialist (12-month fixed-term contract)
- occurrences:
  - `header` / “Brand Specialist (12-month fixed-term contract)” — Brand Specialist (12-month fixed-term contract)
  - `about` / “The Basics 募集の基本” — Brand Specialist (12-month fixed-term contract)

### [7] count=2 — `mon-fri, 10:00-19:00, avg 2 days remote/week`

- example: Mon-Fri, 10:00-19:00, avg 2 days remote/week
- occurrences:
  - `about` / “The Basics 募集の基本” — Mon-Fri, 10:00-19:00, avg 2 days remote/week
  - `check` / “Check Before You Apply 応募前の確認” — Mon-Fri, 10:00-19:00, avg 2 days remote/week

### [8] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

### [9] count=2 — `tokyo, shibuya`

- example: Tokyo, Shibuya
- occurrences:
  - `header` / “Brand Specialist (12-month fixed-term contract)” — Tokyo, Shibuya
  - `about` / “The Basics 募集の基本” — Tokyo, Shibuya

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …9:00, avg 2 days remote/week All conditions above are from the 9 sentences of C-C gen-004. N…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …e 9 sentences of C-C gen-004. No new facts are added. Apply with one portfolio li…

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ (heading vs factKeys)

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

(no mismatch under current scope rules)

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-C — expected label: **Contract 12 months**
- verdict: **PRESENT** ✅ — hero contains first-check item
- hero text excerpt (first 400 chars):

  > Contract, 12 months · Tokyo, Shibuya Brand Specialist (12-month fixed-term contract) Contract, 12 months Renewal review at month 11; no automatic conversion This is a fictional posting for Contract Marketing Brand Specialist 12-month (fictitious, EN-only). No application function. Contract, 12 months Renewal review at month 11; no automatic conversion Tokyo, Shibuya Monthly 380,000 JPY

- checks:
  - pattern `/12 months/i` — FOUND ✅ — …Contract, 12 months · Tokyo, Shibuya Brand Specialist (12-mo…
  - pattern `/Contract/i` — FOUND ✅ — …Contract, 12 months · Tokyo, Shibuya Brand Special…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
