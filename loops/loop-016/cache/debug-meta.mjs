import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
function loadMetaKey() {
  if (process.env.MODEL_API_KEY) return process.env.MODEL_API_KEY;
  const p = join(homedir(), ".config", "opencode", "meta-api-key");
  return readFileSync(p, "utf8").trim();
}
const key = loadMetaKey();
const res = await fetch("https://api.meta.ai/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
  body: JSON.stringify({ model: "muse-spark-1.3-contributor", messages: [{ role: "user", content: "ping" }], max_tokens: 100, temperature: 0.3 }),
});
const t = await res.text();
console.log("HTTP", res.status, "len", t.length);
try {
  const j = JSON.parse(t);
  console.log("usage", JSON.stringify(j.usage));
  console.log("msg keys", Object.keys(j.choices?.[0]?.message ?? {}));
  console.log("content", JSON.stringify((j.choices?.[0]?.message?.content ?? "").slice(0, 300)));
} catch (e) { console.log("fail", t.slice(0, 500)); }
