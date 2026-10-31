# ループ14 実行記録: 本体の完全性 修正の実装（①→②→③）

- 実施日: 2026-10-31
- 実施者: 制作ライン（OpenCode）
- 対象: main の本体のみ（`src/verify.mjs`、`src/build-preview.mjs`、`src/run-demo.mjs` と各テスト）。ローカル実験の系統（generate-typed、generate-persona、loop-012・013）には広げていない
- 設計: `docs/design/core-integrity-fix-design-v1.md`（監理ライン監査は総合判定「合格」。本記録は監査済み設計の実施記録であり、設計自体の判断は変えていない）
- 開始時点の Git: `main` = `23dcf73325c9d53e5cbffa2a8e1e10361b3670d4`（設計の前提 origin/main と一致、作業ツリーに本体の変更なしで開始）
- 順序: ① → ② → ③ とし、各件で対応する回帰テスト（T1〜T8）を足してから次へ進んだ。新しい生成は行っていない
- 着地の条件: 既存テストの全通過、T3（loop-010 の移行確認: 確定済み確認記録が新方式でも pass のまま）。本記録の時点では着地（コミット）していない。再監査で合格が出てから着地する

## ① 修正: 確認記録と生成物の結合（verify.mjs）

- 判断: `decideVerdict` に生成物（文の列）を渡す引数を追加した。確認記録を持たせる方式は採らず、文そのものの照合とした。理由は、確認記録は人間が記入する成果物であり、ハッシュを人手で正しく運ぶ前提が弱いこと、既存の確認記録が text をそのまま保持している形式のためである（設計 A-1 の決定どおり）
- 変更内容（`src/verify.mjs`）:
  - `decideVerdict({ ..., humanConfirmation, generation })` に生成物を必須化した。生成物が渡されない呼び出しは fail closed に倒す（category は human-confirmation、工程3への差し戻し扱い）
  - pass 条件に次を追加した。(a) 確認記録の文数が生成物の文数と等しい。(b) 各文について、確認記録の text が同位置の生成物の text と文字列一致する。(c) 従来の条件（completed、全 result 記入、全て「対応あり」、確認者と確認日時があること）も維持する。確認者・確認日時の有無は L-024 のうち本件で一緒に検査する分である
  - 不一致の判定は fail（category は human-confirmation）とし、理由文には文数の不一致か、どの位置の文が一致しないかを含めた（本文の全文は理由に載せない）
  - `runVerification` は読み込んだ生成物オブジェクトをそのまま `decideVerdict` に渡す。呼び出し側の変更はこの1箇所だけである
  - factKeys・sourceLines の対応そのものは機械照合の対象にしない（物差しを広げない。L-026 の前提を維持する）
- テストの更新（監査からの引き継ぎ1件）: `src/verify.test.mjs:59` の `decideVerdict` 呼び出しは生成物を渡さず pass を期待するフィクスチャだったため、生成物の受け渡しに明示的に更新した（新方式では渡さないと pass にならない）。同 `:64` の不一致で fail を期待する呼び出しも生成物を渡す形に更新した（fail のまま通ることを確認し、reason・category の文面が human-confirmation であることの期待値も足した）
- 回帰テスト（設計 A-4）: T1（無関係な文の確認記録では pass にならない）、T2（文数が異なる確認記録では pass にならない、途中一致を含む）、T3（loop-010 の生成物と確定済み確認記録の組は pass のまま）を `src/verify.test.mjs` に追加した
- 検証: `node src/verify.test.mjs` → **52/52 pass**（42 件の既存＋10 件の新規・更新）。T3 により、loop-010 の確定済み記録は新方式でも pass のままであることを確認した（移行に追加の作業は要らない）

## ② 修正: プレビュー生成時の同一性照合（build-preview.mjs）

