#!/usr/bin/env node
// loop16-review.mjs — ペルソナレビュー（Meta枠、Baseten枠に含めない）
// 使い方: node loops/loop-016/tools/loop16-review.mjs --case A --gen 001
// 入力はテキストのみ（完成LPのbase64は送らない）。4観点を原文のまま記録

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const MODEL = "muse-spark-1.3-contributor";
const BASE_URL = process.env.META_BASE_URL || "https://api.meta.ai/v1";

function loadMetaKey() {
  if (process.env.MODEL_API_KEY) return { source: "env:MODEL_API_KEY", key: process.env.MODEL_API_KEY };
  const p = join(homedir(), ".config", "opencode", "meta-api-key");
  if (existsSync(p)) {
    const raw = readFileSync(p, "utf8").trim();
    if (raw) return { source: `file:${p}`, key: raw };
  }
  return { source: null, key: null };
}

async function main() {
  const args = process.argv.slice(2);
  let c = null, gen = "001";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--case" && args[i + 1]) { c = args[i + 1].toUpperCase(); i++; }
    else if (args[i] === "--gen" && args[i + 1]) { gen = String(args[i + 1]).padStart(3, "0"); i++; }
  }
  if (!c || !("ABCDEF".includes(c))) { console.error("Usage: --case A|B|C|D|E|F [--gen 001]"); process.exit(2); }
  const caseData = JSON.parse(readFileSync(resolve(`loops/loop-016/cases/case-${c}.json`), "utf8").replace(/^\uFEFF/, ""));
  const genRec = JSON.parse(readFileSync(resolve(`loops/loop-016/generations/case-${c}/gen-${gen}.json`), "utf8").replace(/^\uFEFF/, ""));
  const sentences = (genRec.generation?.sentences || []).map((s, i) => `${i + 1}. ${s.text} 〔${(s.factKeys || []).join(",")} / ${(s.sourceLines || []).join(",")}〕`).join("\n");
  const facts = caseData.facts.map((f) => `- ${f.key}: ${f.value} (${f.sourceLine})`).join("\n");

  const system = [
    "You are a fresh-eye persona reviewer for a fictional job LP. Read as the persona below.",
    "Return EXACTLY four sections with concrete verbatim quotes from the sentences. Do not summarize away problems; quote the sentence that is unclear or AI-like.",
    "Sections:",
    "1. Unclear — which sentence or fact is hard to understand, and why (quote it).",
    "2. Drop-off — where would this persona stop reading or hesitate to apply, and why (quote it).",
    "3. Applicant questions — list 2-4 concrete questions this persona would ask before applying (grounded in the facts).",
    "4. AI-ness — which sentence sounds AI-generated, with the specific phrase quoted as evidence. If none, say 'None found' with one line of reasoning.",
    "Rules: base every point on the given sentences/facts only. Do not invent new facts. Keep it in English. Output markdown with the four headings.",
  ].join("\n");
  const user = [
    `Persona: ${caseData.plan.persona}`,
    `Target audience: ${caseData.plan.targetAudience}`,
    `Case: ${caseData.id} (${caseData.label})`,
    "",
    "FACTs:",
    facts,
    "",
    "LP sentences (generation output):",
    sentences,
    "",
    "CTA: " + caseData.plan.cta,
    "Must NOT: " + (caseData.plan.mustNot || []).join(" / "),
  ].join("\n");

  const { key, source } = loadMetaKey();
  if (!key) { console.error("Meta key not found"); process.exit(2); }
  const url = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;
  const body = { model: MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.3, max_tokens: 4000 };
  const startedAt = new Date().toISOString();
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok || !json) {
    console.error(`Meta review failed: HTTP ${res.status} ${text.slice(0, 400)}`);
    process.exit(1);
  }
  const content = json.choices?.[0]?.message?.content ?? "";
  const usage = json.usage ?? null;
  if (!content) { console.error("Empty review content"); process.exit(1); }

  const date = new Date().toISOString().slice(0, 10);
  const md = `# Persona review: ${caseData.id} gen-${gen}\n\n- case: ${caseData.id} (${caseData.label})\n- LP: previews/case-${c}-gen-${gen}-complete.html\n- persona: ${caseData.plan.persona}\n- date: ${date}\n- model: ${MODEL} (Meta枠, Baseten枠に含めない)\n- usage: ${usage ? `prompt ${usage.prompt_tokens ?? "?"} / completion ${usage.completion_tokens ?? "?"} / total ${usage.total_tokens ?? "?"}` : "未記録"}\n- keySource: ${source} (値は記録しない)\n\n${content}\n\n---\n\n## 原文の扱い\n\n- 上記4観点はモデルの原文のまま記録（要約しない）。run-record.md のペルソナレビュー表へ要旨リンクする\n- 画像の文字・数字・ロゴ混入の目視は別途ファイル確認で行い、本レビューは文章中心\n`;
  const outDir = resolve("loops/loop-016/reviews");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `case-${c}-gen-${gen}-review.md`);
  writeFileSync(outPath, md, "utf8");
  console.error(`[loop16-review] wrote ${outPath} (${md.length} bytes) usage=${usage ? JSON.stringify(usage) : "n/a"}`);
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
