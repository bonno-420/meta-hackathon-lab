# Judge (Layer 2 few-shot contrast) — C-A gen-003

- source: `previews/case-A-gen-003-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:35:48.325Z
- finished: 2026-11-02T07:36:30.524Z
- usage: prompt 4089 / completion 7378 / total 11467 (reasoning: 6975)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない – 同一文の逐語反復はなく、The Basicsはキー＋値のみで本文文と重複しない。
コメント: 値の再掲はあるが仕様書化する同一センテンスの二重掲載ではない。

## P2
**判定: ある**
根拠: "All conditions above are from the 11 sentences of C-A gen-003. No new facts are added."
コメント: 読者向け条件ではなく生成・検証側の自己言及が本文に混入している。

## P3
**判定: ある**
根拠: "Mentorship and code-review first; salary as fixed fact, no inflation. Emphasize commute and team rhythm."
コメント: 読者への説明ではなく企画指示・編集方針のメモがヒーローに露出している。

## P4
**判定: ない**
根拠: ない – Pay & Hoursは雇用形態・給与・勤務時間のみでteam/training/benefitsを含まない。
コメント: 見出しが約束する範囲と本文のfactKeysが一致し範囲外混入がない。

## P5
**判定: ある**
根拠: "You will receive 3-month onboarding with dedicated mentor and weekly code review."
コメント: 全文が事実説明型で当事者の声や生活場面の接地がなく仕様書的に終始している。

## P6
**判定: ない**
根拠: ない – ヒーローに "Software Engineer (full-time, SaaS product team)" と "Annual 4,800,000 JPY" および "Full-time (permanent) · Osaka, Umeda district" がある。
コメント: フルタイムの第一確認項目である給与・雇用形態・勤務地がヒーローに揃っている。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
