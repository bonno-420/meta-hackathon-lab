# Page check (Layer 1 rule-based) — C-D gen-001

- source: `loops/loop-016/previews/case-D-gen-001-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T07:30:31.069Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 23 |
| duplicate occurrences total | 48 |
| verification phrase groups | 10 |
| verification hits total | 10 |
| record-exposure groups | 11 |
| record-exposure hits | 53 |
| heading mismatch sections | 1 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=3 — `this position is warehouse associate (picking and packing) and the employer is apex work partners (dispatching agency).`

- example: This position is Warehouse Associate (picking and packing) and the employer is Apex Work Partners (dispatching agency).
- occurrences:
  - `about` / “The Basics 募集の基本” — This position is Warehouse Associate (picking and packing) and the employer is Apex Work Partners (dispatching agency).
  - `about` / “The Basics 募集の基本” — This position is Warehouse Associate (picking and packing) and the employer is Apex Work Partners (dispatching agency).
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — This position is Warehouse Associate (picking and packing) and the employer is Apex Work Partners (dispatching agency).

### [2] count=3 — `〔role,employer / l03,l01〕`

- example: 〔role,employer / L03,L01〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔role,employer / L03,L01〕
  - `about` / “The Basics 募集の基本” — 〔role,employer / L03,L01〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔role,employer / L03,L01〕

### [3] count=2 — `commute options are shuttle from kawaguchi station; pass up to 10,000 jpy/month.`

- example: Commute options are Shuttle from Kawaguchi Station; pass up to 10,000 JPY/month.
- occurrences:
  - `about` / “The Basics 募集の基本” — Commute options are Shuttle from Kawaguchi Station; pass up to 10,000 JPY/month.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Commute options are Shuttle from Kawaguchi Station; pass up to 10,000 JPY/month.

### [4] count=2 — `support is agency coordinator on site twice/week + phone support on shift days.`

- example: Support is Agency coordinator on site twice/week + phone support on shift days.
- occurrences:
  - `about` / “The Basics 募集の基本” — Support is Agency coordinator on site twice/week + phone support on shift days.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Support is Agency coordinator on site twice/week + phone support on shift days.

### [5] count=2 — `requirements are no forklift license; able to stand/lift up to 15 kg.`

- example: Requirements are No forklift license; able to stand/lift up to 15 kg.
- occurrences:
  - `about` / “The Basics 募集の基本” — Requirements are No forklift license; able to stand/lift up to 15 kg.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Requirements are No forklift license; able to stand/lift up to 15 kg.

### [6] count=2 — `the worksite is client distribution center in saitama, kawaguchi.`

- example: The worksite is Client distribution center in Saitama, Kawaguchi.
- occurrences:
  - `about` / “The Basics 募集の基本” — The worksite is Client distribution center in Saitama, Kawaguchi.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — The worksite is Client distribution center in Saitama, Kawaguchi.

### [7] count=2 — `you will work in a 10-person team with buddy pairing week 1.`

- example: You will work in a 10-person team with buddy pairing week 1.
- occurrences:
  - `about` / “The Basics 募集の基本” — You will work in a 10-person team with buddy pairing week 1.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — You will work in a 10-person team with buddy pairing week 1.

### [8] count=2 — `shifts are mon-fri, 09:00-17:30, 3-5 days/week selectable.`

- example: Shifts are Mon-Fri, 09:00-17:30, 3-5 days/week selectable.
- occurrences:
  - `about` / “The Basics 募集の基本” — Shifts are Mon-Fri, 09:00-17:30, 3-5 days/week selectable.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Shifts are Mon-Fri, 09:00-17:30, 3-5 days/week selectable.

### [9] count=2 — `employment is dispatched (agency employed, client site).`

- example: Employment is Dispatched (agency employed, client site).
- occurrences:
  - `about` / “The Basics 募集の基本” — Employment is Dispatched (agency employed, client site).
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Employment is Dispatched (agency employed, client site).

### [10] count=2 — `client distribution center in saitama, kawaguchi`

- example: Client distribution center in Saitama, Kawaguchi
- occurrences:
  - `header` / “Warehouse Associate — Dispatched” — Client distribution center in Saitama, Kawaguchi
  - `check` / “Check Before You Apply 応募前の確認” — Client distribution center in Saitama, Kawaguchi

### [11] count=2 — `warehouse associate (picking and packing)`

- example: Warehouse Associate (picking and packing)
- occurrences:
  - `header` / “Warehouse Associate — Dispatched” — Warehouse Associate (picking and packing)
  - `check` / “Check Before You Apply 応募前の確認” — Warehouse Associate (picking and packing)

### [12] count=2 — `dispatched (agency employed, client site)`

- example: Dispatched (agency employed, client site)
- occurrences:
  - `header` / “Warehouse Associate — Dispatched” — Dispatched (agency employed, client site)
  - `check` / “Check Before You Apply 応募前の確認” — Dispatched (agency employed, client site)

### [13] count=2 — `apex work partners (dispatching agency)`

- example: Apex Work Partners (dispatching agency)
- occurrences:
  - `header` / “Warehouse Associate — Dispatched” — Apex Work Partners (dispatching agency)
  - `check` / “Check Before You Apply 応募前の確認” — Apex Work Partners (dispatching agency)

### [14] count=2 — `pay is hourly 1,400 jpy.`

- example: Pay is Hourly 1,400 JPY.
- occurrences:
  - `about` / “The Basics 募集の基本” — Pay is Hourly 1,400 JPY.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Pay is Hourly 1,400 JPY.

### [15] count=2 — `〔employmenttype / l04〕`

- example: 〔employmentType / L04〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔employmentType / L04〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔employmentType / L04〕

### [16] count=2 — `〔requirements / l10〕`

- example: 〔requirements / L10〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔requirements / L10〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔requirements / L10〕

### [17] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

### [18] count=2 — `〔workhours / l06〕`

- example: 〔workHours / L06〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔workHours / L06〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔workHours / L06〕

### [19] count=2 — `〔worksite / l02〕`

- example: 〔worksite / L02〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔worksite / L02〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔worksite / L02〕

### [20] count=2 — `〔commute / l07〕`

- example: 〔commute / L07〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔commute / L07〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔commute / L07〕

### [21] count=2 — `〔support / l08〕`

- example: 〔support / L08〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔support / L08〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔support / L08〕

### [22] count=2 — `〔team / l09〕`

- example: 〔team / L09〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔team / L09〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔team / L09〕

### [23] count=2 — `〔pay / l05〕`

- example: 〔pay / L05〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔pay / L05〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔pay / L05〕

## 2) 検証側定型文の辞書ヒット

- **"What this means"** (EN, C-A real highlight box) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ssignment. 〔employer / L01〕 What this means: Read the sentences above as…
- **"numbers stay exactly as stated"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ounding or reinterpretation — numbers stay exactly as stated in the FACTs. Image: work sc…
- **"as stated in the FACT"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …tation — numbers stay exactly as stated in the FACTs. Image: work scene — muse-i…
- **"Read the sentences above as the full conditions"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …oyer / L01〕 What this means: Read the sentences above as the full conditions. No rounding or reinterpretat…
- **"No rounding or reinterpretation"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …above as the full conditions. No rounding or reinterpretation — numbers stay exactly as sta…
- **"All facts below are the only stated facts"** (EN, C-A must block) — 1 hit(s)
  - `header` / “Warehouse Associate — Dispatched” — …This is a fictional posting. All facts below are the only stated facts (L01–L02–L03–L04–L05–L06–L07–…
- **"Do not invent"** (EN, case-A mustNot) — 1 hit(s)
  - `header` / “Warehouse Associate — Dispatched” — …not blur employer vs worksite Do not invent direct-hire path. CTA: Regist…
- **"Each cites its fact keys and source lines verbatim"** (EN, C-A about lead) — 1 hit(s)
  - `about` / “The Basics 募集の基本” — …C-D gen-001 (10 sentences). Each cites its fact keys and source lines verbatim. employer This position is…
- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …gency employed, client site) All conditions above are from the 10 sentences of C-D gen-001.…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …10 sentences of C-D gen-001. No new facts are added. Register with agency - site…

## 3) 記録物ラベルの露出

- **"fact keys"** — 1 hit(s) (小文字変種)
  - `about` / “The Basics 募集の基本” — …10 sentences). Each cites its fact keys and source lines verbatim. e…
- **"Target audience"** — 1 hit(s) (企画メモ露出)
  - `about` / “The Basics 募集の基本” — …15 kg. 〔requirements / L10〕 Target audience (fixed before generation): Wo…
- **"Persona:"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …shift predictability first.. Persona: Riku, 24, 1 year retail stock…
- **"Persona"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …shift predictability first.. Persona: Riku, 24, 1 year retail stoc…
- **"Insights applied"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …Checks employer vs worksite.. Insights applied: 001.md, 002.md, 003.md.…
- **"Insights"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …Checks employer vs worksite.. Insights applied: 001.md, 002.md, 003.…
- **"Appeal:"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …ifts and coordinator support. Appeal: State employer (agency) and w…
- **"CTA:"** — 1 hit(s) ()
  - `header` / “Warehouse Associate — Dispatched” — …not invent direct-hire path. CTA: Register with agency - site t…
- **"〔"** — 20 hit(s) (引用記号自体（企画では出さない）)
  - `about` / “The Basics 募集の基本” — …rtners (dispatching agency). 〔role,employer / L03,L01〕 work…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …rtners (dispatching agency). 〔role,employer / L03,L01〕 S2…
- **"〕"** — 20 hit(s) ()
  - `about` / “The Basics 募集の基本” — …cy). 〔role,employer / L03,L01〕 worksite The worksite is Cl…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …cy). 〔role,employer / L03,L01〕 S2 Shifts are Mon-Fri, 09:0…
- **"L01"** — 5 hit(s) (sourceLineコード露出（本文中）)
  - `header` / “Warehouse Associate — Dispatched” — …ow are the only stated facts (L01–L02–L03–L04–L05–L06–L07–L08–L…
  - `about` / “The Basics 募集の基本” — …gency). 〔role,employer / L03,L01〕 worksite The worksite is C…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …gency). 〔role,employer / L03,L01〕 S2 Shifts are Mon-Fri, 09:…

## 4) 見出しと中身のずれ (heading vs factKeys)

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Warehouse Associate — Dispatched | (none) |
| `about` | The Basics 募集の基本 | role, employer, worksite, employmentType, pay, workHours, commute, support, team, requirements |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | role, employer, workHours, worksite, employmentType, pay, commute, support, team, requirements |
| `location` | Place &amp; Access 勤務地 | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

**Warnings (candidate rules):**

- `conditions` “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — allowed: salary, pay, workHours, employmentType, wage, annual, hourly — **unexpected: role, employer, worksite, commute, support, team, requirements** — found: role, employer, workHours, worksite, employmentType, pay, commute, support, team, requirements

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-D — expected label: **Apex Work Partners + Saitama Kawaguchi**
- verdict: **PRESENT** ✅ — hero contains first-check item
- hero text excerpt (first 400 chars):

  > Dispatched · Saitama, Kawaguchi Warehouse Associate — Dispatched For workers comfortable with agency employment who value predictable shifts and coordinator support. Employer (agency) and worksite (client) are stated separately. This is a fictional posting. All facts below are the only stated facts (L01–L02–L03–L04–L05–L06–L07–L08–L09–L10). Do not blur employer vs worksite Do not invent direct-hir

- checks:
  - pattern `/Apex Work Partners/i` — FOUND ✅ — …site tour before assignment. Apex Work Partners (dispatching agency) Client dis…
  - pattern `/Saitama/i` — FOUND ✅ — …Dispatched · Saitama, Kawaguchi Warehouse Associate — Dispatche…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
