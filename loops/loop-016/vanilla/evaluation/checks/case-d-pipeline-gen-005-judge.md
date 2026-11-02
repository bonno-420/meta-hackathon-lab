# Judge (Layer 2 few-shot contrast) — C-D pipeline-gen-005

- source: `previews/case-D-gen-005-complete.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:07:03.486Z
- finished: 2026-11-02T12:07:34.592Z
- attempt: 1
- usage: prompt 4120 / completion 5717 / total 9837 (reasoning: 5352)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、基本欄はキー値のみで本文文と重複しない。
コメント: 仕様書化する二重掲載は認められない。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-D gen-005. No new facts are added."
コメント: 生成文への自己言及で読者向け条件説明ではない。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-D/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12548 / completion5122 / total17670"
コメント: 生成パスやモデル名等の内部記録が読者面に露出している。

## P4
**判定: ある**
根拠: "Pay & Hours — Exactly as Stated" 見出しに対し "You will be employed by Apex Work Partners (dispatching agency) on a Dispatched (agency employed, client site) basis."
コメント: 給与・時間のはずが雇用主・雇用形態の文が混入している。

## P5
**判定: ある**
根拠: "You will earn Hourly 1,400 JPY for time worked on assignment."
コメント: 全文が説明文のみで当事者の声や体験描写がない。

## P6
**判定: ない**
根拠: "[H1] Warehouse Associate (picking and packing)" + "Hourly 1,400 JPY"
コメント: 時給職の第一確認項目である時給がヒーロー域に出ている。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
