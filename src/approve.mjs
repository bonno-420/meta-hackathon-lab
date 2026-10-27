// Step 2 (approval): build an approval draft for a fixed FACT set and
// check an approval's validity. Fictional data only.
//
// The approval itself is a human act. This tool only prepares the draft
// (approver and approvedAt stay null) and runs the mechanical guards:
// - both files' sha256 (F1 definition: the bytes as stored, UTF-8/LF) must
//   match the FACT manifest before a draft is created;
// - no draft is created when the reconciliation stopped on a contradiction
//   (G-INV-3: there is no "ignore the warning" approval);
// - validity of an existing approval is judged by recomputing both hashes.

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

// Build an approval draft (status "draft", approver/approvedAt null).
// Throws when a guard fails; in that case no draft exists.
export function buildApprovalDraft({ root, originalFile, factsFile, manifestFile, reconciliationFile, caseId, checksFile }) {
  const manifest = loadJson(path.join(root, manifestFile));
  const originalSha = sha256File(path.join(root, originalFile));
  const factsSha = sha256File(path.join(root, factsFile));
  if (originalSha !== manifest.original.sha256) {
    throw new Error(`original hash mismatch: computed ${originalSha}, manifest ${manifest.original.sha256}. Draft not created.`);
  }
  if (factsSha !== manifest.sha256) {
    throw new Error(`facts hash mismatch: computed ${factsSha}, manifest ${manifest.sha256}. Draft not created.`);
  }

  const run = loadJson(path.join(root, reconciliationFile));
  const rec = run[caseId];
  if (!rec) throw new Error(`reconciliation case ${caseId} not found in ${reconciliationFile}. Draft not created.`);
  if (rec.stoppedAtReconciliation || String(rec.verdict).includes("停止")) {
    throw new Error(`reconciliation ${caseId} stopped (${rec.verdict}). Approval is impossible for a contradicted target. Draft not created.`);
  }

  const facts = loadJson(path.join(root, factsFile));
  const unstatedItems = facts.items.filter((i) => i.status === "unstated").map((i) => i.key);

  let verbatimNote = "未確認";
  if (checksFile) {
    const checks = loadJson(path.join(root, checksFile));
    if (checks.verbatimAdopted && checks.verbatimAdopted.pass) {
      verbatimNote = `pass（${checksFile}、${checks.verbatimAdopted.checked}件）`;
    }
  }

  return {
    approvalId: `${manifest.original.id}-approval-1`,
    status: "draft",
    approver: null,
    approvedAt: null,
    target: {
      original: { id: manifest.original.id, version: manifest.original.version, file: originalFile, sha256: originalSha },
      facts: { factsId: facts.factsId, factsVersion: facts.factsVersion, file: factsFile, sha256: factsSha },
    },
    basis: {
      reconciliation: `${reconciliationFile} の ${caseId}（${rec.verdict}）`,
      schemaCheck: run.schemaCheck && run.schemaCheck.pass ? `pass（${reconciliationFile}）` : "未確認",
      verbatimCheck: verbatimNote,
    },
    scope: {
      covers: "stated 項目のみ",
      unstatedItems,
      unstatedNote: "未記載は未記載として表示に残し、承認の対象に含めない",
      effect: "工程3（生成）の入力として使用できること。再検証の合格は公開許可ではない（G-INV-4）",
    },
    validity: {
      rule: "原本または FACT の sha256 が本記録と異なれば無効とし、照合からやり直す",
      invalidated: false,
      invalidatedReason: null,
    },
  };
}

// Judge whether an approval is still valid against the current files.
// Used here and by step 4 (re-verification).
export function checkApprovalValidity(approval, { root, originalFile, factsFile }) {
  const checks = [];
  const oSha = sha256File(path.join(root, originalFile));
  checks.push({ target: "original", file: originalFile, expected: approval.target.original.sha256, actual: oSha, match: oSha === approval.target.original.sha256 });
  const fSha = sha256File(path.join(root, factsFile));
  checks.push({ target: "facts", file: factsFile, expected: approval.target.facts.sha256, actual: fSha, match: fSha === approval.target.facts.sha256 });
  const valid = checks.every((c) => c.match);
  return {
    valid,
    approvalId: approval.approvalId,
    status: approval.status,
    checks,
    reason: valid ? null : "原本または FACT のハッシュが承認記録と異なるため無効。照合からやり直す",
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
  const cmd = argv[0];
  if (cmd === "draft") {
    const draft = buildApprovalDraft({
      root,
      originalFile: argValue(argv, "--original"),
      factsFile: argValue(argv, "--facts"),
      manifestFile: argValue(argv, "--manifest"),
      reconciliationFile: argValue(argv, "--reconciliation"),
      caseId: (argValue(argv, "--case") || "e01").toLowerCase(),
      checksFile: argValue(argv, "--checks"),
    });
    const out = argValue(argv, "--out");
    if (out) writeFileSync(path.join(root, out), JSON.stringify(draft, null, 2) + "\n", "utf8");
    console.log(JSON.stringify(draft, null, 2));
    return;
  }
  if (cmd === "check") {
    const approval = loadJson(path.join(root, argValue(argv, "--approval")));
    const result = checkApprovalValidity(approval, {
      root,
      originalFile: argValue(argv, "--original"),
      factsFile: argValue(argv, "--facts"),
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
    return;
  }
  console.error("usage: approve.mjs draft --original <f> --facts <f> --manifest <f> --reconciliation <f> [--case E01] [--checks <f>] [--out <f>] | approve.mjs check --approval <f> --original <f> --facts <f>");
  process.exitCode = 2;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  try {
    main();
  } catch (err) {
    console.error(String(err && err.message ? err.message : err));
    process.exitCode = 1;
  }
}
