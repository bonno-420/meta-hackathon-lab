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
import { buildPlanningGenerationMessages } from "./generate-planning.mjs";
import { deriveLpDesign } from "./lp-design.mjs";
import { runPlanningGeneration } from "./generate-planning.mjs";
import { decideImagePlanFromSpecs } from "./generate-images.mjs";
import { buildCorrespondence, buildImagePrompt, checkPromptCompliance, intentFromPlanning, validatePlanning } from "./planning.mjs";
import { checkPage } from "./pagecheck.mjs";
import { checkCompletion, liveDeps, runDemo } from "./run-demo.mjs";
import { buildFinishedImageHtml, evaluateFinishedImageGate } from "./page-layout.mjs";
import { buildImageDesign, checkImageDesign, checkPromptGates, rebuildPromptWithoutHits } from "./image-design.mjs";

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

// ---------- pagecheck: the 2026-11-04 defect (hero present, body unchecked) ----------
{
  const sentence = "勤務時間は07:00から16:00までで、休憩は60分です。";
  const badPage = `<!doctype html><html><body><main><section class="lp-hero"><img src="images/hero.webp" alt="hero"></section><p>${sentence}</p><p>${sentence}</p><p>条件は factKeys を確認してください。</p></main></body></html>`;
  const badResult = checkPage(badPage);
  expectTrue("pagecheck-hero-body-duplication-fails", !badResult.pass && badResult.summary.duplicateGroups >= 1 && badResult.summary.recordExposureHits >= 1);
  const valuePage = `<!doctype html><html><body><main><section class="lp-hero"><span>09:00〜18:00</span></section><div class="card">09:00〜18:00</div><p>${sentence}</p></main></body></html>`;
  expectTrue("pagecheck-value-repetition-is-not-duplication", checkPage(valuePage).pass);
}

// ---------- pagecheck: internal identifiers in attributes (v2, run20 review) ----------
{
  const altPage = checkPage(`<!doctype html><html><body><main><img src="images/a.webp" alt="appeal-A3"><p>勤務時間は07:00から16:00までで、休憩は60分です。</p></main></body></html>`);
  expectTrue("pagecheck-alt-internal-id-fails", !altPage.pass && altPage.summary.attributeExposureHits >= 1);
  const altClean = checkPage(`<!doctype html><html><body><main><img src="images/a.webp" alt=""><p>勤務時間は07:00から16:00までで、休憩は60分です。</p></main></body></html>`);
  expectTrue("pagecheck-alt-empty-passes", altClean.pass);
}

// ---------- assembly from the confirmed layout + appeal coverage (C6) ----------
{
  const { assembleFromLayout, matchAppealSentences } = await import("./assemble-layout.mjs");
  const gen = { sentences: [
    { text: "時給は1,500円です。", factKeys: ["salaryHourly"], sourceLines: ["L03"] },
    { text: "土日祝日は休みです。", factKeys: [], sourceLines: ["L06"] },
  ] };
  const layoutRec = { messageMap: [
    { block: "hero-photo", carries: {} },
    { block: "title", carries: { appealId: "A1" } },
    { block: "condition-card", carries: { factKey: "salaryHourly", appealId: "A1" } },
    { block: "details", carries: { factKeys: [], appealIds: ["A3"] } },
    { block: "cta", carries: { action: true } },
  ] };
  const built = assembleFromLayout({ root: makeScratch(), generation: gen, images: [], lpDir: "out", heroChips: ["時給1,500円"], layout: layoutRec, planning, facts });
  expectTrue("layout-assembly-places-every-sentence", gen.sentences.every((s) => built.html.includes(s.text)));
  expectTrue("layout-assembly-card-carries-value", built.html.includes("card-value") && built.html.includes("時給1,500円"));
  expectTrue("layout-assembly-has-cta", built.html.includes("応募する"));
  const completion = checkCompletion({ root: makeScratch(), generation: gen, imageFiles: [], lpFile: "out/lp.html", grounding: { pass: true }, pagecheck: null, appealCoverage: [{ appealId: "A1", sentenceIdxs: [0] }, { appealId: "A9", sentenceIdxs: [] }] });
  expectTrue("completion-c6-blocks-uncovered-appeal", !completion.pass && completion.checks.some((c) => c.id === "C6" && !c.pass));
}

// ---------- assembly: a band without text renders no empty box (run20 review) ----------
{
  const { assembleFromLayout } = await import("./assemble-layout.mjs");
  const rootB = makeScratch();
  mkdirSync(path.join(rootB, "images"), { recursive: true });
  writeFileSync(path.join(rootB, "images", "appeal-A9.webp"), "x");
  const genB = { sentences: [{ text: "時給は1,500円です。", factKeys: ["salaryHourly"], sourceLines: ["L03"] }] };
  const layoutB = { messageMap: [
    { block: "photo-band", carries: { specId: "appeal-A9", basis: { appealId: "A9" } } },
    { block: "cta", carries: { action: true } },
  ] };
  const builtB = assembleFromLayout({ root: rootB, generation: genB, images: [{ id: "appeal-A9", file: "images/appeal-A9.webp" }], lpDir: "out", heroChips: [], layout: layoutB, planning, facts });
  // A band with no text is omitted entirely (no mute image block,
  // no bare figure appended): images are not decoration
  // (user principle, 2026-11-04; FICT-E01 runE1d page review).
  expectTrue("assembly-band-without-text-is-omitted", !builtB.html.includes(`<img class="inline-photo"`) && !builtB.html.includes("appeal-A9.webp") && (builtB.assignments.omittedBands ?? []).includes("appeal-A9"));
  expectTrue("assembly-band-no-empty-text-box", !builtB.html.includes(`<div class="explain-text"></div>`));
}

// ---------- assembly: headline prefers the work sentence over a condition sentence citing the same line (runE2g) ----------
{
  const { assembleFromLayout } = await import("./assemble-layout.mjs");
  const planningH = {
    appeals: [
      { id: "A1", text: "手で物を作る仕事そのもの", factKeys: [], sourceLines: ["L01"] },
      { id: "A2", text: "契約社員（6か月）", factKeys: ["employmentType", "contractPeriod"], sourceLines: ["L01", "L02"] },
    ],
    imageSpecs: [{ id: "key-visual", role: "key-visual", basis: { appealId: "A1" } }],
    firstCheckKeys: ["workHours"],
  };
  const genH = { sentences: [
    { text: "雇用形態は契約社員、期間は6か月です。", factKeys: ["employmentType", "contractPeriod"], sourceLines: ["L01", "L02"] },
    { text: "小さな工房で木枠を組み立て、部品を手で磨く仕事です。", factKeys: [], sourceLines: ["L01"] },
  ] };
  const layoutH = { messageMap: [
    { block: "title", carries: { workContent: true, appealId: "A1" } },
    { block: "details", carries: { factKeys: [], appealIds: ["A2"] } },
    { block: "cta", carries: { action: true } },
  ] };
  const builtH = assembleFromLayout({ root: makeScratch(), generation: genH, images: [], lpDir: "out", heroChips: [], layout: layoutH, planning: planningH, facts });
  const titleSection = builtH.html.split(`<section class="title-block">`)[1]?.split("</section>")[0] ?? "";
  expectTrue("assembly-headline-is-the-work-sentence", titleSection.includes("木枠を組み立て"));
  expectTrue("assembly-headline-is-not-the-employment-sentence", !titleSection.includes("雇用形態は契約社員"));
  expectTrue("assembly-fact-table-lists-stated-facts", builtH.html.includes("fact-table") && builtH.html.includes("募集要項"));
}

