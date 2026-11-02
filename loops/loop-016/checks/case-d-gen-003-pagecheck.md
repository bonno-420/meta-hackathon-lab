# Page check (Layer 1 rule-based) — C-D gen-003

- source: `loops/loop-016/previews/case-D-gen-003-complete.html`
- tool: `loop16-pagecheck.mjs` v1.1-candidate (T1-T5 + P6) (deterministic, no API)
- date: 2026-11-02T07:35:33.154Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 6 |
| duplicate occurrences total | 16 |
| verification phrase groups | 2 |
| verification hits total | 2 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)

> 意図的再掲との仕分けは後段に任せ、まず全部出す

### [1] count=3 — `client distribution center in saitama, kawaguchi`

- example: Client distribution center in Saitama, Kawaguchi
- occurrences:
  - `header` / “Warehouse Associate (picking and packing)” — Client distribution center in Saitama, Kawaguchi
  - `about` / “The Basics 募集の基本” — Client distribution center in Saitama, Kawaguchi
  - `check` / “Check Before You Apply 応募前の確認” — Client distribution center in Saitama, Kawaguchi

### [2] count=3 — `warehouse associate (picking and packing)`

- example: Warehouse Associate (picking and packing)
- occurrences:
  - `header` / “Warehouse Associate (picking and packing)” — Warehouse Associate (picking and packing)
  - `about` / “The Basics 募集の基本” — Warehouse Associate (picking and packing)
  - `check` / “Check Before You Apply 応募前の確認” — Warehouse Associate (picking and packing)

### [3] count=3 — `dispatched (agency employed, client site)`

- example: Dispatched (agency employed, client site)
- occurrences:
  - `header` / “Warehouse Associate (picking and packing)” — Dispatched (agency employed, client site)
  - `about` / “The Basics 募集の基本” — Dispatched (agency employed, client site)
  - `check` / “Check Before You Apply 応募前の確認” — Dispatched (agency employed, client site)

### [4] count=3 — `apex work partners (dispatching agency)`

- example: Apex Work Partners (dispatching agency)
- occurrences:
  - `header` / “Warehouse Associate (picking and packing)” — Apex Work Partners (dispatching agency)
  - `about` / “The Basics 募集の基本” — Apex Work Partners (dispatching agency)
  - `check` / “Check Before You Apply 応募前の確認” — Apex Work Partners (dispatching agency)

### [5] count=2 — `0, no text in image`

- example: 0, no text in image
- occurrences:
  - `conditions` / “Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま” — 0, no text in image
  - `location` / “Place &amp; Access 勤務地” — 0, no text in image

### [6] count=2 — `hourly 1,400 jpy`

- example: Hourly 1,400 JPY
- occurrences:
  - `header` / “Warehouse Associate (picking and packing)” — Hourly 1,400 JPY
  - `about` / “The Basics 募集の基本” — Hourly 1,400 JPY

## 2) 検証側定型文の辞書ヒット

- **"All conditions above are from the"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …gency employed, client site) All conditions above are from the 11 sentences of C-D gen-003.…
- **"No new facts are added"** (EN, CTA block) — 1 hit(s)
  - `check` / “Check Before You Apply 応募前の確認” — …11 sentences of C-D gen-003. No new facts are added. Register with agency - site…

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ (heading vs factKeys)

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `header` | Warehouse Associate (picking and packing) | (none) |
| `about` | The Basics 募集の基本 | (none) |
| `conditions` | Pay &amp; Hours — Exactly as Stated 給与・勤務時間は原文のまま | (none) |
| `location` | Place &amp; Access 勤務地 | (none) |
| `team` | Team &amp; Support チーム・サポート | (none) |
| `check` | Check Before You Apply 応募前の確認 | (none) |
| `lp-memo` | Memo このLPへのメモ（ブラウザ保存） | (none) |

(no mismatch under current scope rules)

## 5) Hero P6 — first-check item in hero (candidate)

> note: candidate — permanence requires owner approval

- case: C-D — expected label: **Apex Work Partners + Saitama Kawaguchi**
- verdict: **PRESENT** ✅ — hero contains first-check item
- hero text excerpt (first 400 chars):

  > Dispatched (agency employed, client site) · Client distribution center in Saitama, Kawaguchi Warehouse Associate (picking and packing) State employer (agency) and worksite (client) separately; shift predictability first. — Apex Work Partners (dispatching agency) · Client distribution center in Saitama, Kawaguchi · Dispatched (agency employed, client site) This is a fictional posting for Dispatched

- checks:
  - pattern `/Apex Work Partners/i` — FOUND ✅ — …shift predictability first. — Apex Work Partners (dispatching agency) · Client d…
  - pattern `/Saitama/i` — FOUND ✅ — …Client distribution center in Saitama, Kawaguchi Warehouse Associate (picking an…
- missing: (none)

---

*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*
