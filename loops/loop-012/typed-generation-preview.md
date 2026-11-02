# 型あり生成文（確認用テキストプレビュー）

これは実験（型あり生成）の文章を確認するためのテキストであり、公開プレビュー（`site/`）ではない。再検証の最終判定は人間の確認が未完了のため未確定であり、この文章はプレビュー許可の対象ではない。

- 生成物: `loops/loop-012/typed-generation.json`（6文、プロンプト版 `lp-generate-v2-typed`、モデル `muse-spark-1.3-contributor`）
- 型セット: LIB-PAT-001 v1、LIB-PAT-002 v1、LIB-PAT-004 v1
- 機械検査: 入力同一性 pass、根拠検査の再実行 pass（6文）

## 全文

1. 架空のソラノ輪具研究所の求人番号はFICT-J01で、勤務地は架空の青空実験区A棟で、雇用形態は有期契約社員である。
   - factKeys: `employer`, `jobId`, `workLocation`, `employmentType` ／ sourceLines: `L01`, `L02`
2. 契約期間は3か月で、給与は時給1,500円で、勤務時間は09:00〜18:00で、休憩60分で、実働8時間で、交通費は実費支給で月上限10,000円である。
   - factKeys: `contractPeriod`, `salaryHourly`, `workHours`, `breakMinutes`, `actualHours`, `transport`, `transportCap` ／ sourceLines: `L02`, `L03`, `L04`, `L05`
3. 月20日勤務は試算用の仮定であり、実際の収入は勤務日数や残業の増減などで変動するもので、月収は保証しない。
   - factKeys: `monthlyDaysAssumption`, `monthlyIncomeGuarantee` ／ sourceLines: `L04`, `L03`
4. 勤務地は架空の青空実験区A棟で、勤務時間は09:00〜18:00である。
   - factKeys: `workLocation`, `workHours` ／ sourceLines: `L01`, `L04`
5. 更新の有無は未記載であり、寮の有無と費用は未記載である。
   - factKeys: `renewal`, `housing` ／ sourceLines: `L02`, `L06`
6. この求人は架空のソラノ輪具研究所の有期契約社員で、契約期間は3か月であり、給与は時給1,500円である。
   - factKeys: `employer`, `employmentType`, `contractPeriod`, `salaryHourly` ／ sourceLines: `L01`, `L02`, `L03`
