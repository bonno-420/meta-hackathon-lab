# ライン側集約 — loop-015 / loop-016 知見の統合（2026-11-02）

- 作成: 制作ライン（OpenCode）
- 日付: 2026-11-02
- 材料: `loops/loop-015/run-record.md` + 試作2からの知見7つ / `loops/loop-016/run-record.md` 全節 / `loops/loop-016/insights/001.md`〜`012.md` 全文 / `loops/loop-016/research/common.md` v1.0 + `case-a.md`〜`case-f.md` v1.0 / 検出候補在庫（`tools/dicts/*.json`・`tools/loop16-pagecheck.mjs`・`tools/loop16-judge.mjs`・`checks/pairs/*.md`・P1〜P6・`checks/case-*-{pagecheck,judge}.json/.md`） / `vanilla/{prompt-v1.0.md, inputs/case-*.md, wonder,spark/case-*.{html,meta.json}}`
- 条件: 本体（工程1〜6）・`cases/`・`research/` には触れない。キー値は出さない。コミット・push しない。数値は実測から取り、推測は推測と明記する

---

## 1章 世代列の要約（loop-015 パイロット → loop-016 gen-001〜gen-005 → 締め）

### loop-015 パイロット（2026-11-01T22:05Z 閉鎖）

- 目的: 1回あたり上限の較正と、英語文面の自律生成＋画像込み完成LPまでの工程の疎通確認
- 入力固定: `topics/topic-A.json` sha256 `228e36ef…` / `topics/topic-B.json` sha256 `b4d54f84…`
- 較正: 小サンプル1回目 `max_tokens=800` で reasoning 797/800 により content null で切断（prompt738/comp800/total1538）。2回目 `max_tokens=4000` で sentences 7件が返り成功（prompt738 cached640 / comp2113 reasoning1876 / total2851）。以降の正式値を `max_tokens=4000 / temp 0.4` に確定
- 日本語予備（系統外）: T-B gen-001 9文 prompt743/comp3633/total4376 / T-A gen-002 9文 prompt746/comp3411/total4157 — 世代数に数えず
- 英語系統（本系統、反映メモなし・各題材3世代自律）: 全6世代で適合 pass / 散文要修正 0 を達成

| 系統世代 | 題材 | 文数 | prompt/comp/total | reasoning |
|---|---|---|---|---|
| EN-1 T-A gen-003 | Retail/世田谷 | 9 | 825 / 2056 / 2881 | — |
| EN-2 T-A gen-004 | 同上 | 6 | 825 / 2193 / 3018 | — |
| EN-3 T-A gen-005 | 同上 | 9 | 825 / 2532 / 3357 | — |
| EN-1 T-B gen-002 | Care/横浜 | 7 | 822 / 1962 / 2784 | — |
| EN-2 T-B gen-003 | 同上 | 9 | 822 / 1943 / 2765 | — |
| EN-3 T-B gen-004 | 同上 | 6 | 822 / 2320 / 3142 | — |

- 完成LP（画像込み、試作2同型）: `topic-A-EN1-gen-003-complete.html` 3.40MB / `topic-B-EN1-gen-002-complete.html` 3.62MB。各4点×2＝8点 `muse-image-1.0`（input 141,364 / output 14,966 / 成功8/8、プロンプト末尾 no text/numbers/logos）。Playwright 390px/1280px で目視確認済み（cache/png）
- メモフォーム追補（2026-11-01T21:5x）: `tools/inject-memo-form.mjs` で6欄フォーム注入、localStorage保存・clipboard+Blob出力、冪等（id=lp-memo で skip）。疎通後の知見7つは未検証のまま loop-016 へ引継ぎ
- 枠消費: Baseten 通算10/20（probe1+較正1+予備JA2+英語6）、K2残10未消化のままパイロット閉鎖

### loop-016 gen-001 — 基準世代（insights なし、legacyテンプレ）

- 変えた要因: なし。6ケース英語 facts 完全新規（日本語混在なし）、企画→事実→生成→完成LP→レビュー→知見を C-A→F 直列で初回通し。Baseten上限 `4000` が `reasoning≈4000` で content null 失敗したため `8000 / temp 0.4` に再較正して実施（probe: prompt322/comp4000/reasoning3997 失敗 → prompt322/comp1715/reasoning1381 成功）
- 実測（run-record「進捗の管理」「ケース別詳細」より）:

| ケース | 文数 | prompt / comp / total | 適合 | 散文 needsFix | 完成LP | ペルソナ指摘（離脱/AIっぽさ） |
|---|---|---|---|---|---|---|
| C-A SaaS Full-time | 5 | 902 / 2717 / 3619 | pass | 0/0 | 2.75MB navy/orange 3画像 | flex曖昧・a 8-person typo・offering Annual |
| C-B Healthcare Full-time | 6 | 1415 / 3520 / 4935 | pass | 0/0 | 3.36MB sage/peach | with Annual・handover曖昧・CTA前出し |
| C-C Contract Brand | 6 | 1828 / 5962 / 7790 | pass | 0/0 | 2.82MB indigo/amber | 4事実詰込・Monthly残存・ownership曖昧 |
| C-D Dispatched Warehouse | 10 | 2334 / 4313 / 6647 | pass | 0/0 | 3.30MB slate/lime | Pay is ラベル・範囲曖昧 |
| C-E Part-time Cafe | 11 | 2790 / 4431 / 7221 | pass | 0/0 | 3.14MB brown/cream | 大文字・filler残存・filler指摘 |
| C-F Casual Retail | 11 | 3266 / 5575 / 8841 | pass | 0/0 | 2.49MB teal/coral | Hourly残存・weekends曖昧・for this position |

- pagecheck v1.0-candidate（6件）: 重複グループ 15/17/17/23/24/25、重複出現計 40/42/47/48/49/51、検証ヒット 9/8/8/8/8/8、記録露出 11グループ 43/45/46/53/53/53 ヒット、見出しずれ 1（Pay & Hours に team/training/benefits等混入）— 全ケース検出
- judge P1-P5（6件）: 全ケース ある/ある/ある/ある/ある（重複・検証文・記録物・見出しずれ・声欠落）。usage prompt約4200-4400 / comp2400-3800 / total6700-8300 reasoning約2100-3400
- 統括目視との対照: 事実表内3回反復・二重掲載・検証文 `What this means…`・企画メモ露出・見出しずれ — 5項目とも両層で拾得（正解100%）。散文0では拾えないページ級欠陥を検出できた
- 枠: Baseten 8/40（probe2+gen-001 6）、Meta画像 18回 input400,405/output34,650 成功18/18、Metaレビュー6回

