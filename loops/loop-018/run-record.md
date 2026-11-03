# ループ18 実行記録: LP フルパイプライン化の実装（画像生成 → LP 組み立て → 完成の照合）

- 実施日: 2026-11-03
- 実施者: 制作ライン（OpenCode）
- 設計: `docs/design/lp-full-pipeline-design-v1.md`（監査 M1–M3・N3 反映済み）。本記録は設計の実施記録であり、設計自体の判断は変えていない
- 開始時点の Git: `main` = `23dcf73`（`git fetch origin` で `origin/main` と一致を確認し、作業ツリー clean で開始。設計・監査文書は未コミットのまま読み物として参照した）
- 不変条件: `src/verify.mjs` は無改変。抽出・照合・FACT 比較・承認・矛盾での停止の振る舞いは変えない（M3）。実験側（generate-typed、generate-persona、loop-012・013、`library/`）の道具は持ち込まない。架空データのみ
- 順序: ①画像生成 → ②組み立て → ③完成の照合 の順に実装し、各段で対応するテストを足した。新しい生成の実行（実 API）は行っていない。完了条件の 1 回の実実行による確認は、監査・受け入れの段階で行う

## 1. 変更内容（判断と変更理由）

### 1-1. 画像生成の道具（`src/generate-images.mjs`、新規）

- 判断: 画像生成の道具は、本体側の最小実装として新規ファイルに切り出した。実験側（loop-015・loop-016）の道具立ては持ち込まず、API の形（エンドポイント `https://api.meta.ai/v1/images/generations`、モデル `muse-image-1.3` 改め正しくは `muse-image-1.0`、1 回 1 枚、サイズ `1024x1024`、b64 応答）のみを確認して使った。プロンプト文面・判定・記録形式は本体用に新規に書いた
- `decideImagePlan({ generation, facts })`: 生成の記録だけから型セットを決める。hero 1 点＋引用された行のうち stated な項目がある行ごとの節画像（FICT-J01 の実測では hero＋L01〜L05 の 6 枚）。未記載だけの行（L06）は型に含めない。プロンプトは事実側の語（数値・文言）を焼き込まない形に固定した
- `runImageGeneration({ plan, root, imagesDir, callImage })`: 注入した `callImage(prompt)` で生成し、ファイルを書き、記録（status・model・promptTemplate `lp-image-v1`・画像一覧・costUsd＝枚数×$0.01）を返す。失敗時は failed で止めるための記録を返す（費用は 0 のまま、推定しない）
- CLI（`--generation --facts --out-dir --run-out`）はライブ実行用に用意した。API キーは `MODEL_API_KEY` のみから読み、記録やログに残さない。拒否の分岐は持たない（入力チェックは統合実行の既存工程が担う）

### 1-2. LP 組み立てと完成の照合（`src/run-demo.mjs`）

- 判断: 組み立てと完成照合のコードは統合実行側（`run-demo.mjs`）に置き、`verify.mjs` は改変しない（設計 M2）。完成の判定は再検証の記録の中（`stages.verification.completion`）に含める
- `assembleLP({ root, generation, images, lpDir })`: 生成文をそのまま（無編集・順序どおり）並べ、実在する画像だけを参照する。存在しない画像は参照せず `skipped` に記録する（判定は完成の照合に任せる）
- `checkCompletion({ root, generation, imageFiles, lpFile, grounding })`: C1（文がすべてページにそのまま入っている。文の欠けの判定は C1 に一本化。M1）、C2（記録の画像がすべて実在しページから参照されている）、C3（ページが存在し文と画像の両方を含む。文の欠けの有無は見ない）、C4（根拠検査の再実行が pass）。1 つでも欠ければ未完成として止める
- 完成の記録への明記（N3）: `checkCompletion` の戻り値の `note` に「画像の意味は範囲外である。人間の確認と完成の判定は文章と機械的な含有を対象とし、画像が内容として適切かは今回の判定に含めない。」を入れ、本記録にも残す
- 工程の接続: 文章生成 → 画像生成（`stages.images`、失敗時はここで止める）→ LP 組み立て（`stages.lpAssembly`）→ 再検証（機械検査＋完成の照合を `stages.verification.completion` に記録。未完成ならここで止める）→ プレビュー（任意、従来どおり）。E02 は従来どおり照合で止まり、画像生成以降は実行されない（e02 の記録にも images・lpAssembly の未実行を追加）
- 費用: 画像は 1 枚 $0.01 の算出値を内訳（`画像生成（muse-image-1.0、ライブ）`）に残し、合計は抽出＋生成＋画像の合計とした。区分は従来どおり製品実行

## 2. 検証結果

- 新規テスト（`src/generate-images.test.mjs`、14 件）: 型セットの決定（hero＋L01〜L05、未記載のみの L06 を含めない、プロンプトに数値を焼き込まない、単価 $0.01）、生成の記録（枚数どおりの呼び出し、ファイルの実在、枚数×$0.01）、失敗時の failed と費用 0。すべて pass
- `src/run-demo.test.mjs` の追加分: T1（画像生成の失敗で images 段階で止まり、LP・再検証は実行されず、完成として記録されない）、T2（画像ファイルの欠けで C2 の未完成となり verification で止まる）、T3（生成文の欠けで C1 の未完成となり C3 にはならない。M1 の一本化の固定）、T4（正常系で完成と記録され後段へ進める。run2 の humanAllOk 経路に画像・組み立て・完成の確認を追加）、T5（E02 の停止系で画像生成以降は実行されない）、T6（費用に画像分が枚数×$0.01 で記録され、合計に含まれる）
- 既存スイートの全通過: extract-and-check 12/12、offline 6/6、approve 11/11、generate 23/23、verify 52/52、run-demo 85/85（T1〜T6 を含む）、generate-typed 25/25、generate-persona 39/39。`verify.mjs` は無改変であることを `git status` で確認した
- 新しい生成の実行（実 API）は行っていない。完了条件の「FICT-J01 の投入だけで画像つき完成 LP が 1 回の実行で出ること」の実測確認は、監査・受け入れの段階で行う（費用が発生するため、本人の承認を得てから）

## 3. 変更ファイル

- `src/generate-images.mjs`（新規）: `IMAGE_MODEL`（muse-image-1.0）、単価 $0.01、プロンプト版 `lp-image-v1`、型セット決定、生成実行、CLI
- `src/generate-images.test.mjs`（新規）: 14 件
- `src/run-demo.mjs`: `assembleLP`、`checkCompletion`、画像生成・LP 組み立て・完成照合の工程接続、費用の内訳、e02 記録の追加、CLI フラグ（`--images-dir`、`--lp-out`、`--images-run-out`）、liveDeps の画像実行器（終了コードと鮮度の扱いは従来どおり）
- `src/run-demo.test.mjs`: T1〜T6 と完成の確認、既存 run1/run2 の画像工程つきへの更新
- 本記録（`loops/loop-018/run-record.md`）

## 4. 次の手順

- 監理ラインの再監査を受ける（監査の観点: 不変条件の維持、T1〜T6 の妥当性、N3・M1〜M3 の反映）。受け入れは本人と統括が行う
- 着地（コミット）は監査で合格が出てから行う。本記録の時点では未コミットである
