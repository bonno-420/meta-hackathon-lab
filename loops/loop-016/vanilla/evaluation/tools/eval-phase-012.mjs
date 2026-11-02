#!/usr/bin/env node
// eval-phase-012.mjs — vanilla blind evaluation deterministic phases 0/1/2
// 0: completeness, 1: fact hallucination, 2: pagecheck adaptation
// No Baseten, no mutation of sources. All outputs under vanilla/evaluation/

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve("loops/loop-016");
const CASES = ["A","B","C","D","E","F"];
const MODELS = ["wonder","spark"]; // vanilla
const GEN005 = "gen-005";

// helper visible text
function stripTagsToText(html){
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<\/?[^>]+>/g, "\n");
  s = s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  s = s.replace(/\r/g, "");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n +/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
function normalizeSentence(s){
  let n=s;
  n=n.replace(/\u00A0|\u200B|\uFEFF/g, " ");
  n=n.replace(/[“”„«»]/g,'"').replace(/[‘’]/g,"'").replace(/[—–−]/g,"-");
  n=n.replace(/[\u3000]/g," ");
  n=n.replace(/\s+/g," ").trim();
  n=n.toLowerCase();
  n=n.replace(/。/g,".").replace(/，/g,",").replace(/：/g,":").replace(/；/g,";").replace(/！/g,"!").replace(/？/g,"?");
  n=n.replace(/\s+([.,!?;:])/g,"$1");
  return n;
}
function splitSentences(text){
  const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const out=[];
  for(const line of lines){
    const parts=line.match(/[^.!?。\n]+[.!?。]?/g);
    if(parts){ for(const p of parts){ const t=p.trim(); if(t) out.push(t);} }
    else if(line) out.push(line);
  }
  return out;
}

// --- Phase 0: completeness ---
function phase0(){
  const rows=[];
  for(const letter of CASES){
    for(const model of MODELS){
      const rel=`vanilla/${model}/case-${letter.toLowerCase()}.html`;
      const abs=resolve(`loops/loop-016/${rel}`);
      const metaRel=`vanilla/${model}/case-${letter.toLowerCase()}.meta.json`;
      const metaAbs=resolve(`loops/loop-016/${metaRel}`);
      const html=readFileSync(abs,"utf8");
      const meta=existsSync(metaAbs)? JSON.parse(readFileSync(metaAbs,"utf8")): null;
      const lower=html.toLowerCase();
      const hasHtmlClose=lower.includes("</html>");
      const hasBodyClose=lower.includes("</body>");
      const hasHeadClose=lower.includes("</head>");
      const last500=html.slice(-800);
      const truncatedMarkers=[
        html.endsWith("person")|| html.includes("const pe") && !hasHtmlClose,
        /const\s+\w+\s*=\s*document\.getElementById/.test(last500) && !hasHtmlClose,
      ].some(Boolean);
      const byteLen=Buffer.byteLength(html,"utf8");
      rows.push({
        case: `C-${letter}`,
        variant: `vanilla-${model}`,
        source: rel,
        byteLen,
        charLen: html.length,
        hasHtmlClose,
        hasBodyClose,
        hasHeadClose,
        finish: meta?.usage ? { prompt: meta.usage.prompt_tokens, completion: meta.usage.completion_tokens, total: meta.usage.total_tokens } : null,
        meta: meta ? { model: meta.model, max_tokens: meta.max_tokens, temperature: meta.temperature, usage: meta.usage } : null,
        verdict: (hasHtmlClose && hasBodyClose) ? "complete" : "truncated",
        note: (letter==="A"||letter==="D"||letter==="F") && model==="wonder" ? "brief noted max_tokens=8,000 cut" : ""
      });
    }
    // gen-005
    const rel=`previews/case-${letter}-gen-005-complete.html`;
    const abs=resolve(`loops/loop-016/${rel}`);
    const html=readFileSync(abs,"utf8");
    const lower=html.toLowerCase();
    rows.push({
      case: `C-${letter}`,
      variant: `pipeline-gen-005`,
      source: rel,
      byteLen: Buffer.byteLength(html,"utf8"),
      charLen: html.length,
      hasHtmlClose: lower.includes("</html>"),
      hasBodyClose: lower.includes("</body>"),
      hasHeadClose: lower.includes("</head>"),
      verdict: (lower.includes("</html>") && lower.includes("</body>")) ? "complete" : "truncated",
      note: "pipeline final gen-005"
    });
  }
  const outPath=resolve("loops/loop-016/vanilla/evaluation/checks/completeness-20261102.json");
  mkdirSync(resolve("loops/loop-016/vanilla/evaluation/checks"),{recursive:true});
  writeFileSync(outPath, JSON.stringify({generatedAt: new Date().toISOString(), tool:"eval-phase-012.mjs phase0 completeness", note:"independent axis, not mixed with quality", rows},null,2)+"\n","utf8");
  console.log(`[phase0] wrote ${outPath} rows=${rows.length}`);
  return rows;
}

