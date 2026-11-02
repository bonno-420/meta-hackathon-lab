# Judge (Layer 2 few-shot contrast) — C-F gen-005

- source: `previews/case-F-gen-005-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T11:39:33.653Z
- finished: 2026-11-02T11:40:09.090Z
- usage: prompt 4074 / completion 5141 / total 9215 (reasoning: 4745)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、類似の数値・条件は語形や付加説明が異なる別文である。
コメント: Basics・本文・確認欄で同趣旨の言及はあるがP1定義の逐語2回出現には該当しない。

## P2
**判定: ある**
根拠: All sentences below are from generation C-F gen-005 (8 sentences).
コメント: 生成文への自己言及であり読者向け条件説明ではなく検証側メタ文が混入している。

## P3
**判定: ある**
根拠: Generation: loops/loop-016/generations/case-F/gen-005.json · model meta-models/muse-spark-open-1026
コメント: 生成ファイルパス・モデル名・トークン数等の内部記録物が読者面に露出している。

## P4
**判定: ある**
根拠: Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district on a Casual / seasonal basis.
コメント: 見出しPay & Hoursは給与・時間想定だが本文にcompany/role/location/employmentTypeが混入し範囲不一致である。

## P5
**判定: ある**
根拠: Training consists of 1-day orientation + floor buddy week 1.
コメント: 全体が事実列挙・説明文のみで当事者の声や場面接地がなく説明文化に留まっている。

## P6
**判定: ない**
根拠: Seasonal Sales Associate (casual, storefront) Term 6 weeks: Dec 1 – Jan 11 Pay Hourly pay
コメント: ヒーローにTermとPayの第一確認項目が含まれており欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
