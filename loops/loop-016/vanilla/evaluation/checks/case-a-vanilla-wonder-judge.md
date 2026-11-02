# Judge (Layer 2 few-shot contrast) — C-A vanilla-wonder

- source: `vanilla/wonder/case-a.html`
- tool: `eval-phase-34.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T12:00:11.326Z
- finished: 2026-11-02T12:00:42.328Z
- usage: prompt 4123 / completion 4644 / total 8767 (reasoning: 4299)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、各事実は用途別に言い換えて配置されている。
コメント: Full postingの箇条書きと本文セクションは重複せず畳まれているため仕様書化に該当しない。

## P2
**判定: ある**
根拠: All facts above are the only stated facts.
コメント: 検証側の限定宣言が読者向けコピーに残存しておりメタ文混入に該当する。

## P3
**判定: ない**
根拠: ない — Target audience / Persona / factKeys / sourceLines / 〔〕引用等の企画ラベルは表示されていない。
コメント: 可視テキストに内部記録物の露出は認められない。

## P4
**判定: ない**
根拠: ない — Working patternは勤務時間のみ、Location & commuteは立地・通勤のみ等、各見出しは範囲内の事実のみを含む。
コメント: Salary & benefits内のFull-time表記はGood例と同様の文脈表示で範囲外混入ではない。

## P5
**判定: ない**
根拠: You won’t be left to figure it out alone.
コメント: 二人称のシナリオ接地があり完全な説明・仕様書型ではない。

## P6
**判定: ない**
根拠: ¥4,800,000 / year
コメント: ヒーローに年収・雇用形態・時間・立地が含まれ第一確認項目の欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
