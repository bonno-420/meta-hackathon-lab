#!/usr/bin/env node
// loop16-vanilla.mjs — vanilla contrast: facts-only ticket → single LP via Meta API
// Uses prompt-v1.0 verbatim per case, no plan/research/insights, no retouching.
// Images: gen-001 3 per case reused for both models.
// Output: loops/loop-016/vanilla/{wonder,spark}/case-{a..f}.html + meta.json
// Baseten枠を消費しない（Meta APIのみ）。

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const BASE_URL = process.env.META_BASE_URL || "https://api.meta.ai/v1";
const PROMPT_PATH = "loops/loop-016/vanilla/prompt-v1.0.md";

const MODEL_MAP = {
  wonder: "muse-wonder-1.0",
  spark: "muse-spark-1.3",
};

function loadMetaKey() {
  if (process.env.MODEL_API_KEY) return { source: "env:MODEL_API_KEY", key: process.env.MODEL_API_KEY };
  const p = join(homedir(), ".config", "opencode", "meta-api-key");
  if (existsSync(p)) {
    const raw = readFileSync(p, "utf8").trim();
    if (raw) return { source: `file:${p}`, key: raw };
  }
  return { source: null, key: null };
}

function buildPrompt(caseLetter) {
  const template = readFileSync(resolve(PROMPT_PATH), "utf8");
  const ticket = readFileSync(resolve(`loops/loop-016/vanilla/inputs/case-${caseLetter.toLowerCase()}.md`), "utf8");
  return template.replace("{{TICKET}}", ticket);
}

async function generateOne(modelKey, caseLetter, dryRun) {
  const modelId = MODEL_MAP[modelKey];
  if (!modelId) throw new Error(`Unknown model key: ${modelKey}`);
  const prompt = buildPrompt(caseLetter);
  const lower = caseLetter.toLowerCase();
  const caseJson = JSON.parse(readFileSync(resolve(`loops/loop-016/cases/case-${caseLetter}.json`), "utf8").replace(/^\uFEFF/, ""));
  const sourceHash = caseJson._hash || null; // fallback compute
  const hashFile = resolve(`loops/loop-016/cases/case-${caseLetter}.json`);
  const hash = await computeSha256(hashFile);

  const outDir = resolve(`loops/loop-016/vanilla/${modelKey}`);
  mkdirSync(outDir, { recursive: true });

  if (dryRun) {
    console.error(`[vanilla:dry] ${modelKey}/${caseLetter} prompt=${prompt.length} chars hash=${hash.slice(0,12)}`);
    return;
  }

  const { key, source } = loadMetaKey();
  if (!key) {
    console.error("[vanilla] Meta API key not found — skipping generation, writing placeholder");
    writePlaceholder(modelKey, caseLetter, modelId, prompt, hash, null, source);
    return;
  }

  const url = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;
  const body = {
    model: modelId,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 8000,
  };

  const startedAt = new Date().toISOString();
  console.error(`[vanilla] ${modelKey}/${caseLetter} → ${modelId} ...`);

  let res, text, json;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
    text = await res.text();
    try { json = JSON.parse(text); } catch {}
  } catch (e) {
    console.error(`[vanilla] ${modelKey}/${caseLetter} fetch error: ${e.message}`);
    writePlaceholder(modelKey, caseLetter, modelId, prompt, hash, { error: e.message, startedAt }, source);
    return;
  }

  if (!res.ok || !json) {
    console.error(`[vanilla] ${modelKey}/${caseLetter} HTTP ${res?.status} ${text?.slice(0, 400)}`);
    writePlaceholder(modelKey, caseLetter, modelId, prompt, hash, { error: `HTTP ${res?.status}`, raw: text?.slice(0, 2000), startedAt }, source);
    return;
  }

  const content = json.choices?.[0]?.message?.content ?? "";
  const usage = json.usage ?? null;
  const finishedAt = new Date().toISOString();

  if (!content) {
    console.error(`[vanilla] ${modelKey}/${caseLetter} empty content`);
    writePlaceholder(modelKey, caseLetter, modelId, prompt, hash, { error: "empty content", usage, startedAt, finishedAt }, source);
    return;
  }

  // Write HTML (raw model output — single prompt, single response, no retouching)
  const htmlPath = join(outDir, `case-${lower}.html`);
  writeFileSync(htmlPath, content, "utf8");
  console.error(`[vanilla] wrote ${htmlPath} (${content.length} chars)`);

  // Embed images: copy gen-001 3 images beside HTML (or inject if HTML references them by known name)
  const imgSrcDir = resolve("loops/loop-016/previews/images");
  for (const suffix of ["hero", "work", "place"]) {
    const src = join(imgSrcDir, `case-${caseLetter}-${suffix}.webp`);
    const dst = join(outDir, `case-${lower}-${suffix}.webp`);
    if (existsSync(src) && !existsSync(dst)) {
      try { copyFileSync(src, dst); } catch {}
    }
  }

  // Write meta
  const meta = {
    generatedAt: finishedAt,
    startedAt,
    model: modelId,
    modelKey,
    case: caseLetter,
    caseId: caseJson.id,
    caseLabel: caseJson.label,
    promptPath: PROMPT_PATH,
    promptVersion: "v1.0",
    promptLength: prompt.length,
    ticketPath: `vanilla/inputs/case-${lower}.md`,
    ticketHash: hash,
    sourceCasePath: `cases/case-${caseLetter}.json`,
    sourceCaseHash: hash,
    keySource: source,
    usage,
    usageSummary: usage ? `prompt ${usage.prompt_tokens ?? "?"} / completion ${usage.completion_tokens ?? "?"} / total ${usage.total_tokens ?? "?"}` : "unknown",
    // no Baseten — this line does not consume Baseten quota
    quota: "Meta API (vanilla contrast, not Baseten)",
    images: `previews/images/case-${caseLetter}-{hero,work,place}.webp (gen-001, shared across models)`,
    htmlPath: `vanilla/${modelKey}/case-${lower}.html`,
    htmlLength: content.length,
  };
  const metaPath = join(outDir, `case-${lower}.meta.json`);
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
  console.error(`[vanilla] wrote ${metaPath} usage=${meta.usageSummary}`);

  // small delay to avoid rate limit
  await sleep(1200);
}

