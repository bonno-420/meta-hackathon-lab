// The image-design step (loop-023): before any image is generated, the
// pipeline designs the images from the approved planning — how many,
// what each one shows, how it is depicted, and where it sits.
// Depiction policy (the user's decision, 2026-11-04, D13):
// photorealistic is fine for every role — imagery of the work and of
// people at work is impression material, and making it look more
// fictional serves nothing. The standing bans are about content, not
// style: never invent a workplace or building exterior, in any style
// (G9); an explanatory image stays small, because a large one reads
// as a record of the actual site (G6); plus the prompt gates G1–G5.
// (An earlier implementation made every image an illustration; that
// was the coordinator's chosen means, not the user's instruction,
// and the user corrected it.) Pointed-out issues become standing
// gates in src/dicts/image-gates-v1.json and are checked here and in
// the layout.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const IMAGE_GATES = JSON.parse(readFileSync(path.join(here, "dicts/image-gates-v1.json"), "utf8")).gates;

export const IMAGE_STYLE = "photorealistic photograph, natural light, calm neutral palette, no icons, no symbols, no pictograms";

// Appeal-derived lifestyle scenes were removed (loop-025): the
// researched market composition gives condition appeals no image at
// all (see the no-image decision in buildImageDesign below).
// The neutral work scene used when a spec asks for an exterior
// (replaced under G9). It must stay job-neutral: an earlier
// parcel-sorting wording was FICT-J02's content leaking into the
// system default, and FICT-E02 (woodwork) appeal images came out as
// parcel scenes (2026-11-04). The job's own scenes come from the
// planning's spec descriptions and appeal texts, not from this
// default.
const WORK_SCENE = "The work itself: people doing the hands-on tasks of the job at a work table";
const EXTERIOR_RE = /exterior|facade|外観|建物の外|entrance of/i;

const MUST_NOT_IMPLY = [
  "寮・寝室を思わせる要素",
  "現金・金額の含意",
  "特定の時刻",
  "通勤手段や車両を主役にすること",
  "読める文字・数字・ロゴ",
];

const COMPOSITION = {
  // The composition frames the DESIGNED SUBJECT, never the building:
  // an earlier wording ("the workplace building itself is the
  // subject") re-instructed an exterior even after the design had
  // replaced the subject with the work itself, and the generated LP
  // hero became an invented warehouse exterior (independent review
  // of run20, 2026-11-04). Composition text is part of the prompt
  // and is gated like the subject.
  hero: "Wide establishing shot of the scene described; the described subject fills the frame; impression-level, with no specific factual claim",
  section: "The work activity itself, as an explanatory image beside the text it explains",
  place: "The surrounding area of the workplace, as a small explanatory image",
};
// Benefit-image compositions (I-4): appeal-derived images share the
// work anchor as their subject, so the composition is what varies
// between them — otherwise several benefit images come out as the
// same scene repeated.
const BENEFIT_COMPOSITIONS = [
  "Close view of hands performing the task at the work station, the job's materials in frame, as a small explanatory image beside the text it explains",
  "A worker performing the task at the work station, seen from the side, the job's materials around them, as a small explanatory image beside the text it explains",
  "The job's tools and materials arranged at the work station while a worker's hands are at work on them, as a small explanatory image beside the text it explains",
];
const DEFAULT_SUBJECT = {
  hero: "People doing the work at a fictional workplace",
  section: "People doing the work at a fictional workplace",
  place: "The street around a fictional workplace",
};
function roleKind(role) {
  if (role === "key-visual") return "hero";
  if (role === "place") return "place";
  return "section";
}
function factLabel(facts, key) {
  const item = (facts?.items ?? []).find((i) => i.key === key);
  return item?.label ?? key;
}

