# Page check (Layer 1 adapted) — C-B vanilla-wonder

- source: `vanilla/wonder/case-b.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:22.837Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=5, hasHero=false, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 1 |
| duplicate occurrences total | 2 |
| verification phrase groups | 0 |
| verification hits total | 0 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 1 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `yokohama, minato mirai area`

- example: Yokohama, Minato Mirai area
- occurrences:
  - `location` / "Minato Mirai, 8 minutes from the station." — Yokohama, Minato Mirai area
  - `details` / "Everything in the posting, in one place." — Yokohama, Minato Mirai area

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `schedule` | Your day ends at 17:00. | (none) |
| `ward` | A defined team. Structured learning. | (none) |
| `location` | Minato Mirai, 8 minutes from the station. | (none) |
| `benefits` | Support, stated clearly. | (none) |
| `details` | Everything in the posting, in one place. | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-B — expected label: **Day shift 08:30-17:00**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Registered Nurse — Harborview General Hospital | Yokohama ✚ Harborview General Hospital Yokohama · Minato Mirai Schedule Ward & Training Location Benefits Full Details Review the Role ↓ Now Hiring · Full-Time · Permanent Daytime nursing, on a steady rhythm. Registered Nurse (full-time, general ward) at Harborview General Hospital in Yokohama, Minato Mirai area — day shift only, with no scheduled n

- checks:
  - pattern `/08:30-17:00/i` — NOT FOUND
  - pattern `/Day shift/i` — FOUND — …Yokohama, Minato Mirai area — day shift only, with no scheduled night duty. See…
- missing patterns: /08:30-17:00/i

---

*Candidate — permanence requires owner approval.*
