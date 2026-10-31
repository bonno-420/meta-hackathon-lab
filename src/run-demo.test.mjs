// Reproducible checks for src/run-demo.mjs and src/build-preview.mjs
// (step 5). Run: node src/run-demo.test.mjs [--out <path>]
// The API-calling stages are stubbed: this test never calls the real API
// and costs nothing. The one live integrated run is separate
// (loops/loop-010/run-result.json). Tampered cases use clones or copies
// in a temporary folder; fixed files are never rewritten. Exits
// non-zero on any failure.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPreview, checkPreviewPairing, writePreview } from "./build-preview.mjs";
import { checkApprovalStage, compareFactSets, liveDeps, runDemo } from "./run-demo.mjs";
import { runVerification } from "./verify.mjs";

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

const REAL = {
  root,
  originalFile: "src/fict-j01-v1.json",
  factsFile: "src/facts/FICT-J01-facts-v1.json",
  approvalFile: "src/facts/FICT-J01-facts-v1.approval.json",
};
const fixedFacts = JSON.parse(readFileSync(path.join(root, REAL.factsFile), "utf8"));
const realGeneration = JSON.parse(readFileSync(path.join(root, "loops/loop-008/generated-lp-v1.json"), "utf8"));
const realFacts = fixedFacts;

const E01_OK = { caseId: "E01", stage: "照合", verdict: "一致（人間承認待ち）", stoppedAtReconciliation: false, generationStarted: false, matched: [], contradictions: [], unstated: [{ key: "renewal" }, { key: "housing" }], claims: {} };
const E02_STOP = { caseId: "E02", stage: "照合", verdict: "停止（矛盾あり）", stoppedAtReconciliation: true, generationStarted: false, matched: [], contradictions: [{ field: "給与（時給）", factValue: "時給1,500円", factSource: "L03「給与は時給1,500円。」", summaryValue: "時給1,700円", summarySnippet: "時給1,700円" }], unstated: [], claims: {} };

function stubExtractOk() {
  return {
    status: "completed",
    model: "stub",
    promptVersion: "fact-extract-v1.1",
    durationMs: 0,
    usage: { prompt_tokens: 1, completion_tokens: 1 },
    costUsd: 0,
    schemaCheck: { pass: true, expectedCount: 15, actualCount: 15, missingKeys: [], extraKeys: [], duplicateKeys: [], fieldIssues: [] },
    facts: clone(fixedFacts),
    e01: clone(E01_OK),
    e02: clone(E02_STOP),
  };
}
function faithfulGenerate(counter) {
  return async () => {
    counter.calls += 1;
    return {
      status: "generated",
      apiCalled: true,
      model: "stub",
      promptVersion: "lp-generate-v1",
      durationMs: 0,
      usage: { prompt_tokens: 1, completion_tokens: 1 },
      costUsd: 0,
      grounding: { pass: true, checked: realGeneration.sentences.length, issues: [] },
      generation: clone(realGeneration),
    };
  };
}

// --- FACT comparison: textual granularity diffs are recorded but do not
// stop the run; a substantive change does. ---
const textualCandidate = clone(fixedFacts);
textualCandidate.items.find((i) => i.key === "transportCap").value = "10,000円";
const textualComparison = compareFactSets(textualCandidate, fixedFacts);
expect("demo-facts-textual-diff-agrees", textualComparison.agrees, true);
expect("demo-facts-textual-diff-recorded", textualComparison.textualDiffs.length > 0, true);
const substantiveCandidate = clone(fixedFacts);
substantiveCandidate.items.find((i) => i.key === "salaryHourly").normalized = 1700;
const substantiveComparison = compareFactSets(substantiveCandidate, fixedFacts);
expect("demo-facts-substantive-diff-disagrees", substantiveComparison.agrees, false);
expect("demo-facts-substantive-diff-names-salary", substantiveComparison.diffs.some((d) => d.key === "salaryHourly"), true);

// --- Approval stage on the real fixed pair. ---
const approvalStage = checkApprovalStage(REAL);
expect("demo-approval-stage-pass", approvalStage.pass, true);
expect("demo-approval-stage-validity", approvalStage.validity.valid, true);

