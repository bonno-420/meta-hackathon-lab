# Judge (Layer 2 few-shot contrast) — C-A gen-005

- source: `previews/case-A-gen-005-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T11:38:27.879Z
- finished: 2026-11-02T11:39:28.090Z
- usage: prompt 4157 / completion 7816 / total 11973 (reasoning: 7426)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、The Basicsは値のみの折り畳みで本文と重複しない。
コメント: CTAの「Apply with resume —」の再掲は意図的再掲であり仕様書化には当たらない。

## P2
**判定: ある**
根拠: All conditions above are from the 9 sentences of C-A gen-005. No new facts are added.
コメント: 生成文数と新規事実の有無に言及する検証側の言い回しが読者向け本文に残っている。

## P3
**判定: ある**
根拠: Record: docs/design/baseten-verification-loop-design-v1.md / loops/loop-016/run-record.md.
コメント: 設計書・実行記録のファイルパスや生成メタ情報が読者向け画面に露出している。

## P4
**判定: ない**
根拠: ない — Pay & Hoursは給与・勤務時間のみでteam/training/benefits/companyを含まない。
コメント: 各見出しの本文は許容キー内に収まり、Bad例のような範囲外混入がない。

## P5
**判定: ある**
根拠: Benefits include Health insurance, 10 paid days from month 7, laptop provided as listed.
コメント: 全体が事実列挙の説明文のみで当事者の lived-voice や生活場面の接地がない。

## P6
**判定: ない**
根拠: [H1] Software Engineer (full-time, SaaS product team) Salary ¥4.8M / year
コメント: ヒーローに役職・雇用形態と第一確認項目の年収が明示されており欠落がない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
