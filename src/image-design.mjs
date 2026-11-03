// The image-design step (loop-023): before any image is generated, the
// pipeline designs the images from the approved planning — how many,
// what each one shows, how it is depicted, and where it sits. A
// generated image is not a real photograph: the hero may be large and
// photorealistic (it is the page's face and reads as impression), but
// an explanatory image reads as a record of the actual site, so
// explanatory images are illustrations, placed small beside the text
// they explain. Pointed-out issues become standing gates in
// src/dicts/image-gates-v1.json and are checked here and in the layout.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const IMAGE_GATES = JSON.parse(readFileSync(path.join(here, "dicts/image-gates-v1.json"), "utf8")).gates;

export const ILLUSTRATION_STYLE = "flat vector-style illustration, clearly an illustration and not a photograph, calm neutral palette, no icons, no symbols, no pictograms";

// A scene for an appeal-derived image, chosen by what the appeal
// itself says: scenes of people and moments, never icon collages
// and never a workplace exterior (user, 2026-11-04).
const APPEAL_SCENES = [
  { re: /土日|休日|週末|休み|weekend|day off|holiday/, scene: "An illustration of a person enjoying a day off at home with family, relaxed weekend mood" },
  // The transport scene must not put a commute vehicle in the
  // picture (gate G4: a train/bus as the visual subject implies the
  // commute method). An earlier scene ("commuting on a local
  // train") hit G4 at the prompt stage, and the send-back rebuild
  // stripped its main clause, leaving a fragment prompt ("calm and
  // unhurried") that generated an unrelated desk scene (run21).
  { re: /交通費|通勤|電車|transport|commut|train/, scene: "An illustration of a person walking to work along a quiet street in the morning, calm and unhurried" },
  { re: /未経験|研修|初めて|no experience|training|first job/, scene: "An illustration of a new worker being shown the task by a senior worker, both at a work table" },
  { re: /朝|夕方|時間|時給|勤務時間|morning|hours|shift/, scene: "An illustration of a worker starting the day at a work table in bright morning light" },
];
// The neutral work scene used when a spec asks for an exterior
// (replaced under G9) and as the appeal-scene fallback. It must stay
// job-neutral: an earlier parcel-sorting wording was FICT-J02's
// content leaking into the system default, and FICT-E02 (woodwork)
// appeal images came out as parcel scenes (2026-11-04). The job's
// own scenes come from the planning's spec descriptions and appeal
// texts, not from this default.
const WORK_SCENE = "An illustration of the work itself: people doing the hands-on tasks of the job at a work table";
function appealScene(appealText) {
  for (const sc of APPEAL_SCENES) if (sc.re.test(appealText ?? "")) return sc.scene;
  return WORK_SCENE;
}
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
const DEFAULT_SUBJECT = {
  hero: "An illustration of the work itself: people doing the work at a fictional workplace",
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
export function buildImageDesign(planning, facts) {
  const appeals = new Map((planning?.appeals ?? []).map((a) => [a.id, a]));
  const images = [];
  const designNotes = [];
  const servedAppeals = new Set();
  for (const spec of planning?.imageSpecs ?? []) {
    const kind = roleKind(spec.role);
    const basis = spec.basis ?? {};
    const purpose = typeof basis.appealId === "string"
      ? (appeals.get(basis.appealId)?.text ?? null)
      : typeof basis.factKey === "string"
        ? factLabel(facts, basis.factKey)
        : (typeof spec.purpose === "string" ? spec.purpose : null);
    // No role is photorealistic (gate G9, the user's 2026-11-04
    // instruction): a generated image of the building or workplace
    // exterior must not present a place that does not exist as if it
    // were real. Every image is an illustration, openly an image.
    const depiction = "illustration";
    const styleText = ILLUSTRATION_STYLE;
    let subject = typeof spec.description === "string" && spec.description.length > 0 ? spec.description : DEFAULT_SUBJECT[kind];
    if (/photorealistic/i.test(subject)) {
      // The spec's wording asks for a photograph while the design's
      // depiction is an illustration (G9): the wording is cleaned at
      // design time so the prompt never contradicts itself.
      designNotes.push({ imageId: spec.id, rule: "G9", action: "subject-wording-cleaned", from: subject });
      subject = subject.replace(/photorealistic photo of /i, "").replace(/photorealistic /i, "");
      subject = subject.charAt(0).toUpperCase() + subject.slice(1);
    }
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
    const subject = appealScene(a.text);
    images.push({
      id: `appeal-${a.id}`,
      role: "section",
      kind: "section",
      source: "appeal",
      appealId: a.id,
      purpose: a.text,
      subject,
      composition: COMPOSITION.section,
      depiction: "illustration",
      styleText: ILLUSTRATION_STYLE,
      placement: { area: "inline", size: "small", aspect: "4:3" },
      mustNotImply: [...MUST_NOT_IMPLY, ...(planning?.notSay ?? []).map((n) => n.text ?? n.key).filter(Boolean)],
      prompt: `${subject}. ${COMPOSITION.section}. ${ILLUSTRATION_STYLE}, no text, no numbers, no logos, no watermark`,
    });
    servedAppeals.add(a.id);
  }
  return { version: "image-design-v2", count: images.length, images, noImage, designNotes };
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
  if (images.filter((e) => e.kind === "hero").length !== 1) failures.push("ヒーローはちょうど1枚でなければならない（G7）");
  if (images.filter((e) => e.kind === "place").length > 1) failures.push("場所の画像は最大1枚（G7）");
  for (const e of images) {
    if (!e.purpose) failures.push(`画像 ${e.id} に目的（担う訴求・事実）がない（G7）`);
    if (!e.subject || !e.composition) failures.push(`画像 ${e.id} の内容の設計が欠けている（G7）`);
    if (!e.depiction || !e.placement) failures.push(`画像 ${e.id} の描き方・置き場の設計が欠けている（G7）`);
    if (e.kind !== "hero" && e.depiction !== "illustration") failures.push(`説明画像 ${e.id} が写実になっている（G6）`);
    if (e.depiction === "photorealistic") failures.push(`画像 ${e.id} が写実になっている（G9）`);
    if (EXTERIOR_RE.test(e.subject ?? "")) failures.push(`画像 ${e.id} が職場・建物の外観を題材にしている（G9）`);
    if (/photorealistic/i.test(e.subject ?? "")) failures.push(`画像 ${e.id} の題材文が写実を指示している（G9）`);
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
