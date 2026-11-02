# E01 参照セット提案 (FICT-J01) — 承認記録フォーマット (design §4)

## 企画への参照

- Target layer / persona / appeal: E01 generates a fictional job-ad text from FICT-J01. Target layer: inexperienced applicants concerned about reassurance (未経験への安心) and readers wanting an income outlook (収入の見通し). Appeal: reassurance + income outlook with unstated items shown only as not stated.
- Original version: FICT-J01 v1 (`src/fict-j01-v1.json`) with fixed FACT v1 (`src/facts/FICT-J01-facts-v1.json`), approval FICT-J01-approval-1.
- **E01's generation facts come only from `src/fict-j01-v1.json` and `src/facts/FICT-J01-facts-v1.json`.** Pattern slots add sentence shape only; they never supply facts or numbers.

## 提案内容

Proposed reference set (catalog ID + version list):

1. LIB-PAT-001 v1 （安心導入型) — reason: FICT-J01's target layer includes inexperienced applicants; the pattern's 導入→条件→場面→締め composition fits, and its scene slot condition (support/training only when a FACT states it) matches FICT-J01, which states no training/support fact.
2. LIB-PAT-002 v1 （条件先行・試算明示型) — reason: FICT-J01 states an hourly wage (1,500 yen) plus an explicit trial-calculation assumption (L04: 月20日勤務は試算用の仮定) and an explicit non-guarantee of monthly income (L03); the pattern's assumption-stays-assumption slot condition directly fits these applicable conditions.
3. LIB-PAT-004 v1 （未記載明示・締め型) — reason: FICT-J01 contains unstated items (renewal L02, housing L06); the pattern's unstated-shown-only-as-unstated slot fits the applicable condition of accurate-condition seekers.

Why LIB-PAT-003 v1 is NOT proposed for E01: E01's FACT v1 states work hours (09:00–18:00) but provides no stated basis for a life-scene translation beyond those hours (no drop-off/pick-up, routine, or household facts). Including it risks adding expression without factual support, violating the translation slot's own condition (no new factual conditions).

## 判断

- 判断: **修正して承認**
- 日時: 2026-10-29
- 判断者: 本人
- 承認する範囲:
  - 型4件（LIB-PAT-001〜004 v1）の目録登録を承認する（003 は登録のみ、E01 では使わない）
  - E01 の参照セット（001＋002＋004）を承認する。対象層に未経験層を含める前提も承認する

## 修正理由

- 本人の言葉（そのまま）: 「月収は保証しないなどの表現をもうちょっと柔らかくしよう。実際の収入は勤務日数や残業の増減などで変動します。とか」
- 扱い（統括による）: FACT v1 は変更しない。生成文での試算の注記は、「保証しない」という言い切りではなく、収入が勤務日数や残業の増減などで変動するという事実の述べ方にする。試算であり保証ではないという意味自体は変えない

## 会話への参照

- This request via the coordinator (loop-012 implementation brief). Turn count: n/a (record-based proposal).
- 承認は統括経由で制作ラインに伝えられた（2026-10-29、修正して承認）。

## Pattern-registration approval (requested together)

- The 4 patterns (LIB-PAT-001..004 v1) are candidates until approved (design §2 step 5 / D8). Registration approval is requested together with this reference-set proposal.
- 承認後の扱い: 型4件は登録済みとした（`library/catalog-v1.json` の pattern status を更新）。採用した型（001・002・004）の最終利用日は 2026-10-29 に更新した。003 は登録のみで最終利用日は更新しない
- **No generation before approval.**（本承認を得てから手順3に進んだ）
