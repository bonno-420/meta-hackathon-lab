# Judge (Layer 2 few-shot contrast) — C-B gen-002

- source: `previews/case-B-gen-002-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:18:18.691Z
- finished: 2026-11-02T07:18:41.372Z
- usage: prompt 4465 / completion 3920 / total 8385 (reasoning: 3472)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "- company Harborview General Hospital is hiring for its general ward. 〔company / L01〕" と "- S1 Harborview General Hospital is hiring for its general ward. 〔company / L01〕"
コメント: 同一文が基本表と本文で逐語重複し二重掲載となっているため仕様書化に該当する。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 読者向け条件文ではなく検証側の読み方指示がそのまま表示されているため混入に該当する。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Licensed nurses seeking stable day-shift roles in urban general hospital."
コメント: 企画メモのラベルと引用記号〔company / L01〕等が読者面に露出しているため該当する。

## P4
**判定: ある**
根拠: "[H2] Pay & Hours — Exactly as Stated" の本文に "You will join a 12-nurse ward with dedicated handover lead. 〔team / L09〕"
コメント: 見出しが給与・時間を示すのにteam/training/benefits/company等が混入し範囲不一致となっている。

## P5
**判定: ある**
根拠: "We offer an annual salary of 5,200,000 JPY. 〔salary / L05〕"
コメント: 全体が事実文の列挙で当事者の体験談や生活場面の声がなく説明文化のみとなっている。

## P6
**判定: ある**
根拠: "[H1] Registered Nurse — General Ward For licensed nurses who want a larger day-shift team with clear handover and paid training."
コメント: ヒーローに具体的な第一確認項目である年収額や勤務時間帯の数値がなく一般言及のみのため候補欠落に該当する。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
