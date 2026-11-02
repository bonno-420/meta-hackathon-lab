# Judge (Layer 2 few-shot contrast) — C-D vanilla-wonder

- source: `vanilla/wonder/case-d.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:05:48.138Z
- finished: 2026-11-02T12:06:25.210Z
- attempt: 1
- usage: prompt 4244 / completion 6812 / total 11056 (reasoning: 6342)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ある**
根拠: "Agency coordinator on site twice/week + phone support on shift days, and buddy pairing in week 1 within a 10-person team." が Full Details と "What support is there? Agency coordinator on site twice/week + phone support on shift days, and buddy pairing in week 1 within a 10-person team." に逐語反復
コメント: Full Details表とQuick Questionsで同一長文節を二重掲載しており仕様書化に該当する。

## P2
**判定: ある**
根拠: "All facts above are the only stated facts."
コメント: 読者向け本文に検証側の限定宣言が混入しておりメタ文に該当する。

## P3
**判定: ない**
根拠: ない — 対象頁に Target audience / Persona / factKeys / sourceLines / 〔〕引用等の企画ラベルが見当たらないため
コメント: 記録物露出に当たる計画・根拠ラベルは確認できない。

## P4
**判定: ある**
根拠: 見出し "Employment Type [H2] Dispatched: employed by Apex, working at the client site" に対し本文 "3 Role Warehouse Associate Picking and packing as a Warehouse Associate."
コメント: 雇用形態見出しの許容範囲は雇用形態・雇用主だが役割と支援が混入し範囲外である。

## P5
**判定: ある**
根拠: "Employer Apex Work Partners (dispatching agency) Worksite Client distribution center in Saitama, Kawaguchi Role Warehouse Associate (picking and packing)"
コメント: 全体が事実列挙の説明文のみで当事者の体験談や生活場面の声が見当たらない。

## P6
**判定: ない**
根拠: ない — ヒーロー "Hourly Pay ¥1,400 / hour Mon–Fri, 09:00–17:30 3–5 days / week selectable" に時給・時間帯・日数選択が明示されているため
コメント: 時間給職の第一確認項目である時給がヒーローに出ており欠落はない。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
