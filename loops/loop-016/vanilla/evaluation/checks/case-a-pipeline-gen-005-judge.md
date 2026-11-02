# Judge (Layer 2 few-shot contrast) — C-A pipeline-gen-005

- source: `previews/case-A-gen-005-complete.html`
- tool: `eval-phase-34.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:01:29.015Z
- finished: 2026-11-02T12:02:19.554Z
- usage: prompt 4157 / completion 8222 / total 12379 (reasoning: 7807)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない（同一仕様文の逐語重複は確認できない）
コメント: Facts表は短い値のみで本文との二重掲載がなくCTA再掲は対象外のため仕様書化の反復に当たらない。

## P2
**判定: ある**
根拠: All conditions above are from the 9 sentences of C-A gen-005. No new facts are added.
コメント: 読者向け条件ではなく生成文由来保証という検証側の自己言及が混入しているため。

## P3
**判定: ある**
根拠: Generation: loops/loop-016/generations/case-A/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12701 / completion4535 / total17236
コメント: 読者に不要な生成ファイルパスやモデル・トークン数という内部記録物が露出しているため。

## P4
**判定: ない**
根拠: ない（Pay & Hours配下にteam/training/benefitsの混入がない）
コメント: Pay & Hoursは給与・勤務時間のみで見出しと中身が一致し範囲外事実を含まないため。

## P5
**判定: ある**
根拠: Benefits include Health insurance, 10 paid days from month 7, laptop provided as listed.
コメント: 全文が説明・列挙調で当事者の体験談や生活場面の接地となる声がなく欠落しているため。

## P6
**判定: ない**
根拠: ない — ヒーロー文言 Software Engineer (full-time, SaaS product team) Salary ¥4.8M / year に年収が含まれ欠落がない
コメント: フルタイムの第一確認項目である年収・雇用形態がヒーローに出ているため候補欠陥に当たらない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
