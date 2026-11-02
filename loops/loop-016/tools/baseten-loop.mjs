#!/usr/bin/env node
// baseten-loop.mjs — 本格稼働用 世代列 生成スクリプト
// 企画の固定 → 生成 → 適合確認（手動）→ 散文評価（手動）→ 提示 のうち「生成」を担う
// 生成の実行は本人の環境で行い、ライン側はキーを受け取らない
// 反映メモは統括(Muse)が本人の書き込みから整え、本人が確認してから次世代へ渡す
//   確認待ち中は最新の確認済み版で進め、確認済み版がない初期は反映メモなしで進む（実施ブリーフの定め）
// 適合で落ちたものは世代として数えず「不採用（適合で不採用）」として記録する（M1）
// K4 同じ指摘3世代継続 / K5 適合落ち2連続 は題材単位で停止（K1–K3 も run-record.md で管理）

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";

const MODEL = "meta-models/muse-spark-open-1026";
const DEFAULT_BASE_URL = process.env.BASETEN_BASE_URL || "https://inference.baseten.co/v1";
const FORMAL_MAX_TOKENS = 4000;
const TEMPERATURE = 0.4;

function loadApiKey() {
  if (process.env.BASETEN_API_KEY) return { source: "env:BASETEN_API_KEY", key: process.env.BASETEN_API_KEY };
  if (process.env.MODEL_API_KEY) return { source: "env:MODEL_API_KEY", key: process.env.MODEL_API_KEY };
  const p = join(homedir(), ".config", "opencode", "baseten-api-key");
  if (existsSync(p)) {
    const raw = readFileSync(p, "utf8").trim();
    if (raw) return { source: `file:${p}`, key: raw };
  }
  return { source: null, key: null };
}

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { topic: null, gen: null, memo: null, baseUrl: DEFAULT_BASE_URL, maxTokens: FORMAL_MAX_TOKENS, dryRun: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--topic" && a[i + 1]) { o.topic = a[i + 1]; i++; }
    else if (a[i] === "--gen" && a[i + 1]) { o.gen = a[i + 1]; i++; }
    else if (a[i] === "--memo" && a[i + 1]) { o.memo = a[i + 1]; i++; }
    else if (a[i] === "--base-url" && a[i + 1]) { o.baseUrl = a[i + 1]; i++; }
    else if (a[i] === "--max-tokens" && a[i + 1]) { o.maxTokens = Number(a[i + 1]); i++; }
    else if (a[i] === "--dry-run") { o.dryRun = true; }
    else if (a[i] === "--help" || a[i] === "-h") { o.help = true; }
  }
  return o;
}

function usage() {
  console.log(`
baseten-loop.mjs — 世代列 生成（本格稼働）

使い方:
  node loops/loop-015/tools/baseten-loop.mjs --topic <A|B|path> --gen <NNN>
  node loops/loop-015/tools/baseten-loop.mjs --topic topic-A --gen 001 --memo reflection-memos/v002.md

オプション:
  --topic <A|B|path>   題材。A/B は loops/loop-015/topics/topic-A.json / topic-B.json の略記。パス指定も可
  --gen <NNN>          世代番号（001, 002 ...）。題材ごとに最大8世代、全体16まで（K2）
  --memo <path>        反映メモのファイル。省略時は反映メモなしで生成（初期や確認待ち中の前版で進む場合）
  --max-tokens <n>     1回あたり上限の正式値。既定 ${FORMAL_MAX_TOKENS}（run-record.md で確定した値）
  --base-url <url>     Baseten 推論エンドポイント。既定 ${DEFAULT_BASE_URL}
  --dry-run            API を呼ばずプロンプトだけ表示して終了
  --help

出力:
  loops/loop-015/generations/topic-A/gen-NNN.json  … 生成記録（日時、適用した反映メモの版、使用量、生成文、cost 未記録）
  loops/loop-015/generations/topic-A/gen-NNN.md    … 提示物（生成文 + メモ欄）。本人が直接書き込む
  適合落ちの場合は上記に「不採用（適合で不採用）」と明示し、世代として数えない（K5 の数え方に使う）
  呼び出し総数は run-record.md の時系列に手動で追記する（総数上限 20回、小サンプル 1回目 probe 1/20 + 2回目 2/20 を含む）

例:
  # T-A の第1世代（本格稼働。較正用の gen-001 とは別に世代列として数える場合は gen-002 以降や別名で）
  node loops/loop-015/tools/baseten-loop.mjs --topic A --gen 001
  # T-A の第2世代（反映メモ v002 を適用）
  node loops/loop-015/tools/baseten-loop.mjs --topic A --gen 002 --memo loops/loop-015/reflection-memos/v002.md
`.trim());
}

