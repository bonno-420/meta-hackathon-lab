// Checks for the pipeline fix (F1–F10): text entry, planning input,
// key-visual checkpoint and resume, spec-driven images, hero chips,
// C5 page quality, retries and holds, grounding generalization, and
// the feedback-memo input. All API-calling stages are stubbed; this
// test never calls the real API and costs nothing.
// Run: node src/pipeline-fix.test.mjs
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApprovalDraft } from "./approve.mjs";
import { checkQuoteVerbatim } from "./extract-and-check.mjs";
import { fixtureFacts } from "./extract-and-check.mjs";
import { checkGrounding, runGeneration } from "./generate.mjs";
import { runPlanningGeneration } from "./generate-planning.mjs";
import { decideImagePlanFromSpecs } from "./generate-images.mjs";
import { buildCorrespondence, buildImagePrompt, checkPromptCompliance, intentFromPlanning, validatePlanning } from "./planning.mjs";
import { checkPage } from "./pagecheck.mjs";
import { checkCompletion, runDemo } from "./run-demo.mjs";
import { buildFinishedImageHtml } from "./page-layout.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const results = [];
function expect(id, actual, wanted) {
  results.push({ id, pass: actual === wanted, expected: wanted, actual });
}
function expectTrue(id, actual) {
  results.push({ id, pass: actual === true, expected: true, actual });
}

const clone = (o) => JSON.parse(JSON.stringify(o));
const facts = JSON.parse(readFileSync(path.join(root, "src/facts/FICT-J01-facts-v1.json"), "utf8"));
const original = JSON.parse(readFileSync(path.join(root, "src/fict-j01-v1.json"), "utf8"));

// ---------- planning.mjs units ----------
const planning = {
  audience: "3か月の区切りで働くことを検討している人",
  appeals: [
    { id: "A1", text: "時給1,500円が明示されている", factKeys: ["salaryHourly"], sourceLines: ["L03"] },
    { id: "A2", text: "勤務時間の形が合う", factKeys: ["workHours"], sourceLines: ["L04"] },
  ],
  notSay: [{ key: "housing", text: "寮には触れない", terms: ["寮", "住宅"] }],
  imageSpecs: [
    { id: "kv", role: "key-visual", basis: { factKey: "workLocation" }, description: "A fictional research facility building exterior in daytime, people walking in" },
    { id: "work", role: "work", basis: { appealId: "A2" }, description: "Workers assembling small wheels at a bright workbench" },
  ],
  firstCheckKeys: ["salaryHourly", "workHours"],
  style: "photorealistic",
};
expectTrue("planning-valid", validatePlanning(planning).ok);
const correspondence = buildCorrespondence(planning, facts);
expect("correspondence-elements", correspondence.elements.length, 2);
const kvPrompt = buildImagePrompt(correspondence.elements[0], correspondence);
expectTrue("kv-prompt-compliance-pass", checkPromptCompliance(kvPrompt, correspondence).pass);
// A description that smuggles in a residence (housing is unstated)
// must fail the deterministic compliance scan.
const badPlanning = clone(planning);
badPlanning.imageSpecs[0].description = "A cozy detached house with a dormitory next door";
const badCorrespondence = buildCorrespondence(badPlanning, facts);
const badPrompt = buildImagePrompt(badCorrespondence.elements[0], badCorrespondence);
expect("kv-prompt-housing-blocked", checkPromptCompliance(badPrompt, badCorrespondence).pass, false);
// A visual element grounded on an unstated FACT must be refused.
const unstatedBasis = clone(planning);
unstatedBasis.imageSpecs[0].basis = { factKey: "housing" };
let threw = false;
try { buildCorrespondence(unstatedBasis, facts); } catch { threw = true; }
expectTrue("correspondence-unstated-basis-throws", threw);
// Cash imagery and clock faces are standing bans.
expect("kv-prompt-cash-blocked", checkPromptCompliance("Workers with cash and a wall clock", correspondence).pass, false);
// Spec plan: the key-visual spec's photograph becomes the LP hero (a
// real image); the finished image itself is never assembled.
const specPlan = decideImagePlanFromSpecs({ correspondence });
expect("spec-plan-count", specPlan.images.length, 2);
expect("spec-plan-id", specPlan.images[0].id, "hero");
expect("spec-plan-id-2", specPlan.images[1].id, "work");

