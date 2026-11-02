# Judge (Layer 2 few-shot contrast) — C-C gen-005

- source: `previews/case-C-gen-005-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T11:40:41.972Z
- finished: 2026-11-02T11:41:28.697Z
- usage: prompt 4045 / completion 6267 / total 10312 (reasoning: 5869)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Renewal review at month 11; no automatic conversion"
コメント: 同一文言がヒーロー・The Basics・Pay & Hours・Check Before You Applyに逐語で反復され仕様書化している。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-C gen-005. No new facts are added."
コメント: 読者向け条件ではなく生成文の検証側の来歴保証を語るメタ文が混入している。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-C/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12425 / completion6428 / total18853"
コメント: 読者に不要な生成パス・モデル名・トークン数という内部記録物が露出している。

## P4
**判定: ある**
根拠: "[H2] Pay & Hours — Exactly as Stated"内の "- Renewal review at month 11; no automatic conversion."
コメント: 見出しの許容範囲は給与・勤務時間だが契約条件が混入し範囲外である。

## P5
**判定: ある**
根拠: "Employment is offered as Contract, 12 months."
コメント: 全文が事実説明の羅列で当事者の声や生活場面の接地がなく説明文化に留まる。

## P6
**判定: ない**
根拠: ない — ヒーローに "[H1] Brand Specialist (12-month fixed-term contract)"と"Contract, 12 months"があり契約期間の第一確認項目が出ている。
コメント: 契約職の第一確認項目である期間表示がヒーローに含まれ欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
