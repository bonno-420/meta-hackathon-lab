# Page check (Layer 1 rule-based) — C-A gen-004

- source: `loops/loop-016/previews/case-A-gen-004-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T10:57:31.097Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 9 |
| duplicate occurrences total | 21 |
| verification phrase groups | 2 |
| verification hits total | 2 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=4 — `annual 4,800,000 jpy`

- example: Annual 4,800,000 JPY
- occurrences:
  - `header` / “Software Engineer (full-time, SaaS product team)” — Annual 4,800,000 JPY
  - `header` / “Software Engineer (full-time, SaaS product team)” — Annual 4,800,000 JPY
  - `about` / “The Basics 募集の基本” — Annual 4,800,000 JPY
  - `check` / “Check Before You Apply 応募前の確認” — Annual 4,800,000 JPY

### [2] count=3 — `mon-fri, 10:00-18:30 (flex core 11:00-16:00)`

- example: Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)
- occurrences:
  - `header` / “Software Engineer (full-time, SaaS product team)” — Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)
  - `about` / “The Basics 募集の基本” — Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)
  - `check` / “Check Before You Apply 応募前の確認” — Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)

### [3] count=2 — `northbridge labs is hiring a software engineer (full-time, saas product team) in osaka, umeda district.`

- example: Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district.
- occurrences:
  - `location` / “Place &amp; Access 勤務地” — Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district.
  - `team` / “Team &amp; Support チーム・サポート” — Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district.

### [4] count=2 — `5-min walk from umeda station; commuter pass reimbursed in full`

- example: 5-min walk from Umeda Station; commuter pass reimbursed in full
- occurrences:
  - `about` / “The Basics 募集の基本” — 5-min walk from Umeda Station; commuter pass reimbursed in full
  - `check` / “Check Before You Apply 応募前の確認” — 5-min walk from Umeda Station; commuter pass reimbursed in full

### [5] count=2 — `3-month onboarding with dedicated mentor and weekly code review`

- example: 3-month onboarding with dedicated mentor and weekly code review
- occurrences:
  - `about` / “The Basics 募集の基本” — 3-month onboarding with dedicated mentor and weekly code review
  - `check` / “Check Before You Apply 応募前の確認” — 3-month onboarding with dedicated mentor and weekly code review

### [6] count=2 — `software engineer (full-time, saas product team)`

- example: Software Engineer (full-time, SaaS product team)
- occurrences:
  - `header` / “Software Engineer (full-time, SaaS product team)” — Software Engineer (full-time, SaaS product team)
  - `about` / “The Basics 募集の基本” — Software Engineer (full-time, SaaS product team)

### [7] count=2 — `full-time (permanent)`

- example: Full-time (permanent)
- occurrences:
  - `header` / “Software Engineer (full-time, SaaS product team)” — Full-time (permanent)
  - `about` / “The Basics 募集の基本” — Full-time (permanent)

### [8] count=2 — `osaka, umeda district`

- example: Osaka, Umeda district
- occurrences:
  - `header` / “Software Engineer (full-time, SaaS product team)” — Osaka, Umeda district
  - `about` / “The Basics 募集の基本” — Osaka, Umeda district

### [9] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …entor and weekly code review All conditions above are from the 9 sentences of C-A gen-004. N…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …e 9 sentences of C-A gen-004. No new facts are added. Apply with resume — casual…

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ (heading vs factKeys)

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Software Engineer (full-time, SaaS product team) | (none) |
| `about` | The Basics 募集の基本 | (none) |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | (none) |
| `location` | Place &amp; Access 勤務地 | (none) |
| `team` | Team &amp; Support チーム・サポート | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

(no mismatch under current scope rules)

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-A — expected label: **Annual 4,800,000 JPY**
- verdict: **PRESENT** ✅ — hero contains first-check item
- hero text excerpt (first 400 chars):

  > Full-time (permanent) · Osaka, Umeda district Software Engineer (full-time, SaaS product team) Annual 4,800,000 JPY This is a fictional posting for Full-time SaaS Software Engineer (fictitious, EN-only). No application function. Full-time (permanent) Annual 4,800,000 JPY Osaka, Umeda district Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)

- checks:
  - pattern `/4,?800,?000/i` — FOUND ✅ — …me, SaaS product team) Annual 4,800,000 JPY This is a fictional posting for Full…
  - pattern `/Annual/i` — FOUND ✅ — …full-time, SaaS product team) Annual 4,800,000 JPY This is a fictional posting f…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
