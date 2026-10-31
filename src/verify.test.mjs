// Reproducible checks for src/verify.mjs (step 4).
// Run: node src/verify.test.mjs [--out <path>]
// This test never calls any API and costs nothing. Tampered cases use
// copies in a temporary folder or cloned objects; the fixed files in the
// repository are never rewritten. Exits non-zero on any failure.
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkApprovalValidity } from "./approve.mjs";
import { checkInputIdentity, decideVerdict, runVerification } from "./verify.mjs";

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
  generationFile: "loops/loop-008/generated-lp-v1.json",
  originalFile: "src/fict-j01-v1.json",
  factsFile: "src/facts/FICT-J01-facts-v1.json",
  approvalFile: "src/facts/FICT-J01-facts-v1.approval.json",
};
const generation = JSON.parse(readFileSync(path.join(root, REAL.generationFile), "utf8"));
const facts = JSON.parse(readFileSync(path.join(root, REAL.factsFile), "utf8"));
const original = JSON.parse(readFileSync(path.join(root, REAL.originalFile), "utf8"));
const approval = JSON.parse(readFileSync(path.join(root, REAL.approvalFile), "utf8"));

// --- Normal case: the real loop-008 generation. Input identity holds and
// the re-run grounding check passes (mechanical pass). The overall
// re-verification pass itself is fixed only after the human confirmation,
// so without it the verdict stays pending. ---
const normal = runVerification({ ...REAL });
expect("verify-normal-identity-pass", normal.inputIdentity.pass, true);
expect("verify-normal-grounding-pass", normal.grounding.pass, true);
expect("verify-normal-grounding-checked", normal.grounding.checked, 7);
expect("verify-normal-grounding-not-skipped", normal.grounding.skipped, false);
expect("verify-normal-mechanical-pass", normal.mechanicalPass, true);
expect("verify-normal-verdict-pending-without-human", normal.verdict.status, "pending-human-confirmation");
expect("verify-normal-human-pending", normal.humanConfirmation.status, "pending");
expect("verify-normal-human-sentences-unfilled", normal.humanConfirmation.sentences.every((s) => s.result === null), true);

// Judgement: with a completed human confirmation covering every sentence
// the verdict becomes pass, with preview-only effect; a mismatch fails.
const humanAllOk = {
  status: "completed",
  confirmer: "test",
  confirmedAt: "2026-10-28T00:00:00+09:00",
  sentences: generation.sentences.map((s, idx) => ({ sentence: idx, text: s.text, factKeys: s.factKeys, sourceLines: s.sourceLines, result: "対応あり", detail: null })),
};
const verdictHumanOk = decideVerdict({ inputIdentity: normal.inputIdentity, grounding: normal.grounding, humanConfirmation: humanAllOk, generation });
expect("verify-verdict-pass-with-human-ok", verdictHumanOk.status, "pass");
expect("verify-verdict-pass-effect-preview-only", String(verdictHumanOk.effect).includes("デモ内プレビューの許可まで"), true);
const humanMismatch = clone(humanAllOk);
humanMismatch.sentences[1].result = "不一致: 契約期間の数量表現が FACT と対応しない";
const verdictHumanNg = decideVerdict({ inputIdentity: normal.inputIdentity, grounding: normal.grounding, humanConfirmation: humanMismatch, generation });
expect("verify-verdict-fail-with-human-mismatch", verdictHumanNg.status, "fail");
expect("verify-verdict-fail-with-human-mismatch-category", verdictHumanNg.category, "human-confirmation");
expect("verify-verdict-fail-with-human-mismatch-reason-mentions-human", String(verdictHumanNg.reason).includes("人間の確認"), true);

// --- T1 (design A-4): a completed confirmation for unrelated sentences
// (all "対応あり") must not pass. ---
const unrelatedHuman = {
  status: "completed",
  confirmer: "test",
  confirmedAt: "2026-10-28T00:00:00+09:00",
  sentences: [{ sentence: 0, text: "この文は生成物と無関係である。", factKeys: ["employer"], sourceLines: ["L01"], result: "対応あり", detail: null }],
};
const verdictUnrelated = decideVerdict({ inputIdentity: normal.inputIdentity, grounding: normal.grounding, humanConfirmation: unrelatedHuman, generation });
expect("verify-t1-unrelated-confirmation-not-pass", verdictUnrelated.pass, false);
expect("verify-t1-unrelated-confirmation-status", verdictUnrelated.status, "fail");
expect("verify-t1-unrelated-confirmation-category", verdictUnrelated.category, "human-confirmation");

