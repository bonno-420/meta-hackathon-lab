// Step 5 (typed image generation): generate section images for the LP
// from the approved generation record. Fictional data only.
//
// The plan (which images) is derived from the generation record alone:
// hero plus one image per cited source line that carries stated FACT
// content. Unstated-only lines get no image. Prompts never bake text or
// numbers into the image. Image meaning is out of scope: files are
// checked for existence and reference only (see checkCompletion in
// run-demo.mjs). API key is read only from env MODEL_API_KEY and never
// logged.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ILLUSTRATION_STYLE } from "./image-design.mjs";

export const IMAGE_MODEL = "muse-image-1.0";
export const IMAGE_API_URL = "https://api.meta.ai/v1/images/generations";
export const IMAGE_SIZE = "1024x1024";
// D? rate for muse-image-1.0: flat per-image handling per design
// (loop-015/016 practice). Recorded as a calculated value.
export const IMAGE_COST_USD_PER_IMAGE = 0.01;
export const IMAGE_PROMPT_TEMPLATE = "lp-image-v1";

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

// Decide the image plan from the generation record and the fixed FACTs.
// Returns { images: [{ id, prompt, line }] }. File names are assigned
// at generation time from the returned mime type. No new specifics are
// invented: section labels come from the FACT keys on each cited line.
export function decideImagePlan({ generation, facts }) {
  const sentences = generation && Array.isArray(generation.sentences) ? generation.sentences : [];
  const citedLines = [];
  for (const s of sentences) {
    const lines = s && Array.isArray(s.sourceLines) ? s.sourceLines : [];
    for (const l of lines) {
      if (!citedLines.includes(l)) citedLines.push(l);
    }
  }
  const itemsByLine = new Map();
  for (const i of (facts && Array.isArray(facts.items) ? facts.items : [])) {
    if (!itemsByLine.has(i.sourceLine)) itemsByLine.set(i.sourceLine, []);
    itemsByLine.get(i.sourceLine).push(i);
  }
  const images = [
    {
      id: "hero",
      line: null,
      prompt: "Clean flat vector-style illustration of a fictional workplace building exterior in daytime, calm neutral palette, no people, no text, no numbers, no logos, no watermark",
    },
  ];
  for (const line of citedLines) {
    const items = itemsByLine.get(line) ?? [];
    const statedKeys = items.filter((i) => i.status === "stated").map((i) => i.key);
    if (statedKeys.length === 0) continue;
    images.push({
      id: `sec-${line}`,
      line,
      prompt: `Simple flat illustration supporting a fictional job-posting section about ${statedKeys.join(", ")}, abstract workplace motif, no people close-ups, no text, no numbers, no logos, no watermark`,
    });
  }
  return { images };
}

// Decide the image plan from the planning correspondence (fix F4):
// one image per correspondence element except the key visual, which
// is generated earlier at its own checkpoint. Prompts come from
// src/planning.mjs (built only from correspondence elements), never
// from the hardcoded templates above; decideImagePlan stays for the
// pinned demo path only.
export function decideImagePlanFromSpecs({ correspondence }) {
  const elements = correspondence && Array.isArray(correspondence.elements) ? correspondence.elements : [];
  const images = [];
  for (const el of elements) {
    images.push({
      // The key-visual spec's photograph becomes the LP hero (a real
      // image, generated here in the images stage). The finished image
      // itself is a preview artifact and is never assembled.
      id: el.role === "key-visual" ? "hero" : el.id,
      line: null,
      role: el.role,
      prompt: el.role === "key-visual"
        ? `${el.description}, ${correspondence.style ?? "photorealistic"}, no text, no numbers, no logos, no watermark`
        : `${el.description}, ${ILLUSTRATION_STYLE}, no text, no numbers, no logos, no watermark`,
    });
  }
  return { images };
}

