import { existsSync, statSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
const cases = ["A", "B", "C", "D", "E", "F"];
for (const c of cases) {
  const gid = `C-${c}`;
  const gj = `loops/loop-016/generations/case-${c}/gen-001.json`;
  const gm = `loops/loop-016/generations/case-${c}/gen-001.md`;
  const pv = `loops/loop-016/previews/case-${c}-gen-001.html`;
  const cp = `loops/loop-016/previews/case-${c}-gen-001-complete.html`;
  const rv = `loops/loop-016/reviews/case-${c}-gen-001-review.md`;
  const rec = JSON.parse(readFileSync(resolve(gj), "utf8").replace(/^\uFEFF/, ""));
  const html = readFileSync(resolve(cp), "utf8");
  const hasMemo = html.includes('id="lp-memo"');
  const hasB64 = (html.match(/data:image\/webp;base64/g) || []).length;
  console.log(`${gid}: json=${statSync(resolve(gj)).size}b md=${statSync(resolve(gm)).size}b preview=${existsSync(resolve(pv)) ? statSync(resolve(pv)).size + "b" : "MISSING"} complete=${statSync(resolve(cp)).size}b memo=${hasMemo} imgs=${hasB64} ok=${rec.ok} pass=${rec.conformance?.pass} needsFix=${rec.prose?.needsFixCount} usage=${rec.usage?.prompt_tokens}/${rec.usage?.completion_tokens}/${rec.usage?.total_tokens} insights=${(rec.insightsApplied || []).join(",") || "none"}`);
}
const imgs = readdirSync(resolve("loops/loop-016/previews/images")).filter((f) => f.endsWith(".webp") || f.endsWith(".png"));
console.log(`images: ${imgs.length} files`);
let total = 0;
for (const f of imgs) total += statSync(resolve(`loops/loop-016/previews/images/${f}`)).size;
console.log(`images total bytes: ${total}`);
const man = JSON.parse(readFileSync(resolve("loops/loop-016/previews/images/manifest.json"), "utf8"));
console.log(`manifest entries: ${man.images.length} ok=${man.images.filter((e) => !e.error).length} totalInput=${man.totalInput} totalOutput=${man.totalOutput}`);
const ins = readdirSync(resolve("loops/loop-016/insights")).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
console.log(`insights: ${ins.join(", ")}`);
