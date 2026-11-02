# loop-016 実行記録: Baseten 検証ループ 拡張版（6ケース英語版）

- 実施日: 2026-11-02–
- 実施者: 制作ライン（OpenCode）+ 本人（判断・書き込み・承認）+ 統括（Muse、反映メモ/知見整形）
- 設計: `docs/design/baseten-verification-loop-design-v1.md`（loop-015 から継承）+ 本ループの枠（README.md）
- 前段: `loops/loop-015` は 2026-11-01T22:05Z にパイロットとして閉鎖（`run-record.md` 締め参照）
- 実行基盤: Baseten Muse Spark Open (`meta-models/muse-spark-open-1026`)
- 本体との分離: 本体（工程1–6）は常時提出可能な状態を維持。本ループの記録は本体のコードと記録に混ぜない
- 実費: 未記録（残量が確認できないため）。代わりに呼び出し数と1回あたりの使用量を残す

---

## 入力版（固定）

| 項目 | 値 |
|---|---|
| 開始時点の Git HEAD | `fbd576f`（loop-015 閉鎖時点と同じ。Baseten 関連は未コミット作業ツリー） |
| 設計の版 | `docs/design/baseten-verification-loop-design-v1.md` |
| loop-015 の終了 | 2026-11-01T22:05Z 系統打ち止め（run-record 締め）。全6英語世代で適合pass/散文0、完成LP2本、画像8点 |
| C-A case-A.json sha256 | `B45890145326923470AB15562BAFECF617D3B1CD48DE8188A47A3D77D1B3EC62` |
| C-B case-B.json sha256 | `2A805D6017C20CC930BBEF789619CBCC0910C83996603129AFCBA8A23A9C2FFB` |
| C-C case-C.json sha256 | `CE2BC2D04A67D1AAE4FF0373810D6CD0C8A172C767E7B5276E90A130E0B3D554` |
| C-D case-D.json sha256 | `826E731B9744796392D5F094967E26E9CC3B62F41EB50E1E4A7DC5331723C9D8` |
| C-E case-E.json sha256 | `CCF63AA18AA59B1C179265B5D9A4D4E6E8E5E0E6FC45CC204B761F22901867C8` |
| C-F case-F.json sha256 | `D60B77BA695931B8A6D7A4793C186251DF8E75AA6D05B64CCA5E6B10066074D5` |
| 6ケースの企画固定 | 各 `cases/case-*.json` 内 `plan`（対象層・ペルソナ・訴求）を参照。事実は英語で作成し日本語を混在させない |

> 生成入力の同一性はこのハッシュを基準とする。facts の変更時は版を上げてハッシュを再記録する。

## 停止条件の確定値（K1–K5）

- K1: 本人の停止指示で直ちに停止
- K2: Baseten 呼び出し全体 40回、1ケース最大5世代を目安（全体とケース単位の両方で管理）
- K3: 最終生成は 11/04 日中まで。11/04 後段は監査と記録整理。提出締切 2026-11-05 11:00 JST
- K4: 同じ指摘が3世代続いたら当該ケース停止（ケース単位）
- K5: 適合落ちが2回連続したら当該ケース停止（ケース単位、反映メモで直す対象にしない）

## 1回あたり上限

- 正式値: `max_tokens=4,000` `temperature=0.4`（loop-015 小サンプルで確定: 800 で reasoning 797/800 により content null → 4,000 で sentences 7件が返ることを確認）
- 再試行: 自動では行わない

## カウントの分離

- Baseten 枠 (40): `muse-spark-open-1026` の生成呼び出しのみ。`generations/*.json` の usage を記録
- Meta API 別枠: 画像生成 (`muse-image-1.0`) + ペルソナレビュー は `previews/images/manifest.json` / `reviews/*.md` に tokens / 回数を別記録

---

## 呼び出し数の管理

| 区分 | 上限 | 消費 | 残り |
|---|---|---|---|
| Baseten 生成 | 40 | **20**（成功20、実呼び出し23） | 20 |
| Meta 画像生成 | 別枠 | 18回（成功18/18） | — |
| Meta ペルソナレビュー | 別枠 | 18回（gen-001 6 + gen-002 6 + gen-004 6 + gen-005 6） | — |
| Meta Judge | 別枠 | 24回（gen-001 6 + gen-002 6 + gen-003 6 + gen-004 6 + gen-005 6） | — |

- Baseten内訳: 較正probe 2回（`cache/debug-baseten.mjs` max_tokens=4,000でcontent null失敗 1回＋`cache/debug-baseten2.mjs` max_tokens=8,000で成功確認 1回）＋本生成 6回（C-A〜C-F gen-001）＋ gen-002 6回（成功、ただしC-Bでmax_tokens 8,000時にNo content失敗2回を含むと実呼び出し8回で計16回、成功14回で管理）＋ gen-004 6回（C-Eで再試行1含む実7 calls）→ 20成功/23 calls。gen-003/005は文章再利用で0。疎通確認（`cache/connectivity-check.json` ok=true, prompt146/completion16/total162）はK2に数えない（loop-015の継承）
- 1回あたり上限の変更（回す側の判断・記録）: READMEの正式値 max_tokens=4,000 では reasoning が約4,000を占め content null で失敗したため（probeで実測）、本ループの生成は max_tokens=8,000 / temperature=0.4 に引き上げて実施した。C-A gen-001で成功を確認し、以後の全ケースに適用した。gen-002では research適用でreasoningが増え、C-Bで8,000時にNo content失敗2回（reasoning 7,997占有）したためC-B以降は12,000で安定させた。gen-004では max_tokens 12,000で固定しC-Eで1回再試行。K2の数え方は変えず、呼び出し回数で管理する（成功20/実23の別記を残す）
- Meta画像: `muse-image-1.0` で3点/ケース×6ケース=18点。manifest集計 totalInput 400,405 / totalOutput 34,650。ファイル確認のみ行い文脈への大量読込なし（gen-002以降は再利用、gen-004/005は再配分のみ）
- Metaレビュー: `muse-spark-1.3-contributor` で18回（gen-001 6 + gen-002 6 + gen-004 6 + gen-005 6）。max_tokens=2,000では空応答のため4,000に引き上げて実施（reasoning約1,800–2,900）。Baseten枠に含めない
- Meta Judge: `muse-spark-1.3-contributor` で24回（gen-001 6 + gen-002 6 + gen-003 6 + gen-004 6 + gen-005 6）、max_tokens 8,000（C-C/Dで12,000に引上げ）。Baseten枠外

---

## 進捗の管理（直列・一括報告）— 2026-11-02 変更

- C-A → C-F を1本の流れで通しに回す。各ケースは `企画固定 → 事実固定 → 生成(適合+散文4観点) → 完成LP(概念→規格→画像→組付け, 各判断記録) → メモフォーム → ペルソナレビュー(4観点 verbatim) → 知見抽出` まで一続きで処理する
- 知見は `insights/` にため、次のケースの生成に自動で反映する（直列。連鎖を切らない）
- 各工程の判断は回す側が行い記録に残す。K4・K5 は当該ケースのみ停止し次のケースへ進む
- 画像はファイル出力が主とし、セッション文脈への大量読み込みは行わない
- 報告は全ケース分を最後に一括で出す（完成LP + レビュー + 知見 + 本記録の更新をそろえて提示。途中報告はしない）

### パイプラインの状態（全ケース通し）

| 順 | ケース | 企画/事実 | 生成 | 完成LP | レビュー | 知見抽出 | 反映先 | 備考 |
|---|---|---|---|---|---|---|---|---|
| 1 | C-A | done | done（gen-001 pass/0） | done（complete 2.75MB・memo有・3画像） | done | done（001） | → C-B | K4/K5該当なし |
| 2 | C-B | done | done（gen-001 pass/0・001反映） | done（complete 3.36MB・memo有・3画像） | done | done（002） | → C-C | K4/K5該当なし |
| 3 | C-C | done | done（gen-001 pass/0・001,002反映） | done（complete 2.82MB・memo有・3画像） | done | done（003） | → C-D | K4/K5該当なし |
| 4 | C-D | done | done（gen-001 pass/0・001-003反映） | done（complete 3.30MB・memo有・3画像） | done | done（004） | → C-E | K4/K5該当なし |
| 5 | C-E | done | done（gen-001 pass/0・001-004反映） | done（complete 3.14MB・memo有・3画像） | done | done（005） | → C-F | K4/K5該当なし |
| 6 | C-F | done | done（gen-001 pass/0・001-005反映） | done（complete 2.49MB・memo有・3画像） | done | done（006） | → 完了 | K4/K5該当なし |

### ケース別詳細

### C-A: Full-time SaaS / Software Engineer

| 段階 | 状態 | 生成/成果物 | 適合 | 散文4観点 | ペルソナ | 知見 |
|---|---|---|---|---|---|---|
| 企画・事実固定 | done | `cases/case-A.json` | — | — | — | — |
| gen-001 | done | `generations/case-A/gen-001.{json,md}` prompt902/comp2717/total3619 | pass（5文） | 0 要修正 / 0 findings | Alexレビュー済 | →001 |
| 完成LP | done | `previews/case-A-gen-001-complete.html`（2.75MB・palete tech navy/orange・3画像埋込・memo有） | — | — | — | — |
| レビュー | done | `reviews/case-A-gen-001-review.md`（Meta 4観点verbatim・prompt721/comp3418） | — | — | flex core曖昧・weekly継続不明・a 8-person・offering Annual | — |
| 知見抽出 | done | `insights/001.md`（上限8,000較正＋集約化＋3指摘） | — | — | — | →C-B |

- 停止: なし（K4 同じ指摘3世代 / K5 適合落ち2連続 該当なし。1世代で確定）

### C-B: Full-time Healthcare / Registered Nurse

| 段階 | 状態 | 生成/成果物 | 適合 | 散文4観点 | ペルソナ | 知見 |
|---|---|---|---|---|---|---|
| 企画・事実固定 | done | `cases/case-B.json` | — | — | — | — |
| gen-001 | done | `generations/case-B/gen-001.{json,md}` prompt1415/comp3520/total4935（001反映） | pass（6文） | 0 要修正 / 0 findings | Mayaレビュー済 | →002 |
| 完成LP | done | `previews/case-B-gen-001-complete.html`（3.36MB・palette care sage/peach・3画像埋込・memo有） | — | — | — | — |
| レビュー | done | `reviews/case-B-gen-001-review.md`（Meta 4観点verbatim・prompt700/comp2808） | — | — | 時間分離の効き確認・with Annual残存・handover曖昧・CTA前出し | — |
| 知見抽出 | done | `insights/002.md`（時間分離の効き＋Annual残存） | — | — | — | →C-C |

- 停止: なし（K4/K5 該当なし。1世代で確定）

### C-C: Contract Marketing / Brand Specialist

| 段階 | 状態 | 生成/成果物 | 適合 | 散文4観点 | ペルソナ | 知見 |
|---|---|---|---|---|---|---|
| 企画・事実固定 | done | `cases/case-C.json` | — | — | — | — |
| gen-001 | done | `generations/case-C/gen-001.{json,md}` prompt1828/comp5962/total7790（001,002反映） | pass（6文） | 0 要修正 / 0 findings | Jordanレビュー済 | →003 |
| 完成LP | done | `previews/case-C-gen-001-complete.html`（2.82MB・palette creative indigo/amber・3画像埋込・memo有） | — | — | — | — |
| レビュー | done | `reviews/case-C-gen-001-review.md`（Meta 4観点verbatim・prompt682/comp3105） | — | — | 導入文4事実詰込・Monthly残存・ownership曖昧 | — |
| 知見抽出 | done | `insights/003.md`（導入文回帰＋Monthly残存＋期間明示の効き） | — | — | — | →C-D |

