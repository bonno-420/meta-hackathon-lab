// The review stage (2026-11-04): the assembled page is judged as a
// page — by the reader persona from the planning, and by the client
// who would have to approve it as their own job posting. Until this
// stage existed, the pipeline's previews and checklists never failed
// a bad page: every defect of that class (a wage as the headline,
// image rows with no text, copy that only restates facts) was caught
// by the user looking at the result, and the fixes patched the
// instance instead of the judgement. This module builds the review
// prompt and parses the verdict; the runner (review-page.mjs) calls
// the model, and run-demo treats a fail as a gate: the findings go
// back to generation once, and a second fail stops the run with the
// findings on record.

export const REVIEW_PROMPT_VERSION = "lp-review-v1";

// The page as the reviewer sees it: blocks in page order, each with
// its kind, its visible text, and what each picture shows (the
// design subject / prompt that produced it). Built from the actual
// assembled HTML, not from the plan — the review judges the page
// that exists.
export function pageOutlineFromHtml(html, descriptionsByBasename = {}) {
  const blocks = [];
  const sectionRe = /<section class="([^"]+)">([\s\S]*?)<\/section>/g;
  let m;
  while ((m = sectionRe.exec(html ?? "")) !== null) {
    const kind = m[1];
    const inner = m[2];
    const images = [];
    const imgRe = /<img[^>]*src="([^"]+)"/g;
    let im;
    while ((im = imgRe.exec(inner)) !== null) {
      const base = im[1].split("/").pop();
      images.push({ file: base, shows: descriptionsByBasename[base] ?? null });
    }
    const chips = [...inner.matchAll(/<span class="hero-chip">([^<]*)<\/span>/g)].map((c) => c[1]);
    const text = inner
      .replace(/<img[^>]*>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    blocks.push({ kind, text, chips, images });
  }
  const cta = /<button class="cta-button"[^>]*>([^<]*)<\/button>/.exec(html ?? "");
  if (cta) blocks.push({ kind: "cta", text: cta[1], chips: [], images: [] });
  return blocks;
}

export function buildReviewMessages({ planning, outline }) {
  const appeals = Array.isArray(planning?.appeals) ? planning.appeals : [];
  const system = [
    "You are two reviewers of a finished job-posting landing page, judging the page exactly as it was assembled (blocks in order, below).",
    "",
    "Reviewer 1 — the reader: you are the person described in the audience line. You are deciding whether this job is for you.",
    "Reviewer 2 — the client: you are the company whose job this is. You must decide whether this page may go out as your own job posting.",
    "",
    "Fail the page (verdict \"fail\") when any of these hold, and report each as a finding:",
    "1. job-first: the reader cannot tell what job this is from the top of the page (hero, headline, first cards). The work itself must be the headline or immediately identifiable; a headline that is only a condition (for example the wage) fails, and so does a page where the work content only appears near the bottom.",
    "2. appeal-works: the copy only restates facts (\"X is Y\") without connecting them to the reader. Judge the appeal sentences as a whole: if they read as a list of conditions rather than speaking to the reader, fail, naming the sentences.",
    "3. posting-completeness: a job posting's essentials — the work, the place, the employment type and period, the pay, the hours and break, the holidays, the transport, who can apply — must be present and easy to find. Anything missing, or buried so a reader would miss it, fails.",
    "4. no-mute-blocks: an image shown with no accompanying text, or a block that carries nothing, fails (name the block).",
    "5. client-test: as the client, if this page reads as facts and pictures rather than a designed posting that makes the reader want to apply, fail.",
    "",
    "Rules: judge only what the outline shows. Do not demand facts the posting does not have. A finding's instruction must say concretely what to change in the copy or the arrangement, without inventing new facts. If the page is a posting both reviewers can accept, verdict is \"pass\" with an empty findings list.",
    "Output JSON only, no markdown fences.",
    'Schema: {"verdict":"pass"|"fail","findings":[{"criterion":"job-first"|"appeal-works"|"posting-completeness"|"no-mute-blocks"|"client-test","target":"the block or sentence","problem":"what is wrong","instruction":"what to change"}]}',
  ].join("\n");
  const user = [
    `Audience (the reader persona): ${planning?.audience ?? ""}`,
    "Appeals the page must carry:",
    ...appeals.map((a) => `- ${a.id}: ${a.text}`),
    "",
    "The assembled page, blocks in order:",
    ...outline.map((b, i) => {
      const imgs = b.images.length > 0 ? ` [images: ${b.images.map((im) => im.shows ? `${im.file} = ${im.shows}` : im.file).join("; ")}]` : "";
      const chips = b.chips.length > 0 ? ` [chips: ${b.chips.join(", ")}]` : "";
      return `${i + 1}. (${b.kind})${chips}${imgs} ${b.text}`;
    }),
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function parseReview(content) {
  if (typeof content !== "string") return null;
  const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed = null;
  try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  if (!parsed || (parsed.verdict !== "pass" && parsed.verdict !== "fail")) return null;
  const findings = (Array.isArray(parsed.findings) ? parsed.findings : []).map((f) => ({
    criterion: typeof f?.criterion === "string" ? f.criterion : "client-test",
    target: typeof f?.target === "string" ? f.target : "",
    problem: typeof f?.problem === "string" ? f.problem : "",
    instruction: typeof f?.instruction === "string" ? f.instruction : "",
  })).filter((f) => f.problem.length > 0 || f.instruction.length > 0);
  if (parsed.verdict === "fail" && findings.length === 0) return null;
  return { verdict: parsed.verdict, findings: parsed.verdict === "pass" ? [] : findings };
}

// The findings as regeneration feedback: concrete instructions, in
// the same memo form the coverage send-back uses.
export function reviewFeedbackText(review, priorText = "") {
  const lines = (review?.findings ?? []).map((f) => `- [${f.criterion}] ${f.target ? `${f.target}: ` : ""}${f.instruction || f.problem}`);
  const note = `レビュー（読み手ペルソナ／クライアント審査）の所見。前回の文章は次の点で不合格だった。事実は変えず、構成と訴求を直すこと:\n${lines.join("\n")}\n`;
  return `${priorText ?? ""}${priorText ? "\n" : ""}${note}`;
}
