# loop-015/016 監査レビュー報告 — 2026-11-02（監査ライン用）

作成: 監査ライン（OpenCode）。独立の立場で自己監査（`loops/loop-016/audit/self-audit-20261102.md`）をレビューする。
前提: 自己監査完了済み。`main` 最新 `1e11daf` 付近で実施。`git status` は `??`（HTML/webp・cache・demo資産）ありの想定内。
禁止遵守: 本体・`cases/`・`research/` 変更なし、コミット・pushなし、キー値出力なし（混入指摘はファイルと種別のみ）。

## 総合判定: **修正**（差し戻しなし）

- 差し戻し（秘密漏洩・本体書換・提出不能）に該当する所見なし。
- 修正（文書訂正・欠測補完・入口開示の追記で解消、再生成・再実験は不要。ただし1件のみjudge再実行または欠測注記が必要）。
- 提出（2026-11-05 11:00 JST）までに直すべきもの（§6-A）と、後回しでよいもの（§6-B）を分けた。

---

## 1. 方法の検証

| 領域 | 自己監査の方法 | 十分か | 抜け・弱点（本レビューの判定） |
|---|---|---|---|
| 1 着地完全性 | `run-record.md` 主張 vs `git ls-files` 件数・`Get-FileHash` sha256・`git status` html/webp追跡有無 | 概ね十分。ただし弱点あり | (a) `run-record.md` を正本に置く方式は、run-record自体の誤記を拾えない。本レビューで `run-record.md:719` の誤記を検出（§2-R1）。件数照合自体は正しい。(b) 未追跡HTML（loop-015 16件・loop-016 68件＋vanilla anon）は件数のみでバイト固定なし。`INDEX.md:21-22` の「記録対象外としローカルに残す」決定と整合するため欠陥ではないが、提出LPの固定としては manifest のみ。審査員導線としては別途注記が要る（§5）。 |
| 2 知見2版突合 | ライン版 I-1..I-8 vs 統括版 A-J(1..31) を1:1対応、数値は `run-record.md` を正本に再照合 | 手順は妥当だが、正本の置き方に弱点 | run-record正本主義では run-record:719 の誤記（gen-003 P1 2/6）を正としてしまう。`checks/case-*-gen-003-judge.md` 実物との三点照合が必要。本レビューは実物で裁定した（§3）。差異列挙自体は網羅的で、I-4/I-6欠落・D11-13追加・時差・P1乖離の4分類は正しい。 |
| 3 本体無変更 | `git diff fbd576f..HEAD --stat -- src/` と `git ls-tree -r fbd576f -- src` vs `HEAD -- src` のblob SHA比較 | 十分（結論は支持） | 表記のみ精緻化余地。`git diff --stat -- cases/ research/ tools/` はトップレベルに該当パスがなく空になるのが当然で、実質の検証は `loops/loop-016/cases/`・`research/`・`tools/` の追跡有無。本質（既存15ファイルSHA一致・追加4件のみ）は本レビューで再確認済み（§2）。厳密な空diff基準では不合格になる点を「条件付き合格」とした扱いは妥当。 |
| 4 秘密混入 | `git ls-files` 全文走査、パターン `b10_`/`API_KEY`/`sk-`/`secret`/`token`/`password`/email/long-hex/`LLM_` | 追跡対象には十分。ただし範囲に盲点 | (a) 未追跡HTML/webpを対象外としている。着地テキスト（完成LP可視文面）は未追跡側にあるため、第二走査で補完が必要（本レビュー§4で実施）。(b) パターンが env名・telemetry・ハッシュ中心で、webhook・DB接続文字列・秘密鍵等の高リスク型の明示走査がない。本レビューは別パターンで補完し、該当なしを確認した。(c) 値の再構築可能性の評価（prefix＋文字数のみで復元不能か）は文脈読みが必要で、自己監査は断定している。本レビューは文脈読みで支持した（§4）。 |
| 5 提出形棚卸し | `README.md` / `loops/*/README.md` / `docs/submission-text-v1.md` / 統括サマリを開示チェックリストで棚卸し | 十分。結論は支持 | 本レビューの再照合でも README入口の不可視3点（既存/期間・全モデル・Baseten実験・検証パス）と提出文TBDは再現した（§2）。充足/partial/missingの付け方は妥当。 |

