# ループ10 実行記録: 工程5（統合実行＋プレビュー）第1段階

- 実施日: 2026-10-28
- 実施者: 制作ライン（OpenCode）
- 対象工程: `docs/design/implementation-steps-v1.md` 工程5。実施計画は `docs/prompts/step5-brief.md`
- ブリーフの内容確認: 本ブリーフは実施前に本人が内容確認を行い、2026-10-28 10:05 JST に確定している（ブリーフ冒頭、および工程3監査の観察事項4の運用による）
- 段階の切り分け: 本記録は2段階実施の第1段階である。作業1-3と作業7、作業8のうち再検証の機械検査までの統合実行を行った。人間確認は未実施であり、プレビューの生成（`site/`）とデプロイは行っていない。第2段階は、人間確認の結果を受けてから、再検証結果への記入、プレビュー生成、公開前チェック、デプロイを行い、記録の更新分を別コミットとする
- 本実施は工程5の初回実施である。条件を変えての再実行は、再現性検証と改善実験を区別して別に記録する

## 入力版（明示、L-018）

- 開始時点の Git: `main` = `ed85c15ffb1019292557d20c9dc4560f08e2e252`（`step5: brief (loop-010)`。ブリーフ着地後のコミットであり、`git fetch origin` で `origin/main` と一致を確認し、作業ツリー clean で開始した。ブリーフの入力版の表が挙げる `95a899d` はブリーフ着地前の工程4の閉じ作業のコミットであり、開始時点の HEAD はその次の `ed85c15` である）
- 原本: FICT-J01 v1（`src/fict-j01-v1.json`、sha256 `a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60`）
- FACT: `FICT-J01-facts` 版1（`src/facts/FICT-J01-facts-v1.json`、sha256 `3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec`、manifest 併置）
- 承認記録: `src/facts/FICT-J01-facts-v1.approval.json`（approvalId `FICT-J01-approval-1`、status: approved、承認者 Norikazu Harada（本人）、承認日時 2026-10-27T19:58:09+09:00）
- 工程3の生成物（参照）: `loops/loop-008/generated-lp-v1.json`（sha256 `29035f940457fddd0df4532c46b2a9db1bc5c680851e7c0459594c9e1cc2a9be`、7文）
- 工程4の再検証結果（参照）: `loops/loop-009/verification-result.json`（verdict: pass。効果はデモ内プレビューの許可まで）
- 統合対象の道具: `src/extract-and-check.mjs`、`src/approve.mjs`、`src/generate.mjs`、`src/verify.mjs`。モデルはいずれも `muse-spark-1.3-contributor`、抽出プロンプトは `fact-extract-v1.1`、生成プロンプトは `lp-generate-v1`
- API キーは環境変数 `MODEL_API_KEY` で受け取った。キー値は、いずれのファイル・ログ・記録にも書いていない（存在の確認のみを行った）

## 実施内容

### 1. 統合ランナー（`src/run-demo.mjs`）とプレビュー生成器（`src/build-preview.mjs`）

- `src/run-demo.mjs` は薄いランナーであり、新しい判定ロジックは作っていない。各工程の合否はその工程の道具の出力で決める: 照合の判定（`src/extract-and-check.mjs` の E01/E02 の verdict）、承認の有効性（status と `checkApprovalValidity` の再計算の組み合わせを `checkGenerationInput` の再適用で記録）、生成の入力チェックと根拠検査（生成の status だけでは判定しない、L-021）、再検証の判定（`src/verify.mjs` の `runVerification`）
- 後段は前段の合格でのみ実行する。矛盾、抽出候補と固定済み FACT v1 の実質的な食い違い、承認の有効性が再確認できないこと、入力同一性の不一致では、後段の道具を呼ばず、止まった工程と理由を統合結果に記録する。「警告を無視して進める」経路は作っていない
- 抽出候補と固定済み FACT の比較は、キー集合・status・normalized・sourceLine を実質的な食い違いとし、文言と引用粒度の差は `textualDiffs` として記録するが停止理由にしない（ループ6で、粒度差は意味・数値・行対応を変えなかった知見に基づく）。引用の逐語性は既存の `checkQuoteVerbatim` で確認する
- 承認は人間の行為であり、統合実行では新たに作らない。E02 については承認を試みない（G-INV-3）
- 自動実行は再検証の機械検査までとし、最終判定が `pending-human-confirmation` の間はプレビューに進まない（L-026 の前提の維持）。引用粒度の原則（候補）は本工程でも昇格していない（D8）
- ライブ実行は CLI 連携で行う: 抽出は `src/extract-and-check.mjs --prompt v1.1 --out-dir loops/loop-010/extraction`、生成は `src/generate.mjs --approval src/facts/FICT-J01-facts-v1.approval.json --original src/fict-j01-v1.json --facts src/facts/FICT-J01-facts-v1.json --out loops/loop-010/generated-lp-v1.json --run-out loops/loop-010/generation-run.json` を、統合ランナーが子プロセスとして実行して結果を集約する。再検証は `runVerification` を import して実行する
- `src/build-preview.mjs` は、再検証結果の `verdict` が pass（status: pass、pass: true）であることを生成器自身が確認し、pass でない場合は HTML を生成しない。LP 本文は生成物の text をそのまま順序どおりに入れる。第1段階では `site/` への生成は行っておらず、生成ケースはテスト内の一時フォルダでだけ確認した

