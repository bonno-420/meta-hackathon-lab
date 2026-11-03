// Reproducible checks for src/generate-images.mjs (full-pipeline step).
// Run: node src/generate-images.test.mjs [--out <path>]
// The API caller is stubbed: this test never calls the real API and
// costs nothing. Exits non-zero on any failure.
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMAGE_COST_USD_PER_IMAGE, IMAGE_MODEL, decideImagePlan, runImageGeneration } from "./generate-images.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const outPath = outIdx >= 0 ? argv[outIdx + 1] : null;

const results = [];
function expect(id, actual, wanted) {
  results.push({ id, pass: actual === wanted, expected: wanted, actual });
}
const clone = (o) => JSON.parse(JSON.stringify(o));

const generation = JSON.parse(readFileSync(path.join(root, "loops/loop-008/generated-lp-v1.json"), "utf8"));
const facts = JSON.parse(readFileSync(path.join(root, "src/facts/FICT-J01-facts-v1.json"), "utf8"));

// --- Plan: hero plus one image per cited line with stated content.
// Unstated-only lines (L06) get no image. ---
const plan = decideImagePlan({ generation, facts });
expect("images-plan-model", IMAGE_MODEL, "muse-image-1.0");
expect("images-plan-hero-first", plan.images[0].id, "hero");
const sectionIds = plan.images.slice(1).map((i) => i.id);
expect("images-plan-sections", JSON.stringify(sectionIds), JSON.stringify(["sec-L01", "sec-L02", "sec-L03", "sec-L04", "sec-L05"]));
expect("images-plan-no-unstated-line", sectionIds.some((id) => id === "sec-L06"), false);
expect("images-plan-prompts-no-baked-text", plan.images.every((i) => !/1,500|10,000|09:00|18:00/.test(i.prompt)), true);
expect("images-plan-cost-rate", IMAGE_COST_USD_PER_IMAGE, 0.01);

// --- Generation (stubbed): files are written, record carries count ×
// $0.01. ---
const stubBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
let stubCalls = 0;
const stubCall = async () => { stubCalls += 1; return { buffer: stubBytes, mime: "image/png" }; };
const scratch = mkdtempSync(path.join(tmpdir(), "generate-images-test-"));
const run = await runImageGeneration({ plan, root: scratch, imagesDir: "images", callImage: stubCall });
expect("images-run-generated", run.status, "generated");
expect("images-run-calls-match-plan", stubCalls, plan.images.length);
expect("images-run-files-exist", run.images.every((i) => existsSync(path.join(scratch, i.file))), true);
expect("images-run-cost", run.costUsd, plan.images.length * IMAGE_COST_USD_PER_IMAGE);
expect("images-run-model", run.model, "muse-image-1.0");

// --- Generation (stubbed failure): failed record, cost 0, never
// treated as success. ---
const failRun = await runImageGeneration({
  plan,
  root: scratch,
  imagesDir: "images-fail",
  callImage: async () => { throw new Error("API down"); },
});
expect("images-run-failed", failRun.status, "failed");
expect("images-run-failed-cost-zero", failRun.costUsd, 0);
expect("images-run-failed-reason", typeof failRun.reason, "string");

const pass = results.every((r) => r.pass);
const record = {
  testFile: "src/generate-images.test.mjs",
  target: "src/generate-images.mjs",
  pass,
  results,
  note: "画像生成のケースはモデル呼び出しをスタブ化しており、実 API は呼んでいない。実生成はテストと分けて1回だけ実行し、loop 記録に残す。",
  runAt: new Date().toISOString(),
};
console.log(JSON.stringify(record, null, 2));
if (outPath) writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf8");
if (!pass) process.exitCode = 1;
