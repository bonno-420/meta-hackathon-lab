# Page check (Layer 1 rule-based) — C-C gen-001

- source: `loops/loop-016/previews/case-C-gen-001-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T07:30:30.844Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 17 |
| duplicate occurrences total | 47 |
| verification phrase groups | 10 |
| verification hits total | 10 |
| record-exposure groups | 11 |
| record-exposure hits | 46 |
| heading mismatch sections | 1 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=7 — `everfield & co.`

- example: Everfield & Co.
- occurrences:
  - `header` / “Brand Specialist — 12-Month Contract” — Everfield & Co.
  - `about` / “The Basics 募集の基本” — Everfield & Co.
  - `about` / “The Basics 募集の基本” — Everfield & Co.
  - `about` / “The Basics 募集の基本” — Everfield & Co.
  - `about` / “The Basics 募集の基本” — Everfield & Co.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Everfield & Co.
  - `check` / “Check Before You Apply 応募前の確認” — Everfield & Co.

### [2] count=5 — `is hiring a brand specialist (12-month fixed-term contract) in tokyo, shibuya on a contract, 12 months basis; apply with`

- example: is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya on a Contract, 12 months basis; apply with one portfolio link.
- occurrences:
  - `about` / “The Basics 募集の基本” — is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya on a Contract, 12 months basis; apply with one portfolio link.
  - `about` / “The Basics 募集の基本” — is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya on a Contract, 12 months basis; apply with one portfolio link.
  - `about` / “The Basics 募集の基本” — is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya on a Contract, 12 months basis; apply with one portfolio link.
  - `about` / “The Basics 募集の基本” — is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya on a Contract, 12 months basis; apply with one portfolio link.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya on a Contract, 12 months basis; apply with one portfolio link.

### [3] count=5 — `〔company,role,location,employmenttype / l01,l02,l03,l04〕`

- example: 〔company,role,location,employmentType / L01,L02,L03,L04〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔company,role,location,employmentType / L01,L02,L03,L04〕
  - `about` / “The Basics 募集の基本” — 〔company,role,location,employmentType / L01,L02,L03,L04〕
  - `about` / “The Basics 募集の基本” — 〔company,role,location,employmentType / L01,L02,L03,L04〕
  - `about` / “The Basics 募集の基本” — 〔company,role,location,employmentType / L01,L02,L03,L04〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔company,role,location,employmentType / L01,L02,L03,L04〕

### [4] count=3 — `the position offers monthly 380,000 jpy and includes health insurance, 10 paid days from month 4, ownership of 2 launche`

- example: The position offers Monthly 380,000 JPY and includes Health insurance, 10 paid days from month 4, ownership of 2 launches.
- occurrences:
  - `about` / “The Basics 募集の基本” — The position offers Monthly 380,000 JPY and includes Health insurance, 10 paid days from month 4, ownership of 2 launches.
  - `about` / “The Basics 募集の基本” — The position offers Monthly 380,000 JPY and includes Health insurance, 10 paid days from month 4, ownership of 2 launches.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — The position offers Monthly 380,000 JPY and includes Health insurance, 10 paid days from month 4, ownership of 2 launches.

### [5] count=3 — `〔salary,benefits / l05,l10〕`

- example: 〔salary,benefits / L05,L10〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔salary,benefits / L05,L10〕
  - `about` / “The Basics 募集の基本” — 〔salary,benefits / L05,L10〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔salary,benefits / L05,L10〕

### [6] count=2 — `the contract includes renewal review at month 11; no automatic conversion.`

- example: The contract includes Renewal review at month 11; no automatic conversion.
- occurrences:
  - `about` / “The Basics 募集の基本” — The contract includes Renewal review at month 11; no automatic conversion.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — The contract includes Renewal review at month 11; no automatic conversion.

### [7] count=2 — `working hours are mon-fri, 10:00-19:00, avg 2 days remote/week.`

- example: Working hours are Mon-Fri, 10:00-19:00, avg 2 days remote/week.
- occurrences:
  - `about` / “The Basics 募集の基本” — Working hours are Mon-Fri, 10:00-19:00, avg 2 days remote/week.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Working hours are Mon-Fri, 10:00-19:00, avg 2 days remote/week.

### [8] count=2 — `you will join a 6-person brand team, reports to brand lead.`

- example: You will join a 6-person brand team, reports to Brand Lead.
- occurrences:
  - `about` / “The Basics 募集の基本” — You will join a 6-person brand team, reports to Brand Lead.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — You will join a 6-person brand team, reports to Brand Lead.

### [9] count=2 — `commuter pass up to 15,000 jpy/month is provided.`

- example: Commuter pass up to 15,000 JPY/month is provided.
- occurrences:
  - `about` / “The Basics 募集の基本” — Commuter pass up to 15,000 JPY/month is provided.
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — Commuter pass up to 15,000 JPY/month is provided.

### [10] count=2 — `brand specialist (12-month fixed-term contract)`

- example: Brand Specialist (12-month fixed-term contract)
- occurrences:
  - `header` / “Brand Specialist — 12-Month Contract” — Brand Specialist (12-month fixed-term contract)
  - `check` / “Check Before You Apply 応募前の確認” — Brand Specialist (12-month fixed-term contract)

### [11] count=2 — `〔contractterms / l08〕`

- example: 〔contractTerms / L08〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔contractTerms / L08〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔contractTerms / L08〕

### [12] count=2 — `contract, 12 months`

- example: Contract, 12 months
- occurrences:
  - `header` / “Brand Specialist — 12-Month Contract” — Contract, 12 months
  - `check` / “Check Before You Apply 応募前の確認” — Contract, 12 months

### [13] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

### [14] count=2 — `〔workhours / l06〕`

- example: 〔workHours / L06〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔workHours / L06〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔workHours / L06〕

### [15] count=2 — `〔commute / l07〕`

- example: 〔commute / L07〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔commute / L07〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔commute / L07〕

### [16] count=2 — `tokyo, shibuya`

- example: Tokyo, Shibuya
- occurrences:
  - `header` / “Brand Specialist — 12-Month Contract” — Tokyo, Shibuya
  - `check` / “Check Before You Apply 応募前の確認” — Tokyo, Shibuya

### [17] count=2 — `〔team / l09〕`

- example: 〔team / L09〕
- occurrences:
  - `about` / “The Basics 募集の基本” — 〔team / L09〕
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 〔team / L09〕

## 2) 検証側定型文の辞書ヒット

- **"What this means"** (EN, C-A real highlight box) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …〔salary,benefits / L05,L10〕 What this means: Read the sentences above as…
- **"numbers stay exactly as stated"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ounding or reinterpretation — numbers stay exactly as stated in the FACTs. Image: work sc…
- **"as stated in the FACT"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …tation — numbers stay exactly as stated in the FACTs. Image: work scene — muse-i…
- **"Read the sentences above as the full conditions"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …/ L05,L10〕 What this means: Read the sentences above as the full conditions. No rounding or reinterpretat…
- **"No rounding or reinterpretation"** (EN, C-A real) — 1 hit(s)
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …above as the full conditions. No rounding or reinterpretation — numbers stay exactly as sta…
- **"All facts below are the only stated facts"** (EN, C-A must block) — 1 hit(s)
  - `header` / “Brand Specialist — 12-Month Contract” — …This is a fictional posting. All facts below are the only stated facts (L01–L02–L03–L04–L05–L06–L07–…
- **"Do not invent"** (EN, case-A mustNot) — 1 hit(s)
  - `header` / “Brand Specialist — 12-Month Contract” — …ot imply permanent employment Do not invent conversion guarantee. CTA: Ap…
- **"Each cites its fact keys and source lines verbatim"** (EN, C-A about lead) — 1 hit(s)
  - `about` / “The Basics 募集の基本” — …n C-C gen-001 (6 sentences). Each cites its fact keys and source lines verbatim. company Everfield & Co. is…
- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …Shibuya Contract, 12 months All conditions above are from the 6 sentences of C-C gen-001. N…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …e 6 sentences of C-C gen-001. No new facts are added. Apply with one portfolio li…

## 3) 記録物ラベルの露出

- **"fact keys"** — 1 hit(s) (小文字変種)
  - `about` / “The Basics 募集の基本” — …(6 sentences). Each cites its fact keys and source lines verbatim. c…
- **"Target audience"** — 1 hit(s) (企画メモ露出)
  - `about` / “The Basics 募集の基本” — …〔salary,benefits / L05,L10〕 Target audience (fixed before generation): Mi…
- **"Persona:"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …mpaign ownership over perks.. Persona: Jordan, 29, 4 years brand par…
- **"Persona"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …mpaign ownership over perks.. Persona: Jordan, 29, 4 years brand pa…
- **"Insights applied"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …Scans contract length first.. Insights applied: 001.md, 002.md.…
- **"Insights"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …Scans contract length first.. Insights applied: 001.md, 002.md.…
- **"Appeal:"** — 1 hit(s) ()
  - `about` / “The Basics 募集の基本” — …ract with renewal checkpoint. Appeal: Explicit 12-month term and re…
- **"CTA:"** — 1 hit(s) ()
  - `header` / “Brand Specialist — 12-Month Contract” — …invent conversion guarantee. CTA: Apply with one portfolio link…
- **"〔"** — 16 hit(s) (引用記号自体（企画では出さない）)
  - `about` / “The Basics 募集の基本” — …ply with one portfolio link. 〔company,role,location,employme…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ply with one portfolio link. 〔company,role,location,employme…
- **"〕"** — 16 hit(s) ()
  - `about` / “The Basics 募集の基本” — …ploymentType / L01,L02,L03,L04〕 role Everfield & Co. is hir…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ploymentType / L01,L02,L03,L04〕 S2 The contract includes Re…
- **"L01"** — 6 hit(s) (sourceLineコード露出（本文中）)
  - `header` / “Brand Specialist — 12-Month Contract” — …ow are the only stated facts (L01–L02–L03–L04–L05–L06–L07–L08–L…
  - `about` / “The Basics 募集の基本” — …ole,location,employmentType / L01,L02,L03,L04〕 role Everfield…
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — …ole,location,employmentType / L01,L02,L03,L04〕 S2 The contrac…

## 4) 見出しと中身のずれ (heading vs factKeys)

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Brand Specialist — 12-Month Contract | (none) |
| `about` | The Basics 募集の基本 | company, role, location, employmentType, salary, benefits, workHours, commute, contractTerms, team |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | company, role, location, employmentType, contractTerms, workHours, commute, team, salary, benefits |
| `location` | Place &amp; Access 勤務地 | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

**Warnings (candidate rules):**

- `conditions` “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — allowed: salary, pay, workHours, employmentType, wage, annual, hourly — **unexpected: company, role, location, contractTerms, commute, team, benefits** — found: company, role, location, employmentType, contractTerms, workHours, commute, team, salary, benefits

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-C — expected label: **Contract 12 months**
- verdict: **PRESENT** ✅ — hero contains first-check item
- hero text excerpt (first 400 chars):

  > Contract 12 months · Tokyo, Shibuya Brand Specialist — 12-Month Contract For marketers who prefer a time-boxed contract with a renewal checkpoint. The 12-month term and renewal review come first — campaign ownership over perks. This is a fictional posting. All facts below are the only stated facts (L01–L02–L03–L04–L05–L06–L07–L08–L09–L10). Do not imply permanent employment Do not invent conversion

- checks:
  - pattern `/12 months/i` — FOUND ✅ — …Contract 12 months · Tokyo, Shibuya Brand Specialist — 12-M…
  - pattern `/Contract/i` — FOUND ✅ — …Contract 12 months · Tokyo, Shibuya Brand Speciali…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
