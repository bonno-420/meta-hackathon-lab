# Pair 03 — C-A current LP vs folded version (EN, ペア作成用ライン作成・製品ではない)

- source: loops/loop-016/previews/case-A-gen-001-complete.html (C-A gen-001, 5 sentences, loop-016) とそれを畳んだ版（本ペアのためにラインが作る仮置き。製品ではない）
- purpose: P1 二重掲載 + P3 記録物露出 + P4 見出しと中身のずれ の対比。二重掲載は生成文だけを見ても分からない
- status: candidate, not a product

## Bad (current C-A complete LP) — page excerpts verbatim

**[Section: The Basics — hero of duplication]**

> All sentences below are from generation C-A gen-001 (5 sentences). Each cites its fact keys and source lines verbatim.

| fact key | visible text |
|---|---|
| company | Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district. 〔company,role,location / L01,L02,L03〕 |
| role | Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district. 〔company,role,location / L01,L02,L03〕 |
| location | Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district. 〔company,role,location / L01,L02,L03〕 |

*Observation:* Same combined sentence appears 3 times in the facts table (company/role/location share one sentence — intra-facts repetition).

**[Section: Pay & Hours — Exactly as Stated]**

> S1 Northbridge Labs is hiring a Software Engineer ... 〔company,role,location / L01,L02,L03〕
> S2 This is a Full-time (permanent) position offering Annual 4,800,000 JPY. 〔employmentType,salary / L04,L05〕
> S3 Working hours are Mon-Fri, 10:00-18:30 (flex core 11:00-16:00), and the office is 5-min walk from Umeda Station; commuter pass reimbursed in full. 〔workHours,commute / L06,L07〕
> S4 You will join a 8-person product team (4 engineers, 2 designers, 2 PMs) and receive 3-month onboarding with dedicated mentor and weekly code review. 〔team,training / L09,L08〕
> S5 Benefits include Health insurance, 10 paid days from month 7, laptop provided. 〔benefits / L10〕
>
> What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs.

*Observation:* Facts table + body list duplicate the same 5 sentences (double-posting). Pay & Hours heading but body contains team/training/benefits/company — heading mismatch (P4). Highlight block is verification meta-text (P2). Bottom note shows "Target audience ... Persona: Alex ... Insights applied: なし." — plan exposure (P3).

## Good (folded version — hypothetical, for contrast only)

**[Section: The Basics — folded]**

> Northbridge Labs — Software Engineer, SaaS product team, Osaka Umeda

*Observation:* Facts table shows keys and values only (no sentence duplication). One sentence per fact, not one fact per combined sentence.

**[Section: Pay & Hours — folded]**

> Annual 4,800,000 JPY — Full-time (permanent)
> Hours: Mon-Fri 10:00-18:30 (core 11:00-16:00)

*Observation:* Only pay-related facts. Team/benefits moved to separate "Team & Support" section — heading matches content. No highlight verification box. No Target audience/Persona note. No citations with sourceLines.

---

## Judge cue

- Bad has: P1=ある (intra-facts 3x + double-posting), P2=ある (What this means...), P3=ある (Target audience/Persona/Insights), P4=ある (Pay & Hours heading includes team+benefits), P5=未判定 (当事者の声は別途)
- Good has: P1=ない, P2=ない, P3=ない, P4=ない
- This pair isolates assembly-level defects: generation sentences were natural and fact-accurate, but the assembled page spec-ifies them.
