# Judge (Layer 2 few-shot contrast) — C-E gen-005

- source: `previews/case-E-gen-005-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T11:39:33.616Z
- finished: 2026-11-02T11:40:28.211Z
- usage: prompt 4103 / completion 8000 / total 12103 (reasoning: 7811)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない
コメント: 同一文の逐語反復はなく事実値の言い換え再利用のみでCTA重複は除外対象である。

## P2
**判定: ある**
根拠: All conditions above are from the 9 sentences of C-E gen-005. No new facts are added.
コメント: 読者向け条件ではなく生成文管理側の宣言が本文に混入している。

## P3
**判定: ある**
根拠: Generation: loops/loop-016/generations/case-E/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12507 / completion9488 / total21995
コメント: 読者に不要な生成パスやモデル数値等の内部記録が露出している。

## P4
**判定:

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