// --- Integration (E01, stubbed stages): extraction, approval,
// generation and the re-verification mechanical checks run in sequence;
// E02 stops at reconciliation and never reaches later stages. The
// automatic run stops before preview while the verdict is pending. ---
const counter1 = { calls: 0 };
const run1 = await runDemo({ ...REAL, generationFile: "loops/loop-008/generated-lp-v1.json" }, { extract: async () => stubExtractOk(), generate: faithfulGenerate(counter1) });
expect("demo-e01-extraction-e01-verdict", run1.stages.extraction.e01.verdict, "一致（人間承認待ち）");
expect("demo-e01-not-stopped", run1.stoppedAt, null);
expect("demo-e01-approval-pass", run1.stages.approval.pass, true);
expect("demo-e01-generation-called-once", counter1.calls, 1);
expect("demo-e01-generation-status", run1.stages.generation.status, "generated");
expect("demo-e01-verification-mechanical-pass", run1.stages.verification.mechanicalPass, true);
expect("demo-e01-verdict-pending-human", run1.verification.verdict.status, "pending-human-confirmation");
expect("demo-e01-status-pending-human", run1.status, "pending-human-confirmation");
expect("demo-e01-preview-not-executed", run1.stages.preview.executed, false);
expect("demo-e02-stopped-at-reconciliation", run1.e02.stoppedAtReconciliation, true);
expect("demo-e02-verdict-stop", run1.e02.verdict, "停止（矛盾あり）");
expect("demo-e02-contradiction-names-salary", run1.e02.contradictions.some((c) => String(c.factValue).includes("1,500") && String(c.summaryValue).includes("1,700")), true);
expect("demo-e02-approval-not-executed", run1.e02.approval.executed, false);
expect("demo-e02-generation-not-executed", run1.e02.generation.executed, false);
expect("demo-e02-verification-not-executed", run1.e02.verification.executed, false);
expect("demo-e02-preview-not-executed", run1.e02.preview.executed, false);
expect("demo-costs-category-product", run1.costs.category, "製品実行");
expect("demo-costs-total-known-from-stubs", run1.costs.totalCostUsd, 0);

// --- Integration: with a completed human confirmation injected, the
// verdict becomes pass, but the mechanical-stage run still generates no
// preview (allowPreview is off for this stage). ---
const humanAllOk = {
  status: "completed",
  confirmer: "test",
  confirmedAt: "2026-10-28T00:00:00+09:00",
  sentences: realGeneration.sentences.map((s, idx) => ({ sentence: idx, text: s.text, factKeys: s.factKeys, sourceLines: s.sourceLines, result: "対応あり", detail: null })),
};
const counter2 = { calls: 0 };
const run2 = await runDemo({ ...REAL, generationFile: "loops/loop-008/generated-lp-v1.json", humanConfirmation: humanAllOk }, { extract: async () => stubExtractOk(), generate: faithfulGenerate(counter2) });
expect("demo-human-verdict-pass", run2.verification.verdict.status, "pass");
expect("demo-human-status-pass", run2.status, "pass");
expect("demo-human-preview-still-not-executed-in-mechanical-run", run2.stages.preview.executed, false);

// --- Stop: E01 reconciliation stops, so later stages never run. ---
const counter3 = { calls: 0 };
const stoppedExtract = stubExtractOk();
stoppedExtract.e01 = { ...clone(E01_OK), verdict: "停止（矛盾あり）", stoppedAtReconciliation: true, contradictions: clone(E02_STOP.contradictions) };
const run3 = await runDemo({ ...REAL }, { extract: async () => stoppedExtract, generate: faithfulGenerate(counter3) });
expect("demo-stop-e01-stopped-at-reconciliation", run3.stoppedAt, "reconciliation");
expect("demo-stop-e01-generation-not-called", counter3.calls, 0);
expect("demo-stop-e01-generation-not-executed", run3.stages.generation.executed, false);
expect("demo-stop-e01-verification-not-executed", run3.stages.verification.executed, false);

// --- Stop: the extracted candidate substantively disagrees with the
// fixed FACT v1, so the run stops before approval and generation. ---
const counter4 = { calls: 0 };
const disagreeExtract = stubExtractOk();
disagreeExtract.facts = substantiveCandidate;
const run4 = await runDemo({ ...REAL }, { extract: async () => disagreeExtract, generate: faithfulGenerate(counter4) });
expect("demo-stop-facts-disagreement-stopped-at", run4.stoppedAt, "facts-comparison");
expect("demo-stop-facts-disagreement-generation-not-called", counter4.calls, 0);

