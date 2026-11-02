# Judge (Layer 2 few-shot contrast) — C-B pipeline-gen-005

- source: `previews/case-B-gen-005-complete.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:03:36.800Z
- finished: 2026-11-02T12:04:15.434Z
- attempt: 1
- usage: prompt 4089 / completion 6128 / total 10217 (reasoning: 5641)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、値の再言及は表現を変えた用途別配置である。
コメント: CTAの重複は除外対象であり、仕様書化する同一文の二重掲載は認められない。

## P2
**判定: ある**
根拠: "All sentences below are from generation C-B gen-005 (10 sentences)." / "All conditions above are from the 10 sentences of C-B gen-005. No new facts are added."
コメント: 生成由来と加筆否定の言及は検証側のメタ文であり読者向け条件説明ではない。

## P3
**判定: ある**
根拠: "Generation: loops/loop-016/generations/case-B/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12458 / completion6762 / total19220" / "Record: docs/design/baseten-verification-loop-design-v1.md / loops/loop-016/run-record.md."
コメント: ファイルパスやモデル名やトークン数は内部記録物の露出に該当する。

## P4
**判定: ない**
根拠: ない — Pay & Hoursは給与・勤務時間のみ、Placeは勤務地・交通のみで範囲外事実を含まない。
コメント: 見出しが約束する範囲と本文の事実キーが一致し、ずれは認められない。

## P5
**判定: ある**
根拠: "We offer an annual salary of 5,200,000 JPY." / "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site."
コメント: 全文が説明・列挙調で当事者の体験談や生活場面の声が存在しない。

## P6
**判定: ない**
根拠: "Registered Nurse (full-time, general ward)" / "Day shift 08:30-17:00, 5 days/week; no scheduled night duty" / "Annual 5,200,000 JPY"
コメント: ヒーローに職種・日勤帯・夜勤なし・年収・勤務地が出ており第一確認項目の欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
