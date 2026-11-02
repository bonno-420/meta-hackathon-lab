# Page check (Layer 1 rule-based) — C-B gen-004

- source: `loops/loop-016/previews/case-B-gen-004-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T10:57:31.311Z
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

### [1] count=4 — `day shift 08:30-17:00, 5 days/week; no scheduled night duty`

- example: Day shift 08:30-17:00, 5 days/week; no scheduled night duty
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Day shift 08:30-17:00, 5 days/week; no scheduled night duty
  - `header` / “Registered Nurse (full-time, general ward)” — Day shift 08:30-17:00, 5 days/week; no scheduled night duty
  - `about` / “The Basics 募集の基本” — Day shift 08:30-17:00, 5 days/week; no scheduled night duty
  - `check` / “Check Before You Apply 応募前の確認” — Day shift 08:30-17:00, 5 days/week; no scheduled night duty

### [2] count=3 — `annual 5,200,000 jpy`

- example: Annual 5,200,000 JPY
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Annual 5,200,000 JPY
  - `about` / “The Basics 募集の基本” — Annual 5,200,000 JPY
  - `check` / “Check Before You Apply 応募前の確認” — Annual 5,200,000 JPY

### [3] count=2 — `8-min walk from sakuragicho station; commuter pass reimbursed in full`

- example: 8-min walk from Sakuragicho Station; commuter pass reimbursed in full
- occurrences:
  - `about` / “The Basics 募集の基本” — 8-min walk from Sakuragicho Station; commuter pass reimbursed in full
  - `check` / “Check Before You Apply 応募前の確認” — 8-min walk from Sakuragicho Station; commuter pass reimbursed in full

### [4] count=2 — `two paid training days per year + quarterly skills workshop`

- example: Two paid training days per year + quarterly skills workshop
- occurrences:
  - `about` / “The Basics 募集の基本” — Two paid training days per year + quarterly skills workshop
  - `check` / “Check Before You Apply 応募前の確認” — Two paid training days per year + quarterly skills workshop

### [5] count=2 — `registered nurse (full-time, general ward)`

- example: Registered Nurse (full-time, general ward)
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Registered Nurse (full-time, general ward)
  - `about` / “The Basics 募集の基本” — Registered Nurse (full-time, general ward)

### [6] count=2 — `yokohama, minato mirai area`

- example: Yokohama, Minato Mirai area
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Yokohama, Minato Mirai area
  - `about` / “The Basics 募集の基本” — Yokohama, Minato Mirai area

### [7] count=2 — `full-time (permanent)`

- example: Full-time (permanent)
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Full-time (permanent)
  - `about` / “The Basics 募集の基本” — Full-time (permanent)

### [8] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …+ quarterly skills workshop All conditions above are from the 10 sentences of C-B gen-004.…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …10 sentences of C-B gen-004. No new facts are added. Apply with license copy — r…

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ (heading vs factKeys)

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

(no mismatch under current scope rules)

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-B — expected label: **Day shift 08:30-17:00**
- verdict: **PRESENT** ✅ — hero contains first-check item
- hero text excerpt (first 400 chars):

  > Full-time (permanent) · Yokohama, Minato Mirai area Registered Nurse (full-time, general ward) Day shift 08:30-17:00, 5 days/week; no scheduled night duty This is a fictional posting for Full-time Healthcare Registered Nurse (fictitious, EN-only). No application function. Full-time (permanent) Day shift 08:30-17:00, 5 days/week; no scheduled night duty Yokohama, Minato Mirai area Annual 5,200,000 

- checks:
  - pattern `/08:30-17:00/i` — FOUND ✅ — …time, general ward) Day shift 08:30-17:00, 5 days/week; no scheduled night duty…
  - pattern `/Day shift/i` — FOUND ✅ — …rse (full-time, general ward) Day shift 08:30-17:00, 5 days/week; no scheduled n…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
