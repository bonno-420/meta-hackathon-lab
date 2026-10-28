# ループ9 実行記録: 工程4（再検証）

- 実施日: 2026-10-28
- 実施者: 制作ライン（OpenCode）
- 対象工程: `docs/design/implementation-steps-v1.md` 工程4。実施計画は `docs/prompts/step4-brief.md`
- ブリーフの内容確認: 本ブリーフは 2026-10-28 に本人が内容確認を済ませている（工程3監査の観察事項4への運用対応として記録する）
- 本実施は工程4の初回実施である。再検証の条件を変えての再実行は、再現性検証と改善実験を区別して別に記録する

## 入力版（明示、L-018）

- 開始時点の Git: `main` = `29835c1afc5a9beab1e045446d34167520485216`（`git fetch origin` で `origin/main` と一致を確認し、作業ツリー clean で開始。開始時点の HEAD は工程4ブリーフの着地コミット `29835c1`（`step4: re-verification brief`）である）
- 生成物: `loops/loop-008/generated-lp-v1.json`（sha256 `29035f940457fddd0df4532c46b2a9db1bc5c680851e7c0459594c9e1cc2a9be`、生成プロンプト版 `lp-generate-v1`、モデル `muse-spark-1.3-contributor`、7文。開始時点で実バイトから再計算し、ブリーフ記載値と一致した）
- 原本: FICT-J01 v1（`src/fict-j01-v1.json`、sha256 `a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60`）
- FACT: `FICT-J01-facts` 版1（`src/facts/FICT-J01-facts-v1.json`、sha256 `3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec`、manifest 併置）
- 承認記録: `src/facts/FICT-J01-facts-v1.approval.json`（approvalId `FICT-J01-approval-1`、status: approved、承認者 Norikazu Harada（本人）、承認日時 2026-10-27T19:58:09+09:00）
- 工程3の記録: `loops/loop-008/` 一式と監査レポート `docs/design/step3-review.md`（監査合格・受け入れ済み、閉じ作業のコミット `d2d2e2b`）。工程3の実行記録の申告値は本実施の判定材料にしていない
- 対象の範囲: E01 の承認済みペアに対する生成物のみ。E02 は工程3で入力段階の拒否により生成物が存在しないため対象なし。E03-E10 は対象外

## 実施内容

### 1. 再検証の道具（`src/verify.mjs`）

- 構造は工程1-3の道具に倣い、import 可能な関数と CLI を分けた。`checkInputIdentity`（入力同一性の検査）、`runVerification`（再検証の実行）、`decideVerdict`（判定）、`buildHumanConfirmationTemplate`（人間確認セクションの雛形）
- 既存の検査を import して再利用し、新しい物差しは作っていない。根拠検査は `src/generate.mjs` の `checkGrounding`、承認の有効性は `src/approve.mjs` の `checkApprovalValidity` とハッシュ計算 `sha256File` を import する。入力同一性のうち承認まわりの判定は、工程3の開始条件と同じもの（`src/generate.mjs` の `checkGenerationInput`）を再適用する
- 道具は API を呼ばない。モデルも API キーも使わない。再検証はオフラインで完結する。ハッシュの定義は F1（ファイルの保存バイト列そのものに対する sha256、UTF-8/LF）に統一した
- 判定は生成物の status や工程3の実行記録の申告値からは出さない。再検証側で得た入力同一性の結果、根拠検査の再実行結果、人間の確認の結果の3点だけで出す（工程3監査の観察事項2の反映）。再検証では生成物を改変しない

### 2. 機械検査（a）: 入力同一性

- 検査対象の原本・FACT ファイルは、生成物ヘッダの `input.original.file` と `input.facts.file` が指すものとした。次の3点をすべて満たす場合に限り後段に進み、1つでも満たさなければ失効として不合格にし、根拠検査には進まない
  1. ヘッダと現在のファイルの一致: ヘッダの `input.original.sha256` と `input.facts.sha256` が現在のファイルの実バイトから再計算した sha256 と一致すること（ファイル名もヘッダの指すものと一致すること）
  2. 承認記録の特定: ヘッダの `input.approvalId` が渡された承認記録の `approvalId` と一致すること
  3. 承認の有効性: 承認記録の `status` が `approved` で approver と approvedAt が入っていること、かつ `checkApprovalValidity` を実行時点で再計算して `valid: true` であること（工程3の開始条件と同一の2条件。承認記録内に静的に残っている `validity.invalidated` は根拠にしない。下書きは再計算で `valid: true` でも不合格とする）
- 実生成物に対する結果: pass。内訳8件（original-file、facts-file、original-hash、facts-hash、approval-id、approval-status、approval-validity、generation-input）すべて pass、failures は空。詳細は `loops/loop-009/verification-result.json` の `inputIdentity` に残した

### 3. 機械検査（b）: 根拠検査の再実行

