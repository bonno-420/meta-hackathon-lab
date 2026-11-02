# Page check (Layer 1 adapted) — C-A vanilla-wonder

- source: `vanilla/wonder/case-a.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:22.661Z
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
| hero P6 missing patterns | 1 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `osaka, umeda district`

- example: Osaka, Umeda district
- occurrences:
  - `glance` / "Everything stated, in one place." — Osaka, Umeda district
  - `benefits` / "Clear pay. Stated benefits." — Osaka, Umeda district

### [2] count=2 — `employment type`

- example: Employment type
- occurrences:
  - `glance` / "Everything stated, in one place." — Employment type
  - `benefits` / "Clear pay. Stated benefits." — Employment type

### [3] count=2 — `annual salary`

- example: Annual salary
- occurrences:
  - `glance` / "Everything stated, in one place." — Annual salary
  - `benefits` / "Clear pay. Stated benefits." — ANNUAL SALARY

### [4] count=2 — `work hours`

- example: Work hours
- occurrences:
  - `glance` / "Everything stated, in one place." — Work hours
  - `benefits` / "Clear pay. Stated benefits." — Work hours

### [5] count=2 — `annual 4,800,000 jpy`

- example: Annual 4,800,000 JPY
- occurrences:
  - `benefits` / "Clear pay. Stated benefits." — Annual 4,800,000 JPY
  - `benefits` / "Clear pay. Stated benefits." — Annual 4,800,000 JPY

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `glance` | Everything stated, in one place. | (none) |
| `working` | Mon–Fri, with a clear flex core in the middle. | (none) |
| `location` | Umeda, five minutes from the station. | (none) |
| `team` | 8 people. One product team. | (none) |
| `onboarding` | 3 months, with a mentor beside you. | (none) |
| `benefits` | Clear pay. Stated benefits. | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-A — expected label: **Annual 4,800,000 JPY**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > ```html Software Engineer — Northbridge Labs | Osaka, Umeda N Northbridge Labs At a glance Working hours Location Team Onboarding Benefits Fictitious posting Northbridge Labs • Osaka, Umeda district Software Engineer SaaS product team. A full-time, permanent role in Umeda — with a dedicated mentor, weekly code review, and an 8-person product team around you from the start. ¥4,800,000 / year Full-t

- checks:
  - pattern `/4,?800,?000/i` — FOUND — …m around you from the start. ¥4,800,000 / year Full-time (permanent) Mon–Fri · 1…
  - pattern `/Annual/i` — NOT FOUND
- missing patterns: /Annual/i

---

*Candidate — permanence requires owner approval.*
