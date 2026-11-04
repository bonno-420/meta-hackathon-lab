// Loop2 minimal proof: FICT-J01 v1 FACT extraction + reconciliation (E01/E02).
// Fictional data only. No generation stage. Single run, no auto-retry.
// API key is read only from env MODEL_API_KEY and never logged.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Endpoint selection: defaults are the Meta Model API and the
// contributor model, exactly as before. PIPELINE_BASE_URL /
// PIPELINE_MODEL / PIPELINE_MAX_TOKENS let the same tool run against
// another OpenAI-compatible endpoint (e.g. Baseten's Muse Spark
// Open for the live verification runs, loop-022). When the model is
// overridden, the D4 contributor rates do not apply, so costs are
// left unrecorded rather than computed at the wrong rate.
const MODEL = process.env.PIPELINE_MODEL ?? "muse-spark-1.3-contributor";
const BASE_URL = process.env.PIPELINE_BASE_URL ?? "https://api.meta.ai/v1";
const MAX_TOKENS = process.env.PIPELINE_MAX_TOKENS ? Number(process.env.PIPELINE_MAX_TOKENS) : null;
const RATES_KNOWN = !process.env.PIPELINE_MODEL;
const INPUT_ID_DEFAULT = "FICT-J01";
const INPUT_VERSION_DEFAULT = "v1";
// D4 rates for muse-spark-1.3-contributor (USD per 1M tokens).
const RATE_INPUT_PER_1M = 0.10;
const RATE_OUTPUT_PER_1M = 0.20;

// Step-1 options (loop-006). Defaults preserve the loop-002 behavior.
// --out-dir <path>  : write run artifacts here instead of loops/loop-002.
//                     The audited loop-002 records must never be overwritten
//                     by a rerun (steps v1, audit M5).
// --prompt v1.1     : use prompt fact-extract-v1.1 (single-factor change:
//                     unstated items must carry value null, never a string).
// --prompt v1.3     : use prompt fact-extract-v1.3 (single-factor change:
//                     the monthlyIncomeGuarantee definition, see buildMessages).
// --prompt v1.4     : use prompt fact-extract-v1.4 (single-factor change:
//                     the value's language follows the original, see buildMessages).
const argv = process.argv.slice(2);
function argValue(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}
const PROMPT_VERSION = argValue("--prompt") === "v1.4" ? "fact-extract-v1.4" : argValue("--prompt") === "v1.3" ? "fact-extract-v1.3" : argValue("--prompt") === "v1.2" ? "fact-extract-v1.2" : argValue("--prompt") === "v1.1" ? "fact-extract-v1.1" : "fact-extract-v1";
// Input selection (fix F1): defaults preserve the FICT-J01 behaviour
// exactly. --original <file>, --input-id <id> and --input-version <v>
// let the same extraction run against a pinned posting text artifact
// produced by the text entry (src/pin-posting.mjs). The FACT key set
// stays the job-domain schema of this tool.
const INPUT_ID = argValue("--input-id") ?? INPUT_ID_DEFAULT;
const INPUT_VERSION = argValue("--input-version") ?? INPUT_VERSION_DEFAULT;
const ORIGINAL_FILE = argValue("--original");

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDirArg = argValue("--out-dir");
const outDir = outDirArg
  ? (path.isAbsolute(outDirArg) ? outDirArg : path.join(root, outDirArg))
  : path.join(root, "loops", "loop-002");

// The full FACT key set the extraction prompt requires. Used by the
// schema-completeness check (gate candidate, steps v1 step 1 item 3).
const EXPECTED_KEYS = [
  "employer", "jobId", "workLocation", "employmentType", "contractPeriod",
  "renewal", "salaryHourly", "monthlyIncomeGuarantee", "monthlySalary",
  "salaryDaily", "salaryAnnual", "workHours",
  "breakMinutes", "actualHours", "monthlyDaysAssumption", "transport",
  "transportCap", "housing",
];
const ITEM_FIELDS = ["key", "status", "value", "normalized", "sourceLine", "quote"];

