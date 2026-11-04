// Step 5 (integrated run): run steps 1-4 as one execution for E01 and
// show E02 stopping at reconciliation. Fictional data only.
//
// The runner is thin: it creates no judgement of its own. Each stage's
// pass/fail is that stage tool's own output (reconciliation verdict,
// approval validity recomputation, generation input check and grounding,
// re-verification verdict). A later stage runs only when the earlier
// stage passed; on a stopping condition the later tools are not called
// and the stopped stage and reason are recorded. The automatic run goes
// up to the re-verification mechanical checks; while the verdict is
// pending-human-confirmation it never proceeds to preview (L-026).
// Extraction and generation are live (Meta Model API, key from env
// MODEL_API_KEY, never recorded). Approval is a human act and is never
// created here; the fixed FACT v1 approval record is only re-checked.

import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { checkApprovalValidity, sha256File } from "./approve.mjs";
import { checkQuoteVerbatim, loadOriginal } from "./extract-and-check.mjs";
import { checkGenerationInput, checkGrounding } from "./generate.mjs";
import { runVerification } from "./verify.mjs";
import { buildPreview } from "./build-preview.mjs";
import { checkPage } from "./pagecheck.mjs";
import { buildCorrespondence, buildImagePrompt, buildKeyVisualChecklist, checkPromptCompliance, sha256Text, validatePlanning } from "./planning.mjs";
import { buildFinishedImageHtml, evaluateFinishedImageGate } from "./page-layout.mjs";
import { deriveLpDesign } from "./lp-design.mjs";
import { buildImageDesign, checkImageDesign, checkPromptGates, promptGateResults, rebuildPromptWithoutHits } from "./image-design.mjs";
import { renderHtmlToImage } from "./render-page-image.mjs";
import { pinPostingText, buildFactsFile, buildManifest } from "./pin-posting.mjs";
import { decideImagePlanFromSpecs } from "./generate-images.mjs";
import { assembleFromLayout, matchAppealSentences } from "./assemble-layout.mjs";
import { reviewFeedbackText, sampleOutlineFromLayout, boilerplateHits } from "./review.mjs";

const execFileAsync = promisify(execFile);

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function normalizePath(p) {
  return p ? String(p).split(path.sep).join("/") : p;
}

function resolveRoot(root, p) {
  return path.isAbsolute(p) ? p : path.join(root, p);
}

function itemsByKey(facts) {
  return new Map((facts && Array.isArray(facts.items) ? facts.items : []).map((i) => [i.key, i]));
}

// Compare an extracted FACT candidate with the fixed FACT v1. Substantive
// disagreement (key set, status, normalized value, source line) stops
// the run, because approval stands only for the fixed pair. Wording and
// quote-granularity differences are recorded as textual diffs and do not
// stop the run (loop-006: granularity diffs left meaning, numbers and
// line correspondence intact).
export function compareFactSets(candidate, fixed) {
  const cand = itemsByKey(candidate);
  const fix = itemsByKey(fixed);
  const diffs = [];
  const textualDiffs = [];
  for (const key of new Set([...fix.keys(), ...cand.keys()])) {
    const f = fix.get(key);
    const c = cand.get(key);
    if (!f || !c) {
      // A key absent on one side and present-but-unstated on the
      // other carries the same information (none). Fact sets written
      // before a key existed (the pay keys added 2026-11-04) must
      // keep comparing equal to new extractions that list the key
      // as unstated; a stated value appearing or disappearing is
      // still a substantive diff.
      const present = f ?? c;
      if (present && present.status === "unstated") continue;
      diffs.push({ key, issue: !f ? "candidate has an extra key" : "candidate is missing the key" });
      continue;
    }
    if (c.status !== f.status) diffs.push({ key, field: "status", fixed: f.status, candidate: c.status });
    if (c.normalized !== f.normalized) diffs.push({ key, field: "normalized", fixed: f.normalized, candidate: c.normalized });
    // An empty string is the extraction model's spelling of "no
    // source reference" — normalize before comparing (runE2g).
    const normLine = (v) => (v === "" ? null : (v ?? null));
    if (normLine(c.sourceLine) !== normLine(f.sourceLine)) diffs.push({ key, field: "sourceLine", fixed: f.sourceLine, candidate: c.sourceLine });
    if (c.value !== f.value) textualDiffs.push({ key, field: "value", fixed: f.value, candidate: c.value });
    if (c.quote !== f.quote) textualDiffs.push({ key, field: "quote", fixed: f.quote, candidate: c.quote });
  }
  return { agrees: diffs.length === 0, diffs, textualDiffs };
}

// Approval stage: re-confirm the fixed approval record. The pass is the
// generation start condition itself (status approved with approver and
// approvedAt, plus checkApprovalValidity recomputed from current bytes),
// re-applied via checkGenerationInput; the validity recomputation is
// also recorded on its own. No approval is created here.
export function checkApprovalStage({ root, originalFile, factsFile, approvalFile }) {
  const approvalPath = path.join(root, approvalFile);
  if (!existsSync(approvalPath)) {
    return { pass: false, reasonCode: "approval-missing", reason: "承認記録が存在しないため、後段を実行しない", approvalId: null, status: null, validity: null, generationInput: null };
  }
  const approval = loadJson(approvalPath);
  let validity = null;
  try {
    validity = checkApprovalValidity(approval, { root, originalFile, factsFile });
  } catch (e) {
    validity = { valid: false, checks: [], reason: String(e && e.message ? e.message : e) };
  }
  const generationInput = checkGenerationInput({ root, originalFile, factsFile, approvalFile });
  return {
    pass: generationInput.ok === true,
    reasonCode: generationInput.reasonCode ?? null,
    reason: generationInput.reason ?? null,
    approvalId: approval.approvalId ?? null,
    status: approval.status ?? null,
    approver: approval.approver ?? null,
    approvedAt: approval.approvedAt ?? null,
    validity,
    generationInput,
  };
}

