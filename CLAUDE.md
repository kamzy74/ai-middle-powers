# Project context for Claude Code

## What this is
An interactive explorer for a BASE Fellowship research project: defining "AI middle powers" with a criteria-based framework (5 dimensions, 20 criteria, plus a proposed labour/data-supply criterion) and classifying countries into tiers. Team: Kamilah Idris and Chris Agape Ajah. Mentor: Erik Leklem (AI governance).

## Stack and constraints
- Plain HTML/CSS/JS, no build step, no framework. Keep it that way unless asked.
- d3 v7 and topojson-client from cdnjs; map data in `data/world-110m.js` as a global `WORLD`, so the page opens from disk without a server.
- Map country names follow world-atlas 110m (e.g. "United States of America", "Dem. Rep. Congo"). Small states missing from the map use `marker: [lon, lat]`.
- Visual style: light, scholarly; serif headings (Source Serif 4), Inter body; single-hue blue ramp for tiers (light = lower tier, dark = higher).

## Data rules
- All scores in `js/data.js` are PLACEHOLDERS (0–3 judgements). Never present them as findings, and keep the "Draft scores" banner until real data replaces them.
- When adding real data, record the source and year for each value.

## Open decisions (from mentor meetings, Nov 2026)
- Whether and how to weight criteria (equal per dimension now; alternatives: equal per criterion, expert-panel weights, sensitivity analysis).
- How to set tier cut-offs (currently 85 / 55 / 30).
- Whether the labour and data-supply criterion (A5) enters scoring.
- Whether outside contributors can submit evidence or scores, and how submissions are reviewed.
- Which countries to cover (current 31-country test set was chosen by judgement).

## Planned features
- Compare-two-countries view
- Per-capita toggle
- Evidence/confidence level per score; "source and last updated" per score
- Show each criterion's effective weight; switch between per-dimension and per-criterion weighting
- Replace 0–3 judgements with sourced data where measurable (distance-to-frontier scoring)
