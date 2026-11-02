# Judge (Layer 2 few-shot contrast) — C-E vanilla-spark

- source: `vanilla/spark/case-e.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:08:09.846Z
- finished: 2026-11-02T12:08:53.471Z
- attempt: 1
- usage: prompt 3507 / completion 7363 / total 10870 (reasoning: 6938)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、重なりは短い値の折りたたみのみである。
コメント: Hero・本文・Facts間の一致はGood例が許容する値レベルの重複であり仕様書化の反復に当たらない。

## P2
**判定: ある**
根拠: "Application instructions are not included in the posting provided — please refer to the original notice for how to apply."
コメント: 求人票の記載範囲への言及で不備を弁明する検証側の言い回しが読者向け本文に混入している。

## P3
**判定: ない**
根拠: ない — Target audience・Persona・factKeys・sourceLines・〔〕・L01等の記録ラベルは見えない。
コメント: ページ内に企画・根拠の露出に該当するラベルや引用記号は存在しない。

## P4
**判定: ある**
根拠: "[H2] Work hours" 本文に "3-day onboarding with buddy; no experience required." / "6-person cafe team with shared shift board."
コメント: 見出しWork hoursの許容範囲は勤務時間帯のみだがTraining・Team・Commute相当が混入し範囲外である。

## P5
**判定: ある**
根拠: "6-person cafe team with shared shift board."
コメント: ページ全体が事実列挙の説明文のみで当事者の声や場面接地の語りが存在しない。

## P6
**判定: ない**
根拠: "[H1] Cafe Crew (part-time, short hours) Morningside Coffee — Setagaya, Futako-Tamagawa - Hourly 1,250 JPY - From 3 hours / day"
コメント: 短時間パートの第一確認項目である時給と時間帯がヒーロー内に既に示されている。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
