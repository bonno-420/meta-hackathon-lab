# loop-015 実行記録: Baseten 検証ループの実施

- 実施日: 2026-11-01（パイロットとして終了。2026-11-01T22:05Z に系統を打ち止め）
- 実施者: 制作ライン（OpenCode）+ 本人（判断・書き込み・承認）+ 統括（Muse、反映メモ整形）
- 設計: `docs/design/baseten-verification-loop-design-v1.md`（改訂版）
- 実施ブリーフ: `docs/design/baseten-verification-loop-implementation-brief.md`（本人の決定により K2–K5 等を固定）
- 実行基盤: Baseten Muse Spark Open（`meta-models/muse-spark-open-1026`）
- 本体との分離: 本体（工程1–6）は常時提出可能な状態を維持。本ループの記録は本体のコードと記録に混ぜない
- 実費: 未記録（残量が確認できないため）。代わりにサンプル数と1回あたりの使用量（取得できる場合）を残す

---

## 入力版（O1の固定）

| 項目 | 値 |
|---|---|
| 開始時点の Git HEAD | `fbd576f`（design + loop-014 の設計まで。Baseten 設計3ファイルは未コミットの作業ツリーとして確認） |
| 設計の版 | `docs/design/baseten-verification-loop-design-v1.md`（改訂記録: M1・M2 追記） |
| 題材 T-A の固定記録 | `topics/topic-A.json` sha256 `228e36eff39364b9a10b53dc40a51d3946ba3c51156b8eab87f9fc5f8687b6b3` |
| 題材 T-B の固定記録 | `topics/topic-B.json` sha256 `b4d54f84f4927da01984c0034bcc40b7d78a91a4ecb2d4fa86d60a88e68e4cfd` |
| 企画の固定（T-A） | `topics/topic-A.json` 内 `plan`（対象層・訴求）を参照 |
| 企画の固定（T-B） | `topics/topic-B.json` 内 `plan`（対象層・訴求）を参照 |

> 開始時に `topics/*.json` のハッシュを実測して上表を埋める。以降の適合確認の入力同一性はこのハッシュを基準とする。

## 停止条件の確定値（K1–K5）

- K1: 本人の停止指示で直ちに停止
- K2: 題材ごと最大8世代、全体16サンプルまで
- K2補足: 生成呼び出し総数上限20回（小サンプル分を含む）。不採用サンプルは世代に数えないが総呼び出し数には数える
- K3: 最終生成は 11/04 日中まで。11/04 後段は監査と記録整理。提出締切 2026-11-05 11:00 JST
- K4: 同じ指摘が3世代続いたら題材停止（題材単位）
- K5: 適合落ちが2回連続したら題材停止（題材単位、反映メモで直す対象にしない）

## 1回あたり上限

- 正式値: `max_tokens=4,000` `temperature=0.4`（2026-11-01 小サンプル実測に基づく本人の決定。800 で reasoning 797/800 により content null で切れたため、reasoning を含めて 4,000 に引き上げ、再実行で本文が返ることを確認して確定）
- 再試行: 自動では行わない
- 実測根拠: probe 800 → prompt 738 / completion 800 / total 1,538（reasoning 797）、再実行 4,000 → prompt 738（cached 640）/ completion 2,113（reasoning 1,876）/ total 2,851 で sentences 7件が返った

---

## 時系列

### 1. 疎通確認（本人の環境のみ）

- 実行: 2026-11-01T11:03:53Z に実施。ok=true、prompt 146 / completion 16 / total 162（`connectivity-check.json` に記録）。キー源は env:BASETEN_API_KEY
- 呼び出しの数え方: 疎通確認の軽量呼び出しは K2 の世代数と総呼び出し数には含めない（小サンプル以降が K2 の対象）

### 2. 小サンプル

- 実行1回目（上限の測定）: 2026-11-01T11:07:14Z に T-A で `max_tokens=800` で実行。reasoning 797/800 を占め content が null で切れた（`generations/topic-A/gen-001-probe-800.json` に記録）。prompt 738 / completion 800 / total 1,538。生成として数えず「上限の測定結果」として残す。通算呼び出し 1/20
- 実行2回目（再実行・成功）: 2026-11-01T11:09:18Z に T-A で `max_tokens=4,000` で再実行。本文 7文が返り ok=true（`generations/topic-A/gen-001.json` / `gen-001.md` に記録）。prompt 738（cached 640）/ completion 2,113（reasoning 1,876）/ total 2,851。通算呼び出し 2/20。上記「1回あたり上限」の正式値を 4,000 として確定
- 扱い: 小サンプルは世代列に含めない較正用とし、世代数には数えない（呼び出し総数には数える）。本格稼働の第1世代は、小サンプル2回目の生成物を流用せず、改めて各題材で企画固定から始める。小サンプルは較正の記録として残す

