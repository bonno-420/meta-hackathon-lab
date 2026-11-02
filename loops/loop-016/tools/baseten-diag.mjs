#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const MODEL = "meta-models/muse-spark-open-1026";
const BASE_URL = process.env.BASETEN_BASE_URL || "https://inference.baseten.co/v1";

function loadApiKey() {
  if (process.env.BASETEN_API_KEY) return { source: "env:BASETEN_API_KEY", key: process.env.BASETEN_API_KEY };
  const p = join(homedir(), ".config", "opencode", "baseten-api-key");
  if (existsSync(p)) return { source: `file:${p}`, key: readFileSync(p, "utf8").trim() };
  return { source: null, key: null };
}

function buildMessagesEn(topic) {
  const system = [
    "You write English LP (landing page) copy sentences for a fictional Japanese job posting. The FACT items are given in Japanese; you must keep every numeric value verbatim (e.g. 1,250\u5186, 1,180\u5186, \u90313\u65e5\u301c\u30011\u65e54\u6642\u9593\u301c, \u90312\u65e5\u301c\u30011\u65e53\u6642\u9593\u301c, \u67081\u4e07\u5186\u307e\u3067, \u4e0a\u96505\u5343\u5186, 3\u65e5\u9593, \u6708\u3054\u3068).",
    "Rules:",
    "- Use only the stated FACT items. Never invent information not in the FACTs or the plan.",
    "- Write plain descriptive English sentences. Keep it natural but factual; no hype, no greetings, no invented benefits.",
    "- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines). A sentence must cite at least one key and at least one line, and must cite every key and line it uses.",
    "- Keep numbers, amounts, durations and conditions exactly as written in the FACT values. Do not convert yen, do not translate time expressions into different quantities.",
    "- If a FACT is not to be asserted, state only that it is not stated; do not fabricate.",
    "- Output JSON only, no markdown fences.",
    'Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}',
  ].join("\n");
  const planBlock = [
    `Plan (fixed before generation):`,
    `- Target audience: ${topic.plan.targetAudience}`,
    `- Appeal: ${topic.plan.appeal}`,
    `- Constraints: ${topic.constraints}`,
  ].join("\n");
  const materials = [
    `Materials for ${topic.id} (${topic.label}) -- version ${topic.sourceFingerprint}:`,
    planBlock,
    "Stated FACT items (key / value / sourceLine) -- values are Japanese, keep them verbatim in English rendering:",
    ...topic.facts.map((f) => `- ${f.key}: value=${JSON.stringify(f.value)} sourceLine=${f.sourceLine}`),
  ].join("\n");
  const user = `${materials}\n\nWrite the English LP copy sentences as JSON per schema. Keep every factual value verbatim while rendering the sentences in English.`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

function buildMessagesJa(topic) {
  const system = [
    "You write Japanese LP (landing page) copy sentences for a fictional job posting, strictly from the given FACT items.",
    "Rules:",
    "- Use only the stated FACT items. Never add information that is not in the FACTs or the plan.",
    "- Write plain descriptive sentences in Japanese. No greetings, appeals, or embellishment beyond the plan's\u8a34\u6c42 direction.",
    "- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines).",
    "- Keep numbers and conditions exactly as written in the FACT values (e.g. 1,250\u5186, \u90313\u65e5\u301c\u30011\u65e54\u6642\u9593\u301c, \u67081\u4e07\u5186\u307e\u3067, 3\u65e5\u9593, \u6708\u3054\u3068). Do not convert, round, or rephrase quantities.",
    "- Output JSON only, no markdown fences.",
    'Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}',
  ].join("\n");
  const planBlock = [
    `\u4f01\u753b\uff08\u4e8b\u524d\u306b\u56fa\u5b9a\u3002\u751f\u6210\u524d\u306b\u78ba\u5b9a\u6e08\u307f\uff09:`,
    `- \u5bfe\u8c61\u5c64: ${topic.plan.targetAudience}`,
    `- \u8a34\u6c42: ${topic.plan.appeal}`,
    `- \u5236\u7d04: ${topic.constraints}`,
  ].join("\n");
  const materials = [
    `Materials for ${topic.id} (${topic.label}) -- \u958b\u59cb\u6642\u306e\u7248 ${topic.sourceFingerprint}:`,
    planBlock,
    "Stated FACT items (key / value / sourceLine):",
    ...topic.facts.map((f) => `- ${f.key}: value=${JSON.stringify(f.value)} sourceLine=${f.sourceLine}`),
  ].join("\n");
  const user = `${materials}\n\nWrite the LP copy sentences as JSON per schema. Respect the plan's\u8a34\u6c42 direction while keeping every factual value verbatim.`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

async function tryFetch(label, messages, maxTokens) {
  const { key, source } = loadApiKey();
  console.error(`\n[diag:${label}] key source=${source} keyLen=${key ? key.length : 0} prefix=${key ? key.slice(0,8)+"..." : "none"}`);
  console.error(`[diag:${label}] messages systemLen=${messages[0]?.content?.length} userLen=${messages[1]?.content?.length}`);
  const url = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;
  const body = { model: MODEL, messages, max_tokens: maxTokens, temperature: 0.4 };
  // Try header style 1: Authorization: Api-Key <key>
  for (const style of ["Authorization: Api-Key", "Api-Key", "Authorization: Bearer"]) {
    const headers = { "Content-Type": "application/json" };
    if (style === "Authorization: Api-Key") headers["Authorization"] = `Api-Key ${key}`;
    else if (style === "Api-Key") headers["Api-Key"] = key;
    else if (style === "Authorization: Bearer") headers["Authorization"] = `Bearer ${key}`;
    console.error(`[diag:${label}] trying header style: ${style}`);
    try {
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      const text = await res.text();
      console.error(`[diag:${label}] ${style} -> HTTP ${res.status} ${res.statusText} bodyLen=${text.length} snippet=${text.slice(0,300).replace(/\n/g,"\\n")}`);
      if (res.ok) {
        try {
          const j = JSON.parse(text);
          console.error(`[diag:${label}] usage=${JSON.stringify(j.usage)} choices0=${j.choices?.[0]?.message?.content?.slice(0,100)}`);
        } catch {}
        return true;
      }
      // if 401, try next style
      if (res.status !== 401) return false;
    } catch (e) {
      console.error(`[diag:${label}] ${style} fetch error: ${String(e)}`);
    }
  }
  return false;
}

async function main() {
  const topicA = JSON.parse(readFileSync("loops/loop-015/topics/topic-A.json", "utf8"));
  // 1) ping minimal
  await tryFetch("ping", [{ role: "user", content: "ping" }], 16);
  // Need small delay to avoid rate
  await new Promise(r => setTimeout(r, 500));
  // 2) Japanese prompt (same as baseten-generate-small)
  await tryFetch("JA-A", buildMessagesJa(topicA), 4000);
  await new Promise(r => setTimeout(r, 500));
  // 3) English prompt (same as baseten-loop-en)
  await tryFetch("EN-A", buildMessagesEn(topicA), 4000);
}

main().catch(e => { console.error(String(e.stack||e)); process.exit(1); });
