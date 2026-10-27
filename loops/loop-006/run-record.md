# ループ6 実行記録: 工程1（抽出・照合の仕上げ）

- 実施日: 2026-10-27
- 実施者: Muse Bot（統括）。D9 の体制での最初の実施パス
- 実行環境: Muse の仮想マシン（node v24.22.1）。Meta Model API のキーは接続（custom.meta-model-api）経由の代理トークンを環境変数 `MODEL_API_KEY` に渡して供給した。キーの実値は統括にも見えず、いずれのファイル・ログにも残していない
- 対象工程: `docs/design/implementation-steps-v1.md` 工程1（作業1–4）。実施計画は `docs/prompts/step1-brief.md`
- 文脈: 基本設計 v1.1、ステップ v1、決定 D3・D4・D5・D9。開始条件（監査 M5）として、再実行の出力先を `loops/loop-002` から切り替えてから実行した

## コード変更（`src/extract-and-check.mjs`）

- `--out-dir <path>` を追加した。既定値は従来どおり `loops/loop-002` で、再実行時は必ず明示する（監査済みの loop-002 記録を上書きしないため）
- `--prompt v1.1` を追加した。プロンプト版 `fact-extract-v1.1` を選択できる
- スキーマ完全性チェック `checkSchemaCompleteness` を追加した。抽出結果に対して期待キー15件との照合（欠落・余分・重複）と項目フィールドの有無を検査し、結果を live-run.json の `schemaCheck` に記録する。パイプラインを止める力は持たせていない（ゲート候補としての実装。後述）
- 変更後にオフライン検証（fixture）を scratch 出力で再実行し、従来のチェック6件すべて pass を確認した。回帰なし

## 作業1: 再現性の確認（プロンプト v1 のまま再実行）

- 条件: ループ2の実API実行と同一（モデル `muse-spark-1.3-contributor`、temperature 0、プロンプト `fact-extract-v1`、同時実行1件、再試行0回）。出力は `repro/live-run.json`
- 判定は再現した。E01「一致（人間承認待ち）」、E02「停止（矛盾あり）」でループ2と同一
- FACT の一致度: 15件中7件が全フィールド完全一致。差分8件はすべて表現の粒度差であり、意味・数値・行IDの対応は全件一致した。内訳は `comparison.json` に機械比較の結果を残した
  - 引用の範囲: ループ2は行全体の引用、再実行は最小範囲の引用（例: workHours の引用が行全体→「勤務時間は09:00〜18:00」）。3実行とも引用15件すべてが引用元行の逐語部分文字列であることを機械確認した（不正 0 件）
  - value の言い回し: monthlyIncomeGuarantee が「月収は保証しない」→「保証しない」など
  - 未記載項目の value: ループ2は文字列「未記載」、再実行は空文字列。**v1 の時点では表現が実行ごとに揺れる**ことが分かった（作業2の実験の前提事実）
- 実測: 所要 51,703ms、入力 362・出力 6,162 トークン、算出コスト $0.0012686（ループ2は 44,876ms・$0.001289）

## 作業2: 改善実験（プロンプト v1.1、変更は1要因のみ）

- 変更要因: 未記載項目の `value` の表現。v1.1 では「未記載項目の value は JSON の null とし、文字列を入れてはならない」を指示文とスキーマ例の両方で明示した。それ以外の文・条件・対象は v1 と同一
- 結果: 狙いどおり、未記載2件（renewal・housing）の value が null になった。E01・E02 の判定は不変で期待どおり。詳細は `experiments/exp-002-fact-extract-prompt-v1.1.md`
- 副次的な差分（transportCap の value の言い回し、workHours の引用末尾の句読点）は、作業1で観測した実行ごとの粒度差の範囲内であり、変更要因によるものとは判断しない
- 実測: 所要 44,524ms、入力 388・出力 5,504 トークン、算出コスト $0.0011396

## 作業3: スキーマ完全性チェック

- 実装は上記のとおり。両 live 実行で `schemaCheck.pass = true`（15件そろい、欠落・余分・重複・フィールド欠落なし）
- 否定テストも実施した。キー欠落・キー重複・フィールド欠落・items が配列でない入力の4通りすべてで不合格を検出することを確認した（本体関数を直接実行して検証）
- ゲート候補としての最小記録は `gate-candidate-schema-completeness.md` に残した。昇格はしていない（D8 により本人の承認が必要）

## 作業4: FACT の版固定

- 採用した抽出結果: v1.1 実行の FACT（スキーマ完全性合格、引用の逐語性を機械確認済み、未記載 value が null に統一）
- 成果物: `src/facts/FICT-J01-facts-v1.json`（FACT 本体）と `src/facts/FICT-J01-facts-v1.manifest.json`（組の特定情報と sha256）
- 版の決め方: FACT 版は採用のたびに +1 する。原本版・プロンプト版・モデルのいずれかが変わって再抽出したら、新しい FACT 版を別ファイルで作り旧版は上書きしない。工程2（承認）は原本版と FACT 版の組を指名して行う
- sha256: `3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec`
- 承認状態: 未承認。工程2の人間承認はまだ行われていない

## 実費（D5 の区分: 実験）