// Schema-completeness check: detects missing, extra or duplicate keys and
// items with missing fields. Returns a verdict object; it does not stop the
// pipeline by itself (it is recorded as a gate candidate, not a gate).
export function checkSchemaCompleteness(facts) {
  if (!facts || !Array.isArray(facts.items)) {
    return { pass: false, reason: "facts.items is not an array", expectedCount: EXPECTED_KEYS.length, actualCount: 0, missingKeys: [...EXPECTED_KEYS], extraKeys: [], duplicateKeys: [], fieldIssues: [] };
  }
  const keys = facts.items.map((i) => i && i.key);
  const missingKeys = EXPECTED_KEYS.filter((k) => !keys.includes(k));
  const extraKeys = keys.filter((k) => !EXPECTED_KEYS.includes(k));
  const duplicateKeys = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  const fieldIssues = [];
  for (const item of facts.items) {
    if (!item || typeof item !== "object") { fieldIssues.push({ key: null, issue: "item is not an object" }); continue; }
    for (const f of ITEM_FIELDS) {
      if (!(f in item)) fieldIssues.push({ key: item.key ?? null, issue: `missing field: ${f}` });
    }
    if (item.status !== "stated" && item.status !== "unstated") {
      fieldIssues.push({ key: item.key ?? null, issue: `invalid status: ${String(item.status)}` });
    }
    if (item.status === "stated" && (!item.sourceLine || !item.quote)) {
      fieldIssues.push({ key: item.key ?? null, issue: "stated item without sourceLine or quote" });
    }
  }
  const pass = missingKeys.length === 0 && extraKeys.length === 0 && duplicateKeys.length === 0 && fieldIssues.length === 0;
  return { pass, expectedCount: EXPECTED_KEYS.length, actualCount: facts.items.length, missingKeys, extraKeys, duplicateKeys, fieldIssues };
}

// Quote-verbatim check: every item's sourceLine must exist in the original
// and its quote must be an exact substring of that line's text. This is a
// separate check from schema completeness (different inputs, different
// question), per the step-1 audit (F2).
export function checkQuoteVerbatim(facts, original) {
  const lines = new Map(original.lines.map((l) => [l.id, l.text]));
  const issues = [];
  if (!facts || !Array.isArray(facts.items)) {
    return { pass: false, reason: "facts.items is not an array", checked: 0, issues };
  }
  for (const item of facts.items) {
    // An unstated item has two legitimate forms: the original
    // explicitly declares the item 未記載 and the item cites that
    // line (the adopted FICT-J01 facts), or the original is simply
    // silent and the item carries no source reference at all (a raw
    // posting through the text entry, loop-022). Both pass; a
    // half-filled reference does not. An empty string is how an
    // extraction model writes "absent" — it is normalized to null
    // here (runE2g, 2026-11-04: sourceLine "" on unstated items
    // stopped a run at facts-comparison).
    const sl = item.sourceLine === "" ? null : (item.sourceLine ?? null);
    const q = item.quote === "" ? null : (item.quote ?? null);
    if (item.status === "unstated" && sl === null && q === null) {
      continue;
    }
    if (sl === null || q === null) {
      issues.push({ key: item.key ?? null, issue: "source reference is incomplete (sourceLine and quote must both be present, or both absent on an unstated item)" });
      continue;
    }
    const line = lines.get(sl);
    if (line === undefined) {
      issues.push({ key: item.key ?? null, issue: `sourceLine not found: ${String(sl)}` });
    } else if (typeof q !== "string" || !line.includes(q)) {
      issues.push({ key: item.key ?? null, issue: "quote is not a verbatim substring of the source line" });
    }
  }
  return { pass: issues.length === 0, checked: facts.items.length, issues };
}

