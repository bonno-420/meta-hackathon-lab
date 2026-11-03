# loop-022 実行記録 — 実走確認（Baseten）

- 指示: 本人（2026-11-03 23:21「Bastenでやって」、23:22 実走確認の実施を承認）
- 実施者: 統括（Muse）
- 対象: 監査プロンプト L1–L3（新しい架空求人を投入口から最後まで）

## 実行基盤

- 文章工程（抽出・生成）: Baseten `meta-models/muse-spark-open-1026`（https://inference.baseten.co/v1、max_tokens 8000 は loop-016 の実証に基づく）
- 画像工程: Meta Model API `muse-image-1.0`（Baseten では提供されないため。工程ごとのキー振り分けは liveDeps の textApiKey / imageApiKey）
- 接続: 両 API とも Secure Vault 登録の資格情報をサロゲート経由で子プロセスの環境変数に渡すブリッジで疎通確認済み（実キーはチャット・ファイル・ログに出ていない）

## 準備として行った変更（loop-021 監査済みコードへの追加）

1. エンドポイント差し替え: `PIPELINE_BASE_URL` / `PIPELINE_MODEL` / `PIPELINE_MAX_TOKENS`（既定は従来どおり Meta＋contributor で挙動不変）。モデル差し替え時は D4 単価が適用できないため、費用は算出せず usage のみ記録する。
2. 工程ごとのキー振り分け（run-demo liveDeps）: 文章工程と画像工程で別の資格情報を渡せる。
3. **実走で見つけた不具合の修正**: `checkQuoteVerbatim` が未記載項目（出典行なし）を「sourceLine not found」で一律に落としていた。原本が未記載を明示して引用できる形（採用済み FICT-J01 FACT の形）と、求人票が沈黙している形（出典なし）の両方を正とし、出典が半端なものと、記載ありで出典なしのものは落とすよう修正。回帰テスト4件を `pipeline-fix.test.mjs` に追加（全スイート通過、pipeline-fix は 60/60）。

## L1（run2、修正後）

- 投入: `loops/loop-022/posting-FICT-J02.txt`（8行、架空）
- 抽出（Baseten）: スキーマ 15/15 pass、E01 照合「一致（人間承認待ち）」、引用逐語性 pass
- 候補（`run2/entry/facts.json`、sha256 は run-result.json に記録）: 記載あり8件 — workLocation=愛知県豊橋市内の物流倉庫（L03）／ employmentType=有期契約社員（L02）／ contractPeriod=3か月（L02）／ salaryHourly=1,350円（L04）／ workHours=07:00〜16:00（L05）／ breakMinutes=60分（L05）／ transport=実費支給（L07）／ transportCap=15,000円（L07）。未記載7件（employer、jobId、renewal、monthlyIncomeGuarantee、actualHours、monthlyDaysAssumption、housing）は出典なしで保持
- 停止: approval（承認記録なし）— 設計どおりの停止。**L1 合格**
- run（attempt 1、`run/`）: 修正前の逐語性チェックで facts-comparison 停止。不具合の実証として保持

## 要確認（観察）

- FACT スキーマ15キーは仕事内容・応募資格・休日を含まない（工程1以来の既存設計）。これらは原本の行として企画・画像の根拠には使えるが、FACT の文にはならない。L3 の完成 LP で実物を見て判断する材料とする

## 次の停止点

- 本人の FACT 承認（この候補の組に対して）と、企画入力 `planning-FICT-J02.json` の承認 → L2（1枚画チェックポイントまで）
