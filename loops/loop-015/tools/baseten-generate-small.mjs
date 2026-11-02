#!/usr/bin/env node
// baseten-generate-small.mjs — 小サンプル1回生成（企画の固定 → 生成）
// 対象: topic-A、暫定の小さい上限で1回だけ Baseten を呼ぶ
// 結果と使用量を generations の雛形へ記録する形。1回あたり上限の具体値は本人が実測を見て決める

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MODEL = "meta-models/muse-spark-open-1026";
const DEFAULT_BASE_URL = process.env.BASETEN_BASE_URL || "https://inference.baseten.co/v1";

// 暫定の小さい上限（本番の上限ではない。小サンプル実測用の小さめの値）
// 具体値はこの実測を見て本人が決めるため、スクリプト側では本値を固定しない
const PROVISIONAL_MAX_TOKENS = 800;
const PROVISIONAL_TEMPERATURE = 0.4;

function loadApiKey() {
  if (process.env.BASETEN_API_KEY) return { key: process.env.BASETEN_API_KEY, source: "env:BASETEN_API_KEY" };
  if (process.env.MODEL_API_KEY) return { key: process.env.MODEL_API_KEY, source: "env:MODEL_API_KEY" };
  const keyPath = join(homedir(), ".config", "opencode", "baseten-api-key");
  if (existsSync(keyPath)) {
    const raw = readFileSync(keyPath, "utf8").trim();
    if (raw) return { key: raw, source: `file:${keyPath}` };
  }
  return { key: null, source: null };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    topic: "loops/loop-015/topics/topic-A.json",
    outJson: "loops/loop-015/generations/topic-A/gen-001.json",
    outMd: "loops/loop-015/generations/topic-A/gen-001.md",
    baseUrl: process.env.BASETEN_BASE_URL || DEFAULT_BASE_URL,
    maxTokens: PROVISIONAL_MAX_TOKENS,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--topic" && args[i + 1]) { opts.topic = args[i + 1]; i++; }
    else if (args[i] === "--out-json" && args[i + 1]) { opts.outJson = args[i + 1]; i++; }
    else if (args[i] === "--out-md" && args[i + 1]) { opts.outMd = args[i + 1]; i++; }
    else if (args[i] === "--base-url" && args[i + 1]) { opts.baseUrl = args[i + 1]; i++; }
    else if (args[i] === "--max-tokens" && args[i + 1]) { opts.maxTokens = Number(args[i + 1]); i++; }
  }
  return opts;
}

function buildMessages(topic) {
  // 企画の固定を先に置き（L-027）、facts を素材として渡す
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

  const materials = [
    `Materials for ${topic.id} (${topic.label}) — 開始時の版 ${topic.sourceFingerprint}:`,
    planBlock,
    "",
    "Stated FACT items (key / value / sourceLine):",
    ...topic.facts.map((f) => `- ${f.key}: value=${JSON.stringify(f.value)} sourceLine=${f.sourceLine}`),
  ].join("\n");

  const user = `${materials}\n\nWrite the LP copy sentences as JSON per schema. Respect the plan's訴求 direction while keeping every factual value verbatim.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function patchMarkdown(mdPath, { generatedAt, usage, model, maxTokens, generation }) {
  let md = readFileSync(mdPath, "utf8");

  // 生成日時
  md = md.replace(/^- 生成日時:.*$/m, `- 生成日時: ${generatedAt}（JST は +09:00 で読み替える）`);
  // 1回あたり上限（暫定値のまま）
  md = md.replace(/^- 1回あたり上限:.*$/m, `- 1回あたり上限: 暫定 max_tokens=${maxTokens} temperature=${PROVISIONAL_TEMPERATURE}（小サンプル用の小さめの値。本番の上限は実測後に本人が決定）`);
  // 世代として数えるか（小サンプルの扱いは後で本人が決めるため一旦メモ）
  md = md.replace(/^- 世代として数えるか:.*$/m, `- 世代として数えるか: 小サンプル（較正用。世代に含めるかは実測後に本人が判断し run-record.md に明記）`);

  // 生成文セクションを差し替え
  const sentencesText = generation?.sentences
    ? generation.sentences.map((s, i) => `${i + 1}. ${s.text} 〔${s.factKeys.join(",")} / ${s.sourceLines.join(",")}〕`).join("\n")
    : "(生成文の取得に失敗)";
  const rawJsonBlock = JSON.stringify(generation, null, 2);

  md = md.replace(
    /^## 生成文\n\n>.*$/ms,
    `## 生成文\n\n${sentencesText}\n\n<details><summary>raw JSON</summary>\n\n\`\`\`json\n${rawJsonBlock}\n\`\`\`\n\n</details>`
  );

  // 備考の生成呼び出し通算回数と使用量
  const usageLine = usage
    ? `prompt ${usage.prompt_tokens ?? "?"} / completion ${usage.completion_tokens ?? "?"} / total ${usage.total_tokens ?? "?"} tokens（内訳: ${JSON.stringify(usage.prompt_tokens_details ?? {})} / ${JSON.stringify(usage.completion_tokens_details ?? {})}）`
    : "取得できず";
  md = md.replace(/^- 実費:.*$/m, `- 実費: 未記録（残量が確認できないため）。使用量: ${usageLine}。モデル: ${model}`);
  md = md.replace(/^- 生成呼び出しの通算回数:.*$/m, `- 生成呼び出しの通算回数: 1 / 20（小サンプル1回目）`);

  writeFileSync(mdPath, md, "utf8");
}

