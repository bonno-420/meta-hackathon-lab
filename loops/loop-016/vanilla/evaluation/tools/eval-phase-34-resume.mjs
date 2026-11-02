#!/usr/bin/env node
// resume version: skip already done judge/review, add fetch timeout 60s + retry
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const CASES = ["A","B","C","D","E","F"];
const VARIANTS = [
  { id:"vanilla-wonder", rel: (c)=> `vanilla/wonder/case-${c.toLowerCase()}.html` },
  { id:"vanilla-spark", rel: (c)=> `vanilla/spark/case-${c.toLowerCase()}.html` },
  { id:"pipeline-gen-005", rel: (c)=> `previews/case-${c}-gen-005-complete.html` },
];
const MODEL = "muse-spark-1.3-contributor";
const BASE_URL = process.env.META_BASE_URL || "https://api.meta.ai/v1";
const MAX_TOKENS_JUDGE = 12000;
const MAX_TOKENS_REVIEW = 4000;

function loadMetaKey(){
  if(process.env.MODEL_API_KEY) return { source:"env:MODEL_API_KEY", key: process.env.MODEL_API_KEY };
  const p=join(homedir(), ".config","opencode","meta-api-key");
  if(existsSync(p)){ const raw=readFileSync(p,"utf8").trim(); if(raw) return {source:`file:${p}`, key: raw}; }
  return {source:null, key:null};
}
function stripToVisible(html, maxChars=9000){
  let s=html.replace(/<script[\s\S]*?<\/script>/gi," ");
  s=s.replace(/<style[\s\S]*?<\/style>/gi," ");
  s=s.replace(/<!--[\s\S]*?-->/g," ");
  s=s.replace(/<h1[^>]*>/gi,"\n[H1] ");
  s=s.replace(/<h2[^>]*>/gi,"\n[H2] ");
  s=s.replace(/<li[^>]*>/gi,"\n- ");
  s=s.replace(/<\/?[^>]+>/g," ");
  s=s.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ");
  s=s.replace(/\s+/g," ").trim();
  if(s.length>maxChars) s=s.slice(0,maxChars)+" …(truncated)";
  return s;
}
function loadPairs(){
  const dir=resolve("loops/loop-016/checks/pairs");
  let files=[];
  try{ files=readdirSync(dir).filter(f=> f.endsWith(".md")).sort(); }catch{}
  const parts=[];
  for(const f of files){
    try{ const body=readFileSync(join(dir,f),"utf8"); parts.push(`--- PAIR FILE: ${f} ---\n${body}`); }catch{}
  }
  return parts.join("\n\n");
}
const CATALOG = `
Defect catalog (page-level, language-agnostic, independent from prose 4-viewpoints):

P1 文の逐語反復による仕様書化 / Verbatim repetition spec-ifying the page
  — Same sentence appears verbatim 2+ times across sections (including intra-facts table repetition and double-posting facts↔body). Intentional CTA repost is NOT P1; spec-ifying repetition is. Cite the repeated sentence.

P2 検証側・メタ文の混入 / Verification/meta text contamination
  — Phrases that belong to the verification side ("What this means", "numbers stay exactly as stated", "as stated in the FACT", "Read the sentences above as the full conditions", "All facts below are the only stated facts" etc. JA: "求人票にない", "再計算はしない" etc.) appear in reader-facing copy. Cite the exact phrase.

P3 記録物（企画・根拠）の露出 / Internal record exposure
  — Planning labels (Target audience, Persona, Insights applied, factKeys, sourceLines, Appeal:, mustNot, 〔〕 citations, L01 etc.) are visible to the reader. Cite the label.

P4 見出しと中身のずれ / Heading-content mismatch
  — Section heading promises a scope but body contains out-of-scope factKeys (e.g. heading "Pay & Hours" but body includes team/training/benefits/company). List heading, allowed vs unexpected keys, quote the mismatched sentence.

P5 当事者の声の欠落（説明文化）/ Missing participant voice (explanatory culture only)
  — Page is fully explanatory/spec-like with no lived-voice or scenario grounding. Harder to judge mechanically; note if page is entirely descriptive. Cite what is missing (optional).

P6 [candidate] 読み手の第一確認項目がヒーローに出ていない / Reader's first-check item missing from hero (candidate)
  — The hero (h1 / first-screen title row) does not contain the reader's expected first-check item for this employment type. Examples: hourly roles where the persona checks pay first but hero shows only company name; contract roles where readers check term first but hero has no term badge; part-time where readers check time windows but hero has only role title. Use the research/research case files as the reference for what the first-check item is. Cite hero text verbatim and what is missing. (Candidate: permanence requires owner approval.)
`.trim();