### 2. テスト（`src/run-demo.test.mjs`）

- 実行引数（逐語）: `node src/run-demo.test.mjs --out loops/loop-010/check-verification.json` -> **51/51 pass**（終了コード 0）。結果は `loops/loop-010/check-verification.json` に記録した
- 内訳: FACT 比較4件（文言差は記録するが停止しないこと、実質的な差は食い違いになること）、承認の段階2件、統合（E01）18件（スタブ化した抽出・生成で、抽出→FACT 比較→承認→生成→再検証の機械検査までが通り、最終判定が人間確認なしでは未確定のままであること、プレビューが実行されないこと、E02 が照合で停止して承認・生成・再検証・プレビューが実行されないことと停止理由の記録を含む）、人間確認を注入した場合の判定3件（最終判定が pass になっても、機械検査までの実行ではプレビューを生成しないこと）、止まる条件7件（E01 の照合停止、FACT 候補の実質的な食い違いでは生成を呼ばないこと）、入力同一性4件（FACT を差し替えたスクラッチコピーでは入力チェック（理由コード `approval-invalid`）で生成に進まず、生成の API を呼ばないこと）、プレビュー13件（改変した生成物の再検証不合格と、verdict が未確定の場合にプレビューが生成されないこと、pass の場合に生成され、LP 本文の文が生成物の text とバイト一致し、未記載の表示・E02 の停止表示・効果がプレビュー許可までである旨が含まれること、一時フォルダへの書き出しの可否）
- テストは API を呼ぶ工程をスタブ化しており、実 API は呼んでいない。改変ケースはクローンまたは一時フォルダのコピーで行い、固定ファイルは書き換えていない
- 回帰確認（実行引数は逐語。出力はリポジトリ外の一時フォルダとし、既存スイートの記録には触れていない）:
  - `node src/extract-and-check.test.mjs --out C:\Users\norik\AppData\Local\Temp\opencode\loop010-final-extract.json` -> 12/12 pass
  - `node src/extract-and-check.mjs --verify-offline --out-dir C:\Users\norik\AppData\Local\Temp\opencode\loop010-final-offline` -> 6/6 pass
  - `node src/approve.test.mjs --out C:\Users\norik\AppData\Local\Temp\opencode\loop010-final-approve.json` -> 11/11 pass
  - `node src/generate.test.mjs --out C:\Users\norik\AppData\Local\Temp\opencode\loop010-final-generate.json` -> 23/23 pass
  - `node src/verify.test.mjs --out C:\Users\norik\AppData\Local\Temp\opencode\loop010-final-verify.json` -> 42/42 pass
  - 既存スイート（工程1の12件とオフライン検証6件、工程2の11件、工程3の23件、工程4の42件）に回帰はない

### 3. 統合実行（ライブ、1回のみ）

- 実行引数（逐語。PowerShell で、キーの値はコマンドにもログにも残していない）: `$env:MODEL_API_KEY=[Environment]::GetEnvironmentVariable("MODEL_API_KEY","User"); node src/run-demo.mjs --out-dir loops/loop-010` -> 終了コード 0、統合結果は `loops/loop-010/run-result.json` に記録した
- 実行環境の経緯: 本セッションの開始時点ではプロセスの環境変数に `MODEL_API_KEY` がなく、ライブ実行ができない状態で一時停止して報告した。その後、本人がユーザー環境変数として設定したことを、値を見ずに存在のみで確認し、上記のとおり実行プロセスにだけ読み込んで再開した
- 各工程の判定（いずれも各道具自身の出力による）:
  - 抽出・照合: 完了（37,723ms）。スキーマ完全性 pass（15件）。E01 は「一致（人間承認待ち）」を再現し、停止しなかった。抽出の実行記録は `loops/loop-010/extraction/live-run.json`、使用プロンプトは `loops/loop-010/extraction/prompt-fact-extract-v1.1.md`
  - FACT 候補と固定済み FACT v1 の比較: 引用逐語性 pass（15件）。実質的な食い違いはなし（diffs 0件）。引用の言い回しの差は4件を `textualDiffs` として記録した（workHours、breakMinutes、actualHours、transport の quote）
  - 承認の有効性の再確認: pass。status は approved で approver と approvedAt が入り、`checkApprovalValidity` の再計算は `valid: true`（原本・FACT の両ハッシュ一致）。新しい承認は作っていない
  - 生成: `generated`（25,452ms）。生成物の根拠検査は pass（9文、issues なし）。生成物は `loops/loop-010/generated-lp-v1.json`（9文、sha256 `12e71778517639a4d1ab4f95656672eccd012cdc867009815dfa600dd86f675c`）、実行記録は `loops/loop-010/generation-run.json`、使用プロンプトは `loops/loop-010/prompt-lp-generate-v1.md`
  - 再検証（機械検査）: 入力同一性 pass（内訳8件すべて pass）、根拠検査の再実行 pass（9文、issues なし）、機械検査 pass（`mechanicalPass: true`）。結果は `loops/loop-010/verification-result.json` に記録した。この結果は生成側の申告値とは独立に再実行したものである
  - プレビュー: 実行していない。最終判定が未確定のためであり、理由は `run-result.json` の `stages.preview` に記録した
