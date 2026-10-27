// Reproducible checks for src/generate.mjs (step 3).
// Run: node src/generate.test.mjs [--out <path>]
// The generation cases use a stubbed model caller: this test never calls
// the real API and costs nothing. The one real generation run is separate
// (loops/loop-008/generation-run.json). Exits non-zero on any failure.
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkApprovalValidity } from "./approve.mjs";
import { checkGenerationInput, checkGrounding, runGeneration } from "./generate.mjs";

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
const facts = JSON.parse(readFileSync(path.join(root, REAL.factsFile), "utf8"));
const original = JSON.parse(readFileSync(path.join(root, REAL.originalFile), "utf8"));

// --- Input check 1: the approved pair is allowed. ---
const okInput = checkGenerationInput(REAL);
expect("input-approved-allowed", okInput.ok, true);

// --- Input check 2: a draft approval is refused even though the
// recomputed validity is true (step-2 audit observation 1). ---
const draft = JSON.parse(readFileSync(path.join(root, "loops/loop-007/approval-draft.json"), "utf8"));
const draftValidity = checkApprovalValidity(draft, { root, originalFile: REAL.originalFile, factsFile: REAL.factsFile });
expect("input-draft-validity-recomputes-true", draftValidity.valid, true);
const draftInput = checkGenerationInput({ ...REAL, approvalFile: "loops/loop-007/approval-draft.json" });
expect("input-draft-refused", draftInput.ok, false);
expect("input-draft-refused-reason", draftInput.reasonCode, "approval-not-approved");

// --- Input check 3: a tampered FACT copy invalidates the approval. ---
const scratch = mkdtempSync(path.join(tmpdir(), "generate-test-"));
for (const [src, dst] of [
  ["src/fict-j01-v1.json", "orig.json"],
  ["src/facts/FICT-J01-facts-v1.json", "facts.json"],
  ["src/facts/FICT-J01-facts-v1.approval.json", "approval.json"],
]) {
  copyFileSync(path.join(root, src), path.join(scratch, dst));
}
const tampered = clone(facts);
tampered.items[0].value = "改変された値";
writeFileSync(path.join(scratch, "facts.json"), JSON.stringify(tampered, null, 2) + "\n", "utf8");
const tamperedInput = checkGenerationInput({ root: scratch, originalFile: "orig.json", factsFile: "facts.json", approvalFile: "approval.json" });
expect("input-tampered-facts-refused", tamperedInput.ok, false);
expect("input-tampered-facts-reason", tamperedInput.reasonCode, "approval-invalid");
expect("input-tampered-facts-redo-note", String(tamperedInput.reason).includes("照合からやり直す"), true);

// --- Input check 4: E02 has no approval record; generation is refused
// before any API call (the stub caller counts its invocations). ---
let stubCalls = 0;
const countingStub = async () => { stubCalls += 1; return { content: "{}", usage: null, model: "stub" }; };
const e02Run = await runGeneration({ ...REAL, approvalFile: "src/facts/FICT-J01-facts-v1.e02.approval.json", callModel: countingStub });
expect("input-e02-refused", e02Run.status, "refused");
expect("input-e02-refused-reason", e02Run.reasonCode, "approval-missing");
expect("input-e02-api-not-called", stubCalls, 0);

// --- Generation (stubbed): a faithful stub output flows through and the
// grounding check passes on it. ---
const faithfulSentences = [
  { text: "勤務地は架空の青空実験区A棟です。", factKeys: ["workLocation"], sourceLines: ["L01"] },
  { text: "給与は時給1,500円です。月収は保証しない条件です。", factKeys: ["salaryHourly", "monthlyIncomeGuarantee"], sourceLines: ["L03"] },
  { text: "勤務時間は09:00〜18:00、休憩60分、実働8時間です。", factKeys: ["workHours", "breakMinutes", "actualHours"], sourceLines: ["L04"] },
  { text: "更新の有無は未記載です。", factKeys: ["renewal"], sourceLines: ["L02"] },
];
const faithfulStub = async () => ({ content: JSON.stringify({ sentences: faithfulSentences }), usage: { prompt_tokens: 1, completion_tokens: 1 }, model: "stub" });
const stubRun = await runGeneration({ ...REAL, callModel: faithfulStub });
expect("gen-stub-flow-generated", stubRun.status, "generated");
expect("gen-stub-flow-api-called", stubRun.apiCalled, true);
expect("gen-grounding-pass-on-faithful-output", checkGrounding(stubRun.generation, facts, original).pass, true);

