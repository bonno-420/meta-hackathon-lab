#!/usr/bin/env node
// make-lp.mjs — the single entry point for producing an LP with the
// Loopwright pipeline. "Make an LP" has exactly one door:
// src/run-demo.mjs. This wrapper never assembles a page itself and
// never invents a human decision.
//
// How a human uses it: one command.
//   node make-lp.mjs <posting.txt>
// The pipeline runs; at each checkpoint it stops, and this wrapper
// opens a preview page in the browser showing the actual artifact
// (the extracted facts, the key visual, the copy, the assembled LP)
// together with a selectable question. The human picks an answer;
// the wrapper writes the record the pipeline requires (approval,
// key-visual confirmation, presentation judgement) as the record of
// that answer, and resumes the run. The human never edits a JSON
// file, never computes a hash, and never runs a side command.
// Answering "stop" is a valid result: the run stays stopped at
// that checkpoint.
//
// The question flow works the same when the wrapper is driven
// from a non-terminal session (an agent's chat, a script): at a
// checkpoint the wrapper prints the checkpoint package — the
// artifact, the question, and the selectable choices — and stops.
// The operator presents that package to the principal; when the
// principal answers, the operator passes the answer back with
//   node make-lp.mjs --resume <out-dir> --answer <choiceId>
// and the wrapper writes the record of THAT answer (never a record
// without an answer) and continues the run. The operator carries
// the question and the answer; the judgement is the principal's.
// Gate stops (contradictions, verification failures) are never
// questioned and never worked around — they are reported as
// results in both modes.
//
// API keys come from the environment, exactly as with run-demo.mjs.

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join, resolve, relative, extname, sep } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const INTERACTIVE = Boolean(process.stdin.isTTY && process.stdout.isTTY);

function usage() {
  console.log("Usage: node make-lp.mjs <posting.txt> [--posting-id ID] [--language English] [--audience \"...\"] [--light] [--out-dir DIR]");
  console.log("       node make-lp.mjs --resume <out-dir> [--kv-confirmation FILE]");
  console.log("       node make-lp.mjs --resume <out-dir> --answer <choiceId> [--name \"...\"] [--note \"...\"]");
  console.log("At a checkpoint the wrapper presents the artifact with a selectable question (a preview page in a terminal, a printed checkpoint package otherwise); the answer is recorded and the run continues.");
}
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
function fail(msg) {
  console.error(`make-lp: ${msg}`);
  process.exit(2);
}
function loadJson(file) {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return null; }
}
function sha256File(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}
function nowIso() {
  return new Date().toISOString();
}
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const rel = (p) => p.replace(/\\/g, "/");
// Records store repo-relative paths. Callers pass both relative
// and absolute paths; normalize either to a repo-relative one.
const relRoot = (p) => rel(relative(ROOT, resolve(ROOT, p)));

// ---------- operator name (asked once, kept locally, never committed) ----------
const OPERATOR_FILE = join(ROOT, ".loopwright-operator.json");
function operatorName() {
  const saved = loadJson(OPERATOR_FILE);
  if (saved && saved.name) return saved.name;
  const g = spawnSync("git", ["config", "user.name"], { cwd: ROOT, encoding: "utf8" });
  const name = (g.stdout || "").trim();
  return name || null;
}
function saveOperatorName(name) {
  try { writeFileSync(OPERATOR_FILE, JSON.stringify({ name }, null, 1) + "\n"); } catch { /* local convenience only */ }
}

// ---------- terminal questions ----------
let activeRl = null;
function askTerminal(lines, prompt) {
  return new Promise((resolveAsk) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    activeRl = rl;
    for (const line of lines) console.log(line);
    rl.question(prompt, (answer) => { if (activeRl === rl) activeRl = null; rl.close(); resolveAsk(answer.trim()); });
  });
}

// ---------- preview page with a selectable question ----------
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".html": "text/html; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml" };

