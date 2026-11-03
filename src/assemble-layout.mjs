// Assemble the complete LP from the CONFIRMED finished image's
// layout (2026-11-04, the user's instruction): the sample is confirmed
// so the finished page can be judged in that composition, so the
// confirmed placement and appeals are used as-is for the assembly —
// the LP is not re-laid-out by a separate process. Blocks follow the
// layout record's message map: hero, title (lead appeal), condition
// cards (first-check facts, verbatim values), explanatory rows (small
// image + its appeal's sentences), details (the remaining appeals and
// facts), call to action. Every generated sentence is placed exactly
// once (verbatim); a sentence no block claims goes to details, never
// dropped. Which sentences serve which appeal is matched on shared
// fact keys / source lines and returned as the appeal coverage, so
// the completion check can fail when an appeal from the original has
// no sentence at all (an important thing in the original must not
// silently fall out of the finished page).

import { existsSync } from "node:fs";
import path from "node:path";
import { FACT_LABEL } from "./page-layout.mjs";

function resolveRoot(root, rel) {
  return path.isAbsolute(rel) ? rel : path.join(root, rel);
}
const esc = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function matchAppealSentences(generation, appeals) {
  const sentences = generation && Array.isArray(generation.sentences) ? generation.sentences : [];
  const byAppeal = new Map();
  const bySentence = new Map();
  for (const a of appeals ?? []) {
    const keys = new Set(a?.factKeys ?? []);
    const lines = new Set(a?.sourceLines ?? []);
    const idxs = [];
    sentences.forEach((s, idx) => {
      const hit = (s?.factKeys ?? []).some((k) => keys.has(k)) || (s?.sourceLines ?? []).some((l) => lines.has(l));
      if (hit) {
        idxs.push(idx);
        if (!bySentence.has(idx)) bySentence.set(idx, []);
        bySentence.get(idx).push(a.id);
      }
    });
    byAppeal.set(a.id, idxs);
  }
  return { byAppeal, bySentence };
}

