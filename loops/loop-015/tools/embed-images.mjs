import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = "C:/Users/norik/projects/meta-hackathon-lab";
const imgDir = join(root, "loops/loop-015/previews/images");

function b64uri(id) {
  // Try webp first, then png
  for (const ext of ["webp", "png"]) {
    try {
      const buf = readFileSync(join(imgDir, `${id}.${ext}`));
      const mime = ext === "webp" ? "image/webp" : "image/png";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {}
  }
  throw new Error(`Image not found: ${id}`);
}

const MAP_A = {
  "TA-hero": b64uri("TA-hero"),
  "TA-cashier": b64uri("TA-cashier"),
  "TA-training": b64uri("TA-training"),
  "TA-neighborhood": b64uri("TA-neighborhood"),
};
const MAP_B = {
  "TB-hero": b64uri("TB-hero"),
  "TB-meal": b64uri("TB-meal"),
  "TB-training": b64uri("TB-training"),
  "TB-neighborhood": b64uri("TB-neighborhood"),
};

function embed(htmlPath, imgMap) {
  let html = readFileSync(htmlPath, "utf8");
  const before = html.length;
  for (const [id, uri] of Object.entries(imgMap)) {
    // Replace placeholder src that contains SVG data URI or any src near the image id comment
    // We match by replacing only if the id appears in nearby HTML comments or alt context.
    // Simple: replace all data:image/svg+xml occurrences near known alt texts
    // Instead, do targeted replacements by alt text mapping
  }
  return html;
}

// Do precise replacements — read current files and patch each img src
function patchFile(htmlPath, replacements) {
  let html = readFileSync(htmlPath, "utf8");
  for (const rep of replacements) {
    // rep: { marker: string to find nearby, oldPrefix: optional, newSrc }
    // Find all img tags with src="data:image/svg+xml and replace the one near marker
    const idx = html.indexOf(rep.marker);
    if (idx === -1) {
      console.warn(`Marker not found: ${rep.marker.slice(0, 60)}`);
      continue;
    }
    // Find the img tag before or after the marker
    // Search backwards for <img and forwards
    let searchStart = Math.max(0, idx - 2000);
    let searchEnd = Math.min(html.length, idx + 2000);
    let slice = html.slice(searchStart, searchEnd);
    let m = slice.match(/src="data:image\/svg\+xml[^"]*"/);
    if (!m) {
      // maybe already replaced? look for data:image/webp
      m = slice.match(/src="data:image\/webp[^"]*"/);
      if (m) console.log(`Already webp at marker ${rep.marker.slice(0, 40)}, re-patching`);
      else { console.warn(`No SVG src near marker ${rep.marker.slice(0, 50)}`); continue; }
    }
    const oldSrc = m[0];
    const newSrc = `src="${rep.newSrc}"`;
    // Replace only this occurrence: locate its offset in full html
    const absIdx = html.indexOf(oldSrc, searchStart);
    if (absIdx === -1) { console.warn("absIdx miss"); continue; }
    html = html.slice(0, absIdx) + newSrc + html.slice(absIdx + oldSrc.length);
    console.log(`Patched ${rep.marker.slice(0, 50)} -> ${rep.newSrc.slice(0, 30)}... (${oldSrc.length} -> ${newSrc.length})`);
  }
  writeFileSync(htmlPath, html, "utf8");
  console.log(`Wrote ${htmlPath} (${html.length} bytes)`);
}

// T-A: 4 images — TA-hero (header), TA-cashier (pay), TA-training (support), TA-neighborhood (location)
const pathA = join(root, "loops/loop-015/previews/topic-A-EN1-gen-003-complete.html");
patchFile(pathA, [
  { marker: "HERO IMAGE", newSrc: MAP_A["TA-hero"] },
  { marker: "PAY IMAGE", newSrc: MAP_A["TA-cashier"] },
  { marker: "TRAINING IMAGE", newSrc: MAP_A["TA-training"] },
  { marker: "LOCATION IMAGE", newSrc: MAP_A["TA-neighborhood"] },
]);

// T-B: 4 images — TB-hero, TB-meal, TB-training, TB-neighborhood
const pathB = join(root, "loops/loop-015/previews/topic-B-EN1-gen-002-complete.html");
patchFile(pathB, [
  { marker: "HERO IMAGE", newSrc: MAP_B["TB-hero"] },
  { marker: "PAY IMAGE", newSrc: MAP_B["TB-meal"] },
  { marker: "TRAINING IMAGE", newSrc: MAP_B["TB-training"] },
  { marker: "LOCATION IMAGE", newSrc: MAP_B["TB-neighborhood"] },
]);

console.log("Done embedding.");
