# ループ8 実行記録: 工程3（生成）

- 実施日: 2026-10-27
- 実施者: Muse Bot（統括）。D9 の体制での実施パス
- 実行環境: Muse の仮想マシン（node v24.22.1）。Meta Model API のキーは接続（custom.meta-model-api）経由の代理トークンを環境変数 `MODEL_API_KEY` に渡して供給した。キーの実値は統括にも見えず、いずれのファイル・ログにも残していない
- 対象工程: `docs/design/implementation-steps-v1.md` 工程3。実施計画は `docs/prompts/step3-brief.md`

## 入力版（明示）

- 開始時点の Git: `main` = `e5eb5e7413946a5ce42ba569b998c03270e37083`（`git fetch` で origin/main と一致を確認し、作業ツリー clean で開始）。開始前に、作業ツリーに残っていた未追跡の `docs/prompts/step3-brief.md` が origin の着地版とバイト単位で同一（sha256 `ef5f0d5e671d5dd06f3ac7b2f0d554d52d20eb75e01e49f3620c480e70d14032`）であることを確認してから除去し、fast-forward で取り込んだ
- 原本: FICT-J01 v1（`src/fict-j01-v1.json`、sha256 `a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60`）
- FACT: `FICT-J01-facts` 版1（`src/facts/FICT-J01-facts-v1.json`、sha256 `3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec`、manifest 併置）
- 承認記録: `src/facts/FICT-J01-facts-v1.approval.json`（approvalId `FICT-J01-approval-1`、status: approved、承認者 Norikazu Harada（本人）、承認日時 2026-10-27T19:58:09+09:00）
- 承認の様式: `docs/design/approval-record-format-v1.md`（決定済み）。工程2の記録: `loops/loop-007/` 一式と監査レポート `docs/design/step2-review.md`

## 実施内容

### 1. 生成の道具（`src/generate.mjs`）

- `checkGenerationInput`: 生成の開始条件を2条件の AND とした（工程2監査の観察事項1の反映）。(1) 承認記録の `status` が `approved` で、approver と approvedAt が入っていること。(2) `src/approve.mjs` の `checkApprovalValidity` を実行時点で再計算し `valid: true` であること。承認記録内の静的な `validity.invalidated` は一切参照しない。拒否理由は reasonCode（approval-missing / approval-not-approved / approval-incomplete / approval-invalid）で区別して返す
- `buildGenerationMessages`: プロンプト版 `lp-generate-v1`。材料として stated 項目だけを値つきで渡し、未記載項目（renewal・housing）は「未記載である」という情報としてのみ渡す（値は渡らない）
- `runGeneration`: 入力チェック → 生成 → 根拠検査の流れ。モデル呼び出しは注入可能とし、テストではスタブに差し替える。拒否時はモデル呼び出しに到達しない。同時実行1件・自動再試行なし。モデルは `muse-spark-1.3-contributor`、temperature 0
- `checkGrounding`（根拠の検査。工程4が import して使える形）: 全文について、factKeys と sourceLines の保持、key と行 ID の実在、引用した key 自身の sourceLine が併せて引かれていること、円金額と時刻が FACT の値の逐語であること、数値項目を引いた文がその値を保持すること、未記載項目の値の断定（「寮あり」等）がないこと、monthlyDaysAssumption が仮定のままであること、monthlyIncomeGuarantee が非保証のままであることを機械検査する
- 生成物は文単位で本文・factKeys・sourceLines を保持する JSON とした（ブリーフ作業1の提案形式）

### 2. テスト（`src/generate.test.mjs`）

- 実行引数（逐語）: `node src/generate.test.mjs --out loops/loop-008/check-verification.json` → **17/17 pass**（終了コード 0）
- 内訳: 入力チェック系10件（承認済みペアの許可1件、下書きの拒否3件=再計算では valid: true になることの明示確認を含む、FACT 改変での拒否3件=理由に「照合からやり直す」を含むことまで確認、E02 の承認記録不在での拒否3件=API が呼ばれないことまで確認）、生成系7件（スタブ経由の生成フロー2件、忠実なスタブ出力への根拠検査の合格1件、未記載の断定の検出2件、捏造した金額 1,700円の検出2件）
- 生成系のケースはモデル呼び出しをスタブ化しており、実 API は呼んでいない（費用なし）。実生成はテストと分けて1回だけ実行した（後述）
- 回帰確認: `node src/approve.test.mjs` → 11/11 pass、`node src/extract-and-check.test.mjs` → 12/12 pass、`node src/extract-and-check.mjs --verify-offline --out-dir /tmp/loop008-regression` → 6/6 pass。既存スイートの記録ファイルには触れていない

### 3. 実生成（1回のみ）

