#!/usr/bin/env node
// loop16-images.mjs — loop-016 ケース別画像生成（Meta枠、Baseten枠に含めない）
// 使い方: node loops/loop-016/tools/loop16-images.mjs --case A
// 画像はファイル出力のみ。b64は文脈に載せない。manifest.json に集約

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

function loadMetaKey() {
  if (process.env.MODEL_API_KEY) return { source: "env:MODEL_API_KEY", key: process.env.MODEL_API_KEY };
  const p = join(homedir(), ".config", "opencode", "meta-api-key");
  if (existsSync(p)) {
    const raw = readFileSync(p, "utf8").trim();
    if (raw) return { source: `file:${p}`, key: raw };
  }
  return { source: null, key: null };
}

const SPECS = {
  A: [
    { id: "hero", prompt: "Modern tech office building entrance in Osaka Umeda district, morning sunlight, clean glass facade, young professionals walking in, calm urban business atmosphere, photorealistic, wide angle, no text, no numbers, no logos", size: "1024x1024" },
    { id: "work", prompt: "Two young software engineers doing code review together at a bright modern office desk, laptop screen blurred, mentor pointing kindly, natural daylight, supportive teamwork, photorealistic, no text, no numbers, no logos", size: "1024x1024" },
    { id: "place", prompt: "Quiet pleasant business street in Osaka Umeda district, daytime, modern buildings and trees, clean sidewalk, calm morning commute scene, photorealistic, wide shot, no text, no numbers, no logos", size: "1024x1024" },
  ],
  B: [
    { id: "hero", prompt: "Bright modern general hospital entrance in Yokohama Minato Mirai area, daytime, welcoming building with greenery, soft sunlight, calm clean atmosphere, photorealistic, wide angle, no text, no numbers, no logos", size: "1024x1024" },
    { id: "work", prompt: "Two nurses doing structured handover at a bright hospital ward station, charts blurred, focused professional teamwork, warm daylight, photorealistic, no text, no numbers, no logos", size: "1024x1024" },
    { id: "place", prompt: "Pleasant residential street near Yokohama Minato Mirai, daytime, tree-lined road with apartment buildings, calm family neighborhood, soft daylight, photorealistic, wide shot, no text, no numbers, no logos", size: "1024x1024" },
  ],
  C: [
    { id: "hero", prompt: "Modern creative office building in Tokyo Shibuya, daytime, stylish glass entrance with plants, young professionals entering, energetic business atmosphere, photorealistic, wide angle, no text, no numbers, no logos", size: "1024x1024" },
    { id: "work", prompt: "Small brand team meeting around a table with blank mood boards, diverse young marketers discussing campaign, bright creative office, daylight, photorealistic, no text, no numbers, no logos", size: "1024x1024" },
    { id: "place", prompt: "Bright daytime street in Tokyo Shibuya with modern shops and trees, clean sidewalk, lively but calm commercial area, photorealistic, wide shot, no text, no numbers, no logos", size: "1024x1024" },
  ],
  D: [
    { id: "hero", prompt: "Modern logistics distribution center exterior in Saitama Kawaguchi, daytime, clean warehouse building with truck yard, clear sky, orderly industrial site, photorealistic, wide angle, no text, no numbers, no logos", size: "1024x1024" },
    { id: "work", prompt: "Warehouse associate with buddy picking small parcels on shelves in a bright distribution center, safety vest, orderly aisles, daylight from skylights, photorealistic, no text, no numbers, no logos", size: "1024x1024" },
    { id: "place", prompt: "Quiet suburban road in Saitama Kawaguchi with shuttle bus stop and greenery, daytime, clean industrial-residential mix, photorealistic, wide shot, no text, no numbers, no logos", size: "1024x1024" },
  ],
  E: [
    { id: "hero", prompt: "Cozy small coffee shop storefront in Setagaya Futako-Tamagawa, morning sunlight, wooden facade with plants, warm inviting entrance, photorealistic, wide angle, no text, no numbers, no logos", size: "1024x1024" },
    { id: "work", prompt: "Friendly cafe staff showing a new part-time crew member how to brew coffee at a bright counter, morning light, warm supportive atmosphere, photorealistic, no text, no numbers, no logos", size: "1024x1024" },
    { id: "place", prompt: "Pleasant station-front street in Futako-Tamagawa Tokyo, morning, clean shops and trees, calm commuter scene, photorealistic, wide shot, no text, no numbers, no logos", size: "1024x1024" },
  ],
  F: [
    { id: "hero", prompt: "Bright outdoor goods retail storefront in Nagoya Sakae district, daytime, clean display windows with jackets and tents blurred, welcoming entrance, photorealistic, wide angle, no text, no numbers, no logos", size: "1024x1024" },
    { id: "work", prompt: "Young seasonal sales associate learning floor tasks from a buddy in a bright outdoor store, daytime, friendly guidance, photorealistic, no text, no numbers, no logos", size: "1024x1024" },
    { id: "place", prompt: "Lively shopping street in Nagoya Sakae district, daytime, modern storefronts and trees, clean wide sidewalk, photorealistic, wide shot, no text, no numbers, no logos", size: "1024x1024" },
  ],
};

