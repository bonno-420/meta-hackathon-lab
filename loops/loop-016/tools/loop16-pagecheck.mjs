#!/usr/bin/env node
// P6 hero check added 2026-11-02 gen-003 candidate
// loop16-pagecheck.mjs — 第1層 ルールベース検知（APIなし・決定的）
// 入力: loops/loop-016/previews/case-*-gen-*-complete.html
// 出力: loops/loop-016/checks/case-*-gen-*-pagecheck.json/.md
// 検知: 1)重複文 2)検証側定型文辞書 3)記録物露出 4)見出しと中身のずれ 5)Hero P6 first-check (candidate)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

// --- 辞書（候補） ---
// EN verification phrases: 初期は実例から。拡張は候補として追加し恒常化は本人承認を経る
const DEFAULT_VERIFICATION_DICT = [
  { phrase: "What this means", lang: "EN", source: "C-A real: highlight box", note: "付属文に残存する検証側定型" },
  { phrase: "numbers stay exactly as stated", lang: "EN", source: "C-A real", note: "" },
  { phrase: "as stated in the FACT", lang: "EN", source: "C-A real", note: "" },
  { phrase: "Read the sentences above as the full conditions", lang: "EN", source: "C-A real", note: "" },
  { phrase: "No rounding or reinterpretation", lang: "EN", source: "C-A real", note: "" },
  { phrase: "All facts below are the only stated facts", lang: "EN", source: "C-A real: must block", note: "mustブロックの検証文言" },
  { phrase: "Do not invent", lang: "EN", source: "case-A plan.mustNot via page", note: "mustNotの露出" },
  { phrase: "Do not promise remote work", lang: "EN", source: "case-A plan.mustNot", note: "" },
  { phrase: "Each cites its fact keys and source lines verbatim", lang: "EN", source: "C-A about section lead", note: "引用ラベルの説明文自体が露出" },
];

const DEFAULT_RECORD_LABELS = [
  { pattern: "factKeys", note: "内部ラベル" },
  { pattern: "sourceLines", note: "" },
  { pattern: "SourceLines", note: "" },
  { pattern: "fact keys", note: "小文字変種" },
  { pattern: "Target audience", note: "企画メモ露出" },
  { pattern: "Persona:", note: "" },
  { pattern: "Persona", note: "" },
  { pattern: "Insights applied", note: "" },
  { pattern: "Insights", note: "" },
  { pattern: "Appeal:", note: "" },
  { pattern: "mustNot", note: "" },
  { pattern: "CTA:", note: "" },
  { pattern: "factKeys / sourceLines", note: "" },
  { pattern: "〔", note: "引用記号自体（企画では出さない）" },
  { pattern: "〕", note: "" },
  { pattern: "L01", note: "sourceLineコード露出（本文中）" },
];

// 見出しスコープ: headingに含まれるキーワード -> 許容factKeys（空なら全許可）
const DEFAULT_HEADING_SCOPE = [
  { headingPattern: "Pay & Hours", lang: "EN", allowedKeys: ["salary","pay","workHours","employmentType","employment","wage","annual","hourly","workhours","hours","pay","term","contract","hours"], description: "Pay & Hoursは給与・勤務時間・雇用形態に限定。team/training/benefits等は範囲外" },
  { headingPattern: "Pay", lang: "EN", allowedKeys: ["salary","pay","workHours","employmentType","wage","annual","hourly"] },
  { headingPattern: "Place & Access", lang: "EN", allowedKeys: ["location","commute","place","access","station","address"] },
  { headingPattern: "勤務地", lang: "JA", allowedKeys: ["location","commute","workLocation","transport"] },
  { headingPattern: "給与", lang: "JA", allowedKeys: ["salary","pay","salaryHourly","workHours","pay"] },
  { headingPattern: "The Basics", lang: "EN", allowedKeys: [] },
  { headingPattern: "Check Before", lang: "EN", allowedKeys: [] },
];

