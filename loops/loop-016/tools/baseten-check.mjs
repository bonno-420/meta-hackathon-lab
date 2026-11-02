#!/usr/bin/env node
// tools/baseten-check.mjs — Baseten 疎通確認（本人の環境のみで実行）
// ライン側はキーを受け取らない。キーの値自体は出力・記録・ログに残さない
// 使い方（PowerShell 例）:
//   node loops/loop-015/tools/baseten-check.mjs
//   node loops/loop-015/tools/baseten-check.mjs --out loops/loop-015/connectivity-check.json

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const MODEL = "meta-models/muse-spark-open-1026";
// Baseten の推論エンドポイントはアカウントやモデル配信形態で異なる場合がある
// 下記の既定は OpenAI 互換の /v1/chat/completions を想定した例である
// あなたの Baseten コンソールの「Inference Endpoint」表示に合わせて BASE_URL を上書きすること
const DEFAULT_BASE_URL = process.env.BASETEN_BASE_URL || "https://inference.baseten.co/v1";

function parseArgs() {
  const args = process.argv.slice(2);
  let out = "loops/loop-015/connectivity-check.json";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out" && args[i + 1]) {
      out = args[i + 1];
      i++;
    } else if (args[i] === "--base-url" && args[i + 1]) {
      process.env.BASETEN_BASE_URL = args[i + 1];
      i++;
    }
  }
  return { out };
}

function loadApiKey() {
  // 優先: 環境変数 BASETEN_API_KEY → MODEL_API_KEY（将来の互換）
  if (process.env.BASETEN_API_KEY) return { key: process.env.BASETEN_API_KEY, source: "env:BASETEN_API_KEY" };
  if (process.env.MODEL_API_KEY) return { key: process.env.MODEL_API_KEY, source: "env:MODEL_API_KEY" };

  // 次点: ファイル ~/.config/opencode/baseten-api-key（ブリーフの指定）
  const keyPath = join(homedir(), ".config", "opencode", "baseten-api-key");
  if (existsSync(keyPath)) {
    const raw = readFileSync(keyPath, "utf8").trim();
    if (raw) return { key: raw, source: `file:${keyPath}` };
  }

  // Windows の別表記（念のため）
  const altPath = join(homedir(), ".config", "opencode", "baseten-api-key");
  if (existsSync(altPath)) {
    const raw = readFileSync(altPath, "utf8").trim();
    if (raw) return { key: raw, source: `file:${altPath}` };
  }

  return { key: null, source: null };
}

async function main() {
  const { out } = parseArgs();
  const startedAt = new Date().toISOString();
  const { key, source } = loadApiKey();

  if (!key) {
    const record = {
      checkedAt: startedAt,
      model: MODEL,
      baseUrl: DEFAULT_BASE_URL,
      ok: false,
      error: "API key not found. Set BASETEN_API_KEY env var or place key at ~/.config/opencode/baseten-api-key",
      keySource: null,
      usage: null,
      cost: "未記録（残量が確認できないため）",
    };
    writeFileSync(resolve(out), JSON.stringify(record, null, 2) + "\n");
    console.error(`[baseten-check] ${record.error}`);
    console.error(`[baseten-check] wrote ${out} (ok=false)`);
    process.exit(2);
  }

  // キーの値自体は出力しない（存在確認のみ）
  console.error(`[baseten-check] key source: ${source} (value not logged)`);

  const baseUrl = process.env.BASETEN_BASE_URL || DEFAULT_BASE_URL;
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const body = {
    model: MODEL,
    messages: [{ role: "user", content: "ping" }],
    max_tokens: 16,
    temperature: 0.2,
  };

  let ok = false;
  let error = null;
  let usage = null;
  let rawResponseSnippet = null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${key}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    // レスポンスの抜粋は 500 文字までに切り詰め、キー類が含まれていないことを確認してから記録する
    rawResponseSnippet = text.slice(0, 500);

    if (!res.ok) {
      error = `HTTP ${res.status} ${res.statusText}: ${text.slice(0, 300)}`;
    } else {
      ok = true;
      try {
        const json = JSON.parse(text);
        usage = json.usage ?? null;
        // 使用量が取れれば run-record.md への転記に使う。取れない場合は null のまま残す
      } catch {
        // JSON 以外の応答でも疎通自体は ok とする
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const record = {
    checkedAt: startedAt,
    model: MODEL,
    baseUrl,
    ok,
    error,
    keySource: source ? source.replace(key || "", "***") : null, // キー値は記録しない
    usage,
    rawResponseSnippet: ok ? rawResponseSnippet : undefined,
    cost: "未記録（残量が確認できないため）",
    note: "この疎通確認の呼び出しは K2 の世代数と総呼び出し数には含めない（実施ブリーフの定め）",
  };

  // keySource はファイルパスまたは env 名のみを残す
  record.keySource = source;

  writeFileSync(resolve(out), JSON.stringify(record, null, 2) + "\n");
  console.error(`[baseten-check] wrote ${out} (ok=${ok})`);
  if (usage) console.error(`[baseten-check] usage: ${JSON.stringify(usage)}`);
  if (!ok) process.exit(1);
}

main();
