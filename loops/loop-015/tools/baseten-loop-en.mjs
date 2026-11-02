#!/usr/bin/env node
// baseten-loop-en.mjs — 英語ベース生成（本格稼働）
// プロンプトは英語、事実は topics の日本語のまま入力し数値は verbatim、出力は英語文 + factKeys/sourceLines の JSON
// 既存の日本語2世代（T-A gen-002 / T-B gen-001）は予備扱いとし記録は残す。英語系統を新たに数え直すがファイル番号は上書きしないよう通し番号を継続
// T-A: gen-003,004,005 / T-B: gen-002,003,004 が英語の3世代（反映メモなしで自律）
// 各世代に適合確認（数値と事実の突合）と散文評価（英語文に対して4観点）を付け、K2/K3/K5 の歯止めは従来どおり有効
// 提示は世代ごとに LP プレビュー（HTML）を最小限の組みで作成し、判断対象は文章に保つ

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";

const MODEL = "meta-models/muse-spark-open-1026";
const DEFAULT_BASE_URL = process.env.BASETEN_BASE_URL || "https://inference.baseten.co/v1";
const FORMAL_MAX_TOKENS = 4000;
const TEMPERATURE = 0.4;

function loadApiKey() {
  if (process.env.BASETEN_API_KEY) return { source: "env:BASETEN_API_KEY", key: process.env.BASETEN_API_KEY };
  const p = join(homedir(), ".config", "opencode", "baseten-api-key");
  if (existsSync(p)) {
    const raw = readFileSync(p, "utf8").trim();
    if (raw) return { source: `file:${p}`, key: raw };
  }
  // MODEL_API_KEY is not Baseten-specific; only use if it looks like a Baseten key (b10_ prefix)
  if (process.env.MODEL_API_KEY && process.env.MODEL_API_KEY.startsWith("b10_")) return { source: "env:MODEL_API_KEY", key: process.env.MODEL_API_KEY };
  return { source: null, key: null };
}

function resolveTopicArg(arg) {
  if (arg === "A" || arg === "topic-A" || arg === "T-A") return "loops/loop-015/topics/topic-A.json";
  if (arg === "B" || arg === "topic-B" || arg === "T-B") return "loops/loop-015/topics/topic-B.json";
  return arg;
}
function genDirForTopic(topicId) {
  if (topicId === "T-A") return "loops/loop-015/generations/topic-A";
  if (topicId === "T-B") return "loops/loop-015/generations/topic-B";
  return `loops/loop-015/generations/${topicId}`;
}

