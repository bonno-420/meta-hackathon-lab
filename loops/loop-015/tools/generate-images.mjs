import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const metaKey = readFileSync(join(homedir(), ".config", "opencode", "meta-api-key"), "utf8").trim();
const endpoint = "https://api.meta.ai/v1/images/generations";

// All 8 prompts: 4 for T-A (retail/warm), 4 for T-B (care/sage)
// Constraint: no text, no numbers, no logos in images
const IMAGE_SPECS = [
  {
    id: "TA-hero",
    prompt: "Bright modern retail supermarket exterior entrance in Setagaya Tokyo, morning sunlight, clean glass doors, warm welcoming storefront, subtle greenery, photorealistic, wide angle, daytime, no text, no numbers, no logos",
    size: "1024x1024",
  },
  {
    id: "TA-cashier",
    prompt: "Young retail cashier smiling at bright modern supermarket checkout counter, clean store interior, natural daylight, customer in soft background blur, warm atmosphere, photorealistic, no text, no numbers, no logos",
    size: "1024x1024",
  },
  {
    id: "TA-training",
    prompt: "Friendly senior staff showing a new young retail employee how to use the cash register, bright backroom training area, warm supportive atmosphere, photorealistic, no text, no numbers, no logos",
    size: "1024x1024",
  },
  {
    id: "TA-neighborhood",
    prompt: "Quiet pleasant residential street in Setagaya Tokyo, daytime, trees lining the street, small local shops, calm suburban neighborhood, soft natural light, photorealistic, wide shot, no text, no numbers, no logos",
    size: "1024x1024",
  },
  {
    id: "TB-hero",
    prompt: "Bright warm care facility entrance in Yokohama, daytime, modern welcoming building with potted plants and soft landscaping, gentle sunlight, calm and clean atmosphere, photorealistic, wide angle, no text, no numbers, no logos",
    size: "1024x1024",
  },
  {
    id: "TB-meal",
    prompt: "Kind care worker gently helping an elderly person with a meal in a bright airy dining room, warm natural light through windows, soft caring atmosphere, photorealistic, no text, no numbers, no logos",
    size: "1024x1024",
  },
  {
    id: "TB-training",
    prompt: "New young care worker shadowing an experienced senior colleague walking together in a bright modern care facility hallway, gentle guidance, warm supportive feeling, photorealistic, no text, no numbers, no logos",
    size: "1024x1024",
  },
  {
    id: "TB-neighborhood",
    prompt: "Quiet pleasant residential area in Yokohama, daytime, tree-lined street with houses, calm family neighborhood, soft daylight, photorealistic, wide shot, no text, no numbers, no logos",
    size: "1024x1024",
  },
];

async function generateOne(spec) {
  const body = { model: "muse-image-1.0", prompt: spec.prompt, n: 1, size: spec.size };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${metaKey}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 800)}`);
  }
  if (!json.data?.[0]?.b64_json) throw new Error(`No b64_json in response: ${JSON.stringify(json).slice(0, 500)}`);
  const b64 = json.data[0].b64_json;
  // Detect mime from magic bytes: webp starts with RIFF/WEBP, but we just use webp as Meta returns
  // Check: if b64 starts with UklG -> webp
  const mime = b64.startsWith("UklG") ? "image/webp" : "image/png";
  console.log(`  ${spec.id}: ok ${b64.length} chars mime=${mime}`);
  return { ...spec, b64, mime, usage: json.usage ?? null };
}

const outDir = join(import.meta.dirname, "..", "previews", "images");
mkdirSync(outDir, { recursive: true });

const manifest = [];
let totalInput = 0, totalOutput = 0;

for (const spec of IMAGE_SPECS) {
  console.log(`Generating ${spec.id}...`);
  try {
    const result = await generateOne(spec);
    const ext = result.mime === "image/webp" ? "webp" : "png";
    const fileName = `${result.id}.${ext}`;
    const filePath = join(outDir, fileName);
    writeFileSync(filePath, Buffer.from(result.b64, "base64"));
    console.log(`  saved ${filePath} (${Buffer.from(result.b64, "base64").length} bytes)`);
    if (result.usage) {
      totalInput += result.usage.input_tokens ?? 0;
      totalOutput += result.usage.output_tokens ?? 0;
    }
    manifest.push({ id: result.id, file: `images/${fileName}`, prompt: result.prompt, mime: result.mime, bytes: Buffer.from(result.b64, "base64").length });
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 800));
  } catch (e) {
    console.error(`  FAILED ${spec.id}: ${e.message}`);
    manifest.push({ id: spec.id, error: e.message, prompt: spec.prompt });
  }
}

const manifestPath = join(outDir, "manifest.json");
writeFileSync(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), model: "muse-image-1.0", endpoint, totalInput, totalOutput, images: manifest }, null, 2));
console.log(`\nDone. Manifest: ${manifestPath}`);
console.log(`Total input_tokens=${totalInput} output_tokens=${totalOutput}`);
console.log(`Success: ${manifest.filter(m => !m.error).length}/${manifest.length}`);
