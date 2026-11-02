# Judge (Layer 2 few-shot contrast) — C-F vanilla-spark

- source: `vanilla/spark/case-f.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:10:02.761Z
- finished: 2026-11-02T12:10:28.947Z
- attempt: 1
- usage: prompt 3521 / completion 4277 / total 7798 (reasoning: 3918)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復は確認できない
コメント: 役職名や地名の再言及はあるが、仕様書文の2回以上の逐語重複には当たらない。

## P2
**判定: ある**
根拠: "All items below are the only stated facts from the posting."
コメント: 検証側の限定宣言が読者向け本文に混入しておりP2に該当する。

## P3
**判定: ない**
根拠: ない — Target audience等の企画ラベルは表示されていない
コメント: factKeysやsourceLines、〔〕引用等の記録物露出は見当たらない。

## P4
**判定: ない**
根拠: ない — 見出しと内容の不一致は見当たらない
コメント: 「At a glance」と「Posting details」は包括的見出しで収録内容と齟齬がない。

## P5
**判定: ある**
根拠: "Company: Crestline Outdoor — Role: Seasonal Sales Associate (casual, storefront)"
コメント: 全体が事実列挙の説明型で当事者の声や場面描写が存在しない。

## P6
**判定: ない**
根拠: ない — ヒーローに "Hourly 1,300 JPY" と "Seasonal — 6 weeks: 2026-12-01 to 2027-01-11" がある
コメント: 時給・期間・時間帯が第一画面に揃い、第一確認項目の欠落はない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
