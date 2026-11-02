# Persona review: C-F gen-005

- case: C-F (Casual Retail Seasonal Sales Associate (fictitious, EN-only))
- LP: previews/case-F-gen-005-complete.html
- persona: Haru, 21, university student on break. Wants 6-8 week term with clear end date. Checks term and pay first.
- date: 2026-11-02
- model: muse-spark-1.3-contributor (Meta枠, Baseten枠に含めない)
- usage: prompt 755 / completion 3209 / total 3964
- keySource: env:MODEL_API_KEY (値は記録しない)

## Unclear
- Quote: "You can work 3-5 days/week, 4-7 hours/day; weekends preferred, which indicates weekend availability is preferred rather than required."
- Why hard for Haru: I check hours right after term/pay, and I can't tell if weekday-only is allowed for the 3-5 days, because "preferred" is explained by just repeating "preferred rather than required" without saying how shifts are assigned.

## Drop-off
- Quote: "Pay for the role is Hourly 1,300 JPY."
- Why I would hesitate/stop: I check pay first, and this line gives only the hourly figure with no guaranteed days/hours, so with "3-5 days/week, 4-7 hours/day" I cannot estimate what 6 weeks will actually pay and I hesitate to apply.

## Applicant questions
1. For "3-5 days/week, 4-7 hours/day; weekends preferred" — can I get 3-5 days with weekdays only, or do I need weekend availability to be scheduled?
2. For "Hourly 1,300 JPY" with "3-5 days/week, 4-7 hours/day" — is there a minimum guaranteed days/hours per week for the 6 weeks: 2026-12-01 to 2027-01-11?
3. For "Commuter pass up to 8,000 JPY/month" to Nagoya, Sakae district — what if my commute costs more than 8,000 JPY/month?
4. For "1-day orientation + floor buddy week 1" — is that paid at Hourly 1,300 JPY and part of the 6 weeks: 2026-12-01 to 2027-01-11?

## AI-ness
- Quote: "You can work 3-5 days/week, 4-7 hours/day; weekends preferred, which indicates weekend availability is preferred rather than required."
- Evidence phrase: "which indicates weekend availability is preferred rather than required"
- Why: No human ad explains its own wording like that; it reads like a model adding a meta-clarification of "preferred."


---

## 原文の扱い

- 上記4観点はモデルの原文のまま記録（要約しない）。run-record.md のペルソナレビュー表へ要旨リンクする
- 画像の文字・数字・ロゴ混入の目視は別途ファイル確認で行い、本レビューは文章中心
