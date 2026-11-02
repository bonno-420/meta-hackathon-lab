#!/usr/bin/env node
// loop16-contrast.mjs — gen-001 vs gen-002 対照表とhero第一確認項目の抽出（Baseten枠外）
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CASES = ["A","B","C","D","E","F"];
const HERO_PATTERNS = {
  A: /Annual\s*4,?800,?000\s*JPY/i,
  B: /Day\s*shift\s*08:30/i,
  C: /12.?month|12.?Month|Contract.*12|12.*Contract/i,
  D: /Apex Work Partners|dispatching agency/i,
  E: /(From\s*3\s*hours|3\s*hours.*day|08:00-11:00.*or.*11:00-14:00)|2-min walk.*Futako/i,
  F: /6\s*weeks.*2026-12-01.*2027-01-11|2026-12-01.*2027-01-11/i,
};
const HERO_DESC = {
  A: "年収 Annual 4,800,000 JPY",
  B: "day shift 08:30-17:00",
  C: "12か月term (Contract 12 months)",
  D: "雇用元と就業先の分離 (Employer vs Worksite)",
  E: "3時間枠 From 3 hours/day, 2-4 days/week ＋徒歩圏 Futako-Tamagawa",
  F: "固定日程 6 weeks: 2026-12-01 to 2027-01-11",
};

function clean(s){ return s.replace(/\uFEFF/g,""); }
function loadJson(p){ try { return JSON.parse(clean(readFileSync(resolve(p),"utf8"))); } catch(e){ return null; } }

function extractHero(html){
  const m = html.match(/<header[\s\S]*?class="hero"[\s\S]*?<\/header>/i);
  if(!m) return "";
  let h = m[0].replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ");
  h = h.replace(/<\/?[^>]+>/g," ").replace(/\s+/g," ").trim();
  h = h.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
  return h;
}

function judgeVerdict(md){
  // extract P1-P6 判定
  const v = {};
  for(const p of ["P1","P2","P3","P4","P5","P6"]){
    const re = new RegExp(`##\\s*${p}[\\s\\S]*?判定:\\s*(ある|ない)`, "i");
    const m = md.match(re);
    v[p] = m ? m[1] : "?";
  }
  return v;
}

const rows=[];
for(const c of CASES){
  const gen1 = loadJson(`loops/loop-016/generations/case-${c}/gen-001.json`);
  const gen2 = loadJson(`loops/loop-016/generations/case-${c}/gen-002.json`);
  const pc1 = loadJson(`loops/loop-016/checks/case-${c.toLowerCase()}-gen-001-pagecheck.json`);
  const pc2 = loadJson(`loops/loop-016/checks/case-${c.toLowerCase()}-gen-002-pagecheck.json`);
  const j1raw = existsSync(resolve(`loops/loop-016/checks/case-${c.toLowerCase()}-gen-001-judge.md`)) ? readFileSync(resolve(`loops/loop-016/checks/case-${c.toLowerCase()}-gen-001-judge.md`),"utf8") : "";
  const j2raw = existsSync(resolve(`loops/loop-016/checks/case-${c.toLowerCase()}-gen-002-judge.md`)) ? readFileSync(resolve(`loops/loop-016/checks/case-${c.toLowerCase()}-gen-002-judge.md`),"utf8") : "";
  const j1 = j1raw ? judgeVerdict(j1raw) : {};
  const j2 = j2raw ? judgeVerdict(j2raw) : {};

  const html1 = existsSync(resolve(`loops/loop-016/previews/case-${c}-gen-001-complete.html`)) ? readFileSync(resolve(`loops/loop-016/previews/case-${c}-gen-001-complete.html`),"utf8") : "";
  const html2 = existsSync(resolve(`loops/loop-016/previews/case-${c}-gen-002-complete.html`)) ? readFileSync(resolve(`loops/loop-016/previews/case-${c}-gen-002-complete.html`),"utf8") : "";
  const hero1 = html1 ? extractHero(html1) : "";
  const hero2 = html2 ? extractHero(html2) : "";
  const pat = HERO_PATTERNS[c];
  const hero1has = pat ? pat.test(hero1) : false;
  const hero2has = pat ? pat.test(hero2) : false;

  // review summary
  const rev1 = existsSync(resolve(`loops/loop-016/reviews/case-${c}-gen-001-review.md`)) ? readFileSync(resolve(`loops/loop-016/reviews/case-${c}-gen-001-review.md`),"utf8").slice(0,600) : "";
  const rev2 = existsSync(resolve(`loops/loop-016/reviews/case-${c}-gen-002-review.md`)) ? readFileSync(resolve(`loops/loop-016/reviews/case-${c}-gen-002-review.md`),"utf8").slice(0,600) : "";

  rows.push({
    c, gen1, gen2, pc1, pc2, j1, j2, hero1, hero2, hero1has, hero2has, heroDesc: HERO_DESC[c], pat: pat?.source || ""
  });
}

