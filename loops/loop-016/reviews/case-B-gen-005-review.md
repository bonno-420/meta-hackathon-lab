# Persona review: C-B gen-005

- case: C-B (Full-time Healthcare Registered Nurse (fictitious, EN-only))
- LP: previews/case-B-gen-005-complete.html
- persona: Maya, 31, RN 4 years suburban clinic. Wants larger team, clear handover, paid training. Checks commute/shifts first.
- date: 2026-11-02
- model: muse-spark-1.3-contributor (Meta枠, Baseten枠に含めない)
- usage: prompt 769 / completion 3185 / total 3954
- keySource: env:MODEL_API_KEY (値は記録しない)

## Unclear
- "You will join a 12-nurse ward with dedicated handover lead." — As Maya I want clear handover, but this does not explain what the handover lead actually does, when they are present on the "Day shift 08:30-17:00, 5 days/week", or how handover is run.
- "Training includes Two paid training days per year + quarterly skills workshop." — It is unclear if only the two days are paid and whether the quarterly workshop is separate, paid, or in work hours.

## Drop-off
- "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site." — I would hesitate here because waiting until month 7 for any paid days feels unstable for a permanent day-shift move, and "childcare support desk on site" does not say what help I actually get.
- "Apply for the Registered Nurse (full-time, general ward) role with a copy of your license and you will receive a reply within 3 business days." — I would pause before applying because sending a license copy upfront with no human contact feels like friction.

## Applicant questions
- About "Training includes Two paid training days per year + quarterly skills workshop." — Are the quarterly skills workshops also paid and held within the "Day shift 08:30-17:00, 5 days/week" time?
- About "You will join a 12-nurse ward with dedicated handover lead." — How does the dedicated handover lead handle handover on day shift?
- About "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site." — Is there any paid leave before month 7, and what does the childcare support desk on site do?
- About "The hospital is an 8-min walk from Sakuragicho Station; commuter pass reimbursed in full." — Is the full reimbursement from start for a Full-time (permanent) nurse commuting to "Yokohama, Minato Mirai area"?

## AI-ness
- "This is a Full-time (permanent) position." — evidence phrase: "This is a" — it reads as a template filler that repeats sentence 1, "Harborview General Hospital is hiring a Registered Nurse (full-time, general ward).", with unnatural mid-sentence capitalization of "Full-time".


---

## 原文の扱い

- 上記4観点はモデルの原文のまま記録（要約しない）。run-record.md のペルソナレビュー表へ要旨リンクする
- 画像の文字・数字・ロゴ混入の目視は別途ファイル確認で行い、本レビューは文章中心
