# Page check (Layer 1 rule-based) — C-B gen-001

- source: `loops/loop-016/previews/case-B-gen-001-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T07:30:30.651Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 17 |
| duplicate occurrences total | 42 |
| verification phrase groups | 10 |
| verification hits total | 10 |
| record-exposure groups | 11 |
| record-exposure hits | 45 |
| heading mismatch sections | 1 |
| hero P6 present | 0 |
| hero P6 missing patterns | 2 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=4 — `harborview general hospital is hiring for registered nurse (full-time, general ward) in yokohama, minato mirai area.`

- example: Harborview General Hospital is hiring for Registered Nurse (full-time, general ward) in Yokohama, Minato Mirai area.
- occurrences:
  - `about` / “The Basics 募集の基本” — Harborview General Hospital is hiring for Registered Nurse (full-time, general ward) in Yokohama, Minato Mirai area.
  - `about` / “The Basics 募集の基本” — Harborview General Hospital is hiring for Registered Nurse (full-time, general ward) in Yokohama, Minato Mirai area.
  - `about` / “The Basics 募集の基本” — Harborview General Hospital is hiring for Registered Nurse (full-time, general ward) in Yokohama, Minato Mirai area.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Harborview General Hospital is hiring for Registered Nurse (full-time, general ward) in Yokohama, Minato Mirai area.

### [2] count=4 — `〔company,role,location / l01,l02,l03〕`

- example: 〔company,role,location / L01,L02,L03〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔company,role,location / L01,L02,L03〕
  - `about` / “The Basics 募集の基本” — 〔company,role,location / L01,L02,L03〕
  - `about` / “The Basics 募集の基本” — 〔company,role,location / L01,L02,L03〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔company,role,location / L01,L02,L03〕

### [3] count=3 — `you will join a 12-nurse ward with dedicated handover lead and receive two paid training days per year + quarterly skill`

- example: You will join a 12-nurse ward with dedicated handover lead and receive Two paid training days per year + quarterly skills workshop.
- occurrences:
  - `about` / “The Basics 募集の基本” — You will join a 12-nurse ward with dedicated handover lead and receive Two paid training days per year + quarterly skills workshop.
  - `about` / “The Basics 募集の基本” — You will join a 12-nurse ward with dedicated handover lead and receive Two paid training days per year + quarterly skills workshop.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — You will join a 12-nurse ward with dedicated handover lead and receive Two paid training days per year + quarterly skills workshop.

### [4] count=3 — `this is a full-time (permanent) position with annual 5,200,000 jpy.`

- example: This is a Full-time (permanent) position with Annual 5,200,000 JPY.
- occurrences:
  - `about` / “The Basics 募集の基本” — This is a Full-time (permanent) position with Annual 5,200,000 JPY.
  - `about` / “The Basics 募集の基本” — This is a Full-time (permanent) position with Annual 5,200,000 JPY.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — This is a Full-time (permanent) position with Annual 5,200,000 JPY.

### [5] count=3 — `〔employmenttype,salary / l04,l05〕`

- example: 〔employmentType,salary / L04,L05〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔employmentType,salary / L04,L05〕
  - `about` / “The Basics 募集の基本” — 〔employmentType,salary / L04,L05〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔employmentType,salary / L04,L05〕

### [6] count=3 — `〔team,training / l09,l08〕`

- example: 〔team,training / L09,L08〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔team,training / L09,L08〕
  - `about` / “The Basics 募集の基本” — 〔team,training / L09,L08〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔team,training / L09,L08〕

### [7] count=2 — `benefits include health insurance, 12 paid days from month 7, childcare support desk on site.`

- example: Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site.
- occurrences:
  - `about` / “The Basics 募集の基本” — Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site.

### [8] count=2 — `the workplace is 8-min walk from sakuragicho station; commuter pass reimbursed in full.`

- example: The workplace is 8-min walk from Sakuragicho Station; commuter pass reimbursed in full.
- occurrences:
  - `about` / “The Basics 募集の基本” — The workplace is 8-min walk from Sakuragicho Station; commuter pass reimbursed in full.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — The workplace is 8-min walk from Sakuragicho Station; commuter pass reimbursed in full.

### [9] count=2 — `working hours are day shift 08:30-17:00, 5 days/week; no scheduled night duty.`

- example: Working hours are Day shift 08:30-17:00, 5 days/week; no scheduled night duty.
- occurrences:
  - `about` / “The Basics 募集の基本” — Working hours are Day shift 08:30-17:00, 5 days/week; no scheduled night duty.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Working hours are Day shift 08:30-17:00, 5 days/week; no scheduled night duty.

### [10] count=2 — `registered nurse (full-time, general ward)`

- example: Registered Nurse (full-time, general ward)
- occurrences:
  - `header` / “Registered Nurse — General Ward” — Registered Nurse (full-time, general ward)
  - `check` / “Check Before You Apply 応募前の確認” — Registered Nurse (full-time, general ward)

### [11] count=2 — `harborview general hospital`

- example: Harborview General Hospital
- occurrences:
  - `header` / “Registered Nurse — General Ward” — Harborview General Hospital
  - `check` / “Check Before You Apply 応募前の確認” — Harborview General Hospital

### [12] count=2 — `yokohama, minato mirai area`

- example: Yokohama, Minato Mirai area
- occurrences:
  - `header` / “Registered Nurse — General Ward” — Yokohama, Minato Mirai area
  - `check` / “Check Before You Apply 応募前の確認” — Yokohama, Minato Mirai area

### [13] count=2 — `full-time (permanent)`

- example: Full-time (permanent)
- occurrences:
  - `header` / “Registered Nurse — General Ward” — Full-time (permanent)
  - `check` / “Check Before You Apply 応募前の確認” — Full-time (permanent)

### [14] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

### [15] count=2 — `〔workhours / l06〕`

- example: 〔workHours / L06〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔workHours / L06〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔workHours / L06〕

### [16] count=2 — `〔benefits / l10〕`

- example: 〔benefits / L10〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔benefits / L10〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔benefits / L10〕

### [17] count=2 — `〔commute / l07〕`

- example: 〔commute / L07〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔commute / L07〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔commute / L07〕

## 2) 検証側定型文の辞書ヒット

- **"What this means"** (EN, C-A real highlight box) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …k on site. 〔benefits / L10〕 What this means: Read the sentences above as…
- **"numbers stay exactly as stated"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ounding or reinterpretation — numbers stay exactly as stated in the FACTs. Image: work sc…
- **"as stated in the FACT"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …tation — numbers stay exactly as stated in the FACTs. Image: work scene — muse-i…
- **"Read the sentences above as the full conditions"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …fits / L10〕 What this means: Read the sentences above as the full conditions. No rounding or reinterpretat…
- **"No rounding or reinterpretation"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …above as the full conditions. No rounding or reinterpretation — numbers stay exactly as sta…
- **"All facts below are the only stated facts"** (EN, C-A must block) — 1 hit(s)
  - `header` / “Registered Nurse — General Ward” — …This is a fictional posting. All facts below are the only stated facts (L01–L02–L03–L04–L05–L06–L07–…
- **"Do not invent"** (EN, case-A mustNot) — 1 hit(s)
  - `header` / “Registered Nurse — General Ward” — …L04–L05–L06–L07–L08–L09–L10). Do not invent shift allowances Do not add n…
- **"Each cites its fact keys and source lines verbatim"** (EN, C-A about lead) — 1 hit(s)
  - `about` / “The Basics 募集の基本” — …n C-B gen-001 (6 sentences). Each cites its fact keys and source lines verbatim. company Harborview General…
- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …area Full-time (permanent) All conditions above are from the 6 sentences of C-B gen-001. N…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …e 6 sentences of C-B gen-001. No new facts are added. Apply with license copy - r…

## 3) 記録物ラベルの露出

- **"fact keys"** — 1 hit(s) (小文字変種)
  - `about` / “The Basics 募集の基本” — …(6 sentences). Each cites its fact keys and source lines verbatim. c…
- **"Target audience"** — 1 hit(s) (企画メモ露出)
  - `about` / “The Basics 募集の基本” — …k on site. 〔benefits / L10〕 Target audience (fixed before generation): Li…
- **"Persona:"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …t and salary as fixed facts.. Persona: Maya, 31, RN 4 years suburban…
- **"Persona"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …t and salary as fixed facts.. Persona: Maya, 31, RN 4 years suburba…
- **"Insights applied"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …Checks commute/shifts first.. Insights applied: 001.md.…
- **"Insights"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …Checks commute/shifts first.. Insights applied: 001.md.…
- **"Appeal:"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …es in urban general hospital. Appeal: Structured handover and funde…
- **"CTA:"** — 1 hit(s) ()
  - `header` / “Registered Nurse — General Ward” — …wances Do not add night duty. CTA: Apply with license copy - rep…
- **"〔"** — 16 hit(s) (引用記号自体（企画では出さない）)
  - `about` / “The Basics 募集の基本” — …Yokohama, Minato Mirai area. 〔company,role,location / L01,L0…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …Yokohama, Minato Mirai area. 〔company,role,location / L01,L0…
- **"〕"** — 16 hit(s) ()
  - `about` / “The Basics 募集の基本” — …ny,role,location / L01,L02,L03〕 role Harborview General Hos…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ny,role,location / L01,L02,L03〕 S2 This is a Full-time (per…
- **"L01"** — 5 hit(s) (sourceLineコード露出（本文中）)
  - `header` / “Registered Nurse — General Ward” — …ow are the only stated facts (L01–L02–L03–L04–L05–L06–L07–L08–L…
  - `about` / “The Basics 募集の基本” — …ea. 〔company,role,location / L01,L02,L03〕 role Harborview Ge…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ea. 〔company,role,location / L01,L02,L03〕 S2 This is a Full-…

## 4) 見出しと中身のずれ (heading vs factKeys)

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Registered Nurse — General Ward | (none) |
| `about` | The Basics 募集の基本 | company, role, location, employmentType, salary, workHours, commute, team, training, benefits |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | company, role, location, employmentType, salary, workHours, commute, team, training, benefits |
| `location` | Place &amp; Access 勤務地 | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

**Warnings (candidate rules):**

- `conditions` “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — allowed: salary, pay, workHours, employmentType, wage, annual, hourly — **unexpected: company, role, location, commute, team, training, benefits** — found: company, role, location, employmentType, salary, workHours, commute, team, training, benefits

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-B — expected label: **Day shift 08:30-17:00**
- verdict: **MISSING** ❌ — hero does not contain first-check item
- hero text excerpt (first 400 chars):

  > Full-time · Yokohama, Minato Mirai Registered Nurse — General Ward For licensed nurses who want a larger day-shift team with clear handover and paid training. Shifts and pay are fixed facts — no night duty is scheduled. This is a fictional posting. All facts below are the only stated facts (L01–L02–L03–L04–L05–L06–L07–L08–L09–L10). Do not invent shift allowances Do not add night duty. CTA: Apply w

- checks:
  - pattern `/08:30-17:00/i` — NOT FOUND ❌
  - pattern `/Day shift/i` — NOT FOUND ❌
- missing patterns: /08:30-17:00/i, /Day shift/i

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