// Run the image generation for a decided plan. callImage(prompt) is
// injected so tests can stub the API; it must resolve to
// { buffer: Buffer, mime: string }. imagesDir is repository-relative;
// files are written under root/imagesDir and recorded with that same
// relative path. Returns the run record. On any failure the record is
// failed and the run is stopped downstream; partial files are left as-is
// and reported.
export async function runImageGeneration({ plan, root, imagesDir, callImage }) {
  const startedAt = new Date().toISOString();
  const images = Array.isArray(plan?.images) ? plan.images : [];
  const produced = [];
  try {
    mkdirSync(path.join(root, imagesDir), { recursive: true });
    for (const spec of images) {
      const res = await callImage(spec.prompt);
      const buffer = res && res.buffer ? Buffer.from(res.buffer) : null;
      if (!buffer || buffer.length === 0) {
        throw new Error(`image ${spec.id} returned no bytes`);
      }
      const mime = res.mime ?? "image/png";
      const ext = mime === "image/webp" ? "webp" : "png";
      const fileName = `${spec.id}.${ext}`;
      writeFileSync(path.join(root, imagesDir, fileName), buffer);
      produced.push({ id: spec.id, file: `${String(imagesDir).split(path.sep).join("/")}/${fileName}`, prompt: spec.prompt, line: spec.line ?? null, mime, bytes: buffer.length });
    }
  } catch (e) {
    return {
      status: "failed",
      reason: String(e && e.message ? e.message : e),
      model: IMAGE_MODEL,
      promptTemplate: IMAGE_PROMPT_TEMPLATE,
      images: produced,
      usage: null,
      costUsd: 0,
      costNote: "未記録（画像生成が失敗したため推定しない）",
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }
  const costUsd = produced.length * IMAGE_COST_USD_PER_IMAGE;
  return {
    status: "generated",
    reason: null,
    model: IMAGE_MODEL,
    promptTemplate: IMAGE_PROMPT_TEMPLATE,
    images: produced,
    usage: null,
    costUsd,
    costNote: `画像 ${produced.length} 枚 × $${IMAGE_COST_USD_PER_IMAGE} の算出値。確定実費は dev.meta.ai Billing 実績との突合が必要。`,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

// Live API caller: single request, no retry (the existing tools' style).
async function callImageLive(prompt) {
  const apiKey = process.env.MODEL_API_KEY;
  const res = await fetch(IMAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1, size: IMAGE_SIZE }),
  });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }
  if (!res.ok || !body) {
    const err = new Error(`Meta Model API error: HTTP ${res.status}`);
    err.httpStatus = res.status;
    err.errorBody = body ? JSON.stringify(body).slice(0, 2000) : text.slice(0, 2000);
    throw err;
  }
  const b64 = body?.data?.[0]?.b64_json ?? null;
  if (!b64) {
    throw new Error(`image API returned no b64_json: ${JSON.stringify(body).slice(0, 500)}`);
  }
  const mime = b64.startsWith("UklG") ? "image/webp" : "image/png";
  return { buffer: Buffer.from(b64, "base64"), mime };
}

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "..");
  const argv = process.argv.slice(2);
  const generationFile = argValue(argv, "--generation");
  const factsFile = argValue(argv, "--facts");
  const planFile = argValue(argv, "--plan-file");
  const outDir = argValue(argv, "--out-dir");
  const runOut = argValue(argv, "--run-out");
  if ((!planFile && (!generationFile || !factsFile)) || !outDir) {
    console.error("usage: generate-images.mjs (--generation <f> --facts <f> | --plan-file <plan.json>) --out-dir <imagesDir> [--run-out <run.json>]");
    process.exitCode = 2;
    return;
  }
  if (!process.env.MODEL_API_KEY) {
    console.log(JSON.stringify({ status: "blocked", reason: "MODEL_API_KEY is not set in the environment. Live Meta Model API call was not attempted.", apiCalled: false }, null, 2));
    process.exitCode = 2;
    return;
  }
  // --plan-file mode (fix F3/F4): the runner computed the prompts from
  // the planning correspondence and recorded them in a plan file; this
  // tool only executes the plan.
  const plan = planFile
    ? loadJson(path.join(root, planFile))
    : decideImagePlan({ generation: loadJson(path.join(root, generationFile)), facts: loadJson(path.join(root, factsFile)) });
  const imagesDir = outDir;
  let result;
  try {
    result = await runImageGeneration({ plan, root, imagesDir, callImage: callImageLive });
  } catch (err) {
    console.log(JSON.stringify({ status: "api-error", httpStatus: err.httpStatus ?? null, errorBody: err.errorBody ?? String(err && err.message ? err.message : err) }, null, 2));
    process.exitCode = 1;
    return;
  }
  if (runOut) {
    const runOutAbs = path.isAbsolute(runOut) ? runOut : path.join(root, runOut);
    mkdirSync(path.dirname(runOutAbs), { recursive: true });
    const { ...record } = result;
    writeFileSync(runOutAbs, JSON.stringify(record, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify({ status: result.status, reason: result.reason ?? null, images: result.images.map((i) => i.file), costUsd: result.costUsd }, null, 2));
  if (result.status !== "generated") process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
