# Judge (Layer 2 few-shot contrast) — C-B gen-004

- source: `previews/case-B-gen-004-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T10:58:18.141Z
- finished: 2026-11-02T10:58:54.784Z
- usage: prompt 4084 / completion 5761 / total 9845 (reasoning: 5374)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、Basicsは値のみで本文文との二重掲載がない。
コメント: 数値フレーズの再利用はあるが仕様書化する同一文反復には当たらない。

## P2
**判定: ある**
根拠: All conditions above are from the 10 sentences of C-B gen-004. No new facts are added.
コメント: 読者向け条件ではなく生成文管理側の自己言及が表示されている。

## P3
**判定: ある**
根拠: Generation: loops/loop-016/generations/case-B/gen-004.json · model meta-models/muse-spark-open-1026 · prompt12458 / completion6762 / total19220
コメント: ファイルパスやモデル名など内部記録物が読者面に露出している。

## P4
**判定: ない**
根拠: ない — Pay & Hoursは給与・勤務時間のみで構成されている。
コメント: 見出しが約束する範囲外のteam/training/benefits混入は見られない。

## P5
**判定: ある**
根拠: We offer an annual salary of 5,200,000 JPY.
コメント: 全体が説明・列挙調で当事者の声や生活場面の描写がない。

## P6
**判定: ない**
根拠: ない — ヒーローに Registered Nurse (full-time, general ward) / Day shift 08:30-17:00, 5 days/week; no scheduled night duty / Annual 5,200,000 JPY がある。
コメント: 給与・勤務帯など第一確認項目がヒーローに含まれ欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