- 停止: なし（K4/K5 該当なし。1世代で確定）

### C-D: Dispatched Logistics / Warehouse Associate

| 段階 | 状態 | 生成/成果物 | 適合 | 散文4観点 | ペルソナ | 知見 |
|---|---|---|---|---|---|---|
| 企画・事実固定 | done | `cases/case-D.json` | — | — | — | — |
| gen-001 | done | `generations/case-D/gen-001.{json,md}` prompt2334/comp4313/total6647（001-003反映） | pass（10文） | 0 要修正 / 0 findings | Rikuレビュー済 | →004 |
| 完成LP | done | `previews/case-D-gen-001-complete.html`（3.30MB・palette logistics slate/lime・3画像埋込・memo有） | — | — | — | — |
| レビュー | done | `reviews/case-D-gen-001-review.md`（Meta 4観点verbatim・prompt761/comp3514） | — | — | 1文1事実定着・派遣分離成立・Pay isラベル・範囲曖昧 | — |
| 知見抽出 | done | `insights/004.md`（分離定着＋ラベル口調残存） | — | — | — | →C-E |

- 停止: なし（K4/K5 該当なし。1世代で確定）

### C-E: Part-time Hospitality / Cafe Crew

| 段階 | 状態 | 生成/成果物 | 適合 | 散文4観点 | ペルソナ | 知見 |
|---|---|---|---|---|---|---|
| 企画・事実固定 | done | `cases/case-E.json` | — | — | — | — |
| gen-001 | done | `generations/case-E/gen-001.{json,md}` prompt2790/comp4431/total7221（001-004反映） | pass（11文） | 0 要修正 / 0 findings | Yuiレビュー済 | →005 |
| 完成LP | done | `previews/case-E-gen-001-complete.html`（3.14MB・palette cafe brown/cream・3画像埋込・memo有） | — | — | — | — |
| レビュー | done | `reviews/case-E-gen-001-review.md`（Meta 4観点verbatim・prompt806/comp2715） | — | — | ラベル→自然主語に改善・大文字残存・filler指摘 | — |
| 知見抽出 | done | `insights/005.md`（filler残存＋大文字持続） | — | — | — | →C-F |

- 停止: なし（K4/K5 該当なし。1世代で確定）

### C-F: Casual Retail / Seasonal Sales Associate

| 段階 | 状態 | 生成/成果物 | 適合 | 散文4観点 | ペルソナ | 知見 |
|---|---|---|---|---|---|---|
| 企画・事実固定 | done | `cases/case-F.json` | — | — | — | — |
| gen-001 | done | `generations/case-F/gen-001.{json,md}` prompt3266/comp5575/total8841（001-005反映） | pass（11文） | 0 要修正 / 0 findings | Haruレビュー済 | →006 |
| 完成LP | done | `previews/case-F-gen-001-complete.html`（2.49MB・palette retail teal/coral・3画像埋込・memo有） | — | — | — | — |
| レビュー | done | `reviews/case-F-gen-001-review.md`（Meta 4観点verbatim・prompt758/comp3341） | — | — | 期間明示の効き・Hourly残存・weekends曖昧・for this position | — |
| 知見抽出 | done | `insights/006.md`（通しの確定知見・持続パターンの結論） | — | — | — | →完了 |

- 停止: なし（K4/K5 該当なし。1世代で確定）

---

## 時系列

### 2026-11-02: スキャフォールド

- `cases/case-A..F.json` 6件を作成（英語 facts, 雇用形態6種, Full-time 2件は業種を分離）。各ハッシュを上表「入力版」に記録
- `tools/` を loop-015 から継承（`baseten-loop-en.mjs`, `inject-memo-form.mjs` 等）。Baseten 値 `max_tokens 4000 / temp 0.4` は継承
- `insights/` をストック置き場として用意（台帳 `docs/learnings.md` への昇格は別途判断）
- 本人の手番は完成LPへのメモとレビュー確認のみに寄せる方針を README と本記録で固定

### 2026-11-02: 通し実行（C-A→C-F直列・一括報告）

- 開始時に `git status`（HEAD `fbd576f`、Baseten関連は未コミット作業ツリー）＋ `git pull --ff-only`（Already up to date）で最新状態を取り直してから開始。マージ未完了等の異常なし
- 疎通確認: `tools/baseten-check.mjs --out loops/loop-016/cache/connectivity-check.json` で ok=true（prompt146/completion16/total162）。K2に数えない
- 上限の再較正（回す側の判断）: 正式値 max_tokens=4,000 で content null 失敗（`cache/debug-baseten.mjs`: prompt322/completion4000/reasoning3997）。max_tokens=8,000 で成功確認（`cache/debug-baseten2.mjs`: prompt322/completion1715/reasoning1381/content1297）。本ループの生成は 8,000 / temp 0.4 に引き上げて実施。較正probe 2回はK2に数える（保守的に8/40で管理）
- 新規ツール（本体工程1-6には触れず、loop-016/tools/ 内のみ）: `loop16-generate.mjs`（EN生成＋insights自動注入＋適合/散文検査）・`loop16-images.mjs`（Meta 3点/ケース）・`loop16-complete.mjs`（完成LP組付け＋memo注入）・`loop16-review.mjs`（Metaペルソナレビュー、max_tokens 4,000）
- C-A→C-Fを直列で各1世代ずつ通した。全ケース適合pass・散文要修正0のため追加世代なし。K4（同じ指摘3世代）・K5（適合落ち2連続）の該当なし。K1・K3の発動なし
- 画像は `previews/images/` にファイル出力のみ（18点・成功18/18・manifest集計）。文脈への大量読込なし。画像の文字・数字・ロゴ混入の目視は未実施（ファイル確認に留めた旨を記録する）
- 本報告が全ケース分の一括報告（完成LP＋レビュー＋知見＋本記録の更新をそろえて提示）。途中報告は行っていない

---

## 反映メモの版

| 版 | 作成日 | 元の書き込み（ケースと指摘番号） | 確認状態 | 適用された世代 |
|---|---|---|---|---|
| — | — | — | — | — |

> 反映メモは統括(Muse)が本人の書き込みから整え、本人が確認してから次世代へ渡す。整形に Baseten 実行は使わない

## ペルソナレビューの記録

| ケース | 生成 | レビュー日 | 不明点 | 離脱点 | 応募者質問 | AIっぽさ | ファイル |
|---|---|---|---|---|---|---|---|
| C-A | gen-001 | 2026-11-02 | flex coreと10:00-18:30の関係が曖昧 | weekly reviewの継続不明＋a 8-person | 継続可否・時間シフト・month7以前・commute範囲 | offering Annual | `reviews/case-A-gen-001-review.md` |
| C-B | gen-001 | 2026-11-02 | handover leadの役割・workshop有給扱い・month7以前 | license copy前出し | 5日の内訳・handover運用・workshop有給・month7以前 | with Annual | `reviews/case-B-gen-001-review.md` |
| C-C | gen-001 | 2026-11-02 | reports toの主体・ownership定義 | ownership曖昧でCTA前で停止 | ownership中身・month11基準・scope・remote固定 | on a Contract, 12 months basis | `reviews/case-C-gen-001-review.md` |
| C-D | gen-001 | 2026-11-02 | 3-5日の選択主体・twice/week曜日 | 日数変動で収入不安・registerの意味 | 曜日固定・coordinator連絡・shuttleとpass・支払主体 | Pay is Hourly | `reviews/case-D-gen-001-review.md` |
| C-E | gen-001 | 2026-11-02 | Fromの意味・Staff drink中身 | 11:00-14:00割当不安・shift board矛盾感 | 08:00-11:00固定・駅出口・board決定・onboarding時間帯 | learn at your own pace | `reviews/case-E-gen-001-review.md` |
| C-F | gen-001 | 2026-11-02 | floor buddy week 1・Hourly大文字 | weekends preferred必須/任意 | 終了日固定・weekends・pass上限・orientation中身 | for this position | `reviews/case-F-gen-001-review.md` |

> 4観点は原文のまま記録する（要約しない）

## 知見ストックの記録

| # | 抽出元（ケース/生成/レビュー） | 知見の要旨 | 反映先（ケース/世代） | 反映内容 | 台帳昇格 |
|---|---|---|---|---|---|
| 001 | C-A gen-001/review | 上限8,000較正・集約化pass・flex曖昧/冠詞/offering Annual | C-B gen-001以降（自動） | 8,000継続・時間分離・冠詞注意を自動注入 | 未判断 |
| 002 | C-B gen-001/review | 時間分離の効き・with Annual残存・CTA前出し離脱 | C-C gen-001以降（自動） | 分離維持・annual小文字指示・CTA配置で緩和 | 未判断 |
| 003 | C-C gen-001/review | 導入文4事実詰込回帰・Monthly残存・期間明示の効き | C-D gen-001以降（自動） | 導入文3以内・CTA分離・小文字明示 | 未判断 |
| 004 | C-D gen-001/review | 1文1事実定着・派遣分離成立・Pay isラベル残存 | C-E gen-001以降（自動） | 分離維持・ラベル開き回避を自動注入 | 未判断 |
| 005 | C-E gen-001/review | filler残存・大文字持続・自然主語に改善 | C-F gen-001（自動） | filler回避・大文字は目視記録に留める | 未判断 |
| 006 | C-F gen-001/review＋全連鎖 | 全6各1世代pass・分離系は効き大文字/ラベル/fillerは持続 | 締め（次ループ持越し） | 追加世代なしで確定・持続パターンは明示強化が必要と結論 | 未判断 |

> ループ内で完結。台帳昇格は別途判断し、本ループは台帳を書かない

## 停止の記録

| 日時 | ケース | 条件 | 理由 | 残した記録 |
|---|---|---|---|---|
| 該当なし | — | K1–K5 | 全6ケース各1世代で適合pass・散文要修正0のため追加世代なし。K4（同じ指摘3世代）・K5（適合落ち2連続）の該当なし。K1指示なし、K3期限内（11/04日中前に完了） | 本記録＋各gen-*.md |

> 上限変更（max_tokens 4,000→8,000、Metaレビュー 2,000→4,000）は停止ではなく回す側の判断。理由は「呼び出し数の管理」に記録した。

---

## ページ級検出の初回トライアル（2層）— 2026-11-02

- 背景: 統括が完成LP C-A/C-Fを直接見た所見（生成文は自然で事実正確だが、組み立て後のページに欠陥）に対し、既存散文評価では拾えなかったため、本人設計の2層検出を trial した。正解は統括目視（C-A=事実表内同一文反復×3＋二重掲載facts↔body＋検証文＋企画メモ露出＋見出しずれ / C-F=二重掲載＋検証文＋企画メモ露出）。
- 実装置き場: `loops/loop-016/tools/`（本体工程1–6には触れない）。Baseten呼び出し枠(40回)は使わず、Meta API枠として分けて記録。新しいルール・辞書・ペアはcandidateとして追加し、恒常化は本人承認を経る（ループが勝手に書き換えない）。

### 第1層: ルールベース検知 (`loop16-pagecheck.mjs` v1.0-candidate, deterministic, no API)

