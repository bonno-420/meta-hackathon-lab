// Deterministic page-quality checks (fix F6, completion condition C5).
// Ported from loops/loop-016/tools/loop16-pagecheck.mjs (the Layer-1
// rule-based detection whose output the user approved in loop-016):
// 1) duplicated sentences, 2) verification-side stock phrases,
// 3) record-label exposure, 4) heading/factKey scope mismatch.
// The dictionaries live under src/dicts/ (copied from the loop-016
// dicts; their entries keep their candidate lineage — the wiring of
// the checks into the completion condition is the audited gap-fill
// design (c), and the run record names the dictionary version).
// The loop-016 P6 hero check was case-bound; here the hero first-check
// is enforced by construction (hero chips from the planning's
// firstCheckKeys) and by the key-visual checkpoint, not by this module.
// No API, no model: same input, same result.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PAGECHECK_VERSION = "src-pagecheck-v5";
export const DICTS_VERSION = "loop16-dicts-2026-11-02";

const DEFAULT_VERIFICATION_DICT = [
  { phrase: "What this means", lang: "EN", source: "C-A real: highlight box", note: "" },
  { phrase: "numbers stay exactly as stated", lang: "EN", source: "C-A real", note: "" },
  { phrase: "as stated in the FACT", lang: "EN", source: "C-A real", note: "" },
  { phrase: "Read the sentences above as the full conditions", lang: "EN", source: "C-A real", note: "" },
  { phrase: "No rounding or reinterpretation", lang: "EN", source: "C-A real", note: "" },
  { phrase: "All facts below are the only stated facts", lang: "EN", source: "C-A real: must block", note: "" },
  { phrase: "Do not invent", lang: "EN", source: "case-A plan.mustNot via page", note: "" },
  { phrase: "Do not promise remote work", lang: "EN", source: "case-A plan.mustNot", note: "" },
  { phrase: "Each cites its fact keys and source lines verbatim", lang: "EN", source: "C-A about section lead", note: "" },
];

const DEFAULT_RECORD_LABELS = [
  { pattern: "factKeys", note: "内部ラベル" },
  { pattern: "sourceLines", note: "" },
  { pattern: "SourceLines", note: "" },
  { pattern: "fact keys", note: "" },
  { pattern: "Target audience", note: "企画メモ露出" },
  { pattern: "Persona:", note: "" },
  { pattern: "Persona", note: "" },
  { pattern: "Insights applied", note: "" },
  { pattern: "Insights", note: "" },
  { pattern: "Appeal:", note: "" },
  { pattern: "mustNot", note: "" },
  { pattern: "CTA:", note: "" },
  { pattern: "factKeys / sourceLines", note: "" },
  { pattern: "〔", note: "" },
  { pattern: "〕", note: "" },
  { pattern: "L01", note: "sourceLineコード露出（本文中）" },
];

const DEFAULT_HEADING_SCOPE = [
  { headingPattern: "Pay & Hours", lang: "EN", allowedKeys: ["salary", "pay", "workHours", "employmentType", "employment", "wage", "annual", "hourly", "hours", "term", "contract", "contractPeriod"], description: "" },
  { headingPattern: "Place & Access", lang: "EN", allowedKeys: ["location", "commute", "place", "access", "station", "address", "transport", "workLocation"], description: "" },
  { headingPattern: "勤務地", lang: "JA", allowedKeys: ["location", "commute", "workLocation", "transport"], description: "" },
  { headingPattern: "給与", lang: "JA", allowedKeys: ["salary", "pay", "salaryHourly", "workHours"], description: "" },
  { headingPattern: "The Basics", lang: "EN", allowedKeys: [] },
  { headingPattern: "Check Before", lang: "EN", allowedKeys: [] },
];

function parseDictFile(p) {
  const raw = readFileSync(p, "utf8").replace(/^﻿/, "");
  return JSON.parse(raw);
}