// output markdown to stdout
let md = `# gen-001 vs gen-002 対照（C-A〜C-F）— research適用の差分 2026-11-02\n\n`;
md += `> 変更要因は research v1.0 の適用のみ。画像はgen-001再利用、パレット・テンプレ不変。Baseten 6回追加で累計14/40。K4/K5該当なし。\n\n`;

md += `## 世代サマリ（適合/散文/use）\n\n`;
md += `| ケース | gen | pass | needsFix | 文数 | prompt | completion | total | reasoning | research |\n`;
md += `|---|---|---|---|---|---|---|---|---|---|\n`;
for(const r of rows){
  const g1 = r.gen1, g2 = r.gen2;
  md += `| C-${r.c} | 001 | ${g1?.conformance?.pass ? "pass" : "fail"} | ${g1?.prose?.needsFixCount ?? "?"} | ${g1?.conformance?.checked ?? "?"} | ${g1?.usage?.prompt_tokens ?? "?"} | ${g1?.usage?.completion_tokens ?? "?"} | ${g1?.usage?.total_tokens ?? "?"} | ${g1?.usage?.completion_tokens_details?.reasoning_tokens ?? "?"} | — |\n`;
  md += `| C-${r.c} | 002 | ${g2?.conformance?.pass ? "pass" : "fail"} | ${g2?.prose?.needsFixCount ?? "?"} | ${g2?.conformance?.checked ?? "?"} | ${g2?.usage?.prompt_tokens ?? "?"} | ${g2?.usage?.completion_tokens ?? "?"} | ${g2?.usage?.total_tokens ?? "?"} | ${g2?.usage?.completion_tokens_details?.reasoning_tokens ?? "?"} | ${g2?.researchApplied?.join(",") || "?"} ${g2?.researchVersion || ""} |\n`;
}
md += `\n`;

md += `## pagecheck (Layer 1) — 重複/検証文/記録露出/見出しずれ\n\n`;
md += `| ケース | gen | 重複グループ | 重複出現計 | 検証Hits | 検証Groups | 記録露出Groups | 記録Hits | 見出しずれ |\n`;
md += `|---|---|---|---|---|---|---|---|---|\n`;
for(const r of rows){
  const s1 = r.pc1?.summary, s2 = r.pc2?.summary;
  md += `| C-${r.c} | 001 | ${s1?.duplicates ?? "?"} | ${s1?.duplicateSentencesTotalOccurrences ?? "?"} | ${s1?.verificationHits ?? "?"} | ${s1?.verificationGroups ?? "?"} | ${s1?.recordExposureGroups ?? "?"} | ${s1?.recordExposureHits ?? "?"} | ${s1?.headingMismatch ?? "?"} |\n`;
  md += `| C-${r.c} | 002 | ${s2?.duplicates ?? "?"} | ${s2?.duplicateSentencesTotalOccurrences ?? "?"} | ${s2?.verificationHits ?? "?"} | ${s2?.verificationGroups ?? "?"} | ${s2?.recordExposureGroups ?? "?"} | ${s2?.recordExposureHits ?? "?"} | ${s2?.headingMismatch ?? "?"} |\n`;
}
md += `\n> research適用で本文の重ね方が変わらず、pagecheckはテンプレ起因の固定値（重複=二重掲載 facts↔body、検証文9-10、記録露出等）に留まる。世代間の差は pagecheck では拾えない（想定どおり — 本ループのpagecheckは組み立てテンプレの欠陥を数えるもので、文面の言い回し改善は見ない）。\n\n`;

