// Step 5 (integrated run): run steps 1-4 as one execution for E01 and
// show E02 stopping at reconciliation. Fictional data only.
//
// The runner is thin: it creates no judgement of its own. Each stage's
// pass/fail is that stage tool's own output (reconciliation verdict,
// approval validity recomputation, generation input check and grounding,
// re-verification verdict). A later stage runs only when the earlier
// stage passed; on a stopping condition the later tools are not called
// and the stopped stage and reason are recorded. The automatic run goes
// up to the re-verification mechanical checks; while the verdict is
// pending-human-confirmation it never proceeds to preview (L-026).
// Extraction and generation are live (Meta Model API, key from env
// MODEL_API_KEY, never recorded). Approval is a human act and is never
// created here; the fixed FACT v1 approval record is only re-checked.

import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { checkApprovalValidity } from "./approve.mjs";
import { checkQuoteVerbatim, loadOriginal } from "./extract-and-check.mjs";
import { checkGenerationInput } from "./generate.mjs";
import { runVerification } from "./verify.mjs";
import { buildPreview } from "./build-preview.mjs";

const execFileAsync = promisify(execFile);

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function normalizePath(p) {
  return p ? String(p).split(path.sep).join("/") : p;
}

function itemsByKey(facts) {
  return new Map((facts && Array.isArray(facts.items) ? facts.items : []).map((i) => [i.key, i]));
}

// Compare an extracted FACT candidate with the fixed FACT v1. Substantive
// disagreement (key set, status, normalized value, source line) stops
// the run, because approval stands only for the fixed pair. Wording and
// quote-granularity differences are recorded as textual diffs and do not
// stop the run (loop-006: granularity diffs left meaning, numbers and
// line correspondence intact).
export function compareFactSets(candidate, fixed) {
  const cand = itemsByKey(candidate);
  const fix = itemsByKey(fixed);
  const diffs = [];
  const textualDiffs = [];
  for (const key of new Set([...fix.keys(), ...cand.keys()])) {
    const f = fix.get(key);
    const c = cand.get(key);
    if (!f || !c) {
      diffs.push({ key, issue: !f ? "candidate has an extra key" : "candidate is missing the key" });
      continue;
    }
    if (c.status !== f.status) diffs.push({ key, field: "status", fixed: f.status, candidate: c.status });
    if (c.normalized !== f.normalized) diffs.push({ key, field: "normalized", fixed: f.normalized, candidate: c.normalized });
    if (c.sourceLine !== f.sourceLine) diffs.push({ key, field: "sourceLine", fixed: f.sourceLine, candidate: c.sourceLine });
    if (c.value !== f.value) textualDiffs.push({ key, field: "value", fixed: f.value, candidate: c.value });
    if (c.quote !== f.quote) textualDiffs.push({ key, field: "quote", fixed: f.quote, candidate: c.quote });
  }
  return { agrees: diffs.length === 0, diffs, textualDiffs };
}

// Approval stage: re-confirm the fixed approval record. The pass is the
// generation start condition itself (status approved with approver and
// approvedAt, plus checkApprovalValidity recomputed from current bytes),
// re-applied via checkGenerationInput; the validity recomputation is
// also recorded on its own. No approval is created here.
export function checkApprovalStage({ root, originalFile, factsFile, approvalFile }) {
  const approvalPath = path.join(root, approvalFile);
  if (!existsSync(approvalPath)) {
    return { pass: false, reasonCode: "approval-missing", reason: "承認記録が存在しないため、後段を実行しない", approvalId: null, status: null, validity: null, generationInput: null };
  }
  const approval = loadJson(approvalPath);
  let validity = null;
  try {
    validity = checkApprovalValidity(approval, { root, originalFile, factsFile });
  } catch (e) {
    validity = { valid: false, checks: [], reason: String(e && e.message ? e.message : e) };
  }
  const generationInput = checkGenerationInput({ root, originalFile, factsFile, approvalFile });
  return {
    pass: generationInput.ok === true,
    reasonCode: generationInput.reasonCode ?? null,
    reason: generationInput.reason ?? null,
    approvalId: approval.approvalId ?? null,
    status: approval.status ?? null,
    approver: approval.approver ?? null,
    approvedAt: approval.approvedAt ?? null,
    validity,
    generationInput,
  };
}