// Build the image design record from the approved planning and facts.
// Every designed image carries its purpose (the appeal or fact it
// serves); an image with no purpose is not designed and not generated.
// The count is designed, not inherited from the spec list: after the
// spec images, every appeal that is not served by a condition card
// alone (its facts are not all first-check facts) gets an explanatory
// image of its own, and every appeal served by a card alone gets an
// explicit no-image decision with its reason — so the number of
// images follows the copy and the appeals, and the decision is on
// record for every appeal.
// Whether an appeal earns an in-content image (user principle,
// 2026-11-04): appeal images are not decoration; they are made to
// reduce the reader's cognitive load where the header cannot carry
// the explanation. Two questions decide: is there a strong benefit
// (full commuting coverage, performance pay, a named allowance, a
// qualification path), and does an area/facility explanation itself
// work as an appeal (easy commute, location)? A capped actual-cost
// reimbursement is the ordinary case the market carries by text
// (loop-025 CP2), so it does not qualify on its own. A warranted
// image is anchored on the work at the workplace — never on a
// commute method or on money itself (the standing gates).
const STRONG_BENEFIT_RE = /(全額|成果給|業績給|手当|賞与|ボーナス|昇給|日払い|週払い|即日払|資格取得|資格支援|fully covered|performance pay|allowance|bonus|qualification)/i;
const AREA_APPEAL_RE = /(駅|通いやす|立地|アクセス|徒歩|near|station|easy commute|well located|location)/i;
export function appealImageDecision(appeal, facts) {
  const factText = (appeal?.factKeys ?? []).map((k) => (facts?.items ?? []).find((i) => i.key === k)?.value ?? "").join(" ");
  const text = `${appeal?.text ?? ""} ${factText}`;
  if (STRONG_BENEFIT_RE.test(text)) return { image: true, kind: "strong-benefit", reason: "強いメリットの訴求。文章だけでは負荷が高いので、職場の仕事の場面を視覚の足場にして認知負荷を下げる" };
  if ((appeal?.factKeys ?? []).includes("workLocation") && AREA_APPEAL_RE.test(appeal?.text ?? "")) return { image: true, kind: "area", reason: "エリア・立地の訴求。場所の手がかりを職場の場面で示し、文章の負荷を下げる" };
  return { image: false, kind: "text", reason: "条件の訴求は文章・カード・チップで担う（市場の構成の型、loop-025）。飾りの画像は作らない" };
}

// What the header fronts (user principle, 2026-11-04): the header
// is the face of the appeal, and its focus follows what is being
// pushed — the wage number, monthly income, the job itself, the
// area, or another merit such as a qualification.
export function headerFocusOf(planning) {
  const lead = (planning?.appeals ?? [])[0] ?? null;
  if (!lead) return { appealId: null, focus: "job" };
  const keys = lead.factKeys ?? [];
  let focus = "merit";
  if (keys.includes("salaryHourly") || keys.includes("salaryDaily")) focus = "wage";
  else if (keys.includes("monthlyIncomeGuarantee") || keys.includes("monthlySalary") || keys.includes("salaryAnnual") || /月収/.test(lead.text ?? "")) focus = "income";
  else if (keys.includes("workLocation")) focus = "area";
  else if (keys.length === 0) focus = "job";
  return { appealId: lead.id, focus };
}

