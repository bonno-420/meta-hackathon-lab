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
    paletteBasis: "パターンの配色バリエーションから選択（候補。市場のリサーチ裏付けはなく、候補のまま記録する）",
    basis: p.basis,
  };
}
