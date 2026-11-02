# Page check (Layer 1 adapted) — C-D vanilla-wonder

- source: `vanilla/wonder/case-d.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:23.216Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=6, hasHero=false, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 5 |
| duplicate occurrences total | 10 |
| verification phrase groups | 0 |
| verification hits total | 0 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `work hours`

- example: Work Hours
- occurrences:
  - `schedule` / "Choose 3–5 days a week, Monday to Friday" — Work Hours
  - `details` / "All stated facts, in one place" — Work Hours

### [2] count=2 — `client distribution center`

- example: Client distribution center
- occurrences:
  - `commute` / "In Kawaguchi, with a shuttle from the station" — Client distribution center
  - `how` / "Dispatched: employed by Apex, working at the client site" — Client Distribution Center

### [3] count=2 — `employment type`

- example: Employment Type
- occurrences:
  - `how` / "Dispatched: employed by Apex, working at the client site" — Employment Type
  - `details` / "All stated facts, in one place" — Employment Type

### [4] count=2 — `dispatched (agency employed, client site)`

- example: Dispatched (agency employed, client site)
- occurrences:
  - `how` / "Dispatched: employed by Apex, working at the client site" — Dispatched (agency employed, client site)
  - `details` / "All stated facts, in one place" — Dispatched (agency employed, client site)

### [5] count=2 — `requirements`

- example: Requirements
- occurrences:
  - `details` / "All stated facts, in one place" — Requirements
  - `section-no-id` / "What is listed in the posting" — Requirements

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `role` | Picking and packing, as part of a team of 10 | (none) |
| `schedule` | Choose 3–5 days a week, Monday to Friday | (none) |
| `commute` | In Kawaguchi, with a shuttle from the station | (none) |
| `how` | Dispatched: employed by Apex, working at the client site | (none) |
| `details` | All stated facts, in one place | (none) |
| `section-no-id` | What is listed in the posting | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-D — expected label: **Apex Work Partners + Saitama Kawaguchi**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Warehouse Associate — Kawaguchi, Saitama | Apex Work Partners A APEX Work Partners The Role Schedule Commute Support Full Details View Details Dispatched Role • Kawaguchi, Saitama Warehouse Associate Picking & Packing Work at a client distribution center in Kawaguchi, employed by Apex Work Partners — with a shuttle from Kawaguchi Station and support on site. Hourly Pay ¥1,400 / hour Mon–Fri, 09:00

- checks:
  - pattern `/Apex Work Partners/i` — FOUND — …ociate — Kawaguchi, Saitama | Apex Work Partners A APEX Work Partners The Role S…
  - pattern `/Saitama/i` — FOUND — …ehouse Associate — Kawaguchi, Saitama | Apex Work Partners A APEX Work Partners…
- missing: (none)

---

*Candidate — permanence requires owner approval.*
