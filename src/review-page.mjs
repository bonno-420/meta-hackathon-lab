// Review runner (child process): judges the assembled LP with the
// reader-persona / client review (src/review.mjs) on the text
// endpoint, the same call pattern as generation. A completed review
// exits 0 whether the verdict is pass or fail — fail is a result.
// Execution failures (no key, HTTP error, unparseable output) exit
// non-zero and are recorded as such by the caller.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL, BASE_URL, MAX_TOKENS, callModelLive } from "./generate.mjs";
import { REVIEW_PROMPT_VERSION, buildReviewMessages, buildPlanningReviewMessages, buildCopyReviewMessages, buildSampleReviewMessages, pageOutlineFromHtml, parseReview } from "./review.mjs";

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}


async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "..");
  const argv = process.argv.slice(2);
  const mode = argValue(argv, "--mode") ?? "page";
  const planningFile = argValue(argv, "--planning");
  const lpFile = argValue(argv, "--lp");
  const generationFile = argValue(argv, "--generation");
  const outlineFile = argValue(argv, "--outline");
  const imagePlanFile = argValue(argv, "--image-plan");
  const out = argValue(argv, "--out");
  const runOut = argValue(argv, "--run-out");
  if (!planningFile || (mode === "page" && !lpFile) || (mode === "copy" && !generationFile) || (mode === "sample" && !outlineFile)) {
    console.error("usage: review-page.mjs --mode planning|copy|sample|page --planning <f> [--lp <lp.html>] [--generation <f>] [--outline <f>] [--image-plan <f>] [--out <review.json>] [--run-out <run.json>]");
    process.exitCode = 2;
    return;
  }
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  if (!process.env.MODEL_API_KEY) {
    const record = { status: "blocked", reason: "MODEL_API_KEY is not set in the environment. Live model call was not attempted.", apiCalled: false };
    console.log(JSON.stringify(record, null, 2));
    if (runOut) { mkdirSync(path.dirname(path.join(root, runOut)), { recursive: true }); writeFileSync(path.join(root, runOut), JSON.stringify(record, null, 2), "utf8"); }
    process.exitCode = 1;
    return;
  }
  const planning = JSON.parse(readFileSync(path.join(root, planningFile), "utf8"));
  let outline = [];
  let messages;
  if (mode === "planning") {
    messages = buildPlanningReviewMessages({ planning });
  } else if (mode === "copy") {
    const generation = JSON.parse(readFileSync(path.join(root, generationFile), "utf8"));
    outline = (generation.sentences ?? []).map((s, i) => ({ kind: "sentence", text: s.text ?? "", chips: [], images: [] }));
    messages = buildCopyReviewMessages({ planning, generation });
  } else if (mode === "sample") {
    const raw = JSON.parse(readFileSync(path.join(root, outlineFile), "utf8"));
    outline = Array.isArray(raw) ? raw : (raw.blocks ?? []);
    messages = buildSampleReviewMessages({ planning, outline });
  } else {
    const html = readFileSync(path.join(root, lpFile), "utf8");
    const descriptions = {};
    if (imagePlanFile && existsSync(path.join(root, imagePlanFile))) {
      try {
        const plan = JSON.parse(readFileSync(path.join(root, imagePlanFile), "utf8"));
        for (const img of plan.images ?? []) {
          if (img?.file && img?.prompt) descriptions[path.basename(img.file)] = img.prompt;
        }
      } catch { /* descriptions stay empty; the outline still carries the page text */ }
    }
    outline = pageOutlineFromHtml(html, descriptions);
    messages = buildReviewMessages({ planning, outline });
  }
  const res = await callModelLive(messages);
  const review = parseReview(res.content);
  const durationMs = Math.round(performance.now() - t0);
  if (!review) {
    const record = { status: "parse-error", reason: "review output could not be parsed as the verdict schema", apiCalled: true, model: res.model ?? MODEL, promptVersion: REVIEW_PROMPT_VERSION, startedAt, durationMs, usage: res.usage ?? null, raw: String(res.content).slice(0, 2000) };
    console.log(JSON.stringify(record, null, 2));
    if (runOut) { mkdirSync(path.dirname(path.join(root, runOut)), { recursive: true }); writeFileSync(path.join(root, runOut), JSON.stringify(record, null, 2), "utf8"); }
    process.exitCode = 1;
    return;
  }
  const record = {
    status: "reviewed",
    mode,
    verdict: review.verdict,
    findings: review.findings,
    apiCalled: true,
    model: res.model ?? MODEL,
    requestedModel: MODEL,
    promptVersion: REVIEW_PROMPT_VERSION,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs,
    usage: res.usage ?? null,
    costUsd: null,
    costNote: "算出値は未記録（レビューの単価計算は生成と別に突合が必要）",
    outlineBlocks: outline.length,
  };
  if (out) {
    mkdirSync(path.dirname(path.join(root, out)), { recursive: true });
    writeFileSync(path.join(root, out), JSON.stringify({ verdict: review.verdict, findings: review.findings, outline }, null, 2), "utf8");
  }
  if (runOut) {
    mkdirSync(path.dirname(path.join(root, runOut)), { recursive: true });
    writeFileSync(path.join(root, runOut), JSON.stringify(record, null, 2), "utf8");
  }
  console.log(JSON.stringify(record, null, 2));
}

await main();
