# loop-015/016 自己監査報告 — 2026-11-02（Basetenライン用）

作成: 統括（Muse）が設計、制作ライン（OpenCode）が実施。Sparkサブエージェント5並列で機械照合。
前提: 着地バッチ完了、`git status` クリーン（`??` はHTML/webpローカル想定内）、`main` 最新 `1e11daf`。
禁止: 本体・`cases/`・`research/` 変更なし、コミット/pushなし、キー値出力なし。
監査方式: 判断でなく突合。証拠＝コマンド・件数・ハッシュ。所見ごとに判定（合格／修正／差し戻し）と重大度。
検証対象: `loops/loop-015`（35 tracked）、`loops/loop-016`（436 tracked）、`docs/`、`src/`。

---

## 監査設計（Wonder）

### 方法
| 領域 | 方法 | 証拠の形 |
|---|---|---|
| 1 着地完全性 | `run-record.md` 主張 vs `git ls-files` 件数・`Get-FileHash` sha256・`git status` html/webp追跡有無 | 件数表、ハッシュ一致表、コマンド出力 |
| 2 知見2版突合 | `insights-consolidation-by-line-20261102.md` I-1..I-8 vs `docs/loop-015-016-insights-summary-20261102.md` A-J(1..31) を1:1対応、数値は `run-record.md` を正本に再照合 | 差異列挙表（どちらが正しいか断定せず、根拠参照付き） |
| 3 本体無変更 | `git diff fbd576f..HEAD --stat --name-only -- src/` と `git ls-tree -r fbd576f -- src` vs `HEAD -- src` のblob SHA比較 | diff stat、src差分、既存15ファイルSHA同一性 |
| 4 秘密混入 | `git ls-files` 全文走査、ripgrep パターン `b10_`/`API_KEY`/`sk-`/`secret`/`token`/`password`/email/long-hex/`LLM_` | ヒット種別分類（値は転記せず file:line + 種別のみ） |
| 5 提出形棚卸し | `README.md` / `loops/*/README.md` / `docs/submission-text-v1.md` / `docs/loop-015-016-insights-summary-20261102.md` を開示項目チェックリストで棚卸し | 充足表（present/partial/missing）+ file:line |

### 判定基準
- **合格**: 証拠が主張と一致、残件なし
- **修正**: 数値・記述の軽微な不一致（ドキュメント修正で解消、再実行不要）
- **差し戻し**: 秘密漏洩・本体書換・不変性崩れなど即時是正が必要
- 重大度: `低`（表記）`中`（誤読を招く数値不一致）`高`（秘密・提出要件欠落）`致命`（不変性破壊）

---

## 領域1: 着地の完全性

### 判定: **修正** / 重大度: 中

### 要旨
- 世代数・ハッシュ・HTML/webp非追跡はいずれも合格。loop-016のレビュー/ジャッジ件数の主張が実測と不一致（文書バグ）。

### 証拠

#### 1-1 主張の抽出
- loop-015 `loops/loop-015/run-record.md:19-20` T-A `228e36eff39364b9a10b53dc40a51d3946ba3c51156b8eab87f9fc5f8687b6b3` / T-B `b4d54f84f4927da01984c0034bcc40b7d78a91a4ecb2d4fa86d60a88e68e4cfd`、L17 起点HEAD `fbd576f`
- loop-015 L70-81 世代10件（probe1+calib1+reserveJA2+EN6）、L90-98 complete 2本 + webp 8点
- loop-016 `loops/loop-016/run-record.md:20-25` C-A..F sha256 6件、L54-57 Baseten 40上限/20 success 23calls /レビュー18 /ジャッジ24、L77-84 C-A..F各done

