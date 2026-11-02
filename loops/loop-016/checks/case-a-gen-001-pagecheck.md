# Page check (Layer 1 rule-based) — C-A gen-001

- source: `loops/loop-016/previews/case-A-gen-001-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T07:30:30.420Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 15 |
| duplicate occurrences total | 40 |
| verification phrase groups | 10 |
| verification hits total | 10 |
| record-exposure groups | 11 |
| record-exposure hits | 43 |
| heading mismatch sections | 1 |
| hero P6 present | 0 |
| hero P6 missing patterns | 2 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=4 — `northbridge labs is hiring a software engineer (full-time, saas product team) in osaka, umeda district.`

- example: Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district.
- occurrences:
  - `about` / “The Basics 募集の基本” — Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district.
  - `about` / “The Basics 募集の基本” — Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district.
  - `about` / “The Basics 募集の基本” — Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district.

### [2] count=4 — `〔company,role,location / l01,l02,l03〕`

- example: 〔company,role,location / L01,L02,L03〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔company,role,location / L01,L02,L03〕
  - `about` / “The Basics 募集の基本” — 〔company,role,location / L01,L02,L03〕
  - `about` / “The Basics 募集の基本” — 〔company,role,location / L01,L02,L03〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔company,role,location / L01,L02,L03〕

### [3] count=3 — `you will join a 8-person product team (4 engineers, 2 designers, 2 pms) and receive 3-month onboarding with dedicated me`

- example: You will join a 8-person product team (4 engineers, 2 designers, 2 PMs) and receive 3-month onboarding with dedicated mentor and weekly code review.
- occurrences:
  - `about` / “The Basics 募集の基本” — You will join a 8-person product team (4 engineers, 2 designers, 2 PMs) and receive 3-month onboarding with dedicated mentor and weekly code review.
  - `about` / “The Basics 募集の基本” — You will join a 8-person product team (4 engineers, 2 designers, 2 PMs) and receive 3-month onboarding with dedicated mentor and weekly code review.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — You will join a 8-person product team (4 engineers, 2 designers, 2 PMs) and receive 3-month onboarding with dedicated mentor and weekly code review.

### [4] count=3 — `working hours are mon-fri, 10:00-18:30 (flex core 11:00-16:00), and the office is 5-min walk from umeda station; commute`

- example: Working hours are Mon-Fri, 10:00-18:30 (flex core 11:00-16:00), and the office is 5-min walk from Umeda Station; commuter pass reimbursed in full.
- occurrences:
  - `about` / “The Basics 募集の基本” — Working hours are Mon-Fri, 10:00-18:30 (flex core 11:00-16:00), and the office is 5-min walk from Umeda Station; commuter pass reimbursed in full.
  - `about` / “The Basics 募集の基本” — Working hours are Mon-Fri, 10:00-18:30 (flex core 11:00-16:00), and the office is 5-min walk from Umeda Station; commuter pass reimbursed in full.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Working hours are Mon-Fri, 10:00-18:30 (flex core 11:00-16:00), and the office is 5-min walk from Umeda Station; commuter pass reimbursed in full.

### [5] count=3 — `this is a full-time (permanent) position offering annual 4,800,000 jpy.`

- example: This is a Full-time (permanent) position offering Annual 4,800,000 JPY.
- occurrences:
  - `about` / “The Basics 募集の基本” — This is a Full-time (permanent) position offering Annual 4,800,000 JPY.
  - `about` / “The Basics 募集の基本” — This is a Full-time (permanent) position offering Annual 4,800,000 JPY.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — This is a Full-time (permanent) position offering Annual 4,800,000 JPY.

### [6] count=3 — `〔employmenttype,salary / l04,l05〕`

- example: 〔employmentType,salary / L04,L05〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔employmentType,salary / L04,L05〕
  - `about` / “The Basics 募集の基本” — 〔employmentType,salary / L04,L05〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔employmentType,salary / L04,L05〕

### [7] count=3 — `〔workhours,commute / l06,l07〕`

- example: 〔workHours,commute / L06,L07〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔workHours,commute / L06,L07〕
  - `about` / “The Basics 募集の基本” — 〔workHours,commute / L06,L07〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔workHours,commute / L06,L07〕

### [8] count=3 — `〔team,training / l09,l08〕`

- example: 〔team,training / L09,L08〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔team,training / L09,L08〕
  - `about` / “The Basics 募集の基本” — 〔team,training / L09,L08〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔team,training / L09,L08〕

### [9] count=2 — `benefits include health insurance, 10 paid days from month 7, laptop provided.`

- example: Benefits include Health insurance, 10 paid days from month 7, laptop provided.
- occurrences:
  - `about` / “The Basics 募集の基本” — Benefits include Health insurance, 10 paid days from month 7, laptop provided.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Benefits include Health insurance, 10 paid days from month 7, laptop provided.

### [10] count=2 — `software engineer (full-time, saas product team)`

- example: Software Engineer (full-time, SaaS product team)
- occurrences:
  - `header` / “Software Engineer — SaaS Product Team” — Software Engineer (full-time, SaaS product team)
  - `check` / “Check Before You Apply 応募前の確認” — Software Engineer (full-time, SaaS product team)

### [11] count=2 — `osaka, umeda district`

- example: Osaka, Umeda district
- occurrences:
  - `header` / “Software Engineer — SaaS Product Team” — Osaka, Umeda district
  - `check` / “Check Before You Apply 応募前の確認” — Osaka, Umeda district

### [12] count=2 — `full-time (permanent)`

- example: Full-time (permanent)
- occurrences:
  - `header` / “Software Engineer — SaaS Product Team” — Full-time (permanent)
  - `check` / “Check Before You Apply 応募前の確認” — Full-time (permanent)

### [13] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

### [14] count=2 — `northbridge labs`

- example: Northbridge Labs
- occurrences:
  - `header` / “Software Engineer — SaaS Product Team” — Northbridge Labs
  - `check` / “Check Before You Apply 応募前の確認” — Northbridge Labs

### [15] count=2 — `〔benefits / l10〕`

- example: 〔benefits / L10〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔benefits / L10〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔benefits / L10〕

## 2) 検証側定型文の辞書ヒット

- **"What this means"** (EN, C-A real highlight box) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …provided. 〔benefits / L10〕 What this means: Read the sentences above as…
- **"numbers stay exactly as stated"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ounding or reinterpretation — numbers stay exactly as stated in the FACTs. Image: work sc…
- **"as stated in the FACT"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …tation — numbers stay exactly as stated in the FACTs. Image: work scene — muse-i…
- **"Read the sentences above as the full conditions"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …fits / L10〕 What this means: Read the sentences above as the full conditions. No rounding or reinterpretat…
- **"No rounding or reinterpretation"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …above as the full conditions. No rounding or reinterpretation — numbers stay exactly as sta…
- **"All facts below are the only stated facts"** (EN, C-A must block) — 1 hit(s)
  - `header` / “Software Engineer — SaaS Product Team” — …This is a fictional posting. All facts below are the only stated facts (L01–L02–L03–L04–L05–L06–L07–…
- **"Do not invent"** (EN, case-A mustNot) — 1 hit(s)
  - `header` / “Software Engineer — SaaS Product Team” — …L04–L05–L06–L07–L08–L09–L10). Do not invent salary or benefits Do not pro…
- **"Each cites its fact keys and source lines verbatim"** (EN, C-A about lead) — 1 hit(s)
  - `about` / “The Basics 募集の基本” — …n C-A gen-001 (5 sentences). Each cites its fact keys and source lines verbatim. company Northbridge Labs i…
- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …trict Full-time (permanent) All conditions above are from the 5 sentences of C-A gen-001. N…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …e 5 sentences of C-A gen-001. No new facts are added. Apply with resume - casual…

## 3) 記録物ラベルの露出

- **"fact keys"** — 1 hit(s) (小文字変種)
  - `about` / “The Basics 募集の基本” — …(5 sentences). Each cites its fact keys and source lines verbatim. c…
- **"Target audience"** — 1 hit(s) (企画メモ露出)
  - `about` / “The Basics 募集の基本” — …provided. 〔benefits / L10〕 Target audience (fixed before generation): Ea…
- **"Persona:"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …ize commute and team rhythm.. Persona: Alex, 26, 2 years as backend…
- **"Persona"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …ize commute and team rhythm.. Persona: Alex, 26, 2 years as backend…
- **"Insights applied"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …mute. Reads on mobile first.. Insights applied: なし.…
- **"Insights"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …mute. Reads on mobile first.. Insights applied: なし.…
- **"Appeal:"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …work in an urban tech office. Appeal: Mentorship and code-review fi…
- **"CTA:"** — 1 hit(s) ()
  - `header` / “Software Engineer — SaaS Product Team” — …s Do not promise remote work. CTA: Apply with resume - casual fi…
- **"〔"** — 15 hit(s) (引用記号自体（企画では出さない）)
  - `about` / “The Basics 募集の基本” — …m) in Osaka, Umeda district. 〔company,role,location / L01,L0…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …m) in Osaka, Umeda district. 〔company,role,location / L01,L0…
- **"〕"** — 15 hit(s) ()
  - `about` / “The Basics 募集の基本” — …ny,role,location / L01,L02,L03〕 role Northbridge Labs is hi…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ny,role,location / L01,L02,L03〕 S2 This is a Full-time (per…
- **"L01"** — 5 hit(s) (sourceLineコード露出（本文中）)
  - `header` / “Software Engineer — SaaS Product Team” — …ow are the only stated facts (L01–L02–L03–L04–L05–L06–L07–L08–L…
  - `about` / “The Basics 募集の基本” — …ct. 〔company,role,location / L01,L02,L03〕 role Northbridge L…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ct. 〔company,role,location / L01,L02,L03〕 S2 This is a Full-…

## 4) 見出しと中身のずれ (heading vs factKeys)

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Software Engineer — SaaS Product Team | (none) |
| `about` | The Basics 募集の基本 | company, role, location, employmentType, salary, workHours, commute, team, training, benefits |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | company, role, location, employmentType, salary, workHours, commute, team, training, benefits |
| `location` | Place &amp; Access 勤務地 | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

**Warnings (candidate rules):**

- `conditions` “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — allowed: salary, pay, workHours, employmentType, wage, annual, hourly — **unexpected: company, role, location, commute, team, training, benefits** — found: company, role, location, employmentType, salary, workHours, commute, team, training, benefits

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-A — expected label: **Annual 4,800,000 JPY**
- verdict: **MISSING** ❌ — hero does not contain first-check item
- hero text excerpt (first 400 chars):

  > Full-time · Osaka, Umeda Software Engineer — SaaS Product Team For early-career engineers (1–3 years) who want code-review culture, regular hours, and a short commute. Mentorship and team rhythm come first — pay is stated exactly as it is. This is a fictional posting. All facts below are the only stated facts (L01–L02–L03–L04–L05–L06–L07–L08–L09–L10). Do not invent salary or benefits Do not promis

- checks:
  - pattern `/4,?800,?000/i` — NOT FOUND ❌
  - pattern `/Annual/i` — NOT FOUND ❌
- missing patterns: /4,?800,?000/i, /Annual/i

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
