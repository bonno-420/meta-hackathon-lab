# Judge (Layer 2 few-shot contrast) — C-C gen-003

- source: `previews/case-C-gen-003-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:37:25.394Z
- finished: 2026-11-02T07:38:03.825Z
- usage: prompt 4019 / completion 6559 / total 10578 (reasoning: 6133)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復は確認できない
コメント: The Basicsは値のみの列挙で結合文の intra-facts 反復がなく本文文も各1回のみであるため仕様書化反復に当たらない。

## P2
**判定: ある**
根拠: "All sentences below are from generation C-C gen-003 (11 sentences)." / "All conditions above are from the 11 sentences of C-C gen-003. No new facts are added."
コメント: 生成番号・文数・新規事実なしへの言及は検証側のメタ文であり読者向け条件説明ではない。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-C/gen-003.json"
コメント: 生成ファイルパス・モデル名・トークン数などの内部記録物が読者面に露出している。

## P4
**判定: ある**
根拠: "This contract includes Renewal review at month 11; no automatic conversion." / "You can apply with one portfolio link and review the Contract, 12 months term on the first screen."
コメント: 見出しPay & Hoursの許容は給与・時間なのに契約条件と応募導線が混入し範囲不一致である。

## P5
**判定: ある**
根拠: "You will receive Monthly 380,000 JPY." / "Benefits include Health insurance, 10 paid days from month 4, ownership of 2 launches."
コメント: 全文がYou will〜・Benefits include〜の説明型で当事者の声や場面接地がない。

## P6
**判定: ない**
根拠: ない — ヒーローに "Brand Specialist (12-month fixed-term contract)" がある
コメント: 契約型の第一確認項目である期間表示がヒーロー内に明示されているため欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
