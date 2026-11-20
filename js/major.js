// ===== MAJOR POWER TEST (logic only; thresholds and results live in data/major-power.js) =====
// results: { A1: {r:"yes"|"no"|"borderline", note}, ... } for the criteria that have a major power level.
// Borderline results never count toward the tier. They only widen the score range.
function majorTest(results) {
  const byDim = {};
  let firm = 0, borderline = 0, total = 0;
  DIMENSIONS.forEach(d => {
    const crit = d.criteria.filter(c => MAJOR_LEVEL[c.id]);   // A5 has no major level, so it is skipped
    const yes = crit.filter(c => results[c.id] && results[c.id].r === "yes").length;
    const bl  = crit.filter(c => results[c.id] && results[c.id].r === "borderline").length;
    const need = MAJOR_RULES.major.minPerDim[d.id];
    byDim[d.id] = { yes, borderline: bl, total: crit.length, need, ok: yes >= need };
    firm += yes; borderline += bl; total += crit.length;
  });
  const dimsOk = DIMENSIONS.every(d => byDim[d.id].ok);
  const isMajor = firm >= MAJOR_RULES.major.minTotal && dimsOk;
  const isEmerging = !isMajor && firm >= MAJOR_RULES.emerging.minTotal;
  return { firm, withBorderline: firm + borderline, total, byDim, dimsOk, isMajor, isEmerging };
}
