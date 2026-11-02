# loop-016 vanilla ブラインド対照評価 総括 — 2026-11-02

- **位置づけ**: loop-016 残件消化。評価のみで生成はしない。Baseten 消費 0（judge・レビューは Meta API 別枠）。本体（工程1–6）・`cases/`・`research`・生成物そのものには手を入れず、匿名コピーは評価用別フォルダで作成。キー値は出力しない。コミット・push はしない。
- **決定**: 本人 2026-11-02「2を先にやる」「新セッションで」。統括（Muse）が本ブリーフ起草、実施は新セッションでブラインド保持と文脈分離。
- **当初計画からの変更**: パイプライン対照を gen-002 から **gen-005 最終形** に変更した理由 — パイプライン側は最終形で比べるのが正しいため。本変更は評価記録に明記する（下記「対照の選び方」参照）。
- **成果物置き場**: `loops/loop-016/vanilla/evaluation/`（本ファイル総括 + `checks/` 生結果 + `anon/` 匿名コピーと対応表）
- **実行完了**: 2026-11-02 12:16 JST。judge 18件 + blind review 18件 + sealed/opened mapping + deterministic 3軸の全 5軸を一括報告。

## 対照の選び方と条件差（解釈で差し引く）

| 項目 | vanilla | パイプライン gen-005 |
|---|---|---|
| モデル | Wonder `muse-wonder-1.0` / Spark `muse-spark-1.3`（Meta API）| `meta-models/muse-spark-open-1026`（Baseten） |
| temperature | **0.7**（vanilla 固定） | **0.4**（パイプライン正式値 max_tokens 8,000、実測で 12,000 に引き上げた世代あり） |
| 提供形態 | vanilla Spark は Meta API の `muse-spark-1.3` | パイプライン Spark Open は Baseten 提供 — 同 Spark 系だが提供形態が違う |
| 工程 | 単一プロンプト単一応答・手直しなし（`vanilla/prompt-v1.0.md` v1.0 + `vanilla/inputs/case-*.md` facts-only v1.0 を `{{TICKET}}` に機械差込。plan/research/insights は渡さない） | 複数工程（企画→research v1.0→生成→完成LP組付け→ペルソナレビュー→知見蓄積→反映メモ v-next）。gen-005 は research+反映メモ+R3–R8 組立まで到達した最終形 |
| 画像 | gen-001 の当該ケース3点（hero/work/place.webp）を両モデル共通で並置コピー（新規生成なし、同一画像） | `previews/images/` の 18点（Meta `muse-image-1.0`）を gen-005 で再配分。place 画像を縮小し work 画像を conditions 横に固定 |
| 比較の意味 | 「工程の有無の差」を見る対照であり、モデルの優劣の単純比較ではない | 同上 |
| 対照として選んだ世代 | — | **gen-005 complete**（`previews/case-*-gen-005-complete.html` 6件）。当初計画 gen-002 ではなく最終形で比べることで、工程の積み重ねがページ欠陥（重複・検証文・記録露出・見出しずれ・P6）にどう効いたかを正しく評価できる |

> 温度・提供形態・工程数の差は本記録で明記し、解釈で差し引く。単純な勝敗に還元しない。

## 対象（18件）

| 区分 | ファイル | 事実根拠 |
|---|---|---|
| vanilla Wonder 6件 | `vanilla/wonder/case-{a..f}.html`（`prompt-v1.0.md` v1.0 + facts-only v1.0、単一応答手直しなし） | `cases/case-{A..F}.json` L01–L10（sha256 固定） |
| vanilla Spark 6件 | `vanilla/spark/case-{a..f}.html`（同上、モデル違いのみ） | 同上 |
| pipeline gen-005 6件 | `previews/case-{A..F}-gen-005-complete.html`（最終形。gen-001→gen-005 の research/反映メモ/R3–R8 を積んだ姿） | 同上 + `research/common.md` v1.0 + `research/case-a..f.md` v1.0 + `reflection-memos/2026-11-02-reflection-v-next-gen004.md` v-next-gen004 |

---

## 軸0: 完結性（独立軸）— 文書が末尾まで到達しているか

> 切断は文章品質の悪さと混ぜて数えない。独立軸として扱う。

| ケース | vanilla Wonder | 結果 | vanilla Spark | 結果 | pipeline gen-005 | 結果 |
|---|---|---|---|---|---|---|
| **C-A** | `case-a.html` 17,962 bytes / 17,856?（`</html>`なし、`</body>`なし）| **未完結（truncated）** — max_tokens 8,000 到達（completion 8,000 / reasoning 2,402）で切断。末尾は `<script>` 内 `const peopleEl…` で途切れ、footer/script/html 閉じなし。手直し禁止のためそのまま評価対象 | `case-a.html` 3,835 bytes（`</html>`あり） | **完結**（completion 2,825 / reasoning 1,601） | `case-A-gen-005-complete.html` 2,749,225 bytes（`</html>`あり） | **完結** |
| **C-B** | `case-b.html` 16,625 bytes（`</html>`あり） | **完結**（completion 6,667 / reasoning 1,619） | `case-b.html` 7,175 bytes（`</html>`あり） | **完結**（completion 3,454） | `case-B-gen-005-complete.html` 3,363,635 bytes | **完結** |
| **C-C** | `case-c.html` 15,765 bytes（`</html>`あり） | **完結**（completion 7,419） | `case-c.html` 3,120 bytes（`</html>`あり） | **完結**（completion 2,742） | `case-C-gen-005-complete.html` 2,822,415 bytes | **完結** |
| **C-D** | `case-d.html` 18,757 bytes（`</html>`なし、`</body>`なし） | **未完結（truncated）** — max_tokens 8,000 到達（completion 8,000 / reasoning 2,277）で切断。末尾は footer 直前で途切れ、手直しなし | `case-d.html` 6,078 bytes（`</html>`あり） | **完結**（completion 3,147） | `case-D-gen-005-complete.html` 3,303,387 bytes | **完結** |
| **C-E** | `case-e.html` 16,805 bytes（`</html>`あり） | **完結**（completion 7,520） | `case-e.html` 6,355 bytes（`</html>`あり） | **完結**（completion 4,212） | `case-E-gen-005-complete.html` 3,139,364 bytes | **完結** |
| **C-F** | `case-f.html` 18,103 bytes（`</html>`なし、`</body>`なし） | **未完結（truncated）** — max_tokens 8,000 到達（completion 8,000 / reasoning 2,264）で切断。末尾は footer 直前で途切れ | `case-f.html` 5,801 bytes（`</html>`あり） | **完結**（completion 3,695） | `case-F-gen-005-complete.html` 2,489,011 bytes | **完結** |