// ---------- assembly: the KV-appeal rule beats the unmatched-sentence fallback (runE2h) ----------
{
  const { assembleFromLayout } = await import("./assemble-layout.mjs");
  const planningI = {
    appeals: [
      { id: "A1", text: "仕事そのもの", factKeys: [], sourceLines: ["L01"] },
      { id: "A4", text: "平日の勤務時間", factKeys: ["workHours"], sourceLines: ["L05"] },
    ],
    imageSpecs: [{ id: "key-visual", role: "key-visual", basis: { appealId: "A1" } }],
    firstCheckKeys: ["workHours"],
  };
  const genI = { sentences: [
    { text: "雇用形態は契約社員です。", factKeys: ["employmentType"], sourceLines: ["L02"] },
    { text: "小さな工房で木枠を組み立てる仕事です。", factKeys: [], sourceLines: ["L01"] },
  ] };
  const layoutI = { messageMap: [
    { block: "title", carries: { workContent: true, appealId: "A1" } },
    { block: "cta", carries: { action: true } },
  ] };
  const originalI = { lines: [
    { id: "L01", text: "Work: Assembling small wooden frames" },
    { id: "L06", text: "Days: Monday to Friday" },
  ] };
  const builtI = assembleFromLayout({ root: makeScratch(), generation: genI, images: [], lpDir: "out", heroChips: [], layout: layoutI, planning: planningI, facts, original: originalI });
  const titleI = builtI.html.split(`<section class="title-block">`)[1]?.split("</section>")[0] ?? "";
  expectTrue("assembly-headline-kv-appeal-beats-unmatched-condition", titleI.includes("木枠を組み立てる仕事です"));
  expectTrue("assembly-fact-table-has-line-essentials", builtI.html.includes("Monday to Friday") && builtI.html.includes("<th>Days</th>"));
}

// ---------- assembly: the work band falls back to the work appeal's body sentence (runE2i) ----------
{
  const { assembleFromLayout } = await import("./assemble-layout.mjs");
  const rootJ = makeScratch();
  mkdirSync(path.join(rootJ, "images"), { recursive: true });
  writeFileSync(path.join(rootJ, "images", "section-work.webp"), "x");
  const planningJ = {
    appeals: [{ id: "A1", text: "仕事そのもの", factKeys: [], sourceLines: ["L01"] }],
    imageSpecs: [
      { id: "key-visual", role: "key-visual", basis: { appealId: "A1" } },
      { id: "section-work", role: "work", basis: { factKey: "workLocation" } },
    ],
    firstCheckKeys: [],
  };
  const genJ = { sentences: [
    { text: "小さな工房で木枠を組み立てる仕事です。", factKeys: ["workLocation"], sourceLines: ["L01", "L03"] },
    { text: "手で物を作りたい人に向いた仕事です。", factKeys: [], sourceLines: ["L01"] },
  ] };
  const layoutJ = { messageMap: [
    { block: "title", carries: { workContent: true, appealId: "A1" } },
    { block: "photo-band", carries: { specId: "section-work", basis: { factKey: "workLocation" } } },
    { block: "cta", carries: { action: true } },
  ] };
  const builtJ = assembleFromLayout({ root: rootJ, generation: genJ, images: [{ id: "section-work", file: "images/section-work.webp" }], lpDir: "out", heroChips: [], layout: layoutJ, planning: planningJ, facts });
  expectTrue("assembly-work-band-carries-body-sentence", builtJ.html.includes("手で物を作りたい人に向いた仕事です") && builtJ.html.includes("section-work.webp"));
  expectTrue("assembly-work-band-not-omitted", !(builtJ.assignments.omittedBands ?? []).includes("section-work"));
}

// ---------- promoted gates G-A / G-B / G-C (user approval, 2026-11-04) ----------
{
  const { checkCompletion } = await import("./run-demo.mjs");
  const { checkPage } = await import("./pagecheck.mjs");
  const { checkImageDesign } = await import("./image-design.mjs");
  const rootG = makeScratch();
  mkdirSync(path.join(rootG, "out"), { recursive: true });
  const factsG = { items: [{ key: "salaryHourly", status: "stated", value: "1,400円", normalized: 1400, sourceLine: "L04" }] };
  const originalG = { lines: [{ id: "L06", text: "Days: Monday to Friday" }] };
  const genG = { sentences: [{ text: "仕事の文です。", factKeys: [], sourceLines: ["L01"] }] };
  writeFileSync(path.join(rootG, "out/lp.html"), `<html><body><p>仕事の文です。</p></body></html>`);
  const noTable = checkCompletion({ root: rootG, generation: genG, imageFiles: [], lpFile: "out/lp.html", grounding: { pass: true }, pagecheck: null, facts: factsG, original: originalG });
  expectTrue("gate-ga-c7-fails-without-table", noTable.checks.some((c) => c.id === "C7" && !c.pass));
  writeFileSync(path.join(rootG, "out/lp.html"), `<html><body><p>仕事の文です。</p><table class="fact-table"><tr><th>時給</th><td>1,400円</td></tr><tr><th>Days</th><td>Monday to Friday</td></tr></table></body></html>`);
  const withTable = checkCompletion({ root: rootG, generation: genG, imageFiles: [], lpFile: "out/lp.html", grounding: { pass: true }, pagecheck: null, facts: factsG, original: originalG });
  expectTrue("gate-ga-c7-passes-with-complete-table", withTable.checks.some((c) => c.id === "C7" && c.pass));
  const badHeadline = checkPage(`<html><body><section><div class="title-block"><p class="lp-sentence">Employment type is Contract, 6 months.</p></div></section></body></html>`);
  expectTrue("gate-gb-headline-condition-fails", !badHeadline.pass && badHeadline.summary.headlineHits >= 1);
  const goodHeadline = checkPage(`<html><body><section><div class="title-block"><p class="lp-sentence">Assembling small wooden frames in a small workshop in Taito City, Tokyo.</p></div></section></body></html>`);
  expectTrue("gate-gb-headline-work-passes", goodHeadline.summary.headlineHits === 0);
  const designNoCov = { images: [{ id: "hero", kind: "hero", purpose: "p", subject: "s", composition: "c", depiction: "photo", placement: { area: "hero", size: "large" }, prompt: "x" }], noImage: [] };
  const covCheck = checkImageDesign(designNoCov, { appeals: [] });
  expectTrue("gate-gc-missing-coverage-checks-fail", !covCheck.pass && covCheck.failures.some((f) => f.includes("coverageChecks")));
}

// ---------- language mixing: machine detects, judgement decides intent (user refinement, 2026-11-04) ----------
{
  const { japaneseMixingHits, buildCopyReviewMessages } = await import("./review.mjs");
  const sentences = [{ text: "The studio is in Shimokitazawa." }, { text: "Monthly income example (試算): 96,000 yen." }];
  const hits = japaneseMixingHits(sentences);
  expect("mixing-hits-count", hits.length, 1);
  expect("mixing-hits-index", hits[0].index, 1);
  const msgs = buildCopyReviewMessages({ planning: { language: "en", audience: "Women", appeals: [] }, generation: { sentences } });
  expectTrue("mixing-hits-reach-the-judge", msgs[1].content.includes("language-purity") && msgs[1].content.includes("試算"));
  const msgsJa = buildCopyReviewMessages({ planning: { language: "ja", audience: "女性", appeals: [] }, generation: { sentences } });
  expectTrue("mixing-scan-en-only", !msgsJa[1].content.includes("Deterministic scan"));
  // Grounding no longer hard-fails on mixing: intent is not a
  // deterministic question (the scan + the judge carry it instead).
  const { checkGrounding } = await import("./generate.mjs");
  const factsL = { items: [{ key: "salaryHourly", status: "stated", value: "1,200 yen", normalized: 1200, sourceLine: "L04" }] };
  const originalL = { lines: [{ id: "L04", text: "Hourly wage: 1,200 yen" }] };
  const mixed = { sentences: [{ text: "Monthly income example (試算): 1,200 yen per hour.", factKeys: ["salaryHourly"], sourceLines: ["L04"] }] };
  expectTrue("grounding-does-not-hard-fail-mixing", checkGrounding(mixed, factsL, originalL, { language: "en" }).pass);
}