- 判断: 生成器本体（`buildPreview`、純粋関数）にはファイル照合を持ち込まず、照合は `writePreview` 側で行い、結果を生成の呼び出し条件とする方式とした（設計 A-2 の決定どおり）
- 変更内容（`src/build-preview.mjs`）:
  - 照合だけを切り出した `checkPreviewPairing({ root, generationFile, generation, verification })` を追加した。(a) 対象の生成ファイルの現在の sha256（F1、既存の `sha256File` を使う）が検証結果の `target.generationSha256` と一致する。(b) 生成物の文数が `target.sentenceCount` と一致する。(c) 検証結果の `target.generationFile` が渡された生成ファイルと一致する（パスはリポジトリ相対にそろえて比べる）
  - `writePreview` は、verdict が pass であることの確認の後に上記の照合を行い、1つでも一致しなければ HTML を書かず、既存ファイルがある場合も上書きせずに理由を返して終了する（既存の「pass でなければ作らない」と同じ倒し方）。公開済みプレビューの再生成時も同じ経路を通る
- 回帰テスト（設計 A-4）: T4（PASS の検証結果を使い、生成ファイルの文を1文変更してからプレビュー生成を試みると、HTML が作られず既存ファイルも上書きされない）、T5（検証結果が対象とした生成ファイルと別のファイルを渡すと HTML が作られない）、および照合だけの pass 確認を `src/run-demo.test.mjs`（プレビュー系の既存の置き場所）に追加した
- 検証: `node src/run-demo.test.mjs` → ②の時点では **56/56 pass**（51 件の既存＋5 件の新規）。③の追加後は **66/66 pass**（下記）

## ③ 修正: 生成の鮮度と終了コード（run-demo.mjs）

- 判断: 生成と抽出の両方を対象とした。理由は、同型の穴が両方にあり、片方だけ塞いでも失敗を成功として扱う経路が残るためである。変更箇所は `liveDeps` の 2 関数に限る。生成ファイル自体の鮮度も必須条件に含めた（監査の統括確認への回答どおり。生成ファイル側の鮮度がないと、前回の生成ファイルが残り実行記録だけが今回のものに更新された場合に古い生成物を読む経路が残る）
- 変更内容（`src/run-demo.mjs` の `liveDeps`）:
  - 子プロセスの起動前に出力ファイル（抽出側は `live-run.json`、生成側は実行記録と生成ファイル）を削除してから実行する。ハッシュ比較だけでは同一内容の再実行を失敗と誤判定しうるためであり、削除方式では正当な成功を落とさない（監査からの引き継ぎ2件の推奨どおり）
  - 子プロセスの終了コードが 0 でない場合はその時点で失敗として返し、実行記録ファイルと生成ファイルは読まない（前回のものは使わない）
  - 終了後に、実行記録ファイルが新規に作られたかを確認し、なければ失敗として前回の内容は使わない。T7・T8 の stale-output がこれに当たる
  - 実行記録の status が generated（抽出側は completed 相当）であることの確認は従来どおり必須とし、上記の終了コードと鮮度の条件と合わせて初めて後段へ進める。生成側は generated の場合に生成ファイルの存在も必須とした
  - 失敗の場合の記録には終了コードと、鮮度が確認できなかった旨を含める。費用は従来どおり未記録とし、推測で埋めない
  - テストのために子プロセスの実行器を注入できる形にした（`liveDeps({ ..., run })`。既定は従来どおりの `runNode` であり、CLI 側の呼び出しは変えていない）
- 回帰テスト（設計 A-4、T8 は実行記録ファイル `live-run.json` と完了条件 completed 相当を明示）: T6（生成の子プロセスが失敗し、前回の実行記録と生成ファイルが残っている状態でも成功として扱われない。終了コードの記録を含む）、T7（子プロセスが終了コード 0 で終わっても実行記録が更新されない状態は成功として扱われない。stale-output）、T8（T6・T7 と同型の条件を抽出側にも置く。`live-run.json` と completed 条件で明示）を `src/run-demo.test.mjs` に追加した
- 検証: `node src/run-demo.test.mjs` → **66/66 pass**（51 件の既存＋15 件の新規: T4・T5・照合確認・T6〜T8）

