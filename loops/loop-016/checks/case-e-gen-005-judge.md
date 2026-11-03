# Judge (Layer 2 few-shot contrast) — C-E gen-005

- source: `previews/case-E-gen-005-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T23:02:37.080Z
- finished: 2026-11-02T23:03:31.617Z
- usage: prompt 4103 / completion 7127 / total 11230 (reasoning: 6701)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.
- rerun: 2026-11-03 — 初回 2026-11-02T11:39:33Z の記録（`case-e-gen-005-judge.original-20261102.md/.json` に保管）は `## P4` 空欄・`## P5`/`## P6` 欠落があったため、同条件（`loop16-judge.mjs` `muse-spark-1.3-contributor` temp0.3 max_tokens12000、previews `case-E-gen-005-complete.html` + `checks/pairs/*.md` + `research/common.md` ヒント）で再実行し本ファイルを上書き。初回は上書きせず残した。監査レビュー §6-A A2 対応。本体・cases・research 変更なし、コミット・push なし。

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく事実値の言い換え再利用のみ
コメント: 「From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00」等の値 reuse はあるが同一文2回出現とCTA再掲はP1対象外のため該当しない。

## P2
**判定: ある**
根拠: All conditions above are from the 9 sentences of C-E gen-005. No new facts are added.
コメント: 生成文数と事実追加有無の言及は読者条件ではなく検証側メタ文である。

## P3
**判定: ある**
根拠: Generation: loops/loop-016/generations/case-E/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12507 / completion9488 / total21995
コメント: 生成ファイルパス・モデル名・トークン数は内部記録物であり読者向け本文ではない。

## P4
**判定: ない**
根拠: ない — Pay & Hoursは給与・時間のみ、Team & Supportは支援系のみで範囲逸脱なし
コメント: 「You will earn Hourly 1,250 JPY.」等は見出し範囲内でteam/training/benefits混入がない。

## P5
**判定: ある**
根拠: Training includes 3-day onboarding with buddy; no experience required.
コメント: 全文が説明・仕様列挙で当事者の体験談や生活場面の声が一切ない。

## P6
**判定: ない**
根拠: [H1] Cafe Crew (part-time, short hours) Work hours From 3h/day · 2-4 days/wk
コメント: 短時間パートの第一確認項目である時間帯・日数がヒーローに明示されている。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
