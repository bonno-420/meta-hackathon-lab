#!/usr/bin/env node
// loop16-generate.mjs — loop-016 C-A..F 英語生成（Baseten枠）
// EN facts（cases/case-X.json）を入力し、insights/ の蓄積知見を自動反映して生成する
// キー値は出力・記録しない。画像は扱わない（別スクリプト）
// 使い方: node loops/loop-016/tools/loop16-generate.mjs --case A --gen 001

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, basename, dirname } from "node:path";

const MODEL = "meta-models/muse-spark-open-1026";
const DEFAULT_BASE_URL = process.env.BASETEN_BASE_URL || "https://inference.baseten.co/v1";
// loop-016 実測 (2026-11-02): max_tokens=4,000 では reasoning が約4,000を占め content null で失敗
// （debug-baseten.mjs: prompt322/completion4000/reasoning3997）。8,000 で content が返ることを確認
// （debug-baseten2.mjs: reasoning1381/content1297）。READMEの4,000から引き上げ、記録に残す
const FORMAL_MAX_TOKENS = 8000;
const FORMAL_MAX_TOKENS_GEN004 = 12000;
const TEMPERATURE = 0.4;
const REFLECTION_VNEXT_PATH = "loops/loop-016/reflection-memos/2026-11-02-reflection-v-next-gen004.md";
const REFLECTION_VNEXT_VERSION = "v-next-gen004 (2026-11-02)";

const CASE_MAP = {
  A: "case-A", B: "case-B", C: "case-C", D: "case-D", E: "case-E", F: "case-F",
};
const CASE_ID = { A: "C-A", B: "C-B", C: "C-C", D: "C-D", E: "C-E", F: "C-F" };

function loadApiKey() {
  if (process.env.BASETEN_API_KEY) return { source: "env:BASETEN_API_KEY", key: process.env.BASETEN_API_KEY };
  const p = join(homedir(), ".config", "opencode", "baseten-api-key");
  if (existsSync(p)) {
    const raw = readFileSync(p, "utf8").trim();
    if (raw) return { source: `file:${p}`, key: raw };
  }
  if (process.env.MODEL_API_KEY && process.env.MODEL_API_KEY.startsWith("b10_")) return { source: "env:MODEL_API_KEY", key: process.env.MODEL_API_KEY };
  return { source: null, key: null };
}

function loadResearch(caseLetter, gen) {
  if (gen === "001") return { block: "", applied: [], reason: "gen-001 baseline has no research (per brief)" };
  const files = [];
  const common = resolve("loops/loop-016/research/common.md");
  const perCase = resolve(`loops/loop-016/research/case-${caseLetter.toLowerCase()}.md`);
  const parts = [];
  let version = null;
  for (const p of [common, perCase]) {
    try {
      const body = readFileSync(p, "utf8").trim();
      if (body) {
        const name = p.includes("common") ? "common.md" : `case-${caseLetter.toLowerCase()}.md`;
        parts.push(`--- research/${name} ---\n${body}`);
        const m = body.match(/\*\*version\*\*:\s*(.+)/);
        if (m) version = m[1].trim();
        files.push(name);
      }
    } catch {}
  }
  if (parts.length === 0) return { block: "", applied: [], reason: "no research files found", version };
  const block = [
    "Expression-type patterns from research (how to phrase, not what facts to use). Facts come ONLY from the FACT items below. Do not treat research as a source of facts; treat it as wording and ordering guidance:",
    ...parts,
  ].join("\n");
  return { block, applied: files, version: version || "unknown" };
}

