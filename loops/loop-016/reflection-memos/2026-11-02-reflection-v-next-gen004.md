# 反映メモ v-next gen-004 — gen-003書き込みからの反映

- 版: v-next-gen004 (2026-11-02)
- 作成: 統括 (Muse) が `memos/gen-003-memos.md` 6件を集約
- 元: `reflection-memos/lp-memo-case-*-gen-003-complete.md` 6件 + `memos/gen-003-memos.md`
- 対象世代: gen-004（入力は gen-003条件 + 本メモ）
- 基盤: research v1.0 維持、ケースfacts不変、テンプレートはgen-003版を基にR3-R8で調整
- 割り当て: R1・R2+ケース別 → 生成意図レイヤー / R3〜R7 → 組み立て側 / R8 → 画像配分
- 画像: 新規生成なし、既存3点を再配分（仕事写真主、場所写真最大1枚・小さく）

---

## R1: facts表と生成文の重複を減らす（生成側）

- 現状: 最初の表（The Basics）が10項目のfactsを全件並べ、直後の Pay & Hours / Place & Access / Team & Support でも同値を生成文が再掲する。二重掲載として `dupGroups 6-8` を検知。
- 反映: 生成文はfacts表が担う情報を再述しない。facts表は「一覧」として残し、生成文は「読み手への説明」に振る。同一数値の逐語再掲は避け、表が未掲載のニュアンス（例: フレックスの関係性）を文で補う。
- 禁止: 数値のverbatimは維持（4,800,000 / 08:30-17:00 等は正確に）。重複回避のために数値を落とさない。
- 検証: gen-004 pagecheckの `dupGroups` が gen-003比で減っているか。

## R2: 事実の扱い・注記を読み手視点で明確にする（生成側）

- 現状: C-A「勤務時間とフレックスの関係が分かりにくい」/ C-B「週5日なのに何曜日休みか気になる」/ C-D「15kg持つなら先に見たい」/ C-F「今週中に応募っていつまで？日付で見たい」。
- 反映: 生成文で以下を徹底。
  - 取得済みfactsの関係性を読みやすくする（例: C-Aの `Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)` はコアタイムの意味を文内で補足しつつ数値はverbatim）。
  - 日付がfactsにある場合は必ず日付で書く（C-Fの `6 weeks: 2026-12-01 to 2027-01-11` を「今週中」に置換しない）。
  - 未記載（例: C-Bの曜日固定有無、C-Dの5日の内訳）は推測せず、記載がない旨を明示するか触れない。
- 検証: personaレビューの `事実の扱い` 観点、散文評価の `needsFix` が増えていないか、judge P2（検証文混入）が再発していないか。

## R3: 冒頭の指示・方針文を置かない（組み立て側）

- 現状: heroのleadに `plan.appeal` がそのまま入る。例: C-A `Mentorship and code-review first; salary as fixed fact, no inflation. Emphasize commute and team rhythm.` / C-C `Explicit 12-month term...` / C-D `State employer separately...`。書き込みで全ケース「作る側への指示が残ってる」と指摘。
- 反映: 組み立て側で `plan.appeal` を hero lead に使わない。hero lead はfacts由来の第一確認項目の要約のみ（R5と連携）。appealは生成文側で自然に反映させる。
- 検証: 完成LPのhero領域に appeal由来の指示文（例: `Emphasize`, `State ... separately`, `Explicit term`）が残っていないか。

## R4: 内部フィールド名を表示しない（組み立て側）

- 現状: facts表のキー `employmentType`, `contractTerms`, `workHours` 等がそのまま左カラムに表示される。C-Cで「employmentTypeとかcontractTermsがそのままだと、求人よりデータ表を読んでる感じ」と指摘。
- 反映: 組み立て側でfact keyの表示ラベルを人間向けに変換する。例: `employmentType → Employment type` / `contractTerms → Contract terms` / `workHours → Work hours`。内部key名（camelCase）を露出させない。
- 禁止: factsの値自体は変えない。ラベルのみ変換。
- 検証: pagecheckの `recordExposure` に内部key名がヒットしないか、完成LPのfacts表に camelCase が残っていないか。