**集計**: vanilla Wonder 3/6 が max_tokens 8,000 で切断（C-A/C-D/C-F）。vanilla Spark 6/6 完結。pipeline gen-005 6/6 完結（Baseten 側は max_tokens 12,000 で運用、reasoning 約 4,000–9,000 を許容）。Wonder の切断は **温度 0.7 + 長い HTML/スクリプト出力** によるものと推定され、品質ではなく完結性の独立した事象として扱う。以後の軸（事実照合・pagecheck・judge・レビュー）は切断された文書も「あるがまま」で評価する（追補・再生成しない）。

> 生結果: `vanilla/evaluation/checks/completeness-20261102.json`

---

## 軸1: 事実創作の照合（cases の固定 facts L01–L10 に対して）

> 各 LP に書かれた数値・条件を cases の固定 facts と照合し、facts に無い数値・条件・制度の出現を数える（ケース別・モデル別）。数値の verbatim 照合と制度キーワード辞書による二段階で検出し、条件分は目視確認を併用する。

### 検出方法

- **数値**: JPY 額（`Annual 4,800,000 JPY` / `Hourly 1,400 JPY` / `Monthly 380,000 JPY` 等）、日付（`2026-12-01` 等）、時刻（`10:00` 等）の文字列が facts のいずれかの value に含まれるかを照合。含まなければ「創作」として数える。
- **条件・制度**: 辞書（bonus, overtime, stock option, retirement, remote work, free lunch, gym, unlimited PTO, direct-hire 等）が LP 可視テキストに現れ、かつ facts のいずれの value にも含まれない場合に「創作候補」として数える（health insurance は全ケースで facts に含むため除外）。

### 結果（ケース別・モデル別）

| ケース | facts（L01–L10） | vanilla Wonder | vanilla Spark | pipeline gen-005 | 所見 |
|---|---|---|---|---|---|
| **C-A** SaaS SWE | Annual 4,800,000 JPY / Mon-Fri 10:00-18:30 flex core 11:00-16:00 / 5-min walk Umeda / 3-month onboarding / 8-person team / Health insurance 10 days month7 / laptop | **0** — 数値・制度とも創作なし。¥4,800,000 / 10:00-18:30 / 11:00-16:00 / 5-min walk 等は facts verbatim を維持。bonus/overtime/remote 等の制度創作もなし | **0** — 同上。Spark 版はより簡潔な DL 表記だが数値は Annual 4,800,000 JPY を正確に維持 | **0** — pipeline も 0。facts テーブル + 生成文の両方で数値は verbatim 維持。制度創作なし |
| **C-B** Healthcare RN | Annual 5,200,000 JPY / Day shift 08:30-17:00 / 5 days/week no night duty / 8-min Sakuragicho / Two paid training days + quarterly workshop / 12-nurse ward / Health insurance 12 days month7 / childcare desk | **0** —創作なし | **0** | **0** |
| **C-C** Contract Brand | Everfield & Co. / Contract 12 months / Monthly 380,000 JPY / Mon-Fri 10:00-19:00 avg 2 days remote/week / 15,000 JPY/month / Renewal month11 no auto conversion / 6-person brand team / 10 paid days month4 / ownership 2 launches | **0** | **1** — `2026-11-02`（footer の `Status: vanilla input v1.0 — facts-only` 付随の日付）。job 条件としての創作ではない。給与・時間・制度の創作は **0** | **0** |
| **C-D** Dispatched Logistics | Apex Work Partners / Saitama Kawaguchi / Hourly 1,400 JPY / Mon-Fri 09:00-17:30 3-5 days selectable / Shuttle Kawaguchi / coordinator twice/week / 10-person buddy week1 / No forklift able to stand/lift 15kg | **0** | **0** | **0** |
| **C-E** Part-time Cafe | Morningside Coffee / Part-time / Hourly 1,250 JPY / From 3h/day 2-4 days 08:00-11:00 or 11:00-14:00 / 2-min Futako-Tamagawa / 3-day buddy onboarding / 6-person shift board / Staff drink free | **0** | **0** | **0** |
| **C-F** Casual Retail | Crestline Outdoor / Casual seasonal / Hourly 1,300 JPY / 6 weeks 2026-12-01 to 2027-01-11 / 3-5 days 4-7h weekends preferred / 8,000 JPY/month / 1-day orientation floor buddy week1 / Staff discount 20% uniform | **0** | **0** | **0** |

**集計**: 18件中 17件が **0**、1件（C-C Spark）のみ footer 日付 1件を数値検出で拾ったが job 条件の創作ではない（下記「記録」参照）。vanilla 12件も pipeline 6件も、いずれも **facts に無い給与・日数・制度の創作は検出されなかった**。vanilla の単一プロンプトでも `{{TICKET}}` の facts-only 入力に忠実に、パイプラインの多工程でも verbatim 制約が効いていることを示す。温度差（0.7 vs 0.4）や提供形態差は事実創作の量には現れなかった。

> 生結果: `vanilla/evaluation/checks/fact-check-20261102.json`（各 LP の inventions 配列に文脈つきで記録。目視確認欄あり）

**記録上の但し書き**: vanilla Spark C-C の `2026-11-02` は `vanilla/inputs/case-c.md` ヘッダの「date: 2026-11-02」が footer に転写されたもので、job 事実の創作ではない（job の term は `2026-12-01 to 2027-01-11` を正しく維持）。本集計では数値検出の機械カウントとして記録し、job 条件創作としては **0** とみなす。

---

## 軸2: pagecheck（第1層・決定的）— 同じ辞書で 18件に適用、構造差は「適用外」として記録

> vanilla の HTML 構造が違うため（`<section id>` / 〔〕引用 / `Target audience` 等の内部ラベルを持たない）、適用できないチェック項目があれば「適用外」と記録する（無理に合わせない）。辞書は `tools/dicts/` の candidate（verification-phrases / record-labels / heading-scope / HERO_P6_CONFIG）を全件で同一に用いる。本体・cases・research・生成物には手を入れない。

### サマリ

