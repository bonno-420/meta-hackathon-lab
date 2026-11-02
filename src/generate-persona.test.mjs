// Reproducible checks for src/generate-persona.mjs (loop-013 procedure 2
// preparation, persona generation with the loop-013 reference set).
// Run: node src/generate-persona.test.mjs [--out <path>]
// The generation cases use a stubbed model caller: this test never calls
// the real API and costs nothing. Exits non-zero on any failure.
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkGenerationInput, checkGrounding } from "./generate.mjs";
import {
  INTENT,
  MODEL,
  PERSONA_PROMPT_VERSION,
  buildPersonaGenerationMessages,
  runPersonaGeneration,
} from "./generate-persona.mjs";

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
const PERSONA_PATTERNS = ["LIB-PAT-002", "LIB-PAT-003", "LIB-PAT-004"].map((id) => byId.get(id));

// --- Model and prompt version. ---
expect("persona-model-consistent", MODEL, "muse-spark-1.3-contributor");
expect("persona-prompt-version", PERSONA_PROMPT_VERSION, "lp-generate-v3-persona");

// --- Intent object: speaker S-01, target layer, persona P-01 W1-W5. ---
expect("persona-intent-speaker", INTENT.speaker.id, "S-01");
expect("persona-intent-persona", INTENT.persona.id, "P-01");
expect("persona-intent-worries", INTENT.persona.worries.map((w) => w.id).join(","), "W1,W2,W3,W4,W5");

// --- Input check: the approved pair is allowed. ---
const okInput = checkGenerationInput(REAL);
expect("persona-input-approved-allowed", okInput.ok, true);

// --- Persona prompt: S-01/P-01/W1-W5 mapping, the loop-013 reference set
// with versions, LIB-PAT-001 not adopted, inquiry-invitation + no-contact-
// detail instructions, and the variation + 保証しない softening. ---
const messages = buildPersonaGenerationMessages(facts, PERSONA_PATTERNS);
const allText = messages.map((m) => m.content).join("\n");
expect("persona-prompt-contains-s01", allText.includes("S-01"), true);
expect("persona-prompt-contains-p01", allText.includes("P-01"), true);
for (const w of ["W1", "W2", "W3", "W4", "W5"]) {
  expect(`persona-prompt-contains-${w}`, allText.includes(w), true);
}
for (const id of ["LIB-PAT-002", "LIB-PAT-003", "LIB-PAT-004"]) {
  expect(`persona-prompt-contains-${id}`, allText.includes(id), true);
}
expect("persona-prompt-contains-versions", allText.includes("LIB-PAT-002 (version v1)") && allText.includes("LIB-PAT-003 (version v1)") && allText.includes("LIB-PAT-004 (version v1)"), true);
expect("persona-prompt-excludes-pat-001", allText.includes("LIB-PAT-001"), false);
expect("persona-prompt-inquiry-invitation", allText.includes("お気軽にお問い合わせください") && allText.includes("ご相談ください"), true);
expect("persona-prompt-no-contact-detail", allText.includes("contact detail"), true);
expect("persona-prompt-softened-income-hendou", allText.includes("変動"), true);
expect("persona-prompt-softened-income-hoshou", allText.includes("保証しない"), true);
expect("persona-prompt-no-monthly-figure-instruction", allText.includes("Never present a monthly income figure"), true);

