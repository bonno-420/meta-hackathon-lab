#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve("loops/loop-016");

// Load judge verdicts from markdown files
function parseJudgeVericts() {
  const cases = ["a","b","c","d","e","f"];
  const variants = ["vanilla-wonder","vanilla-spark","pipeline-gen-005"];
  const results = [];
  for (const c of cases) {
    for (const v of variants) {
      const p = resolve(`loops/loop-016/vanilla/evaluation/checks/case-${c}-${v}-judge.md`);
      let txt = "";
      try { txt = readFileSync(p, "utf8"); } catch(e) { txt = "MISSING"; }
      const verdicts = {};
      for (const pn of ["P1","P2","P3","P4","P5","P6"]) {
        const re = new RegExp(`##\\s*${pn}[\\s\\S]*?判定:\\s*(ある|ない)`, "i");
        const m = txt.match(re);
        verdicts[pn] = m ? m[1] : "unknown";
      }
      // extract evidence snippet for ある cases
      const evidences = {};
      for (const pn of ["P1","P2","P3","P4","P5","P6"]) {
        if (verdicts[pn] === "ある") {
          const re = new RegExp(`##\\s*${pn}[\\s\\S]*?根拠[\\s\\S]*?([^\n]{20,120})`, "i");
          const m = txt.match(re);
          // fallback: get line after 判定
          const re2 = new RegExp(`##\\s*${pn}[\\s\\S]*?判定:.*\n([^\n]{10,200})`, "i");
          const m2 = txt.match(re2);
          evidences[pn] = (m ? m[1] : (m2 ? m2[1] : "")).trim().slice(0,100);
        }
      }
      results.push({ case: `C-${c.toUpperCase()}`, variant: v, verdicts, evidences, file: `case-${c}-${v}-judge.md` });
    }
  }
  return results;
}

// Load blind reviews
function parseReviews() {
  const letters = ["a","b","c","d","e","f"];
  const labels = ["X","Y","Z"];
  const results = [];
  for (const l of letters) {
    for (const lab of labels) {
      const p = resolve(`loops/loop-016/vanilla/evaluation/checks/case-${l}-${lab}-review-blind.md`);
      let txt = "";
      try { txt = readFileSync(p, "utf8"); } catch(e) { txt = "MISSING"; }
      // Extract sections - look for headings
      const sections = {};
      const sectionNames = ["Unclear", "Drop-off", "Applicant questions", "AI-ness"];
      for (const sname of sectionNames) {
        const re = new RegExp(`##?\\s*${sname}[\\s\\S]*?(?=##?\\s*(?:Unclear|Drop-off|Applicant|AI-ness)|---\\n\\n## 原文|$)`, "i");
        const m = txt.match(re);
        if (m) {
          sections[sname] = m[0].replace(/\n/g," ").replace(/\s+/g," ").trim().slice(0,300);
        } else {
          sections[sname] = "(not found)";
        }
      }
      // Check truncation
      const isTruncated = txt.length < 2000;
      results.push({ case: `C-${l.toUpperCase()}`, label: lab, sections, len: txt.length, isTruncated, file: `case-${l}-${lab}-review-blind.md` });
    }
  }
  return results;
}

const judges = parseJudgeVericts();
const reviews = parseReviews();
const mapping = JSON.parse(readFileSync(resolve("loops/loop-016/vanilla/evaluation/anon/mapping-opened-20261102.json"),"utf8"));
const judgeSummary = JSON.parse(readFileSync(resolve("loops/loop-016/vanilla/evaluation/checks/judge-summary-20261102.json"),"utf8"));
const reviewSummary = JSON.parse(readFileSync(resolve("loops/loop-016/vanilla/evaluation/checks/review-blind-summary-20261102.json"),"utf8"));

// Print judge table
console.log("=== JUDGE TABLE ===");
console.log("| 対象 | ケース | P1 | P2 | P3 | P4 | P5 | P6 | ある数 |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const j of judges) {
  const p = j.verdicts;
  const count = Object.values(p).filter(v=>v==="ある").length;
  console.log(`| ${j.variant} | ${j.case} | ${p.P1} | ${p.P2} | ${p.P3} | ${p.P4} | ${p.P5} | ${p.P6} | ${count} |`);
}
console.log("");
console.log("=== Totals per P ===");
for (const pn of ["P1","P2","P3","P4","P5","P6"]) {
  const c = judges.filter(j=> j.verdicts[pn]==="ある").length;
  console.log(`${pn}: ${c}/18`);
}
console.log("");
console.log("=== Per variant ===");
for (const v of ["vanilla-wonder","vanilla-spark","pipeline-gen-005"]) {
  const subset = judges.filter(j=> j.variant===v);
  const total = subset.reduce((acc,j)=> acc + Object.values(j.verdicts).filter(x=>x==="ある").length, 0);
  console.log(`${v}: ${total} ある / ${subset.length*6} checks`);
}
console.log("");
console.log("=== BLIND REVIEWS ===");
for (const r of reviews) {
  const variant = mapping.cases[r.case]?.[r.label] || "?";
  console.log(`${r.case} ${r.label} -> ${variant} len=${r.len} truncated=${r.isTruncated}`);
  console.log(`  Drop-off: ${r.sections["Drop-off"]?.slice(0,150)}`);
  console.log(`  AI-ness: ${r.sections["AI-ness"]?.slice(0,150)}`);
}
console.log("");
console.log("=== MAPPING ===");
console.log(JSON.stringify(mapping.cases, null,2));
