# Judge (Layer 2 few-shot contrast) — C-E gen-003

- source: `previews/case-E-gen-003-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:38:33.111Z
- finished: 2026-11-02T07:39:13.721Z
- usage: prompt 4115 / completion 6216 / total 10331 (reasoning: 5819)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "Morningside Coffee is hiring Cafe Crew (part-time, short hours) in Setagaya, Futako-Tamagawa."
コメント: 同一文がPlace & AccessとTeam & Supportに逐語で2回出現し二重掲載に該当するため。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-E gen-003. No new facts are added."
コメント: 読者向け条件ではなく生成文管理側の自己言及であり検証側メタ文の混入に該当するため。

## P3
**判定: ある**
根拠: "- company Morningside Coffee"
コメント: company等のfactKeysラベルが読者向け本文にそのまま露出しているため。

## P4
**判定: ある**
根拠: 見出し "[H2] Team & Support チーム・サポート" に対して本文 "Morningside Coffee is hiring Cafe Crew (part-time, short hours) in Setagaya, Futako-Tamagawa."
コメント: 見出しの想定はteam/training/benefitsだが本文にcompany/role/locationが混入し範囲外のため。

## P5
**判定: ある**
根拠: "You will earn Hourly 1,250 JPY."
コメント: 全文が説明・仕様列挙型で当事者の体験談や場面接地の声が一切ないため。

## P6
**判定: ない**
根拠: "[H1] Cafe Crew (part-time, short hours)"
コメント: ヒーローに時間帯「From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00」と駅近が明示され第一確認項目の欠落がないため。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