// ---------- finished image: message map + image design ----------
{
  const scratch = mkdtempSync(path.join(tmpdir(), "layout-unit-"));
  mkdirSync(path.join(scratch, "img"), { recursive: true });
  writeFileSync(path.join(scratch, "img/hero.png"), Buffer.from([0x89, 0x50]));
  writeFileSync(path.join(scratch, "img/work.png"), Buffer.from([0x89, 0x50]));
  const planningUnit = {
    audience: "unit audience",
    firstCheckKeys: ["salaryHourly"],
    appeals: [
      { id: "A1", text: "lead", factKeys: ["salaryHourly"], sourceLines: ["L04"] },
      { id: "A2", text: "line-grounded, no fact key", factKeys: [], sourceLines: ["L06"] },
      { id: "A3", text: "ungrounded", factKeys: [], sourceLines: [] },
    ],
    imageSpecs: [
      { id: "kv", role: "key-visual", description: "exterior", purpose: "the workplace", design: { aspect: "5:3" } },
      { id: "work", role: "section", description: "scene", purpose: "the work" },
    ],
  };
  const built = buildFinishedImageHtml({
    root: scratch,
    planning: planningUnit,
    photos: [
      { id: "kv", role: "key-visual", file: "img/hero.png" },
      { id: "work", role: "section", file: "img/work.png" },
    ],
    pageDir: ".",
  });
  const rec = built.record;
  expect("layout-audience", rec.audience, "unit audience");
  expect("layout-title-carries-lead-appeal", rec.messageMap.find((m) => m.block === "title")?.carries.appealId, "A1");
  expect("layout-card-maps-appeal", rec.messageMap.find((m) => m.block === "condition-card")?.carries.appealId, "A1");
  expectTrue("layout-line-grounded-carried-by-details", (rec.messageMap.find((m) => m.block === "details")?.carries.appealIds ?? []).includes("A2"));
  expectTrue("layout-gap-surfaced", rec.messageGaps.some((g) => g.appealId === "A3"));
  expectTrue("layout-no-false-gap", !rec.messageGaps.some((g) => g.appealId === "A2"));
  expect("layout-hero-aspect", rec.imageDesign.find((d) => d.placement === "hero")?.aspect, "5:3");
  expect("layout-hero-height", rec.imageDesign.find((d) => d.placement === "hero")?.heightPx, 288);
  expectTrue("layout-html-crops-hero", built.html.includes("photo-hero"));
}

// ---------- pagecheck units (C5) ----------
const longSentence = "勤務時間は09:00から18:00までで、休憩は60分です。";
const dupPage = checkPage(`<html><body><p>${longSentence}</p><p>${longSentence}</p></body></html>`);
expect("pagecheck-duplication-fails", dupPage.pass, false);
const labelPage = checkPage(`<html><body><p>条件は次のとおりです。factKeys を確認してください。</p></body></html>`);
expect("pagecheck-record-label-fails", labelPage.pass, false);
const cleanPage = checkPage(`<html><body><p>${longSentence}</p><p>交通費は実費支給で、月上限10,000円です。</p></body></html>`);
expectTrue("pagecheck-clean-passes", cleanPage.pass);
expect("pagecheck-dict-counts", `${cleanPage.dictCounts.verification}/${cleanPage.dictCounts.recordLabels}/${cleanPage.dictCounts.headingScope}`, "13/13/4");
// Audit F-a (C6/C11): a verifier phrase fails the page check, and a
// failing pagecheck makes checkCompletion's C5 fail.
const phrasePage = checkPage(`<html><body><p>All facts below are the only stated facts. 条件は以上です。</p></body></html>`);
expect("pagecheck-verifier-phrase-fails", phrasePage.pass, false);
expectTrue("pagecheck-verifier-phrase-hit", phrasePage.summary.verificationHits >= 1);

// ---------- grounding generalization (F9) ----------
const customFacts = clone(facts);
for (const item of customFacts.items) {
  if (item.key === "salaryHourly") { item.value = "時給2,300円"; item.normalized = 2300; }
}
const genOk = { sentences: [{ text: "給与は時給2,300円です。", factKeys: ["salaryHourly"], sourceLines: ["L03"] }] };
expectTrue("grounding-derives-2300", checkGrounding(genOk, customFacts, original).pass);
const genWrong = { sentences: [{ text: "給与は時給1,500円です。", factKeys: ["salaryHourly"], sourceLines: ["L03"] }] };
expect("grounding-rejects-1500-for-2300-facts", checkGrounding(genWrong, customFacts, original).pass, false);

