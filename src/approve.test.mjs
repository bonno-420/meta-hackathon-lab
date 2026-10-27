// Reproducible checks for src/approve.mjs (step 2).
// Run: node src/approve.test.mjs [--out <path>]
// No API access, no cost. Exits non-zero if any expectation fails.
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApprovalDraft, checkApprovalValidity } from "./approve.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const outPath = outIdx >= 0 ? argv[outIdx + 1] : null;
const results = [];
function expect(id, actual, wanted) {
  results.push({ id, pass: actual === wanted, expected: wanted, actual });
}
function expectThrows(id, fn) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  results.push({ id, pass: threw, expected: "throw", actual: threw ? "throw" : "no-throw" });
}
const REAL = {
  root,
  originalFile: "src/fict-j01-v1.json",
  factsFile: "src/facts/FICT-J01-facts-v1.json",
  manifestFile: "src/facts/FICT-J01-facts-v1.manifest.json",
  reconciliationFile: "loops/loop-006/exp-v1.1/live-run.json",
  checksFile: "loops/loop-006/check-verification.json",
};
// Positive: a draft is created for the adopted FACT v1 (E01 agreed).
const draft = buildApprovalDraft({ ...REAL, caseId: "e01" });
expect("draft-created", draft.status, "draft");
expect("draft-approver-null", draft.approver, null);
expect("draft-approvedAt-null", draft.approvedAt, null);
expect("draft-target-facts-sha", draft.target.facts.sha256, "3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec");
expect("draft-target-original-sha", draft.target.original.sha256, "a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60");
expect("draft-unstated-items", JSON.stringify(draft.scope.unstatedItems), JSON.stringify(["renewal", "housing"]));
// Negative: E02 stopped on a contradiction, so no draft may be created.
expectThrows("draft-refused-for-e02-contradiction", () => buildApprovalDraft({ ...REAL, caseId: "e02" }));
// Scratch copies for tampering cases.
const scratch = mkdtempSync(path.join(tmpdir(), "approve-test-"));
for (const [src, dst] of [
  ["src/fict-j01-v1.json", "orig.json"],
  ["src/facts/FICT-J01-facts-v1.json", "facts.json"],
  ["src/facts/FICT-J01-facts-v1.manifest.json", "manifest.json"],
  ["loops/loop-006/exp-v1.1/live-run.json", "run.json"],
]) {
  copyFileSync(path.join(root, src), path.join(scratch, dst));
}
const SCRATCH = { root: scratch, originalFile: "orig.json", factsFile: "facts.json", manifestFile: "manifest.json", reconciliationFile: "run.json", checksFile: null };
// Negative: a tampered FACT file no longer matches the manifest hash.
const tampered = JSON.parse(readFileSync(path.join(scratch, "facts.json"), "utf8"));
tampered.items[0].value = "改変された値";
writeFileSync(path.join(scratch, "facts.json"), JSON.stringify(tampered, null, 2) + "\n", "utf8");
expectThrows("draft-refused-for-facts-hash-mismatch", () => buildApprovalDraft({ ...SCRATCH, caseId: "e01" }));
// Validity: restore the scratch facts, finalize a copy of the draft, and
// check it against the real files (valid), then against the tampered
// scratch facts (invalid).
copyFileSync(path.join(root, "src/facts/FICT-J01-facts-v1.json"), path.join(scratch, "facts.json"));
const finalized = { ...draft, status: "approved", approver: "Norikazu Harada（本人）", approvedAt: "2026-10-27T00:00:00+09:00" };
const validReal = checkApprovalValidity(finalized, { root, originalFile: REAL.originalFile, factsFile: REAL.factsFile });
expect("validity-true-for-untouched-files", validReal.valid, true);
writeFileSync(path.join(scratch, "facts.json"), JSON.stringify(tampered, null, 2) + "\n", "utf8");
const validTampered = checkApprovalValidity(finalized, { root: scratch, originalFile: "orig.json", factsFile: "facts.json" });
expect("validity-false-for-tampered-facts", validTampered.valid, false);
expect("validity-reason-present", typeof validTampered.reason, "string");
const pass = results.every((r) => r.pass);
const record = { testFile: "src/approve.test.mjs", target: "src/approve.mjs", pass, results, runAt: new Date().toISOString() };
console.log(JSON.stringify(record, null, 2));
if (outPath) writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf8");
if (!pass) process.exitCode = 1;
