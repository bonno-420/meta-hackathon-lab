# Judge (Layer 2 few-shot contrast) — C-C gen-004

- source: `previews/case-C-gen-004-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T10:58:56.066Z
- finished: 2026-11-02T10:59:29.043Z
- usage: prompt 4062 / completion 5195 / total 9257 (reasoning: 4789)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Everfield & Co. is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya."
コメント: 同一文がPlace & AccessとTeam & Supportに逐語で二重掲載され仕様書化している。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-C gen-004. No new facts are added."
コメント: 読者向け条件ではなく検証側の来歴保証の定型文が混入している。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-C/gen-004.json · model meta-models/muse-spark-open-1026 · prompt12425 / completion6428 / total18853"
コメント: 生成ファイルパスやモデル名・トークン数という内部記録物が読者面に露出している。

## P4
**判定: ある**
根拠: "Pay & Hours — Exactly as Stated" / "Employment is offered as Contract, 12 months."
コメント: 見出しの許容範囲は給与・勤務時間だが本文に雇用形態・契約条件が混入し範囲外である。

## P5
**判定: ある**
根拠: "Employment is offered as Contract, 12 months." / "Monthly pay for the term is Monthly 380,000 JPY."
コメント: 全文が説明・列挙調で当事者の声や生活場面の接地がなく欠落している。

## P6
**判定: ない**
根拠: "[H1] Brand Specialist (12-month fixed-term contract) Contract, 12 months Renewal review at month 11; no automatic conversion"
コメント: 契約職の第一確認項目である契約期間がヒーローに明示されているため欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
