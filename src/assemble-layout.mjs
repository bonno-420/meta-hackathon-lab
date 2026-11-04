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
import { FACT_LABEL, FACT_LABEL_EN, monthlyIncomeExample } from "./page-layout.mjs";

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

export function assembleFromLayout({ root, generation, images, lpDir, heroChips, layout, planning, facts, original }) {
  const sentences = generation && Array.isArray(generation.sentences) ? generation.sentences : [];
  const appeals = planning?.appeals ?? [];
  const { byAppeal, bySentence } = matchAppealSentences(generation, appeals);
  const appealCoverage = appeals.map((a) => ({ appealId: a.id, sentenceIdxs: byAppeal.get(a.id) ?? [] }));
  // The work-content sentence: it cites an original line, carries no
  // FACT key, and its line is claimed by no appeal. It is the page's
  // headline (the job itself), placed by the title block.
  const appealLines = new Set(appeals.flatMap((a) => a?.sourceLines ?? []));
  let workIdx = sentences.findIndex((s) => (s?.factKeys ?? []).length === 0 && (s?.sourceLines ?? []).length > 0 && (s?.sourceLines ?? []).some((l) => !appealLines.has(l)));
  if (workIdx < 0) {
    // First fallback: a planning may make the work itself the lead
    // appeal (FICT-E02: appeal A1 IS the work, and the key-visual
    // spec fronts it). Its sentences are matched to that appeal and
    // its lines are claimed by it, so the rule above misses them.
    // This runs BEFORE the unmatched-sentence fallback: a condition
    // no appeal carries (E02's employment sentence, citing a line
    // no appeal claims) otherwise wins that fallback and becomes
    // the headline (runE2h page review, 2026-11-04).
    const kvAppealId = (planning?.imageSpecs ?? []).find((s) => s?.role === "key-visual")?.basis?.appealId;
    const kvAppeal = appeals.find((a) => a.id === kvAppealId);
    if (kvAppeal && (kvAppeal.factKeys ?? []).length === 0) {
      const idxs = byAppeal.get(kvAppeal.id) ?? [];
      if (idxs.length > 0) {
        // Among the lead appeal's sentences, the headline is the one
        // stating the work itself — not a condition sentence that
        // also cites the work line (runE2g, 2026-11-04: the
        // employment sentence cited L01 and came first, so it became
        // the headline and the page review failed job-first). Prefer
        // the sentence carrying no fact key of another appeal.
        const otherKeys = new Set(appeals.filter((a) => a.id !== kvAppeal.id).flatMap((a) => a?.factKeys ?? []));
        const pure = idxs.find((i) => !(sentences[i]?.factKeys ?? []).some((k) => otherKeys.has(k)));
        workIdx = pure ?? idxs[0];
      }
    }
  }
  if (workIdx < 0) {
    // Second fallback: some generation paths tag the work sentence
    // with employment/location keys (the English path does), so the
    // no-keys rule misses it and a condition became the headline
    // (FICT-E01, runE1c page review, 2026-11-04). The work sentence
    // is then the first sentence matched to no appeal that cites a
    // line no appeal claims.
    workIdx = sentences.findIndex((s, idx) => !bySentence.has(idx) && (s?.sourceLines ?? []).some((l) => !appealLines.has(l)));
  }
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
  const omittedImages = new Set();
  const omittedBands = [];
  const omittedImageFiles = [];
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
  const titleInner = (carries) => {
    // The title block carries the headline ONLY — one sentence,
    // the work itself. (FICT-E03 run9, 2026-11-04: when the work
    // sentence was already placed, this fallback dumped the lead
    // appeal's whole sentence set — three sentences, one of them
    // another appeal's — into the title block in headline styling,
    // and the first view became a wall of bold text. The user's
    // verdict: the content was fine; the plating was the problem.
    // The appeal's remaining sentences render in their own blocks.)
    let inner = "";
    if (carries.workContent && workIdx >= 0) inner = sentenceHtml(workIdx);
    if (!inner && carries.appealId) {
      const idxs = byAppeal.get(carries.appealId) ?? [];
      if (idxs.length > 0) inner = sentenceHtml(idxs[0]);
    }
    return inner;
  };
  const consumed = new Set();
  for (let bi = 0; bi < blocks.length; bi++) {
    if (consumed.has(bi)) continue;
    const block = blocks[bi];
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
        // The header is one unit — photo, chips, and the headline
        // band directly beneath it (the header is the face of the
        // appeal, user principle 2026-11-04). When the title block
        // follows the hero directly, it renders inside the hero
        // section instead of as a separate block.
        let titleBand = "";
        const next = blocks[bi + 1];
        if (next?.block === "title") {
          const inner = titleInner(next.carries ?? {});
          if (inner) { titleBand = `<div class="title-block">${inner}</div>`; consumed.add(bi + 1); }
        }
        body += `<section class="lp-hero"><img src="${esc(srcFor(hero))}" alt="">${chips}${titleBand}</section>\n`;
        placedFiles.push(hero.file);
      }
    } else if (block.block === "title") {
      const inner = titleInner(carries);
      // Title directly before the hero (work-first patterns) is
      // also one header unit: title band, then photo and chips,
      // inside a single hero section.
      const next = blocks[bi + 1];
      if (inner && next?.block === "hero-photo") {
        const hero = imgById.get("hero");
        if (hero && existing.has(hero.id)) {
          const chips = Array.isArray(heroChips) && heroChips.length > 0
            ? `<div class="hero-chips">${heroChips.map((c) => `<span class="hero-chip">${esc(c)}</span>`).join("")}</div>`
            : "";
          body += `<section class="lp-hero"><div class="title-block">${inner}</div><img src="${esc(srcFor(hero))}" alt="">${chips}</section>\n`;
          placedFiles.push(hero.file);
          consumed.add(bi + 1);
          continue;
        }
      }
      if (inner) body += `<section class="title-block">${inner}</section>\n`;
    } else if (block.block === "photo-band") {
      const img = carries.specId ? imgById.get(carries.specId) : null;
      let text = carries.basis?.appealId ? appealSentences(carries.basis.appealId) : "";
      if (!text && carries.basis?.factKey) {
        sentences.forEach((s, idx) => {
          if ((s?.factKeys ?? []).includes(carries.basis.factKey)) text += sentenceHtml(idx);
        });
      }
      if (!text && /work/i.test(carries.specId ?? "")) {
        // A work band whose fact-key sentences were all claimed
        // earlier (the work sentence became the headline) still has
        // the work appeal's body sentence — the generation writes
        // one separately from the headline (v8). The band carries
        // it, so the designed second work photo does not drop out
        // (runE2i, 2026-11-04).
        const kvA = (planning?.imageSpecs ?? []).find((s) => s?.role === "key-visual")?.basis?.appealId;
        if (kvA) text = appealSentences(kvA);
      }
      const fig = img && existing.has(img.id) ? `<img class="inline-photo" src="${esc(srcFor(img))}" alt="">` : "";
      if (text) {
        if (img && existing.has(img.id)) placedFiles.push(img.file);
        body += `<section class="explain-row">${fig}<div class="explain-text">${text}</div><div class="clear"></div></section>\n`;
      } else if (fig) {
        // A band whose sentences were all claimed earlier (for
        // example the work sentence became the headline) would ship
        // as an image with nothing to say. Appeal images exist to
        // reduce cognitive load, not to decorate (user principle,
        // 2026-11-04), so the band is omitted and the omission is
        // recorded; the tail must not re-append it as a bare figure.
        omittedImages.add(img.file);
        omittedBands.push(carries.specId ?? img.id);
        omittedImageFiles.push(img.file);
      }
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
  // The 募集要項 table (the user's spec, 2026-11-04): every stated
  // fact as a label/value row, so the details section alone lets a
  // reader grasp the whole posting. The table is the formal summary
  // of the posting — its contents may duplicate the appeal copy,
  // the way a legacy formal document restates what the body already
  // said; the generated sentences still appear exactly once each.
  const statedFacts = (facts?.items ?? []).filter((i) => i && i.status === "stated" && i.value !== null && i.value !== undefined && i.value !== "");
  // Essentials the FACT schema does not carry (the work itself,
  // days off, requirements) live in the original's lines. The table
  // includes them with the original's own label, verbatim, so the
  // 募集要項 alone covers the whole posting (runE2h page review:
  // days off were not findable in the details, 2026-11-04).
  const LINE_ROW_RE = /^(仕事内容|仕事|休日|応募資格|資格|Work|Duties|Job description|Days off|Days|Requirements|Qualifications)\s*[:：]\s*(.+)$/i;
  const lineRows = [];
  for (const l of original?.lines ?? []) {
    const m = LINE_ROW_RE.exec(l?.text ?? "");
    if (m) lineRows.push({ label: m[1], value: m[2] });
  }
  if (statedFacts.length > 0 || lineRows.length > 0) {
    const labels = layout?.language === "en" ? FACT_LABEL_EN : FACT_LABEL;
    // The monthly income example (the user's pay-display decision,
    // 2026-11-04): for hourly/daily/annual pay, the table also
    // shows the approximate monthly total computed from the stated
    // materials, with the note that overtime, night work and
    // allowances are not included.
    const ex = monthlyIncomeExample(facts);
    const exRow = ex ? `<tr><th>${layout?.language === "en" ? "Monthly income example" : "月収例"}</th><td>約${ex.amount.toLocaleString("en-US")}円<br><span class="fact-note">${layout?.language === "en" ? "Estimated from the stated pay, hours and assumed working days. Overtime, night work and allowances are not included." : "※記載の給与・時間・想定日数からの試算です。残業・夜勤・各種手当は含みません"}</span></td></tr>` : "";
    const rows = statedFacts.map((i) => `<tr><th>${esc(labels[i.key] ?? i.key)}</th><td>${esc(typeof i.value === "object" ? JSON.stringify(i.value) : i.value)}</td></tr>`).join("")
      + exRow
      + lineRows.map((r) => `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join("");
    const table = `<section class="details"><h2 class="details-title">${layout?.language === "en" ? "Job details" : "募集要項"}</h2><table class="fact-table">${rows}</table></section>\n`;
    const ci = body.lastIndexOf(`<footer class="cta">`);
    if (ci >= 0) body = body.slice(0, ci) + table + body.slice(ci);
    else body += table;
  }
  if (!blocks.some((b) => b.block === "cta")) body += `<footer class="cta"><button class="cta-button" type="button">${layout?.language === "en" ? "Apply" : "応募する"}</button></footer>\n`;
  // Images no block claimed are appended (existence/reference is C2).
  for (const img of images ?? []) {
    if (existing.has(img.id) && !placedFiles.includes(img.file) && !omittedImages.has(img.file)) {
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
.details-title{font-size:18px;margin:0 0 12px}
.fact-table{width:100%;border-collapse:collapse;font-size:14px}
.fact-table th,.fact-table td{border:1px solid #d8dee6;padding:8px 10px;text-align:left;vertical-align:top;line-height:1.6}
.fact-table th{width:34%;background:#f4f6f9;font-weight:600}
.fact-note{font-size:12px;color:#5a6572}
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
  return { html, referenced: placedFiles, skipped, assignments: { appealCoverage, omittedBands, omittedImageFiles } };
}