// --- Phase 1: fact hallucination ---
function normalizeForMatch(s){ return s.toLowerCase().replace(/\s+/g," ").trim(); }
function extractFactAllowList(facts){
  // build set of normalized fact values and also token fragments
  const values=facts.map(f=> normalizeForMatch(f.value));
  const keys=facts.map(f=> normalizeForMatch(f.key));
  // also build numeric tokens
  const numericTokens=new Set();
  for(const f of facts){
    const v=String(f.value);
    const m=v.match(/\d{4}-\d{2}-\d{2}/g); if(m) m.forEach(x=> numericTokens.add(x));
    const m2=v.match(/\d{1,3}(?:,\d{3})*/g); if(m2) m2.forEach(x=> { numericTokens.add(x); numericTokens.add(x.replace(/,/g,"")); });
    const m3=v.match(/\d{1,2}:\d{2}/g); if(m3) m3.forEach(x=> numericTokens.add(x));
    const m4=v.match(/\d+\s*(?:min|hour|day|week|month|year|person|people|kg)/gi); if(m4) m4.forEach(x=> numericTokens.add(normalizeForMatch(x)));
    // also individual numbers like "10" paid days
    const m5=v.match(/\b\d+\b/g); if(m5) m5.forEach(x=> numericTokens.add(x));
  }
  return { values, keys, numericTokens };
}

