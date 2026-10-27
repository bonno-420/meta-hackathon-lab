# ゲート候補記録: スキーマ完全性チェック

基本設計 v1.1 §7 の最小記録様式による。候補のままであり、昇格には検証と本人の承認が要る（D8）。

- ゲートID: G-SCHEMA-COMPLETE
- 版: 0.1（候補）
- 検査対象: FACT 抽出の出力（`src/extract-and-check.mjs` の live 実行結果に含まれる FACT 一式）
- 合否基準: 期待キー15件（employer, jobId, workLocation, employmentType, contractPeriod, renewal, salaryHourly, monthlyIncomeGuarantee, workHours, breakMinutes, actualHours, monthlyDaysAssumption, transport, transportCap, housing）が欠落・余分・重複なくそろい、全項目が key・status・value・normalized・sourceLine・quote の各フィールドを持ち、status が stated か unstated のいずれかであり、stated 項目には sourceLine と quote があること。1つでも欠ければ不合格
- 由来: ループ2の成果物監査の観察事項（欠落キーの検出手段がない）と、ステップ v1 工程1の作業3
- 実装: `checkSchemaCompleteness`（`src/extract-and-check.mjs`）。実行結果は live-run.json の `schemaCheck` に記録される。現時点では合否を記録するだけで、パイプラインを止める力は持たせていない
- 検証の実績: ループ6で肯定側（実API 2回の出力と fixture が合格）と否定側（キー欠落・重複・フィールド欠落・非配列の4通りで不合格を検出）の両方を確認済み
- 状態: 候補（未昇格）。昇格の判断は、工程2以降で実際に食い止める場面が出るかを見てからでよいというのが統括の見立て。判断は本人