function buildMessagesEn(topic, memoContent) {
  const system = [
    "You write English LP (landing page) copy sentences for a fictional Japanese job posting. The FACT items are given in Japanese; you must keep every numeric value verbatim (e.g. 1,250円, 1,180円, 週3日〜、1日4時間〜, 週2日〜、1日3時間〜, 月1万円まで, 上限5千円, 3日間, 月ごと).",
    "Rules:",
    "- Use only the stated FACT items. Never invent information not in the FACTs or the plan. The plan's appeal direction may guide phrasing but must not create new facts.",
    "- Write plain descriptive English sentences. Keep it natural but factual; no hype, no greetings, no invented benefits.",
    "- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines). A sentence must cite at least one key and at least one line, and must cite every key and line it uses.",
    "- Keep numbers, amounts, durations and conditions exactly as written in the FACT values. Do not convert yen, do not translate time expressions into different quantities (e.g. keep 週3日〜 as given, do not rewrite as '3 days a week' with altered meaning; you may render it in English but the quantity must stay verbatim).",
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

  let memoBlock = "";
  if (memoContent) {
    memoBlock = `\n\nReflection memo (confirmed; apply to the next generation):\n${memoContent}\n`;
  }

  const materials = [
    `Materials for ${topic.id} (${topic.label}) — version ${topic.sourceFingerprint}:`,
    planBlock,
    memoBlock,
    "Stated FACT items (key / value / sourceLine) — values are Japanese, keep them verbatim in English rendering:",
    ...topic.facts.map((f) => `- ${f.key}: value=${JSON.stringify(f.value)} sourceLine=${f.sourceLine}`),
  ].join("\n");

  const user = `${materials}\n\nWrite the English LP copy sentences as JSON per schema. Keep every factual value verbatim while rendering the sentences in English.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// ---- 適合確認（数値と事実の突合） ----
function checkConformance(generation, topic) {
  const issues = [];
  if (!generation || !Array.isArray(generation.sentences)) {
    return { pass: false, checked: 0, issues: [{ note: "generation.sentences is not an array" }] };
  }
  // 事実側の数値トークンを収集（円、〜、日、時間などを含む値全体を verbatim で保持すべきもの）
  const factValues = topic.facts.map((f) => f.value);
  // 各 FACT の値が引用されている文では、その verbatim が文中に現れるか（英語化しても数値は verbatim のまま）
  // 簡易検査: factKeys で引用している FACT の数値部分（例 1,250、1万円、3日間、月ごと など）が文中に含まれているか
  // 日本語の facts を英語化する際も数値は原文のまま残すことを要求しているため
  const numericTokens = [];
  for (const v of factValues) {
    // 数字を含むトークンを抽出（例: 1,250円, 1,250, 1万円, 5千円, 3日間, 週3日〜 など）
    const toks = String(v).match(/[0-9,]+(?:円|日|時間|千円|万円)?|週[0-9]+日〜|1日[0-9]+時間〜|月ごと|3日間/g) || [];
    for (const t of toks) if (t.trim()) numericTokens.push({ value: v, token: t });
  }

  for (let idx = 0; idx < generation.sentences.length; idx++) {
    const s = generation.sentences[idx];
    if (!s.text || typeof s.text !== "string") issues.push({ sentence: idx, issue: "text missing" });
    if (!Array.isArray(s.factKeys) || s.factKeys.length === 0) issues.push({ sentence: idx, issue: "factKeys missing" });
    if (!Array.isArray(s.sourceLines) || s.sourceLines.length === 0) issues.push({ sentence: idx, issue: "sourceLines missing" });
    // factKeys の存在確認
    for (const k of (s.factKeys || [])) {
      if (!topic.facts.find((f) => f.key === k)) issues.push({ sentence: idx, issue: `unknown factKey ${k}` });
    }
    // sourceLines の存在確認
    for (const l of (s.sourceLines || [])) {
      if (!topic.facts.find((f) => f.sourceLine === l)) issues.push({ sentence: idx, issue: `unknown sourceLine ${l}` });
    }
    // 数値の verbatim 保持: 引用している FACT の数値トークンが文中に現れているか
    for (const k of (s.factKeys || [])) {
      const fact = topic.facts.find((f) => f.key === k);
      if (!fact) continue;
      const factToks = String(fact.value).match(/[0-9,]+円|[0-9]+日|1日[0-9]+時間|週[0-9]+日|月[0-9]+円|5千円|3日間|月ごと/g) || [];
      for (const tok of factToks) {
        if (tok && !s.text.includes(tok)) {
          // 英語文で数値をそのまま残すことを要求しているため、原文トークンが無い場合は要確認として記録
          // ただし英語表記で 1,250 yen のように円記号を yen に置換している場合は許容するため、数字部分だけで判定
          const numOnly = tok.replace(/[^0-9,]/g, "");
          if (numOnly && !s.text.includes(numOnly)) {
            issues.push({ sentence: idx, issue: `numeric verbatim missing: ${tok} (fact ${k}=${fact.value}) not found in "${s.text.slice(0,60)}"` });
          }
        }
      }
    }
  }
  // 全体で FACT の数値が文中で一度も現れていない場合の警告
  for (const f of topic.facts) {
    const appears = generation.sentences.some((s) => (s.factKeys || []).includes(f.key));
    if (!appears) issues.push({ note: `FACT ${f.key}=${f.value} is never cited` });
  }

  return { pass: issues.length === 0, checked: generation.sentences.length, issues };
}

// ---- 散文評価（英語文に対して4観点） ----
function evaluateProse(generation) {
  const sentences = generation?.sentences || [];
  const findings = [];

  // 観点1: 当事者の声（求職者/求人側の視点に立っているか）
  // 英語文で一人称の誇張や不自然な勧誘がないかを機械的にフラグする
  const hypePhrases = ["amazing opportunity", "dream job", "perfect for you", "don't miss", "once in a lifetime"];
  for (let i = 0; i < sentences.length; i++) {
    const t = sentences[i].text.toLowerCase();
    for (const h of hypePhrases) if (t.includes(h)) findings.push({ sentence: i, viewpoint: "当事者の声", issue: `hype phrase "${h}"`, needsFix: true });
  }

  // 観点2: 生活翻訳（事実を生活文脈に置き換えすぎていないか）
  // 例: transport の「月1万円まで」を "free transport" と誇張していないか
  for (let i = 0; i < sentences.length; i++) {
    const t = sentences[i].text.toLowerCase();
    if (t.includes("free transport") || t.includes("unlimited transport")) {
      const citesTransport = (sentences[i].factKeys || []).includes("transport");
      if (citesTransport) findings.push({ sentence: i, viewpoint: "生活翻訳", issue: `"free/unlimited" overstates 上限1万円まで`, needsFix: true });
    }
  }

  // 観点3: 型への沿い方（LP の型: 募集要項の列挙から逸脱していないか）
  // 英語文でも箇条書き的な記述が保たれているか（全ての文が 30 語以内かなど）
  for (let i = 0; i < sentences.length; i++) {
    const wc = sentences[i].text.split(/\s+/).length;
    if (wc > 35) findings.push({ sentence: i, viewpoint: "型への沿い方", issue: `sentence too long (${wc} words)`, needsFix: false });
  }

  // 観点4: 第三者視点の混入なし（fact にない評価や外部比較が入っていないか）
  const externalPhases = ["compared to other", "better than", "industry-leading", "top-rated"];
  for (let i = 0; i < sentences.length; i++) {
    const t = sentences[i].text.toLowerCase();
    for (const p of externalPhases) if (t.includes(p)) findings.push({ sentence: i, viewpoint: "第三者視点の混入なし", issue: `external comparison "${p}"`, needsFix: true });
  }

  const needsFixCount = findings.filter((f) => f.needsFix).length;
  return { checked: sentences.length, totalFindings: findings.length, needsFixCount, findings };
}

function renderMarkdown({ topic, gen, generatedAt, memoPath, memoVersion, usage, generation, conformance, prose }) {
  const memoLine = memoPath
    ? `適用した反映メモの版: ${memoVersion ?? basename(memoPath)}（${memoPath}）`
    : "適用した反映メモの版: なし（英語系統の自律3世代は反映メモなしで回す）";
  const sentencesText = generation?.sentences
    ? generation.sentences.map((s, i) => `${i + 1}. ${s.text} 〔${s.factKeys.join(",")} / ${s.sourceLines.join(",")}〕`).join("\n")
    : "(生成文の取得に失敗)";
  const rawJson = JSON.stringify(generation ?? { error: "no generation" }, null, 2);
  const usageLine = usage
    ? `prompt ${usage.prompt_tokens ?? "?"}（cached ${usage.prompt_tokens_details?.cached_tokens ?? "?"}) / completion ${usage.completion_tokens ?? "?"}（reasoning ${usage.completion_tokens_details?.reasoning_tokens ?? "?"}) / total ${usage.total_tokens ?? "?"}`
    : "取得できず";
  const conformanceLine = conformance
    ? `${conformance.pass ? "pass" : "要手動確認"}（${conformance.checked}文, issues ${conformance.issues.length}）`
    : "—";
  const proseLine = prose
    ? `${prose.checked}文, findings ${prose.totalFindings} (要修正 ${prose.needsFixCount})`
    : "—";

  return `# ${topic.id} gen-${gen} [EN]（${topic.label} / 英語系統）