// --- P6 Hero first-check (candidate) ---
// HERO_FIRST_CHECK per case (facts-based, verbatim fact values to look for in hero)
const HERO_P6_CONFIG = {
  A: { patterns: [/4,?800,?000/i, /Annual/i], factKeys: ["salary"], label: "Annual 4,800,000 JPY" },
  B: { patterns: [/08:30-17:00/i, /Day shift/i], factKeys: ["workHours"], label: "Day shift 08:30-17:00" },
  C: { patterns: [/12 months/i, /Contract/i], factKeys: ["employmentType"], label: "Contract 12 months" },
  D: { patterns: [/Apex Work Partners/i, /Saitama/i], factKeys: ["employer", "worksite"], label: "Apex Work Partners + Saitama Kawaguchi" },
  E: { patterns: [/3 hours/i, /08:00-11:00/i, /Futako-Tamagawa/i], factKeys: ["workHours", "commute"], label: "From 3 hours + Futako-Tamagawa" },
  F: { patterns: [/2026-12-01/i, /6 weeks/i], factKeys: ["term"], label: "6 weeks: 2026-12-01 to 2027-01-11" },
};

function loadDict() {
  const dictPath = resolve("loops/loop-016/tools/dicts/verification-phrases.json");
  if (existsSync(dictPath)) {
    try { return JSON.parse(readFileSync(dictPath, "utf8")); } catch {}
  }
  return DEFAULT_VERIFICATION_DICT;
}
function loadRecordLabels() {
  const p = resolve("loops/loop-016/tools/dicts/record-labels.json");
  if (existsSync(p)) { try { return JSON.parse(readFileSync(p, "utf8")); } catch {} }
  return DEFAULT_RECORD_LABELS;
}
function loadHeadingScope() {
  const p = resolve("loops/loop-016/tools/dicts/heading-scope.json");
  if (existsSync(p)) { try { return JSON.parse(readFileSync(p, "utf8")); } catch {} }
  return DEFAULT_HEADING_SCOPE;
}

function stripTagsToText(html) {
  // remove script/style
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  // replace tags with newline to preserve block boundaries
  s = s.replace(/<\/?[^>]+>/g, "\n");
  // decode entities
  s = s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  // collapse excessive newlines but keep them for sentence split
  s = s.replace(/\r/g, "");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n +/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s;
}

function extractSections(html) {
  const sections = [];
  // header hero-card as pseudo section
  const heroMatch = html.match(/<header[\s\S]*?class="hero"[\s\S]*?<\/header>/i);
  if (heroMatch) {
    const h1 = (heroMatch[0].match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, " ").trim();
    sections.push({ id: "header", heading: h1 || "Header", rawHtml: heroMatch[0], index: 0 });
  }
  const re = /<section[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const inner = m[2];
    const h2Raw = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "";
    const heading = h2Raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    sections.push({ id, heading: heading || id, rawHtml: m[0], inner, index: m.index });
  }
  // also capture sections without id (memo etc.)
  const allSecRe = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  // already covered id ones; check for missing (lp-memo)
  let m2;
  while ((m2 = allSecRe.exec(html)) !== null) {
    const full = m2[0];
    const hasId = /id="/.test(full);
    if (hasId) continue;
    const h2Raw = full.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "";
    const heading = h2Raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    sections.push({ id: "section-no-id", heading: heading || "memo", rawHtml: full, inner: m2[1], index: m2.index });
  }
  return sections;
}

function normalizeSentence(s) {
  let n = s;
  n = n.replace(/\u00A0|\u200B|\uFEFF/g, " ");
  n = n.replace(/[“”„«»]/g, '"').replace(/[‘’]/g, "'").replace(/[—–−]/g, "-");
  n = n.replace(/[\u3000]/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  n = n.toLowerCase();
  // normalize punctuation: unify fullwidth
  n = n.replace(/。/g, ".").replace(/，/g, ",").replace(/：/g, ":").replace(/；/g, ";").replace(/！/g, "!").replace(/？/g, "?");
  n = n.replace(/\s+([.,!?;:])/g, "$1");
  return n;
}

function splitSentences(text) {
  // split by sentence terminators and newlines; keep fragments
  // First split by newlines that likely separate list items
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    // split line into sentences by .!?。 boundaries
    const parts = line.match(/[^.!?。\n]+[.!?。]?/g);
    if (parts) {
      for (const p of parts) {
        const t = p.trim();
        if (t) out.push(t);
      }
    } else if (line) out.push(line);
  }
  return out;
}

