# Judge (Layer 2 few-shot contrast) — C-C vanilla-wonder

- source: `vanilla/wonder/case-c.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:04:16.737Z
- finished: 2026-11-02T12:04:52.197Z
- attempt: 1
- usage: prompt 4075 / completion 6314 / total 10389 (reasoning: 5947)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ある**
根拠: "Monthly 380,000 JPY" / "Renewal review at month 11; no automatic conversion"
コメント: 同一文言がヒーロー・一覧・FAQ・フッターに逐語反復され仕様書化しているためP1に該当する。

## P2
**判定: ある**
根拠: "All facts on this page are the only stated facts."
コメント: 検証側の自己言及である限定宣言が読者向け本文に混入しているためP2に該当する。

## P3
**判定: ない**
根拠: ない
コメント: Target audience・Persona・factKeys・〔〕・L01等の企画ラベルは頁内に出現しないためP3は不在である。

## P4
**判定: ある**
根拠: "Work & Place [H2]" / "You will work in a 6-person brand team and report to the Brand Lead."
コメント: Work & Place見出しの想定範囲は勤務時間・場所なのに本文がteam事実を含むため見出しと中身がずれている。

## P5
**判定: ある**
根拠: "Health insurance is listed in the stated benefits."
コメント: 頁全体が事実列挙の説明調で当事者の声や生活場面の接地がなく説明文化のみのためP5に該当する。

## P6
**判定: ない**
根拠: "Tokyo, Shibuya • Contract, 12 months Now hiring — 12-month contract"
コメント: 契約職の第一確認項目である契約期間がヒーローに明示されているため欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