async function main() {
  const args = process.argv.slice(2);
  let c = null;
  for (let i = 0; i < args.length; i++) if (args[i] === "--case" && args[i + 1]) { c = args[i + 1].toUpperCase(); i++; }
  if (!c || !SPECS[c]) { console.error("Usage: --case A|B|C|D|E|F"); process.exit(2); }
  const { key, source } = loadMetaKey();
  if (!key) { console.error("Meta key not found"); process.exit(2); }
  console.error(`[loop16-images] case ${c} key source ok (${source}), images=${SPECS[c].length} (values not logged)`);
  const endpoint = "https://api.meta.ai/v1/images/generations";
  const outDir = resolve("loops/loop-016/previews/images");
  mkdirSync(outDir, { recursive: true });
  const manifestPath = join(outDir, "manifest.json");
  let manifest = { generatedAt: null, model: "muse-image-1.0", endpoint, images: [] };
  if (existsSync(manifestPath)) {
    try { manifest = JSON.parse(readFileSync(manifestPath, "utf8")); } catch {}
  }
  // remove old entries for this case
  manifest.images = (manifest.images || []).filter((e) => !e.file.startsWith(`case-${c}-`));
  let inT = 0, outT = 0, okCount = 0;
  for (const spec of SPECS[c]) {
    const fileBase = `case-${c}-${spec.id}`;
    console.error(`Generating ${fileBase}...`);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: "muse-image-1.0", prompt: spec.prompt, n: 1, size: spec.size }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) throw new Error("No b64_json");
      const mime = b64.startsWith("UklG") ? "image/webp" : "image/png";
      const ext = mime === "image/webp" ? "webp" : "png";
      const fileName = `${fileBase}.${ext}`;
      const buf = Buffer.from(b64, "base64");
      writeFileSync(join(outDir, fileName), buf);
      const usage = json.usage ?? null;
      if (usage) { inT += usage.input_tokens ?? 0; outT += usage.output_tokens ?? 0; }
      manifest.images.push({ id: fileBase, case: c, file: `images/${fileName}`, prompt: spec.prompt, size: spec.size, mime, bytes: buf.length, usage });
      okCount++;
      console.error(`  saved ${fileName} (${buf.length} bytes)`);
      await new Promise((r) => setTimeout(r, 800));
    } catch (e) {
      console.error(`  FAILED ${fileBase}: ${e.message}`);
      manifest.images.push({ id: fileBase, case: c, error: e.message, prompt: spec.prompt });
    }
  }
  manifest.generatedAt = new Date().toISOString();
  manifest.totalInput = (manifest.totalInput ?? 0) + inT;
  manifest.totalOutput = (manifest.totalOutput ?? 0) + outT;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.error(`Done case ${c}: ${okCount}/${SPECS[c].length} ok. Manifest: ${manifestPath}`);
  if (okCount === 0) process.exit(1);
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
