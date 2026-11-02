# Judge (Layer 2 few-shot contrast) — C-D gen-003

- source: `previews/case-D-gen-003-complete.html`
- tool: `loop16-judge.mjs` (Meta枠, Baseten枠に含めない)
- model: muse-spark-1.3-contributor
- date: 2026-11-02
- started: 2026-11-02T07:40:05.136Z
- finished: 2026-11-02T07:40:42.050Z
- usage: prompt 4087 / completion 6283 / total 10370 (reasoning: 5860)
- keySource: env:MODEL_API_KEY (値は記録しない)
- pairs: checks/pairs/*.md
- pairsStatus: candidate
- catalog: P1-P6 (P6 candidate — permanence requires owner approval)
- note: Verbatim output below — not summarized. Candidate catalog P1-P6.

---

## P1
**判定: ない**
根拠: ない — 同一文の逐語反復はなく、The Basicsはkey-value、本文は別文型で重複なし。
コメント: intra-factsの3連複文やfacts↔本文の二重掲載に該当する逐語一致は認められない。

## P2
**判定: ある**
根拠: All conditions above are from the 11 sentences of C-D gen-003. No new facts are added.
コメント: 生成文管理側の言い回しが読者向け本文に混入している。

## P3
**判定: ある**
根拠: Generation: loops/loop-016/generations/case-D/gen-003.json · model meta-models/muse-spark-open-1026 · prompt6669 / completion3759 / total10428
コメント: 生成ファイル・モデル・トークン数という内部記録物が読者に露出している。

## P4
**判定: ある**
根拠: [H2] Team & Support — 許容team/supportに対し想定外role/requirementsを含む: You will work as Warehouse Associate (picking and packing).
コメント: 見出しの範囲を超えたrole文が混入し、Pay & HoursにもThis position is Dispatched (agency employed, client site).が含まれる。

## P5
**判定: ある**
根拠: You will earn Hourly 1,400 JPY.
コメント: 全文がYou will/can型の説明文で当事者の声や生活場面の接地がなく仕様書的である。

## P6
**判定: ない**
根拠: Apex Work Partners (dispatching agency) · Client distribution center in Saitama, Kawaguchi · Dispatched (agency employed, client site) / Hourly 1,400 JPY
コメント: 時給派遣の第一確認項目であるpayと派遣元・勤務先分離がヒーローに出ている。

---

## 原文の扱い

- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。