export function buildImageDesign(planning, facts) {
  const appeals = new Map((planning?.appeals ?? []).map((a) => [a.id, a]));
  const images = [];
  const designNotes = [];
  const servedAppeals = new Set();
  for (const spec of planning?.imageSpecs ?? []) {
    const kind = roleKind(spec.role);
    const basis = spec.basis ?? {};
    // The purpose states what the image COMMUNICATES. A work-scene
    // image grounded on a fact (the work happens at the stated
    // location) does not present that fact — it shows the work — so
    // its purpose is the spec's description of what it shows; the
    // grounding itself stays on the spec's basis. Only a place
    // image presents its fact. (Measured in loop-027 run1: a work
    // photo whose purpose was the bare label "workLocation" was
    // failed by the sample review as not matching what it carries.)
    const purpose = typeof basis.appealId === "string"
      ? (appeals.get(basis.appealId)?.text ?? null)
      : typeof basis.factKey === "string"
        ? (kind === "place" || typeof spec.description !== "string" || spec.description.length === 0
          ? factLabel(facts, basis.factKey)
          : spec.description)
        : (typeof spec.purpose === "string" ? spec.purpose : null);
    // Depiction is photorealistic for every role (the user's
    // decision, 2026-11-04, D13). What G9 bans is the exterior as a
    // subject, in any style; that check follows below.
    const depiction = "photorealistic";
    const styleText = IMAGE_STYLE;
    let subject = typeof spec.description === "string" && spec.description.length > 0 ? spec.description : DEFAULT_SUBJECT[kind];
    if (EXTERIOR_RE.test(subject)) {
      // The spec asks for a workplace/building exterior. The user
      // forbids inventing one (2026-11-04): the design replaces the
      // subject with the work itself and records the replacement.
      designNotes.push({ imageId: spec.id, rule: "G9", action: "subject-replaced", from: subject, to: WORK_SCENE });
      subject = WORK_SCENE;
    }
    const composition = COMPOSITION[kind];
    if (typeof basis.appealId === "string") servedAppeals.add(basis.appealId);
    images.push({
      id: spec.id,
      role: spec.role,
      kind,
      source: "spec",
      appealId: typeof basis.appealId === "string" ? basis.appealId : null,
      purpose,
      subject,
      composition,
      depiction,
      styleText,
      placement: kind === "hero"
        ? { area: "hero", size: "large", aspect: spec.design?.aspect ?? "4:3" }
        : { area: "inline", size: "small", aspect: spec.design?.aspect ?? "4:3" },
      mustNotImply: [...MUST_NOT_IMPLY, ...(planning?.notSay ?? []).map((n) => n.text ?? n.key).filter(Boolean)],
      prompt: `${subject}. ${composition}. ${styleText}, no text, no numbers, no logos, no watermark`,
    });
  }
  // A hero whose spec subject was an exterior had its subject
  // replaced with the neutral work scene (G9) — but the neutral
  // scene carries no job, and the image model renders "hands-on
  // tasks at a work table" as whatever craft it likes (run23: a
  // sewing atelier as the face of a logistics sorting job). When the
  // planning has a work spec with its own subject, the hero adopts
  // that subject: the same job, in the hero's composition.
  const heroEntry = images.find((e) => e.kind === "hero" && designNotes.some((n) => n.imageId === e.id && n.action === "subject-replaced"));
  if (heroEntry) {
    const workEntry = images.find((e) => e !== heroEntry && e.source === "spec" && /work/i.test(`${e.id} ${e.role ?? ""}`) && e.subject !== WORK_SCENE);
    if (workEntry) {
      designNotes.push({ imageId: heroEntry.id, rule: "G9", action: "subject-from-work-spec", from: heroEntry.subject, to: workEntry.subject });
      heroEntry.subject = workEntry.subject;
      heroEntry.prompt = `${heroEntry.subject}. ${heroEntry.composition}. ${heroEntry.styleText}, no text, no numbers, no logos, no watermark`;
    }
  }
  {
    const heroFinal = images.find((e) => e.kind === "hero");
    if (heroFinal) {
      const hf = headerFocusOf(planning);
      heroFinal.frontsAppealId = hf.appealId;
      heroFinal.headerFocus = hf.focus;
    }
  }
  const firstCheck = new Set(planning?.firstCheckKeys ?? []);
  const noImage = [];
  for (const a of planning?.appeals ?? []) {
    if (servedAppeals.has(a.id)) continue;
    // An appeal grounded in nothing (no fact key, no source line) is
    // a planning defect: it gets no image and no no-image decision,
    // so the coverage check below fails and the run stops.
    const grounded = (Array.isArray(a.factKeys) && a.factKeys.length > 0) || (Array.isArray(a.sourceLines) && a.sourceLines.length > 0);
    if (!grounded) continue;
    const keys = Array.isArray(a.factKeys) ? a.factKeys : [];
    const cardOnly = keys.length > 0 && keys.every((k) => firstCheck.has(k));
    if (cardOnly) {
      noImage.push({ appealId: a.id, reason: "この訴求は条件カード（第一確認の事実）が担うため、画像は作らない" });
      continue;
    }
    // In-content appeal images follow the cognitive-load judgement
    // (appealImageDecision): a strong benefit or an area appeal
    // earns a work-anchored image; everything else is carried by
    // text and the layout places it as a text row. The earlier
    // lifestyle-scene-per-appeal design (a family sofa for the
    // holidays appeal, a walking commuter for the transport
    // allowance) implied facts the posting does not state and
    // failed the sample review (run28, 2026-11-04) — that class of
    // subject stays prohibited by the gates.
    const decision = appealImageDecision(a, facts);
    if (decision.image) {
      // Benefit images are anchored to the posting's concrete work
      // (intervention I-4, measured in loop-026 runs 1/3/5): with
      // the neutral work scene as their subject, the image model
      // rendered generic craft-classroom scenes for housing and
      // qualification benefits, and multiple benefit images came
      // out near-identical. The anchor is the work spec's subject —
      // the same source the hero adoption uses — and the
      // composition varies per benefit image so they do not repeat.
      const anchorEntry = (planning?.imageSpecs ?? []).map((sp) => images.find((e) => e.id === sp.id)).find((e) => e && e.source === "spec" && /work/i.test(`${e.id} ${e.role ?? ""}`) && e.subject !== WORK_SCENE);
      const benefitIdx = images.filter((e) => e.source === "appeal").length;
      const subject = anchorEntry ? anchorEntry.subject : WORK_SCENE;
      const composition = BENEFIT_COMPOSITIONS[benefitIdx % BENEFIT_COMPOSITIONS.length];
      if (anchorEntry) designNotes.push({ imageId: `appeal-${a.id}`, rule: "I-4", action: "benefit-image-anchored-to-work", from: WORK_SCENE, to: subject });
      images.push({
        id: `appeal-${a.id}`,
        role: "section",
        kind: "section",
        source: "appeal",
        appealId: a.id,
        purpose: `${a.text} — ${decision.reason}`,
        subject,
        composition,
        depiction: "photorealistic",
        styleText: IMAGE_STYLE,
        placement: { area: "inline", size: "small", aspect: "4:3" },
        mustNotImply: [...MUST_NOT_IMPLY, ...(planning?.notSay ?? []).map((n) => n.text ?? n.key).filter(Boolean)],
        prompt: `${subject}. ${composition}. ${IMAGE_STYLE}, no text, no numbers, no logos, no watermark`,
      });
      servedAppeals.add(a.id);
    } else {
      noImage.push({ appealId: a.id, reason: decision.reason });
    }
  }
  // The pre-generation confirmations (the user's spec, 2026-11-04):
  // before any image is generated, the design records (1) whether
  // important parts the hero does not explain are covered by another
  // image, and (2) whether benefits/treatment that must have an
  // image got one. Work-scene photos stay at hero + about one; any
  // further images come from these checks, never from a cap and
  // never from decoration.
  const coverageChecks = {
    workScenes: images.filter((e) => e.source === "spec" || e.kind === "hero").map((e) => e.id),
    beyondHero: images.filter((e) => e.kind !== "hero").map((e) => ({ id: e.id, purpose: e.purpose })),
    mustImageBenefits: (planning?.appeals ?? []).filter((a) => { const d = appealImageDecision(a, facts); return d.image && d.kind === "strong-benefit"; }).map((a) => a.id),
    note: "生成前の確認: ヒーローで説明できていない大事な部分は beyondHero の画像が担う。福利厚生・待遇で必ず画像にするものは mustImageBenefits に対応する画像があること",
  };
  return { version: "image-design-v2", count: images.length, images, noImage, designNotes, coverageChecks };
}

