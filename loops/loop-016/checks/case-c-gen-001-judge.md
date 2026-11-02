# Judge (Layer 2 few-shot contrast) — C-C gen-001

- source: `previews/case-C-gen-001-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T01:20:27.057Z
- finished: 2026-11-02T01:20:48.937Z
- usage: prompt 4329 / completion 3399 / total 7728 (reasoning: 3027)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- note: Verbatim output below — not summarized. Candidate catalog P1-P5.

---

## P1
**判定: ある**
根拠: "Everfield & Co. is hiring a Brand Specialist (12-month fixed-term contract) in Tokyo, Shibuya on a Contract, 12 months basis; apply with one portfolio link."
コメント: 同一文がThe Basicsで4回反復しS1でも再掲され、さらに給与文も2回反復する仕様書化である。

## P2
**判定: ある**
根拠: "What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs."
コメント: 数値厳密性や全文条件化を説く検証側メタ文が読者向け本文に混入している。

## P3
**判定: ある**
根拠: "Target audience (fixed before generation): Mid-career marketers preferring time-boxed contract with renewal checkpoint."
コメント: 企画ラベルやPersona・Insights・〔〕引用とL番号が読者面に露出している。

## P4
**判定: ある**
根拠: "[H2] Pay & Hours — Exactly as Stated 給与・勤務時間は原文のまま" / "You will join a 6-person brand team, reports to Brand Lead."
コメント: 見出しは給与・時間のはずが本文にcompany・contractTerms・team・benefitsが混入し範囲不一致である。

## P5
**判定: ある**
根拠: "Working hours are Mon-Fri, 10:00-19:00, avg 2 days remote/week."
コメント: 全文が事実列挙の説明文のみで当事者の生の声や生活場面の接地がない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
