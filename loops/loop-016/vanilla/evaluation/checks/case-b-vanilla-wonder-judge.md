# Judge (Layer 2 few-shot contrast) — C-B vanilla-wonder

- source: `vanilla/wonder/case-b.html`
- tool: `eval-phase-34.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:02:20.872Z
- finished: 2026-11-02T12:02:48.875Z
- usage: prompt 4006 / completion 4495 / total 8501 (reasoning: 4076)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、05表は短い値のみで本文は言い換え配置であるため。
コメント: 二重掲載や表内反復のような仕様書化は見られない。

## P2
**判定: ある**
根拠: “All facts shown are the only stated facts from the posting.” / “The benefits listed for this posting — exactly as stated, with no extras added.”
コメント: 検証側の限定・言い訳定型が読者向けコピーに混入している。

## P3
**判定: ない**
根拠: ない — Target audience・Persona・factKeys・〔〕・L01等の企画ラベル露出がないため。
コメント: 読者に見えるのは求人内容のみで内部記録物はない。

## P4
**判定: ない**
根拠: ない — 01は勤務時間、02はWard & Training、03はLocation & Commute、04はBenefitsのみで範囲逸脱がないため。
コメント: 見出しの約束と本文の内容は一致している。

## P5
**判定: ない**
根拠: ない — “so you can plan your life outside work with confidence.”等の生活翻訳・シナリオ接地があるため。
コメント: 全体が説明・仕様羅列のみではなく当事者視点の声がある。

## P6
**判定: ない**
根拠: “[H1] Daytime nursing, on a steady rhythm. Registered Nurse (full-time, general ward) at Harborview General Hospital in Yokohama, Minato Mirai area — day shift only, with no scheduled night duty.” / “ANNUAL SALARY ¥5,200,000”
コメント: 常勤看護師の第一確認項目である給与・日勤帯・夜勤なしがヒーローに出ている。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