---

## 2. サンプルの再照合（Git上の実物で再確認。全件再実施はしない）

### S-1 reviews件数（自己監査 1-01）→ 支持

- 実測: `git ls-files loops/loop-016/reviews` = 31（30件＋README）。内訳は case-A..F × gen-001..005 = 30。
- 実物例: `loops/loop-016/reviews/case-A-gen-003-review.md:1` が存在し、run-record 表（L56・L731）の「18（gen-001 6＋002 6＋004 6＋005 6）」には gen-003 6件が欠落。
- 判定: 自己監査 1-01（不一致・中）は正しい。処置（表を30に訂正、ファイル削除不要）は正しい。

### S-2 judge件数（自己監査 1-02）→ 支持

- 実測: `git ls-files loops/loop-016/checks` = 125。うち judge は `case-*-judge.json`＋`.md` で60ファイル＝30件（6×5）。
- run-record L57・L732の「24（6＋6＋6＋6＋6）」は算術誤り（6×5＝30）。24≠30。
- 判定: 自己監査 1-02（算術誤り・低）は正しい。

### S-3 P1反転数（自己監査 2-06の対象）→ ライン版が正、統括版が過少。run-recordにも誤記あり（新検出R1）

- 実物（`loops/loop-016/checks/case-*-gen-002-judge.md` vs `case-*-gen-003-judge.md` の `## P1` 行を全6ケース照合）:
  - gen-002 P1: Aある・Bある・Cある・Dある・Eある・Fある（6/6 ある）
  - gen-003 P1: Aない・Bない・Cない・Dない・Eある・Fある（ない 4/6）
  - 反転 ある→ない: C-A・C-B・C-C・C-D の4件。C-E・C-Fは ある→ある（残存）。
- 対照:
  - ライン版 `insights-consolidation-by-line-20261102.md:75-82` の表（A-D ある→ない、E-F ある→ある）は実物と一致。
  - 統括版 `docs/loop-015-016-insights-summary-20261102.md:57` の「C-A・C-BのP1・P4」はP1を2件に過少計上（C-C・C-D落とし）。
  - さらに `loops/loop-016/run-record.md:719` の世代表が gen-003 を「P1ない 2/6 (C-B/C-D)」としており、実物（4/6 A-D）と不一致。自己監査は run-recordを正本としたためこの誤記を検出していない。
- 判定: 自己監査 2-06の問題提起は正しいが、原因が「統括版の表記乖離」だけでなく「run-record:719の誤記」にあることを追加する。裁定は§3-R1のとおり。

### S-4 P4・P6反転（統括版F19の残り）→ 統括版の記述は正しい

- 実物（同上ファイルの `## P4`・`## P6` を照合）:
  - P4 gen-002→gen-003: A ある→ない、B ある→ない、C ある→ある、D ある→ある、E ある→ある、F ある→ある。反転はA・Bの2件のみ。
  - P6 gen-002→gen-003: A ない→ない、B ある→ない、C ない→ない、D ある→ない、E ある→ない、F ある→ない。反転はB・D・E・Fの4件（A・Cは元からない）。
- 統括版:57の「C-A・C-BのP4」「C-B・C-D・C-E・C-FのP6」は実物と一致。
- 判定: F19のうちP4・P6は正しい。P1のみ訂正対象。

### S-5 本体無変更（自己監査 3-01/3-02）→ 支持

- 実測: `git diff fbd576f..HEAD --stat -- src/` = 4 files 1000 insertions（typed/persona各本体＋test）。`git ls-tree -r fbd576f -- src/` 15件 vs `HEAD -- src/` 19件。
- 実物: `src/approve.mjs`・`src/generate.mjs`・`src/verify.mjs` のblob SHAは起点とHEADで一致（3件スポット確認）。
- 判定: 「既存15ファイルSHA一致・追加4件のみ」は正しい。条件付き合格の扱いは妥当。

### S-6 秘密・入口（自己監査 4-xx・5-xx）→ 支持

