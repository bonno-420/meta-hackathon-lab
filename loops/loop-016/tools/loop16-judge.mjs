#!/usr/bin/env node
// loop16-judge.mjs — 第2層 Few-shot 対比ジャッジ（Meta枠、Baseten枠に含めない）
// 入力: loops/loop-016/previews/case-*-gen-*-complete.html + checks/pairs/*.md
// 出力: loops/loop-016/checks/case-*-gen-*-judge.md (verbatim)
// 欠陥カタログ P1-P5 ごとに ある/ない と根拠引用を返させる

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const MODEL = "muse-spark-1.3-contributor";
const BASE_URL = process.env.META_BASE_URL || "https://api.meta.ai/v1";
const MAX_TOKENS = 12000 // C-C gen-005 hit 8000 length (reasoning 7998), bumped to 12000

function loadMetaKey() {
  if (process.env.MODEL_API_KEY) return { source: "env:MODEL_API_KEY", key: process.env.MODEL_API_KEY };
  const p = join(homedir(), ".config", "opencode", "meta-api-key");
  if (existsSync(p)) {
    const raw = readFileSync(p, "utf8").trim();
    if (raw) return { source: `file:${p}`, key: raw };
  }
  return { source: null, key: null };
}

function stripToVisible(html, maxChars = 8000) {
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  // keep section headings markers
  s = s.replace(/<h1[^>]*>/gi, "\n[H1] ");
  s = s.replace(/<h2[^>]*>/gi, "\n[H2] ");
  s = s.replace(/<li[^>]*>/gi, "\n- ");
  s = s.replace(/<\/?[^>]+>/g, " ");
  s = s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > maxChars) s = s.slice(0, maxChars) + " …(truncated)";
  return s;
}

function loadPairs() {
  const dir = resolve("loops/loop-016/checks/pairs");
  let files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith(".md")).sort(); } catch {}
  const parts = [];
  for (const f of files) {
    try {
      const body = readFileSync(join(dir, f), "utf8");
      parts.push(`--- PAIR FILE: ${f} ---\n${body}`);
    } catch {}
  }
  return parts.join("\n\n");
}

const CATALOG = `
Defect catalog (page-level, language-agnostic, independent from prose 4-viewpoints):

P1 文の逐語反復による仕様書化 / Verbatim repetition spec-ifying the page
  — Same sentence appears verbatim 2+ times across sections (including intra-facts table repetition and double-posting facts↔body). Intentional CTA repost is NOT P1; spec-ifying repetition is. Cite the repeated sentence.

P2 検証側・メタ文の混入 / Verification/meta text contamination
  — Phrases that belong to the verification side ("What this means", "numbers stay exactly as stated", "as stated in the FACT", "Read the sentences above as the full conditions", "All facts below are the only stated facts" etc. JA: "求人票にない", "再計算はしない" etc.) appear in reader-facing copy. Cite the exact phrase.

P3 記録物（企画・根拠）の露出 / Internal record exposure
  — Planning labels (Target audience, Persona, Insights applied, factKeys, sourceLines, Appeal:, mustNot, 〔〕 citations, L01 etc.) are visible to the reader. Cite the label.

P4 見出しと中身のずれ / Heading-content mismatch
  — Section heading promises a scope but body contains out-of-scope factKeys (e.g. heading "Pay & Hours" but body includes team/training/benefits/company). List heading, allowed vs unexpected keys, quote the mismatched sentence.

P5 当事者の声の欠落（説明文化）/ Missing participant voice (explanatory culture only)
  — Page is fully explanatory/spec-like with no lived-voice or scenario grounding. Harder to judge mechanically; note if page is entirely descriptive. Cite what is missing (optional).

P6 [candidate] 読み手の第一確認項目がヒーローに出ていない / Reader's first-check item missing from hero (candidate)
  — The hero (h1 / first-screen title row) does not contain the reader's expected first-check item for this employment type. Examples: hourly roles where the persona checks pay first but hero shows only company name; contract roles where readers check term first but hero has no term badge; part-time where readers check time windows but hero has only role title. Use the research/research case files as the reference for what the first-check item is. Cite hero text verbatim and what is missing. (Candidate: permanence requires owner approval.)
`.trim();

