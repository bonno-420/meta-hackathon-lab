# Judge (Layer 2 few-shot contrast) — C-E vanilla-wonder

- source: `vanilla/wonder/case-e.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:07:35.901Z
- finished: 2026-11-02T12:08:08.540Z
- attempt: 1
- usage: prompt 3927 / completion 6087 / total 10014 (reasoning: 5695)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない
コメント: 同一文の逐語反復はなく、各事実は用途別に言い換え・折り畳みで配置されているため仕様書化に該当しない。

## P2
**判定: ある**
根拠: "All facts below are taken directly from the job posting sheet. Nothing has been added."
コメント: 検証側の自己言及である直接取得・無追加の宣言と「as stated in the posting」が読者向け本文に混入している。

## P3
**判定: ない**
根拠: ない
コメント: Target audience・Persona・factKeys・sourceLines・〔〕引用等の企画ラベル露出が見当たらないため該当しない。

## P4
**判定: ある**
根拠: "03 — Location & Commute [H2]" / "☕ Staff drink free on shift The listed benefit for Cafe Crew on shift."
コメント: 見出しの許容範囲はLocation・Commuteだが本文にBenefitsの「Staff drink free on shift」が含まれ見出しと中身がずれている。

## P5
**判定: ない**
根拠: ない
コメント: 「Choose a 3-hour slot.」「You won’t start alone.」等の場面設定・対話的ガイダンスがあり完全な説明文のみのページではない。

## P6
**判定: ない**
根拠: "[H1] Cafe Crew, in just 3 hours a day." / "Hourly 1,250 JPY 08:00–11:00 or 11:00–14:00"
コメント: 短時間パートの第一確認項目である時給・時間帯・日数がヒーローに明示されており欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
