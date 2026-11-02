// Reproducible checks for src/generate-typed.mjs (procedure 3 preparation,
// typed generation with the E01 reference set).
// Run: node src/generate-typed.test.mjs [--out <path>]
// The generation cases use a stubbed model caller: this test never calls
// the real API and costs nothing. Exits non-zero on any failure.
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkGenerationInput, checkGrounding } from "./generate.mjs";
import {
  MODEL,
  TYPED_PROMPT_VERSION,
  buildTypedGenerationMessages,
  runTypedGeneration,
} from "./generate-typed.mjs";

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
const catalog = JSON.parse(readFileSync(path.join(root, "library/catalog-v1.json"), "utf8"));
const byId = new Map(catalog.patterns.map((p) => [p.id, p]));
const E01_PATTERNS = ["LIB-PAT-001", "LIB-PAT-002", "LIB-PAT-004"].map((id) => byId.get(id));

// --- Model and prompt version. ---
expect("typed-model-consistent", MODEL, "muse-spark-1.3-contributor");
expect("typed-prompt-version", TYPED_PROMPT_VERSION, "lp-generate-v2-typed");

// --- Input check: the approved pair is allowed. ---
const okInput = checkGenerationInput(REAL);
expect("typed-input-approved-allowed", okInput.ok, true);

// --- Typed prompt: the E01 reference set is present with versions,
// LIB-PAT-003 is not a used pattern, and the softened-income instruction
// (変動 + 保証しない) is present. ---
const messages = buildTypedGenerationMessages(facts, E01_PATTERNS);
const allText = messages.map((m) => m.content).join("\n");
for (const id of ["LIB-PAT-001", "LIB-PAT-002", "LIB-PAT-004"]) {
  expect(`typed-prompt-contains-${id}`, allText.includes(id), true);
}
expect("typed-prompt-contains-versions", allText.includes("LIB-PAT-001 (version v1)") && allText.includes("LIB-PAT-002 (version v1)") && allText.includes("LIB-PAT-004 (version v1)"), true);
expect("typed-prompt-excludes-pat-003", allText.includes("LIB-PAT-003"), false);
expect("typed-prompt-softened-income-hendou", allText.includes("変動"), true);
expect("typed-prompt-softened-income-hoshou", allText.includes("保証しない"), true);
expect("typed-prompt-no-monthly-figure-instruction", allText.includes("Never present a monthly income figure"), true);

// --- Generation (stubbed): a faithful stub output with the softened trial
// note flows through, carries the typed header, and passes grounding. ---
const faithfulSentences = [
  { text: "架空のソラノ輪具研究所の求人番号FICT-J01は、勤務地が架空の青空実験区A棟の有期契約社員の募集です。", factKeys: ["employer", "jobId", "workLocation", "employmentType"], sourceLines: ["L01", "L02"] },
  { text: "給与は時給1,500円で、勤務時間は09:00〜18:00、休憩60分、実働8時間です。", factKeys: ["salaryHourly", "workHours", "breakMinutes", "actualHours"], sourceLines: ["L03", "L04"] },
  { text: "月20日勤務は試算用の仮定であり、実際の収入は勤務日数や残業の増減などで変動するため、月収を保証しない条件です。", factKeys: ["monthlyDaysAssumption", "monthlyIncomeGuarantee"], sourceLines: ["L03", "L04"] },
  { text: "交通費は実費支給で、月上限10,000円です。", factKeys: ["transport", "transportCap"], sourceLines: ["L05"] },
  { text: "更新の有無は未記載であり、寮の有無と費用も未記載です。", factKeys: ["renewal", "housing"], sourceLines: ["L02", "L06"] },
];
const faithfulStub = async () => ({ content: JSON.stringify({ sentences: faithfulSentences }), usage: { prompt_tokens: 10, completion_tokens: 20 }, model: "stub" });
const stubRun = await runTypedGeneration({ ...REAL, patterns: E01_PATTERNS, callModel: faithfulStub });
expect("typed-stub-flow-generated", stubRun.status, "generated");
expect("typed-stub-flow-api-called", stubRun.apiCalled, true);
expect("typed-stub-flow-prompt-version", stubRun.promptVersion, "lp-generate-v2-typed");
expect("typed-stub-generation-prompt-version", stubRun.generation && stubRun.generation.promptVersion, "lp-generate-v2-typed");
expect("typed-stub-reference-set-catalog", stubRun.generation && stubRun.generation.referenceSet && stubRun.generation.referenceSet.catalog, "LIB-CATALOG-V1");
expect("typed-stub-reference-set-patterns", JSON.stringify(stubRun.generation && stubRun.generation.referenceSet && stubRun.generation.referenceSet.patterns), JSON.stringify([{ id: "LIB-PAT-001", version: "v1" }, { id: "LIB-PAT-002", version: "v1" }, { id: "LIB-PAT-004", version: "v1" }]));
expect("typed-grounding-pass-on-faithful-output", checkGrounding(stubRun.generation, facts, original).pass, true);
expect("typed-stub-softened-sentence-kept", stubRun.generation.sentences.some((s) => s.text.includes("試算用の仮定") && s.text.includes("勤務日数や残業の増減などで変動") && s.text.includes("保証しない")), true);

// --- Refusal 1: a draft approval is refused before any API call. ---
let draftCalls = 0;
const draftCountingStub = async () => { draftCalls += 1; return { content: "{}", usage: null, model: "stub" }; };
const draftRun = await runTypedGeneration({ ...REAL, approvalFile: "loops/loop-007/approval-draft.json", patterns: E01_PATTERNS, callModel: draftCountingStub });
expect("typed-draft-refused", draftRun.status, "refused");
expect("typed-draft-refused-reason", draftRun.reasonCode, "approval-not-approved");
expect("typed-draft-api-not-called", draftCalls, 0);

// --- Refusal 2: a tampered FACT copy is refused (approval-invalid) before
// any API call. ---
const scratch = mkdtempSync(path.join(tmpdir(), "generate-typed-test-"));
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
let tamperedCalls = 0;
const tamperedCountingStub = async () => { tamperedCalls += 1; return { content: "{}", usage: null, model: "stub" }; };
const tamperedRun = await runTypedGeneration({ root: scratch, originalFile: "orig.json", factsFile: "facts.json", approvalFile: "approval.json", patterns: E01_PATTERNS, callModel: tamperedCountingStub });
expect("typed-tampered-facts-refused", tamperedRun.status, "refused");
expect("typed-tampered-facts-reason", tamperedRun.reasonCode, "approval-invalid");
expect("typed-tampered-api-not-called", tamperedCalls, 0);

const pass = results.every((r) => r.pass);
const record = {
  testFile: "src/generate-typed.test.mjs",
  target: "src/generate-typed.mjs",
  pass,
  passed: results.filter((r) => r.pass).length,
  total: results.length,
  results,
  note: "生成系のケースはモデル呼び出しをスタブ化しており、実 API は呼んでいない（MODEL_API_KEY 不使用）。",
  runAt: new Date().toISOString(),
};
console.log(JSON.stringify(record, null, 2));
if (outPath) writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf8");
if (!pass) process.exitCode = 1;