## 既存テストの全通過と移行確認（着地の条件）

- 実行したスイート（いずれも API を呼ばない。出力はリポジトリ外の一時フォルダ）:
  - `src/extract-and-check.test.mjs` → 12/12 pass
  - `node src/extract-and-check.mjs --verify-offline` → 6/6 pass
  - `src/approve.test.mjs` → 11/11 pass
  - `src/generate.test.mjs` → 23/23 pass
  - `src/verify.test.mjs` → 52/52 pass（T1〜T3 を含む）
  - `src/run-demo.test.mjs` → 66/66 pass（T4〜T8 を含む）
  - `src/generate-typed.test.mjs` → 25/25 pass（対象外の系統だが変更なしの確認として実行）
  - `src/generate-persona.test.mjs` → 39/39 pass（同上）
- T3 の移行確認: loop-010 の生成物（9文）と確定済み確認記録（completed、確認者・確認日時・全9文「対応あり」）の組は、新方式の `decideVerdict` でも `runVerification` 経由でも pass のままである。loop-010 の記録ファイル自体は変更していない
- API の実行、課金、外部への送信・公開は行っていない。新しい生成も行っていない

## 変更ファイル（本体5件のみ）

- `src/verify.mjs`（①: 判定への生成物の受け渡しと結合の検査）
- `src/verify.test.mjs`（①の2箇所の更新、T1〜T3 の追加）
- `src/build-preview.mjs`（②: 照合の切り出しと生成条件化）
- `src/run-demo.mjs`（③: 終了コードと鮮度の条件、実行器の注入化）
- `src/run-demo.test.mjs`（T4・T5・照合確認、T6〜T8 の追加）
- 本記録（`loops/loop-014/run-record.md`）
- 対象外の系統（generate-typed、generate-persona、loop-012・013、library/）と、本体の既存記録（loops/loop-002〜011、`site/`）は変更していない

## T7 の強化（テストのみ、2026-10-31）

- 起点は実装の再監査の観察事項である。現状の T7 は前回ファイルの残存がない設定のため、修正前のコードでも通ってしまう（真の回帰テストになっていない）。挙動自体は正しい
- T6・T8 と同様に、前回の実行記録と生成ファイルを用意した状態で「終了コード 0 だが実行記録が更新されない」条件にし、修正前なら成功扱いになってしまう条件として固定した。変更は `src/run-demo.test.mjs` の T7 の設定だけで、本体のコードには触れていない
- 検証: `node src/run-demo.test.mjs` → **66/66 pass**（件数は同じだが T7 の内容が強化されている）。修正前の生成ロジック（終了コードを無視し残存ファイルを読めば使う）を再現した確認では、同条件で status が generated になるため、強化後の T7 は修正前では落ちることを確かめた
- この変更はテストのみであり、再監査の合格判定の範囲内（監査側の推奨）として扱う。着地はこの強化を含めた形で行う

## 全スイートの再実行結果（T7 強化後）

- 実行はすべて API を呼ばない。出力はリポジトリ外の一時フォルダである
  - `src/extract-and-check.test.mjs` → 12/12 pass
  - `node src/extract-and-check.mjs --verify-offline` → 6/6 pass
  - `src/approve.test.mjs` → 11/11 pass
  - `src/generate.test.mjs` → 23/23 pass
  - `src/verify.test.mjs` → 52/52 pass（T1〜T3 を含む）
  - `src/run-demo.test.mjs` → 66/66 pass（T4〜T8 を含む。T7 は強化後の内容）
  - `src/generate-typed.test.mjs` → 25/25 pass（対象外の系統だが変更なしの確認として実行）
  - `src/generate-persona.test.mjs` → 39/39 pass（同上）

## 次の手順

- 監理ラインの再監査を受ける。着地（コミット）は再監査で合格が出てから、書き込み用ラインが未着地分と混ぜない独立コミット群で行う。公開プレビューの更新は、修正②の照合を通った場合のみ行う
