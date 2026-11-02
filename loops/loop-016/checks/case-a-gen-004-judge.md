# Judge (Layer 2 few-shot contrast) — C-A gen-004

- source: `previews/case-A-gen-004-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T10:57:34.968Z
- finished: 2026-11-02T10:58:16.779Z
- usage: prompt 4173 / completion 6511 / total 10684 (reasoning: 6095)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district."
コメント: 同一文がPlace & AccessとTeam & Supportに逐語で2回出現し仕様書化している。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-A gen-004. No new facts are added."
コメント: 読者向け条件ではなく生成文の検証側の言い回しがそのまま表示されている。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-A/gen-004.json · model meta-models/muse-spark-open-1026 · prompt12701 / completion4535 / total17236"
コメント: 生成ファイルパスやモデル名やトークン数など内部記録物が読者面に露出している。

## P4
**判定: ある**
根拠: 見出し "[H2] Team & Support チーム・サポート" に対して本文 "Northbridge Labs is hiring a Software Engineer (full-time, SaaS product team) in Osaka, Umeda district."
コメント: 見出しの許容範囲はteam/training/benefitsだがcompany/role/location文が混入し範囲外である。

## P5
**判定: ある**
根拠: "Benefits include Health insurance, 10 paid days from month 7, laptop provided as listed."
コメント: 全体が事実列挙の説明文のみで当事者の声や生活場面の接地がない。

## P6
**判定: ない**
根拠: ない "[H1] Software Engineer (full-time, SaaS product team) Annual 4,800,000 JPY"
コメント: ヒーローに年収・雇用形態・勤務地が含まれ第一確認項目の欠落がない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
