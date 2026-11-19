// ===== FRAMEWORK =====
// Scores: 0 = minimal, 1 = limited, 2 = significant, 3 = leading / globally significant
// ALL SCORES ARE DRAFT, ILLUSTRATIVE JUDGEMENTS FOR TESTING THE FRAMEWORK — NOT VERIFIED DATA.
const DIMENSIONS = [
  { id: "A", name: "Economic & material weight", short: "Economic",
    criteria: [
      { id: "A1", name: "Economic size", ref: "GDP (World Bank WDI / IMF WEO)" },
      { id: "A2", name: "Income level", ref: "World Bank income classification" },
      { id: "A3", name: "Human capital & AI talent", ref: "Stanford AI Index, OECD.AI talent flows" },
      { id: "A4", name: "Digital market & user base", ref: "ITU internet users, market size" },
      { id: "A5", name: "AI labour & data supply", ref: "Data-labelling / annotation workforce studies", proposed: true,
        note: "Proposed 9 Nov: Erik agreed labour should be split from the user base as its own lever. Off by default; switch on in Settings." }
    ] },
  { id: "B", name: "AI & compute capacity", short: "Compute",
    criteria: [
      { id: "B1", name: "Compute & supply-chain chokepoints", ref: "Semiconductor value-chain position (SIA/BCG, CSET)" },
      { id: "B2", name: "Data centre & compute hosting", ref: "Data-centre capacity, TOP500" },
      { id: "B3", name: "Energy & critical minerals", ref: "IEA energy data, USGS mineral production" },
      { id: "B4", name: "Capital available for AI", ref: "Private AI investment (Stanford AI Index, OECD.AI VC)" },
      { id: "B5", name: "Domestic AI research & model development", ref: "Notable models (Epoch AI), AI publications" }
    ] },
  { id: "C", name: "Diplomatic & institutional leverage", short: "Diplomatic",
    criteria: [
      { id: "C1", name: "Multilateral standing", ref: "G7/G20/OECD/UNSC membership & roles" },
      { id: "C2", name: "Regional leadership", ref: "Role in regional bodies (AU, ASEAN, EU, etc.)" },
      { id: "C3", name: "Convening record on AI", ref: "Hosting AI summits, processes, declarations" },
      { id: "C4", name: "Coalition building", ref: "Track record leading coalitions (e.g. Ottawa-style processes)" },
      { id: "C5", name: "Strategic autonomy", ref: "Alignment / hedging behaviour (qualitative)" }
    ] },
  { id: "D", name: "Security & strategic weight", short: "Security",
    criteria: [
      { id: "D1", name: "Nuclear weapons status", ref: "SIPRI Yearbook" },
      { id: "D2", name: "Military & defence technology", ref: "SIPRI military expenditure, defence-tech base" },
      { id: "D3", name: "Arms control & verification experience", ref: "Treaty participation, IAEA/CTBTO roles" }
    ] },
  { id: "E", name: "AI governance capacity & engagement", short: "Governance",
    criteria: [
      { id: "E1", name: "National AI strategy & regulation", ref: "OECD.AI policy observatory" },
      { id: "E2", name: "AI safety institute / evaluation capacity", ref: "International Network of AI Safety Institutes" },
      { id: "E3", name: "Participation in international AI instruments", ref: "CoE AI Convention, Bletchley/Seoul/Paris, GPAI, Hiroshima Process" }
    ] }
];