#### 1-2 git ls-files 実測（コマンド）
```
git ls-files loops/loop-015                 -> 35 files
git ls-files loops/loop-015/generations    -> 20 (12 Topic-A +8 Topic-B, json10+md10)
git ls-files loops/loop-015/previews       -> 1  (previews/images/manifest.json のみ)
git ls-files loops/loop-016                 -> 436
git ls-files loops/loop-016/generations    -> 60  (10/case*6 =30json+30md)
git ls-files loops/loop-016/reviews         -> 31  (30+README)
git ls-files loops/loop-016/checks          -> 125 (60 pagecheck +60 judge +3 pairs +1 contrast +1 README)
git ls-files loops/loop-016/previews       -> 1   (manifest.jsonのみ)
git ls-files loops/loop-016/vanilla/spark  -> 6 meta.jsonのみ html 0
git ls-files loops/loop-016/vanilla/wonder -> 6 meta.jsonのみ html 0
git status --short | Select-String html/webp -> loop-015 16件、loop-016 68件（??、想定内）
git ls-files loops/loop-*/previews | Select-String html/webp -> 0
```

#### 1-3 主張 vs 実測 対照
| 区分 | 主張 | 実測(git) | 実測(disk) | 評価 |
|---|---|---|---|---|
| loop-015 generations | 10 json (run-record L70-81) | 10json+10md=20 | 20 | 一致 |
| loop-015 complete/minimal/images | complete2 / minimal6 / webp8 | 0 html/webp tracked | 2html 3.57/3.80MB +6html minimal +8webp | 一致（故意非追跡） |
| loop-016 generations | 30 (6case*5gen L339/L501/L642) | 60 (30json+30md) | 60 | 一致 |
| loop-016 reviews | 18 (L56: gen0016+0026+0046+0056) gen003欠落 | 30 (5/case) +README=31 | 31 | **不一致 -12件 過少主張** |
| loop-016 pagecheck | 30 (6*5) | 60ファイル=30件 | 60 | 一致 |
| loop-016 judge | 24 (L57 5群で24と記載) | 60ファイル=30件 6*5=30 | 60 | **不一致 算術誤り 24≠30** |
| previews HTML/webp追跡 | 0のはず | 0 | 1manifestのみ追跡 | 合格（決定遵守） |

#### 1-4 sha256不変性（Get-FileHash）
| ファイル | 主張 | 実測 | 一致 |
|---|---|---|---|
| `loops/loop-015/topics/topic-A.json` | `228E36EFF393...8687B6B3` run-record:19 | `228E36EFF39364B9A10B53DC40A51D3946BA3C51156B8EAB87F9FC5F8687B6B3` | PASS |
| `topics/topic-B.json` | `B4D54F84F492...68E4CFD` :20 | `B4D54F84F4927DA01984C0034BCC40B7D78A91A4ECB2D4FA86D60A88E68E4CF` | PASS |
| `loops/loop-016/cases/case-A.json` | `B458901453...B3EC62` :20 | `B45890145326923470AB15562BAFECF617D3B1CD48DE8188A47A3D77D1B3EC62` | PASS |
| `case-B.json` | `2A805D6017...A9C2FFB` | `2A805D6017C20CC930BBEF789619CBCC0910C83996603129AFCBA8A23A9C2FFB` | PASS |
| `case-C.json` | `CE2BC2D04A...0B3D554` | `CE2BC2D04A67D1AAE4FF0373810D6CD0C8A172C767E7B5276E90A130E0B3D554` | PASS |
| `case-D.json` | `826E731B97...1723C9D8` | `826E731B9744796392D5F094967E26E9CC3B62F41EB50E1E4A7DC5331723C9D8` | PASS |
| `case-E.json` | `CCF63AA18A...01867C8` | `CCF63AA18AA59B1C179265B5D9A4D4E6E8E5E0E6FC45CC204B761F22901867C8` | PASS |
| `case-F.json` | `D60B77BA69...66074D5` | `D60B77BA695931B8A6D7A4793C186251DF8E75AA6D05B64CCA5E6B10066074D5` | PASS |