- 実物: `loops/loop-016/cache/connectivity-check.json:7` は `keySource` が env名のみ。`loops/loop-015/run-record.md:144,164` の鍵言及は前置詞＋省略＋文字数のみ。第二走査（§4）で未追跡HTMLにも鍵・メール・電話・webhookなしを確認。
- 実物: `README.md:1-78` に Baseten・画像・vanillaの列挙なし（grep 0）。`docs/submission-text-v1.md:5-7,25` はTBD残り。`loops/INDEX.md:21-22` は15/16のローカル残しを明記。
- 判定: 自己監査 4（合格）・5（修正）の結論は正しい。

### S-7 新検出: judgeファイルの欠損（自己監査では未検出）

- 実物: `loops/loop-016/checks/case-e-gen-005-judge.md` は40行で `## P4` の判定値が空、 `## P5`・`## P6` が存在しない。同世代の他5件は52-53行でP1-P6完備、gen-001の6件はP1-P5のみ（P6候補前のため正常）。
- 影響: P1は存在し「ない」のため、run-record:721・統括版:74の「gen-005 P1 4解消（C-A/D/E/F）」の計数には影響しない。ただしC-E gen-005のP4/P6に関する主張は検証不能。
- 判定: ファイル数では検出できない質的欠損。自己監査の方法（件数計数）では拾えない。本レビューの追加所見R2として扱う（§6-A）。

---

## 3. 知見まとめ突合の裁定（2版の差異ごとにどちらが正しいか。編集は統括が行う）

| # | 差異 | 根拠（run-record・実測） | 裁定 | 統括版の直し方（編集は統括） |
|---|---|---|---|---|
| R1 | gen-003 P1反転数。ライン78「4件（A-D）」 vs 統括57「2件（A-B）」。run-record:719「2/6 (C-B/C-D)」 | 実物§S-3で4件（A-D）を確認。run-record:719が2/6と誤記しており、統括版はそれを引き継いだと推定 | **ライン版が正** | 統括版:57のP1部分を「C-A・C-B・C-C・C-DのP1」に訂正。同時に run-record:719の「2/6 (C-B/C-D)」を「4/6 (C-A/C-B/C-C/C-D)」に訂正（両者は同根）。P4（A・B）・P6（B・D・E・F）の記述は現行維持 |
| R2 | I-4持続パターン（大文字・ラベル・filler）の統括版での扱い。ライン161 vs 統括58,70で断片のみ | 統括版全文に持続パターンの系統表なし（grepで該当語なし）。run-record:193-200,501-510に個別記録あり。矛盾でなく章立て漏れ（自己監査2-01と一致） | **ライン版が正（欠落は事実）**。提出可否には影響しない | 台帳昇格時に統括版へ追記。例: F20の次に「I-4由来: 文中大文字・ラベル開き・fillerは002-006全連鎖で持続。insights指示だけでは消えず、生成プロンプト側の明示強化を次ループへ持越し（012台帳未判断）」の1段落。提出前の必須ではない（§6-B） |
| R3 | I-6画像規格の統括版での扱い。ライン173 vs 統括89の1行 | 統括版:89はファイル確認のみの1行。run-record:61,96,310-326,736の18点・パレット・no text/numbers/logosの規格記述はライン側のみ | **ライン版が正（圧縮は事実）** | 同上、台帳昇格時に1行→1段落へ。例: 「画像18点は文脈分離・no text/numbers/logos・パレット6種・place photo-sm。完成LPスクショ範囲で混入指摘なし（未測定の目視確認は残件）」。提出前必須ではない |
| R4 | D11キー取り違え401。統括42-43 vs ライン管外（自己監査2-03「run-record該当なし」） | `loops/loop-015/run-record.md:144,164` に401・原因・修正・再実行で全6世代成功・diag 200の記録あり。loop-016 run-recordにはなし（管轄差） | **統括版が正（出典はloop-015側）**。自己監査2-03の「判定不能」はloop-016管内に限れば正しいが、loop-015側に根拠あり | 統括版維持＋出典補記。D11末尾に「（出典: loops/loop-015/run-record.md:144,164）」を付す。再検証不要 |
| R5 | D12言語混在・D13工程順逸脱。統括44-45 vs ライン管外 | run-record全文に「中途半端」「逸脱」「先行」等の直接記述なし（grep 0）。loop-015 run-record:66,74-75,145,163に言語・系統の事実はあるが評価語なし。運用・本人判定由来と推定 | **統括版維持。ただしrun-record正本では検証不能** | 統括版維持＋出典の注記化。例: D12/D13末尾に「（run-record外・本人指摘由来。工程記録への昇格は別途）」。提出前必須ではない。誤りと断定しない |
| R6 | G21-23本人メモ読取。統括60-64 vs ライン89-90（R3-R8集約） | 両者ともメモ6件・検出0後の露出・際立ち・繰り返し感の事実は一致。粒度差（原文評価 vs 反映結果集約）のみ | **両者正（抽象度差）** | 直し不要。台帳昇格時に両版の対応表を残す程度 |
| R7 | J29-31 vanilla評価。ライン263-266「作成済・評価未実施」 vs 統括77-82「実施済」 | `loops/loop-016/vanilla/evaluation/blind-evaluation-20261102.md`（12:16 JST、judge18＋review18＋対応表＋3軸）が実在。run-record:447-489作成・:723,744未実施は時点正、評価は新セッションで追加実施の時差（自己監査2-05と一致）。数値（Wonder 3/6切断等）は一致確認済み | **統括版が正（時差解消済）** | ライン版への追記は不要。ただし run-record:723,744の「評価未実施」が残ると提出物間で矛盾するため、run-record側を「評価済（別途ファイル参照）」に更新する（統括の文書訂正、§6-A） |
| R8 | I-8/R1競合の解釈。ライン183-185 vs 統括67-69,74 | 数値（dup中央値・occ・P1 1/6→4/6等）は両版一致。残件の帰属（assemblyで直せる／生成側残件）も一致 | **両者正** | 直し不要 |