// ---------- scratch pipeline setup ----------
function makeScratch() {
  const dir = mkdtempSync(path.join(tmpdir(), "pipeline-fix-"));
  mkdirSync(path.join(dir, "src/facts"), { recursive: true });
  mkdirSync(path.join(dir, "out/images"), { recursive: true });
  copyFileSync(path.join(root, "src/fict-j01-v1.json"), path.join(dir, "src/fict-j01-v1.json"));
  copyFileSync(path.join(root, "src/facts/FICT-J01-facts-v1.json"), path.join(dir, "src/facts/FICT-J01-facts-v1.json"));
  copyFileSync(path.join(root, "src/facts/FICT-J01-facts-v1.approval.json"), path.join(dir, "src/facts/FICT-J01-facts-v1.approval.json"));
  writeFileSync(path.join(dir, "out/planning.json"), JSON.stringify(planning, null, 2) + "\n", "utf8");
  return dir;
}
const REAL = {
  originalFile: "src/fict-j01-v1.json",
  factsFile: "src/facts/FICT-J01-facts-v1.json",
  approvalFile: "src/facts/FICT-J01-facts-v1.approval.json",
  generationFile: "out/generated.json",
  imagesDir: "out/images",
  lpFile: "out/lp.html",
  imagesRunFile: "out/images-run.json",
  stateFile: "out/run-state.json",
  planningFile: "out/planning.json",
};
const faithfulSentences = [
  { text: "給与は時給1,500円です。", factKeys: ["salaryHourly"], sourceLines: ["L03"] },
  { text: "勤務時間は09:00〜18:00で、休憩60分、実働8時間です。", factKeys: ["workHours", "breakMinutes", "actualHours"], sourceLines: ["L04"] },
  { text: "交通費は実費支給で、月上限10,000円です。", factKeys: ["transport", "transportCap"], sourceLines: ["L05"] },
];
// ---------- checkCompletion C5 wiring (audit F-a) ----------
{
  const c5Base = { root: mkdtempSync(path.join(tmpdir(), "c5-wiring-")), generation: { sentences: faithfulSentences }, imageFiles: [], lpFile: "out/lp.html", grounding: { pass: true, checked: 0, issues: [] } };
  const c5Fail = checkCompletion({ ...c5Base, pagecheck: { pass: false, summary: { verificationHits: 1 } } });
  expect("completion-c5-fails-on-bad-page", c5Fail.checks.find((c) => c.id === "C5")?.pass, false);
  expect("completion-fails-on-bad-page", c5Fail.pass, false);
  const c5Pass = checkCompletion({ ...c5Base, pagecheck: { pass: true, summary: {} } });
  expect("completion-c5-passes-on-clean-page", c5Pass.checks.find((c) => c.id === "C5")?.pass, true);
}

