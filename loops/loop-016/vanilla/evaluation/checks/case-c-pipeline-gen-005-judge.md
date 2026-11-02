# Judge (Layer 2 few-shot contrast) — C-C pipeline-gen-005

- source: `previews/case-C-gen-005-complete.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:05:15.118Z
- finished: 2026-11-02T12:05:46.822Z
- attempt: 1
- usage: prompt 4045 / completion 5383 / total 9428 (reasoning: 4994)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ある**
根拠: "Renewal review at month 11; no automatic conversion"
コメント: 同一文がヒーロー・The Basics・Pay & Hours・Check Before You Applyに逐語で反復され仕様書化している。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-C gen-005. No new facts are added."
コメント: 読者向け条件ではなく生成文の来歴と無加筆を弁明する検証側メタ文が混入している。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-C/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12425 / completion6428 / total18853"
コメント: 生成パス・モデル名・トークン数などの内部記録物が読者向け本文に露出している。

## P4
**判定: ある**
根拠: "[H2] Pay & Hours — Exactly as Stated"内の"- Renewal review at month 11; no automatic conversion."
コメント: 見出しの許容範囲は給与・勤務時間だが契約条件・雇用形態・応募方法が混入し範囲外である。

## P5
**判定: ある**
根拠: "- Employment type — Contract, 12 months"
コメント: 全体が条件箇条書きの説明・仕様羅列で当事者の体験談や場面描写の声が存在しない。

## P6
**判定: ない**
根拠: "[H1] Brand Specialist (12-month fixed-term contract)"
コメント: 契約職の第一確認項目である契約期間がヒーローに明示されているため欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
