ループ7 実行記録: 工程2（承認）
実施日: 2026-10-27
実施者: Muse Bot（統括）。D9 の体制
対象工程: docs/design/implementation-steps-v1.md 工程2。実施計画は docs/prompts/step2-brief.md
承認記録の様式: docs/design/approval-record-format-v1.md（2026-10-27 に本人が統括の様式案を採用し、10/29 朝の定めから前倒しで決定）
入力版（明示）
開始時点の Git: main = ee9a3ea（origin/main と一致）
原本: FICT-J01 v1（src/fict-j01-v1.json、sha256 a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60）
FACT: FICT-J01-facts 版1（src/facts/FICT-J01-facts-v1.json、sha256 3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec、manifest 併置）
承認の根拠: loops/loop-006/exp-v1.1/live-run.json の e01（一致（人間承認待ち））、loops/loop-006/check-verification.json（スキーマ・逐語性 pass）
実施内容
1. 承認の道具（src/approve.mjs）
buildApprovalDraft: 下書きを作る前に、原本と FACT の sha256（F1 の定義）を再計算して manifest と照合する。一致しなければ下書きを作らない。照合が「停止（矛盾あり）」の対象にも下書きを作らない（G-INV-3）。下書きの approver と approvedAt は null のままにする（承認の確定は本人の行為）
checkApprovalValidity: 現在の両ファイルのハッシュと承認記録を比べて有効・無効と理由を返す。工程4（再検証）からも import して使う想定
実行引数（逐語）: node src/approve.mjs draft --original src/fict-j01-v1.json --facts src/facts/FICT-J01-facts-v1.json --manifest src/facts/FICT-J01-facts-v1.manifest.json --reconciliation loops/loop-006/exp-v1.1/live-run.json --case E01 --checks loops/loop-006/check-verification.json --out loops/loop-007/approval-draft.json
2. 完了条件3点の確認（テストとして再現可能に残した）
テスト: src/approve.test.mjs、実行 node src/approve.test.mjs --out loops/loop-007/check-verification.json → 11/11 pass
正常系: 対象の組について下書きが作れる（ハッシュ2件・未記載項目 renewal／housing の切り分けを含む）。確定は本人の確認後（本記録の状態を参照）
矛盾系: E02（停止（矛盾あり））では下書きの作成が拒否される
版変更系: 改変した FACT のコピーでは下書きが拒否され（manifest とのハッシュ不一致）、確定済み承認の写しに対する無効判定も「無効＋理由あり」になる
3. 承認の下書き
loops/loop-007/approval-draft.json を作成した。対象は FICT-J01 原本 v1 × FACT v1、approvalId は FICT-J01-approval-1
状態は下書き（status: draft、approver: null）であり、承認はまだ成立していない。本人の確定後に、確定した承認記録を src/facts/FICT-J01-facts-v1.approval.json として置く
実費
実 API の実行なし（機械処理のみ）。Muse Bot の推論費は未記録（計測手段が未整備のため推測しない）
次の手順
本人の確定 → 確定した承認記録の配置 → 監理ラインの監査 → 受け入れ。監査依頼文は確定後に用意する
承認の確定（2026-10-27）
本人（Norikazu Harada）が下書きの内容（対象の組・根拠・未記載の扱い・効果）を確認し、確定した
確定した承認記録を src/facts/FICT-J01-facts-v1.approval.json に配置した。人間可読の要約: approvalId FICT-J01-approval-1、承認者 Norikazu Harada（本人）、承認日時 2026-10-27T19:58:09+09:00、対象は FICT-J01 原本 v1 × FACT v1、範囲は stated 項目のみ、未記載（renewal・housing）は承認の対象外
配置直後に無効判定を実行し、有効を確認した（逐語: node src/approve.mjs check --approval src/facts/FICT-J01-facts-v1.approval.json --original src/fict-j01-v1.json --facts src/facts/FICT-J01-facts-v1.json → valid: true、両ハッシュ一致）
これにより承認は成立した。工程3（生成）はこの承認を入力として使える