function resolveTopicArg(arg) {
  if (!arg) return null;
  if (arg === "A" || arg === "topic-A" || arg === "T-A") return "loops/loop-015/topics/topic-A.json";
  if (arg === "B" || arg === "topic-B" || arg === "T-B") return "loops/loop-015/topics/topic-B.json";
  return arg;
}

function genDirForTopic(topicId) {
  if (topicId === "T-A") return "loops/loop-015/generations/topic-A";
  if (topicId === "T-B") return "loops/loop-015/generations/topic-B";
  return `loops/loop-015/generations/${topicId}`;
}

function findNextCallCount() {
  // run-record.md の通算 2/20 を起点に、既存の gen-*.json の数を数えて推定する（厳密なカウントは手動で run-record.md に残す）
  let count = 2; // 小サンプル probe 1/20 + 正式 2/20 が済んでいる前提
  for (const topicId of ["topic-A", "topic-B"]) {
    const dir = resolve(genDirForTopic(topicId === "topic-A" ? "T-A" : "T-B"));
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".json") && !f.includes("probe")) count++;
    }
  }
  // 上記は小サンプルの gen-001.json を含むため、-1 して補正（小サンプルは較正用で重複カウントしない）
  // 実際は run-record.md の手動カウントを正とする。ここでは目安を出すだけ
  return count;
}

