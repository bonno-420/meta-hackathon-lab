# 型への抽象化の記録 (loop-012, procedure 2)

- Date: 2026-10-29
- Source batch: LIB-BATCH-001 (`library/collection-batch-v1.json`)
- Status of all patterns: **candidate (pending registration approval)**. Not usable for generation until the person approves (design §2 step 5 / D8).
- Verification plan: after approval, trial generation against fictional FACT (procedure 3, gated) combined with the existing conformance re-verification; then procedure 4 prose evaluation by Wonder.

## LIB-PAT-001 v1 安心導入型

- Source cases: LIB-CASE-001 (fictional bakery morning shift) + LIB-CASE-005 (fictional assembly work).
- Common sequence kept: 導入 (target-layer address) → 条件 → 働く場面 → 締め (invitation to visit/apply).
- Variable parts turned into slots: 導入枠 (target layer only, no facts/numbers), 条件枠 (FACT-stated conditions only), 場面枠 (scene within stated facts; support/training mentioned only when a FACT states it), 締め枠 (invitation only, no new facts).
- Specific expressions/numbers removed: employer names （架空ベーカリーあさいろ, 架空組立工房そらまめ), wages (950 yen, 1,000 yen), hours (06:00-10:00, 09:00-17:00), and case-specific phrasing （包みの手順, 手順書に沿って). None remain in the pattern record.
- License: 登録可 (all origins self-authored fiction; per-origin summaries in catalog).

## LIB-PAT-002 v1 条件先行・試算明示型

- Source cases: LIB-CASE-002 (fictional warehouse picking) + LIB-CASE-004 (fictional retail night shift).
- Common sequence kept: 条件 first → 試算 with assumption stated (C002 only; C004 contributes conditions-first + scene) → 場面 → 締め.
- Variable parts turned into slots: 条件枠, 試算枠 (assumptions stay assumptions; never presented as guaranteed monthly income; unstated allowances excluded), 場面枠, 締め枠.
- Specific expressions/numbers removed: employer names （架空物流センターみどり野, 架空ストアよるひかり), wages (1,100 yen, 1,300 yen), the trial figure 123,200 yen and its formula, hours, and case-specific phrasing （台車を使って棚へ, 黙々と棚を整える). None remain in the pattern record.
- License: 登録可 (all origins self-authored fiction; per-origin summaries in catalog).

## LIB-PAT-003 v1 生活翻訳型

- Source cases: LIB-CASE-003 (fictional care-support work) + LIB-CASE-001 (morning-routine translation element).
- Common sequence kept: 対象層 address → 時間条件 → 生活の言葉への翻訳 → 締め.
- Variable parts turned into slots: 対象層枠, 時間条件枠 (stated time conditions only), 翻訳枠 (rewording of conditions only; must not add new factual conditions or out-of-range scenes), 締め枠.
- Specific expressions/numbers removed: facility names, hours (09:00-15:00, 06:00-10:00), wage (1,050 yen), and case-specific life language （お迎えの時間, 朝の支度). None remain in the pattern record.
- License: 登録可 (all origins self-authored fiction; per-origin summaries in catalog).

## LIB-PAT-004 v1 未記載明示・締め型

- Source cases: LIB-CASE-002 + LIB-CASE-005 (both contain an item stated as not stated).
- Common sequence kept: 条件 → 未記載の明示 → 締め.
- Variable parts turned into slots: 条件枠 (stated conditions only), 未記載明示枠 (unstated items shown only as not stated; no assertion or speculation), 締め枠 (invitation to confirm; no new facts).
- Specific expressions/numbers removed: the concrete unstated items （夜勤手当, 昇給), employer names, wages, hours. None remain in the pattern record.
- License: 登録可 (all origins self-authored fiction; per-origin summaries in catalog).

## Copy-check note

- Registration copy check (design §2) is recorded in `loops/loop-012/copy-check-v1.json` (U1 material format): concrete string-overlap method, per pattern-case pair results, thresholds undecided — judgment material, not a pass/fail gate.
- Patterns contain no verbatim case sentences by construction (abstract wording; case-specific nouns/numbers/phrasing removed as listed above).