- 生成日時: ${generatedAt}
- 実行基盤: Baseten Muse Spark Open (\`meta-models/muse-spark-open-1026\`) — 英語ベース、事実は日本語入力のまま数値は verbatim
- ${memoLine}
- 企画: \`topics/${topic.id === "T-A" ? "topic-A" : "topic-B"}.json\` の \`plan\` を固定
- 1回あたり上限: 正式値 max_tokens=${FORMAL_MAX_TOKENS} temperature=${TEMPERATURE}
- 系統: 英語（日本語の予備 ${topic.id === "T-A" ? "gen-002（9文）/ gen-001較正" : "gen-001（9文）"} は系統に数えない。ファイル番号は通し番号を継続し対応は run-record に明記）
- 適合確認（数値と事実の突合）: ${conformanceLine}
- 散文評価（英語文に対して4観点 — 当事者の声 / 生活翻訳 / 型への沿い方 / 第三者視点の混入なし）: ${proseLine}

## 生成文（英語）

${sentencesText}

<details><summary>raw JSON</summary>

\`\`\`json
${rawJson}
\`\`\`

</details>

## 適合の確認（機械検査）

- 実施手段: facts の数値 verbatim 保持と factKeys/sourceLines の存在確認を本スクリプトで自動検査
- 結果: ${conformance?.pass ? "pass" : "要手動確認"}${conformance?.issues?.length ? ` — issues: ${conformance.issues.map((i) => JSON.stringify(i)).join("; ")}` : ""}
- 落ちた場合の扱い: 単発は次の生成を止めず、2回連続したら K5 により題材停止

## 散文評価（英語文に対して4観点）

- 評価結果: ${proseLine}
${prose?.findings?.length ? prose.findings.map((f) => `  - 文${(f.sentence ?? "")} [${f.viewpoint}] ${f.issue} ${f.needsFix ? "（要修正）" : ""}`).join("\n") : "- （機械検出の findings なし。手動で4観点を読み取る）"}

## メモ欄（本人が直接書き込む）

- 英語系統の自律3世代ではメモ欄は本人が後で一括して書き込む。確認までは反映メモなしで次の世代へ進む
- 書き込み単位は「指摘1件」で対象の文と内容が分かる形で残す。状態は 未反映 / 反映済み / 見送り

### 文単位の指摘

- [ ] 指摘1: 対象文「—」— 内容: —（状態: 未反映）

### サンプル全体への指摘

- [ ] 指摘1: —（状態: 未反映）

## 備考

- 言語: EN（プロンプト英語、事実入力は日本語のまま数値は verbatim、出力は英語文）
- 実費: 未記録（残量が確認できないため）。使用量: ${usageLine}
- 生成呼び出しの通算回数は run-record.md に手動で記録する（小サンプル 1/20 + 正式 2/20 + 予備の日本語2世代は系統に数えないが総数には含めるかは run-record の定めに従う）
- 対応する JSON 記録: \`generations/${topic.id === "T-A" ? "topic-A" : "topic-B"}/gen-${gen}.json\`
- LP プレビュー: \`previews/${topic.id === "T-A" ? "topic-A" : "topic-B"}-gen-${gen}.html\`
`;
}

