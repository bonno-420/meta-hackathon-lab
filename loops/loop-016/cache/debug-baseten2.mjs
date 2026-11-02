import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
const p = join(homedir(), ".config", "opencode", "baseten-api-key");
const key = (process.env.BASETEN_API_KEY || readFileSync(p, "utf8").trim());
const caseData = JSON.parse(readFileSync(resolve("loops/loop-016/cases/case-A.json"), "utf8").replace(/^\uFEFF/, ""));
const sys = "You write English LP copy sentences. Output JSON only.";
const user = "Materials: " + caseData.facts.map((f) => f.key + ": " + f.value).join("; ") + ". Write 10 sentences as JSON with schema sentences(text,factKeys,sourceLines).";
for (const mt of [8000]) {
  const res = await fetch("https://inference.baseten.co/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Api-Key " + key },
    body: JSON.stringify({ model: "meta-models/muse-spark-open-1026", messages: [{ role: "system", content: sys }, { role: "user", content: user }], max_tokens: mt, temperature: 0.4 }),
  });
  const t = await res.text();
  console.log("HTTP", res.status, "len", t.length, "max", mt);
  try {
    const j = JSON.parse(t);
    console.log("usage", JSON.stringify(j.usage));
    const msg = j.choices?.[0]?.message ?? {};
    console.log("content-len", (msg.content ?? "").length, "reasoning-len", (msg.reasoning_content ?? "").length);
    console.log("snippet", String(msg.content ?? "").slice(0, 400));
  } catch (e) {
    console.log("parse fail", e.message);
  }
}
