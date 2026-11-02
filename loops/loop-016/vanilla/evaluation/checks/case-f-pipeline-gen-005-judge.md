# Judge (Layer 2 few-shot contrast) — C-F pipeline-gen-005

- source: `previews/case-F-gen-005-complete.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:10:30.282Z
- finished: 2026-11-02T12:11:18.241Z
- attempt: 1
- usage: prompt 4074 / completion 7712 / total 11786 (reasoning: 7295)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない（同一文の逐語2回出現は確認できない）
コメント: Basicsはキー・値の折り畳み表示で本文文との二重掲載がなくCTAの再掲は対象外のため該当しない。

## P2
**判定: ある**
根拠: All sentences below are from generation C-F gen-005 (8 sentences).
コメント: 読者向け条件ではなく生成・検証側の来歴説明でありメタ文の混入に該当する。

## P3
**判定: ある**
根拠: Generation: loops/loop-016/generations/case-F/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12527 / completion3747 / total16274
コメント: 生成ファイルパスやモデル名・トークン数などの内部記録物が読者面に露出している。

## P4
**判定: ある**
根拠: 見出し Pay & Hours — Exactly as Stated に対して本文 Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district on a Casual / seasonal basis.
コメント: 見出しの許容範囲はpay・workHoursだが本文にcompany・role・location・employmentTypeが混入し範囲外である。

## P5
**判定: ある**
根拠: Training consists of 1-day orientation + floor buddy week 1.
コメント: 全体が仕様説明文のみで当事者の声や生活場面への接地がなく説明文化に留まる。

## P6
**判定: ある**
根拠: ヒーロー Seasonal Sales Associate (casual, storefront) / Term 6 weeks: Dec 1 – Jan 11 Pay Hourly pay
コメント: 時給役割の第一確認項目である金額 Hourly 1,300 JPY がヒーロー内に数値として出ていない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
