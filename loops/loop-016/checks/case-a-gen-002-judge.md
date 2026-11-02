# Judge (Layer 2 few-shot contrast) — C-A gen-002

- source: `previews/case-A-gen-002-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:17:52.860Z
- finished: 2026-11-02T07:18:17.457Z
- usage: prompt 4507 / completion 4875 / total 9382 (reasoning: 4450)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: 「We offer an annual salary of 4,800,000 JPY.」
コメント: 同一文がThe Basicsのsalary行とPay & HoursのS4に逐語で二重掲載され仕様書化している。
## P2
**判定: ある**
根拠: 「What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs.」
コメント: 検証側の読み方指示と数値不変の宣言が読者向け本文に混入している。
## P3
**判定: ある**
根拠: 「Target audience (fixed before generation): Early-career engineers (1-3 years) seeking stable on-site work in an urban tech office.」
コメント: 企画ラベルとPersonaやInsights appliedや〔company / L01〕等の記録物がそのまま露出している。
## P4
**判定: ある**
根拠: 見出し「Pay & Hours — Exactly as Stated」に対し本文「You will join an 8-person product team (4 engineers, 2 designers, 2 PMs).」
コメント: 見出しの許容範囲は給与・時間系なのにteam/training/benefits/company等が混入し範囲不一致である。
## P5
**判定: ある**
根拠: 「You will work Mon-Fri, 10:00-18:30 (flex core 11:00-16:00).」
コメント: 全体が事実文の列挙で構成され当事者の体験談や生活場面の声がなく説明仕様書的である。
## P6
**判定: ない**
根拠: 「Full-time · Osaka, Umeda [H1] Software Engineer — SaaS Product Team」
コメント: ヒーローに雇用形態と勤務地・職種が含まれ第一確認項目の欠落は認められない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
