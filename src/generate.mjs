// Step 3 (generation): generate LP copy strictly from approved FACTs.
// Fictional data only.
//
// Generation may start only when BOTH hold (step-2 audit, observation 1):
// 1. the approval record's status is "approved" (with approver/approvedAt);
// 2. checkApprovalValidity, recomputed from the current bytes of the two
//    target files, returns valid: true.
// The static validity.invalidated value stored in the approval record is
// never used as evidence. A refusal happens before any API call, so a
// refusal costs nothing.
//
// The generation itself follows the quote-granularity principles (candidate,
// L-016) in docs/prompts/step3-brief.md section 4: every sentence carries
// its FACT keys and original line IDs; numbers and conditions keep the
// FACT values verbatim; unstated items (renewal, housing) are never
// asserted. API key is read only from env MODEL_API_KEY and never logged.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkApprovalValidity } from "./approve.mjs";

// Endpoint selection: defaults are the Meta Model API and the
// contributor model, exactly as before. PIPELINE_BASE_URL /
// PIPELINE_MODEL / PIPELINE_MAX_TOKENS let the same tools run against
// another OpenAI-compatible endpoint (e.g. Baseten's Muse Spark Open
// for the live verification runs, loop-022). When the model is
// overridden, the D4 contributor rates do not apply, so costs are
// left unrecorded rather than computed at the wrong rate.
export const MODEL = process.env.PIPELINE_MODEL ?? "muse-spark-1.3-contributor";
export const BASE_URL = process.env.PIPELINE_BASE_URL ?? "https://api.meta.ai/v1";
export const MAX_TOKENS = process.env.PIPELINE_MAX_TOKENS ? Number(process.env.PIPELINE_MAX_TOKENS) : null;
export const RATES_KNOWN = !process.env.PIPELINE_MODEL;
export const PROMPT_VERSION = "lp-generate-v1";
// D4 rates for muse-spark-1.3-contributor (USD per 1M tokens).
const RATE_INPUT_PER_1M = 0.10;
const RATE_OUTPUT_PER_1M = 0.20;

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

// Input check for generation. Returns { ok, reasonCode, reason, ... }.
// reasonCode is one of: null (ok), "approval-missing",
// "approval-not-approved", "approval-incomplete", "approval-invalid".
export function checkGenerationInput({ root, originalFile, factsFile, approvalFile }) {
  const approvalPath = path.join(root, approvalFile);
  if (!existsSync(approvalPath)) {
    return {
      ok: false,
      reasonCode: "approval-missing",
      reason: "承認記録が存在しないため、生成を開始しない（承認は未実施ではなく、対象により作成自体が禁止されている場合を含む）",
      approvalFile,
    };
  }
  const approval = loadJson(approvalPath);
  if (approval.status !== "approved") {
    return {
      ok: false,
      reasonCode: "approval-not-approved",
      reason: `承認記録の status が "${String(approval.status)}" であり、承認が成立していないため生成を開始しない`,
      approvalId: approval.approvalId ?? null,
      status: approval.status ?? null,
    };
  }
  if (!approval.approver || !approval.approvedAt) {
    return {
      ok: false,
      reasonCode: "approval-incomplete",
      reason: "承認記録に approver または approvedAt が入っていないため、承認の成立を確認できず生成を開始しない",
      approvalId: approval.approvalId ?? null,
      status: approval.status,
    };
  }
  // Recompute validity from the current bytes of the two target files.
  // The stored validity.invalidated flag is never consulted here.
  const validity = checkApprovalValidity(approval, { root, originalFile, factsFile });
  if (!validity.valid) {
    return {
      ok: false,
      reasonCode: "approval-invalid",
      reason: validity.reason,
      approvalId: approval.approvalId,
      status: approval.status,
      validity,
    };
  }
  return { ok: true, reasonCode: null, reason: null, approvalId: approval.approvalId, status: approval.status, validity };
}