// ---------- palette variation is perceptual, not by ID (user instruction, 2026-11-04) ----------
{
  const { deriveLpDesign, checkPaletteVariation } = await import("./lp-design.mjs");
  // The measured case: slate blue (work-2) and navy (cond-1) are
  // different IDs in different patterns and the same color to the eye.
  expectTrue("hue-navy-slate-same", !checkPaletteVariation("#22384f", "#173550").pass);
  const planningC = { appeals: [{ id: "A1", text: "Packing soaps", factKeys: ["workHours"], sourceLines: [] }], firstCheckKeys: ["workHours", "workLocation"], imageSpecs: [] };
  const d = deriveLpDesign(planningC, { previous: { patternId: "P-WORK", paletteId: "work-2" } });
  expectTrue("derive-avoids-same-color", d.paletteId !== "cond-1" && d.colorCheck && d.colorCheck.pass);
  const dNone = deriveLpDesign(planningC, {});
  expect("derive-no-previous", dNone.colorCheck, null);
}

// ---------- color rule refinement: similar conditions may be similar; unconditional sameness may not (user, 2026-11-04) ----------
{
  const { deriveLpDesign } = await import("./lp-design.mjs");
  const womenBeauty = { audience: "Women in their 30s to 50s near Shimokitazawa, part-time", appeals: [{ id: "A1", text: "Packing handmade soaps and cosmetics", factKeys: ["salaryHourly"], sourceLines: [] }], firstCheckKeys: ["salaryHourly", "workHours"], imageSpecs: [] };
  const prevSameCond = { patternId: "P-COND", paletteId: "cond-1", conditionTags: ["women", "beauty", "part-time", "age-30s"] };
  const dAllow = deriveLpDesign(womenBeauty, { previous: prevSameCond });
  expectTrue("color-similar-conditions-allowed", dAllow.colorCheck && dAllow.colorCheck.similarityAllowed === true && dAllow.colorCheck.pass);
  const prevDiffCond = { patternId: "P-COND", paletteId: "cond-1", conditionTags: ["manufacturing", "full-time"] };
  const dBlock = deriveLpDesign(womenBeauty, { previous: prevDiffCond });
  expectTrue("color-unconditional-sameness-blocked", dBlock.colorCheck && dBlock.colorCheck.similarityAllowed === false && dBlock.paletteId !== "cond-1");
}

// ---------- pagecheck: fact values repeated by the apparatus are not duplication (loop-027, I-11) ----------
{
  const { checkPage } = await import("./pagecheck.mjs");
  const loc = "A cosmetics studio in Shimokitazawa, Tokyo, 3 minutes from the station";
  const pageOk = `<html><body><div class="card">${loc}</div><table><tr><td>${loc}</td></tr></table><p class="lp-sentence">Packing handmade soaps for shipping.</p></body></html>`;
  const r1 = checkPage(pageOk, { factValues: [loc] });
  expect("pagecheck-factvalue-exempt", r1.summary.duplicateGroups, 0);
  const dupSentence = "Packing handmade soaps for shipping at the studio.";
  const pageBad = `<html><body><p>${dupSentence}</p><p>${dupSentence}</p><div>${loc}</div></body></html>`;
  const r2 = checkPage(pageBad, { factValues: [loc] });
  expect("pagecheck-sentence-dup-still-fails", r2.summary.duplicateGroups, 1);
}

// ---------- planning draft validation (loop-027, I-2) ----------
{
  const { validateDraft } = await import("./draft-planning.mjs");
  const factsD = { items: [
    { key: "salaryHourly", status: "stated", value: "時給1,200円", normalized: 1200, sourceLine: "L03" },
    { key: "workHours", status: "stated", value: "09:30-15:30", normalized: null, sourceLine: "L04" },
    { key: "housing", status: "unstated", value: null, normalized: null, sourceLine: null },
  ] };
  const originalD = { lines: [{ id: "L01", text: "Work: packing cosmetics" }, { id: "L03", text: "Pay: hourly 1,200 yen" }, { id: "L04", text: "Hours: 09:30-15:30" }] };
  const goodDraft = {
    audience: "Near the station, school-hours shifts",
    appeals: [{ id: "A1", text: "Packing handmade cosmetics", factKeys: [], sourceLines: ["L01"] }, { id: "A2", text: "Hourly wage 1,200 yen", factKeys: ["salaryHourly"], sourceLines: ["L03"] }],
    firstCheckKeys: ["salaryHourly", "workHours"],
    notSay: [{ key: "housing", text: "Housing is not stated" }],
    imageSpecs: [
      { id: "key-visual", role: "key-visual", description: "Packing cosmetics at a work table", basis: { appealId: "A1" } },
      { id: "section-work", role: "work", description: "Hands packing soap boxes", basis: { factKey: "salaryHourly" } },
    ],
  };
  expectTrue("draft-grounded-passes", validateDraft(goodDraft, factsD, originalD).ok);
  const badDraft = JSON.parse(JSON.stringify(goodDraft));
  badDraft.appeals[1].factKeys = ["housing"];
  expectTrue("draft-unstated-key-fails", !validateDraft(badDraft, factsD, originalD).ok);
  const badChecks = JSON.parse(JSON.stringify(goodDraft));
  badChecks.firstCheckKeys = ["housing", "workHours"];
  expectTrue("draft-firstcheck-unstated-fails", !validateDraft(badChecks, factsD, originalD).ok);
}

// ---------- pay display: the monthly income example (user decision, 2026-11-04) ----------
{
  const { monthlyIncomeExample } = await import("./page-layout.mjs");
  const mkFacts = (items) => ({ items: items.map(([key, value, normalized]) => ({ key, status: "stated", value, normalized, sourceLine: "L01" })) });
  const hourly = monthlyIncomeExample(mkFacts([["salaryHourly", "時給1,350円", 1350], ["actualHours", "8時間", 8], ["monthlyDaysAssumption", "月20日勤務", null]]));
  expect("pay-example-hourly", hourly?.amount, 216000);
  const annual = monthlyIncomeExample(mkFacts([["salaryAnnual", "年俸246万円", 2460000]]));
  expect("pay-example-annual", annual?.amount, 205000);
  const noDays = monthlyIncomeExample({ items: [
    { key: "salaryHourly", status: "stated", value: "時給1,350円", normalized: 1350, sourceLine: "L01" },
    { key: "actualHours", status: "stated", value: "8時間", normalized: 8, sourceLine: "L01" },
    { key: "monthlyDaysAssumption", status: "unstated", value: null, normalized: null, sourceLine: null },
  ] });
  expect("pay-example-no-assumption-no-example", noDays, null);
  const factsPay = { items: [
    { key: "salaryHourly", status: "stated", value: "時給1,350円", normalized: 1350, sourceLine: "L04" },
    { key: "actualHours", status: "stated", value: "実働8時間", normalized: 8, sourceLine: "L04" },
    { key: "monthlyDaysAssumption", status: "stated", value: "月20日勤務", normalized: null, sourceLine: "L04" },
  ] };
  const originalPay = { lines: [{ id: "L04", text: "給与は時給1,350円、実働8時間、月20日勤務。" }] };
  const genExample = { sentences: [{ text: "時給1,350円、実働8時間、月20日勤務の試算で、月収例は約216,000円です。※残業・夜勤・各種手当は含みません", factKeys: ["salaryHourly", "actualHours", "monthlyDaysAssumption"], sourceLines: ["L04"] }] };
  expectTrue("pay-example-grounded", checkGrounding(genExample, factsPay, originalPay).pass);
  const genWrong = { sentences: [{ text: "時給1,350円、実働8時間、月20日勤務の試算で、月収例は約250,000円です", factKeys: ["salaryHourly", "actualHours", "monthlyDaysAssumption"], sourceLines: ["L04"] }] };
  expectTrue("pay-example-wrong-amount-fails", !checkGrounding(genWrong, factsPay, originalPay).pass);
}