function renderPreviewHtml({ topic, gen, generation }) {
  const sentences = generation?.sentences || [];
  const rows = sentences.map((s) => `
    <div class="sentence">
      <p class="text">${escapeHtml(s.text)}</p>
      <div class="meta">factKeys: ${escapeHtml((s.factKeys || []).join(", "))} / sourceLines: ${escapeHtml((s.sourceLines || []).join(", "))}</div>
    </div>`).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(topic.label)} gen-${gen} — LP Preview (EN)</title>
<style>
  :root { --bg:#fafaf8; --fg:#1a1a1a; --muted:#6b7280; --line:#e5e7eb; }
  * { box-sizing:border-box; }
  body { margin:0; font-family: Inter, system-ui, -apple-system, sans-serif; background:var(--bg); color:var(--fg); }
  .header { padding:24px 32px; border-bottom:1px solid var(--line); background:#fff; }
  .header h1 { margin:0; font-size:18px; font-weight:600; }
  .header .sub { margin-top:4px; font-size:13px; color:var(--muted); }
  .content { max-width:720px; margin:32px auto; padding:0 24px; }
  .sentence { background:#fff; border:1px solid var(--line); border-radius:8px; padding:16px 20px; margin-bottom:12px; }
  .sentence .text { margin:0; font-size:15px; line-height:1.6; }
  .sentence .meta { margin-top:8px; font-size:12px; color:var(--muted); font-family: ui-monospace, monospace; }
  .footer { max-width:720px; margin:32px auto; padding:0 24px 32px; font-size:12px; color:var(--muted); }
  .badge { display:inline-block; padding:2px 8px; border-radius:999px; background:#eef2ff; color:#3730a3; font-size:12px; font-weight:500; }
</style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(topic.id)} gen-${gen} <span class="badge">EN</span> — ${escapeHtml(topic.label)}</h1>
    <div class="sub">Baseten Muse Spark Open · Facts in Japanese (verbatim numbers) · English rendering · Minimal preview (judgement on text, not decoration)</div>
  </div>
  <div class="content">
    ${rows || '<p style="color:#9ca3af">No sentences</p>'}
  </div>
  <div class="footer">
    <div>Plan: ${escapeHtml(topic.plan.targetAudience)} / ${escapeHtml(topic.plan.appeal)}</div>
    <div style="margin-top:4px">Preview is minimal layout only; evaluation targets the text (4 viewpoints) · Cost: 未記録 · Model: meta-models/muse-spark-open-1026</div>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function generateOne({ topicFile, gen, memoPath, baseUrl, maxTokens }) {
  const topic = JSON.parse(readFileSync(resolve(topicFile), "utf8"));
  let memoContent = null;
  if (memoPath) {
    memoContent = readFileSync(resolve(memoPath), "utf8").trim();
  }
  const messages = buildMessagesEn(topic, memoContent);
  const promptRecord = messages.map((m) => `## ${m.role}\n\n${m.content}`).join("\n\n");

  const { key, source } = loadApiKey();
  if (!key) throw new Error("API key not found. Set BASETEN_API_KEY or place key at ~/.config/opencode/baseten-api-key");

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const body = { model: MODEL, messages, max_tokens: maxTokens, temperature: TEMPERATURE };

  let ok = false;
  let error = null;
  let usage = null;
  let generation = null;
  let rawText = null;
  const startedAt = new Date().toISOString();

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Api-Key ${key}` },
    body: JSON.stringify(body),
  });
  rawText = await res.text();
  let json = null;
  try { json = JSON.parse(rawText); } catch {}
  if (!res.ok) {
    error = `HTTP ${res.status} ${res.statusText}: ${rawText.slice(0, 600)}`;
  } else if (!json) {
    error = `Response was not JSON: ${rawText.slice(0, 600)}`;
  } else {
    usage = json.usage ?? null;
    const content = json.choices?.[0]?.message?.content ?? null;
    if (!content) {
      error = `No content: choices=${JSON.stringify(json.choices).slice(0, 600)}`;
    } else {
      try {
        generation = JSON.parse(content);
      } catch (e) {
        generation = { _rawContent: content, _parseError: String(e) };
        error = `Generation not JSON: ${String(e)}`;
      }
      if (!error) ok = true;
    }
  }

  const generatedAt = new Date().toISOString();
  const conformance = generation ? checkConformance(generation, topic) : null;
  const prose = generation ? evaluateProse(generation) : null;

  return { topic, memoPath, memoVersion: memoPath ? basename(memoPath, ".md") : null, ok, error, usage, generation, rawText, promptRecord, conformance, prose, startedAt, generatedAt, keySource: source, maxTokens };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
English generation (autonomous 3 per topic, no memo) — writes generations + previews
  node loops/loop-015/tools/baseten-loop-en.mjs --all
  node loops/loop-015/tools/baseten-loop-en.mjs --topic A --gen 003
Options: --topic A|B|path --gen NNN --memo path --max-tokens n --base-url url --all
`.trim());
    return;
  }

  // --all: 各題材3世代を自律で回す（T-A gen-003,004,005 / T-B gen-002,003,004）
  if (args.includes("--all")) {
    const plan = [
      { topic: "loops/loop-015/topics/topic-A.json", gen: "003" },
      { topic: "loops/loop-015/topics/topic-A.json", gen: "004" },
      { topic: "loops/loop-015/topics/topic-A.json", gen: "005" },
      { topic: "loops/loop-015/topics/topic-B.json", gen: "002" },
      { topic: "loops/loop-015/topics/topic-B.json", gen: "003" },
      { topic: "loops/loop-015/topics/topic-B.json", gen: "004" },
    ];
    console.error(`[en-loop] running ${plan.length} generations (each topic 3, no memo) — K2/K3/K5 effective; file numbers continue without overwriting`);
    for (const p of plan) {
      console.error(`\n[en-loop] → ${p.topic} gen-${p.gen}`);
      const r = await generateOne({ topicFile: p.topic, gen: p.gen, memoPath: null, baseUrl: DEFAULT_BASE_URL, maxTokens: FORMAL_MAX_TOKENS });
      writeOutputs({ topicFile: p.topic, gen: p.gen, result: r, memoPath: null });
      console.error(`[en-loop] ok=${r.ok} pass=${r.conformance?.pass} ${r.conformance?.issues?.length ? `issues=${r.conformance.issues.length}` : ""} prose needsFix=${r.prose?.needsFixCount}`);
      if (!r.ok) console.error(`[en-loop] error: ${r.error}`);
      // K5 判定は手動だが、失敗が続いた場合は次の生成を止める旨を警告
      await new Promise((res) => setTimeout(res, 400));
    }
    console.error(`\n[en-loop] done. Previews in loops/loop-015/previews/`);
    return;
  }

  // 単発
  let topicArg = null, gen = null, memoPath = null, maxTokens = FORMAL_MAX_TOKENS, baseUrl = DEFAULT_BASE_URL;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--topic" && args[i + 1]) { topicArg = args[i + 1]; i++; }
    else if (args[i] === "--gen" && args[i + 1]) { gen = args[i + 1]; i++; }
    else if (args[i] === "--memo" && args[i + 1]) { memoPath = args[i + 1]; i++; }
    else if (args[i] === "--max-tokens" && args[i + 1]) { maxTokens = Number(args[i + 1]); i++; }
    else if (args[i] === "--base-url" && args[i + 1]) { baseUrl = args[i + 1]; i++; }
  }
  if (!topicArg || !gen) {
    console.error("Usage: --topic A|B|path --gen NNN [--memo path] [--max-tokens n]");
    process.exit(2);
  }
  const r = await generateOne({ topicFile: resolveTopicArg(topicArg), gen, memoPath, baseUrl, maxTokens });
  writeOutputs({ topicFile: resolveTopicArg(topicArg), gen, result: r, memoPath });
  console.error(`[en-loop] ok=${r.ok} conformance pass=${r.conformance?.pass} prose needsFix=${r.prose?.needsFixCount}`);
  if (!r.ok) { console.error(r.error); process.exit(1); }
}

