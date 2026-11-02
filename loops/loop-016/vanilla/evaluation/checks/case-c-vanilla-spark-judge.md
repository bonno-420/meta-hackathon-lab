# Judge (Layer 2 few-shot contrast) — C-C vanilla-spark

- source: `vanilla/spark/case-c.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:04:53.501Z
- finished: 2026-11-02T12:05:13.793Z
- attempt: 1
- usage: prompt 3353 / completion 3444 / total 6797 (reasoning: 3055)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復は確認できず、facts表も各キーが1回のみの記載である。
コメント: 類似表現はあるが逐語で2回以上出現する仕様書文はないため非該当とした。

## P2
**判定: ある**
根拠: "Facts below are the only stated facts from the posting sheet dated 2026-11-02." / "All facts above are the only stated facts."
コメント: 検証側の限定宣言が読者向け本文に混入しているため該当とした。

## P3
**判定: ある**
根拠: "Source: loops/loop-016/cases/case-c.json — Facts L01–L10 in sourceLine order."
コメント: ファイルパスとsourceLine記法という内部記録物が露出しているため該当とした。

## P4
**判定: ない**
根拠: ない — "Pay & Hours"等の範囲を約束する見出し区分が存在せず不一致を判定できない。
コメント: 見出しと中身の対応関係自体がないため非該当とした。

## P5
**判定: ある**
根拠: "Company Everfield & Co. Role Brand Specialist (12-month fixed-term contract) Location Tokyo, Shibuya"
コメント: 全体が事実列挙の説明のみで当事者の声や場面接地がないため該当とした。

## P6
**判定: ない**
根拠: ない — ヒーロー "Everfield & Co. Brand Specialist (12-month fixed-term contract)" に契約期間の第一確認項目が含まれている。
コメント: 契約系の第一確認項目である期間表示がヒーローにあるため非該当とした。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
