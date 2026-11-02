# Judge (Layer 2 few-shot contrast) — C-F gen-001

- source: `previews/case-F-gen-001-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T01:21:36.698Z
- finished: 2026-11-02T01:22:00.606Z
- usage: prompt 4232 / completion 3798 / total 8030 (reasoning: 3449)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- note: Verbatim output below — not summarized. Candidate catalog P1-P5.

---

## P1
**判定: ある**
根拠: "Crestline Outdoor is hiring for this position. 〔company / L01〕"
コメント: 基本表の10文がPay & Hours欄のS1〜S10として逐語で二重掲載されているため仕様書化に該当する。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 検証側の読み方指示と数値厳密性の言い回しが読者向け本文に混入している。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Students and gap workers seeking short high-energy seasonal stint."
コメント: 企画メモのラベルと引用記号〔company / L01〕やInsights applied等がそのまま読者に露出している。

## P4
**判定: ある**
根拠: "Training includes 1-day orientation + floor buddy week 1. 〔training / L09〕"
コメント: 見出しPay & Hours — Exactly as Statedはpay・workHours想定だが本文にcompany・role・location・training・perksが混入し範囲がずれている。

## P5
**判定: ある**
根拠: "You will earn Hourly 1,300 JPY in this role. 〔pay / L05〕"
コメント: 全体が事実列挙の説明文のみで当事者の体験談や場面描写による生活文脈が存在しない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