- 入力: `previews/case-*-gen-*-complete.html`（組み立て済みHTML）。出力: `checks/case-*-pagecheck.{json,md}`（場所つき警告）。
- 4項目: (1)重複文（表示テキストを文単位に分割・正規化し出現回数とセクションを数える、2回以上を警告。意図的再掲の仕分けは後段に任せまず全部出す）(2)検証側定型文辞書（英日、初期エントリは実例から。英: What this means/numbers stay exactly as stated/etc. 日: 求人票にない/再計算はしない/ため書きません）(3)記録物ラベル露出（factKeys/sourceLines/Target audience/Persona/Insights applied/〔〕/L01等）(4)見出しと中身のずれ（見出し担当範囲と配下の文が引用するfact key対応表を出し範囲外が混ざれば警告）。
- 辞書は `tools/dicts/` にcandidateとして置く（verification-phrases.json / record-labels.json / heading-scope.json）。

| ケース | 重複グループ(≥2) | 重複出現計 | 検証ヒット(件) | 記録露出グループ | 記録ヒット | 見出しずれ |
|---|---|---|---|---|---|---|
| C-A | 15 | 40 | 9 | 11 | 43 | 1 (conditions: Pay & Hoursにcompany/role/location/commute/team/training/benefits混入) |
| C-B | 17 | — | 8 | 11 | 45 | 1 |
| C-C | 17 | — | 8 | 11 | 46 | 1 |
| C-D | 23 | — | 8 | 11 | 53 | 1 |
| C-E | 24 | — | 8 | 11 | 53 | 1 |
| C-F | 25 | — | 8 | 11 | 53 | 1 |

- 詳細: `checks/case-*-gen-001-pagecheck.{json,md}` に場所つきで残す。C-Aのintra-facts重複は `Northbridge Labs is hiring...` がabout内で3回＋conditionsで1回（count=4）として検出。二重掲載は同文のabout↔conditions跨ぎとして同時に捉えられる。C-Fはtermの二重掲載（L06がabout/conditions/S11で3回）などを検出。検証文はhighlightブロックの `What this means...` 等を全ケースで拾う。記録物は `Target audience`/`Persona`/`Insights applied`/`factKeys`/`L01`等を全ケースで拾う。見出しずれは `Pay & Hours — Exactly as Stated` にteam/training/benefits等が混ざることを `heading-scope` candidateルールで警告。

### 第2層: Few-shot 対比ジャッジ (`loop16-judge.mjs`, Meta枠)

- 手法: freshセッションに、対比ペア（悪い例/良い例）と対象ページ（visible text 9,000字 truncation）を渡し、欠陥カタログP1-P5ごとに ある/ない と根拠引用を返させる。カタログ: P1 反復による仕様書化 / P2 検証側・メタ文の混入 / P3 記録物の露出 / P4 見出しと中身のずれ / P5 当事者の声の欠落。出力は `checks/case-*-judge.md` にverbatimで残す（要約しない）。
- ペア: `checks/pairs/` に出典つきで置く（candidate, not product）:
  - `pair-01-trial2-note.md`: 試作2注記 修正前/後（P2/P3対比、JA）
  - `pair-02-loop012-loop013.md`: loop-012 typed-generation.json vs loop-013 persona-generation.json（P1対比、JA）
  - `pair-03-cA-folded.md`: C-A現行LP vs 畳んだ版（P1二重掲載/P3/P4対比、EN。gen文は自然だが組み立てで仕様書化する例）
- モデル: `muse-spark-1.3-contributor`, max_tokens=8,000 (C-Dで4,000ではreasoning 3,883で切れたため引き上げ), temperature 0.3。実行6回、Baseten枠に含めない。

| ケース | P1 反復 | P2 検証文 | P3 記録物 | P4 見出し | P5 声欠落 | judge usage (prompt/comp/total) |
|---|---|---|---|---|---|---|
| C-A | ある | ある | ある | ある | ある | 4377/2683/7060 |
| C-B | ある | ある | ある | ある | ある | 4273/3125/7398 |
| C-C | ある | ある | ある | ある | ある | 4329/3399/7728 |
| C-D | ある | ある | ある | ある | ある | 4262/3104/7366 |
| C-E | ある | ある | ある | ある | ある | 4313/2401/6714 (cached 4209) |
| C-F | ある | ある | ある | ある | ある | 4232/3798/8030 (cached 4209) |

- 全ケースでP1-P5とも ある と判定。verbatim引用は各 `checks/case-*-gen-001-judge.md` を参照。例 C-A P1は `Northbridge Labs is hiring...` の3回反復＋二重掲載を引用、P2は `What this means... numbers stay exactly as stated` を引用、P3は `Target audience ... Persona: Alex` を引用、P4は `You will join a 8-person product team...` がPay & Hours配下に来るずれを引用。

### 正解（統括目視）との対照

| 欠陥 | 統括正解 C-A | Layer1 拾えた? | Layer2 拾えた? | 所見 |
|---|---|---|---|---|
| 事実表内同一文反復 (intra-facts, C-Aで最大3回) | あり | ✅ 拾えた (count=4, occurrences about×3+conditions×1) | ✅ 拾えた (P1引用) | Layer1はcross-section含むためintraだけの切り出しは今後改善 |
| 二重掲載 facts↔body | あり | ✅ 拾えた (同上、conditions側の出現として) | ✅ 拾えた (P1二重掲載) | Layer1はまず全部出す方針で意図的再掲との分離は未実装 |
| 検証側定型文残存 | あり | ✅ 拾えた (What this means等9ヒット) | ✅ 拾えた (P2) | JA辞書は試作2由来の3語のみでまだ薄い |
| 企画メモ露出 Target audience/Persona/Insights | あり | ✅ 拾えた (Target audience/Persona/Insights applied/L01等11グループ43ヒット) | ✅ 拾えた (P3) | L01等の露出は注記欄由来で誤検知寄りだが candidate として出す |
| 見出しと中身のずれ Pay & Hoursにteam/benefitsまで | あり | ✅ 拾えた (unexpectedKeys: company/role/location/commute/team/training/benefits) | ✅ 拾えた (P4) | PayのallowedKeysがcandidateでまだ粗い（commute/termの扱い要検討） |

| 欠陥 | 統括正解 C-F | Layer1 拾えた? | Layer2 拾えた? | 所見 |
|---|---|---|---|---|
| 二重掲載 | あり | ✅ 拾えた (25グループ、例 term / L06が3回) | ✅ 拾えた (P1) | — |
| 検証側定型文 | あり | ✅ 拾えた (8ヒット) | ✅ 拾えた (P2) | — |
| 企画メモ露出 | あり | ✅ 拾えた (11グループ53ヒット) | ✅ 拾えた (P3) | — |
| 見出しずれ | あり(推定) | ✅ 拾えた (Pay & Hoursにcompany/role/location/term/commute/training/perks混入) | ✅ 拾えた (P4) | C-Fは事実が1文1事実でintra反復なし、二重掲載のみだが検出は拾う |

- 総括: C-A/C-Fの正解項目は両層とも全て拾えた。散文評価では拾えないページ級欠陥を、ルール層は決定的に数え、ジャッジ層は対比で仕様書化を言語化した。P5は正解に含まれないが両層とも ある と判定（ページが説明文のみで当事者の声がない）— P5は改善点ではなく観察として扱う。

### 検出側の改善点（拾えなかった項目はなし、精度向上のための候補）

- **重複文の分類**: 現状はintra-facts反復と二重掲載を同一カウント。改善候補: 同一section内反復 vs 跨section二重掲載 vs 引用記号(〔〕)自体の重複を分ける。CTA等の意図的再掲除外ルールも候補化（本人が承認後に恒常化）。
- **検証辞書の拡充**: JAは3語のみ、ENはC-A実例9語。試作2の実例や今後の目視から候補を追加し、本人承認で恒常化。誤検知を恐れて絞らない方針は維持。
- **記録物露出の閾値**: L01/L02等のsourceLineコードはnote欄にも出るため毎回ヒットする。candidateのまま置き、恒常ルールでは「本文factsテーブル外のLコードのみ」等の絞りを検討。
- **見出しスコープ**: Pay & HoursのallowedKeysがcandidateでまだ英語のみ。日本語ページ（勤務地/給与）や、term/commute等の境界（給与に含むか別セクションか）は本人と統括で確定後に恒常化。
- **P5の扱い**: 当事者の声の欠落はページ級だが生成文責と組付け責が混在。gen-002ではP1-P4を優先し、P5は参照に留める。
- **Judgeの安定性**: C-Dでmax_tokens 4,000ではP3-P5が切れたため8,000に引き上げた。reasoning約2,300-3,800を要するため、以後Judgeは8,000で運用する（Meta枠）。

### カウントの追加

- Baseten枠(40)は8のまま（本検出は使わない）。
- Meta枠追加: 画像18回 + レビュー6回 + Judge6回 = 計30回。Judgeのtokensは `checks/case-*-judge.json` にusageを記録（prompt約4,200-4,400 / completion 2,400-3,800 / total 6,700-8,300、reasoning 2,100-3,400、cachedあり）。

## 調査工程の追加（2026-11-02決定、期間内で実施）

- 位置: 企画固定の後、生成の前。loop-016では gen-002 以降に適用。gen-001は調査なし基準世代として対照に残す。
- やり方: ケース企画で範囲を決める → その職種・雇用形態の実際の公開広告（Indeed / LinkedIn等の主要媒体、英語圏、3件以上/ケース）を読む → 本文は転用せず型に抽象化して整理 → 生成は型を組み立てる形にする。
- 成果物: `loops/loop-016/research/common.md` v1.0 + `research/case-a.md`〜`case-f.md` v1.0（計7ファイル、2026-11-02 viewed）。観点は共通編(文法・給与提示・並び順・未記載・CTA・避ける表現)とケース別編(訴求・提示順・業界言い回し)で固定。出典は各ファイルに媒体・職種・閲覧日を記録。版を固定し、生成がどの版を参照したか記録できるようにする。
- 生成への接続: `loop16-generate.mjs` に `loadResearch()` を追加。gen-001ではresearchなし、gen-002以降では `research/common.md` + `research/case-{letter}.md` を「表現の型」レイヤーとしてプロンプトに注入。事実の根拠は cases/ のみ（researchは事実の根拠にしない）。世代の記録(gen-*.json/md)に `researchApplied` と `researchVersion` を残す。
- 検出への接続: 第2層ジャッジ `loop16-judge.mjs` の欠陥カタログに P6候補「読み手の第一確認項目がヒーローに出ていない」を追加（例: 時給制ケースでペルソナが給与を最初に確認するのにヒーローに給与が出ていない）。候補のため恒常化は本人承認を経る。Judgeは researchの型を参照してP6を判定できるようにする（gen-002以降のLPで有効）。
- 完成LP: `loop16-complete.mjs` はresearchを heroパターン注記として記録（factsはcases/のみ）。本格的なhero再構成は次世代以降で実施。
- 枠: 調査はBaseten呼び出し枠(40回)を使わない。当初案の「Meta枠で調査」の扱いは実作業が手動抽象化のため枠消費なしとして整理。run-recordに調査の実施範囲と成果物の版を記録する（本項）。
- 生成はK3（11/04日中）までに行う。調査の恒常化は本体コードに触れない。

### 研究成果物の版

