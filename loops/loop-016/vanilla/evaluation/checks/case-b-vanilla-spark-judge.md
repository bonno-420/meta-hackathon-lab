# Judge (Layer 2 few-shot contrast) — C-B vanilla-spark

- source: `vanilla/spark/case-b.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:02:50.710Z
- finished: 2026-11-02T12:03:35.458Z
- attempt: 1
- usage: prompt 3620 / completion 6106 / total 9726 (reasoning: 5773)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ある**
根拠: "Two paid training days per year + quarterly skills workshop"
コメント: 同一文がTraining見出し下とPosting detailsのTraining行に逐語で二重掲載され仕様書化している。
## P2
**判定: ある**
根拠: "Information on this page is limited to the facts listed under “Posting details.”"
コメント: 読者向け条件ではなく検証側の限定宣言が本文に混入している。
## P3
**判定: ない**
根拠: ない
コメント: Target audienceやPersonaやfactKeysや〔〕引用等の記録ラベルが見当たらない。
## P4
**判定: ある**
根拠: "Team 12-nurse ward with dedicated handover lead"
コメント: 見出しWork patternの想定はworkHoursだが本文にteamとcommuteが含まれて範囲がずれている。
## P5
**判定: ある**
根拠: "This position is for a Registered Nurse (full-time, general ward)."
コメント: 全体が説明・箇条書きの羅列で当事者の声や場面接地がなく欠落している。
## P6
**判定: ない**
根拠: "[H1] Registered Nurse (full-time, general ward) Full-time (permanent) Annual 5,200,000 JPY Day shift 08:30–17:00"
コメント: ヒーローに給与と雇用形態と日勤帯が含まれ第一確認項目の欠落がない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
