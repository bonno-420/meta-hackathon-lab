// Step 4 (re-verification): re-verify a generation against the approved
// FACTs, independently of the generation step. Fictional data only.
//
// Independence is secured by (i) never using the generation step's declared
// values as evidence, (ii) re-identifying the inputs from the current file
// bytes, and (iii) re-running the grounding check here. The yardstick is
// shared on purpose: the existing checkGrounding is imported and re-run,
// no new yardstick is created. This tool never calls any API, uses no
// model and no API key, and works fully offline. Hash definition is F1
// (sha256 over the stored bytes, UTF-8/LF).
//
// A re-verification pass has effect only up to in-demo preview permission;
// it is never a publication permission (G-INV-4).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkApprovalValidity, sha256File } from "./approve.mjs";
import { checkGenerationInput, checkGrounding } from "./generate.mjs";

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function safeSha256(root, file) {
  if (!file) return { actual: null, error: "file is not specified in the generation header" };
  try {
    return { actual: sha256File(path.join(root, file)), error: null };
  } catch (e) {
    return { actual: null, error: String(e && e.message ? e.message : e) };
  }
}

// Human confirmation template (work item 4). Every sentence starts
// unfilled; the section stays "pending" until a human fills each result
// ("対応あり" or the mismatch detail), the confirmer and the date.
export function buildHumanConfirmationTemplate(generation) {
  const sentences = generation && Array.isArray(generation.sentences) ? generation.sentences : [];
  return {
    status: "pending",
    confirmer: null,
    confirmedAt: null,
    sentences: sentences.map((s, idx) => ({
      sentence: idx,
      text: s && typeof s.text === "string" ? s.text : null,
      factKeys: s && Array.isArray(s.factKeys) ? s.factKeys : [],
      sourceLines: s && Array.isArray(s.sourceLines) ? s.sourceLines : [],
      result: null,
      detail: null,
    })),
    note: "機械検査で覆えない意味の対応（文が使っている項目と factKeys・sourceLines の対応、期間・個数などの数量表現、否定・条件の反転、公開・申込と読める表現の混入）は人間の確認に残る。全文の確認が終わるまで再検証は合格にならない",
  };
}