// Assemble the complete LP page: the generation sentences verbatim
// (no editing) plus the existing section images. Images whose files do
// not exist are left out and reported as skipped; the completion check
// decides pass/fail. Image meaning is out of scope and is never judged
// here (only existence and reference are handled).
export function assembleLP({ root, generation, images, lpDir, heroChips }) {
  const sentences = generation && Array.isArray(generation.sentences) ? generation.sentences : [];
  const existing = new Set();
  const skipped = [];
  for (const img of images ?? []) {
    let ok = false;
    try { ok = existsSync(resolveRoot(root, img.file)); } catch { ok = false; }
    if (ok) existing.add(img.id);
    else skipped.push(img.file);
  }
  const esc = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const lpDirAbs = resolveRoot(root, lpDir);
  const srcFor = (img) => path.relative(lpDirAbs, resolveRoot(root, img.file)).split(path.sep).join("/");
  const placed = [];
  let body = "";
  const hero = (images ?? []).find((i) => i.id === "hero");
  if (hero && existing.has(hero.id)) {
    // Hero block (fix F5, traced from loop-016's complete-LP assembly):
    // the confirmed key visual plus the first-check FACT values as
    // short chips. Chips carry FACT values only, verbatim.
    const chips = Array.isArray(heroChips) && heroChips.length > 0
      ? `<div class="hero-chips">${heroChips.map((c) => `<span class="hero-chip">${esc(c)}</span>`).join("")}</div>`
      : "";
    body += `<section class="lp-hero"><img src="${esc(srcFor(hero))}" alt="">${chips}</section>\n`;
    placed.push(hero.file);
  }
  sentences.forEach((s, idx) => {
    const text = s && typeof s.text === "string" ? s.text : "";
    body += `<p class="lp-sentence" data-sentence="${idx}">${esc(text)}</p>\n`;
    const lines = s && Array.isArray(s.sourceLines) ? s.sourceLines : [];
    for (const img of images ?? []) {
      if (img.id === "hero" || placed.includes(img.file)) continue;
      if (img.line != null && lines.includes(img.line)) {
        body += `<figure class="lp-image"><img src="${esc(srcFor(img))}" alt=""></figure>\n`;
        placed.push(img.file);
      }
    }
  });
  for (const img of images ?? []) {
    if (existing.has(img.id) && !placed.includes(img.file)) {
      body += `<figure class="lp-image"><img src="${esc(srcFor(img))}" alt=""></figure>\n`;
      placed.push(img.file);
    }
  }
  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FICT-J01 — 完成LP（デモ）</title>
<style>body{font-family:sans-serif;margin:2rem;line-height:1.7;color:#222;max-width:60rem}.lp-hero img,.lp-image img{max-width:100%;height:auto}</style>
</head>
<body>
<main>
${body}</main>
</body>
</html>
`;
  return { html, referenced: [...placed], skipped };
}

// Completion check (design: C1–C4). Mechanical containment only:
// sentences present verbatim, images exist and are referenced, the page
// exists and contains both text and image, grounding re-run passes.
// Image meaning is out of scope and is never judged here (N3: the note
// below states this for the record reader).
// The production design history (the color rule, D15): the tool
// records each production's pattern and palette in
// loops/design-history.json, so the next production can keep the
// promise that consecutive postings do not repeat the same colors
// for the same pattern. Reading excludes the current run's own
// entries (a resumed run must derive the design it already chose).
const DESIGN_HISTORY_FILE = "loops/design-history.json";
export function loadDesignHistory(root) {
  try {
    const parsed = JSON.parse(readFileSync(resolveRoot(root, DESIGN_HISTORY_FILE), "utf8"));
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
  } catch { return []; }
}
export function loadPreviousDesign(root, excludeRunDir) {
  const entries = loadDesignHistory(root).filter((e) => e && e.runDir !== excludeRunDir);
  const last = entries[entries.length - 1];
  return last ? { patternId: last.patternId ?? null, paletteId: last.paletteId ?? null } : null;
}
export function recordDesignHistory(root, entry) {
  const entries = loadDesignHistory(root);
  if (entries.length > 0 && entries[entries.length - 1].runDir === entry.runDir) return;
  entries.push({ ...entry, at: new Date().toISOString() });
  try {
    writeFileSync(resolveRoot(root, DESIGN_HISTORY_FILE), JSON.stringify({ entries }, null, 2) + "\n", "utf8");
  } catch { /* the history is a record, not a gate: a failed write must not stop a production */ }
}

export function checkCompletion({ root, generation, imageFiles, lpFile, grounding, pagecheck, appealCoverage, omittedImageFiles, facts, original }) {
  const checks = [];
  let lpHtml = null;
  try { lpHtml = readFileSync(resolveRoot(root, lpFile), "utf8"); }
  catch { lpHtml = null; }
  const sentences = generation && Array.isArray(generation.sentences) ? generation.sentences : [];
  const missingSentences = sentences.filter((s) => typeof s?.text !== "string" || s.text.length === 0 || lpHtml === null || !lpHtml.includes(s.text));
  const c1Pass = sentences.length > 0 && missingSentences.length === 0;
  checks.push({
    id: "C1",
    pass: c1Pass,
    detail: c1Pass
      ? `生成文 ${sentences.length} 件がすべてページにそのまま入っている`
      : `ページに欠けている文が ${missingSentences.length} 件ある（生成文 ${sentences.length} 件中）`,
  });
  const files = imageFiles ?? [];
  const missingFiles = [];
  const unreferenced = [];
  const lpDirAbs = path.dirname(resolveRoot(root, lpFile));
  for (const f of files) {
    let exists = false;
    try { exists = existsSync(resolveRoot(root, f)); } catch { exists = false; }
    if (!exists) { missingFiles.push(f); continue; }
    const src = path.relative(lpDirAbs, resolveRoot(root, f)).split(path.sep).join("/");
    if (lpHtml === null || !lpHtml.includes(src)) unreferenced.push(f);
  }
  // An image the assembly deliberately omitted (a band left with
  // no text: images are not decoration, 2026-11-04) is recorded in
  // the assembly's omittedImageFiles and is not a silent loss; C2
  // still fails on missing files and on unrecorded unreferenced
  // ones.
  const omittedSet = new Set(omittedImageFiles ?? []);
  const silentUnreferenced = unreferenced.filter((f) => !omittedSet.has(f));
  const recordedOmissions = unreferenced.filter((f) => omittedSet.has(f));
  const c2Pass = files.length > 0 && missingFiles.length === 0 && silentUnreferenced.length === 0;
  checks.push({
    id: "C2",
    pass: c2Pass,
    detail: c2Pass
      ? `画像 ${files.length} 件がすべて実在し、ページから参照されている${recordedOmissions.length > 0 ? `（うち ${recordedOmissions.length} 件は記録された省略）` : ""}`
      : `画像の欠け: 存在しない ${missingFiles.length} 件、参照されていない ${silentUnreferenced.length} 件（記録 ${files.length} 件中）`,
  });
  const hasSentence = lpHtml !== null && sentences.some((s) => typeof s?.text === "string" && s.text.length > 0 && lpHtml.includes(s.text));
  const hasImage = lpHtml !== null && files.some((f) => {
    const src = path.relative(lpDirAbs, resolveRoot(root, f)).split(path.sep).join("/");
    return lpHtml.includes(src);
  });
  const c3Pass = lpHtml !== null && hasSentence && hasImage;
  checks.push({
    id: "C3",
    pass: c3Pass,
    detail: c3Pass ? "LP のページが存在し、文と画像の両方を含んでいる" : `ページの存在または両含有を満たさない（ページ: ${lpHtml === null ? "なし" : "あり"}、文の含有: ${hasSentence ? "あり" : "なし"}、画像の含有: ${hasImage ? "あり" : "なし"}）`,
  });
  const c4Pass = grounding?.pass === true;
  checks.push({
    id: "C4",
    pass: c4Pass,
    detail: c4Pass ? "根拠検査の再実行が pass である" : "根拠検査の再実行が pass ではない",
  });
  // C5 (fix F6): deterministic page quality, checked by src/pagecheck.mjs
  // (duplication, verification-side phrases, record-label exposure,
  // heading scope). Only when a pagecheck result is supplied.
  if (pagecheck) {
    const s = pagecheck.summary ?? {};
    const c5Pass = pagecheck.pass === true;
    checks.push({
      id: "C5",
      pass: c5Pass,
      detail: c5Pass
        ? `ページ品質の決定的チェックが pass（重複 ${s.duplicateGroups ?? 0}、検証側定型文 ${s.verificationHits ?? 0}、記録ラベル ${s.recordExposureHits ?? 0}、見出しずれ ${s.headingMismatches ?? 0}、見出しスキャン ${s.headlineHits ?? 0}）`
        : `ページ品質の決定的チェックが fail（重複 ${s.duplicateGroups ?? 0} 件、検証側定型文 ${s.verificationHits ?? 0} 件、記録ラベル露出 ${s.recordExposureHits ?? 0} 件、見出しずれ ${s.headingMismatches ?? 0} 件、見出しスキャン ${s.headlineHits ?? 0} 件）`,
      pagecheck: { version: pagecheck.version ?? null, dictsVersion: pagecheck.dictsVersion ?? null, summary: s },
    });
  }
  // C6: every appeal in the planning has at least one generated
  // sentence. An appeal grounded in the original with no sentence
  // means something important in the original fell out of the page.
  if (Array.isArray(appealCoverage)) {
    const uncovered = appealCoverage.filter((c) => !Array.isArray(c.sentenceIdxs) || c.sentenceIdxs.length === 0);
    const c6Pass = uncovered.length === 0;
    checks.push({
      id: "C6",
      pass: c6Pass,
      detail: c6Pass
        ? `企画の訴求 ${appealCoverage.length} 件すべてに対応する文がある`
        : `対応する文がない訴求がある（${uncovered.map((c) => c.appealId).join("、")}）: 原本にある大事なことがページに落ちている`,
    });
  }
  // C7 (gate promotion G-A, approved by the user, 2026-11-04): the
  // job-details table must let a reader grasp the whole posting on
  // its own — every stated fact's value and the line-only essentials
  // (the work itself, days off, requirements) must be in the table.
  if (facts && Array.isArray(facts.items)) {
    const escH = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const tableMatch = lpHtml ? lpHtml.match(/<table class="fact-table">([\s\S]*?)<\/table>/) : null;
    const table = tableMatch ? tableMatch[1] : "";
    const missing = [];
    for (const i of facts.items) {
      if (i && i.status === "stated" && i.value !== null && i.value !== undefined && i.value !== "") {
        const v = typeof i.value === "object" ? JSON.stringify(i.value) : String(i.value);
        if (!table.includes(escH(v))) missing.push(i.key);
      }
    }
    const LINE_ROW_RE_C7 = /^(仕事内容|仕事|休日|応募資格|資格|Work|Duties|Job description|Days off|Days|Requirements|Qualifications)\s*[:：]\s*(.+)$/i;
    for (const l of original?.lines ?? []) {
      const m = LINE_ROW_RE_C7.exec(l?.text ?? "");
      if (m && !table.includes(escH(m[2]))) missing.push(`line:${l.id}`);
    }
    const c7Pass = tableMatch !== null && missing.length === 0;
    checks.push({
      id: "C7",
      pass: c7Pass,
      detail: c7Pass
        ? "募集要項の表に全 stated 事実と行の必須項目が入っている"
        : `募集要項の表に欠けている項目がある（${missing.join("、")}）`,
    });
  }
  const failures = checks.filter((c) => !c.pass).map((c) => ({ check: c.id, detail: c.detail }));
  const pass = checks.every((c) => c.pass);
  return {
    pass,
    checks,
    failures,
    reason: pass ? null : `未完成のため止める（${failures.map((f) => f.check).join("、")}）: ${failures[0].detail}`,
    note: "完成の判定は文章・機械的な含有・ページ品質（C5）を対象とする。画像の内容としての適切さは完成判定では見ないが、1枚画（LPの完成イメージ）は企画の構造からレイアウトを組んで描画したプレビューであり、その写真は生成前に対応表と禁止モチーフで検査され、提示時に要素ごとの確認欄（loop-020 のチェックリスト）とともに記録される。完成イメージ自体はLPに組み込まれない。",
  };
}

function stageNotExecuted(reason) {
  return { executed: false, reason };
}

// Integrated run. Stage executors are injected (deps) so tests can stub
// the API-calling stages; the live CLI wires CLI-based executors below.
// options.humanConfirmation, when given, is passed to re-verification
// (the live run never fabricates one). options.allowPreview stays false
// for the automatic run up to mechanical checks.
export async function runDemo(options, deps = {}) {
  // Resume (fix F7): a checkpoint stop persisted a run state; a resume
  // run takes its file set and checkpoint mode from that state.
  const resumeState = options.resumeState ?? null;
  if (resumeState && resumeState.files) {
    options.originalFile = resumeState.files.originalFile ?? options.originalFile;
    options.factsFile = resumeState.files.factsFile ?? options.factsFile;
    options.approvalFile = resumeState.files.approvalFile ?? options.approvalFile;
    options.generationFile = resumeState.files.generationFile ?? options.generationFile;
    options.planningFile = resumeState.files.planningFile ?? options.planningFile;
    options.feedbackFile = resumeState.files.feedbackFile ?? options.feedbackFile;
    options.checkpoints = (resumeState.mode && resumeState.mode.checkpoints) ?? options.checkpoints;
    if (resumeState.mode && resumeState.mode.entry) options.posting = options.posting ?? { id: resumeState.files.postingId ?? "ENTRY", version: "v1", text: "" };
  }
  const root = options.root;
  const originalFile = options.originalFile ?? "src/fict-j01-v1.json";
  const factsFile = options.factsFile ?? "src/facts/FICT-J01-facts-v1.json";
  const approvalFile = options.approvalFile ?? "src/facts/FICT-J01-facts-v1.approval.json";
  const generationFile = options.generationFile ?? "loops/loop-010/generated-lp-v1.json";
  const imagesDir = normalizePath(options.imagesDir ?? path.join(path.dirname(generationFile), "images"));
  const lpFile = normalizePath(options.lpFile ?? path.join(path.dirname(generationFile), "lp.html"));
  const imagesRunFile = normalizePath(options.imagesRunFile ?? path.join(path.dirname(generationFile), "images-run.json"));
  const startedAt = new Date().toISOString();
  const t0 = performance.now();

  const extract = deps.extract ?? (async () => { throw new Error("no extraction executor wired"); });
  const generate = deps.generate ?? (async () => { throw new Error("no generation executor wired"); });
  const images = deps.images ?? (async () => { throw new Error("no image executor wired"); });
  const assemble = deps.assemble ?? (async ({ root, generation, images, lpFile, heroChips, layout, planning, facts }) => {
    // With a confirmed finished-image layout, the LP is assembled in
    // that composition (the confirmed placement and appeals as-is);
    // without one, the legacy assembly is used unchanged.
    let originalForAssembly = null;
    try { originalForAssembly = loadJson(resolveRoot(root, originalFile)); } catch { originalForAssembly = null; }
    const built = layout
      ? assembleFromLayout({ root, generation, images, lpDir: path.dirname(lpFile), heroChips, layout, planning, facts, original: originalForAssembly })
      : assembleLP({ root, generation, images, lpDir: path.dirname(lpFile), heroChips });
    mkdirSync(path.dirname(resolveRoot(root, lpFile)), { recursive: true });
    writeFileSync(resolveRoot(root, lpFile), built.html, "utf8");
    return { file: lpFile, referenced: built.referenced, skipped: built.skipped, layoutUsed: Boolean(layout), assignments: built.assignments ?? null };
  });
  const keyVisualPhotos = deps.keyVisualPhotos ?? (async () => { throw new Error("no key-visual photo executor wired"); });
  const renderFinishedImage = deps.renderFinishedImage ?? (async () => { throw new Error("no finished-image renderer wired"); });
  const reviewPage = deps.review ?? null;
  const verify = deps.verify ?? ((args) => runVerification(args));
  const preview = deps.preview ?? (({ generation, verification, facts, e02, repoUrl }) => buildPreview({ generation, verification, facts, e02, repoUrl }));

  const stages = {};
  let stoppedAt = null;
  let stopReason = null;
  let stopKind = null;
  const stop = (stage, reason, kind) => { stoppedAt = stage; stopReason = reason; stopKind = kind ?? null; };

  // --- Pipeline mode (fix F1–F10) setup. Active when a checkpoint set
  // is chosen (options.checkpoints: "full" | "light") or a posting is
  // handed in as text (options.posting). The legacy pinned run above
  // this work is untouched when neither is given. ---
  const pipelineMode = Boolean(options.checkpoints) || Boolean(options.posting);
  const entryMode = Boolean(options.posting) && !(resumeState && resumeState.mode && resumeState.mode.entry);
  const resumedStages = new Set(resumeState && Array.isArray(resumeState.completedStages) ? resumeState.completedStages : []);
  const holds = [];
  const presentationRecords = [];
  const stateFile = pipelineMode ? normalizePath(options.stateFile ?? path.join(path.dirname(generationFile), "run-state.json")) : null;
  const writePresentationRecord = (checkpoint, record) => {
    if (!stateFile) return null;
    const file = normalizePath(path.join(path.dirname(stateFile), `presentation-${checkpoint}.json`));
    mkdirSync(path.dirname(resolveRoot(root, file)), { recursive: true });
    writeFileSync(resolveRoot(root, file), JSON.stringify(record, null, 2) + "\n", "utf8");
    presentationRecords.push({ checkpoint, file });
    return file;
  };
  const persistState = (completedStages, extra = {}) => {
    if (!stateFile) return;
    const state = {
      version: 1,
      mode: { checkpoints: options.checkpoints ?? null, entry: Boolean(options.posting) },
      files: {
        originalFile, factsFile, approvalFile, generationFile,
        planningFile: options.planningFile ?? null,
        feedbackFile: options.feedbackFile ?? null,
        postingId: options.posting ? options.posting.id : null,
      },
      completedStages,
      keyVisual: extra.keyVisual ?? (resumeState ? resumeState.keyVisual : null) ?? null,
      priorStages: JSON.parse(JSON.stringify(stages)),
      e02raw: extra.e02raw ?? null,
    };
    mkdirSync(path.dirname(resolveRoot(root, stateFile)), { recursive: true });
    writeFileSync(resolveRoot(root, stateFile), JSON.stringify(state, null, 2) + "\n", "utf8");
  };
  let planning = null;
  let planningSha256 = null;
  if (options.planningFile && existsSync(resolveRoot(root, options.planningFile))) {
    try {
      const raw = readFileSync(resolveRoot(root, options.planningFile), "utf8");
      planningSha256 = sha256Text(raw);
      planning = JSON.parse(raw);
    } catch { planning = null; }
  }
  let feedbackText = null;
  if (options.feedbackFile && existsSync(resolveRoot(root, options.feedbackFile))) {
    try { feedbackText = readFileSync(resolveRoot(root, options.feedbackFile), "utf8"); } catch { feedbackText = null; }
  }
  // Planning checkpoint presentation (full set): the planning input is
  // presented before production starts; the record is written at run
  // start, its judgement fields stay for the human to fill.
  if (pipelineMode && options.checkpoints === "full" && planning && !resumeState) {
    writePresentationRecord("planning", {
      checkpoint: "planning",
      presented: [{ kind: "planning", file: options.planningFile, sha256: planningSha256 }],
      holds: [],
      judgement: { result: null, confirmer: null, confirmedAt: null, corrections: [] },
    });
  }
  // Text entry (fix F1): pin the posting text as the source artifact.
  // options.originalFile / options.factsFile name the entry targets.
  let entryArtifacts = null;
  if (entryMode) {
    const pinned = pinPostingText({ id: options.posting.id, version: options.posting.version ?? "v1", text: options.posting.text });
    mkdirSync(path.dirname(resolveRoot(root, originalFile)), { recursive: true });
    writeFileSync(resolveRoot(root, originalFile), JSON.stringify(pinned, null, 2) + "\n", "utf8");
    entryArtifacts = { originalFile, factsFile, manifestFile: normalizePath(options.manifestFile ?? path.join(path.dirname(factsFile), "manifest.json")) };
  }

  // Stage 1: extraction and reconciliation (E01 and E02 in one run).
  const extraction = resumedStages.has("extraction") ? null : await extract({ originalFile, inputId: options.inputId ?? (options.posting ? options.posting.id : undefined), inputVersion: options.inputVersion ?? (options.posting ? (options.posting.version ?? "v1") : undefined) });
  const e01 = resumedStages.has("extraction")
    ? ((resumeState.priorStages && resumeState.priorStages.extraction && resumeState.priorStages.extraction.e01) ?? null)
    : (extraction && extraction.e01 ? extraction.e01 : null);
  const e02raw = resumedStages.has("extraction")
    ? (resumeState.e02raw ?? null)
    : (extraction && extraction.e02 ? extraction.e02 : null);
  stages.extraction = resumedStages.has("extraction")
    ? { executed: false, resumed: true, ...((resumeState.priorStages && resumeState.priorStages.extraction) ?? {}) }
    : {
      executed: true,
      status: extraction ? (extraction.status ?? null) : null,
      model: extraction ? (extraction.model ?? null) : null,
      promptVersion: extraction ? (extraction.promptVersion ?? null) : null,
      durationMs: extraction ? (extraction.durationMs ?? null) : null,
      usage: extraction ? (extraction.usage ?? null) : null,
      costUsd: extraction ? (extraction.costUsd ?? null) : null,
      costNote: extraction ? (extraction.costNote ?? null) : null,
      schemaCheck: extraction ? (extraction.schemaCheck ?? null) : null,
      e01,
      e02: e02raw,
    };
  // Text entry: write the extracted candidate as the FACT file and the
  // manifest, in the shapes the approval tooling consumes. The run
  // then stops at approval below: no approval exists for the new pair
  // yet, and this runner never creates one.
  if (entryMode && extraction && extraction.status === "completed" && extraction.facts) {
    const factsObj = buildFactsFile({
      items: extraction.facts.items,
      originalId: options.posting.id,
      originalVersion: options.posting.version ?? "v1",
      promptVersion: extraction.promptVersion ?? null,
      model: extraction.model ?? null,
      sourceRun: "text-entry",
    });
    mkdirSync(path.dirname(resolveRoot(root, factsFile)), { recursive: true });
    writeFileSync(resolveRoot(root, factsFile), JSON.stringify(factsObj, null, 2) + "\n", "utf8");
    const manifest = buildManifest({
      originalId: options.posting.id,
      originalVersion: options.posting.version ?? "v1",
      originalSha256: sha256File(resolveRoot(root, originalFile)),
      factsSha256: sha256File(resolveRoot(root, factsFile)),
    });
    writeFileSync(resolveRoot(root, entryArtifacts.manifestFile), JSON.stringify(manifest, null, 2) + "\n", "utf8");
    entryArtifacts = { ...entryArtifacts, originalSha256: manifest.original.sha256, factsSha256: manifest.sha256 };
    stages.entry = { executed: true, originalFile, factsFile, manifestFile: entryArtifacts.manifestFile, originalSha256: manifest.original.sha256, factsSha256: manifest.sha256 };
  }
  const e02 = {
    caseId: "E02",
    stage: "照合",
    verdict: e02raw ? (e02raw.verdict ?? null) : null,
    stoppedAtReconciliation: e02raw ? (e02raw.stoppedAtReconciliation ?? null) : null,
    contradictions: e02raw ? (e02raw.contradictions ?? []) : [],
    approval: stageNotExecuted("E02 は照合で停止したため承認を実行しない（矛盾で停止した対象に承認記録を作らない、G-INV-3）"),
    generation: stageNotExecuted("E02 は照合で停止したため生成を実行しない"),
    images: stageNotExecuted("E02 は照合で停止したため画像生成を実行しない"),
    lpAssembly: stageNotExecuted("E02 は照合で停止したため LP の組み立てを実行しない"),
    verification: stageNotExecuted("E02 は照合で停止したため再検証を実行しない"),
    preview: stageNotExecuted("E02 は照合で停止したためプレビューを実行しない"),
  };

  if (!resumedStages.has("extraction")) {
    if (!extraction || extraction.status !== "completed" || !extraction.facts) {
      stop("extraction", extraction && extraction.reason ? extraction.reason : (extraction && extraction.parseError ? extraction.parseError : "抽出が完了しなかったため、後段を実行しない"));
    } else if (extraction.schemaCheck && extraction.schemaCheck.pass !== true) {
      stop("extraction", "抽出結果のスキーマ完全性チェックが pass しなかったため、後段を実行しない");
    } else if (!e01 || e01.stoppedAtReconciliation || !String(e01.verdict ?? "").includes("一致")) {
      stop("reconciliation", e01 ? `E01 の照合が停止したため、後段を実行しない（${e01.verdict ?? "判定なし"}）` : "E01 の照合結果が得られなかったため、後段を実行しない");
    }
  }

  // Stage 2 (facts comparison): the candidate must not substantively
  // disagree with the fixed FACT v1 that the approval stands for.
  let fixedFacts = null;
  if (resumedStages.has("factsComparison")) {
    fixedFacts = loadJson(path.join(root, factsFile));
    stages.factsComparison = { executed: false, resumed: true, ...((resumeState.priorStages && resumeState.priorStages.factsComparison) ?? {}) };
  } else if (!stoppedAt) {
    fixedFacts = loadJson(path.join(root, factsFile));
    const original = JSON.parse(readFileSync(resolveRoot(root, originalFile), "utf8"));
    const verbatim = checkQuoteVerbatim(extraction.facts, original);
    if (entryMode || (resumeState && resumeState.mode && resumeState.mode.entry)) {
      // Text entry: there is no fixed FACT set to compare against.
      // The candidate IS the extracted set just written; verbatim is
      // its check here, and approval (next stage) is where it stops.
      stages.factsComparison = { executed: true, mode: "entry", verbatim, candidate: { factsFile, sha256: entryArtifacts ? entryArtifacts.factsSha256 ?? null : sha256File(resolveRoot(root, factsFile)) } };
      if (!verbatim.pass) {
        stop("facts-comparison", "抽出候補の引用逐語性チェックが pass しなかったため、後段を実行しない");
      }
    } else {
      const comparison = compareFactSets(extraction.facts, fixedFacts);
      stages.factsComparison = { executed: true, verbatim, ...comparison };
      if (!verbatim.pass) {
        stop("facts-comparison", "抽出候補の引用逐語性チェックが pass しなかったため、後段を実行しない");
      } else if (!comparison.agrees) {
        stop("facts-comparison", "抽出の再実行で得た FACT 候補が固定済み FACT v1 と食い違うため、その時点で止める（承認は FACT v1 の組にのみ成立しているため）");
      }
    }
  } else {
    stages.factsComparison = stageNotExecuted("前段で停止したため、FACT 候補と固定済み FACT の比較を実行しない");
  }

  // Stage 3 (approval): re-confirm only; never create an approval.
  if (!stoppedAt) {
    const approvalStage = checkApprovalStage({ root, originalFile, factsFile, approvalFile });
    stages.approval = { executed: true, ...approvalStage };
    if (!approvalStage.pass) {
      stop("approval", approvalStage.reason ?? "承認の有効性が再確認できなかったため、後段を実行しない");
      // An approval stop in pipeline mode must be continuable: the
      // approval binds to this exact candidate file, so the run
      // state is persisted here and a resume re-checks approval
      // against the same candidate instead of re-extracting
      // (found in loop-022: no state file existed after L1's stop).
      if (pipelineMode) {
        persistState(["extraction", "factsComparison"], { e02raw });
      }
    }
  } else {
    stages.approval = stageNotExecuted("前段で停止したため、承認の有効性の再確認を実行しない");
  }

  // Stage 3.5 (planning and key visual; pipeline mode only, fix
  // F2/F3/F7). Order per the confirmed generation flow: planning is an
  // input; the key visual is generated from the correspondence and
  // the run stops at its preview checkpoint; a resume continues only
  // with the confirmed key visual (file and hash must match).
  let correspondence = null;
  let kvImage = null;
  if (pipelineMode) {
    if (!stoppedAt) {
      if (!planning) {
        stages.planning = { executed: true, pass: false, file: options.planningFile ?? null, sha256: planningSha256 };
        stop("planning", options.planningFile ? "企画入力ファイルが読み込めなかったため、後段を実行しない" : "企画入力がないため、企画待ちで止める（チェックポイント。ツールは企画を作らない）", options.planningFile ? undefined : "checkpoint");
        if (pipelineMode) {
          persistState(["extraction", "factsComparison", "approval"], { e02raw });
        }
      } else {
        const validation = validatePlanning(planning);
        stages.planning = { executed: true, pass: validation.ok, file: options.planningFile ?? null, sha256: planningSha256, audience: planning.audience ?? null, validation };
        if (!validation.ok) {
          stop("planning", `企画入力が成立していないため、後段を実行しない（${validation.errors.join(" / ")}）`);
        }
      }
    } else {
      stages.planning = stageNotExecuted("前段で停止したため、企画入力の確認を実行しない");
    }
    // Planning review (2026-11-04): the plan itself is judged by the
    // reader persona and the client before anything is generated —
    // a preview that cannot fail anything is not a review (the
    // user's standing criticism). Runs on the first invocation only;
    // a resume re-uses the reviewed plan. A fail stops the run with
    // the findings, for the human's judgement.
    if (!stoppedAt && !resumeState) {
      if (reviewPage) {
        let planningReview = null;
        try { planningReview = await reviewPage({ mode: "planning", planningFile: options.planningFile ?? null }); } catch (e) { planningReview = { status: "error", reason: String(e?.message ?? e) }; }
        stages.planning.review = planningReview && planningReview.status === "reviewed"
          ? { verdict: planningReview.verdict, findings: planningReview.findings ?? [], model: planningReview.model ?? null, promptVersion: planningReview.promptVersion ?? null }
          : { verdict: null, status: planningReview?.status ?? null, reason: planningReview?.reason ?? null };
        if (planningReview && planningReview.status === "reviewed" && planningReview.verdict === "fail") {
          stop("planning-review", `企画レビューが不合格のため、後段を実行しない（${(planningReview.findings ?? []).map((f) => `${f.criterion}: ${f.problem}`).join(" / ")}）`);
        } else if (!planningReview || planningReview.status !== "reviewed") {
          stop("planning-review", `企画レビューが実行できなかったため、後段を実行しない（${planningReview?.reason ?? "実行器の応答なし"}）`);
        }
      } else {
        stages.planning.review = { executed: false, reason: "レビュー実行器が接続されていない" };
      }
    }
    if (!stoppedAt) {
      const factsForPlanning = fixedFacts ?? loadJson(path.join(root, factsFile));
      try {
        correspondence = buildCorrespondence(planning, factsForPlanning);
      } catch (e) {
        stages.keyVisual = { executed: true, pass: false, reason: String(e && e.message ? e.message : e) };
        stop("key-visual", `企画と画像の対応表が作れなかったため、後段を実行しない（${String(e && e.message ? e.message : e)}）`);
      }
    }
    if (!stoppedAt && resumedStages.has("keyVisual") && resumeState.keyVisual) {
      const kv = resumeState.keyVisual;
      kvImage = kv.image ?? null;
      const conf = options.kvConfirmation ?? null;
      let actualSha = null;
      try { actualSha = kvImage ? sha256File(resolveRoot(root, kvImage.file)) : null; } catch { actualSha = null; }
      const confOk = Boolean(conf && kvImage && conf.file === kvImage.file && conf.sha256 === kvImage.sha256 && actualSha === kvImage.sha256 && conf.confirmer && conf.confirmedAt);
      stages.keyVisual = { executed: false, resumed: true, ...kv, confirmation: conf, confirmationPass: confOk };
      if (!confOk) {
        stop("key-visual-confirmation", "確認済み1枚画の照合ができなかったため、後段を実行しない（確認記録のファイル・ハッシュ・確認者・日時が、提示した1枚画と一致する必要がある）");
      }
    } else if (!stoppedAt) {
      // 1枚画: the LP's finished image. Photographs for the layout are
      // generated from the planning specs (each prompt compliance-checked
      // against the correspondence), the page layout is composed from the
      // structured planning, and the composed page is rendered to a
      // single image. The image model never draws the page itself, and
      // the finished image is a preview artifact: it is never assembled
      // into the LP (the copy and the real images take its places later).
      // Image design (loop-023): the images are designed from the
      // planning before anything is generated. A design that fails
      // its checks stops the run here, before any spend, with the
      // reasons recorded as a send-back to the design.
      const factsForDesign = fixedFacts ?? loadJson(path.join(root, factsFile));
      const imageDesign = buildImageDesign(planning, factsForDesign);
      const designCheck = checkImageDesign(imageDesign, planning);
      const kvPageDirEarly = normalizePath(path.dirname(generationFile));
      mkdirSync(resolveRoot(root, kvPageDirEarly), { recursive: true });
      writeFileSync(resolveRoot(root, path.join(kvPageDirEarly, "image-design.json")), JSON.stringify(imageDesign, null, 2) + "\n", "utf8");
      // The color rule (D15): when the previous production used the
      // same pattern, the palette changes. The production history is
      // the tool's own record (loops/design-history.json); this run's
      // own entries are excluded so resumes derive the same design.
      const previousDesign = loadPreviousDesign(root, kvPageDirEarly);
      const lpDesignEarly = deriveLpDesign(planning, { previous: previousDesign });
      writeFileSync(resolveRoot(root, path.join(kvPageDirEarly, "lp-design.json")), JSON.stringify(lpDesignEarly, null, 2) + "\n", "utf8");
      recordDesignHistory(root, { runDir: kvPageDirEarly, inputId: options.inputId ?? options.posting?.id ?? null, patternId: lpDesignEarly.patternId, paletteId: lpDesignEarly.paletteId });
      if (!designCheck.pass) {
        stages.keyVisual = { executed: true, pass: false, correspondence, imageDesign, designCheck };
        persistState(["extraction", "factsComparison", "approval", "planning"], { e02raw });
        stop("key-visual", `画像の設計がチェックを通らなかったため、生成しない（${designCheck.failures.join("、")}）`);
      }
      // Prompts come from the design. A prompt that hits a gate or the
      // standing compliance is sent back once and rebuilt from its
      // design entry; the return is recorded with its reasons.
      const sendBacks = [];
      const photoPlan = stoppedAt ? [] : imageDesign.images.map((e) => {
        let entry = e;
        const gateCheck = checkPromptGates(entry.prompt);
        const comp = checkPromptCompliance(entry.prompt, correspondence);
        if (!gateCheck.pass || !comp.pass) {
          const hitTerms = [...gateCheck.hits.map((h) => h.term), ...comp.hits.map((h) => h.term)];
          const rebuilt = rebuildPromptWithoutHits(entry, hitTerms);
          sendBacks.push({ id: entry.id, reasons: hitTerms, removedClauses: rebuilt.removed });
          entry = rebuilt.entry;
        }
        return { id: entry.id, role: entry.role, prompt: entry.prompt };
      });
      const complianceResults = photoPlan.map((pp) => ({ id: pp.id, ...checkPromptCompliance(pp.prompt, correspondence), gates: checkPromptGates(pp.prompt) }));
      const compliance = { pass: complianceResults.every((c) => c.pass && c.gates.pass), results: complianceResults };
      if (!stoppedAt && !compliance.pass) {
        const hits = complianceResults.filter((c) => !c.pass || !c.gates.pass).flatMap((c) => [...(c.hits ?? []).map((h) => `${c.id}: ${h.term}`), ...((c.gates && c.gates.hits) ?? []).map((h) => `${c.id}: ${h.term}（${h.gate}）`)]);
        stages.keyVisual = { executed: true, pass: false, correspondence, imageDesign, designCheck, sendBacks, photoPlan, compliance };
        stop("key-visual", `1枚画の写真のプロンプトが禁止モチーフ検査に触れたため、生成しない（${hits.join("、")}）。対応表か企画の側の不備であり、プロンプトの言い換えでは直さない`);
      } else if (!stoppedAt) {
        const kvPhotosDir = normalizePath(path.join(imagesDir, "kv-photos"));
        const kvPageDir = kvPageDirEarly;
        mkdirSync(resolveRoot(root, kvPhotosDir), { recursive: true });
        mkdirSync(resolveRoot(root, kvPageDir), { recursive: true });
        let attempts = 0;
        let photosRun = null;
        while (attempts < 3) {
          attempts++;
          try {
            photosRun = await keyVisualPhotos({ root, photoPlan, imagesDir: kvPhotosDir });
          } catch (e) {
            photosRun = { status: "failed", reason: String(e && e.message ? e.message : e), images: [] };
          }
          if (photosRun && photosRun.status === "generated" && Array.isArray(photosRun.images) && photosRun.images.length > 0) break;
        }
        if (!photosRun || photosRun.status !== "generated" || !photosRun.images || photosRun.images.length === 0) {
          holds.push({ stage: "key-visual", condition: "1枚画の写真の生成", detail: "上限まで再試行したが写真が生成できなかった", attempts });
          stages.keyVisual = { executed: true, pass: false, correspondence, imageDesign, designCheck, sendBacks, photoPlan, compliance, attempts, holds: [...holds] };
          persistState(["extraction", "factsComparison", "approval", "planning"], { e02raw });
          stop("key-visual", "1枚画の写真が生成できなかったため止める（保留として記録した）");
        } else {
          const layout = buildFinishedImageHtml({ root, planning, photos: photosRun.images, pageDir: kvPageDir, design: imageDesign, previousDesign });
          let rendered = null;
          try {
            rendered = await renderFinishedImage({ root, html: layout.html, outDir: kvPageDir, baseName: "lp-finished-image" });
          } catch (e) {
            rendered = { status: "failed", reason: String(e && e.message ? e.message : e) };
          }
          if (!rendered || rendered.status !== "rendered" || !rendered.file) {
            holds.push({ stage: "key-visual", condition: "LPの完成イメージの描画", detail: rendered && rendered.reason ? rendered.reason : "描画できなかった", attempts });
            stages.keyVisual = { executed: true, pass: false, correspondence, imageDesign, designCheck, sendBacks, photoPlan, compliance, layout: layout.record, photos: photosRun.images, attempts, holds: [...holds] };
            persistState(["extraction", "factsComparison", "approval", "planning"], { e02raw });
            stop("key-visual", "LPの完成イメージを描画できなかったため止める（保留として記録した）");
          } else {
            const gate = evaluateFinishedImageGate(layout.record);
            if (!gate.pass) {
              stages.keyVisual = {
                executed: true, pass: false, correspondence, imageDesign, designCheck, sendBacks, photoPlan, compliance, attempts,
                gateResults: [...designCheck.gateResults.map((g) => ({ ...g, kind: "design" })), ...promptGateResults(photoPlan), { id: "G8", pass: false }],
                layout: layout.record, photos: photosRun.images, gate,
                model: photosRun.model ?? null, costUsd: photosRun.costUsd ?? null,
              };
              persistState(["extraction", "factsComparison", "approval", "planning"], { e02raw });
              stop("key-visual", `完成イメージがゲートを通らなかったため、提示しない（${gate.failures.join("、")}）`);
            } else {
            const sha = sha256File(resolveRoot(root, rendered.file));
            kvImage = { file: rendered.file, sha256: sha };
            // Sample review (2026-11-04): the finished image is
            // judged as a composition by the reader persona and the
            // client before it is presented. A fail is not presented
            // as a checkpoint — the run stops with the findings, the
            // same treatment as a gate failure.
            let sampleReview = null;
            if (reviewPage) {
              const outlinePath = path.join(path.dirname(generationFile), "sample-outline.json");
              try {
                writeFileSync(resolveRoot(root, outlinePath), JSON.stringify(sampleOutlineFromLayout(layout.record, imageDesign), null, 2), "utf8");
                sampleReview = await reviewPage({ mode: "sample", planningFile: options.planningFile ?? null, outlineFile: outlinePath });
              } catch (e) { sampleReview = { status: "error", reason: String(e?.message ?? e) }; }
            }
            const sampleReviewRecord = !reviewPage
              ? { executed: false, reason: "レビュー実行器が接続されていない" }
              : sampleReview && sampleReview.status === "reviewed"
                ? { verdict: sampleReview.verdict, findings: sampleReview.findings ?? [], model: sampleReview.model ?? null, promptVersion: sampleReview.promptVersion ?? null }
                : { verdict: null, status: sampleReview?.status ?? null, reason: sampleReview?.reason ?? null };
            stages.keyVisual = {
              executed: true, pass: true, correspondence, imageDesign, designCheck, sendBacks, photoPlan, compliance, attempts,
              gateResults: [...designCheck.gateResults.map((g) => ({ ...g, kind: "design" })), ...promptGateResults(photoPlan), { id: "G8", pass: true }],
              layout: layout.record,
              gate: { pass: true, failures: [] },
              photos: photosRun.images,
              image: kvImage,
              model: photosRun.model ?? null,
              costUsd: photosRun.costUsd ?? null,
              checklist: buildKeyVisualChecklist(correspondence, imageDesign),
              review: sampleReviewRecord,
            };
            if (reviewPage && (!sampleReview || sampleReview.status !== "reviewed")) {
              persistState(["extraction", "factsComparison", "approval", "planning"], { e02raw });
              stop("key-visual", `見本のレビューが実行できなかったため、提示しない（${sampleReview?.reason ?? "実行器の応答なし"}）`);
            } else if (reviewPage && sampleReview.verdict === "fail") {
              writePresentationRecord("key-visual", {
                checkpoint: "key-visual",
                presented: [{ kind: "image", file: kvImage.file, sha256: sha }],
                layout: layout.record,
                checklist: buildKeyVisualChecklist(correspondence, imageDesign),
                review: sampleReviewRecord,
                holds: [...holds],
                judgement: { result: null, confirmer: null, confirmedAt: null, corrections: [] },
              });
              persistState(["extraction", "factsComparison", "approval", "planning"], { e02raw });
              stop("key-visual", `見本のレビューが不合格のため、提示しない（${(sampleReview.findings ?? []).map((f) => `${f.criterion}: ${f.problem}`).join(" / ")}）`);
            } else {
            writePresentationRecord("key-visual", {
              checkpoint: "key-visual",
              presented: [{ kind: "image", file: kvImage.file, sha256: sha }],
              layout: layout.record,
              checklist: buildKeyVisualChecklist(correspondence, imageDesign),
              review: sampleReviewRecord,
              holds: [...holds],
              judgement: { result: null, confirmer: null, confirmedAt: null, corrections: [] },
            });
            persistState(["extraction", "factsComparison", "approval", "planning", "keyVisual"], { keyVisual: { image: kvImage, layout: layout.record, photos: photosRun.images, imageDesign, designCheck, gate: stages.keyVisual.gate ?? null, gateResults: stages.keyVisual.gateResults ?? [], photoPlan, sendBacks, compliance }, e02raw });
            stop("key-visual", "1枚画（LPの完成イメージ）のプレビュー確認のため止める（チェックポイント）", "checkpoint");
            }
            }
          }
        }
      }
    } else if (!stages.keyVisual) {
      stages.keyVisual = stageNotExecuted("前段で停止したため、1枚画を実行しない");
    }
  }

  // Stage 4 (generation): the tool's own input check runs first inside
  // the generation flow; a refusal never reaches the API. The stage pass
  // is the tool's grounding result, not its status alone (L-021).
  // Pipeline mode adds the R1 retry bound (fix F8): fixable failures
  // (API/parse errors, grounding failures) retry up to 3 attempts in
  // total; a refusal never retries. On resume the generation is not
  // re-run; it is reloaded and its grounding re-checked in-process.
  // Appeal and work-content coverage of a generation: every appeal
  // in the planning must be carried by a sentence, and the original's
  // work-content line must be cited. Grounding alone does not catch
  // an appeal that was simply never written (FICT-J02 run17: the
  // holidays and no-experience appeals, and the work content, were
  // dropped while grounding passed).
  const coverageOf = (generation) => {
    if (!planning || !generation) return null;
    const { byAppeal } = matchAppealSentences(generation, planning.appeals ?? []);
    const uncoveredAppeals = [...byAppeal.entries()].filter(([, idxs]) => idxs.length === 0).map(([id]) => id);
    let workLine = null;
    try {
      const orig = JSON.parse(readFileSync(resolveRoot(root, originalFile), "utf8"));
      workLine = (orig?.lines ?? []).find((l) => /^(仕事内容|Work\s*:|Duties\s*:|Job description)/i.test(l?.text ?? "")) ?? null;
    } catch { workLine = null; }
    const cited = new Set((generation.sentences ?? []).flatMap((x) => x?.sourceLines ?? []));
    const workUncovered = Boolean(workLine) && !cited.has(workLine.id);
    return { pass: uncoveredAppeals.length === 0 && !workUncovered, uncoveredAppeals, workLineId: workLine?.id ?? null, workUncovered };
  };
  let generationRun = null;
  let generationCoverage = null;
  if (!stoppedAt && resumedStages.has("generation")) {
    const generation = loadJson(path.join(root, generationFile));
    const factsForGrounding = fixedFacts ?? loadJson(path.join(root, factsFile));
    const originalForGrounding = JSON.parse(readFileSync(resolveRoot(root, originalFile), "utf8"));
    const grounding = checkGrounding(generation, factsForGrounding, originalForGrounding);
    generationRun = {
      status: "generated", generation, grounding, apiCalled: false,
      model: generation.model ?? null, promptVersion: generation.promptVersion ?? null,
      durationMs: null, usage: null, costUsd: null,
      costNote: "再開実行のため生成は再実行していない（費用は元の実行の記録にある）",
      reasonCode: null, reason: null,
    };
    stages.generation = {
      executed: false, resumed: true, status: "generated", apiCalled: false,
      model: generationRun.model, promptVersion: generationRun.promptVersion,
      durationMs: null, usage: null, costUsd: null, costNote: generationRun.costNote,
      grounding, reasonCode: null, reason: null,
    };
    if (!grounding.pass) {
      stop("generation", "再開時に読み直した生成物の根拠検査が pass しなかったため、後段を実行しない");
    }
    generationCoverage = coverageOf(generationRun.generation);
    if (generationCoverage && !generationCoverage.pass) {
      stop("generation", `再開時に読み直した生成物で、訴求・仕事内容の充足が不足しているため、後段を実行しない（未充足の訴求: ${generationCoverage.uncoveredAppeals.join(", ") || "なし"}${generationCoverage.workUncovered ? `、仕事内容の行 ${generationCoverage.workLineId} が未引用` : ""}）`);
    }
  } else if (!stoppedAt) {
    const maxAttempts = pipelineMode ? 3 : 1;
    let attempts = 0;
    let lastRun = null;
    let lastCopyReview = null;
    let attemptFeedback = options.feedbackFile ?? undefined;
    while (attempts < maxAttempts) {
      attempts++;
      lastRun = await generate({ root, originalFile, factsFile, approvalFile, planningFile: options.planningFile ?? undefined, feedbackFile: attemptFeedback });
      if (!lastRun || lastRun.status === "refused") break;
      if (lastRun.status === "generated" && lastRun.generation && lastRun.grounding && lastRun.grounding.pass === true) {
        generationCoverage = coverageOf(lastRun.generation);
        if (!generationCoverage || generationCoverage.pass) {
          // Copy review (2026-11-04): the sentences are judged by
          // the reader persona and the client before the run goes
          // on — coverage alone only proves the appeals exist, not
          // that they work. A fail retries with the findings as
          // feedback, inside the same attempt bound.
          if (!reviewPage) break;
          try { lastCopyReview = await reviewPage({ mode: "copy", planningFile: options.planningFile ?? null }); } catch (e) { lastCopyReview = { status: "error", reason: String(e?.message ?? e) }; }
          // Researched-pattern scan (loop-025): a judge passed
          // run26's boilerplate copy, so this rule does not rely on
          // the judge. Boilerplate request closings on appeal
          // sentences convert a pass into a fail with findings.
          if (lastCopyReview && lastCopyReview.status === "reviewed" && lastCopyReview.verdict === "pass") {
            const hits = boilerplateHits(lastRun.generation.sentences ?? []);
            if (hits.length > 0) {
              lastCopyReview = { ...lastCopyReview, verdict: "fail", boilerplateHits: hits, findings: [...(lastCopyReview.findings ?? []), ...hits.map((h) => ({ criterion: "appeal-patterns", target: `sentence ${h.index + 1}`, problem: "市場の型に反する定型の締めが訴求文に使われている", instruction: "定型の締めを外し、条件と読み手にとっての意味を短く断定する" }))] };
            }
          }
          if (lastCopyReview && lastCopyReview.status === "reviewed" && lastCopyReview.verdict === "pass") break;
          if (lastCopyReview && lastCopyReview.status === "reviewed" && lastCopyReview.verdict === "fail" && attempts < maxAttempts) {
            const prior = attemptFeedback ? (() => { try { return readFileSync(resolveRoot(root, attemptFeedback), "utf8"); } catch { return ""; } })() : "";
            const fbPath = path.join(path.dirname(generationFile), "copy-review-feedback.txt");
            mkdirSync(resolveRoot(root, path.dirname(fbPath)), { recursive: true });
            writeFileSync(resolveRoot(root, fbPath), reviewFeedbackText(lastCopyReview, prior), "utf8");
            attemptFeedback = fbPath;
            continue;
          }
          break;
        }
        if (attempts < maxAttempts) {
          // Send the missing coverage back as feedback and retry:
          // the next attempt is told exactly which appeals and which
          // part of the original are not yet in the copy.
          const missing = [
            ...generationCoverage.uncoveredAppeals.map((id) => `訴求 ${id} が文章に入っていない`),
            ...(generationCoverage.workUncovered ? [`仕事内容（原本の行 ${generationCoverage.workLineId}）が文章に入っていない`] : []),
          ];
          const prior = attemptFeedback ? (() => { try { return readFileSync(resolveRoot(root, attemptFeedback), "utf8"); } catch { return ""; } })() : "";
          const note = `${prior}${prior ? "\n" : ""}前回の生成で不足していた点（必ず入れること）:\n${missing.map((m) => `- ${m}`).join("\n")}\n`;
          const fbPath = path.join(path.dirname(generationFile), "coverage-feedback.txt");
          mkdirSync(resolveRoot(root, path.dirname(fbPath)), { recursive: true });
          writeFileSync(resolveRoot(root, fbPath), note, "utf8");
          attemptFeedback = fbPath;
        }
      }
    }
    generationRun = lastRun;
    stages.generation = {
      executed: true,
      attempts,
      status: generationRun ? (generationRun.status ?? null) : null,
      apiCalled: generationRun ? (generationRun.apiCalled ?? null) : null,
      model: generationRun ? (generationRun.model ?? null) : null,
      promptVersion: generationRun ? (generationRun.promptVersion ?? null) : null,
      durationMs: generationRun ? (generationRun.durationMs ?? null) : null,
      usage: generationRun ? (generationRun.usage ?? null) : null,
      costUsd: generationRun ? (generationRun.costUsd ?? null) : null,
      costNote: generationRun ? (generationRun.costNote ?? null) : null,
      grounding: generationRun ? (generationRun.grounding ?? null) : null,
      coverage: generationCoverage,
      review: lastCopyReview
        ? (lastCopyReview.status === "reviewed"
          ? { verdict: lastCopyReview.verdict, findings: lastCopyReview.findings ?? [], model: lastCopyReview.model ?? null, promptVersion: lastCopyReview.promptVersion ?? null }
          : { verdict: null, status: lastCopyReview.status ?? null, reason: lastCopyReview.reason ?? null })
        : (reviewPage ? null : { executed: false, reason: "レビュー実行器が接続されていない" }),
      reasonCode: generationRun ? (generationRun.reasonCode ?? null) : null,
      reason: generationRun ? (generationRun.reason ?? null) : null,
    };
    if (!generationRun || generationRun.status === "refused") {
      stop("generation", generationRun && generationRun.reason ? generationRun.reason : "生成の入力チェックで拒否されたため、後段を実行しない");
    } else if (generationRun.status !== "generated" || !generationRun.generation) {
      if (pipelineMode) holds.push({ stage: "generation", condition: "生成の完了", detail: "上限まで再試行したが生成が完了しなかった", attempts });
      stop("generation", "生成が完了しなかったため、後段を実行しない");
    } else if (!generationRun.grounding || generationRun.grounding.pass !== true) {
      if (pipelineMode) holds.push({ stage: "generation", condition: "根拠検査 pass", detail: "上限まで再試行したが根拠検査が pass しなかった", attempts });
      stop("generation", "生成の根拠検査が pass しなかったため、後段を実行しない");
    } else if (generationCoverage && !generationCoverage.pass) {
      if (pipelineMode) holds.push({ stage: "generation", condition: "訴求と仕事内容の充足", detail: `未充足の訴求: ${generationCoverage.uncoveredAppeals.join(", ") || "なし"}${generationCoverage.workUncovered ? `、仕事内容の行 ${generationCoverage.workLineId} が未引用` : ""}`, attempts });
      stop("generation", "訴求と仕事内容が文章に入っていないため、後段を実行しない");
    } else if (lastCopyReview && lastCopyReview.status === "reviewed" && lastCopyReview.verdict === "fail") {
      if (pipelineMode) holds.push({ stage: "generation", condition: "文章レビューの合格", detail: `所見: ${(lastCopyReview.findings ?? []).map((f) => f.problem).join(" / ")}`, attempts });
      stop("generation", `文章レビューが不合格のため、後段を実行しない（${(lastCopyReview.findings ?? []).map((f) => `${f.criterion}: ${f.problem}`).join(" / ")}）`);
    } else if (lastCopyReview && lastCopyReview.status !== "reviewed") {
      stop("generation", `文章レビューが実行できなかったため、後段を実行しない（${lastCopyReview.reason ?? "実行器の応答なし"}）`);
    } else if (pipelineMode && options.checkpoints === "full") {
      writePresentationRecord("text", {
        checkpoint: "text",
        presented: [{ kind: "generation", file: generationFile }],
        holds: [...holds],
        judgement: { result: null, confirmer: null, confirmedAt: null, corrections: [] },
      });
      persistState(["extraction", "factsComparison", "approval", "planning", "keyVisual", "generation"], { e02raw });
      stop("text-checkpoint", "文章のプレビュー確認のため止める（チェックポイント）", "checkpoint");
    }
  } else {
    stages.generation = stageNotExecuted("前段で停止したため、生成を実行しない");
  }

  // Stage 5 (images): typed image generation for the LP. A failure
  // stops the run; leftover files are never treated as success.
  // Pipeline mode (fix F4/F8): images come from the planning
  // correspondence (the hero photograph is the key-visual spec's
  // photograph, generated here as a real image; the finished image
  // itself is a preview artifact and is never assembled), retry up
  // to 3 attempts, and on exhaustion the missing images become a
  // hold: the run continues to assembly so the hold is presented
  // with the page, and the completion check fails on the expected
  // (planned) file list rather than the produced one.
  let imageRun = null;
  let expectedImageFiles = null;
  if (!stoppedAt && pipelineMode && correspondence) {
    // The LP images follow the image design (loop-023): the designed
    // set — spec images plus the appeals' own images — with the
    // design's prompts. Without a design record, the spec plan is
    // used as before.
    const kvStage = stages.keyVisual ?? null;
    const designForImages = (kvStage && kvStage.imageDesign) ?? null;
    // The effective prompts are the key-visual stage's photo plan
    // (the design prompts after any recorded send-back rebuild) when
    // it exists: the LP images must be generated from the very
    // prompts that passed the gates for the sample, not re-derived
    // from the raw design (run21: the raw design prompt for the
    // transport appeal still carried the gated term).
    const photoPlanForImages = kvStage && Array.isArray(kvStage.photoPlan) && kvStage.photoPlan.length > 0 ? kvStage.photoPlan : null;
    const specPlan = photoPlanForImages
      ? { images: photoPlanForImages.map((e) => ({ id: e.role === "key-visual" ? "hero" : e.id, line: null, role: e.role, prompt: e.prompt })) }
      : designForImages && Array.isArray(designForImages.images)
        ? { images: designForImages.images.map((e) => ({ id: e.kind === "hero" ? "hero" : e.id, line: null, role: e.role, prompt: e.prompt })) }
        : decideImagePlanFromSpecs({ correspondence });
    // LP-image gate (loop-024, from the independent review of run20):
    // the finished LP's images previously had NO gate at all — the
    // plan was re-derived here and its prompts were never checked, so
    // an exterior instruction in a prompt reached the shipped page
    // while every check passed. Now: every LP image prompt must pass
    // the prompt gates and the design-stage prompt scan, and when a
    // design record exists the plan must BE the design (same prompts,
    // nothing re-derived). A failure stops the run before generation.
    const planGateFailures = [];
    const expectedPrompts = new Map();
    if (photoPlanForImages) {
      for (const e of photoPlanForImages) expectedPrompts.set(e.role === "key-visual" ? "hero" : e.id, e.prompt);
    } else if (designForImages) {
      for (const e of designForImages.images) expectedPrompts.set(e.kind === "hero" ? "hero" : e.id, e.prompt);
    }
    for (const img of specPlan.images) {
      const g = checkPromptGates(img.prompt);
      if (!g.pass) planGateFailures.push(`${img.id}: プロンプトゲート不通過（${g.hits.map((h) => h.term).join("、")}）`);
      if (/building|exterior|facade|外観|建物/i.test(img.prompt)) planGateFailures.push(`${img.id}: プロンプトが職場・建物の外観を指示している（G9）`);
      if (expectedPrompts.size > 0) {
        if (!expectedPrompts.has(img.id)) planGateFailures.push(`${img.id}: 設計・1枚画の計画にない画像が生成計画にある`);
        else if (expectedPrompts.get(img.id) !== img.prompt) planGateFailures.push(`${img.id}: 生成計画のプロンプトが設計・1枚画の計画と一致しない`);
      }
    }
    if (designForImages && specPlan.images.length !== designForImages.images.length) {
      planGateFailures.push(`生成計画の枚数（${specPlan.images.length}）が設計（${designForImages.images.length}）と一致しない`);
    }
    let attempts = 0;
    let lastRun = null;
    if (planGateFailures.length > 0) {
      stages.images = { executed: true, pass: false, failures: planGateFailures };
      stop("images", `LP画像の生成計画が設計・ゲートと一致しないため、生成しない（${planGateFailures.join("、")}）`);
    } else if (specPlan.images.length === 0) {
      lastRun = { status: "generated", model: null, images: [], costUsd: 0, costNote: "企画の画像仕様に1枚画以外の要素がないため、追加の画像生成はない", reason: null };
    } else {
      while (attempts < 3) {
        attempts++;
        lastRun = await images({ root, generation: generationRun.generation, generationFile, factsFile, imagesDir, imagesRunFile, specPlan });
        if (lastRun && lastRun.status === "generated") break;
      }
    }
    if (lastRun && lastRun.status === "generated") {
      imageRun = { ...lastRun, images: lastRun.images ?? [] };
      expectedImageFiles = imageRun.images.map((i) => i.file);
      stages.images = {
        executed: true, attempts, status: imageRun.status ?? null, model: imageRun.model ?? null,
        images: imageRun.images, costUsd: imageRun.costUsd ?? null, costNote: imageRun.costNote ?? null, reason: null,
      };
    } else if (!stoppedAt) {
      holds.push({ stage: "images", condition: "企画の画像仕様どおりの画像生成", detail: "上限まで再試行したが画像生成が完了しなかった", attempts });
      imageRun = {
        status: "generated-with-holds", model: lastRun ? (lastRun.model ?? null) : null,
        images: [], costUsd: lastRun ? (lastRun.costUsd ?? null) : null,
        costNote: lastRun ? (lastRun.costNote ?? null) : null, reason: null,
      };
      expectedImageFiles = specPlan.images.map((s) => normalizePath(path.join(imagesDir, `${s.id}.png`)));
      stages.images = {
        executed: true, attempts, status: imageRun.status, model: imageRun.model,
        images: imageRun.images, costUsd: imageRun.costUsd, costNote: imageRun.costNote, reason: null,
        holds: holds.filter((h) => h.stage === "images"),
      };
    }
  } else if (!stoppedAt) {
    imageRun = await images({ root, generation: generationRun.generation, generationFile, factsFile, imagesDir, imagesRunFile });
    stages.images = {
      executed: true,
      status: imageRun ? (imageRun.status ?? null) : null,
      model: imageRun ? (imageRun.model ?? null) : null,
      images: imageRun ? (imageRun.images ?? []) : [],
      costUsd: imageRun ? (imageRun.costUsd ?? null) : null,
      costNote: imageRun ? (imageRun.costNote ?? null) : null,
      reason: imageRun ? (imageRun.reason ?? null) : null,
    };
    if (!imageRun || imageRun.status !== "generated") {
      stop("images", imageRun && imageRun.reason ? imageRun.reason : "画像生成が完了しなかったため、後段を実行しない");
    }
  } else {
    stages.images = stageNotExecuted("前段で停止したため、画像生成を実行しない");
  }

  // Stage 6 (LP assembly): combine the generation sentences (verbatim)
  // with the existing image files into the complete LP page. Missing
  // files are left out and reported; the completion check decides.
  // Pipeline mode passes the hero chips (fix F5): the planning's
  // first-check FACT values, verbatim.
  let assembly = null;
  if (!stoppedAt) {
    const heroChips = pipelineMode && correspondence
      ? (correspondence.firstCheckKeys ?? [])
        .map((k) => {
          const item = ((fixedFacts && fixedFacts.items) ?? []).find((i) => i.key === k);
          return item && item.status === "stated" ? item.value : null;
        })
        .filter((v) => typeof v === "string" && v.length > 0)
      : undefined;
    // Assembly retries (audit F-b on C8): bounded retries in
    // pipeline mode, and an error is always captured and recorded —
    // a failed write must never crash the whole run unrecorded.
    const maxAssemblyAttempts = pipelineMode ? 3 : 1;
    let assemblyAttempts = 0;
    let assemblyError = null;
    while (assemblyAttempts < maxAssemblyAttempts && !assembly) {
      assemblyAttempts += 1;
      try {
        assembly = await assemble({ root, generation: generationRun.generation, images: imageRun.images ?? [], imagesDir, lpFile, heroChips, layout: (resumeState && resumeState.keyVisual && resumeState.keyVisual.layout) ?? (stages.keyVisual && stages.keyVisual.layout) ?? null, planning: planning ?? null, facts: fixedFacts ?? null });
        assemblyError = null;
      } catch (e) {
        assembly = null;
        assemblyError = e;
      }
    }
    if (assembly) {
      stages.lpAssembly = {
        executed: true,
        attempts: assemblyAttempts,
        file: assembly.file ?? lpFile,
        referenced: assembly.referenced ?? [],
        skipped: assembly.skipped ?? [],
        layoutUsed: assembly.layoutUsed ?? false,
        appealCoverage: assembly.assignments?.appealCoverage ?? null,
        omittedImageFiles: assembly.assignments?.omittedImageFiles ?? [],
      };
    } else {
      const detail = `組み立てが${assemblyAttempts}回とも失敗した: ${String(assemblyError?.message ?? assemblyError)}`;
      stages.lpAssembly = { executed: true, attempts: assemblyAttempts, error: detail };
      if (pipelineMode) {
        holds.push({ stage: "assembly", condition: "lp-assembly", detail, attempts: assemblyAttempts });
      }
      stop("assembly", `LP の組み立てが失敗したため、後段を実行しない（${detail}）`);
    }
  } else {
    stages.lpAssembly = stageNotExecuted("前段で停止したため、LP の組み立てを実行しない");
  }

  // Stage 7 (re-verification): mechanical checks by the tool itself,
  // plus the completion check (C1–C4) recorded here (design M2 keeps
  // verify.mjs unchanged; verify's own judgement is untouched).
  let verification = null;
  if (!stoppedAt) {
    verification = verify({
      root,
      generationFile,
      approvalFile,
      generation: generationRun.generation,
      humanConfirmation: options.humanConfirmation,
    });
    stages.verification = {
      executed: true,
      inputIdentity: verification.inputIdentity,
      grounding: verification.grounding,
      mechanicalPass: verification.mechanicalPass,
      humanConfirmation: verification.humanConfirmation,
      verdict: verification.verdict,
      completion: null,
    };
    if (verification.verdict.status === "fail") {
      stop("verification", verification.verdict.reason ?? "再検証が不合格のため、後段を実行しない");
    } else {
      let pagecheck = null;
      try {
        const lpHtml = readFileSync(resolveRoot(root, lpFile), "utf8");
        pagecheck = checkPage(lpHtml);
      } catch { pagecheck = null; }
      const appealCoverage = pipelineMode && planning && Array.isArray(planning.appeals)
        ? planning.appeals.map((a) => ({ appealId: a.id, sentenceIdxs: matchAppealSentences(generationRun.generation, planning.appeals).byAppeal.get(a.id) ?? [] }))
        : undefined;
      let factsForCompletion = null;
      let originalForCompletion = null;
      try { factsForCompletion = loadJson(resolveRoot(root, factsFile)); } catch { factsForCompletion = null; }
      try { originalForCompletion = loadJson(resolveRoot(root, originalFile)); } catch { originalForCompletion = null; }
      const completion = checkCompletion({
        root,
        generation: generationRun.generation,
        imageFiles: expectedImageFiles ?? (imageRun.images ?? []).map((i) => i.file),
        lpFile,
        grounding: verification.grounding,
        pagecheck,
        appealCoverage,
        omittedImageFiles: assembly?.assignments?.omittedImageFiles ?? stages.lpAssembly?.omittedImageFiles ?? [],
        facts: pipelineMode ? factsForCompletion : null,
        original: pipelineMode ? originalForCompletion : null,
      });
      stages.verification.completion = completion;
      if (pipelineMode) {
        writePresentationRecord("lp", {
          checkpoint: "lp",
          presented: [{ kind: "lp", file: lpFile }],
          completion: { pass: completion.pass, failures: completion.failures },
          holds: [...holds],
          judgement: { result: null, confirmer: null, confirmedAt: null, corrections: [] },
        });
      }
      if (!completion.pass) {
        stop("verification", completion.reason);
      }
      // Stage 7.5 (review): the assembled page is judged by the
      // reader persona and the client (src/review.mjs). A fail sends
      // the findings back to generation once; a second fail stops
      // the run with the findings on record. Until this stage
      // existed, no preview or checklist in the pipeline ever failed
      // a page the user then rejected (2026-11-04).
      if (pipelineMode && !stoppedAt) {
        if (!reviewPage) {
          stages.review = { executed: false, reason: "レビュー実行器が接続されていないため、審査を実行しない" };
        } else {
          let reviewAttempts = 0;
          let reviewResult = null;
          const reviewSendBacks = [];
          while (reviewAttempts < 2) {
            reviewAttempts++;
            try {
              reviewResult = await reviewPage({ mode: "page", root, planningFile: options.planningFile ?? null, lpFile });
            } catch (e) {
              reviewResult = { status: "error", reason: String(e?.message ?? e) };
            }
            if (!reviewResult || reviewResult.status !== "reviewed") {
              stages.review = { executed: true, attempts: reviewAttempts, status: reviewResult?.status ?? null, reason: reviewResult?.reason ?? null, sendBacks: reviewSendBacks };
              stop("review", `レビューが実行できなかったため、後段を実行しない（${reviewResult?.reason ?? "実行器の応答なし"}）`);
              break;
            }
            stages.review = { executed: true, attempts: reviewAttempts, verdict: reviewResult.verdict, findings: reviewResult.findings ?? [], model: reviewResult.model ?? null, promptVersion: reviewResult.promptVersion ?? null, sendBacks: reviewSendBacks };
            if (reviewResult.verdict !== "fail") break;
            if (reviewAttempts >= 2) break;
            const prior = options.feedbackFile && existsSync(resolveRoot(root, options.feedbackFile)) ? readFileSync(resolveRoot(root, options.feedbackFile), "utf8") : "";
            const fbPath = path.join(path.dirname(generationFile), "review-feedback.txt");
            mkdirSync(resolveRoot(root, path.dirname(fbPath)), { recursive: true });
            writeFileSync(resolveRoot(root, fbPath), reviewFeedbackText(reviewResult, prior), "utf8");
            reviewSendBacks.push({ attempt: reviewAttempts, findings: reviewResult.findings ?? [] });
            stages.review.sendBacks = reviewSendBacks;
            const regen = await generate({ root, originalFile, factsFile, approvalFile, planningFile: options.planningFile ?? undefined, feedbackFile: fbPath });
            if (!regen || regen.status !== "generated" || !regen.generation || !regen.grounding || regen.grounding.pass !== true) {
              stop("review", "レビューの差し戻し後の再生成が完了しなかったため、後段を実行しない");
              break;
            }
            const regenCoverage = coverageOf(regen.generation);
            if (regenCoverage && !regenCoverage.pass) {
              stop("review", "レビューの差し戻し後の生成で訴求・仕事内容の充足が不足したため、後段を実行しない");
              break;
            }
            generationRun = { ...generationRun, ...regen };
            const heroChips2 = correspondence
              ? (correspondence.firstCheckKeys ?? [])
                .map((k) => {
                  const item = ((fixedFacts && fixedFacts.items) ?? []).find((i) => i.key === k);
                  return item && item.status === "stated" ? item.value : null;
                })
                .filter((v) => typeof v === "string" && v.length > 0)
              : undefined;
            const rebuilt = await assemble({ root, generation: generationRun.generation, images: imageRun.images ?? [], imagesDir, lpFile, heroChips: heroChips2, layout: (resumeState && resumeState.keyVisual && resumeState.keyVisual.layout) ?? (stages.keyVisual && stages.keyVisual.layout) ?? null, planning: planning ?? null, facts: fixedFacts ?? null });
            stages.lpAssembly = { ...stages.lpAssembly, attempts: (stages.lpAssembly?.attempts ?? 1) + 1, file: rebuilt.file ?? lpFile, referenced: rebuilt.referenced ?? [], layoutUsed: rebuilt.layoutUsed ?? false, appealCoverage: rebuilt.assignments?.appealCoverage ?? null, omittedImageFiles: rebuilt.assignments?.omittedImageFiles ?? [], afterReviewSendBack: true };
            let pagecheck2 = null;
            try { pagecheck2 = checkPage(readFileSync(resolveRoot(root, lpFile), "utf8")); } catch { pagecheck2 = null; }
            const coverage2 = planning && Array.isArray(planning.appeals) ? planning.appeals.map((a) => ({ appealId: a.id, sentenceIdxs: matchAppealSentences(generationRun.generation, planning.appeals).byAppeal.get(a.id) ?? [] })) : undefined;
            let factsForCompletion2 = null;
            let originalForCompletion2 = null;
            try { factsForCompletion2 = loadJson(resolveRoot(root, factsFile)); } catch { factsForCompletion2 = null; }
            try { originalForCompletion2 = loadJson(resolveRoot(root, originalFile)); } catch { originalForCompletion2 = null; }
            const completion2 = checkCompletion({ root, generation: generationRun.generation, imageFiles: expectedImageFiles ?? (imageRun.images ?? []).map((i) => i.file), lpFile, grounding: regen.grounding, pagecheck: pagecheck2, appealCoverage: coverage2, omittedImageFiles: rebuilt.assignments?.omittedImageFiles ?? [], facts: factsForCompletion2, original: originalForCompletion2 });
            stages.verification.completion = completion2;
            if (!completion2.pass) {
              stop("verification", completion2.reason);
              break;
            }
          }
          if (!stoppedAt && reviewResult && reviewResult.status === "reviewed" && reviewResult.verdict === "fail") {
            stop("review", `ペルソナ／クライアントレビューが不合格のため、後段を実行しない（${(reviewResult.findings ?? []).map((f) => `${f.criterion}: ${f.problem}`).join(" / ")}）`);
          }
          if (stages.review && stages.review.executed) {
            writePresentationRecord("lp", {
              checkpoint: "lp",
              presented: [{ kind: "lp", file: lpFile }],
              completion: { pass: stages.verification.completion?.pass ?? null, failures: stages.verification.completion?.failures ?? [] },
              review: { verdict: stages.review.verdict ?? null, findings: stages.review.findings ?? [], attempts: stages.review.attempts ?? null },
              holds: [...holds],
              judgement: { result: null, confirmer: null, confirmedAt: null, corrections: [] },
            });
          }
        }
      }
    }
  } else {
    stages.verification = stageNotExecuted("前段で停止したため、再検証を実行しない");
  }

  // Preview: never from the automatic run while the verdict is not pass,
  // and never at all unless explicitly allowed (stage 2 of the brief's
  // two-stage execution enables it after human confirmation).
  let previewResult = null;
  if (stoppedAt) {
    stages.preview = stageNotExecuted("前段で停止したため、プレビューを生成しない");
  } else if (!verification || verification.verdict.status !== "pass") {
    stages.preview = {
      executed: false,
      reason: "再検証の最終判定が未確定（pending-human-confirmation）のため、プレビューに進まない。人間確認を省略して自動で進む経路は作らない",
      verdictStatus: verification ? verification.verdict.status : null,
    };
  } else if (!options.allowPreview) {
    stages.preview = {
      executed: false,
      reason: "本実行（機械検査まで）ではプレビューを生成しない。プレビューは人間確認の確定後に別段階で生成する",
      verdictStatus: verification.verdict.status,
    };
  } else {
    previewResult = preview({ generation: generationRun.generation, verification, facts: fixedFacts, e02, repoUrl: options.repoUrl });
    stages.preview = { executed: true, generated: previewResult.generated, reason: previewResult.reason ?? null };
    if (!previewResult.generated) stop("preview", previewResult.reason ?? "プレビューが生成されなかった");
  }

  const extractionCost = stages.extraction.costUsd;
  const generationCost = stages.generation && typeof stages.generation === "object" ? stages.generation.costUsd : null;
  const imageCost = stages.images && typeof stages.images === "object" ? stages.images.costUsd : null;
  const costsKnown = typeof extractionCost === "number" && typeof generationCost === "number" && typeof imageCost === "number";
  const totalCostUsd = costsKnown ? extractionCost + generationCost + imageCost : null;
  const imageCount = stages.images && Array.isArray(stages.images.images) ? stages.images.images.length : null;

  let status;
  if (stoppedAt) status = stopKind === "checkpoint" ? "stopped-at-checkpoint" : (stoppedAt === "preview" ? "failed" : "stopped");
  else if (verification && verification.verdict.status === "pass") status = "pass";
  else status = "pending-human-confirmation";

  return {
    kind: "demo-run-result",
    version: 1,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - t0),
    status,
    stoppedAt,
    stopReason,
    input: {
      original: { file: originalFile },
      facts: { file: factsFile },
      approval: { file: approvalFile },
    },
    stages,
    e02,
    ...(pipelineMode ? {
      checkpoints: options.checkpoints ?? null,
      stopKind,
      holds,
      presentationRecords,
      planning: planning ? { file: options.planningFile ?? null, sha256: planningSha256 } : null,
      stateFile,
      entry: entryArtifacts,
    } : {}),
    generation: generationRun ? (generationRun.generation ?? null) : null,
    verification: verification ?? null,
    previewHtml: previewResult ? (previewResult.html ?? null) : null,
    artifacts: {
      generationFile: !stoppedAt || stages.generation.executed ? normalizePath(generationFile) : null,
      verificationFile: normalizePath(options.verificationFile ?? "loops/loop-010/verification-result.json"),
      lpFile: !stoppedAt || (stages.lpAssembly && stages.lpAssembly.executed) ? normalizePath(lpFile) : null,
      imagesRunFile: !stoppedAt || (stages.images && stages.images.executed) ? normalizePath(imagesRunFile) : null,
      preview: null,
    },
    costs: {
      category: "製品実行",
      currency: "USD",
      extractionCostUsd: extractionCost ?? null,
      generationCostUsd: generationCost ?? null,
      imageCostUsd: imageCost ?? null,
      totalCostUsd,
      breakdown: [
        { stage: "抽出（工程1、ライブ）", costUsd: extractionCost ?? null, usage: stages.extraction.usage ?? null },
        { stage: "生成（工程3、ライブ）", costUsd: generationCost ?? null, usage: stages.generation && stages.generation.usage !== undefined ? stages.generation.usage : null },
        { stage: "画像生成（muse-image-1.0、ライブ）", costUsd: imageCost ?? null, usage: null, note: typeof imageCost === "number" && typeof imageCount === "number" ? `画像 ${imageCount} 枚 × $0.01 の算出値。確定実費は dev.meta.ai Billing 実績との突合が必要` : "未記録（画像生成が実行されなかったため推定しない）" },
        { stage: "再検証・プレビュー生成", costUsd: 0, usage: null, note: "API を呼ばないため費用は発生しない" },
      ],
      note: totalCostUsd === null
        ? "抽出と生成と画像の算出値がそろわなかったため、合計は未記録（推定しない）。内訳の算出値は各道具の D4 単価による算出値で、確定実費は dev.meta.ai Billing 実績との突合が必要"
        : "統合実行1回の費用は抽出と生成と画像の算出値の合計。いずれも D4 単価による算出値で、確定実費は dev.meta.ai Billing 実績との突合が必要",
    },
  };
}

// --- Live executors (CLI連携). Each tool keeps its own API caller and
// its own refusal-before-API behaviour; the runner only collects. ---

async function runNode(args, env) {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, args, { maxBuffer: 16 * 1024 * 1024, env: env ?? process.env });
    return { exitCode: 0, stdout, stderr };
  } catch (e) {
    return { exitCode: typeof e.code === "number" ? e.code : 1, stdout: e.stdout ?? "", stderr: e.stderr ?? String(e.message ?? e) };
  }
}

function parseLastJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { /* fall through */ }
  const start = text.indexOf("{");
  if (start < 0) return null;
  try { return JSON.parse(text.slice(start)); } catch { return null; }
}

// Freshness and exit-code handling (design A-3). Before spawning a
// child, its output files are removed; after a non-zero exit the
// previous files are never read (a failure is never reported as a
// success on the basis of leftover files). After exit 0 the run
// record must have been written anew, and a "generated"/"completed"
// status additionally requires its artifact file to exist. Costs stay
// unrecorded on failure (never estimated).
function removeIfExists(absPath) {
  try {
    rmSync(absPath, { force: true });
  } catch {
    // Missing file or removal failure: the post-run existence check
    // decides. Never throw here.
  }
}

function childErrorResult(stage, exitCode) {
  return {
    status: "child-error",
    reason: `子プロセスが終了コード ${exitCode} で失敗したため、後段を実行しない（前回の実行記録や生成ファイルは使わない）`,
    exitCode,
    apiCalled: false,
    usage: null,
    costUsd: null,
    costNote: "未記録（子プロセスが失敗したため推定しない）",
  };
}

export function liveDeps({ root, outDir, generationFile, run, imagesDir, imagesRunFile, planningFile, feedbackFile, textApiKey, imageApiKey }) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const extractionOutDir = path.join(outDir, "extraction");
  const runner = run ?? runNode;
  // Per-stage keys (loop-022): when the text stages run against a
  // different endpoint than the image stage (e.g. text on Baseten,
  // images on the Meta API), each child gets the key for its own
  // endpoint. Without explicit keys, children inherit the environment
  // exactly as before.
  // Each stage's child env carries ONLY the key for its own endpoint
  // (2026-11-04): the other provider's key is removed, and when the
  // endpoint's key is missing the child gets none and blocks itself,
  // instead of falling back to the wrong key.
  const stageEnv = (key) => {
    const e = { ...process.env };
    delete e.BASETEN_API_KEY;
    if (key) e.MODEL_API_KEY = key; else delete e.MODEL_API_KEY;
    return e;
  };
  const textRunner = (args) => runner(args, stageEnv(textApiKey));
  const imageRunner = (args) => runner(args, stageEnv(imageApiKey));
  const imgDir = imagesDir ?? path.join(path.dirname(generationFile), "images");
  const imgRunRel = imagesRunFile ?? path.join(outDir, "images-run.json");
  return {
    extract: async ({ originalFile: origFile, inputId, inputVersion } = {}) => {
      const liveFile = path.join(root, extractionOutDir, "live-run.json");
      removeIfExists(liveFile);
      const ran = await textRunner([
        path.join(here, "extract-and-check.mjs"), "--prompt", "v1.2", "--out-dir", extractionOutDir,
        ...(origFile ? ["--original", origFile] : []),
        ...(inputId ? ["--input-id", inputId] : []),
        ...(inputVersion ? ["--input-version", inputVersion] : []),
      ]);
      if (ran.exitCode !== 0) {
        return { ...childErrorResult("extraction", ran.exitCode), facts: null, schemaCheck: null, e01: null, e02: null };
      }
      if (!existsSync(liveFile)) {
        return {
          ...childErrorResult("extraction", ran.exitCode),
          status: "stale-output",
          reason: `子プロセスは終了コード 0 で終わったが、実行記録ファイル ${normalizePath(path.join(extractionOutDir, "live-run.json"))} が今回の実行で更新されなかったため、成功として扱わない`,
          facts: null, schemaCheck: null, e01: null, e02: null,
        };
      }
      return loadJson(liveFile);
    },
    generate: async ({ originalFile, factsFile, approvalFile, planningFile: callPlanningFile, feedbackFile: callFeedbackFile }) => {
      const genAbs = path.join(root, generationFile);
      const runOutRel = path.join(outDir, "generation-run.json");
      const runOutAbs = path.join(root, runOutRel);
      removeIfExists(runOutAbs);
      removeIfExists(genAbs);
      // Planning path (fix F2/F10): with a planning input the executor
      // is generate-planning.mjs, whose intent layer comes from the
      // planning file (and the feedback memo, when given).
      const effPlanningFile = callPlanningFile ?? planningFile;
      const effFeedbackFile = callFeedbackFile ?? feedbackFile;
      const script = effPlanningFile ? "generate-planning.mjs" : "generate.mjs";
      const ran = await textRunner([
        path.join(here, script), "--approval", approvalFile, "--original", originalFile, "--facts", factsFile, "--out", generationFile, "--run-out", runOutRel,
        ...(effPlanningFile ? ["--planning", effPlanningFile] : []),
        ...(effPlanningFile && effFeedbackFile ? ["--feedback", effFeedbackFile] : []),
      ]);
      if (ran.exitCode !== 0) {
        return { ...childErrorResult("generation", ran.exitCode), generation: null, grounding: null };
      }
      if (!existsSync(runOutAbs)) {
        return {
          ...childErrorResult("generation", ran.exitCode),
          status: "stale-output",
          reason: `子プロセスは終了コード 0 で終わったが、実行記録ファイル ${normalizePath(runOutRel)} が今回の実行で更新されなかったため、成功として扱わない`,
          generation: null, grounding: null,
        };
      }
      const record = loadJson(runOutAbs);
      if (record.status === "generated") {
        if (!existsSync(genAbs)) {
          return {
            ...childErrorResult("generation", ran.exitCode),
            status: "stale-output",
            reason: "生成の実行記録は generated だが、生成ファイルが今回の実行で書かれていないため、成功として扱わない",
            generation: null, grounding: null,
          };
        }
        return { ...record, generation: loadJson(genAbs) };
      }
      return { ...record, generation: null };
    },
    review: async ({ mode = "page", planningFile: callPlanningFile, lpFile: callLpFile, generationFile: callGenerationFile, outlineFile: callOutlineFile } = {}) => {
      const runOutRel = path.join(outDir, `review-${mode}-run.json`);
      const runOutAbs = path.join(root, runOutRel);
      removeIfExists(runOutAbs);
      const effPlanningFile = callPlanningFile ?? planningFile;
      if (!effPlanningFile) return { status: "error", reason: "レビューには企画入力が必要だが、 planningFile が指定されていない" };
      const args = [
        path.join(here, "review-page.mjs"), "--mode", mode, "--planning", effPlanningFile,
        "--out", path.join(outDir, `review-${mode}.json`), "--run-out", runOutRel,
      ];
      if (mode === "page") args.push("--lp", callLpFile ?? path.join(path.dirname(generationFile), "lp.html"), "--image-plan", path.join(path.dirname(generationFile), "image-plan.json"));
      if (mode === "copy") args.push("--generation", callGenerationFile ?? generationFile);
      if (mode === "sample") args.push("--outline", callOutlineFile ?? path.join(outDir, "sample-outline.json"));
      const ran = await textRunner(args);
      if (!existsSync(runOutAbs)) {
        return { ...childErrorResult("review", ran.exitCode), verdict: null, findings: [] };
      }
      return loadJson(runOutAbs);
    },
    images: async ({ generationFile: genFile, factsFile: factsF, specPlan }) => {
      const runOutAbs = resolveRoot(root, imgRunRel);
      removeIfExists(runOutAbs);
      // Spec-plan mode (fix F4): prompts were computed by the runner
      // from the planning correspondence and are executed as a plan.
      let planArgs = ["--generation", genFile, "--facts", factsF];
      if (specPlan) {
        const planRel = path.join(outDir, "image-plan.json");
        mkdirSync(path.dirname(path.join(root, planRel)), { recursive: true });
        writeFileSync(path.join(root, planRel), JSON.stringify(specPlan, null, 2) + "\n", "utf8");
        planArgs = ["--plan-file", planRel];
      }
      const ran = await imageRunner([path.join(here, "generate-images.mjs"), ...planArgs, "--out-dir", imgDir, "--run-out", imgRunRel]);
      if (ran.exitCode !== 0) {
        return { ...childErrorResult("images", ran.exitCode), images: [] };
      }
      if (!existsSync(runOutAbs)) {
        return {
          ...childErrorResult("images", ran.exitCode),
          status: "stale-output",
          reason: `子プロセスは終了コード 0 で終わったが、実行記録ファイル ${normalizePath(imgRunRel)} が今回の実行で更新されなかったため、成功として扱わない`,
          images: [],
        };
      }
      const record = loadJson(runOutAbs);
      if (record.status === "generated") {
        const missing = (record.images ?? []).filter((i) => !existsSync(resolveRoot(root, i.file)));
        if (missing.length > 0) {
          return {
            ...childErrorResult("images", ran.exitCode),
            status: "stale-output",
            reason: `画像の実行記録は generated だが、画像ファイル ${missing.length} 件が今回の実行で書かれていないため、成功として扱わない`,
            images: record.images ?? [],
          };
        }
        return { ...record, images: record.images ?? [] };
      }
      return { ...record, images: record.images ?? [] };
    },
    // Key visual photographs: the planning specs as a multi-image plan
    // through the same image tool in plan-file mode, with the same
    // freshness rules as the LP images.
    keyVisualPhotos: async ({ photoPlan, imagesDir: photosDir }) => {
      const runRel = path.join(outDir, "key-visual-photos-run.json");
      const runAbs = resolveRoot(root, runRel);
      removeIfExists(runAbs);
      const planRel = path.join(outDir, "key-visual-photos-plan.json");
      mkdirSync(path.dirname(path.join(root, planRel)), { recursive: true });
      writeFileSync(path.join(root, planRel), JSON.stringify({ images: photoPlan.map((pp) => ({ id: pp.id, prompt: pp.prompt, line: null })) }, null, 2) + "\n", "utf8");
      const ran = await imageRunner([path.join(here, "generate-images.mjs"), "--plan-file", planRel, "--out-dir", photosDir, "--run-out", runRel]);
      if (ran.exitCode !== 0) {
        return { ...childErrorResult("key-visual-photos", ran.exitCode), images: [] };
      }
      if (!existsSync(runAbs)) {
        return {
          ...childErrorResult("key-visual-photos", ran.exitCode),
          status: "stale-output",
          reason: `子プロセスは終了コード 0 で終わったが、実行記録ファイル ${normalizePath(runRel)} が今回の実行で更新されなかったため、成功として扱わない`,
          images: [],
        };
      }
      const record = loadJson(runAbs);
      if (record.status === "generated") {
        const missing = (record.images ?? []).filter((i) => !existsSync(resolveRoot(root, i.file)));
        if (missing.length > 0) {
          return { ...childErrorResult("key-visual-photos", ran.exitCode), status: "stale-output", reason: "1枚画の写真の実行記録は generated だが、画像ファイルが今回の実行で書かれていないため、成功として扱わない", images: record.images ?? [] };
        }
        const byId = new Map(photoPlan.map((pp) => [pp.id, pp]));
        return { ...record, images: (record.images ?? []).map((i) => ({ ...i, role: byId.get(i.id)?.role ?? null, prompt: byId.get(i.id)?.prompt ?? null })) };
      }
      return { ...record, images: record.images ?? [] };
    },
    // The finished image: compose (done by the runner) and render here.
    renderFinishedImage: async ({ html, outDir: dir, baseName }) => {
      const rendered = await renderHtmlToImage({
        root,
        html,
        htmlFile: path.join(dir, `${baseName}.html`),
        outFile: path.join(dir, `${baseName}.png`),
      });
      return { status: rendered.status, file: normalizePath(rendered.file), htmlFile: normalizePath(rendered.htmlFile) };
    },

  };
}

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "..");
  const argv = process.argv.slice(2);
  const outDir = argValue(argv, "--out-dir") ?? "loops/loop-010";
  const originalFile = argValue(argv, "--original") ?? "src/fict-j01-v1.json";
  const factsFile = argValue(argv, "--facts") ?? "src/facts/FICT-J01-facts-v1.json";
  const approvalFile = argValue(argv, "--approval") ?? "src/facts/FICT-J01-facts-v1.approval.json";
  const generationFile = argValue(argv, "--generation-out") ?? `${outDir.replaceAll("\\", "/")}/generated-lp-v1.json`;
  const verificationFile = `${outDir.replaceAll("\\", "/")}/verification-result.json`;
  const runResultFile = `${outDir.replaceAll("\\", "/")}/run-result.json`;
  const imagesDir = argValue(argv, "--images-dir") ?? `${generationFile.replaceAll("\\", "/").split("/").slice(0, -1).join("/")}/images`;
  const imagesRunFile = argValue(argv, "--images-run-out") ?? `${outDir.replaceAll("\\", "/")}/images-run.json`;
  const lpFile = argValue(argv, "--lp-out") ?? `${generationFile.replaceAll("\\", "/").split("/").slice(0, -1).join("/")}/lp.html`;
  // Pipeline mode (fix F1–F10): --posting <text file> hands a posting
  // in as text (pinned into <out-dir>/entry/); --planning <file> is
  // the planning input; --checkpoints full|light selects the
  // checkpoint set; --resume <state file> continues a checkpointed
  // run, with --kv-confirmation <file> carrying the human's key-visual
  // confirmation ({ file, sha256, confirmer, confirmedAt }).
  const planningFile = argValue(argv, "--planning") ?? undefined;
  const inputId = argValue(argv, "--input-id") ?? undefined;
  const inputVersion = argValue(argv, "--input-version") ?? undefined;
  const feedbackFile = argValue(argv, "--feedback") ?? undefined;
  const checkpoints = argValue(argv, "--checkpoints") ?? undefined;
  const postingFile = argValue(argv, "--posting");
  let posting;
  let effOriginalFile = originalFile;
  let effFactsFile = factsFile;
  let effApprovalFile = approvalFile;
  if (postingFile) {
    const entryDir = `${outDir.replaceAll("\\", "/")}/entry`;
    posting = { id: argValue(argv, "--posting-id") ?? "ENTRY-001", version: "v1", text: readFileSync(path.join(root, postingFile), "utf8") };
    effOriginalFile = `${entryDir}/original.json`;
    effFactsFile = `${entryDir}/facts.json`;
    effApprovalFile = argValue(argv, "--approval") ?? `${entryDir}/approval.json`;
  }
  let resumeState;
  let kvConfirmation;
  const resumeFile = argValue(argv, "--resume");
  if (resumeFile) {
    resumeState = loadJson(path.join(root, resumeFile));
  }
  const kvConfFile = argValue(argv, "--kv-confirmation");
  if (kvConfFile) {
    kvConfirmation = loadJson(path.join(root, kvConfFile));
  }
  // On a resume, the run's directory is the resumed run's own
  // directory: writing the advanced state (or any output) into the
  // default directory would corrupt another run's records and the
  // resumed run would never advance past its checkpoint.
  const effOutDir = argValue(argv, "--out-dir") ?? (resumeFile ? resumeFile.replaceAll("\\", "/").split("/").slice(0, -1).join("/") : outDir);
  const effGenerationFile = resumeState?.files?.generationFile ?? generationFile;
  const effGenDir = effGenerationFile.replaceAll("\\", "/").split("/").slice(0, -1).join("/");

  const result = await runDemo(
    {
      root, originalFile: effOriginalFile, factsFile: effFactsFile, approvalFile: effApprovalFile, generationFile, verificationFile, imagesDir, lpFile, imagesRunFile, allowPreview: false,
      ...(posting ? { posting } : {}),
      ...(planningFile ? { planningFile } : {}),
      ...(feedbackFile ? { feedbackFile } : {}),
      ...(checkpoints ? { checkpoints } : {}),
      ...(inputId ? { inputId } : {}),
      ...(inputVersion ? { inputVersion } : {}),
      ...(resumeState ? { verificationFile: `${effOutDir}/verification-result.json` } : {}),
      ...(resumeState?.files?.generationFile ? { lpFile: `${resumeState.files.generationFile.replaceAll("\\", "/").split("/").slice(0, -1).join("/")}/lp.html`, generationFile: resumeState.files.generationFile, imagesDir: `${resumeState.files.generationFile.replaceAll("\\", "/").split("/").slice(0, -1).join("/")}/images`, imagesRunFile: `${resumeState.files.generationFile.replaceAll("\\", "/").split("/").slice(0, -1).join("/")}/images-run.json` } : {}),
      ...(resumeState ? { resumeState } : {}),
      ...(kvConfirmation ? { kvConfirmation } : {}),
      stateFile: `${effOutDir}/run-state.json`,
    },
    liveDeps({ root, outDir: effOutDir, generationFile: effGenerationFile, imagesDir: `${effGenDir}/images`, imagesRunFile: `${effGenDir}/images-run.json`, planningFile, feedbackFile, textApiKey: ((process.env.PIPELINE_BASE_URL ?? "").includes("baseten") ? process.env.BASETEN_API_KEY : process.env.MODEL_API_KEY) || undefined, imageApiKey: process.env.MODEL_API_KEY || undefined }),
  );

  mkdirSync(path.join(root, effOutDir), { recursive: true });
  if (result.verification) {
    writeFileSync(path.join(root, `${effOutDir}/verification-result.json`), JSON.stringify(result.verification, null, 2) + "\n", "utf8");
  }
  const { generation, verification, previewHtml, ...record } = result;
  writeFileSync(path.join(root, `${effOutDir}/run-result.json`), JSON.stringify({ ...record, generationFile, verificationFile, lpFile }, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({
    status: result.status,
    stoppedAt: result.stoppedAt,
    stopReason: result.stopReason,
    e01Verdict: result.stages.extraction.e01 ? result.stages.extraction.e01.verdict : null,
    e02Verdict: result.e02.verdict,
    generationStatus: result.stages.generation.status ?? null,
    verificationVerdict: result.verification ? result.verification.verdict.status : null,
    costs: result.costs,
  }, null, 2));
  if (result.status === "stopped" || result.status === "failed") process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