### 所見一覧
| # | 所見 | 重大度 | 証拠 |
|---|---|---|---|
| 1-01 | loop-016 reviews主張 18件 vs 実測30件。不整合。gen-003レビュー（例 `reviews/case-A-gen-003-review.md:1`）が存在するがrun-record L56/L731の表で欠落 | 中 | `loops/loop-016/run-record.md:56` vs `git ls-files loops/loop-016/reviews count 31` |
| 1-02 | loop-016 judge主張 24件 vs 実測30件。6*5=30の算術誤り | 低 | `loops/loop-016/run-record.md:57` vs `git ls-files loops/loop-016/checks 125`内60judgeファイル |
| 1-03 | loop-015起点HEAD `fbd576f` vs 現在 `1e11daf`（8コミット進捗）。着地設計どおりの前進であり欠陥ではないが記録上の起点明示は必要 | 低 | `git log --oneline fbd576f..HEAD` 8件、`git log --oneline -1` 1e11daf |
| 1-04 | HTML/webp非追跡遵守: `git ls-files ...previews \| Select-String html/webp`=0、未追跡でローカル残存（loop-015 16件/loop-016 68件） | — | コマンド出力、上表 |
| 1-05 | Baseten消費主張 20/40 success 23callsは世代30件（うち003/005はbasetenConsumed 0）と整合 | — | `loops/loop-016/run-record.md:54` + `generations/case-*/gen-003,005.json:basetenConsumed 0` |

### 処置
- run-record L54-57, L731表を「30レビュー（5世代分）・30ジャッジ」に訂正。gen-003レビュー行を追加。ファイル削除不要。

---

## 領域2: 知見まとめ2版の突合

### 判定: **修正** / 重大度: 低～中

### 要旨
- 数値中枢（Baseten 20/40・23calls、reasoning/max_tokens推移、pagecheck/verify/record/heading/heroP6、R1競合解消、vanilla 0/18創作・Wonder 3/6切断）は両版一致。
- 差異は①時差（ライン執筆後にvanilla評価と陰性対照が追加）②章立て漏れ（I-4持続パターン/I-6画像規格が統括版で欠落）③運用知見の追加（D11キー401/D12言語混在/D13工程逸脱）④1件の表記乖離（gen-003 P1反転数）。

### 証拠（全文照合）
- ライン版 `loops/loop-016/insights-consolidation-by-line-20261102.md:1-302` I-1..I-8
- 統括版 `docs/loop-015-016-insights-summary-20261102.md:1-91` A-J 1..31
- 正本 `loops/loop-016/run-record.md:1-753`（世代表・pagecheck対照・R1表）