function loadReflectionGen004(caseLetter) {
  if (!existsSync(resolve(REFLECTION_VNEXT_PATH))) return { block: "", applied: [], version: null, reason: "reflection v-next not found" };
  try {
    const raw = readFileSync(resolve(REFLECTION_VNEXT_PATH), "utf8");
    // Extract R1, R2, and case-specific block for this case
    const r1Match = raw.match(/## R1:[^\n]*\n([\s\S]*?)(?=\n## R2:)/);
    const r2Match = raw.match(/## R2:[^\n]*\n([\s\S]*?)(?=\n## R3:)/);
    const caseBlockRe = new RegExp(`### C-${caseLetter}:[^\\n]*\\n([\\s\\S]*?)(?=\\n### C-|\\n---\\n\\n## 適用)` );
    const caseMatch = raw.match(caseBlockRe);
    const parts = [];
    if (r1Match) parts.push(`--- reflection R1: reduce duplication (facts table vs sentences) ---\n${r1Match[1].trim()}`);
    if (r2Match) parts.push(`--- reflection R2: clarify facts for reader ---\n${r2Match[1].trim()}`);
    if (caseMatch) parts.push(`--- reflection case-specific C-${caseLetter} ---\n${caseMatch[1].trim()}`);
    if (parts.length === 0) return { block: "", applied: [], version: REFLECTION_VNEXT_VERSION, reason: "no R1/R2/case block extracted" };
    const block = [
      "Reflection adjustments v-next-gen004 from gen-003 reviews (apply to INTENT layer — how you phrase). Assembly changes R3-R8 are handled elsewhere; do not duplicate them here. Focus on R1,R2 and case-specific intent:",
      ...parts,
      "Constraints: keep every numeric value verbatim, do not invent facts, do not add fields not in FACTs. R1: sentences should complement the facts table, not repeat it verbatim. R2: clarify relationships (e.g. flex core meaning) and always write dates as given.",
    ].join("\n");
    return { block, applied: [REFLECTION_VNEXT_PATH], version: REFLECTION_VNEXT_VERSION, reason: null };
  } catch (e) {
    return { block: "", applied: [], version: REFLECTION_VNEXT_VERSION, reason: String(e) };
  }
}

function loadInsights() {
  const dir = resolve("loops/loop-016/insights");
  let files = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort(); }
  catch { return { block: "", applied: [] }; }
  if (files.length === 0) return { block: "", applied: [] };
  const parts = [];
  for (const f of files) {
    try {
      const body = readFileSync(join(dir, f), "utf8").trim();
      if (body) parts.push(`--- ${f} ---\n${body}`);
    } catch {}
  }
  if (parts.length === 0) return { block: "", applied: [] };
  const block = [
    "Accumulated insights from prior cases in this loop (apply automatically; do not invent new facts):",
    ...parts,
  ].join("\n");
  return { block, applied: files };
}

function buildMessagesEn(caseData, insightsBlock, researchBlock, reflectionBlock) {
  const system = [
    "You write English LP (landing page) copy sentences for a fictional job posting. The FACT items are given in English; you must keep every numeric value verbatim (e.g. Annual 4,800,000 JPY, Hourly 1,400 JPY, Monthly 380,000 JPY, 5-min walk, 10 paid days, 3-month onboarding, 8-person team, 12-month contract, 6 weeks: 2026-12-01 to 2027-01-11, 3-5 days/week, 4-7 hours/day, Staff discount 20%, up to 15,000 JPY/month).",
    "Rules:",
    "- Use only the stated FACT items. Never invent information not in the FACTs or the plan. The plan's appeal direction may guide phrasing but must not create new facts.",
    "- Research (expression types) may guide wording, ordering, and CTA framing — but NOT what facts exist. If research suggests a pattern that would require a fact not in the FACT list, do not invent it; omit or adapt.",
    "- Write plain descriptive English sentences. Keep it natural but factual; no hype, no greetings, no invented benefits.",
    "- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines). A sentence must cite at least one key and at least one line, and must cite every key and line it uses.",
    "- Keep numbers, amounts, dates, durations and conditions exactly as written in the FACT values. Do not convert, round, or rephrase quantities (keep 4,800,000 as 4,800,000; keep 2026-12-01 as 2026-12-01; keep 3-5 days/week as written).",
    "- If a FACT is not to be asserted, state only that it is not stated; do not fabricate.",
    "- Output JSON only, no markdown fences.",
    'Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}',
  ].join("\n");

  const planBlock = [
    "Plan (fixed before generation):",
    `- Target audience: ${caseData.plan.targetAudience}`,
    `- Appeal: ${caseData.plan.appeal}`,
    `- Must NOT: ${(caseData.plan.mustNot || []).join(" / ")}`,
    `- CTA: ${caseData.plan.cta}`,
  ].join("\n");

  const materials = [
    `Materials for ${caseData.id} (${caseData.label}):`,
    planBlock,
    insightsBlock ? `\n${insightsBlock}\n` : "",
    researchBlock ? `\n${researchBlock}\n` : "",
    reflectionBlock ? `\n${reflectionBlock}\n` : "",
    "Stated FACT items (key / value / sourceLine) — values are English, keep numbers verbatim:",
    ...caseData.facts.map((f) => `- ${f.key}: value=${JSON.stringify(f.value)} sourceLine=${f.sourceLine}`),
  ].join("\n");

  const user = `${materials}\n\nWrite the English LP copy sentences as JSON per schema. Cover every FACT at least once across the sentences. Keep every factual value verbatim while rendering the sentences in English.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function extractNumericTokens(value) {
  const s = String(value);
  const out = [];
  const dateRe = /\d{4}-\d{2}-\d{2}/g;
  let m;
  while ((m = dateRe.exec(s)) !== null) out.push(m[0]);
  const numRe = /[0-9]+(?:,[0-9]+)*/g;
  while ((m = numRe.exec(s)) !== null) {
    const tok = m[0];
    if (tok.replace(/[^0-9]/g, "").length > 0) out.push(tok);
  }
  return [...new Set(out)];
}

function normLine(l) {
  if (typeof l === "number") return "L" + String(l).padStart(2, "0");
  return String(l);
}

function checkConformance(generation, caseData) {
  const issues = [];
  if (!generation || !Array.isArray(generation.sentences)) {
    return { pass: false, checked: 0, issues: [{ note: "generation.sentences is not an array" }] };
  }
  for (let idx = 0; idx < generation.sentences.length; idx++) {
    const s = generation.sentences[idx];
    if (!s.text || typeof s.text !== "string") issues.push({ sentence: idx, issue: "text missing" });
    if (!Array.isArray(s.factKeys) || s.factKeys.length === 0) issues.push({ sentence: idx, issue: "factKeys missing" });
    if (!Array.isArray(s.sourceLines) || s.sourceLines.length === 0) issues.push({ sentence: idx, issue: "sourceLines missing" });
    for (const k of (s.factKeys || [])) {
      if (!caseData.facts.find((f) => f.key === k)) issues.push({ sentence: idx, issue: `unknown factKey ${k}` });
    }
    for (const l of (s.sourceLines || [])) {
      if (!caseData.facts.find((f) => f.sourceLine === l || f.sourceLine === normLine(l))) issues.push({ sentence: idx, issue: `unknown sourceLine ${l}` });
    }
    for (const k of (s.factKeys || [])) {
      const fact = caseData.facts.find((f) => f.key === k);
      if (!fact) continue;
      const toks = extractNumericTokens(fact.value);
      for (const tok of toks) {
        if (!s.text.includes(tok)) {
          const bare = tok.replace(/,/g, "");
          if (!s.text.includes(bare)) {
            issues.push({ sentence: idx, issue: `numeric verbatim missing: ${tok} (fact ${k}=${fact.value}) not found` });
          }
        }
      }
    }
  }
  for (const f of caseData.facts) {
    const appears = generation.sentences.some((s) => (s.factKeys || []).includes(f.key));
    if (!appears) issues.push({ note: `FACT ${f.key}=${f.value} is never cited` });
  }
  return { pass: issues.length === 0, checked: generation.sentences.length, issues };
}

function evaluateProse(generation, caseData) {
  const sentences = generation?.sentences || [];
  const findings = [];
  const mustNot = (caseData.plan.mustNot || []).join(" ").toLowerCase();
  const hypePhrases = ["amazing opportunity", "dream job", "perfect for you", "don't miss", "once in a lifetime", "incredible", "fantastic", "best ever", "unbelievable"];
  for (let i = 0; i < sentences.length; i++) {
    const t = sentences[i].text.toLowerCase();
    for (const h of hypePhrases) if (t.includes(h)) findings.push({ sentence: i, viewpoint: "当事者の声", issue: `hype phrase "${h}"`, needsFix: true });
  }
  for (let i = 0; i < sentences.length; i++) {
    const t = sentences[i].text.toLowerCase();
    if (t.includes("free transport") || t.includes("free commute") || t.includes("unlimited transport") || t.includes("unlimited commute")) {
      findings.push({ sentence: i, viewpoint: "生活翻訳", issue: `"free/unlimited" overstates capped commuter pass`, needsFix: true });
    }
    if ((t.includes("remote work") || t.includes("work from home") || t.includes("work remotely")) && mustNot.includes("remote")) {
      findings.push({ sentence: i, viewpoint: "生活翻訳", issue: `promises remote work against mustNot`, needsFix: true });
    }
    if (t.includes("guaranteed") && (mustNot.includes("conversion") || mustNot.includes("extension") || mustNot.includes("bonus"))) {
      findings.push({ sentence: i, viewpoint: "生活翻訳", issue: `"guaranteed" against mustNot (${caseData.plan.mustNot.join("; ")})`, needsFix: true });
    }
    if ((t.includes("bonus") && mustNot.includes("bonus"))) {
      findings.push({ sentence: i, viewpoint: "生活翻訳", issue: `mentions bonus against mustNot`, needsFix: true });
    }
    if ((t.includes("direct-hire") || t.includes("direct hire") || t.includes("direct employment")) && caseData.employmentType === "dispatched") {
      findings.push({ sentence: i, viewpoint: "生活翻訳", issue: `implies direct-hire path for dispatched role`, needsFix: true });
    }
    if (t.includes("childcare service") && mustNot.includes("childcare")) {
      findings.push({ sentence: i, viewpoint: "生活翻訳", issue: `invent childcare service against mustNot`, needsFix: true });
    }
  }
  for (let i = 0; i < sentences.length; i++) {
    const wc = sentences[i].text.split(/\s+/).length;
    if (wc > 35) findings.push({ sentence: i, viewpoint: "型への沿い方", issue: `sentence too long (${wc} words)`, needsFix: false });
  }
  const external = ["compared to other", "better than", "industry-leading", "top-rated", "best in the industry"];
  for (let i = 0; i < sentences.length; i++) {
    const t = sentences[i].text.toLowerCase();
    for (const p of external) if (t.includes(p)) findings.push({ sentence: i, viewpoint: "第三者視点の混入なし", issue: `external comparison "${p}"`, needsFix: true });
  }
  const needsFixCount = findings.filter((f) => f.needsFix).length;
  return { checked: sentences.length, totalFindings: findings.length, needsFixCount, findings };
}

function renderMarkdown({ caseData, caseLetter, gen, generatedAt, insightsApplied, researchApplied, researchVersion, reflectionApplied, reflectionVersion, usage, generation, conformance, prose }) {
  const sentencesText = generation?.sentences
    ? generation.sentences.map((s, i) => `${i + 1}. ${s.text} 〔${s.factKeys.join(",")} / ${s.sourceLines.join(",")}〕`).join("\n")
    : "(生成文の取得に失敗)";
  const rawJson = JSON.stringify(generation ?? { error: "no generation" }, null, 2);
  const usageLine = usage
    ? `prompt ${usage.prompt_tokens ?? "?"} / completion ${usage.completion_tokens ?? "?"} / total ${usage.total_tokens ?? "?"}`
    : "取得できず";
  const confLine = conformance ? `${conformance.pass ? "pass" : "要手動確認"}（${conformance.checked}文, issues ${conformance.issues.length}）` : "—";
  const proseLine = prose ? `${prose.checked}文, findings ${prose.totalFindings} (要修正 ${prose.needsFixCount})` : "—";
  return `# ${caseData.id} gen-${gen} [EN]（${caseData.label}）\n\n- 生成日時: ${generatedAt}\n- 実行基盤: Baseten Muse Spark Open (\`meta-models/muse-spark-open-1026\`) — 英語完結、事実は英語で verbatim\n- 企画: \`loops/loop-016/cases/case-${caseLetter}.json\` の \`plan\` を固定（対象層・訴求・mustNot・CTA）\n- 反映した知見: ${insightsApplied.length ? insightsApplied.join(", ") : "なし（初回または該当なし。insights/ を自動読込）"}\n- 参照したresearch: ${researchApplied.length ? researchApplied.join(", ") + " (" + (researchVersion || "?") + ")" : "なし（gen-001基準世代はresearchなし、または該当なし）"}\n- 反映メモ v-next: ${reflectionApplied.length ? reflectionApplied.join(", ") + " (" + (reflectionVersion || "?") + ")" : "なし（gen-003以前）"}\n- 1回あたり上限: 正式値 max_tokens=${gen === "004" ? FORMAL_MAX_TOKENS_GEN004 : FORMAL_MAX_TOKENS} temperature=${TEMPERATURE}\n- 適合確認（数値と事実の突合）: ${confLine}\n- 散文評価（4観点 — 当事者の声 / 生活翻訳 / 型への沿い方 / 第三者視点の混入なし）: ${proseLine}\n\n## 生成文（英語）\n\n${sentencesText}\n\n<details><summary>raw JSON</summary>\n\n\`\`\`json\n${rawJson}\n\`\`\`\n\n</details>\n\n## 適合の確認（機械検査）\n\n- 実施手段: facts の数値 verbatim 保持と factKeys/sourceLines の存在確認を本スクリプトで自動検査\n- 結果: ${conformance?.pass ? "pass" : "要手動確認"}${conformance?.issues?.length ? ` — issues: ${conformance.issues.map((i) => JSON.stringify(i)).join("; ")}` : ""}\n- 落ちた場合の扱い: 単発は次の生成を止めず、2回連続したら K5 により当該ケース停止\n\n## 散文評価（4観点）\n\n- 評価結果: ${proseLine}\n${prose?.findings?.length ? prose.findings.map((f) => `  - 文${(f.sentence ?? "")} [${f.viewpoint}] ${f.issue} ${f.needsFix ? "（要修正）" : ""}`).join("\n") : "- （機械検出の findings なし。手動で4観点を読み取る）"}\n\n## メモ欄（回す側が記録）\n\n- 回す側の判断をここに残す。K4（同じ指摘3世代）/ K5（適合落ち2連続）の該当有無を明記する\n\n## 備考\n\n- 言語: EN（プロンプト英語、事実は英語、出力は英語文）\n- 実費: 未記録（残量が確認できないため）。使用量: ${usageLine}\n- 対応する JSON 記録: \`generations/case-${caseLetter}/gen-${gen}.json\`\n- LP プレビュー（最小）: \`previews/case-${caseLetter}-gen-${gen}.html\`\n- 完成LP: \`previews/case-${caseLetter}-gen-${gen}-complete.html\`（別工程で組付け）\n`;
}

function renderPreviewHtml({ caseData, gen, generation }) {
  const sentences = generation?.sentences || [];
  const rows = sentences.map((s) => `
    <div class="sentence">
      <p class="text">${escapeHtml(s.text)}</p>
      <div class="meta">factKeys: ${escapeHtml((s.factKeys || []).join(", "))} / sourceLines: ${escapeHtml((s.sourceLines || []).join(", "))}</div>
    </div>`).join("\n");
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${escapeHtml(caseData.id)} gen-${gen} — LP Preview (EN)</title>\n<style>\n:root { --bg:#fafaf8; --fg:#1a1a1a; --muted:#6b7280; --line:#e5e7eb; }\n* { box-sizing:border-box; }\nbody { margin:0; font-family: Inter, system-ui, sans-serif; background:var(--bg); color:var(--fg); }\n.header { padding:24px 32px; border-bottom:1px solid var(--line); background:#fff; }\n.content { max-width:720px; margin:32px auto; padding:0 24px; }\n.sentence { background:#fff; border:1px solid var(--line); border-radius:8px; padding:16px 20px; margin-bottom:12px; }\n.sentence .text { margin:0; font-size:15px; line-height:1.6; }\n.sentence .meta { margin-top:8px; font-size:12px; color:var(--muted); font-family: monospace; }\n.footer { max-width:720px; margin:32px auto; padding:0 24px 32px; font-size:12px; color:var(--muted); }\n</style>\n</head>\n<body>\n<div class="header"><h1>${escapeHtml(caseData.id)} gen-${gen} — ${escapeHtml(caseData.label)}</h1><div>Baseten Muse Spark Open · EN-only facts verbatim · Minimal preview</div></div>\n<div class="content">${rows || "<p>No sentences</p>"}</div>\n<div class="footer">Plan: ${escapeHtml(caseData.plan.targetAudience)} / ${escapeHtml(caseData.plan.appeal)} · Model: meta-models/muse-spark-open-1026</div>\n</body>\n</html>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function main() {
  const args = process.argv.slice(2);
  let caseLetter = null, gen = "001", maxTokens = FORMAL_MAX_TOKENS, baseUrl = DEFAULT_BASE_URL;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--case" && args[i + 1]) { caseLetter = args[i + 1].toUpperCase(); i++; }
    else if (args[i] === "--gen" && args[i + 1]) { gen = String(args[i + 1]).padStart(3, "0"); i++; }
    else if (args[i] === "--max-tokens" && args[i + 1]) { maxTokens = Number(args[i + 1]); i++; }
    else if (args[i] === "--base-url" && args[i + 1]) { baseUrl = args[i + 1]; i++; }
  }
  if (!caseLetter || !CASE_MAP[caseLetter]) {
    console.error("Usage: --case A|B|C|D|E|F [--gen 001]");
    process.exit(2);
  }
  const caseFile = `loops/loop-016/cases/${CASE_MAP[caseLetter]}.json`;
  const caseData = JSON.parse(readFileSync(resolve(caseFile), "utf8").replace(/^\uFEFF/, ""));
  const { block: insightsBlock, applied: insightsApplied } = loadInsights();
  const { block: researchBlock, applied: researchApplied, version: researchVersion, reason: researchReason } = loadResearch(caseLetter, gen);
  // gen-004: R1,R2+case-specific reflection into intent layer
  let reflectionBlock = "", reflectionApplied = [], reflectionVersion = null, reflectionReason = null;
  if (gen === "004") {
    const r = loadReflectionGen004(caseLetter);
    reflectionBlock = r.block; reflectionApplied = r.applied; reflectionVersion = r.version; reflectionReason = r.reason;
  }
  // gen-004 requires 12k from start per brief; override default if not explicitly passed
  if (gen === "004" && maxTokens === FORMAL_MAX_TOKENS) maxTokens = FORMAL_MAX_TOKENS_GEN004;
  const messages = buildMessagesEn(caseData, insightsBlock, researchBlock, reflectionBlock);
  const { key, source } = loadApiKey();
  if (!key) { console.error("API key not found"); process.exit(2); }
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const body = { model: MODEL, messages, max_tokens: maxTokens, temperature: TEMPERATURE };
  let ok = false, error = null, usage = null, generation = null, rawText = null;
  const startedAt = new Date().toISOString();
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Api-Key ${key}` }, body: JSON.stringify(body) });
  rawText = await res.text();
  let json = null;
  try { json = JSON.parse(rawText); } catch {}
  if (!res.ok) error = `HTTP ${res.status}: ${rawText.slice(0, 400)}`;
  else if (!json) error = `Response not JSON`;
  else {
    usage = json.usage ?? null;
    const content = json.choices?.[0]?.message?.content ?? null;
    if (!content) error = `No content`;
    else {
      try { generation = JSON.parse(content); } catch (e) { generation = { _raw: content }; error = `Not JSON: ${e}`; }
      if (!error) ok = true;
    }
  }
  const generatedAt = new Date().toISOString();
  const conformance = generation ? checkConformance(generation, caseData) : null;
  const prose = generation ? evaluateProse(generation, caseData) : null;
  const lower = caseLetter.toLowerCase();
  const outDir = resolve(`loops/loop-016/generations/case-${caseLetter}`);
  mkdirSync(outDir, { recursive: true });
  const record = {
    generatedAt, startedAt, model: MODEL, baseUrl: DEFAULT_BASE_URL, language: "EN",
    case: { id: caseData.id, label: caseData.label, caseFile },
    provisionalLimit: { max_tokens: maxTokens, temperature: TEMPERATURE },
    insightsApplied, researchApplied, researchVersion, researchReason, reflectionApplied, reflectionVersion, reflectionReason, ok, error, usage,
    usageSummary: usage ? { prompt_tokens: usage.prompt_tokens ?? null, completion_tokens: usage.completion_tokens ?? null, total_tokens: usage.total_tokens ?? null } : null,
    generation, conformance, prose,
    cost: "未記録（残量が確認できないため）",
  };
  writeFileSync(join(outDir, `gen-${gen}.json`), JSON.stringify(record, null, 2) + "\n", "utf8");
  writeFileSync(join(outDir, `gen-${gen}.md`), renderMarkdown({ caseData, caseLetter, gen, generatedAt, insightsApplied, researchApplied, researchVersion, reflectionApplied, reflectionVersion, usage, generation, conformance, prose }), "utf8");
  const previewDir = resolve("loops/loop-016/previews");
  mkdirSync(previewDir, { recursive: true });
  writeFileSync(join(previewDir, `case-${caseLetter}-gen-${gen}.html`), renderPreviewHtml({ caseData, gen, generation }), "utf8");
  console.error(`[loop16] case ${caseData.id} gen-${gen} ok=${ok} pass=${conformance?.pass} needsFix=${prose?.needsFixCount} insights=${insightsApplied.length} research=${researchApplied.join(",") || "none"}(${researchVersion || "-"})`);
  if (!ok) { console.error(error); process.exit(1); }
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
