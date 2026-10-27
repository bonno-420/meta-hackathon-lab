# 工程1 監査修正（F1・F2）適用指示 ― OpenCode 用

位置づけ: 監理ラインの監査（docs/design/step1-review.md、判定「修正」）に対する修正適用作業。統括（Muse Bot）の指示で実施し、自ら完了判定はしない（再監査は監理ラインが行う）。
開始時: main を最新化し、開始時点の HEAD（c356c9e のはず）を控えること。loops/loop-002 には触れない。live API は実行しない（追加費用なし）。
最初に、本指示文自体を docs/prompts/step1-fix-brief.md として保存してから作業すること。

## 作業1（F1: ハッシュの定義と原本ハッシュの追加）

1. リポジトリのルートに .gitattributes を新規作成する。内容は次のとおり。

# Step-2 verification anchors: pin LF so a checkout has the same bytes as
# the Git blob and the recorded sha256 values reproduce (step-1 audit F1).
src/fict-j01-v1.json text eol=lf
src/facts/*.json text eol=lf

2. src/facts/FICT-J01-facts-v1.manifest.json を編集する。
   - トップレベルに "hashDefinition" を追加する。値は次の文面: 「sha256 の対象は Git に保存されたバイト列（UTF-8、改行は LF）とする。.gitattributes で対象ファイルの eol=lf を固定するため、チェックアウトしたファイルのバイト列も同一になる。再現手順は、対象ファイルのバイト列をそのまま sha256 すること（改行変換を行うツールを使わない）」
   - "original" に "sha256": "a4456e9f229e2877861aad2324bc796641bfb02f36d57c3bf5c339f4d9461a60" を追加する
   - 既存の facts 側 "sha256"（3dc7fbd1…）は変更しない。manifest 自体はハッシュ対象ではない
3. 検証して報告に含めること: 対象2ファイルを再チェックアウトしたうえで、実ファイルの sha256 が facts = 3dc7fbd12e773bc1d9ba711b0ce7b34318003be07f5782ba1c89004e642534ec、原本 = a4456e9f…a60 と一致すること。git blob 側の sha256 とも一致すること

## 作業2（F2: コード変更、src/extract-and-check.mjs）

(a) import を変更する: `import { fileURLToPath } from "node:url";` → `import { fileURLToPath, pathToFileURL } from "node:url";`
(b) 次の3つの関数に export を付ける: loadOriginal、fixtureFacts、checkSchemaCompleteness
(c) checkSchemaCompleteness の直後に、次の関数を追加する。

// Quote-verbatim check: every item's sourceLine must exist in the original
// and its quote must be an exact substring of that line's text. This is a
// separate check from schema completeness (different inputs, different
// question), per the step-1 audit (F2).
export function checkQuoteVerbatim(facts, original) {
  const lines = new Map(original.lines.map((l) => [l.id, l.text]));
  const issues = [];
  if (!facts || !Array.isArray(facts.items)) {
    return { pass: false, reason: "facts.items is not an array", checked: 0, issues };
  }
  for (const item of facts.items) {
    const line = lines.get(item.sourceLine);
    if (line === undefined) {
      issues.push({ key: item.key ?? null, issue: `sourceLine not found: ${String(item.sourceLine)}` });
    } else if (typeof item.quote !== "string" || !line.includes(item.quote)) {
      issues.push({ key: item.key ?? null, issue: "quote is not a verbatim substring of the source line" });
    }
  }
  return { pass: issues.length === 0, checked: facts.items.length, issues };
}

(d) runLive の到達性を直す。現在の「let e01 = null; let e02 = null; let schemaCheck = null; if (facts && Array.isArray(facts.items)) { … schemaCheck = checkSchemaCompleteness(facts); }」のブロックを次に置き換える。

  let e01 = null;
  let e02 = null;
  // F2 reachability: the schema check result is always recorded. When the
  // extraction output cannot be parsed, the check itself is recorded as
  // failed with the reason, never left null.
  let schemaCheck;
  if (facts) {
    schemaCheck = checkSchemaCompleteness(facts);
  } else {
    schemaCheck = { ...checkSchemaCompleteness(null), reason: "extraction output was not valid JSON" };
  }
  if (facts && Array.isArray(facts.items)) {
    const e01Summary = original.lines.map((l) => l.text).join("");
    e01 = reconcile(facts, e01Summary, "E01");
    e02 = reconcile(facts, E02_SUMMARY, "E02");
  }

(d2) runLive の早期 return（API キー未設定の blocked、HTTP エラーの api-error）にも、schemaCheck フィールドを追加する。値は { ...checkSchemaCompleteness(null), reason: "no extraction output" } とする
(e) ファイル末尾の main().catch(…) の無条件実行を、次のガードに置き換える。

// Run only when executed directly, so tests can import the checks (F2).
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}

## 作業3（F2: テストの証跡化）

src/extract-and-check.test.mjs を新規作成する（内容は次のとおり）。

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

実行すること:
- node src/extract-and-check.test.mjs --out loops/loop-006/check-verification.json （全件 pass、終了コード 0 を確認）
- 回帰確認: node src/extract-and-check.mjs --verify-offline --out-dir <リポジトリ外の一時フォルダ> （従来の6件すべて pass を確認）

## 作業4（記録の更新）

1. loops/loop-006/gate-candidate-schema-completeness.md の末尾に追記する: 「引用の逐語性（sourceLine の実在と quote がその行の逐語部分文字列であること）は本候補の対象外である。逐語性は別のチェック（src/extract-and-check.mjs の checkQuoteVerbatim）で扱い、結果は loops/loop-006/check-verification.json に残す（工程1監査 F2 による切り分け）」
2. loops/loop-006/run-record.md の末尾に「## 監査修正の適用（F1・F2）」の節を追加する。開始時点の HEAD、変更ファイルと変更内容、テスト結果（check-verification.json の pass 件数）、ハッシュ照合の結果（実ファイルと blob の両方）を、実行して得た数値で書くこと。推測で埋めない
3. loops/INDEX.md のループ6行を、見出しと同じ3列（ループ／内容／記録の所在）に直す。監査状態の表示は受け入れ時に更新するので、文面は変えず列数だけ直すこと

## コミットと報告

- 変更対象は上記のファイルのみ。コミットは1〜2個にまとめ、push まで行う
- 報告には、変更ファイル一覧、テストの pass 件数、ハッシュ照合結果、開始・終了の HEAD を含めること