### loop-016 gen-002 — research v1.0 適用世代（画像・パレット・テンプレ不変）

- 変えた要因: `research/common.md` v1.0 + `research/case-{a..f}.md` v1.0（Indeed US/UK 6件＋LinkedIn template、2026-11-02 viewed）のみ。Facts根拠は `cases/` のみ、research は表現の「型」として注入（`loop16-generate.mjs` loadResearch）。画像は gen-001 の3点再利用、パレット・TITLES も不変
- 実測（run-record「gen-002 実行」より）: 上限を C-A は 8000 で成功（prompt6782/comp6788/reasoning6427 11文）、C-B で 8000時に reasoning7997で No content失敗2連 → 以降 12000 に引上げて安定（C-B 6583/7333/6978 / C-C 6563/6158/5826 / C-D 6669/3759/3419 / C-E 6622/5640/5330 / C-F 6652/4367/4047）

| ケース | 文数 gen001→002 | 適合/散文 | 主な文面変化 | ペルソナ変化 |
|---|---|---|---|---|
| C-A | 5→11 | pass/0維持 | 集約→分散（1文1事実）、CTA分離、offering Annual→an annual salary、a→an | 詰込/typo解消、flex曖昧・有給遅延は持続 |
| C-B | 6→11 | pass/0 | Day shift独立文+no night duty否定明示、CTA書類・3営業日明示 | CTA改善、大文字Full-time浮上、handover持続 |
| C-C | 6→11 | pass/0 | 期間・renewal独立文、CTA分離だが `review the Contract...on the first screen` がUI口調で新AI指摘 | 詰込解消、Monthly残存・ownership持続 |
| C-D | 10→11 | pass/0 | 冒頭2連結→3分離（role/employer/worksite）、CTA雇用元再明示 | Pay is→You will earnでラベル後退、Hourly大文字・選択主体は持続 |
| C-E | 11→9 | pass/0 | 導入に場所前出し、時間枠独立文、駅名入り徒歩圏 | filler→簡潔化、From/Hourly大文字・board不透明は持続 |
| C-F | 11→9 | pass/0 | 導入 vague→明示、CTA端日再掲 `2026-12-01 to 2027-01-11` | filler解消、Hourly大文字・weekends曖昧は持続 |

- pagecheck: 重複 25/25/25/25/20/21（出現51/51/53/51/44/47）、検証 10/10/10/10/10/10（検証文はテンプレ起因で増加）、記録11/53前後、見出し1 — gen-001とほぼ不変。researchは文面改善だがページ級欠陥はテンプレ起因のため検出不変という所見を記録
- judge: P1-P5 全 ある で不変、P6 全 ない（heroに Full-time/Osaka等はある）。hero第一確認項目の直接確認では C-A年収・C-B日勤・C-E時間枠は hero未掲載（TITLES固定のため、researchは hero に未反映）、C-C 12か月・C-D派遣・C-F 6Weeks は heroで既カバー
- 枠更新: Baseten 14/40 success（実16 calls、C-B失敗2含む）、Metaレビュー +6=12、Meta judge +6=12

### loop-016 gen-003 — テンプレ T1-T5 適用（文章は gen-002 逐語再利用、Baseten 0）