// --- Input identity: a swapped FACT file is refused at the input check
// and the generation API is never called. The scratch copy mirrors the
// repository layout; the extracted candidate is the tampered copy
// itself, so the run reaches the approval/input check. ---
const scratch = mkdtempSync(path.join(tmpdir(), "run-demo-test-"));
mkdirSync(path.join(scratch, "src", "facts"), { recursive: true });
for (const rel of [REAL.originalFile, REAL.factsFile, REAL.approvalFile]) {
  copyFileSync(path.join(root, rel), path.join(scratch, rel));
}
const tamperedFacts = clone(fixedFacts);
tamperedFacts.items[0].value = "改変された値";
writeFileSync(path.join(scratch, REAL.factsFile), JSON.stringify(tamperedFacts, null, 2) + "\n", "utf8");
const tamperedExtract = stubExtractOk();
tamperedExtract.facts = tamperedFacts;
const counter5 = { calls: 0 };
const run5 = await runDemo(
  { root: scratch, originalFile: REAL.originalFile, factsFile: REAL.factsFile, approvalFile: REAL.approvalFile },
  { extract: async () => tamperedExtract, generate: faithfulGenerate(counter5) },
);
expect("demo-identity-facts-swapped-stops-before-generation", run5.stages.generation.executed, false);
expect("demo-identity-facts-swapped-generation-not-called", counter5.calls, 0);
expect("demo-identity-facts-swapped-stopped-at-approval", run5.stoppedAt, "approval");
expect("demo-identity-facts-swapped-reason-invalid", run5.stages.approval.reasonCode, "approval-invalid");

// --- Preview: a tampered generation and a non-pass verdict generate no
// preview; a pass verdict generates HTML whose LP sentences match the
// generation text byte-for-byte. ---
const tamperedGeneration = clone(realGeneration);
tamperedGeneration.sentences = tamperedGeneration.sentences.map((s) => s.text.includes("1,500円") ? { ...s, text: s.text.replace("1,500円", "1,700円") } : s);
const tamperedVerification = runVerification({ root, generation: tamperedGeneration, approvalFile: REAL.approvalFile });
expect("demo-preview-tampered-verification-fails", tamperedVerification.verdict.status, "fail");
const tamperedPreview = buildPreview({ generation: tamperedGeneration, verification: tamperedVerification, facts: realFacts, e02: E02_STOP });
expect("demo-preview-refused-for-failed-verification", tamperedPreview.generated, false);

const pendingVerification = runVerification({ ...REAL, generationFile: "loops/loop-008/generated-lp-v1.json" });
const pendingPreview = buildPreview({ generation: realGeneration, verification: pendingVerification, facts: realFacts, e02: E02_STOP });
expect("demo-preview-refused-for-pending-verdict", pendingPreview.generated, false);
expect("demo-preview-pending-verdict-status", pendingVerification.verdict.status, "pending-human-confirmation");

const passVerification = runVerification({ ...REAL, generationFile: "loops/loop-008/generated-lp-v1.json", humanConfirmation: humanAllOk });
const passPreview = buildPreview({ generation: realGeneration, verification: passVerification, facts: realFacts, e02: E02_STOP });
expect("demo-preview-generated-for-pass-verdict", passPreview.generated, true);
expect("demo-preview-sentences-byte-match", realGeneration.sentences.every((s) => passPreview.html.includes(s.text)), true);
expect("demo-preview-sentence-count-markers", (passPreview.html.match(/class="lp-sentence"/g) ?? []).length, realGeneration.sentences.length);
expect("demo-preview-shows-unstated", passPreview.html.includes("更新の有無は未記載") && passPreview.html.includes("寮は未記載"), true);
expect("demo-preview-shows-e02-stop", passPreview.html.includes("停止（矛盾あり）"), true);
expect("demo-preview-effect-preview-only", passPreview.html.includes("デモ内プレビューの許可までであり、公開の許可ではありません"), true);

// writePreview to a scratch dir: pass writes index.html, pending writes
// nothing.
const previewScratch = mkdtempSync(path.join(tmpdir(), "run-demo-preview-"));
mkdirSync(path.join(previewScratch, "loops", "loop-008"), { recursive: true });
mkdirSync(path.join(previewScratch, "src", "facts"), { recursive: true });
copyFileSync(path.join(root, "loops/loop-008/generated-lp-v1.json"), path.join(previewScratch, "loops/loop-008/generated-lp-v1.json"));
copyFileSync(path.join(root, REAL.factsFile), path.join(previewScratch, REAL.factsFile));
writeFileSync(path.join(previewScratch, "verification-pass.json"), JSON.stringify(passVerification, null, 2) + "\n", "utf8");
writeFileSync(path.join(previewScratch, "verification-pending.json"), JSON.stringify(pendingVerification, null, 2) + "\n", "utf8");
const writtenPass = writePreview({ root: previewScratch, generationFile: "loops/loop-008/generated-lp-v1.json", verificationFile: "verification-pass.json", factsFile: REAL.factsFile, outDir: "site-pass" });
expect("demo-preview-write-pass-generated", writtenPass.generated, true);
expect("demo-preview-write-pass-file-exists", existsSync(path.join(previewScratch, "site-pass", "index.html")), true);
const writtenPending = writePreview({ root: previewScratch, generationFile: "loops/loop-008/generated-lp-v1.json", verificationFile: "verification-pending.json", factsFile: REAL.factsFile, outDir: "site-pending" });
expect("demo-preview-write-pending-refused", writtenPending.generated, false);
expect("demo-preview-write-pending-no-file", existsSync(path.join(previewScratch, "site-pending", "index.html")), false);