function detectInventions(visible, facts, caseId){
  const allow=extractFactAllowList(facts);
  const lowerVisible=normalizeForMatch(visible);
  const hits=[];
  // 1) numeric invention: find JPY amounts and time/number patterns that don't appear in facts
  // JPY patterns: "4,800,000 JPY" etc.
  const jpyRe=/\d{1,3}(?:,\d{3})*\s*(?:JPY|yen)/gi;
  let m;
  while((m=jpyRe.exec(visible))!==null){
    const raw=m[0];
    const norm=normalizeForMatch(raw);
    // check if any fact value contains this numeric token
    const found=allow.values.some(v=> v.includes(normalizeForMatch(raw)) || v.includes(raw.replace(/\s+/g," ").toLowerCase()) || normalizeForMatch(raw).includes(v) );
    // more precise: check numeric part
    const numPart=raw.match(/\d{1,3}(?:,\d{3})*/)?.[0];
    if(numPart){
      const inFacts=facts.some(f=> String(f.value).includes(numPart));
      if(!inFacts){
        hits.push({type:"numeric-JPY", phrase: raw, context: visible.slice(Math.max(0,m.index-30), m.index+ raw.length+30).replace(/\s+/g," ").trim(), note:"JPY amount not in facts"});
      }
    }
  }
  // hourly pay
  const hourlyRe=/Hourly\s*\d{1,3}(?:,\d{3})*\s*JPY/gi;
  while((m=hourlyRe.exec(visible))!==null){
    const raw=m[0];
    const numPart=raw.match(/\d{1,3}(?:,\d{3})*/)?.[0];
    if(numPart){
      const inFacts=facts.some(f=> String(f.value).includes(numPart));
      if(!inFacts) hits.push({type:"numeric-hourly", phrase: raw, context: visible.slice(Math.max(0,m.index-30), m.index+ raw.length+30).replace(/\s+/g," ").trim(), note:"hourly pay not in facts"});
    }
  }
  // monthly pay
  const monthlyRe=/Monthly\s*\d{1,3}(?:,\d{3})*\s*JPY/gi;
  while((m=monthlyRe.exec(visible))!==null){
    const raw=m[0];
    const numPart=raw.match(/\d{1,3}(?:,\d{3})*/)?.[0];
    if(numPart){
      const inFacts=facts.some(f=> String(f.value).includes(numPart));
      if(!inFacts) hits.push({type:"numeric-monthly", phrase: raw, context: visible.slice(Math.max(0,m.index-30), m.index+ raw.length+30).replace(/\s+/g," ").trim(), note:"monthly pay not in facts"});
    }
  }
  // date range invention: look for 2026-12-01 etc
  const dateRe=/\d{4}-\d{2}-\d{2}/g;
  while((m=dateRe.exec(visible))!==null){
    const raw=m[0];
    const inFacts=facts.some(f=> String(f.value).includes(raw));
    if(!inFacts) hits.push({type:"numeric-date", phrase: raw, context: visible.slice(Math.max(0,m.index-30), m.index+ raw.length+30).replace(/\s+/g," ").trim(), note:"date not in facts"});
  }
  // time invention: check for time patterns like 08:00 not in facts
  // We'll extract all HH:MM
  const timeRe=/\b\d{1,2}:\d{2}\b/g;
  while((m=timeRe.exec(visible))!==null){
    const raw=m[0];
    const inFacts=facts.some(f=> String(f.value).includes(raw));
    if(!inFacts){
      // Allow if it's part of allowed range like 10:00-18:30 includes 10:00 and 18:30 already in facts, so those would be inFacts true
      hits.push({type:"numeric-time", phrase: raw, context: visible.slice(Math.max(0,m.index-40), m.index+ raw.length+40).replace(/\s+/g," ").trim(), note:"time not in facts — possible invention"});
    }
  }
  // 2) condition/制度 invention: dictionary of suspicious phrases
  const inventionDict=[
    {phrase:"bonus", note:"compensation bonus not in facts"},
    {phrase:"overtime", note:"overtime not in facts unless workHours mentions"},
    {phrase:"stock option", note:"equity not in facts"},
    {phrase:"equity", note:"equity not in facts"},
    {phrase:"retirement", note:"retirement not in facts"},
    {phrase:"pension", note:"pension not in facts beyond stated benefits"},
    {phrase:"remote work", note:"remote work claim"},
    {phrase:"work from home", note:"remote claim"},
    {phrase:"fully remote", note:"remote claim"},
    {phrase:"flexible working", note:"flex claim if not in workHours"},
    {phrase:"free lunch", note:"meal benefit not in facts"},
    {phrase:"meal allowance", note:"meal benefit not in facts"},
    {phrase:"gym", note:"gym/wellness not in facts"},
    {phrase:"wellness program", note:"wellness not in facts"},
    {phrase:"childcare service", note:"childcare beyond facts"},
    {phrase:"daycare", note:"childcare not in facts"},
    {phrase:"insurance", note:"insurance handling — check against benefits"}, // special handling
    {phrase:"paid leave", note:"paid days phrasing"},
    {phrase:"unlimited PTO", note:"unlimited PTO not in facts"},
    {phrase:"promotion", note:"promotion path not in facts"},
    {phrase:"career path", note:"career path not in facts"},
    {phrase:"guaranteed", note:"guarantee language"},
    {phrase:"direct hire", note:"dispatched direct-hire implication"},
  ];
  for(const entry of inventionDict){
    const lowPhrase=entry.phrase.toLowerCase();
    // skip if facts already contain this phrase (e.g., C-B L10 childcare support desk is allowed)
    const factsContain=allow.values.some(v=> v.includes(lowPhrase));
    if(factsContain) continue;
    // special handling for insurance: every case has Health insurance, so insurance alone is not invention
    if(lowPhrase==="insurance"){
      // only flag if phrase like "life insurance" or "dental insurance" beyond health
      continue;
    }
    let idx=0;
    const lowVis=visible.toLowerCase();
    while((idx=lowVis.indexOf(lowPhrase, idx))!==-1){
      const ctx=visible.slice(Math.max(0,idx-40), idx+ entry.phrase.length+40).replace(/\s+/g," ").trim();
      hits.push({type:"condition", phrase: entry.phrase, context: ctx, note: entry.note, pos: idx});
      idx+=lowPhrase.length;
    }
  }
  // 3) also check for invented numbers like "15 kg" handling: if facts have 15 kg, then "15 kg" is allowed; else invented
  // We'll catch via timeRe etc. but also check "kg" contexts
  // Deduplicate hits by phrase+context
  const uniq=[];
  const seen=new Set();
  for(const h of hits){
    const key=h.type+":"+h.phrase+":"+h.context.slice(0,50);
    if(!seen.has(key)){ seen.add(key); uniq.push(h); }
  }
  // Filter out false positives for time: times that are inside allowed ranges but not exact match e.g., "11:00" is part of "11:00-16:00" flex core, facts would contain "11:00" via that string — we already check inFacts true via includes, so those wouldn't be flagged. Good.
  // But for "08:00-11:00" case E has that exact string in workHours facts, so those times would be inFacts true.

  // Count logic: numeric hits are high signal, condition hits need manual review.
  // We separate into confirmed invention vs possible.
  // For numeric-JPY/hourly/monthly/date/time: if not in facts, it's invention.
  // For condition: count as invention if present.

  return uniq;
}