// Prompt lp-generate-v1. Materials: stated items carry their values;
// unstated items are passed only as "not stated" (their value never is).
export function buildGenerationMessages(facts) {
  const stated = facts.items.filter((i) => i.status === "stated");
  const unstated = facts.items.filter((i) => i.status === "unstated");
  const system = [
    "You write Japanese LP (landing page) copy sentences for a fictional job posting, strictly from the approved FACT items given as materials.",
    "Rules:",
    "- Use only the stated FACT items. Never add information that is not in the FACTs.",
    "- Write plain descriptive sentences only. No greetings, appeals, evaluations, or embellishment.",
    "- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines). A sentence must cite at least one key and at least one line, and must cite every key and line it uses.",
    "- Keep numbers, times, periods and conditions exactly as written in the FACT values (for example 時給1,500円, 月上限10,000円, 09:00〜18:00, 休憩60分, 実働8時間, 契約期間3か月). Do not convert, round, or rephrase quantities and conditions.",
    "- monthlyDaysAssumption is a trial-calculation assumption (試算用の仮定): if you mention it, the sentence must say it is an assumption. A monthly income figure may be presented only as that marked estimate — rate × actual hours × the assumed days, with the note that overtime, night work and allowances are not included (※残業・夜勤・各種手当は含みません) — and never as a guaranteed amount (the user's pay-display decision, 2026-11-04). monthlyIncomeGuarantee says the monthly income is not guaranteed (保証しない): keep it a non-guarantee.",
    "- Items listed as unstated have no value. Either omit them, or write a sentence that states only that the item is not stated (未記載), citing its key and line. Never assert a value for them (no 更新あり/なし, no 寮あり/なし).",
    "- Output JSON only, no markdown fences.",
    'Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}',
  ].join("\n");
  const materials = [
    "Stated FACT items (key / value / normalized / sourceLine / quote):",
    ...stated.map((i) => `- ${i.key}: value=${JSON.stringify(i.value)} normalized=${JSON.stringify(i.normalized)} sourceLine=${i.sourceLine} quote=${JSON.stringify(i.quote)}`),
    "Unstated FACT items (no value exists; 未記載):",
    ...unstated.map((i) => `- ${i.key}: 未記載 sourceLine=${i.sourceLine} quote=${JSON.stringify(i.quote)}`),
  ].join("\n");
  const user = `Materials for ${facts.factsId} version ${facts.factsVersion}:\n${materials}\n\nWrite the LP copy sentences as JSON per schema.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function promptText(facts) {
  const msgs = buildGenerationMessages(facts);
  return msgs.map((m) => `## ${m.role}\n\n${m.content}`).join("\n\n") + "\n";
}

// Numeric representations are derived from the FACT items themselves
// (fix F9): a cited numeric item's value must appear verbatim, in its
// plain or thousands-separated form. The earlier table hardcoded
// FICT-J01's values (1,500 / 10,000 / 60 / 8), which silently bound
// the grounding check to that one fixture; for any other posting the
// check compared against the wrong numbers.
const UNSTATED_ASSERTION_PATTERNS = [
  "更新あり", "更新なし", "更新有", "更新無",
  "寮あり", "寮なし", "寮完備", "寮有", "社宅あり", "社宅なし",
];

