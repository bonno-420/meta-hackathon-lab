# Judge (Layer 2 few-shot contrast) — C-F gen-002

- source: `previews/case-F-gen-002-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:19:49.396Z
- finished: 2026-11-02T07:20:09.212Z
- usage: prompt 4482 / completion 3630 / total 8112 (reasoning: 3178)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: 「Crestline Outdoor is hiring a Seasonal Sales Associate (casual, storefront) in Nagoya, Sakae district. 〔company,role,location / L01,L02,L03〕」
コメント: 同一文がThe Basicsのcompany/role/locationで3回反復しPay & HoursのS1にも再掲されており仕様書化に該当する。

## P2
**判定: ある**
根拠: 「What this means: Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs.」
コメント: 検証側のメタ言い回しが読者向け本文に混入しておりP2に該当する。

## P3
**判定: ある**
根拠: 「Target audience (fixed before generation): Students and gap workers seeking short high-energy seasonal stint.」
コメント: 企画ラベルとPersonaやInsights appliedや〔〕引用が読者面に露出しておりP3に該当する。

## P4
**判定: ある**
根拠: 見出し「Pay & Hours — Exactly as Stated」に対し本文「Training includes 1-day orientation + floor buddy week 1. 〔training / L09〕」
コメント: 給与・時間のはずがtraining/perks/company等を含み見出しと中身がずれている。

## P5
**判定: ある**
根拠: 「All sentences below are from generation C-F gen-002 (9 sentences). Each cites its fact keys and source lines verbatim.」
コメント: 全体が事実列挙の説明型で当事者の声や生活場面の接地がなくP5に該当する。

## P6
**判定: ある**
根拠: ヒーロー「Seasonal Sales Associate — 6 Weeks」に対し不足「You will earn Hourly 1,300 JPY.」
コメント: 時給役でtermとpayを先に確認する persona に対しヒーローにpay表示がなく候補欠落に該当する。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
