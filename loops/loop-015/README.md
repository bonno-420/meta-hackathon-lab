# loop-015: Baseten 検証ループの実施

- 設計: `docs/design/baseten-verification-loop-design-v1.md`（改訂版、M1・M2対応）
- 監査: `docs/design/baseten-verification-loop-design-review.md` → `docs/design/baseten-verification-loop-design-rereview.md`（合格）
- 実施ブリーフ: `docs/design/baseten-verification-loop-implementation-brief.md`（本人の決定により K2–K5 等を固定）
- 実行基盤: Baseten Muse Spark Open（`meta-models/muse-spark-open-1026`）。本体（工程1–6、Meta Model API の Spark 1.3 系）とは分離
- 記録の位置づけ: 実験記録。本体の実績と区別し、提出文では Baseten の利用を明記する（開示する形で固定）

## ディレクトリ構成

```
loops/loop-015/
  README.md                         … 本ファイル
  run-record.md                     … 実行記録（入力版、K2–K5、疎通・小サンプル・世代列の時系列、停止理由）
  connectivity-check.json            … 疎通確認の結果（本人の環境で生成）
  topics/
    topic-A.json                    … 題材 T-A（企画精度を見る群）の事実の固定記録（架空）
    topic-B.json                    … 題材 T-B（文章検証群）の事実の固定記録（架空）
  reflection-memos/
    v001.md                         … 反映メモ v001（統括(Muse)が整え、本人が確認後に次世代へ）
  generations/
    topic-A/
      gen-001.md                    … T-A 第1世代（企画→生成→適合→散文評価→提示 + メモ欄）
    topic-B/
      gen-001.md                    … T-B 第1世代
  tools/
    baseten-check.mjs               … 疎通確認スクリプト（本人の環境のみで実行）
```

## 本人の決定（実施ブリーフより）

- 題材: 架空2件（T-A 企画精度 / T-B 文章検証）。固定記録は `topics/` に置き開始時にハッシュで版を固定
- K2: 題材ごと最大8世代、全体16サンプルまで
- K2補足: 生成呼び出し総数上限20回（小サンプル分を含む）。不採用は世代に数えないが総数には数える
- K4: 同じ指摘が3世代続いたら題材停止
- K5: 適合落ちが2回連続したら題材停止
- K3: 最終生成は 11/04 日中まで、11/04 後段は監査と記録整理。提出締切 2026-11-05 11:00 JST
- 提示物とメモ欄: 世代ごとの Markdown のメモ欄に本人が直接書き込む。新規道具なし
- 開示: 提出文に Baseten（Muse Spark Open）の利用を実験記録として明記
- 1回あたり上限の具体値: 小サンプル実測後に本人が決定
