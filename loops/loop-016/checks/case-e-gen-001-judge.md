# Judge (Layer 2 few-shot contrast) — C-E gen-001

- source: `previews/case-E-gen-001-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T01:21:17.184Z
- finished: 2026-11-02T01:21:33.280Z
- usage: prompt 4313 / completion 2401 / total 6714 (reasoning: 2096)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- note: Verbatim output below — not summarized. Candidate catalog P1-P5.

---

## P1
**判定: ある**
根拠: Morningside Coffee is hiring for its neighborhood cafe.
コメント: 同一文がThe BasicsとPay & Hoursに二重掲載され仕様書化しているため。

## P2
**判定: ある**
根拠: What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs.
コメント: 検証側のメタ言明が読者向け本文に混入しているため。

## P3
**判定: ある**
根拠: Target audience (fixed before generation): Parents and students seeking short fixed shifts near station.
コメント: 企画ラベルとPersonaやInsights appliedや〔company / L01〕等の記録物が露出しているため。

## P4
**判定: ある**
根拠: [H2] Pay & Hours — Exactly as Stated / S9 You will join a 6-person cafe team with shared shift board that makes it easy to coordinate.
コメント: 見出しは給与・時間を示すが本文にcompany/role/location/team/training/benefitsが混入し範囲不一致のため。

## P5
**判定: ある**
根拠: You will earn Hourly 1,250 JPY while working with us.
コメント: 全体が事実列挙の説明型で当事者の生の声や生活場面の描写がないため。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