function collectDuplication(html, sections) {
  // For each section, get its visible text and split
  const map = new Map(); // normalized -> { example, count, occurrences: [] }
  for (const sec of sections) {
    const text = stripTagsToText(sec.rawHtml);
    const sentences = splitSentences(text);
    for (const raw of sentences) {
      const norm = normalizeSentence(raw);
      if (norm.length < 10) continue; // skip tiny
      // skip citations like "company,role,location / l01,l02,l03" alone — but keep them as they may duplicate; length filter will keep
      if (!map.has(norm)) map.set(norm, { example: raw.slice(0, 400), normalized: norm, count: 0, occurrences: [] });
      const e = map.get(norm);
      e.count++;
      // trim snippet for location
      e.occurrences.push({ sectionId: sec.id, heading: sec.heading, snippet: raw.slice(0, 200) });
    }
  }
  // also check cross-section raw text duplicates without section split (already covered)
  const groups = [];
  for (const [norm, v] of map.entries()) {
    if (v.count >= 2) groups.push(v);
  }
  groups.sort((a,b) => b.count - a.count || b.normalized.length - a.normalized.length);
  return groups;
}

function detectVerification(html, sections, dict) {
  const hits = [];
  const lowerHtml = html.toLowerCase(); // raw html lower for search
  // We search in visible text per section for better location
  for (const entry of dict) {
    const phrase = entry.phrase;
    const lowPhrase = phrase.toLowerCase();
    let count = 0;
    const perHit = [];
    for (const sec of sections) {
      const visible = stripTagsToText(sec.rawHtml);
      const lowVis = visible.toLowerCase();
      let idx = 0;
      while ((idx = lowVis.indexOf(lowPhrase, idx)) !== -1) {
        count++;
        const start = Math.max(0, idx - 30);
        const ctx = visible.slice(start, idx + phrase.length + 30).replace(/\s+/g, " ").trim().slice(0, 200);
        perHit.push({ sectionId: sec.id, heading: sec.heading, context: ctx, phrase });
        idx += lowPhrase.length;
      }
    }
    if (count > 0) hits.push({ phrase, lang: entry.lang, source: entry.source || "", note: entry.note || "", count, hits: perHit });
  }
  return hits;
}

function detectRecordExposure(html, sections, labels) {
  const hits = [];
  for (const entry of labels) {
    const pat = entry.pattern;
    let count = 0;
    const perHit = [];
    for (const sec of sections) {
      const visible = stripTagsToText(sec.rawHtml);
      // case-sensitive for L01 etc? use case-sensitive search for "Target audience" etc, but L01 case-sensitive
      if (visible.includes(pat)) {
        // count occurrences
        const re = new RegExp(escapeReg(pat), "g");
        const m = visible.match(re);
        const c = m ? m.length : 1;
        count += c;
        // context snippet: find first occurrence
        const idx = visible.indexOf(pat);
        const ctx = visible.slice(Math.max(0, idx - 30), idx + pat.length + 30).replace(/\s+/g, " ").trim().slice(0, 240);
        perHit.push({ sectionId: sec.id, heading: sec.heading, context: ctx, pattern: pat });
      }
    }
    if (count > 0) hits.push({ pattern: pat, note: entry.note || "", count, hits: perHit });
  }
  return hits;
}
function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function extractFactKeysFromSection(sec) {
  // find all 〔...〕 citations
  const cites = [];
  const re = /〔([^〕]+)〕/g;
  let m;
  while ((m = re.exec(sec.rawHtml)) !== null) {
    const inside = m[1]; // e.g. "company,role,location / L01,L02,L03"
    const beforeSlash = inside.split("/")[0].trim();
    const keys = beforeSlash.split(",").map(k => k.trim()).filter(Boolean);
    cites.push(...keys);
  }
  // unique
  return [...new Set(cites)];
}

function detectHeadingMismatch(sections, scopeRules) {
  const out = [];
  const all = [];
  for (const sec of sections) {
    const foundKeys = extractFactKeysFromSection(sec);
    all.push({ id: sec.id, heading: sec.heading, foundKeys });
    // find matching scope rule
    let rule = null;
    for (const r of scopeRules) {
      if (sec.heading.toLowerCase().includes(r.headingPattern.toLowerCase())) { rule = r; break; }
    }
    if (!rule) continue;
    if (rule.allowedKeys.length === 0) continue; // allow all
    const allowed = new Set(rule.allowedKeys.map(k => k.toLowerCase()));
    const unexpected = foundKeys.filter(k => !allowed.has(k.toLowerCase()) && !allowed.has(k));
    if (unexpected.length > 0) {
      out.push({ sectionId: sec.id, heading: sec.heading, foundKeys, allowedKeys: rule.allowedKeys, unexpectedKeys: unexpected, rule: rule.headingPattern, description: rule.description || "" });
    }
  }
  return { mismatches: out, allSections: all };
}

