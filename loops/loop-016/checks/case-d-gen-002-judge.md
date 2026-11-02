# Judge (Layer 2 few-shot contrast) — C-D gen-002

- source: `previews/case-D-gen-002-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:19:11.701Z
- finished: 2026-11-02T07:19:30.847Z
- usage: prompt 4466 / completion 3681 / total 8147 (reasoning: 3274)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "You will be employed by Apex Work Partners (dispatching agency)."
コメント: 同一文がThe BasicsとPay & HoursのS2に逐語で二重掲載され仕様書化しているためP1に該当する。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 検証側の自己言及が読者向け本文に混入しているためP2に該当する。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Workers comfortable with agency employment valuing predictable shifts and coordinator support."
コメント: 企画ラベルとPersonaやInsights appliedや〔employer / L01〕等の記録物が露出しているためP3に該当する。

## P4
**判定: ある**
根拠: "Pay & Hours — Exactly as Stated" / "You will join a 10-person team with buddy pairing week 1. 〔team / L09〕"
コメント: 見出しが給与・時間範囲を示すのにteamやroleやemployer等の範囲外事実を含むためP4に該当する。

## P5
**判定: ある**
根拠: "You will earn Hourly 1,400 JPY. 〔pay / L05〕"
コメント: 全文がYou will/can型の説明文の羅列で当事者の生の声や場面接地がなく説明文化のみのためP5に該当する。

## P6
**判定: ある**
根拠: "[H1] Warehouse Associate — Dispatched"
コメント: ヒーローに時給等の第一確認項目がなく役割名とDispatched表示のみのため候補P6に該当する。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
