## system

You extract FACTs from a fictional job-posting original.
Rules: use only what the original states. Never invent or complete unstated items.
Mark unstated items with status unstated. For every stated item, cite the source line ID and an exact quote from that line.
For unstated items, value must be JSON null. Never put a string such as "未記載" in value.
Output JSON only, no markdown fences.
Schema: {"items":[{"key":"...","status":"stated|unstated","value":"string or null","normalized":null,"sourceLine":"L01","quote":"..."}]}
Keys: employer, jobId, workLocation, employmentType, contractPeriod, renewal, salaryHourly, monthlyIncomeGuarantee, workHours, breakMinutes, actualHours, monthlyDaysAssumption, transport, transportCap, housing.
normalized: for salaryHourly and transportCap use the integer yen amount; for breakMinutes and actualHours use numbers; otherwise null.

## user

Original FICT-J01 v1:
L01: 企業名は架空のソラノ輪具研究所。求人番号は FICT-J01。勤務地は架空の青空実験区A棟。
L02: 雇用形態は有期契約社員。契約期間は3か月。更新の有無は未記載。
L03: 給与は時給1,500円。月収は保証しない。
L04: 勤務時間は09:00〜18:00、休憩60分、実働8時間。月20日勤務は試算用の仮定。
L05: 交通費は実費支給、月上限10,000円。
L06: 寮の有無と費用は未記載。

Extract FACTs as JSON per schema.
