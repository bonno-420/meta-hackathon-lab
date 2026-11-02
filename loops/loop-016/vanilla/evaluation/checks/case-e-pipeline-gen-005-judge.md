# Judge (Layer 2 few-shot contrast) — C-E pipeline-gen-005

- source: `previews/case-E-gen-005-complete.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:08:54.799Z
- finished: 2026-11-02T12:09:27.718Z
- attempt: 1
- usage: prompt 4103 / completion 6367 / total 10470 (reasoning: 5981)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ある**
根拠: "From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00"
コメント: 同一文言がヒーロー・基本表・Pay & Hours・確認欄に逐語反復され仕様書化しているため該当する。

## P2
**判定: ある**
根拠: "All conditions above are from the 9 sentences of C-E gen-005. No new facts are added."
コメント: 読者向け条件ではなく生成文の由来と無加筆を弁明する検証側メタ文であるため該当する。

## P3
**判定: ある**
根拠: "Record: docs/design/baseten-verification-loop-design-v1.md / loops/loop-016/run-record.md."
コメント: 読者に不要な内部ファイルパスと生成記録が露出しているため該当する。

## P4
**判定: ない**
根拠: ない
コメント: Pay & Hoursは給与・勤務時間のみでチーム・研修・福利厚生を含まず見出しと一致しているため非該当である。

## P5
**判定: ある**
根拠: "- Training includes 3-day onboarding with buddy; no experience required."
コメント: 全文が説明・列挙調で当事者の体験談や場面描写が一切なく説明文化のみのため該当する。

## P6
**判定: ない**
根拠: "[H1] Cafe Crew (part-time, short hours) Work hours From 3h/day · 2-4 days/wk"
コメント: 短時間パートの第一確認項目である時間帯と時給がヒーロー内に既示されているため非該当である。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