// Load the dictionaries from src/dicts/ (or a given directory).
// Falls back to the embedded defaults when a file is absent.
export function loadDicts(dictDir) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const dir = dictDir ?? path.join(here, "dicts");
  const load = (name, fallback) => {
    const p = path.join(dir, name);
    if (existsSync(p)) {
      try { return parseDictFile(p); } catch { return fallback; }
    }
    return fallback;
  };
  return {
    verification: load("verification-phrases.json", DEFAULT_VERIFICATION_DICT),
    recordLabels: load("record-labels.json", DEFAULT_RECORD_LABELS),
    headingScope: load("heading-scope.json", DEFAULT_HEADING_SCOPE),
  };
}

export function stripTagsToText(html) {
  let s = String(html).replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<\/?[^>]+>/g, "\n");
  s = s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  s = s.replace(/\r/g, "");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n +/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s;
}

export function extractSections(html) {
  const sections = [];
  const heroMatch = String(html).match(/<header[\s\S]*?class="hero"[\s\S]*?<\/header>/i);
  if (heroMatch) {
    const h1 = (heroMatch[0].match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, " ").trim();
    sections.push({ id: "header", heading: h1 || "Header", rawHtml: heroMatch[0], index: 0 });
  }
  const re = /<section[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const inner = m[2];
    const h2Raw = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "";
    const heading = h2Raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    sections.push({ id: m[1], heading: heading || m[1], rawHtml: m[0], inner, index: m.index });
  }
  const allSecRe = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  let m2;
  while ((m2 = allSecRe.exec(html)) !== null) {
    const full = m2[0];
    if (/id="/.test(full)) continue;
    const h2Raw = full.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "";
    const heading = h2Raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    sections.push({ id: "section-no-id", heading: heading || "memo", rawHtml: full, inner: m2[1], index: m2.index });
  }
  // Pages without section structure (including this tool's own LP
  // assembly) are checked as a single whole-page section, so the
  // checks are never vacuous.
  if (sections.length === 0) {
    sections.push({ id: "page", heading: "(page)", rawHtml: String(html), inner: String(html), index: 0 });
  }
  return sections;
}

function normalizeSentence(s) {
  let n = s;
  n = n.replace(/ |​|﻿/g, " ");
  n = n.replace(/[“”„«»]/g, '"').replace(/[‘’]/g, "'").replace(/[—–−]/g, "-");
  n = n.replace(/[　]/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  n = n.toLowerCase();
  n = n.replace(/。/g, ".").replace(/，/g, ",").replace(/：/g, ":").replace(/；/g, ";").replace(/！/g, "!").replace(/？/g, "?");
  n = n.replace(/\s+([.,!?;:])/g, "$1");
  return n;
}

function splitSentences(text) {
  const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
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

function collectDuplication(sections, factValues = []) {
  // A stated FACT value repeated by the page's own apparatus (hero
  // chips, condition cards, the job-details table) is the formal
  // summary doing its job — the user decided the details table may
  // duplicate (2026-11-04) — not a duplicated sentence. Exempt exact
  // matches of a stated value; generated sentences still count.
  const factNorms = new Set((factValues ?? []).map((v) => normalizeSentence(String(v))).filter((v) => v.length >= 10));
  const map = new Map();
  for (const sec of sections) {
    const text = stripTagsToText(sec.rawHtml);
    for (const raw of splitSentences(text)) {
      const norm = normalizeSentence(raw);
      if (norm.length < 10) continue;
      if (factNorms.has(norm)) continue;
      // Duplication is about sentences in the body text. A short
      // fragment without terminal punctuation is a label or a value
      // (a fact value shown both as a hero chip and in its condition
      // card is the confirmed design, not a duplicated sentence).
      if (!/[.!?]$/.test(norm) && norm.length < 20) continue;
      if (!map.has(norm)) map.set(norm, { example: raw.slice(0, 400), normalized: norm, count: 0, occurrences: [] });
      const e = map.get(norm);
      e.count++;
      e.occurrences.push({ sectionId: sec.id, heading: sec.heading, snippet: raw.slice(0, 200) });
    }
  }
  const groups = [];
  for (const v of map.values()) if (v.count >= 2) groups.push(v);
  groups.sort((a, b) => b.count - a.count || b.normalized.length - a.normalized.length);
  return groups;
}

function detectVerification(sections, dict) {
  const hits = [];
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

function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function detectRecordExposure(sections, labels) {
  const hits = [];
  for (const entry of labels) {
    const pat = entry.pattern;
    let count = 0;
    const perHit = [];
    for (const sec of sections) {
      const visible = stripTagsToText(sec.rawHtml);
      if (visible.includes(pat)) {
        const re = new RegExp(escapeReg(pat), "g");
        const m = visible.match(re);
        count += m ? m.length : 1;
        const idx = visible.indexOf(pat);
        const ctx = visible.slice(Math.max(0, idx - 30), idx + pat.length + 30).replace(/\s+/g, " ").trim().slice(0, 240);
        perHit.push({ sectionId: sec.id, heading: sec.heading, context: ctx, pattern: pat });
      }
    }
    if (count > 0) hits.push({ pattern: pat, note: entry.note || "", count, hits: perHit });
  }
  return hits;
}

function extractFactKeysFromSection(sec) {
  const cites = [];
  const re = /〔([^〕]+)〕/g;
  let m;
  while ((m = re.exec(sec.rawHtml)) !== null) {
    const beforeSlash = m[1].split("/")[0].trim();
    cites.push(...beforeSlash.split(",").map((k) => k.trim()).filter(Boolean));
  }
  return [...new Set(cites)];
}

function detectHeadingMismatch(sections, scopeRules) {
  const out = [];
  const all = [];
  for (const sec of sections) {
    const foundKeys = extractFactKeysFromSection(sec);
    all.push({ id: sec.id, heading: sec.heading, foundKeys });
    let rule = null;
    for (const r of scopeRules) {
      if (sec.heading.toLowerCase().includes(r.headingPattern.toLowerCase())) { rule = r; break; }
    }
    if (!rule || rule.allowedKeys.length === 0) continue;
    const allowed = new Set(rule.allowedKeys.map((k) => k.toLowerCase()));
    const unexpected = foundKeys.filter((k) => !allowed.has(k.toLowerCase()) && !allowed.has(k));
    if (unexpected.length > 0) {
      out.push({ sectionId: sec.id, heading: sec.heading, foundKeys, allowedKeys: rule.allowedKeys, unexpectedKeys: unexpected, rule: rule.headingPattern, description: rule.description || "" });
    }
  }
  return { mismatches: out, allSections: all };
}

// Run all deterministic checks on an assembled page.
// pass means: no duplicated sentences, no verification phrases, no
// record labels, no heading-scope mismatches.
// Gate G-E (promoted by the user, 2026-11-04, D17): a stated
// fact's value stated in two or more BODY sentences fails the
// page check. The details table carries every value and the
// cards/chips are the allowed summary of deciding conditions, so
// only body sentences (rows, bands, the headline) are counted;
// the marked income example counts as one occurrence of its
// components, like any other sentence. Origin: FICT-E03 run9 —
// "16 working days" appeared in the income example AND in a
// second prose sentence, and the judgement-layer criterion
// (natural-and-sufficient) did not catch it. Verified before
// promotion: catches run9's page, clean on run10's.
function valueTokens(value) {
  const toks = new Set();
  const v = String(value ?? "");
  // A number plus the words up to its unit (within three words):
  // "1,200 yen", "16 working days", "5 hours", "12,000 yen".
  for (const m of v.matchAll(/\d[\d,]*(?:\s+\S+?){0,3}?\s*(?:yen|hours?|minutes?|days?|%)/gi)) toks.add(m[0].replace(/\s+/g, " ").trim());
  for (const m of v.matchAll(/\b\d{1,2}:\d{2}\b/g)) toks.add(m[0]);
  return [...toks];
}

export function collectValueRepetition(html, factItems) {
  const bodySentences = [];
  for (const m of String(html).matchAll(/<section class="([^"]*)">([\s\S]*?)<\/section>/g)) {
    if (/cards|details|lp-cta/.test(m[1])) continue;
    for (const p of m[2].matchAll(/<p class="lp-sentence"[^>]*>([\s\S]*?)<\/p>/g)) {
      bodySentences.push(p[1].replace(/<[^>]+>/g, "").trim());
    }
  }
  const hits = [];
  for (const item of factItems ?? []) {
    const tokens = valueTokens(item?.value);
    if (tokens.length === 0) continue;
    const found = bodySentences.filter((s) => tokens.some((t) => s.includes(t)));
    if (found.length >= 2) hits.push({ key: item.key ?? null, value: item.value, count: found.length, sentences: found.map((s) => s.slice(0, 90)) });
  }
  return hits;
}

export function checkPage(html, { dicts, factValues, factItems } = {}) {
  const d = dicts ?? loadDicts();
  const sections = extractSections(html);
  // The text checks always run over the whole page. Text outside any
  // <section> must never escape inspection: this tool's own LP
  // assembly puts its sentences in <p> elements beside a hero
  // <section>, and with section-only scopes a duplicated sentence and
  // an internal label in the body passed with zero hits (found
  // 2026-11-04, reproduced before this fix).
  const pageScope = [{ id: "page", heading: "(page)", rawHtml: String(html), inner: String(html), index: 0 }];
  const duplication = collectDuplication(pageScope, factValues ?? []);
  const valueRepetition = collectValueRepetition(html, factItems ?? []);
  const verificationPhrases = detectVerification(pageScope, d.verification);
  const recordExposure = detectRecordExposure(pageScope, d.recordLabels);
  const heading = detectHeadingMismatch(sections, d.headingScope);
  // Attribute exposure (v2): internal identifiers in alt attributes
  // are part of the delivered HTML even though they are not visible
  // text; the text scan cannot see them (independent review of
  // run20 found alt="appeal-A3" / alt="section-work", 2026-11-04).
  const attributeExposure = [];
  for (const m of String(html).matchAll(/alt="([^"]*)"/g)) {
    const v = m[1];
    if (/(appeal|section|key-visual)-[A-Za-z0-9]/i.test(v) || v === "section-work") attributeExposure.push({ attribute: "alt", value: v });
  }
  // Headline scan (gate promotion G-B, approved by the user,
  // 2026-11-04): the headline (the title block's sentence) must be
  // the work itself in a short form — not a conditions-only sentence
  // (employment type / contract period) and not over the length
  // guide (50 chars for Japanese, 120 for English). The judgement
  // review also checks this; this is the deterministic floor.
  const headlineHits = [];
  const titleMatch = String(html).match(/<div class="title-block">[\s\S]*?<p class="lp-sentence"[^>]*>([\s\S]*?)<\/p>/);
  const headlineText = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : null;
  if (headlineText !== null) {
    if (/(雇用形態は|契約期間は|雇用形態・|Employment type is|The employment type|Contract period is)/.test(headlineText)) {
      headlineHits.push({ issue: "headline is a conditions-only sentence", headline: headlineText });
    }
    const isJa = /[぀-ヿ一-鿿]/.test(headlineText);
    const limit = isJa ? 50 : 120;
    if (headlineText.length > limit) {
      headlineHits.push({ issue: `headline is over the length guide (${headlineText.length} > ${limit})`, headline: headlineText });
    }
  }
  const summary = {
    duplicateGroups: duplication.length,
    verificationGroups: verificationPhrases.length,
    verificationHits: verificationPhrases.reduce((s, h) => s + h.count, 0),
    recordExposureGroups: recordExposure.length,
    recordExposureHits: recordExposure.reduce((s, h) => s + h.count, 0),
    headingMismatches: heading.mismatches.length,
    attributeExposureHits: attributeExposure.length,
    headlineHits: headlineHits.length,
    valueRepetitionHits: valueRepetition.length,
  };
  const pass = summary.duplicateGroups === 0 && summary.verificationHits === 0 && summary.recordExposureHits === 0 && summary.headingMismatches === 0 && summary.attributeExposureHits === 0 && summary.headlineHits === 0 && summary.valueRepetitionHits === 0;
  return {
    pass,
    version: PAGECHECK_VERSION,
    dictsVersion: DICTS_VERSION,
    dictCounts: { verification: d.verification.length, recordLabels: d.recordLabels.length, headingScope: d.headingScope.length },
    summary,
    duplication,
    verificationPhrases,
    recordExposure,
    attributeExposure,
    headline: { text: headlineText, hits: headlineHits },
    valueRepetition,
    headingMismatch: heading.mismatches,
    allSections: heading.allSections,
  };
}