| 対象 | ケース | 重複グループ (≥2) | 重複出現計 | 検証ヒット (phrase groups) | 検証ヒット総数 | 記録露出グループ | 記録露出総数 | 見出しずれ | Hero P6 present | 適用備考 |
|---|---|---|---|---|---|---|---|---|---|---|
| **vanilla Wonder** | C-A | 5 | 10 | 0 | 0 | 0 | 0 | 0 | 1 (¥4.8M present) | sections=1 body fallback。heading check は 〔〕引用がないため適用外（0 は正常） |
|  | C-B | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 同上 |
|  | C-C | 3 | 6 | 0 | 0 | 0 | 0 | 0 | 1 |  |
|  | C-D | 5 | 10 | 0 | 0 | 0 | 0 | 0 | 1 |  |
|  | C-E | 5 | 10 | 0 | 0 | 0 | 0 | 0 | 1 |  |
|  | C-F | 2 | 4 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| **vanilla Spark** | C-A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | sections=1 body fallback。重複 0 は DL 表記の簡潔さによる |
|  | C-B | 11 | 22 | 0 | 0 | 0 | 0 | 0 | 1 | Spark B は DL 行の反復で重複 11 と多め（後述） |
|  | C-C | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |  |
|  | C-D | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |  |
|  | C-E | 2 | 4 | 0 | 0 | 0 | 0 | 0 | 1 |  |
|  | C-F | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| **pipeline gen-005** | C-A | 7 | 14 | 2 | 2 | 0 | 0 | 0 | 1 | 重複 7 は facts テーブル値と hero-highlight の同一文字列。検証 2 は `All conditions above / No new facts`（CTA 由来、T3 で highlight 除去済みの残り） |
|  | C-B | 7 | 14 | 2 | 2 | 0 | 0 | 0 | 1 | 同上 |
|  | C-C | 10 | 20 | 2 | 2 | 0 | 0 | 0 | 1 | 同上 |
|  | C-D | 8 | 16 | 2 | 2 | 0 | 0 | 0 | 1 |  |
|  | C-E | 6 | 12 | 2 | 2 | 0 | 0 | 0 | 1 |  |
|  | C-F | 7 | 14 | 2 | 2 | 0 | 0 | 0 | 1 |  |

**読み解き**:

- **vanilla は「決定的欠陥」が少ないが、理由は構造の違い**: vanilla は pipeline のような「facts テーブル + 生成文 + 検証用 highlight + 内部ラベル」という多層構造を持たないため、**検証文・記録露出・見出しずれ** はそもそも適用外（0 が正常）。これは vanilla が優れているのではなく、**検出対象の構造を持たない** ためである。適用外は無理に合わせず記録する（上表「適用備考」）。
- **重複**: vanilla Wonder は 1–5 グループ（hero とカードの同一値の反復）、vanilla Spark は 0–11 グループ（C-B Spark の 11 は DL 行「Registered Nurse」や「Harborview General Hospital」の反復）。pipeline gen-005 は 6–10 グループで、facts テーブル値と hero-highlight / 生成文の同一文字列が主因（R5 の hero 第一確認項目の強調が重複を生む構造。gen-004 分析で R1 と verbatim 制約の衝突として記録済み）。
- **検証文**: vanilla 18件中 0。pipeline 6件は 2 ずつ残存（`All conditions above / No new facts` の CTA 由来。gen-003 T3 で highlight 検証文は除去済み、R 外のテンプレ起因）。
- **記録露出**: 全 18件 0。pipeline は gen-001 で 11 グループ 43–53 ヒットあったが、gen-003 T4+R4 で `Target audience`/`factKeys`/〔〕等の内部ラベルを facts テーブルの `humanLabel` 化で除去し、gen-005 でも 0 を維持。vanilla は元々内部ラベルを持たないため 0。
- **見出しずれ**: 全 18件 0。pipeline は gen-001 で 1 あったが gen-003 T5 で `conditions`→`Pay & Hours` 等の allowedKeys 見直しで解消し、gen-005 でも 0。vanilla は 〔〕引用がないため検出枠自体が適用外（0 は正常）。
- **Hero P6**: 全 18件 **1（PRESENT）**。vanilla も pipeline もヒーローに第一確認項目（Annual / Day shift / Contract 12 months / Apex+Saitama / From 3h+Futako / 6 weeks）が含まれる。vanilla は単一プロンプトでも事実をヒーローに置く傾向があり、pipeline の R5（hero-highlight）による視覚的強調は pagecheck 上は同じ PRESENT だが、視覚的な大小は pagecheck では捉えられない（judge P4 や persona レビューで拾う）。

> 生結果: `vanilla/evaluation/checks/case-*-vanilla-*-pagecheck.{json,md}` 12件 + `case-*-gen-005-pagecheck.{json,md}` 6件（同一辞書、出力先は `checks/`）。適用外の項目は各 JSON の `applicability` に記録。

---

## 軸3: judge（第2層、P1〜P6）— 同じ judge・同じ対照ペアで全 18件。候補ステータスのまま

> 手法: fresh セッションに、対比ペア（`checks/pairs/` 3件: trial2-note / loop012-loop013 / cA-folded）と対象ページ可視テキスト 9,000字 truncation を渡し、欠陥カタログ P1–P6 ごとに ある/ない と根拠引用を返させる。モデル `muse-spark-1.3-contributor` / temperature 0.3 / max_tokens 12,000 / タイムアウト 65s + 3回リトライ。Baseten 枠に含めない。候補カタログのため恒常化は本人承認を経る。全件 `vanilla/evaluation/tools/eval-phase-34-resume.mjs` で実行（`eval-phase-34.mjs` → タイムアウト発生 → resume で再開）。

### 対比ペア（全件共通）

| ファイル | 内容 | 対比する欠陥 |
|---|---|---|
| `checks/pairs/pair-01-trial2-note.md` | 試作2 注記 修正前/後（P2/P3 対比、JA） | P2 検証文残存 / P3 企画メモ露出 |
| `checks/pairs/pair-02-loop012-loop013.md` | loop-012 typed-generation.json vs loop-013 persona-generation.json（P1 対比、JA） | P1 反復による仕様書化 |
| `checks/pairs/pair-03-cA-folded.md` | C-A 現行LP vs 畳んだ版（P1 二重掲載/P3/P4 対比、EN） | P1 二重掲載 / P3 / P4 見出しずれ |

### 結果（18件×6項目）— 確定

