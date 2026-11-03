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

export const ILLUSTRATION_STYLE = "flat vector-style illustration, clearly an illustration and not a photograph, calm neutral palette";

const MUST_NOT_IMPLY = [
  "寮・寝室を思わせる要素",
  "現金・金額の含意",
  "特定の時刻",
  "通勤手段や車両を主役にすること",
  "読める文字・数字・ロゴ",
];

const COMPOSITION = {
  hero: "Wide establishing shot; the workplace building itself is the subject; impression-level, with no specific factual claim",
  section: "The work activity itself, as an explanatory image beside the text it explains",
  place: "The surrounding area of the workplace, as a small explanatory image",
};
const DEFAULT_SUBJECT = {
  hero: "A fictional workplace building exterior",
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
export function buildImageDesign(planning, facts) {
  const appeals = new Map((planning?.appeals ?? []).map((a) => [a.id, a]));
  const images = [];
  for (const spec of planning?.imageSpecs ?? []) {
    const kind = roleKind(spec.role);
    const basis = spec.basis ?? {};
    const purpose = typeof basis.appealId === "string"
      ? (appeals.get(basis.appealId)?.text ?? null)
      : typeof basis.factKey === "string"
        ? factLabel(facts, basis.factKey)
        : (typeof spec.purpose === "string" ? spec.purpose : null);
    const depiction = kind === "hero" ? "photorealistic" : "illustration";
    const styleText = kind === "hero"
      ? (typeof planning?.style === "string" ? planning.style : "photorealistic, documentary")
      : ILLUSTRATION_STYLE;
    const subject = typeof spec.description === "string" && spec.description.length > 0 ? spec.description : DEFAULT_SUBJECT[kind];
    const composition = COMPOSITION[kind];
    images.push({
      id: spec.id,
      role: spec.role,
      kind,
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
  return { version: "image-design-v1", count: images.length, images };
}

// Design-stage checks, including the design-kind gates (G6, G7) and
// the count rules: exactly one hero, at most one place image.
export function checkImageDesign(design) {
  const failures = [];
  const images = design?.images ?? [];
  if (images.filter((e) => e.kind === "hero").length !== 1) failures.push("ヒーローはちょうど1枚でなければならない");
  if (images.filter((e) => e.kind === "place").length > 1) failures.push("場所の画像は最大1枚");
  for (const e of images) {
    if (!e.purpose) failures.push(`画像 ${e.id} に目的（担う訴求・事実）がない`);
    if (!e.subject || !e.composition) failures.push(`画像 ${e.id} の内容の設計が欠けている`);
    if (!e.depiction || !e.placement) failures.push(`画像 ${e.id} の描き方・置き場の設計が欠けている`);
    if (e.kind !== "hero" && e.depiction !== "illustration") failures.push(`説明画像 ${e.id} が写実になっている（G6）`);
    if (e.kind !== "hero" && e.placement?.size !== "small") failures.push(`説明画像 ${e.id} が小さく置かれていない（G6）`);
  }
  const gateResults = IMAGE_GATES.filter((g) => g.kind === "design").map((g) => ({
    id: g.id,
    pass: failures.filter((f) => f.includes(`（${g.id}）`) || (g.id === "G7" && /目的|設計が欠けている|ちょうど1枚|最大1枚/.test(f))).length === 0,
  }));
  return { pass: failures.length === 0, failures, gateResults };
}

// Prompt-stage gate checks (G1–G5): term gates scan the whole prompt;
// subject gates scan only the subject (the first sentence), because a
// vehicle may appear as background but must never be the subject.
export function checkPromptGates(prompt) {
  const lower = String(prompt).toLowerCase();
  const subject = lower.split(". ")[0] ?? lower;
  const hits = [];
  for (const g of IMAGE_GATES) {
    if (g.kind === "prompt") {
      for (const t of g.terms ?? []) if (lower.includes(t.toLowerCase())) hits.push({ gate: g.id, term: t });
    } else if (g.kind === "subject") {
      for (const t of g.terms ?? []) if (subject.includes(t.toLowerCase())) hits.push({ gate: g.id, term: t });
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
  const subject = kept.length > 0 ? kept.join(", ") : DEFAULT_SUBJECT[entry.kind];
  const rebuilt = { ...entry, subject };
  rebuilt.prompt = `${subject}. ${entry.composition}. ${entry.styleText}, no text, no numbers, no logos, no watermark`;
  return { entry: rebuilt, removed };
}