function stageNotExecuted(reason) {
  return { executed: false, reason };
}

// Integrated run. Stage executors are injected (deps) so tests can stub
// the API-calling stages; the live CLI wires CLI-based executors below.
// options.humanConfirmation, when given, is passed to re-verification
// (the live run never fabricates one). options.allowPreview stays false
// for the automatic run up to mechanical checks.
export async function runDemo(options, deps = {}) {
  const root = options.root;
  const originalFile = options.originalFile ?? "src/fict-j01-v1.json";
  const factsFile = options.factsFile ?? "src/facts/FICT-J01-facts-v1.json";
  const approvalFile = options.approvalFile ?? "src/facts/FICT-J01-facts-v1.approval.json";
  const generationFile = options.generationFile ?? "loops/loop-010/generated-lp-v1.json";
  const startedAt = new Date().toISOString();
  const t0 = performance.now();

  const extract = deps.extract ?? (async () => { throw new Error("no extraction executor wired"); });
  const generate = deps.generate ?? (async () => { throw new Error("no generation executor wired"); });
  const verify = deps.verify ?? ((args) => runVerification(args));
  const preview = deps.preview ?? (({ generation, verification, facts, e02, repoUrl }) => buildPreview({ generation, verification, facts, e02, repoUrl }));

  const stages = {};
  let stoppedAt = null;
  let stopReason = null;
  const stop = (stage, reason) => { stoppedAt = stage; stopReason = reason; };

  // Stage 1: extraction and reconciliation (E01 and E02 in one run).
  const extraction = await extract();
  const e01 = extraction && extraction.e01 ? extraction.e01 : null;
  const e02raw = extraction && extraction.e02 ? extraction.e02 : null;
  stages.extraction = {
    executed: true,
    status: extraction ? (extraction.status ?? null) : null,
    model: extraction ? (extraction.model ?? null) : null,
    promptVersion: extraction ? (extraction.promptVersion ?? null) : null,
    durationMs: extraction ? (extraction.durationMs ?? null) : null,
    usage: extraction ? (extraction.usage ?? null) : null,
    costUsd: extraction ? (extraction.costUsd ?? null) : null,
    costNote: extraction ? (extraction.costNote ?? null) : null,
    schemaCheck: extraction ? (extraction.schemaCheck ?? null) : null,
    e01,
    e02: e02raw,
  };
  const e02 = {
    caseId: "E02",
    stage: "照合",
    verdict: e02raw ? (e02raw.verdict ?? null) : null,
    stoppedAtReconciliation: e02raw ? (e02raw.stoppedAtReconciliation ?? null) : null,
    contradictions: e02raw ? (e02raw.contradictions ?? []) : [],
    approval: stageNotExecuted("E02 は照合で停止したため承認を実行しない（矛盾で停止した対象に承認記録を作らない、G-INV-3）"),
    generation: stageNotExecuted("E02 は照合で停止したため生成を実行しない"),
    verification: stageNotExecuted("E02 は照合で停止したため再検証を実行しない"),
    preview: stageNotExecuted("E02 は照合で停止したためプレビューを実行しない"),
  };

  if (!extraction || extraction.status !== "completed" || !extraction.facts) {
    stop("extraction", extraction && extraction.reason ? extraction.reason : (extraction && extraction.parseError ? extraction.parseError : "抽出が完了しなかったため、後段を実行しない"));
  } else if (extraction.schemaCheck && extraction.schemaCheck.pass !== true) {
    stop("extraction", "抽出結果のスキーマ完全性チェックが pass しなかったため、後段を実行しない");
  } else if (!e01 || e01.stoppedAtReconciliation || !String(e01.verdict ?? "").includes("一致")) {
    stop("reconciliation", e01 ? `E01 の照合が停止したため、後段を実行しない（${e01.verdict ?? "判定なし"}）` : "E01 の照合結果が得られなかったため、後段を実行しない");
  }

  // Stage 2 (facts comparison): the candidate must not substantively
  // disagree with the fixed FACT v1 that the approval stands for.
  let fixedFacts = null;
  if (!stoppedAt) {
    fixedFacts = loadJson(path.join(root, factsFile));
    const original = loadOriginal();
    const verbatim = checkQuoteVerbatim(extraction.facts, original);
    const comparison = compareFactSets(extraction.facts, fixedFacts);
    stages.factsComparison = { executed: true, verbatim, ...comparison };
    if (!verbatim.pass) {
      stop("facts-comparison", "抽出候補の引用逐語性チェックが pass しなかったため、後段を実行しない");
    } else if (!comparison.agrees) {
      stop("facts-comparison", "抽出の再実行で得た FACT 候補が固定済み FACT v1 と食い違うため、その時点で止める（承認は FACT v1 の組にのみ成立しているため）");
    }
  } else {
    stages.factsComparison = stageNotExecuted("前段で停止したため、FACT 候補と固定済み FACT の比較を実行しない");
  }

  // Stage 3 (approval): re-confirm only; never create an approval.
  if (!stoppedAt) {
    const approvalStage = checkApprovalStage({ root, originalFile, factsFile, approvalFile });
    stages.approval = { executed: true, ...approvalStage };
    if (!approvalStage.pass) {
      stop("approval", approvalStage.reason ?? "承認の有効性が再確認できなかったため、後段を実行しない");
    }
  } else {
    stages.approval = stageNotExecuted("前段で停止したため、承認の有効性の再確認を実行しない");
  }

  // Stage 4 (generation): the tool's own input check runs first inside
  // the generation flow; a refusal never reaches the API. The stage pass
  // is the tool's grounding result, not its status alone (L-021).
  let generationRun = null;
  if (!stoppedAt) {
    generationRun = await generate({ root, originalFile, factsFile, approvalFile });
    stages.generation = {
      executed: true,
      status: generationRun ? (generationRun.status ?? null) : null,
      apiCalled: generationRun ? (generationRun.apiCalled ?? null) : null,
      model: generationRun ? (generationRun.model ?? null) : null,
      promptVersion: generationRun ? (generationRun.promptVersion ?? null) : null,
      durationMs: generationRun ? (generationRun.durationMs ?? null) : null,
      usage: generationRun ? (generationRun.usage ?? null) : null,
      costUsd: generationRun ? (generationRun.costUsd ?? null) : null,
      costNote: generationRun ? (generationRun.costNote ?? null) : null,
      grounding: generationRun ? (generationRun.grounding ?? null) : null,
      reasonCode: generationRun ? (generationRun.reasonCode ?? null) : null,
      reason: generationRun ? (generationRun.reason ?? null) : null,
    };
    if (!generationRun || generationRun.status === "refused") {
      stop("generation", generationRun && generationRun.reason ? generationRun.reason : "生成の入力チェックで拒否されたため、後段を実行しない");
    } else if (generationRun.status !== "generated" || !generationRun.generation) {
      stop("generation", "生成が完了しなかったため、後段を実行しない");
    } else if (!generationRun.grounding || generationRun.grounding.pass !== true) {
      stop("generation", "生成の根拠検査が pass しなかったため、後段を実行しない");
    }
  } else {
    stages.generation = stageNotExecuted("前段で停止したため、生成を実行しない");
  }

  // Stage 5 (re-verification): mechanical checks by the tool itself.
  let verification = null;
  if (!stoppedAt) {
    verification = verify({
      root,
      generationFile,
      approvalFile,
      generation: generationRun.generation,
      humanConfirmation: options.humanConfirmation,
    });
    stages.verification = {
      executed: true,
      inputIdentity: verification.inputIdentity,
      grounding: verification.grounding,
      mechanicalPass: verification.mechanicalPass,
      humanConfirmation: verification.humanConfirmation,
      verdict: verification.verdict,
    };
    if (verification.verdict.status === "fail") {
      stop("verification", verification.verdict.reason ?? "再検証が不合格のため、後段を実行しない");
    }
  } else {
    stages.verification = stageNotExecuted("前段で停止したため、再検証を実行しない");
  }

  // Preview: never from the automatic run while the verdict is not pass,
  // and never at all unless explicitly allowed (stage 2 of the brief's
  // two-stage execution enables it after human confirmation).
  let previewResult = null;
  if (stoppedAt) {
    stages.preview = stageNotExecuted("前段で停止したため、プレビューを生成しない");
  } else if (!verification || verification.verdict.status !== "pass") {
    stages.preview = {
      executed: false,
      reason: "再検証の最終判定が未確定（pending-human-confirmation）のため、プレビューに進まない。人間確認を省略して自動で進む経路は作らない",
      verdictStatus: verification ? verification.verdict.status : null,
    };
  } else if (!options.allowPreview) {
    stages.preview = {
      executed: false,
      reason: "本実行（機械検査まで）ではプレビューを生成しない。プレビューは人間確認の確定後に別段階で生成する",
      verdictStatus: verification.verdict.status,
    };
  } else {
    previewResult = preview({ generation: generationRun.generation, verification, facts: fixedFacts, e02, repoUrl: options.repoUrl });
    stages.preview = { executed: true, generated: previewResult.generated, reason: previewResult.reason ?? null };
    if (!previewResult.generated) stop("preview", previewResult.reason ?? "プレビューが生成されなかった");
  }

  const extractionCost = stages.extraction.costUsd;
  const generationCost = stages.generation && typeof stages.generation === "object" ? stages.generation.costUsd : null;
  const costsKnown = typeof extractionCost === "number" && typeof generationCost === "number";
  const totalCostUsd = costsKnown ? extractionCost + generationCost : null;

  let status;
  if (stoppedAt) status = stoppedAt === "preview" ? "failed" : "stopped";
  else if (verification && verification.verdict.status === "pass") status = "pass";
  else status = "pending-human-confirmation";

  return {
    kind: "demo-run-result",
    version: 1,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - t0),
    status,
    stoppedAt,
    stopReason,
    input: {
      original: { file: originalFile },
      facts: { file: factsFile },
      approval: { file: approvalFile },
    },
    stages,
    e02,
    generation: generationRun ? (generationRun.generation ?? null) : null,
    verification: verification ?? null,
    previewHtml: previewResult ? (previewResult.html ?? null) : null,
    artifacts: {
      generationFile: !stoppedAt || stages.generation.executed ? normalizePath(generationFile) : null,
      verificationFile: normalizePath(options.verificationFile ?? "loops/loop-010/verification-result.json"),
      preview: null,
    },
    costs: {
      category: "製品実行",
      currency: "USD",
      extractionCostUsd: extractionCost ?? null,
      generationCostUsd: generationCost ?? null,
      totalCostUsd,
      breakdown: [
        { stage: "抽出（工程1、ライブ）", costUsd: extractionCost ?? null, usage: stages.extraction.usage ?? null },
        { stage: "生成（工程3、ライブ）", costUsd: generationCost ?? null, usage: stages.generation && stages.generation.usage !== undefined ? stages.generation.usage : null },
        { stage: "再検証・プレビュー生成", costUsd: 0, usage: null, note: "API を呼ばないため費用は発生しない" },
      ],
      note: totalCostUsd === null
        ? "抽出と生成の算出値がそろわなかったため、合計は未記録（推定しない）。内訳の算出値は各道具の D4 単価による算出値で、確定実費は dev.meta.ai Billing 実績との突合が必要"
        : "統合実行1回の費用は抽出と生成の算出値の合計。いずれも D4 単価による算出値で、確定実費は dev.meta.ai Billing 実績との突合が必要",
    },
  };
}

