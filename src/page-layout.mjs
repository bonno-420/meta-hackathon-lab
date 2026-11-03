// Page layout composition (the LP's finished image, and the layout the
// final LP shares).
//
// The 1枚画 is the LP's finished image (「LPの完成イメージ」): the page
// layout composed from the structured planning — hero photograph, title
// block, condition cards, photo bands, detail blocks, call to action —
// rendered as a single image BEFORE the copy exists, so the finished
// page can be seen and confirmed first. Text appears as placeholder
// bars at this stage; the copy and the real images are produced after
// and take the same places in the same layout.
//
// The image model never draws the page: it only makes the photographs.
// The layout is composed here, deterministically, from the planning.
// The CSS stays within block/float layout so any renderer (headless
// Chromium, wkhtmltoimage) produces the same page.

import path from "node:path";
import { existsSync } from "node:fs";

function resolveRoot(root, rel) {
  return path.isAbsolute(rel) ? rel : path.join(root, rel);
}

const ICONS = [
  // circle
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#173550" stroke-width="1.6"><circle cx="12" cy="12" r="8"/></svg>',
  // shield with check
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#173550" stroke-width="1.6"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  // map pin
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#173550" stroke-width="1.6"><path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2.4"/></svg>',
  // document
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#173550" stroke-width="1.6"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/></svg>',
  // people
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#173550" stroke-width="1.6"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5S13.9 16 14.5 19"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.7c2.3.2 4.3 1.6 5 4.3"/></svg>',
];

function bars(widths, cls = "bar") {
  return widths.map((w) => `<span class="${cls}" style="width:${w}%"></span>`).join("");
}

export function buildFinishedImageHtml({ root, planning, photos, pageDir }) {
  const pageDirAbs = resolveRoot(root, pageDir);
  const srcFor = (img) => path.relative(pageDirAbs, resolveRoot(root, img.file)).split(path.sep).join("/").replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const usable = (photos ?? []).filter((p) => p && p.file && existsSync(resolveRoot(root, p.file)));
  const hero = usable.find((p) => p.role === "key-visual") ?? usable[0] ?? null;
  const bands = usable.filter((p) => p !== hero);
  const cardCount = Array.isArray(planning?.firstCheckKeys) ? planning.firstCheckKeys.length : 0;

  let body = "";
  if (hero) body += `<section class="hero"><img src="${srcFor(hero)}" alt=""></section>\n`;
  body += `<section class="title-block">${bars([78, 58, 42], "bar bar-light")}</section>\n`;
  if (cardCount > 0) {
    const cards = [];
    for (let i = 0; i < cardCount; i++) {
      cards.push(`<div class="card${i % 2 === 1 ? " card-r" : ""}"><div class="card-icon">${ICONS[i % ICONS.length]}</div>${bars([70, 92, 55], "bar bar-sm")}</div>`);
    }
    body += `<section class="cards">${cards.join("")}<div class="clear"></div></section>\n`;
  }
  for (const img of bands) {
    body += `<section class="band"><img src="${srcFor(img)}" alt=""></section>\n`;
  }
  const rows = `<div class="check-row"><span class="box"></span><span class="bar bar-sm" style="width:68%"></span></div>`.repeat(4);
  body += `<section class="details"><div class="detail-card">${rows}</div><div class="detail-card detail-r">${rows}</div><div class="clear"></div></section>\n`;
  body += `<footer class="cta"><span class="cta-button"><span class="bar bar-cta" style="width:46%"></span></span></footer>\n`;

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LP finished image</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#dcdcdc;font-family:sans-serif}
.page{max-width:480px;margin:0 auto;background:#fff;box-shadow:0 0 18px rgba(0,0,0,.18)}
.hero img,.band img{display:block;width:100%;height:auto}
.title-block{background:#173550;padding:34px 30px 38px}
.bar{display:block;height:15px;border-radius:8px;background:#c9d4de;margin:0 0 14px}
.bar:last-child{margin-bottom:0}
.bar-light{background:#e8eef4}
.bar-sm{height:9px;margin:0 0 8px}
.cards{padding:20px 18px 6px}
.card{float:left;width:48%;border:1px solid #e3e7eb;border-radius:12px;padding:16px 14px;margin:0 0 14px;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.card-r{float:right}
.card-icon{margin-bottom:8px}
.details{padding:6px 18px 26px}
.detail-card{float:left;width:48%;border:1px solid #e3e7eb;border-radius:12px;padding:14px 12px}
.detail-r{float:right}
.check-row{margin:0 0 11px}
.check-row:last-child{margin-bottom:0}
.check-row .box{display:inline-block;vertical-align:middle;width:15px;height:15px;border:1.6px solid #9aa7b1;border-radius:4px;margin-right:9px}
.check-row .bar{display:inline-block;vertical-align:middle}
.clear{clear:both}
.cta{background:#173550;padding:26px 30px 34px;text-align:center}
.cta-button{display:inline-block;background:#f2762e;border-radius:10px;padding:14px 44px;width:70%}
.bar-cta{background:#ffd9c2;height:13px;margin:0 auto}
</style>
</head>
<body>
<main class="page">
${body}</main>
</body>
</html>
`;
  const record = {
    kind: "lp-finished-image",
    anatomy: ["hero photograph", "title block (placeholder text)", `condition cards x${cardCount} (planning firstCheckKeys)`, `photo bands x${bands.length}`, "detail blocks (placeholder text)", "call to action"],
    photos: usable.map((p) => ({ id: p.id, role: p.role ?? null, file: p.file })),
    note: "LPの完成イメージ。文章はプレースホルダで、実文と実画像は後段で同じレイアウトの同じ場所に入る",
  };
  return { html, record };
}
