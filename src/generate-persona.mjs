// Step 3 persona path (loop-013 procedure 2 preparation): LP generation
// with an explicit intent layer (lp-generate-v3-persona).
// Fictional data only.
//
// The type-less path (lp-generate-v1 in src/generate.mjs) and loop-012's
// typed path (lp-generate-v2-typed in src/generate-typed.mjs) are untouched.
// This module adds a structured intent layer (speaker S-01, target layer,
// persona P-01 with W1-W5) on top of the same factual discipline: use only
// stated FACTs; every sentence cites factKeys+sourceLines and cites every
// key/line it uses; numbers/times verbatim; unstated only as 未記載;
// output JSON only with the same schema; never present a monthly income
// figure.
//
// Reference set for loop-013 (approved): LIB-PAT-002 v1 + LIB-PAT-003 v1 +
// LIB-PAT-004 v1 from LIB-CATALOG-V1. LIB-PAT-001 is excluded and is never
// a used pattern here.
//
// The trial-note expression follows loop-012: state income variation as
// fact (work days, overtime changes), meaning stays trial/not guaranteed.
// API key handling matches src/generate.mjs: read only from env
// MODEL_API_KEY, never logged.

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
export const PERSONA_PROMPT_VERSION = "lp-generate-v3-persona";
export const PERSONA_CATALOG_ID = "LIB-CATALOG-V1";
export const PERSONA_INTENT_SOURCE = "loops/loop-013/persona-design.md";
// D4 rates for muse-spark-1.3-contributor (USD per 1M tokens), same as src/generate.mjs.
const RATE_INPUT_PER_1M = 0.10;
const RATE_OUTPUT_PER_1M = 0.20;

// Structured intent layer, from loops/loop-013/persona-design.md
// (approved with modification 2026-10-29). Persona P-01
// "条件を見比べてから決めたい、短期勤務の検討者"; speaker S-01
// (求人の担当者, 当事者; the text is the entrance to the application
// funnel; not a third-party verifier's voice).
export const INTENT = {
  speaker: {
    id: "S-01",
    label: "求人の担当者（当事者）",
    stance: "The job recruiter as the party offering the posting: presents this posting's own conditions so the reader can judge fit. Addresses the reader as the offering side.",
    funnelPosition: "The text is the entrance to the application funnel: show conditions accurately so the reader can self-judge. It does not complete the application itself.",
    neverVoice: "Never a third-party verifier/auditor voice.",
  },
  targetLayer: {
    description: "Short-term 3-month fixed-term work; estimates income from hourly wage and work days; weighs contract shortness and uncertainty; checks daytime hours.",
    points: [
      "短期（3か月）の有期契約の仕事を検討する層",
      "時給と勤務日数から収入の見通しを自分で見積もる",
      "契約期間の短さと先行きの分からなさもあわせて慎重に見比べる",
      "昼間の決まった時間帯（09:00〜18:00）で働けるかを確かめたい",
    ],
  },
  persona: {
    id: "P-01",
    label: "条件を見比べてから決めたい、短期勤務の検討者",
    worries: [
      { id: "W1", worry: "契約が3か月で、その先が読めない", appeal: "期間を示し、更新が未記載であることは質問への誘いとして表現する", factKeys: ["contractPeriod", "renewal"], sourceLines: ["L02"] },
      { id: "W2", worry: "月々の収入の見通しを現実的に見積もりたい", appeal: "時給と試算の仮定を示し、収入は勤務日数や残業の増減などで変動するものとして述べる", factKeys: ["salaryHourly", "monthlyDaysAssumption", "monthlyIncomeGuarantee"], sourceLines: ["L03", "L04"] },
      { id: "W3", worry: "働く時間帯が生活と合うか、1日の長さを知りたい", appeal: "勤務時間と休憩・実働をそのまま示し、昼間の固定した時間帯であることを伝える", factKeys: ["workHours", "breakMinutes", "actualHours"], sourceLines: ["L04"] },
      { id: "W4", worry: "通勤にかかる費用が持ち出しにならないか", appeal: "交通費が実費支給で月上限があることを、上限の金額とともに示す", factKeys: ["transport", "transportCap"], sourceLines: ["L05"] },
      { id: "W5", worry: "遠方から通う場合の住まいが気になる", appeal: "寮の有無と費用は未記載であることを質問への誘いとして表現する", factKeys: ["housing"], sourceLines: ["L06"] },
    ],
  },
  voice: {
    rules: [
      "Write as the recruiter speaking to the reader (offering side), plain and factual.",
      "No greetings or sales hype.",
      "No verifier/auditor wording in the generated text.",
      "Unstated items stay unstated (未記載), closed with an inquiry invitation in market-standard form.",
      "Never invent a contact detail or application method.",
    ],
  },
};