function openBrowser(url) {
  try {
    const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin" ? ["open", [url]]
      : ["xdg-open", [url]];
    const child = spawn(cmd[0], cmd[1], { detached: true, stdio: "ignore" });
    child.on("error", () => { /* the URL is printed as well */ });
    child.unref();
  } catch { /* the URL is printed as well */ }
}

// Resolves to { choice, name, note, via } — from the preview page or
// the terminal, whichever answers first. Choices: [{id, label}].
function askCheckpoint({ title, question, artifactHtml, choices, needName }) {
  return new Promise((resolveAsk) => {
    let settled = false;
    let server = null;
    const done = (value) => {
      if (settled) return;
      settled = true;
      if (activeRl) { try { activeRl.close(); } catch { /* already closed */ } activeRl = null; }
      if (server) { try { server.close(); } catch { /* already closed */ } }
      resolveAsk(value);
    };
    const token = createHash("sha256").update(String(Date.now()) + String(Math.random())).digest("hex").slice(0, 16);
    const defaultName = operatorName() ?? "";
    const buttons = choices.map((c, i) =>
      `<button type="button" class="choice${i === 0 ? " primary" : ""}" data-choice="${esc(c.id)}">${esc(c.label)}</button>`).join("\n");
    const page = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>${esc(title)} — Loopwright</title>
<style>
body{font-family:system-ui,"Hiragino Sans","Noto Sans JP",sans-serif;margin:0;background:#f4f4f2;color:#1c1c1a}
main{max-width:920px;margin:0 auto;padding:24px 20px 64px}
h1{font-size:20px;margin:8px 0 4px} .q{font-size:16px;margin:0 0 16px}
.artifact{background:#fff;border:1px solid #ddd;border-radius:10px;padding:18px;margin-bottom:20px;overflow:auto}
.artifact img{max-width:100%;height:auto;display:block;margin:0 auto}
.artifact iframe{width:100%;height:75vh;border:0}
table{border-collapse:collapse;width:100%} td,th{border-bottom:1px solid #e5e5e0;padding:6px 8px;text-align:left;vertical-align:top;font-size:14px}
.chip{display:inline-block;background:#eef0ea;border-radius:999px;padding:2px 10px;margin:2px;font-size:13px}
.choices{display:flex;gap:12px;flex-wrap:wrap;margin:14px 0}
button.choice{font-size:16px;padding:12px 22px;border-radius:10px;border:1px solid #999;background:#fff;cursor:pointer}
button.choice.primary{background:#1f3d2b;color:#fff;border-color:#1f3d2b}
label{display:block;font-size:13px;margin:10px 0 4px;color:#444}
input[type=text]{font-size:15px;padding:8px 10px;width:min(420px,90%);border:1px solid #bbb;border-radius:8px}
textarea{width:min(640px,95%);min-height:56px;font-size:14px;padding:8px 10px;border:1px solid #bbb;border-radius:8px}
#done{display:none;font-size:16px;background:#e7f2e4;border:1px solid #9db98f;border-radius:10px;padding:14px 16px}
pre{white-space:pre-wrap;font-size:13px}
</style></head><body><main>
<h1>${esc(title)}</h1>
<p class="q">${esc(question)}</p>
<div class="artifact">${artifactHtml}</div>
${needName ? `<label>記録に残す名前（承認者・確認者）</label><input type="text" id="name" value="${esc(defaultName)}">` : ""}
<label>気づいた点（任意。記録に残ります）</label>
<textarea id="note" placeholder=""></textarea>
<div class="choices">${buttons}</div>
<div id="done">記録しました。このタブは閉じて大丈夫です。続きはターミナルで進みます。</div>
<script>
document.querySelectorAll("button.choice").forEach((b) => {
  b.addEventListener("click", async () => {
    const body = { choice: b.dataset.choice,
      name: (document.getElementById("name") || {}).value || "",
      note: (document.getElementById("note") || {}).value || "" };
    document.querySelectorAll("button.choice").forEach((x) => { x.disabled = true; });
    await fetch("answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    document.getElementById("done").style.display = "block";
  });
});
</script>
</main></body></html>`;
    server = createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] !== token) { res.writeHead(404); res.end(); return; }
      if (req.method === "POST" && parts[1] === "answer") {
        let body = "";
        req.on("data", (c) => { body += c; });
        req.on("end", () => {
          let parsed = {};
          try { parsed = JSON.parse(body); } catch { /* empty */ }
          res.writeHead(200, { "content-type": "application/json" });
          res.end("{}");
          done({ choice: parsed.choice ?? "", name: (parsed.name || "").trim(), note: (parsed.note || "").trim(), via: "preview" });
        });
        return;
      }
      if (req.method === "GET" && parts.length === 1) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(page);
        return;
      }
      if (req.method === "GET" && parts[1] === "files") {
        const target = resolve(ROOT, parts.slice(2).join("/"));
        if (!target.startsWith(ROOT + sep) || !existsSync(target)) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { "content-type": MIME[extname(target).toLowerCase()] ?? "application/octet-stream" });
        res.end(readFileSync(target));
        return;
      }
      res.writeHead(404); res.end();
    });
    server.listen(0, "127.0.0.1", async () => {
      const url = `http://127.0.0.1:${server.address().port}/${token}/`;
      openBrowser(url);
      const lines = [
        "",
        `[make-lp] チェックポイント: ${title}`,
        `[make-lp] ${question}`,
        `[make-lp] プレビューを開きました: ${url}`,
        ...choices.map((c, i) => `[make-lp]   ${i + 1}) ${c.label}`),
      ];
      let name = "";
      if (needName) {
        name = await askTerminal(lines, `[make-lp] 名前（記録用${defaultName ? `、Enter で「${defaultName}」` : ""}）: `);
        if (settled) return;
        name = name || defaultName;
        lines.length = 0;
      }
      const answer = await askTerminal(lines, `[make-lp] 番号を入力してください [1-${choices.length}]: `);
      if (settled) return;
      const idx = Number.parseInt(answer, 10) - 1;
      const picked = choices[idx] ?? choices[choices.length - 1];
      done({ choice: picked.id, name, note: "", via: "terminal" });
    });
  });
}

// ---------- artifact summaries for the checkpoints ----------
function factsSummary(outDir) {
  const facts = loadJson(join(outDir, "entry", "facts.json"));
  const result = loadJson(join(outDir, "run-result.json"));
  if (!facts || !Array.isArray(facts.items)) return { html: "<p>抽出結果の要約を作れませんでした。entry/facts.json を確認してください。</p>", text: [] };
  const stated = facts.items.filter((i) => i.status === "stated");
  const unstated = facts.items.filter((i) => i.status !== "stated");
  const fc = result?.stages?.factsComparison ?? {};
  const lines = [];
  if (fc.verbatim) lines.push(`引用の逐語照合: ${fc.verbatim.pass ? "pass" : "FAIL"}（${fc.verbatim.checked}件）`);
  lines.push(`記載あり: ${stated.length}件 / 未記載: ${unstated.length}件`);
  const rows = stated.map((i) => `<tr><th>${esc(i.key)}</th><td>${esc(i.value ?? i.normalized ?? "")}</td></tr>`).join("\n");
  const chips = unstated.map((i) => `<span class="chip">${esc(i.key)}</span>`).join(" ");
  const html = `${lines.map((l) => `<p>${esc(l)}</p>`).join("")}
<table>${rows}</table>
<p>未記載（未記載として残り、承認の対象に含まれません）: ${chips || "なし"}</p>`;
  return { html, text: lines };
}
function kvArtifact(outDir) {
  const pres = loadJson(join(outDir, "presentation-key-visual.json"));
  const first = pres?.presented?.[0];
  if (!first?.file) return "<p>1枚画の提示記録が見つかりませんでした。</p>";
  const anatomy = Array.isArray(pres.layout?.anatomy) ? `<p>構成: ${pres.layout.anatomy.map(esc).join(" / ")}</p>` : "";
  return `${anatomy}<img src="files/${esc(rel(first.file))}" alt="LPの完成イメージ（1枚画）">`;
}
function textArtifact(outDir) {
  const pres = loadJson(join(outDir, "presentation-text.json"));
  const file = pres?.presented?.[0]?.file;
  const gen = file ? loadJson(resolve(ROOT, file)) : null;
  const sentences = [];
  const collect = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { for (const n of node) collect(n); return; }
    if (typeof node.text === "string" && (node.id || node.appealId || node.key)) sentences.push(node.text);
    for (const v of Object.values(node)) collect(v);
  };
  collect(gen?.sentences ?? gen);
  if (sentences.length) return sentences.map((s) => `<p>${esc(s)}</p>`).join("\n");
  return `<pre>${esc(gen ? JSON.stringify(gen, null, 1).slice(0, 6000) : "生成文の提示記録が見つかりませんでした。")}</pre>`;
}
function planningArtifact(outDir) {
  const pres = loadJson(join(outDir, "presentation-planning.json"));
  const file = pres?.presented?.[0]?.file;
  const planning = file ? loadJson(resolve(ROOT, file)) : null;
  if (!planning) return "<p>企画の提示記録が見つかりませんでした。</p>";
  const appeals = Array.isArray(planning.appeals) ? planning.appeals : [];
  const rows = appeals.map((a) => `<tr><th>${esc(a.id ?? "")}</th><td>${esc(a.statement ?? a.text ?? a.appeal ?? "")}</td></tr>`).join("\n");
  return `<p>対象: ${esc(planning.audience ?? planning.target ?? "")}</p>
<p>最初に確認する条件（firstCheckKeys）: ${(planning.firstCheckKeys ?? []).map(esc).join(", ")}</p>
<table>${rows}</table>`;
}

// ---------- records the wrapper writes from the human's answers ----------
function writeApproval(outDir, name, via) {
  const originalFile = join(outDir, "entry", "original.json");
  const factsFile = join(outDir, "entry", "facts.json");
  const original = loadJson(originalFile);
  const facts = loadJson(factsFile);
  const result = loadJson(join(outDir, "run-result.json"));
  const fc = result?.stages?.factsComparison ?? {};
  const unstated = (facts?.items ?? []).filter((i) => i.status !== "stated").map((i) => i.key);
  const approvalFile = join(outDir, "entry", "approval.json");
  let n = 1;
  if (existsSync(approvalFile)) { const prev = loadJson(approvalFile); const m = /-(\d+)$/.exec(prev?.approvalId ?? ""); n = (m ? Number(m[1]) : 1) + 1; }
  const approval = {
    approvalId: `${original?.id ?? "posting"}-approval-${n}`,
    status: "approved",
    approver: name,
    approvedAt: nowIso(),
    target: {
      original: { id: original?.id ?? null, version: original?.version ?? "v1", file: relRoot(originalFile), sha256: sha256File(resolve(ROOT, originalFile)) },
      facts: { factsId: facts?.factsId ?? null, factsVersion: facts?.factsVersion ?? 1, file: relRoot(factsFile), sha256: sha256File(resolve(ROOT, factsFile)) },
    },
    basis: {
      reconciliation: fc.mode ? "entry mode の照合（run-result.json の factsComparison）" : "run-result.json の照合記録",
      verbatimCheck: fc.verbatim ? `${fc.verbatim.pass ? "pass" : "fail"}（${fc.verbatim.checked}件）` : "記録なし",
      answeredVia: via === "preview" ? "チェックポイントのプレビューで本人が選択" : via === "answer" ? "チェックポイントの質問への本人の回答（操作セッション経由で受け渡し）" : "ターミナルで本人が選択",
    },
    scope: {
      covers: "stated 項目のみ",
      unstatedItems: unstated,
      unstatedNote: "未記載は未記載として表示に残し、承認の対象に含めない",
      effect: "生成の入力として使用できること。再検証の合格は公開許可ではない",
    },
    validity: { rule: "原本または FACT の sha256 が本記録と異なれば無効とし、照合からやり直す", invalidated: false, invalidatedReason: null },
  };
  writeFileSync(approvalFile, JSON.stringify(approval, null, 2) + "\n");
  return approval;
}
function writeKvConfirmation(outDir, name, via) {
  const pres = loadJson(join(outDir, "presentation-key-visual.json"));
  const first = pres?.presented?.[0];
  if (!first?.file) return null;
  const conf = {
    file: first.file,
    sha256: first.sha256,
    confirmer: name,
    confirmedAt: nowIso(),
    note: via === "preview" ? "チェックポイントのプレビューで本人が確認" : via === "answer" ? "チェックポイントの質問への本人の回答（操作セッション経由で受け渡し）" : "ターミナルで本人が確認",
  };
  const file = join(outDir, "kv-confirmation.json");
  writeFileSync(file, JSON.stringify(conf, null, 2) + "\n");
  return relRoot(file);
}
function writeJudgement(outDir, presentationFile, result, name, note) {
  const file = join(outDir, presentationFile);
  const pres = loadJson(file);
  if (!pres) return;
  pres.judgement = {
    result,
    confirmer: name || null,
    confirmedAt: nowIso(),
    corrections: note ? [note] : [],
  };
  writeFileSync(file, JSON.stringify(pres, null, 2) + "\n");
}

// ---------- checkpoints: one definition for both modes ----------
// Returns the pending human checkpoint for a run result, or null
// when the run stopped at a gate (or has no result yet). The
// choices are the same ones the interactive preview offers.
function pendingCheckpoint(r, absOut) {
  if (!r) return null;
  if (r.status === "complete" || r.status === "pending-human-confirmation") {
    if (loadJson(join(absOut, "presentation-lp.json"))?.judgement) return null;
    return {
      id: "lp", title: "LPの確認",
      question: "組み上がったLPです。内容を確認してください。",
      artifact: `LP: ${r.lpFile ?? "lp.html（run-result.json 参照）"}`,
      choices: [
        { id: "confirm", label: "公開品質として確認する" },
        { id: "close", label: "記録だけして閉じる" },
      ],
    };
  }
  if (r.stoppedAt === "approval") {
    const facts = loadJson(join(absOut, "entry", "facts.json"));
    const items = (facts?.items ?? []).map((i) => `  - ${i.key}: ${i.status === "stated" ? (i.value ?? i.normalized ?? "") : "（未記載）"}`);
    return {
      id: "approval", title: "事実の承認",
      question: "求人票から抽出した事実です。原本と一致しているか確認してください。",
      artifact: ["抽出された事実（entry/facts.json）:", ...items].join("\n"),
      choices: [
        { id: "approve", label: "承認して進める" },
        { id: "stop", label: "止める" },
      ],
    };
  }
  if (r.stoppedAt === "key-visual" || r.stoppedAt === "key-visual-confirmation") {
    const pres = loadJson(join(absOut, "presentation-key-visual.json"));
    const first = pres?.presented?.[0];
    return {
      id: "key-visual", title: "1枚画の確認",
      question: "LPの完成イメージ（1枚画）です。このイメージで進めていいですか。",
      artifact: `1枚画: ${first?.file ?? "presentation-key-visual.json を参照"}`,
      choices: [
        { id: "confirm", label: "この1枚画で進める" },
        { id: "stop", label: "止める" },
      ],
    };
  }
  if (r.stoppedAt === "text-checkpoint" || r.stoppedAt === "planning") {
    const isPlanning = r.stoppedAt === "planning";
    return {
      id: isPlanning ? "planning" : "text", title: isPlanning ? "企画の確認" : "文章の確認",
      question: isPlanning ? "企画です。この企画で制作を進めていいですか。" : "生成された文章です。この文章で進めていいですか。",
      artifact: isPlanning ? "企画: presentation-planning.json を参照" : "文章: presentation-text.json を参照",
      choices: [
        { id: "proceed", label: isPlanning ? "この企画で進める" : "この文章で進める" },
        { id: "stop", label: "止める" },
      ],
    };
  }
  return null;
}

// Print the checkpoint as a package the operator can present in a
// chat: the artifact, the question, the selectable choices, and
// the exact command that carries the principal's answer back.
function printCheckpointPackage(absOut, outDir, r) {
  const cp = pendingCheckpoint(r, absOut);
  if (!cp) return false;
  console.log(`\n[make-lp] CHECKPOINT ${cp.id}: ${cp.title}`);
  console.log(`[make-lp] ${cp.question}`);
  console.log(`[make-lp] --- artifact ---\n${cp.artifact}\n[make-lp] --- choices ---`);
  cp.choices.forEach((c, i) => console.log(`[make-lp]   ${i + 1}) ${c.id} — ${c.label}`));
  console.log(`[make-lp] answer with: node make-lp.mjs --resume ${outDir} --answer <choiceId> [--name "..."] [--note "..."]`);
  return true;
}

// run-demo expects the key-visual confirmation file on every
// resume after the key visual has been confirmed; once the
// wrapper has written it, it supplies it automatically.
function kvExtra(absOut) {
  const f = join(absOut, "kv-confirmation.json");
  return existsSync(f) ? ["--kv-confirmation", relRoot(f)] : [];
}

// Apply the principal's answer to the pending checkpoint: write
// the record of that answer (the same records the interactive
// flow writes) and resume. Returns a process exit code. An answer
// is never invented here — without one this is not called.
function applyAnswer(absOut, outDir, savedDraft, answer) {
  const r = loadJson(join(absOut, "run-result.json"));
  const cp = pendingCheckpoint(r, absOut);
  if (!cp) { console.log("[make-lp] no human checkpoint is pending (the run stopped at a gate, or has not run). The answer was not used."); return 1; }
  const picked = cp.choices.find((c) => c.id === answer.choice);
  if (!picked) { console.log(`[make-lp] unknown choice "${answer.choice}" for checkpoint ${cp.id}. Valid: ${cp.choices.map((c) => c.id).join(", ")}`); return 2; }
  const resume = (extra = []) => ["src/run-demo.mjs", "--resume", join(outDir, "run-state.json"), ...(savedDraft ?? []), ...kvExtra(absOut), ...extra];
  const name = answer.name || operatorName() || "";
  const positive = { approval: "approve", "key-visual": "confirm", planning: "proceed", text: "proceed", lp: "confirm" }[cp.id];
  // A name is part of the approval / key-visual / LP records (the
  // pipeline validates it); planning and text judgements allow an
  // empty confirmer, as in the interactive flow.
  if (answer.choice === positive && !name && cp.id !== "text" && cp.id !== "planning") {
    console.log("[make-lp] a name is required to write the record. Pass --name \"...\" with the answer.");
    return 2;
  }
  if (name) saveOperatorName(name);

  if (cp.id === "approval") {
    if (answer.choice !== "approve") { console.log("[make-lp] 回答は「止める」のため、記録を作らずここで止まります（停止は結果です）。"); return 1; }
    const approval = writeApproval(absOut, name, "answer");
    console.log(`[make-lp] 承認記録を作りました: ${approval.approvalId}（${name}）`);
    return runPipeline(resume());
  }
  if (cp.id === "key-visual") {
    if (answer.choice !== "confirm") { console.log("[make-lp] 回答は「止める」のため、記録を作らずここで止まります（停止は結果です）。"); return 1; }
    const confFile = writeKvConfirmation(absOut, name, "answer");
    if (!confFile) { console.log("[make-lp] 提示記録がないため確認記録を作れませんでした。"); return 1; }
    console.log(`[make-lp] 確認記録を作りました: ${confFile}`);
    return runPipeline(resume(["--kv-confirmation", confFile]));
  }
  if (cp.id === "planning" || cp.id === "text") {
    writeJudgement(absOut, cp.id === "planning" ? "presentation-planning.json" : "presentation-text.json",
      answer.choice === "proceed" ? "confirmed" : "stopped", name, answer.note ?? "");
    if (answer.choice !== "proceed") { console.log("[make-lp] 回答は「止める」のため、ここで止まります（停止は結果です）。"); return 1; }
    return runPipeline(resume());
  }
  // lp
  writeJudgement(absOut, "presentation-lp.json", answer.choice === "confirm" ? "confirmed" : "closed", name, answer.note ?? "");
  console.log(`[make-lp] done. LP: ${r.lpFile ?? join(outDir, "lp.html")}（確認の記録を presentation-lp.json に残しました）`);
  return 0;
}

// ---------- report for the non-interactive path ----------
function report(outDir) {
  const absOut = resolve(ROOT, outDir);
  const r = loadJson(join(absOut, "run-result.json"));
  if (!r) return;
  console.log(`\n[make-lp] status: ${r.status}${r.stoppedAt ? ` (stopped at: ${r.stoppedAt})` : ""}`);
  if (r.stopReason) console.log(`[make-lp] reason: ${r.stopReason}`);
  if (r.status === "complete" || r.status === "pending-human-confirmation") {
    if (!printCheckpointPackage(absOut, outDir, r)) console.log(`[make-lp] done. LP: ${r.lpFile ?? join(outDir, "lp.html")}`);
    return;
  }
  if (printCheckpointPackage(absOut, outDir, r)) return;
  if (r.stoppedAt) console.log("[make-lp] the pipeline stopped at a gate. Report this stop as the result; do not work around it by hand.");
}

// ---------- drive: run; in a terminal, answer checkpoints in the flow ----------
function runPipeline(cliArgs) {
  const r = spawnSync("node", cliArgs, { cwd: ROOT, stdio: "inherit", env: process.env });
  return r.status ?? 1;
}

async function drive(outDir, firstCli, savedDraft) {
  let status = runPipeline(firstCli);
  for (let i = 0; i < 12; i++) {
    const absOut = resolve(ROOT, outDir);
    const r = loadJson(join(absOut, "run-result.json"));
    if (!r) return status;
    if (!INTERACTIVE) { report(absOut); return status; }
    const resume = (extra = []) => ["src/run-demo.mjs", "--resume", join(outDir, "run-state.json"), ...(savedDraft ?? []), ...kvExtra(absOut), ...extra];

    if (r.status === "complete" || r.status === "pending-human-confirmation") {
      const lpRel = r.lpFile ?? join(outDir, "lp.html");
      const answer = await askCheckpoint({
        title: "LPの確認",
        question: "組み上がったLPです。内容を確認してください。",
        artifactHtml: `<iframe src="files/${esc(rel(lpRel))}" title="完成したLP"></iframe>`,
        choices: [
          { id: "confirm", label: "公開品質として確認する" },
          { id: "close", label: "記録だけして閉じる" },
        ],
        needName: true,
      });
      const name = answer.name || operatorName() || "";
      if (name) saveOperatorName(name);
      writeJudgement(absOut, "presentation-lp.json", answer.choice === "confirm" ? "confirmed" : "closed", name, answer.note);
      console.log(`[make-lp] done. LP: ${lpRel}（確認の記録を presentation-lp.json に残しました）`);
      return 0;
    }

    if (r.stoppedAt === "approval") {
      const summary = factsSummary(absOut);
      for (const line of summary.text) console.log(`[make-lp] ${line}`);
      const answer = await askCheckpoint({
        title: "事実の承認",
        question: "求人票から抽出した事実です。原本と一致しているか確認してください。",
        artifactHtml: summary.html,
        choices: [
          { id: "approve", label: "承認して進める" },
          { id: "stop", label: "止める" },
        ],
        needName: true,
      });
      if (answer.choice !== "approve") { console.log("[make-lp] 承認されなかったため、ここで止まります（停止は結果です）。"); return status; }
      const name = answer.name || operatorName() || "";
      if (!name) { console.log("[make-lp] 名前が分からないため承認記録を作れませんでした。"); return status; }
      saveOperatorName(name);
      const approval = writeApproval(absOut, name, answer.via);
      console.log(`[make-lp] 承認記録を作りました: ${approval.approvalId}（${name}）`);
      status = runPipeline(resume());
      continue;
    }

    if (r.stoppedAt === "key-visual" || r.stoppedAt === "key-visual-confirmation") {
      const answer = await askCheckpoint({
        title: "1枚画の確認",
        question: "LPの完成イメージ（1枚画）です。このイメージで進めていいですか。",
        artifactHtml: kvArtifact(absOut),
        choices: [
          { id: "confirm", label: "この1枚画で進める" },
          { id: "stop", label: "止める" },
        ],
        needName: true,
      });
      if (answer.choice !== "confirm") { console.log("[make-lp] 確認されなかったため、ここで止まります（停止は結果です）。"); return status; }
      const name = answer.name || operatorName() || "";
      if (!name) { console.log("[make-lp] 名前が分からないため確認記録を作れませんでした。"); return status; }
      saveOperatorName(name);
      const confFile = writeKvConfirmation(absOut, name, answer.via);
      if (!confFile) { console.log("[make-lp] 提示記録がないため確認記録を作れませんでした。"); return status; }
      console.log(`[make-lp] 確認記録を作りました: ${confFile}`);
      status = runPipeline(resume(["--kv-confirmation", confFile]));
      continue;
    }

    if (r.stoppedAt === "text-checkpoint" || r.stoppedAt === "planning") {
      const isPlanning = r.stoppedAt === "planning";
      const answer = await askCheckpoint({
        title: isPlanning ? "企画の確認" : "文章の確認",
        question: isPlanning ? "企画です。この企画で制作を進めていいですか。" : "生成された文章です。この文章で進めていいですか。",
        artifactHtml: isPlanning ? planningArtifact(absOut) : textArtifact(absOut),
        choices: [
          { id: "proceed", label: isPlanning ? "この企画で進める" : "この文章で進める" },
          { id: "stop", label: "止める" },
        ],
        needName: true,
      });
      const name = answer.name || operatorName() || "";
      if (name) saveOperatorName(name);
      writeJudgement(absOut, isPlanning ? "presentation-planning.json" : "presentation-text.json",
        answer.choice === "proceed" ? "confirmed" : "stopped", name, answer.note);
      if (answer.choice !== "proceed") { console.log("[make-lp] ここで止まります（停止は結果です）。"); return status; }
      status = runPipeline(resume());
      continue;
    }

    report(absOut);
    return status;
  }
  console.log("[make-lp] チェックポイントの往復が上限に達したため止まります。");
  return status;
}

// ---------- entry ----------
if (args.includes("--help") || args.length === 0) { usage(); process.exit(args.length === 0 ? 2 : 0); }

if (args[0] === "--resume") {
  const outDir = args[1];
  if (!outDir || !existsSync(join(ROOT, outDir, "run-state.json"))) fail(`no run-state.json under ${outDir ?? "(missing)"}`);
  const saved = loadJson(join(ROOT, outDir, "make-lp-args.json")) ?? { draft: [] };
  const answerChoice = argValue("--answer");
  if (answerChoice) {
    // The principal's answer to the pending checkpoint, carried by
    // whoever operates this session. Apply it to the current state
    // first (the wrapper writes the record), then report where the
    // run now stands — the next checkpoint package or the result.
    const code = applyAnswer(resolve(ROOT, outDir), outDir, saved.draft ?? [],
      { choice: answerChoice, name: argValue("--name") ?? "", note: argValue("--note") ?? "" });
    if (code === 0 || code === 1) report(outDir);
    process.exit(code);
  }
  const cli = ["src/run-demo.mjs", "--resume", join(outDir, "run-state.json"), ...(saved.draft ?? [])];
  const kv = argValue("--kv-confirmation");
  if (kv) cli.push("--kv-confirmation", kv);
  process.exit(await drive(outDir, cli, saved.draft ?? []));
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
process.exit(await drive(outDir, cli, draft));