### 対応表
| I | 主題 | 統括対応 | 判定 | 詳細・根拠 |
|---|---|---|---|---|
| I-1 | 上限較正 temp0.4 | A1-3 | 一致+補足 | probe 4000 reasoning3997 null→8000成功 (prompt322/comp1715/reason1381→C-A 902/2717/3619/1381), C-B 8000 reasoning7997 No content2連→12000安定。run-record:39-42,59-63,175-178,498-500が両数値裏付け。ラインはloop-015日本語予備9文をCh1に配置、統括はA1-3に編入した配置差のみ。 |
| I-2 | 集約→分散・1文1事実・CTA分離 | E15 | 一致 | C-A 5→11/C-B 6→11等 run-record:501-511,524-537文数表と統括:50一致。ライン詳細「詰込消失・導入3以内」は統括で「集約→分散」に要約された抽象度差。 |
| I-3 | 雇用形態別パターン | C8-9 + D12 | 一致+追補 | 第一確認項目6種が両版完全一致 run-record:576-588。I-3のC-F CTA端日 `2026-12-01 to 2027-01-11` は統括C8と同値。統括C10「C-Fペルソナterm/pay先確認なのにhero呼びかけ」構造欠陥はラインI-3/5に無い統括追加知見。 |
| I-4 | 大文字・ラベル・filler持続 | —（統括ではF20/H26で断片のみ） | **欠落(統括)** | ライン:161 全6ケース再指摘一覧。run-record:193-200,501-510でAnnual/Monthly/Hourly/Pay is個別記録。統括は「値の意図的再掲」分類問題に触れるのみで系統的集約なし。矛盾でなく章立て漏れ。 |
| I-5 | 事実欠落が呼ぶ曖昧さ | H26 + C8 + G22 | 一致 | flex核心/有給m7/weekly review 3m等 ライン:168列挙と統括:70「フレックスコアタイム・引継ぎリーダー・更新審査基準・シフト固定可否・総額試算」同型。run-record:383-410 R2判定4解消2部分も一致。処方表現差のみ（ライン「注記/FAQ分離」vs 統括「質問工程領域」）。 |
| I-6 | 画像規格と文脈分離 | —（統括末尾1行のみ） | **欠落(統括)** | ライン:173 muse-image-1.0 18点 no text/numbers/logos パレット6種 place photo-sm R8。run-record:61,96,310-326,736と整合。統括:89で「ファイル確認のみ・スクショ範囲で混入指摘なし」1行に圧縮。 |
| I-7 | 研究型vsテンプレ型効き方 | B4-7 + E15 + F18 | 一致（定義差注意） | gen002→003 dup25→7 verify10→2 record53→0 heading1→0 hero6/6 ライン:77-82 vs 統括:55「20-25→6-8, 10→2, 51-54→0,1→0」母数取り方差だがrun-record:538-556で同一実測。 |
| I-8 | Reflection効きとR1競合 | H24-25 + I27 | 一致+1乖離 | R3-R8 6/6解消、R2概ね解消、R1 gen004再発5/部分1 dup微増→gen005 S1+S2で4解消2再発 dup8.5→7 occ全減 P1 1/6→4/6。run-record:352-410,652-692で裏付け。**乖離**: 統括:57「C-A/C-BのP1・P4反転」とするがライン:78はP1反転4件(C-A/B/C-C/C-D)・P6全6件反転で統括がC-C/C-DのP1反転を落としている。要再照合。 |

### 統括版にあってライン版に無い章（時差・追加知見）
| 統括章 | 内容 | 根拠 | 評価 |
|---|---|---|---|
| D11 キー取り違え401×6世代 | 運用事故 | run-recordに記述なし、ラインCh1管外 | 統括追加。Lineはloop-015 loop記録外として欠落。正誤判定不能。 |
| D12 言語混在で判断中途半端 | 事実英語化で断つ | run-record該当記述なし | 同上。統括追加 |
| D13 工程順逸脱 | イメージLP先行逸脱 | 同上 | 同上 |
| F19 陰性対照 | judge「ない」と言えた検証 | ライン:272執筆時点で未取得 | 時差由来。統括がgen-003完了後に追記。ライン「不在」としては正 |
| G21-23 本人メモ読取 | 指示文残存4/6・目立ち不足・繰り返し感 | ライン5章で突合手順のみ、メモ原文はR3-R8に吸収 | 統括追加。ラインは反映結果に集約したため |
| J29-31 vanillaブラインド評価 | 創作0/18・完結性W3/6切断・judgeある総数W14/36 S17/36 P24/36 P3起因・揺れ0.3でC-F P6反転 | run-record:447-489,723-745で「評価未実施」 | **時差由来の明白な差異**。ライン4章#3:263-266も「生成済・評価未実施」として残件化。統括:77「新セッションで実施(2026-11-02追加)」が後から実行された評価。数値切断3件一致は確認済み |

### 所見一覧
| # | 所見 | 重大度 | 証拠 |
|---|---|---|---|
| 2-01 | I-4持続パターンが統括版で章立て漏れ。F20/H26で断片言及のみ | 低 | ライン:161 vs 統括:58,70, run-record:193-200 |
| 2-02 | I-6画像規格が統括版で1行に圧縮 | 低 | ライン:173 vs 統括:89, run-record:61,96 |
| 2-03 | 統括D11-13運用事故がライン管外で欠落 | 低 | 統括:42-45 vs ライン:13-31, run-record該当なし |
| 2-04 | 統括G21-23メモ読取がラインでR3-R8に集約され原文評価が落ちている | 低 | 統括:60-64 vs ライン:89-90, run-record:382-398 |
| 2-05 | 時差: ライン「vanilla評価未実施」(run-record:723上は正) vs 統括J29-31「実施済」。同一内容の第2実行 | 中 | ライン:263-266 vs 統括:77-82, run-record:447-489 |
| 2-06 | 表記乖離: 統括F19「P1反転2件」vs ライン78「P1反転4件(C-C/C-D落とし)」 | 中 | 統括:57 vs ライン:78-82, run-record gen-003 judge詳細要再照合 |
| 2-07 | I-8/R1競合解釈は抽象度差のみで一致、F19 H24等の数値も両版一致（7.5→8.5等） | — | 統括:67-69 vs ライン:183-185, run-record:357-366,682-692 |

