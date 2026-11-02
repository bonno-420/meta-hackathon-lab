# Judge (Layer 2 few-shot contrast) — C-D gen-005

- source: `previews/case-D-gen-005-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T11:39:33.645Z
- finished: 2026-11-02T11:40:15.064Z
- usage: prompt 4120 / completion 5801 / total 9921 (reasoning: 5427)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復2回以上は確認できない
コメント: 要約値の再掲はあるが仕様書化する同一センテンスの二重掲載はない。

## P2
**判定: ある**
根拠: All conditions above are from the 9 sentences of C-D gen-005. No new facts are added.
コメント: 読者向け条件ではなく生成文管理の自己言及が表示されている。

## P3
**判定: ある**
根拠: Generation: loops/loop-016/generations/case-D/gen-005.json · model meta-models/muse-spark-open-1026
コメント: ファイルパスやモデル名等の内部記録が読者面に露出している。

## P4
**判定: ある**
根拠: 見出し [H2] Team & Support に対し本文 - No forklift license; able to stand/lift up to 15 kg is the requirement for this picking and packing work, which involves standing and lifting.
コメント: 見出しの許容はteam・supportだが本文にrequirementsが混入し範囲がずれている。

## P5
**判定: ある**
根拠: You will earn Hourly 1,400 JPY for time worked on assignment.
コメント: 全体が説明型定型文のみで当事者の声や場面接地がない。

## P6
**判定: ない**
根拠: Dispatched (agency employed, client site) Apex Work Partners (dispatching agency) Client distribution center in Saitama, Kawaguchi Hourly 1,400 JPY
コメント: 時給役割の第一確認項目である pay がヒーロー行に含まれている。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
