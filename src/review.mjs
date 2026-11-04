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

export const REVIEW_PROMPT_VERSION = "lp-review-v11";

const VERDICT_SCHEMA = 'Schema: {"verdict":"pass"|"fail","findings":[{"criterion":"...","target":"the block, sentence, or planning item","problem":"what is wrong","instruction":"what to change"}]}';
// The researched market patterns (loop-025) include one rule that
// does not need a judge: appeal sentences never close with a
// boilerplate request. run26's copy passed a judge while every
// sentence ended in one, so the scan is deterministic and run-demo
// treats its hits as a fail regardless of the judge's verdict. A
// sentence stating an item is not stated (未記載) is exempt: the
// inquiry invitation there is the user's decided pattern.
// Deterministic detection of Japanese text inside English copy.
// Detection only: whether a hit is a defect is the judgement
// layer's call — Japanese used INTENTIONALLY (a proper noun or a
// term the sentence itself explains) is not residue, and removing
// intentional use would be wrong (the user's refinement,
// 2026-11-04). The scan's job is to make sure the judge SEES every
// hit; leftover fixed notes and marker words are never intentional.
export function japaneseMixingHits(sentences) {
  const hits = [];
  (sentences ?? []).forEach((s, i) => {
    const text = typeof s === "string" ? s : (s?.text ?? "");
    if (/[぀-ヿ一-鿿]/.test(text)) hits.push({ index: i, text });
  });
  return hits;
}

export function boilerplateHits(sentences) {
  const hits = [];
  (sentences ?? []).forEach((s, i) => {
    const text = typeof s === "string" ? s : (s?.text ?? "");
    if (/未記載/.test(text)) return;
    if (/(ご確認|ご検討|お問い合わせ|ご応募)ください/.test(text)) hits.push({ index: i, text });
  });
  return hits;
}

const REVIEW_RULES = "Rules: judge only what you are shown. Do not demand facts the posting does not have. A finding's instruction must say concretely what to change, without inventing new facts. If both reviewers can accept it, verdict is \"pass\" with an empty findings list. Output JSON only, no markdown fences.";