function faithfulExtract() {
  return {
    status: "completed", facts: fixtureFacts(), schemaCheck: { pass: true },
    e01: { verdict: "一致（人間承認待ち）", stoppedAtReconciliation: false, contradictions: [] },
    e02: { verdict: "停止（矛盾あり）", stoppedAtReconciliation: true, contradictions: [{ field: "給与（時給）" }] },
    model: "stub", promptVersion: "fact-extract-v1.1", costUsd: 0, usage: null, durationMs: 1,
  };
}
function faithfulGenerate() {
  // Mirrors the live executor's contract: the generation object is
  // returned AND written to the generation file (a resume run reloads
  // it from the file).
  return async (args) => {
    const result = await runGeneration({
      ...args,
      callModel: async () => ({ content: JSON.stringify({ sentences: faithfulSentences }), usage: { prompt_tokens: 10, completion_tokens: 10 }, model: "stub" }),
    });
    if (result.generation) {
      writeFileSync(path.join(args.root, REAL.generationFile), JSON.stringify(result.generation, null, 2) + "\n", "utf8");
    }
    return result;
  };
}
function stubKeyVisualDeps(counter) {
  return {
    keyVisualPhotos: async ({ root: r, photoPlan, imagesDir }) => {
      if (counter) counter.count++;
      const images = photoPlan.map((pp) => {
        const file = `${imagesDir}/${pp.id}.png`;
        mkdirSync(path.dirname(path.join(r, file)), { recursive: true });
        writeFileSync(path.join(r, file), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
        return { id: pp.id, role: pp.role, file, prompt: pp.prompt, line: null };
      });
      return { status: "generated", model: "stub", images, costUsd: 0.01 };
    },
    renderFinishedImage: async ({ root: r, outDir, baseName }) => {
      const file = `${outDir}/${baseName}.png`;
      mkdirSync(path.dirname(path.join(r, file)), { recursive: true });
      writeFileSync(path.join(r, file), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      writeFileSync(path.join(r, `${outDir}/${baseName}.html`), "<html>stub</html>");
      return { status: "rendered", file, htmlFile: `${outDir}/${baseName}.html` };
    },
  };
}
function stubImages() {
  return async ({ root: r, imagesDir, specPlan: sp }) => {
    const images = (sp ? sp.images : []).map((s) => {
      const file = `${imagesDir}/${s.id}.png`;
      writeFileSync(path.join(r, file), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      return { id: s.id, file, prompt: s.prompt, line: null };
    });
    return { status: "generated", model: "stub", images, costUsd: images.length * 0.01, costNote: "stub" };
  };
}

// ---------- KV checkpoint stop (light set) ----------
const scratchA = makeScratch();
const kvCounter = { count: 0 };
let generateCallsA = 0;
const runA = await runDemo(
  { root: scratchA, ...REAL, checkpoints: "light" },
  { extract: async () => faithfulExtract(), generate: async (a) => { generateCallsA++; return faithfulGenerate()(a); }, ...stubKeyVisualDeps(kvCounter), images: stubImages() },
);
expect("kv-stop-status", runA.status, "stopped-at-checkpoint");
expect("kv-stop-stage", runA.stoppedAt, "key-visual");
expect("kv-generated-once", kvCounter.count, 1);
expect("kv-generation-not-run", generateCallsA, 0);
expectTrue("kv-state-saved", existsSync(path.join(scratchA, "out/run-state.json")));
expectTrue("kv-presentation-saved", existsSync(path.join(scratchA, "out/presentation-key-visual.json")));
const stateA = JSON.parse(readFileSync(path.join(scratchA, "out/run-state.json"), "utf8"));
const kvSha = stateA.keyVisual.image.sha256;

// ---------- resume refusals ----------
const runB = await runDemo(
  { root: scratchA, ...REAL, checkpoints: "light", resumeState: stateA },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expect("resume-no-confirmation-stops", runB.stoppedAt, "key-visual-confirmation");
const runC = await runDemo(
  { root: scratchA, ...REAL, checkpoints: "light", resumeState: stateA, kvConfirmation: { file: stateA.keyVisual.image.file, sha256: "0".repeat(64), confirmer: "本人", confirmedAt: "2026-11-03" } },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expect("resume-wrong-sha-stops", runC.stoppedAt, "key-visual-confirmation");

// ---------- resume success to a complete LP ----------
const confirmation = { file: stateA.keyVisual.image.file, sha256: kvSha, confirmer: "本人", confirmedAt: "2026-11-03" };
const runD = await runDemo(
  { root: scratchA, ...REAL, checkpoints: "light", resumeState: stateA, kvConfirmation: confirmation },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expect("resume-completion-has-c5", Array.isArray(runD.stages.verification.completion?.checks) && runD.stages.verification.completion.checks.some((c) => c.id === "C5"), true);
expectTrue("resume-completion-pass", runD.stages.verification.completion.pass);
const lpHtml = readFileSync(path.join(scratchA, "out/lp.html"), "utf8");
expectTrue("lp-hero-chips", lpHtml.includes("hero-chips") && lpHtml.includes("時給1,500円"));
expectTrue("lp-presentation-saved", existsSync(path.join(scratchA, "out/presentation-lp.json")));
expect("resume-status", runD.status, "pending-human-confirmation");

// ---------- text checkpoint (full set) stops after generation ----------
const scratchF = makeScratch();
const runF1 = await runDemo(
  { root: scratchF, ...REAL, checkpoints: "full" },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expect("full-kv-stop", runF1.stoppedAt, "key-visual");
expectTrue("full-planning-presentation", existsSync(path.join(scratchF, "out/presentation-planning.json")));
const stateF = JSON.parse(readFileSync(path.join(scratchF, "out/run-state.json"), "utf8"));
const confF = { file: stateF.keyVisual.image.file, sha256: stateF.keyVisual.image.sha256, confirmer: "本人", confirmedAt: "2026-11-03" };
const runF2 = await runDemo(
  { root: scratchF, ...REAL, checkpoints: "full", resumeState: stateF, kvConfirmation: confF },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expect("full-text-stop", runF2.stoppedAt, "text-checkpoint");
expect("full-text-stop-status", runF2.status, "stopped-at-checkpoint");
const stateF2 = JSON.parse(readFileSync(path.join(scratchF, "out/run-state.json"), "utf8"));
const runF3 = await runDemo(
  { root: scratchF, ...REAL, checkpoints: "full", resumeState: stateF2, kvConfirmation: confF },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expectTrue("full-resume-completes", runF3.stages.verification.completion.pass);

// ---------- missing planning stops as a checkpoint ----------
const scratchP = makeScratch();
const runP = await runDemo(
  { root: scratchP, ...REAL, checkpoints: "light", planningFile: undefined },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expect("missing-planning-stop", runP.stoppedAt, "planning");
expect("missing-planning-checkpoint", runP.status, "stopped-at-checkpoint");

// ---------- generation retries then succeeds (F8) ----------
const scratchR = makeScratch();
const runR1 = await runDemo(
  { root: scratchR, ...REAL, checkpoints: "light" },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
const stateR = JSON.parse(readFileSync(path.join(scratchR, "out/run-state.json"), "utf8"));
const confR = { file: stateR.keyVisual.image.file, sha256: stateR.keyVisual.image.sha256, confirmer: "本人", confirmedAt: "2026-11-03" };
let genAttempts = 0;
const flakyGenerate = async (args) => {
  genAttempts++;
  if (genAttempts < 3) return { status: "generated", generation: { sentences: [] }, grounding: { pass: false, checked: 0, issues: [{ issue: "stub failure" }] }, apiCalled: true, model: "stub", promptVersion: "stub", costUsd: 0, usage: null };
  return faithfulGenerate()(args);
};
const runR2 = await runDemo(
  { root: scratchR, ...REAL, checkpoints: "light", resumeState: stateR, kvConfirmation: confR },
  { extract: async () => faithfulExtract(), generate: flakyGenerate, ...stubKeyVisualDeps(), images: stubImages() },
);
expect("generation-retry-attempts", runR2.stages.generation.attempts, 3);
expectTrue("generation-retry-completes", runR2.stages.verification.completion.pass);

// ---------- image failure becomes a hold, completion fails ----------
const scratchH = makeScratch();
const runH1 = await runDemo(
  { root: scratchH, ...REAL, checkpoints: "light" },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
const stateH = JSON.parse(readFileSync(path.join(scratchH, "out/run-state.json"), "utf8"));
const confH = { file: stateH.keyVisual.image.file, sha256: stateH.keyVisual.image.sha256, confirmer: "本人", confirmedAt: "2026-11-03" };
const failingImages = async () => ({ status: "failed", reason: "stub failure", model: "stub", images: [], costUsd: 0 });
const runH2 = await runDemo(
  { root: scratchH, ...REAL, checkpoints: "light", resumeState: stateH, kvConfirmation: confH },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: failingImages },
);
expect("images-hold-recorded", runH2.holds.some((h) => h.stage === "images"), true);
expect("images-attempts", runH2.stages.images.attempts, 3);
expect("images-hold-completion-fails", runH2.stages.verification.completion.pass, false);
const lpPresentation = JSON.parse(readFileSync(path.join(scratchH, "out/presentation-lp.json"), "utf8"));
expectTrue("lp-presentation-lists-hold", lpPresentation.holds.some((h) => h.stage === "images"));

// ---------- assembly failure: bounded retry, captured (audit F-b) ----------
import { assembleLP } from "./run-demo.mjs";
const scratchB = makeScratch();
const runB1 = await runDemo(
  { root: scratchB, ...REAL, checkpoints: "light" },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
const stateB = JSON.parse(readFileSync(path.join(scratchB, "out/run-state.json"), "utf8"));
const confB = { file: stateB.keyVisual.image.file, sha256: stateB.keyVisual.image.sha256, confirmer: "本人", confirmedAt: "2026-11-03" };
let assembleAttempts = 0;
const flakyAssemble = async (args) => {
  assembleAttempts += 1;
  if (assembleAttempts < 3) throw new Error("stub write failure");
  const built = assembleLP({ root: args.root, generation: args.generation, images: args.images, lpDir: path.dirname(args.lpFile), heroChips: args.heroChips });
  writeFileSync(path.join(args.root, args.lpFile), built.html, "utf8");
  return { file: args.lpFile, referenced: built.referenced, skipped: built.skipped };
};
const runB2 = await runDemo(
  { root: scratchB, ...REAL, checkpoints: "light", resumeState: stateB, kvConfirmation: confB },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages(), assemble: flakyAssemble },
);
expect("assembly-retry-attempts", runB2.stages.lpAssembly.attempts, 3);
expectTrue("assembly-retry-completes", runB2.stages.verification.completion.pass);
const scratchB2 = makeScratch();
const runB3 = await runDemo(
  { root: scratchB2, ...REAL, checkpoints: "light" },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
const stateB2 = JSON.parse(readFileSync(path.join(scratchB2, "out/run-state.json"), "utf8"));
const confB2 = { file: stateB2.keyVisual.image.file, sha256: stateB2.keyVisual.image.sha256, confirmer: "本人", confirmedAt: "2026-11-03" };
const alwaysFailAssemble = async () => { throw new Error("stub write failure"); };
const runB4 = await runDemo(
  { root: scratchB2, ...REAL, checkpoints: "light", resumeState: stateB2, kvConfirmation: confB2 },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages(), assemble: alwaysFailAssemble },
);
expect("assembly-failure-stops", runB4.stoppedAt, "assembly");
expect("assembly-failure-attempts", runB4.stages.lpAssembly.attempts, 3);

// ---------- Render failure: the run stops as a hold AND persists state
// so it can resume after the environment is fixed ----------
const scratchRF = makeScratch();
const kvDepsRF = stubKeyVisualDeps();
const runRF = await runDemo(
  { root: scratchRF, ...REAL, checkpoints: "light" },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), keyVisualPhotos: kvDepsRF.keyVisualPhotos, renderFinishedImage: async () => { throw new Error("browser missing (stub)"); }, images: stubImages() },
);
expect("render-failure-stops", runRF.stoppedAt, "key-visual");
expectTrue("render-failure-hold", (runRF.holds ?? []).some((h) => h.stage === "key-visual"));
const stateRF = JSON.parse(readFileSync(path.join(scratchRF, "out/run-state.json"), "utf8"));
expectTrue("render-failure-state-persisted", Array.isArray(stateRF.completedStages) && !stateRF.completedStages.includes("keyVisual"));
expectTrue("assembly-failure-hold", runB4.holds.some((h) => h.stage === "assembly"));

// ---------- text entry (F1) ----------
const scratchE = makeScratch();
const postingText = [
  "企業名は架空のミナモ製作所。勤務地は架空の港南実験区B棟。",
  "雇用形態は有期契約社員。契約期間は6か月。更新の有無は未記載。",
  "給与は時給1,800円。月収は保証しない。",
  "勤務時間は08:30〜17:30、休憩60分、実働8時間。月20日勤務は試算用の仮定。",
  "交通費は実費支給、月上限12,000円。",
  "寮の有無と費用は未記載。",
].join("\n");
const entryFactsItems = [
  { key: "employer", status: "stated", value: "ミナモ製作所", normalized: null, sourceLine: "L01", quote: "企業名は架空のミナモ製作所。" },
  { key: "jobId", status: "stated", value: "FICT-J99", normalized: null, sourceLine: "L01", quote: "企業名は架空のミナモ製作所。" },
  { key: "workLocation", status: "stated", value: "港南実験区B棟", normalized: null, sourceLine: "L01", quote: "勤務地は架空の港南実験区B棟。" },
  { key: "employmentType", status: "stated", value: "有期契約社員", normalized: null, sourceLine: "L02", quote: "雇用形態は有期契約社員。" },
  { key: "contractPeriod", status: "stated", value: "6か月", normalized: null, sourceLine: "L02", quote: "契約期間は6か月。" },
  { key: "renewal", status: "unstated", value: null, normalized: null, sourceLine: "L02", quote: "更新の有無は未記載。" },
  { key: "salaryHourly", status: "stated", value: "時給1,800円", normalized: 1800, sourceLine: "L03", quote: "給与は時給1,800円。" },
  { key: "monthlyIncomeGuarantee", status: "stated", value: "保証しない", normalized: null, sourceLine: "L03", quote: "月収は保証しない。" },
  { key: "workHours", status: "stated", value: "08:30〜17:30", normalized: null, sourceLine: "L04", quote: "勤務時間は08:30〜17:30" },
  { key: "breakMinutes", status: "stated", value: "60分", normalized: 60, sourceLine: "L04", quote: "休憩60分" },
  { key: "actualHours", status: "stated", value: "8時間", normalized: 8, sourceLine: "L04", quote: "実働8時間" },
  { key: "monthlyDaysAssumption", status: "stated", value: "月20日勤務（試算用の仮定）", normalized: null, sourceLine: "L04", quote: "月20日勤務は試算用の仮定。" },
  { key: "transport", status: "stated", value: "実費支給", normalized: null, sourceLine: "L05", quote: "交通費は実費支給" },
  { key: "transportCap", status: "stated", value: "月上限12,000円", normalized: 12000, sourceLine: "L05", quote: "月上限12,000円。" },
  { key: "housing", status: "unstated", value: null, normalized: null, sourceLine: "L06", quote: "寮の有無と費用は未記載。" },
];
const entryExtract = {
  status: "completed", facts: { items: entryFactsItems }, schemaCheck: { pass: true },
  e01: { verdict: "一致（人間承認待ち）", stoppedAtReconciliation: false, contradictions: [] },
  e02: null, model: "stub", promptVersion: "fact-extract-v1.1", costUsd: 0, usage: null, durationMs: 1,
};
let entryGenerateCalls = 0;
const runE = await runDemo(
  {
    root: scratchE, posting: { id: "FICT-J99", version: "v1", text: postingText },
    originalFile: "entry/original.json", factsFile: "entry/facts.json", approvalFile: "entry/approval.json",
    generationFile: "entry/generated.json", imagesDir: "entry/images", lpFile: "entry/lp.html", imagesRunFile: "entry/images-run.json",
    checkpoints: "light",
  },
  { extract: async () => entryExtract, generate: async () => { entryGenerateCalls++; return faithfulGenerate()({}); }, ...stubKeyVisualDeps(), images: stubImages() },
);
expect("entry-stops-at-approval", runE.stoppedAt, "approval");
// The approval stop persists state, and a resume continues from the
// same candidate after a human approval is recorded (loop-022).
expectTrue("entry-approval-stop-saves-state", existsSync(path.join(scratchE, "entry/run-state.json")));
{
  const stateE = JSON.parse(readFileSync(path.join(scratchE, "entry/run-state.json"), "utf8"));
  writeFileSync(path.join(scratchE, "entry/recon.json"), JSON.stringify({ e01: entryExtract.e01 }, null, 2) + "\n", "utf8");
  const draftE = buildApprovalDraft({ root: scratchE, originalFile: "entry/original.json", factsFile: "entry/facts.json", manifestFile: "entry/manifest.json", reconciliationFile: "entry/recon.json", caseId: "e01" });
  draftE.status = "approved";
  draftE.approver = "本人";
  draftE.approvedAt = "2026-11-03";
  writeFileSync(path.join(scratchE, "entry/approval.json"), JSON.stringify(draftE, null, 2) + "\n", "utf8");
  writeFileSync(path.join(scratchE, "entry/planning.json"), JSON.stringify(planning, null, 2) + "\n", "utf8");
  const runE2 = await runDemo(
    { root: scratchE, resumeState: stateE, checkpoints: "light", planningFile: "entry/planning.json" },
    { extract: async () => entryExtract, generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
  );
  expect("entry-resume-reaches-key-visual", runE2.stoppedAt, "key-visual");
  expect("entry-resume-approval-passed", runE2.stages.approval.pass, true);
}
expect("entry-no-generation", entryGenerateCalls, 0);
const pinnedOriginal = JSON.parse(readFileSync(path.join(scratchE, "entry/original.json"), "utf8"));
expect("entry-pinned-lines", pinnedOriginal.lines.length, 6);
const entryFacts = JSON.parse(readFileSync(path.join(scratchE, "entry/facts.json"), "utf8"));
expect("entry-facts-id", entryFacts.factsId, "FICT-J99-facts");
expectTrue("entry-manifest-exists", existsSync(path.join(scratchE, "entry/manifest.json")));
expect("entry-comparison-mode", runE.stages.factsComparison.mode, "entry");
// The existing approval-draft tooling works on the entry artifacts.
writeFileSync(path.join(scratchE, "entry/recon.json"), JSON.stringify({ e01: entryExtract.e01 }, null, 2) + "\n", "utf8");
const draft = buildApprovalDraft({ root: scratchE, originalFile: "entry/original.json", factsFile: "entry/facts.json", manifestFile: "entry/manifest.json", reconciliationFile: "entry/recon.json", caseId: "e01" });
expect("entry-approval-draft-id", draft.approvalId, "FICT-J99-approval-1");
expect("entry-approval-draft-status", draft.status, "draft");

// Entry with an internal contradiction stops at reconciliation.
const contraExtract = clone(entryExtract);
contraExtract.e01 = { verdict: "停止（矛盾あり）", stoppedAtReconciliation: true, contradictions: [{ field: "給与（時給）" }] };
const runEC = await runDemo(
  {
    root: scratchE, posting: { id: "FICT-J99", version: "v1", text: postingText },
    originalFile: "entry2/original.json", factsFile: "entry2/facts.json", approvalFile: "entry2/approval.json",
    generationFile: "entry2/generated.json", imagesDir: "entry2/images", lpFile: "entry2/lp.html", imagesRunFile: "entry2/images-run.json",
    checkpoints: "light",
  },
  { extract: async () => contraExtract, generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expect("entry-contradiction-stops", runEC.stoppedAt, "reconciliation");

// ---------- planning generation + feedback input (F2/F10) ----------
let capturedMessages = null;
const feedbackMemo = "交通費の文を、勤務時間の文より前に置く。";
const planGen = await runPlanningGeneration({
  root, originalFile: REAL.originalFile, factsFile: REAL.factsFile, approvalFile: REAL.approvalFile,
  planning, planningRef: { source: "planning-input", file: "out/planning.json", sha256: "x" },
  feedbackText: feedbackMemo,
  callModel: async (messages) => {
    capturedMessages = messages;
    return { content: JSON.stringify({ sentences: faithfulSentences }), usage: { prompt_tokens: 10, completion_tokens: 10 }, model: "stub" };
  },
});
expect("planning-generation-status", planGen.status, "generated");
expectTrue("planning-generation-grounding", planGen.grounding.pass);
expectTrue("feedback-in-prompt", capturedMessages[0].content.includes("交通費の文を"));
expect("feedback-applied-flag", planGen.feedbackApplied, true);
const intent = intentFromPlanning(planning, feedbackMemo);
expectTrue("intent-carries-notsay", intent.voice.rules.some((r) => r.includes("寮には触れない")));
// Refusal: a draft approval refuses before any API call.
let refusedCalls = 0;
const refused = await runPlanningGeneration({
  root, originalFile: REAL.originalFile, factsFile: REAL.factsFile, approvalFile: "loops/loop-007/approval-draft.json",
  planning, planningRef: { source: "planning-input", file: "out/planning.json", sha256: "x" },
  callModel: async () => { refusedCalls++; return { content: "{}", usage: null, model: "stub" }; },
});
expect("planning-generation-refused", refused.status, "refused");
expect("planning-generation-refusal-no-api", refusedCalls, 0);

// --- Verbatim check: unstated forms (found by the loop-022 live run)
// A raw posting is silent on unstated items (no source reference);
// an original may also declare 未記載 explicitly and be cited. Both
// pass; half-filled references and sourceless stated items fail.
{
  const orig = { lines: [{ id: "L01", text: "時給： 1,350円" }, { id: "L02", text: "更新の有無は未記載。" }] };
  const silent = { items: [{ key: "hourlyWage", status: "stated", sourceLine: "L01", quote: "1,350円" }, { key: "housing", status: "unstated", sourceLine: null, quote: null }] };
  expect("verbatim-silent-unstated-passes", checkQuoteVerbatim(silent, orig).pass, true);
  const declared = { items: [{ key: "renewal", status: "unstated", sourceLine: "L02", quote: "更新の有無は未記載。" }] };
  expect("verbatim-declared-unstated-passes", checkQuoteVerbatim(declared, orig).pass, true);
  const half = { items: [{ key: "housing", status: "unstated", sourceLine: null, quote: "寮あり" }] };
  expect("verbatim-half-filled-fails", checkQuoteVerbatim(half, orig).pass, false);
  const statedNull = { items: [{ key: "hourlyWage", status: "stated", sourceLine: null, quote: null }] };
  expect("verbatim-stated-without-source-fails", checkQuoteVerbatim(statedNull, orig).pass, false);
}

const failed = results.filter((r) => !r.pass);
console.log(JSON.stringify({
  passed: results.length - failed.length,
  total: results.length,
  failed: failed.map((f) => f.id),
  results,
  note: "修正系のケースはモデル呼び出しをスタブ化しており、実 API は呼んでいない。",
  runAt: new Date().toISOString(),
}, null, 2));
if (failed.length > 0) process.exitCode = 1;