function detectHeroP6(html, sections, caseId) {
  const cfg = HERO_P6_CONFIG[caseId];
  if (!cfg) {
    return { case: `C-${caseId}`, present: false, heroText: "", checks: [], missing: [], label: "", note: "candidate — permanence requires owner approval" };
  }
  // Extract hero text: from <header class="hero"> element including eyebrow, h1, lead, badges. Strip tags, decode entities.
  let heroTextRaw = "";
  let heroHtml = "";
  const heroMatch = html.match(/<header[^>]*class="hero"[^>]*>([\s\S]*?)<\/header>/i);
  if (heroMatch) {
    heroHtml = heroMatch[0];
    heroTextRaw = stripTagsToText(heroHtml).replace(/\s+/g, " ").trim();
  } else {
    const hdr = sections.find(s => s.id === "header");
    if (hdr) {
      heroHtml = hdr.rawHtml;
      heroTextRaw = stripTagsToText(hdr.rawHtml).replace(/\s+/g, " ").trim();
    }
  }

  // For E (and generally), also consider hero sub for commute check (hero or hero sub)
  let heroTextForCheck = heroTextRaw;
  let heroSubText = "";
  // Try to find hero sub elements: class containing hero-sub / hero__sub etc.
  const heroSubMatch = html.match(/<[^>]*class="[^"]*(?:hero-sub|hero__sub|hero_sub)[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/i);
  if (heroSubMatch) {
    heroSubText = stripTagsToText(heroSubMatch[0]).replace(/\s+/g, " ").trim();
    // For E, include hero sub in check; for others, extra context doesn't hurt
    heroTextForCheck = heroTextRaw + " " + heroSubText;
  }

  const checks = [];
  const missing = [];
  for (const pat of cfg.patterns) {
    // Use search to find pattern
    const found = pat.test(heroTextForCheck);
    if (pat.global) pat.lastIndex = 0;
    let context = "";
    if (found) {
      const idx = heroTextForCheck.search(pat);
      if (idx !== -1) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(heroTextForCheck.length, idx + 50);
        context = heroTextForCheck.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 120);
      }
    } else {
      missing.push(pat.toString());
    }
    checks.push({ pattern: pat.toString(), found, context });
    if (pat.global) pat.lastIndex = 0;
  }

  // Determine present: check if ALL required patterns (or at least one per required group) are present
  let present = false;
  if (caseId === "E") {
    // E requires (3 hours OR 08:00-11:00) AND Futako-Tamagawa (hero or hero sub)
    const workHoursFound = checks[0]?.found || checks[1]?.found;
    const commuteFound = checks[2]?.found || false;
    present = !!(workHoursFound && commuteFound);
  } else {
    // For A,B,C,D,F: present if at least one pattern found (OR semantics per fact description)
    // This satisfies "at least one per required group" where each case has one group of alternatives
    present = checks.some(c => c.found);
  }

  return {
    case: `C-${caseId}`,
    present,
    heroText: heroTextRaw.slice(0, 400),
    checks,
    missing,
    label: cfg.label,
    note: "candidate — permanence requires owner approval",
  };
}

