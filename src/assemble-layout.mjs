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
import { FACT_LABEL, FACT_LABEL_EN } from "./page-layout.mjs";

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
  // The work-content sentence: it cites an original line, carries no
  // FACT key, and its line is claimed by no appeal. It is the page's
  // headline (the job itself), placed by the title block.
  const appealLines = new Set(appeals.flatMap((a) => a?.sourceLines ?? []));
  const workIdx = sentences.findIndex((s) => (s?.factKeys ?? []).length === 0 && (s?.sourceLines ?? []).length > 0 && (s?.sourceLines ?? []).some((l) => !appealLines.has(l)));
  // Appeals that have a photo band: their sentences belong to the
  // band, not to a condition card (whichever comes first in the
  // block order, a card must not take the band's text and leave the
  // band mute — run25's transport band, 2026-11-04).
  const bandAppealIds = new Set((Array.isArray(layout?.messageMap) ? layout.messageMap : []).filter((b) => b?.block === "photo-band" && b?.carries?.basis?.appealId).map((b) => b.carries.basis.appealId));
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
    body += `<section class="cards">${cardBuffer.join("")}</section>\n`;
    cardBuffer = [];
  };
  for (const block of blocks) {
    const carries = block?.carries ?? {};
    if (block.block === "condition-card") {
      const item = factByKey.get(carries.factKey);
      const label = (layout?.language === "en" ? FACT_LABEL_EN : FACT_LABEL)[carries.factKey] ?? carries.factKey ?? "";
      const value = item && item.status === "stated" ? item.value : "";
      cardBuffer.push(`<div class="card"><div class="card-label">${esc(label)}</div><div class="card-value">${esc(value)}</div>${carries.appealId && !bandAppealIds.has(carries.appealId) ? appealSentences(carries.appealId) : ""}</div>`);
      continue;
    }
    flushCards();
    if (block.block === "hero-photo") {
      const hero = imgById.get("hero");
      if (hero && existing.has(hero.id)) {
        const chips = Array.isArray(heroChips) && heroChips.length > 0
          ? `<div class="hero-chips">${heroChips.map((c) => `<span class="hero-chip">${esc(c)}</span>`).join("")}</div>`
          : "";
        body += `<section class="lp-hero"><img src="${esc(srcFor(hero))}" alt="">${chips}</section>\n`;
        placedFiles.push(hero.file);
      }
    } else if (block.block === "title") {
      let inner = "";
      if (carries.workContent && workIdx >= 0) inner = sentenceHtml(workIdx);
      if (!inner && carries.appealId) inner = appealSentences(carries.appealId);
      if (inner) body += `<section class="title-block">${inner}</section>\n`;
    } else if (block.block === "photo-band") {
      const img = carries.specId ? imgById.get(carries.specId) : null;
      let text = carries.basis?.appealId ? appealSentences(carries.basis.appealId) : "";
      if (!text && carries.basis?.factKey) {
        sentences.forEach((s, idx) => {
          if ((s?.factKeys ?? []).includes(carries.basis.factKey)) text += sentenceHtml(idx);
        });
      }
      const fig = img && existing.has(img.id) ? `<img class="inline-photo" src="${esc(srcFor(img))}" alt="">` : "";
      if (img && existing.has(img.id)) placedFiles.push(img.file);
      // A band whose sentences were claimed by a condition card
      // renders its image without an (empty) text box: an empty
      // explain-text div reads as an unfinished page (independent
      // review of run20, 2026-11-04).
      if (fig || text) body += `<section class="explain-row">${fig}${text ? `<div class="explain-text">${text}</div>` : ""}<div class="clear"></div></section>\n`;
    } else if (block.block === "appeal-row") {
      const text = carries.appealId ? appealSentences(carries.appealId) : "";
      if (text) body += `<section class="appeal-row"><div class="appeal-text">${text}</div></section>\n`;
    } else if (block.block === "details") {
      let inner = "";
      for (const id of carries.appealIds ?? []) inner += appealSentences(id);
      sentences.forEach((s, idx) => {
        if ((s?.factKeys ?? []).some((k) => (carries.factKeys ?? []).includes(k))) inner += sentenceHtml(idx);
      });
      if (inner) body += `<section class="details">${inner}</section>\n`;
    } else if (block.block === "cta") {
      body += `<footer class="cta"><button class="cta-button" type="button">${layout?.language === "en" ? "Apply" : "応募する"}</button></footer>\n`;
    }
  }
  flushCards();
  // Nothing is dropped: any sentence no block claimed goes to a final
  // details section (the completion check C1 also verifies presence).
  // Details belong before the call to action in the confirmed
  // composition, so a CTA already emitted is moved after them.
  let rest = "";
  sentences.forEach((s, idx) => { rest += sentenceHtml(idx); });
  if (rest) {
    const ctaHtml = `<footer class="cta"><button class="cta-button" type="button">${layout?.language === "en" ? "Apply" : "応募する"}</button></footer>\n`;
    if (body.includes(ctaHtml)) {
      body = body.replace(ctaHtml, "");
      body += `<section class="details">${rest}</section>\n` + ctaHtml;
    } else {
      body += `<section class="details">${rest}</section>\n`;
    }
  }
  if (!blocks.some((b) => b.block === "cta")) body += `<footer class="cta"><button class="cta-button" type="button">${layout?.language === "en" ? "Apply" : "応募する"}</button></footer>\n`;
  // Images no block claimed are appended (existence/reference is C2).
  for (const img of images ?? []) {
    if (existing.has(img.id) && !placedFiles.includes(img.file)) {
      body += `<figure class="lp-image"><img src="${esc(srcFor(img))}" alt=""></figure>\n`;
      placedFiles.push(img.file);
    }
  }
  const pal = layout?.design?.palette ?? { titleBg: "#173550", accent: "#f2762e" };
  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>完成LP（デモ）</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#fff;font-family:sans-serif;color:#222;font-size:15px}
