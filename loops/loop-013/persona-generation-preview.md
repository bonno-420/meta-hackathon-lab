# ペルソナ生成文（確認用テキストプレビュー）

これは実験（ペルソナを意図層に入れた型あり生成）の文章を確認するためのテキストであり、公開プレビュー（`site/`）ではない。再検証の最終判定は人間の確認が未完了のため未確定であり、この文章はプレビュー許可の対象ではない。

- 生成物: `loops/loop-013/persona-generation.json`（6文、プロンプト版 `lp-generate-v3-persona`、モデル `muse-spark-1.3-contributor`）
- 型セット: LIB-PAT-002 v1、LIB-PAT-003 v1、LIB-PAT-004 v1 ／ 意図層: 話し手 S-01、ペルソナ P-01
- 機械検査: 入力同一性 pass、根拠検査の再実行 pass（6文）

## 全文

1. 架空のソラノ輪具研究所の求人番号FICT-J01で、勤務地は架空の青空実験区A棟、雇用形態は有期契約社員、契約期間は3か月です。
   - factKeys: `employer`, `jobId`, `workLocation`, `employmentType`, `contractPeriod` ／ sourceLines: `L01`, `L02`
2. 給与は時給1,500円で、月20日勤務は試算用の仮定であり、実際の収入は勤務日数や残業の増減などで変動するため、月収は保証しないことをお伝えします。
   - factKeys: `salaryHourly`, `monthlyDaysAssumption`, `monthlyIncomeGuarantee` ／ sourceLines: `L03`, `L04`
3. 勤務時間は09:00〜18:00、休憩60分、実働8時間の昼間の固定した時間帯です。
   - factKeys: `workHours`, `breakMinutes`, `actualHours` ／ sourceLines: `L04`
4. 交通費は実費支給で月上限10,000円です。
   - factKeys: `transport`, `transportCap` ／ sourceLines: `L05`
5. 契約期間は3か月で、更新の有無は未記載ですので、お気軽にお問い合わせください。
   - factKeys: `contractPeriod`, `renewal` ／ sourceLines: `L02`
6. 寮の有無と費用は未記載ですので、ご相談ください。
   - factKeys: `housing` ／ sourceLines: `L06`
