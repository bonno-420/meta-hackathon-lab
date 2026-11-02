# Judge (Layer 2 few-shot contrast) — C-F gen-004

- source: `previews/case-F-gen-004-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T11:00:38.786Z
- finished: 2026-11-02T11:01:11.342Z
- usage: prompt 4138 / completion 5219 / total 9357 (reasoning: 4759)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district on a Casual / seasonal basis."
コメント: 同一文がPay & Hours・Place & Access・Team & Supportの3箇所に逐語で反復し仕様書化している。

## P2
**判定: ある**
根拠: "All conditions above are from the 8 sentences of C-F gen-004. No new facts are added."
コメント: 生成文の来歴と加筆なしの保証という検証側の言明が読者向け本文に混入している。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-F/gen-004.json · model meta-models/muse-spark-open-1026 · prompt12527 / completion3747 / total16274"
コメント: 生成ファイルパスやモデル名やトークン数という内部記録物が読者に露出している。

## P4
**判定: ある**
根拠: "[H2] Pay & Hours — Exactly as Stated" / "Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district on a Casual / seasonal basis."
コメント: 見出しの許容範囲は給与・勤務時間だが本文に会社・職種・勤務地・雇用形態の文が含まれて範囲外である。

## P5
**判定: ある**
根拠: "Training consists of 1-day orientation + floor buddy week 1."
コメント: 全文が事実説明の羅列で当事者の声や場面接地がなく説明文化のみである。

## P6
**判定: ない**
根拠: "Seasonal Sales Associate (casual, storefront) 6 weeks: 2026-12-01 to 2027-01-11 Hourly 1,300 JPY"
コメント: ヒーローに時給制の第一確認項目である時給と季節雇用の期間がともに出ているため欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