function buildMessages({ caseId, caseLabel, visible, pairs }) {
  // Load research for P6 first-check reference if available
  let researchHint = "";
  try {
    const rcCommon = readFileSync(resolve("loops/loop-016/research/common.md"), "utf8");
    const rcCase = readFileSync(resolve(`loops/loop-016/research/case-${caseId.slice(-1).toLowerCase()}.md`), "utf8");
    const firstCheck = rcCase.match(/Reader's first-check item[\s\S]{0,600}?/)?.[0] || "";
    if (firstCheck) researchHint = `=== RESEARCH (for P6 — expression-type reference, NOT fact source) ===\n${firstCheck}\n(See common.md + case file for hero skeleton. P6 judges hero omission only.)`;
  } catch {}
  const system = [
    "You are a fresh-session page-level defect judge. You have no prior context about this project.",
    "You are given contrast pairs (bad/good examples) and a target page. Judge the target page ONLY against the defect catalog P1-P6.",
    "For each P1-P6, answer ある (present) or ない (absent). If ある, quote the exact evidence from the target page (verbatim fragment, 1-2 lines). If ない, write ない and one-line reason.",
    "Output markdown with exactly 6 headings: ## P1, ## P2, ## P3, ## P4, ## P5, ## P6. Under each, start with **判定: ある** or **判定: ない**, then 根拠: quote, then コメント: one sentence.",
    "P6 is candidate — judge it like the others but it does not affect overall pass/fail until approved.",
    "Do not invent facts. Quote only from the target page text provided. Keep evidence verbatim.",
    "Language: judgment labels and quotes may be EN or JA as the page is; explanations in Japanese is OK but keep quotes verbatim.",
  ].join("\n");

  const user = [
    `Case: ${caseId} (${caseLabel})`,
    "",
    "=== DEFECT CATALOG ===",
    CATALOG,
    "",
    "=== CONTRAST PAIRS (few-shot, bad vs good) ===",
    pairs,
    "",
    researchHint,
    "",
    "=== TARGET PAGE (visible text, truncated) ===",
    visible,
    "",
    "=== TASK ===",
    "Judge the TARGET PAGE against P1-P6 using the pairs as calibration. For each P, output 判定 and 根拠引用. Output verbatim markdown with 6 sections.",
  ].join("\n");

  return [{ role: "system", content: system }, { role: "user", content: user }];
}

async function judgeCase(c, gen, pairs) {
  const cLower = c.toLowerCase();
  const htmlPath = resolve(`loops/loop-016/previews/case-${c}-gen-${gen}-complete.html`);
  const html = readFileSync(htmlPath, "utf8");
  const visible = stripToVisible(html, 9000);
  const caseData = JSON.parse(readFileSync(resolve(`loops/loop-016/cases/case-${c}.json`), "utf8").replace(/^\uFEFF/, ""));
  const messages = buildMessages({ caseId: caseData.id, caseLabel: caseData.label, visible, pairs });
  const { key, source } = loadMetaKey();
  if (!key) throw new Error("Meta key not found");
  const url = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;
  const body = { model: MODEL, messages, temperature: 0.3, max_tokens: MAX_TOKENS };
  const startedAt = new Date().toISOString();
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok || !json) {
    throw new Error(`Meta judge failed: HTTP ${res.status} ${text.slice(0, 800)}`);
  }
  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error(`Empty judge content (reasoning may have consumed tokens): ${text.slice(0, 400)}`);
  const usage = json.usage ?? null;
  return { content, usage, source, startedAt, finishedAt: new Date().toISOString() };
}

