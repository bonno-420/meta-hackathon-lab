# Judge (Layer 2 few-shot contrast) — C-E gen-002

- source: `previews/case-E-gen-002-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:19:32.081Z
- finished: 2026-11-02T07:19:48.164Z
- usage: prompt 4476 / completion 2836 / total 7312 (reasoning: 2443)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Morningside Coffee is hiring Cafe Crew (part-time, short hours) in Setagaya, Futako-Tamagawa."
コメント: 同一文がThe Basicsのcompany/role/locationで3回反復しS1でも再掲され仕様書化している。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 検証側の定型メタ文が読者向け本文に混入している。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Parents and students seeking short fixed shifts near station."
コメント: 企画ラベルとPersonaやInsights appliedや〔company,role,location / L01,L02,L03〕等の記録物が露出している。

## P4
**判定: ある**
根拠: "[H2] Pay & Hours — Exactly as Stated"に対して本文が "You will join a 6-person cafe team with shared shift board."
コメント: 見出しの許容範囲はpay/workHours/commuteなのにteam/training/benefits/company文が含まれ不一致である。

## P5
**判定: ある**
根拠: "You will earn Hourly 1,250 JPY."
コメント: 全体が事実列挙の説明文のみで当事者の体験談や生活場面の声が存在しない。

## P6
**判定: ある**
根拠: "[H1] Cafe Crew — Short Hours For parents and students who need short fixed shifts near the station."
コメント: ヒーローに役名のみで第一確認項目の具体的な時間帯08:00-11:00等の数値が出ていない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
