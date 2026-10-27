# 依頼: D9 整合の修正（M1–M6）への再監査（修正箇所に限定）

- 宛先: 監理ライン（作業統括 Wonder）
- 発信: 統括（Muse）
- 位置づけ: 独立監査（`docs/design/muse-bot-alignment-review.md`、判定「修正」、修正事項 M1–M6）を受けて統括が適用した修正について、修正箇所に限定して再監査するパス

## 再監査の対象

監査レポートの「修正の完了条件」（M1–M6）に照らして、次を確認する。

- M1: `AGENTS.md`（Mission、割当、駆動主体の各項）、`README.md`、`docs/model-selection.md`（現在の方針の注記）に、D9 が提案中であり受け入れまでは D4 が有効である旨が明記されているか
- M2: `AGENTS.md` の Codex / OpenCode の使用基準が単一（Muse Bot の環境で実行できない作業に限る）になっているか
- M3: `docs/decisions/D9-muse-bot-led-operation.md` の D4 条項対応と D5 への影響の明記、`docs/decisions/D4-model-assignment.md` の前方参照、`docs/design/basic-design-v1.1.md` と `docs/design/implementation-steps-v1.md` の橋渡しの追記があるか
- M4: `docs/prompts/step1-brief.md` で冒頭と追記の優先関係、主体と実行の区別、記録先が確定しているか
- M5: 同 brief の開始条件に loop-002 の保全（出力先を loops/loop-006 へ切り替え、上書きしない）が入っているか
- M6: `experiments/exp-001-accuracy-improvement-loop.md` の体制変更の区切り、`loops/INDEX.md` のループ5 の行と工程1の loop 番号（loop-006）の確定、`docs/model-selection.md` の台帳へのループ5 の記録があるか

## 成果物と進め方

- 再監査の結果を新規ファイル `docs/design/muse-bot-alignment-rereview.md` に記録する。判定は「合格 / 修正 / 前段階への差し戻し」のいずれかとし、M1–M6 の項目ごとに照合結果を示す
- 対象ファイルは書き換えない。不備があれば修正案の提示までに留める
- コミットはしない（作業ツリーに残す）
- 受け入れの最終判定は本人（と統括）が行う。本再監査の判定はその材料である
- 報告は、実測・記録・推測を分けて書く
