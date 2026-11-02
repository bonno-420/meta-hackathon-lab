# Judge (Layer 2 few-shot contrast) — C-E gen-004

- source: `previews/case-E-gen-004-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T11:00:09.033Z
- finished: 2026-11-02T11:00:37.504Z
- usage: prompt 4142 / completion 4862 / total 9004 (reasoning: 4399)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Morningside Coffee is hiring Cafe Crew (part-time, short hours) in Setagaya, Futako-Tamagawa."
コメント: 同一文がPlace & AccessとTeam & Supportに逐語で二重掲載されており仕様書化に該当する。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-E gen-004. No new facts are added."
コメント: 読者向け条件ではなく生成・検証側の来歴弁明でありメタ文の混入に該当する。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-E/gen-004.json · model meta-models/muse-spark-open-1026 · prompt12507 / completion9488 / total21995"
コメント: ファイルパスやモデル名やトークン数は内部記録物であり読者向け露出に該当する。

## P4
**判定: ある**
根拠: 見出し "Team & Support" に対して本文 "Morningside Coffee is hiring Cafe Crew (part-time, short hours) in Setagaya, Futako-Tamagawa."
コメント: 見出しの想定はteam/training/benefitsだが本文にcompany/role/locationが混入し範囲ずれに該当する。

## P5
**判定: ある**
根拠: "This is a Part-time position. - You can work From 3 hours/day, 2-4 days/week"
コメント: 全体が事実説明の羅列で当事者の声や生活場面の接地がなく説明文化のみに該当する。

## P6
**判定: ない**
根拠: "[H1] Cafe Crew (part-time, short hours)" + "From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00" + "Hourly 1,250 JPY"
コメント: 短時間パートの第一確認項目である時間帯と時給がヒーローに含まれ欠落がない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
