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

  // Image design: each photograph's place, shape and fit in the page.
  // The planning designs the needed images (subject in the spec's
  // description; shape in the spec's optional design); the defaults
  // give the hero a wide establishing shape and bands an inset shape.
  const COLUMN = 480;
  const specById = new Map((Array.isArray(planning?.imageSpecs) ? planning.imageSpecs : []).map((s) => [s.id, s]));
  const designFor = (photo, placement) => {
    const spec = specById.get(photo.id) ?? {};
    const d = spec.design ?? {};
    const aspect = d.aspect ?? (placement === "hero" ? "5:3" : "13:6");
    const [aw, ah] = aspect.split(":").map((n) => Number(n) || 1);
    const width = placement === "hero" ? COLUMN : COLUMN - 36;
    return {
      id: photo.id,
      placement,
      aspect,
      heightPx: Math.round((width * ah) / aw),
      fit: d.fit ?? "cover",
      position: d.position ?? "center",
      purpose: spec.purpose ?? (placement === "hero" ? "the workplace itself, establishing the page" : "the work, in the body of the page"),
    };
  };
  const heroDesign = hero ? designFor(hero, "hero") : null;
  const bandDesigns = bands.map((b) => designFor(b, "band"));
  const designById = new Map([heroDesign, ...bandDesigns].filter(Boolean).map((d) => [d.id, d]));

  let body = "";
  if (hero) body += `<section class="hero"><div class="photo-hero" style="background-image:url('${srcFor(hero)}');height:${heroDesign.heightPx}px"></div></section>\n`;
  body += `<section class="title-block">${bars([78, 58, 42], "bar bar-light")}</section>\n`;
  if (cardCount > 0) {
    const cards = [];
    for (let i = 0; i < cardCount; i++) {
      cards.push(`<div class="card${i % 2 === 1 ? " card-r" : ""}"><div class="card-icon">${ICONS[i % ICONS.length]}</div>${bars([70, 92, 55], "bar bar-sm")}</div>`);
    }
    body += `<section class="cards">${cards.join("")}<div class="clear"></div></section>\n`;
  }
  for (const img of bands) {
    const d = designById.get(img.id);
    body += `<section class="band"><div class="photo-band" style="background-image:url('${srcFor(img)}');height:${d.heightPx}px"></div></section>\n`;
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
.photo-hero{background-size:cover;background-position:center}
.band{padding:16px 18px 0}
.photo-band{border-radius:12px;background-size:cover;background-position:center}
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
  // Message map: which appeal and which facts each block of the page
  // carries — the communication design (who is told what, where),
  // produced by the pipeline from the planning. An appeal with no
  // block is a gap and is recorded as one, never silently dropped.
  const appeals = Array.isArray(planning?.appeals) ? planning.appeals : [];
  const appealByKey = new Map();
  for (const a of appeals) {
    for (const k of Array.isArray(a?.factKeys) ? a.factKeys : []) {
      if (!appealByKey.has(k)) appealByKey.set(k, a.id);
    }
  }
  const firstCheckKeys = Array.isArray(planning?.firstCheckKeys) ? planning.firstCheckKeys : [];
  const messageMap = [];
  if (appeals.length > 0) {
    messageMap.push({ block: "title", carries: { appealId: appeals[0].id }, note: "the lead appeal's headline slot (placeholder text at this stage)" });
  }
  for (const key of firstCheckKeys) {
    messageMap.push({ block: "condition-card", carries: { factKey: key, appealId: appealByKey.get(key) ?? null } });
  }
  for (const d of [heroDesign, ...bandDesigns].filter(Boolean)) {
    const spec = specById.get(d.id) ?? {};
    messageMap.push({ block: d.placement === "hero" ? "hero-photo" : "photo-band", carries: { specId: d.id, basis: spec.basis ?? null }, purpose: d.purpose });
  }
  const allAppealKeys = [...new Set(appeals.flatMap((a) => (Array.isArray(a?.factKeys) ? a.factKeys : [])))];
  const detailKeys = allAppealKeys.filter((k) => !firstCheckKeys.includes(k));
  // Appeals grounded in original lines but with no FACT key (the fact
  // schema has no key for them) are carried by the detail blocks.
  const lineGroundedAppeals = appeals
    .filter((a) => (Array.isArray(a?.factKeys) ? a.factKeys.length : 0) === 0 && (Array.isArray(a?.sourceLines) ? a.sourceLines.length : 0) > 0)
    .map((a) => a.id);
  messageMap.push({ block: "details", carries: { factKeys: detailKeys, appealIds: lineGroundedAppeals }, note: "appeal facts not shown as first-check cards, and line-grounded appeals with no fact key; carried by the detail blocks and the copy" });
  messageMap.push({ block: "cta", carries: { action: true } });
  const carriedAppealIds = new Set(messageMap.flatMap((m) => {
    const c = (m && m.carries) || {};
    return [
      ...(c.appealId ? [c.appealId] : []),
      ...(Array.isArray(c.appealIds) ? c.appealIds : []),
      ...(c.basis && c.basis.appealId ? [c.basis.appealId] : []),
    ];
  }));
  const messageGaps = appeals
    .filter((a) => !carriedAppealIds.has(a.id))
    .map((a) => ({ appealId: a.id, reason: "no block in the finished image carries this appeal (it is carried by the copy only, or its facts have no card)" }));

  const record = {
    kind: "lp-finished-image",
    audience: planning?.audience ?? null,
    // gate is filled by evaluateFinishedImageGate below (kept on the
    // record so the presentation and the run record carry the verdict).
    anatomy: ["hero photograph", "title block (placeholder text)", `condition cards x${cardCount} (planning firstCheckKeys)`, `photo bands x${bands.length}`, "detail blocks (placeholder text)", "call to action"],
    messageMap,
    messageGaps,
    photos: usable.map((p) => ({ id: p.id, role: p.role ?? null, file: p.file })),
    imageDesign: [heroDesign, ...bandDesigns].filter(Boolean),
    note: "LPの完成イメージ。文章はプレースホルダで、実文と実画像は後段で同じレイアウトの同じ場所に入る",
  };
  return { html, record };
}

// The gate for the finished image: what must hold before the image may
// be presented at the checkpoint at all. The criteria come from the
// requirements on record, not from the maker's convenience: the
// audience is named; every appeal has a place in the page (no gaps);
// every photograph is placed under an image design (purpose + shape).
// A page that fails is not presented — the run stops with the reasons.
export function evaluateFinishedImageGate(record) {
  const failures = [];
  if (!record || typeof record.audience !== "string" || record.audience.length === 0) {
    failures.push("対象（audience）が企画にない");
  }
  for (const gap of record?.messageGaps ?? []) {
    failures.push(`訴求 ${gap.appealId} の置き場がページにない`);
  }
  const designedIds = new Set((record?.imageDesign ?? []).map((d) => d.id));
  for (const photo of record?.photos ?? []) {
    if (!designedIds.has(photo.id)) failures.push(`写真 ${photo.id} に画像の設計がない`);
    const d = (record?.imageDesign ?? []).find((x) => x.id === photo.id);
    if (d && (!d.purpose || !d.aspect)) failures.push(`写真 ${photo.id} の設計（目的・形）が欠けている`);
  }
  return { pass: failures.length === 0, failures };
}
