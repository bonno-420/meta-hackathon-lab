# 依頼: D9（Muse Bot 主体の開発運用）と付随する文書調整の独立監査

- 宛先: 監理ライン（作業統括 Wonder）
- 発信: 統括（Muse）
- 位置づけ: 本人の指示「Muse Bot 主体の開発運用への整合・調整」に基づく調整案について、変更者（統括）とは独立した観点で監査するパス

## 監査対象

- `docs/decisions/D9-muse-bot-led-operation.md`（提案）
- 付随する文書調整: `AGENTS.md`（Mission と駆動主体の記述）、`README.md`、`docs/model-selection.md`（現在の方針）、`docs/roadmap-v1.md`（進め方の原則と追記）、`docs/design/context-pack-v1.md`（§8 追記）、`docs/prompts/step1-brief.md`（追記）、`loops/INDEX.md`（新規）
- 照合先: `docs/design/muse-bot-alignment-survey.md`（調査記録、矛盾 K1–K7）、決定 D1–D8、`docs/design/basic-design-v1.1.md`、`docs/design/implementation-steps-v1.md`、リポジトリの `AGENTS.md`

## 監査の観点（本人の指示 §4）

1. Muse Bot 主体という実験目的と一致しているか
2. ドキュメント同士に矛盾が残っていないか（特に主体・駆動環境・役割分担の記述）
3. 実行できない機能を前提にしていないか（Meta Model API のキーの前提条件の扱いを含む）
4. 既存の承認済み決定（D1–D8）を不当に上書きしていないか
5. 同じ内容のルールを重複させていないか
6. 現在の実装と今後の実装手順（工程1以降）が接続しているか
7. 再現性と監査可能性を確保できているか

## 成果物と進め方

- 監査結果を新規ファイル `docs/design/muse-bot-alignment-review.md` に記録する。判定は「合格 / 修正 / 前段階への差し戻し」のいずれかとし、観点ごとに照合結果を示す
- 監査対象のファイルは書き換えない。不備があれば修正案の提示までに留める
- コミットはしない（作業ツリーに残す）
- 受け入れの最終判定は本人（と統括）が行う。本監査の判定はその材料である
- 報告は、実測・記録・推測を分けて書く