- 付記: C gen-003のP5（ない→あるへの悪化）は両版とも言及なし。分類精度の残件として低重大度で残す（§6-B）。陰性対照の主張（F19「全項目あるしか返さない検出器ではない」）はP1・P4・P6の反転実測で支持される。

---

## 4. 秘密情報チェックの第二走査（自己監査と別の観点。未追跡HTMLを含む）

- 観点の違い: 自己監査は追跡対象（640件）を既定パターンで走査。本レビューは (a) 未追跡の着地テキスト（`loops/loop-015/previews/*.html`・`loops/loop-016/previews/*.html`・`vanilla/evaluation/anon/*.html`）を含む、(b) 高リスク型（秘密鍵・クラウド鍵・Slack/Discord webhook・DB接続文字列・bearer・発行済みトークン形式）を追加、(c) 文脈読み（keySource・接続ログ・redacted行の再構築可能性）で判定。自己監査と同じ方法のなぞりはしない。
- 結果:
  - 高リスク型: `BEGIN.*PRIVATE KEY`・`AKIA|ASIA|AIza|xox[bap]-|ghp_|github_pat_|whsec_|hooks.slack|discord.com/api/webhooks` を loops配下で走査。ヒットはbase64画像行（`data:image/webp;base64,`）のみで、除外後は0。別角度の `API_KEY|MODEL_API_KEY|BASETEN_API_KEY|sk-|b10_` を previews配下で走査し0。メール・電話・webhook型も previews配下で0。
  - 文脈読み: `loops/loop-016/cache/connectivity-check.json:7` は env名のみで値なし。usage・rawResponseSnippetはトークン数とIDのみ。`loops/loop-015/run-record.md:144,164` の鍵言及は前置詞＋省略＋文字数のみで、残り約40文字のエントロピーから再構築不能の評価は支持される。`localStorage` キーは `lp-memo:` のフォーム保存用で送信先サーバーなし（run-record:148と整合）。
  - 判定: **合格**。高リスク所見なし。自己監査の合格結論を支持する。なおbase64行へのパターン一致は除外処理が必要という運用知見のみ残す（提出前対応不要）。
  - 指摘（ファイルと種別のみ、値は転記しない）: なし。

---

## 5. 提出形（自己監査領域5の再確認）

- 再照合結果: `README.md:9` 位置づけ・`:15-16` リンク・`:19-28` 仕組み・`:33-37` プロセス改善・`:42-48` 証拠索引・`:52-70` 実行手順・オフライン5種・`:74` モデル・`:76-78` MITは present。`README.md` での Baseten・画像・vanilla列挙なし、`submission-text-v1.md:5-7,25` のTBD、`docs/loop-015-016-insights-summary-20261102.md` での正規モデルID列挙なしは再現した。
- 判定: 自己監査 5-01〜5-05（修正・中中心）は正しい。処置の方向（README §1/§7/§8への1段落追記、サマリへの正規ID1行、提出文の日付・動画・Baseten1行）は支持する。具体文面の作成・編集は本レビューでは行わない。

