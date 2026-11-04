#!/usr/bin/env node
// make-lp.mjs — the single entry point for producing an LP with the
// Loopwright pipeline. This wrapper exists so that "make an LP" has
// exactly one door: src/run-demo.mjs. It never assembles a page
// itself, never fabricates an approval or a confirmation, and when
// the pipeline stops (a checkpoint or a gate), it reports the stop
// as the result, with the next human step.
//
// Usage:
//   node make-lp.mjs <posting.txt> [--posting-id ID] [--language English]
//                    [--audience "..."] [--light] [--out-dir DIR]
//   node make-lp.mjs --resume <out-dir> [--kv-confirmation FILE]
//
// API keys come from the environment, exactly as with run-demo.mjs.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

function usage() {
  console.log("Usage: node make-lp.mjs <posting.txt> [--posting-id ID] [--language English] [--audience \"...\"] [--light] [--out-dir DIR]");
  console.log("       node make-lp.mjs --resume <out-dir> [--kv-confirmation FILE]");
}
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
function fail(msg) {
  console.error(`make-lp: ${msg}`);
  process.exit(2);
}

function report(outDir) {
  const resultFile = join(outDir, "run-result.json");
  if (!existsSync(resultFile)) return;
  let r;
  try { r = JSON.parse(readFileSync(resultFile, "utf8")); } catch { return; }
  console.log(`\n[make-lp] status: ${r.status}${r.stoppedAt ? ` (stopped at: ${r.stoppedAt})` : ""}`);
  if (r.stopReason) console.log(`[make-lp] reason: ${r.stopReason}`);
  const next = {
    "approval": `next: a human approval record is required at ${join(outDir, "entry", "approval.json")}; then run: node make-lp.mjs --resume ${outDir}`,
    "key-visual": `next: review the presented LP finished image (${join(outDir, "presentation-key-visual.json")}), record the confirmation, then run: node make-lp.mjs --resume ${outDir} --kv-confirmation <file>`,
    "text-checkpoint": `next: review the presented text (${join(outDir, "presentation-text.json")}), then run: node make-lp.mjs --resume ${outDir}`,
    "lp-checkpoint": `next: review the assembled LP, then run: node make-lp.mjs --resume ${outDir}`,
  }[r.stoppedAt];
  if (r.status === "complete") console.log(`[make-lp] done. LP: ${r.lpFile ?? join(outDir, "lp.html")}`);
  else if (next) console.log(`[make-lp] ${next}`);
  else if (r.stoppedAt) console.log("[make-lp] the pipeline stopped at a gate. Report this stop as the result; do not work around it by hand.");
}

if (args.includes("--help") || args.length === 0) { usage(); process.exit(args.length === 0 ? 2 : 0); }

if (args[0] === "--resume") {
  const outDir = args[1];
  if (!outDir || !existsSync(join(ROOT, outDir, "run-state.json"))) fail(`no run-state.json under ${outDir ?? "(missing)"}`);
  const saved = existsSync(join(ROOT, outDir, "make-lp-args.json"))
    ? JSON.parse(readFileSync(join(ROOT, outDir, "make-lp-args.json"), "utf8")) : { draft: [] };
  const cli = ["src/run-demo.mjs", "--resume", join(outDir, "run-state.json"), ...(saved.draft ?? [])];
  const kv = argValue("--kv-confirmation");
  if (kv) cli.push("--kv-confirmation", kv);
  const r = spawnSync("node", cli, { cwd: ROOT, stdio: "inherit", env: process.env });
  report(resolve(ROOT, outDir));
  process.exit(r.status ?? 1);
}

const posting = args[0];
if (!posting || posting.startsWith("--")) { usage(); fail("a posting text file is required"); }
if (!existsSync(resolve(ROOT, posting))) fail(`posting file not found: ${posting}`);
const postingId = argValue("--posting-id") ?? posting.replace(/^.*\//, "").replace(/\.[^.]*$/, "");
const outDir = argValue("--out-dir") ?? join("runs", postingId);
const checkpoints = args.includes("--light") ? "light" : "full";
const draft = ["--draft-planning"];
const language = argValue("--language");
if (language) draft.push("--draft-language", language);
const audience = argValue("--audience");
if (audience) draft.push("--draft-audience", audience);

mkdirSync(resolve(ROOT, outDir), { recursive: true });
writeFileSync(join(ROOT, outDir, "make-lp-args.json"), JSON.stringify({ draft }, null, 1) + "\n");
const cli = ["src/run-demo.mjs", "--posting", posting, "--posting-id", postingId, "--out-dir", outDir, "--checkpoints", checkpoints, ...draft];
console.log(`[make-lp] node ${cli.join(" ")}`);
const r = spawnSync("node", cli, { cwd: ROOT, stdio: "inherit", env: process.env });
report(resolve(ROOT, outDir));
process.exit(r.status ?? 1);
