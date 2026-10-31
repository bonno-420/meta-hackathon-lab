// Step 5 (preview): build the demo preview HTML only from a generation
// whose re-verification verdict is pass. Fictional data only.
//
// The generator itself checks the verdict (status pass and pass true);
// any other verdict (pending, fail, tampered) produces no HTML. The
// verified sentences are inserted without editing: the LP body keeps
// the generation's text byte-for-byte, in the generation's order. Style
// handling is limited to HTML structure and CSS (L-022). A pass here is
// in-demo preview permission only, never publication permission
// (G-INV-4).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sha256File } from "./approve.mjs";

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function isPreviewEligible(verification) {
  return Boolean(
    verification &&
    verification.verdict &&
    verification.verdict.status === "pass" &&
    verification.verdict.pass === true,
  );
}

function verdictText(verification) {
  if (!verification || !verification.verdict) return "未記録";
  return `${verification.verdict.status}（${verification.verdict.effect ?? ""}）`;
}

// Build the preview HTML, or refuse. Returns { generated, reason, html }.
// No file is written by this function.
export function buildPreview({ generation, verification, facts, e02, repoUrl }) {
  if (!isPreviewEligible(verification)) {
    return {
      generated: false,
      reason: `再検証の最終判定が pass ではないため、プレビューを生成しない（verdict: ${verification && verification.verdict ? verification.verdict.status : "なし"}）`,
      html: null,
    };
  }
  if (!generation || !Array.isArray(generation.sentences) || generation.sentences.length === 0) {
    return { generated: false, reason: "生成物に文がないため、プレビューを生成しない", html: null };
  }
  const sentences = generation.sentences;
  const unstated = facts && Array.isArray(facts.items)
    ? facts.items.filter((i) => i.status === "unstated")
    : [];
  const unstatedLabel = { renewal: "更新の有無", housing: "寮" };
  const lpBody = sentences
    .map((s, idx) => `      <p class="lp-sentence" data-sentence="${idx}">${escapeHtml(s.text)}</p>`)
    .join("\n");
  const panelRows = sentences
    .map((s, idx) => `        <tr><td>${idx + 1}</td><td>${escapeHtml(s.text)}</td><td>${escapeHtml((s.factKeys ?? []).join(", "))}</td><td>${escapeHtml((s.sourceLines ?? []).join(", "))}</td></tr>`)
    .join("\n");
  const identity = verification.inputIdentity && verification.inputIdentity.pass ? "pass" : "fail";
  const grounding = verification.grounding && verification.grounding.pass
    ? `pass（${verification.grounding.checked}文、issues ${verification.grounding.issues ? verification.grounding.issues.length : 0}件）`
    : "fail";
  const human = verification.humanConfirmation && verification.humanConfirmation.status === "completed"
    ? `completed（確認者: ${verification.humanConfirmation.confirmer ?? "未記録"}、確認日時: ${verification.humanConfirmation.confirmedAt ?? "未記録"}、全${verification.humanConfirmation.sentences ? verification.humanConfirmation.sentences.length : 0}文）`
    : "未完了";
  const approvalInfo = verification.inputIdentity && verification.inputIdentity.approval
    ? `${verification.inputIdentity.approval.approvalId ?? "未記録"}（status: ${verification.inputIdentity.approval.status ?? "未記録"}、承認日時: ${verification.inputIdentity.approval.approvedAt ?? "未記録"}、有効性の再計算: ${verification.inputIdentity.validity && verification.inputIdentity.validity.valid ? "valid: true" : "valid: false"}）`
    : "未記録";
  const e02Verdict = e02 && e02.verdict ? e02.verdict : "停止（矛盾あり）";
  const e02Reasons = e02 && Array.isArray(e02.contradictions) && e02.contradictions.length > 0
    ? e02.contradictions.map((c) => `${c.field}: FACT ${c.factValue}（${c.factSource}）に対し、要約は ${c.summaryValue}`).join("。")
    : "要約側の時給1,700円が FACT の時給1,500円と矛盾する";
  const repo = repoUrl ?? "https://github.com/bonno-420/meta-hackathon-lab";
  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>架空の求人 LP プレビュー（デモ）</title>
<style>
body { font-family: sans-serif; margin: 2rem; line-height: 1.7; color: #222; }
.lp-sentence { margin: 0.4rem 0; }
table { border-collapse: collapse; }
td, th { border: 1px solid #999; padding: 0.3rem 0.6rem; vertical-align: top; }
.notice { border: 1px solid #999; padding: 0.6rem 1rem; }
</style>
</head>
<body>
<header>
<p class="notice">これは架空の求人だけを使うデモのプレビューです。実在の求人ではありません。再検証の合格はデモ内プレビューの許可までであり、公開の許可ではありません。</p>
<h1>架空の求人 LP プレビュー</h1>
</header>
<main>
<section id="lp">
<h2>LP 本文</h2>
${lpBody}
</section>
<section id="verification">
<h2>検証パネル</h2>
<p>承認: ${escapeHtml(approvalInfo)}。入力同一性: ${escapeHtml(identity)}。根拠検査: ${escapeHtml(grounding)}。人間の確認（意味の対応）: ${escapeHtml(human)}。最終判定: ${escapeHtml(verdictText(verification))}</p>
<table>
<thead><tr><th>#</th><th>文</th><th>factKeys</th><th>sourceLines</th></tr></thead>
<tbody>
${panelRows}
</tbody>
</table>
<p>未記載項目の扱い: ${unstated.length > 0 ? unstated.map((i) => `${escapeHtml(unstatedLabel[i.key] ?? i.key)}は未記載`).join("。") + "。" : "未記載項目の記録なし。"}未記載は未記載として表示に残し、承認の対象に含めない。</p>
</section>
<section id="e02">
<h2>E02 の停止表示</h2>
<p>E02 は照合で停止した（${escapeHtml(e02Verdict)}）。承認・生成・再検証・プレビューは実行していない。停止理由: ${escapeHtml(e02Reasons)}。これは生成物ではなく、停止の記録の表示である。</p>
</section>
<section id="about">
<h2>プロジェクト説明</h2>
<p>このデモは、架空の求人の原本から FACT を抽出・照合し、人間の承認を経て LP 文を生成し、生成とは独立に再検証する流れを示す。記録の正本は GitHub リポジトリにある: <a href="${escapeHtml(repo)}">${escapeHtml(repo)}</a></p>
</section>
</main>
</body>
</html>
`;
  return { generated: true, reason: null, html };
}

// Pairing check (design A-2): the displayed generation must be the one
// the verification targeted. Compares (a) the generation file's current
// sha256 (F1) with the verification's target.generationSha256, (b) the
// generation's sentence count with target.sentenceCount, and (c) the
// verification's target.generationFile with the given generation file
// (repository-relative, slash-separated). Any mismatch refuses.
export function checkPreviewPairing({ root, generationFile, generation, verification }) {
  const target = verification && verification.target ? verification.target : {};
  const normalize = (p) => (p ? String(p).split(path.sep).join("/") : null);
  const expectedFile = normalize(target.generationFile);
  const givenFile = normalize(generationFile);
  if (!expectedFile || expectedFile !== givenFile) {
    return { ok: false, reason: `プレビューを生成しない: 検証結果の対象ファイル（${expectedFile ?? "なし"}）と渡された生成ファイル（${givenFile ?? "なし"}）が一致しない`, expectedFile, givenFile };
  }
  let actualSha256 = null;
  try {
    actualSha256 = sha256File(path.join(root, generationFile));
  } catch (e) {
    return { ok: false, reason: `プレビューを生成しない: 生成ファイルのハッシュが読めない（${String(e && e.message ? e.message : e)}）`, expectedFile, givenFile };
  }
  if (!target.generationSha256 || actualSha256 !== target.generationSha256) {
    return { ok: false, reason: "プレビューを生成しない: 生成ファイルの現在のハッシュが検証結果の対象と一致しない（生成文が差し替えられた可能性がある）", expectedFile, givenFile, actualSha256 };
  }
  const count = generation && Array.isArray(generation.sentences) ? generation.sentences.length : null;
  if (typeof target.sentenceCount !== "number" || count !== target.sentenceCount) {
    return { ok: false, reason: `プレビューを生成しない: 生成物の文数（${count ?? "不明"}）が検証結果の対象（${target.sentenceCount ?? "不明"}文）と一致しない`, expectedFile, givenFile };
  }
  return { ok: true, reason: null, expectedFile, givenFile, actualSha256 };
}

// File-based wrapper. Writes outDir/index.html only when the verdict is
// pass AND the generation is the verified one; otherwise writes nothing
// (an existing file is never overwritten on refusal) and reports why.
export function writePreview({ root, generationFile, verificationFile, factsFile, outDir, e02, repoUrl }) {
  const generation = loadJson(path.join(root, generationFile));
  const verification = loadJson(path.join(root, verificationFile));
  const facts = factsFile ? loadJson(path.join(root, factsFile)) : null;
  const built = buildPreview({ generation, verification, facts, e02, repoUrl });
  if (!built.generated) {
    return { generated: false, reason: built.reason, outFile: null };
  }
  const pairing = checkPreviewPairing({ root, generationFile, generation, verification });
  if (!pairing.ok) {
    return { generated: false, reason: pairing.reason, outFile: null };
  }
  const outPath = path.join(root, outDir);
  mkdirSync(outPath, { recursive: true });
  const outFile = path.join(outPath, "index.html");
  writeFileSync(outFile, built.html, "utf8");
  return { generated: true, reason: null, outFile: path.relative(root, outFile).split(path.sep).join("/") };
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
  const verificationFile = argValue(argv, "--verification");
  const factsFile = argValue(argv, "--facts");
  const outDir = argValue(argv, "--out-dir");
  if (!generationFile || !verificationFile || !outDir) {
    console.error("usage: build-preview.mjs --generation <f> --verification <f> [--facts <f>] --out-dir <dir>");
    process.exitCode = 2;
    return;
  }
  let e02 = null;
  const runResultFile = argValue(argv, "--run-result");
  if (runResultFile && existsSync(path.join(root, runResultFile))) {
    const run = loadJson(path.join(root, runResultFile));
    e02 = run && run.e02 ? run.e02 : null;
  }
  const result = writePreview({ root, generationFile, verificationFile, factsFile: factsFile ?? undefined, outDir, e02, repoUrl: argValue(argv, "--repo-url") ?? undefined });
  console.log(JSON.stringify(result, null, 2));
  if (!result.generated) process.exitCode = 1;
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
