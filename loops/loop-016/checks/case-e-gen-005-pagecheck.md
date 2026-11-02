# Page check (Layer 1 rule-based) — C-E gen-005

- source: `loops/loop-016/previews/case-E-gen-005-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T11:42:25.192Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 6 |
| duplicate occurrences total | 13 |
| verification phrase groups | 2 |
| verification hits total | 2 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=3 — `work hours`

- example: Work hours
- occurrences:
  - `header` / “Cafe Crew (part-time, short hours)” — Work hours
  - `about` / “The Basics 募集の基本” — Work hours
  - `check` / “Check Before You Apply 応募前の確認” — Work hours

### [2] count=2 — `2-min walk from futako-tamagawa station; pass up to 10,000 jpy/month`

- example: 2-min walk from Futako-Tamagawa Station; pass up to 10,000 JPY/month
- occurrences:
  - `header` / “Cafe Crew (part-time, short hours)” — 2-min walk from Futako-Tamagawa Station; pass up to 10,000 JPY/month
  - `about` / “The Basics 募集の基本” — 2-min walk from Futako-Tamagawa Station; pass up to 10,000 JPY/month

### [3] count=2 — `from 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00`

- example: From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00
- occurrences:
  - `header` / “Cafe Crew (part-time, short hours)” — From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00
  - `about` / “The Basics 募集の基本” — From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00

### [4] count=2 — `cafe crew (part-time, short hours)`

- example: Cafe Crew (part-time, short hours)
- occurrences:
  - `header` / “Cafe Crew (part-time, short hours)” — Cafe Crew (part-time, short hours)
  - `about` / “The Basics 募集の基本” — Cafe Crew (part-time, short hours)

### [5] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

### [6] count=2 — `hourly 1,250 jpy`

- example: Hourly 1,250 JPY
- occurrences:
  - `header` / “Cafe Crew (part-time, short hours)” — Hourly 1,250 JPY
  - `about` / “The Basics 募集の基本” — Hourly 1,250 JPY

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …uddy; no experience required All conditions above are from the 9 sentences of C-E gen-005. N…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …e 9 sentences of C-E gen-005. No new facts are added. Quick apply — no resume, ca…

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ (heading vs factKeys)

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Cafe Crew (part-time, short hours) | (none) |
| `about` | The Basics 募集の基本 | (none) |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | (none) |
| `location` | Place &amp; Access 勤務地 | (none) |
| `team` | Team &amp; Support チーム・サポート | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

(no mismatch under current scope rules)

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-E — expected label: **From 3 hours + Futako-Tamagawa**
- verdict: **PRESENT** ✅ — hero contains first-check item
- hero text excerpt (first 400 chars):

  > Part-time · Setagaya, Futako-Tamagawa Cafe Crew (part-time, short hours) Work hours From 3h/day · 2-4 days/wk Commute 2-min walk · Futako-Tamagawa Sta. This is a fictional posting for Part-time Cafe Crew short hours (fictitious, EN-only). No application function. Part-time From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00 2-min walk from Futako-Tamagawa Station; pass up to 10,000 JPY/mon

- checks:
  - pattern `/3 hours/i` — FOUND ✅ — …tion function. Part-time From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-1…
  - pattern `/08:00-11:00/i` — FOUND ✅ — …m 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00 2-min walk from Futako-…
  - pattern `/Futako-Tamagawa/i` — FOUND ✅ — …Part-time · Setagaya, Futako-Tamagawa Cafe Crew (part-time, short hours)…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
