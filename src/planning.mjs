// Planning input for the pipeline (fix F2/F3): the planning is an INPUT
// to the tool, never something the tool invents. A planning file states
// the audience, the appeal items (each tied to FACT keys and source
// lines), what will not be said, the image correspondence (every visual
// element with its basis), and the first-check FACT keys for the hero.
//
// The key-visual prompt is constructed ONLY from the correspondence,
// and a deterministic compliance scan checks the prompt against the
// prohibited motifs derived from the planning's not-say list plus the
// standing bans. This module is the design-level fix for the loop-020
// return: the planning-to-image correspondence and its inspection are
// defined here, not left to prompt wording. Fictional data only.

import { createHash } from "node:crypto";

export function sha256Text(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// Standing scan families. Cash / income imagery and specific clock
// times are always prohibited in image prompts (they assert income or
// a specific time that the FACTs do not state as an image). Housing /
// residence imagery is prohibited whenever the housing FACT is
// unstated: a residence visual asserts what the original does not say.
const CASH_TERMS = ["現金", "札束", "紙幣", "硬貨", "財布", "お金", "cash", "banknote", "banknotes", "coin", "coins", "wallet", "money", "yen bills"];
const TIME_TERMS = ["時計", "clock", "watch face", "wall clock", "wristwatch"];
const HOUSING_TERMS = ["住宅", "一軒家", "寮", "社宅", "マイホーム", "戸建", "residence", "residential house", "dormitory", "house exterior", "detached house", "apartment building"];

function factByKey(facts, key) {
  const items = facts && Array.isArray(facts.items) ? facts.items : [];
  return items.find((i) => i.key === key) ?? null;
}

// Validate a parsed planning object. Returns { ok, errors }.
export function validatePlanning(planning) {
  const errors = [];
  if (!planning || typeof planning !== "object") return { ok: false, errors: ["planning is not an object"] };
  if (typeof planning.audience !== "string" || planning.audience.length === 0) errors.push("planning.audience is missing");
  if (!Array.isArray(planning.appeals) || planning.appeals.length === 0) errors.push("planning.appeals must be a non-empty array");
  for (const a of planning.appeals ?? []) {
    if (!a || typeof a.id !== "string" || typeof a.text !== "string") errors.push(`appeal entry lacks id/text: ${JSON.stringify(a)}`);
  }
  if (!Array.isArray(planning.imageSpecs) || planning.imageSpecs.length === 0) errors.push("planning.imageSpecs must be a non-empty array");
  const roles = (planning.imageSpecs ?? []).map((s) => s && s.role);
  if (!roles.includes("key-visual")) errors.push("planning.imageSpecs has no key-visual element");
  if (roles.filter((r) => r === "place").length > 1) errors.push("planning.imageSpecs has more than one place element (place is at most one)");
  for (const s of planning.imageSpecs ?? []) {
    if (!s || typeof s.id !== "string" || typeof s.description !== "string") errors.push(`imageSpec lacks id/description: ${JSON.stringify(s)}`);
    const basis = s ? s.basis : null;
    if (!basis || (typeof basis.appealId !== "string" && typeof basis.factKey !== "string")) {
      errors.push(`imageSpec ${s ? s.id : "?"} has no basis (appealId or factKey is required)`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// Build the correspondence: visual elements with resolved bases, and
// the prohibited-motif list. Throws on an unresolved basis (an element
// with no basis in the planning or the FACTs must not reach a prompt).
export function buildCorrespondence(planning, facts) {
  const appealIds = new Set((planning.appeals ?? []).map((a) => a.id));
  const elements = [];
  for (const spec of planning.imageSpecs ?? []) {
    const basis = spec.basis ?? {};
    if (typeof basis.appealId === "string") {
      if (!appealIds.has(basis.appealId)) throw new Error(`imageSpec ${spec.id}: basis appealId ${basis.appealId} is not in the planning appeals`);
    } else if (typeof basis.factKey === "string") {
      const item = factByKey(facts, basis.factKey);
      if (!item) throw new Error(`imageSpec ${spec.id}: basis factKey ${basis.factKey} is not in the FACT set`);
      if (item.status !== "stated") throw new Error(`imageSpec ${spec.id}: basis factKey ${basis.factKey} is unstated; an unstated item cannot ground a visual element`);
    } else {
      throw new Error(`imageSpec ${spec.id}: no basis`);
    }
    elements.push({ id: spec.id, role: spec.role, basis, description: spec.description });
  }
  const prohibited = [];
  for (const ns of planning.notSay ?? []) {
    const terms = Array.isArray(ns.terms) ? ns.terms : [];
    if (terms.length > 0) prohibited.push({ source: `planning notSay: ${ns.text ?? ns.key ?? ""}`, terms });
  }
  prohibited.push({ source: "standing ban: cash / income imagery", terms: CASH_TERMS });
  prohibited.push({ source: "standing ban: specific clock times", terms: TIME_TERMS });
  const housing = factByKey(facts, "housing");
  if (housing && housing.status === "unstated") {
    prohibited.push({ source: "standing ban: housing is unstated, so no residence imagery", terms: HOUSING_TERMS });
  }
  return {
    elements,
    prohibited,
    firstCheckKeys: Array.isArray(planning.firstCheckKeys) ? planning.firstCheckKeys : [],
    style: typeof planning.style === "string" ? planning.style : "photorealistic",
  };
}

// The image prompt for one correspondence element. Built only from the
// element's description (which itself rests on its recorded basis),
// the planning's style, and the standing no-text rule.
export function buildImagePrompt(element, correspondence) {
  return `${element.description}, ${correspondence.style}, no text, no numbers, no logos, no watermark`;
}

// Deterministic compliance scan: the prompt must not contain any
// prohibited term, and must not contain a clock-time numeral pattern.
export function checkPromptCompliance(prompt, correspondence) {
  const hits = [];
  const lower = String(prompt).toLowerCase();
  for (const group of correspondence.prohibited ?? []) {
    for (const term of group.terms) {
      if (lower.includes(String(term).toLowerCase())) hits.push({ term, source: group.source });
    }
  }
  if (/\d{1,2}:\d{2}/.test(prompt)) hits.push({ term: "HH:MM numeral", source: "standing ban: specific clock times" });
  return { pass: hits.length === 0, hits };
}

// The element-by-element visual check fields for the key-visual
// presentation record (the loop-020 checklist). Values start null:
// a human fills them when the key visual is presented; the run does
// not claim a visual judgement it cannot make.
export function buildKeyVisualChecklist(correspondence, design = null) {
  // When the image design exists, the checklist describes the DESIGN
  // (subjects after the design-stage replacements), not the raw spec
  // text: a checklist written from the pre-design spec describes an
  // image that will never be generated (found in the independent
  // review of run20, 2026-11-04).
  if (design && Array.isArray(design.images) && design.images.length > 0) {
    return design.images.map((e) => ({
      element: e.id,
      basis: e.appealId ?? e.source ?? null,
      description: e.subject,
      depiction: e.depiction,
      placement: e.placement ? `${e.placement.area}/${e.placement.size}` : null,
      checks: {
        subjectIdentity: null,
        unstatedImplication: null,
        inventedSpecifics: null,
        cashImagery: null,
      },
    }));
  }
  return (correspondence.elements ?? [])
    .filter((e) => e.role === "key-visual")
    .map((e) => ({
      element: e.id,
      basis: e.basis,
      description: e.description,
      checks: {
        subjectIdentity: null,
        unstatedImplication: null,
        inventedSpecifics: null,
        cashImagery: null,
      },
    }));
}

// Build the generation intent layer (the generate-persona INTENT shape)
// from the planning input, plus an optional feedback memo (fix F10:
// the memo enters as a recorded, binding input; compiling the memo
// stays a human/coordinator act). The speaker is the house speaker
// S-01 (the offering side), as in the approved persona design.
export function intentFromPlanning(planning, feedbackText) {
  const notSayRules = (planning.notSay ?? []).map((ns) => `言わないこと: ${ns.text ?? ns.key ?? ""}`);
  const voiceRules = [
    "Write as the recruiter speaking to the reader (offering side), plain and factual.",
    "No greetings or sales hype.",
    "No verifier/auditor wording in the generated text.",
    "Unstated items stay unstated (未記載), closed with an inquiry invitation in market-standard form.",
    "Never invent a contact detail or application method.",
    ...notSayRules,
  ];
  if (feedbackText) {
    voiceRules.push("Feedback memo (binding input; the user's annotations on a previous preview, compiled by a human):");
    for (const line of String(feedbackText).split("\n").map((s) => s.trim()).filter(Boolean)) voiceRules.push(`- ${line}`);
  }
  return {
    speaker: {
      id: "S-01",
      label: "求人の担当者（当事者）",
      stance: "The job recruiter as the party offering the posting: presents this posting's own conditions so the reader can judge fit. Addresses the reader as the offering side.",
      funnelPosition: "The text is the entrance to the application funnel: show conditions accurately so the reader can self-judge. It does not complete the application itself.",
      neverVoice: "Never a third-party verifier/auditor voice.",
    },
    targetLayer: {
      description: planning.audience,
      points: Array.isArray(planning.audiencePoints) ? planning.audiencePoints : [],
    },
    persona: {
      id: "PLANNING",
      label: planning.audience,
      worries: (planning.appeals ?? []).map((a) => ({
        id: a.id,
        worry: a.text,
        appeal: a.text,
        factKeys: Array.isArray(a.factKeys) ? a.factKeys : [],
        sourceLines: Array.isArray(a.sourceLines) ? a.sourceLines : [],
      })),
    },
    voice: { rules: voiceRules },
    ref: { source: "planning-input", audience: planning.audience },
  };
}
