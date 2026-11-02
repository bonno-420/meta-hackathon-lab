// Step 3 typed path (procedure 3 preparation): LP generation with a
// registered pattern reference set (lp-generate-v2-typed).
// Fictional data only.
//
// The type-less path (lp-generate-v1 in src/generate.mjs) is untouched.
// This module adds structured pattern input on top of the same factual
// rules: use only stated FACTs; every sentence cites factKeys+sourceLines
// and cites every key/line it uses; numbers/times verbatim; unstated only
// as 未記載; output JSON only with the same schema.
//
// Reference set for E01 (person's modified approval, 2026-10-29):
// LIB-PAT-001 v1 + LIB-PAT-002 v1 + LIB-PAT-004 v1 from LIB-CATALOG-V1.
// LIB-PAT-003 is registered only and is never a used pattern here.
//
// The monthly-income wording follows the person's modified approval (FACT
// v1 itself is unchanged): the trial note must be softened, not a flat
// denial on its own. API key handling matches src/generate.mjs: read only
// from env MODEL_API_KEY, never logged.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  MODEL as BASE_MODEL,
  BASE_URL,
  checkGenerationInput,
  checkGrounding,
} from "./generate.mjs";

export { checkGenerationInput, checkGrounding };
export const MODEL = BASE_MODEL;
export const TYPED_PROMPT_VERSION = "lp-generate-v2-typed";
export const TYPED_CATALOG_ID = "LIB-CATALOG-V1";
// D4 rates for muse-spark-1.3-contributor (USD per 1M tokens), same as src/generate.mjs.
const RATE_INPUT_PER_1M = 0.10;
const RATE_OUTPUT_PER_1M = 0.20;

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function describePattern(p) {
  const composition = Array.isArray(p.composition) ? p.composition.join(" -> ") : "";
  const slots = Array.isArray(p.slots)
    ? p.slots.map((s) => `  - ${s.name}: may_enter=${s.may_enter}; condition=${s.condition}`).join("\n")
    : "";
  return `- ${p.id} (version ${p.version})\n  composition: ${composition}\n${slots}`;
}