- 入力同一性が確認できた生成物について、`checkGrounding` を import して再実行した。渡した生成物・FACT・原本は、入力同一性を確認したファイルの組である
- 実生成物に対する結果: pass（checked 7文、issues なし）。この結果は工程3の `generation-run.json` の申告値とは独立に、再検証の結果として `verification-result.json` の `grounding` に記録した
- 機械検査の範囲は工程3監査の観察事項1のとおり限定されている（円金額と時刻の逐語、代表的な数値項目の引用時の値の保持、未記載の断定のパターン、月20日勤務の仮定と月収の非保証の文言）。期間・個数などの数量表現と、文と根拠の意味の対応は機械では覆えないため、人間の確認に残る
- 機械検査の総合: pass（入力同一性 pass かつ根拠検査の再実行 pass、`mechanicalPass: true`）

### 4. テスト（`src/verify.test.mjs`）

- 実行引数（逐語）: `node src/verify.test.mjs --out loops/loop-009/check-verification.json` -> **42/42 pass**（終了コード 0）。結果は `loops/loop-009/check-verification.json` に記録した
- 内訳: 正常系8件（実生成物で入力同一性が確認でき根拠検査の再実行が pass すること、機械検査 pass、人間確認なしでは最終判定が未確定（pending-human-confirmation）のままであること、人間確認の雛形が全文化未記入であることを含む）、判定関数の検証4件（合成した人間確認の完了形で合格となり効果がプレビュー許可までであること、不一致で不合格になること）、改変検出14件（金額1,500円->1,700円の書き換え、未記載項目の断定文「寮あり」の混入、未知の factKey `workLocationX`、未知の行 ID `L99`、根拠を持たない文（factKeys が空で FACT にない金額を述べる文）。いずれも根拠検査で検出され不合格になることまで確認）、入力同一性16件（FACT を差し替えた組ではハッシュ不一致で失効となり根拠検査に進まないこと、承認記録が下書きの組では再計算の有効性が `valid: true` でも `approval-not-approved` で不合格となり根拠検査に進まないこと、ヘッダの approvalId を書き換えた生成物では承認記録を特定できず不合格となり根拠検査に進まないこと）
- 改変ケースはリポジトリ内の固定ファイルを書き換えず、クローンまたは一時フォルダにリポジトリ構造を写したコピーで行った。テストはすべてオフラインで再現可能であり、API は呼んでいない
- 意図的にずらした生成物が差し戻し（不合格）になることは、上記の改変検出と入力同一性のケースの実行記録（`check-verification.json`）として残した

### 5. 実生成物に対する再検証の実行

- 実行引数（逐語）: `node src/verify.mjs --generation loops/loop-008/generated-lp-v1.json --approval src/facts/FICT-J01-facts-v1.approval.json --out loops/loop-009/verification-result.json` -> 終了コード 0、結果は `loops/loop-009/verification-result.json` に記録した
- 結果: 入力同一性 pass、根拠検査の再実行 pass（7文、issues なし）、機械検査 pass。人間の確認は未実施のため、最終判定は未確定（`pending-human-confirmation`）である

### 6. 回帰確認

- 実行引数（逐語。記録ファイルはリポジトリ外の一時フォルダに出し、既存スイートの記録には触れていない）:
  - `node src/extract-and-check.test.mjs --out C:\Users\norik\AppData\Local\Temp\opencode\regression-extract.json` -> 12/12 pass
  - `node src/extract-and-check.mjs --verify-offline --out-dir C:\Users\norik\AppData\Local\Temp\opencode\loop009-regression` -> 6/6 pass
  - `node src/approve.test.mjs --out C:\Users\norik\AppData\Local\Temp\opencode\regression-approve.json` -> 11/11 pass
  - `node src/generate.test.mjs --out C:\Users\norik\AppData\Local\Temp\opencode\regression-generate.json` -> 23/23 pass
- 既存スイート（工程1の12件とオフライン検証6件、工程2の11件、工程3の23件）に回帰はない

## 人間の確認（意味の対応）と最終判定

- 人間の確認は本実施では未実施である。`verification-result.json` の `humanConfirmation` の節は、対象7文の本文・factKeys・sourceLines を並べた雛形として用意し、文ごとの確認結果（result、detail）、確認者（confirmer）、確認日時（confirmedAt）は未記入（null）のまま残した。確認者は統括と本人とし、文ごとに (1) 文が実際に使っている項目と factKeys・sourceLines の対応、(2) 期間・個数などの数量表現と FACT の値の意味の一致、(3) 否定・条件の意味の反転の有無、(4) 公開や申込の受付と読める表現の混入の有無、を確認する
- 最終判定: **未確定**（`pending-human-confirmation`）。機械検査は pass したが、全文化の人間確認が終わるまで再検証は合格にならない。最終判定は、機械検査の結果を受けたうえで統括と本人が人間確認を行って確定する
- 合格となった場合の効果は、デモ内プレビューの許可までであり、公開の許可ではない（G-INV-4）。この効果の範囲は `verification-result.json` の `verdict.effect` と本節の両方に明記した。再検証は公開の可否を判定しない
- LLM による意味チェックは本工程では入れていない。機械で覆えない範囲を LLM の判定で覆ったことにすると検査範囲の境界が曖昧になり、「機械検査＋人間の確認」という分担自体の検証ができなくなるためである。将来の改善実験の候補として記録に留めるに限る
- 引用粒度の原則（候補）は本工程でも昇格していない（昇格は本人の承認事項、D8）