### 処置
- 2-06のP1反転数は `checks/case-*-gen-003-judge.json` で再照合してどちらかに寄せる。
- I-4/I-6は統括版への追記候補（台帳昇格時）。J29-31は時差解消済みとしてライン版への追記は不要（run-recordは別途更新済み）。

---

## 領域3: 本体の無変更

### 判定: **合格（条件付き）** / 重大度: 中（厳密解釈では要注記）

### 要旨
- 工程1-6の既存コード15ファイルはblob SHA完全一致で無変更。`src/`に4件の追加ファイルがあり`git diff --stat`は非空だが、追加のみで既存書換なし。追加はloop-012/013のtyped/persona生成器で本体ロジックに触れない。

### 証拠
```
git log fbd576f..HEAD --oneline  -> 8 commits: a11a34c, f5d79f8, b5d6305, 61d0a76, 6c2ffa4, 5222b16, 267989f, 1e11daf
git diff fbd576f..HEAD --stat     -> 513 files changed, 61088 insertions(+)
git diff fbd576f..HEAD -- src/ --stat:
 src/generate-persona.mjs      | 405 +++
 src/generate-persona.test.mjs | 143 +++
 src/generate-typed.mjs        | 327 +++
 src/generate-typed.test.mjs   | 125 +++
 4 files changed, 1000 insertions(+)

git diff fbd576f..HEAD -- src/approve.mjs src/generate.mjs src/verify.mjs src/extract-and-check.mjs src/facts/* src/fict-j01-v1.json -> (empty)
git ls-tree -r fbd576f -- src (15 files) vs git ls-tree -r HEAD -- src (19 files):
  approve.mjs 96e2a3... 同一
  generate.mjs 24d4d5... 同一
  verify.mjs 6e1b07... 同一
  extract-and-check.mjs 8c4a92... 同一
  FICT-J01-facts-v1.json 519afb... 同一
  ...他10ファイル同一、追加4件のみ差分
git diff --stat -- cases/ research/ tools/ -> (empty; fbd576f時点で非存在、追加はloops配下)
```

### 所見一覧
| # | 所見 | 重大度 | 証拠 |
|---|---|---|---|
| 3-01 | `src/`に4件追加（typed/persona各本体+test）。`git diff -- src/` は空でない。厳密な「0 diff」基準では不合格 | 中 | `git diff --stat -- src/` 4 files 1000 insertions+, commit 6c2ffa4 |
| 3-02 | 既存15ファイル（工程1-6: approve/generate/verify/extract-and-check/build-preview/run-demo/facts/fict-j01 等）はSHA同一で書換なし | — | `git ls-tree -r fbd576f vs HEAD` SHA一致、`git diff -- src/<core>` empty |
| 3-03 | 追加4件は `TYPED_PROMPT_VERSION lp-generate-v2-typed` / `PERSONA_PROMPT_VERSION lp-generate-v3-persona` でloop-012/013とcatalogにのみ接続、既存生成ロジックにパッチなし | — | `src/generate-typed.mjs:1` / `src/generate-persona.mjs:1`, `library/catalog-v1.json` |

### 処置
- 現行運用「既存15ファイル不変 + 追加はloop記録扱い、既存分への影響なし」を注記として採用すれば合格。`loops/loop-016/run-record.md:16`「本体工程1-6には触れず」と整合。厳密な空diffを求める監査ラインでは「条件付き合格」とする。

