# Judge (Layer 2 few-shot contrast) — C-B gen-005

- source: `previews/case-B-gen-005-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T11:39:33.624Z
- finished: 2026-11-02T11:40:21.260Z
- usage: prompt 4089 / completion 6774 / total 10863 (reasoning: 6362)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Day shift 08:30-17:00, 5 days/week; no scheduled night duty"
コメント: 同一文言がヒーロー・The Basics・Pay & Hours・Check Before You Applyに逐語で二重掲載され仕様書化している。

## P2
**判定: ある**
根拠: "All conditions above are from the 10 sentences of C-B gen-005. No new facts are added."
コメント: 読者向け条件ではなく生成文の検証側メタ言明が本文に混入している。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-B/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12458 / completion6762 / total19220"
コメント: 生成ファイルパス・モデル名・トークン数やRecordパス等の内部記録物が読者面に露出している。

## P4
**判定: ある**
根拠: "Harborview General Hospital is hiring a Registered Nurse (full-time, general ward)."
コメント: 見出し[Team & Support]の許容はteam/training/benefitsなのにcompany/role文と応募手順文が混入し範囲外である。

## P5
**判定: ある**
根拠: "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site."
コメント: 全文が説明・列挙型で当事者の lived-voice や場面接地がなく欠落している。

## P6
**判定: ない**
根拠: "[H1] Registered Nurse (full-time, general ward) Work hours Day shift 08:30-17:00 · No nights"
コメント: ヒーローに勤務時間・夜勤なし等の第一確認項目が出ており欠落はない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