// Map names follow the world-atlas 110m file. "marker" = drawn as a dot (too small for the 110m map).
// s: scores in criterion order A1..A5, B1..B5, C1..C5, D1..D3, E1..E3
const COUNTRIES = [
  { name: "United States of America", label: "United States", region: "North America", group: "Ceiling reference",
    s: { A:[3,3,3,3,1], B:[3,3,3,3,3], C:[3,3,3,3,3], D:[3,3,3], E:[2,3,2] } },
  { name: "China", label: "China", region: "East Asia", group: "Ceiling reference",
    s: { A:[3,2,3,3,2], B:[2,3,3,3,3], C:[3,3,2,3,3], D:[3,3,2], E:[3,2,2] } },
  { name: "Russia", label: "Russia", region: "Europe / Central Asia", group: "Traditional power",
    s: { A:[2,2,2,2,0], B:[0,1,3,1,2], C:[3,2,1,2,3], D:[3,3,3], E:[1,0,1] } },
  { name: "United Kingdom", label: "United Kingdom", region: "Europe", group: "Traditional power",
    s: { A:[2,3,3,2,0], B:[1,2,1,2,3], C:[3,1,3,3,2], D:[3,3,3], E:[2,3,3] } },
  { name: "France", label: "France", region: "Europe", group: "Traditional power",
    s: { A:[2,3,2,2,0], B:[1,2,2,2,2], C:[3,2,3,3,2], D:[3,3,3], E:[3,2,3] } },
  { name: "Germany", label: "Germany", region: "Europe", group: "Traditional power",
    s: { A:[3,3,2,2,0], B:[1,2,1,2,2], C:[2,3,1,2,1], D:[0,2,2], E:[3,2,3] } },
  { name: "Japan", label: "Japan", region: "East Asia", group: "Traditional power",
    s: { A:[3,3,2,2,0], B:[3,2,1,2,2], C:[2,2,2,2,1], D:[0,2,1], E:[2,2,3] } },
  { name: "Canada", label: "Canada", region: "North America", group: "Traditional power",
    s: { A:[2,3,3,2,0], B:[1,2,3,2,3], C:[2,1,2,2,1], D:[0,1,2], E:[2,2,3] } },
  { name: "Australia", label: "Australia", region: "Oceania", group: "Traditional power",
    s: { A:[2,3,2,1,0], B:[0,2,3,2,1], C:[2,2,1,2,1], D:[0,2,2], E:[2,2,3] } },
  { name: "South Korea", label: "South Korea", region: "East Asia", group: "AI-specific player",
    s: { A:[2,3,2,2,0], B:[3,2,1,2,2], C:[1,1,2,2,1], D:[0,2,1], E:[3,2,2] } },
  { name: "Netherlands", label: "Netherlands", region: "Europe", group: "AI-specific player",
    s: { A:[2,3,2,1,0], B:[3,2,1,2,1], C:[2,1,2,2,1], D:[0,1,2], E:[2,1,3] } },
  { name: "Taiwan", label: "Taiwan", region: "East Asia", group: "AI-specific player",
    s: { A:[2,3,2,1,0], B:[3,1,0,2,1], C:[0,0,0,1,1], D:[0,2,0], E:[2,1,0] } },
  { name: "Singapore", label: "Singapore", region: "Southeast Asia", group: "AI-specific player", marker: [103.82, 1.35],
    s: { A:[1,3,3,1,0], B:[1,2,0,2,2], C:[2,2,2,2,2], D:[0,2,1], E:[3,2,2] } },
  { name: "Israel", label: "Israel", region: "Middle East", group: "AI-specific player",
    s: { A:[1,3,3,1,0], B:[1,1,0,2,2], C:[1,1,0,1,2], D:[2,3,1], E:[1,1,1] } },
  { name: "United Arab Emirates", label: "UAE", region: "Middle East", group: "AI-specific player",
    s: { A:[1,3,2,1,0], B:[0,3,2,3,2], C:[1,2,2,2,2], D:[0,1,0], E:[2,1,2] } },
  { name: "Saudi Arabia", label: "Saudi Arabia", region: "Middle East", group: "AI-specific player",
    s: { A:[2,3,1,1,0], B:[0,2,2,3,1], C:[2,2,1,1,2], D:[0,2,0], E:[2,1,1] } },
  { name: "Malaysia", label: "Malaysia", region: "Southeast Asia", group: "AI-specific player",
    s: { A:[1,2,1,1,1], B:[2,3,1,2,1], C:[1,2,1,1,1], D:[0,1,0], E:[2,0,1] } },
  { name: "Chile", label: "Chile", region: "Latin America", group: "Resource holder",
    s: { A:[1,3,1,1,0], B:[0,1,3,1,1], C:[1,1,1,1,1], D:[0,0,1], E:[2,1,2] } },
  { name: "Dem. Rep. Congo", label: "DR Congo", region: "Africa", group: "Resource holder",
    s: { A:[1,0,0,1,1], B:[1,0,3,0,0], C:[1,1,0,0,1], D:[0,1,0], E:[0,0,0] } },
  { name: "India", label: "India", region: "South Asia", group: "Large emerging economy",
    s: { A:[3,1,2,3,3], B:[1,2,2,2,2], C:[2,3,3,2,3], D:[3,2,1], E:[2,2,2] } },
  { name: "Brazil", label: "Brazil", region: "Latin America", group: "Large emerging economy",
    s: { A:[2,2,1,2,2], B:[0,1,2,1,1], C:[2,3,2,2,2], D:[0,1,1], E:[2,1,2] } },
  { name: "Indonesia", label: "Indonesia", region: "Southeast Asia", group: "Large emerging economy",
    s: { A:[2,2,1,2,2], B:[0,1,2,1,1], C:[2,2,1,2,2], D:[0,1,0], E:[1,0,1] } },
  { name: "Mexico", label: "Mexico", region: "Latin America", group: "Large emerging economy",
    s: { A:[2,2,1,2,1], B:[0,1,1,1,1], C:[1,2,0,1,1], D:[0,1,1], E:[1,0,1] } },
  { name: "Turkey", label: "Türkiye", region: "Europe / Middle East", group: "Large emerging economy",
    s: { A:[2,2,1,2,1], B:[0,1,1,1,1], C:[2,2,1,1,2], D:[0,2,1], E:[1,0,1] } },
  { name: "Pakistan", label: "Pakistan", region: "South Asia", group: "Large emerging economy",
    s: { A:[1,1,1,2,2], B:[0,0,1,0,1], C:[1,1,0,1,1], D:[3,2,1], E:[1,0,0] } },
  { name: "South Africa", label: "South Africa", region: "Africa", group: "Large emerging economy",
    s: { A:[1,2,1,1,1], B:[0,1,2,1,1], C:[2,3,1,2,2], D:[0,1,3], E:[1,0,1] } },
  { name: "Nigeria", label: "Nigeria", region: "Africa", group: "Large emerging economy",
    s: { A:[1,1,1,2,2], B:[0,0,1,1,1], C:[2,3,1,1,1], D:[0,1,1], E:[2,0,1] } },
  { name: "Egypt", label: "Egypt", region: "Africa / Middle East", group: "Large emerging economy",
    s: { A:[1,1,1,2,1], B:[0,0,1,1,0], C:[2,2,1,1,1], D:[0,2,1], E:[1,0,1] } },
  { name: "Kenya", label: "Kenya", region: "Africa", group: "Large emerging economy",
    s: { A:[1,1,1,1,3], B:[0,1,1,1,1], C:[1,2,2,1,1], D:[0,0,1], E:[2,0,1] } },
  { name: "Ghana", label: "Ghana", region: "Africa", group: "Smaller state",
    s: { A:[0,1,1,1,1], B:[0,0,1,0,1], C:[1,1,0,1,1], D:[0,0,1], E:[1,0,1] } },
  { name: "Rwanda", label: "Rwanda", region: "Africa", group: "Smaller state",
    s: { A:[0,0,1,0,1], B:[0,0,0,0,0], C:[1,1,2,1,1], D:[0,0,0], E:[2,0,1] } }
];