// --- Live executors (CLI連携). Each tool keeps its own API caller and
// its own refusal-before-API behaviour; the runner only collects. ---

async function runNode(args) {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, args, { maxBuffer: 16 * 1024 * 1024, env: process.env });
    return { exitCode: 0, stdout, stderr };
  } catch (e) {
    return { exitCode: typeof e.code === "number" ? e.code : 1, stdout: e.stdout ?? "", stderr: e.stderr ?? String(e.message ?? e) };
  }
}

function parseLastJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { /* fall through */ }
  const start = text.indexOf("{");
  if (start < 0) return null;
  try { return JSON.parse(text.slice(start)); } catch { return null; }
}

export function liveDeps({ root, outDir, generationFile }) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const extractionOutDir = path.join(outDir, "extraction");
  return {
    extract: async () => {
      const run = await runNode([path.join(here, "extract-and-check.mjs"), "--prompt", "v1.1", "--out-dir", extractionOutDir]);
      const liveFile = path.join(root, extractionOutDir, "live-run.json");
      if (existsSync(liveFile)) return loadJson(liveFile);
      return { status: "blocked", reason: parseLastJson(run.stdout)?.reason ?? "抽出の実行記録が得られなかった", facts: null, schemaCheck: null, e01: null, e02: null, usage: null, costUsd: null };
    },
    generate: async ({ originalFile, factsFile, approvalFile }) => {
      const genAbs = path.join(root, generationFile);
      const runOutRel = path.join(outDir, "generation-run.json");
      const run = await runNode([path.join(here, "generate.mjs"), "--approval", approvalFile, "--original", originalFile, "--facts", factsFile, "--out", generationFile, "--run-out", runOutRel]);
      const runOutAbs = path.join(root, runOutRel);
      if (existsSync(runOutAbs)) {
        const record = loadJson(runOutAbs);
        const generation = existsSync(genAbs) && record.status === "generated" ? loadJson(genAbs) : null;
        return { ...record, generation };
      }
      const printed = parseLastJson(run.stdout);
      return {
        status: printed && printed.status ? printed.status : "blocked",
        reason: printed && printed.reason ? printed.reason : "生成の実行記録が得られなかった",
        apiCalled: false,
        usage: null,
        costUsd: null,
        costNote: "未記録（生成が実行されなかったため推定しない）",
        generation: null,
        grounding: null,
      };
    },
  };
}