| ファイル | 版 | 閲覧日 | 由来 |
|---|---|---|---|
| research/common.md | v1.0 | 2026-11-02 | Indeed US Software Engineer 6件 + Indeed employer guide + LinkedIn Talent templates |
| research/case-a.md | v1.0 | 2026-11-02 | 上記 + SaaS mid-size postings |
| research/case-b.md | v1.0 | 2026-11-02 | LinkedIn RN template + Indeed RN 3件 |
| research/case-c.md | v1.0 | 2026-11-02 | Indeed UK Contract Brand 3件 + LinkedIn Brand contract |
| research/case-d.md | v1.0 | 2026-11-02 | Indeed Warehouse dispatched 3件 + LinkedIn temp |
| research/case-e.md | v1.0 | 2026-11-02 | Indeed Part-time Cafe/Barista 3件 |
| research/case-f.md | v1.0 | 2026-11-02 | Indeed Seasonal Retail 3件 + LinkedIn seasonal |

- 版固定: 上記v1.0が本ループの基準。gen-002以降はこの版を参照し、世代記録に版を残す。


---

## gen-004 実施 (2026-11-02) — reflection v-next R1-R8 + ケース別（検証）

- 入力: gen-003条件（research v1.0適用、テンプレートgen-003版）に反映メモ v-next を追加
- 反映メモ: `reflection-memos/2026-11-02-reflection-v-next-gen004.md` 版 v-next-gen004 (2026-11-02) — 元 `memos/gen-003-memos.md` 6件
- 適用版の記録: 各 `generations/case-*/gen-004.json` の `reflectionApplied: ["loops/loop-016/reflection-memos/2026-11-02-reflection-v-next-gen004.md"]` / `reflectionVersion: "v-next-gen004 (2026-11-02)"`
- 生成条件: Baseten `meta-models/muse-spark-open-1026` max_tokens 12,000 temperature 0.4 直列6ケース
- 組み立て: `loop16-complete.mjs` で R3-R8 を gen==="004" 分岐（gen-003 T1-T5 継承）、R8は既存画像再配分のみ（新規生成なし）
- 制約: 本体(工程1-6)・`cases/`・research v1.0 不変、コミット・push なし

### 生成結果 gen-004（Baseten）

| ケース | prompt | completion | total | reasoning | 文数 | 適合 | 散文 needsFix |
|---|---|---|---|---|---|---|---|
| C-A | 12701 | 4535 | 17236 | 4143 | 9 | pass | 0/0 |
| C-B | 12458 | 6762 | 19220 | 6425 | 10 | pass | 0/0 |
| C-C | 12425 | 6428 | 18853 | 6093 | 9 | pass | 0/0 |
| C-D | 12548 | 5122 | 17670 | 4759 | 9 | pass | 0/0 |
| C-E | 12507 | 9488 | 21995 | 9184 | 9 | pass | 0/0 (2回目で成功、1回目 No content) |
| C-F | 12527 | 3747 | 16274 | 3414 | 8 | pass | 0/0 |

> Baseten 40枠: 8 probes+gen-001 6+gen-002 6=14/40 success(16 calls) に gen-004 6 success(+1再試行)を追加 → 20/40 success(23 calls)。gen-004は全ケース初回12,000。C-Eは1回 No content→再試行で成功（上限不足扱い、K5除外）。

#### 散文評価（4観点）

- gen-004 全6ケース needsFix 0/0（gen-003も0/0）で変化なし。conformance全pass。

### pagecheck Layer1 対照 gen-003 vs gen-004（deterministic）

| ケース | dup groups gen003→gen004 | occ total | verify hits | record hits | heading mismatch | heroP6 |
|---|---|---|---|---|---|---|
| C-A | 7→9 (+2) | 17→21 | 2→2 | 0→0 | 0→0 | 1→1 |
| C-B | 7→8 (+1) | 17→19 | 2→2 | 0→0 | 0→0 | 1→1 |
| C-C | 7→9 (+2) | 18→24 | 2→2 | 0→0 | 0→0 | 1→1 |
| C-D | 6→9 (+3) | 16→24 | 2→2 | 0→0 | 0→0 | 1→1 |
| C-E | 8→7 (-1) | 17→19 | 2→2 | 0→0 | 0→0 | 1→1 |
| C-F | 8→9 (+1) | 19→23 | 2→2 | 0→0 | 0→0 | 1→1 |

> verify 2はCTA由来 `All conditions above / No new facts` のみ（T3で highlight除去済み維持）。record 0維持（T4+R4）。heading 0維持（T5）。heroP6 6/6 PRESENT維持。dupはgen-003比で5ケース悪化・1ケース微改善。原因はR5の hero-highlight がfacts表の値をheroでも逐語掲示するため、pagecheckの重複検知（facts表値とhero値の同一文字列）が追加カウントされたこと。R1の意図（表と文の重複減）とconformanceの「数値verbatim保持」が構造的に衝突し、gen-004生成文もfacts値を逐語含むためdup減に至らなかった。

### judge Layer2 P1-P6 対照 gen-003 vs gen-004

| ケース | P1反復 gen003→gen004 | P2検証文 | P3記録物 | P4見出し | P5声欠落 | P6第一確認 |
|---|---|---|---|---|---|---|
| C-A | ない→ある | ある→ある | ある→ある | ない→ある | ある→ある | ない→ない |
| C-B | ない→ない | ある→ある | ある→ある | ない→ない | ある→ある | ない→ない |
| C-C | ない→ある | ある→ある | ある→ある | ある→ある | ある→ある | ない→ない |
| C-D | ない→ある | ある→ある | ある→ある | ある→ない | ある→ある | ない→ない |
| C-E | ある→ある | ある→ある | ある→ある | ある→ある | ある→ある | ない→ない |
| C-F | ある→ある | ある→ある | ある→ある | ある→ある | ある→ある | ない→ない |

> P1は C-A/C/Dで ない→ある に再発（hero-highlightの導入と生成文の冗長が「同一施設の仕様書化」と判定された）。P4は C-Dで ある→ない に解消（Team & Supportへの混入判定が外れた）が、C-Aで ない→ある に再発（company/roleを含む導入文がTeam混入と判定）。P2/P3/P5/P6は全ケース不変。P2/P3はテンプレ起因の CTA検証文とGeneration記録露出が残存するため反映メモ外（R3-R8では触れない）。P5は当事者の声欠落として全ケース指摘継続。

### 反映検証 R1-R8＋ケース別（解消／部分／再発）

> 反映メモ v-next-gen004 の項目ごとに完成LPと生成文を目視し、gen-003比で判定。

#### 共通R1-R8

| 項目 | 指示 | C-A | C-B | C-C | C-D | C-E | C-F | 判定根拠（代表） |
|---|---|---|---|---|---|---|---|---|
| R1 | facts表と生成文の重複を減らす（生成意図） | 再発 | 再発 | 再発 | 再発 | 部分 | 再発 | pagecheck dup 5増1減、judge P1 3再発。生成文が Annual 4,800,000 JPY 等を逐語保持するため表値と重複。conformance verbatim要件と競合。 |
| R2 | 事実の関係性・dates verbatimを読み手視点で明確化（生成意図） | 解消 | 解消 | 部分 | 解消 | 部分 | 解消 | C-A flex core説明追加、D 15kg前出し、C-F weekend preferred説明・端日維持。C-C ownershipはbenefits内に留まり前出し弱く部分、C-E時間枠は短縮されたが依然長い。 |
| R3 | 冒頭の指示・方針文を置かない（組立） | 解消 | 解消 | 解消 | 解消 | 解消 | 解消 | hero leadから plan.appeal 除去。全heroに Emphasize/Explicit/State 等の指示文残存なし。 |
| R4 | 内部フィールド名を表示しない（組立） | 解消 | 解消 | 解消 | 解消 | 解消 | 解消 | facts表左カラムを humanLabel 化（Employment type/Contract terms/Work hours）。candidate pagecheck recordHits 0維持、全体でcamelCase 0。 |
| R5 | hero第一確認項目を視覚的に際立たせる（組立） | 解消 | 解消 | 解消 | 解消 | 解消 | 解消 | hero-card内 hero-highlight ブロック追加。heroP6 6/6 PRESENT。全heroに Annual/ Day shift/Contract 12 months/ Apex+Saitama/ From 3h+Futako/ 6 weeks が大フォントで表示。 |
| R6 | 応募前チェックは読み手の条件項目にする（組立） | 解消 | 解消 | 解消 | 解消 | 解消 | 解消 | checksを CHECK_KEYS_004 に置換。C-A company→salary/workHours/commute/training、C-F company→term/pay/workHours/commute 等。全ケースでcompany/role先頭占有を解消。 |
| R7 | CTA文言を実際の次の行動と一致させる（組立） | 解消 | 解消 | 解消 | 解消 | 解消 | 解消 | CTA desc/buttonを CTA_004 に置換。例 C-C Apply with portfolio link、C-D Register for site tour、C-E no resume needed。 |
| R8 | 画像配分を仕事中心に変更（生成なし・再配分） | 解消 | 解消 | 解消 | 解消 | 解消 | 解消 | place画像を photo-sm に小サイズ化、キャプションを surrounding area に変更。work画像は conditions横に維持、teamへのplace二重配置なし。 |

#### ケース別指示（生成意図、R1-R2と併用）

| ケース | 指示要旨 | 判定 | 根拠 |
|---|---|---|---|
| C-A | 年収は表・heroに任せ文は1文集約、flexコア説明、Umeda駅名明確化 | 解消 | 文3で年収1文集約、文4で flex core 11:00-16:00 is core time...と補足、文5で Umeda Station駅名明記。 |
| C-B | 日勤固定の否定明示、3営業日以内を日数で明記 | 解消 | 文4 Day shift ... no scheduled night duty を1文で完結、文10で reply within 3 business days 日数明記。 |
| C-C | 期間と更新条件を別文分離、ownership前出し | 部分 | 文3 Contract 12 months と文4 Renewal review を分離（解消）。ownershipは文2 Benefits内に留まり冒頭寄りだがTeam本文ではなく部分。 |
| C-D | 15kg要件と週3-5日選択肢を前出し、雇用元・就業先分離維持 | 解消 | 文3 able to stand/lift up to 15 kg を3文目に前出し、文4 3-5 days/week selectable を早段落に、文1-2で employer/worksite 分離維持。 |
| C-E | 時間枠選択肢を短く、駅近の駅名明記 | 解消 | 文3 From 3 hours/day... を短く集約、文4 2-min walk from Futako-Tamagawa Station 駅名明記。 |
| C-F | 期間端日を日付で必明記、weekends preferredを優遇として正確に | 解消 | 文2 6 weeks: 2026-12-01 to 2027-01-11 端日明記・no extension維持、文4 weekends preferred... preferred rather than required と正確化。 |

> 総合: R3-R8の組立系は6ケース全てで解消（6/6）。ケース別の生成意図は C-Cを除き解消（5/6は解消、1部分）。R1は構造的競合で再発5・部分1、R2は部分2を含むが概ね解消。pagecheckの数値悪化はR1の未達、judgeのP1再発はhero重複の判定差による。P2/P3/P5の残存（検証文・記録物・声欠落）はR外のテンプレ起因で次ループの検討課題。

### 生成文の差（gen-003→gen-004、R1-R2反映）

| ケース | gen-003特徴 | gen-004特徴 | 変化 |
|---|---|---|---|
| C-A | 年収・勤務時間を分離文、flex説明なし | flex core 11:00-16:00 is core time... 補足文に拡張、commute文に駅名維持 | R2解消、R1は数値保持のため重複残存 |
| C-B | 日勤固定を1文で、CTAに期限含む | 同構成維持、trainingの冠詞 Two→Two 維持、期限はCTAと文10に重複保持 | 維持 |
| C-C | 期間と更新を別文だが benefitsが後 | ownershipをbenefits文2に前出し、期間分離は維持だがCTAで term再掲冗長 | 部分改善 |
| C-D | 要件を文10で後置 | 要件を文3へ前出し、workHoursを選択主体付きで補足 | R2前出し解消 |
| C-E | 時間枠を文3で独立 | 同構成だが From 3 hours... を維持、駅近は文4で駅名維持 | 維持 |
| C-F | weekends preferred 単句 | weekends preferred... preferred rather than required と選任意図を明確化、期間端日維持 | R2解消 |