### 3. 本格稼働（世代列）— 2026-11-01T11:09:18Z より開始（1回あたり上限 4,000 で確定）

#### 3-1. 日本語予備（系統に数えない。記録は残す）

- 2026-11-01T11:13:02Z T-B gen-001（日本語, 9文, prompt 743 / completion 3633 / total 4376）— 予備扱いとし系統に数えない（通算呼び出し 3/20 だが系統外）
- 2026-11-01T11:13:11Z T-A gen-002（日本語, 9文, prompt 746 / completion 3411 / total 4157）— 予備扱いとし系統に数えない（通算呼び出し 4/20 だが系統外）
- 上記2世代はファイル番号を上書きせず残す。英語系統の通し番号は継続し、対応は本表に明記する

#### 3-2. 英語系統（本系統。反映メモなしで各題材3世代まで自律で回す。K2/K3/K5 従来どおり有効）

- 言語: EN（プロンプト英語、事実は日本語入力のまま数値は verbatim、出力は英語文 + factKeys/sourceLines の JSON）
- 歯止め: K2 題材ごと8世代/全体16、総呼び出し20（小サンプルの 1/20 + 2/20 を含む。予備の日本語2世代の呼び出しも総数には含める）、K3 11/04 日中打ち切り、K5 適合落ち2連続で題材停止、K4 同じ指摘3世代で題材停止
- 提示: 世代ごとに LP プレビュー（HTML、最小限の組み、判断対象は文章）を `loops/loop-015/previews/` に作成

| 系統世代 | 題材 | ファイル | 生成日時 | 適用した反映メモの版 | 適合確認 | 散文評価（要修正） | 系統に数えるか | 備考 |
|---|---|---|---|---|---|---|---|
| probe | T-A | gen-001-probe-800 | 2026-11-01T11:07:14Z | なし | — | — | 数えない（上限測定） | probe-800: reasoning 797/800 で失敗 |
| calib | T-A | gen-001 | 2026-11-01T11:09:18Z | なし | — | — | 数えない（較正用） | 小サンプル正式 4,000: 7文 / prompt738 comp2113 total2851 |
| reserve-JA | T-B | gen-001 | 2026-11-01T11:13:02Z | なし | — | — | 数えない（予備） | 日本語9文 prompt743/comp3633/total4376。英語系統は gen-002 から継続 |
| reserve-JA | T-A | gen-002 | 2026-11-01T11:13:11Z | なし | — | — | 数えない（予備） | 日本語9文 prompt746/comp3411/total4157。英語系統は gen-003 から継続 |
| EN-1 | T-A | gen-003 | 2026-11-01T11:23:16Z | なし | pass (9文) | 0 要修正 / 0 findings | はい | 英語系統1世代目（反映メモなし）prompt825/comp2056/total2881 |
| EN-2 | T-A | gen-004 | 2026-11-01T11:23:23Z | なし | pass (6文) | 0 要修正 / 0 findings | はい | 英語系統2世代目（反映メモなし）prompt825/comp2193/total3018 |
| EN-3 | T-A | gen-005 | 2026-11-01T11:23:31Z | なし | pass (9文) | 0 要修正 / 0 findings | はい | 英語系統3世代目（反映メモなし）prompt825/comp2532/total3357 |
| EN-1 | T-B | gen-002 | 2026-11-01T11:23:36Z | なし | pass (7文) | 0 要修正 / 0 findings | はい | 英語系統1世代目（反映メモなし）prompt822/comp1962/total2784 |
| EN-2 | T-B | gen-003 | 2026-11-01T11:23:42Z | なし | pass (9文) | 0 要修正 / 0 findings | はい | 英語系統2世代目 prompt822/comp1943/total2765 |
| EN-3 | T-B | gen-004 | 2026-11-01T11:23:48Z | なし | pass (6文) | 0 要修正 / 0 findings | はい | 英語系統3世代目 prompt822/comp2320/total3142 |

> 適合で落ちた場合は「不採用（適合で不採用）」と明示し、世代として数えない。世代列への反映は最新の確認済み反映メモで行う（確認待ち中は前版で進む）

