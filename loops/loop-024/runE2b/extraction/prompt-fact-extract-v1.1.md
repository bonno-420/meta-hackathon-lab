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
L01: Work: Assembling small wooden frames and sanding parts by hand in a small workshop
L02: Employment type: Contract, 6 months
L03: Location: A workshop in Taito City, Tokyo
L04: Hourly wage: 1,400 yen
L05: Hours: 08:30 to 17:30 (break 60 minutes, 8 hours)
L06: Days: Monday to Friday
L07: Transport: Actual commuting cost covered, up to 15,000 yen per month
L08: Requirements: Experience with hand tools is welcome, training is provided

Extract FACTs as JSON per schema.
