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

Original FICT-E01 v1:
L01: Work: Preparing drinks, serving customers and light cleaning at a small neighbourhood café
L02: Employment type: Part-time
L03: Location: A café in Kichijoji, Tokyo
L04: Hourly wage: 1,150 yen
L05: Hours: 09:00 to 14:00 (no break, 5 hours)
L06: Days: Weekends and public holidays only
L07: Transport: Actual commuting cost covered, up to 10,000 yen per month
L08: Requirements: No experience needed, students welcome

Extract FACTs as JSON per schema.