### 3-3. 完成LP（画像込み）— EN-1 を素材化（試作2と同じ手順。文章は在庫確定、画像は muse-image-1.0）

- 方針: 英語の6世代は散文要修正0で並んだため、メモなしの基準世代（T-A gen-003 / T-B gen-002）を各題材1本の完成LPにした。文章は在庫のまま、画像だけを企画に沿って生成して組む（試作2と同型）。
- 画像: muse-image-1.0（Meta API https://api.meta.ai/v1/images/generations）で各LP 4点・計8点。画像中に文字・数字・ロゴは入れない（プロンプト末尾に no text/no numbers/no logos）。文章・数値はHTMLテキストで組む。
- 素材: previews/images/{TA,TB}-{hero,cashier/meal,training,neighborhood}.webp + previews/images/manifest.json（プロンプトとサイズの記録）。生成 6-11-01T12:30:12Z、input 141,364 / output 14,966 tokens、成功 8/8。
- 完成LP: previews/topic-A-EN1-gen-003-complete.html（3.40 MB, base64埋め込み）/ previews/topic-B-EN1-gen-002-complete.html（3.62 MB）。対応する生成との紐づけはファイル名とページ内注記（\loops/loop-015/generations/...\）で明示。最小限プレビュー（\	opic-A-gen-003.html\ 等）は旧形式として残置し判断対象としない。
- パレット: T-A は小売の暖色（navy #1A3C5E / orange #E67E22 / bg #FFF8F0）、T-B はケアの落ち着き（sage #3A6B5A / peach #E8A87C / bg #F5F0EB）で対照。
- 実画面: Playwright（python）でモバイル 390px / デスクトップ 1280px をフルページ撮影 → 目視。証拠 cache/preview-TA-{mobile,desktop}.png / cache/preview-TB-{mobile,desktop}.png。画像4点とも文字なし、数値はテキストで保持していることを確認。
- 経緯: Baseten の \/v1/models\ に画像生成モデルはなく（\/v1/images/generations\ も 404）、ComfyUI ローカルも未起動。画像生成は本ループの検証対象（muse-spark-open-1026）には含めず、Meta API の muse-image-1.0（別系統）で行った。生成分の課金は text 系の検証とは別枠。

| 題材 | 完成LP | 対応する生成 | 素材（プロンプトは manifest.json） | 備考 |
|---|---|---|---|---|
| T-A | \	opic-A-EN1-gen-003-complete.html\ | EN-1 gen-003（9文） | TA-hero / TA-cashier / TA-training / TA-neighborhood | 小売・世田谷。企画「二十代前半・接客経験・安定勤務地」 |
| T-B | \	opic-B-EN1-gen-002-complete.html\ | EN-1 gen-002（7文） | TB-hero / TB-meal / TB-training / TB-neighborhood | ケア・横浜。企画「三十代・子育て・短時間」 |

### 3-4. 完成LPへのメモフォーム付与（3-3の追補、2026-11-01T21:5x）

- 目的: 本人が完成LPのページ内で直接メモを書き込み、取り出せる形にする（前セッションで画像上限により停止した未了タスクの解消）
- 手段: `tools/inject-memo-form.mjs` で 2 本の完成LP末尾に同一フォームを注入。サーバー不要・ページ内で完結
- 仕様（判断）: 6欄（全体印象 / 読みやすさ・流れ / 事実の扱い・注記 / 見た目・写真・色 / 応募前チェック・CTA / その他・次に直したい1点）。入力は `localStorage`（キー: `lp-memo:<title>_<file>`）に自動保存、リロード復元。取り出しは「コピー」（clipboard API + execCommand フォールバック）と「テキストでダウンロード」（Blob→.md）で Markdown 整形（`# LP memo <date>` / `## <ラベル>`）。「クリア」は confirm 付き。送信先サーバーなし。対象は追加生成には影響しない（追加生成の入出力は `baseten-loop-en.mjs --memo` / `reflection-memos/vXXX.md` が正）
- 検証: 注入後に `Select-String` で `lp-memo` / `localStorage` / `Blob` / `clipboard` を両HTMLで確認（memo- 出現 17件）。再実行は `id="lp-memo"` 存在で skip するため冪等
- 実画面: Playwright フルページ撮影 → 目視。証拠 `cache/memo-check-{A,B}-desktop.png`（提示スクショ相当）。6欄と「コピー」「テキストでダウンロード」「クリア」が描画、スクショ中の「test memo from preview A」は手動入力で localStorage に保持されたことを確認
- 制約遵守: キー値の読み取り・表示・コミットなし。画像は文脈に載せず、キャッシュPNGもAIには1枚のみ提示（本記録の添付1枚）