// Prompt lp-generate-v2-typed. Factual rules mirror buildGenerationMessages
// in src/generate.mjs; patterns add sentence shape only (never facts,
// numbers, or names) plus the merged sentence order and the softened
// monthly-income instruction from the modified approval.
export function buildTypedGenerationMessages(facts, patterns) {
  const stated = facts.items.filter((i) => i.status === "stated");
  const unstated = facts.items.filter((i) => i.status === "unstated");
  const list = Array.isArray(patterns) ? patterns : [];
  const system = [
    "You write Japanese LP (landing page) copy sentences for a fictional job posting, strictly from the approved FACT items given as materials.",
    "Factual rules (same as lp-generate-v1):",
    "- Use only the stated FACT items. Never add information that is not in the FACTs.",
    "- Write plain descriptive sentences only. No greetings, appeals, evaluations, or embellishment.",
    "- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines). A sentence must cite at least one key and at least one line, and must cite every key and line it uses.",
    "- Keep numbers, times, periods and conditions exactly as written in the FACT values (for example 時給1,500円, 月上限10,000円, 09:00〜18:00, 休憩60分, 実働8時間, 契約期間3か月). Do not convert, round, or rephrase quantities and conditions.",
    "- Items listed as unstated have no value. Either omit them, or write a sentence that states only that the item is not stated (未記載), citing its key and line. Never assert a value for them (no 更新あり/なし, no 寮あり/なし).",
    "- Output JSON only, no markdown fences.",
    'Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}',
    "Structured pattern input (sentence shape only):",
    ...list.map((p) => describePattern(p)),
    "- Patterns give sentence shape only and never supply facts, numbers, or names. Every value, number, time, and name still comes from the FACT items above.",
    "Sentence order (merged from the approved reference set):",
    "- 1. Introduction: plain identification of the posting from stated facts only (employer, job id, work location, employment type). Never invent support, training, or other background.",
    "- 2. Conditions: stated working conditions (pay, hours, transport) kept verbatim.",
    "- 3. Trial-calculation note: the softened monthly-income sentence defined below.",
    "- 4. Work scene: only within stated facts (hours and location as given). Add no new scene details.",
    "- 5. Unstated items: shown only as not stated (未記載), never asserted.",
    "- 6. Closing: a plain summary of the stated conditions only. NO invitation, visit, or application appeal, because no FACT states an application method.",
    "Softened monthly-income expression (modified approval; FACT v1 unchanged):",
    "- When monthly income is mentioned, the sentence must not be a flat denial on its own; it must state that the actual income varies with the number of work days and changes in overtime etc. (実際の収入は勤務日数や残業の増減などで変動する), must mark the 20-day figure as a trial assumption using 試算/仮定 wording (e.g. 試算用の仮定), and must still make clear it is not guaranteed by including the wording 保証しない inside that same softer sentence.",
    "- Never present a monthly income figure.",
  ].join("\n");
  const materials = [
    "Stated FACT items (key / value / normalized / sourceLine / quote):",
    ...stated.map((i) => `- ${i.key}: value=${JSON.stringify(i.value)} normalized=${JSON.stringify(i.normalized)} sourceLine=${i.sourceLine} quote=${JSON.stringify(i.quote)}`),
    "Unstated FACT items (no value exists; 未記載):",
    ...unstated.map((i) => `- ${i.key}: 未記載 sourceLine=${i.sourceLine} quote=${JSON.stringify(i.quote)}`),
    `Reference set: catalog ${TYPED_CATALOG_ID}; used patterns: ${list.map((p) => `${p.id} ${p.version}`).join(", ")}.`,
  ].join("\n");
  const user = `Materials for ${facts.factsId} version ${facts.factsVersion}:\n${materials}\n\nWrite the LP copy sentences as JSON per schema.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function promptText(facts, patterns) {
  const msgs = buildTypedGenerationMessages(facts, patterns);
  return msgs.map((m) => `## ${m.role}\n\n${m.content}`).join("\n\n") + "\n";
}

function referenceSetOf(patterns) {
  const list = Array.isArray(patterns) ? patterns : [];
  return {
    catalog: TYPED_CATALOG_ID,
    patterns: list.map((p) => ({ id: p.id, version: p.version })),
  };
}

// Parse the model output into the generation object. Throws on bad shape.
// Same shape as assembleGeneration in src/generate.mjs, but with the typed
// prompt version and the referenceSet header.
export function assembleTypedGeneration(content, facts, approval, patterns) {
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
    promptVersion: TYPED_PROMPT_VERSION,
    model: MODEL,
    referenceSet: referenceSetOf(patterns),
    input: {
      original: { id: approval.target.original.id, version: approval.target.original.version, file: approval.target.original.file, sha256: approval.target.original.sha256 },
      facts: { factsId: approval.target.facts.factsId, factsVersion: approval.target.facts.factsVersion, file: approval.target.facts.file, sha256: approval.target.facts.sha256 },
      approvalId: approval.approvalId,
    },
    sentences,
  };
}

