# Persona review: C-B gen-003

- case: C-B (Full-time Healthcare Registered Nurse (fictitious, EN-only))
- LP: previews/case-B-gen-003-complete.html
- persona: Maya, 31, RN 4 years suburban clinic. Wants larger team, clear handover, paid training. Checks commute/shifts first.
- date: 2026-11-02
- model: muse-spark-1.3-contributor (Meta枠, Baseten枠に含めない)
- usage: prompt 786 / completion 3103 / total 3889
- keySource: env:MODEL_API_KEY (値は記録しない)

## Unclear
- Quote: "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site."
- Why it is hard for Maya: "12 paid days from month 7" does not explain if she has zero paid leave in months 1-6, which matters when she is changing from a stable clinic job. "childcare support desk on site" is also unclear — it sounds like a desk, not actual childcare, so she cannot tell what support she would get.

## Drop-off
- Quote: "The position includes Two paid training days per year + quarterly skills workshop."
- Why she would stop/hesitate: Maya wants paid training to step up from a suburban clinic to a larger team, and "Two paid training days per year" sounds minimal for that move. It also does not say if the "quarterly skills workshop" is paid or inside day-shift hours, so she would hesitate to apply despite the good commute and day-shift fit.

## Applicant questions
1. Are the "quarterly skills workshop" sessions held within "Day shift 08:30-17:00, 5 days/week" and paid like the "Two paid training days per year"?
2. How does the "dedicated handover lead" work in the "12-nurse ward" — is it one fixed person and will they cover my handover on every shift?
3. Does "12 paid days from month 7" mean I get no paid days during months 1-6?
4. Is the "5 days/week; no scheduled night duty" schedule fixed weekdays, and what does "no scheduled night duty" mean if cover is needed?

## AI-ness
- Quote: "You will work on a Full-time (permanent) basis."
- Evidence phrase: "on a Full-time (permanent) basis" — capital "Full-time" mid-sentence plus stilted template phrasing sounds like a database field pasted into a sentence, not how a hospital would write to nurses.


---

## 原文の扱い

- 上記4観点はモデルの原文のまま記録（要約しない）。run-record.md のペルソナレビュー表へ要旨リンクする
- 画像の文字・数字・ロゴ混入の目視は別途ファイル確認で行い、本レビューは文章中心
