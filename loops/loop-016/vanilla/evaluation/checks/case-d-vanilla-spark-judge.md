# Judge (Layer 2 few-shot contrast) — C-D vanilla-spark

- source: `vanilla/spark/case-d.html`
- tool: `eval-phase-34-resume.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:06:26.521Z
- finished: 2026-11-02T12:07:02.160Z
- attempt: 1
- usage: prompt 3495 / completion 6044 / total 9539 (reasoning: 5688)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語重複は確認できない
コメント:  payや勤務地の再言及は表現を変えた要約であり、仕様書化する逐語反復には当たらない。

## P2
**判定: ある**
根拠: "Information shown is limited to the facts listed above."
コメント: factsという検証側用語で掲載範囲を弁明しており、読者向けコピーとして不自然である。

## P3
**判定: ない**
根拠: ない — Target audience / Persona / factKeys / sourceLines / 〔〕等の記録ラベルは見当たらない
コメント: ページ可視文に企画・根拠の露出はない。

## P4
**判定: ない**
根拠: ない — 各見出しと本文の対応に scope 外混入はない
コメント: Job Overviewは総括、Commut e / Support & Team / Requirementsは各範囲内の事実のみである。

## P5
**判定: ある**
根拠: "Employer Apex Work Partners (dispatching agency)"
コメント: 全体がラベル値の説明列挙で当事者の声や生活場面の接地がなく、仕様書的である。

## P6
**判定: ない**
根拠: "[H1] Work in Kawaguchi, Saitama. 3–5 days/week, you choose."
コメント: ヒーローにHourly 1,400 JPYとMon–Fri 09:00–17:30等の第一確認項目があり欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