---

## 6. 修正指示（実施は統括・本人が行う。本レビューでは実施しない）

### A. 提出（11/05 11:00 JST）までに直すべきもの

- A1 run-record:719の訂正: gen-003 judge P1「2/6 (C-B/C-D)」→「4/6 (C-A/C-B/C-C/C-D)」。証拠は§S-3の実物。統括版:57のP1も連動訂正（§3-R1の文面）。
- A2 `loops/loop-016/checks/case-e-gen-005-judge.md` の欠損解消: `## P4` の空欄と `## P5`・`## P6` の欠落を解消する（judge再実行または欠測注記）。P1は存在するためR1計数には影響しないが、P4/P6の検証可能性のために必須。再実行でP1が変われば run-record:721・統括版:74も連動更新。
- A3 run-record:56-57,731-732の件数訂正（自己監査1-01/1-02の処置）: レビュー「18」→「30（5世代分、gen-003含む）」、ジャッジ「24」→「30（6×5）」。算術注記を添える。
- A4 README入口の最小追記（審査員が入口しか見ないリスクへの対応）: 既存/期間の1文、全モデル列挙（5件＋vanilla）、認証なし検証パス（hash＋pagecheck）への導線1段落、Baseten実験の分離note。文面は統括が作成。
- A5 提出文の提出可化: 項目名確定・日時・動画・Baseten1行の埋め。TBDのまま提出しない。
- A6 run-record:723,744の更新: vanilla「評価未実施」→「評価済（`vanilla/evaluation/blind-evaluation-20261102.md` 参照）」。提出物間の矛盾を残さない。

### B. 後回しでよいもの（提出後・台帳昇格時）

- B1 I-4・I-6の統括版追記（§3-R2/R3の文面案）。
- B2 D12/D13の出典注記化（§3-R5）。
- B3 D11の出典付記（§3-R4、1行追記のみ）。
- B4 C gen-003 P5の悪化（ない→ある）の記録。分類精度の候補として残す。
- B5 `git diff --stat -- cases/ research/ tools/` 表記の精緻化（トップレベルとloops配下の区別）。
- B6 judge P6 candidateの恒常化判断（本人承認待ちのまま残す）。

---

## 監査証跡（本レビューの再現コマンド、値の転記なし）

```powershell
git log --oneline -3; git status --short
git ls-files loops/loop-015 | Measure-Object -Line
git ls-files loops/loop-016 | Measure-Object -Line
git ls-files loops/loop-016/reviews | Measure-Object -Line
git ls-files loops/loop-016/checks | Measure-Object -Line
git ls-files loops/loop-015/previews; git ls-files loops/loop-016/previews
git ls-files loops/loop-016/vanilla/spark; git ls-files loops/loop-016/vanilla/wonder
git diff fbd576f..HEAD --stat -- src/
git ls-tree -r fbd576f -- src/approve.mjs src/generate.mjs src/verify.mjs
git ls-tree -r HEAD -- src/approve.mjs src/generate.mjs src/verify.mjs
Select-String -Pattern "API_KEY|MODEL_API_KEY|BASETEN_API_KEY|sk-|b10_" -Path loops/loop-015/previews/*,loops/loop-016/previews/*
```

```text
checks実物照合: loops/loop-016/checks/case-{a..f}-gen-{002,003,004,005}-judge.md の ## P1/P4/P6 行を目視・機械抽出で対照（本報告§S-3/S-4/S-7）
知見突合: loops/loop-016/insights-consolidation-by-line-20261102.md:70-119 と docs/loop-015-016-insights-summary-20261102.md:50-89 を対応表で照合
秘密第二走査: 高リスク型＋文脈読み（connectivity-check.json:7、run-record.md:144,164、previews配下0件）を別パターンで実施
```

---

*本報告は監査ラインのレビューである。修正の実施・コミット・pushは行わない。統括が上記A/Bで整形し、本人の確認を経て残り枠で適用する。*