function writePlaceholder(modelKey, caseLetter, modelId, prompt, hash, extra, source) {
  const lower = caseLetter.toLowerCase();
  const outDir = resolve(`loops/loop-016/vanilla/${modelKey}`);
  mkdirSync(outDir, { recursive: true });
  const meta = {
    generatedAt: new Date().toISOString(),
    model: modelId,
    modelKey,
    case: caseLetter,
    caseId: `C-${caseLetter}`,
    promptPath: PROMPT_PATH,
    promptVersion: "v1.0",
    sourceCaseHash: hash,
    keySource: source,
    status: "not-generated",
    reason: extra?.error || "skipped (no key or dry-run)",
    promptLength: prompt.length,
    quota: "Meta API (vanilla contrast, not Baseten)",
    extra: extra || null,
  };
  const metaPath = join(outDir, `case-${lower}.meta.json`);
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
  console.error(`[vanilla] placeholder ${metaPath}`);
}

async function computeSha256(filePath) {
  const { createHash } = await import("node:crypto");
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const args = process.argv.slice(2);
  let models = [];
  let cases = [];
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && args[i + 1]) { models.push(args[i + 1].toLowerCase()); i++; }
    else if (args[i] === "--case" && args[i + 1]) { cases.push(args[i + 1].toUpperCase()); i++; }
    else if (args[i] === "--all") { models = ["wonder", "spark"]; cases = ["A","B","C","D","E","F"]; }
    else if (args[i] === "--dry-run") dryRun = true;
  }
  if (models.length === 0) models = ["wonder", "spark"];
  if (cases.length === 0) cases = ["A","B","C","D","E","F"];

  // verify prompt and inputs exist
  if (!existsSync(resolve(PROMPT_PATH))) { console.error(`Missing ${PROMPT_PATH}`); process.exit(1); }
  for (const c of cases) {
    if (!existsSync(resolve(`loops/loop-016/cases/case-${c}.json`))) { console.error(`Missing case ${c}`); process.exit(1); }
    if (!existsSync(resolve(`loops/loop-016/vanilla/inputs/case-${c.toLowerCase()}.md`))) { console.error(`Missing vanilla input case-${c.toLowerCase()}.md`); process.exit(1); }
  }

  for (const m of models) {
    for (const c of cases) {
      await generateOne(m, c, dryRun);
    }
  }
  console.error(`[vanilla] done: models=${models.join(",")} cases=${cases.join(",")} dryRun=${dryRun}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
