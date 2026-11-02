# loop-012 実行記録: ライブラリ最小実装 procedures 1-2（承認ゲートまで）

- Date: 2026-10-29
- Starting HEAD: `23dcf73325c9d53e5cbffa2a8e1e10361b3670d4` (verified via `git rev-parse HEAD` at start and end)
- Status: **stopped at the procedure-2 approval gate, awaiting the person.** No generation performed.

## Purpose and scope

- Minimal implementation of the library-utilization design (`docs/design/library-utilization-design-draft.md`), procedures 1–2 only: collection batch + abstraction + catalog (candidates) + hold-area format + registration copy check + E01 reference-set proposal.
- Placement U4案A: repository-root `library/` for catalog, hold area, and collection batch records; loop records in `loops/loop-012/` referenced by batch ID and catalog IDs.
- Out of scope (not done): procedure 3 typed generation (gated by the person's approval), procedure 4 prose evaluation, incorporation into the main path.

## Inputs

- Canonical design: `docs/design/library-utilization-design-draft.md` (§1–§4, §5 input layers, minimal scope).
- Implementation brief (attached; loop number loop-012 verified as next: `loops/` contained loop-002..loop-011, no loop-012).
- E01 reference: `src/fict-j01-v1.json` (FICT-J01 v1), `src/facts/FICT-J01-facts-v1.json` (fixed FACT v1), approval FICT-J01-approval-1.
- Constraints obeyed: no commits/pushes, no live API calls, no generation, no modification of any existing `src/` file or existing `loops/` record.

## Wonder / Spark division and models

- Wonder: case and pattern design (the 5 fictional cases and 4-pattern set as specified in the brief; pattern set not redesigned).
- Spark implementation worker (`meta/muse-spark-1.3`, this session): wrote the 7 files below exactly per the brief/design, computed the copy check locally.

## What was created (only these; all new, no existing file touched)

1. `library/collection-batch-v1.json` — LIB-BATCH-001: population definition (hand-authored fictional cases; real companies/persons/contacts/real ad text excluded), density estimate recorded honestly as not-applicable-to-searching (hand-authored, no trial-search counts invented), source (production-line authored, specified input only), date 2026-10-29, counts (created 5, kept as candidates 5), exclusion record (none, with reason), 5 cases with structured extraction (conditions with source positions S1.., appeal, composition, other material) + full fictional case text, each with license declaration + confirmation.
2. `library/catalog-v1.json` — 4 pattern records (LIB-PAT-001..004 v1) as candidates: id, kind （文章の型）, purpose, applicable conditions (all 6 axes), license summary PER ORIGIN CASE (listed per case, never collapsed — O1), origins (batch ID + case IDs), version, registered date 2026-10-29, last used null, license status 登録可, pattern status candidate, per-origin-case statuses (O2 provisional form), circulation reference (out of minimal scope; no count; not approval evidence), composition + slots (each slot states what may enter and its condition; no case numbers/proper nouns/unique phrasing remain).
3. `library/hold-v1.json` — hold-area format only: state transition from design §3, empty items, note that no real held items were created in this scope.
4. `loops/loop-012/type-abstraction.md` — per pattern: source cases, common sequence kept, variable parts as slots, removed specifics, candidate status, verification plan (trial vs fictional FACT in procedure 3 after approval).
5. `loops/loop-012/copy-check-v1.json` — U1 material format: concrete method (pattern descriptive text = purpose + composition + slots concatenated; metrics = LCS length in chars + distinct shared 8-grams), per-pair results (20 pairs), thresholds-undecided note (judgment material, not pass/fail).
6. `loops/loop-012/reference-set-proposal.md` — E01 (FICT-J01) proposal in design §4 format: plan reference (FACT-only generation facts), proposed set LIB-PAT-001 v1 + LIB-PAT-002 v1 + LIB-PAT-004 v1 with applicable-condition reasons, LIB-PAT-003 exclusion reason (no stated life-scene basis beyond work hours in FACT v1), judgment/correction/conversation sections (judgment left blank for the person), pattern-registration approval requested together, no-generation-before-approval statement, last-used-date update on adoption.
7. This run record.

## Copy-check summary

- 20 pattern–case pairs computed locally (Node.js one-off in temp dir; no script added to `src/`; no API calls).
- Result: longest common substring 2–6 chars (short generic fragments only), shared substrings of length ≥ 8: **0 in all pairs**. No verbatim case sentence, proper noun, number, or distinctive phrasing remains in any pattern. Detail in `copy-check-v1.json`. Thresholds undecided (U1) — material for the person's judgment, not a gate.

## Costs

- No API calls of any kind (no live generation, no model API). $0.
- OpenCode session usage unrecorded (no per-session metering available; do not estimate — L-012 convention).

## Self-check

- All 4 JSON files parse (`node` JSON.parse check — OK for each).
- `git status --porcelain` shows no `M` (modified) entries: no existing file was modified. Only untracked additions: `library/`, `loops/loop-012/` (plus pre-existing untracked items `docs/design/demo-rehearsal-01*`, design review docs, and `step6-stage1-drafts-20261028.zip`, which predate this work and were left untouched).
- Existing offline test suites not run: no `src/` or existing file was changed, so there is nothing to re-verify; running them is deferred to post-approval procedure 3 (existing re-verification).
- No typed-generation code or prompt created. No commit/push performed.

## Next steps (after the person's approval)

1. Procedure 3: typed generation as a NEW prompt version (existing path untouched), E01 with the approved reference set, FACT-only inputs.
2. Existing re-verification (conformance audit) on the generated text.
3. Post-generation copy check (design §2 generation-after condition).
4. Procedure 4: prose evaluation by Wonder.
5. Incorporation is NOT in this brief's scope (stays separable per D10 policy).

## 承認（2026-10-29、修正して承認）

- 判断者: 本人。判断: 修正して承認。承認の範囲と本人の言葉、扱いは `loops/loop-012/reference-set-proposal.md` の判断・修正理由の節に記録した（本人の言葉はそのまま残した）
- 型4件（LIB-PAT-001〜004 v1）の目録登録を承認（003 は登録のみ、E01 では使わない）。E01 の参照セット（001＋002＋004）と、対象層に未経験層を含める前提も承認
- 反映: `library/catalog-v1.json` で型4件の pattern status を登録済みにし、採用した型（001・002・004）の最終利用日を 2026-10-29 に更新した。FACT v1 は変更していない

## 手順3: 型あり生成と適合監査

- 実装（新規追加のみ）: `src/generate-typed.mjs`（プロンプト版 `lp-generate-v2-typed`）と `src/generate-typed.test.mjs` を新規作成した。既存ファイルは変更していない。型セットは目録 ID と版の列で指し、生成プロンプトへの追加の入力（構造化した形）として渡す。事実と数値は従来どおり原本と FACT からだけ取る。締めは、応募方法の事実がないため誘いの文にせず、条件の要約とした
- 生成の実行（1回だけ）: 逐語 `node src/generate-typed.mjs --approval src/facts/FICT-J01-facts-v1.approval.json --original src/fict-j01-v1.json --facts src/facts/FICT-J01-facts-v1.json --catalog library/catalog-v1.json --patterns LIB-PAT-001,LIB-PAT-002,LIB-PAT-004 --out loops/loop-012/typed-generation.json --run-out loops/loop-012/typed-generation-run.json` → `generated`、6文、42,858ms。生成物は `loops/loop-012/typed-generation.json`、実行記録は `loops/loop-012/typed-generation-run.json`、使用プロンプトは `loops/loop-012/prompt-lp-generate-v2-typed.md`
- 実費: $0.0011779（D4 単価による算出値。usage は入力 1,677、出力 5,051（うち推論 4,643）トークン。確定実費は Billing 突合が必要）。API の実行はこの1回だけである
- 適合監査（既存の再検証）: 逐語 `node src/verify.mjs --generation loops/loop-012/typed-generation.json --approval src/facts/FICT-J01-facts-v1.approval.json --out loops/loop-012/typed-verification-result.json` → 入力同一性 pass（8件）、根拠検査の再実行 pass（6文、issues なし）、機械検査 pass。最終判定は、人間の確認（意味の対応）が未完了のため未確定である。この生成は実験であり、本体のプレビューには使わない（`site/` は変更していない）
- 生成後コピー照合: `loops/loop-012/copy-check-after-generation.json` に記録した。生成文と事例5件のすべてで8文字以上の共通部分は0件（最長共通部分5文字）。生成文の数値はすべて固定済み FACT v1 にある。人間が確かめる範囲（特徴的な言い回しの一致がないこと）は散文評価の記録に残した
- テストと自己確認: 逐語 `node src/generate-typed.test.mjs --out loops/loop-012/check-verification.json` → 25/25 pass（スタブ経由、実 API なし）。回帰はリポジトリ外の一時出力で確認した: 工程3の生成 23/23、工程4の再検証 42/42、工程2の承認 11/11、工程1のテスト 12/12 とオフライン検証 6/6、統合 51/51。既存スイートに回帰はない

## 手順4: 散文評価

- `loops/loop-012/prose-evaluation.md` に記録した。実施者は制作ラインの Wonder、観点は初期候補 v1（当事者の声、生活翻訳、型への適合、第三者視点の検証文の混入）。観点の昇格はしていない
- 判定の要約: 当事者の声は要修正、生活翻訳は要修正、型への適合は要修正（並びはおおむね沿うが、文3・文5の重複と文1の詰め込みがある）、第三者視点の検証文の混入は良い。差し戻しはあり（型あり生成の実験に対するもの）で、本実施では生成をやり直さない。評価はプレビューの可否を決めない
- 組み入れ判断への材料として、FACT にない要素（残業）を変動要因に使う表現と、柔らかさの程度（機械検査が必須とする語との両立形であること）を、同評価の留意点に残した

## 費用のまとめ（本ループ）

- 手順1〜2: API 実行なし、$0
- 手順3の型あり生成1回: $0.0011779（算出値、D5 の製品実行として扱う実験の実行）
- 手順4の散文評価: Meta Model API の実行なし。OpenCode のセッション利用（Spark の実装、Wonder の評価）は計測手段がないため未記録とする（推測しない）

## 成立条件との対応（本ブリーフの範囲）

- 手順1〜4が架空データだけで1周し、記録が `library/` と `loops/loop-012/` の両方に残った
- 本体の既存経路（型なし生成 `lp-generate-v1`、工程1〜6の記録と合格実績、`site/`）は変更していない。コードの変更は型あり生成の新しい版の追加（新規ファイル2件）に限る
- 実費を含む実行記録が残った。コミットはしていない（着地は書き込み用ラインの通常手順）。組み入れは本ブリーフの範囲では行わない（11/01 の組み入れ判断ゲートで、監査を経て本人が判断する）