// Grounding check (the 検査 the brief's work item 1 foresees; step 4 can
// import it). Verifies, mechanically:
// - every sentence has text, at least one factKey and one sourceLine;
// - every factKey exists in the FACT set and every sourceLine exists in
//   the original, and a cited key's own sourceLine is cited with it;
// - yen amounts and clock times in the text are FACT values verbatim;
// - a sentence citing a numeric item keeps that item's value;
// - unstated items are never asserted (only "未記載" may be stated);
// - monthlyDaysAssumption stays an assumption and monthlyIncomeGuarantee
//   stays a non-guarantee.
export function checkGrounding(generation, facts, original, { language } = {}) {
  const issues = [];
  const itemsByKey = new Map(facts.items.map((i) => [i.key, i]));
  const numericReps = new Map();
  for (const i of facts.items) {
    if (typeof i.normalized === "number") {
      numericReps.set(i.key, [...new Set([String(i.normalized), i.normalized.toLocaleString("en-US")])]);
    }
  }
  const lineIds = new Set(original.lines.map((l) => l.id));
  const yenAmounts = new Set();
  for (const i of facts.items) {
    if (i.status === "stated" && typeof i.normalized === "number" && (i.key === "salaryHourly" || i.key === "transportCap")) {
      yenAmounts.add(i.normalized);
    }
  }
  // Amounts that appear verbatim in a stated fact's value or in an
  // original line are material amounts, not inventions: the housing
  // fact's value carries 15,000円 and 10,000円, and a monthly salary
  // lives only in the original's line when the FACT schema has no
  // key for it (FICT-J03, 2026-11-04). The yen check below allows,
  // per sentence, the amounts in the values of the keys it cites
  // and in the text of the lines it cites — the same sources its
  // citations claim. Amounts from nowhere remain failures.
  const amountsIn = (text) => {
    const out = new Set();
    if (typeof text === "string") for (const m of text.matchAll(/([\d,]+)\s*円/g)) out.add(Number(m[1].replace(/,/g, "")));
    return out;
  };
  const lineTextById = new Map(original.lines.map((l) => [l.id, l.text]));
  const factTimes = new Set();
  for (const i of facts.items) {
    if (i.status === "stated" && typeof i.value === "string") {
      for (const m of i.value.matchAll(/(\d{1,2}:\d{2})/g)) factTimes.add(m[1]);
    }
  }
  const sentences = generation && Array.isArray(generation.sentences) ? generation.sentences : null;
  if (!sentences) {
    return { pass: false, checked: 0, issues: [{ sentence: null, issue: "generation.sentences is not an array" }] };
  }
  sentences.forEach((s, idx) => {
    const at = { sentence: idx };
    if (!s || typeof s.text !== "string" || s.text.length === 0) {
      issues.push({ ...at, issue: "sentence has no text" });
      return;
    }
    // A sentence is grounded by its citations: FACT keys and/or the
    // original's lines. Items the FACT schema does not carry (the
    // work content, holidays, qualifications) are grounded by the
    // line they cite; a sentence with neither has no grounding.
    if ((!Array.isArray(s.factKeys) || s.factKeys.length === 0) && (!Array.isArray(s.sourceLines) || s.sourceLines.length === 0)) {
      issues.push({ ...at, issue: "sentence has no factKeys and no sourceLines" });
    }
    if (!Array.isArray(s.sourceLines) || s.sourceLines.length === 0) {
      issues.push({ ...at, issue: "sentence has no sourceLines" });
    }
    const keys = Array.isArray(s.factKeys) ? s.factKeys : [];
    const lines = Array.isArray(s.sourceLines) ? s.sourceLines : [];
    for (const k of keys) {
      const item = itemsByKey.get(k);
      if (!item) {
        issues.push({ ...at, issue: `unknown factKey: ${k}` });
        continue;
      }
      if (!lines.includes(item.sourceLine)) {
        issues.push({ ...at, issue: `factKey ${k} is cited without its sourceLine ${item.sourceLine}` });
      }
      if (item.status === "unstated") {
        if (!s.text.includes("未記載") && !/not stated|not specified/i.test(s.text)) {
          issues.push({ ...at, issue: `unstated item ${k} is mentioned without stating 未記載` });
        }
      }
    }
    for (const l of lines) {
      if (!lineIds.has(l)) issues.push({ ...at, issue: `unknown sourceLine: ${l}` });
    }
    for (const p of UNSTATED_ASSERTION_PATTERNS) {
      if (s.text.includes(p)) issues.push({ ...at, issue: `unstated value asserted: ${p}` });
    }
    const allowedYen = new Set(yenAmounts);
    for (const k of keys) {
      const item = itemsByKey.get(k);
      if (item && item.status === "stated") for (const a of amountsIn(item.value)) allowedYen.add(a);
    }
    for (const l of lines) for (const a of amountsIn(lineTextById.get(l))) allowedYen.add(a);
    // The monthly income example (the user's pay-display decision,
    // 2026-11-04) is a computed amount, not a stated one: rate ×
    // actual hours × the stated monthly days assumption (or a daily
    // rate × days, or an annual salary ÷ 12). When the sentence
    // cites the keys the computation needs, the computed amount is
    // grounded in those cited facts.
    {
      const numOf = (k) => { const it = itemsByKey.get(k); return it && it.status === "stated" && typeof it.normalized === "number" ? it.normalized : null; };
      const daysItemG = itemsByKey.get("monthlyDaysAssumption");
      let daysG = null;
      if (daysItemG && daysItemG.status === "stated") {
        if (typeof daysItemG.normalized === "number") daysG = daysItemG.normalized;
        else if (typeof daysItemG.value === "string") { const dm = daysItemG.value.match(/(\d+)\s*(?:日|days?\b)/i); if (dm) daysG = Number(dm[1]); }
      }
      if (keys.includes("salaryHourly") && numOf("salaryHourly") !== null && numOf("actualHours") !== null && daysG !== null) allowedYen.add(numOf("salaryHourly") * numOf("actualHours") * daysG);
      if (keys.includes("salaryDaily") && numOf("salaryDaily") !== null && daysG !== null) allowedYen.add(numOf("salaryDaily") * daysG);
      if (keys.includes("salaryAnnual") && numOf("salaryAnnual") !== null) allowedYen.add(Math.round(numOf("salaryAnnual") / 12));
    }
    for (const m of s.text.matchAll(/([\d,]+)\s*円/g)) {
      const amount = Number(m[1].replace(/,/g, ""));
      if (!allowedYen.has(amount)) {
        issues.push({ ...at, issue: `yen amount not in FACTs: ${m[1]}円` });
      }
    }
    for (const m of s.text.matchAll(/(\d{1,2}:\d{2})/g)) {
      if (!factTimes.has(m[1])) issues.push({ ...at, issue: `time not in FACTs: ${m[1]}` });
    }
    for (const k of keys) {
      const reps = numericReps.get(k);
      if (reps && !reps.some((r) => s.text.includes(r))) {
        issues.push({ ...at, issue: `cited numeric value not kept verbatim: ${k}` });
      }
    }
    if (keys.includes("monthlyDaysAssumption") && !s.text.includes("仮定") && !s.text.includes("試算") && !/assum|estimat/i.test(s.text)) {
      issues.push({ ...at, issue: "monthlyDaysAssumption is stated without marking it an assumption" });
    }
    if (keys.includes("monthlyIncomeGuarantee") && !s.text.includes("保証しない") && !s.text.includes("保証され") && !/not guaranteed|no guarantee/i.test(s.text)) {
      issues.push({ ...at, issue: "monthlyIncomeGuarantee is stated without the non-guarantee wording" });
    }
  });
  return { pass: issues.length === 0, checked: sentences.length, issues };
}