// ---------- grounding: yen amounts in cited materials are grounded (FICT-J03) ----------
{
  const { checkGrounding } = await import("./generate.mjs");
  const factsJ = { items: [
    { key: "housing", status: "stated", value: "独身寮があります（月額15,000円）", normalized: null, sourceLine: "L09" },
    { key: "salaryHourly", status: "unstated", value: null, normalized: null, sourceLine: null },
  ] };
  const originalJ = { lines: [
    { id: "L04", text: "給与: 月給205,000円から。残業代は別途支給します。" },
    { id: "L09", text: "住宅: 独身寮があります（月額15,000円）" },
  ] };
  const okGen = { sentences: [
    { text: "月給は205,000円からです。", factKeys: [], sourceLines: ["L04"] },
    { text: "独身寮は月額15,000円です。", factKeys: ["housing"], sourceLines: ["L09"] },
  ] };
  expectTrue("grounding-yen-in-cited-materials-passes", checkGrounding(okGen, factsJ, originalJ).pass);
  const badGen = { sentences: [
    { text: "月給は300,000円です。", factKeys: [], sourceLines: ["L04"] },
  ] };
  expectTrue("grounding-yen-from-nowhere-fails", !checkGrounding(badGen, factsJ, originalJ).pass);
}

// ---------- assembly: the title is the job itself; every image band carries text (run25 verdict) ----------
{
  const { assembleFromLayout } = await import("./assemble-layout.mjs");
  const rootC = makeScratch();
  mkdirSync(path.join(rootC, "images"), { recursive: true });
  writeFileSync(path.join(rootC, "images", "section-work.webp"), "x");
  writeFileSync(path.join(rootC, "images", "appeal-A9.webp"), "x");
  const genC = { sentences: [
    { text: "物流倉庫での仕分け・検品作業です。", factKeys: [], sourceLines: ["L01"] },
    { text: "交通費は月上限15,000円まで支給されます。", factKeys: ["transportCap"], sourceLines: ["L07"] },
    { text: "勤務地は愛知県豊橋市内の物流倉庫です。", factKeys: ["workLocation"], sourceLines: ["L02"] },
  ] };
  const planningC = { appeals: [
    { id: "A1", factKeys: ["salaryHourly"], sourceLines: ["L03"] },
    { id: "A9", factKeys: ["transportCap"], sourceLines: ["L07"] },
  ] };
  const factsC = { items: [
    { key: "salaryHourly", status: "stated", value: "1,500円" },
    { key: "transportCap", status: "stated", value: "15,000円" },
    { key: "workLocation", status: "stated", value: "愛知県豊橋市内の物流倉庫" },
  ] };
  const layoutC = { messageMap: [
    { block: "title", carries: { workContent: true, appealId: "A1" } },
    { block: "condition-card", carries: { factKey: "transportCap", appealId: "A9" } },
    { block: "photo-band", carries: { specId: "section-work", basis: { factKey: "workLocation" } } },
    { block: "photo-band", carries: { specId: "appeal-A9", basis: { appealId: "A9" } } },
    { block: "cta", carries: { action: true } },
  ] };
  const builtC = assembleFromLayout({ root: rootC, generation: genC, images: [{ id: "section-work", file: "images/section-work.webp" }, { id: "appeal-A9", file: "images/appeal-A9.webp" }], lpDir: "out", heroChips: [], layout: layoutC, planning: planningC, facts: factsC });
  const titleSeg = builtC.html.slice(builtC.html.indexOf(`<section class="title-block">`), builtC.html.indexOf(`<section class="title-block">`) + 300);
  expectTrue("assembly-title-is-work-content", titleSeg.includes("物流倉庫での仕分け・検品作業です。"));
  expectTrue("assembly-work-band-has-text", builtC.html.includes("勤務地は愛知県豊橋市内の物流倉庫です。"));
  expectTrue("assembly-band-not-card-carries-appeal-sentence", (builtC.html.match(/交通費は月上限15,000円まで支給されます。/g) ?? []).length === 1 && builtC.html.indexOf("交通費は月上限15,000円まで支給されます。") > builtC.html.indexOf("appeal-A9.webp"));
  expectTrue("assembly-no-mute-band", (builtC.html.match(/<div class="explain-text">/g) ?? []).length === 2);
}

// ---------- per-endpoint keys (liveDeps stage envs) ----------
{
  const seen = [];
  const probeDeps = liveDeps({
    root: makeScratch(), outDir: "out", generationFile: "out/generated.json",
    run: async (args, env) => { seen.push({ script: path.basename(args[0]), env }); return { exitCode: 1, stdout: "", stderr: "" }; },
    textApiKey: "TEXTKEY", imageApiKey: "IMAGEKEY",
  });
  await probeDeps.extract({});
  await probeDeps.keyVisualPhotos({ photoPlan: [], imagesDir: "out/images" }).catch(() => {});
  const textEnv = seen.find((x) => x.script === "extract-and-check.mjs")?.env ?? {};
  const imageEnv = seen.find((x) => x.script === "generate-images.mjs")?.env ?? {};
  expectTrue("keys-text-child-gets-only-text-key", textEnv.MODEL_API_KEY === "TEXTKEY" && !("BASETEN_API_KEY" in textEnv));
  expectTrue("keys-image-child-gets-only-image-key", imageEnv.MODEL_API_KEY === "IMAGEKEY" && !("BASETEN_API_KEY" in imageEnv));
}

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
expectTrue("lp-assembled-from-confirmed-layout", runD.stages.lpAssembly.layoutUsed === true);
expectTrue("lp-appeal-coverage-recorded", Array.isArray(runD.stages.lpAssembly.appealCoverage) && runD.stages.lpAssembly.appealCoverage.every((c) => c.sentenceIdxs.length > 0));
expectTrue("lp-presentation-saved", existsSync(path.join(scratchA, "out/presentation-lp.json")));
{
  // The header is one unit: the title band renders inside the hero
  // section (header = the face of the appeal, 2026-11-04).
  const order = ['<section class="lp-hero">', '<div class="title-block">', '<section class="cards">', '<footer class="cta">'].map((m) => lpHtml.indexOf(m));
  expectTrue("lp-block-order-matches-sample", order.every((v) => v >= 0) && order[0] < order[1] && order[1] < order[2] && order[2] < order[3]);
  expectTrue("lp-skin-matches-sample", lpHtml.includes(".page{max-width:480px;margin:0 auto;background:#fff}") && !lpHtml.includes("border-radius:26px"));
  expectTrue("lp-design-tokens", lpHtml.includes("grid-template-columns:1fr 1fr") && lpHtml.includes(".card:last-child:nth-child(odd){grid-column:1/-1}") && lpHtml.includes("font-size:26px") && lpHtml.includes("aspect-ratio:16/10") && lpHtml.includes("aspect-ratio:4/3"));
}
expect("resume-status", runD.status, "pending-human-confirmation");

