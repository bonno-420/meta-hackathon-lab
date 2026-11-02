# loop-016: Baseten 検証ループ 拡張版（6ケース英語版）

- 目的: loop-015 パイロットの拡張。6つの架空求人（英語完結）を通して、企画→生成→完成LP→ペルソナレビュー→知見抽出 の全工程を回し、反映の効きと散文品質をケース単位で検証する
- 実行基盤: Baseten Muse Spark Open (`meta-models/muse-spark-open-1026`) — loop-015 から継承
- 設計: `docs/design/baseten-verification-loop-design-v1.md` + 本ケース固有の K/枠（後述）
- 前段: `loops/loop-015/` は 2026-11-01T22:05Z でパイロットとして閉鎖。以後の生成枠は本ループで再定義
- 記録の性格: 実験記録。本体の実績（工程1–6, Meta Model API Spark 1.3系）と混ぜない。提出時は Baseten 利用を開示する形で参照

## 6ケース一覧（すべて架空・英語完結）

| # | ID | 雇用形態 | 業種/職種 | 英語のみの理由 |
|---|---|---|---|---|
| 1 | C-A | Full-time | SaaS / Software Engineer | 日本語混在を避けるため事実も英語で作成 |
| 2 | C-B | Full-time | Healthcare / Registered Nurse | 業種分散（C-A と対照） |
| 3 | C-C | Contract | Marketing / Brand Specialist (12-month contract) | 期間雇用フロー |
| 4 | C-D | Dispatched (agency) | Logistics / Warehouse Associate (dispatched) | 派遣フロー（雇用主と就業先を分離） |
| 5 | C-E | Part-time | Hospitality / Cafe Crew (short hours) | パート時間調整フロー |
| 6 | C-F | Casual / Seasonal | Retail / Seasonal Sales Associate | カジュアル短期フロー |

- 各ケース: 企画を先に固定（対象層・ペルソナ・訴求）＋事実の固定記録（JSON, sha256で版を固定）

## 通しの流れ（直列・一括報告）— 2026-11-02 変更

- C-A → C-B → C-C → C-D → C-E → C-F を1本の流れで通しに回す。ケースごとに区切らない
- 各ケースは `企画の固定 → 生成 → 完成LP → ペルソナレビュー → 知見の抽出` まで一続きで処理する
- 抽出した知見は `insights/` にため、次のケースの生成に自動で反映する（ケース間は直列。学習の連鎖を切らない）
- 各工程の判断は回す側が行い、記録に残す。K4・K5 に触れたケースはそのケースだけ止めて次のケースへ進む
- 画像はファイルへの出力が主。セッションの文脈に大量に読み込まない（画像上限で停止した前例の回避）
- 報告は全ケース分を最後に一括で出す（完成LP、ペルソナレビュー、知見ストック、run-record の更新をそろえて提示）

```
[C-A: 企画→生成→完成LP→レビュー→知見抽出→ insights/ へ蓄積]
  ↓ 知見を次ケースへ自動反映
[C-B: 企画→生成(前知見反映)→完成LP→レビュー→知見抽出→蓄積]
  ↓
[C-C → C-D → C-E → C-F 同様に直列]
  ↓
[全ケース分を一括報告: 完成LP + レビュー + 知見 + run-record]
```

旧表記「1ケースの流れ」は上記に置き換える。

## 枠（本ループの確定値）

| 項目 | 値 |
|---|---|
| Baseten 呼び出し上限 | loop-016 全体で 40回（生成のみ。小サンプル等の試行も含める） |
| 1ケースの世代目安 | 最大 5世代 |
| 1回あたり上限 | `max_tokens=4,000` / `temperature=0.4`（loop-015 小サンプルで確定） |
| K1 | 本人の停止指示で直ちに停止 |
| K2 | 上記 40回 / 5世代目安（全体とケース単位） |
| K3 | 最終生成は 11/04 日中まで。11/04 後段は監査・整理のみ。提出締切 2026-11-05 11:00 JST |
| K4 | 同じ指摘が 3世代続いたら当該ケース停止（ケース単位） |
| K5 | 適合落ちが 2回連続したら当該ケース停止（ケース単位、反映メモで直す対象にしない） |

## カウントの分離

- Baseten (40回): `muse-spark-open-1026` の生成呼び出しのみ
- Meta API (別枠): ペルソナレビュー + 画像生成 (`muse-image-1.0`) は別カウントで `reviews/` / `previews/images/manifest.json` に記録

## 本人の手番

- 完成LPへのメモ + ペルソナレビュー結果の確認のみ
- 進捗報告は全ケース分を最後に一括で出す（ケース単位の途中報告はしない）

## 知見の扱い

- ループ内の `insights/` にストック。台帳 (`docs/learnings.md`) への昇格は別途判断（本ループは台帳を書かない）

## ディレクトリ構成

```
loops/loop-016/
  README.md                         … 本ファイル（6ケースと枠の定義）
  run-record.md                     … 実行記録（K1–K5, 枠, ケース別進捗, 呼び出し数）
  cases/
    case-A.json                     … C-A Full-time SaaS / Swe（企画+事実、英語）
    case-B.json                     … C-B Full-time Healthcare / RN
    case-C.json                     … C-C Contract Marketing
    case-D.json                     … C-D Dispatched Logistics
    case-E.json                     … C-E Part-time Cafe
    case-F.json                     … C-F Casual Retail
  generations/
    case-A/gen-001.{json,md}        … 生成記録（適合+散文4観点）
    ...
  previews/
    case-A-gen-001-complete.html    … 完成LP（画像埋め込み + メモフォーム）
    images/manifest.json            … 画像プロンプトとサイズ
  reviews/
    case-A-gen-001-review.md        … ペルソナレビュー（4観点、verbatim）
  insights/
    001.md                          … ストック知見（適用先と内容を記録）
  reflection-memos/
    v001.md                         … 反映メモ（必要時に。統括(Muse)が整形）
  research/                         … 調査成果物 v1.0 (2026-11-02) — common.md + case-a..f.md（表現の型のみ、facts根拠なし）
  vanilla/                          … 対照実験（Baseten外並行ライン）— inputs/case-*.md (facts-only機械転記 v1.0) + prompt-v1.0.md (両モデル同一) + {wonder,spark}/case-*.{html,meta.json} + 各3画像(gen-001共通)。単一プロンプト単一応答手直しなし、plan/research/知見は渡さない
  tools/                            … loop-015 から継承（baseten-loop-en.mjs, inject-memo-form.mjs 等）+ loop16-vanilla.mjs (vanilla生成、Meta API)
  checks/                           … ページ級2層検出（pagecheck=Layer1, judge=Layer2 P1-P6候補）
  cache/                            … スクショ等の証跡（一時）
```
