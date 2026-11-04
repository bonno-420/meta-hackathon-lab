# loops/ 索引

パスごとの記録の所在を示す索引。AGENTS.md はパスごとの記録を `loops/loop-NNN/` に残すことを必須としているが、ループ1・3・4・5 の記録は `docs/` と台帳に残されている（調査記録 `docs/design/muse-bot-alignment-survey.md` の K5）。遡及して作り直さず、所在をここに明示する。今後のパスは `loops/loop-NNN/` への記録を徹底する。

| ループ | 内容 | 記録の所在 |
|---|---|---|
| ループ1 | 設計監査（basic-design v1） | `docs/design/design-review-loop1.md`、`docs/model-selection.md` |
| ループ2 | 実装（FACT 抽出＋照合、E01・E02） | `loops/loop-002/`、`docs/model-selection.md` |
| ループ3 | 設計改訂（basic-design v1.1） | `docs/design/basic-design-v1.1.md`、`docs/model-selection.md`、`experiments/exp-001-accuracy-improvement-loop.md` |
| ループ4 | 工程の確定サイクル（監査 → 改訂 → 再監査 → 受け入れ） | `docs/design/implementation-steps-draft.md`、`docs/design/implementation-steps-review.md`、`docs/design/implementation-steps-v1.md`、`docs/design/implementation-steps-v1-mapping.md`、`docs/design/implementation-steps-rereview.md`、`docs/model-selection.md`、`experiments/exp-001-accuracy-improvement-loop.md` |
| ループ5 | 体制整合パス（Muse Bot 主体への調査 → D9 提案 → 文書調整 → 独立監査 → 再監査 → 受け入れ） | `docs/design/muse-bot-alignment-survey.md`、`docs/decisions/D9-muse-bot-led-operation.md`、`docs/design/muse-bot-alignment-review.md`、`docs/design/muse-bot-alignment-rereview.md`、`docs/prompts/muse-bot-alignment-audit-brief.md`、`docs/prompts/muse-bot-alignment-rereview-brief.md`、`docs/model-selection.md` |
| 6 | 工程1（抽出・照合の仕上げ） | `loops/loop-006/run-record.md`、`docs/design/step1-review.md`、`docs/design/step1-rereview.md`（監査合格・受け入れ済み、2026-10-27） |
| 7 | 工程2（承認） | `loops/loop-007/run-record.md`、`docs/design/step2-review.md`（監査合格・受け入れ済み、2026-10-27） |
| 8 | 工程3（生成） | `loops/loop-008/run-record.md`、`docs/design/step3-review.md`（監査合格・受け入れ済み、2026-10-27） |
| 9 | 工程4（再検証） | `loops/loop-009/run-record.md`、`docs/design/step4-review.md`（監査合格・受け入れ済み、2026-10-28） |
| 10 | 工程5（統合実行＋プレビュー公開） | `loops/loop-010/run-record.md`、`docs/design/step5-review.md`（監査合格・受け入れ済み、2026-10-28） |
| 11 | 工程6（提出の形） | `loops/loop-011/run-record.md`（Spark 本線監査合格・Wonder セカンド監査の修正適用済み、統括と本人が受け入れ、2026-10-28） |
| 12 | ライブラリ最小実装 procedures 1-2（承認ゲートまで） | `loops/loop-012/run-record.md`（2026-10-29） |
| 13 | ペルソナ設定から入る改修版の再実行 | `loops/loop-013/run-record.md`（2026-10-29） |
| 14 | 本体の完全性 修正の実施（①→②→③） | `loops/loop-014/run-record.md`、`docs/design/core-integrity-fix-design-v1.md`（設計監査・再監査いずれも合格、2026-10-31） |
| 15 | Baseten 検証ループの実施 | `loops/loop-015/run-record.md`（パイロットとして終了、2026-11-01。完成LPのHTML・画像は記録対象外としローカルに残す） |
| 16 | Baseten 検証ループ 拡張版（6ケース英語版） | `loops/loop-016/run-record.md`、`loops/loop-016/insights-consolidation-by-line-20261102.md`（2026-11-02。完成LPのHTML・画像は記録対象外としローカルに残す） |
| 18 | LP フルパイプライン化の実施（画像生成 → 組み立て → 完成照合） | `loops/loop-018/run-record.md`（2026-11-03。監査待ちのため未コミット） |
| 20 | gap-fill (a)(c) と F1 の実装・テスト、実走 1a/1b（1枚画 checkpoint 停止）、1枚画の企画適合検証 | `loops/loop-020/run-record.md`（2026-11-04。本人の不適合判定と設計差し戻しを記録。走行 2 は停止中） |
| 21 | パイプライン修正 F1–F10 の実施と監査（C1–C11 合格） | `loops/loop-021/run-record.md`、`loops/loop-021/audit-record.md`（2026-11-03） |
| 22 | 実走確認 L1–L3（Baseten）と本人側監査の修正対応 F-a–F-d | `loops/loop-022/run-record.md`（2026-11-03、進行中） |
| 29 | チェックポイントの対話化（プレビュー＋選択式の質問、記録は道具が回答から作成） | `loops/loop-029/record.md`（2026-11-04。Sorano の承認手順への本人の訂正3段を受けて make-lp を改修、実走で検証） |
| 30 | 抽出の欠陥修正（stated な否定の喪失、fact-extract-v1.3）と Sorano 再走の準備 | `loops/loop-030/record.md`（2026-11-05。承認チェックポイントでの捕捉から原因特定、1要因のみ修正、全スイート合格） |