const DEFINITION = "Draft: An AI middle power is a state that lacks the frontier-setting capacity of the United States or China but holds enough combined economic and material weight, AI and compute capacity, diplomatic and institutional leverage, security and strategic weight, and AI governance capacity to shape how AI is built and governed internationally, whether alone, through coalitions, or by controlling a point of leverage that others depend on.";

const FINDINGS = [
  { tag: "Gap", title: "Labour and data supply are an under-described source of leverage",
    body: "Countries whose main stake in AI is as users, data sources and annotation labour (e.g. Kenya, India, Nigeria) barely register on compute-centric definitions. In the 9 Nov meeting Erik agreed this should be its own criterion rather than folded into the user base, and that the governance question of protecting workers from exploitation belongs in the framework. Draft criterion A5 is included but switched off so the team can compare results with and without it." },
  { tag: "Finding", title: "Market access is a large and under-counted lever",
    body: "The EU's combined market and the EU AI Act's ultimate enforcement option, denying market access to a non-compliant model, give regulatory reach that compute-only rankings miss. Open question: score the EU as a bloc, or credit member states through E1/E3?" },
  { tag: "Research question", title: "When did the 'middle powers + AI governance' conversation start?",
    body: "The literature review mostly covers 2024–2025. Identify the first author and year that link middle powers to AI governance, including earlier work under other labels (AI ethics, digital sovereignty, 'digital empires'). One hypothesis to test: the 2023 Bletchley Park summit is part of the causal chain, as power visibly concentrated between the US and China." },
  { tag: "Test-scoring note", title: "Security criteria push the UK and France close to the ceiling",
    body: "Nuclear status and arms-control experience score the UK and France near the US and China on aggregate. If AI leverage is the focus, consider lowering the weight on Dimension D (use the weight sliders) or requiring a minimum compute score for the 'major power' tier." },
  { tag: "Test-scoring note", title: "Russia scores as a strong middle power",
    body: "On aggregate, Russia lands in the strong-middle-power band through security and diplomatic weight despite a weak AI governance profile. Decide whether the definition should cover only states engaged in multilateral AI governance, or simply report such cases as outliers." },
  { tag: "Test-scoring note", title: "There are 'specialist' middle powers",
    body: "Taiwan, the Netherlands and South Korea score at the top on supply-chain chokepoints but much lower on diplomatic leverage, while African states such as Rwanda, Kenya and Nigeria show the reverse pattern. The per-dimension view may be more informative than a single overall tier." },
  { tag: "Method", title: "Flag thin-data criteria instead of forcing scores",
    body: "Following Erik's advice: where a criterion can't be scored with confidence (likely C5 strategic autonomy and E2 evaluation capacity), mark it as a 'potential criterion' and leave it out of scoring, as A5 is now. An incomplete but clearly bounded framework is still a contribution and a marker for follow-on research." },
  { tag: "Terminology", title: "Constraints vs restraints",
    body: "Constraints are things an actor must do (e.g. report to a regulator); restraints are things an actor cannot or should not do. Most of what the literature review calls 'constraints' on middle powers are restraints, so the wording should be checked throughout." }
];