| 対象 | ケース | P1 反復仕様書化 | P2 検証文混入 | P3 記録物露出 | P4 見出しずれ | P5 声欠落 | P6 ヒーロー欠落 | ある数 |
|---|---|---|---|---|---|---|---|---|
| **vanilla Wonder** | C-A | ない | **ある** | ない | ない | ない | ない | 1 |
|  | C-B | ない | **ある** | ない | ない | ない | ない | 1 |
|  | C-C | **ある** | **ある** | ない | **ある** | **ある** | ない | 4 |
|  | C-D | **ある** | **ある** | ない | **ある** | **ある** | ない | 4 |
|  | C-E | ない | **ある** | ない | **ある** | ない | ない | 2 |
|  | C-F | ない | **ある** | ない | **ある** | ない | ない | 2 |
| **vanilla Spark** | C-A | **ある** | **ある** | ない | ない | **ある** | ない | 3 |
|  | C-B | **ある** | **ある** | ない | **ある** | **ある** | ない | 4 |
|  | C-C | ない | **ある** | **ある** | ない | **ある** | ない | 3 |
|  | C-D | ない | **ある** | ない | ない | **ある** | ない | 2 |
|  | C-E | ない | **ある** | ない | **ある** | **ある** | ない | 3 |
|  | C-F | ない | **ある** | ない | ない | **ある** | ない | 2 |
| **pipeline gen-005** | C-A | ない | **ある** | **ある** | ない | **ある** | ない | 3 |
|  | C-B | ない | **ある** | **ある** | ない | **ある** | ない | 3 |
|  | C-C | **ある** | **ある** | **ある** | **ある** | **ある** | ない | 5 |
|  | C-D | ない | **ある** | **ある** | **ある** | **ある** | ない | 4 |
|  | C-E | **ある** | **ある** | **ある** | ない | **ある** | ない | 4 |
|  | C-F | ない | **ある** | **ある** | **ある** | **ある** | **ある** | 5 |

**集計**:

- **P別**: P1 6/18（33%）/ P2 **18/18（100%）** / P3 7/18（39%）/ P4 9/18（50%）/ P5 14/18（78%）/ P6 1/18（6%）
- **variant別（ある数 / 36 checks）**: vanilla Wonder **14/36（39%）** / vanilla Spark **17/36（47%）** / pipeline gen-005 **24/36（67%）**
- **P2 は全件ある**: judge の P2 は pagecheck の 0 と食い違うが、これは閾値の違い。pagecheck は辞書に登録された語（`What this means` / `numbers stay exactly as stated` 等）のみを数え、vanilla の `All facts above are the only stated facts.` / `Facts shown are the only stated facts.` は辞書に未登録のため 0。judge は意味で判定するため全件あるとした。両者の乖離は記録済みであり、どちらかが誤りではない（辞書の網羅性の問題）。
- **P3 は pipeline で全件ある、vanilla では 1件のみ**: pipeline の `Generation: loops/loop-016/generations/case-*/gen-005.json · model meta-models/muse-spark-open-1026 · prompt…` / `Record: docs/design/…` はテンプレ由来の内部記録露出。R外（テンプレ）で gen-001 以来残存。vanilla C-C Spark の1件は `Source: loops/loop-016/cases/case-c.json — Facts L01–L10` という footer の sourceLine 記法で、vanilla プロンプトが facts の出典をそのまま footer に書いたもの。
- **P5 は pipeline で 6/6 ある、vanilla では 8/12 ある**: pipeline は全件で「説明・箇条書きのみで当事者の声なし」と判定。vanilla では Wonder C-A/B/E/F と Spark D/F 以外は同様。Wonder がやや少ないのは `You won't be left to figure it out alone.` / `so you can plan your life outside work with confidence.` 等の生活翻訳・シナリオ接地が P5 ない の根拠とされたため。

### P別代表的根拠（verbatim、judge 原文より）

- **P1 ある**: C-A Spark `"Software Engineer (full-time, SaaS product team)" — hero・H2・Posting Summary で逐語反復` / C-B Spark `"Two paid training days per year + quarterly skills workshop" — Training見出し下と Posting details で二重掲載` / C-C pipeline `"Renewal review at month 11; no automatic conversion" — hero・The Basics・Pay & Hours・Check Before You Apply に反復`
- **P2 ある（全件）**: vanilla `All facts above are the only stated facts.` / `Facts shown are the only stated facts.` / `Information shown is limited to the facts listed above.` / pipeline `All conditions above are from the 9 sentences of C-* gen-005. No new facts are added.` — いずれも検証側の限定宣言が読者向けコピーに混入。
- **P3 ある**: pipeline `Generation: loops/loop-016/generations/case-A/gen-005.json · model meta-models/muse-spark-open-1026 · prompt12701 / completion4535 / total17236` — 読者に不要な生成パス・モデル・トークン数。vanilla C-C Spark `Source: loops/loop-016/cases/case-c.json — Facts L01–L10 in sourceLine order.`
- **P4 ある**: C-B Spark `Work pattern 見出しに team/commute 混入` / C-C Wonder `Work & Place [H2] に team 事実混入` / C-C pipeline `Pay & Hours 内に contract 条件混入` — 見出しの約束と本文の事実キーがずれている。
- **P5 ある**: C-A pipeline `Benefits include Health insurance, 10 paid days from month 7, laptop provided as listed.` — 全文が説明・列挙調で当事者の体験談や生活場面の声なし。
- **P6 ある（唯一）**: C-F pipeline `ヒーローに Hourly 1,300 JPY の金額が数値として出ていない` — 唯一の P6 ある。時給職の第一確認項目である金額がヒーロー域にないと判定。

### 実行の経緯と再現性に関する注記

- 初回実行 `eval-phase-34.mjs` は 18件の anon 作成 + judge 18件を完了したが、review 途中でタイムアウト（65sタイムアウトなし、リトライなし）。resume 版 `eval-phase-34-resume.mjs`（65s AbortController + 3回リトライ + skip-existing）で残りを完了。judge は temperature 0.3 のため初回と resume で一部 verdict が揺れたケースがある（例: C-F pipeline P6 は resume でのみ「ある」、C-C pipeline P1 も同様。初回は P6 ない / P1 ないだった）。本表は **最終的にディスクに永続化された judge ファイル**（resume が上書きした版）を正とする。
- 実行ログ: `~/.local/share/opencode/shell/.../sh_19c219cfd001yomzcCS81Uqe9T.out`（初回、全件完了）/ `sh_19c240bc8001gFq0JAm1G3we1Z.out`（resume1、judge 14件完了後タイムアウト）/ `sh_19c2d42960016HsUm9V17ewMhX.out`（resume2、残り 12 review + summary 完了、opened mapping 作成）

> 生結果: `vanilla/evaluation/checks/case-*-{vanilla-wonder,vanilla-spark,pipeline-gen-005}-judge.{json,md}` 18件 + `judge-summary-20261102.json`（各ファイルに prompt/completion/total usage と reasoning を記録。キー値は記録しない）

---

## 軸4: ブラインド・ペルソナレビュー — X/Y/Z の匿名コピー、対応表は封をして後で開ける

> 手法: ケースごとに3種（vanilla-Wonder / vanilla-Spark / pipeline gen-005）を X/Y/Z の匿名コピーにし、`vanilla/evaluation/anon/` に別フォルダで作成。対応表は `anon/mapping-sealed-20261102.json` に封をする（レビュー完了までは開けない）。各ケースの企画 `cases/case-*.json` の `plan.persona` でレビューし、離脱点と AIっぽさの指摘を集める。生成はしない、Baseten は使わない（Meta API `muse-spark-1.3-contributor` / temperature 0.3 / max_tokens 4,000）。

