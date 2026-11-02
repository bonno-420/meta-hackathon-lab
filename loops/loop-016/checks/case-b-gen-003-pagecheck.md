# Page check (Layer 1 rule-based) — C-B gen-003

- source: `loops/loop-016/previews/case-B-gen-003-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T07:35:32.638Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 7 |
| duplicate occurrences total | 17 |
| verification phrase groups | 2 |
| verification hits total | 2 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=3 — `registered nurse (full-time, general ward)`

- example: Registered Nurse (full-time, general ward)
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Registered Nurse (full-time, general ward)
  - `about` / “The Basics 募集の基本” — Registered Nurse (full-time, general ward)
  - `check` / “Check Before You Apply 応募前の確認” — Registered Nurse (full-time, general ward)

### [2] count=3 — `yokohama, minato mirai area`

- example: Yokohama, Minato Mirai area
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Yokohama, Minato Mirai area
  - `about` / “The Basics 募集の基本” — Yokohama, Minato Mirai area
  - `check` / “Check Before You Apply 応募前の確認” — Yokohama, Minato Mirai area

### [3] count=3 — `full-time (permanent)`

- example: Full-time (permanent)
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Full-time (permanent)
  - `about` / “The Basics 募集の基本” — Full-time (permanent)
  - `check` / “Check Before You Apply 応募前の確認” — Full-time (permanent)

### [4] count=2 — `day shift 08:30-17:00, 5 days/week; no scheduled night duty`

- example: Day shift 08:30-17:00, 5 days/week; no scheduled night duty
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Day shift 08:30-17:00, 5 days/week; no scheduled night duty
  - `about` / “The Basics 募集の基本” — Day shift 08:30-17:00, 5 days/week; no scheduled night duty

### [5] count=2 — `harborview general hospital`

- example: Harborview General Hospital
- occurrences:
  - `about` / “The Basics 募集の基本” — Harborview General Hospital
  - `check` / “Check Before You Apply 応募前の確認” — Harborview General Hospital

### [6] count=2 — `annual 5,200,000 jpy`

- example: Annual 5,200,000 JPY
- occurrences:
  - `header` / “Registered Nurse (full-time, general ward)” — Annual 5,200,000 JPY
  - `about` / “The Basics 募集の基本” — Annual 5,200,000 JPY

### [7] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …area Full-time (permanent) All conditions above are from the 11 sentences of C-B gen-003.…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …11 sentences of C-B gen-003. No new facts are added. Apply with license copy - r…

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

  > Full-time (permanent) · Yokohama, Minato Mirai area Registered Nurse (full-time, general ward) Structured handover and funded training first; shift and salary as fixed facts. — Day shift 08:30-17:00, 5 days/week; no scheduled night duty This is a fictional posting for Full-time Healthcare Registered Nurse (fictitious, EN-only). No application function. Full-time (permanent) Day shift 08:30-17:00, 

- checks:
  - pattern `/08:30-17:00/i` — FOUND ✅ — …y as fixed facts. — Day shift 08:30-17:00, 5 days/week; no scheduled night duty…
  - pattern `/Day shift/i` — FOUND ✅ — …and salary as fixed facts. — Day shift 08:30-17:00, 5 days/week; no scheduled n…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