---

## 領域4: 秘密情報の混入チェック

### 判定: **合格** / 重大度: —（高リスク所見なし）

### 要旨
- 着地テキスト640 trackedファイル走査で実キー値・個人情報・実求人データの混入なし。全ヒットは環境変数名・コードガード・ハッシュ/ID・トークン使用量であり、b10_/LLM_の値らしいものは意図的に前置詞+省略+文字数注記へ丸められ再構築不能。

### 証拠（走査）
- 対象: `git ls-files` 640件（`loops/loop-015` 35件 / `loops/loop-016` 436件 / 他）。html/webpはuntrackedで対象外、`.gitignore:1-3` は `.env` を除外
- パターン:
  - P1 `b10_` repo-wide -> 7 hits (コードガード + redacted診断行)
  - P2 `BASETEN_API_KEY` -> 26 hits (全て `process.env.BASETEN_API_KEY` / `keySource: env:BASETEN_API_KEY` / `Set BASETEN_API_KEY` エラーメッセージ)
  - P3 `API_KEY` -> ~100 hits (同上 MODEL_API_KEY名 + 使用量)
  - P4 `sk-` -> 0
  - P5 `secret` -> 2 hits `AGENTS.md:13,27` ポリシー文のみ
  - P6 `token` -> ~100 hits (`prompt_tokens`/`completion_tokens` telemetry)
  - P7 `password` -> 1 hit `AGENTS.md:13` ポリシー文のみ
  - P8 email regex -> `loops/loop-015` 0 / `loops/loop-016` 0
  - P9 long-hex -> loop-015 13件 / loop-016 38件（全て sha256/ticketHash/chatcmpl- ID）
  - P10 `LLM_` -> 2 hits（同redacted行）

### 所見一覧
| # | 所見 | 重大度 | 証拠 |
|---|---|---|---|
| 4-01 | キー参照は環境変数名のみ。値は一切なし | — | `loops/loop-016/cache/connectivity-check.json:7` key reference (env var name), `loops/loop-015/tools/baseten-loop-en.mjs:25-26` prefix guard |
| 4-02 | b10_/LLM_の値らしい行は前置詞+省略+文字数注記へ丸められ再構築不能（意図的redaction） | — | `loops/loop-015/run-record.md:144,164` redacted diagnostic note |
| 4-03 | 長hexは integrity sha256 / ticketHash / chatcmpl-* IDのみ | — | loop-015 13件 / loop-016 38件 |
| 4-04 | PII/実データなし。全トピック/ケースは `架空のサ…` + 人工persona（例 `cases/case-A.json:1-7` Northbridge Labs / Alex 26, note Fictitious）、地区レベルの擬似住所のみ | — | `loops/loop-015/topics/topic-A.json:1`、`cases/case-A.json:1-7`, email regex 0 |
| 4-05 | 接続ログは usage 162 tokens と reasoning_contentのみ | — | `loops/loop-015/connectivity-check.json:7-23` / `loops/loop-016/cache/connectivity-check.json:7-23` |

### 処置
- なし。現行ポリシー `AGENTS.md:13` 準拠。

---

## 領域5: 提出物の形の棚卸し

### 判定: **修正** / 重大度: 中（提出直前の文書整備で解消可能）

### 要旨
- コア提出物（L1統合デモ + L2検証デモ、5種 51/42/23/11/12 pass、リンク、監査r1/r2）は提出可能だが、開示3項目がREADME/提出文の入口で欠落し、審査員が `docs/decisions/` まで潜らないと気づけない分断がある。

### 証拠（全文照合）
- `README.md:1-78` / `loops/loop-015/README.md:1-40` / `loops/loop-016/README.md:1-100` / `docs/submission-text-v1.md:1-25` / `docs/loop-015-016-insights-summary-20261102.md:1-91`
- 決定文書: `docs/decisions/D1-submission-positioning.md:28` / `D2-track.md:9` / `D4-model-assignment.md:11-13` / `D5-budget.md:26` / `D6-repository.md:9` / `D10-design-and-expansion-policy.md:14` / `docs/design/context-pack-v1.md:17,20` / `docs/design/baseten-verification-loop-design-v1.md:6,51` / `docs/design/baseten-verification-loop-implementation-brief.md:13,71` / `docs/model-selection.md:12` / `loops/loop-015/run-record.md:15-24` / `loops/loop-016/run-record.md:15-28`