function buildMessages(topic, memoContent) {
  const system = [
    "You write Japanese LP (landing page) copy sentences for a fictional job posting, strictly from the given FACT items.",
    "Rules:",
    "- Use only the stated FACT items. Never add information that is not in the FACTs or the plan.",
    "- Write plain descriptive sentences in Japanese. No greetings, appeals, or embellishment beyond the plan's訴求 direction.",
    "- For every sentence, list the FACT keys it is based on (factKeys) and the original line IDs (sourceLines). A sentence must cite at least one key and at least one line, and must cite every key and line it uses.",
    "- Keep numbers and conditions exactly as written in the FACT values (e.g. 1,250円, 週3日〜、1日4時間〜, 月1万円まで, 3日間, 月ごと). Do not convert, round, or rephrase quantities.",
    "- Items not in the FACTs must not be asserted. If you need to mention an absent item, state only that it is not stated.",
    "- Output JSON only, no markdown fences.",
    'Schema: {"sentences":[{"text":"...","factKeys":["..."],"sourceLines":["L01"]}]}',
  ].join("\n");

  const planBlock = [
    `企画（事前に固定。生成前に確定済み）:`,
    `- 対象層: ${topic.plan.targetAudience}`,
    `- 訴求: ${topic.plan.appeal}`,
    `- 制約: ${topic.constraints}`,
  ].join("\n");

  let memoBlock = "";
  if (memoContent) {
    memoBlock = `\n\n反映メモ（本人の指摘を統括(Muse)が整え、本人が確認した版。次世代の意図の層として適用する）:\n${memoContent}\n`;
  }

  const materials = [
    `Materials for ${topic.id} (${topic.label}) — 開始時の版 ${topic.sourceFingerprint}:`,
    planBlock,
    memoBlock,
    "Stated FACT items (key / value / sourceLine):",
    ...topic.facts.map((f) => `- ${f.key}: value=${JSON.stringify(f.value)} sourceLine=${f.sourceLine}`),
  ].join("\n");

  const user = `${materials}\n\nWrite the LP copy sentences as JSON per schema. Respect the plan's訴求 direction and apply the reflection memo if present, while keeping every factual value verbatim.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function renderMarkdown({ topic, gen, generatedAt, memoPath, memoVersion, usage, generation }) {
  const memoLine = memoPath
    ? `適用した反映メモの版: ${memoVersion ?? basename(memoPath)}（${memoPath}）`
    : "適用した反映メモの版: なし（初期または確認済み版がないため。確認待ち中は前版で進む）";

  const sentencesText = generation?.sentences
    ? generation.sentences.map((s, i) => `${i + 1}. ${s.text} 〔${s.factKeys.join(",")} / ${s.sourceLines.join(",")}〕`).join("\n")
    : "(生成文の取得に失敗。error を参照)";

  const rawJson = JSON.stringify(generation ?? { error: "no generation" }, null, 2);

  const usageLine = usage
    ? `prompt ${usage.prompt_tokens ?? "?"}（cached ${usage.prompt_tokens_details?.cached_tokens ?? "?" }）/ completion ${usage.completion_tokens ?? "?"}（reasoning ${usage.completion_tokens_details?.reasoning_tokens ?? "?" }）/ total ${usage.total_tokens ?? "?"}`
    : "取得できず";

  // 通算呼び出し数は目安。run-record.md の手動カウントを正とする旨を明記
  const callCountHint = findNextCallCount();

  return `# ${topic.id} gen-${gen}（${topic.label}）

- 生成日時: ${generatedAt}（JST は +09:00 で読み替える）
- 実行基盤: Baseten Muse Spark Open（\`meta-models/muse-spark-open-1026\`）
- ${memoLine}
- 企画: \`topics/${topic.id === "T-A" ? "topic-A" : "topic-B"}.json\` の \`plan\` を固定（対象層・訴求は生成前に固定済み）
- 1回あたり上限: 正式値 max_tokens=${FORMAL_MAX_TOKENS} temperature=${TEMPERATURE}（run-record.md で確定）
- 世代として数えるか: はい（適合で不採用の場合は「不採用（適合で不採用）」と明示し、世代として数えない）

## 生成文

${sentencesText}

<details><summary>raw JSON</summary>

\`\`\`json
${rawJson}
\`\`\`

</details>

## 適合の確認（機械検査）

- 実施手段: 既存の再検証の機械検査を流用し、題材 \`topics/${topic.id === "T-A" ? "topic-A" : "topic-B"}.json\` の facts に対して照合する（承認記録は使わない）
- 結果: —（本ファイル作成後に手動で記入。落ちた場合は「不採用（適合で不採用）」と明示し、世代として数えない。2連続したら K5 により題材停止）
- 落ちた場合の扱い: 単発では次の生成を止めず、2回連続したら K5 により題材停止

## 散文評価（当事者の声、生活翻訳、型への沿い方、第三者視点の混入なし）

- 評価者: —
- 要修正の数: —（観点ごとに件数を記載。本格稼働では両題材とも同じ観点で評価する）
- 要修正の内容: —

## メモ欄（本人が直接書き込む）

- メモ欄は文単位の書き込みを基本とし、サンプル全体への書き込みも置く
- 書き込み単位は「指摘1件」で対象の文と内容が分かる形で残す。要約して丸めない
- 状態は 未反映 / 反映済み / 見送り を区別する。見送りは本人が明示し、後続へ持ち越さない

### 文単位の指摘

- [ ] 指摘1: 対象文「—」— 内容: —（状態: 未反映）

### サンプル全体への指摘

- [ ] 指摘1: —（状態: 未反映）

## 備考

- 実費: 未記録（残量が確認できないため）。使用量: ${usageLine}（\`gen-${gen}.json:usage\`）
- 生成呼び出しの通算回数: 目安 ${callCountHint} / 20（小サンプル probe 1/20 + 正式 2/20 を含む。確定値は run-record.md に手動で記録する）
- 対応する JSON 記録: \`generations/${topic.id === "T-A" ? "topic-A" : "topic-B"}/gen-${gen}.json\`（本ファイルとペア）
- 判定: 「改善した」は (i) メモの解消と (ii) 散文評価の要修正減少が両方そろった場合のみ。片方だけは「部分改善」、反証条件に当たれば仮説が成り立たなかった実測として残す
`;
}

