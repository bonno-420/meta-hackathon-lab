// Planning draft (loop-027, intervention I-2): until now the
// planning was always written by a human hand (the coordinator's),
// and the tool "did not make the planning" — the largest gap in
// making a posting by the pipeline's own power. This tool drafts
// the planning from the approved materials: the audience, the
// appeals with their FACT keys and source lines, the first-check
// keys, the not-say list, and the image specs. The draft is only a
// draft: deterministic validation checks every reference against
// the FACT set and the original's lines, and the planning review
// (a separate stage) judges the draft before anything is
// generated. In real use the planning is the intent layer and a
// human decides it; the draft exists so the human starts from a
// grounded proposal instead of a blank page.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL, callModelLive } from "./generate.mjs";
import { validatePlanning } from "./planning.mjs";

export const DRAFT_PROMPT_VERSION = "planning-draft-v1";

function loadJson(p) { return JSON.parse(readFileSync(p, "utf8")); }

export function buildDraftMessages(original, facts, hints = {}) {
  const stated = (facts?.items ?? []).filter((i) => i.status === "stated");
  const unstated = (facts?.items ?? []).filter((i) => i.status !== "stated");
  const lines = Array.isArray(original?.lines) ? original.lines : [];
  const system = [
    "You draft the PLANNING for a job-posting landing page, strictly from the materials: the approved FACT items and the original posting's lines. The planning decides who the reader is, what to appeal and in what order, what the reader checks first, what must not be said, and which images to design.",
    "Rules:",
    "- Use only what the FACT items and the original's lines state. Never invent a condition, benefit, or audience trait the materials do not support.",
    "- Audience: name the concrete reader (who, where, what situation), derived from the posting's conditions and the hints. Write it in the posting's language.",
    "- Appeals: one entry per point worth appealing. Each appeal MUST cite the FACT keys (factKeys) and/or original line IDs (sourceLines) it rests on — keys only from the stated FACT items, lines only from the original. Content the FACT schema does not carry (the work itself, holidays, qualifications) rests on lines.",
    "- Order the appeals by the reader's decision order, fronting the posting's strongest stated advantage (a benefit competitors would not all have: company-paid qualifications, housing support, a high rate for the work, a rare schedule fit). An ordinary condition does not outrank a distinctive advantage.",
    "- firstCheckKeys: exactly two stated FACT keys, chosen by DECISION IMPACT for this reader and this posting — they lead the page (hero chips and first cards), so they must be what actually decides the application. For hourly-paid part-time work the wage is normally a first check; a stated barrier-remover or a distinctive benefit can outrank the hours or the location. Do not default to hours/location when a stronger deciding fact is stated (the user's review of FICT-E03 run2, 2026-11-04: the wage and the no-experience point were buried while hours and location led).",
    "- notSay: the unstated items a reader might assume, each as {key, text} — they must never be asserted in copy or images.",
    "- imageSpecs: a key-visual (basis: the work appeal) and a section-work image (basis: factKey workLocation), each with a concrete description of the WORK being done (the actual tasks and objects from the work line). Never describe a building or workplace exterior.",
    "- The work appeal comes first: the reader must know what job this is before any condition.",
    ...(hints.language ? [`- Write the planning in this language: ${hints.language}. Set "language" to "${hints.language === "English" ? "en" : "ja"}".`] : []),
    ...(hints.audience ? [`- Client intent for the audience: ${hints.audience}`] : []),
    ...(hints.note ? [`- Client note: ${hints.note}`] : []),
    "- Output JSON only, no markdown fences.",
    'Schema: {"language":"en|ja","audience":"...","appeals":[{"id":"A1","text":"...","factKeys":["..."],"sourceLines":["L01"]}],"firstCheckKeys":["...","..."],"notSay":[{"key":"...","text":"..."}],"imageSpecs":[{"id":"key-visual","role":"key-visual","description":"...","basis":{"appealId":"A1"}},{"id":"section-work","role":"work","description":"...","basis":{"factKey":"workLocation"}}]}',
  ].join("\n");
  const user = [
    "Stated FACT items (key / value / sourceLine):",
    ...stated.map((i) => `- ${i.key}: ${JSON.stringify(i.value)} (${i.sourceLine})`),
    "Unstated FACT items (no value exists):",
    ...unstated.map((i) => `- ${i.key}`),
    "Original posting lines:",
    ...lines.map((l) => `- ${l.id}: ${l.text}`),
    "",
    "Draft the planning as JSON per schema.",
  ].join("\n");
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

// Deterministic validation of a draft: the shared planning
// validation, plus grounding of every reference the draft makes.
export function validateDraft(planning, facts, original) {
  const errors = [...validatePlanning(planning).errors];
  const statedKeys = new Set((facts?.items ?? []).filter((i) => i.status === "stated").map((i) => i.key));
  const allKeys = new Set((facts?.items ?? []).map((i) => i.key));
  const lineIds = new Set((original?.lines ?? []).map((l) => l.id));
  for (const a of planning?.appeals ?? []) {
    const keys = Array.isArray(a.factKeys) ? a.factKeys : [];
    const lines = Array.isArray(a.sourceLines) ? a.sourceLines : [];
    if (keys.length === 0 && lines.length === 0) errors.push(`appeal ${a.id} is grounded in nothing`);
    for (const k of keys) if (!statedKeys.has(k)) errors.push(`appeal ${a.id} cites factKey ${k}, which is not a stated FACT`);
    for (const l of lines) if (!lineIds.has(l)) errors.push(`appeal ${a.id} cites sourceLine ${l}, which is not in the original`);
  }
  for (const k of planning?.firstCheckKeys ?? []) if (!statedKeys.has(k)) errors.push(`firstCheckKey ${k} is not a stated FACT`);
  for (const ns of planning?.notSay ?? []) if (ns?.key && !allKeys.has(ns.key)) errors.push(`notSay key ${ns.key} is not a FACT key`);
  return { ok: errors.length === 0, errors };
}

export async function runDraftPlanning({ root, originalFile, factsFile, hints, callModel, feedbackText }) {
  const original = loadJson(path.join(root, originalFile));
  const facts = loadJson(path.join(root, factsFile));
  const messages = buildDraftMessages(original, facts, hints ?? {});
  if (feedbackText) messages.push({ role: "user", content: `The previous draft failed validation. Fix exactly these problems and output the full corrected JSON:\n${feedbackText}` });
  const started = Date.now();
  const res = await callModel(messages);
  let planning = null;
  let parseError = null;
  try { planning = JSON.parse(res.content); } catch (e) { parseError = String(e?.message ?? e); }
  const validation = planning ? validateDraft(planning, facts, original) : { ok: false, errors: [`draft was not JSON: ${parseError}`] };
  return {
    status: validation.ok ? "drafted" : "invalid",
    planning: validation.ok ? planning : null,
    rawPlanning: planning,
    validation,
    model: res.model ?? MODEL,
    promptVersion: DRAFT_PROMPT_VERSION,
    usage: res.usage ?? null,
    tokenBudget: res.tokenBudget ?? null,
    durationMs: Date.now() - started,
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
  const originalFile = argValue(argv, "--original");
  const factsFile = argValue(argv, "--facts");
  const out = argValue(argv, "--out");
  const runOut = argValue(argv, "--run-out");
  const hints = {
    language: argValue(argv, "--language") ?? undefined,
    audience: argValue(argv, "--audience-hint") ?? undefined,
    note: argValue(argv, "--note") ?? undefined,
  };
  if (!originalFile || !factsFile || !out) {
    console.error("usage: draft-planning.mjs --original <f> --facts <f> --out <planning.json> [--run-out <run.json>] [--language English] [--audience-hint <text>] [--note <text>]");
    process.exit(2);
  }
  let result = await runDraftPlanning({ root, originalFile, factsFile, hints, callModel: callModelLive });
  let attempts = 1;
  if (result.status !== "drafted") {
    // One bounded retry with the validation errors as feedback.
    attempts = 2;
    result = await runDraftPlanning({ root, originalFile, factsFile, hints, callModel: callModelLive, feedbackText: result.validation.errors.join("\n") });
    result.attempts = attempts;
  }
  if (result.status === "drafted" && result.planning) {
    mkdirSync(path.dirname(path.join(root, out)), { recursive: true });
    writeFileSync(path.join(root, out), JSON.stringify(result.planning, null, 2) + "\n", "utf8");
  }
  if (runOut) {
    mkdirSync(path.dirname(path.join(root, runOut)), { recursive: true });
    writeFileSync(path.join(root, runOut), JSON.stringify({ ...result, planning: undefined, draftedTo: result.status === "drafted" ? out : null }, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify({ status: result.status, validation: result.validation, model: result.model, promptVersion: result.promptVersion }));
  if (result.status !== "drafted") process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
}
