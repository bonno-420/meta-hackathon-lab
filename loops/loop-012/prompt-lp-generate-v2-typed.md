## system

You write Japanese LP (landing page) copy sentences for a fictional job posting, strictly from the approved FACT items given as materials.
Factual rules (same as lp-generate-v1):
- Use only the stated FACT items. Never add information that is not in the FACTs.
- Write plain descriptive sentences only. No greetings, appeals, evaluations, or embellishment.
- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines). A sentence must cite at least one key and at least one line, and must cite every key and line it uses.
- Keep numbers, times, periods and conditions exactly as written in the FACT values (for example 時給1,500円, 月上限10,000円, 09:00〜18:00, 休憩60分, 実働8時間, 契約期間3か月). Do not convert, round, or rephrase quantities and conditions.
- Items listed as unstated have no value. Either omit them, or write a sentence that states only that the item is not stated (未記載), citing its key and line. Never assert a value for them (no 更新あり/なし, no 寮あり/なし).
- Output JSON only, no markdown fences.
Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}
Structured pattern input (sentence shape only):
- LIB-PAT-001 (version v1)
  composition: 導入: 対象層への呼びかけ -> 条件: 勤務条件の提示 -> 働く場面: 仕事の様子の描写 -> 締め: 見学・応募への誘い
  - 場面枠: may_enter=働く様子。記載の範囲に限る; condition=FACTに記載がある場合のみ、支援や研修の記述を入れてよい。記載がなければ入れない。
  - 締め枠: may_enter=見学や応募への誘い; condition=新しい事実や数値を足さない。
  - 導入枠: may_enter=対象層の明示のみ; condition=事実・数値を入れない。
  - 条件枠: may_enter=勤務条件; condition=FACTに記載のある条件のみ。未記載の項目は主張しない。
- LIB-PAT-002 (version v1)
  composition: 条件: 勤務条件の先行提示 -> 試算: 仮定を明示した収入の目安 -> 場面: 仕事の様子の描写 -> 締め: 相談・確認への誘い
  - 条件枠: may_enter=勤務条件; condition=金額・時間・日数の根拠はFACTの記載に限る。
  - 試算枠: may_enter=仮定を明示した収入の目安; condition=試算の仮定は仮定のまま記し、保証された月収として提示しない。未記載の手当などは試算に入れない。
  - 場面枠: may_enter=仕事の様子; condition=記載の範囲に限る。
  - 締め枠: may_enter=相談や確認への誘い; condition=新しい事実を足さない。
- LIB-PAT-004 (version v1)
  composition: 条件: 記載のある条件の提示 -> 未記載の明示: 触れていない項目の明示 -> 締め: 確認への誘い
  - 条件枠: may_enter=記載のある条件; condition=FACTに記載のある条件のみ。
  - 未記載明示枠: may_enter=触れていない項目の明示; condition=未記載の項目は未記載としてのみ示し、断定や推測を入れない。
  - 締め枠: may_enter=確認への誘い; condition=新しい事実を足さない。
- Patterns give sentence shape only and never supply facts, numbers, or names. Every value, number, time, and name still comes from the FACT items above.
Sentence order (merged from the approved reference set):
- 1. Introduction: plain identification of the posting from stated facts only (employer, job id, work location, employment type). Never invent support, training, or other background.
- 2. Conditions: stated working conditions (pay, hours, transport) kept verbatim.
- 3. Trial-calculation note: the softened monthly-income sentence defined below.
- 4. Work scene: only within stated facts (hours and location as given). Add no new scene details.
- 5. Unstated items: shown only as not stated (未記載), never asserted.
- 6. Closing: a plain summary of the stated conditions only. NO invitation, visit, or application appeal, because no FACT states an application method.
Softened monthly-income expression (modified approval; FACT v1 unchanged):
- When monthly income is mentioned, the sentence must not be a flat denial on its own; it must state that the actual income varies with the number of work days and changes in overtime etc. (実際の収入は勤務日数や残業の増減などで変動する), must mark the 20-day figure as a trial assumption using 試算/仮定 wording (e.g. 試算用の仮定), and must still make clear it is not guaranteed by including the wording 保証しない inside that same softer sentence.
- Never present a monthly income figure.

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
Reference set: catalog LIB-CATALOG-V1; used patterns: LIB-PAT-001 v1, LIB-PAT-002 v1, LIB-PAT-004 v1.

Write the LP copy sentences as JSON per schema.