// Full typed generation flow. callModel(messages) is injected so tests can
// stub the API; it must resolve to { content, usage, model } (live) or
// throw. On refusal the flow returns before callModel is ever invoked.
export async function runTypedGeneration({ root, originalFile, factsFile, approvalFile, patterns, callModel }) {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  const referenceSet = referenceSetOf(patterns);
  const input = checkGenerationInput({ root, originalFile, factsFile, approvalFile });
  if (!input.ok) {
    return {
      status: "refused",
      reasonCode: input.reasonCode,
      reason: input.reason,
      approvalId: input.approvalId ?? null,
      model: MODEL,
      promptVersion: TYPED_PROMPT_VERSION,
      referenceSet,
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
  const messages = buildTypedGenerationMessages(facts, patterns);
  const res = await callModel(messages);
  const durationMs = Math.round(performance.now() - t0);
  const usage = res.usage ?? null;
  let costUsd = null;
  let costNote = "未記録（usageが返らなかったため推定しない）";
  if (usage && typeof usage.prompt_tokens === "number" && typeof usage.completion_tokens === "number") {
    costUsd = (usage.prompt_tokens * RATE_INPUT_PER_1M + usage.completion_tokens * RATE_OUTPUT_PER_1M) / 1_000_000;
    costNote = `D4単価（入力$${RATE_INPUT_PER_1M}/1M, 出力$${RATE_OUTPUT_PER_1M}/1M）による算出値。確定実費は dev.meta.ai Billing 実績との突合が必要。`;
  }
  let generation = null;
  let parseError = null;
  try {
    generation = assembleTypedGeneration(res.content, facts, approval, patterns);
  } catch (e) {
    parseError = String(e && e.message ? e.message : e);
  }
  const grounding = generation ? checkGrounding(generation, facts, original) : { pass: false, checked: 0, issues: [{ sentence: null, issue: "no generation to check" }] };
  return {
    status: generation ? "generated" : "parse-error",
    parseError,
    model: res.model ?? MODEL,
    requestedModel: MODEL,
    promptVersion: TYPED_PROMPT_VERSION,
    referenceSet,
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

// Live API caller: single request, no retry (the existing tools' style).
async function callModelLive(messages) {
  const apiKey = process.env.MODEL_API_KEY;
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0 }),
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
  return {
    content: body.choices?.[0]?.message?.content ?? "",
    usage: body.usage ?? null,
    model: body.model ?? MODEL,
  };
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
  const catalogFile = argValue(argv, "--catalog");
  const patternsArg = argValue(argv, "--patterns");
  const out = argValue(argv, "--out");
  const runOut = argValue(argv, "--run-out");
  if (!approvalFile || !originalFile || !factsFile || !catalogFile || !patternsArg) {
    console.error("usage: generate-typed.mjs --approval <f> --original <f> --facts <f> --catalog <f> --patterns LIB-PAT-001,LIB-PAT-002,LIB-PAT-004 [--out <typed-generation.json>] [--run-out <run.json>]");
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
      writeFileSync(path.join(root, runOut), JSON.stringify({ ...record, model: MODEL, promptVersion: TYPED_PROMPT_VERSION, referenceSet: referenceSetOf([]), retries: 0, usage: null, costUsd: 0 }, null, 2) + "\n", "utf8");
    }
    process.exitCode = 3;
    return;
  }
  // Load the catalog and select the requested patterns by id.
  let catalog;
  try {
    catalog = loadJson(path.join(root, catalogFile));
  } catch (e) {
    console.error(JSON.stringify({ status: "invalid-catalog", reason: `catalog file could not be loaded: ${catalogFile}` }));
    process.exitCode = 2;
    return;
  }
  const byId = new Map((catalog.patterns ?? []).map((p) => [p.id, p]));
  const wantedIds = patternsArg.split(",").map((s) => s.trim()).filter(Boolean);
  const selected = [];
  for (const id of wantedIds) {
    const p = byId.get(id);
    if (!p || !String(p.pattern_status ?? "").includes("registered")) {
      console.error(JSON.stringify({ status: "invalid-patterns", reason: `pattern not found or not registered in ${catalogFile}: ${id}` }));
      process.exitCode = 2;
      return;
    }
    selected.push(p);
  }
  if (!process.env.MODEL_API_KEY) {
    console.log(JSON.stringify({ status: "blocked", reason: "MODEL_API_KEY is not set in the environment. Live Meta Model API call was not attempted.", apiCalled: false }, null, 2));
    process.exitCode = 2;
    return;
  }
  const facts = loadJson(path.join(root, factsFile));
  if (out) {
    mkdirSync(path.dirname(path.join(root, out)), { recursive: true });
    writeFileSync(path.join(path.dirname(path.join(root, out)), `prompt-${TYPED_PROMPT_VERSION}.md`), promptText(facts, selected), "utf8");
  }
  let result;
  try {
    result = await runTypedGeneration({ root, originalFile, factsFile, approvalFile, patterns: selected, callModel: callModelLive });
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