function buildJudgeMessages({caseId, caseLabel, visible, pairs}){
  let researchHint="";
  try{
    const rcCase=readFileSync(resolve(`loops/loop-016/research/case-${caseId.slice(-1).toLowerCase()}.md`), "utf8");
    const firstCheck=rcCase.match(/Reader's first-check item[\s\S]{0,600}?/)?.[0] || "";
    if(firstCheck) researchHint=`=== RESEARCH (for P6 — expression-type reference, NOT fact source) ===\n${firstCheck}\n(See common.md + case file for hero skeleton. P6 judges hero omission only.)`;
  }catch{}
  const system=[
    "You are a fresh-session page-level defect judge. You have no prior context about this project.",
    "You are given contrast pairs (bad/good examples) and a target page. Judge the target page ONLY against the defect catalog P1-P6.",
    "For each P1-P6, answer ある (present) or ない (absent). If ある, quote the exact evidence from the target page (verbatim fragment, 1-2 lines). If ない, write ない and one-line reason.",
    "Output markdown with exactly 6 headings: ## P1, ## P2, ## P3, ## P4, ## P5, ## P6. Under each, start with **判定: ある** or **判定: ない**, then 根拠: quote, then コメント: one sentence.",
    "P6 is candidate — judge it like the others but it does not affect overall pass/fail until approved.",
    "Do not invent facts. Quote only from the target page text provided. Keep evidence verbatim.",
    "Language: judgment labels and quotes may be EN or JA as the page is; explanations in Japanese is OK but keep quotes verbatim.",
  ].join("\n");
  const user=[
    `Case: ${caseId} (${caseLabel})`,
    "",
    "=== DEFECT CATALOG ===",
    CATALOG,
    "",
    "=== CONTRAST PAIRS (few-shot, bad vs good) ===",
    pairs,
    "",
    researchHint,
    "",
    "=== TARGET PAGE (visible text, truncated) ===",
    visible,
    "",
    "=== TASK ===",
    "Judge the TARGET PAGE against P1-P6 using the pairs as calibration. For each P, output 判定 and 根拠引用. Output verbatim markdown with 6 sections.",
  ].join("\n");
  return [{role:"system", content: system}, {role:"user", content: user}];
}

async function fetchWithTimeout(url, opts, timeoutMs=60000){
  const controller=new AbortController();
  const t=setTimeout(()=> controller.abort(), timeoutMs);
  try{
    const res=await fetch(url, {...opts, signal: controller.signal});
    clearTimeout(t);
    return res;
  }catch(e){
    clearTimeout(t);
    throw e;
  }
}

async function judgeOne({caseLetter, variant, pairs, key, source}){
  const caseData=JSON.parse(readFileSync(resolve(`loops/loop-016/cases/case-${caseLetter}.json`),"utf8").replace(/^\uFEFF/,""));
  const variantDef=VARIANTS.find(v=> v.id===variant);
  const htmlPath=resolve(`loops/loop-016/${variantDef.rel(caseLetter)}`);
  const html=readFileSync(htmlPath,"utf8");
  const visible=stripToVisible(html, 9000);
  const messages=buildJudgeMessages({caseId: caseData.id, caseLabel: caseData.label, visible, pairs});
  const url=`${BASE_URL.replace(/\/$/,"")}/chat/completions`;
  const body={ model: MODEL, messages, temperature: 0.3, max_tokens: MAX_TOKENS_JUDGE };
  const startedAt=new Date().toISOString();
  let lastErr=null;
  for(let attempt=1; attempt<=3; attempt++){
    try{
      const res=await fetchWithTimeout(url,{method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${key}`}, body: JSON.stringify(body)}, 65000);
      const text=await res.text();
      let json=null;
      try{ json=JSON.parse(text); }catch{}
      if(!res.ok || !json){ throw new Error(`Meta judge failed HTTP ${res.status} ${text.slice(0,800)}`); }
      const content=json.choices?.[0]?.message?.content ?? "";
      if(!content) throw new Error(`Empty judge content (reasoning may have consumed tokens): ${text.slice(0,400)}`);
      const usage=json.usage ?? null;
      const checksDir=resolve("loops/loop-016/vanilla/evaluation/checks");
      mkdirSync(checksDir,{recursive:true});
      const outKey=`case-${caseLetter.toLowerCase()}-${variant}-judge`;
      const header=`# Judge (Layer 2 few-shot contrast) — C-${caseLetter} ${variant}\n\n- source: \`${variantDef.rel(caseLetter)}\`\n- tool: \`eval-phase-34-resume.mjs\` (Meta枠, Baseten枠に含めない)\n- model: ${MODEL}\n- date: ${new Date().toISOString().slice(0,10)}\n- started: ${startedAt}\n- finished: ${new Date().toISOString()}\n- attempt: ${attempt}\n- usage: ${usage ? `prompt ${usage.prompt_tokens ?? "?"} / completion ${usage.completion_tokens ?? "?"} / total ${usage.total_tokens ?? "?"}` : "未記録"} (reasoning: ${usage?.completion_tokens_details?.reasoning_tokens ?? "?"})\n- keySource: ${source} (値は記録しない)\n- pairs: checks/pairs/*.md\n- pairsStatus: candidate\n- catalog: P1-P6 (P6 candidate — permanence requires owner approval)\n- note: Verbatim output below — not summarized. Candidate catalog P1-P6. Same judge, same pairs for all 18.\n\n---\n\n`;
      const md=header+content+`\n\n---\n\n## 原文の扱い\n\n- 上記はモデルの原文のまま記録（要約しない）。恒常化は本人承認を経る。\n`;
      const outPath=join(checksDir, `${outKey}.md`);
      writeFileSync(outPath, md, "utf8");
      const jsonPath=join(checksDir, `${outKey}.json`);
      writeFileSync(jsonPath, JSON.stringify({case:`C-${caseLetter}`, variant, model:MODEL, usage, contentLength: content.length, source: variantDef.rel(caseLetter), attempt},null,2)+"\n","utf8");
      const verdicts={};
      for(const p of ["P1","P2","P3","P4","P5","P6"]){
        const re=new RegExp(`##\\s*${p}[\\s\\S]*?判定:\\s*(ある|ない)`,"i");
        const m=content.match(re);
        verdicts[p]=m ? m[1] : "unknown";
      }
      return {case:`C-${caseLetter}`, variant, outPath, usage, verdicts, content, attempt};
    }catch(e){
      lastErr=e;
      console.error(`[judge] C-${caseLetter} ${variant} attempt ${attempt} failed: ${e.message}${e.name==='AbortError' ? ' (timeout)' : ''}`);
      if(attempt<3) await new Promise(r=> setTimeout(r, 2000*(attempt)));
      else throw lastErr;
    }
  }
}

async function reviewOne({caseLetter, anonLabel, key, source}){
  const caseData=JSON.parse(readFileSync(resolve(`loops/loop-016/cases/case-${caseLetter}.json`),"utf8").replace(/^\uFEFF/,""));
  const anonPath=resolve(`loops/loop-016/vanilla/evaluation/anon/case-${caseLetter.toLowerCase()}-${anonLabel}.html`);
  const html=readFileSync(anonPath,"utf8");
  const visible=stripToVisible(html, 8000);
  const facts=caseData.facts.map(f=> `- ${f.key}: ${f.value} (${f.sourceLine})`).join("\n");
  const persona=caseData.plan.persona;
  const targetAudience=caseData.plan.targetAudience;
  const appeal=caseData.plan.appeal;
  const mustNot=(caseData.plan.mustNot||[]).join(" / ");
  const system=[
    "You are a fresh-eye persona reviewer for a fictional job LP. Read as the persona below.",
    "You must judge the PAGE CONTENT (visible text) provided, not any external knowledge.",
    "Return EXACTLY four sections with concrete verbatim quotes from the page text. Do not summarize away problems; quote the sentence that is unclear or AI-like.",
    "Sections:",
    "1. Unclear — which sentence or fact is hard to understand, and why (quote it).",
    "2. Drop-off — where would this persona stop reading or hesitate to apply, and why (quote it).",
    "3. Applicant questions — list 2-4 concrete questions this persona would ask before applying (grounded in the facts shown).",
    "4. AI-ness — which sentence sounds AI-generated, with the specific phrase quoted as evidence. If none, say 'None found' with one line of reasoning.",
    "Rules: base every point on the given page text only. Do not invent new facts. Keep it in English. Output markdown with the four headings. You are told only the case ID and the blind label (X/Y/Z); you do not know which system produced it.",
  ].join("\n");
  const user=[
    `Persona: ${persona}`,
    `Target audience: ${targetAudience}`,
    `Appeal: ${appeal}`,
    `Case: ${caseData.id} (${caseData.label}) — blind variant ${anonLabel}`,
    `CTA: ${caseData.plan.cta}`,
    `Must NOT: ${mustNot}`,
    "",
    "FACTs (ground truth for this case; page must not invent beyond these):",
    facts,
    "",
    "PAGE VISIBLE TEXT (blind variant, truncated to 8000 chars):",
    visible,
    "",
    "Task: Review as the persona above. Quote verbatim from PAGE VISIBLE TEXT for unclear/drop-off/AI-ness. Output the four headings.",
  ].join("\n");
  const url=`${BASE_URL.replace(/\/$/,"")}/chat/completions`;
  const body={ model: MODEL, messages: [{role:"system", content: system},{role:"user", content: user}], temperature: 0.3, max_tokens: MAX_TOKENS_REVIEW };
  const startedAt=new Date().toISOString();
  let lastErr=null;
  for(let attempt=1; attempt<=3; attempt++){
    try{
      const res=await fetchWithTimeout(url,{method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${key}`}, body: JSON.stringify(body)}, 65000);
      const text=await res.text();
      let json=null;
      try{ json=JSON.parse(text); }catch{}
      if(!res.ok || !json){ throw new Error(`Meta review failed HTTP ${res.status} ${text.slice(0,800)}`); }
      const content=json.choices?.[0]?.message?.content ?? "";
      if(!content) throw new Error(`Empty review content: ${text.slice(0,400)}`);
      const usage=json.usage ?? null;
      const outDir=resolve("loops/loop-016/vanilla/evaluation/checks");
      mkdirSync(outDir,{recursive:true});
      const outKey=`case-${caseLetter.toLowerCase()}-${anonLabel}-review-blind`;
      const header=`# Persona review (blind) — C-${caseLetter} ${anonLabel}\n\n- case: ${caseData.id} (${caseData.label})\n- blind label: ${anonLabel} (sealed mapping: vanilla/evaluation/anon/mapping-sealed-20261102.json — do not open until all reviews complete)\n- persona: ${persona}\n- target: ${targetAudience}\n- date: ${new Date().toISOString().slice(0,10)}\n- started: ${startedAt}\n- finished: ${new Date().toISOString()}\n- attempt: ${attempt}\n- model: ${MODEL} (Meta枠, Baseten枠に含めない)\n- usage: ${usage ? `prompt ${usage.prompt_tokens ?? "?"} / completion ${usage.completion_tokens ?? "?"} / total ${usage.total_tokens ?? "?"}` : "未記録"} (reasoning: ${usage?.completion_tokens_details?.reasoning_tokens ?? "?"})\n- keySource: ${source} (値は記録しない)\n- anon source: vanilla/evaluation/anon/case-${caseLetter.toLowerCase()}-${anonLabel}.html\n- note: blind — reviewer does not know variant identity. Verbatim 4 viewpoints below.\n\n---\n\n`;
      const md=header+content+`\n\n---\n\n## 原文の扱い\n\n- 上記4観点はモデルの原文のまま記録（要約しない）。開封後に variant と紐付ける。\n`;
      const outPath=join(outDir, `${outKey}.md`);
      writeFileSync(outPath, md, "utf8");
      const jsonPath=join(outDir, `${outKey}.json`);
      writeFileSync(jsonPath, JSON.stringify({case:`C-${caseLetter}`, anonLabel, model:MODEL, usage, contentLength: content.length, attempt},null,2)+"\n","utf8");
      return {case:`C-${caseLetter}`, anonLabel, outPath, usage, content, attempt};
    }catch(e){
      lastErr=e;
      console.error(`[review] C-${caseLetter} ${anonLabel} attempt ${attempt} failed: ${e.message}`);
      if(attempt<3) await new Promise(r=> setTimeout(r, 2000*(attempt)));
      else throw lastErr;
    }
  }
}

async function main(){
  const {key, source}=loadMetaKey();
  if(!key){ console.error("Meta key not found"); process.exit(2); }
  const pairs=loadPairs();
  console.log(`[setup] Meta key source=${source}, pairs length=${pairs.length}`);
  // Ensure anon exists
  const sealedPath=resolve("loops/loop-016/vanilla/evaluation/anon/mapping-sealed-20261102.json");
  if(!existsSync(sealedPath)){
    console.error("sealed mapping missing");
    process.exit(1);
  }
  const mapping=JSON.parse(readFileSync(sealedPath,"utf8"));

  console.log(`[judge] resuming 18 targets (skip existing)...`);
  const judgeResults=[];
  for(const letter of CASES){
    for(const v of VARIANTS){
      const outPath=resolve(`loops/loop-016/vanilla/evaluation/checks/case-${letter.toLowerCase()}-${v.id}-judge.md`);
      if(existsSync(outPath) && readFileSync(outPath,"utf8").length>500){
        console.log(`[judge] skip C-${letter} ${v.id} (already exists)`);
        // parse verdicts from existing file for summary
        const txt=readFileSync(outPath,"utf8");
        const verdicts={};
        for(const p of ["P1","P2","P3","P4","P5","P6"]){
          const re=new RegExp(`##\\s*${p}[\\s\\S]*?判定:\\s*(ある|ない)`,"i");
          const m=txt.match(re);
          verdicts[p]=m?m[1]:"unknown";
        }
        judgeResults.push({case:`C-${letter}`, variant: v.id, ok:true, verdicts, note:"skipped existing"});
        continue;
      }
      console.log(`[judge] C-${letter} ${v.id} ...`);
      try{
        const r=await judgeOne({caseLetter: letter, variant: v.id, pairs, key, source});
        judgeResults.push({case:`C-${letter}`, variant: v.id, ok:true, verdicts: r.verdicts, usage: r.usage, attempt: r.attempt});
        console.log(`[judge] -> ${v.id} P1=${r.verdicts.P1} P2=${r.verdicts.P2} P3=${r.verdicts.P3} P4=${r.verdicts.P4} P5=${r.verdicts.P5} P6=${r.verdicts.P6}`);
      }catch(e){
        console.error(`[judge] C-${letter} ${v.id} failed after 3 attempts: ${e.message}`);
        judgeResults.push({case:`C-${letter}`, variant: v.id, ok:false, error:String(e.message)});
        const errPath=resolve(`loops/loop-016/vanilla/evaluation/checks/case-${letter.toLowerCase()}-${v.id}-judge.md`);
        writeFileSync(errPath, `# Judge error — C-${letter} ${v.id}\n\nError: ${e.message}\n\n- date: ${new Date().toISOString()}\n`, "utf8");
      }
      await new Promise(r=> setTimeout(r, 1300));
    }
  }
  const judgeSummaryPath=resolve("loops/loop-016/vanilla/evaluation/checks/judge-summary-20261102.json");
  writeFileSync(judgeSummaryPath, JSON.stringify({generatedAt: new Date().toISOString(), tool:"eval-phase-34-resume.mjs judge", note:"same judge, same pairs for all 18. Candidate P1-P6. Skipped existing files.", results: judgeResults},null,2)+"\n","utf8");
  console.log(`[judge] summary -> ${judgeSummaryPath}`);

  console.log(`[review] starting blind reviews 18 targets (X/Y/Z per case, skip existing)...`);
  const reviewResults=[];
  for(const letter of CASES){
    for(const label of ["X","Y","Z"]){
      const outPath=resolve(`loops/loop-016/vanilla/evaluation/checks/case-${letter.toLowerCase()}-${label}-review-blind.md`);
      if(existsSync(outPath) && readFileSync(outPath,"utf8").length>500){
        console.log(`[review] skip C-${letter} ${label} (already exists)`);
        reviewResults.push({case:`C-${letter}`, anonLabel: label, ok:true, note:"skipped existing"});
        continue;
      }
      console.log(`[review] C-${letter} ${label} ...`);
      try{
        const r=await reviewOne({caseLetter: letter, anonLabel: label, key, source});
        reviewResults.push({case:`C-${letter}`, anonLabel: label, ok:true, usage: r.usage, attempt: r.attempt});
        console.log(`[review] -> C-${letter} ${label} ok`);
      }catch(e){
        console.error(`[review] C-${letter} ${label} failed: ${e.message}`);
        reviewResults.push({case:`C-${letter}`, anonLabel: label, ok:false, error:String(e.message)});
        const errPath=resolve(`loops/loop-016/vanilla/evaluation/checks/case-${letter.toLowerCase()}-${label}-review-blind.md`);
        writeFileSync(errPath, `# Review error — C-${letter} ${label}\n\nError: ${e.message}\n\n- date: ${new Date().toISOString()}\n`, "utf8");
      }
      await new Promise(r=> setTimeout(r, 1300));
    }
  }
  const reviewSummaryPath=resolve("loops/loop-016/vanilla/evaluation/checks/review-blind-summary-20261102.json");
  writeFileSync(reviewSummaryPath, JSON.stringify({generatedAt: new Date().toISOString(), tool:"eval-phase-34-resume.mjs review blind", note:"blind X/Y/Z per case, sealed mapping, same persona per case. Skipped existing.", mappingSealed: "vanilla/evaluation/anon/mapping-sealed-20261102.json", results: reviewResults},null,2)+"\n","utf8");
  console.log(`[review] summary -> ${reviewSummaryPath}`);

  const opened={...mapping, openedAt: new Date().toISOString(), noteOpened: "Seal opened after all judge and blind reviews completed. This file records the true mapping for reporting."};
  const openedPath=resolve("loops/loop-016/vanilla/evaluation/anon/mapping-opened-20261102.json");
  writeFileSync(openedPath, JSON.stringify(opened,null,2)+"\n","utf8");
  console.log(`[done] opened mapping -> ${openedPath}`);
  console.log(`[done] judge=${judgeResults.length} review=${reviewResults.length}`);
}

main().catch(e=>{ console.error(String(e?.stack??e)); process.exit(1); });
