import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
for (const c of ["A","B","C","D","E","F"]) {
  const src = resolve(`loops/loop-016/generations/case-${c}/gen-004.json`);
  const dst = resolve(`loops/loop-016/generations/case-${c}/gen-005.json`);
  const srcMd = resolve(`loops/loop-016/generations/case-${c}/gen-004.md`);
  const dstMd = resolve(`loops/loop-016/generations/case-${c}/gen-005.md`);
  const j = JSON.parse(readFileSync(src,"utf8"));
  j.generatedAt = new Date().toISOString();
  j.provisionalLimit = { ...j.provisionalLimit, note: "gen-005 reuses gen-004 sentences verbatim, Baseten 0" };
  j.templateApplied = "gen-005 S1+S2 (value-chip + single-placement)";
  j.templateVersion = "gen-005";
  j.templateSource = "loops/loop-016/generations/case-"+c+"/gen-004.json";
  j.basetenConsumed = 0;
  j.gen = "005";
  j.note = "gen-005: sentences verbatim from gen-004, assembly only S1+S2, Baseten 0";
  writeFileSync(dst, JSON.stringify(j,null,2)+"\n","utf8");
  console.log(`wrote gen-005.json for ${c}: ${j.generation.sentences.length} sentences`);
  const md = readFileSync(srcMd,"utf8");
  const md005 = md.replaceAll("gen-004","gen-005") + "\n\n> gen-005: reuses gen-004 sentences verbatim (Baseten 0). Assembly changes S1+S2 only.\n";
  writeFileSync(dstMd, md005,"utf8");
}