// Input identity (work item 2). The original/FACT files under inspection
// are the ones the generation header points at. All three points must
// hold, otherwise the generation is treated as expired and the grounding
// re-run is not performed:
// 1. header hashes (and file names) match the current files' real bytes;
// 2. the header approvalId identifies the given approval record;
// 3. the approval is in force: status approved with approver/approvedAt,
//    and checkApprovalValidity recomputed now returns valid: true. This
//    is the same two-condition test as the generation start condition
//    (checkGenerationInput is re-applied). The static validity.invalidated
//    value stored in the record is never used as evidence; a draft fails
//    here even when the recomputed validity is true.
export function checkInputIdentity({ root, generation, approval, originalFile, factsFile, approvalFile }) {
  const headerOriginal = (generation && generation.input && generation.input.original) || {};
  const headerFacts = (generation && generation.input && generation.input.facts) || {};
  const headerOriginalFile = headerOriginal.file ?? null;
  const headerFactsFile = headerFacts.file ?? null;
  const providedOriginalFile = originalFile ?? headerOriginalFile;
  const providedFactsFile = factsFile ?? headerFactsFile;

  const checks = [];

  checks.push({
    id: "original-file",
    pass: Boolean(headerOriginalFile) && providedOriginalFile === headerOriginalFile,
    expected: headerOriginalFile,
    actual: providedOriginalFile,
  });
  checks.push({
    id: "facts-file",
    pass: Boolean(headerFactsFile) && providedFactsFile === headerFactsFile,
    expected: headerFactsFile,
    actual: providedFactsFile,
  });

  const origHash = safeSha256(root, headerOriginalFile);
  checks.push({
    id: "original-hash",
    pass: Boolean(headerOriginal.sha256) && origHash.actual !== null && origHash.actual === headerOriginal.sha256,
    expected: headerOriginal.sha256 ?? null,
    actual: origHash.actual,
    error: origHash.error,
  });
  const factsHash = safeSha256(root, headerFactsFile);
  checks.push({
    id: "facts-hash",
    pass: Boolean(headerFacts.sha256) && factsHash.actual !== null && factsHash.actual === headerFacts.sha256,
    expected: headerFacts.sha256 ?? null,
    actual: factsHash.actual,
    error: factsHash.error,
  });

  const headerApprovalId = (generation && generation.input && generation.input.approvalId) ?? null;
  const recordApprovalId = approval ? (approval.approvalId ?? null) : null;
  checks.push({
    id: "approval-id",
    pass: Boolean(headerApprovalId) && headerApprovalId === recordApprovalId,
    expected: headerApprovalId,
    actual: recordApprovalId,
  });

  const status = approval ? (approval.status ?? null) : null;
  const approver = approval ? (approval.approver ?? null) : null;
  const approvedAt = approval ? (approval.approvedAt ?? null) : null;
  checks.push({
    id: "approval-status",
    pass: status === "approved" && Boolean(approver) && Boolean(approvedAt),
    expected: "approved with approver and approvedAt",
    actual: { status, approver, approvedAt },
  });

  let validity = null;
  try {
    validity = checkApprovalValidity(approval, { root, originalFile: headerOriginalFile, factsFile: headerFactsFile });
  } catch (e) {
    validity = { valid: false, approvalId: recordApprovalId, status, checks: [], reason: String(e && e.message ? e.message : e) };
  }
  checks.push({
    id: "approval-validity",
    pass: validity.valid === true,
    expected: true,
    actual: validity.valid,
    validity,
  });

  // Re-apply the generation start condition itself (same two conditions).
  let generationInput = null;
  if (approvalFile) {
    try {
      generationInput = checkGenerationInput({ root, originalFile: headerOriginalFile, factsFile: headerFactsFile, approvalFile });
    } catch (e) {
      generationInput = { ok: false, reasonCode: "approval-invalid", reason: String(e && e.message ? e.message : e) };
    }
    checks.push({
      id: "generation-input",
      pass: generationInput.ok === true,
      expected: true,
      actual: generationInput.ok,
      reasonCode: generationInput.reasonCode ?? null,
      reason: generationInput.reason ?? null,
    });
  } else {
    checks.push({ id: "generation-input", pass: true, skipped: true, expected: true, actual: null, reasonCode: null, reason: "approvalFile not given; approval-status and approval-validity checks above carry the judgement" });
  }

  const mandatory = checks.filter((c) => !c.skipped);
  const pass = mandatory.every((c) => c.pass);
  const failures = mandatory
    .filter((c) => !c.pass)
    .map((c) => ({ check: c.id, expected: c.expected ?? null, actual: c.actual ?? null }));

  return {
    pass,
    checks,
    failures,
    original: { id: headerOriginal.id ?? null, version: headerOriginal.version ?? null, file: headerOriginalFile, headerSha256: headerOriginal.sha256 ?? null, actualSha256: origHash.actual },
    facts: { factsId: headerFacts.factsId ?? null, factsVersion: headerFacts.factsVersion ?? null, file: headerFactsFile, headerSha256: headerFacts.sha256 ?? null, actualSha256: factsHash.actual },
    approvalId: { header: headerApprovalId, record: recordApprovalId, match: headerApprovalId !== null && headerApprovalId === recordApprovalId },
    approval: { approvalId: recordApprovalId, status, approver, approvedAt },
    validity,
    generationInput,
  };
}

// Judgement (work item 5). Derived only from the three re-verification
// results: input identity, the re-run grounding result, and the human
// confirmation. The generation's own status and the generation step's
// declared values are never consulted.
export function decideVerdict({ inputIdentity, grounding, humanConfirmation }) {
  if (!inputIdentity || !inputIdentity.pass) {
    return {
      status: "fail",
      pass: false,
      category: "input-identity",
      reason: "入力同一性が確認できないため、生成物は失効したものとして不合格にする。工程3への差し戻し扱いとする",
      effect: "なし（デモ内プレビューは許可しない）",
    };
  }
  if (!grounding || grounding.skipped || !grounding.pass) {
    return {
      status: "fail",
      pass: false,
      category: "grounding",
      reason: "根拠検査の再実行が不合格のため不合格にする。工程3への差し戻し扱いとする",
      effect: "なし（デモ内プレビューは許可しない）",
    };
  }
  if (!humanConfirmation || humanConfirmation.status !== "completed") {
    return {
      status: "pending-human-confirmation",
      pass: false,
      mechanicalPass: true,
      category: "human-confirmation",
      reason: "機械検査（入力同一性と根拠検査の再実行）は pass したが、人間の確認（意味の対応）が未完了のため、再検証の合格は未確定である",
      effect: "未確定。合格となった場合の効果はデモ内プレビューの許可までであり、公開の許可ではない（G-INV-4）",
    };
  }
  const sentences = Array.isArray(humanConfirmation.sentences) ? humanConfirmation.sentences : [];
  if (sentences.length === 0 || sentences.some((s) => !s || s.result === null || s.result === undefined || s.result === "")) {
    return {
      status: "pending-human-confirmation",
      pass: false,
      mechanicalPass: true,
      category: "human-confirmation",
      reason: "人間の確認（意味の対応）で未確認の文が残っているため、再検証の合格は未確定である",
      effect: "未確定。合格となった場合の効果はデモ内プレビューの許可までであり、公開の許可ではない（G-INV-4）",
    };
  }
  const mismatches = sentences.filter((s) => s.result !== "対応あり");
  if (mismatches.length > 0) {
    return {
      status: "fail",
      pass: false,
      category: "human-confirmation",
      reason: "人間の確認（意味の対応）で不一致が確認されたため不合格にする。工程3への差し戻し扱いとする",
      effect: "なし（デモ内プレビューは許可しない）",
      mismatches,
    };
  }
  return {
    status: "pass",
    pass: true,
    mechanicalPass: true,
    category: null,
    reason: "入力同一性、根拠検査の再実行、人間の確認（意味の対応）の3点すべてが満たされたため合格とする",
    effect: "デモ内プレビューの許可までであり、公開の許可ではない（G-INV-4）",
  };
}