function describePattern(p) {
  const composition = Array.isArray(p.composition) ? p.composition.join(" -> ") : "";
  const slots = Array.isArray(p.slots)
    ? p.slots.map((s) => `  - ${s.name}: may_enter=${s.may_enter}; condition=${s.condition}`).join("\n")
    : "";
  return `- ${p.id} (version ${p.version})\n  composition: ${composition}\n${slots}`;
}

function describeIntent() {
  const w = INTENT.persona.worries
    .map((x) => `- ${x.id}: worry=${x.worry}; appeal=${x.appeal}; factKeys=${x.factKeys.join(",")}; sourceLines=${x.sourceLines.join(",")}`)
    .join("\n");
  return [
    `Speaker ${INTENT.speaker.id} (${INTENT.speaker.label}): ${INTENT.speaker.stance} ${INTENT.speaker.funnelPosition} ${INTENT.speaker.neverVoice}`,
    `Target layer: ${INTENT.targetLayer.description}`,
    ...INTENT.targetLayer.points.map((p) => `  - ${p}`),
    `Persona ${INTENT.persona.id} (${INTENT.persona.label}):`,
    w,
    "Voice rules:",
    ...INTENT.voice.rules.map((r) => `- ${r}`),
  ].join("\n");
}

// Prompt lp-generate-v3-persona. Factual rules mirror
// buildGenerationMessages in src/generate.mjs, plus the intent layer,
// the loop-013 pattern set (shape only), the merged order, the speaker
// voice, the inquiry-invitation closing, and the softened monthly-income
// instruction.
export function buildPersonaGenerationMessages(facts, patterns) {
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
    "Intent layer (structured; from loops/loop-013/persona-design.md):",
    describeIntent(),
    "Structured pattern input (sentence shape only):",
    ...list.map((p) => describePattern(p)),
    "- Patterns give sentence shape only and never supply facts, numbers, or names. Every value, number, time, and name still comes from the FACT items above.",
    "Sentence order (merged for this set):",
    "- 1. Identification/conditions first: the posting identification and stated conditions (contract period, salary, trial note) kept verbatim.",
    "- 2. Work hours translated into the reader's life terms: restate the stated hours (09:00〜18:00, 休憩60分, 実働8時間) as the daytime fixed slot the reader can check against daily life. Only from the stated hours; add no new life facts or conditions.",
    "- 3. Transport: the stated transport condition kept verbatim.",
    "- 4. Unstated items with inquiry closing: renewal and housing shown only as not stated (未記載), each closable with an inquiry invitation (see below).",
    "Speaker voice (S-01):",
    "- Write as the recruiter speaking to the reader (offering side), plain and factual. No greetings or sales hype.",
    "- Never use verifier/auditor wording in the generated text: do not put 検証, 監査, FACT, or 根拠 as words in the generated text.",
    "Unstated items with inquiry invitation (W1 renewal, W5 housing):",
    "- The sentence must state 未記載 AND may close with an inquiry invitation in market-standard form (e.g. お気軽にお問い合わせください / ご相談ください).",
    "- Never invent a contact detail or application method (no phone, email, URL, form, or steps). The invitation is wording only, with no contact detail.",
    "Softened monthly-income expression (loop-012 wording kept; FACT v1 unchanged):",
    "- When monthly income is mentioned, do not use a flat denial alone; state that actual income varies with the number of work days and changes in overtime etc. (実際の収入は勤務日数や残業の増減などで変動する), mark the 20-day figure as a trial assumption using 試算/仮定 wording (e.g. 試算用の仮定), and still make clear it is not guaranteed by including the wording 保証しない inside that same softer sentence.",
    "- Never present a monthly income figure.",
  ].join("\n");
  const materials = [
    "Stated FACT items (key / value / normalized / sourceLine / quote):",
    ...stated.map((i) => `- ${i.key}: value=${JSON.stringify(i.value)} normalized=${JSON.stringify(i.normalized)} sourceLine=${i.sourceLine} quote=${JSON.stringify(i.quote)}`),
    "Unstated FACT items (no value exists; 未記載):",
    ...unstated.map((i) => `- ${i.key}: 未記載 sourceLine=${i.sourceLine} quote=${JSON.stringify(i.quote)}`),
    `Reference set: catalog ${PERSONA_CATALOG_ID}; used patterns: ${list.map((p) => `${p.id} ${p.version}`).join(", ")}.`,
  ].join("\n");
  const user = `Materials for ${facts.factsId} version ${facts.factsVersion}:\n${materials}\n\nWrite the LP copy sentences as JSON per schema.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function promptText(facts, patterns) {
  const msgs = buildPersonaGenerationMessages(facts, patterns);
  return msgs.map((m) => `## ${m.role}\n\n${m.content}`).join("\n\n") + "\n";
}

