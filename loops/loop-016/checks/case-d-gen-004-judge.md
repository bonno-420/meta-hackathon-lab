# Judge (Layer 2 few-shot contrast) — C-D gen-004

- source: `previews/case-D-gen-004-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T10:59:37.598Z
- finished: 2026-11-02T11:00:07.689Z
- usage: prompt 4171 / completion 5208 / total 9379 (reasoning: 4711)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ある**
根拠: "You will be employed by Apex Work Partners (dispatching agency) on a Dispatched (agency employed, client site) basis."
コメント: 同一文がPay & HoursとPlace & Accessに逐語で重複し、You will work at the Client distribution center〜もPlace & AccessとTeam & Supportで重複するため仕様書化に該当する。

## P2
**判定: ある**
根拠: "All sentences below are from generation C-D gen-004 (9 sentences)." / "All conditions above are from the 9 sentences of C-D gen-004. No new facts are added."
コメント: 生成文管理側の来歴と言い訳が読者向け本文に混入しており検証側メタ文に該当する。

## P3
**判定: ない**
根拠: ない — Target audience、Persona、Insights applied、factKeys、sourceLines、〔〕、L01等の企画ラベルが可視テキストに存在しない。
コメント: GenerationやRecordのフッタ注記はあるが定義上の企画ラベル露出には当たらない。

## P4
**判定: ある**
根拠: 見出し "Pay & Hours — Exactly as Stated" に対し本文 "You will be employed by Apex Work Partners (dispatching agency) on a Dispatched (agency employed, client site) basis."
コメント: 見出しの許容範囲はpay・hoursだがemployer・employment typeが混入し、Place & AccessやTeam & Supportでも同様の範囲外混入がある。

## P5
**判定: ある**
根拠: "You will earn Hourly 1,400 JPY for time worked on assignment." / "Support is provided by an Agency coordinator on site twice/week + phone support on shift days."
コメント: 全文が説明・仕様調で当事者の体験談や生活場面の声がなく説明文化のみである。

## P6
**判定: ない**
根拠: ヒーロー "[H1] Warehouse Associate (picking and packing)" 直下に "Hourly 1,400 JPY" を含む。
コメント: 時給制ディスパッチ職の第一確認項目である時給がヒーローに表示されているため欠落はない。


---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