async function main() {
  const args = process.argv.slice(2);
  let cases = [], gen = "001", outAll = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--case" && args[i+1]) { cases.push(args[i+1].toUpperCase()); i++; }
    else if (args[i] === "--gen" && args[i+1]) { gen = String(args[i+1]).padStart(3,"0"); i++; }
    else if (args[i] === "--all") outAll = true;
  }
  if (cases.length === 0) outAll = true;
  if (outAll) cases = ["A","B","C","D","E","F"];

  const pairs = loadPairs();
  if (!pairs) console.error("[judge] warning: no pairs loaded");

  const checksDir = resolve("loops/loop-016/checks");
  mkdirSync(checksDir, { recursive: true });

  const results = [];
  for (const c of cases) {
    const cLower = c.toLowerCase();
    const htmlPath = resolve(`loops/loop-016/previews/case-${c}-gen-${gen}-complete.html`);
    if (!existsSync(htmlPath)) {
      console.error(`[judge] skip ${c}: not found previews/case-${c}-gen-${gen}-complete.html`);
      continue;
    }
    console.error(`[judge] starting C-${c} gen-${gen} ...`);
    try {
      const { content, usage, source, startedAt, finishedAt } = await judgeCase(c, gen, pairs);
      const relPreview = `previews/case-${c}-gen-${gen}-complete.html`;
      const header = `# Judge (Layer 2 few-shot contrast) — C-${c} gen-${gen}\n\n- source: \`${relPreview}\`\n- tool: \`loop16-judge.mjs\` (Meta枠, Baseten枠に含めない)\n- model: ${MODEL}\n- date: ${new Date().toISOString().slice(0,10)}\n- started: ${startedAt}\n- finished: ${finishedAt}\n- usage: ${usage ? `prompt ${usage.prompt_tokens ?? "?"} / completion ${usage.completion_tokens ?? "?"} / total ${usage.total_tokens ?? "?"}` : "未記録"} (reasoning: ${usage?.completion_tokens_details?.reasoning_tokens ?? "?"})\n- keySource: ${source} (値は記録しない)\n- pairs: ${pairs ? "checks/pairs/*.md" : "(none)"}\n- pairsStatus: candidate\n- catalog: P1-P6 (P6 candidate — permanence requires owner approval)\n- note: Verbatim output below — not summarized. Candidate catalog P1-P6.\n\n---\n\n`;
      const md = header + content + `\n\n---\n\n## 原文の扱い\n\n- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。\n`;
      const outPath = join(checksDir, `case-${cLower}-gen-${gen}-judge.md`);
      writeFileSync(outPath, md, "utf8");
      console.error(`[judge] wrote ${outPath} usage=${usage ? JSON.stringify(usage) : "n/a"}`);
      results.push({ case: `C-${c}`, gen, outPath, usage });
      // also write raw json for usage tracking
      const jsonPath = join(checksDir, `case-${cLower}-gen-${gen}-judge.json`);
      writeFileSync(jsonPath, JSON.stringify({ case: `C-${c}`, gen, model: MODEL, usage, contentLength: content.length, pairsFiles: readdirSync(resolve("loops/loop-016/checks/pairs")).filter(f=>f.endsWith(".md")) }, null, 2) + "\n", "utf8");
    } catch (e) {
      console.error(`[judge] C-${c} failed: ${e.message}`);
      // write error file so trial can note
      const errPath = join(checksDir, `case-${cLower}-gen-${gen}-judge.md`);
      writeFileSync(errPath, `# Judge error — C-${c} gen-${gen}\n\nError: ${e.message}\n\n- date: ${new Date().toISOString()}\n`, "utf8");
      results.push({ case: `C-${c}`, gen, error: String(e.message) });
    }
    // small delay to avoid rate limit
    await new Promise(r => setTimeout(r, 1200));
  }

  // summary
  console.error(`[judge] done: ${results.map(r=>`${r.case}:${r.usage ? "ok" : r.error ? "err" : "?"}`).join(", ")}`);
}

main().catch(e=>{ console.error(String(e?.stack??e)); process.exit(1); });