### 匿名化

- **作成**: `vanilla/evaluation/tools/eval-phase-34.mjs` がケースごとに `[vanilla-wonder, vanilla-spark, pipeline-gen-005]` をシャッフルし X/Y/Z に割り当て、`vanilla/evaluation/anon/case-{a..f}-{X,Y,Z}.html` を作成。生成時に vanilla 特有の footer（`Source: loops/loop-016/cases/case-*.json — Facts L01–L10 … Status: vanilla input v1.0 — facts-only`）を匿名化のため汎用 footer（`Fictitious posting. All facts above are the only stated facts.`）に置換（原本には手を入れない。コピーのみ）。
- **封緘**: `vanilla/evaluation/anon/mapping-sealed-20261102.json`（generatedAt `2026-11-02T12:00:11.237Z`）。レビュー完了後に `mapping-opened-20261102.json`（openedAt `2026-11-02T12:16:57.847Z`）を作成。
- **盲検の担保**: レビュープロンプトには `blind label (X/Y/Z)` と `persona / targetAudience / appeal / CTA / mustNot / facts` のみを渡し、variant identity（vanilla-Wonder / vanilla-Spark / pipeline gen-005）は渡さない。anon HTML の X/Y/Z ラベルも reviewer には variant を推測できる手がかりを与えない。

### 対応表（開封済み — 2026-11-02T12:16:57.847Z）

> `mapping-sealed-20261102.json` と `mapping-opened-20261102.json` は内容同一（openedAt のみ追加）。以下は開封済みの確定版。

| ケース | X | Y | Z |
|---|---|---|---|
| C-A | pipeline-gen-005 | vanilla-wonder | vanilla-spark |
| C-B | vanilla-wonder | vanilla-spark | pipeline-gen-005 |
| C-C | vanilla-wonder | pipeline-gen-005 | vanilla-spark |
| C-D | vanilla-wonder | pipeline-gen-005 | vanilla-spark |
| C-E | vanilla-wonder | vanilla-spark | pipeline-gen-005 |
| C-F | vanilla-spark | vanilla-wonder | pipeline-gen-005 |

### レビュー観点（4観点、verbatim）

1. **Unclear** — どの文・事実が理解しづらいか、なぜか（引用つき）
2. **Drop-off** — どこで読むのをやめ応募をためらうか、なぜか（引用つき）— **離脱点**
3. **Applicant questions** — 応募前にペルソナがする質問 2–4件（facts に基づく）
4. **AI-ness** — どの文が AI 生成っぽいか、どの句が根拠か（引用つき）— **AIっぽさ**

### 結果（X/Y/Z → variant 開封済み）— 離脱点と AIっぽさの抜粋

> 全 18件の verbatim は `vanilla/evaluation/checks/case-*-{X,Y,Z}-review-blind.md` に保存。本表は離脱点と AIっぽさの要点を抜粋。

| ケース | ペルソナ | 離脱点（引用） | AIっぽさ（引用） | variant 別所見 |
|---|---|---|---|---|
| **C-A** (SWE Alex) | 26, 2y backend, wants code-review culture | **X(pipeline)**: `"Apply with resume — fictional posting, button disabled"` — came to check team rhythm/commute then apply, button disabled で離脱 | `to build your work step by step` — vague filler | pipeline は「Apply」ボタンが disabled で離脱。vanilla も同様だが文面が異なる |
|  |  | **Y(Wonder)**: `"Fictitious posting. No application function — all details on this page are taken only from the posting below."` + `"Code review on a weekly cadence."` weekly は infrequent に聞こえる | `No extra promises, no missing pieces.` — punchy marketing filler | Wonder は weekly code review の頻度への不安 + no application で離脱 |
|  |  | **Z(Spark)**: `10 paid days from month 7` — no paid days first 6mo に読める | `Facts shown are the only stated facts.` — templated disclaimer | Spark は benefits の読み方で離脱 |
| **C-B** (RN Maya) | Day shift 08:30-17:00, no night duty | **X(Wonder)**: `"Fictitious posting. All facts shown are the only stated facts from the posting."` + `Review All Details Again ↑` のみで離脱 | `plan your life outside work with confidence` — generic lifestyle filler | Wonder は commute/shifts 気に入ったが CTA なしで離脱 |
|  |  | **Y(Spark)**: `"No application function is provided."` + `Fictitious posting for demonstration.` | `This position is for a Registered Nurse` — just restates H1 | Spark は handover lead の説明不足も指摘 |
|  |  | **Z(pipeline)**: `"Apply with license copy — fictional posting, button disabled"` | `No new facts are added` — model generation log | pipeline は生成ログが AIっぽさの根拠に |
| **C-C** (Brand Jordan) | 12-month contract, portfolio link | **X(Wonder)**: *(truncated — max_tokens 4,000 到達で切断。contentLength 620)* | *(truncated)* | ⚠️ C-C X は reasoning 過多で出力切断。以下 2件で補う |
|  |  | **Y(pipeline)**: `"Apply with portfolio link — fictional posting, button disabled"` — contract 12mo は先頭で把握したが CTA disabled で離脱 | `which averages two remote days per week within the Monday to Friday schedule` — redundant | pipeline は remote 2 days の冗長な言い換えが AIっぽい |
|  |  | **Z(Spark)**: `"No application function is provided."` | `are the only stated facts` — no human talks about "posting sheet" | Spark は posting sheet という語が不自然 |
| **C-D** (Logistics Riku) | 3-5 days selectable, shuttle | **X(Wonder)**: `"No application function is provided for this fictitious posting."` — register with agency + site tour を期待したが next step なし | `Nothing added, nothing hidden.` — rhythmic slogan filler | Wonder はメタな slogan が AIっぽい |
|  |  | **Y(pipeline)**: `3-5 days/week selectable, with the specific days coordinated through the agency each week.` — 毎週再調整に聞こえ固定を求める Riku は躊躇 | `which involves standing and lifting` — robotic redundant | pipeline は要件の冗長な言い換えが AIっぽい |
|  |  | **Z(Spark)**: `Agency coordinator on site twice/week + phone support on shift days` — twice/week は薄いと感じる | `you choose` — generic marketing filler | Spark は coordinator の手薄さを離脱点に |
| **C-E** (Cafe Yui) | Parent, 08:00-11:00 fixed, 2-min walk | **X(Wonder)**: `"No application function is available on this page."` — Quick apply - no resume を期待したが | `as stated in the posting` — meta filler | Wonder は morning/midday の排他性が unclear |
|  |  | **Y(Spark)**: `About applying: This page summarizes the posting above. Application instructions are not included` — no steps で pause | **None found** — all lines are short concrete facts *(18件中唯一の AI-ness なし)* | **Spark C-E のみ AI-ness なし** — 最も human-like と判定 |
|  |  | **Z(pipeline)**: `No application function.` + `Quick apply — no resume needed — fictional posting, button disabled` — 2-min walk + 08-11 perfect でも no real job で離脱 | `Staff drink free on shift is included.` — `is included` がテンプレ的 | pipeline は benefits の `is included` が AIっぽい |
| **C-F** (Retail Haru) | 6-week seasonal, 2026-12-01 start | **X(Spark)**: `"No application function is provided."` + `Only the facts listed above apply — no additional conditions…` — duties がないと明言され躊躇 | `no additional conditions, duties, or benefits are stated` — legalistic disclaimer | Spark は duties 不明が離脱点 |
|  |  | **Y(Wonder)**: `Per week (est.) ¥26,000 6-week term (est.) ¥156,000` + `Estimate only` — 固定に見えた額が estimate とわかり + CTA なし | *(truncated — max_tokens 4,000 到達)* | ⚠️ C-F Y も reasoning 過多で切断 |
|  |  | **Z(pipeline)**: `Apply this week — fictional posting, button disabled` — 2026-12-01 start に今週 apply したいが disabled | `No new facts are added` — generation log | pipeline はまた generation log |