- 実API 2回合計: $0.0024082（算出値。確定実費は dev.meta.ai Billing 実績との突合が必要で、宿題どおり 11/01 に行う）
- Muse Bot 自身の推論費: 未記録（計測手段が未整備のため推測しない）

## 観察事項

- 引用の範囲（行全体か最小範囲か）はプロンプトで規定していないため実行ごとに揺れる。照合は引用の逐語性と行IDで担保されており現工程の判定には影響しないが、工程3（生成）で文単位の引用を引き継ぐ設計（監査 S2）では粒度の規定が要る可能性がある。ゲート候補にはしない。監査での論点として残す
- v1.1 の変更は「指示文とスキーマ例の両方に書く」形をとった。どちらか一方だけで足りるかは未検証（追加の要因実験になるため今回は行わない）

## 次工程への引き継ぎ

- 本記録一式は監理ラインの監査を受ける（依頼文は `docs/prompts/step1-audit-brief.md`）。受け入れは統括と本人が行う
- 工程2（承認）は FACT 版 `FICT-J01-facts-v1` を対象に設計する。承認記録の様式はロードマップの宿題どおり 10/29 朝に先に決める

## 監査修正の適用（F1・F2）

- 適用日: 2026-10-27。監理ラインの監査（`docs/design/step1-review.md`、判定「修正」）の修正事項 F1・F2 に対する適用作業。指示文は `docs/prompts/step1-fix-brief.md`。live API は実行していない（追加費用なし）。`loops/loop-002` には触れていない
- 開始時点の HEAD: `c356c9e6b55ddb74aefe09a5ec68eb4aa9f17a86`（`main` を `git fetch` で確認し、開始時点で `origin/main` と一致、作業ツリー clean であった）
- 変更ファイルと変更内容:
  - `docs/prompts/step1-fix-brief.md`（新規）: 本修正の指示文自体を保存した
  - `.gitattributes`（新規）: `src/fict-j01-v1.json` と `src/facts/*.json` に `text eol=lf` を固定した（F1）
  - `src/facts/FICT-J01-facts-v1.manifest.json`: トップレベルに `hashDefinition`（sha256 の対象は Git に保存されたバイト列（UTF-8、改行は LF）とする旨と再現手順）を追加し、`original` に `sha256`（`a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60`）を追加した。既存の facts 側 `sha256`（`3dc7fbd1…`）は変更していない。manifest 自体はハッシュ対象ではない（F1）
  - `src/extract-and-check.mjs`: `pathToFileURL` を import に追加し、`loadOriginal`・`fixtureFacts`・`checkSchemaCompleteness` に `export` を付け、引用逐語性チェック `checkQuoteVerbatim` を追加した。`runLive` では抽出結果の形によらず `schemaCheck` が常時記録されるよう直し（解析不能時は理由つきで不合格として記録）、早期 return（blocked・api-error）にも `schemaCheck`（理由 `no extraction output` つきで不合格）を追加した。ファイル末尾の `main()` 無条件実行を、直接実行時のみのガードに置き換えた（F2）
  - `src/extract-and-check.test.mjs`（新規）: スキーマ完全性の肯定・否定ケースと引用逐語性の肯定・否定ケースを再実行できるテスト。API アクセスなし
  - `loops/loop-006/check-verification.json`（新規）: 上記テストの実行結果の記録（下記）
  - `loops/loop-006/gate-candidate-schema-completeness.md`: 末尾に、引用の逐語性は本候補の対象外であり別チェック（`checkQuoteVerbatim`）で扱い結果は `check-verification.json` に残す旨を追記した（F2）
  - `loops/loop-006/run-record.md`: 本節を追記した
  - `loops/INDEX.md`: ループ6行を、見出しと同じ3列（ループ／内容／記録の所在）に直した。監査状態の文面は変えていない（受け入れ時に更新する）
- テスト結果: `node src/extract-and-check.test.mjs --out loops/loop-006/check-verification.json` を実行し、全12件 pass、終了コード 0 であった（`check-verification.json` の `results` 12件すべて `pass: true`、全体 `pass: true`）。内訳はスキーマ完全性8件（肯定1・否定5パターンの検証を含む）と引用逐語性4件（採用 FACT 15件の合格、捏造引用の不合格、存在しない行 L99 の不合格を含む）であり、採用 FACT の逐語性チェックは `checked: 15`、`issues: []` で合格した。回帰確認として `node src/extract-and-check.mjs --verify-offline --out-dir <リポジトリ外の一時フォルダ>` も実行し、従来の6件すべて pass、終了コード 0 であった
- ハッシュ照合の結果（F1）: 対象2ファイルを再チェックアウト（`git ls-files --eol` で両方とも `i/lf w/lf attr/text eol=lf`）したうえで実測した。`src/facts/FICT-J01-facts-v1.json` は実ファイル・git blob ともに sha256 が `3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec`（3,282バイト）で manifest 記載値と一致した。`src/fict-j01-v1.json`（原本）は実ファイル・git blob ともに sha256 が `a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60`（854バイト）で manifest に追加した値と一致した。両ファイルとも実ファイルのバイト列と git blob は同一であった
- 本節の数値はすべて本作業で実行して得た実測であり、推測で埋めた箇所はない。修正の完了判定は行わない（再監査は監理ラインが行う）
