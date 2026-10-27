承認記録の様式 v1（工程2の前提）
状態: 決定済み（2026-10-27、統括の様式案を本人が採用。ステップ v1 の定め（10/29 朝）から前倒しで決定した）
根拠: ステップ v1 工程2（承認は記録への記入、矛盾があれば承認不可、版が変われば無効）、基本設計 v1.1 の G-INV-3・G-INV-4、工程1監査の申し送り（組を指す単一の形式を先に固定すること）
1. 承認対象の指名形式（単一形式）
承認は「原本版と FACT 版の組」を、ファイル名とハッシュ（F1 で定義した Git バイト列・LF の sha256）で指名する。文章中・記録中の表記もこの形に統一する。
完全形: FICT-J01 原本 v1（src/fict-j01-v1.json、sha256 a4456e9f…a60）× FACT v1（src/facts/FICT-J01-facts-v1.json、sha256 3dc7fbd1…34ec）
短縮形（同一文書内で完全形を示した後）: FICT-J01 原本 v1 × FACT v1
2. 置き場所と正本
承認記録は FACT ファイルに隣接させる: src/facts/FICT-J01-facts-v1.approval.json（FACT 版ごとに最大1つ）
正本は JSON。人間可読な転記は工程2の実行記録（loops/loop-007）側に置く
3. フィールド定義
{
  "approvalId": "FICT-J01-approval-1",
  "approver": "Norikazu Harada（本人）",
  "approvedAt": "<ISO 8601>",
  "target": {
    "original": { "id": "FICT-J01", "version": "v1", "file": "src/fict-j01-v1.json", "sha256": "a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60" },
    "facts": { "factsId": "FICT-J01-facts", "factsVersion": 1, "file": "src/facts/FICT-J01-facts-v1.json", "sha256": "3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec" }
  },
  "basis": {
    "reconciliation": "loops/loop-006/exp-v1.1/live-run.json の e01（一致（人間承認待ち））",
    "schemaCheck": "pass（loops/loop-006/check-verification.json）",
    "verbatimCheck": "pass（同上、15件）"
  },
  "scope": {
    "covers": "stated 項目のみ",
    "unstatedItems": ["renewal", "housing"],
    "unstatedNote": "未記載は未記載として表示に残し、承認の対象に含めない",
    "effect": "工程3（生成）の入力として使用できること。再検証の合格は公開許可ではない（G-INV-4）"
  },
  "validity": {
    "rule": "原本または FACT の sha256 が本記録と異なれば無効とし、照合からやり直す",
    "invalidated": false,
    "invalidatedReason": null
  }
}
4. 承認不可の条件（様式レベルの決まり）
照合が「停止（矛盾あり）」の対象には承認記録を作らない。「警告を無視する承認」にあたる分岐は様式にも実装にも設けない（G-INV-3）
承認の作成時は、対象2ファイルの sha256 を再計算し、manifest および本記録の指名と一致することを先に確認する。一致しなければ承認を作成しない
5. 工程2の実装への要求（ステップ v1 の完了条件3点に対応）
正常系: 承認を作る小さな道具（スクリプト）で、ハッシュ照合 → 照合結果が「一致」であることの確認 → 承認 JSON の作成までを行う
矛盾系: 矛盾のある FACT（テスト用に用意する）では承認が作成できないことを実行記録に残す
版変更系: 現在の2ファイルのハッシュと承認記録を比べて有効・無効を判定する関数を用意し、FACT のコピーを改変したケースで無効と判定できることを残す。この判定は工程4（再検証）からも使う
6. 残す未決
承認の「取り消し」（本人が明示的に撤回する操作）を様式に含めるか。本案では無効化のみで足りるとして含めていない
対象が増えた場合（FICT-J02 以後）の approvalId の連番規則