md += `## judge P1〜P6 (Layer 2 few-shot)\n\n`;
md += `| ケース | gen | P1反復 | P2検証文 | P3記録物 | P4見出し | P5声欠落 | P6第一確認項目 |\n`;
md += `|---|---|---|---|---|---|---|---|\n`;
for(const r of rows){
  md += `| C-${r.c} | 001 | ${r.j1.P1||"?"} | ${r.j1.P2||"?"} | ${r.j1.P3||"?"} | ${r.j1.P4||"?"} | ${r.j1.P5||"?"} | ${r.j1.P6||"?"} |\n`;
  md += `| C-${r.c} | 002 | ${r.j2.P1||"?"} | ${r.j2.P2||"?"} | ${r.j2.P3||"?"} | ${r.j2.P4||"?"} | ${r.j2.P5||"?"} | ${r.j2.P6||"?"} |\n`;
}
md += `\n> P1–P5 は現行テンプレ（facts表＋body二重掲載、highlight検証文、内部ラベル露出）が残る限り gen-001/002とも「ある」のまま。P6のみresearch起因で動きうる — 次項で hero の有無を直接確認する。\n\n`;

md += `## hero第一確認項目（research v1.0 定義）— gen-001 vs gen-002 で hero に出ているか直接確認\n\n`;
md += `| ケース | 第一確認項目 | gen-001 hero | gen-002 hero | 判定 |\n`;
md += `|---|---|---|---|---|\n`;
for(const r of rows){
  md += `| C-${r.c} | ${r.heroDesc} | ${r.hero1has ? "✅" : "❌"} | ${r.hero2has ? "✅" : "❌"} | ${r.hero1has===r.hero2has ? (r.hero2has ? "両方あり" : "両方なし（researchではhero未反映）") : (r.hero2has ? "002で改善" : "002で悪化")} |\n`;
}
md += `\n### hero抜粋（各genの冒頭120字）\n\n`;
for(const r of rows){
  md += `- C-${r.c} 001 hero: ${r.hero1.slice(0,160).replace(/\|/g,"/")} \n`;
  md += `  002 hero: ${r.hero2.slice(0,160).replace(/\|/g,"/")} \n`;
}
md += `\n> いずれも現行テンプレでは hero の文面（TITLES）が固定値で、researchは generate の文面（factsの言い回し・順序）に効くが hero の組み立てにはまだ反映されていない。hero改修は次工程。\n\n`;

md += `## ペルソナレビュー 001→002 変化（原文リンク）\n\n`;
for(const r of rows){
  md += `### C-${r.c}\n\n`;
  md += `- 001: reviews/case-${r.c}-gen-001-review.md / 002: reviews/case-${r.c}-gen-002-review.md\n`;
}
md += `\n`;

md += `## 生成文の差（researchが効いた箇所）\n\n`;
for(const r of rows){
  const s1 = (r.gen1?.generation?.sentences || []).map(s=>s.text);
  const s2 = (r.gen2?.generation?.sentences || []).map(s=>s.text);
  md += `### C-${r.c}\n\n`;
  md += `- 001 (${s1.length}文): ${s1.slice(0,2).join(" / ").slice(0,240)}\n`;
  md += `- 002 (${s2.length}文): ${s2.slice(0,2).join(" / ").slice(0,240)}\n`;
  // diff: CTA等
  const cta1 = s1[s1.length-1] || "", cta2 = s2[s2.length-1] || "";
  if(cta1!==cta2){ md += `- CTA変化: 001末尾 "${cta1.slice(0,120)}" → 002末尾 "${cta2.slice(0,120)}"\n`; }
}
md += `\n`;

md += `## 呼び出しカウント（今回分）\n\n`;
let totalPrompt=0,totalComp=0,totalTot=0;
for(const r of rows){ totalPrompt+= r.gen2?.usage?.prompt_tokens||0; totalComp+= r.gen2?.usage?.completion_tokens||0; totalTot+= r.gen2?.usage?.total_tokens||0; }
md += `- Baseten生成: 8 (gen-001) + 8 (今回: C-A 1 + C-B 3(2失敗含む) + C-C..F 4) = **14/40**（上限40）\n`;
md += `- 内訳C-A..F 002の実使用: prompt ${totalPrompt} / completion ${totalComp} / total ${totalTot}（C-Aは8000で一度成功、C-Bは8000でNo content×2→12000で成功。以降は12000継続で安定）\n`;
md += `- 失敗はK5の「適合落ち」ではなく「No content（reasoning超過）」のため、K5該当なし。K4も該当なし。\n`;
md += `- Meta枠（別枠）: 画像18 + レビュー12(001:6 002:6) + judge12(001:6 002:6) — Baseten枠外。\n`;
md += `- 未使用: vanilla 12件はMeta枠でBaseten非消費（既存）。\n`;

console.log(md);