- 実行引数（逐語）: `MODEL_API_KEY=<接続経由の代理トークン> node src/generate.mjs --approval src/facts/FICT-J01-facts-v1.approval.json --original src/fict-j01-v1.json --facts src/facts/FICT-J01-facts-v1.json --out loops/loop-008/generated-lp-v1.json --run-out loops/loop-008/generation-run.json`
- 結果: status `generated`、生成物は7文（`loops/loop-008/generated-lp-v1.json`）。stated 13項目すべてが文に現れ、各文が根拠の key と行 ID を保持する。未記載2件（renewal・housing）は文に含めなかった（ブリーフ §3 で許容される扱い）。月20日勤務は「試算用の仮定」の文言を保持し、月収の金額提示はない。「月収は保証しない。」は逐語で保持された
- 根拠検査: pass（7文、issues なし）。実行の内訳は `loops/loop-008/generation-run.json`、使用プロンプトは `loops/loop-008/prompt-lp-generate-v1.md`
- 実測: 所要 27,220ms、入力 839・出力 4,262 トークン（うち推論トークン 3,993）

## 実費（D5 の区分: 製品実行）

- 実生成1回: $0.0009363（D4 単価による**算出値**。確定実費は dev.meta.ai Billing 実績との突合が必要で、宿題どおり 11/01 に行う）
- テスト・拒否系は API を呼んでいないため費用なし
- Muse Bot 自身の推論費: 未記録（計測手段が未整備のため推測しない。L-012 の D5 追補は未反映のまま）

## ブリーフとの差異と判断

- 着地したブリーフ（`docs/prompts/step3-brief.md`、コミット e5eb5e7）の §6 の表は、「生成（正常系）」行の途中で本文が欠落している（当該行の直後に欠落を示す文字列が1行入っている）。欠落した部分（生成系の残りの行と、それ以降の節）については、残存する本文（§1–§5 と §6 の入力チェック系4行）と統括からの実施指示に基づき、次のとおり判断して実施した。ブリーフ自体の修復は統括と本人の判断事項として、完了報告で申し送る
  - 生成系のテストは、実 API 生成をテストファイル内では行わず、モデル呼び出しをスタブ化して生成フローと根拠検査を検証する形にした。実生成はテストと分けて1回だけ実行し、`generation-run.json` と生成物で検証可能にした（工程1・工程2のテストが API を呼ばない再現可能な形だったことと整合させる判断）
  - 生成物の JSON 形式はブリーフ作業1の提案（文ごとの本文・factKeys・sourceLines）に、入力の組を特定するヘッダ（kind・version・promptVersion・model・input）を加えた形で確定した
- 引用粒度の原則（候補）は昇格していない（D8）。本実施は候補に従って生成と検査を行ったのみであり、監査では候補どおりに運用できたかと候補自体の妥当性が検証対象になる

## 観察事項

- 生成文は「〜であり、〜である」の機械的な連結が目立つ。仕様（修飾文を作らない、値を逐語保持する）の範囲内ではあるが、文体の自然さは工程4（再検証）や統合デモの段階で論点になり得る
- 出力トークンの大半（4,262 中 3,993）は推論トークンだった。生成コストの見積もりでは推論分の割合に注意が要る

## 次工程への引き継ぎ

- 本記録一式は監理ラインの監査を受ける。受け入れは統括と本人が行う
- 工程4（再検証）は `src/generate.mjs` の `checkGrounding` と `src/approve.mjs` の `checkApprovalValidity` を import して使える。生成物の合格はプレビュー許可であって公開許可ではない（G-INV-4）
- Git への着地（コミット・プッシュ）は本記録の作成時点では行っていない。書き込み用ラインの作業として残す

## 補強の記録（追記: 2026-10-27）

- 経緯: `loops/loop-008/brief-repair-diff-check.md` で「満たさない（軽微）」とされた項目（§6 生成（根拠検査）行の検出テストのカバレッジ不足）への対応として、本人の選択（テスト補強してから一括着地）により実施した
- 追加したテスト（`src/generate.test.mjs`、いずれも既存の検出ケースと同じくスタブ経由・2件の期待値で固定）:
  - 実在しない FACT key の検出: factKeys に `workLocationX` を含む文 → `gen-grounding-detects-unknown-factkey` / `gen-grounding-detects-unknown-factkey-names-it`（issue が `unknown factKey: workLocationX` を特定することまで確認）
  - 実在しない原本行 ID の検出: sourceLines に `L99` を含む文 → `gen-grounding-detects-unknown-sourceline` / `gen-grounding-detects-unknown-sourceline-names-it`（issue が `unknown sourceLine: L99` を特定することまで確認）
  - 根拠を持たない文の検出: factKeys・sourceLines が空で、FACT にない金額（交通費は月上限20,000円）を述べる文 → `gen-grounding-detects-ungrounded-sentence` / `gen-grounding-detects-ungrounded-sentence-names-it`（根拠の欠落と金額 20,000円 の両方が issue になることまで確認）
- 再実行（逐語）: `node src/generate.test.mjs --out loops/loop-008/check-verification.json` → **23/23 pass**（終了コード 0）。内訳は従来17件＋新規6件（追加3ケース × 各2件の期待値）
- 回帰確認（同日再実行）: `node src/approve.test.mjs` → 11/11 pass、`node src/extract-and-check.test.mjs` → 12/12 pass、`node src/extract-and-check.mjs --verify-offline --out-dir /tmp/loop008-regression-t3` → 6/6 pass。既存スイートの記録ファイルには触れていない
- 本補強では実 API を一切呼んでいない（テストはすべてスタブ経由）。追加費用なし（D5 のいずれの区分にも計上なし）。`check-verification.json` は本再実行で再生成済み（runAt が補強時点のものになっている）
