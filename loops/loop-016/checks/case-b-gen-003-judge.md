# Judge (Layer 2 few-shot contrast) — C-B gen-003

- source: `previews/case-B-gen-003-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:36:31.918Z
- finished: 2026-11-02T07:37:24.108Z
- usage: prompt 4076 / completion 7997 / total 12073 (reasoning: 7515)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない — The Basicsは「- salary Annual 5,200,000 JPY」のようなキー＋値形式で、本文「We offer an annual salary of 5,200,000 JPY.」と同一文の逐語重複にならない。
コメント: 事実表と本文は分離配置で二重掲載や表内反復による仕様書化はない。

## P2
**判定: ある**
根拠: "All conditions above are from the 11 sentences of C-B gen-003. No new facts are added."
コメント: 読者への条件提示ではなく生成文の出所と完全性を宣言する検証側メタ文である。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-B/gen-003.json · model meta-models/muse-spark-open-1026 · prompt6583 / completion7333 / total13916"
コメント: 生成パスやモデル名・トークン数などの内部記録が読者向け本文に露出している。

## P4
**判定: ない**
根拠: ない — 「Pay & Hours — Exactly as Stated」は「You will work on a Full-time (permanent) basis.」「We offer an annual salary of 5,200,000 JPY.」など給与・勤務のみで範囲外を含まない。
コメント: 見出しが約束する範囲と本文の事実が一致し混入はない。

## P5
**判定: ある**
根拠: "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site."
コメント: 全文が説明・列挙型で当事者の生の声や生活場面の接地がなく説明文化のままである。

## P6
**判定: ない**
根拠: "Registered Nurse (full-time, general ward)" / "Annual 5,200,000 JPY" / "Day shift 08:30-17:00, 5 days/week; no scheduled night duty"
コメント: ヒーローに職種・雇用形態・勤務地・給与・シフトが揃い第一確認項目の欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