export function loadOriginal(file) {
  const p = file ? (path.isAbsolute(file) ? file : path.join(root, file)) : path.join(here, "fict-j01-v1.json");
  const raw = readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function originalText(original) {
  return original.lines.map((l) => `${l.id}: ${l.text}`).join("\n");
}

// E02 evaluation input (fictional). Single-factor change: hourly wage only.
const E02_SUMMARY =
  "ソラノ輪具研究所（FICT-J01）の概要: 時給1,700円。勤務時間は09:00〜18:00、休憩60分、実働8時間。交通費は実費支給、月上限10,000円。勤務地は架空の青空実験区A棟。雇用形態は有期契約社員、契約期間は3か月。";

export function buildMessages(original) {
  const isV11 = PROMPT_VERSION === "fact-extract-v1.1" || PROMPT_VERSION === "fact-extract-v1.2" || PROMPT_VERSION === "fact-extract-v1.3" || PROMPT_VERSION === "fact-extract-v1.4";
  const isV12 = PROMPT_VERSION === "fact-extract-v1.2";
  const isV13 = PROMPT_VERSION === "fact-extract-v1.3";
  const isV14 = PROMPT_VERSION === "fact-extract-v1.4";
  const hasPayKeys = isV12 || isV13 || isV14;
  const system = [
    "You extract FACTs from a fictional job-posting original.",
    "Rules: use only what the original states. Never invent or complete unstated items.",
    "Mark unstated items with status unstated. For every stated item, cite the source line ID and an exact quote from that line.",
    // fact-extract-v1.1 single-factor change: the value representation of
    // unstated items. Loop-002's v1 output put the string "未記載" there;
    // v1.1 requires JSON null and says so in both the rule and the schema.
    ...(isV11 ? ["For unstated items, value must be JSON null. Never put a string such as \"未記載\" in value."] : []),
    "Output JSON only, no markdown fences.",
    isV11
      ? 'Schema: {"items":[{"key":"...","status":"stated|unstated","value":"string or null","normalized":null,"sourceLine":"L01","quote":"..."}]}'
      : 'Schema: {"items":[{"key":"...","status":"stated|unstated","value":"...","normalized":null,"sourceLine":"L01","quote":"..."}]}',
    hasPayKeys
      ? "Keys: employer, jobId, workLocation, employmentType, contractPeriod, renewal, salaryHourly, monthlyIncomeGuarantee, monthlySalary, salaryDaily, salaryAnnual, workHours, breakMinutes, actualHours, monthlyDaysAssumption, transport, transportCap, housing."
      : "Keys: employer, jobId, workLocation, employmentType, contractPeriod, renewal, salaryHourly, monthlyIncomeGuarantee, workHours, breakMinutes, actualHours, monthlyDaysAssumption, transport, transportCap, housing.",
    // fact-extract-v1.2 (the user's pay-display decision, 2026-11-04):
    // pay is recorded in the form the posting states it. Before this,
    // a monthly salary had no key and the extraction flipped between
    // runs on monthlyIncomeGuarantee (FICT-J03, measured three times).
    // fact-extract-v1.4 (2026-11-05, loop-030) single-factor change:
    // the recorded value's language. v1.3 fixed the value to the
    // Japanese string 保証しない (copied from the Japanese reference
    // facts), so an English original's FACT carried a Japanese value.
    // v1.4 keeps v1.3's rule and requires the value in the original's
    // own language and wording, never translated.
    // fact-extract-v1.3 (2026-11-05, loop-030) single-factor change:
    // only the monthlyIncomeGuarantee definition line. The v1.2 wording
    // ("ONLY an explicitly guaranteed minimum") made the model drop an
    // explicitly stated non-guarantee ("Monthly income is not
    // guaranteed") to unstated, contradicting the adopted reference
    // facts (FICT-J01: stated, value 保証しない) and the generator's own
    // definition of the key. A stated denial is a stated fact.
    ...(hasPayKeys ? [
      "Pay keys: record the pay in the form the posting states it — salaryHourly for an hourly wage (時給), salaryDaily for a daily wage (日給), monthlySalary for a monthly salary (月給), salaryAnnual for an annual salary (年俸). Only the stated form is stated; the other pay keys are unstated.",
      isV14
        ? "monthlyIncomeGuarantee records what the original states about a monthly income guarantee. If the original states a guaranteed minimum monthly income, record that amount. If the original explicitly states that monthly income is NOT guaranteed, record it as stated, with the value in the original's own language and wording (月収は保証しない for a Japanese original, not guaranteed for an English one) — an explicit non-guarantee is a stated fact, not an absence, and a value is never translated into another language. A starting monthly salary by itself is neither: record it as monthlySalary, never as monthlyIncomeGuarantee."
        : isV13
        ? "monthlyIncomeGuarantee records what the original states about a monthly income guarantee. If the original states a guaranteed minimum monthly income, record that amount. If the original explicitly states that monthly income is NOT guaranteed (月収は保証しない / monthly income is not guaranteed), record it as stated with the value 保証しない — an explicit non-guarantee is a stated fact, not an absence. A starting monthly salary by itself is neither: record it as monthlySalary, never as monthlyIncomeGuarantee."
        : "monthlyIncomeGuarantee is ONLY an explicitly guaranteed minimum monthly income. A starting monthly salary is not a guarantee: record it as monthlySalary, never as monthlyIncomeGuarantee.",
    ] : []),
    hasPayKeys
      ? "normalized: for salaryHourly, monthlySalary, salaryDaily, salaryAnnual and transportCap use the integer yen amount; for breakMinutes and actualHours use numbers; otherwise null."
      : "normalized: for salaryHourly and transportCap use the integer yen amount; for breakMinutes and actualHours use numbers; otherwise null.",
  ].join("\n");
  const user = `Original ${INPUT_ID} ${INPUT_VERSION}:\n${originalText(original)}\n\nExtract FACTs as JSON per schema.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function promptText() {
  const original = loadOriginal(ORIGINAL_FILE);
  const msgs = buildMessages(original);
  return msgs.map((m) => `## ${m.role}\n\n${m.content}`).join("\n\n") + "\n";
}

// Hand-derived fixture from FICT-J01 v1. Used ONLY for offline logic
// verification. This is not model output.
export function fixtureFacts() {
  return {
    source: "fixture-hand-derived-from-FICT-J01-v1",
    items: [
      { key: "employer", status: "stated", value: "ソラノ輪具研究所", normalized: null, sourceLine: "L01", quote: "企業名は架空のソラノ輪具研究所。" },
      { key: "jobId", status: "stated", value: "FICT-J01", normalized: null, sourceLine: "L01", quote: "求人番号は FICT-J01。" },
      { key: "workLocation", status: "stated", value: "青空実験区A棟", normalized: null, sourceLine: "L01", quote: "勤務地は架空の青空実験区A棟。" },
      { key: "employmentType", status: "stated", value: "有期契約社員", normalized: null, sourceLine: "L02", quote: "雇用形態は有期契約社員。" },
      { key: "contractPeriod", status: "stated", value: "3か月", normalized: null, sourceLine: "L02", quote: "契約期間は3か月。" },
      { key: "renewal", status: "unstated", value: null, normalized: null, sourceLine: "L02", quote: "更新の有無は未記載。" },
      { key: "salaryHourly", status: "stated", value: "時給1,500円", normalized: 1500, sourceLine: "L03", quote: "給与は時給1,500円。" },
      { key: "monthlyIncomeGuarantee", status: "stated", value: "保証しない", normalized: null, sourceLine: "L03", quote: "月収は保証しない。" },
      { key: "monthlySalary", status: "unstated", value: null, normalized: null, sourceLine: null, quote: null },
      { key: "salaryDaily", status: "unstated", value: null, normalized: null, sourceLine: null, quote: null },
      { key: "salaryAnnual", status: "unstated", value: null, normalized: null, sourceLine: null, quote: null },
      { key: "workHours", status: "stated", value: "09:00〜18:00", normalized: null, sourceLine: "L04", quote: "勤務時間は09:00〜18:00" },
      { key: "breakMinutes", status: "stated", value: "60分", normalized: 60, sourceLine: "L04", quote: "休憩60分" },
      { key: "actualHours", status: "stated", value: "8時間", normalized: 8, sourceLine: "L04", quote: "実働8時間" },
      { key: "monthlyDaysAssumption", status: "stated", value: "月20日勤務（試算用の仮定）", normalized: null, sourceLine: "L04", quote: "月20日勤務は試算用の仮定。" },
      { key: "transport", status: "stated", value: "実費支給", normalized: null, sourceLine: "L05", quote: "交通費は実費支給" },
      { key: "transportCap", status: "stated", value: "月上限10,000円", normalized: 10000, sourceLine: "L05", quote: "月上限10,000円。" },
      { key: "housing", status: "unstated", value: null, normalized: null, sourceLine: "L06", quote: "寮の有無と費用は未記載。" },
    ],
  };
}

function factByKey(facts, key) {
  return facts.items.find((i) => i.key === key) || null;
}

function parseYen(text) {
  if (!text) return null;
  const m = text.replace(/,/g, "").match(/(\d+)\s*円/);
  return m ? Number(m[1]) : null;
}

function extractSummaryClaims(summary) {
  const claims = {};
  const wage = summary.match(/時給\s*([\d,]+)\s*円/);
  if (wage) claims.salaryHourly = { value: Number(wage[1].replace(/,/g, "")), snippet: wage[0] };
  const hours = summary.match(/(\d{2}:\d{2})\s*[〜~\-]\s*(\d{2}:\d{2})/);
  if (hours) claims.workHours = { value: `${hours[1]}〜${hours[2]}`, snippet: hours[0] };
  const cap = summary.match(/月上限\s*([\d,]+)\s*円/);
  if (cap) claims.transportCap = { value: Number(cap[1].replace(/,/g, "")), snippet: cap[0] };
  return claims;
}

// Mechanical reconciliation. Numeric/version/ID agreement is checked here;
// semantic equivalence beyond these fields is left to human review.
// Exported for the text entry (fix F1): a pinned posting is reconciled
// against its own text (the E01-side input), which checks that the
// extraction is consistent with the source it was extracted from.
export function reconcile(facts, summary, caseId) {
  const claims = extractSummaryClaims(summary);
  const contradictions = [];
  const matched = [];

  const salary = factByKey(facts, "salaryHourly");
  if (claims.salaryHourly && salary && salary.status === "stated") {
    if (claims.salaryHourly.value !== salary.normalized) {
      contradictions.push({
        field: "給与（時給）",
        factValue: salary.value,
        factSource: `${salary.sourceLine}「${salary.quote}」`,
        summaryValue: `時給${claims.salaryHourly.value.toLocaleString("ja-JP")}円`,
        summarySnippet: claims.salaryHourly.snippet,
      });
    } else {
      matched.push({ field: "給与（時給）", value: salary.value, source: salary.sourceLine });
    }
  }

  const hours = factByKey(facts, "workHours");
  if (claims.workHours && hours && hours.status === "stated") {
    if (claims.workHours.value !== hours.value) {
      contradictions.push({
        field: "勤務時間",
        factValue: hours.value,
        factSource: `${hours.sourceLine}「${hours.quote}」`,
        summaryValue: claims.workHours.value,
        summarySnippet: claims.workHours.snippet,
      });
    } else {
      matched.push({ field: "勤務時間", value: hours.value, source: hours.sourceLine });
    }
  }

  const cap = factByKey(facts, "transportCap");
  if (claims.transportCap && cap && cap.status === "stated") {
    if (claims.transportCap.value !== cap.normalized) {
      contradictions.push({
        field: "交通費（月上限）",
        factValue: cap.value,
        factSource: `${cap.sourceLine}「${cap.quote}」`,
        summaryValue: `月上限${claims.transportCap.value.toLocaleString("ja-JP")}円`,
        summarySnippet: claims.transportCap.snippet,
      });
    } else {
      matched.push({ field: "交通費（月上限）", value: cap.value, source: cap.sourceLine });
    }
  }

  const unstated = facts.items
    .filter((i) => i.status === "unstated")
    .map((i) => ({ key: i.key, source: i.sourceLine, quote: i.quote }));

  const stopped = contradictions.length > 0;
  return {
    caseId,
    stage: "照合",
    verdict: stopped ? "停止（矛盾あり）" : "一致（人間承認待ち）",
    stoppedAtReconciliation: stopped,
    generationStarted: false,
    generationNote: "生成工程は作らない。人間承認前には生成を開始しない。",
    matched,
    contradictions,
    unstated,
    claims,
  };
}

function verifyOffline() {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  const original = loadOriginal();
  const facts = fixtureFacts();
  const e01Summary = original.lines.map((l) => l.text).join("");
  const e01 = reconcile(facts, e01Summary, "E01");
  const e02 = reconcile(facts, E02_SUMMARY, "E02");

  const checks = [
    { id: "E01-no-stop", pass: e01.stoppedAtReconciliation === false, detail: e01.verdict },
    { id: "E01-unstated-renewal-housing", pass: e01.unstated.some((u) => u.key === "renewal") && e01.unstated.some((u) => u.key === "housing"), detail: e01.unstated.map((u) => u.key).join(",") },
    { id: "E01-no-generation", pass: e01.generationStarted === false, detail: String(e01.generationStarted) },
    { id: "E02-stop", pass: e02.stoppedAtReconciliation === true, detail: e02.verdict },
    { id: "E02-salary-1500-vs-1700", pass: e02.contradictions.some((c) => c.field.includes("給与") && c.factValue.includes("1,500") && c.summaryValue.includes("1,700")), detail: JSON.stringify(e02.contradictions) },
    { id: "E02-no-generation", pass: e02.generationStarted === false, detail: String(e02.generationStarted) },
  ];
  const pass = checks.every((c) => c.pass);
  return { mode: "offline-fixture-verification", pass, checks, schemaCheck: checkSchemaCompleteness(facts), e01, e02, facts, startedAt, finishedAt: new Date().toISOString(), durationMs: Math.round(performance.now() - t0), retries: 0 };
}

async function runLive() {
  const apiKey = process.env.MODEL_API_KEY;
  const original = loadOriginal(ORIGINAL_FILE);
  const startedAt = new Date().toISOString();
  const t0 = performance.now();

  if (!apiKey) {
    return {
      mode: "live",
      status: "blocked",
      reason: "MODEL_API_KEY is not set in the environment. Live Meta Model API call was not attempted.",
      model: MODEL,
      baseUrl: BASE_URL,
      promptVersion: PROMPT_VERSION,
      input: `${INPUT_ID} ${INPUT_VERSION}`,
      retries: 0,
      startedAt,
      durationMs: Math.round(performance.now() - t0),
      usage: null,
      costUsd: null,
      costNote: "未記録（API未実行のため推定しない）",
      schemaCheck: { ...checkSchemaCompleteness(null), reason: "no extraction output" },
    };
  }

  const messages = buildMessages(original);
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0, ...(MAX_TOKENS ? { max_tokens: MAX_TOKENS } : {}) }),
  });
  const durationMs = Math.round(performance.now() - t0);
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }

  if (!res.ok || !body) {
    return {
      mode: "live",
      status: "api-error",
      httpStatus: res.status,
      errorBody: body ? JSON.stringify(body).slice(0, 2000) : text.slice(0, 2000),
      model: MODEL,
      baseUrl: BASE_URL,
      promptVersion: PROMPT_VERSION,
      input: `${INPUT_ID} ${INPUT_VERSION}`,
      retries: 0,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs,
      usage: body && body.usage ? body.usage : null,
      costUsd: null,
      costNote: "未記録（エラー応答のため算出しない。Billing実績との突合が必要）",
      schemaCheck: { ...checkSchemaCompleteness(null), reason: "no extraction output" },
    };
  }

  const content = body.choices?.[0]?.message?.content ?? "";
  let facts = null;
  let parseError = null;
  try {
    facts = JSON.parse(content);
  } catch (e) {
    parseError = String(e);
  }

  const usage = body.usage ?? null;
  let costUsd = null;
  let costNote = "未記録（usageが返らなかったため推定しない）";
  if (!RATES_KNOWN) {
    costNote = "未記録（PIPELINE_MODEL でモデルが差し替えられており、D4単価が適用できないため算出しない。使用量は usage に記録）";
  } else if (usage && typeof usage.prompt_tokens === "number" && typeof usage.completion_tokens === "number") {
    costUsd = (usage.prompt_tokens * RATE_INPUT_PER_1M + usage.completion_tokens * RATE_OUTPUT_PER_1M) / 1_000_000;
    costNote = `D4単価（入力$${RATE_INPUT_PER_1M}/1M, 出力$${RATE_OUTPUT_PER_1M}/1M）による算出。確定実費は dev.meta.ai Billing 実績との突合が必要。`;
  }

  let e01 = null;
  let e02 = null;
  // F2 reachability: the schema check result is always recorded. When the
  // extraction output cannot be parsed, the check itself is recorded as
  // failed with the reason, never left null.
  let schemaCheck;
  if (facts) {
    schemaCheck = checkSchemaCompleteness(facts);
  } else {
    schemaCheck = { ...checkSchemaCompleteness(null), reason: "extraction output was not valid JSON" };
  }
  if (facts && Array.isArray(facts.items)) {
    const e01Summary = original.lines.map((l) => l.text).join("");
    e01 = reconcile(facts, e01Summary, "E01");
    // E02 is the FICT-J01 evaluation case (a doctored summary of that
    // one posting). For any other input it does not apply.
    e02 = INPUT_ID === "FICT-J01" ? reconcile(facts, E02_SUMMARY, "E02") : null;
  }

  return {
    mode: "live",
    status: facts ? "completed" : "parse-error",
    parseError,
    model: body.model ?? MODEL,
    requestedModel: MODEL,
    baseUrl: BASE_URL,
    promptVersion: PROMPT_VERSION,
    input: `${INPUT_ID} ${INPUT_VERSION}`,
    retries: 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs,
    usage,
    costUsd,
    costNote,
    rawContent: content,
    facts,
    schemaCheck,
    e01,
    e02,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, `prompt-${PROMPT_VERSION}.md`), promptText(), "utf8");

  if (args.has("--verify-offline")) {
    const result = verifyOffline();
    writeFileSync(path.join(outDir, "facts-fixture.json"), JSON.stringify(result.facts, null, 2) + "\n", "utf8");
    writeFileSync(path.join(outDir, "offline-verification.json"), JSON.stringify({ ...result, facts: undefined, e01: result.e01, e02: result.e02 }, null, 2) + "\n", "utf8");
    writeFileSync(path.join(outDir, "e01-offline.json"), JSON.stringify(result.e01, null, 2) + "\n", "utf8");
    writeFileSync(path.join(outDir, "e02-offline.json"), JSON.stringify(result.e02, null, 2) + "\n", "utf8");
    console.log(JSON.stringify({ pass: result.pass, checks: result.checks }, null, 2));
    if (!result.pass) process.exitCode = 1;
    return;
  }

  const live = await runLive();
  writeFileSync(path.join(outDir, "live-run.json"), JSON.stringify(live, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ status: live.status, reason: live.reason ?? live.parseError ?? null, durationMs: live.durationMs }, null, 2));
  if (live.status === "blocked") process.exitCode = 2;
  if (live.status === "api-error" || live.status === "parse-error") process.exitCode = 1;
}

// Run only when executed directly, so tests can import the checks (F2).
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