// ---------- review gate: a failing review sends back once, then stops the run ----------
const scratchRV = makeScratch();
const runRV0 = await runDemo(
  { root: scratchRV, ...REAL, checkpoints: "light" },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
const stateRV = JSON.parse(readFileSync(path.join(scratchRV, "out/run-state.json"), "utf8"));
const confRV = { file: stateRV.keyVisual.image.file, sha256: stateRV.keyVisual.image.sha256, confirmer: "本人", confirmedAt: "2026-11-03" };
let reviewCallsVF = 0;
let generateCallsVF = 0;
const runRVF = await runDemo(
  { root: scratchRV, ...REAL, checkpoints: "light", resumeState: stateRV, kvConfirmation: confRV },
  { extract: async () => faithfulExtract(), generate: async (a) => { generateCallsVF++; return faithfulGenerate()(a); }, ...stubKeyVisualDeps(), images: stubImages(),
    review: async ({ mode }) => { if (mode !== "page") return { status: "reviewed", verdict: "pass", findings: [], model: "stub", promptVersion: "lp-review-v2" }; reviewCallsVF++; return { status: "reviewed", verdict: "fail", findings: [{ criterion: "appeal-works", target: "all sentences", problem: "事実の言い換えだけで訴求になっていない", instruction: "事実と読み手をつないで書き直す" }], model: "stub", promptVersion: "lp-review-v2" }; } },
);
expect("review-fail-stops-run", runRVF.stoppedAt, "review");
expectTrue("review-fail-attempts-two", runRVF.stages.review.attempts === 2 && reviewCallsVF === 2);
expectTrue("review-sendback-regenerated", generateCallsVF >= 2 && runRVF.stages.review.sendBacks.length === 1);
// ---------- review gate: fail once, pass after the send-back ----------
let reviewCallsVP = 0;
const runRVP = await runDemo(
  { root: scratchRV, ...REAL, checkpoints: "light", resumeState: stateRV, kvConfirmation: confRV },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages(),
    review: async ({ mode }) => { if (mode !== "page") return { status: "reviewed", verdict: "pass", findings: [], model: "stub", promptVersion: "lp-review-v2" }; reviewCallsVP++; return reviewCallsVP === 1 ? { status: "reviewed", verdict: "fail", findings: [{ criterion: "job-first", target: "title", problem: "見出しが条件だけ", instruction: "仕事そのものを見出しにする" }], model: "stub", promptVersion: "lp-review-v2" } : { status: "reviewed", verdict: "pass", findings: [], model: "stub", promptVersion: "lp-review-v2" }; } },
);
expect("review-pass-after-sendback-status", runRVP.status, "pending-human-confirmation");
expectTrue("review-pass-after-sendback-recorded", runRVP.stages.review.verdict === "pass" && runRVP.stages.review.attempts === 2 && runRVP.stages.review.sendBacks.length === 1);
// ---------- planning review gate: a failing plan stops before the key visual ----------
{
  const scratchPV = makeScratch();
  const runPV = await runDemo(
    { root: scratchPV, ...REAL, checkpoints: "light" },
    { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages(),
      review: async ({ mode }) => mode === "planning" ? { status: "reviewed", verdict: "fail", findings: [{ criterion: "decision-order", target: "firstCheckKeys", problem: "読み手が最初に確認する条件と合っていない", instruction: "最初に確認する条件を見直す" }], model: "stub", promptVersion: "lp-review-v2" } : { status: "reviewed", verdict: "pass", findings: [], model: "stub", promptVersion: "lp-review-v2" } },
  );
  expect("planning-review-fail-stops", runPV.stoppedAt, "planning-review");
  expectTrue("planning-review-recorded", runPV.stages.planning.review.verdict === "fail");
}
// ---------- copy review gate: failing copy retries within the bound, then stops ----------
{
  const scratchCV = makeScratch();
  const runCV0 = await runDemo(
    { root: scratchCV, ...REAL, checkpoints: "light" },
    { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
  );
  const stateCV = JSON.parse(readFileSync(path.join(scratchCV, "out/run-state.json"), "utf8"));
  const confCV = { file: stateCV.keyVisual.image.file, sha256: stateCV.keyVisual.image.sha256, confirmer: "本人", confirmedAt: "2026-11-03" };
  let copyCalls = 0;
  const runCV = await runDemo(
    { root: scratchCV, ...REAL, checkpoints: "light", resumeState: stateCV, kvConfirmation: confCV },
    { extract: async () => faithfulExtract(), generate: async (a) => { copyCalls++; return faithfulGenerate()(a); }, ...stubKeyVisualDeps(), images: stubImages(),
      review: async ({ mode }) => mode === "copy" ? { status: "reviewed", verdict: "fail", findings: [{ criterion: "appeal-works", target: "sentences", problem: "言い換えだけ", instruction: "読み手につなぐ" }], model: "stub", promptVersion: "lp-review-v2" } : { status: "reviewed", verdict: "pass", findings: [], model: "stub", promptVersion: "lp-review-v2" } },
  );
  expect("copy-review-fail-stops-at-generation", runCV.stoppedAt, "generation");
  expectTrue("copy-review-retried-to-bound", copyCalls === 3 && runCV.stages.generation.review.verdict === "fail");
}
// ---------- boilerplate scan overrides a judge pass (loop-025) ----------
// run26's lesson: a judge passed copy whose sentences all closed
// with boilerplate requests. The researched-pattern scan is
// deterministic: judge pass + boilerplate hits = fail, retry, stop.
{
  const scratchBP = makeScratch();
  await runDemo(
    { root: scratchBP, ...REAL, checkpoints: "light" },
    { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
  );
  const stateBP = JSON.parse(readFileSync(path.join(scratchBP, "out/run-state.json"), "utf8"));
  const confBP = { file: stateBP.keyVisual.image.file, sha256: stateBP.keyVisual.image.sha256, confirmer: "本人", confirmedAt: "2026-11-03" };
  let genCallsBP = 0;
  const boilerGenerate = async (a) => {
    genCallsBP++;
    const r = await faithfulGenerate()(a);
    if (r && r.generation && Array.isArray(r.generation.sentences) && r.generation.sentences[0]) {
      r.generation.sentences[0] = { ...r.generation.sentences[0], text: String(r.generation.sentences[0].text).replace(/。?$/, "をご確認ください。") };
    }
    return r;
  };
  const runBP = await runDemo(
    { root: scratchBP, ...REAL, checkpoints: "light", resumeState: stateBP, kvConfirmation: confBP },
    { extract: async () => faithfulExtract(), generate: boilerGenerate, ...stubKeyVisualDeps(), images: stubImages(),
      review: async () => ({ status: "reviewed", verdict: "pass", findings: [], model: "stub", promptVersion: "lp-review-v3" }) },
  );
  expect("boilerplate-override-stops", runBP.stoppedAt, "generation");
  expectTrue("boilerplate-override-retried", genCallsBP === 3);
  expectTrue("boilerplate-override-recorded", runBP.stages.generation.review.verdict === "fail");
}
// ---------- review module: outline / parse / feedback ----------
{
  const { pageOutlineFromHtml, parseReview, reviewFeedbackText, boilerplateHits } = await import("./review.mjs");
  expectTrue("boilerplate-scan-catches-closings", boilerplateHits([{ text: "時給は1,350円です。ご確認のうえご検討ください。" }, { text: "土日祝日はお休みです。" }]).length === 1);
  expectTrue("boilerplate-scan-exempts-unstated", boilerplateHits([{ text: "更新の有無は未記載です。お気軽にお問い合わせください。" }]).length === 0);
  const outline = pageOutlineFromHtml(`<main><section class="lp-hero"><img src="images/hero.webp" alt=""><div class="hero-chips"><span class="hero-chip">時給1,350円</span></div></section><section class="title-block"><p>時給は1,350円です。</p></section><section class="explain-row"><img class="inline-photo" src="images/section-work.webp" alt=""></section></main><footer class="cta"><button class="cta-button" type="button">応募する</button></footer>`, { "hero.webp": "workers sorting parcels", "section-work.webp": "a worker at a conveyor" });
  expectTrue("review-outline-blocks", outline.length === 4 && outline[0].chips[0] === "時給1,350円" && outline[2].images[0].shows === "a worker at a conveyor" && outline[2].text === "");
  expectTrue("review-parse-pass", parseReview('{"verdict":"pass","findings":[]}').verdict === "pass");
  expectTrue("review-parse-fail-needs-findings", parseReview('{"verdict":"fail","findings":[]}') === null);
  const fb = reviewFeedbackText({ findings: [{ criterion: "appeal-works", target: "A1", problem: "p", instruction: "読み手につなぐ" }] });
  expectTrue("review-feedback-text", fb.includes("appeal-works") && fb.includes("読み手につなぐ"));
}

// ---------- generation coverage: every appeal must be carried ----------
function partialGenerate() {
  return async (args) => {
    const result = await runGeneration({
      ...args,
      callModel: async () => ({ content: JSON.stringify({ sentences: [faithfulSentences[0]] }), usage: { prompt_tokens: 10, completion_tokens: 10 }, model: "stub" }),
    });
    if (result.generation) {
      writeFileSync(path.join(args.root, REAL.generationFile), JSON.stringify(result.generation, null, 2) + "\n", "utf8");
    }
    return result;
  };
}
{
  // attempt 1 drops appeal A2 (grounding still passes); the coverage
  // check sends it back with feedback and attempt 2 covers everything.
  let calls = 0;
  const seqGenerate = async (args) => { calls++; return calls === 1 ? partialGenerate()(args) : faithfulGenerate()(args); };
  const runCov = await runDemo(
    { root: scratchA, ...REAL, checkpoints: "light", resumeState: stateA, kvConfirmation: confirmation },
    { extract: async () => faithfulExtract(), generate: seqGenerate, ...stubKeyVisualDeps(), images: stubImages() },
  );
  expect("coverage-retry-attempts", runCov.stages.generation.attempts, 2);
  expectTrue("coverage-retry-pass", runCov.stages.generation.coverage?.pass === true);
  expectTrue("coverage-feedback-written", existsSync(path.join(scratchA, "out/coverage-feedback.txt")) && readFileSync(path.join(scratchA, "out/coverage-feedback.txt"), "utf8").includes("A2"));
  // a generation that never covers the appeal stops the run
  const runCovFail = await runDemo(
    { root: scratchA, ...REAL, checkpoints: "light", resumeState: stateA, kvConfirmation: confirmation },
    { extract: async () => faithfulExtract(), generate: partialGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
  );
  expect("coverage-fail-stops", runCovFail.stoppedAt, "generation");
  expectTrue("coverage-fail-recorded", (runCovFail.stages.generation.coverage?.uncoveredAppeals ?? []).includes("A2"));
}
{
  // the planning-path prompt carries the appeals and the original's
  // lines, and none of the other posting's hardcoded passages
  const msgs = buildPlanningGenerationMessages(fixtureFacts(), JSON.parse(readFileSync(path.join(root, REAL.originalFile), "utf8")), planning, intentFromPlanning(planning, null));
  expectTrue("planning-prompt-has-appeals", msgs[0].content.includes("A1") && msgs[0].content.includes("A2"));
  expectTrue("planning-prompt-has-original-lines", msgs[1].content.includes("L03"));
  expectTrue("planning-prompt-no-j01-leftovers", !msgs[0].content.includes("Softened monthly-income") && !msgs[0].content.includes("W1 renewal"));
{
  // a sentence grounded only in an original line (the FACT schema
  // carries no key for holidays) passes grounding; a sentence with
  // no citation at all does not
  const lineOnly = { sentences: [{ text: "休日は土日祝日休みです。", factKeys: [], sourceLines: ["L06"] }] };
  const factsJ02Like = { items: [{ key: "salaryHourly", status: "stated", value: "1,350円", normalized: 1350, sourceLine: "L04" }] };
  const origJ02Like = { lines: [{ id: "L04", text: "時給： 1,350円" }, { id: "L06", text: "休日： 土日祝日休み" }] };
  expectTrue("grounding-line-only-passes", checkGrounding(lineOnly, factsJ02Like, origJ02Like).pass);
  const noCite = { sentences: [{ text: "休日は土日祝日休みです。", factKeys: [], sourceLines: [] }] };
  expectTrue("grounding-no-citation-fails", !checkGrounding(noCite, factsJ02Like, origJ02Like).pass);
}
}

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
const { assembleFromLayout: assembleFromLayoutForStub } = await import("./assemble-layout.mjs");
const flakyAssemble = async (args) => {
  assembleAttempts += 1;
  if (assembleAttempts < 3) throw new Error("stub write failure");
  // Mirror the runner's default assembly: with a confirmed layout
  // the page is built from it (the job-details table included, C7);
  // the legacy builder is only the no-layout fallback.
  const built = args.layout
    ? assembleFromLayoutForStub({ root: args.root, generation: args.generation, images: args.images, lpDir: path.dirname(args.lpFile), heroChips: args.heroChips, layout: args.layout, planning: args.planning, facts: args.facts })
    : assembleLP({ root: args.root, generation: args.generation, images: args.images, lpDir: path.dirname(args.lpFile), heroChips: args.heroChips });
  writeFileSync(path.join(args.root, args.lpFile), built.html, "utf8");
  return { file: args.lpFile, referenced: built.referenced, skipped: built.skipped, assignments: built.assignments ?? null };
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

// ---------- Finished-image gate: a page that fails is not presented ----------
expectTrue("gate-pass", evaluateFinishedImageGate({ audience: "x", messageGaps: [], design: { patternId: "P-COND", rationale: "r" }, form: { personaBasis: { audience: "x", decisionOrder: ["hero"] } }, photos: [{ id: "a", role: "key-visual" }], imageDesign: [{ id: "a", purpose: "p", aspect: "5:3", placement: "hero", size: "large", depiction: "photorealistic" }] }).pass);
expectTrue("gate-blocks-no-design", !evaluateFinishedImageGate({ audience: "x", messageGaps: [], form: { personaBasis: { audience: "x", decisionOrder: ["hero"] } }, photos: [{ id: "a", role: "key-visual" }], imageDesign: [{ id: "a", purpose: "p", aspect: "5:3", placement: "hero", size: "large", depiction: "photorealistic" }] }).pass);
{
  // design derivation: different plannings yield different designs
  const dCond = deriveLpDesign(planning);
  expect("design-j02-pattern", dCond.patternId, "P-COND");
  const workPlanning = { ...planning, firstCheckKeys: [], appeals: [{ id: "A1", text: "仕事内容は小さな部品を組み立てる作業で、手作業が中心です", factKeys: ["workLocation"], sourceLines: ["L01"] }], imageSpecs: [{ id: "w", role: "work" }] };
  const dWork = deriveLpDesign(workPlanning);
  expect("design-work-pattern", dWork.patternId, "P-WORK");
  expectTrue("design-orders-differ", dWork.blockOrder.join(",") !== dCond.blockOrder.join(","));
  const lifePlanning = { ...planning, firstCheckKeys: [], appeals: [{ id: "A1", text: "土日祝休みで週末は家族と過ごせます", factKeys: [], sourceLines: ["L06"] }, { id: "A2", text: "通勤は電車が便利です", factKeys: [], sourceLines: ["L07"] }] };
  expect("design-life-pattern", deriveLpDesign(lifePlanning).patternId, "P-LIFE");
  // The color rule (D15): when the previous production used the same
  // pattern, the palette changes to the next variant.
  expect("color-default-first-variant", dWork.paletteId, "work-1");
  const dVaried = deriveLpDesign(workPlanning, { previous: { patternId: "P-WORK", paletteId: "work-1" } });
  expect("color-varied-next-variant", dVaried.paletteId, "work-2");
  expectTrue("color-varied-differs", dVaried.palette.titleBg !== dWork.palette.titleBg);
  expect("color-cycle-wraps", deriveLpDesign(workPlanning, { previous: { patternId: "P-WORK", paletteId: "work-3" } }).paletteId, "work-1");
  expect("color-other-pattern-default", deriveLpDesign(workPlanning, { previous: { patternId: "P-COND", paletteId: "cond-1" } }).paletteId, "work-1");
}
expectTrue("gate-fails-no-audience", !evaluateFinishedImageGate({ audience: null, messageGaps: [], photos: [], imageDesign: [] }).pass);
expectTrue("gate-fails-gap", !evaluateFinishedImageGate({ audience: "x", messageGaps: [{ appealId: "A9" }], photos: [], imageDesign: [] }).pass);
expectTrue("gate-fails-undesigned-photo", !evaluateFinishedImageGate({ audience: "x", messageGaps: [], photos: [{ id: "a" }], imageDesign: [] }).pass);
const scratchG = makeScratch();
{
  const p = JSON.parse(readFileSync(path.join(scratchG, "out/planning.json"), "utf8"));
  p.appeals.push({ id: "AX", text: "ungrounded appeal", factKeys: [], sourceLines: [] });
  writeFileSync(path.join(scratchG, "out/planning.json"), JSON.stringify(p, null, 2) + "\n", "utf8");
}
const runG = await runDemo(
  { root: scratchG, ...REAL, checkpoints: "light" },
  { extract: async () => faithfulExtract(), generate: faithfulGenerate(), ...stubKeyVisualDeps(), images: stubImages() },
);
expect("gate-fail-stops-at-kv", runG.stoppedAt, "key-visual");
expect("gate-fail-not-a-checkpoint", runG.status, "stopped");
expectTrue("gate-fail-recorded", (runG.stages.keyVisual.gate && runG.stages.keyVisual.gate.pass === false) || (runG.stages.keyVisual.designCheck && runG.stages.keyVisual.designCheck.pass === false));
expectTrue("gate-fail-not-presented", !existsSync(path.join(scratchG, "out/presentation-key-visual.json")));

// ---------- Image design step (loop-023) ----------
const designJ01 = buildImageDesign(planning, facts);
expect("design-count", designJ01.count, planning.imageSpecs.length);
expectTrue("design-hero-photorealistic", designJ01.images.find((e) => e.kind === "hero")?.depiction === "photorealistic");
expectTrue("design-hero-subject-from-work-spec", (designJ01.images.find((e) => e.kind === "hero")?.subject ?? "").includes("assembling small wheels") && designJ01.designNotes.some((n) => n.action === "subject-from-work-spec"));
expectTrue("design-hero-subject-not-exterior", !/exterior|facade|外観/i.test(designJ01.images.find((e) => e.kind === "hero")?.subject ?? ""));
expectTrue("design-exterior-replacement-noted", (designJ01.designNotes ?? []).some((n) => n.rule === "G9" && n.action === "subject-replaced"));
// run20 review: the composition text itself instructed an exterior
// ("the workplace building itself is the subject") and the shipped LP
// hero became an invented warehouse exterior while every check
// passed. The full prompt is gated now, not only the subject.
expectTrue("design-hero-prompt-has-no-exterior-instruction", !/building|exterior|facade/i.test(designJ01.images.find((e) => e.kind === "hero")?.prompt ?? ""));
{
  const designPoisoned = JSON.parse(JSON.stringify(designJ01));
  const heroEntry = designPoisoned.images.find((e) => e.kind === "hero");
  heroEntry.prompt = `${heroEntry.subject}. Wide establishing shot; the workplace building itself is the subject. flat vector-style illustration, no text`;
  expectTrue("design-check-blocks-exterior-in-prompt", !checkImageDesign(designPoisoned).pass);
}
{
  const { buildKeyVisualChecklist } = await import("./planning.mjs");
  const corrStale = { elements: [{ id: "key-visual", role: "key-visual", basis: {}, description: "Photorealistic photo of the exterior of a large logistics warehouse" }] };
  const listFromDesign = buildKeyVisualChecklist(corrStale, designJ01);
  expectTrue("kv-checklist-uses-design-subjects", listFromDesign.length === designJ01.images.length && listFromDesign.every((i) => !/exterior/i.test(i.description ?? "")));
}
{
  const designW = buildImageDesign({ ...planning, imageSpecs: [], appeals: [{ id: "AW", factKeys: [], sourceLines: ["L06"], text: "土日祝休みで、週末は家族と過ごせます。" }] }, facts);
  // Researched composition (loop-025): a condition appeal gets no
  // lifestyle scene image; the no-image decision is on record.
  expectTrue("design-appeal-no-lifestyle-image", !designW.images.some((i) => i.appealId === "AW") && designW.noImage.some((n) => n.appealId === "AW"));
  const designExt = JSON.parse(JSON.stringify(designJ01));
  designExt.images[0].subject = "A warehouse exterior at dawn";
  expectTrue("design-check-blocks-exterior-subject", !checkImageDesign(designExt).pass);
}
{
  // Depiction policy (user decision 2026-11-04, D13): photorealistic
  // is the designed depiction for every role; what the design check
  // blocks is an exterior subject/prompt (G9) and a large explanatory
  // placement (G6), not the style.
  const designPhoto = JSON.parse(JSON.stringify(designJ01));
  designPhoto.images[0].depiction = "photorealistic";
  expectTrue("design-check-allows-photorealistic", checkImageDesign(designPhoto).pass);
}
expectTrue("design-explanatory-photorealistic-small", designJ01.images.filter((e) => e.kind !== "hero").every((e) => e.depiction === "photorealistic" && e.placement.size === "small"));
expectTrue("design-every-image-has-purpose", designJ01.images.every((e) => typeof e.purpose === "string" && e.purpose.length > 0));
expectTrue("design-check-pass", checkImageDesign(designJ01).pass);
const designBad = JSON.parse(JSON.stringify(designJ01));
designBad.images.find((e) => e.kind !== "hero").placement.size = "large";
expectTrue("design-check-blocks-large-explanatory", !checkImageDesign(designBad).pass);
const designNoPurpose = JSON.parse(JSON.stringify(designJ01));
designNoPurpose.images[0].purpose = null;
expectTrue("design-check-blocks-purposeless", !checkImageDesign(designNoPurpose).pass);
expectTrue("prompt-gate-blocks-truck-subject", !checkPromptGates("A large truck in front of a warehouse. Wide shot. photorealistic, no text").pass);
expectTrue("prompt-gate-allows-building-subject", checkPromptGates("A warehouse building exterior in the morning. Wide establishing shot. photorealistic, no text").pass);
{
  const entry = designJ01.images.find((e) => e.kind === "hero");
  const doctored = { ...entry, subject: "A warehouse exterior, with a truck parked in front", prompt: "" };
  doctored.prompt = `${doctored.subject}. ${doctored.composition}. ${doctored.styleText}, no text, no numbers, no logos, no watermark`;
  const rebuilt = rebuildPromptWithoutHits(doctored, ["truck"]);
  expectTrue("sendback-removes-hit-clause", rebuilt.removed.length === 1 && checkPromptGates(rebuilt.entry.prompt).pass);
}
// run21: the design itself must pass the prompt gates, the transport
// scene must not name a vehicle, and a send-back that would leave
// only a mood fragment falls back to a real scene.
{
  const designTrain = JSON.parse(JSON.stringify(designJ01));
  const sec = designTrain.images.find((e) => e.kind !== "hero");
  sec.subject = "An illustration of a person commuting on a local train in the morning";
  sec.prompt = `${sec.subject}. ${sec.composition}. ${sec.styleText}, no text, no numbers, no logos, no watermark`;
  expectTrue("design-check-blocks-gated-prompt", !checkImageDesign(designTrain).pass);
  const transportPlanning = { ...planning, firstCheckKeys: ["transportCap"], appeals: [...planning.appeals, { id: "AT", factKeys: ["transport"], sourceLines: ["L07"], text: "交通費は実費支給です" }] };
  const designT = buildImageDesign(transportPlanning, facts);
  // Researched composition (loop-025): the transport appeal gets no
  // image at all — no scene can imply a commute method the posting
  // does not state (the run28 sample review failed exactly that).
  expectTrue("design-transport-appeal-has-no-image", !designT.images.some((e) => e.appealId === "AT") && designT.noImage.some((n) => n.appealId === "AT") && checkImageDesign(designT, transportPlanning).pass);
}
{
  // Cognitive-load judgement (user principle, 2026-11-04): a strong
  // benefit earns a work-anchored image; the header records which
  // appeal it fronts and its focus.
  const { appealImageDecision, headerFocusOf } = await import("./image-design.mjs");
  const strong = appealImageDecision({ id: "AS", factKeys: ["transport"], sourceLines: ["L07"], text: "交通費全額支給です" }, facts);
  expectTrue("design-strong-benefit-earns-image", strong.image === true && strong.kind === "strong-benefit");
  const capped = appealImageDecision({ id: "AC", factKeys: ["transport"], sourceLines: ["L07"], text: "交通費は実費支給（月上限あり）です" }, facts);
  expectTrue("design-capped-cost-stays-text", capped.image === false);
  const strongPlanning = { ...planning, firstCheckKeys: ["salaryHourly"], appeals: [...planning.appeals, { id: "AS", factKeys: ["transport"], sourceLines: ["L07"], text: "交通費全額支給です" }] };
  const designS = buildImageDesign(strongPlanning, facts);
  const sImg = designS.images.find((e) => e.appealId === "AS");
  expectTrue("design-strong-benefit-image-is-work-anchored", !!sImg && !/train|bus|walk|commut/i.test(sImg.subject) && checkImageDesign(designS, strongPlanning).pass);
  const heroJ = designJ01.images.find((e) => e.kind === "hero");
  expectTrue("design-hero-fronts-lead-appeal", heroJ.frontsAppealId === planning.appeals[0].id && typeof heroJ.headerFocus === "string" && headerFocusOf(planning).appealId === planning.appeals[0].id);
}
{
  // Headline fallback: the work sentence tagged with fact keys
  // (English generation) still becomes the title.
  const { assembleFromLayout } = await import("./assemble-layout.mjs");
  const genW = { sentences: [
    { text: "Part-time café work: preparing drinks and serving customers.", factKeys: ["employmentType", "workLocation"], sourceLines: ["L01", "L02"] },
    { text: "Hourly wage: 1,150 yen.", factKeys: ["salaryHourly"], sourceLines: ["L04"] },
  ] };
  const planningW = { appeals: [{ id: "A1", factKeys: ["salaryHourly"], sourceLines: ["L04"], text: "wage" }], firstCheckKeys: ["salaryHourly"] };
  const layoutW = { messageMap: [
    { block: "title", carries: { workContent: true } },
    { block: "condition-card", carries: { factKey: "salaryHourly", appealId: "A1" } },
    { block: "details", carries: { factKeys: [], appealIds: [] } },
    { block: "cta", carries: { action: true } },
  ] };
  const builtW = assembleFromLayout({ root: makeScratch(), generation: genW, images: [], lpDir: "out", heroChips: [], layout: layoutW, planning: planningW, facts });
  expectTrue("assembly-title-fallback-finds-tagged-work-sentence", builtW.html.includes("title-block") && builtW.html.includes("Part-time café work") && builtW.html.indexOf("Part-time café work") < builtW.html.indexOf("Hourly wage"));
}
{
  // Headline, second fallback: the work itself is the lead appeal
  // and the key-visual spec fronts it (FICT-E02 shape).
  const { assembleFromLayout } = await import("./assemble-layout.mjs");
  const genX = { sentences: [
    { text: "Assembling wooden frames and sanding parts by hand.", factKeys: [], sourceLines: ["L01"] },
    { text: "Employment type is contract, 6 months.", factKeys: ["employmentType", "contractPeriod"], sourceLines: ["L03"] },
  ] };
  const planningX = { appeals: [
    { id: "A1", factKeys: [], sourceLines: ["L01"], text: "The work itself" },
    { id: "A2", factKeys: ["employmentType"], sourceLines: ["L03"], text: "contract" },
  ], firstCheckKeys: [], imageSpecs: [{ id: "key-visual", role: "key-visual", basis: { appealId: "A1" } }] };
  const layoutX = { messageMap: [
    { block: "title", carries: { workContent: true } },
    { block: "details", carries: { factKeys: ["employmentType", "contractPeriod"], appealIds: [] } },
    { block: "cta", carries: { action: true } },
  ] };
  const builtX = assembleFromLayout({ root: makeScratch(), generation: genX, images: [], lpDir: "out", heroChips: [], layout: layoutX, planning: planningX, facts });
  expectTrue("assembly-title-fallback-finds-appealed-work-sentence", builtX.html.includes("title-block") && builtX.html.indexOf("Assembling wooden frames") < builtX.html.indexOf("Employment type"));
  const frag = { id: "appeal-AT", kind: "section", subject: "An illustration of a person commuting on a local train in the morning, calm and unhurried", composition: "x", styleText: "y" };
  const rebuiltFrag = rebuildPromptWithoutHits(frag, ["train"]);
  expectTrue("sendback-fragment-falls-back-to-scene", rebuiltFrag.entry.subject !== "calm and unhurried" && /work/i.test(rebuiltFrag.entry.subject) && checkPromptGates(rebuiltFrag.entry.prompt).pass);
}
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
