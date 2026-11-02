# Persona review: C-F gen-004

- case: C-F (Casual Retail Seasonal Sales Associate (fictitious, EN-only))
- LP: previews/case-F-gen-004-complete.html
- persona: Haru, 21, university student on break. Wants 6-8 week term with clear end date. Checks term and pay first.
- date: 2026-11-02
- model: muse-spark-1.3-contributor (Meta枠, Baseten枠に含めない)
- usage: prompt 755 / completion 3943 / total 4698
- keySource: env:MODEL_API_KEY (値は記録しない)

## Unclear
- Quote: "You can work 3-5 days/week, 4-7 hours/day; weekends preferred, which indicates weekend availability is preferred rather than required." — Hard to understand for Haru because the second clause just repeats the first in meta-language; he can't tell if weekends are actually required to get shifts during his break.
- Quote: "Training consists of 1-day orientation + floor buddy week 1." — Hard to understand because "floor buddy week 1" is unexplained jargon; as a student with no storefront experience, Haru doesn't know what he will do or who supports him.

## Drop-off
- Quote: "Pay for the role is Hourly 1,300 JPY." — Haru checks pay first, but this gives only the hourly rate while hours are variable as "3-5 days/week, 4-7 hours/day", so he cannot estimate total pay for the 6 weeks: 2026-12-01 to 2027-01-11 and would hesitate to apply.

## Applicant questions
- With "3-5 days/week, 4-7 hours/day", how many days and hours per week will I actually be scheduled during the 2026-12-01 to 2027-01-11 term?
- Does "weekends preferred" mean I must be available weekends to be hired for this Seasonal Sales Associate role?
- Will my actual commute to Nagoya, Sakae district be fully covered by "Commuter pass up to 8,000 JPY/month"?
- What do I actually do in "1-day orientation + floor buddy week 1" — do I need prior experience?

## AI-ness
- Sentence: "You can work 3-5 days/week, 4-7 hours/day; weekends preferred, which indicates weekend availability is preferred rather than required." — Evidence phrase: "which indicates weekend availability is preferred rather than required" — sounds AI-generated because it is self-explaining dictionary-style commentary no human job ad would add after "weekends preferred."


---

## 原文の扱い

- 上記4観点はモデルの原文のまま記録（要約しない）。run-record.md のペルソナレビュー表へ要旨リンクする
- 画像の文字・数字・ロゴ混入の目視は別途ファイル確認で行い、本レビューは文章中心
