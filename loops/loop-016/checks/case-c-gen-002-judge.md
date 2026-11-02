# Judge (Layer 2 few-shot contrast) — C-C gen-002

- source: `previews/case-C-gen-002-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:18:42.625Z
- finished: 2026-11-02T07:19:10.452Z
- usage: prompt 4430 / completion 5016 / total 9446 (reasoning: 4575)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Everfield & Co. is hiring for this position. 〔company / L01〕"
コメント: 同一文がThe Basicsのfacts表とPay & HoursのS1-S10に二重掲載され仕様書化しているためP1に該当する。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 検証側のメタ言い回しが読者向け本文に混入しているためP2に該当する。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Mid-career marketers preferring time-boxed contract with renewal checkpoint."
コメント: 企画ラベルとPersonaやInsights appliedや〔〕引用が読者に露出しているためP3に該当する。

## P4
**判定: ある**
根拠: "You will work with a 6-person brand team, reports to Brand Lead. 〔team / L09〕"
コメント: 見出しPay & Hours — Exactly as Statedは給与・時間想定だが本文にcompany/role/location/contractTerms/team/benefitsが混入し範囲不一致のためP4に該当する。

## P5
**判定: ない**
根拠: ない – 全体は説明的だがヒーローにシナリオ接地があるため完全な説明文化のみとは言えない。
コメント: "For marketers who prefer a time-boxed contract with a renewal checkpoint."という読み手の状況付けがあるため当事者の声の欠落とは判定しない。

## P6
**判定: ない**
根拠: ない – ヒーローは契約期間を第一確認項目として明示している。
コメント: ヒーロー"[H1] Brand Specialist — 12-Month Contract"と"Contract 12 months · Tokyo, Shibuya"にtermが含まれ欠落はない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
