# Judge (Layer 2 few-shot contrast) — C-F gen-003

- source: `previews/case-F-gen-003-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:39:15.007Z
- finished: 2026-11-02T07:39:43.129Z
- usage: prompt 4062 / completion 4883 / total 8945 (reasoning: 4456)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district."
コメント: 同一文がPlace & AccessとTeam & Supportに逐語で二重掲載され仕様書化しているため。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-F gen-003. No new facts are added."
コメント: 読者向け条件ではなく生成文の由来と無追加を弁明する検証側メタ文が混入しているため。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-F/gen-003.json · model meta-models/muse-spark-open-1026 · prompt6652 / completion4367 / total11019"
コメント: 生成パスやモデル名やトークン数という内部記録物が読者面に露出しているため。

## P4
**判定: ある**
根拠: "Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district."
コメント: 見出しTeam & Supportはtraining/perksが範囲なのに本文にcompany/role/locationの雇用文が混入し範囲外のため。

## P5
**判定: ある**
根拠: "Training includes 1-day orientation + floor buddy week 1."
コメント: 全文が事実列挙の説明文で当事者の体験談や場面描写による生活翻訳が一切ないため。

## P6
**判定: ない**
根拠: "Seasonal Sales Associate (casual, storefront) — 6 weeks: 2026-12-01 to 2027-01-11 · Hourly 1,300 JPY"
コメント: 季節短期・時給役の第一確認項目である期間と時給がヒーローに明示されているため。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