.page{max-width:480px;margin:0 auto;background:#fff}
.lp-hero img{width:100%;display:block;aspect-ratio:16/10;object-fit:cover}
.hero-chips{padding:14px 20px 0}.hero-chip{display:inline-block;background:#eef3f8;border-radius:999px;padding:5px 12px;margin:0 8px 8px 0;font-size:13px}
.title-block{background:${pal.titleBg};padding:40px 24px 44px}
.title-block .lp-sentence{color:#fff;margin:0;font-size:26px;font-weight:700;line-height:1.5}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:28px 20px 0}
.card{border-radius:16px;box-shadow:0 4px 16px rgba(23,42,66,.10);padding:18px 16px}
.card:last-child:nth-child(odd){grid-column:1/-1}
.card-label{font-size:12px;color:#5a6b7d}.card-value{font-size:20px;font-weight:700;margin:3px 0 7px}
.card .lp-sentence{font-size:13px;margin:0;line-height:1.7}
.explain-row{display:flex;gap:16px;padding:28px 20px 0}
.inline-photo{flex:0 0 38%;width:38%;border-radius:14px;aspect-ratio:4/3;object-fit:cover}
.explain-text{flex:1}
.explain-text .lp-sentence{margin:0 0 8px;line-height:1.8;font-size:15px}
.appeal-row{padding:28px 20px 0}
.appeal-text{border:1px solid #e3e7eb;border-radius:14px;padding:16px 18px}
.appeal-text .lp-sentence{margin:0 0 8px;line-height:1.8}
.appeal-text .lp-sentence:last-child{margin-bottom:0}
.details{padding:28px 24px 8px}
.details .lp-sentence{margin:0 0 12px;line-height:1.8}
.clear{clear:both}
.cta{background:${pal.titleBg};padding:28px 24px 36px;text-align:center;margin-top:32px}
.cta-button{background:${pal.accent};color:#fff;border:none;border-radius:999px;padding:15px 44px;font-size:16px;min-width:56%}
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
