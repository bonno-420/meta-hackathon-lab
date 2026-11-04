// LP design derivation (loop-024): the page's composition is DERIVED
// from the planning's signals and recorded, not inherited from one
// fixed template. Until now the layout was a single hardcoded
// composition (its form traced back to a coordinator-made mock), and
// the planning only filled its slots. Here, three composition
// patterns exist as candidates; the derivation scores the planning's
// appeals and first checks, picks the pattern whose reading order
// fits this posting's reader, and records the scores and the reasons
// so the choice itself is auditable. The final assembly follows the
// same record (via the layout message map), so a different posting
// can produce a structurally different page.

export const LP_PATTERNS = {
  // Conditions first: the reader checks pay/hours/transport before
  // anything else. Order follows the library pattern LIB-PAT-001
  // (導入→条件→働く場面→締め, approved 2026-10-29).
  "P-COND": {
    blockOrder: ["hero", "title", "cards", "rows", "details", "cta"],
    palettes: [
      { id: "cond-1", titleBg: "#173550", accent: "#f2762e", chipBg: "#eef3f8" },
      { id: "cond-2", titleBg: "#14424e", accent: "#e8873a", chipBg: "#e9f2f2" },
      { id: "cond-3", titleBg: "#3a2340", accent: "#e08a3c", chipBg: "#f3edf5" },
    ],
    basis: "LIB-PAT-001（導入→条件→働く場面→締め）: 第一確認の条件を先に置く",
  },
  // Work first: the reader's first question is what the work itself
  // is; the work scene and its copy lead, conditions follow.
  "P-WORK": {
    blockOrder: ["title", "hero", "rows", "cards", "details", "cta"],
    palettes: [
      { id: "work-1", titleBg: "#1f3d2b", accent: "#e07b39", chipBg: "#edf4ec" },
      { id: "work-2", titleBg: "#22384f", accent: "#e07b39", chipBg: "#edf1f6" },
      { id: "work-3", titleBg: "#4a2e1c", accent: "#e8a13c", chipBg: "#f7efe6" },
    ],
    basis: "読み手の最初の関心が仕事そのもの: 仕事の場面と文を前に置き、条件は後で確認させる",
  },
  // Life-fit first: appeals about days off, family, and commuting
  // lead as scenes; the condition cards confirm them after.
  "P-LIFE": {
    blockOrder: ["hero", "title", "rows", "cards", "details", "cta"],
    palettes: [
      { id: "life-1", titleBg: "#3d2c1c", accent: "#d96f32", chipBg: "#f8f1e6" },
      { id: "life-2", titleBg: "#37401f", accent: "#d98e32", chipBg: "#f2f4e6" },
      { id: "life-3", titleBg: "#4a2020", accent: "#e09a3c", chipBg: "#f7ecec" },
    ],
    basis: "生活に合うかが主関心: 休み・通勤などの生活の訴求を場面で先に見せ、条件カードで裏付ける",
  },
};

// Perceptual color variation check (the user's instruction,
// 2026-11-04, after the FICT-E03 run): the D15 rule changed the
// palette ID, but the previous production's slate blue (#22384f)
// and this run's navy (#173550) are the same color to the eye — a
// different ID is not a different color. The check compares the
// dominant color (the title band) by hue distance: below the
// threshold, the palettes read as the same color family and the
// derivation must move on to a variant that actually differs.
export const HUE_DISTANCE_MIN = 40;

export function hexToHue(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex ?? ""));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