// Planning review: the plan is judged before anything is generated —
// as the reader (does this plan speak to me, in my decision order?)
// and as the client (is this a plan for a posting I would approve?).
export function buildPlanningReviewMessages({ planning }) {
  const appeals = Array.isArray(planning?.appeals) ? planning.appeals : [];
  const specs = Array.isArray(planning?.imageSpecs) ? planning.imageSpecs : [];
  const system = [
    "You are two reviewers of a job-posting LP PLAN, before anything is generated.",
    "Reviewer 1 — the reader: the person described in the audience. Reviewer 2 — the client company whose job this is.",
    "Fail the plan (verdict \"fail\") when any of these hold:",
    "1. audience-fit: the audience is vague, or the appeals do not match what this reader would actually check and care about.",
    "2. appeal-grounding: an appeal is not grounded in a fact key or an original line, or promises something the posting does not state.",
    "3. decision-order — two DIFFERENT orders, judged separately (the user's confirmed separation, 2026-11-04): (a) firstCheckKeys govern the page furniture — hero chips and the first cards — and must be the facts this reader would check first when deciding. (b) The appeals' SEQUENCE is a narrative: it opens with the work itself, then the posting's distinctive advantage, then the rest. A first-check fact appearing later in the appeal sequence is NOT a defect; a conditions appeal opening the sequence ahead of the work itself IS a defect (see also client-test). Fail only the order that is actually wrong, and say which one.",
    "4. image-design: the image specs do not cover the appeals they should carry, or text/numbers inside the image. Standing design rules apply after planning: a spec whose subject is a workplace/building exterior is replaced at design time with an interior work scene, and vehicle/cash/clock subjects are sent back — so do not fail a spec for wording the design step replaces; DO fail when an appeal or the plan's structure depends on a prohibited subject (for example an appeal that sells the building's appearance).",
    "5. client-test: as the client, this plan would not lead to a posting you could approve (for example it leads with a condition instead of the job itself).",
    "6. advantage-conversion: the plan must convert the posting's comparative advantages into appeal points. The strongest stated advantage (an unusually high wage, full coverage, a qualification path, a rare schedule fit) must come early in the appeal sequence — right after the work itself — not buried; an ordinary condition (a market-rate wage) does not outrank a distinctive advantage merely by being a first check for the chips. No appeal may claim a strength the original does not support. When the posting's stated conditions are ordinary, framing what is stated plainly is not a failure.",
    REVIEW_RULES,
    VERDICT_SCHEMA,
  ].join("\n");
  const user = [
    `Audience: ${planning?.audience ?? ""}`,
    `First checks (what the reader checks first): ${(planning?.firstCheckKeys ?? []).join(", ")}`,
    "Appeals:",
    ...appeals.map((a) => `- ${a.id}: ${a.text} (factKeys: ${(a.factKeys ?? []).join(", ") || "none"}; sourceLines: ${(a.sourceLines ?? []).join(", ") || "none"})`),
    "Image specs:",
    ...specs.map((s) => `- ${s.id} (role ${s.role ?? ""}): ${s.description ?? ""}`),
    `Must not say / imply: ${(planning?.notSay ?? []).map((n) => n.text ?? n.key ?? "").filter(Boolean).join("; ") || "none listed"}`,
  ].join("\n");
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

// Copy review: at the text checkpoint, before images and assembly —
// the persona reads the sentences as the page's copy.
export function buildCopyReviewMessages({ planning, generation }) {
  const appeals = Array.isArray(planning?.appeals) ? planning.appeals : [];
  const sentences = Array.isArray(generation?.sentences) ? generation.sentences : [];
  const system = [
    "You are two reviewers of the COPY for a job-posting landing page (the sentences, in order, before layout).",
    "Reviewer 1 — the reader: the person described in the audience. Reviewer 2 — the client company whose job this is.",
    "Fail the copy (verdict \"fail\") when any of these hold:",
    "1. job-first: the reader cannot tell what job this is from the first sentence(s); the work itself must be stated up front, not buried after conditions.",
    "2. appeal-works: sentences that only restate facts (\"X is Y\") without connecting them to the reader. Judge as a whole; if the copy reads as a list of conditions, fail, naming the sentences.",
    "3. reader-fit: the copy does not speak to this audience (their hours, their area, their situation), or its tone/register is wrong for a job posting from the employer.",
    "4. client-test: as the client, this copy could not go out as your posting (awkward, templated to the point of insincerity, or missing the essentials a posting needs).",
    "5. appeal-patterns: judged against the researched patterns of this market (public job ads, abstracted in loop-025): appeals are short assertions, one point per sentence; each condition is paired with what it means in the reader's life; a low-barrier appeal is paired with its concrete ground. Boilerplate request closings (ご確認ください / ご検討ください / お問い合わせください) on appeal sentences fail this criterion — an inquiry invitation is allowed only on a sentence that states an item is not stated (未記載).",
    "6. reader-conversion: appeals that the condition cards do not carry are the posting's charm beyond the bare conditions. Their sentences must be converted into reader-addressed copy — who this suits, what worry it answers — not left as bare fact statements. Fail when such an appeal's sentence only restates its fact. (The headline sentence is also judged here: it must be short — the job and the place only. A headline that packs in employment type, period, or appeal phrasing fails.)",
    "7. ending-variation: the conversion must not collapse into one repeated sentence ending. When most sentences close with the same formula tail (for example 〜に向いています / 〜に合っています / 〜やすいです in Japanese, or the same closing clause in English), the copy reads as machine-templated: fail, naming the repeated tail, and instruct varied, plain assertion endings instead.",
    "8. appeal-not-explanation: the copy must APPEAL, not explain. A sentence that neutrally explains or describes a condition (how shifts are planned, how the workplace is arranged) without giving the reader a reason to want the job fails this criterion, even when it is factual and reader-addressed in form. Each appeal sentence should land as a short assertion of a concrete good for the reader (the user's review of FICT-E03, 2026-11-04: the copy still read as explanation).",
    "9. language-purity: on an English page, Japanese text inside a sentence fails when it is residue — a leftover fixed note, a Japanese marker word, a template fragment. Japanese used INTENTIONALLY does not fail: a Japanese proper noun, or a term the sentence itself explains for the reader. The deterministic scan's hits are listed below the copy; judge each hit on that distinction (the user's refinement, 2026-11-04: intentional use must not be removed).",
    "10. semantic-accuracy (mandatory pass/fail): a sentence that changes the MEANING of a stated fact fails regardless of fluency — amounts, times, and caps altered or softened ('up to' dropped, 'weekdays only' loosened), negations lost, conditions merged into claims the original does not make, or a benefit attributed to the wrong condition. Paraphrase that preserves meaning exactly is not a finding.",
    "11. language-quality: judge naturalness and appeal by the standards of the copy's OUTPUT LANGUAGE and the TARGET REGION named in the audience (its job-ad conventions, register, and ordinary phrasing). Fail ONLY when the copy is below practical level for that language and region — a native reader there would stumble, the phrasing reads as machine translation, or the register is wrong for the region's job postings. Regional variants, register choices, and phrasing preferences WITHIN practical level are not findings and must not send the copy back for re-revision (the user's instruction, 2026-11-04: lightweight evaluation; no preference-driven rework).",
    "12. natural-and-sufficient: is the copy natural in its target language, and does it convey the necessary and sufficient information as concisely as possible? Fail on a section mixing roles (another appeal's facts imported), a fact repeated in the body that the details table already carries, or wording longer than its meaning needs — never on shortening that would drop a fact, a condition, or a qualifier. (The user's formulation, 2026-11-04.)",
    REVIEW_RULES,
    VERDICT_SCHEMA,
  ].join("\n");
  const mixing = planning?.language === "en" ? japaneseMixingHits(sentences) : [];
  const user = [
    `Audience (the reader persona): ${planning?.audience ?? ""}`,
    "Appeals the copy must carry:",
    ...appeals.map((a) => `- ${a.id}: ${a.text}`),
    "",
    "The copy, sentences in order:",
    ...sentences.map((s, i) => `${i + 1}. ${s.text}`),
    ...(mixing.length > 0 ? [
      "",
      "Deterministic scan — sentences containing Japanese text (judge each under criterion 9, language-purity):",
      ...mixing.map((h) => `- sentence ${h.index + 1}: ${h.text}`),
    ] : []),
  ].join("\n");
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

// Sample (key visual / finished image) review: the sample is judged
// from its composition record — the blocks in order, what each image
// shows, and the purposes they serve — against the persona's
// decision order and the appeals.
export function sampleOutlineFromLayout(layoutRecord, imageDesign) {
  const entries = Array.isArray(imageDesign) ? imageDesign : (imageDesign?.images ?? []);
  const designById = new Map(entries.map((d) => [d.id, d]));
  const blocks = [];
  for (const m of layoutRecord?.messageMap ?? []) {
    const carries = m?.carries ?? {};
    if (m.block === "hero-photo") {
      const d = designById.get(carries.specId);
      blocks.push({ kind: "hero-photo", text: "", chips: [], images: [{ file: carries.specId ?? "hero", shows: d ? `${d.subject} (${d.purpose ?? ""})` : null }] });
    } else if (m.block === "title") {
      blocks.push({ kind: "title", text: "(the work-content sentence is placed here)", chips: [], images: [] });
    } else if (m.block === "condition-card") {
      blocks.push({ kind: "condition-card", text: `(fact card: ${carries.factKey ?? ""})`, chips: [], images: [] });
    } else if (m.block === "photo-band") {
      const d = designById.get(carries.specId);
      blocks.push({ kind: "photo-band", text: d?.purpose ? `(carries: ${d.purpose})` : "", chips: [], images: [{ file: carries.specId ?? "", shows: d ? d.subject : null }] });
    } else if (m.block === "appeal-row") {
      blocks.push({ kind: "appeal-row", text: "(a condition appeal carried by text, no image)", chips: [], images: [] });
    } else if (m.block === "details") {
      blocks.push({ kind: "details", text: "(remaining facts)", chips: [], images: [] });
    } else if (m.block === "cta") {
      blocks.push({ kind: "cta", text: "(apply)", chips: [], images: [] });
    }
  }
  return blocks;
}

export function buildSampleReviewMessages({ planning, outline }) {
  const appeals = Array.isArray(planning?.appeals) ? planning.appeals : [];
  const system = [
    "You are two reviewers of a job-posting page's SAMPLE (the finished-image mock): its composition — blocks in order, what each image shows, what each block carries. The text is not final at this stage; judge the composition and the images.",
    "Reviewer 1 — the reader: the person described in the audience. Reviewer 2 — the client company whose job this is.",
    "Fail the sample (verdict \"fail\") when any of these hold:",
    "1. job-first: the composition does not let the reader tell what job this is at the top (hero image and headline); a hero that shows a building exterior, or a scene unrelated to the work, fails.",
    "2. image-fit: an image's subject does not match the appeal or fact it carries, or implies something the posting does not state (a dormitory/bedroom, cash, a specific clock time, a commute vehicle as the subject).",
    "3. decision-order: the block order fights the reader's decision order (what they check first comes late; the work itself is buried).",
    "4. client-test: as the client, this composition would not become a posting you could approve.",
    REVIEW_RULES,
    VERDICT_SCHEMA,
  ].join("\n");
  const user = [
    `Audience (the reader persona): ${planning?.audience ?? ""}`,
    "Appeals the page must carry:",
    ...appeals.map((a) => `- ${a.id}: ${a.text}`),
    "",
    "The sample, blocks in order:",
    ...outline.map((b, i) => {
      const imgs = b.images.length > 0 ? ` [images: ${b.images.map((im) => im.shows ? `${im.file} = ${im.shows}` : im.file).join("; ")}]` : "";
      return `${i + 1}. (${b.kind})${imgs} ${b.text}`;
    }),
  ].join("\n");
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

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
    "2. appeal-works: the copy only restates facts (\"X is Y\") without connecting them to the reader. Judge the appeal sentences as a whole: if they read as a list of conditions rather than speaking to the reader, fail, naming the sentences. Judge against the researched market patterns (loop-025): short assertions, each condition paired with its meaning for the reader; boilerplate request closings (ご確認ください / ご検討ください) on appeal sentences fail here too.",
    "3. posting-completeness: a job posting's essentials — the work, the place, the employment type and period, the pay, the hours and break, the holidays, the transport, who can apply — must be present and easy to find. Anything missing, or buried so a reader would miss it, fails.",
    "4. no-mute-blocks: an image shown with no accompanying text, or a block that carries nothing, fails (name the block).",
    "5. client-test: as the client, if this page reads as facts and pictures rather than a designed posting that makes the reader want to apply, fail.",
    "6. first-view-priority: the first view (headline, hero chips, the first cards) must foreground this posting's strongest deciding facts — for hourly-paid work the wage, a stated barrier-remover such as no-experience-needed, a distinctive benefit. If a strong deciding fact sits mid-page or lower while weaker facts (generic hours, the bare location) dominate the top, fail, naming what should lead (the user's review of FICT-E03 run2, 2026-11-04).",
    "7. page-density: judge the WHOLE page's information design, not single sentences (the user's instruction, 2026-11-04): the same information or appeal must not be repeated across several sections; each section carries one role; the first view states the work and the main conditions concisely; a merit merely inferred from a condition must not be explained at length; and what the details table already shows must not be explained item by item in the body. ALLOWED and not findings: a concise summary of decision-critical conditions, and their re-listing in the details table. Fail when the page's density, duplication, or readability falls below what a posting needs — and stop there: when the page is sufficient, pass it; do not send back preferences.",
    "",
    "Rules: judge only what the outline shows. Do not demand facts the posting does not have. A finding's instruction must say concretely what to change in the copy or the arrangement, without inventing new facts. If the page is a posting both reviewers can accept, verdict is \"pass\" with an empty findings list.",
    "Output JSON only, no markdown fences.",
    'Schema: {"verdict":"pass"|"fail","findings":[{"criterion":"job-first"|"appeal-works"|"posting-completeness"|"no-mute-blocks"|"client-test"|"first-view-priority"|"page-density","target":"the block or sentence","problem":"what is wrong","instruction":"what to change"}]}',
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