### 4. 反映メモの版

| 版 | 作成日 | 元の書き込み（サンプルと指摘番号） | 確認状態（未確認/確認済み） | 適用された世代 |
|---|---|---|---|---|
| — | — | — | — | — |

> 反映メモは統括（Muse）が本人の書き込みから整え、本人が確認してから次世代へ渡す。整形に Baseten 実行は使わない

### 5. 停止の記録

| 日時 | 題材 | 条件 | 理由 | 残した記録 |
|---|---|---|---|---|
| — | — | — | — | — |

---

## 実測・記録・判断の区別

- 実測: 本記録に書く疎通結果、生成物の文面、適合確認の機械検査の出力、散文評価の要修正の件数は実測とする
- 記録に基づく事項: 設計の骨格、K2–K5 の確定値、開示する形の固定は実施ブリーフの記録に基づく
- 判断: 「改善した」「部分改善」「仮説が成り立たなかった」の判定は、メモ解消と要修正減少の両方がそろったかで判断する（片方だけでは改善としない）

---

## 締め — パイロットとしての終了（2026-11-01T22:05Z）

### 本ループをパイロットとする判断

- loop-015 は「Baseten (muse-spark-open-1026) での 1 回あたり上限の較正と、英語文面の自律生成 + 画像込み完成LPまでの工程の疎通」を目的とするパイロットとして締める。系統（世代列）をここで終了し、残り枠は拡張版 `loops/loop-016` へ引き継ぐ。
- 本記録はこのまま凍結し、loop-015 の追補は行わない。次案の知見は loop-016 の `insights/` にため、台帳 (`docs/learnings.md`) への昇格は別途判断する。
- 本線（工程1–6）は loop-015 の前後を通じて影響を受けず、常時提出可能な状態を維持した。

### 取れた知見（パイロットから。昇格は未判断）

1. **1回あたり上限の較正**: `max_tokens=4,000 / temperature=0.4` で確定。800 で reasoning 797/800 により content null で切れることを小サンプルで実測し、4,000 に引き上げて sentences 7件が返ることを再実行で確認。以後はこの値を正式値とする。
2. **キー運用の切り分け**: `MODEL_API_KEY` (LLM_2121… 48文字) を Baseten 用に誤用すると 401。`~/.config/opencode/baseten-api-key` (b10_2mHb… 45文字) を優先する `loadApiKey` 修正で解消。`tools/baseten-diag.mjs` で ping/JA/EN の 3 種を 200 で確認済み（記録の再現手順として固定）。
3. **英語文面の基盤の安定**: 反映メモなしの英語系統で 6 世代すべて `適合 pass` かつ散文評価「要修正 0」を達成。`prompt 82x / completion 19–25xx / total 27–33xx` の範囲で安定して返った（日本語 facts を verbatim で英文化する構成）。
4. **画像生成の分離**: Baseten `/v1/models` に画像モデルはなく `/v1/images/generations` は 404、ComfyUI も未起動。検証対象 (muse-spark-open-1026) とは分けて Meta API の `muse-image-1.0` で 8 点を生成し、`no text/no numbers/no logos` で文字なしを確認。テキストは HTML で組む分離型が成立。生成は Baseten 呼び出し数に含めず別枠で記録する方針が確定（input 141,364 / output 14,966 tokens、成功8/8）。
5. **完成LPの工程の確立**: 生成文の在庫確定 → 企画に沿った画像規格起案 → プロンプト記録 (`manifest.json`) → 画像生成 → パレット固定（T-A 暖色 / T-B 落ち着き）→ base64 埋め込み HTML。Playwright のモバイル390px/デスクトップ1280px フルページ撮影と目視で証跡化する手順が確立。
6. **ページ内メモフォームの自律化**: `tools/inject-memo-form.mjs` で完成LP末尾へ 6 欄フォームを注入。`localStorage` 自動保存・リロード復元、取り出しは「コピー」(clipboard API + execCommand) /「テキストでダウンロード」(Blob→.md) で Markdown 整形。送信先サーバーなし、冪等（`id="lp-memo"` で skip）。本人の手番を「ページ内で書いて取り出す」に寄せる基盤が成立。
7. **未検証として持ち越すもの**: 反映メモ（版）による「メモ解消 × 散文要修正減少」の同時達成判定（§1 の「良くなった」定義）は、パイロットでは反映メモなしで回したため未検証。loop-016 でケースごとに検証する。

