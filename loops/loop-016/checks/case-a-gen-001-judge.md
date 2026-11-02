# Judge (Layer 2 few-shot contrast) — C-A gen-001

- source: `previews/case-A-gen-001-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T01:17:58.137Z
- finished: 2026-11-02T01:18:17.329Z
- usage: prompt 4377 / completion 3238 / total 7615 (reasoning: 2812)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- note: Verbatim output below — not summarized. Candidate catalog P1-P5.

---

## P1
**判定: ある**
根拠: "Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district. 〔company,role,location / L01,L02,L03〕"
コメント: 同一文がcompany・role・locationの3行で逐語反復されさらにS1として二重掲載されているため仕様書化に該当する。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 読者向け本文に検証側のメタ言明が混入しているためP2に該当する。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Early-career engineers (1-3 years) seeking stable on-site work in an urban tech office."
コメント: 企画・根拠ラベルと〔〕引用・L番号が読者向け本文に露出しているためP3に該当する。

## P4
**判定: ある**
根拠: "- S4 You will join a 8-person product team (4 engineers, 2 designers, 2 PMs) and receive 3-month onboarding with dedicated mentor and weekly code review. 〔team,training / L09,L08〕"
コメント: 見出しPay & Hours — Exactly as Statedは給与・勤務時間が範囲のはずなのに本文にcompany・team・training・benefitsが含まれて範囲外であるためP4に該当する。

## P5
**判定: ある**
根拠: "All conditions above are from the 5 sentences of C-A gen-001. No new facts are added."
コメント: ページ全体が事実列挙・説明文のみで当事者の一人称の声や生活場面の描写が見当たらないためP5に該当する。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
