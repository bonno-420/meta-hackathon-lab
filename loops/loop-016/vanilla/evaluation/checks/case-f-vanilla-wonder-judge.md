# Judge (Layer 2 few-shot contrast) — C-F vanilla-wonder

- source: `vanilla/wonder/case-f.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:09:29.030Z
- finished: 2026-11-02T12:10:01.454Z
- attempt: 1
- usage: prompt 3810 / completion 5496 / total 9306 (reasoning: 5100)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復は確認できない
コメント: 類似の言い換えはあるが仕様書化する同一文の二重掲載はない。

## P2
**判定: ある**
根拠: "Everything stated, nothing added. This page is built only from the job posting."
コメント: 読者向け条件ではなく検証側の限定宣言が本文に混入している。

## P3
**判定: ない**
根拠: ない — Target audience / Persona / factKeys / sourceLines / 〔〕等の露出はない
コメント: 企画・根拠ラベルは読者向けテキストに現れていない。

## P4
**判定: ある**
根拠: "3 Dec 1 — Jan 11 The 6-week term 2026-12-01 to 2027-01-11 · 3–5 days/week, 4–7 hours/day. Weekends preferred."
コメント: 見出し04 — How you startはorientation/buddyが範囲だが本文にterm・work hours・locationが混入している。

## P5
**判定: ない**
根拠: ない — 体験・場面接地があるため完全な説明仕様書ではない
コメント: Move the slidersやTry the hours等の場面接地があり声かけ説明がある。

## P6
**判定: ない**
根拠: "A 6-week season at Crestline Outdoor. Seasonal Sales Associate (casual, storefront) in Nagoya’s Sakae district — from 1 December 2026 to 11 January 2027. ¥ 1,300 JPY / hour"
コメント: ヒーローに時給と6週間・期間が明示され第一確認項目の欠落はない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