#### 5-1 現行充足
| 項目 | 状態 | 証拠 |
|---|---|---|
| 位置づけ Solo Indie D2 統合デモL1→L2 | present | `README.md:9` + `D1:10,28` `D2:9` |
| ライブデモリンク | present | `README.md:15-16` pages + github / `submission-text-v1.md:23-24` |
| 仕組み5段階・矛盾時停止・未記載扱い・再検証 | present | `README.md:19-28` |
| プロセス改善リンク | present | `README.md:33-37` |
| 証拠索引 loops/learnings/decisions/audits | present | `README.md:42-48` + `loops/INDEX.md:5-22`（15/16は「記録対象外としローカルに残す」と明記） |
| 実行手順・オフライン5種合格 | present | `README.md:52-68` MODEL_API_KEY非書込 + `node src/run-demo.mjs` + 51/42/23/11/12 |
| MIT | present | `README.md:76-78` |
| 監査r1/r2 | present | `README.md:47-48` |

#### 5-2 開示項目（充足/不足）
| 開示項目 | 状態 | 証拠 |
|---|---|---|
| **既存 vs 期間内** 定義「準備資料は既存、デモは期間内新規のみ・移植禁止」 | present(分散) | `D1:28` `context-pack:17,20` `D10:14` `D6:9` 履歴継承 |
| 上記がREADME/提出文の入口に露出 | **missing** | `README.md` grep 既存\|期間 0 hits, `submission-text-v1.md` 該当段落なし |
| **モデル明記** Muse Spark 1.3 Contrib + Wonder 1.0 | present | `README.md:74` + `D4:11-13` + `model-selection.md:12` |
| **Baseten** `meta-models/muse-spark-open-1026` + temp0.4/max4000 + 20/40 23calls + 8000→12000 lift | present(loops) / **missing(README)** | `loop-015/README:6` `loop-016/README:4,47` `run-record 37-40` presentだが `README.md` grep Baseten 0 |
| **画像** `muse-image-1.0` + 400,405/34,650 18点 + no text/numbers/logos | present(loops) / **missing(README)** | `loop-016/README:59` `loop-015/run-record:88-93` presentだが `README.md` grep 0 |
| **vanilla対照** temp0.7/8000 Wonder 3/6切断 Spark 6/6完結 | present(loop-016) | `loop-016/README:96` `run-record:447-488` 48,574 vs 22,043 tokens; `insights-summary:29-31` 創作0/18 |
| コスト算出値vs請求・Baseten未記録 | present | `README.md:74` `D5:26` `run-record:9` |
| **認証なし検証** オフラインfixture + sha256固定(topics/cases 8件) + 決定的pagecheck Layer1 | present(分散) / **partial(入口文書化)** | `README.md:60-68` fixture + `run-record:15-24` sha256 presentだが READMEに「hash照合・pagecheck実行手順」の審査員向けパスなし |
| **Baseten実験開示** 分離・実験記録位置づけ・回数ガード・未記録正直記載・提出文で明記予定 | present(loops/design) / **missing(README/submission-text)** | `loop-015/README:7` `loop-016/README:7` `design-v1:51` presentだが `README.md` `submission-text-v1.md` grep 0 |
| 提出文雛形 | **partial** | `submission-text-v1.md:5-7` To be decided, `:25` To be added, `:3` 項目名推測。リンクは揃うが提出可でない |