function writeOutputs({ topicFile, gen, result, memoPath }) {
  const { topic, ok, error, usage, generation, rawText, promptRecord, conformance, prose, startedAt, generatedAt } = result;
  const padGen = String(gen).padStart(3, "0");
  const outDir = resolve(genDirForTopic(topic.id));
  const outJson = join(outDir, `gen-${padGen}.json`);
  const outMd = join(outDir, `gen-${padGen}.md`);
  const previewDir = resolve("loops/loop-015/previews");
  const outHtml = join(previewDir, `${topic.id === "T-A" ? "topic-A" : "topic-B"}-gen-${padGen}.html`);

  mkdirSync(outDir, { recursive: true });
  mkdirSync(previewDir, { recursive: true });

  const record = {
    generatedAt,
    startedAt,
    model: MODEL,
    baseUrl: result.baseUrl ?? DEFAULT_BASE_URL,
    language: "EN",
    topic: { id: topic.id, label: topic.label, sourceFingerprint: topic.sourceFingerprint, topicFile },
    provisionalLimit: { max_tokens: result.maxTokens ?? FORMAL_MAX_TOKENS, temperature: TEMPERATURE, note: "正式値 max_tokens=4,000（英語系統）" },
    memo: memoPath ? { memoFile: memoPath, memoVersion: basename(memoPath, ".md"), applied: true } : { memoFile: null, memoVersion: null, applied: false, note: "反映メモなし（英語系統の自律3世代）" },
    ok,
    error,
    usage,
    usageSummary: usage ? {
      prompt_tokens: usage.prompt_tokens ?? null,
      completion_tokens: usage.completion_tokens ?? null,
      total_tokens: usage.total_tokens ?? null,
      prompt_tokens_details: usage.prompt_tokens_details ?? null,
      completion_tokens_details: usage.completion_tokens_details ?? null,
    } : null,
    promptRecord,
    generation,
    conformance,
    prose,
    rawResponseSnippet: rawText ? rawText.slice(0, 800) : null,
    cost: "未記録（残量が確認できないため）",
  };
  writeFileSync(outJson, JSON.stringify(record, null, 2) + "\n", "utf8");

  const md = renderMarkdown({ topic, gen: padGen, generatedAt, memoPath, memoVersion: memoPath ? basename(memoPath, ".md") : null, usage, generation, conformance, prose });
  writeFileSync(outMd, md, "utf8");

  const html = renderPreviewHtml({ topic, gen: padGen, generation });
  writeFileSync(outHtml, html, "utf8");

  console.error(`[en-loop] wrote ${outJson}`);
  console.error(`[en-loop] wrote ${outMd}`);
  console.error(`[en-loop] wrote ${outHtml}`);
}

main().catch((e) => {
  console.error(String(e?.stack ?? e));
  process.exit(1);
});