// --- Generation (stubbed): a faithful stub output with an unstated
// renewal sentence (未記載 + inquiry invitation) and a trial sentence
// (試算用の仮定 + 変動 + 保証しない) flows through, carries the persona
// header, and passes grounding. ---
const faithfulSentences = [
  { text: "架空のソラノ輪具研究所の求人番号FICT-J01は、勤務地が架空の青空実験区A棟の有期契約社員の募集です。契約期間は3か月、給与は時給1,500円です。", factKeys: ["employer", "jobId", "workLocation", "employmentType", "contractPeriod", "salaryHourly"], sourceLines: ["L01", "L02", "L03"] },
  { text: "月20日勤務は試算用の仮定であり、実際の収入は勤務日数や残業の増減などで変動するため、月収を保証しない条件です。", factKeys: ["monthlyDaysAssumption", "monthlyIncomeGuarantee"], sourceLines: ["L03", "L04"] },
  { text: "勤務時間は09:00〜18:00、休憩60分、実働8時間の昼間の時間帯です。", factKeys: ["workHours", "breakMinutes", "actualHours"], sourceLines: ["L04"] },
  { text: "交通費は実費支給で、月上限10,000円です。", factKeys: ["transport", "transportCap"], sourceLines: ["L05"] },
  { text: "更新の有無は未記載のため、ご不明な点はお気軽にお問い合わせください。", factKeys: ["renewal"], sourceLines: ["L02"] },
  { text: "寮の有無と費用は未記載のため、気になる点はご相談ください。", factKeys: ["housing"], sourceLines: ["L06"] },
];
const faithfulStub = async () => ({ content: JSON.stringify({ sentences: faithfulSentences }), usage: { prompt_tokens: 10, completion_tokens: 20 }, model: "stub" });
const stubRun = await runPersonaGeneration({ ...REAL, patterns: PERSONA_PATTERNS, callModel: faithfulStub });
expect("persona-stub-flow-generated", stubRun.status, "generated");
expect("persona-stub-flow-api-called", stubRun.apiCalled, true);
expect("persona-stub-flow-prompt-version", stubRun.promptVersion, "lp-generate-v3-persona");
expect("persona-stub-generation-prompt-version", stubRun.generation && stubRun.generation.promptVersion, "lp-generate-v3-persona");
expect("persona-stub-reference-set-catalog", stubRun.generation && stubRun.generation.referenceSet && stubRun.generation.referenceSet.catalog, "LIB-CATALOG-V1");
expect("persona-stub-reference-set-patterns", JSON.stringify(stubRun.generation && stubRun.generation.referenceSet && stubRun.generation.referenceSet.patterns), JSON.stringify([{ id: "LIB-PAT-002", version: "v1" }, { id: "LIB-PAT-003", version: "v1" }, { id: "LIB-PAT-004", version: "v1" }]));
expect("persona-stub-intent-ref", JSON.stringify(stubRun.generation && stubRun.generation.intentRef), JSON.stringify({ speaker: "S-01", persona: "P-01", source: "loops/loop-013/persona-design.md" }));
expect("persona-grounding-pass-on-faithful-output", checkGrounding(stubRun.generation, facts, original).pass, true);
expect("persona-stub-unstated-inquiry-kept", stubRun.generation.sentences.some((s) => s.text.includes("未記載") && s.text.includes("お気軽にお問い合わせください")), true);
expect("persona-stub-softened-sentence-kept", stubRun.generation.sentences.some((s) => s.text.includes("試算用の仮定") && s.text.includes("変動") && s.text.includes("保証しない")), true);

// --- Refusal 1: a draft approval is refused before any API call. ---
let draftCalls = 0;
const draftCountingStub = async () => { draftCalls += 1; return { content: "{}", usage: null, model: "stub" }; };
const draftRun = await runPersonaGeneration({ ...REAL, approvalFile: "loops/loop-007/approval-draft.json", patterns: PERSONA_PATTERNS, callModel: draftCountingStub });
expect("persona-draft-refused", draftRun.status, "refused");
expect("persona-draft-refused-reason", draftRun.reasonCode, "approval-not-approved");
expect("persona-draft-api-not-called", draftCalls, 0);

// --- Refusal 2: a tampered FACT copy is refused (approval-invalid) before
// any API call. ---
const scratch = mkdtempSync(path.join(tmpdir(), "generate-persona-test-"));
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
const tamperedRun = await runPersonaGeneration({ root: scratch, originalFile: "orig.json", factsFile: "facts.json", approvalFile: "approval.json", patterns: PERSONA_PATTERNS, callModel: tamperedCountingStub });
expect("persona-tampered-facts-refused", tamperedRun.status, "refused");
expect("persona-tampered-facts-reason", tamperedRun.reasonCode, "approval-invalid");
expect("persona-tampered-api-not-called", tamperedCalls, 0);

const pass = results.every((r) => r.pass);
const record = {
  testFile: "src/generate-persona.test.mjs",
  target: "src/generate-persona.mjs",
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
