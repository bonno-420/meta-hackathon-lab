# Persona review: C-B gen-004

- case: C-B (Full-time Healthcare Registered Nurse (fictitious, EN-only))
- LP: previews/case-B-gen-004-complete.html
- persona: Maya, 31, RN 4 years suburban clinic. Wants larger team, clear handover, paid training. Checks commute/shifts first.
- date: 2026-11-02
- model: muse-spark-1.3-contributor (Meta枠, Baseten枠に含めない)
- usage: prompt 769 / completion 3465 / total 4234
- keySource: env:MODEL_API_KEY (値は記録しない)

## Unclear
- "You will join a 12-nurse ward with dedicated handover lead." — As Maya who wants clear handover, it is hard to understand what "dedicated handover lead" actually means in practice, because the sentence does not say what the lead does, whether the lead is present on every day shift, or how handover is run.
- "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site." — It is hard to understand when and how leave can be used, because "12 paid days from month 7" does not explain if this means zero paid days before month 7 or how days accrue after that.

## Drop-off
- "Apply for the Registered Nurse (full-time, general ward) role with a copy of your license and you will receive a reply within 3 business days." — Maya checks commute/shifts first and still has open shift and training details, so being asked upfront for "a copy of your license" before any conversation would make her hesitate to apply and pause at the CTA.

## Applicant questions
- About "Your schedule is Day shift 08:30-17:00, 5 days/week; no scheduled night duty." — Which 5 days per week is this, and does it include weekends or holidays?
- About "You will join a 12-nurse ward with dedicated handover lead." — How does the "dedicated handover lead" handle handover on the day shift?
- About "Training includes Two paid training days per year + quarterly skills workshop." — Is the "quarterly skills workshop" also paid, and is it held inside the 08:30-17:00 hours?
- About "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site." — What does "12 paid days from month 7" mean for when I can first take paid days?

## AI-ness
- Sentence: "This is a Full-time (permanent) position." — Evidence phrase: "This is a" sounds AI-generated because it is generic filler that repeats the prior sentence "Harborview General Hospital is hiring a Registered Nurse (full-time, general ward)." with odd capitalization of "Full-time".


---

## 原文の扱い

- 上記4観点はモデルの原文のまま記録（要約しない）。run-record.md のペルソナレビュー表へ要旨リンクする
- 画像の文字・数字・ロゴ混入の目視は別途ファイル確認で行い、本レビューは文章中心