async function main() {
  const args = process.argv.slice(2);
  let cases = [], gen = "001", outAll = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--case" && args[i+1]) { cases.push(args[i+1].toUpperCase()); i++; }
    else if (args[i] === "--gen" && args[i+1]) { gen = String(args[i+1]).padStart(3,"0"); i++; }
    else if (args[i] === "--all") { outAll = true; }
  }
  if (cases.length === 0) cases = ["A","B","C","D","E","F"];
  if (outAll) cases = ["A","B","C","D","E","F"];

  const dict = loadDict();
  const labels = loadRecordLabels();
  const scopeRules = loadHeadingScope();

  const checksDir = resolve("loops/loop-016/checks");
  mkdirSync(checksDir, { recursive: true });

  for (const c of cases) {
    const cLower = c.toLowerCase();
    const relPreview = `loops/loop-016/previews/case-${c}-gen-${gen}-complete.html`;
    const absPreview = resolve(relPreview);
    if (!existsSync(absPreview)) {
      console.error(`[pagecheck] skip ${c}: not found ${relPreview}`);
      continue;
    }
    const html = readFileSync(absPreview, "utf8");
    const sections = extractSections(html);
    const duplication = collectDuplication(html, sections);
    const verification = detectVerification(html, sections, dict);
    const recordExposure = detectRecordExposure(html, sections, labels);
    const heading = detectHeadingMismatch(sections, scopeRules);
    const heroP6 = detectHeroP6(html, sections, c);

    const summary = {
      duplicates: duplication.length,
      duplicateSentencesTotalOccurrences: duplication.reduce((s,g)=>s+g.count,0),
      verificationHits: verification.reduce((s,h)=>s+h.count,0),
      verificationGroups: verification.length,
      recordExposureGroups: recordExposure.length,
      recordExposureHits: recordExposure.reduce((s,h)=>s+h.count,0),
      headingMismatch: heading.mismatches.length,
      heroP6Present: heroP6.present ? 1 : 0,
      heroP6Missing: heroP6.missing.length,
    };

    const jsonOut = {
      case: `C-${c}`,
      gen,
      source: relPreview,
      generatedAt: new Date().toISOString(),
      tool: "loop16-pagecheck.mjs",
      version: "1.1-candidate (T1-T5 + P6)",
      note: "Candidate rules — permanence requires user approval. Layer1 deterministic, no API.",
      dictVersions: { verification: dict.length, recordLabels: labels.length, headingScope: scopeRules.length, heroP6: Object.keys(HERO_P6_CONFIG).length },
      summary,
      duplication,
      verificationPhrases: verification,
      recordExposure,
      headingMismatch: heading.mismatches,
      allSections: heading.allSections,
      heroP6: { present: heroP6.present, heroText: heroP6.heroText, checks: heroP6.checks, missing: heroP6.missing, label: heroP6.label, note: "candidate — permanence requires owner approval" },
    };

    const outJson = join(checksDir, `case-${cLower}-gen-${gen}-pagecheck.json`);
    writeFileSync(outJson, JSON.stringify(jsonOut, null, 2) + "\n", "utf8");

    // markdown
    let md = `# Page check (Layer 1 rule-based) — C-${c} gen-${gen}\n\n`;
    md += `- source: \`${relPreview}\`\n`;
    md += `- tool: \`loop16-pagecheck.mjs\` v1.1-candidate (T1-T5 + P6) (deterministic, no API)\n`;
    md += `- date: ${jsonOut.generatedAt}\n`;
    md += `- dict: verification ${dict.length} / recordLabels ${labels.length} / headingScope ${scopeRules.length} / heroP6 ${Object.keys(HERO_P6_CONFIG).length} (candidate)\n\n`;
    md += `## Summary\n\n`;
    md += `| metric | value |\n|---|---|\n`;
    md += `| duplicate groups (≥2) | ${summary.duplicates} |\n`;
    md += `| duplicate occurrences total | ${summary.duplicateSentencesTotalOccurrences} |\n`;
    md += `| verification phrase groups | ${summary.verificationGroups} |\n`;
    md += `| verification hits total | ${summary.verificationHits} |\n`;
    md += `| record-exposure groups | ${summary.recordExposureGroups} |\n`;
    md += `| record-exposure hits | ${summary.recordExposureHits} |\n`;
    md += `| heading mismatch sections | ${summary.headingMismatch} |\n`;
    md += `| hero P6 present | ${summary.heroP6Present} |\n`;
    md += `| hero P6 missing patterns | ${summary.heroP6Missing} |\n\n`;

    md += `## 1) 重複文 (normalized, count≥2 — intentional reposts not filtered)\n\n`;
    if (duplication.length === 0) md += `(none)\n\n`;
    else {
      md += `> 意図的再掲との仕分けは後段に任せ、まず全部出す\n\n`;
      for (let i=0;i<Math.min(duplication.length, 30);i++) {
        const g = duplication[i];
        md += `### [${i+1}] count=${g.count} — \`${g.normalized.slice(0,120)}\`\n\n`;
        md += `- example: ${g.example}\n`;
        md += `- occurrences:\n`;
        for (const o of g.occurrences) md += `  - \`${o.sectionId}\` / “${o.heading}” — ${o.snippet}\n`;
        md += `\n`;
      }
      if (duplication.length > 30) md += `_(… and ${duplication.length-30} more groups in JSON)_\n\n`;
    }

    md += `## 2) 検証側定型文の辞書ヒット\n\n`;
    if (verification.length===0) md += `(none)\n\n`;
    else {
      for (const h of verification) {
        md += `- **"${h.phrase}"** (${h.lang}, ${h.source}) — ${h.count} hit(s)\n`;
        for (const hh of h.hits) md += `  - \`${hh.sectionId}\` / “${hh.heading}” — …${hh.context}…\n`;
      }
      md += `\n`;
    }

    md += `## 3) 記録物ラベルの露出\n\n`;
    if (recordExposure.length===0) md += `(none)\n\n`;
    else {
      for (const h of recordExposure) {
        md += `- **"${h.pattern}"** — ${h.count} hit(s) (${h.note})\n`;
        for (const hh of h.hits) md += `  - \`${hh.sectionId}\` / “${hh.heading}” — …${hh.context}…\n`;
      }
      md += `\n`;
    }

    md += `## 4) 見出しと中身のずれ (heading vs factKeys)\n\n`;
    md += `All sections factKeys table:\n\n`;
    md += `| sectionId | heading | foundKeys |\n|---|---|---|\n`;
    for (const s of heading.allSections) md += `| \`${s.id}\` | ${s.heading.replace(/\|/g,"/")} | ${s.foundKeys.join(", ") || "(none)"} |\n`;
    md += `\n`;
    if (heading.mismatches.length===0) md += `(no mismatch under current scope rules)\n\n`;
    else {
      md += `**Warnings (candidate rules):**\n\n`;
      for (const mm of heading.mismatches) {
        md += `- \`${mm.sectionId}\` “${mm.heading}” — allowed: ${mm.allowedKeys.join(", ")} — **unexpected: ${mm.unexpectedKeys.join(", ")}** — found: ${mm.foundKeys.join(", ")}\n`;
        if (mm.description) md += `  - rule: ${mm.description}\n`;
      }
      md += `\n`;
    }

    md += `## 5) Hero P6 — first-check item in hero (candidate)\n\n`;
    md += `> note: candidate — permanence requires owner approval\n\n`;
    md += `- case: C-${c} — expected label: **${heroP6.label}**\n`;
    md += `- verdict: ${heroP6.present ? "**PRESENT** ✅ — hero contains first-check item" : "**MISSING** ❌ — hero does not contain first-check item"}\n`;
    md += `- hero text excerpt (first 400 chars):\n\n`;
    md += `  > ${heroP6.heroText ? heroP6.heroText.replace(/\n/g, " ").slice(0, 400) : '(empty — no <header class="hero"> found)'}\n\n`;
    md += `- checks:\n`;
    for (const ch of heroP6.checks) {
      md += `  - pattern \`${ch.pattern}\` — ${ch.found ? "FOUND ✅" : "NOT FOUND ❌"}${ch.context ? ` — …${ch.context}…` : ""}\n`;
    }
    if (heroP6.missing.length > 0) {
      md += `- missing patterns: ${heroP6.missing.join(", ")}\n`;
    } else {
      md += `- missing: (none)\n`;
    }
    md += `\n`;
    md += `---\n\n*Candidate —恒常化は本人承認を経る。loopが勝手に書き換えない。*\n`;

    const outMd = join(checksDir, `case-${cLower}-gen-${gen}-pagecheck.md`);
    writeFileSync(outMd, md, "utf8");
    console.error(`[pagecheck] C-${c} gen-${gen} -> ${outJson} | dupGroups=${summary.duplicates} verifyHits=${summary.verificationHits} recordHits=${summary.recordExposureHits} headingMis=${summary.headingMismatch} heroP6Present=${summary.heroP6Present}`);
  }
}

main().catch(e=>{ console.error(String(e?.stack??e)); process.exit(1); });