- 変えた要因: 生成文は gen-002 逐語再利用。`loop16-complete.mjs` の gen==="003" 分岐で T1 hero facts由来化（HERO_CONFIG: firstCheckKeys+badgeKeys）・T2 facts表は値のみ（sentence重複排除）・T3 検証ブロック `What this means…` 除去・T4 記録ラベル `Target audience/Persona/L01/〔〕` 除去・T5 見出し `Pay & Hours — Exactly as Stated / Place & Access / Team & Support` 分割＋ `SECTION_DEFS` で sentence振分け。`loop16-pagecheck.mjs` v1.1-candidate で P6 hero check を candidate 追加
- 実測（run-record「gen-005実施」の対照表を gen-003 値として逆算、checks/*-gen-003-* より）: complets 2.48-3.36MB維持

| ケース | dup groups 002→003 | occ | verify | record | heading | heroP6 | judge P1 |
|---|---|---|---|---|---|---|---|
| C-A | 25→7 | 51→17 | 10→2 | 53→0 | 1→0 | —→PRESENT | ある→ない |
| C-B | 25→7 | 51→17 | 10→2 | 53→0 | 1→0 | —→PRESENT | ある→ない |
| C-C | 25→7 | 53→18 | 10→2 | 53→0 | 1→0 | —→PRESENT | ある→ない |
| C-D | 25→6 | 51→16 | 10→2 | 54→0 | 1→0 | —→PRESENT | ある→ない |
| C-E | 20→8 | 44→17 | 10→2 | 51→0 | 1→0 | —→PRESENT | ある→ある |
| C-F | 21→8 | 47→19 | 10→2 | 51→0 | 1→0 | —→PRESENT | ある→ある |

- judge P2/P3/P5/P6: P2 ある（CTA由来 2 groups残）、P3 ある（Generation記録露出）、P5 ある（声欠落）、P6 ない（T1で hero 充足）— 全ケース共通、gen-003→gen-005まで不変の一部
- 所見: dup中央値 23.5→7.5、verification 10→2、record 53→0、heading 1→0、heroP6 6/6 PRESENT をテンプレ一括で解消。R1競合（conformance verbatim vs 重複減）の種が残る
- 枠: Baseten 0、Metaレビュー/画像 0（再利用）

### loop-016 gen-004 — reflection v-next R1-R8＋ケース別適用（研究検証世代）

- 変えた要因: `reflection-memos/2026-11-02-reflection-v-next-gen004.md` v-next-gen004（`memos/gen-003-memos.md` 6件集約）＋ gen-003 T1-T5 継承。R1,R2＋ケース別→生成意図（12,000/temp0.4 直列6ケース）、R3冒頭指示除去・R4内部フィールド名非表示・R5 hero際立たせ（hero-highlight）・R6応募前チェック条件化（CHECK_KEYS_004）・R7 CTA行動一致（CTA_004）・R8画像再配分（place photo-sm）→組立て側。Facts/research 不変
- 実測（run-record「gen-004 実施」より）:

| ケース | prompt/comp/total/reasoning | 文数 | 適合/散文 | pagecheck dup 003→004 | judge P1 003→004 |
|---|---|---|---|---|---|
| C-A | 12701/4535/17236/4143 | 9 | pass/0 | 7→9(+2) occ17→21 | ない→ある |
| C-B | 12458/6762/19220/6425 |10 | pass/0 | 7→8(+1) 17→19 | ない→ない |
| C-C | 12425/6428/18853/6093 | 9 | pass/0 | 7→9(+2) 18→24 | ない→ある |
| C-D | 12548/5122/17670/4759 | 9 | pass/0 | 6→9(+3) 16→24 | ない→ある |
| C-E | 12507/9488/21995/9184* | 9 | pass/0 | 8→7(-1) 17→19 | ある→ある |
| C-F | 12527/3747/16274/3414 | 8 | pass/0 | 8→9(+1) 19→23 | ある→ある |
| *C-Eは1回目 No content→再試行成功 |

- R1-R8検証（run-record「反映検証」表より）: R3-R8 組立系 6/6 解消（全ケース）、ケース別生成意図 5/6解消1部分（C-C ownership前出し弱く部分）、R1 再発5/部分1・R2 解消3/部分2（conformance verbatim保持と衝突）
- judge P2/P3/P5/P6 不変（CTA検証文・Generation記録・声欠落・heroPRESENT維持）、P4 は C-A ない→ある 再発 / C-D ある→ない 解消 と割れた
- 所見: 組立で直せる指示・ラベル・hero・チェック・CTA・画像は一括解消できたが、生成文が facts値を逐語で抱える限り R1 は pagecheck dup +1〜+3・judge P1 3再発として跳ね返る構造的競合が露わになった

### loop-016 gen-005 — S1+S2 競合解消（文章は gen-004 逐語再利用、Baseten 0、組立てのみ）

- 変えた要因: 生成文は gen-004 逐語再利用（`generations/case-*/gen-005.json` は 004コピー、basetenConsumed 0）。`loop16-complete.mjs` gen==="005" で S1 hero-highlightを値チップ化（`hero-chips` 内 `chip-label(humanLabel)+chip-value(short値)`、例 C-A `Salary — ¥4.8M / year` で facts表 `Annual 4,800,000 JPY` と正規化不一致化）＋ S2 生成文を pageに1回だけ配置（`pickSingle` で pay→place→team 優先の最初matchのみ、跨セクション重複排除）＋ checks を `label — value` 化。文内での言い換え繰り返しは conformance verbatim と衝突するため対象外として残す（run-record明記）
- 実測（run-record「gen-005 実施」より）: complets 2.74/3.36/2.82/3.30/3.14/2.49MB、Baseten 0、reviews6（prompt846/769/758/804/730/755）、pagechecks6、judges6（1件のみ12000再試行）

| ケース | dup gen004→005 | occ 004→005 | verify/record/heading/heroP6 | judge P1 004→005 | R1再判定 |
|---|---|---|---|---|---|
| C-A | 9→7(-2) | 21→14(-7) | 2/0/0/PRESENT維持 | ある→ない 解消 | 再発→解消（gen-003水準に戻す） |
| C-B | 8→7(-1) | 19→15(-4) | 維持 | ない→ある 再発 | 再発→再発（文内言い換えは対象外） |
| C-C | 9→10(+1) | 24→22(-2) | 維持 | ある→ある | 再発→再発（ラベル重複でgroups+1だがocc減） |
| C-D | 9→8(-1) | 24→16(-8) | 維持 | ある→ない 解消 | 再発→解消 |
| C-E | 7→6(-1) | 19→13(-6) | 維持 | ある→ない 解消 | 部分→解消（持続していたhiring文二重掲載を排除） |
| C-F | 9→7(-2) | 23→14(-9) | 維持 | ある→ない 解消 | 再発→解消 |

- judge P2/P3/P5/P6 は gen-004と同一（P2 CTA由来 2 groups、P3 Generation記録、P5 声欠落、P6 ない）。P4 のみ C-A 解消 / C-B,C-D 再発（sentence単一配置で Team & Support への company/role/requirements混入判定が鋭敏化）
- R1 総合: 4解消/2再発（C-B/C-Cは facts値の跨文逐語含有一致が assembly では除去不能）。dup中央値 8.5→7、occ全ケース -2〜-9、judge P1 1/6→4/6 に改善

### 締め — loop-016 世代列の鳥瞰（run-record「世代列の要約」表を run-record数値で再掲）

| 世代 | 変更要因 | Baseten | 画像 | pagecheck dup中央値 | judge P1 ない (6中) | 主な成果 | 残した課題 |
|---|---|---|---|---|---|---|---|
| gen-001 基準 | facts+plan→生成 insightsなし legacy | 6 success | 18新規 | 20 (occ25,25,25,23,20,21) | 0/6 | 6ケース全pass/散文0で立ち上げ | intra反復・二重掲載・検証文・企画メモ・見出しずれ→2層で全拾得 |
| gen-002 research | research v1.0 のみ | +6(実8 calls) | 再利用 | 23.5 (25,25,25,25,20,21) | 0/6 | 集約→分散・期間分離・日勤否定・駅名明示、知見連鎖定着 | テンプレ不変のため検出不変 |
| gen-003 T1-T5 | hero facts由来・二重除去・検証除去・記録除去・見出し整合 | 0 | 再利用 | 7.5 (7,7,7,6,8,8) | 2/6 | dup23→7 verify10→2 record53→0 heading1→0 hero6/6 | R1競合の種、R3-R8持越し |
| gen-004 R1-R8 | reflection v-next（生成意図+組立） | +6(実7) | 再配分 | 8.5 (9,8,9,9,7,9) | 1/6 | R3-R8 6/6・ケース別5/6解消 | R1 5再発/1部分、dup5悪化、P1 3再発（hero逐語重複） |
| gen-005 S1+S2 | heroチップ化+単一配置（T1-T5+R3-R8維持） | 0 | 再配分維持 | 7 (7,7,10,8,6,7) | 4/6 | R1 4/6解消、dup5改善 occ全減、P1 4解消 hero維持 | 文内繰り返し2再発は対象外として残す |

- Baseten最終: 20/40 success（23 calls: probe2+gen-001 6+gen-002 6実8+gen-004 6実7、gen-003/005 0）、Meta画像18・レビュー18・judge24・vanilla12（prompt計 wonder2968/comp45606/total48574 spark2968/19075/22043、wonder 3件A/D/Fが8000で切断）、締切2026-11-05 11:00 JST に対し K3は gen-004時点で達成

---

## 2章 知見の統合（重複を束ね、出典を付ける）

> 本ループの知見は `insights/` に stock（台帳昇格は別途判断、本ループでは `docs/learnings.md` を書かない）。下記は run-record「知見ストックの記録」表と各 `insights/*.md` の本文から重複を統合したライン側の束ね。数値は実測、推測には「推測」と明記する

### I-1 上限較正と温度の扱い（insights 001 / run-record 呼び出し数の管理）

- **統合**: `max_tokens=4000` では reasoning≈4000が completion を占め content null で切断する（C-A gen-001 probe prompt322/comp4000/reasoning3997、Metaレビューも2000で空応答）。`8000` に引上げで C-A 5文が返り（prompt902/comp2717/total3619 reasoning1381）、以後 8000/0.4 を基準にしつつ research増分で C-B以降は `12000` に安定（C-A 6427 / C-B 6978 reasoning、8000時 No content2連を実測、run-record表参照）。gen-004は初回から12000固定（C-Eのみ再試行1）。K2は success/実calls の両方を別記で管理する運用が定着
- **出典**: 001.md / 007-012.md（各prompt/comp/reasoning数値） / run-record「1回あたり上限」「呼び出し数の管理」「gen-002実行」
- **持越し**: 温度0.4は全世代維持、reasoning占有の増大は research・reflection の付加量に比例する（実測）

### I-2 集約→分散・1文1事実・CTA分離の定着（insights 001-006 連鎖 / 007-012 補強）

- **統合**: Gen-001 は company/role/location を1文に集約する癖（C-A 5文、C-B 6文、C-C 4事実詰込で `fields stitched together`）が 001「時間1文1事実」→002反映で C-B に効き、003「導入3以内・CTA分離」→004で C-D 10文ほぼ1文1事実に定着、C-E以降維持。gen-002 は research 1文1事実型（1-5）で 5-11文→9-11文に収束（C-A 5→11、C-D 10→11、C-E 11→9、C-F 11→9）。CTAも `Benefits include…` 埋もれから書類・期限明示型（C-B 3営業日、C-D site tour、C-F 端日再掲）に分離。レビューでは詰込指摘が001→002で消失したことが複数ケースで実測
- **出典**: 001.md（集約passだがflex曖昧）/002.md（時間分離効いた）/003.md（導入回帰）/004.md（1文1事実定着・派遣分離成立）/005-006.md（定着維持）/007.md（annual小文字・an修正と分散）/008-012.md（各CTA変化の対照表）/ run-record「生成文の差」
- **持越し**: 導入vague filler（`for this position`）、benefitsの列挙主語崩れは facts外創作が禁じられるため LP注記で受ける分離が確定

### I-3 派遣・期間雇用・短時間等の雇用形態別パターンの効き（004 / 009-010 / 012）

- **統合**: Dispatched は employer/worksite/employmentType を3文分離する（C-D 2連結→3分離で混同指摘消失、research case-d.md「2 bullets employer first」で補強、CTAで雇用元再明示）。Contract は term→renewal独立文で `Contract 12 months` と `Renewal review at month 11; no automatic conversion` を分離（003.mdで評価、009.mdで分離効いたが CTAのUI口調 `review on first screen` は新AI指摘に）。Part-time は勤務地前出し＋時間枠独立文＋駅名入り徒歩圏（C-E 導入場所追補→駅名入りで有効）。Casual は職種/場所/期間を導入集約し CTAで端日再掲（012.md、C-F 6 weeks: 2026-12-01 to 2027-01-11 で離脱防止）
- **出典**: 004.md / 009.md / 010.md / 012.md / run-record「hero第一確認項目」「生成文の差」
- **持越し**: `twice/week` 曜日・`3-5 days/week selectable` 選択主体・`shared shift board` 運用は facts定義がなく生成文では解消不能 → LP注記/FAQで受ける

### I-4 大文字・ラベル・filler の持続パターン（002-006 / 008-012 全連鎖）

- **統合**: insights注入だけで直らない持続パターンとして確定。`Monthly/Annual/Hourly` の文中大文字は `offering Annual`(001)→`with Annual`(002)→`offers Monthly`(003)→`Pay is Hourly`(004)→`Hourly/From/Staff`(005) と形を変えて全6ケースで再指摘。`Pay is/Employment is/Shifts are` のラベル開き（004）→`You will earn` へ後退したが大文字は残り、filler `at your own pace / easy to / quickly`(005) や `Full-time basis`(008) `No forklift` 大文字（010） `is included` 2 nouns に追補（012）へ変容。run-record「知見ストックの更新」007-012 でも「持続パターンとして再確定」と明記。推測: `insights/` の文面指示（「小文字で」「自然な語順で」）は後続の1世代に軽微に効くが、モデル固有の癖は複数層の指示がないと消えない（実測からの判断、他因の可能性は否定しない）
- **出典**: 002.md（Annual残存）/003.md（Monthly残存）/004.md（ラベル口調）/005.md（大文字・filler）/006.md（大文字/filler持続の結論）/007-012.md（各「大文字持続」節）/ run-record「gen-002 呼び出し数の更新」後の知見表 007-012
- **持越し**: 生成プロンプト側の明示強化（「annual/monthly/hourly は小文字で an annual salary of X の形」「Pay is のラベル開き禁止」「事実外修飾禁止」等を具体例付きで常駐）を次ループへ持越し（012.md「台帳未判断」）

### I-5 事実の欠落が呼ぶ曖昧さは生成では直らない（007-012 / gen-004 R2）

- **統合**: flexコアと固定帯の関係・有給の月7基準の月1-6扱い・weekly reviewの3-month縛り・handover運用・workshop有給・reports to主体・ownership中身・coordinator不在・shuttle/pass併用・Fromの意味・board運用・weekends preferred必須/任意 — いずれも facts に運用定義がなく、researchの文法型では埋まらない。gen-002 レビューで001→002持続として全ケースで実測され、gen-004 R2 は `flex core 11:00-16:00 is core time` 補足・`15kg` 前出し・`weekends preferred rather than required` 正確化で部分解消したが C-C ownership前出し不足と C-E時間枠長は部分残り（run-record R2表 4解消2部分）。以降は「LPの注記・FAQ・応募前チェックで受ける」分離が確定（001-012全般、004.md「LP注記で」）
- **出典**: 007.md / 008.md / 009.md / 010.md / 011.md / 012.md / run-record「gen-004 反映検証 R2・ケース別」

### I-6 画像規格と文脈分離の運用（001-006 / run-record）

- **統合**: `muse-image-1.0` で 3点/ケース×6=18点（hero/work/place）を本文非依存で生成、成功18/18、プロンプト末尾 `no text/no numbers/no logos` で文字なしを確保、文章・数値はHTMLテキストで組む分離型。ファイル出力のみで文脈への大量読込は行わず、目視確認は「ファイル確認のみ・画像の文字混入目視は未実施」と run-recordに明記（gen-016）。パレットは case別6種（navy/orange, sage/peach, indigo/amber, slate/lime, brown/cream, teal/coral）で固定。gen-004 R8 では place を photo-sm に縮小し仕事中心配分に変更（R8 6/6解消）、gen-005 でも維持
- **出典**: loop-015 run-record「3-3 完成LP（画像込み）」manifest 141,364/14,966 / loop-016 run-record「進捗の管理」manifest 400,405/34,650 / 006.md / gen-004 R8表
- **残件**: 画像の目視確認（2章1章各節に「未実施」と記録）は第4章で残件化

### I-7 研究型改善とテンプレ型改善の効き方の違い（gen-002 vs gen-003 対照）

- **統合**: Research適用（gen-002）は文面の集約→分散・期間分離・否定明示・駅名等に効くが、facts表＋body二重掲載・検証文・企画メモ露出・見出しずれはテンプレ起因のため pagecheck/judge が gen-001と不変（P1-P5 ある 持続、pagecheck重複25/検証10/記録53/見出し1）。テンプレ T1-T5（gen-003）は同欠陥を dup25→7 verify10→2 record53→0 heading1→0 hero6/6 と一括解消。run-record「gen-001 vs gen-002 対照表」および「締め 世代列の要約」も同所見を「研究非依存の組付け欠陥」「researchの文面改善では拾えないページ級欠陥」と記録。推測: 研究は表現の質（散文印象）に、テンプレはページの構造（重複・検証文・見出し）に効くという役割分担（実測からの整理、他解釈もあり得る）
- **出典**: run-record「gen-001 vs gen-002 対照表」「ページ級検出の初回トライアル」「gen-002 実行」「gen-005 世代列の要約」

### I-8 Reflectionの効きと R1 構造的競合（gen-004 / gen-005）

- **統合**: gen-004 v-next R3-R8（組立系）は全6ケースで解消（指示文除去・内部名非表示・hero-highlight・チェック条件化・CTA行動一致・画像再配分）。R2＋ケース別は概ね解消（C-A flex補足、C-D 15kg前出し、C-F端日維持 等、run-record表参照）。一方 R1「facts表と生成文の重複を減らす」は conformanceの verbatim保持と衝突して再発5/部分1（pagecheck 5悪化1微改善、judge P1 3再発）。gen-005 S1+S2は assembly側で緩和を図り 4解消2再発（dup中央値8.5→7、occ全減-2〜-9、P1 1/6→4/6）。残る2再発（C-B Day shift 4箇所 / C-C Contract terms 4箇所の facts値跨文含有一致）は「文内での言い換え繰り返しは組立てでは直せないため対象外として残す」と run-recordで明記（run-record「残件 #1」）
- **出典**: run-record「gen-004 反映検証 R1-R8」「gen-005 R1再判定」「残件 #1」

---

## 3章 候補の一覧と状態

> 本ループの検出・research・反映の仕組みは本体に統合せず `loops/loop-016/` 内の candidate として置く。恒常化は本人承認を経る（loopが勝手に書き換えない）。下記は在庫の実地棚卸し

### 3-1 検出ルール・辞書（Layer1 pagecheck）

- 実装: `tools/loop16-pagecheck.mjs` v1.1-candidate（T1-T5+P6、deterministic、Baseten枠外・Meta枠外、no API）
- 入力: `previews/case-*-gen-*-complete.html`、出力: `checks/case-*-gen-*-pagecheck.{json,md}`（場所つき警告）
- 4(+1)項目:

| 項目 | ルール在庫 | dict在庫 | 候補のままか | 恒常化の判断が残る場所 |
|---|---|---|---|---|
| 重複文 | 正規化→count≥2で全部出す（意図的再掲の分離は未実装、CTA再掲も含む）。セクション split→normalize→map | —（ルール内蔵） | 候補 | 分類の改善候補が run-record「検出側の改善点」に残る（同一section反復 vs 跨section二重掲載 vs 引用記号重複 の分類、CTA除外ルール）。恒常化時は辞書ではなくルール条項として `docs/design/baseten-verification-loop-design-v1.md` の検出条項へ昇格 |
| 検証側定型文 | 辞書一致（visible text per section、case-insensitive部分一致、ctx±30字） | `tools/dicts/verification-phrases.json` 13エントリ（What this means / numbers stay exactly as stated / As stated in the FACT / Read the sentences above... / No rounding... / All facts below... / Do not invent / Each cites... / All conditions above are from the / No new facts are added / 求人票にない / 再計算はしない / ため書きません）。各entriesに lang/source/note/status candidate/added 2026-11-02 | 候補 | run-record「検出側の改善点—検証辞書の拡充」に「JA3語のみ、ENは実例のみで薄い。候補追加→本人承認で恒常化」と明記。現状は trial2由来＋C-A実例で固定 |
| 記録物露出 | 辞書一致（visible text、RegExpカウント） | `tools/dicts/record-labels.json` 13エントリ（factKeys/sourceLines/Target audience/Persona:/Persona/Insights applied/Appeal:/mustNot/CTA:/〔/〕/L01/L02）。status candidate | 候補 | 同上「記録物露出の閾値」に「L01はnote欄にも出るため毎回ヒット、恒常ルールでは『本文factsテーブル外のLコードのみ』等の絞りを検討」と残る。現状は全部出す |
| 見出しと中身のずれ | headingPattern→allowedKeys で unexpectedKeys を警告（見出し内のキーワードで scope rule を選び、〔〕cite の foundKeys を照合） | `tools/dicts/heading-scope.json` 4エントリ（Pay & Hours→salary/pay/workHours/employmentType等 / Place & Access→location/commute等 / The Basics→全許可 / Check Before→全許可）。status candidate | 候補 | 同上「見出しスコープ」に「Pay & Hours の allowedKeys が英語のみ、term/commute境界は要確定」と残る。gen-003で heading mismatch 1→0 に解消できたが rule は candidate のまま |
| Hero P6（新設） | `HERO_P6_CONFIG` per-case regex（A 4,800,000/Annual, B 08:30/Day shift, C 12 months/Contract, D Apex/Saitama, E 3 hours/08:00-11:00/Futako-Tamagawa, F 2026-12-01/6 weeks）で heroText（<header class=hero>）にパターン存在を判定 | —（コード内 Config、在庫数は6） | 候補 v1.1 | run-record「調査工程の追加—検出への接続」に「P6候補『読み手の第一確認項目がヒーローに出ていない』を candidate として追加、恒常化は本人承認を経る」と明記。pagecheckは present/missing/heroText/checks をjsonに出し、judgeも P6 を candidate として判定する。6/6 PRESENTを gen-003以降で達成したが code上の注記は `candidate — permanence requires owner approval` のまま |

- 版: dictVersionsは pagecheck json の `verification:13 / recordLabels:16(実装は13だが pagecheck初期は16表記、3章執筆時13) / headingScope:7表記（同7→現4） / heroP6:6` で記録。loop-016 run-record「進捗の管理」では v1.0→v1.1-candidate に更新

### 3-2 対比ジャッジ（Layer2 judge）

- 実装: `tools/loop16-judge.mjs`（Meta `muse-spark-1.3-contributor` / temp0.3 / max_tokens 8000、Eのみ12000再試行、Baseten枠外）
- 入力: previews HTML の visible text 9000字truncation + research common/case から P6 first-check ヒント + contrast pairs（`checks/pairs/*.md`）
- 出力: `checks/case-*-gen-*-judge.md`（verbatim、要約しない）＋`*.json`（usage）。Baseten枠に含めず Meta枠で記録（run-record「検出側の改善点」に「Judgeは8000で運用、reasoning2200-3800を要する」と明記）
- 欠陥カタログ P1-P6（固定、言語非依存）:

| P | 項目 | 候補/恒常 | 状態 |
|---|---|---|---|
| P1 | 文の逐語反復による仕様書化（intra-facts＋二重掲載） | candidate | gen-001 6/6 ある→gen-003 2/6 ある→gen-004 3/6 ある→gen-005 2/6 ある。R1競合で揺れる。恒常化判断は後段へ |
| P2 | 検証側・メタ文の混入（What this means / numbers stay... / All conditions above...） | candidate | 全世代 全ケース ある 持続。T3で highlight側は除去したが CTA由来2 groups（All conditions above / No new facts）が残存。恒常化判断は CTA文言置換案（3章残件と連動）とともに残る |
| P3 | 記録物（企画・根拠）の露出（Target audience/Persona/factKeys/L01/〔〕等） | candidate | gen-002 6/6 ある→gen-003 6/6 ある（Generation記録露出へ変質）→gen-004/005も ある 持続。全ケースで generationメタが露出と判定。T4で企画メモは消えたが generation記録は P3 として残る構造 |
| P4 | 見出しと中身のずれ（Pay & Hoursに team/benefits等の範囲外混入） | candidate | gen-001/002 6/6 ある→gen-003 2/6→gen-004 2/6→gen-005 2/6（C-B/C-C）で変動。sentence単一配置で判定が鋭敏化 |
| P5 | 当事者の声の欠落（説明文化のみ） | candidate | 全世代 全ケース ある 持続。生成文責と組付け責が混在し gen-002時点で「P1-P4を優先しP5は参照に留める」と run-recordに明記。恒常化は優先度低で残る |
| P6 | 読み手の第一確認項目がヒーローに出ていない（research基準） | candidate | gen-002で新設、P6 6/6 ない（hero充足）で gen-003以降維持。pagecheckとjudgeの両方で candidate として運用、恒常化は本人承認待ち |

- ペア在庫（`checks/pairs/` 3件、candidate, not product）:

| ペア | 出典 | 対比内容 | 状態 |
|---|---|---|---|
| pair-01-trial2-note.md | 試作2注記 修正前/後（JA） | P2/P3 対比 | candidate |
| pair-02-loop012-loop013.md | loop-012 typed vs loop-013 persona（JA） | P1 対比 | candidate |
| pair-03-cA-folded.md | C-A現行LP vs 畳んだ版（EN、ループ内仮置き） | P1二重掲載/P3/P4 対比。生成文は自然だが組立てで仕様書化する例 | candidate |

- 所見（run-record「検出側の改善点」より）: ペア3件のまま運用、Judgeの安定性は C-Dで4000→8000に引上げ、reasoning2300-3800を要する。ペア恒常化・新ペア追加は本人承認を経る

### 3-3 Researchの型（表現の型のみ、facts根拠にしない）

- 実装: `research/common.md` v1.0 + `research/case-{a..f}.md` v1.0（2026-11-02 viewed、Indeed US/UK 3-5件/雇用形態＋LinkedIn template、本文転用せず型に抽象化）。Facts根拠は `cases/case-*.json` のみ（constraint明記）
- 型の内容（common.md §1-6）: 文法（you/we使い分け、1文12-22語、見出しは名詞句 `[Scope] — [Exactness cue]`）、給与提示（hero＋conditions両方、Annual/Hourlyパターン）、並び順（Role→Pay→Hours→Location→Team→Employer/Worksite等、雇用形態別variant）、未記載は触れない、CTA 5種（低摩擦/標準/派遣/短期/期間再掲）、避ける表現（hype/unbounded promise/meta phrases `What this means...` /内部ラベル `factKeys/〔〕`）
- ケース別（case-a..f.md）: 各「Reader's first-check item（hero requirement）」＋ persona整合＋提示順（hero skeleton / body order / truncation-safe rule）＋業界言い回し型（例 C-A `Annual — Full-time — location`、C-D `Employer→Worksite 2 bullets`）＋ pay制約＋ avoid＋CTA型＋出典表
- 状態: candidate — permanence requires owner approval（common.md冒頭 status明記、per-caseも同様）。版は v1.0 で固定し `generations/*.json` の `researchApplied` と `researchVersion` に記録、生成がどの版を参照したか追跡可能。loop-016 run-record「調査工程の追加」では「Baseten枠を使わず、将来 hero改修は `loop16-complete.mjs` のTITLES拡張として次工程に持ち越す」と記録
- 配線（Wiring note, common.md末尾）: Pay/term/hoursの hero掲載は P6 で監査可能（commonのhero skeleton＋per-case first-check が定義）、恒常化までは candidate として運用

### 3-4 反映の仕組み

- insights連鎖: `insights/001-012.md` を `loop16-generate.mjs` が次ケース生成時に自動読込（直列、連鎖を切らない）。台帳 `docs/learnings.md` への昇格は別途判断（本ループでは書かない、README/001-012で `未判断`）
- reflectionメモ: `reflection-memos/2026-11-02-reflection-v-next-gen004.md` v-next-gen004（`memos/gen-003-memos.md` 6件集約）→ R1,R2＋ケース別は生成意図、R3-R8は組立側、gen-004限定で `loop16-generate.mjs` / `loop16-complete.mjs` の gen==004 分岐として適用、版は `reflectionApplied` / `reflectionVersion` に記録
- 反映検証: run-record「gen-004 反映検証 R1-R8」「gen-005 R1再判定」で解消/部分/再発をケース別に判定（実測）
- vanilla対照: `vanilla/inputs/case-*.md` facts-only機械転記（sourceLine順、L01-L10 verbatim、plan入れない、sha256と v1.0 facts-only 記録）＋ `vanilla/prompt-v1.0.md` v1.0（`Create a recruiting landing page... Job posting: {{TICKET}}` 両モデル同一、一字も変えない）＋ `tools/loop16-vanilla.mjs`（wonder `muse-wonder-1.0` / spark `muse-spark-1.3`、8000/0.7、単一プロンプト単一応答手直しなし、画像は gen-001 3点並置コピー）。候補のまま、恒常化判断は次章残件へ

### 3-5 候補→恒常化の出口

- 設計上の出口: `docs/design/baseten-verification-loop-design-v1.md` の検出条項へ昇格（loop-116 run-record「残件 #3」に「dicts/pairsの版を固定し恒常化時は設計書の検出条項へ昇格、本ループでは candidate のまま残す」と明記）。pagecheck 4項目＋heroP6＋judge P1-P6＋dicts/pairs＋research v1.0 は全て candidate のまま運用し、loop-016 内では昇格しない（本人承認待ち）
- 停止条件は確定値のまま（K1指示停止/K2 40回・5世代目安/K3 11/04日中打ち切り/K4 同じ指摘3世代/K5 適合落ち2連）。K4/K5は全ケース・全世代で該当なし（run-record各節「該当なし」）

---

## 4章 残件（次ループ持越し、または恒常化判断待ち）

| # | 項目 | 状態 | 詳細（実測） | 対応方針（run-record「残件」より推測は推測と明記） |
|---|---|---|---|---|
| 1 | 文内繰り返し（facts値の跨文逐語含有一致） | 残件 | C-B `Day shift 08:30-17:00, 5 days/week; no scheduled night duty` と C-C `Contract, 12 months / Renewal review at month 11` が hero要約・facts表・本文・チェックの4箇所で逐語を含む。pagecheck dup 2 groups残、judge P1 2再発（C-B/C-C）、gen-004 R1 5再発→gen-005 S1+S2で C-B/C-Cのみ再発として残存。Assemblyでは除去不能（run-record「生成文の差と組立ての差」に「文内での言い換え繰り返しは conformance verbatim 要件と衝突するため組立てでは直せず対象外として残す」と明記） | 次ループの生成プロンプト（R1）で「facts表が担う値の再述を避け、関係性を書く」方針を継続するが、conformanceの verbatim チェック（数値は必須）と調整が必要。例: 数値は事実表で保持しつつ本文では「日勤帯」等の言い換えを許す精緻化を検討（推測: 現行は数値verbatimを機械検査でpass必須のため、生成側の抑制と検査側の許容を両方いじる必要がある） |
| 2 | 検証文 2 groupsの扱い | 残件 | `All conditions above are from the X sentences of C-* gen-*. No new facts are added.` の CTA由来2 groupsが全世代で残存（gen-001 9/8 → gen-002 10/10 → gen-003 2/2 → gen-004 2/2 → gen-005 2/2、judge P2 全 ある）。T3で highlight `What this means / numbers stay exactly as stated` は除去済みだが CTA由来は R外として残留 | CTAブロックの文言を「条件は上記のとおり（X文で再掲）」等の検証的表現から「不明点は店舗・担当へ」等の問い合わせ誘導へ置換する候補（run-record「残件 #2」より）。恒常化は本人承認を経る |
| 3 | vanilla ブラインド対照評価の未実施 | 未実施 | vanilla `wonder 6 + spark 6 =12LP`（prompt-v1.0 facts-only一発、単一応答手直しなし。wonder 3件A/D/Fが8000で切断して `</html>` なしのまま、手直し禁止のためそのまま残す）と本ライン最新6LP（gen-005 T1-T5+R3-R8+S1+S2）を並置する評価は未実施（run-record「締め」に「作成済み・評価未実施」として記録）。vanilla usage: wonder prompt2968/comp45606/total48574（3件上限到達）/ spark 2968/19075/22043 | 次回ブラインド審査で 適合/散文/pagecheck/judge の4軸で並置評価（run-record「残件 #4」）。本体工程1-6は触れない。切断3件は手直しせず評価材料に含める |
| 4 | 画像の目視確認 | 未実施 | 生成画像 18点（gen-001 3点×6、input400,405/output34,650、manifest記録、プロンプト末尾 no text/numbers/logos）はファイル確認のみで文脈への大量読込は行わず、画像中の文字・数字・ロゴ混入の目視は未実施として記録（loop-015は「文字なしを目視確認」済みだが loop-016は「未実施」と明記）。gen-004/005は再配分（place photo-sm）のみで新規生成なし | 次ループまたは恒常化判断時に画像の文字混入を目視で再確認（推測: 目視未実施は記録上の留保で、画像規格自体は loop-015 と同型で維持されている） |
| 5 | 候補の恒常化判断（全体） | 未決 | 上記1-4を含め、pagecheck 4項目＋heroP6＋dicts/pairs＋judge P1-P6＋research v1.0＋reflection/R1-R8/S1+S2 は全て candidate のまま（run-record「残件 #3」に「gen-003-005で改善を確認したが恒常化は本人承認待ち、dicts/pairsの版を固定し昇格時は設計書へ」と明記） | `tools/dicts/*.json` と `checks/pairs/*.md` の版を固定し、恒常化時は `docs/design/baseten-verification-loop-design-v1.md` の検出条項へ昇格。本ループでは candidate のまま残す |
| 6 | P5 当事者の声の欠落・P3 Generation記録露出の優先度 | 未決 | P5は全世代 全ケース ある 持続（声欠落）、P3は gen-003以降 `Generation: loops/...gen-*.json · model ... prompt.../comp...` の露出と判定され 全 ある 持続（run-record各 judge 表）。いずれも gen-002時点で「P1-P4を優先しP5は参照に留める」と判断済み | 本件は「改善点ではなく観察」として扱い、gen-002以降は P1-P4優先で運用（run-record「ページ級検出の初回トライアル」より）。恒常化判断時に P5の条項化可否と P3の除外（generation注記を P3 から除外するか）を検討 |

---

## 5章 統括版の知見まとめ（`docs/loop-015-016-insights-summary-20261102.md`）との差異・矛盾の列挙

- 確認: Git 上（HEAD `fbd576f`）および手元 `docs/` に `docs/loop-015-016-insights-summary-20261102.md` は存在しない（`docs/` 直下を `read` / `docs/design/` 一覧でも不在を確認）
- よって本章は差異・矛盾の列挙ではなく、着地時の突合手順を記録する（指示どおり「着地時に統括が突合する」として扱う）

### 突合の手順（着地時に統括が実行）

1. 本ファイル（ライン側集約 `loops/loop-016/insights-consolidation-by-line-20261102.md`）の第1-4章を、統括が作成する `docs/loop-015-016-insights-summary-20261102.md`（統括版）と突合する
2. 差異・矛盾が出た場合は、下記観点で列挙し、版を上げるか注釈を付ける:

| 観点 | 照合材料 | 推測は推測と明記する |
|---|---|---|
| 世代列の数値（適合/散文/pagecheck/judge/トークン/呼び出し回数） | 本ファイル1章 vs 統括版の同表 | 本ファイルの数値は run-record の実測（prompt/comp/total/reasoning/dup/verify/record/heading/heroP6/usage）を原文から転記。統括版が異なる数値を用いている場合は実測側を正とする |
| 知見の束ね（大文字持続・欠落起因等） | 本ファイル2章 I-1〜I-8 vs 統括版の知見章 | 本ファイルは `insights/001-012` の原文を束ねたもので、統括版が別の束ね方をしている場合は両方を残し、台帳昇格時は統合する |
| 候補の状態（検出ルール・辞書・P6・researchの型・反映の仕組み） | 本ファイル3章 vs 統括版の候補章 | 本ファイルは `tools/dicts/*.json` / `tools/loop16-*.mjs` / `research/*.md` の在庫を棚卸しした結果。統括版が候補の恒常化判断を異なる箇所に置いている場合は本ループの「candidate のまま」を優先（本人承認前は loopが勝手に昇格しない） |
| 残件（文内繰り返し・検証文2 groups・vanilla未実施・画像目視） | 本ファイル4章 vs 統括版の残件章 | 本ファイル4章は run-record「残件 #1-4」の実測を転記。統括版が追加の残件を挙げている場合は追記し、解消済みとしている場合は実測（pagecheck/judgeの最新値）で検証する |

3. 突合後は、本ファイルと統括版のどちらが正本かを明記し、次ループの反映元（`insights/` 連鎖・research版・dicts版）をどちらに寄せるか合意する

> Git 上に統括版がある状態での差異・矛盾の列挙は、統括版の作成後に追補する

---

## 出典一覧（数値は実測、推測は推測と明記する）

- loop-015: `loops/loop-015/run-record.md`（入力版ハッシュ、K1-K5確定値、較正 probe800/4000、日本語予備、英語6世代の文数・prompt/comp/total・適合/散文、完成LP 3.40/3.62MB・8点 input141,364/output14,966、メモフォーム6欄、K4/K5該当なし、パイロット知見7つ）
- loop-016 run-record: `loops/loop-016/run-record.md`（入力版6ケース sha256、K1-K5、呼び出し数の管理 20/40 success23 calls、進捗パイプライン6ケース通し、ケース別詳細C-A..F、時系列較正 probe4000失敗/8000成功、反映メモ版、ペルソナレビュー4観点表、知見ストック001-006表、ページ級2層トライアルの4項目数値・judgeカタログP1-P5・正解対照、調査工程の追加と research版一覧、gen-004 R1-R8検証表・ケース別表・生成文差、対照実験vanillaの inputs/prompt/生成表・usage、gen-002パイプライン・対照表・hero第一確認項目・生成文差・知見007-012、gen-005 S1+S2/pagecheck/judge/R1再判定、締め世代列要約・Baseten最終・残件#1-4・不変確認）
- insights: `loops/loop-016/insights/001.md`〜`012.md` 全文（各抽出元・知見・反映先・反映内容・台帳未判断）および `insights/README.md`
- research: `research/common.md` v1.0（文法・給与提示・並び順・未記載・CTA・避ける表現・出典）＋ `research/case-a.md`〜`case-f.md` v1.0（first-check・persona・提示順・業界言い回し・pay制約・CTA・出典）
- 検出候補在庫: `tools/loop16-pagecheck.mjs` v1.1-candidate（4項目＋P6 HERO_P6_CONFIG、dict数13/13/4/6、出力 pages） / `tools/dicts/verification-phrases.json` 13 / `record-labels.json` 13 / `heading-scope.json` 4（全status candidate） / `tools/loop16-judge.mjs`（P1-P6カタログ、pairs読込、researchヒント、8000/12000） / `checks/pairs/pair-01/02/03.md`（3件 candidate） / `checks/case-*-gen-*-pagecheck.json/.md`・`judge.md/.json` 全30点（dup/verify/record/heading/heroP6の実測）
- vanilla: `vanilla/prompt-v1.0.md` v1.0（{{TICKET}} facts-only） / `vanilla/inputs/case-a.md`〜`case-f.md`（L01-L10 verbatim、sha256、v1.0 facts-only） / `vanilla/{wonder,spark}/case-*.html`（12LP、手直しなし、wonder 3件A/D/F 8000切断） / `vanilla/{wonder,spark}/case-*.meta.json`（prompt/completion/total・quota Meta） / `previews/images/` 18点並置コピー
- 統括版の不在確認: `docs/loop-015-016-insights-summary-20261102.md` は `read` で不存在（Git HEAD `fbd576f` 時点、手元 `docs/` 一覧でも不在）