## 実費（D5 の区分: 製品実行）

- 金額は 0 と記録する。再検証の道具は API を呼ばないため費用が発生しない（再検証は製品実行区分に含まれる工程だが、今回の実行では推論を伴わない）
- 実施ラインのセッション利用は Meta API 側の消費に含まれ、個別の帰属は Billing 突合で確認する（L-012）

## ブリーフとの差異と判断

- ブリーフ §9 の完了条件は「機械検査 pass と人間確認を経て合格となり、結果と run-record がそろっていること」としているが、本実施では制作ラインへの依頼により、人間確認の節を未記入のまま残し、最終判定を統括と本人による人間確認の後に確定する扱いとした。そのため本記録の時点では、機械検査 pass までを実施済みとし、最終判定は未確定として残す。この扱いと理由を本節に記録する（自己検証の置き場は `loops/loop-009/check-verification.json` とする定めに変更はない）
- 上記以外に、ブリーフと実装の間に矛盾や不明点は見つからなかった。入力版のハッシュ（生成物・原本・FACT）は開始時点で実バイトから再計算し、ブリーフ記載値と一致した

## 観察事項

- 生成文は「〜であり、〜である」の機械的な連結が目立つ（工程3監査の観察事項3）。工程4は生成物を改変しない工程であり、文体は再検証の判定にも含めない。文体の扱いは工程5（統合デモ）で表示の仕方とあわせて論点とし、本実施では観察として残すに留める
- 再検証の独立性は物差しを変えることではなく、生成側の申告値を材料にしないこと、入力の同一性を現在のバイト列から取り直すこと、検査を再検証側の実行として再び走らせることで担保する設計とした。この設計の是非は監査の対象とする

## 次工程への引き継ぎ

- 本記録一式は監理ラインの監査を受ける。受け入れと最終判定の確定は、統括と本人が人間確認を行ったうえで行う
- 不合格の場合は工程3への差し戻しとし、直す場合は工程3の再実行として扱う。再実行で得た生成物は改めて再検証の対象になる
- Git への着地（コミット・プッシュ）は本記録の作成時点では行っていない。書き込み用ラインの作業として残す。成果物は作業ツリーに置いたままにする

## 人間確認の完了と最終判定の確定（追記: 2026-10-28）

- 経緯: 上記の機械検査 pass の記録時点では、人間の確認（意味の対応）は未実施で最終判定は未確定（`pending-human-confirmation`）として残していた。本節は、その後の人間確認の完了と最終判定の確定を追記するものであり、機械検査の結果（入力同一性 pass、根拠検査の再実行 pass）には変更はない
- 確認者: 統括（Muse Bot）と本人（Norikazu Harada）
- 本人の確認日時: 2026-10-28 09:11 JST（統括との会話で実施）。`verification-result.json` には `2026-10-28T09:11:00+09:00` として記録した
- 確認結果: 対象7文すべてについて意味の対応を確認済みとし、結果は pass（文ごとの結果は「対応あり」）とした。確認内容は次のとおりである
  - 文が実際に使っている項目と、その文に付けられた factKeys・sourceLines の対応が取れている
  - 文が使っているのに根拠に付けていない項目はなく、使っていないのに付けられた項目もない
  - 未記載項目（renewal・housing）への言及はない
  - 期間・個数などの数量表現（契約期間3か月、月上限10,000円など）が FACT の値と意味のうえで一致している
  - 否定の保持: 「月収は保証しない。」が保証と読める文になっていない
  - 仮定の保持: 「月20日勤務は試算用の仮定である。」が仮定として保持され、月収の金額提示はない
  - 公開や申込の受付と読める表現の混入はない
  - 文ごとの確認結果・detail は `loops/loop-009/verification-result.json` の `humanConfirmation.sentences` に記録した（status: completed、confirmer: 統括（Muse Bot）と本人（Norikazu Harada））
- 最終判定: **合格（pass）** に確定した。根拠は再検証側で得た3点のみである: 入力同一性の結果（pass）、根拠検査の再実行結果（pass、7文、issues なし）、人間の確認の結果（7文すべて対応あり）。生成物の status や工程3の実行記録の申告値は根拠にしていない
- 効果: デモ内プレビューの許可までであり、公開の許可ではない（G-INV-4）。再検証は公開の可否を判定しない。この記載は `verification-result.json` の `verdict.effect` でも維持した
- 本追記に伴う変更は `loops/loop-009/verification-result.json`（人間確認の記入と最終判定の確定）と本ファイルのみであり、`src/verify.mjs`、`src/verify.test.mjs`、`loops/loop-009/check-verification.json` は変更していない。追加の API 呼び出しはなく、実費は引き続き 0（D5 の製品実行）である
- Git への着地（コミット・プッシュ）は本追記の時点でも行っていない。書き込み用ラインの作業として残す