### 所見一覧
| # | 所見 | 重大度 | 証拠 |
|---|---|---|---|
| 5-01 | READMEに既存/期間内外境界の1文がない。定義はD1:28/context-pack:17等にあるが入口で不可視 | 中 | `README.md` 0 hits vs `D1-submission-positioning.md:28` |
| 5-02 | READMEにBaseten/画像/vanilla列挙がない。README:74は2モデルだけ。3実験はloopsの「分離・明記」約束がREADMEで未履行 | 中 | `README.md` grep Baseten/muse-image 0 vs `loop-016/README:4,59` |
| 5-03 | `docs/loop-015-016-insights-summary-20261102.md` に正規モデルID文字列なし（Baseten略称のみ） | 低 | grep `muse-spark-open-1026\|muse-image-1.0` 0 in summary vs `run-record:7` |
| 5-04 | 認証なし検証パスが文書化されていない（hash固定8件とpagecheck Layer1はあるが審査員導線なし） | 中 | `README.md:60-68` + `run-record:15-24` vs 入口ドキュメント欠落 |
| 5-05 | submission-text-v1.md は項目名推測・TBD残りで提出可でない。Baseten言及なし | 中 | `docs/submission-text-v1.md:3,5-7,25` |
| 5-06 | vanilla対照の知見は台帳昇格前「候補」に留める運用が徹底しており過主張なし | — | `insights-summary:8` 全て候補、`README:74` 算出値注記 |

### 処置（本監査では実施せず、棚卸しまで）
- README §1/§7/§8 に「既存/期間内1段落」「全モデル5件列挙」「hash+pagecheck認証なし検証パス1段落」「Baseten実験の分離note」を追記。
- insights-summaryに正規ID1行を追記。
- submission-textの日付・動画・Baseten1行を埋めて提出可にする。
- いずれも本報告の修正タスクとして別途PRで実施。

---

## 総括

| 領域 | 判定 | 重大度 | 1行 |
|---|---|---|---|
| 1 着地完全性 | 修正 | 中 | 世代・ハッシュ・非追跡は合格。レビュー18≠30・ジャッジ24≠30の文書誤りを訂正 |
| 2 知見2版突合 | 修正 | 低～中 | 数値中枢一致。I-4/I-6欠落と時差(J vanilla)・P1反転1件乖離を整備 |
| 3 本体無変更 | 合格(条件付) | 中 | 既存15ファイルSHA一致。src4追加はloop-012/013の拡張で既存書換なしと注記すれば合格 |
| 4 秘密混入 | 合格 | — | 実キー・PII・実データ混入なし。redactionは再構築不能 |
| 5 提出形 | 修正 | 中 | コア提出可。README/提出文の入口で既存/期間・全モデル・Baseten実験・検証パスが不可視。追記で解消 |

**差し戻し: 0件**。**修正: 4件（1,2,3注記,5）、合格: 1件（4）**。

直ちに対応すべき秘密・本体書換・提出不能はない。修正は文書整備に留まり、再生成・再実験は不要。

---

## 監査証跡（再現コマンド）

```powershell
git status --short
git log --oneline -1; git log --oneline fbd576f..HEAD
git ls-files loops/loop-015 | Measure-Object
git ls-files loops/loop-016 | Measure-Object
git ls-files loops/loop-016/generations | Measure-Object; git ls-files loops/loop-016/reviews | Measure-Object; git ls-files loops/loop-016/checks | Measure-Object
git ls-files loops/loop-015/previews; git ls-files loops/loop-016/previews; git ls-files loops/loop-016/vanilla/spark; git ls-files loops/loop-016/vanilla/wonder
Get-FileHash loops/loop-015/topics/topic-A.json -Algorithm SHA256
Get-FileHash loops/loop-016/cases/case-*.json -Algorithm SHA256
git diff fbd576f..HEAD --stat; git diff fbd576f..HEAD -- src/ --stat; git diff fbd576f..HEAD -- src/approve.mjs src/generate.mjs src/verify.mjs
git ls-tree -r fbd576f -- src; git ls-tree -r HEAD -- src
Select-String -Pattern b10_ -Path (git ls-files)
Select-String -Pattern API_KEY -Path (git ls-files)
```

---

*本報告は自己監査である。監査ラインが別途レビューし、統括がGit上でスポットチェックする。*