async function main() {
  const opts = parseArgs();
  if (opts.help || !opts.topic || !opts.gen) {
    usage();
    if (!opts.topic || !opts.gen) process.exit(2);
    return;
  }

  const topicFile = resolve(resolveTopicArg(opts.topic));
  if (!existsSync(topicFile)) {
    console.error(`[baseten-loop] topic file not found: ${topicFile}`);
    process.exit(2);
  }
  const topic = JSON.parse(readFileSync(topicFile, "utf8"));

  let memoContent = null;
  let memoVersion = null;
  if (opts.memo) {
    const memoPath = resolve(opts.memo);
    if (!existsSync(memoPath)) {
      console.error(`[baseten-loop] memo file not found: ${memoPath}`);
      process.exit(2);
    }
    memoContent = readFileSync(memoPath, "utf8").trim();
    memoVersion = basename(memoPath, ".md");
    console.error(`[baseten-loop] memo: ${opts.memo} (${memoVersion})`);
  } else {
    console.error(`[baseten-loop] memo: none (初期または確認済み版なし)`); 
  }

  const messages = buildMessages(topic, memoContent);
  const promptRecord = messages.map((m) => `## ${m.role}\n\n${m.content}`).join("\n\n");

  if (opts.dryRun) {
    console.log(promptRecord);
    console.error("[baseten-loop] dry-run: prompt printed, no API call");
    return;
  }

  const { key, source } = loadApiKey();
  if (!key) {
    console.error("[baseten-loop] API key not found. Set BASETEN_API_KEY or place key at ~/.config/opencode/baseten-api-key");
    process.exit(2);
  }
  console.error(`[baseten-loop] key source: ${source} (value not logged)`);
  console.error(`[baseten-loop] topic=${topic.id} gen=${opts.gen} model=${MODEL} baseUrl=${opts.baseUrl} max_tokens=${opts.maxTokens}`);

  const url = `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const body = { model: MODEL, messages, max_tokens: opts.maxTokens, temperature: TEMPERATURE };

  let ok = false;
  let error = null;
  let usage = null;
  let generation = null;
  let rawText = null;
  const startedAt = new Date().toISOString();

  try {
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
        error = `No content in response. choices=${JSON.stringify(json.choices).slice(0, 600)}`;
      } else {
        try {
          generation = JSON.parse(content);
        } catch (e) {
          generation = { _rawContent: content, _parseError: String(e) };
          error = `Generation content was not valid JSON: ${String(e)}`;
        }
        if (!error) ok = true;
      }
      if (usage) console.error(`[baseten-loop] usage: ${JSON.stringify(usage)}`);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const generatedAt = new Date().toISOString();
  const outDir = resolve(genDirForTopic(topic.id));
  const padGen = String(opts.gen).padStart(3, "0");
  const outJson = join(outDir, `gen-${padGen}.json`);
  const outMd = join(outDir, `gen-${padGen}.md`);

  const record = {
    generatedAt,
    startedAt,
    model: MODEL,
    baseUrl: opts.baseUrl,
    topic: { id: topic.id, label: topic.label, sourceFingerprint: topic.sourceFingerprint, topicFile: resolveTopicArg(opts.topic) },
    provisionalLimit: { max_tokens: opts.maxTokens, temperature: TEMPERATURE, note: "正式値 max_tokens=4,000（小サンプルで確定）" },
    memo: opts.memo ? { memoFile: opts.memo, memoVersion, applied: true } : { memoFile: null, memoVersion: null, applied: false, note: "反映メモなし（初期または確認待ち中は前版で進む）" },
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
    rawResponseSnippet: rawText ? rawText.slice(0, 800) : null,
    cost: "未記録（残量が確認できないため）",
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outJson, JSON.stringify(record, null, 2) + "\n", "utf8");
  console.error(`[baseten-loop] wrote ${outJson} (ok=${ok})`);

  const md = renderMarkdown({ topic, gen: padGen, generatedAt, memoPath: opts.memo, memoVersion, usage, generation });
  writeFileSync(outMd, md, "utf8");
  console.error(`[baseten-loop] wrote ${outMd}`);

  if (!ok) {
    console.error(`[baseten-loop] generation not ok: ${error}`);
    console.error(`[baseten-loop] note: 適合前に生成自体が失敗した場合は「不採用」ではなく「生成失敗」として扱い、K5 の数え方には含めない（K5 は適合落ちの継続）`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(String(e?.stack ?? e));
  process.exit(1);
});