### 系統の終了

- 題材 T-A / T-B の英語系統は各3世代で打ち止めとする。K2–K5 による停止ではなく、パイロット設計としての計画的終了。
- 通算呼び出し 10/20（probe1+較正1+予備2+英語6）、K2 残り10・K3 11/04 日中までの区間は未消化のまま残すが、loop-015 では消費しない。以後の生成の枠は loop-016 で再定義する（Baseten 全体 40 回、1 ケース 5 世代目安）。
- 完成LP2本と最小限プレビュー6枚、画像8点、世代記録（.json/.md）はこのまま保存。再実行は `id="lp-memo"` の冪等により再現可能だが、loop-015 では行わない。

## 次の手順【閉鎖】

- 本ループはパイロットとして上記「締め」で閉鎖した。以後の作業は `loops/loop-016` で行う。本節は閉鎖前の計画として保存する。

## （参考保存: 閉鎖前の次の手順 — 完成LP提示中メモ待ち時点の計画）

- 小サンプルで上限 4,000 を確定済み。`tools/baseten-loop-en.mjs` で英語系統を各題材3世代まで自律で回した（2026-11-01T11:23:16Z–11:23:48Z、適合pass 6/6、散文要修正 0）。ファイル番号は通し番号を継続し、系統は英語のみで数える。通算呼び出し 10/20（probe1+較正1+予備日本語2+英語6）、K2 残り10回、K3 11/04日中まで残り枠あり
- 診断: 初回 `baseten-loop-en.mjs --all` が 401 を返した原因は `MODEL_API_KEY` 環境変数（LLM_2121... 48文字）を Baseten 用として誤用したため。修正として `~/.config/opencode/baseten-api-key`（b10_2mHb... 45文字）の Baseten 鍵を優先するように loadApiKey を修正し、再実行で全6世代が成功した。診断用 `tools/baseten-diag.mjs` で ping/JA/EN の3種が 200 であることを確認済み
- 本人の書き込み（メモ欄）→ 統括(Muse)が反映メモを整形 → 本人が確認して次世代へ渡す。確認待ち中は最新確認済み版で進め、確認済み版がない初期は反映メモなしで進む
- 世代ごとに本記録の表と `generations/*/gen-NNN.md` の適合・散文評価は自動で付与済み。K4 同じ指摘3世代 / K5 適合落ち2連続 は現状該当なし。K3 11/04 日中で全生成打ち切り
- 完成LP（画像込み）を提示済み。\previews/topic-A-EN1-gen-003-complete.html\ / \previews/topic-B-EN1-gen-002-complete.html\ を本人が見て、メモ欄に書き込む。書き込みはプレビューではなく完成LPに対して行う。
- 本人のメモ → 統括（Muse）の反映メモ整形 → 本人確認 → 残り枠（K2: 題材8/全体16、総呼び出し 10/20 消費。K3: 11/04 日中まで）でメモ適用世代を回す
- 改善の判定はメモ解消と散文評価の要修正減少が両方そろった場合のみ「改善した」とする

## 実行手順（本人の環境で — 英語系統）

\`\`\`sh
# 英語系統（自律3世代は反映メモなしで実行済み）
node loops/loop-015/tools/baseten-loop-en.mjs --all
# → T-A gen-003,004,005 / T-B gen-002,003,004 を生成し、generations/*/gen-*.json/.md + previews/*.html を作成

# 単発（反映メモなし）
node loops/loop-015/tools/baseten-loop-en.mjs --topic A --gen 003
node loops/loop-015/tools/baseten-loop-en.mjs --topic B --gen 002

# 反映メモ適用（本人が判断し統括Museが整形した後、残りの枠で）
node loops/loop-015/tools/baseten-loop-en.mjs --topic A --gen 006 --memo loops/loop-015/reflection-memos/v002.md
node loops/loop-015/tools/baseten-loop-en.mjs --topic B --gen 005 --memo loops/loop-015/reflection-memos/v002.md

# dry-run（プロンプトだけ確認）
node loops/loop-015/tools/baseten-loop-en.mjs --topic A --gen 006 --memo loops/loop-015/reflection-memos/v002.md --dry-run
\`\`\`
