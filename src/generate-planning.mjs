// Planning-path generation (fix F2/F10): LP copy generation whose
// intent layer comes from the planning INPUT file (and an optional
// feedback memo file), instead of a persona hardcoded in code.
// Factual discipline is identical to the other generation paths: the
// generation start condition is checkGenerationInput (approval in
// force, recomputed), every sentence cites FACT keys and source
// lines, and checkGrounding is the same yardstick, re-run here.
// The runner never creates an approval; a refusal happens before any
// API call and costs nothing. Fictional data only.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MODEL, BASE_URL, MAX_TOKENS, RATES_KNOWN, checkGenerationInput, checkGrounding } from "./generate.mjs";
import { intentFromPlanning, sha256Text } from "./planning.mjs";

export const PLANNING_PROMPT_VERSION = "lp-generate-v6-planning";

// Planning-path messages. The materials are the approved FACTs AND
// the original posting's lines: items the FACT schema does not carry
// (the work content, holidays, qualifications) live in the original's
// lines and are citable by line. Every appeal in the planning must be
// carried by at least one sentence, and the work content must be
// stated: what is important in the original must not be dropped
// (user, 2026-11-04). The persona prompt's posting-specific leftovers
// (another posting's hours, its unstated-item passages) are not here.
export function buildPlanningGenerationMessages(facts, original, planning, intent) {
  const stated = (facts?.items ?? []).filter((i) => i.status === "stated");
  const unstated = (facts?.items ?? []).filter((i) => i.status === "unstated");
  const lines = Array.isArray(original?.lines) ? original.lines : [];
  const appeals = Array.isArray(planning?.appeals) ? planning.appeals : [];
  const workLine = lines.find((l) => /^(仕事内容|Work\s*:|Duties\s*:|Job description)/i.test(l?.text ?? ""));
  const system = [
    planning?.language === "en" ? "You write English LP (landing page) copy sentences for a fictional job posting, strictly from the materials: the approved FACT items and the original posting's lines." : "You write Japanese LP (landing page) copy sentences for a fictional job posting, strictly from the materials: the approved FACT items and the original posting's lines.",
    "Factual rules:",
    "- Use only what the FACT items and the original's lines state. Never add information that is in neither.",
    "- Keep numbers, times, periods and conditions exactly as written (for example 時給1,350円, 月上限15,000円, 07:00〜16:00, 休憩60分, 契約期間3か月). Do not convert, round, or rephrase quantities and conditions.",
    "- Content the FACT schema does not carry (the work content, holidays, qualifications) is stated in the original's lines: state it as the original states it, citing the line in sourceLines.",
    "- Items listed as unstated have no value. Either omit them, or write a sentence that states only that the item is not stated (未記載), which may close with an inquiry invitation (お気軽にお問い合わせください). Never assert a value for them.",
    "- Never invent a contact detail or application method (no phone, email, URL, form, or steps).",
    "- For every sentence, list the FACT keys (factKeys) and/or the original line IDs (sourceLines) it is based on. A sentence must cite at least one of them, and must cite every key and line it uses.",
    "Coverage (binding):",
    "- Write at least one sentence for EVERY appeal listed below, carrying that appeal's point in the recruiter's voice, grounded in its factKeys and/or sourceLines.",
    ...(workLine ? [`- Write a sentence stating the work content from the original line ${workLine.id} (what the work itself is), citing ${workLine.id}.`] : []),
    "- Also cover the stated conditions. Order the sentences in the appeals' order, with the work content early.",
    "Voice:",
    // The review finding wired in (loop-016 persona reviews; spec
    // inventory #22, recorded as unfulfilled through run25): the
    // sentences were bare restatements of the facts ("XはYです"),
    // so the appeals never worked. A finding changes nothing until
    // it reaches the production path — this rule is that wiring
    // (the user's learning-flow doctrine, 2026-11-03/04).
    "- A sentence that only restates a fact does not carry an appeal. For every appeal, state the fact AND what it means for the reader described in the audience, in the recruiter's voice. The meaning must come only from the fact itself and the appeal's framing: never add a new fact, condition, benefit, or promise that the materials do not state.",
    "- The work-content sentence is the page's headline. State plainly what the job is, so a reader knows what job this posting is for from that sentence alone.",
    ...(intent?.voice?.rules ?? []).map((r) => `- ${r}`),
    `- Audience: ${planning?.audience ?? ""}`,
    "Appeals to carry (id / text / factKeys / sourceLines):",
    ...appeals.map((a) => `- ${a.id}: ${a.text} (factKeys: ${(a.factKeys ?? []).join(", ") || "none"}; sourceLines: ${(a.sourceLines ?? []).join(", ") || "none"})`),
    "- Output JSON only, no markdown fences.",
    'Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}',
  ].join("\n");
  const materials = [
    "Stated FACT items (key / value / sourceLine / quote):",
    ...stated.map((i) => `- ${i.key}: value=${JSON.stringify(i.value)} sourceLine=${i.sourceLine} quote=${JSON.stringify(i.quote)}`),
    "Unstated FACT items (no value exists):",
    ...unstated.map((i) => `- ${i.key}: 未記載 sourceLine=${i.sourceLine}`),
    "Original posting lines:",
    ...lines.map((l) => `- ${l.id}: ${l.text}`),
  ].join("\n");
  const user = `Materials for ${facts?.factsId} version ${facts?.factsVersion}:\n${materials}\n\nWrite the LP copy sentences as JSON per schema.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
// D4 rates for muse-spark-1.3-contributor (USD per 1M tokens).
const RATE_INPUT_PER_1M = 0.10;
const RATE_OUTPUT_PER_1M = 0.20;

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

export function assemblePlanningGeneration(content, facts, approval, planningRef) {
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
    promptVersion: PLANNING_PROMPT_VERSION,
    model: MODEL,
    intentRef: planningRef,
    input: {
      original: { id: approval.target.original.id, version: approval.target.original.version, file: approval.target.original.file, sha256: approval.target.original.sha256 },
      facts: { factsId: approval.target.facts.factsId, factsVersion: approval.target.facts.factsVersion, file: approval.target.facts.file, sha256: approval.target.facts.sha256 },
      approvalId: approval.approvalId,
    },
    sentences,
  };
}

// Full planning generation flow. callModel(messages) is injected so
// tests can stub the API; it must resolve to { content, usage, model }
// or throw. planning is the parsed planning object; planningRef is
// recorded into the generation header ({ file, sha256 }).
export async function runPlanningGeneration({ root, originalFile, factsFile, approvalFile, planning, planningRef, feedbackText, callModel }) {
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
      promptVersion: PLANNING_PROMPT_VERSION,
      intentRef: planningRef ?? null,
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
  const intent = intentFromPlanning(planning, feedbackText ?? null);
  const messages = buildPlanningGenerationMessages(facts, original, planning, intent);
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
    generation = assemblePlanningGeneration(res.content, facts, approval, planningRef);
  } catch (e) {
    parseError = String(e && e.message ? e.message : e);
  }
  const grounding = generation ? checkGrounding(generation, facts, original) : { pass: false, checked: 0, issues: [{ sentence: null, issue: "no generation to check" }] };
  return {
    status: generation ? "generated" : "parse-error",
    parseError,
    model: res.model ?? MODEL,
    requestedModel: MODEL,
    promptVersion: PLANNING_PROMPT_VERSION,
    intentRef: planningRef ?? null,
    feedbackApplied: Boolean(feedbackText),
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

async function callModelLive(messages) {
  const apiKey = process.env.MODEL_API_KEY;
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0, ...(MAX_TOKENS ? { max_tokens: MAX_TOKENS } : {}) }),
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
  const planningFile = argValue(argv, "--planning");
  const feedbackFile = argValue(argv, "--feedback");
  const out = argValue(argv, "--out");
  const runOut = argValue(argv, "--run-out");
  if (!approvalFile || !originalFile || !factsFile || !planningFile) {
    console.error("usage: generate-planning.mjs --approval <f> --original <f> --facts <f> --planning <f> [--feedback <f>] [--out <generation.json>] [--run-out <run.json>]");
    process.exitCode = 2;
    return;
  }
  const planningRaw = readFileSync(path.join(root, planningFile), "utf8");
  const planning = JSON.parse(planningRaw);
  const planningRef = { source: "planning-input", file: planningFile, sha256: sha256Text(planningRaw) };
  const feedbackText = feedbackFile && existsSync(path.join(root, feedbackFile)) ? readFileSync(path.join(root, feedbackFile), "utf8") : null;
  if (feedbackFile) {
    planningRef.feedback = { file: feedbackFile, sha256: feedbackText ? sha256Text(feedbackText) : null, note: "フィードバックメモの編纂は人間/統括の作業であり、本道具は入力として受け取り記録する" };
  }
  // Input check first; a refusal must not need an API key at all.
  const input = checkGenerationInput({ root, originalFile, factsFile, approvalFile });
  if (!input.ok) {
    const record = { status: "refused", reasonCode: input.reasonCode, reason: input.reason, apiCalled: false };
    console.log(JSON.stringify(record, null, 2));
    if (runOut) {
      mkdirSync(path.dirname(path.join(root, runOut)), { recursive: true });
      writeFileSync(path.join(root, runOut), JSON.stringify({ ...record, model: MODEL, promptVersion: PLANNING_PROMPT_VERSION, intentRef: planningRef, retries: 0, usage: null, costUsd: 0 }, null, 2) + "\n", "utf8");
    }
    process.exitCode = 3;
    return;
  }
  if (!process.env.MODEL_API_KEY) {
    console.log(JSON.stringify({ status: "blocked", reason: "MODEL_API_KEY is not set in the environment. Live Meta Model API call was not attempted.", apiCalled: false }, null, 2));
    process.exitCode = 2;
    return;
  }
  let result;
  try {
    result = await runPlanningGeneration({ root, originalFile, factsFile, approvalFile, planning, planningRef, feedbackText, callModel: callModelLive });
  } catch (err) {
    console.log(JSON.stringify({ status: "api-error", httpStatus: err.httpStatus ?? null, errorBody: err.errorBody ?? String(err && err.message ? err.message : err) }, null, 2));
    process.exitCode = 1;
    return;
  }
  if (out && result.generation) {
    mkdirSync(path.dirname(path.join(root, out)), { recursive: true });
    writeFileSync(path.join(root, out), JSON.stringify(result.generation, null, 2) + "\n", "utf8");
  }
  if (runOut) {
    const { generation, ...runRecord } = result;
    mkdirSync(path.dirname(path.join(root, runOut)), { recursive: true });
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