// --- T4 (design A-4): with a PASS verification, tampering one sentence
// of the generation file refuses the preview, and an existing file is
// not overwritten. ---
const tamperScratch = mkdtempSync(path.join(tmpdir(), "run-demo-preview-t4-"));
mkdirSync(path.join(tamperScratch, "loops", "loop-008"), { recursive: true });
mkdirSync(path.join(tamperScratch, "src", "facts"), { recursive: true });
copyFileSync(path.join(root, "loops/loop-008/generated-lp-v1.json"), path.join(tamperScratch, "loops/loop-008/generated-lp-v1.json"));
copyFileSync(path.join(root, REAL.factsFile), path.join(tamperScratch, REAL.factsFile));
writeFileSync(path.join(tamperScratch, "verification-pass.json"), JSON.stringify(passVerification, null, 2) + "\n", "utf8");
const sentinelT4 = "<!-- existing preview must be kept -->\n";
mkdirSync(path.join(tamperScratch, "site-t4"), { recursive: true });
writeFileSync(path.join(tamperScratch, "site-t4", "index.html"), sentinelT4, "utf8");
const tamperedOnDisk = JSON.parse(readFileSync(path.join(tamperScratch, "loops/loop-008/generated-lp-v1.json"), "utf8"));
tamperedOnDisk.sentences = tamperedOnDisk.sentences.map((s) => s.text.includes("1,500円") ? { ...s, text: s.text.replace("1,500円", "1,700円") } : s);
writeFileSync(path.join(tamperScratch, "loops/loop-008/generated-lp-v1.json"), JSON.stringify(tamperedOnDisk, null, 2) + "\n", "utf8");
const tamperedWrite = writePreview({ root: tamperScratch, generationFile: "loops/loop-008/generated-lp-v1.json", verificationFile: "verification-pass.json", factsFile: REAL.factsFile, outDir: "site-t4" });
expect("demo-t4-tampered-generation-no-preview", tamperedWrite.generated, false);
expect("demo-t4-existing-file-not-overwritten", readFileSync(path.join(tamperScratch, "site-t4", "index.html"), "utf8"), sentinelT4);

// --- T5 (design A-4): a verification targeting one generation file
// cannot be used with a different generation file. ---
const otherScratch = mkdtempSync(path.join(tmpdir(), "run-demo-preview-t5-"));
mkdirSync(path.join(otherScratch, "loops", "loop-008"), { recursive: true });
mkdirSync(path.join(otherScratch, "loops", "loop-010"), { recursive: true });
mkdirSync(path.join(otherScratch, "src", "facts"), { recursive: true });
copyFileSync(path.join(root, "loops/loop-008/generated-lp-v1.json"), path.join(otherScratch, "loops/loop-008/generated-lp-v1.json"));
copyFileSync(path.join(root, "loops/loop-010/generated-lp-v1.json"), path.join(otherScratch, "loops/loop-010/generated-lp-v1.json"));
copyFileSync(path.join(root, REAL.factsFile), path.join(otherScratch, REAL.factsFile));
writeFileSync(path.join(otherScratch, "verification-pass.json"), JSON.stringify(passVerification, null, 2) + "\n", "utf8");
const otherWrite = writePreview({ root: otherScratch, generationFile: "loops/loop-010/generated-lp-v1.json", verificationFile: "verification-pass.json", factsFile: REAL.factsFile, outDir: "site-t5" });
expect("demo-t5-other-generation-file-no-preview", otherWrite.generated, false);
expect("demo-t5-other-generation-file-no-file", existsSync(path.join(otherScratch, "site-t5", "index.html")), false);
const pairingOk = checkPreviewPairing({ root: previewScratch, generationFile: "loops/loop-008/generated-lp-v1.json", generation: realGeneration, verification: passVerification });
expect("demo-pairing-check-pass-on-matching-pair", pairingOk.ok, true);

const pass = results.every((r) => r.pass);
const record = {
  testFile: "src/run-demo.test.mjs",
  target: "src/run-demo.mjs",
  pass,
  results,
  note: "統合とプレビューのケースは API を呼ぶ工程をスタブ化しており、実 API は呼んでいない。ライブの統合実行はテストと分けて1回だけ実行し、loops/loop-010/run-result.json に記録する。プレビューの生成ケースは一時フォルダへの書き出しであり、site/ への生成とデプロイは人間確認の確定後に別段階で行う",
  runAt: new Date().toISOString(),
};
console.log(JSON.stringify(record, null, 2));
if (outPath) writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf8");
if (!pass) process.exitCode = 1;