- 生成物の文数と構成: 本ループの生成物は9文である。stated 13項目に加え、未記載2項目（renewal・housing）を「未記載である」ことだけを述べる文として含む（工程3の定めで許容される扱い）。全15項目が文に現れる

### 4. 停止系（E02）

- E02 は同じ抽出実行の評価で「停止（矛盾あり）」を再現した。矛盾の内訳: 給与（時給）について、FACT は `時給1,500円`（L03「給与は時給1,500円。」）であるのに対し、要約側は `時給1,700円` である
- E02 については承認・生成・再検証・プレビューを実行していない。その旨と理由は `run-result.json` の `e02` に記録した。E02 の承認は試みていない（承認記録は存在せず、作らない。G-INV-3）

### 5. 人間の確認と最終判定（第1段階の状態）

- 人間の確認（意味の対応）は未実施である。`loops/loop-010/verification-result.json` の `humanConfirmation` は、対象9文の本文・factKeys・sourceLines を並べた雛形とし、文ごとの結果、確認者、確認日時は未記入（null）のまま残した
- 最終判定は未確定（`pending-human-confirmation`）である。機械検査は pass したが、全文化の人間確認が終わるまで再検証は合格にならず、プレビューにも進まない。確認者は統括と本人とし、統合実行で得られた生成物の全文について行う
- 第1段階の報告では、生成物の全文化（文ごとに factKeys つき）をそのまま提示し、人間確認を受ける

## 実費（D5 の区分: 製品実行）

- 統合実行1回: 合計 $0.0018187（D4 単価による算出値。確定実費は dev.meta.ai Billing 実績との突合が必要）
  - 抽出（工程1、ライブ）: $0.0010938。usage は入力 388、出力 5,275（うち推論 4,649）トークン
  - 生成（工程3、ライブ）: $0.0007249。usage は入力 839、出力 3,205（うち推論 2,879）トークン
  - 再検証とプレビュー生成器のテスト: API を呼ばないため費用なし
- テストと回帰確認は API を呼んでいないため費用なし
- 実施ラインのセッション利用は Meta API 側の消費に含まれ、個別の帰属は Billing 突合で確認する（L-012）

## ブリーフとの差異と判断

- 本ループの生成物は9文であり、ブリーフ作業5が前提にしていた7文（工程3の生成物の文数）と文数が異なる。これは生成の実行ごとの構成差であり、未記載項目を「未記載である」文として含むかどうかによる。生成物そのものは書き換えず、第2段階のプレビューでは本ループの生成物の全文（9文）をそのまま、生成物の順序どおりに表示する。文そのものを直す場合は工程3の再実行と工程4の再検証のやり直しとして扱う
- 統合結果の成果物パスは、記録上はスラッシュ区切りに統一した。ライブ実行直後に Windows のパス区切りで記録された文字列（生成物と再検証結果への参照）があり、判定や内容を変えずに表記だけを統一した。あわせてランナー側も記録用パスをスラッシュ区切りに正規化するよう直し、テストを再実行して 51/51 pass を再確認した
- 上記以外に、ブリーフと実装の間に矛盾や不明点は見つからなかった。入力版のハッシュ（生成物・原本・FACT）は開始時点で実バイトから再計算し、ブリーフ記載値と一致した

## 観察事項

- 生成文は「〜で、〜。」の連結が残る。文体の自然さ（L-022）は生成の合否には含めず、第2段階のプレビューでは表示方法（HTML の構造、見出しや段落の組み立て、スタイル）の範囲でのみ扱い、文そのものは書き換えない
- 抽出の再実行では引用の粒度差（4件）が再び出たが、意味・数値・行対応は固定済み FACT と一致した。粒度差の記録は `run-result.json` の `stages.factsComparison.textualDiffs` に残した

## 次の段階への引き継ぎ

- 統括と本人が、本ループの生成物9文について意味の対応の人間確認を行い、結果を渡す
- 第2段階では、その結果を `loops/loop-010/verification-result.json` の人間確認の節に記入して最終判定を確定し、合格の場合にだけ `site/` へプレビューを生成して公開前チェックを行い、新規のハッカソン専用プロジェクト（MJ のゾーン・DNS・既存プロジェクトには触れず、カスタムドメインは追加しない）にデプロイする。公開 URL は第2段階の記録に残す
- シナリオ記録（`loops/loop-010/scenario-record.md`）は下書きであり、固定は 2026-10-31 に行う（L-006）
- 本記録一式は監理ラインの監査を受ける。受け入れは統括と本人が行う
