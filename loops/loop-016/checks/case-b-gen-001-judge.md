# Judge (Layer 2 few-shot contrast) — C-B gen-001

- source: `previews/case-B-gen-001-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T01:20:01.029Z
- finished: 2026-11-02T01:20:21.758Z
- usage: prompt 4273 / completion 3125 / total 7398 (reasoning: 2755)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- note: Verbatim output below — not summarized. Candidate catalog P1-P5.

---

## P1
**判定: ある**
根拠: "Harborview General Hospital is hiring for Registered Nurse (full-time, general ward) in Yokohama, Minato Mirai area."
コメント: 同一文がThe Basicsでcompany/role/locationに3回反復しS1として再掲される二重掲載で仕様書化しているため。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 検証側の読み方指示と数値不変宣言が読者向け本文に混入しているため。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Licensed nurses seeking stable day-shift roles in urban general hospital."
コメント: 企画ラベルやPersonaやInsightsや〔〕引用やL番号が読者に可視化され内部記録が露出しているため。

## P4
**判定: ある**
根拠: "Benefits include Health insurance, 12 paid days from month 7, childcare support desk on site."
コメント: 見出し[H2] Pay & Hours — Exactly as Statedはpay/workHoursのみが範囲なのにcompany/role/locationやcommuteやteam/trainingやbenefitsが混入し不一致であるため。

## P5
**判定: ある**
根拠: "All conditions above are from the 6 sentences of C-B gen-001. No new facts are added."
コメント: 全体が事実列挙と検証注記のみで当事者の lived-voice や生活場面の接地がなく説明・仕様書文化に終始しているため。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