// Parse the model output into the generation object. Throws on bad shape.
export function assembleGeneration(content, facts, approval) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`generation output was not valid JSON: ${String(e)}`);
  }
  if (!parsed || !Array.isArray(parsed.sentences)) {
    throw new Error("generation output has no sentences array");
  }
  const sentences = parsed.sentences.map((s) => ({
    text: s && typeof s.text === "string" ? s.text : "",
    factKeys: s && Array.isArray(s.factKeys) ? s.factKeys : [],
    sourceLines: s && Array.isArray(s.sourceLines) ? s.sourceLines : [],
  }));
  return {
    kind: "lp-copy-generation",
    version: 1,
    promptVersion: PROMPT_VERSION,
    model: MODEL,
    input: {
      original: { id: approval.target.original.id, version: approval.target.original.version, file: approval.target.original.file, sha256: approval.target.original.sha256 },
      facts: { factsId: approval.target.facts.factsId, factsVersion: approval.target.facts.factsVersion, file: approval.target.facts.file, sha256: approval.target.facts.sha256 },
      approvalId: approval.approvalId,
    },
    sentences,
  };
}

// Full generation flow. callModel(messages) is injected so tests can stub
// the API; it must resolve to { content, usage, model } (live) or throw.
// On refusal the flow returns before callModel is ever invoked.
export async function runGeneration({ root, originalFile, factsFile, approvalFile, callModel }) {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  const input = checkGenerationInput({ root, originalFile, factsFile, approvalFile });
  if (!input.ok) {
    return {
      status: "refused",
      reasonCode: input.reasonCode,
      reason: input.reason,
      approvalId: input.approvalId ?? null,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      apiCalled: false,
      retries: 0,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - t0),
      usage: null,
      costUsd: 0,
      costNote: "入力チェックで拒否したため API は呼ばれておらず、費用は発生していない",
    };
  }
  const approval = loadJson(path.join(root, approvalFile));
  const facts = loadJson(path.join(root, factsFile));
  const original = loadJson(path.join(root, originalFile));
  const messages = buildGenerationMessages(facts);
  const res = await callModel(messages);
  const durationMs = Math.round(performance.now() - t0);
  const usage = res.usage ?? null;
  let costUsd = null;
  let costNote = "未記録（usageが返らなかったため推定しない）";
  if (!RATES_KNOWN) {
    costNote = "未記録（PIPELINE_MODEL でモデルが差し替えられており、D4単価が適用できないため算出しない。使用量は usage に記録）";
  } else if (usage && typeof usage.prompt_tokens === "number" && typeof usage.completion_tokens === "number") {
    costUsd = (usage.prompt_tokens * RATE_INPUT_PER_1M + usage.completion_tokens * RATE_OUTPUT_PER_1M) / 1_000_000;
    costNote = `D4単価（入力$${RATE_INPUT_PER_1M}/1M, 出力$${RATE_OUTPUT_PER_1M}/1M）による算出値。確定実費は dev.meta.ai Billing 実績との突合が必要。`;
  }
  let generation = null;
  let parseError = null;
  try {
    generation = assembleGeneration(res.content, facts, approval);
  } catch (e) {
    parseError = String(e && e.message ? e.message : e);
  }
  const grounding = generation ? checkGrounding(generation, facts, original) : { pass: false, checked: 0, issues: [{ sentence: null, issue: "no generation to check" }] };
  return {
    status: generation ? "generated" : "parse-error",
    parseError,
    model: res.model ?? MODEL,
    requestedModel: MODEL,
    promptVersion: PROMPT_VERSION,
    apiCalled: true,
    retries: 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs,
    usage,
    costUsd,
    costNote,
    generation,
    grounding,
  };
}

