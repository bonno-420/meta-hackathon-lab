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
import { checkApprovalValidity } from "./approve.mjs";
import { checkQuoteVerbatim, loadOriginal } from "./extract-and-check.mjs";
import { checkGenerationInput } from "./generate.mjs";
import { runVerification } from "./verify.mjs";
import { buildPreview } from "./build-preview.mjs";

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
      diffs.push({ key, issue: !f ? "candidate has an extra key" : "candidate is missing the key" });
      continue;
    }
    if (c.status !== f.status) diffs.push({ key, field: "status", fixed: f.status, candidate: c.status });
    if (c.normalized !== f.normalized) diffs.push({ key, field: "normalized", fixed: f.normalized, candidate: c.normalized });
    if (c.sourceLine !== f.sourceLine) diffs.push({ key, field: "sourceLine", fixed: f.sourceLine, candidate: c.sourceLine });
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
export function assembleLP({ root, generation, images, lpDir }) {
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
    body += `<section class="lp-hero"><img src="${esc(srcFor(hero))}" alt="hero"></section>\n`;
    placed.push(hero.file);
  }
  sentences.forEach((s, idx) => {
    const text = s && typeof s.text === "string" ? s.text : "";
    body += `<p class="lp-sentence" data-sentence="${idx}">${esc(text)}</p>\n`;
    const lines = s && Array.isArray(s.sourceLines) ? s.sourceLines : [];
    for (const img of images ?? []) {
      if (img.id === "hero" || placed.includes(img.file)) continue;
      if (img.line != null && lines.includes(img.line)) {
        body += `<figure class="lp-image"><img src="${esc(srcFor(img))}" alt="${esc(img.id)}"></figure>\n`;
        placed.push(img.file);
      }
    }
  });
  for (const img of images ?? []) {
    if (existing.has(img.id) && !placed.includes(img.file)) {
      body += `<figure class="lp-image"><img src="${esc(srcFor(img))}" alt="${esc(img.id)}"></figure>\n`;
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
export function checkCompletion({ root, generation, imageFiles, lpFile, grounding }) {
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
  const c2Pass = files.length > 0 && missingFiles.length === 0 && unreferenced.length === 0;
  checks.push({
    id: "C2",
    pass: c2Pass,
    detail: c2Pass
      ? `画像 ${files.length} 件がすべて実在し、ページから参照されている`
      : `画像の欠け: 存在しない ${missingFiles.length} 件、参照されていない ${unreferenced.length} 件（記録 ${files.length} 件中）`,
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
  const failures = checks.filter((c) => !c.pass).map((c) => ({ check: c.id, detail: c.detail }));
  const pass = checks.every((c) => c.pass);
  return {
    pass,
    checks,
    failures,
    reason: pass ? null : `未完成のため止める（${failures.map((f) => f.check).join("、")}）: ${failures[0].detail}`,
    note: "画像の意味は範囲外である。人間の確認と完成の判定は文章と機械的な含有を対象とし、画像が内容として適切かは今回の判定に含めない。",
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
  const assemble = deps.assemble ?? (async ({ root, generation, images, lpFile }) => {
    const built = assembleLP({ root, generation, images, lpDir: path.dirname(lpFile) });
    mkdirSync(path.dirname(resolveRoot(root, lpFile)), { recursive: true });
    writeFileSync(resolveRoot(root, lpFile), built.html, "utf8");
    return { file: lpFile, referenced: built.referenced, skipped: built.skipped };
  });
  const verify = deps.verify ?? ((args) => runVerification(args));
  const preview = deps.preview ?? (({ generation, verification, facts, e02, repoUrl }) => buildPreview({ generation, verification, facts, e02, repoUrl }));

  const stages = {};
  let stoppedAt = null;
  let stopReason = null;
  const stop = (stage, reason) => { stoppedAt = stage; stopReason = reason; };

  // Stage 1: extraction and reconciliation (E01 and E02 in one run).
  const extraction = await extract();
  const e01 = extraction && extraction.e01 ? extraction.e01 : null;
  const e02raw = extraction && extraction.e02 ? extraction.e02 : null;
  stages.extraction = {
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

  if (!extraction || extraction.status !== "completed" || !extraction.facts) {
    stop("extraction", extraction && extraction.reason ? extraction.reason : (extraction && extraction.parseError ? extraction.parseError : "抽出が完了しなかったため、後段を実行しない"));
  } else if (extraction.schemaCheck && extraction.schemaCheck.pass !== true) {
    stop("extraction", "抽出結果のスキーマ完全性チェックが pass しなかったため、後段を実行しない");
  } else if (!e01 || e01.stoppedAtReconciliation || !String(e01.verdict ?? "").includes("一致")) {
    stop("reconciliation", e01 ? `E01 の照合が停止したため、後段を実行しない（${e01.verdict ?? "判定なし"}）` : "E01 の照合結果が得られなかったため、後段を実行しない");
  }

  // Stage 2 (facts comparison): the candidate must not substantively
  // disagree with the fixed FACT v1 that the approval stands for.
  let fixedFacts = null;
  if (!stoppedAt) {
    fixedFacts = loadJson(path.join(root, factsFile));
    const original = loadOriginal();
    const verbatim = checkQuoteVerbatim(extraction.facts, original);
    const comparison = compareFactSets(extraction.facts, fixedFacts);
    stages.factsComparison = { executed: true, verbatim, ...comparison };
    if (!verbatim.pass) {
      stop("facts-comparison", "抽出候補の引用逐語性チェックが pass しなかったため、後段を実行しない");
    } else if (!comparison.agrees) {
      stop("facts-comparison", "抽出の再実行で得た FACT 候補が固定済み FACT v1 と食い違うため、その時点で止める（承認は FACT v1 の組にのみ成立しているため）");
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
    }
  } else {
    stages.approval = stageNotExecuted("前段で停止したため、承認の有効性の再確認を実行しない");
  }

  // Stage 4 (generation): the tool's own input check runs first inside
  // the generation flow; a refusal never reaches the API. The stage pass
  // is the tool's grounding result, not its status alone (L-021).
  let generationRun = null;
  if (!stoppedAt) {
    generationRun = await generate({ root, originalFile, factsFile, approvalFile });
    stages.generation = {
      executed: true,
      status: generationRun ? (generationRun.status ?? null) : null,
      apiCalled: generationRun ? (generationRun.apiCalled ?? null) : null,
      model: generationRun ? (generationRun.model ?? null) : null,
      promptVersion: generationRun ? (generationRun.promptVersion ?? null) : null,
      durationMs: generationRun ? (generationRun.durationMs ?? null) : null,
      usage: generationRun ? (generationRun.usage ?? null) : null,
      costUsd: generationRun ? (generationRun.costUsd ?? null) : null,
      costNote: generationRun ? (generationRun.costNote ?? null) : null,
      grounding: generationRun ? (generationRun.grounding ?? null) : null,
      reasonCode: generationRun ? (generationRun.reasonCode ?? null) : null,
      reason: generationRun ? (generationRun.reason ?? null) : null,
    };
    if (!generationRun || generationRun.status === "refused") {
      stop("generation", generationRun && generationRun.reason ? generationRun.reason : "生成の入力チェックで拒否されたため、後段を実行しない");
    } else if (generationRun.status !== "generated" || !generationRun.generation) {
      stop("generation", "生成が完了しなかったため、後段を実行しない");
    } else if (!generationRun.grounding || generationRun.grounding.pass !== true) {
      stop("generation", "生成の根拠検査が pass しなかったため、後段を実行しない");
    }
  } else {
    stages.generation = stageNotExecuted("前段で停止したため、生成を実行しない");
  }

  // Stage 5 (images): typed image generation for the LP. A failure
  // stops the run; leftover files are never treated as success.
  let imageRun = null;
  if (!stoppedAt) {
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
  let assembly = null;
  if (!stoppedAt) {
    assembly = await assemble({ root, generation: generationRun.generation, images: imageRun.images ?? [], imagesDir, lpFile });
    stages.lpAssembly = {
      executed: true,
      file: assembly ? (assembly.file ?? lpFile) : lpFile,
      referenced: assembly ? (assembly.referenced ?? []) : [],
      skipped: assembly ? (assembly.skipped ?? []) : [],
    };
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
      const completion = checkCompletion({
        root,
        generation: generationRun.generation,
        imageFiles: (imageRun.images ?? []).map((i) => i.file),
        lpFile,
        grounding: verification.grounding,
      });
      stages.verification.completion = completion;
      if (!completion.pass) {
        stop("verification", completion.reason);
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
  if (stoppedAt) status = stoppedAt === "preview" ? "failed" : "stopped";
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

async function runNode(args) {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, args, { maxBuffer: 16 * 1024 * 1024, env: process.env });
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

export function liveDeps({ root, outDir, generationFile, run, imagesDir, imagesRunFile }) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const extractionOutDir = path.join(outDir, "extraction");
  const runner = run ?? runNode;
  const imgDir = imagesDir ?? path.join(path.dirname(generationFile), "images");
  const imgRunRel = imagesRunFile ?? path.join(outDir, "images-run.json");
  return {
    extract: async () => {
      const liveFile = path.join(root, extractionOutDir, "live-run.json");
      removeIfExists(liveFile);
      const ran = await runner([path.join(here, "extract-and-check.mjs"), "--prompt", "v1.1", "--out-dir", extractionOutDir]);
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
    generate: async ({ originalFile, factsFile, approvalFile }) => {
      const genAbs = path.join(root, generationFile);
      const runOutRel = path.join(outDir, "generation-run.json");
      const runOutAbs = path.join(root, runOutRel);
      removeIfExists(runOutAbs);
      removeIfExists(genAbs);
      const ran = await runner([path.join(here, "generate.mjs"), "--approval", approvalFile, "--original", originalFile, "--facts", factsFile, "--out", generationFile, "--run-out", runOutRel]);
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
    images: async ({ generationFile: genFile, factsFile: factsF }) => {
      const runOutAbs = resolveRoot(root, imgRunRel);
      removeIfExists(runOutAbs);
      const ran = await runner([path.join(here, "generate-images.mjs"), "--generation", genFile, "--facts", factsF, "--out-dir", imgDir, "--run-out", imgRunRel]);
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

  const result = await runDemo(
    { root, originalFile, factsFile, approvalFile, generationFile, verificationFile, imagesDir, lpFile, imagesRunFile, allowPreview: false },
    liveDeps({ root, outDir, generationFile, imagesDir, imagesRunFile }),
  );

  mkdirSync(path.join(root, outDir), { recursive: true });
  if (result.verification) {
    writeFileSync(path.join(root, verificationFile), JSON.stringify(result.verification, null, 2) + "\n", "utf8");
  }
  const { generation, verification, previewHtml, ...record } = result;
  writeFileSync(path.join(root, runResultFile), JSON.stringify({ ...record, generationFile, verificationFile, lpFile }, null, 2) + "\n", "utf8");
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