// --- T2 (design A-4): a confirmation whose sentence count differs from
// the generation (even with a matching prefix) must not pass. ---
const shortHuman = clone(humanAllOk);
shortHuman.sentences = shortHuman.sentences.slice(0, shortHuman.sentences.length - 1);
const verdictShort = decideVerdict({ inputIdentity: normal.inputIdentity, grounding: normal.grounding, humanConfirmation: shortHuman, generation });
expect("verify-t2-count-mismatch-not-pass", verdictShort.pass, false);
expect("verify-t2-count-mismatch-status", verdictShort.status, "fail");
expect("verify-t2-count-mismatch-category", verdictShort.category, "human-confirmation");
expect("verify-t2-count-mismatch-reason-names-counts", String(verdictShort.reason).includes(String(generation.sentences.length)), true);

// --- T3 (design A-4, migration): the loop-010 generation with its fixed
// confirmation record still passes under the new binding. ---
const loop010Generation = JSON.parse(readFileSync(path.join(root, "loops/loop-010/generated-lp-v1.json"), "utf8"));
const loop010Verification = JSON.parse(readFileSync(path.join(root, "loops/loop-010/verification-result.json"), "utf8"));
const verdictLoop010 = decideVerdict({ inputIdentity: normal.inputIdentity, grounding: normal.grounding, humanConfirmation: loop010Verification.humanConfirmation, generation: loop010Generation });
expect("verify-t3-loop010-migration-pass", verdictLoop010.status, "pass");
const loop010Run = runVerification({ root, generationFile: "loops/loop-010/generated-lp-v1.json", approvalFile: REAL.approvalFile, humanConfirmation: loop010Verification.humanConfirmation });
expect("verify-t3-loop010-run-verdict-pass", loop010Run.verdict.status, "pass");

// --- Tamper detection: a rewritten amount is caught by the re-run. ---
const amountTampered = clone(generation);
amountTampered.sentences = amountTampered.sentences.map((s) => s.text.includes("1,500円") ? { ...s, text: s.text.replace("1,500円", "1,700円") } : s);
const amountResult = runVerification({ root, generation: amountTampered, approval, facts, original, approvalFile: REAL.approvalFile });
expect("verify-tamper-amount-identity-pass", amountResult.inputIdentity.pass, true);
expect("verify-tamper-amount-detected", amountResult.grounding.pass, false);
expect("verify-tamper-amount-names-it", amountResult.grounding.issues.some((i) => String(i.issue).includes("1,700円")), true);
expect("verify-tamper-amount-verdict-fail", amountResult.verdict.status, "fail");
expect("verify-tamper-amount-verdict-category", amountResult.verdict.category, "grounding");

// --- Tamper detection: an asserted unstated item is caught. ---
const unstatedTampered = clone(generation);
unstatedTampered.sentences.push({ text: "寮ありの職場です。", factKeys: ["housing"], sourceLines: ["L06"] });
const unstatedResult = runVerification({ root, generation: unstatedTampered, approval, facts, original, approvalFile: REAL.approvalFile });
expect("verify-tamper-unstated-detected", unstatedResult.grounding.pass, false);
expect("verify-tamper-unstated-names-it", unstatedResult.grounding.issues.some((i) => String(i.issue).includes("寮あり")), true);
expect("verify-tamper-unstated-verdict-fail", unstatedResult.verdict.status, "fail");

// --- Tamper detection: an unknown factKey is caught. ---
const unknownKeyTampered = clone(generation);
unknownKeyTampered.sentences.push({ text: "勤務地は架空の青空実験区A棟です。", factKeys: ["workLocationX"], sourceLines: ["L01"] });
const unknownKeyResult = runVerification({ root, generation: unknownKeyTampered, approval, facts, original, approvalFile: REAL.approvalFile });
expect("verify-tamper-unknown-factkey-detected", unknownKeyResult.grounding.pass, false);
expect("verify-tamper-unknown-factkey-names-it", unknownKeyResult.grounding.issues.some((i) => String(i.issue).includes("unknown factKey: workLocationX")), true);

// --- Tamper detection: an unknown line ID is caught. ---
const unknownLineTampered = clone(generation);
unknownLineTampered.sentences.push({ text: "給与は時給1,500円です。", factKeys: ["salaryHourly"], sourceLines: ["L99"] });
const unknownLineResult = runVerification({ root, generation: unknownLineTampered, approval, facts, original, approvalFile: REAL.approvalFile });
expect("verify-tamper-unknown-sourceline-detected", unknownLineResult.grounding.pass, false);
expect("verify-tamper-unknown-sourceline-names-it", unknownLineResult.grounding.issues.some((i) => String(i.issue).includes("unknown sourceLine: L99")), true);

// --- Tamper detection: a sentence with no grounds is caught. ---
const ungroundedTampered = clone(generation);
ungroundedTampered.sentences.push({ text: "交通費は月上限20,000円です。", factKeys: [], sourceLines: [] });
const ungroundedResult = runVerification({ root, generation: ungroundedTampered, approval, facts, original, approvalFile: REAL.approvalFile });
expect("verify-tamper-ungrounded-detected", ungroundedResult.grounding.pass, false);
expect("verify-tamper-ungrounded-names-it",
  ungroundedResult.grounding.issues.some((i) => String(i.issue).includes("has no factKeys")) &&
  ungroundedResult.grounding.issues.some((i) => String(i.issue).includes("20,000円")), true);

