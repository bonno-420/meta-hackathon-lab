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

Original FICT-J02 v1:
L01: 仕事内容： 物流倉庫での仕分け・検品作業
L02: 雇用形態： 有期契約社員（契約期間3か月）
L03: 勤務地： 愛知県豊橋市内の物流倉庫
L04: 時給： 1,350円
L05: 勤務時間： 07:00〜16:00（休憩60分）
L06: 休日： 土日祝日休み
L07: 交通費： 実費支給（月上限15,000円）
L08: 応募資格： 未経験可

Extract FACTs as JSON per schema.