function phase1(){
  const rows=[];
  for(const letter of CASES){
    const casePath=resolve(`loops/loop-016/cases/case-${letter}.json`);
    const caseData=JSON.parse(readFileSync(casePath,"utf8").replace(/^\uFEFF/,""));
    const variants=[
      {variant:`vanilla-wonder`, rel:`vanilla/wonder/case-${letter.toLowerCase()}.html`},
      {variant:`vanilla-spark`, rel:`vanilla/spark/case-${letter.toLowerCase()}.html`},
      {variant:`pipeline-gen-005`, rel:`previews/case-${letter}-gen-005-complete.html`},
    ];
    for(const v of variants){
      const abs=resolve(`loops/loop-016/${v.rel}`);
      const html=readFileSync(abs,"utf8");
      const visible=stripTagsToText(html);
      const inventions=detectInventions(visible, caseData.facts, `C-${letter}`);
      rows.push({
        case: `C-${letter}`,
        variant: v.variant,
        source: v.rel,
        facts: caseData.facts.map(f=> ({key:f.key, value:f.value, sourceLine:f.sourceLine})),
        inventionCount: inventions.length,
        inventions,
        visibleLength: visible.length,
        verdict: inventions.length===0 ? "clean — no invented numeric/condition found" : `found ${inventions.length} possible invented items (requires manual review)`,
      });
    }
  }
  const outPath=resolve("loops/loop-016/vanilla/evaluation/checks/fact-check-20261102.json");
  mkdirSync(resolve("loops/loop-016/vanilla/evaluation/checks"),{recursive:true});
  writeFileSync(outPath, JSON.stringify({generatedAt: new Date().toISOString(), tool:"eval-phase-012.mjs phase1 fact hallucination", note:"facts fixed L01-L10 per cases/*.json; counts invented numbers/conditions not in facts. Numeric hits are deterministic; condition hits are keyword-based and need manual review for false positives (e.g., 'insurance' handled separately).", rows},null,2)+"\n","utf8");
  console.log(`[phase1] wrote ${outPath} rows=${rows.length}`);
  return rows;
}

// --- Phase 2: pagecheck adaptation ---
// Reuse logic from loop16-pagecheck.mjs with same dicts, but handle missing sections gracefully
import { existsSync as existsSync2 } from "node:fs"; // already imported

function loadDicts(){
  const dictPath=resolve("loops/loop-016/tools/dicts/verification-phrases.json");
  const recordPath=resolve("loops/loop-016/tools/dicts/record-labels.json");
  const headingPath=resolve("loops/loop-016/tools/dicts/heading-scope.json");
  let vdict=null, rdict=null, hdict=null;
  try{ vdict=JSON.parse(readFileSync(dictPath,"utf8")); }catch{}
  try{ rdict=JSON.parse(readFileSync(recordPath,"utf8")); }catch{}
  try{ hdict=JSON.parse(readFileSync(headingPath,"utf8")); }catch{}
  // fallback defaults
  if(!vdict) vdict=[
    { phrase: "What this means", lang: "EN", source: "C-A real: highlight box" },
    { phrase: "numbers stay exactly as stated", lang: "EN", source: "C-A real" },
    { phrase: "as stated in the FACT", lang: "EN", source: "C-A real" },
    { phrase: "Read the sentences above as the full conditions", lang: "EN", source: "C-A real" },
    { phrase: "No rounding or reinterpretation", lang: "EN", source: "C-A real" },
    { phrase: "All facts below are the only stated facts", lang: "EN", source: "C-A real: must block" },
    { phrase: "Do not invent", lang: "EN", source: "case-A plan.mustNot via page" },
    { phrase: "Do not promise remote work", lang: "EN", source: "case-A plan.mustNot" },
    { phrase: "Each cites its fact keys and source lines verbatim", lang: "EN", source: "C-A about section lead" },
  ];
  if(!rdict) rdict=[
    { pattern: "factKeys" }, { pattern: "sourceLines" }, { pattern: "SourceLines" }, { pattern: "fact keys" }, { pattern: "Target audience" }, { pattern: "Persona:" }, { pattern: "Persona" }, { pattern: "Insights applied" }, { pattern: "Insights" }, { pattern: "Appeal:" }, { pattern: "mustNot" }, { pattern: "CTA:" }, { pattern: "factKeys / sourceLines" }, { pattern: "〔" }, { pattern: "〕" }, { pattern: "L01" },
  ];
  if(!hdict) hdict=[
    { headingPattern: "Pay & Hours", lang: "EN", allowedKeys: ["salary","pay","workHours","employmentType","employment","wage","annual","hourly","workhours","hours","pay","term","contract","hours"], description: "Pay & Hours scope" },
    { headingPattern: "Pay", lang: "EN", allowedKeys: ["salary","pay","workHours","employmentType","wage","annual","hourly"] },
    { headingPattern: "Place & Access", lang: "EN", allowedKeys: ["location","commute","place","access","station","address"] },
    { headingPattern: "勤務地", lang: "JA", allowedKeys: ["location","commute","workLocation","transport"] },
    { headingPattern: "給与", lang: "JA", allowedKeys: ["salary","pay","salaryHourly","workHours","pay"] },
    { headingPattern: "The Basics", lang: "EN", allowedKeys: [] },
    { headingPattern: "Check Before", lang: "EN", allowedKeys: [] },
  ];
  return { vdict, rdict, hdict };
}