// --- Input identity: a swapped FACT file (header hash no longer matches
// the current bytes) expires the generation; grounding is not run. The
// scratch copy mirrors the repository layout so the header file names
// still point at the inspected files. ---
const scratch = mkdtempSync(path.join(tmpdir(), "verify-test-"));
mkdirSync(path.join(scratch, "src", "facts"), { recursive: true });
mkdirSync(path.join(scratch, "loops", "loop-008"), { recursive: true });
for (const rel of [REAL.originalFile, REAL.factsFile, REAL.approvalFile, REAL.generationFile]) {
  copyFileSync(path.join(root, rel), path.join(scratch, rel));
}
const tamperedFacts = clone(facts);
tamperedFacts.items[0].value = "改変された値";
writeFileSync(path.join(scratch, REAL.factsFile), JSON.stringify(tamperedFacts, null, 2) + "\n", "utf8");
const swappedResult = runVerification({ root: scratch, generationFile: REAL.generationFile, approvalFile: REAL.approvalFile });
expect("verify-identity-facts-swapped-fails", swappedResult.inputIdentity.pass, false);
expect("verify-identity-facts-swapped-hash-check-fails", swappedResult.inputIdentity.checks.find((c) => c.id === "facts-hash").pass, false);
expect("verify-identity-facts-swapped-grounding-skipped", swappedResult.grounding.skipped, true);
expect("verify-identity-facts-swapped-verdict-fail", swappedResult.verdict.status, "fail");
expect("verify-identity-facts-swapped-verdict-category", swappedResult.verdict.category, "input-identity");

// --- Input identity: a draft approval record fails even though the
// recomputed validity is true (step-2 audit observation 1, fixed again
// on the re-verification side). ---
const draft = JSON.parse(readFileSync(path.join(root, "loops/loop-007/approval-draft.json"), "utf8"));
const draftValidity = checkApprovalValidity(draft, { root, originalFile: REAL.originalFile, factsFile: REAL.factsFile });
expect("verify-identity-draft-validity-recomputes-true", draftValidity.valid, true);
const draftResult = runVerification({ root, generation, approval: draft, facts, original, approvalFile: "loops/loop-007/approval-draft.json" });
expect("verify-identity-draft-fails", draftResult.inputIdentity.pass, false);
expect("verify-identity-draft-status-check-fails", draftResult.inputIdentity.checks.find((c) => c.id === "approval-status").pass, false);
expect("verify-identity-draft-generation-input-reason", draftResult.inputIdentity.generationInput.reasonCode, "approval-not-approved");
expect("verify-identity-draft-grounding-skipped", draftResult.grounding.skipped, true);
expect("verify-identity-draft-verdict-category", draftResult.verdict.category, "input-identity");

// Direct identity check on the draft (same expectation, function level).
const draftIdentity = checkInputIdentity({ root, generation, approval: draft, approvalFile: "loops/loop-007/approval-draft.json" });
expect("verify-identity-draft-direct-fails", draftIdentity.pass, false);

// --- Input identity: a rewritten header approvalId cannot identify the
// approval record, so the generation fails. ---
const approvalIdTampered = clone(generation);
approvalIdTampered.input.approvalId = "FICT-J01-approval-999";
const approvalIdResult = runVerification({ root, generation: approvalIdTampered, approval, facts, original, approvalFile: REAL.approvalFile });
expect("verify-identity-approval-id-mismatch-fails", approvalIdResult.inputIdentity.pass, false);
expect("verify-identity-approval-id-check-fails", approvalIdResult.inputIdentity.checks.find((c) => c.id === "approval-id").pass, false);
expect("verify-identity-approval-id-grounding-skipped", approvalIdResult.grounding.skipped, true);
expect("verify-identity-approval-id-verdict-category", approvalIdResult.verdict.category, "input-identity");

const pass = results.every((r) => r.pass);
const record = {
  testFile: "src/verify.test.mjs",
  target: "src/verify.mjs",
  pass,
  results,
  note: "再検証の道具は API を呼ばないため、テストもすべてオフラインで再現可能である。改変ケースは固定ファイルを書き換えず、クローンまたは一時フォルダのコピーで行う。人間の確認（意味の対応）はテストでは合成した完了形で判定関数だけを検証し、実生成物に対する人間確認そのものは loops/loop-009/verification-result.json では未記入のまま残す",
  runAt: new Date().toISOString(),
};
console.log(JSON.stringify(record, null, 2));
if (outPath) writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf8");
if (!pass) process.exitCode = 1;