**実行上の注記**: C-C X（len 1,542 / reasoning 3,849）と C-F Y（len 1,801 / reasoning 3,741）の2件は `max_tokens 4,000` で reasoning が completion を圧迫し出力が途中で切断された。`review-blind-summary-20261102.json` 上は `ok:true` だが、生ファイルは truncated であることを本表で明記する。内容は Unclear / Drop-off の前半までで途切れており、AI-ness まで到達していない。

**横断的パターン**:

1. **離脱点の共通構造**: 全 18件で「fit を確認（hours/commute/term/pay）→ Apply しようとする → `No application function` / `button disabled` / `please refer to original notice` で止まる」という同一フロー。文面は variant で異なるが構造は同じ。fictitious posting という実験条件によるもので、variant 間の差ではない。
2. **AI-ness の pipeline 署名**: pipeline gen-005 の 6/6 が `No new facts are added` / `from the X sentences of C-* gen-005` という生成ログ由来の文を AIっぽさの根拠に挙げられた。vanilla では `Facts shown are the only stated facts.` / `Nothing added, nothing hidden.` / `you choose` / `is included` 等の disclaimer・slogan・冗長な言い換えが挙げられた。C-E Spark のみ `None found`（human-like）。
3. **Unclear の共通テーマ**: 全ケースで「3-5 days selectable の固定性」「flex core と 10-18:30 の関係」「handover lead の役割」「ownership of 2 launches の中身」「08:00-11:00 or 11:00-14:00 の排他性」「weekends preferred の必須性」が unclear とされた。vanilla / pipeline を問わず、facts の曖昧さ自体が原因であり、工程の有無で解消されていない。

---

## ケース別の所見

### C-A: Full-time SaaS Software Engineer（Alex）

- **事実**: Annual 4,800,000 JPY / flex core 11:00-16:00 / 5-min walk Umeda / 3-month onboarding / 8-person team / Health insurance 10 days month7 / laptop
- **完結性**: Wonder 未完結（8,000 cut、中断は script 内）、Spark 完結、gen-005 完結
- **事実照合**: 3種とも 0（創作なし）
- **pagecheck**: vanilla 0/0/0/0（適用外を含む正常 0）、gen-005 は重複 7 / 検証 2 / Hero P6 present
- **judge**: Wonder 1/6（P2 のみ）、Spark 3/6（P1/P2/P5）、pipeline 3/6（P2/P3/P5）。Wonder は最も clean（P1 ない・P5 ない — `You won't be left to figure it out alone.` が P5 ない の根拠）。Spark は DL 表記の簡潔さにもかかわらず P1 ある（同一文の逐語反復を hero・H2・Summary で検出）。
- **盲検**: 離脱点は全 variant で fictitious 由来。AI-ness は Wonder `No extra promises, no missing pieces.` / Spark `Facts shown are the only stated facts.` / pipeline `No new facts are added`。Spark が最も templated と判定されたが、いずれも軽微。

### C-B: Healthcare RN（Maya）

- **事実**: Annual 5,200,000 JPY / Day shift 08:30-17:00 5 days/week no night duty / 8-min Sakuragicho / Two paid training days + quarterly workshop / 12-nurse ward handover lead / childcare desk
- **完結性**: 3種とも完結
- **事実照合**: 3種とも 0
- **pagecheck**: Wonder 重複 1 / Spark 重複 11（DL 行反復） / gen-005 重複 7。いずれも P6 present
- **judge**: Wonder 1/6（P2 のみ — 最も clean）、Spark 4/6（P1/P2/P4/P5 — 最も多い）、pipeline 3/6（P2/P3/P5）。Spark は `Work pattern` 見出しに team/commute が混入して P4 ある、pipeline は Generation 記録で P3 ある。
- **盲検**: handover lead の説明不足は全 variant で unclear。AI-ness は Wonder `plan your life outside work with confidence`（lifestyle filler）/ Spark `This position is for a`（template filler）/ pipeline `No new facts are added`（generation log）。

### C-C: Contract Brand Specialist（Jordan）

- **事実**: Contract 12 months / Monthly 380,000 JPY / 10:00-19:00 avg 2 days remote/week / 15,000 JPY/month / Renewal month11 no auto conversion / 6-person brand team / ownership 2 launches
- **完結性**: 3種とも完結
- **事実照合**: Wonder 0 / Spark 1（footer 日付、job 創作ではない） / pipeline 0
- **pagecheck**: Wonder 重複 3 / Spark 重複 0 / gen-005 重複 10（`Renewal review` の反復が主因）
- **judge**: Wonder 4/6（P1/P2/P4/P5）、Spark 3/6（P2/P3/P5）、pipeline 5/6（P1/P2/P3/P4/P5 — 最も多い）。pipeline は `Renewal review at month 11; no automatic conversion` が hero・Basics・Pay・Check に反復して P1 ある、Pay & Hours に contract 条件が混入して P4 ある。
- **盲検**: C-C X (Wonder) は truncated。pipeline は remote 2 days の冗長な言い換え `which averages two remote days per week within the Monday to Friday schedule` が AI-ness。Spark は `posting sheet` という語が不自然。いずれも `ownership of 2 launches` の中身が unclear。

### C-D: Dispatched Warehouse（Riku）

