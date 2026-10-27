// Loop2 minimal proof: FICT-J01 v1 FACT extraction + reconciliation (E01/E02).
// Fictional data only. No generation stage. Single run, no auto-retry.
// API key is read only from env MODEL_API_KEY and never logged.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODEL = "muse-spark-1.3-contributor";
const BASE_URL = "https://api.meta.ai/v1";
const PROMPT_VERSION = "fact-extract-v1";
const INPUT_ID = "FICT-J01";
const INPUT_VERSION = "v1";
// D4 rates for muse-spark-1.3-contributor (USD per 1M tokens).
const RATE_INPUT_PER_1M = 0.10;
const RATE_OUTPUT_PER_1M = 0.20;

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDir = path.join(root, "loops", "loop-002");

function loadOriginal() {
  const raw = readFileSync(path.join(here, "fict-j01-v1.json"), "utf8");
  return JSON.parse(raw);
}

function originalText(original) {
  return original.lines.map((l) => `${l.id}: ${l.text}`).join("\n");
}

// E02 evaluation input (fictional). Single-factor change: hourly wage only.
const E02_SUMMARY =
  "ソラノ輪具研究所（FICT-J01）の概要: 時給1,700円。勤務時間は09:00〜18:00、休憩60分、実働8時間。交通費は実費支給、月上限10,000円。勤務地は架空の青空実験区A棟。雇用形態は有期契約社員、契約期間は3か月。";

function buildMessages(original) {
  const system = [
    "You extract FACTs from a fictional job-posting original.",
    "Rules: use only what the original states. Never invent or complete unstated items.",
    "Mark unstated items with status unstated. For every stated item, cite the source line ID and an exact quote from that line.",
    "Output JSON only, no markdown fences.",
    'Schema: {"items":[{"key":"...","status":"stated|unstated","value":"...","normalized":null,"sourceLine":"L01","quote":"..."}]}',
    "Keys: employer, jobId, workLocation, employmentType, contractPeriod, renewal, salaryHourly, monthlyIncomeGuarantee, workHours, breakMinutes, actualHours, monthlyDaysAssumption, transport, transportCap, housing.",
    "normalized: for salaryHourly and transportCap use the integer yen amount; for breakMinutes and actualHours use numbers; otherwise null.",
  ].join("\n");
  const user = `Original ${INPUT_ID} ${INPUT_VERSION}:\n${originalText(original)}\n\nExtract FACTs as JSON per schema.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function promptText() {
  const original = loadOriginal();
  const msgs = buildMessages(original);
  return msgs.map((m) => `## ${m.role}\n\n${m.content}`).join("\n\n") + "\n";
}

// Hand-derived fixture from FICT-J01 v1. Used ONLY for offline logic
// verification. This is not model output.
function fixtureFacts() {
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
function reconcile(facts, summary, caseId) {
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
  return { mode: "offline-fixture-verification", pass, checks, e01, e02, facts, startedAt, finishedAt: new Date().toISOString(), durationMs: Math.round(performance.now() - t0), retries: 0 };
}

async function runLive() {
  const apiKey = process.env.MODEL_API_KEY;
  const original = loadOriginal();
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
    };
  }

  const messages = buildMessages(original);
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0 }),
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
  if (usage && typeof usage.prompt_tokens === "number" && typeof usage.completion_tokens === "number") {
    costUsd = (usage.prompt_tokens * RATE_INPUT_PER_1M + usage.completion_tokens * RATE_OUTPUT_PER_1M) / 1_000_000;
    costNote = `D4単価（入力$${RATE_INPUT_PER_1M}/1M, 出力$${RATE_OUTPUT_PER_1M}/1M）による算出。確定実費は dev.meta.ai Billing 実績との突合が必要。`;
  }

  let e01 = null;
  let e02 = null;
  if (facts && Array.isArray(facts.items)) {
    const e01Summary = original.lines.map((l) => l.text).join("");
    e01 = reconcile(facts, e01Summary, "E01");
    e02 = reconcile(facts, E02_SUMMARY, "E02");
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

main().catch((err) => {
  console.error(String(err && err.stack ? err.stack : err));
  process.exitCode = 1;
});
