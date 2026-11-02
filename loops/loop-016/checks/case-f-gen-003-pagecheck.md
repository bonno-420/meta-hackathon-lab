# Page check (Layer 1 rule-based) — C-F gen-003

- source: `loops/loop-016/previews/case-F-gen-003-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T07:35:33.649Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 8 |
| duplicate occurrences total | 19 |
| verification phrase groups | 2 |
| verification hits total | 2 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=3 — `seasonal sales associate (casual, storefront)`

- example: Seasonal Sales Associate (casual, storefront)
- occurrences:
  - `header` / “Seasonal Sales Associate (casual, storefront)” — Seasonal Sales Associate (casual, storefront)
  - `about` / “The Basics 募集の基本” — Seasonal Sales Associate (casual, storefront)
  - `check` / “Check Before You Apply 応募前の確認” — Seasonal Sales Associate (casual, storefront)

### [2] count=3 — `nagoya, sakae district`

- example: Nagoya, Sakae district
- occurrences:
  - `header` / “Seasonal Sales Associate (casual, storefront)” — Nagoya, Sakae district
  - `about` / “The Basics 募集の基本” — Nagoya, Sakae district
  - `check` / “Check Before You Apply 応募前の確認” — Nagoya, Sakae district

### [3] count=3 — `casual / seasonal`

- example: Casual / seasonal
- occurrences:
  - `header` / “Seasonal Sales Associate (casual, storefront)” — Casual / seasonal
  - `about` / “The Basics 募集の基本” — Casual / seasonal
  - `check` / “Check Before You Apply 応募前の確認” — Casual / seasonal

### [4] count=2 — `crestline outdoor is hiring a seasonal sales associate (casual, storefront) in nagoya, sakae district.`

- example: Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district.
- occurrences:
  - `location` / “Place &amp; Access 勤務地” — Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district.
  - `team` / “Team &amp; Support チーム・サポート” — Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district.

### [5] count=2 — `6 weeks: 2026-12-01 to 2027-01-11`

- example: 6 weeks: 2026-12-01 to 2027-01-11
- occurrences:
  - `header` / “Seasonal Sales Associate (casual, storefront)” — 6 weeks: 2026-12-01 to 2027-01-11
  - `about` / “The Basics 募集の基本” — 6 weeks: 2026-12-01 to 2027-01-11

### [6] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

### [7] count=2 — `crestline outdoor`

- example: Crestline Outdoor
- occurrences:
  - `about` / “The Basics 募集の基本” — Crestline Outdoor
  - `check` / “Check Before You Apply 応募前の確認” — Crestline Outdoor

### [8] count=2 — `hourly 1,300 jpy`

- example: Hourly 1,300 JPY
- occurrences:
  - `header` / “Seasonal Sales Associate (casual, storefront)” — Hourly 1,300 JPY
  - `about` / “The Basics 募集の基本” — Hourly 1,300 JPY

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …district Casual / seasonal All conditions above are from the 9 sentences of C-F gen-003. N…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …e 9 sentences of C-F gen-003. No new facts are added. Apply this week - start dat…

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ (heading vs factKeys)

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Seasonal Sales Associate (casual, storefront) | (none) |
| `about` | The Basics 募集の基本 | (none) |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | (none) |
| `location` | Place &amp; Access 勤務地 | (none) |
| `team` | Team &amp; Support チーム・サポート | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

(no mismatch under current scope rules)

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-F — expected label: **6 weeks: 2026-12-01 to 2027-01-11**
- verdict: **PRESENT** ✅ — hero contains first-check item
- hero text excerpt (first 400 chars):

  > Casual / seasonal · Nagoya, Sakae district Seasonal Sales Associate (casual, storefront) Fixed seasonal term and day-by-day tasks; energetic but do not inflate hours/pay. — 6 weeks: 2026-12-01 to 2027-01-11 · Hourly 1,300 JPY This is a fictional posting for Casual Retail Seasonal Sales Associate (fictitious, EN-only). No application function. Casual / seasonal 6 weeks: 2026-12-01 to 2027-01-11 Hou

- checks:
  - pattern `/2026-12-01/i` — FOUND ✅ — …inflate hours/pay. — 6 weeks: 2026-12-01 to 2027-01-11 · Hourly 1,300 JPY This i…
  - pattern `/6 weeks/i` — FOUND ✅ — …t do not inflate hours/pay. — 6 weeks: 2026-12-01 to 2027-01-11 · Hourly 1,300 J…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