export function assembleFromLayout({ root, generation, images, lpDir, heroChips, layout, planning, facts }) {
  const sentences = generation && Array.isArray(generation.sentences) ? generation.sentences : [];
  const appeals = planning?.appeals ?? [];
  const { byAppeal } = matchAppealSentences(generation, appeals);
  const appealCoverage = appeals.map((a) => ({ appealId: a.id, sentenceIdxs: byAppeal.get(a.id) ?? [] }));
  const factByKey = new Map((facts?.items ?? []).map((i) => [i.key, i]));
  const existing = new Set();
  const skipped = [];
  for (const img of images ?? []) {
    let ok = false;
    try { ok = existsSync(resolveRoot(root, img.file)); } catch { ok = false; }
    if (ok) existing.add(img.id);
    else skipped.push(img.file);
  }
  const lpDirAbs = resolveRoot(root, lpDir);
  const srcFor = (img) => path.relative(lpDirAbs, resolveRoot(root, img.file)).split(path.sep).join("/");
  const placed = new Set();
  const placedFiles = [];
  const sentenceHtml = (idx) => {
    if (placed.has(idx)) return "";
    placed.add(idx);
    return `<p class="lp-sentence" data-sentence="${idx}">${esc(sentences[idx]?.text ?? "")}</p>`;
  };
  const appealSentences = (appealId) => (byAppeal.get(appealId) ?? []).map(sentenceHtml).join("");
  const imgById = new Map((images ?? []).map((i) => [i.id, i]));

  let body = "";
  const blocks = Array.isArray(layout?.messageMap) ? layout.messageMap : [];
  let cardBuffer = [];
  const flushCards = () => {
    if (cardBuffer.length === 0) return;
    body += `<section class="cards">${cardBuffer.join("")}<div class="clear"></div></section>\n`;
    cardBuffer = [];
  };
  for (const block of blocks) {
    const carries = block?.carries ?? {};
    if (block.block === "condition-card") {
      const item = factByKey.get(carries.factKey);
      const label = FACT_LABEL[carries.factKey] ?? carries.factKey ?? "";
      const value = item && item.status === "stated" ? item.value : "";
      cardBuffer.push(`<div class="card"><div class="card-label">${esc(label)}</div><div class="card-value">${esc(value)}</div>${carries.appealId ? appealSentences(carries.appealId) : ""}</div>`);
      continue;
    }
    flushCards();
    if (block.block === "hero-photo") {
      const hero = imgById.get("hero");
      if (hero && existing.has(hero.id)) {
        const chips = Array.isArray(heroChips) && heroChips.length > 0
          ? `<div class="hero-chips">${heroChips.map((c) => `<span class="hero-chip">${esc(c)}</span>`).join("")}</div>`
          : "";
        body += `<section class="lp-hero"><img src="${esc(srcFor(hero))}" alt="hero">${chips}</section>\n`;
        placedFiles.push(hero.file);
      }
    } else if (block.block === "title") {
      const inner = carries.appealId ? appealSentences(carries.appealId) : "";
      if (inner) body += `<section class="title-block">${inner}</section>\n`;
    } else if (block.block === "photo-band") {
      const img = carries.specId ? imgById.get(carries.specId) : null;
      const text = carries.basis?.appealId ? appealSentences(carries.basis.appealId) : "";
      const fig = img && existing.has(img.id) ? `<img class="inline-photo" src="${esc(srcFor(img))}" alt="${esc(img.id)}">` : "";
      if (img && existing.has(img.id)) placedFiles.push(img.file);
      if (fig || text) body += `<section class="explain-row">${fig}<div class="explain-text">${text}</div><div class="clear"></div></section>\n`;
    } else if (block.block === "details") {
      let inner = "";
      for (const id of carries.appealIds ?? []) inner += appealSentences(id);
      sentences.forEach((s, idx) => {
        if ((s?.factKeys ?? []).some((k) => (carries.factKeys ?? []).includes(k))) inner += sentenceHtml(idx);
      });
      if (inner) body += `<section class="details">${inner}</section>\n`;
    } else if (block.block === "cta") {
      body += `<footer class="cta"><button class="cta-button" type="button">応募する</button></footer>\n`;
    }
  }
  flushCards();
  // Nothing is dropped: any sentence no block claimed goes to a final
  // details section (the completion check C1 also verifies presence).
  let rest = "";
  sentences.forEach((s, idx) => { rest += sentenceHtml(idx); });
  if (rest) body += `<section class="details">${rest}</section>\n`;
  if (!blocks.some((b) => b.block === "cta")) body += `<footer class="cta"><button class="cta-button" type="button">応募する</button></footer>\n`;
  // Images no block claimed are appended (existence/reference is C2).
  for (const img of images ?? []) {
    if (existing.has(img.id) && !placedFiles.includes(img.file)) {
      body += `<figure class="lp-image"><img src="${esc(srcFor(img))}" alt="${esc(img.id)}"></figure>\n`;
      placedFiles.push(img.file);
    }
  }
  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>完成LP（デモ）</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#dde4ee;font-family:sans-serif;padding:24px 0;color:#222}
.page{max-width:480px;margin:0 auto;background:#fff;border-radius:26px;box-shadow:0 10px 34px rgba(23,42,66,.18);overflow:hidden}
.lp-hero img{width:100%;display:block}
.hero-chips{padding:12px 18px 0}.hero-chip{display:inline-block;background:#eef3f8;border-radius:999px;padding:4px 12px;margin:0 8px 8px 0;font-size:13px}
.title-block{background:#173550;margin:18px 34px 0;border-radius:20px;padding:24px 26px}
.title-block .lp-sentence{color:#fff;margin:0;line-height:1.7}
.cards{padding:20px 18px 6px}
.card{float:left;width:48%;border-radius:18px;box-shadow:0 4px 16px rgba(23,42,66,.10);padding:16px 14px;margin:0 0 14px}
.card:nth-child(odd){margin-right:4%}
.card-label{font-size:12px;color:#5a6b7d}.card-value{font-size:19px;font-weight:700;margin:2px 0 6px}
.card .lp-sentence{font-size:13px;margin:0;line-height:1.6}
.explain-row{padding:14px 18px 0}
.inline-photo{float:left;width:38%;border-radius:16px}
.explain-text{float:right;width:58%}
.explain-text .lp-sentence{margin:0 0 8px;line-height:1.7}
.details{padding:16px 26px 6px}
.details .lp-sentence{margin:0 0 10px;line-height:1.7}
.clear{clear:both}
.cta{background:#173550;padding:24px 30px 30px;text-align:center;margin-top:18px}
.cta-button{background:#f2762e;color:#fff;border:none;border-radius:999px;padding:14px 44px;font-size:16px;width:56%}
.lp-image img{max-width:100%}
</style>
</head>
<body>
<main class="page">
${body}</main>
</body>
</html>
`;
  return { html, referenced: placedFiles, skipped, assignments: { appealCoverage } };
}
