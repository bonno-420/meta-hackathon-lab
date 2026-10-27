// Reproducible checks for src/extract-and-check.mjs (step-1 audit F2).
// Run: node src/extract-and-check.test.mjs [--out <path>]
// No API access, no cost. Exits non-zero if any expectation fails.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkSchemaCompleteness, checkQuoteVerbatim, fixtureFacts, loadOriginal } from "./extract-and-check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const outPath = outIdx >= 0 ? argv[outIdx + 1] : null;

const clone = (o) => JSON.parse(JSON.stringify(o));
const results = [];
function expect(id, actual, wanted) {
  results.push({ id, pass: actual === wanted, expected: wanted, actual });
}

expect("schema-positive-fixture", checkSchemaCompleteness(fixtureFacts()).pass, true);
const missing = clone(fixtureFacts());
missing.items = missing.items.filter((i) => i.key !== "housing");
const rMissing = checkSchemaCompleteness(missing);
expect("schema-negative-missing-key", rMissing.pass, false);
expect("schema-negative-missing-key-names-housing", rMissing.missingKeys.includes("housing"), true);
const dup = clone(fixtureFacts());
dup.items.push({ ...dup.items[0] });
const rDup = checkSchemaCompleteness(dup);
expect("schema-negative-duplicate-key", rDup.pass, false);
expect("schema-negative-duplicate-names-employer", rDup.duplicateKeys.includes("employer"), true);
const noField = clone(fixtureFacts());
delete noField.items[0].quote;
expect("schema-negative-missing-field", checkSchemaCompleteness(noField).pass, false);
expect("schema-negative-items-not-array", checkSchemaCompleteness({ items: null }).pass, false);
expect("schema-negative-null-facts", checkSchemaCompleteness(null).pass, false);

const original = loadOriginal();
const adopted = JSON.parse(readFileSync(path.join(root, "src", "facts", "FICT-J01-facts-v1.json"), "utf8"));
const verbatim = checkQuoteVerbatim(adopted, original);
expect("verbatim-positive-adopted-facts", verbatim.pass, true);
expect("verbatim-checked-15-items", verbatim.checked, 15);
const fake = clone(adopted);
fake.items[0].quote = "この文章は原本に存在しない。";
expect("verbatim-negative-fabricated-quote", checkQuoteVerbatim(fake, original).pass, false);
const badLine = clone(adopted);
badLine.items[0].sourceLine = "L99";
expect("verbatim-negative-unknown-line", checkQuoteVerbatim(badLine, original).pass, false);

const pass = results.every((r) => r.pass);
const record = { testFile: "src/extract-and-check.test.mjs", target: "src/extract-and-check.mjs", pass, results, verbatimAdopted: verbatim, runAt: new Date().toISOString() };
console.log(JSON.stringify(record, null, 2));
if (outPath) writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf8");
if (!pass) process.exitCode = 1;
