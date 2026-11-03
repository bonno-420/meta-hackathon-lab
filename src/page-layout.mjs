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

export const FACT_LABEL = {
  salaryHourly: "時給", workHours: "勤務時間", transportCap: "交通費上限",
  transport: "交通費", breakMinutes: "休憩", contractPeriod: "契約期間",
  workLocation: "勤務地", employmentType: "雇用形態",
};

const ICONS = [
  // tag
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#e8862e" stroke-width="1.6"><path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82z"/><circle cx="7.5" cy="7.5" r="1"/></svg>',
  // calendar
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#e8862e" stroke-width="1.6"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  // map pin
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#e8862e" stroke-width="1.6"><path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2.4"/></svg>',
  // document
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#e8862e" stroke-width="1.6"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/></svg>',
  // people
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#e8862e" stroke-width="1.6"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5S13.9 16 14.5 19"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.7c2.3.2 4.3 1.6 5 4.3"/></svg>',
];
const ICON_FOR_KEY = { salaryHourly: 0, workHours: 1, transportCap: 2, transport: 2 };

function bars(widths, cls = "bar") {
  return widths.map((w) => `<span class="${cls}" style="width:${w}%"></span>`).join("");
}

export function buildFinishedImageHtml({ root, planning, photos, pageDir, design }) {
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
  // The image design (loop-023) is the authority for each photograph's
  // purpose, subject, depiction and size. Without a design record the
  // composer falls back to the planning specs, with the same rules:
  // hero large, explanatory images small illustrations.
  const stepDesignById = new Map((Array.isArray(design?.images) ? design.images : []).map((e) => [e.id, e]));
  const designFor = (photo, placement) => {
    const spec = specById.get(photo.id) ?? {};
    const sd = stepDesignById.get(photo.id) ?? null;
    const d = spec.design ?? {};
    const aspect = sd?.placement?.aspect ?? d.aspect ?? (placement === "hero" ? "5:3" : "4:3");
    const [aw, ah] = aspect.split(":").map((n) => Number(n) || 1);
    const width = placement === "hero" ? COLUMN : Math.round((COLUMN - 36) * 0.38);
    return {
      id: photo.id,
      placement,
      aspect,
      heightPx: Math.round((width * ah) / aw),
      fit: d.fit ?? "cover",
      position: d.position ?? "center",
      purpose: sd?.purpose ?? spec.purpose ?? (placement === "hero" ? "the workplace itself, establishing the page" : "the work, in the body of the page"),
      subject: sd?.subject ?? spec.description ?? null,
      depiction: sd?.depiction ?? (placement === "hero" ? "photorealistic" : "illustration"),
      size: sd?.placement?.size ?? (placement === "hero" ? "large" : "small"),
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
    const firstKeys = Array.isArray(planning?.firstCheckKeys) ? planning.firstCheckKeys : [];
    for (let i = 0; i < cardCount; i++) {
      const icon = ICONS[ICON_FOR_KEY[firstKeys[i]] ?? 3] ?? ICONS[3];
      cards.push(`<div class="card${i % 2 === 1 ? " card-r" : ""}"><div class="card-icon">${icon}</div>${bars([70, 92, 55], "bar bar-sm")}</div>`);
    }
    body += `<section class="cards">${cards.join("")}<div class="clear"></div></section>\n`;
  }
  const explainRows = `<div class="check-row"><span class="box"></span><span class="bar bar-sm" style="width:68%"></span></div>`.repeat(3);
  for (const img of bands) {
    const d = designById.get(img.id);
    body += `<section class="explain-row"><div class="photo-inline" style="background-image:url('${srcFor(img)}');height:${d.heightPx}px"></div><div class="explain-card">${explainRows}</div><div class="clear"></div></section>\n`;
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
*{box-sizing:border-box}body{margin:0;background:#dde4ee;font-family:sans-serif;padding:24px 0}
.page{max-width:480px;margin:0 auto;background:#fff;border-radius:26px;box-shadow:0 10px 34px rgba(23,42,66,.18);overflow:hidden}
.photo-hero{background-size:cover;background-position:center}
.explain-row{padding:16px 18px 0}
.photo-inline{float:left;width:38%;border-radius:16px;background-size:cover;background-position:center}
.explain-card{float:right;width:58%;border:1px solid #e3e7eb;border-radius:14px;padding:14px 12px;box-shadow:0 4px 16px rgba(23,42,66,.08)}
.title-block{background:#173550;padding:30px 30px 34px;margin:-56px 34px 0;position:relative;border-radius:20px;box-shadow:0 8px 22px rgba(23,42,66,.25)}
.bar{display:block;height:15px;border-radius:8px;background:#c9d4de;margin:0 0 14px}
.bar:last-child{margin-bottom:0}
.bar-light{background:#e8eef4}
.bar-sm{height:9px;margin:0 0 8px}
.cards{padding:20px 18px 6px}
.card{float:left;width:48%;border-radius:18px;padding:16px 14px;margin:0 0 14px;box-shadow:0 4px 16px rgba(23,42,66,.10);text-align:center}
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
.cta-button{display:inline-block;background:#f2762e;border-radius:999px;padding:14px 44px;width:56%}
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
    form: { pageFrame: true, titleOverlap: true, reference: "loop-020 form, with the 2026-11-04 rules applied" },
    anatomy: ["hero photograph", "title block (placeholder text)", `condition cards x${cardCount} (planning firstCheckKeys)`, `explanatory image rows x${bands.length} (small insets)`, "detail blocks (placeholder text)", "call to action"],
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
    if (!designedIds.has(photo.id)) failures.push(`写真 ${photo.id} に画像の設計がない（G7）`);
    const d = (record?.imageDesign ?? []).find((x) => x.id === photo.id);
    if (d && (!d.purpose || !d.aspect)) failures.push(`写真 ${photo.id} の設計（目的・形）が欠けている（G7）`);
    if (d && d.placement === "hero") {
      if (d.size !== "large") failures.push(`ヒーロー ${photo.id} が大きく置かれていない（G8）`);
    } else if (d) {
      if (d.depiction !== "illustration") failures.push(`説明画像 ${photo.id} が写実になっている（G6）`);
      if (d.size !== "small") failures.push(`説明画像 ${photo.id} が小さく置かれていない（G6）`);
    }
  }
  if (!record?.form?.pageFrame || !record?.form?.titleOverlap) {
    failures.push("レイアウトが参照形（ページ枠・タイトルの重なり）になっていない（G8）");
  }
  return { pass: failures.length === 0, failures };
}