// Design-stage checks, including the design-kind gates (G6, G7) and
// the count rules: exactly one hero, at most one place image.
export function checkImageDesign(design, planning) {
  const failures = [];
  if (planning && Array.isArray(planning.appeals)) {
    const imaged = new Set((design?.images ?? []).map((e) => e.appealId).filter(Boolean));
    const skipped = new Set((design?.noImage ?? []).map((n) => n.appealId));
    const specServed = new Set((planning.imageSpecs ?? []).map((sp) => sp?.basis?.appealId).filter(Boolean));
    for (const a of planning.appeals) {
      if (!imaged.has(a.id) && !skipped.has(a.id) && !specServed.has(a.id)) {
        failures.push(`訴求 ${a.id} に対応する画像の設計も、作らない判断の記録もない（G7）`);
      }
    }
  }
  const images = design?.images ?? [];
  // Gate promotion G-C (approved by the user, 2026-11-04): a design
  // without the pre-generation confirmation record (coverageChecks:
  // what the hero does not explain, and the benefits that must have
  // an image) has not done the confirmation the design step exists
  // for, and fails here.
  if (!design?.coverageChecks || !Array.isArray(design.coverageChecks.beyondHero) || !Array.isArray(design.coverageChecks.mustImageBenefits)) {
    failures.push("生成前確認（coverageChecks）の記録がない（G7）");
  }
  if (images.filter((e) => e.kind === "hero").length !== 1) failures.push("ヒーローはちょうど1枚でなければならない（G7）");
  if (images.filter((e) => e.kind === "place").length > 1) failures.push("場所の画像は最大1枚（G7）");
  for (const e of images) {
    if (!e.purpose) failures.push(`画像 ${e.id} に目的（担う訴求・事実）がない（G7）`);
    if (!e.subject || !e.composition) failures.push(`画像 ${e.id} の内容の設計が欠けている（G7）`);
    if (!e.depiction || !e.placement) failures.push(`画像 ${e.id} の描き方・置き場の設計が欠けている（G7）`);
    if (EXTERIOR_RE.test(e.subject ?? "")) failures.push(`画像 ${e.id} が職場・建物の外観を題材にしている（G9）`);
    // The composed prompt is what the image model actually reads:
    // an exterior instruction hiding in the composition or style
    // text must fail here too (run20's LP hero, 2026-11-04).
    if (/building|exterior|facade|外観|建物/i.test(e.prompt ?? "")) failures.push(`画像 ${e.id} のプロンプトが職場・建物の外観を指示している（G9）`);
    // The design must also pass the prompt gates (G1–G5) itself: a
    // design whose prompt needs a send-back rebuild downstream is a
    // design defect, and the rebuild can mangle the subject (run21:
    // the transport scene hit G4 and was rebuilt into a fragment).
    for (const h of checkPromptGates(e.prompt ?? "").hits) failures.push(`画像 ${e.id} のプロンプトが禁止モチーフに触れている: ${h.term}（${h.gate}）`);
    if (e.kind !== "hero" && e.placement?.size !== "small") failures.push(`説明画像 ${e.id} が小さく置かれていない（G6）`);
  }
  const gateResults = IMAGE_GATES.filter((g) => g.kind === "design").map((g) => ({
    id: g.id,
    pass: !failures.some((f) => f.includes(`（${g.id}）`)),
  }));
  return { pass: failures.length === 0, failures, gateResults };
}