export function hueDistance(hexA, hexB) {
  const a = hexToHue(hexA), b = hexToHue(hexB);
  if (a === null || b === null) return null;
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// Condition tags of a planning (the user's refinement of the
// color rule, 2026-11-04): colors that end up similar BECAUSE the
// targeting conditions are similar (gender, age band, job family,
// employment form) are fine — what must not happen is the pipeline
// producing the same or a similar color UNCONDITIONALLY, whatever
// posting it is fed (pattern-ization). The tags make "because the
// conditions are similar" a recorded, checkable statement instead
// of an impression.
const CONDITION_TAG_RULES = [
  ["women", /女性|women|female/i],
  ["men", /男性|\bmen\b|male/i],
  ["students", /学生|student/i],
  ["new-grad", /新卒|new graduate/i],
  ["seniors", /シニア|高齢|60代|senior citizens?|older workers/i],
  ["manufacturing", /製造|工場|組立|manufacturing|factory|assembly/i],
  ["logistics", /物流|倉庫|仕分け|warehouse|logistics|sorting|packing|梱包/i],
  ["food", /食品|調理|food|cooking|kitchen|cafe|飲食/i],
  ["beauty", /化粧品|美容|cosmetics|beauty|salon|soap|石鹸/i],
  ["care", /介護|医療|看護|care|nursing|medical/i],
  ["office", /事務|office|clerical/i],
  ["retail", /販売|接客|店舗|retail|sales|customer service/i],
  ["cleaning", /清掃|cleaning/i],
  ["part-time", /パート|アルバイト|part-time/i],
  ["full-time", /正社員|full-time|permanent/i],
  ["contract", /契約社員|contract employee/i],
];

export function conditionTagsOf(planning) {
  const text = [planning?.audience ?? "", ...(planning?.appeals ?? []).map((a) => a?.text ?? "")].join(" ");
  const tags = [];
  for (const [tag, re] of CONDITION_TAG_RULES) if (re.test(text)) tags.push(tag);
  for (const m of text.matchAll(/(\d)0(?:s|代)/gi)) tags.push(`age-${m[1]}0s`);
  return [...new Set(tags)];
}

export function checkPaletteVariation(previousTitleBg, candidateTitleBg) {
  const dist = hueDistance(previousTitleBg, candidateTitleBg);
  return {
    previousTitleBg: previousTitleBg ?? null,
    titleBg: candidateTitleBg ?? null,
    hueDistance: dist === null ? null : Math.round(dist),
    threshold: HUE_DISTANCE_MIN,
    pass: dist !== null && dist >= HUE_DISTANCE_MIN,
    rule: "前回の制作と色相が近い（同じ色に見える）配色は選ばない。前回と異なる型・異なるIDでも、色そのものが近ければ変える",
  };
}

const WORK_RE = /仕事|作業|内容|ものづくり|作る|検品|仕分け|調理|接客|work|task|craft|cooking|making/i;
const LIFE_RE = /土日|休日|休み|家族|通勤|週末|weekend|holiday|family|commut|school|classes/i;

// Score the planning and choose the pattern. Deterministic: the same
// planning (and the same previous production) always yields the same
// design, and the record shows why.
//
// The color rule (the user's rule, 2026-11-04, D15): differentiation
// is carried by pattern, color, logo and photos — so when the
// previous production used the same pattern, the palette must
// change. The derivation takes the previous production's design
// (pattern + palette id) and, for a repeated pattern, moves to the
// next palette variant. The palette values themselves remain
// candidates without market-research backing, recorded as such.
export function deriveLpDesign(planning, { previous } = {}) {
  const appeals = Array.isArray(planning?.appeals) ? planning.appeals : [];
  const firstCheck = new Set(Array.isArray(planning?.firstCheckKeys) ? planning.firstCheckKeys : []);
  let cond = 0;
  let work = 0;
  let life = 0;
  const signals = [];
  for (const a of appeals) {
    const keys = Array.isArray(a?.factKeys) ? a.factKeys : [];
    const text = a?.text ?? "";
    if (keys.some((k) => firstCheck.has(k))) { cond++; signals.push(`${a.id}: 第一確認の事実を持つ訴求（条件）`); }
    if (WORK_RE.test(text)) { work++; signals.push(`${a.id}: 仕事そのものへの訴求`); }
    if (LIFE_RE.test(text)) { life++; signals.push(`${a.id}: 生活適合の訴求`); }
  }
  if ((planning?.imageSpecs ?? []).some((sp) => sp?.role === "work")) { work++; signals.push("imageSpecs: 仕事の場面の指定あり"); }
  const scores = { "P-COND": cond, "P-WORK": work, "P-LIFE": life };
  // Highest score wins; ties resolve to the library pattern (P-COND),
  // then to work, so the choice is stable and explainable.
  const priority = ["P-COND", "P-WORK", "P-LIFE"];
  const ranked = [...priority].sort((x, y) => (scores[y] - scores[x]) || (priority.indexOf(x) - priority.indexOf(y)));
  const patternId = ranked[0];
  const p = LP_PATTERNS[patternId];
  const variants = p.palettes;
  let paletteIdx = 0;
  let variedFromPrevious = null;
  if (previous && previous.patternId === patternId && previous.paletteId) {
    const pi = variants.findIndex((v) => v.id === previous.paletteId);
    if (pi >= 0) {
      paletteIdx = (pi + 1) % variants.length;
      variedFromPrevious = { patternId: previous.patternId, paletteId: previous.paletteId, changed: true, rule: "前回と同じ型が続く場合は前回と異なる配色にする（D15）" };
    }
  } else if (previous) {
    variedFromPrevious = { patternId: previous.patternId ?? null, paletteId: previous.paletteId ?? null, changed: previous.patternId !== patternId, rule: "前回と型が異なるため配色も異なる" };
  }
  // Perceptual check on top of the ID rule: whatever variant the
  // D15 step picked, if its dominant color is within the hue
  // threshold of the previous production's, advance through this
  // pattern's variants until one actually looks different. When no
  // variant passes, take the farthest one and record the failure —
  // visible, not silent.
  let colorCheck = null;
  const conditionTags = conditionTagsOf(planning);
  // The previous production is usually known by palette ID (the
  // design history); resolve its dominant color from the variants.
  const previousTitleBg = previous?.palette?.titleBg
    ?? (previous?.paletteId ? Object.values(LP_PATTERNS).flatMap((pp) => pp.palettes).find((v) => v.id === previous.paletteId)?.titleBg ?? null : null);
  // Similarity that follows from similar conditions is allowed
  // (the user's refinement): the check below only guards against
  // unconditional sameness — different conditions, same color.
  const previousTags = Array.isArray(previous?.conditionTags) ? previous.conditionTags : null;
  const sharedTags = previousTags ? conditionTags.filter((t) => previousTags.includes(t)) : [];
  const similarityAllowed = Boolean(previousTags && sharedTags.length >= 2);
  if (previousTitleBg && similarityAllowed) {
    colorCheck = { ...checkPaletteVariation(previousTitleBg, variants[paletteIdx].titleBg), previousPaletteId: previous.paletteId ?? null, attempts: 0, similarityAllowed: true, sharedTags, pass: true, rule: "対象条件（性別・年齢・職種など）が似ているため、色味が似るのは条件由来として許容する。避けるのは条件が違うのに同じ・似た色になる無条件のパターン化" };
  } else if (previousTitleBg) {
    let bestIdx = paletteIdx;
    let bestDist = -1;
    let attempts = 0;
    for (let step = 0; step < variants.length; step++) {
      const idx = (paletteIdx + step) % variants.length;
      const c = checkPaletteVariation(previousTitleBg, variants[idx].titleBg);
      attempts++;
      if ((c.hueDistance ?? -1) > bestDist) { bestDist = c.hueDistance ?? -1; bestIdx = idx; }
      if (c.pass) { bestIdx = idx; colorCheck = { ...c, previousPaletteId: previous.paletteId ?? null, attempts, similarityAllowed: false, sharedTags }; break; }
      if (step === variants.length - 1) {
        colorCheck = { ...checkPaletteVariation(previousTitleBg, variants[bestIdx].titleBg), previousPaletteId: previous.paletteId ?? null, attempts, pass: false, similarityAllowed: false, sharedTags };
      }
    }
    if (bestIdx !== paletteIdx) {
      variedFromPrevious = { ...(variedFromPrevious ?? {}), patternId: previous.patternId ?? null, paletteId: previous.paletteId ?? null, changed: true, rule: "前回と色相が近い配色を避け、実際に異なる色のバリエーションを選んだ" };
    }
    paletteIdx = bestIdx;
  }
  const chosen = variants[paletteIdx];
  return {
    version: "lp-design-v1",
    patternId,
    scores,
    signals,
    rationale: `訴求と第一確認の信号から ${patternId} を選択（条件 ${cond} / 仕事 ${work} / 生活 ${life}）。${p.basis}`,
    blockOrder: [...p.blockOrder],
    palette: { titleBg: chosen.titleBg, accent: chosen.accent, chipBg: chosen.chipBg },
    paletteId: chosen.id,
    variedFromPrevious,
    colorCheck,
    conditionTags,
    paletteBasis: "パターンの配色バリエーションから選択（候補。市場のリサーチ裏付けはなく、候補のまま記録する）",
    basis: p.basis,
  };
}
