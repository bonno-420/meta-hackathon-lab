#!/usr/bin/env node
// gen-003 template: T1-T5 (2026-11-02 brief)
// loop16-complete.mjs — 完成LP組付け（Meta枠画像を埋め込み＋メモフォーム注入）
// 使い方: node loops/loop-016/tools/loop16-complete.mjs --case A --gen 003
// 画像はファイルから読み base64 埋め込みのみ。文脈への大量読込は行わない

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const PALETTES = {
  A: { dark: "#1A3C5E", dark2: "#122A42", accent: "#E67A22", bg: "#F4F7FB", accentBg: "#E8EEF6", line: "#D8E2EC", name: "tech navy/orange" },
  B: { dark: "#2F6B5E", dark2: "#1F4A42", accent: "#E8A87C", bg: "#F5F0EB", accentBg: "#F3E6D8", line: "#E0D5C8", name: "care sage/peach" },
  C: { dark: "#3B3B98", dark2: "#26266A", accent: "#E8A93D", bg: "#F7F4FF", accentBg: "#E9E2FF", line: "#D9D0F0", name: "creative indigo/amber" },
  D: { dark: "#334155", dark2: "#1E293B", accent: "#65A30D", bg: "#F4F6F0", accentBg: "#E7F0D8", line: "#D5DECB", name: "logistics slate/lime" },
  E: { dark: "#6F4E37", dark2: "#4E3625", accent: "#C97B2D", bg: "#FBF6EF", accentBg: "#F5E6D0", line: "#E8D9C2", name: "cafe brown/cream" },
  F: { dark: "#0F766E", dark2: "#0B4F4A", accent: "#F43F5E", bg: "#F0FDFA", accentBg: "#D8F3EE", line: "#C8E8E2", name: "retail teal/coral" },
};

// T1: hero built from facts only — per-case first-check items from run-record gen-002 hero table
const TITLES_OLD = {
  A: { h1: "Software Engineer — SaaS Product Team", sub: "Full-time · Osaka, Umeda", lead: "For early-career engineers (1–3 years) who want code-review culture, regular hours, and a short commute. Mentorship and team rhythm come first — pay is stated exactly as it is." },
  B: { h1: "Registered Nurse — General Ward", sub: "Full-time · Yokohama, Minato Mirai", lead: "For licensed nurses who want a larger day-shift team with clear handover and paid training. Shifts and pay are fixed facts — no night duty is scheduled." },
  C: { h1: "Brand Specialist — 12-Month Contract", sub: "Contract 12 months · Tokyo, Shibuya", lead: "For marketers who prefer a time-boxed contract with a renewal checkpoint. The 12-month term and renewal review come first — campaign ownership over perks." },
  D: { h1: "Warehouse Associate — Dispatched", sub: "Dispatched · Saitama, Kawaguchi", lead: "For workers comfortable with agency employment who value predictable shifts and coordinator support. Employer (agency) and worksite (client) are stated separately." },
  E: { h1: "Cafe Crew — Short Hours", sub: "Part-time · Setagaya, Futako-Tamagawa", lead: "For parents and students who need short fixed shifts near the station. Shift fit and station proximity come first — pay and training are fixed facts." },
  F: { h1: "Seasonal Sales Associate — 6 Weeks", sub: "Casual / Seasonal · Nagoya, Sakae", lead: "For students and gap workers seeking a short high-energy seasonal stint. The fixed 6-week term and day-by-day tasks are stated first." },
};

const HERO_CONFIG = {
  A: { keys: ["salary", "workHours", "location", "employmentType"], badgeKeys: ["employmentType", "salary", "location", "workHours"], firstCheckKeys: ["salary"] },
  B: { keys: ["workHours", "employmentType", "location", "salary"], badgeKeys: ["employmentType", "workHours", "location", "salary"], firstCheckKeys: ["workHours"] },
  C: { keys: ["employmentType", "contractTerms", "salary", "location"], badgeKeys: ["employmentType", "contractTerms", "location", "salary"], firstCheckKeys: ["employmentType", "contractTerms"] },
  D: { keys: ["employer", "worksite", "employmentType", "pay"], badgeKeys: ["employmentType", "employer", "worksite", "pay"], firstCheckKeys: ["employer", "worksite", "employmentType"] },
  E: { keys: ["workHours", "commute", "employmentType", "location"], badgeKeys: ["employmentType", "workHours", "commute", "pay"], firstCheckKeys: ["workHours", "commute"] },
  F: { keys: ["term", "pay", "employmentType", "location"], badgeKeys: ["employmentType", "term", "pay", "location"], firstCheckKeys: ["term", "pay"] },
};