- **事実**: Apex Work Partners (dispatch) / Saitama Kawaguchi / Hourly 1,400 JPY / 09:00-17:30 3-5 days selectable / Shuttle Kawaguchi / coordinator twice/week / 10-person buddy week1 / No forklift 15kg
- **完結性**: Wonder 未完結（8,000 cut）、Spark 完結、gen-005 完結
- **事実照合**: 3種とも 0
- **pagecheck**: Wonder 重複 5 / Spark 重複 0 / gen-005 重複 8
- **judge**: Wonder 4/6（P1/P2/P4/P5）、Spark 2/6（P2/P5 — 最も clean）、pipeline 4/6（P2/P3/P4/P5）。Wonder は `Agency coordinator on site twice/week + phone support on shift days, and buddy pairing in week 1 within a 10-person team.` が Full Details と Quick Questions で二重掲載され P1 ある。
- **盲検**: 3-5 days selectable の固定性・誰が承認するか（Apex vs client）が全 variant で unclear。離脱点は Wonder `No application function` / pipeline `coordinated each week` の固定性不安 / Spark `twice/week は薄い`。AI-ness は Wonder `Nothing added, nothing hidden.` / pipeline `which involves standing and lifting` / Spark `you choose`。

### C-E: Part-time Cafe（Yui）

- **事実**: Morningside Coffee / Part-time / Hourly 1,250 JPY / 3 hours/day 2-4 days/week 08:00-11:00 or 11:00-14:00 / 2-min Futako-Tamagawa / 3-day buddy / 6-person shift board / Staff drink free
- **完結性**: 3種とも完結
- **事実照合**: 3種とも 0
- **pagecheck**: Wonder 重複 5 / Spark 重複 2 / gen-005 重複 6
- **judge**: Wonder 2/6（P2/P4）、Spark 3/6（P2/P4/P5）、pipeline 4/6（P1/P2/P3/P5）。pipeline は `From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00` が hero・Basics・Pay・Check に反復して P1 ある。Wonder は Location & Commute に Benefits が混入して P4 ある。
- **盲検**: 08:00-11:00 or 11:00-14:00 の排他性（morning のみで固定できるか）が全 variant で unclear。**C-E Spark Y は 18件中唯一 AI-ness `None found`** — `all lines are short concrete facts like pay, hours, and station distance with no fluffy generic filler` と判定され、最も human-like。pipeline は `Staff drink free on shift is included.` の `is included` が、Wonder は `as stated in the posting` が AI-ness。

### C-F: Casual Retail Seasonal（Haru）