// --- Generation (stubbed): the grounding check detects violations. ---
const assertionRun = await runGeneration({
  ...REAL,
  callModel: async () => ({ content: JSON.stringify({ sentences: [{ text: "寮ありの職場です。", factKeys: ["housing"], sourceLines: ["L06"] }] }), usage: null, model: "stub" }),
});
const assertionCheck = checkGrounding(assertionRun.generation, facts, original);
expect("gen-grounding-detects-unstated-assertion", assertionCheck.pass, false);
expect("gen-grounding-detects-unstated-assertion-names-it", assertionCheck.issues.some((i) => String(i.issue).includes("寮あり")), true);

const fabricatedRun = await runGeneration({
  ...REAL,
  callModel: async () => ({ content: JSON.stringify({ sentences: [{ text: "給与は時給1,700円です。", factKeys: ["salaryHourly"], sourceLines: ["L03"] }] }), usage: null, model: "stub" }),
});
const fabricatedCheck = checkGrounding(fabricatedRun.generation, facts, original);
expect("gen-grounding-detects-fabricated-amount", fabricatedCheck.pass, false);
expect("gen-grounding-detects-fabricated-amount-names-it", fabricatedCheck.issues.some((i) => String(i.issue).includes("1,700円")), true);

// --- Generation (stubbed): the grounding check detects a sentence that
// cites a FACT key which does not exist. ---
const unknownKeyRun = await runGeneration({
  ...REAL,
  callModel: async () => ({ content: JSON.stringify({ sentences: [{ text: "勤務地は架空の青空実験区A棟です。", factKeys: ["workLocationX"], sourceLines: ["L01"] }] }), usage: null, model: "stub" }),
});
const unknownKeyCheck = checkGrounding(unknownKeyRun.generation, facts, original);
expect("gen-grounding-detects-unknown-factkey", unknownKeyCheck.pass, false);
expect("gen-grounding-detects-unknown-factkey-names-it", unknownKeyCheck.issues.some((i) => String(i.issue).includes("unknown factKey: workLocationX")), true);

// --- Generation (stubbed): the grounding check detects a sentence that
// cites an original line ID which does not exist. ---
const unknownLineRun = await runGeneration({
  ...REAL,
  callModel: async () => ({ content: JSON.stringify({ sentences: [{ text: "給与は時給1,500円です。", factKeys: ["salaryHourly"], sourceLines: ["L99"] }] }), usage: null, model: "stub" }),
});
const unknownLineCheck = checkGrounding(unknownLineRun.generation, facts, original);
expect("gen-grounding-detects-unknown-sourceline", unknownLineCheck.pass, false);
expect("gen-grounding-detects-unknown-sourceline-names-it", unknownLineCheck.issues.some((i) => String(i.issue).includes("unknown sourceLine: L99")), true);

// --- Generation (stubbed): the grounding check detects a sentence with
// no grounds at all (empty factKeys/sourceLines) that still states a
// figure which is not in the FACTs. ---
const ungroundedRun = await runGeneration({
  ...REAL,
  callModel: async () => ({ content: JSON.stringify({ sentences: [{ text: "交通費は月上限20,000円です。", factKeys: [], sourceLines: [] }] }), usage: null, model: "stub" }),
});
const ungroundedCheck = checkGrounding(ungroundedRun.generation, facts, original);
expect("gen-grounding-detects-ungrounded-sentence", ungroundedCheck.pass, false);
expect("gen-grounding-detects-ungrounded-sentence-names-it",
  ungroundedCheck.issues.some((i) => String(i.issue).includes("has no factKeys")) &&
  ungroundedCheck.issues.some((i) => String(i.issue).includes("20,000円")), true);

const pass = results.every((r) => r.pass);
const record = {
  testFile: "src/generate.test.mjs",
  target: "src/generate.mjs",
  pass,
  results,
  note: "生成系のケースはモデル呼び出しをスタブ化しており、実 API は呼んでいない。実生成はテストと分けて1回だけ実行し、loops/loop-008/generation-run.json に記録する。",
  runAt: new Date().toISOString(),
};
console.log(JSON.stringify(record, null, 2));
if (outPath) writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf8");
if (!pass) process.exitCode = 1;