function referenceSetOf(patterns) {
  const list = Array.isArray(patterns) ? patterns : [];
  return {
    catalog: PERSONA_CATALOG_ID,
    patterns: list.map((p) => ({ id: p.id, version: p.version })),
  };
}

function intentRefOf() {
  return { speaker: "S-01", persona: "P-01", source: PERSONA_INTENT_SOURCE };
}

// Parse the model output into the generation object. Throws on bad shape.
// Same sentence shape as assembleGeneration in src/generate.mjs, but with
// the persona prompt version, the referenceSet header, and the intentRef.
export function assemblePersonaGeneration(content, facts, approval, patterns) {
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
    promptVersion: PERSONA_PROMPT_VERSION,
    model: MODEL,
    referenceSet: referenceSetOf(patterns),
    intentRef: intentRefOf(),
    input: {
      original: { id: approval.target.original.id, version: approval.target.original.version, file: approval.target.original.file, sha256: approval.target.original.sha256 },
      facts: { factsId: approval.target.facts.factsId, factsVersion: approval.target.facts.factsVersion, file: approval.target.facts.file, sha256: approval.target.facts.sha256 },
      approvalId: approval.approvalId,
    },
    sentences,
  };
}

// Full persona generation flow. callModel(messages) is injected so tests
// can stub the API; it must resolve to { content, usage, model } (live) or
// throw. On refusal the flow returns before callModel is ever invoked.
export async function runPersonaGeneration({ root, originalFile, factsFile, approvalFile, patterns, callModel }) {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  const referenceSet = referenceSetOf(patterns);
  const intentRef = intentRefOf();
  const input = checkGenerationInput({ root, originalFile, factsFile, approvalFile });
  if (!input.ok) {
    return {
      status: "refused",
      reasonCode: input.reasonCode,
      reason: input.reason,
      approvalId: input.approvalId ?? null,
      model: MODEL,
      promptVersion: PERSONA_PROMPT_VERSION,
      referenceSet,
      intentRef,
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
  const messages = buildPersonaGenerationMessages(facts, patterns);
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
    generation = assemblePersonaGeneration(res.content, facts, approval, patterns);
  } catch (e) {
    parseError = String(e && e.message ? e.message : e);
  }
  const grounding = generation ? checkGrounding(generation, facts, original) : { pass: false, checked: 0, issues: [{ sentence: null, issue: "no generation to check" }] };
  return {
    status: generation ? "generated" : "parse-error",
    parseError,
    model: res.model ?? MODEL,
    requestedModel: MODEL,
    promptVersion: PERSONA_PROMPT_VERSION,
    referenceSet,
    intentRef,
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

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
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
    console.error("usage: generate-persona.mjs --approval <f> --original <f> --facts <f> --catalog <f> --patterns LIB-PAT-002,LIB-PAT-003,LIB-PAT-004 [--out <persona-generation.json>] [--run-out <run.json>]");
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
      writeFileSync(path.join(root, runOut), JSON.stringify({ ...record, model: MODEL, promptVersion: PERSONA_PROMPT_VERSION, referenceSet: referenceSetOf([]), intentRef: intentRefOf(), retries: 0, usage: null, costUsd: 0 }, null, 2) + "\n", "utf8");
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
    writeFileSync(path.join(path.dirname(path.join(root, out)), `prompt-${PERSONA_PROMPT_VERSION}.md`), promptText(facts, selected), "utf8");
  }
  let result;
  try {
    result = await runPersonaGeneration({ root, originalFile, factsFile, approvalFile, patterns: selected, callModel: callModelLive });
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
