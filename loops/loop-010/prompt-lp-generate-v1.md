## system

You write Japanese LP (landing page) copy sentences for a fictional job posting, strictly from the approved FACT items given as materials.
Rules:
- Use only the stated FACT items. Never add information that is not in the FACTs.
- Write plain descriptive sentences only. No greetings, appeals, evaluations, or embellishment.
- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines). A sentence must cite at least one key and at least one line, and must cite every key and line it uses.
- Keep numbers, times, periods and conditions exactly as written in the FACT values (for example 時給1,500円, 月上限10,000円, 09:00〜18:00, 休憩60分, 実働8時間, 契約期間3か月). Do not convert, round, or rephrase quantities and conditions.
- monthlyDaysAssumption is a trial-calculation assumption (試算用の仮定): if you mention it, the sentence must say it is an assumption, and you must never present a monthly income figure. monthlyIncomeGuarantee says the monthly income is not guaranteed (保証しない): keep it a non-guarantee.
- Items listed as unstated have no value. Either omit them, or write a sentence that states only that the item is not stated (未記載), citing its key and line. Never assert a value for them (no 更新あり/なし, no 寮あり/なし).
- Output JSON only, no markdown fences.
Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}

## user

Materials for FICT-J01-facts version 1:
Stated FACT items (key / value / normalized / sourceLine / quote):
- employer: value="架空のソラノ輪具研究所" normalized=null sourceLine=L01 quote="企業名は架空のソラノ輪具研究所。"
- jobId: value="FICT-J01" normalized=null sourceLine=L01 quote="求人番号は FICT-J01。"
- workLocation: value="架空の青空実験区A棟" normalized=null sourceLine=L01 quote="勤務地は架空の青空実験区A棟。"
- employmentType: value="有期契約社員" normalized=null sourceLine=L02 quote="雇用形態は有期契約社員。"
- contractPeriod: value="3か月" normalized=null sourceLine=L02 quote="契約期間は3か月。"
- salaryHourly: value="時給1,500円" normalized=1500 sourceLine=L03 quote="給与は時給1,500円。"
- monthlyIncomeGuarantee: value="保証しない" normalized=null sourceLine=L03 quote="月収は保証しない。"
- workHours: value="09:00〜18:00" normalized=null sourceLine=L04 quote="勤務時間は09:00〜18:00、"
- breakMinutes: value="60分" normalized=60 sourceLine=L04 quote="休憩60分"
- actualHours: value="8時間" normalized=8 sourceLine=L04 quote="実働8時間"
- monthlyDaysAssumption: value="月20日勤務は試算用の仮定" normalized=null sourceLine=L04 quote="月20日勤務は試算用の仮定。"
- transport: value="実費支給" normalized=null sourceLine=L05 quote="交通費は実費支給"
- transportCap: value="月上限10,000円" normalized=10000 sourceLine=L05 quote="月上限10,000円。"
Unstated FACT items (no value exists; 未記載):
- renewal: 未記載 sourceLine=L02 quote="更新の有無は未記載。"
- housing: 未記載 sourceLine=L06 quote="寮の有無と費用は未記載。"

Write the LP copy sentences as JSON per schema.