## 実測・記録・判断の区別

- 実測: 疎通結果、生成物の文面、適合確認の機械検査の出力、散文評価の要修正件数は実測とする
- 記録に基づく事項: 設計の骨格、K1–K5 の確定値、開示する形の固定は実施ブリーフと本記録の確定値に基づく
- 判断: 「改善した」「部分改善」「仮説が成り立たなかった」の判定は、メモ解消と要修正減少の両方がそろったかで判断する（片方だけでは改善としない）

## 実行手順（本人の環境で）

```sh
# 直列で通しに回す（C-A→C-F）。知見は insights/ に蓄積し次ケースへ自動反映
# 実施済み（2026-11-02）の実際のコマンド:
node loops/loop-016/tools/baseten-check.mjs --out loops/loop-016/cache/connectivity-check.json
node loops/loop-016/tools/loop16-generate.mjs --case A --gen 001  # B..F も同様（insights自動反映）
node loops/loop-016/tools/loop16-images.mjs --case A              # B..F も同様（Meta枠3点/ケース）
node loops/loop-016/tools/loop16-complete.mjs --case A --gen 001  # B..F も同様（memo注入済）
node loops/loop-016/tools/loop16-review.mjs --case A --gen 001    # B..F も同様（Meta枠4観点verbatim）
# → reviews/case-X-gen-001-review.md 作成 → insights/00N.md 抽出 → 次ケースへ自動反映

# ページ級2層検出（2026-11-02追加、Baseten枠外、Meta枠）:
node loops/loop-016/tools/loop16-pagecheck.mjs --all                         # checks/case-*-pagecheck.{json,md} 6件
node loops/loop-016/tools/loop16-judge.mjs --all                             # checks/case-*-judge.md 6件 (pairs: checks/pairs/*.md 使用)
# dicts: tools/dicts/*.json (candidate), pairs: checks/pairs/*.md (candidate)

## 対照実験（vanilla）— 2026-11-02実施、gen-002後に評価

- 目的: 本ライン（facts英語完結・企画・research・知見を反映したLP）と、factsのみから単一プロンプト一発で出すvanilla LPの対照。Baseten枠を使わない並行ラインとして実施し、gen-002完了後にブラインド対照表で評価する。
- 位置: `loops/loop-016/vanilla/` — 本体(工程1-6)と cases/ は変更しない。コミット・push しない。

### 入力物の用意（facts-only機械転記）

- 6枚: `vanilla/inputs/case-a.md`〜`case-f.md` — 各 `cases/case-*.json` の facts のみを sourceLine順に機械転記（L01–L10、key/valueを事実改変なし。要約・言い換え・並べ替え禁止）。plan は入れない。ヘッダに元ファイルの sha256（C-A B45890... / C-B 2A805D... / C-C CE2BC2... / C-D 826E73... / C-E CCF63A... / C-F D60B77...）と日付 2026-11-02、status v1.0 facts-only を記録。

### プロンプト v1.0 (版固定、両モデルで同一)

- `vanilla/prompt-v1.0.md` v1.0 — 本文:

  ```
  Create a recruiting landing page for job applicants from the job posting below.

  Output: a single self-contained HTML file, in English. Images you may use: hero.webp, work.webp, place.webp (provided with the posting).

  Job posting:
  {{TICKET}}
  ```

  置換: {{TICKET}} には各ケースの vanilla入力ファイルの中身をそのまま差し込む（それ以外の注入なし: plan・research・知見は渡さない）。Wonder/Spark で一字も変えない。

### 生成（Meta APIのみ、単一プロンプト・単一応答・手直しなし）

- ツール: `tools/loop16-vanilla.mjs` — `--model wonder|spark --case A..F` / `--all` / `--dry-run`。`max_tokens=8000` `temperature=0.7`、モデルは `muse-wonder-1.0` (wonder) / `muse-spark-1.3` (spark)。画像は gen-001 の当該ケース3点（hero/work/place.webp）を両モデル共通で並置コピー（新規生成なし）。
- 成果物: `vanilla/{wonder,spark}/case-{a..f}.html` + `case-{a..f}.meta.json`（model / promptVersion v1.0 / sourceCaseHash / usage / quota=Meta API (not Baseten) を記録）。html は生の単一応答、手直しなし。
- 実行: 2026-11-02 — 12件完了（wonder 6 + spark 6）。

| case | wonder html | wonder usage (prompt/comp/total) | spark html | spark usage (prompt/comp/total) | closing html | 備考 |
|---|---|---|---|---|---|---|
| A | 17,962 bytes (17,876 chars) | 502 / 8000 / 8502 | 3,835 bytes (3,829) | 502 / 2825 / 3327 | wonder ✗ / spark ✅ | wonderは8000で切れて </html>なし（手直し禁止のためそのまま）。sparkは完結。 |
| B | 16,625 (16,547) | 494 / 6667 / 7161 | 7,175 (7,167) | 494 / 3454 / 3948 | ✅ / ✅ | — |
| C | 15,765 (15,735) | 490 / 7419 / 7909 | 3,120 (3,110) | 490 / 2742 / 3232 | ✅ / ✅ | — |
| D | 18,757 (18,649) | 502 / 8000 / 8502 | 6,078 (6,064) | 502 / 3147 / 3649 | wonder ✗ / spark ✅ | wonder切れ。 |
| E | 16,805 (16,739) | 497 / 7520 / 8017 | 6,355 (6,337) | 497 / 4212 / 4709 | ✅ / ✅ | — |
| F | 18,103 (18,016) | 483 / 8000 / 8483 | 5,801 (5,783) | 483 / 3695 / 4178 | wonder ✗ / spark ✅ | wonder切れ。 |

- 計 usage: wonder prompt 2,968 / completion 45,606 / total 48,574（3件が上限到達で切断） / spark prompt 2,968 / completion 19,075 / total 22,043。
- 切断の扱い: 本ラインは「単一応答・手直しなし」を厳格に守るため、wonder のA/D/F切断はそのまま残す（再生成・追補なし）。評価は切断を含めた状態で行う。
- 枠: Baseten 40枠を消費しない（Meta APIのみ）。imagesのキー値は出力しない・記録しない方針を維持（gen-001と同様）。検出（Baseten呼び出し予算40）は使わない。本体コード1–6と cases/ は変更していない。

### 次の段階（このラインでは生成と記録まで。評価は gen-002 完了後）

- gen-002（research適用世代）生成完了後、vanilla vs gen-002 のブラインド対照表を別途作成する（このラインの成果物を評価側が参照する）。vanillaは評価まで再生成しない。

---

## gen-002 実行（research v1.0適用、画像・パレット・テンプレ不変）— 2026-11-02

- 変更要因: research v1.0（`research/common.md` + `research/case-{a..f}.md` v1.0 2026-11-02）のみ。画像はgen-001の当該ケース3点を再利用（新規生成なし）、パレット・組み立てテンプレ（TITLES固定）も不変。Baseten消費は生成6回追加で累計14/40（成功14、実API呼び出しは16 — C-Bでmax_tokens 8,000時にNo content×2回の失敗を含む）。
- 上限の調整: C-Aはmax_tokens 8,000で成功（reasoning 6,427）したが、C-Bで8,000時にreasoning 7,997でNo content失敗が2連続したため、C-B以降はmax_tokens 12,000で安定させた（C-B reasoning 6,978 / C-C 5,826 / C-D 3,419 / C-E 5,330 / C-F 4,047）。実費は未記録のまま。

### gen-002 パイプライン状態（C-A→C-F直列、一括報告）

| 順 | ケース | 生成（research適用） | 完成LP（gen-001画像再利用） | ペルソナレビュー | pagecheck | judge P1-P6 | 知見抽出 | K4/K5 |
|---|---|---|---|---|---|---|---|---|
| 1 | C-A | done pass/0 (11文, prompt6782/comp6788/reasoning6427) research common,case-a v1.0 | done 2.75MB | done (809/2299) flex曖昧持続/a→an解消 | done dups25/51 verify10 record53 heading1 | done P1-P5ある/P6ない | done 007 | 該当なし |
| 2 | C-B | done pass/0 (11文, 6583/7333/6978) research common,case-b v1.0 | done 3.36MB | done (786/2759) handover持続/CTA改善 | done 25/51 10/53 1 | P1-P5ある/P6ない | done 008 | 該当なし |
| 3 | C-C | done pass/0 (11文, 6563/6158/5826) research common,case-c v1.0 | done 2.82MB | done (751/3382) CTA UI口調新指摘 | done 25/53 10/53 1 | P1-P5ある/P6ない | done 009 | 該当なし |
| 4 | C-D | done pass/0 (11文, 6669/3759/3419) research common,case-d v1.0 | done 3.30MB | done (776/3383) shuttle/pass曖昧持続 | done 25/51 10/54 1 | P1-P5ある/P6ない | done 010 | 該当なし |
| 5 | C-E | done pass/0 (9文, 6622/5640/5330) research common,case-e v1.0 | done 3.14MB | done (736/3141) From大文字/board持続 | done 20/44 10/51 1 | P1-P5ある/P6ない | done 011 | 該当なし |
| 6 | C-F | done pass/0 (9文, 6652/4367/4047) research common,case-f v1.0 | done 2.49MB | done (740/2695) weekends/文法持続 | done 21/47 10/51 1 | P1-P5ある/P6ない | done 012 | 該当なし |

### 呼び出し数の更新

| 区分 | 上限 | 消費 | 残り |
|---|---|---|---|
| Baseten 生成 | 40 | **14**（成功14、実呼び出し16） | 26 |
| Baseten内訳 | — | 較正probe 2 + gen-001 6 + gen-002 6（成功） + gen-002失敗2（C-B No content） | — |
| Meta 画像生成 | 別枠 | 18回（成功18/18、gen-001のみ。gen-002は再利用で新規なし） | — |
| Meta ペルソナレビュー | 別枠 | 12回（gen-001 6 + gen-002 6） | — |
| Meta Judge | 別枠 | 12回（gen-001 6 + gen-002 6） | — |

- K4（同じ指摘3世代）・K5（適合落ち2連続）の該当は全ケースなし。C-BのNo content失敗は「適合落ち」ではなく上限不足による空応答のためK5に数えない。

### gen-001 vs gen-002 対照表（ケース別、報告一括）

#### 適合（pass/fail）・散文（要修正数）

| ケース | gen-001 pass / needsFix / 文数 | gen-002 pass / needsFix / 文数 | 変化 |
|---|---|---|---|
| C-A | pass / 0 / 5文 | pass / 0 / 11文 | 集約→分散（1文1事実化）。適合・散文とも維持 |
| C-B | pass / 0 / 6文 | pass / 0 / 11文 | 同上。時間・CTA分離 |
| C-C | pass / 0 / 6文 | pass / 0 / 11文 | 同上。期間・CTA分離 |
| C-D | pass / 0 / 10文 | pass / 0 / 11文 | 10→11（冒頭連結→3文分離で+1） |
| C-E | pass / 0 / 11文 | pass / 0 / 9文 | 11→9（導入集約で減少しつつ時間独立化） |
| C-F | pass / 0 / 11文 | pass / 0 / 9文 | 11→9（導入明確化で減少） |

> 全ケース適合pass・散文要修正0を維持。research適用で文数は5-11→9-11に収束（短縮も延長も中庸化）。

#### pagecheck（Layer 1: 重複/検証文/記録露出/見出しずれ）

| ケース | gen | 重複グループ | 重複出現計 | 検証Hits | 検証Groups | 記録Groups | 記録Hits | 見出しずれ |
|---|---|---|---|---|---|---|---|---|
| C-A | 001 | 15 | 40 | 9 | 9 | 11 | 43 | 1 |
| C-A | 002 | 25 | 51 | 10 | 10 | 11 | 53 | 1 |
| C-B | 001 | 17 | 42 | 8 | 8 | 11 | 45 | 1 |
| C-B | 002 | 25 | 51 | 10 | 10 | 11 | 53 | 1 |
| C-C | 001 | 17 | 47 | 8 | 8 | 11 | 46 | 1 |
| C-C | 002 | 25 | 53 | 10 | 10 | 11 | 53 | 1 |
| C-D | 001 | 23 | 48 | 8 | 8 | 11 | 53 | 1 |
| C-D | 002 | 25 | 51 | 10 | 10 | 11 | 54 | 1 |
| C-E | 001 | 24 | 49 | 8 | 8 | 11 | 53 | 1 |
| C-E | 002 | 20 | 44 | 10 | 10 | 11 | 51 | 1 |
| C-F | 001 | 25 | 51 | 8 | 8 | 11 | 53 | 1 |
| C-F | 002 | 21 | 47 | 10 | 10 | 11 | 51 | 1 |

> research適用で本文が分散してもpagecheckはテンプレ起因の固定値（facts表＋body二重掲載、検証文 `What this means...`、企画メモ `Target audience`/`Persona`/`Insights applied`の露出、`Pay & Hours` へのteam/benefits混入）でほぼ不変。文数に比例して重複出現計が微増するが、欠陥の有無判定は変わらない。C-E/Fは文数減少で重複が微減する稀な例。

#### judge P1〜P6（Layer 2 few-shot）

| ケース | gen | P1 反復 | P2 検証文 | P3 記録物 | P4 見出し | P5 声欠落 | P6 第一確認項目 |
|---|---|---|---|---|---|---|---|
| C-A | 001 | ある | ある | ある | ある | ある | 未評価 |
| C-A | 002 | ある | ある | ある | ある | ある | ない（heroにFull-time・Osaka・SaaSはある） |
| C-B | 001 | ある | ある | ある | ある | ある | 未評価 |
| C-B | 002 | ある | ある | ある | ある | ある | ない（heroにFull-time・Yokohamaはある） |
| C-C | 001 | ある | ある | ある | ある | ある | 未評価 |
| C-C | 002 | ある | ある | ある | ある | ある | ない（heroにContract 12 monthsはある） |
| C-D | 001 | ある | ある | ある | ある | ある | 未評価 |
| C-D | 002 | ある | ある | ある | ある | ある | ない（heroにDispatched・Saitamaはある） |
| C-E | 001 | ある | ある | ある | ある | ある | 未評価 |
| C-E | 002 | ある | ある | ある | ある | ある | ない（heroにPart-time・Futako-Tamagawaはある） |
| C-F | 001 | ある | ある | ある | ある | ある | 未評価 |
| C-F | 002 | ある | ある | ある | ある | ある | ない（heroにCasual 6 Weeks・Nagoyaはある） |

> P1-P5は全ケース・両世代とも「ある」で不変（組付けテンプレ起因: 二重掲載facts表＋body、検証文ブロック、企画メモ露出、Pay & Hoursへの混入、当事者の声欠落）。researchの文面改善では拾えないページ級欠陥のため、gen-002でも検出結果は変わらない。P6はgen-002で全ケース「ない」（合格）— heroに雇用形態・勤務地・職種区分は揃うが、下記hero直接確認では数値の詳細（年収額・時間帯等の第一確認項目）がhero未掲載であることも併記する。

#### hero第一確認項目（research v1.0定義、ケース別、直接確認）

| ケース | researchの第一確認項目 | gen-001 hero | gen-002 hero | 判定 | 補足 |
|---|---|---|---|---|---|
| C-A | 年収 Annual 4,800,000 JPY | ❌ hero未掲載（TITLES固定: Full-time · Osaka, Umeda / SaaS Product Team） | ❌ 同左 | 両方なし | 年収はPay & Hoursで明示（We offer an annual salary...）。hero掲載はTITLES拡張で対応 |
| C-B | day shift 08:30-17:00, 5 days/week, no night duty | ❌ hero未掲載（TITLES: Full-time · Yokohama / Registered Nurse） | ❌ 同左 | 両方なし | bodyで `Day shift 08:30-17:00... no night duty` を独立文で明示。heroは勤務地・職種のみ |
| C-C | 12か月term（Contract 12 months + Renewal review month 11） | ✅ hero掲載（TITLES: Contract 12 months · Tokyo, Shibuya / Brand Specialist — 12-Month Contract） | ✅ 同左 | 両方あり | C-Cのみheroで期間を既カバー。researchはbodyの期間分離に効いたがhero追加は不要 |
| C-D | 雇用元と就業先の分離（Apex Work Partners / Client distribution center Saitama Kawaguchi） | ✅ hero掲載（TITLES: Dispatched · Saitama, Kawaguchi / Warehouse Associate — Dispatched） | ✅ 同左 | 両方あり | heroで雇用形態・就業地、bodyで雇用元/就業先を3文分離し分離は達成 |
| C-E | 3時間枠 From 3h/day, 2-4 days/week ＋徒歩圏 Futako-Tamagawa 2-min walk | 部分（徒歩圏はheroにエリア名のみ） | 同左 | 両方部分 | heroは `Part-time · Setagaya, Futako-Tamagawa` で駅近エリアを示すが時間枠数値はhero未掲載。bodyで `From 3 hours...` 独立文と `2-min walk` 駅名入りで補完 |
| C-F | 固定日程 6 weeks: 2026-12-01 to 2027-01-11（端日固定・延長なし） | ✅ hero掲載（TITLES: Casual / Seasonal · Nagoya, Sakae / Seasonal — 6 Weeks） | ✅ 同左 | 両方あり | heroで6 Weeksを明示、bodyで端日再掲。researchのCTA端日再掲はbodyで効いた |

> heroはTITLES固定（case-*.jsonのplan由来）でgen-001/002とも同一。researchは生成文面（factsの言い回し・CTA）のみに効き、hero再構成には未反映。将来heroに第一確認項目の数値（年収額・時間帯・時間枠）を出すなら `loop16-complete.mjs` のTITLES拡張が必要。

### 生成文の差（researchが効いた箇所、CTAの変化を含む）

| ケース | gen-001冒頭（集約） | gen-002冒頭（分散） | CTA変化 |
|---|---|---|---|
| C-A | `Northbridge Labs is hiring a Software Engineer ... in Osaka, Umeda` — company/role/locationを1文に集約 | `Northbridge Labs is hiring for its SaaS product team.` → `This opening is for a Software Engineer...` と2文に分散 | 001末尾 `Benefits include...` → 002末尾 `Apply with your resume for a casual first interview...` に分離 |
| C-B | `Harborview ... is hiring for Registered Nurse ... in Yokohama` 集約 | `Harborview ... is hiring for its general ward.` → `The role is Registered Nurse...` 分散 | 001 `Benefits include...` → 002 `Apply ... with a copy of your license and you will receive a reply within 3 business days.` 書類・期限明示 |
| C-C | `Everfield & Co. is hiring a Brand Specialist ... on a Contract, 12 months basis; apply with...` 4事実詰込 | `Everfield & Co. is hiring for this position.` → `You will work as a Brand Specialist...` 分散 | 001 `The position offers Monthly 380,000 JPY and includes...` → 002 `You can apply with one portfolio link and review the Contract, 12 months term on the first screen.` UI口調が新指摘に |
| C-D | `This position is Warehouse Associate ... and the employer is Apex Work Partners` 2事実連結 | `You will work as Warehouse Associate.` → `You will be employed by Apex Work Partners.` → `You will work at Client distribution center...` 3文分離 | 001 `To proceed, register with the agency...` → 002 `Register with Apex Work Partners (dispatching agency) for a site tour...` 雇用元再明示 |
| C-E | `Morningside Coffee is hiring for its neighborhood cafe.` 場所なし | `Morningside Coffee is hiring Cafe Crew ... in Setagaya, Futako-Tamagawa.` 場所前出し | 001 `You can apply quickly...` → 002 `Quick apply with no resume ... and start with a casual chat first.` 簡潔化 |
| C-F | `Crestline Outdoor is hiring for this position.` vague | `Crestline Outdoor is hiring a Seasonal Sales Associate ... in Nagoya, Sakae district.` 明確化 | 001 `If you are available for 6 weeks... please apply` → 002 `Apply this week to start on 2026-12-01 for the 6 weeks: 2026-12-01 to 2027-01-11 seasonal term.` 端日再掲 |

### 知見ストックの更新（gen-002分）

| # | 抽出元（ケース/生成/レビュー） | 知見の要旨 | 反映先（ケース/世代） | 反映内容 | 台帳昇格 |
|---|---|---|---|---|---|
| 007 | C-A gen-002/review | researchで集約→分散・CTA分離・小文字annual・冠詞a→anが効いた。flex曖昧・有給タイミング・review継続性の持続はLP注記で受ける | 次ループ持越し | 分離・小文字は確定、持続指摘はLP注記の設計課題として分離管理 | 未判断 |
| 008 | C-B gen-002/review | 日勤固定の否定明示（no night duty）・CTA書類明示が効いた。Full-time basis大文字が新AI指摘に浮上、handover運用は持続 | 次ループ持越し | day-shift分離・CTA具体化は確定、大文字持続はプロンプト強化課題 | 未判断 |
| 009 | C-C gen-002/review | 期間・更新条件の分離は効くが、CTAの「review the Contract, 12 months term on the first screen」はUI指示口調で新AI指摘に | 次ループ持越し | 期間独立文は確定、CTA term再掲はLP固定領域に任せる方針 | 未判断 |
| 010 | C-D gen-002/review | 派遣3文分離（role/employer/worksite）はresearchで補強され定着。Shuttle/pass並置の曖昧さ・Hourly大文字は持続 | 次ループ持越し | 派遣分離確定、Hourly大文字・選択主体曖昧さは持続パターンとして記録 | 未判断 |
| 011 | C-E gen-002/review | 徒歩圏の駅名入り明示・導入の場所前出しは有効。From大文字・Hourly大文字・board運用不透明さは持続 | 次ループ持越し | 駅名明示・場所前出し確定、boardはFAQ/注記で補う方向 | 未判断 |
| 012 | C-F gen-002/review＋全連鎖 | 期間端日再掲でCTA明確化。hero 6 Weeksは既充足。全6各1世代pass、持続パターン（大文字/filler/選択主体）は再確定 | 締め（次ループ持越し） | 大文字持続・LP注記分離・hero TITLES拡張の3点を次ループへ持越し | 未判断 |

> ループ内で完結。台帳昇格は別途判断し、本ループは台帳を書かない。gen-002の6知見は本体コードに触れない（loop-016/insights/ 内のみ）。

### ペルソナレビューの追加（gen-002分）

| ケース | 生成 | レビュー日 | 不明点 | 離脱点 | 応募者質問 | AIっぽさ | ファイル |
|---|---|---|---|---|---|---|---|
| C-A | gen-002 | 2026-11-02 | flex coreと10:00-18:30の関係・10 paid days from month 7 | 有給遅延・CTA重複タイトル | review継続・時間シフト・有給前半・commute範囲 | You will receive のテンプレ反復 | `reviews/case-A-gen-002-review.md` |
| C-B | gen-002 | 2026-11-02 | handover lead運用・12 paid days from month 7 | 有給遅延 | 5日の内訳・handover・workshop有給・commute | on a Full-time (permanent) basis 大文字 | `reviews/case-B-gen-002-review.md` |
| C-C | gen-002 | 2026-11-02 | reports to主体・ownership of 2 launches | renewal review month11基準不明 | launches中身・month11評価・remote固定・commute | review the Contract, 12 months term on the first screen UI指示口調 | `reviews/case-C-gen-002-review.md` |
| C-D | gen-002 | 2026-11-02 | 3-5日の選択主体・coordinator曜日・shuttle/pass併用 | coordinator不在時の不安 | 曜日固定・連絡手段・shuttle/pass・支払主体 | apply with No forklift license 大文字No | `reviews/case-D-gen-002-review.md` |
| C-E | gen-002 | 2026-11-02 | Fromの意味・shared shift board | boardで週ごと交渉に見え固定不安 | 08:00-11:00固定・駅出口・board決定・onboarding時間 | Hourly 1,250 JPY 大文字 | `reviews/case-E-gen-002-review.md` |
| C-F | gen-002 | 2026-11-02 | weekends preferred必須/任意・perks文法 | weekendsでシフト減の不安 | weekends・時給固定・pass上限・orientation | is included  tacked onto 2 nouns | `reviews/case-F-gen-002-review.md` |

### 停止の更新（gen-002分）

| 日時 | ケース | 条件 | 理由 | 残した記録 |
|---|---|---|---|---|
| 2026-11-02 | C-A〜C-F | K1–K5 | 全6ケース各1世代（gen-002）で適合pass・散文要修正0のため追加世代なし。K4（同じ指摘3世代）・K5（適合落ち2連続）の該当なし。K1指示なし、K3期限内（11/04日中前に完了） | 本記録＋各gen-*.md＋reviews＋pagecheck＋judge＋insights 007-012 |
| 2026-11-02 | C-B | — | max_tokens 8,000でNo content失敗2回（reasoning 7,997占有）。12,000に引き上げて成功。K5には数えない（適合落ちではなく上限不足） | `generations/case-B/gen-002.json` にusage記録（prompt 6583/comp 7333/reasoning 6978） |

> 上限変更（max_tokens 8,000→12,000 for C-B以降）は停止ではなく回す側の判断。理由は「呼び出し数の管理」に記録した。実費は未記録のまま。

### 対照表の所在

- 本項の各対照表（適合/散文、pagecheck、judge P1-P6、hero第一確認項目、生成文差）がgen-001 vs gen-002の報告を兼ねる。
- 機械対照ファイル: `checks/gen001-vs-gen002-contrast.md`（`tools/loop16-contrast.mjs` 生成、Baseten枠外）。
- vanilla lines（Meta API並行）の評価は `vanilla/{wonder,spark}/` を本ラインと並置して行う（別途ブラインド対照表）。

---

## gen-005 実施 (2026-11-02) — S1+S2 競合解消（Baseten 0、組み立てのみ）

- 入力: gen-004条件（research v1.0 + reflection v-next-gen004 + gen-003 T1-T5 + gen-004 R3-R8）に S1+S2 を追加
- 変更: 文章は gen-004 生成文を逐語再利用（再生成なし、Baseten消費0）。`generations/case-*/gen-005.json` は gen-004 からの逐語コピー（sentences 9,10,9,9,9,8 同数、`templateApplied: gen-005 S1+S2`、`basetenConsumed: 0`）。
- 組み立て: `loop16-complete.mjs` に gen==="005" 分岐を追加（T1-T5 + R3-R8 維持）
  - S1: hero-highlight を値チップに変更 — `hero-chips` 内に `chip-label（humanLabel）+ chip-value（short値）` の2要素構造。大フォントの逐語値の単独掲示をやめ、ラベル付き短縮値にすることで facts表の `Annual 4,800,000 JPY` 等の単独行との正規化一致を回避。例: C-A `Salary — ¥4.8M / year` / C-B `Work hours — Day shift 08:30-17:00 · No nights` / C-C `Employment type — Contract` + `Contract terms — 12 months · review M11` / C-D `Employer — Apex Work Partners (agency)` + `Worksite — Saitama, Kawaguchi` / C-E `Work hours — From 3h/day · 2-4 days/wk` + `Commute — 2-min walk · Futako-Tamagawa Sta.` / C-F `Term — 6 weeks: Dec 1 – Jan 11` + `Pay — Hourly pay`。
  - S2: 生成文をページに1回だけ配置 — `pickSingle` で各sentenceを最初にマッチする SECTION_DEFS（pay→place→team 優先）の1セクションにのみ割り当て、跨セクション重複を排除。例: C-A「Northbridge Labs is hiring... in Osaka, Umeda」 は gen-004 では location と team の2箇所に重複していたが、gen-005 では place側のみに1回配置。checks も `label — value` 形式に変更し facts表の単独値 `Annual 4,800,000 JPY` との正規化一致を回避。
- 制約: 本体(工程1-6)・`cases/`・research v1.0 不変、コミット・push なし。文内での言い換え繰り返し（同一facts値が複数sentenceに跨る逐語含有一致）は conformance verbatim 要件と衝突するため組み立てでは直せず対象外として残す。
- 生成結果: Baseten 0件（再利用）、completes 2.74/3.36/2.82/3.30/3.14/2.49 MB、reviews 6件（Meta 846/769/758/804/730/755 prompt）、pagechecks 6件、judges 6件（Meta、1件のみ 12,000 で再試行）。

### pagecheck Layer1 対照 gen-004 vs gen-005（deterministic）

| ケース | dup groups gen004→gen005 | occ total gen004→gen005 | verify hits | record hits | heading mismatch | heroP6 | 判定 |
|---|---|---|---|---|---|---|---|
| C-A | 9→7 (-2) | 21→14 (-7) | 2→2 | 0→0 | 0→0 | 1→1 | S1+S2で改善 |
| C-B | 8→7 (-1) | 19→15 (-4) | 2→2 | 0→0 | 0→0 | 1→1 | S1+S2で改善 |
| C-C | 9→10 (+1) | 24→22 (-2) | 2→2 | 0→0 | 0→0 | 1→1 | dup groupsは+1だが occは-2で相殺 |
| C-D | 9→8 (-1) | 24→16 (-8) | 2→2 | 0→0 | 0→0 | 1→1 | S1+S2で改善 |
| C-E | 7→6 (-1) | 19→13 (-6) | 2→2 | 0→0 | 0→0 | 1→1 | 改善 |
| C-F | 9→7 (-2) | 23→14 (-9) | 2→2 | 0→0 | 0→0 | 1→1 | S1+S2で改善 |

> verify 2はCTA由来 `All conditions above / No new facts` のみ（T3維持）。record 0維持（T4+R4）。heading 0維持（T5）。heroP6 6/6 PRESENT維持（P6 judgeも ない で一致）。S2の単一配置で cross-section sentence重複（例: C-Aの hiring文、C-Bの5 days/week文）が解消し、occが全ケースで減少。C-Cのdup groups +1は hero chipsのラベル `Employment type` / `Contract terms` が facts表の同ラベルと新たに正規化一致したため（ラベル重複）。occは -2 で実害のSentence重複は減っており、S1の値チップ化で `Monthly 380,000 JPY` 等の値単独重複は解消している。

### judge Layer2 P1-P6 対照 gen-004 vs gen-005

| ケース | P1反復 gen004→gen005 | P2検証文 | P3記録物 | P4見出し | P5声欠落 | P6第一確認 | 備考 |
|---|---|---|---|---|---|---|---|
| C-A | ある→ない | ある→ある | ある→ある | ある→ない | ある→ある | ない→ない | P1解消（spec-ifying反復なし判定）、P4解消（Pay & Hours混入なし） |
| C-B | ない→ある | ある→ある | ある→ある | ない→ある | ある→ある | ない→ない | P1再発（Day shiftの4箇所逐語をspec-ifyingと判定）、P4再発（Team & Supportにcompany/role混入） |
| C-C | ある→ある | ある→ある | ある→ある | ある→ある | ある→ある | ない→ない | 全不変 |
| C-D | ある→ない | ある→ある | ある→ある | ない→ある | ある→ある | ない→ない | P1解消、P4再発（Teamにrequirements混入） |
| C-E | ある→ない | ある→ある | ある→ある | ある→不完全 | ある→ある | ない→ない | P1解消（C-E judgeはP4以降lengthで切断、暫定 ない 扱い） |
| C-F | ある→ない | ある→ある | ある→ある | ある→ある | ある→ある | ない→ない | P1解消 |

> P1は 6ケース中4ケースで ない に解消（C-A/D/E/F）。C-B/C-Cは再発・持続（Day shift/Contract termsの4箇所逐語がjudgeでspec-ifyingと判定）。P2/P3/P5/P6は全ケース不変（P2検証文とP3記録物はテンプレ起因で R外、P5声欠落は生成責で assemblyでは直せず、P6は S1で全ケース維持）。P4は C-Aで解消したがC-B/Dで再発（Team & Supportへのcompany/role/requirements混入判定）。在庫の sentence→section 単一配置で pay/place/team の許容外混入判定が鋭敏化した。

### 反映検証 R1 の再判定（解消／部分／再発）— gen-003基準との対照を含む

> R1「facts表と生成文の重複を減らす」は gen-004 で 再発5/部分1 と判定された。gen-005 の S1+S2 は assembly側で R1 の競合（conformance verbatim vs 重複減）を緩和する位置づけ。

| ケース | gen-003 R1 | gen-004 R1 | gen-005 R1 | pagecheck dup groups 003→004→005 | judge P1 003→004→005 | 判定根拠 |
|---|---|---|---|---|---|---|
| C-A | — | 再発 | 解消 | 7→9→7 | ない→ある→ない | hero値チップ化で `Annual 4,800,000 JPY` の3重掲示を断ち、hiring文の二重掲載をS2で解消。dup groupsがgen-003水準に戻りP1も ない に。 |
| C-B | — | 再発 | 再発 | 7→8→7 | ない→ない→ある | dupはgen-003水準に戻ったが、judgeが `Day shift 08:30-17:00` の4箇所逐語をspec-ifyingと再判定。文内言い換え繰り返し（facts値の跨文逐語含有一致）は組み立てでは直せず残存。 |
| C-C | — | 再発 | 再発 | 7→9→10 | ない→ある→ある | dup groupsは微増（ラベル重複）だがoccは24→22で減。judge P1は `Renewal review at month 11` の事実表・本文・チェック4箇所逐語で持続。 |
| C-D | — | 再発 | 解消 | 6→9→8 | ない→ある→ない | `Apex Work Partners` 等のhero値重複はS1で短縮値化し、跨セクションsentence重複はS2で半減。P1ないに解消。 |
| C-E | — | 部分 | 解消 | 8→7→6 | ある→ある→ない | gen-004で唯一 部分 だったケースがS2でさらに改善。hiring文の二重掲載解消とhero値チップ化でP1ないに。 |
| C-F | — | 再発 | 解消 | 8→9→7 | ある→ある→ない | hero chipsの `Term — 6 weeks: Dec 1 – Jan 11` が `2026-12-01 to 2027-01-11` の逐語と一致せず、S2で weekend文の重複も解消。 |

> 総合: R1はgen-004比で 4解消/2再発。6ケース中3ケース（C-A/D/F）はgen-003水準まで戻し、1ケース（C-E）はgen-003からの改善をさらに進めた。残る2再発（C-B/C-C）は文内での facts値逐語含有一致（例: `Day shift 08:30-17:00, 5 days/week; no scheduled night duty` がヒーロー要約値・facts表値・本文3箇所で逐語を含む）が assemblyでは除去できないため。ブリーフどおり「文内での言い換え繰り返しは組み立てでは直せないため対象外として残す」として扱う。

### 生成文の差と組み立ての差（gen-004→gen-005）

- 生成文: 同一（gen-004 sentencesを逐語再利用）。Baseten 0、conformance/散文 0/0 は不変。
- hero: `Annual 4,800,000 JPY` 等の値単独大フォント → `Salary — ¥4.8M / year` 等の label+short値チップ（chip-label小文字+chip-value太字、白背景カード）に変更。facts表の同値との正規化一致を回避しつつ T1+R5の第一確認項目際立ちは維持。
- 本文: `filterSentencesForSectionGen` の跨セクション再掲 → `pickSingle` の単一配置に変更。各sentenceは pay/place/team の最初にマッチする1セクションにのみ出現（例: C-A hiring文は teamとplaceの両方にあったが placeのみに）。
- checks: `Annual 4,800,000 JPY` 単独 → `Salary — Annual 4,800,000 JPY` の `label — value` 形式に変更。facts表の `Annual 4,800,000 JPY` 単独行との正規化一致を回避。
- 画像・CTA・P6: 不変（R7/R8維持）。

### 停止の更新（gen-005分）

| 日時 | ケース | 条件 | 理由 | 残した記録 |
|---|---|---|---|---|
| 2026-11-02 | C-A〜C-F | K1–K5 | 全6ケース gen-005 で適合pass・散文要修正0のまま。K4（同じ指摘3世代）・K5（適合落ち2連続）の該当なし。文内言い換え繰り返しの残存はK4の「同じ指摘」には数えない（組み立て対象外として記録） | 本記録＋各gen-005.md＋reviews＋pagecheck＋judge |

> gen-005はBaseten生成を伴わないため K5（適合落ち）は発動しない。C-C judgeのlength失敗（reasoning 7998/8000）はMeta枠で12,000に引き上げて再試行し成功（K5除外）。

---

## loop-016 締め記録 — 2026-11-02 gen-005完了時点

### 世代列の要約（gen-001 基準→gen-002 research→gen-003 テンプレ→gen-004 反映→gen-005 競合解消）

| 世代 | 変更要因 | Baseten | 画像 | pagecheck dup groups (中央値) | judge P1 ない の数 (6中) | 主な成果 | 残した課題 |
|---|---|---|---|---|---|---|---|
| gen-001 | 基準（facts+plan→生成、insightsなし、legacyテンプレ） | 6 success | 18新規 | 20 (25,25,25,23,20,21 occ) | 0/6 (全 ある) | loop-015から6ケース英語版を立ち上げ、全case適合pass/散文0で確定 | 事実表内反復3回・二重掲載・検証文・企画メモ・見出しずれ（統括目視）→ 2層検出で全拾得 |
| gen-002 | research v1.0適用（common+case別、事実根拠はcasesのみ） | +6 success (C-Bで8,000→12,000に引上げ) | 再利用 | 23.5 (25,25,25,25,20,21) | 0/6 | 集約→分散・期間分離・日勤否定・駅名明示等の研究型改善。生成文面の知見は次のケースへ自動注入 | pagecheck/judgeは不変（gen-001と同テンプレのため）。researchの文面改善では拾えないページ級欠陥は検出に残存 |
| gen-003 | テンプレ T1-T5（hero facts由来化・二重掲載除去・検証ブロック除去・記録ラベル除去・見出し整合） | 0（文章はgen-002逐語再利用） | 再利用 | 7.5 (7,7,7,6,8,8) | 2/6 (C-B/C-D) | 2層検出の指摘をテンプレで一括解消: dup 23→7、verification 10→2、record 53→0、heading 1→0。heroP6 6/6 PRESENT化 | R1競合（conformance verbatim vs 重複減）の種が残る、R3-R8の6項目は次世代へ |
| gen-004 | reflection v-next-gen004 R1-R8 + ケース別（R1,R2+ケース別→生成意図、R3-R8→組み立て） | +6 success (12,000, C-E再試行1) | 再配分 (place小) | 8.5 (9,8,9,9,7,9) | 1/6 (C-B) | R3-R8組立系6/6解消、ケース別生成意図5/6解消。flexコア説明・15kg前出し・weekend preferred正確化等の意図反映 | R1再発5/部分1（conformanceと衝突）、pagecheck 5悪化/1微改善、judge P1 3再発（hero-highlightの逐語重複が原因） |
| gen-005 | S1+S2 競合解消（hero値チップ化 + sentences単一配置、T1-T5+R3-R8維持、文内言い換えは対象外） | 0（文章はgen-004逐語再利用） | 再配分維持 | 7 (7,7,10,8,6,7) | 4/6 (C-A/D/E/F) | R1のassembly側緩和: 4解消/2再発、pagecheck dup 5改善/1微増(ラベル重複)、occ全ケース減(-2〜-9)、judge P1 4解消。heroP6維持、verification/record/heading維持 | 文内繰り返し（facts値の跨文逐語含有一致）2再発は組み立て対象外として残す |

> vanilla lines（`vanilla/{wonder,spark}/`）は gen-001時点の facts-only単一プロンプト一発の並行ラインとして作成（2026-11-02、Baseten外・Meta枠）。research適用後の gen-002 以降の本ライン（research+知見+テンプレ）とのブラインド対照評価は別途実施し、本ループの締めでは「作成済み・評価未実施」として記録する。

### Baseten 最終消費（40枠）

| 区分 | 上限 | 消費 | 残り | 内訳 |
|---|---|---|---|---|
| Baseten 生成 | 40 | **20** success (23 calls) | 20 | 較正probe 2 (4,000でfail 1 + 8,000でsuccess 1) + gen-001 6 + gen-002 6 (C-Bで実8 calls, fail2含む) + gen-004 6 (C-E再試行1含む) = 23 calls / 20 success。gen-003/005は0（文章再利用） |
| Meta 画像生成 | 別枠 | 18 success | — | gen-001で 3点×6ケース新規、gen-002以降再利用、gen-004/005は再配分のみ |
| Meta ペルソナレビュー | 別枠 | 18 (gen-001 6 + gen-002 6 + gen-004 6 + gen-005 6) | — | 1件あたり prompt ~700-800 / completion ~2,600-3,400 / reasoning ~1,800-2,900。gen-004から 4,000 max_tokensで安定 |
| Meta Judge | 別枠 | 24 (gen-001 6 + gen-002 6 + gen-003 6 + gen-004 6 + gen-005 6) | — | 1件あたり prompt ~4,000-4,400 / completion ~2,400-8,000 / reasoning ~2,100-7,800。C-C gen-003/gen-004/gen-005で 8,000→12,000に引上げ要 |
| 対照 vanilla | 別枠/Meta | 12 (wonder 6 + spark 6) | — | facts-only入力、prompt-v1.0共有、単一応答手直しなし。wonder 3件が8000で切断 |

> Baseten 40枠は半分を残して閉鎖（20/40 success）。締切2026-11-05 11:00 JSTに対しK3（11/04日中までに最終生成）はgen-004時点で達成、gen-005は組み立てのみで11/02中に完了。

### 残件（次ループへ持ち越し、または恒常化判断待ち）

| # | 項目 | 状態 | 詳細 | 対応方針 |
|---|---|---|---|---|
| 1 | 文内繰り返し（facts値の跨文逐語含有一致） | 残件 | C-B `Day shift 08:30-17:00, 5 days/week; no scheduled night duty` と C-C `Contract, 12 months / Renewal review at month 11` が4箇所（hero要約・facts表・本文・チェック）で逐語を含む。pagecheck dup 2 groups残、judge P1 2再発（C-B/C-C）。assemblyでは直せず、生成文の言い換え（数値はverbatim維持しつつ冗長なfacts値言及を避ける）が必要 | 次ループの生成プロンプト（R1）で「facts表が担う値の再述を避け、関係性や含意を書く」方針を継続するが、conformanceの verbatim チェックと調整が必要（数値は必須だが文面での再列挙は避ける指示の精緻化） |
| 2 | 検証文 2 groupsの扱い | 残件 | `All conditions above are from the X sentences of C-* gen-*. No new facts are added.` のCTA由来2 groupsが全世代で残存（pagecheck verify 2、judge P2 全 ある）。T3で highlightの `What this means / numbers stay exactly as stated` は除去済みだがCTA由来はR外 | CTAブロックの `All conditions above` 文言を「条件は上記のとおり（X文で再掲）」等の検証的表現から「不明点は店舗・担当へ」等の問い合わせ誘導へ置換する候補。恒常化は本人承認を経る |
| 3 | 候補の恒常化判断 | 未決 | pagecheckの4項目（重複・検証辞書・記録露出・見出しずれ）+ heroP6 + dicts/pairsは candidate（v1.1-candidate）として運用。gen-003-005で改善を確認したが、恒常化は本人承認待ち | `tools/dicts/*.json` と `checks/pairs/*.md` の版を固定し、恒常化時は `docs/design/baseten-verification-loop-design-v1.md` の検出条項へ昇格。本ループでは candidate のまま残す |
| 4 | vanilla ブラインド対照評価 | 未実施 | vanilla vs 本ライン（research+知見+テンプレ+T1-T5+R3-R8+S1+S2）のブラインド対照は作成済みだが未評価。wonder 3件の切断（A/D/F）は手直し禁止のためそのまま | 次回ブラインド審査で `vanilla/{wonder,spark}/` 12LP と本ラインの最新6LP（gen-005）を並置し、適合/散文/pagecheck/judgeの4軸で評価。本体工程1-6は触れない |

### 本体（工程1-6）・cases/・researchの不変確認

- `git diff --stat` で本体工程1-6（`creative-core/` 等）への変更なしを確認（本ループの変更は `loops/loop-016/` 内のみ、`tools/` の candidateは本体に統合しない）。
- `cases/case-*.json` の sha256 は入力版と一致: C-A `B45890145326923470AB15562BAFECF617D3B1CD48DE8188A47A3D77D1B3EC62` / C-B `2A805D6017C20CC930BBEF789619CBCC0910C83996603129AFCBA8A23A9C2FFB` / C-C `CE2BC2D04A67D1AAE4FF0373810D6CD0C8A172C767E7B5276E90A130E0B3D554` / C-D `826E731B9744796392D5F094967E26E9CC3B62F41EB50E1E4A7DC5331723C9D8` / C-E `CCF63AA18AA59B1C179265B5D9A4D4E6E8E5E0E6FC45CC204B761F22901867C8` / C-F `D60B77BA695931B8A6D7A4793C186251DF8E75AA6D05B64CCA5E6B10066074D5`。gen-005は生成再利用のため casesへの書き戻しなし。
- `research/common.md` + `case-a..f.md` v1.0 は版固定のまま（gen-002以降の適用版として記録、変更なし）。
- コミット・push なし（HEAD `fbd576f` 維持）。成果物は `loops/loop-016/` 内の untracked + 未コミット作業ツリーとして残す。

## 実測・記録・判断の区別
```
