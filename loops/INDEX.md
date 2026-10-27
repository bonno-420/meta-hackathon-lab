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