## R5: heroの第一確認項目を視覚的に際立たせる（組み立て側）

- 現状: gen-003でheroに第一確認項目は入ったが、badgesやleadの一文に埋もれる。書き込み: C-A「年収480万円がもっとパッと目に入ってほしい」/ C-B「日勤で夜勤なしなのが、もっと一目で分かるといい」/ C-E「3時間から・駅2分ってもっと短く見せてほしい」。
- 反映: 組み立て側でheroの第一確認項目を視覚的に強調する。例: hero-card内に `hero-highlight` ブロック（大きめフォント / アクセント色背景）を設け、第一確認項目の値（例: `Annual 4,800,000 JPY` / `Day shift 08:30-17:00 · No night duty` / `From 3 hours/day · 2-min walk`）を単独で目立たせる。badgesとleadは補助的に。
- 検証: 完成LPのhero領域に `hero-highlight` が存在し、P6 judgeのhero掲載判定が「ない」にならないか。

## R6: 応募前チェックは読み手の条件項目にする（組み立て側）

- 現状: チェック項目が `caseData.facts.slice(0,4)` の先頭4件（多くの場合 `company`, `role`, `location`）。書き込み: C-A「会社名にチェックを入れて何を確かめるんだろう」/ C-B「病院名や勤務地にチェックを入れる意味が分からない」/ C-F「店名より働ける期間や曜日を確認したい」。
- 反映: 組み立て側でチェック項目を読み手が確認したい条件に置換する。ケース別の条件優先順位:
  - C-A: Annual salary / Work hours (flex) / Commute / Training
  - C-B: Work hours (day shift) / Salary / Commute / Training
  - C-C: Employment type (12 months) / Contract terms / Salary / Work hours
  - C-D: Employer / Worksite / Pay / Work hours
  - C-E: Work hours (From 3h) / Commute (2-min walk) / Pay / Training
  - C-F: Term (6 weeks: 2026-12-01 to 2027-01-11) / Pay / Work hours / Commute
- 検証: 完成LPのチェック項目に `company`/`role` が先頭を占めていないか。

## R7: CTA文言を実際の次の行動と一致させる（組み立て側）

- 現状: ボタン文言が全ケース共通 `Apply — fictional posting, button disabled`、説明文も `caseData.plan.cta` の羅列。書き込み: C-C「ポートフォリオを出すなら、ボタンにもそう書いてある方が分かりやすい」/ C-D「Applyより『登録して職場見学』の方が次に何するか分かりやすい」/ C-E「履歴書なしなら、ボタンにもそう書いてあると押しやすい」。
- 反映: 組み立て側でCTAブロックのボタン文言と説明文をケース別に置換する。
  - C-A: `Apply with resume — casual first interview` / ボタン: `Apply with resume`
  - C-B: `Apply with license copy — reply within 3 business days` / ボタン: `Apply with license copy`
  - C-C: `Apply with one portfolio link — contract term in first screen` / ボタン: `Apply with portfolio link`
  - C-D: `Register with agency — site tour before assignment` / ボタン: `Register for site tour`
  - C-E: `Quick apply — no resume, casual chat first` / ボタン: `Quick apply — no resume needed`
  - C-F: `Apply this week — start 2026-12-01` / ボタン: `Apply this week`
- 検証: 各完成LPのCTAボタンにケース別の行動が明記されているか。

## R8: 画像配分を仕事中心に変更（画像配分、生成なし）

- 現状: gen-003は `work` 画像をconditions横、`place` 画像をlocation横に等大配置。書き込み: 全ケースで「街並みが2枚あると仕事の印象が薄い」「仕事の中身が分かる絵が欲しい」「倉庫の周りなのかよく分からない」「街の写真はちょっと大きい」。
- 反映: 新規画像生成はしない。既存3点（hero/work/place）の配分を変更する。
  - `work` 画像（仕事シーン）を主とする: conditions横に大きく配置（既存通り）。
  - `place` 画像（街・アクセス）は locationセクションに残すが、サイズを小さくし（例: `photo-sm` クラス）、キャプションで「周辺環境」であることを明示。teamセクションの `place` 2枚目相当は置かない（既に1枚のみだが、gen-001/002の2枚配置イメージを1枚に抑制）。
  - hero画像はそのまま活用。