// Prompt-stage gate checks (G1–G5): term gates scan the whole prompt;
// subject gates scan only the subject (the first sentence), because a
// vehicle may appear as background but must never be the subject.
// ASCII terms match on word boundaries: a raw substring match made
// the G1 term "bed " fire on the word "described" (2026-11-04, a
// false positive in the gate itself — gates' false positives are an
// audit target per the project rules). Non-ASCII terms keep the
// substring match.
function termHit(lower, term) {
  const t = String(term).toLowerCase();
  if (/^[a-z0-9 ]+$/.test(t)) {
    const body = t.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ +/g, "\\s+");
    return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`).test(lower);
  }
  return lower.includes(t);
}
export function checkPromptGates(prompt) {
  const lower = String(prompt).toLowerCase();
  const subject = lower.split(". ")[0] ?? lower;
  const hits = [];
  for (const g of IMAGE_GATES) {
    if (g.kind === "prompt") {
      for (const t of g.terms ?? []) if (termHit(lower, t)) hits.push({ gate: g.id, term: t });
    } else if (g.kind === "subject") {
      for (const t of g.terms ?? []) if (termHit(subject, t)) hits.push({ gate: g.id, term: t });
    }
  }
  return { pass: hits.length === 0, hits };
}
export function promptGateResults(photoPlan) {
  return IMAGE_GATES.filter((g) => g.kind === "prompt" || g.kind === "subject").map((g) => {
    const bad = (photoPlan ?? []).filter((pp) => checkPromptGates(pp.prompt).hits.some((h) => h.gate === g.id));
    return { id: g.id, pass: bad.length === 0, ...(bad.length ? { images: bad.map((b) => b.id) } : {}) };
  });
}

// Send-back: rebuild one image's prompt from its design with the
// clauses that hit a gate removed from the subject. If the subject
// empties out, the role's neutral default subject is used. The return
// is recorded by the caller with its reasons.
export function rebuildPromptWithoutHits(entry, hitTerms) {
  const terms = (hitTerms ?? []).map((t) => String(t).toLowerCase());
  const clauses = String(entry.subject).split(/[,、]/).map((c) => c.trim()).filter(Boolean);
  const kept = clauses.filter((c) => !terms.some((t) => c.toLowerCase().includes(t)));
  const removed = clauses.filter((c) => terms.some((t) => c.toLowerCase().includes(t)));
  // If what remains is only a mood fragment ("calm and unhurried")
  // with no scene in it, it is not a subject: fall back to the role's
  // neutral scene instead of generating from a fragment (run21).
  const keptSubject = kept.join(", ");
  const subject = kept.length > 0 && /person|people|worker|work|table|home|family|scene|street/i.test(keptSubject) ? keptSubject : DEFAULT_SUBJECT[entry.kind];
  const rebuilt = { ...entry, subject };
  rebuilt.prompt = `${subject}. ${entry.composition}. ${entry.styleText}, no text, no numbers, no logos, no watermark`;
  return { entry: rebuilt, removed };
}