function argValue(argv, flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "..");
  const argv = process.argv.slice(2);
  const outDir = argValue(argv, "--out-dir") ?? "loops/loop-010";
  const originalFile = argValue(argv, "--original") ?? "src/fict-j01-v1.json";
  const factsFile = argValue(argv, "--facts") ?? "src/facts/FICT-J01-facts-v1.json";
  const approvalFile = argValue(argv, "--approval") ?? "src/facts/FICT-J01-facts-v1.approval.json";
  const generationFile = argValue(argv, "--generation-out") ?? `${outDir.replaceAll("\\", "/")}/generated-lp-v1.json`;
  const verificationFile = `${outDir.replaceAll("\\", "/")}/verification-result.json`;
  const runResultFile = `${outDir.replaceAll("\\", "/")}/run-result.json`;

  const result = await runDemo(
    { root, originalFile, factsFile, approvalFile, generationFile, verificationFile, allowPreview: false },
    liveDeps({ root, outDir, generationFile }),
  );

  mkdirSync(path.join(root, outDir), { recursive: true });
  if (result.verification) {
    writeFileSync(path.join(root, verificationFile), JSON.stringify(result.verification, null, 2) + "\n", "utf8");
  }
  const { generation, verification, previewHtml, ...record } = result;
  writeFileSync(path.join(root, runResultFile), JSON.stringify({ ...record, generationFile, verificationFile }, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({
    status: result.status,
    stoppedAt: result.stoppedAt,
    stopReason: result.stopReason,
    e01Verdict: result.stages.extraction.e01 ? result.stages.extraction.e01.verdict : null,
    e02Verdict: result.e02.verdict,
    generationStatus: result.stages.generation.status ?? null,
    verificationVerdict: result.verification ? result.verification.verdict.status : null,
    costs: result.costs,
  }, null, 2));
  if (result.status === "stopped" || result.status === "failed") process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