// Re-verification execution: input identity first, and the grounding
// re-run only when identity holds. Loaded objects may be injected
// (tests use copies); otherwise files are loaded from root.
export function runVerification({ root, generationFile, approvalFile, originalFile, factsFile, generation, approval, facts, original, humanConfirmation }) {
  const verifiedAt = new Date().toISOString();
  const generationObj = generation ?? loadJson(path.join(root, generationFile));
  const approvalObj = approval ?? loadJson(path.join(root, approvalFile));
  const headerOriginalFile = generationObj && generationObj.input && generationObj.input.original ? generationObj.input.original.file : null;
  const headerFactsFile = generationObj && generationObj.input && generationObj.input.facts ? generationObj.input.facts.file : null;

  const inputIdentity = checkInputIdentity({
    root,
    generation: generationObj,
    approval: approvalObj,
    originalFile: originalFile ?? headerOriginalFile,
    factsFile: factsFile ?? headerFactsFile,
    approvalFile,
  });

  let grounding;
  if (!inputIdentity.pass) {
    grounding = {
      pass: false,
      checked: 0,
      issues: [],
      skipped: true,
      skipReason: "入力同一性が確認できないため、根拠検査には進まない（対象の同一性が担保できない生成物に合格を出す経路を作らない）",
    };
  } else {
    const factsObj = facts ?? loadJson(path.join(root, headerFactsFile));
    const originalObj = original ?? loadJson(path.join(root, headerOriginalFile));
    grounding = { ...checkGrounding(generationObj, factsObj, originalObj), skipped: false, skipReason: null };
  }

  const human = humanConfirmation ?? buildHumanConfirmationTemplate(generationObj);
  const verdict = decideVerdict({ inputIdentity, grounding, humanConfirmation: human });
  const mechanicalPass = inputIdentity.pass && !grounding.skipped && grounding.pass;

  let generationSha256 = null;
  if (generationFile && existsSync(path.join(root, generationFile))) {
    try { generationSha256 = sha256File(path.join(root, generationFile)); } catch { generationSha256 = null; }
  }

  return {
    kind: "re-verification-result",
    version: 1,
    verifiedAt,
    target: {
      generationFile: generationFile ?? null,
      generationSha256,
      promptVersion: generationObj ? (generationObj.promptVersion ?? null) : null,
      model: generationObj ? (generationObj.model ?? null) : null,
      sentenceCount: generationObj && Array.isArray(generationObj.sentences) ? generationObj.sentences.length : 0,
    },
    inputIdentity,
    grounding,
    humanConfirmation: human,
    mechanicalPass,
    verdict,
    apiCalled: false,
    costUsd: 0,
    costNote: "再検証の道具は API を呼ばないため費用は発生しない。区分は D5 の製品実行とし、金額は 0 とする",
  };
}

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "..");
  const argv = process.argv.slice(2);
  const generationFile = argValue(argv, "--generation");
  const approvalFile = argValue(argv, "--approval");
  const originalFile = argValue(argv, "--original");
  const factsFile = argValue(argv, "--facts");
  const out = argValue(argv, "--out");
  if (!generationFile || !approvalFile) {
    console.error("usage: verify.mjs --generation <f> --approval <f> [--original <f>] [--facts <f>] [--out <verification-result.json>]");
    process.exitCode = 2;
    return;
  }
  const result = runVerification({ root, generationFile, approvalFile, originalFile: originalFile ?? undefined, factsFile: factsFile ?? undefined });
  if (out) {
    const outPath = path.join(root, out);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify(result, null, 2));
  if (result.verdict.status === "fail") process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  try {
    main();
  } catch (err) {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  }
}
