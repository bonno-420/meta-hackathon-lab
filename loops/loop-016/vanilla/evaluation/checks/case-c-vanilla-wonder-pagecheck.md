# Page check (Layer 1 adapted) — C-C vanilla-wonder

- source: `vanilla/wonder/case-c.html`
- tool: `eval-phase-012.mjs phase2` v1.1-candidate adapted (deterministic, no API)
- date: 2026-11-02T11:57:23.045Z
- dict: verification 13 / recordLabels 16 / headingScope 7 / heroP6 6 (candidate)
- applicability: sections=5, hasHero=false, headingApplicable=false

## Summary

| metric | value |
|---|---|
| duplicate groups (≥2) | 3 |
| duplicate occurrences total | 6 |
| verification phrase groups | 0 |
| verification hits total | 0 |
| record-exposure groups | 0 |
| record-exposure hits | 0 |
| heading mismatch sections | 0 |
| hero P6 present | 1 |
| hero P6 missing patterns | 0 |

## 1) 重複文 (normalized, count≥2)

### [1] count=2 — `tokyo, shibuya`

- example: Tokyo, Shibuya
- occurrences:
  - `details` / "Everything stated, in one place." — Tokyo, Shibuya
  - `section-no-id` / "A weekday rhythm, based in Shibuya." — Tokyo, Shibuya

### [2] count=2 — `contract terms`

- example: Contract Terms
- occurrences:
  - `details` / "Everything stated, in one place." — Contract Terms
  - `section-no-id` / "12 months, with clear milestones." — Contract Terms

### [3] count=2 — `10 paid days`

- example: 10 paid days
- occurrences:
  - `section-no-id` / "12 months, with clear milestones." — 10 paid days
  - `section-no-id` / "What is listed in the posting." — 10 paid days

## 2) 検証側定型文の辞書ヒット

(none)

## 3) 記録物ラベルの露出

(none)

## 4) 見出しと中身のずれ

All sections factKeys table:

| sectionId | heading | foundKeys |
|---|---|---|
| `details` | Everything stated, in one place. | (none) |
| `section-no-id` | A weekday rhythm, based in Shibuya. | (none) |
| `section-no-id` | 12 months, with clear milestones. | (none) |
| `section-no-id` | What is listed in the posting. | (none) |
| `section-no-id` | Frequently asked questions | (none) |

(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)

## 5) Hero P6 — first-check item in hero (candidate)

- case: C-C — expected label: **Contract 12 months**
- verdict: **PRESENT** — no hero tag — used fallback (vanilla structure may differ)
- hero text excerpt (400 chars):

  > Everfield & Co. — Brand Specialist | Tokyo, Shibuya E Everfield & Co. Tokyo, Shibuya • Contract, 12 months Now hiring — 12-month contract Brand Specialist in Shibuya. A 12-month fixed-term contract with Everfield & Co. in Tokyo, Shibuya — joining a 6-person brand team, reporting to the Brand Lead, with ownership of 2 launches. Monthly 380,000 JPY Mon-Fri, 10:00-19:00 Avg 2 days remote / week Clear

- checks:
  - pattern `/12 months/i` — FOUND — …o. Tokyo, Shibuya • Contract, 12 months Now hiring — 12-month contract Brand Spe…
  - pattern `/Contract/i` — FOUND — …rfield & Co. Tokyo, Shibuya • Contract, 12 months Now hiring — 12-month contract…
- missing: (none)

---

*Candidate — permanence requires owner approval.*