// Live API caller. One bounded exception to the no-retry style
// (intervention I-5, measured on FICT-J03 in loop-026): a reasoning
// model can spend the whole completion budget on reasoning and
// return empty content. When the response is empty AND the usage
// shows the budget was exhausted, the call is retried with the cap
// raised (doubled, at most twice, ceiling 64000) instead of failing
// the run for a budget setting. The raises are recorded on the
// result so the run record shows what happened.
export async function callModelLive(messages) {
  const apiKey = process.env.MODEL_API_KEY;
  let cap = MAX_TOKENS;
  let raises = 0;
  for (;;) {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0, ...(cap ? { max_tokens: cap } : {}) }),
    });
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = null; }
    if (!res.ok || !body) {
      const err = new Error(`Meta Model API error: HTTP ${res.status}`);
      err.httpStatus = res.status;
      err.errorBody = body ? JSON.stringify(body).slice(0, 2000) : text.slice(0, 2000);
      throw err;
    }
    const content = body.choices?.[0]?.message?.content ?? "";
    const usage = body.usage ?? null;
    const exhausted = cap !== null && typeof usage?.completion_tokens === "number" && usage.completion_tokens >= cap;
    if ((content.trim().length > 0 || !exhausted || raises >= 2)) {
      return {
        content,
        usage,
        model: body.model ?? MODEL,
        ...(raises > 0 ? { tokenBudget: { initial: MAX_TOKENS, final: cap, raises } } : {}),
      };
    }
    raises++;
    cap = Math.min(cap * 2, 64000);
  }
}

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "..");
  const argv = process.argv.slice(2);
  const approvalFile = argValue(argv, "--approval");
  const originalFile = argValue(argv, "--original");
  const factsFile = argValue(argv, "--facts");
  const out = argValue(argv, "--out");
  const runOut = argValue(argv, "--run-out");
  if (!approvalFile || !originalFile || !factsFile) {
    console.error("usage: generate.mjs --approval <f> --original <f> --facts <f> [--out <generation.json>] [--run-out <run.json>]");
    process.exitCode = 2;
    return;
  }
  // Input check first; a refusal must not need an API key at all.
  const input = checkGenerationInput({ root, originalFile, factsFile, approvalFile });
  if (!input.ok) {
    const record = { status: "refused", reasonCode: input.reasonCode, reason: input.reason, apiCalled: false };
    console.log(JSON.stringify(record, null, 2));
    if (runOut) {
      mkdirSync(path.dirname(path.join(root, runOut)), { recursive: true });
      writeFileSync(path.join(root, runOut), JSON.stringify({ ...record, model: MODEL, promptVersion: PROMPT_VERSION, retries: 0, usage: null, costUsd: 0 }, null, 2) + "\n", "utf8");
    }
    process.exitCode = 3;
    return;
  }
  if (!process.env.MODEL_API_KEY) {
    console.log(JSON.stringify({ status: "blocked", reason: "MODEL_API_KEY is not set in the environment. Live Meta Model API call was not attempted.", apiCalled: false }, null, 2));
    process.exitCode = 2;
    return;
  }
  const facts = loadJson(path.join(root, factsFile));
  if (out) {
    mkdirSync(path.dirname(path.join(root, out)), { recursive: true });
    writeFileSync(path.join(path.dirname(path.join(root, out)), `prompt-${PROMPT_VERSION}.md`), promptText(facts), "utf8");
  }
  let result;
  try {
    result = await runGeneration({ root, originalFile, factsFile, approvalFile, callModel: callModelLive });
  } catch (err) {
    console.log(JSON.stringify({ status: "api-error", httpStatus: err.httpStatus ?? null, errorBody: err.errorBody ?? String(err && err.message ? err.message : err) }, null, 2));
    process.exitCode = 1;
    return;
  }
  if (out && result.generation) {
    writeFileSync(path.join(root, out), JSON.stringify(result.generation, null, 2) + "\n", "utf8");
  }
  if (runOut) {
    const { generation, ...runRecord } = result;
    writeFileSync(path.join(root, runOut), JSON.stringify(runRecord, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify({ status: result.status, parseError: result.parseError, grounding: result.grounding, durationMs: result.durationMs, usage: result.usage, costUsd: result.costUsd }, null, 2));
  if (result.status !== "generated") process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