- **事実**: Crestline Outdoor / Casual seasonal / Hourly 1,300 JPY / 6 weeks 2026-12-01 to 2027-01-11 / 3-5 days/week 4-7 hours/day weekends preferred / 8,000 JPY/month / 1-day orientation floor buddy week1 / Staff discount 20% uniform
- **完結性**: Wonder 未完結（8,000 cut）、Spark 完結、gen-005 完結
- **事実照合**: 3種とも 0
- **pagecheck**: Wonder 重複 2 / Spark 重複 0 / gen-005 重複 7。いずれも P6 present だが、judge では gen-005 のみ P6 ある（pagecheck と judge の P6 閾値の違い — 下記参照）
- **judge**: Wonder 2/6（P2/P4）、Spark 2/6（P2/P5）、pipeline 5/6（P2/P3/P4/P5/**P6**）。pipeline は唯一の **P6 ある** — ヒーローに `Hourly 1,300 JPY` の金額が数値として出ていないと判定。Wonder は `4-7 hours/day` の幅が曖昧とされ P4 ある、Spark は P4 ない（`At a glance` / `Posting details` という包括的見出しのため）。
- **盲検**: C-F Y (Wonder) は truncated。3-5 days 4-7h の幅・weekends preferred の必須性・floor buddy の中身が全 variant で unclear。AI-ness は Spark `no additional conditions, duties, or benefits are stated`（legalistic disclaimer）/ pipeline `No new facts are added`（generation log）。

---

## 総括: 工程の有無の差として読む

### vanilla が示したこと

- **事実創作は 0**: 単一プロンプト・facts-only でも、数値の創作は 18件中 18件で 0（C-C Spark の footer 日付を除く）。`{{TICKET}}` の facts-only 入力に忠実であることは、工程の有無によらず達成できる。
- **Hero P6 は 18/18 present（pagecheck）**: 単一プロンプトでも事実をヒーローに置く傾向があり、pipeline の R5（hero-highlight）による視覚的強調は pagecheck 上は同じ PRESENT だが、judge P6 では pipeline C-F のみ「ある」とされた（pagecheck と judge の P6 閾値の違い — pagecheck は第一確認項目の文字列がヒーロー域に含まれるかを機械判定、judge は金額の数値が明示されているかを意味で判定）。
- **長文志向の Wonder は max_tokens 上限に弱い**: Wonder 3/6 が max_tokens 8,000 で切断（C-A/C-D/C-F）。pipeline は 12,000 で運用し切り抜け。温度 0.7 + 長い HTML/スクリプト出力が原因と推定。
- **judge では vanilla が pipeline より clean**: variant別 ある数 は Wonder 14/36（39%）< Spark 17/36（47%）< pipeline 24/36（67%）。特に P3（記録露出）は pipeline で 6/6 ある（テンプレ由来の Generation 記録）、vanilla では 1/18 のみ。P1 も Wonder 2/6 < Spark 2/6 < pipeline 2/6 で同程度だが、P4/P5 では pipeline が多い。
- **盲検では Spark C-E が唯一 human-like**: 18件中 1件のみ AI-ness `None found`。他の 17件では vanilla も pipeline も何らかの AI-ness を指摘されたが、内容は異なる（vanilla は disclaimer/slogan、pipeline は generation log）。

### pipeline が示したこと

- **多工程の成果は pagecheck 上で確認済み**: gen-001 で 11 グループ 43–53 ヒットあった記録露出を 0 に、見出しずれを 0 に、検証文を 2 にまで減らした（T3–T5、R3–R8）。本評価の pagecheck でも 0/0/2 を維持し、vanilla と同等の 0 を達成（ただし vanilla の 0 は「検出対象の構造を持たない」ための 0 でもある）。
- **だが judge では P3 が依然ある**: pagecheck の 0 と judge の ある の乖離は閾値の違い。pagecheck は `tools/dicts/` の辞書に登録された語のみを数え、pipeline テンプレの `Generation: loops/loop-016/generations/case-*/gen-005.json` は辞書に未登録ではないが、pagecheck の record-labels 辞書では検出されず 0。judge は意味で判定し、生成パス・モデル・トークン数を内部記録露出として ある とした。両者の乖離は記録済みであり、どちらかが誤りではない。
- **P1 の重複は pipeline 固有の構造的衝突**: pipeline の P1 ある は `Renewal review at month 11; no automatic conversion` / `From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00` 等が hero・Basics・Pay・Check の4箇所に反復することが原因。これは gen-004 分析で「R1 と verbatim 制約の衝突」として記録された構造的問題であり、vanilla でも同様の P1 ある が 4/12 で見られるため、pipeline 固有ではない。
- **盲検での pipeline 署名**: 盲検の AI-ness で pipeline の 6/6 が `No new facts are added` / `from the X sentences of C-* gen-005` という生成ログ由来の文を指摘された。これは vanilla にはない pipeline 固有の AI-ness であり、テンプレの `All conditions above are from the 9 sentences of C-* gen-005. No new facts are added.` が原因。R外（テンプレ）の残存であり、次世代での除去対象。

### 条件差の但し書き

本対照は温度・提供形態・工程数の差を含んだ「工程の有無」の対照であり、モデルの優劣そのものを測るものではない。

| 要因 | 影響 | 差し引き |
|---|---|---|
| temperature 0.7 (vanilla) vs 0.4 (pipeline) | vanilla Wonder の切断の一因。judge の揺れにも影響（temperature 0.3 でも非決定的） | Wonder の切断は品質ではなく完結性の事象。judge の verdict 揺れは実行ログに記録 |
| 提供形態 Wonder/Spark (Meta API) vs Spark Open (Baseten) | 同一 Spark 系だが提供形態が違う。厳密なモデル比較ではない | 比較の主眼は「工程の有無」であり、モデル差は副次的 |
| 工程数 1 (vanilla) vs 多工程 (pipeline) | pipeline は research/反映メモ/R3–R8 を積んだ最終形。vanilla は facts-only 単一プロンプト | vanilla の P3 ない は「構造を持たない」ためでもある。pipeline の P1 ある は多層構造の副作用でもある。単純比較しない |
| gen-002 → gen-005 変更 | 当初計画 gen-002 から最終形 gen-005 に変更。pipeline 側の欠陥は gen-001→gen-005 で大幅に改善済み | 変更理由（最終形で比べるのが正しい）を明記。gen-005 の方が pipeline に有利な条件であることを認識する |
| judge temperature 0.3 の非決定性 | 同一入力でも実行ごとに verdict が揺れる（例: C-F pipeline P6 は初回 ない → resume ある） | 本報告は最終 persist 版を正とする。初回実行のログも保存し、揺れは注記する |

---

## 検証結果と証拠の場所

| 軸 | 成果物 | 状態 |
|---|---|---|
| 軸0 完結性 | `vanilla/evaluation/checks/completeness-20261102.json`（18件） | **完了** — Wonder 3/6 truncated、Spark 6/6 完結、gen-005 6/6 完結 |
| 軸1 事実照合 | `vanilla/evaluation/checks/fact-check-20261102.json`（18件、inventions 配列つき） | **完了** — 17/18 が 0、1件の footer 日付のみ（job 創作ではない） |
| 軸2 pagecheck（第1層） | `vanilla/evaluation/checks/case-*-vanilla-*-pagecheck.{json,md}` 12件 + `case-*-gen-005-pagecheck.{json,md}` 6件 | **完了**（同一辞書、適用外は applicability に記録。検証文 0/0/2、記録露出 0/0/0、見出しずれ 0/0/0、Hero P6 18/18 present） |
| 軸3 judge（第2層 P1–P6） | `vanilla/evaluation/checks/case-*-{vanilla-wonder,vanilla-spark,pipeline-gen-005}-judge.{json,md}` 18件 + `judge-summary-20261102.json` | **完了** — 全件 `muse-spark-1.3-contributor` / temp 0.3 / max_tokens 12,000 / 65s timeout + 3リトライ。P2 18/18 ある、P3 7/18 ある、P5 14/18 ある、P6 1/18 ある |
| 軸4 ブラインド persona レビュー | `vanilla/evaluation/checks/case-*-{X,Y,Z}-review-blind.{json,md}` 18件 + `review-blind-summary-20261102.json` + `vanilla/evaluation/anon/case-*-{X,Y,Z}.html` 18件 | **完了** — 全件 `muse-spark-1.3-contributor` / temp 0.3 / max_tokens 4,000。うち 2件（C-C X / C-F Y）は reasoning 過多で truncated。盲検担保: reviewer には variant identity を渡さず |
| 匿名対応表 | `vanilla/evaluation/anon/mapping-sealed-20261102.json`（封、generatedAt 2026-11-02T12:00:11.237Z）→ `mapping-opened-20261102.json`（開封、openedAt 2026-11-02T12:16:57.847Z） | **封緘→開封済み**。内容同一（openedAt のみ追加）。本報告書で開示 |
| 本総括 | `vanilla/evaluation/blind-evaluation-20261102.md`（本ファイル） | **確定版（全5軸完了）** — 一括報告 |

- **未確認・非互換**: 2件の review truncated（C-C X / C-F Y）は max_tokens 4,000 で reasoning が completion を圧迫し出力が途中で切断された。該当ファイルは `review-blind-summary-20261102.json` 上 `ok:true` だが、生ファイルは truncated であることを本報告書で明記。内容は Unclear / Drop-off の前半までで途切れており、AI-ness まで到達していないが、離脱点の要点は取得できている。
- **pagecheck と judge の P2 乖離**: pagecheck 0/0/2 vs judge 18/18 ある。pagecheck は辞書に登録された語のみを数え、vanilla の `All facts above are the only stated facts.` は辞書に未登録のため 0。judge は意味で判定するため全件ある。両者の乖離は記録済みであり、どちらかが誤りではない（辞書の網羅性の問題）。
- **pagecheck と judge の P6 乖離**: pagecheck 18/18 present vs judge 1/18 ある。pagecheck は第一確認項目の文字列がヒーロー域に含まれるかを機械判定（文字列マッチ）、judge は金額の数値が明示されているかを意味で判定（`Hourly 1,300 JPY` の数値がないと P6 ある）。両者の乖離も閾値の違いによるものであり、記録済み。
- **要承認**: 本ファイルと `checks/` の judge 18件・review 18件は **候補**（candidate）として作成。pagecheck の辞書・heading-scope・P6、judge のカタログ P1–P6、レビューの 4観点はいずれも恒常化に本人承認を要する（loop が勝手に書き換えない）。
- **権限不足**: なし（Baseten 消費 0、Meta API 別枠のみ）
- **非コミット**: 本作業ではコミット・push はしない（ブリーフ条件どおり）

---

*本ファイルは loop-016 vanilla ブラインド対照評価の総括（候補）。生成はしない、Baseten は使わない（judge・レビューは Meta API）。本体・cases・research・生成物には手を入れず、コミット・push はしない。結果は一括で報告する。*