async function main() {
  const opts = parseArgs();
  const startedAt = new Date().toISOString();
  const { key, source } = loadApiKey();

  if (!key) {
    console.error("[baseten-generate-small] API key not found. Set BASETEN_API_KEY or place key at ~/.config/opencode/baseten-api-key");
    process.exit(2);
  }
  console.error(`[baseten-generate-small] key source: ${source} (value not logged)`);
  console.error(`[baseten-generate-small] model=${MODEL} baseUrl=${opts.baseUrl} max_tokens=${opts.maxTokens} (provisional)`);

  const topicPath = resolve(opts.topic);
  const topic = JSON.parse(readFileSync(topicPath, "utf8"));
  const messages = buildMessages(topic);

  // プロンプトの記録（再現性のため）
  const promptRecord = messages.map((m) => `## ${m.role}\n\n${m.content}`).join("\n\n");

  const url = `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const body = {
    model: MODEL,
    messages,
    max_tokens: opts.maxTokens,
    temperature: PROVISIONAL_TEMPERATURE,
  };

  let ok = false;
  let error = null;
  let usage = null;
  let generation = null;
  let rawText = null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${key}`,
      },
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
        // reasoning_content のみの場合など
        error = `No content in response. choices=${JSON.stringify(json.choices).slice(0, 600)}`;
      } else {
        try {
          generation = JSON.parse(content);
        } catch (e) {
          // モデルが JSON 以外を返した場合でも記録は残す
          generation = { _rawContent: content, _parseError: String(e) };
          error = `Generation content was not valid JSON: ${String(e)} — raw kept in _rawContent`;
          // JSON でなければ ok とはしないが、使用量は記録する
        }
        ok = !error;
      }
      if (usage) {
        console.error(`[baseten-generate-small] usage: ${JSON.stringify(usage)}`);
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const generatedAt = new Date().toISOString();
  const record = {
    generatedAt,
    startedAt,
    model: MODEL,
    baseUrl: opts.baseUrl,
    topic: { id: topic.id, label: topic.label, sourceFingerprint: topic.sourceFingerprint, topicFile: opts.topic },
    provisionalLimit: { max_tokens: opts.maxTokens, temperature: PROVISIONAL_TEMPERATURE, note: "暫定の小さい上限。本番の上限はこの実測を見て本人が決める" },
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
    note: "小サンプル（較正用）。世代に含めるかは run-record.md で本人が明示する",
  };

  // JSON 記録を保存
  const outJsonPath = resolve(opts.outJson);
  mkdirSync(dirname(outJsonPath), { recursive: true });
  writeFileSync(outJsonPath, JSON.stringify(record, null, 2) + "\n", "utf8");
  console.error(`[baseten-generate-small] wrote ${opts.outJson} (ok=${ok})`);

  // Markdown 雛形へ反映（存在すれば）
  const outMdPath = resolve(opts.outMd);
  if (existsSync(outMdPath)) {
    patchMarkdown(outMdPath, { generatedAt, usage, model: MODEL, maxTokens: opts.maxTokens, generation });
    console.error(`[baseten-generate-small] patched ${opts.outMd}`);
  } else {
    console.error(`[baseten-generate-small] markdown not found at ${opts.outMd} — skipped patch`);
  }

  // run-record.md の小サンプル節への追記用サマリを stderr に出す
  if (usage) {
    console.error(`[baseten-generate-small] summary for run-record.md:`);
    console.error(`  prompt ${usage.prompt_tokens} / completion ${usage.completion_tokens} / total ${usage.total_tokens}`);
    if (usage.prompt_tokens_details) console.error(`  prompt_details: ${JSON.stringify(usage.prompt_tokens_details)}`);
    if (usage.completion_tokens_details) console.error(`  completion_details: ${JSON.stringify(usage.completion_tokens_details)}`);
  }

  if (!ok) {
    console.error(`[baseten-generate-small] generation not ok: ${error}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(String(e?.stack ?? e));
  process.exit(1);
});
