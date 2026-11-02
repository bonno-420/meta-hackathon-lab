# Judge (Layer 2 few-shot contrast) — C-A vanilla-spark

- source: `vanilla/spark/case-a.html`
- tool: `eval-phase-34.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:00:43.642Z
- finished: 2026-11-02T12:01:27.677Z
- usage: prompt 3585 / completion 6519 / total 10104 (reasoning: 6132)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ある**
根拠: "Software Engineer (full-time, SaaS product team)" / "Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)"
コメント: 同一文がヒーロー・各H2・Posting Summaryで逐語反復され二重掲載になっている。

## P2
**判定: ある**
根拠: "Facts shown are the only stated facts."
コメント: 読者向け本文に検証側の限定宣言が混入している。

## P3
**判定: ない**
根拠: ない。Target audience・Persona・factKeys・sourceLines・〔〕・L01等の企画ラベルは原文に存在しない。
コメント: 読者に見える記録物・引用記号の露出はない。

## P4
**判定: ない**
根拠: ない。各H2はRole・Compensation・Location & Commute・Work Hours・Team・Benefitsの範囲内に対応している。
コメント: Bad例のようなPay & Hours見出しにteam/training/benefits混入はない。

## P5
**判定: ある**
根拠: "8-person product team (4 engineers, 2 designers, 2 PMs)"
コメント: 全文が事実列挙の説明型で当事者の声や生活場面の接地がない。

## P6
**判定: ない**
根拠: "Northbridge Labs — Osaka, Umeda district — Full-time (permanent) Annual 4,800,000 JPY. Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)."
コメント: フルタイムの第一確認項目である雇用形態・年収・勤務時間がヒーローに出ている。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