const HERO_P6_CONFIG = {
  A: { patterns: [/4,?800,?000/i, /Annual/i], factKeys: ["salary"], label: "Annual 4,800,000 JPY" },
  B: { patterns: [/08:30-17:00/i, /Day shift/i], factKeys: ["workHours"], label: "Day shift 08:30-17:00" },
  C: { patterns: [/12 months/i, /Contract/i], factKeys: ["employmentType"], label: "Contract 12 months" },
  D: { patterns: [/Apex Work Partners/i, /Saitama/i], factKeys: ["employer", "worksite"], label: "Apex Work Partners + Saitama Kawaguchi" },
  E: { patterns: [/3 hours/i, /08:00-11:00/i, /Futako-Tamagawa/i], factKeys: ["workHours", "commute"], label: "From 3 hours + Futako-Tamagawa" },
  F: { patterns: [/2026-12-01/i, /6 weeks/i], factKeys: ["term"], label: "6 weeks: 2026-12-01 to 2027-01-11" },
};

function extractSections(html){
  const sections=[];
  const heroMatch=html.match(/<header[\s\S]*?class="hero"[\s\S]*?<\/header>/i);
  if(heroMatch){
    const h1=(heroMatch[0].match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g," ").trim();
    sections.push({ id:"header", heading: h1||"Header", rawHtml: heroMatch[0], index:0 });
  }
  const re=/<section[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  let m;
  while((m=re.exec(html))!==null){
    const id=m[1];
    const inner=m[2];
    const h2Raw=inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "";
    const heading=h2Raw.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    sections.push({ id, heading: heading||id, rawHtml: m[0], inner, index:m.index });
  }
  const allSecRe=/<section[^>]*>([\s\S]*?)<\/section>/gi;
  let m2;
  while((m2=allSecRe.exec(html))!==null){
    const full=m2[0];
    const hasId=/id="/.test(full);
    if(hasId) continue;
    const h2Raw=full.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "";
    const heading=h2Raw.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    sections.push({ id:"section-no-id", heading: heading||"memo", rawHtml: full, inner:m2[1], index:m2.index });
  }
  // If still empty, treat entire body as one section for vanilla pages without sections
  if(sections.length===0){
    const body=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
    sections.push({ id:"body", heading:"Body (no sections detected — vanilla structure)", rawHtml: body, index:0 });
  }
  // For vanilla, also try to capture <header> without hero class, and <main> sections
  // Add main content as fallback
  // Deduplicate by id
  return sections;
}

function collectDuplication(html, sections){
  const map=new Map();
  for(const sec of sections){
    const text=stripTagsToText(sec.rawHtml);
    const sentences=splitSentences(text);
    for(const raw of sentences){
      const norm=normalizeSentence(raw);
      if(norm.length<10) continue;
      if(!map.has(norm)) map.set(norm,{ example: raw.slice(0,400), normalized: norm, count:0, occurrences:[] });
      const e=map.get(norm);
      e.count++;
      e.occurrences.push({ sectionId: sec.id, heading: sec.heading, snippet: raw.slice(0,200) });
    }
  }
  const groups=[];
  for(const [norm,v] of map.entries()) if(v.count>=2) groups.push(v);
  groups.sort((a,b)=> b.count-b.count || b.normalized.length - b.normalized.length);
  return groups;
}
function detectVerification(html, sections, dict){
  const hits=[];
  for(const entry of dict){
    const phrase=entry.phrase;
    const lowPhrase=phrase.toLowerCase();
    let count=0;
    const perHit=[];
    for(const sec of sections){
      const visible=stripTagsToText(sec.rawHtml);
      const lowVis=visible.toLowerCase();
      let idx=0;
      while((idx=lowVis.indexOf(lowPhrase, idx))!==-1){
        count++;
        const start=Math.max(0, idx-30);
        const ctx=visible.slice(start, idx+ phrase.length+30).replace(/\s+/g," ").trim().slice(0,200);
        perHit.push({ sectionId: sec.id, heading: sec.heading, context: ctx, phrase });
        idx+=lowPhrase.length;
      }
    }
    if(count>0) hits.push({ phrase, lang: entry.lang, source: entry.source||"", note: entry.note||"", count, hits: perHit });
  }
  return hits;
}
function detectRecordExposure(html, sections, labels){
  const hits=[];
  for(const entry of labels){
    const pat=entry.pattern;
    let count=0;
    const perHit=[];
    for(const sec of sections){
      const visible=stripTagsToText(sec.rawHtml);
      if(visible.includes(pat)){
        const re=new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g");
        const m=visible.match(re);
        const c=m?m.length:1;
        count+=c;
        const idx=visible.indexOf(pat);
        const ctx=visible.slice(Math.max(0, idx-30), idx+ pat.length+30).replace(/\s+/g," ").trim().slice(0,240);
        perHit.push({ sectionId: sec.id, heading: sec.heading, context: ctx, pattern: pat });
      }
    }
    if(count>0) hits.push({ pattern: pat, note: entry.note||"", count, hits: perHit });
  }
  return hits;
}
function extractFactKeysFromSection(sec){
  const cites=[];
  const re=/〔([^〕]+)〕/g;
  let m;
  while((m=re.exec(sec.rawHtml))!==null){
    const inside=m[1];
    const beforeSlash=inside.split("/")[0].trim();
    const keys=beforeSlash.split(",").map(k=>k.trim()).filter(Boolean);
    cites.push(...keys);
  }
  return [...new Set(cites)];
}
function detectHeadingMismatch(sections, scopeRules){
  const out=[];
  const all=[];
  for(const sec of sections){
    const foundKeys=extractFactKeysFromSection(sec);
    all.push({ id: sec.id, heading: sec.heading, foundKeys });
    let rule=null;
    for(const r of scopeRules){
      if(sec.heading.toLowerCase().includes(r.headingPattern.toLowerCase())){ rule=r; break; }
    }
    if(!rule) continue;
    if(rule.allowedKeys.length===0) continue;
    const allowed=new Set(rule.allowedKeys.map(k=>k.toLowerCase()));
    const unexpected=foundKeys.filter(k=> !allowed.has(k.toLowerCase()) && !allowed.has(k));
    if(unexpected.length>0) out.push({ sectionId: sec.id, heading: sec.heading, foundKeys, allowedKeys: rule.allowedKeys, unexpectedKeys: unexpected, rule: rule.headingPattern, description: rule.description||"" });
  }
  return { mismatches: out, allSections: all };
}
function detectHeroP6(html, sections, caseId){
  const cfg=HERO_P6_CONFIG[caseId];
  if(!cfg) return { case:`C-${caseId}`, present:false, heroText:"", checks:[], missing:[], label:"", note:"candidate — permanence requires owner approval", applicability:"config missing"};
  let heroTextRaw="";
  let heroHtml="";
  const heroMatch=html.match(/<header[^>]*class="hero"[^>]*>([\s\S]*?)<\/header>/i);
  if(heroMatch){ heroHtml=heroMatch[0]; heroTextRaw=stripTagsToText(heroHtml).replace(/\s+/g," ").trim(); }
  else {
    const hdr=sections.find(s=> s.id==="header");
    if(hdr){ heroHtml=hdr.rawHtml; heroTextRaw=stripTagsToText(hdr.rawHtml).replace(/\s+/g," ").trim(); }
    else {
      // fallback: first 500 chars of visible
      heroTextRaw=stripTagsToText(html).slice(0,600).replace(/\s+/g," ").trim();
    }
  }
  let heroTextForCheck=heroTextRaw;
  let heroSubText="";
  const heroSubMatch=html.match(/<[^>]*class="[^"]*(?:hero-sub|hero__sub|hero_sub)[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/i);
  if(heroSubMatch){ heroSubText=stripTagsToText(heroSubMatch[0]).replace(/\s+/g," ").trim(); heroTextForCheck=heroTextRaw+" "+heroSubText; }
  const checks=[];
  const missing=[];
  for(const pat of cfg.patterns){
    const found=pat.test(heroTextForCheck);
    if(pat.global) pat.lastIndex=0;
    let context="";
    if(found){
      const idx=heroTextForCheck.search(pat);
      if(idx!==-1){ context=heroTextForCheck.slice(Math.max(0,idx-30), Math.min(heroTextForCheck.length, idx+50)).replace(/\s+/g," ").trim().slice(0,120); }
    } else missing.push(pat.toString());
    checks.push({ pattern: pat.toString(), found, context });
    if(pat.global) pat.lastIndex=0;
  }
  let present=false;
  if(caseId==="E"){
    const workHoursFound=checks[0]?.found || checks[1]?.found;
    const commuteFound=checks[2]?.found || false;
    present=!!(workHoursFound && commuteFound);
  } else {
    present=checks.some(c=>c.found);
  }
  const vanillaHint = heroMatch ? "hero tag found" : "no hero tag — used fallback (vanilla structure may differ)";
  return { case:`C-${caseId}`, present, heroText: heroTextRaw.slice(0,400), checks, missing, label: cfg.label, note:"candidate — permanence requires owner approval", applicability: vanillaHint };
}

function phase2(){
  const { vdict, rdict, hdict }=loadDicts();
  const rows=[];
  const sources=[];
  for(const letter of CASES){
    // vanilla wonder/spark
    for(const model of MODELS){
      sources.push({variant:`vanilla-${model}`, case:letter, rel:`vanilla/${model}/case-${letter.toLowerCase()}.html`, outKey:`case-${letter.toLowerCase()}-vanilla-${model}-pagecheck`});
    }
    sources.push({variant:`pipeline-gen-005`, case:letter, rel:`previews/case-${letter}-gen-005-complete.html`, outKey:`case-${letter.toLowerCase()}-gen-005-pagecheck`});
  }
  for(const src of sources){
    const abs=resolve(`loops/loop-016/${src.rel}`);
    if(!existsSync(abs)){ console.error(`[pagecheck] skip ${src.variant} ${src.case}: not found ${src.rel}`); continue; }
    const html=readFileSync(abs,"utf8");
    const sections=extractSections(html);
    const duplication=collectDuplication(html, sections);
    const verification=detectVerification(html, sections, vdict);
    const recordExposure=detectRecordExposure(html, sections, rdict);
    const heading=detectHeadingMismatch(sections, hdict);
    const heroP6=detectHeroP6(html, sections, src.case);
    const applicabilityNotes=[];
    if(sections.length===1 && sections[0].id==="body") applicabilityNotes.push("vanilla HTML has no <section id> — duplication/heading checks are fallback single-section; heading mismatch not applicable");
    // for vanilla, heading mismatch will likely be 0 because no 〔〕 citations
    const summary={
      duplicates: duplication.length,
      duplicateSentencesTotalOccurrences: duplication.reduce((s,g)=>s+g.count,0),
      verificationHits: verification.reduce((s,h)=>s+h.count,0),
      verificationGroups: verification.length,
      recordExposureGroups: recordExposure.length,
      recordExposureHits: recordExposure.reduce((s,h)=>s+h.count,0),
      headingMismatch: heading.mismatches.length,
      heroP6Present: heroP6.present?1:0,
      heroP6Missing: heroP6.missing.length,
      applicabilityNotes,
    };
    const jsonOut={
      case:`C-${src.case}`,
      variant: src.variant,
      gen: src.variant==="pipeline-gen-005" ? "005" : `vanilla-${src.variant.split("-")[1]}`,
      source: src.rel,
      generatedAt: new Date().toISOString(),
      tool:"eval-phase-012.mjs phase2 pagecheck adapted",
      version:"1.1-candidate (T1-T5+P6) adapted for vanilla",
      note:"Candidate rules — permanence requires user approval. Layer1 deterministic, no API. For vanilla HTML with different structure, missing checks are marked applicable=false and not forced.",
      dictVersions:{ verification: vdict.length, recordLabels: rdict.length, headingScope: hdict.length, heroP6: Object.keys(HERO_P6_CONFIG).length },
      summary,
      applicability: {
        sectionsDetected: sections.length,
        hasHeroTag: !!html.match(/<header[^>]*class="hero"/i),
        hasSections: sections.some(s=> s.id!=="body" && s.id!=="header"),
        headingCheckApplicable: heading.allSections.some(s=> s.foundKeys.length>0),
        note: applicabilityNotes.join("; ") || "standard"
      },
      duplication,
      verificationPhrases: verification,
      recordExposure,
      headingMismatch: heading.mismatches,
      allSections: heading.allSections,
      heroP6: { present: heroP6.present, heroText: heroP6.heroText, checks: heroP6.checks, missing: heroP6.missing, label: heroP6.label, applicability: heroP6.applicability },
    };
    const outJson=resolve(`loops/loop-016/vanilla/evaluation/checks/${src.outKey}.json`);
    const outMd=resolve(`loops/loop-016/vanilla/evaluation/checks/${src.outKey}.md`);
    mkdirSync(resolve("loops/loop-016/vanilla/evaluation/checks"),{recursive:true});
    writeFileSync(outJson, JSON.stringify(jsonOut,null,2)+"\n","utf8");
    // markdown
    let md=`# Page check (Layer 1 adapted) — C-${src.case} ${src.variant}\n\n`;
    md+=`- source: \`${src.rel}\`\n`;
    md+=`- tool: \`eval-phase-012.mjs phase2\` v1.1-candidate adapted (deterministic, no API)\n`;
    md+=`- date: ${jsonOut.generatedAt}\n`;
    md+=`- dict: verification ${vdict.length} / recordLabels ${rdict.length} / headingScope ${hdict.length} / heroP6 ${Object.keys(HERO_P6_CONFIG).length} (candidate)\n`;
    md+=`- applicability: sections=${sections.length}, hasHero=${jsonOut.applicability.hasHeroTag}, headingApplicable=${jsonOut.applicability.headingCheckApplicable}\n\n`;
    md+=`## Summary\n\n`;
    md+=`| metric | value |\n|---|---|\n`;
    md+=`| duplicate groups (≥2) | ${summary.duplicates} |\n`;
    md+=`| duplicate occurrences total | ${summary.duplicateSentencesTotalOccurrences} |\n`;
    md+=`| verification phrase groups | ${summary.verificationGroups} |\n`;
    md+=`| verification hits total | ${summary.verificationHits} |\n`;
    md+=`| record-exposure groups | ${summary.recordExposureGroups} |\n`;
    md+=`| record-exposure hits | ${summary.recordExposureHits} |\n`;
    md+=`| heading mismatch sections | ${summary.headingMismatch} |\n`;
    md+=`| hero P6 present | ${summary.heroP6Present} |\n`;
    md+=`| hero P6 missing patterns | ${summary.heroP6Missing} |\n\n`;
    if(summary.applicabilityNotes.length>0) md+=`> applicability note: ${summary.applicabilityNotes.join("; ")}\n\n`;
    md+=`## 1) 重複文 (normalized, count≥2)\n\n`;
    if(duplication.length===0) md+=`(none)\n\n`;
    else {
      for(let i=0;i<Math.min(duplication.length,20);i++){
        const g=duplication[i];
        md+=`### [${i+1}] count=${g.count} — \`${g.normalized.slice(0,120)}\`\n\n`;
        md+=`- example: ${g.example}\n`;
        md+=`- occurrences:\n`;
        for(const o of g.occurrences) md+=`  - \`${o.sectionId}\` / "${o.heading}" — ${o.snippet}\n`;
        md+=`\n`;
      }
      if(duplication.length>20) md+=`_(… and ${duplication.length-20} more groups in JSON)_\n\n`;
    }
    md+=`## 2) 検証側定型文の辞書ヒット\n\n`;
    if(verification.length===0) md+=`(none)\n\n`;
    else { for(const h of verification){ md+=`- **"${h.phrase}"** (${h.lang}, ${h.source}) — ${h.count} hit(s)\n`; for(const hh of h.hits) md+=`  - \`${hh.sectionId}\` / "${hh.heading}" — …${hh.context}…\n`; } md+=`\n`; }
    md+=`## 3) 記録物ラベルの露出\n\n`;
    if(recordExposure.length===0) md+=`(none)\n\n`;
    else { for(const h of recordExposure){ md+=`- **"${h.pattern}"** — ${h.count} hit(s)\n`; for(const hh of h.hits) md+=`  - \`${hh.sectionId}\` / "${hh.heading}" — …${hh.context}…\n`; } md+=`\n`; }
    md+=`## 4) 見出しと中身のずれ\n\n`;
    md+=`All sections factKeys table:\n\n`;
    md+=`| sectionId | heading | foundKeys |\n|---|---|---|\n`;
    for(const s of heading.allSections) md+=`| \`${s.id}\` | ${s.heading.replace(/\|/g,"/")} | ${s.foundKeys.join(", ") || "(none)"} |\n`;
    md+=`\n`;
    if(heading.mismatches.length===0) md+=`(no mismatch under current scope rules — for vanilla this is often "applicability false" because no 〔〕 citations)\n\n`;
    else { md+=`**Warnings (candidate):**\n\n`; for(const mm of heading.mismatches){ md+=`- \`${mm.sectionId}\` "${mm.heading}" — allowed: ${mm.allowedKeys.join(", ")} — **unexpected: ${mm.unexpectedKeys.join(", ")}** — found: ${mm.foundKeys.join(", ")}\n`; } md+=`\n`; }
    md+=`## 5) Hero P6 — first-check item in hero (candidate)\n\n`;
    md+=`- case: C-${src.case} — expected label: **${heroP6.label}**\n`;
    md+=`- verdict: ${heroP6.present ? "**PRESENT**" : "**MISSING**"}${heroP6.applicability ? ` — ${heroP6.applicability}` : ""}\n`;
    md+=`- hero text excerpt (400 chars):\n\n  > ${heroP6.heroText ? heroP6.heroText.replace(/\n/g," ").slice(0,400) : '(empty)'}\n\n`;
    md+=`- checks:\n`;
    for(const ch of heroP6.checks) md+=`  - pattern \`${ch.pattern}\` — ${ch.found ? "FOUND" : "NOT FOUND"}${ch.context ? ` — …${ch.context}…` : ""}\n`;
    if(heroP6.missing.length>0) md+=`- missing patterns: ${heroP6.missing.join(", ")}\n`; else md+=`- missing: (none)\n`;
    md+=`\n---\n\n*Candidate — permanence requires owner approval.*\n`;
    writeFileSync(outMd, md, "utf8");
    rows.push({ case:`C-${src.case}`, variant: src.variant, source: src.rel, summary, applicability: jsonOut.applicability });
    console.log(`[phase2] ${src.variant} C-${src.case} -> ${src.outKey} dupGroups=${summary.duplicates} verifyHits=${summary.verificationHits} recordHits=${summary.recordExposureHits} headingMis=${summary.headingMismatch} heroP6=${summary.heroP6Present}`);
  }
  return rows;
}

async function main(){
  const rows0=phase0();
  const rows1=phase1();
  const rows2=phase2();
  console.log(`[done] phase0=${rows0.length} phase1=${rows1.length} phase2=${rows2.length}`);
}
main().catch(e=>{ console.error(String(e?.stack??e)); process.exit(1); });
