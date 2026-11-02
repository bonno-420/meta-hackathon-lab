# Research — Common patterns across English job postings

- **version**: v1.0 (2026-11-02)
- **scope**: English-language postings on major open boards (Indeed, LinkedIn)
- **viewed**: 2026-11-02
- **method**: Read 3-5 open postings per employment type (full-time / contract / dispatched / part-time / casual) on Indeed US/UK and LinkedIn; abstract to pattern skeletons. Per-case sources listed in research/case-*.md.
- **constraint**: Facts in loop-016 are the sole source of truth. This file records expression types only — reusable grammatical and presentational frames. No body text is copied.
- **status**: candidate — permanence requires owner approval

## 1. Grammar and register

### 1.1 Person / voice

- Default subject is **you** (second person) for benefits and day-to-day; **we** for team/culture. Third-person company name appears once in hero, then switches to we.
- Imperative without subject for responsibilities: `Design and maintain ...`, `Pick and pack orders ...`
- Avoid first-person plural possessive stacking (`our our`). One `our` per block max.
- Pronoun type A: **you will** + verb (directive, short-shift/part-time friendly): "You will work 3-hour morning blocks."
- Pronoun type B: **we offer / we provide** (full-time annual packages): "We offer funded training and a fixed shift pattern."
- Never mix A and B in the same sentence.

### 1.2 Sentence length and heading

- Body sentences: 12-22 words. Hero tagline: 6-12 words.
- Headings are noun phrases, not sentences: `Pay and schedule`, `Who you will work with`, `How to apply`. No trailing period.
- Heading skeleton: `[Scope] — [Exactness cue]` e.g. `Pay — Exactly as listed`. The cue signals that numbers are not estimates.
- Section count: 3-5 sections. Typical order: **Role snapshot → Pay & hours → Team/training → Location/access → How to apply**. Do not interleave access inside pay.

### 1.3 List vs prose

- Conditions use **bullets**, not inline commas. One fact per bullet. Bullets start with the fact noun: `Pay: ...` `Hours: ...` `Location: ...`
- Prose paragraphs are for "a day in this role" (1 paragraph, 2-3 sentences, no numbers). Numbers live in the bullets/hero only.

## 2. Pay presentation

### 2.1 Where it appears

- Pay is in the **hero** (title row) and again in the **conditions block**. Not buried in paragraph 3.
- Hero skeleton (pattern only — fill with fixed facts):
  - Annual full-time: `Annual [amount] — [employmentType] — [location]`
  - Hourly any type: `[Hourly amount] / hour — [days pattern] — [location]`
  - Contract fixed term: `[period] contract — [pay] — [location]` (term comes first for contract readers)
- Rule: the hero must contain the reader's **first-check item** (see per-case files). If the persona checks pay first, pay is in the hero line.

### 2.2 Range vs fixed, hourly vs annual

- When the posting states a single figure, present it as a single figure. Do not invent a range.
- Hourly pattern: `Hourly [amount] JPY` or `[amount]/hour`. Never `per hour` and `/hour` in the same page.
- Annual pattern: `Annual [amount] JPY` — keep the comma grouping verbatim.
- Caps (e.g. commuter pass up to [cap]): write `pass up to [cap]/month`, not `free`/`unlimited`.
- Overtime/allotment language is absent unless the fixed facts include it. Do not add `plus overtime`.

### 2.3 Missing fields

- If a field is not in the fixed facts, **do not mention it**. No `not stated` placeholder in reader copy.
- Do not add benefits, remote, bonus, or conversion language beyond the fixed facts.

## 3. Condition ordering

### 3.1 Default stack (most-tested on Indeed/LinkedIn)

1. Role + employment type (1 line)
2. Pay (1 bullet)
3. Hours / days pattern (1 bullet)
4. Location + access (1 bullet, station + walk/shuttle + cap)
5. Team / training / perks (1 bullet or short paragraph, no numbers)
6. Employer vs worksite when dispatched (2 bullets, employer first)

### 3.2 Employment-type variants

- **Full-time**: Pay → Hours → Location → Team/training → Benefits. Annual amount anchors the top.
- **Contract (fixed term)**: Term badge first → Pay → Hours → Scope/ownership → Location. Term is not footnoted.
- **Dispatched**: Employer (agency) → Worksite (client) in two labeled lines — never merged.
- **Part-time / Casual**: Hours + days pattern **before** pay. Short-shift readers decide on fit before rate.

### 3.3 Truncation-safe rule

- First 2 bullets carry the decision. Mobile preview cuts after ~2 lines; put pay+hours there for hourly roles.

## 4. Undisclosed / absent items

- Omit entirely from reader copy. Do not write `No remote work` unless the fixed facts explicitly forbid it.
- Do not add `TBD`, `negotiable`, `competitive` as filler. If pay is disclosed, show it; if not, leave the bullet out.

## 5. CTA

### 5.1 CTA types found

- **Low-friction**: `Quick apply — no resume, casual chat first` (part-time, hospitality)
- **Standard**: `Apply with resume — reply within [N] business days` (full-time)
- **Agency-mediated**: `Register with [agency] — site tour before assignment` (dispatched)
- **Time-boxed**: `Apply this week — start [date]` (seasonal/casual)
- Contract: CTA includes term reminder: `Apply with portfolio — 12-month contract, renewal review explained inside`

### 5.2 CTA placement and wording

- CTA appears once at the bottom as a button + one-line reassurance underneath (response time or next step). Not repeated in every section.
- Verb is **Apply** or **Register** (for dispatched). Not `Join us` / `Be part of...` as CTA verb.
- Reassurance skeleton: `[Next step] within [timeframe]` or `[No resume] — [casual first step]`.

## 6. Expressions to avoid

- Hype: `amazing opportunity`, `dream job`, `perfect for you`, `don't miss`, `fantastic/incredible` — absent in top-ranked postings.
- Unbounded promise: `guaranteed`, `unlimited`, `free transport` when a cap exists.
- External comparison: `better than`, `top-rated`, `industry-leading` — not used in conditions.
- Hedging: `maybe`, `possibly`, `we might` — never.
- Meta/verification phrases (internal QA leaking into reader copy): `What this means`, `numbers stay exactly as stated`, `as stated in the FACT`, `Do not invent` — must not appear.
- Internal labels: `factKeys`, `sourceLines`, `Target audience`, `Persona:`, `Insights applied`, `L01`, `〔〕` citations, `mustNot` — never visible.
- CTA hype: `Join our family` as CTA — not used.

## Sources (common)

| medium | query | viewed |
|---|---|---|
| Indeed US — Software Engineer search + 6 detail pages (Pittsburgh Pirates / Turbo.net / Visa / D. E. Shaw / Valve / NYC listings) | software engineer full-time | 2026-11-02 |
| Indeed Help — How to write a job description (employer guide) | employer guide | 2026-11-02 |
| LinkedIn Talent Solutions — Registered Nurse / Warehouse / Retail posting guides & templates | registered nurse job description template; warehouse associate posting guide | 2026-11-02 |

> Per-case postings are listed in research/case-*.md.

## Wiring note

- Pay/term/hours placement in hero is auditable (P6). Common patterns above + per-case first-check item together define the check.
- This file is candidate; permanence requires owner approval. Do not treat as stable until approved.