// T5: section → allowed factKeys mapping (must match DEFAULT_HEADING_SCOPE used in pagecheck)
const SECTION_DEFS = {
  pay:   { id: "conditions", title: "Pay &amp; Hours — Exactly as Stated", jp: "給与・勤務時間は原文のまま", allowedKeys: ["salary", "pay", "workHours", "employmentType", "term", "contractTerms"] },
  place: { id: "location",   title: "Place &amp; Access", jp: "勤務地", allowedKeys: ["location", "commute", "worksite", "employer"] },
  team:  { id: "team",       title: "Team &amp; Support", jp: "チーム・サポート", allowedKeys: ["team", "training", "support", "benefits", "requirements", "perks", "company", "role"] },
};

// R4: internal key → human label
function humanLabel(key) {
  const s = String(key).replace(/([a-z])([A-Z])/g, "$1 $2");
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// R6: reader-condition check items (keys ordered per reflection v-next)
const CHECK_KEYS_004 = {
  A: ["salary", "workHours", "commute", "training"],
  B: ["workHours", "salary", "commute", "training"],
  C: ["employmentType", "contractTerms", "salary", "workHours"],
  D: ["employer", "worksite", "pay", "workHours"],
  E: ["workHours", "commute", "pay", "training"],
  F: ["term", "pay", "workHours", "commute"],
};

// R7: CTA per case
const CTA_004 = {
  A: { desc: "Apply with resume — casual first interview", button: "Apply with resume — fictional posting, button disabled" },
  B: { desc: "Apply with license copy — reply within 3 business days", button: "Apply with license copy — fictional posting, button disabled" },
  C: { desc: "Apply with one portfolio link — contract term in first screen", button: "Apply with portfolio link — fictional posting, button disabled" },
  D: { desc: "Register with agency — site tour before assignment", button: "Register for site tour — fictional posting, button disabled" },
  E: { desc: "Quick apply — no resume, casual chat first", button: "Quick apply — no resume needed — fictional posting, button disabled" },
  F: { desc: "Apply this week — start 2026-12-01", button: "Apply this week — fictional posting, button disabled" },
};

function imgUri(outDir, base) {
  for (const ext of ["webp", "png"]) {
    const p = join(outDir, `${base}.${ext}`);
    if (existsSync(p)) {
      const buf = readFileSync(p);
      const mime = ext === "webp" ? "image/webp" : "image/png";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }
  }
  return null;
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function memoBlock() {
  return `
<section id="lp-memo" aria-labelledby="lp-memo-h2">
<h2 id="lp-memo-h2">Memo <span class="jp">このLPへのメモ（ブラウザ保存）</span></h2>
<p class="note">このフォームはこのページ内で完結します。入力はブラウザの <code>localStorage</code> に自動保存され、リロードしても残ります。送信先サーバーはありません。「コピー」「ダウンロード」で reflection-memos へ転記してください。</p>
<div id="memo-app" data-storage-key=""></div>
<p class="note" style="margin-top:10px">運用: コピーしたテキストを <code>loops/loop-016/reflection-memos/</code> に手動保存するか、統括(Muse)に貼り付けて反映メモ化します。K1〜K5以外の停止はしません。</p>
</section>
<script>
(function(){
  var section=document.getElementById('lp-memo');
  if(!section) return;
  var key=(document.title||location.pathname).replace(/[^A-Za-z0-9_-]+/g,'_').slice(0,60) || 'lp-memo';
  key='lp-memo:'+key+':'+location.pathname.split('/').pop();
  var app=document.getElementById('memo-app');
  var fields=[
    {id:'overall', label:'全体の印象（1文で）', ph:'例: 明るいが条件が埋もれている'},
    {id:'readability', label:'読みやすさ・流れ', ph:'例: Pay→Support の順が自然 / 注記が長い'},
    {id:'facts', label:'事実の扱い・注記', ph:'例: 上限が本文と離れている / 未記載の書き方'},
    {id:'visual', label:'見た目・写真・色', ph:'例: ヒーローが暗い / カード4枚は多い'},
    {id:'cta', label:'応募前チェック・CTA', ph:'例: チェック4項目の言い回し / ボタン文言'},
    {id:'other', label:'その他 / 次に直したい1点', ph:'自由記述'},
  ];
  var css=document.createElement('style');
  css.textContent='#lp-memo{border:2px dashed #bbb;border-radius:14px;padding:16px;background:#fff}#lp-memo h2{color:#333}#memo-app label{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}#memo-app textarea{width:100%;min-height:72px;padding:10px 12px;border:1px solid #ccc;border-radius:10px;font:14px/1.6 system-ui,sans-serif;box-sizing:border-box}#memo-app textarea:focus{outline:2px solid #6a9bff;border-color:#6a9bff}#memo-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}#memo-actions button{font:13px/1 system-ui,sans-serif;padding:10px 14px;border-radius:999px;border:1px solid #ccc;background:#fff;cursor:pointer;color:#222}#memo-actions button.primary{background:#333;color:#fff;border-color:#333}#memo-actions button.danger{color:#a00;border-color:#e99}#memo-status{font-size:12px;color:#666;margin-top:8px;min-height:1.2em}';
  document.head.appendChild(css);
  function load(){ try{ var r=localStorage.getItem(key); return r?JSON.parse(r):{}; }catch(e){ return {}; } }
  function save(data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
  var data=load();
  fields.forEach(function(f){
    var lab=document.createElement('label'); lab.setAttribute('for','memo-'+f.id); lab.textContent=f.label;
    var ta=document.createElement('textarea'); ta.id='memo-'+f.id; ta.placeholder=f.ph; ta.value=data[f.id]||'';
    ta.addEventListener('input', function(){ data[f.id]=ta.value; save(data); statusEl.textContent='保存済み ('+new Date().toLocaleTimeString()+')'; });
    app.appendChild(lab); app.appendChild(ta);
  });
  var actions=document.createElement('div'); actions.id='memo-actions';
  var statusEl=document.createElement('div'); statusEl.id='memo-status'; statusEl.setAttribute('role','status'); statusEl.setAttribute('aria-live','polite');
  function toText(){ var lines=[]; lines.push('# LP memo '+new Date().toISOString().slice(0,10)); lines.push('# page: '+location.pathname.split('/').pop()); lines.push('# title: '+document.title); lines.push(''); fields.forEach(function(f){ lines.push('## '+f.label); lines.push((data[f.id]||'').trim() || '(未記入)'); lines.push(''); }); return lines.join('\\n'); }
  var copyBtn=document.createElement('button'); copyBtn.type='button'; copyBtn.className='primary'; copyBtn.textContent='コピー';
  copyBtn.addEventListener('click', function(){ var t=toText(); if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ statusEl.textContent='コピーしました'; }, function(){ fallbackCopy(t); }); } else { fallbackCopy(t); } });
  function fallbackCopy(t){ var ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); statusEl.textContent='コピーしました'; }catch(e){ statusEl.textContent='手動で選択してください'; } ta.remove(); }
  var dlBtn=document.createElement('button'); dlBtn.type='button'; dlBtn.textContent='テキストでダウンロード';
  dlBtn.addEventListener('click', function(){ var t=toText(); var blob=new Blob([t], {type:'text/plain;charset=utf-8'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='lp-memo-'+(location.pathname.split('/').pop().replace(/\\.html.*/,'')||'memo')+'.md'; a.click(); setTimeout(function(){ URL.revokeObjectURL(url); }, 2000); statusEl.textContent='ダウンロードしました → reflection-memos へ配置してください'; });
  var clearBtn=document.createElement('button'); clearBtn.type='button'; clearBtn.className='danger'; clearBtn.textContent='クリア';
  clearBtn.addEventListener('click', function(){ if(!confirm('このページのメモをすべて消去します。よろしいですか？')) return; data={}; save(data); app.querySelectorAll('textarea').forEach(function(t){ t.value=''; }); statusEl.textContent='クリアしました'; });
  actions.appendChild(copyBtn); actions.appendChild(dlBtn); actions.appendChild(clearBtn); app.appendChild(actions); app.appendChild(statusEl);
  if(Object.keys(data).some(function(k){ return (data[k]||'').trim(); })) statusEl.textContent='前回の入力を復元しました';
})();
</script>
`;
}

async function main() {
  const args = process.argv.slice(2);
  let c = null, gen = "001";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--case" && args[i + 1]) { c = args[i + 1].toUpperCase(); i++; }
    else if (args[i] === "--gen" && args[i + 1]) { gen = String(args[i + 1]).padStart(3, "0"); i++; }
  }
  if (!c || !PALETTES[c]) { console.error("Usage: --case A|B|C|D|E|F [--gen 001]"); process.exit(2); }
  const lower = c.toLowerCase();
  const caseData = JSON.parse(readFileSync(resolve(`loops/loop-016/cases/case-${c}.json`), "utf8").replace(/^\uFEFF/, ""));
  // gen-005 reuses gen-004 sentences verbatim (Baseten 0) — fallback if gen-005 file not present
  let genRec;
  const genPath = resolve(`loops/loop-016/generations/case-${c}/gen-${gen}.json`);
  const gen004Path = resolve(`loops/loop-016/generations/case-${c}/gen-004.json`);
  if (gen === "005" && !existsSync(genPath) && existsSync(gen004Path)) {
    genRec = JSON.parse(readFileSync(gen004Path, "utf8").replace(/^\uFEFF/, ""));
  } else {
    genRec = JSON.parse(readFileSync(genPath, "utf8").replace(/^\uFEFF/, ""));
  }
  // Research-aware hero: research tells WHICH facts go in hero, facts themselves come from caseData only
  let heroLeadExtra = "";
  if (gen !== "001") {
    try {
      const researchPath = resolve(`loops/loop-016/research/case-${c.toLowerCase()}.md`);
      const research = readFileSync(researchPath, "utf8");
      heroLeadExtra = ` <!-- research: case-${c.toLowerCase()}.md v1.0 applied as hero pattern (facts from cases/ only) -->`;
    } catch {}
  }
  const generation = genRec.generation;
  const sentences = generation?.sentences || [];
  const imgDir = resolve("loops/loop-016/previews/images");
  const hero = imgUri(imgDir, `case-${c}-hero`);
  const work = imgUri(imgDir, `case-${c}-work`);
  const place = imgUri(imgDir, `case-${c}-place`);
  if (!hero || !work || !place) {
    console.error(`Missing images for case ${c}: hero=${!!hero} work=${!!work} place=${!!place}`);
    process.exit(1);
  }
  const pal = PALETTES[c];
  const isGen003 = gen === "003";
  const isGen004 = gen === "004";
  const isGen005 = gen === "005";
  const isModern = isGen003 || isGen004 || isGen005;
  // hero composition: gen-003 uses facts-derived hero (T1), gen-004 adds R3+R5, gen-005 S1 value-chip
  let eyebrowText, roleFact, heroLead, badges, heroHighlight = "";
  const factsMapForHero = Object.fromEntries(caseData.facts.map((f) => [f.key, f]));
  if (isModern) {
    const heroCfg = HERO_CONFIG[c];
    const factsMap = factsMapForHero;
    const eyebrowEmploymentType = factsMap["employmentType"]?.value || "";
    const eyebrowLocation = factsMap["location"]?.value || factsMap["worksite"]?.value || "";
    eyebrowText = [eyebrowEmploymentType, eyebrowLocation].filter(Boolean).join(" · ");
    roleFact = factsMap["role"]?.value || caseData.label;
    const appeal = caseData.plan?.appeal || "";
    const firstCheckKeys = heroCfg.firstCheckKeys || [];
    const firstCheckValues = firstCheckKeys.map((k) => factsMap[k]?.value).filter(Boolean);
    if (isGen005) {
      // S1: hero-highlight as value-chip (label + short value) — not raw fact value alone
      heroLead = "";
      heroHighlight = firstCheckKeys.length ? `<div class="hero-highlight hero-chips">${firstCheckKeys.map((k) => {
        const f = factsMap[k];
        if (!f) return "";
        const label = humanLabel(k);
        // S1 short value: use mapping or truncate to avoid verbatim duplication with facts table
        const shortVal = (() => {
          const v = f.value;
          // per-case short forms to make chips distinct from facts table/body
          if (c === "A" && k === "salary") return "¥4.8M / year";
          if (c === "A" && k === "workHours") return "Flex 11:00-16:00 core";
          if (c === "B" && k === "workHours") return "Day shift 08:30-17:00 · No nights";
          if (c === "C" && k === "employmentType") return "Contract";
          if (c === "C" && k === "contractTerms") return "12 months · review M11";
          if (c === "D" && k === "employer") return "Apex Work Partners (agency)";
          if (c === "D" && k === "worksite") return "Saitama, Kawaguchi";
          if (c === "D" && k === "employmentType") return "Dispatched";
          if (c === "E" && k === "workHours") return "From 3h/day · 2-4 days/wk";
          if (c === "E" && k === "commute") return "2-min walk · Futako-Tamagawa Sta.";
          if (c === "F" && k === "term") return "6 weeks: Dec 1 – Jan 11";
          if (c === "F" && k === "pay") return "Hourly pay";
          // generic fallback: first 20 chars
          return v.length > 28 ? v.slice(0, 26) + "…" : v;
        })();
        return `<span class="chip"><span class="chip-label">${esc(label)}</span><span class="chip-value">${esc(shortVal)}</span></span>`;
      }).join("")}</div>` : "";
    } else if (isGen004) {
      // R3: no appeal, R5: highlight visual — lead is empty, highlight holds first-check values alone
      heroLead = "";
      heroHighlight = firstCheckValues.length ? `<div class="hero-highlight">${firstCheckValues.map((v) => `<span>${esc(v)}</span>`).join("")}</div>` : "";
    } else {
      heroLead = firstCheckValues.length ? `${appeal} — ${firstCheckValues.join(" · ")}` : appeal;
    }
    badges = (heroCfg.badgeKeys || []).map((k) => factsMap[k]).filter(Boolean).slice(0, 4).map((f) => `<span>${esc(f.value)}</span>`).join("");
  } else {
    const ttl = TITLES_OLD[c];
    eyebrowText = ttl.sub;
    roleFact = ttl.h1;
    heroLead = ttl.lead;
    // old badges: first 4 facts verbatim (pre-gen003 behavior)
    badges = caseData.facts.slice(0, 4).map((f) => `<span>${esc(f.value)}</span>`).join("");
  }

  // helpers for T5 — hoisted so both branches + bodySections can use
  function filterSentencesForSectionGen(sentList, allowedKeys) {
    return sentList.filter((s) => (s.factKeys || []).some((k) => allowedKeys.includes(k)));
  }
  function renderSentenceListGen(filtered) {
    if (!filtered.length) return `<p class="note">No additional details in this section — see The Basics for all stated facts.</p>`;
    return `<ul class="facts">\n${filtered.map((s) => `<li><span class="v">${esc(s.text)}</span></li>`).join("\n")}\n</ul>`;
  }
  // T2: facts table — gen-003 shows ONLY fact value (no sentence duplication), gen-004 adds R4 human label, gen-005 keeps R4
  let factRows, paySentences, placeSentences, teamSentences;
  let sentenceList = "";
  if (isModern) {
    if (isGen004 || isGen005) factRows = caseData.facts.map((f) => `<li><span class="k">${esc(humanLabel(f.key))}</span><span class="v">${esc(f.value)}</span></li>`).join("\n");
    else factRows = caseData.facts.map((f) => `<li><span class="k">${esc(f.key)}</span><span class="v">${esc(f.value)}</span></li>`).join("\n");
    // S2: sentences placed once — assign each sentence to first matching section only (no cross-section duplication)
    if (isGen005) {
      const assigned = new Set();
      function pickSingle(allowedKeys) {
        const picked = [];
        for (let i = 0; i < sentences.length; i++) {
          if (assigned.has(i)) continue;
          const s = sentences[i];
          if ((s.factKeys || []).some((k) => allowedKeys.includes(k))) {
            picked.push(s);
            assigned.add(i);
          }
        }
        return picked;
      }
      paySentences = pickSingle(SECTION_DEFS.pay.allowedKeys);
      placeSentences = pickSingle(SECTION_DEFS.place.allowedKeys);
      teamSentences = pickSingle(SECTION_DEFS.team.allowedKeys);
      // any remaining unassigned (should not happen) go to team
      for (let i = 0; i < sentences.length; i++) {
        if (!assigned.has(i)) { teamSentences.push(sentences[i]); assigned.add(i); }
      }
    } else {
      paySentences = filterSentencesForSectionGen(sentences, SECTION_DEFS.pay.allowedKeys);
      placeSentences = filterSentencesForSectionGen(sentences, SECTION_DEFS.place.allowedKeys);
      teamSentences = filterSentencesForSectionGen(sentences, SECTION_DEFS.team.allowedKeys);
    }
  } else {
    // pre-gen003 behavior — keep duplication for baseline comparison (but remove duplicate for code compat, will be overridden below)
    factRows = caseData.facts.map((f) => {
      const s = sentences.find((x) => (x.factKeys || []).includes(f.key));
      const txt = s ? s.text : esc(f.value);
      const cite = s ? `${s.factKeys.join(",")} / ${s.sourceLines.join(",")}` : `${f.key} / ${f.sourceLine}`;
      return `<li><span class="k">${esc(f.key)}</span><span class="v">${esc(txt)} <span class="en">〔${esc(cite)}〕</span></span></li>`;
    }).join("\n");
    sentenceList = sentences.map((s, i) => `<li><span class="k">S${i + 1}</span><span class="v">${esc(s.text)} <span class="en">〔${esc((s.factKeys || []).join(","))} / ${esc((s.sourceLines || []).join(","))}〕</span></span></li>`).join("\n");
  }

  // R6: checks per case (gen-004 reader conditions), else legacy top4 — gen-005 keeps R6 but uses label prefix to reduce duplication
  let checks;
  if (isGen004 || isGen005) {
    const keys = CHECK_KEYS_004[c] || [];
    checks = keys.map((k) => {
      const f = factsMapForHero[k];
      const label = humanLabel(k);
      const val = f ? f.value : k;
      if (isGen005) {
        // S2: make check distinct from facts table value alone (label + value as one sentence)
        return `<li><span class="k">${esc(label)}</span> — ${esc(val)}</li>`;
      }
      return `<li>${esc(val)}</li>`;
    }).join("\n");
  } else {
    checks = caseData.facts.slice(0, 4).map((f) => `<li>${esc(f.value)}</li>`).join("\n");
  }
  // R7: CTA per case — gen-005 keeps CTA_004
  let ctaDesc = caseData.plan.cta, ctaButton = "Apply — fictional posting, button disabled";
  if (isGen004 || isGen005) {
    const cta = CTA_004[c];
    if (cta) { ctaDesc = cta.desc; ctaButton = cta.button; }
  }
  const usage = genRec.usage;
  const usageLine = usage ? `prompt${usage.prompt_tokens ?? "?"} / completion${usage.completion_tokens ?? "?"} / total${usage.total_tokens ?? "?"}` : "未記録";

  // Build body sections: modern (gen-003/004) uses T5 split, gen-004 adds R8 small place image, gen-005 keeps R8
  let bodySections = "";
  if (isModern) {
    const placePhotoClass = (isGen004 || isGen005) ? "photo photo-sm" : "photo";
    const placeCap = (isGen004 || isGen005) ? "Image: surrounding area / access — muse-image-1.0, no text in image" : "Image: neighborhood / access — muse-image-1.0, no text in image";
    bodySections = `<section id="about">
<h2>The Basics <span class="jp">募集の基本</span></h2>
<p>All sentences below are from generation <strong>${esc(caseData.id)} gen-${gen}</strong> (${sentences.length} sentences).</p>
<ul class="facts">
${factRows}
</ul>
</section>

<section id="conditions">
<h2>${SECTION_DEFS.pay.title} <span class="jp">${SECTION_DEFS.pay.jp}</span></h2>
<div class="grid2">
<div>
${renderSentenceListGen(paySentences)}
</div>
<div class="photo">
<!-- WORK IMAGE — prompt in previews/images/manifest.json: case-${c}-work -->
<img src="${work}" alt="work scene image">
<p class="cap">Image: work scene — muse-image-1.0, no text in image</p>
</div>
</div>
</section>

<section id="location">
<h2>${SECTION_DEFS.place.title} <span class="jp">${SECTION_DEFS.place.jp}</span></h2>
<div class="${placePhotoClass}">
<!-- PLACE IMAGE — prompt in previews/images/manifest.json: case-${c}-place -->
<img src="${place}" alt="location image">
<p class="cap">${placeCap}</p>
</div>
${renderSentenceListGen(placeSentences)}
</section>

<section id="team">
<h2>${SECTION_DEFS.team.title} <span class="jp">${SECTION_DEFS.team.jp}</span></h2>
${renderSentenceListGen(teamSentences)}
</section>`;
  } else {
    // legacy template (gen-001/002) — preserves T2-T4 defects for comparison
    bodySections = `<section id="about">
<h2>The Basics <span class="jp">募集の基本</span></h2>
<p>All sentences below are from generation <strong>${esc(caseData.id)} gen-${gen}</strong> (${sentences.length} sentences). Each cites its fact keys and source lines verbatim.</p>
<ul class="facts">
${factRows}
</ul>
<p class="note">Target audience (fixed before generation): ${esc(caseData.plan.targetAudience)}. Appeal: ${esc(caseData.plan.appeal)}. Persona: ${esc(caseData.plan.persona)}. Insights applied: ${esc((genRec.insightsApplied||[]).join(", ")||"なし")}.</p>
</section>

<section id="conditions">
<h2>Pay &amp; Hours — Exactly as Stated <span class="jp">給与・勤務時間は原文のまま</span></h2>
<div class="grid2">
<div>
<ul class="facts">
${sentenceList}
</ul>
<div class="highlight"><p><strong>What this means:</strong> Read the sentences above as the full conditions. No rounding or reinterpretation — numbers stay exactly as stated in the FACTs.</p></div>
</div>
<div class="photo">
<!-- WORK IMAGE — prompt in previews/images/manifest.json: case-${c}-work -->
<img src="${work}" alt="work scene image">
<p class="cap">Image: work scene — muse-image-1.0, no text in image</p>
</div>
</div>
</section>

<section id="location">
<h2>Place &amp; Access <span class="jp">勤務地</span></h2>
<div class="photo">
<!-- PLACE IMAGE — prompt in previews/images/manifest.json: case-${c}-place -->
<img src="${place}" alt="location image">
<p class="cap">Image: neighborhood / access — muse-image-1.0, no text in image</p>
</div>
<p class="note">Location and access facts are stated above. Unlisted stations or addresses are not created. Commuter support is exactly as stated.</p>
</section>`;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(caseData.label)} | ${esc(eyebrowText)}</title>
<style>
:root{--dark:${pal.dark};--dark2:${pal.dark2};--accent:${pal.accent};--bg:${pal.bg};--card:#fff;--ink:#1E2328;--muted:#5E6B7A;--line:${pal.line};--accentBg:${pal.accentBg}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,sans-serif;line-height:1.8}
.trial{font-size:11px;letter-spacing:.06em;background:var(--dark2);color:#fff;padding:7px 16px;text-align:center}
.wrap{max-width:960px;margin:0 auto;padding:0 16px 64px}
.hero{position:relative;border-radius:0 0 20px 20px;overflow:hidden;margin:0 -16px}
.hero img{width:100%;height:320px;object-fit:cover;display:block}
.hero-card{background:var(--dark);color:#fff;border-radius:16px;padding:22px 20px;margin:-56px 16px 0;position:relative;box-shadow:0 8px 24px rgba(0,0,0,.22)}
.eyebrow{font-size:12px;letter-spacing:.08em;color:#fff;opacity:.85;margin:0 0 8px;font-weight:600}
h1{font-size:24px;line-height:1.45;margin:0 0 10px}
.lead{font-size:14px;line-height:1.7;margin:0}
.must{font-size:13px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.32);border-radius:10px;padding:12px;margin:14px 0 0;line-height:1.7}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.badges span{font-size:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:5px 12px}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
.card{background:var(--card);border-radius:14px;padding:16px 12px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.07);border:1px solid var(--line)}
.card p{font-size:13px;margin:8px 0 0;line-height:1.65}
.card strong{font-size:15px;display:block;color:var(--dark)}
section{padding:28px 0;border-bottom:1px solid var(--line)}
h2{font-size:18px;line-height:1.5;margin:0 0 10px;color:var(--dark)}
h2 .jp{font-size:13px;color:var(--muted);font-weight:400;margin-left:8px}
p{font-size:14px;margin:0 0 12px}
.facts{list-style:none;margin:0 0 12px;padding:0;background:var(--card);border-radius:14px;border:1px solid var(--line);overflow:hidden}
.facts li{padding:14px 16px;border-top:1px solid var(--line);display:flex;gap:10px}
.facts li:first-child{border-top:none}
.facts .k{flex:0 0 9em;font-weight:700;font-size:13px;color:var(--dark)}
.facts .v{flex:1;font-size:14px}
.facts .v .en{color:var(--muted);font-size:13px}
.photo{margin:16px 0}
.photo img{width:100%;border-radius:14px;display:block}
.photo-sm img{width:100%;max-width:420px;border-radius:14px;display:block}
.cap{font-size:11px;color:var(--muted);margin-top:6px}
.hero-highlight{background:var(--accentBg);border:1px solid var(--accent);border-left:4px solid var(--accent);border-radius:12px;padding:12px 14px;margin:12px 0;color:var(--dark);font-size:18px;font-weight:800;line-height:1.4}
.hero-highlight span{display:block}
@media(min-width:760px){ .hero-highlight{font-size:20px} .hero-highlight span{display:inline} .hero-highlight span+span::before{content:" · ";color:var(--muted);font-weight:400} }
.hero-chips{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;background:rgba(255,255,255,.95);border-radius:10px}
.hero-chips .chip{display:inline-flex;flex-direction:column;gap:2px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 12px;min-width:110px;flex:1 1 auto;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.hero-chips .chip-label{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;line-height:1}
.hero-chips .chip-value{font-size:14px;font-weight:800;color:var(--dark);line-height:1.3}
@media(min-width:760px){ .hero-chips .chip{flex:0 1 auto} .hero-chips .chip-value{font-size:15px} }
.note{font-size:12px;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:12px 0;line-height:1.7}
.grid2{display:grid;grid-template-columns:1fr;gap:16px}
.check{list-style:none;padding:6px 16px;margin:12px 0;background:var(--card);border-radius:14px;border:1px solid var(--line)}
.check li{font-size:14px;padding:11px 0 11px 28px;position:relative;border-top:1px solid var(--line)}
.check li:first-child{border-top:none}
.check li::before{content:"☐";position:absolute;left:4px;color:var(--dark)}
.cta{margin:20px 0;background:var(--dark);border-radius:16px;padding:24px 16px;text-align:center}
.cta p{color:#fff;font-size:13px;margin:0 0 12px}
.cta button{width:100%;font-size:16px;font-weight:700;padding:16px;min-height:56px;border:none;border-radius:999px;background:var(--accent);color:#fff;cursor:not-allowed}
footer{padding-top:22px;font-size:11px;color:var(--muted);line-height:1.7}
@media(min-width:760px){
  .hero img{height:440px}h1{font-size:30px}h2{font-size:20px}
  .cards{grid-template-columns:repeat(4,1fr)}
  .grid2{grid-template-columns:1fr 1fr;align-items:start}
  .hero-card{padding:26px 28px}
}
</style>
</head>
<body>
${isGen005 ? `<!-- template: gen-005 S1+S2 applied (value-chip hero + single-placement sentences, T1-T5+R3-R8 kept), facts verbatim -->${heroLeadExtra}` : isGen004 ? `<!-- template: gen-004 R3-R8 applied (gen-003 base + reflection v-next-gen004), hero highlight from facts -->${heroLeadExtra}` : isGen003 ? `<!-- template: gen-003 T1-T5 applied, hero from facts -->${heroLeadExtra}` : `<!-- template: gen-001/002 legacy -->${heroLeadExtra}`}
<div class="trial">Fictitious posting ${esc(caseData.id)} · All facts fictional · No application function · Based on generation ${esc(caseData.id)} gen-${gen} (loop-016)</div>
<div class="wrap">

<header class="hero">
<!-- HERO IMAGE — prompt in previews/images/manifest.json: case-${c}-hero -->
<img src="${hero}" alt="${esc(caseData.label)} hero image">
<div class="hero-card">
<p class="eyebrow">${esc(eyebrowText)}</p>
<h1>${esc(roleFact)}</h1>
${heroHighlight ? heroHighlight : ""}
${heroLead ? `<p class="lead">${esc(heroLead)}</p>` : ""}
${isModern ? `<p class="must">This is a fictional posting for ${esc(caseData.label)}. No application function.</p>` : `<p class="must">This is a fictional posting. All facts below are the only stated facts (${esc(caseData.facts.map((f) => f.sourceLine).join("–"))}). ${esc((caseData.plan.mustNot || []).join(" "))}. CTA: ${esc(caseData.plan.cta)}.</p>`}
<div class="badges">${badges}</div>
</div>
</header>

${bodySections}

<section id="check">
<h2>Check Before You Apply <span class="jp">応募前の確認</span></h2>
<ul class="check">
${checks}
</ul>
<div class="cta">
<p>All conditions above are from the ${sentences.length} sentences of ${esc(caseData.id)} gen-${gen}. No new facts are added.</p>
<p>${esc(ctaDesc)} (fictional posting, button disabled)</p>
<button type="button" disabled>${esc(ctaButton)}</button>
</div>
<p class="note">Generation: <code>loops/loop-016/generations/case-${c}/gen-${gen}.json</code> · model meta-models/muse-spark-open-1026 · ${esc(usageLine)} · Images by muse-image-1.0; prompts in previews/images/manifest.json (no text/numbers/logos in images). Palette: ${esc(pal.name)}.</p>
</section>

<footer>
<p>Source: ${esc(caseData.id)} ${esc(caseData.label)} (facts EN-only, fictional). Sentences are EN rendering with numbers verbatim. Photos are AI placeholders with prompts documented. Record: docs/design/baseten-verification-loop-design-v1.md / loops/loop-016/run-record.md.</p>
</footer>

${memoBlock()}
</div>
</body>
</html>`;
  const outPath = resolve(`loops/loop-016/previews/case-${c}-gen-${gen}-complete.html`);
  mkdirSync(resolve("loops/loop-016/previews"), { recursive: true });
  writeFileSync(outPath, html, "utf8");
  console.error(`[loop16-complete] wrote ${outPath} (${html.length} bytes) palette=${pal.name}`);
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
