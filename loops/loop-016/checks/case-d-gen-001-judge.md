# Judge (Layer 2 few-shot contrast) — C-D gen-001

- source: `previews/case-D-gen-001-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T01:22:20.281Z
- finished: 2026-11-02T01:22:39.944Z
- usage: prompt 4262 / completion 3104 / total 7366 (reasoning: 2750)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- note: Verbatim output below — not summarized. Candidate catalog P1-P5.

---

## P1
**判定: ある**
根拠: "This position is Warehouse Associate (picking and packing) and the employer is Apex Work Partners (dispatching agency)."
コメント: 同一文がemployer欄・role欄・S1に3回逐語反復し、他文もFacts表とS2-S9で二重掲載されているため仕様書化に該当する。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 検証側の読み方指示と数値厳密性の自己言及が読者向け本文に混入しているため該当する。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Workers comfortable with agency employment valuing predictable shifts and coordinator support."
コメント: 企画ラベルやPersona・Insights・〔〕引用とL番号が読者面に露出しているため該当する。

## P4
**判定: ある**
根拠: "You will work in a 10-person team with buddy pairing week 1."
コメント: 見出しPay & Hours — Exactly as Statedはpay・workHoursのみが範囲だが本文にrole・worksite・team・support等が混入しているためずれている。

## P5
**判定: ある**
根拠: "Pay is Hourly 1,400 JPY."
コメント: 全文が事実列挙の説明文のみで当事者の体験談や生活場面の声が存在しないため該当する。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
