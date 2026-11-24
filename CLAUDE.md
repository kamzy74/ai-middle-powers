# Project context for Claude Code

## What this is
An interactive explorer for a BASE Fellowship research project: defining "AI middle powers" with a criteria-based framework (5 dimensions, 20 criteria, plus a proposed labour/data-supply criterion) and classifying countries into tiers. Team: Kamilah Idris and Chris Agape Ajah. Mentor: Erik Leklem (AI governance).

## Stack and constraints
- Plain HTML/CSS/JS, no build step, no framework. Keep it that way unless asked.
- d3 v7 and topojson-client from cdnjs; map data in `data/world-110m.js` as a global `WORLD`, so the page opens from disk without a server.
- Map country names follow world-atlas 110m (e.g. "United States of America", "Dem. Rep. Congo"). Small states missing from the map use `marker: [lon, lat]`.
- Visual style: light, scholarly; serif headings (Source Serif 4), Inter body; tier colours: Strong (dark green), Weak (mid blue) and Not a middle power (light aqua) differ in hue and lightness so they stay distinct for colour-blind readers; Major is plum and Emerging major amber; the EU as one bloc is dark warm grey. All pairs were checked under normal, protan, deutan and tritan simulation (min ΔE 11.4). Always pair colour with a text label.

## Major power tier
- Spec: `docs/major-power-criteria.md` (Chris, 19 Nov 2026) is the source of truth. Thresholds are proposals to test with Erik.
- Data in `data/major-power.js` (`MAJOR_RULES`, `MAJOR_LEVEL`, `MAJOR_PILOT`, `EU_BLOC`, `MIDDLE_SOURCES`); logic in `js/major.js`. Tier rules live only in `MAJOR_RULES`.
- The major power test runs first, for the 9 pilot actors only. Borderline results never count toward the tier. Everyone else is "not assessed" and uses the middle power score.
- URLs marked `confirm: true` were added by us, not taken from the spec. Chris to confirm.

## Data rules
- All scores in `js/data.js` are still 0–3 team judgements, not sourced data. The public site no longer says "draft" (owner decision, Nov 2026), but never describe the scores as verified findings: the footer "About the scores" note must stay accurate until real data replaces them.
- The Feedback tab is hidden until `FEEDBACK_FORM_URL` in `data/feedback-config.js` is set.
- When adding real data, record the source and year for each value.

## Open decisions (from mentor meetings, Nov 2026)
- Whether and how to weight criteria (equal per dimension now; alternatives: equal per criterion, expert-panel weights, sensitivity analysis).
- How to set tier cut-offs (currently 85 / 55 / 30).
- Whether the labour and data-supply criterion (A5) enters scoring.
- Whether outside contributors can submit evidence or scores, and how submissions are reviewed.
- Which countries to cover (current 31-country test set was chosen by judgement).
- Major power: the qualitative major levels (criteria 2, 5, 10-14, 17-20), the compute measure for criterion 6 (B2), whether criterion 8 (B4) includes public investment, and the 16-point line plus per-dimension minimums.

## Planned features
- Compare-two-countries view
- Per-capita toggle
- Evidence/confidence level per score; "source and last updated" per score
- Show each criterion's effective weight; switch between per-dimension and per-criterion weighting
- Replace 0–3 judgements with sourced data where measurable (distance-to-frontier scoring)