- 検証: locationセクションの `place` 画像が `photo-sm` 等の小さめクラスで表示され、teamセクションに `place` 画像が重複配置されていないか。

---

## ケース別指示（生成意図レイヤー、R1・R2と併用）

### C-A: Full-time SaaS / Software Engineer — 年収とフレックスの明確化

- 生成で: `Annual 4,800,000 JPY` は heroとfacts表で担うため、生成文では給与への言及を1文に集約し重複を避ける。`Mon-Fri, 10:00-18:30 (flex core 11:00-16:00)` はフレックスのコアタイム意味（11:00-16:00は必ず在席、他は調整可能）を文内で補足する。`commute` の `Umeda Station` は駅名を明確に。
- 事実制約: 年収・時間帯はverbatim、コアタイムの推測を超える解釈はしない。

### C-B: Full-time Healthcare / Registered Nurse — 日勤固定と返信期限の明確化

- 生成で: `Day shift 08:30-17:00, 5 days/week; no scheduled night duty` は「夜勤なし」を否定形で明確に1文で完結させる。`reply within 3 business days` はCTAと連動しつつ、生成文末尾でも日数で明記する。
- 事実制約: 夜勤手当の創作禁止（mustNot）、曜日固定は未記載のため推測せず。

### C-C: Contract Marketing / Brand Specialist — 期間の重複解消と業務内容の前出し

- 生成で: `Contract, 12 months` と `Renewal review at month 11` は別文に分離し、12ヶ月契約の重複感を避ける。`ownership of 2 launches` は業務内容として具体性を出し、生成文の冒頭寄りに配置する。
- 事実制約: 正社員化の示唆禁止（mustNot）、契約期間はverbatim。

### C-D: Dispatched Logistics / Warehouse Associate — 要件とシフト選択肢の前出し

- 生成で: `able to stand/lift up to 15 kg` と `3-5 days/week selectable` は読み手の判断材料として早い段落に置く。`Apex Work Partners` と `Client distribution center in Saitama, Kawaguchi` は雇用元・就業先を混同させない分離を維持。
- 事実制約: 直接雇用の示唆禁止（mustNot）、派遣元と就業先の区別は厳守。

### C-E: Part-time Hospitality / Cafe Crew — 短時間と駅近の簡潔化

- 生成で: `From 3 hours/day, 2-4 days/week; 08:00-11:00 or 11:00-14:00` は時間枠の選択肢を箇条書き的に短くまとめる。`2-min walk from Futako-Tamagawa Station` は駅近の具体性を活かし、生成文では駅名を明記する。
- 事実制約: シフト柔軟性の過大示唆禁止（mustNot）、保育サービス創作禁止。

### C-F: Casual Retail / Seasonal Sales Associate — 期間端日の明示と土日の明確化

- 生成で: `6 weeks: 2026-12-01 to 2027-01-11` は端日を日付で必ず明記し「今週中に応募」の曖昧さを避ける。`weekends preferred` は任意か必須かのニュアンスを「preferred（優遇）」として正確に伝える。
- 事実制約: 延長示唆禁止（mustNot）、ボーナス創作禁止、期間はverbatim。

---

## 適用の記録

- 生成条件: Baseten `muse-spark-open-1026`, `max_tokens=12,000`, `temperature=0.4`, `research v1.0` + 本反映メモ v-next-gen004
- 組み立て: `loop16-complete.mjs` で R3〜R8 を条件分岐（gen === "004"）
- 検証: pagecheck / judge の gen-003対照 + 散文要修正数 + R1〜R8項目別の解消/部分/再発判定を `run-record.md` に記録
- 制約: `cases/` `research v1.0` `本体(工程1-6)` は不変、コミット・push なし
