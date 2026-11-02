# Persona review: C-D gen-005

- case: C-D (Dispatched Warehouse Associate via agency (fictitious, EN-only))
- LP: previews/case-D-gen-005-complete.html
- persona: Riku, 24, 1 year retail stockroom. Prefers dispatch for steady hours and coordinator contact. Checks employer vs worksite.
- date: 2026-11-02
- model: muse-spark-1.3-contributor (Meta枠, Baseten枠に含めない)
- usage: prompt 804 / completion 2730 / total 3534
- keySource: env:MODEL_API_KEY (値は記録しない)

## Unclear
- "Shifts are Mon-Fri, 09:00-17:30, 3-5 days/week selectable, with the specific days coordinated through the agency each week." — As Riku I want steady hours, but I can't tell if I can lock the same 3-5 days or if "coordinated through the agency each week" means my days change every week.
- "Access is by Shuttle from Kawaguchi Station; pass up to 10,000 JPY/month is available within the stated cap." — I can't tell if the shuttle is separate from the pass, and what "up to 10,000 JPY/month is available within the stated cap" actually covers.

## Drop-off
- "Shifts are Mon-Fri, 09:00-17:30, 3-5 days/week selectable, with the specific days coordinated through the agency each week." — I would hesitate here because weekly coordination sounds unpredictable, not steady hours.
- "Support is provided by an Agency coordinator on site twice/week + phone support on shift days." — I value coordinator contact, so twice/week on site makes me pause about who helps me on the other shift days.

## Applicant questions
- Grounded in "Shifts are Mon-Fri, 09:00-17:30, 3-5 days/week selectable, with the specific days coordinated through the agency each week." — Can I fix the same days every week, or do I have to re-coordinate days with the agency each week?
- Grounded in "Support is provided by an Agency coordinator on site twice/week + phone support on shift days." — On days the coordinator is not on site, how do I reach phone support during my 09:00-17:30 shift?
- Grounded in "Access is by Shuttle from Kawaguchi Station; pass up to 10,000 JPY/month is available within the stated cap." — Do I use the shuttle, my own pass up to 10,000 JPY/month, or both to get to the Client distribution center in Saitama, Kawaguchi?
- Grounded in "You will be employed by Apex Work Partners (dispatching agency) on a Dispatched (agency employed, client site) basis." — Since Apex Work Partners employs me, do I report hours and troubles to Apex, not the client site?

## AI-ness
- "No forklift license; able to stand/lift up to 15 kg is the requirement for this picking and packing work, which involves standing and lifting." — Evidence phrase "which involves standing and lifting" sounds AI-generated because it redundantly repeats standing/lifting already stated in the same sentence.


---

## 原文の扱い

- 上記4観点はモデルの原文のまま記録（要約しない）。run-record.md のペルソナレビュー表へ要旨リンクする
- 画像の文字・数字・ロゴ混入の目視は別途ファイル確認で行い、本レビューは文章中心
