// ===== MAJOR POWER TIER: DATA =====
// Source of truth: docs/major-power-criteria.md (Dr Chris Agape Ajah, 19 Nov 2026).
// The major power levels are PROPOSALS to test with Erik. Pilot results are for 9 actors only;
// every other country is "not assessed" and goes straight to the middle power score.
// Figures are shares of the world total for the latest year available (mostly 2025; GDP is the IMF 2026 projection).
// Logic lives in js/major.js. Nothing in here should need logic changes when a rule or value changes.

// ---- Tier rules (edit here, no logic changes needed) ----
const MAJOR_RULES = {
  major:    { minTotal: 16, minPerDim: { A: 2, B: 3, C: 3, D: 2, E: 2 } },  // spec: 16+ criteria AND these per-dimension minimums
  emerging: { minTotal: 12 }  // watchlist: 12 or more at the major level but not Major (12-15, or 16+ that fails a dimension minimum)
};

// ---- Criterion thresholds ----
// Keys are the repo's criterion ids. Spec numbering: 1-4 = A1-A4, 5-9 = B1-B5, 10-14 = C1-C5, 15-17 = D1-D3, 18-20 = E1-E3.
// A5 (labour and data supply, proposed) has no major power level and is not part of the major power test.
// sources[].url: URLs taken from the spec's source list are unmarked; "confirm: true" marks a canonical publisher
// URL added by us because the spec only names the source. Chris to confirm those.
const MAJOR_LEVEL = {
  A1: { n: 1, middle: "GDP ranked about 10th to 50th", major: "≥10% of world GDP",
        sources: [{ label: "IMF World Economic Outlook", url: "https://www.imf.org/en/Publications/WEO", confirm: true }] },
  A2: { n: 2, middle: "High or upper-middle income", major: "Upper-middle or high income, combined with criterion 1 (scale and income together)",
        sources: [{ label: "World Bank country income classifications", url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519" }] },
  A3: { n: 3, middle: "Strong tertiary, STEM or AI researcher base", major: "≥10% of the world's top-tier AI researchers work there",
        sources: [{ label: "MacroPolo Global AI Talent Tracker", url: "https://archivemacropolo.org/interactive/digital-projects/the-global-ai-talent-tracker" }] },
  A4: { n: 4, middle: "Large internet or digital market", major: "≥10% of the global digital economy by value",
        sources: [{ label: "Forrester, Global Digital Economy Forecast 2023 to 2028", url: "https://www.forrester.com/blogs/the-global-digital-economy-will-reach-16-5-trillion-and-capture-17-of-global-gdp-by-2028" },
                  { label: "ITU statistics", url: "https://www.itu.int/en/ITU-D/Statistics/Pages/stat/default.aspx", confirm: true }] },
  B1: { n: 5, middle: "Controls a hard-to-replace step in AI chips", major: "Controls such a step (design, equipment, fabrication or chip materials) and has restricted its export on its own initiative",
        sources: [{ label: "CSET (Georgetown)", url: "https://cset.georgetown.edu/", confirm: true }] },
  B2: { n: 6, middle: "Domestic capacity or national compute programme", major: "≥10% of global AI compute (counted by control, not location)",
        open: "Open decision: which compute measure to use, installed capacity or new chip arrivals.",
        sources: [{ label: "Epoch AI, GPU cluster performance share by country", url: "https://epoch.ai/data-insights/ai-supercomputers-performance-share-by-country" }] },
  B3: { n: 7, middle: "Surplus energy or major mineral reserves", major: "≥10% of world electricity, or ≥50% of global refining of an AI-critical mineral",
        sources: [{ label: "Ember, Global Electricity Review 2026", url: "https://ember-energy.org/latest-insights/global-electricity-review-2026/electricity-demand-and-supply-trends/" },
                  { label: "IEA, Global Critical Minerals Outlook 2026", url: "https://www.iea.org/reports/global-critical-minerals-outlook-2026/executive-summary" }] },
  B4: { n: 8, middle: "Private AI investment or active sovereign funds", major: "≥10% of global AI investment, public and private",
        open: "Open decision: whether public AI investment is added, so that state funding is counted.",
        sources: [{ label: "Stanford AI Index 2026, Chapter 1: Research and Development", url: "https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_1_research_development.pdf" }] },
  B5: { n: 9, middle: "Near-frontier or widely used domestic models", major: "≥10% of notable models, or a domestic model within about 12 months of the frontier",
        sources: [{ label: "Epoch AI", url: "https://epoch.ai/data", confirm: true },
                  { label: "Stanford AI Index 2026", url: "https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_1_research_development.pdf" }] },
  C1: { n: 10, middle: "G20 or OECD member, or elected UNSC seat", major: "Veto or blocking power in a core body: a permanent UNSC seat, or an IMF voting share above the 15% blocking line",
        sources: [{ label: "UN Security Council members", url: "https://main.un.org/securitycouncil/en/content/current-members", confirm: true },
                  { label: "IMF quotas and voting shares", url: "https://www.imf.org/en/About/Factsheets/Sheets/2016/07/14/12/21/IMF-Quotas", confirm: true }] },
  C2: { n: 11, middle: "Leading role in a regional body", major: "Anchors a bloc and runs a state programme exporting its AI stack or AI capacity to other countries",
        sources: [{ label: "Executive Order 14320, Promoting the Export of the American AI Technology Stack", url: "https://www.whitehouse.gov/presidential-actions/2025/07/promoting-the-export-of-the-american-ai-technology-stack/" },
                  { label: "Ministry of Foreign Affairs of China, Global AI Governance Action Plan", url: "https://www.mfa.gov.cn/eng/xw/zyxw/202507/t20250729_11679232.html" }] },
  C3: { n: 12, middle: "Hosts or co-chairs an AI governance event", major: "Initiates a UN process on AI, or hosts a recurring global AI governance meeting",
        sources: [{ label: "UN Digital Library (resolutions and records)", url: "https://digitallibrary.un.org/", confirm: true },
                  { label: "CAIDP, Hiroshima AI Process and Friends Group", url: "https://www.caidp.org/resources/hiroshima-ai-process/" }] },
  C4: { n: 13, middle: "Builds cross-regional coalitions", major: "Assembles a multi-country coalition around its own AI agenda",
        sources: [{ label: "UN Digital Library (resolutions and records)", url: "https://digitallibrary.un.org/", confirm: true },
                  { label: "China Daily, UNGA capacity-building resolution", url: "https://subsites.chinadaily.com.cn/wic/2024-07/03/c_1001345.htm" }] },
  C5: { n: 14, middle: "Works with both the US and China", major: "Not dependent on a rival power for any critical AI input, and draws other states into its technology sphere",
        sources: [{ label: "Epoch AI", url: "https://epoch.ai/data", confirm: true },
                  { label: "UN Comtrade (export data)", url: "https://comtradeplus.un.org/", confirm: true }] },
  D1: { n: 15, middle: "Holds nuclear weapons", major: "Arsenal of 500 or more warheads (global-scale deterrence)",
        sources: [{ label: "SIPRI Yearbook 2026, World nuclear forces", url: "https://www.sipri.org/sites/default/files/YB26%2008%20World%20Nuclear%20Forces.pdf" }] },
  D2: { n: 16, middle: "Military spending or defence AI programme", major: "≥10% of world military spending",
        sources: [{ label: "SIPRI, Trends in World Military Expenditure 2025", url: "https://www.sipri.org/sites/default/files/2026-04/2604_milex_2025.pdf" }] },
  D3: { n: 17, middle: "Leading role in arms control bodies", major: "NPT nuclear-weapon state that has agreed strategic arms or military-AI risk measures directly with another major power",
        sources: [{ label: "UNODA treaties database", url: "https://treaties.unoda.org/", confirm: true }] },
  E1: { n: 18, middle: "Published strategy or AI-specific rules", major: "Binding AI rules that reach beyond its borders (export controls, or rules on foreign providers serving its market)",
        sources: [{ label: "OECD.AI policy observatory", url: "https://oecd.ai/", confirm: true }] },
  E2: { n: 19, middle: "Government AISI or network membership", major: "A state body that evaluates frontier models, including rivals' models, and acts on or publishes the results",
        sources: [{ label: "NIST CAISI, Evaluation of DeepSeek V4 Pro", url: "https://www.nist.gov/news-events/news/2026/05/caisi-evaluation-deepseek-v4-pro" }] },
  E3: { n: 20, middle: "Signs or endorses major instruments", major: "Authors an instrument or framework that many other states formally join",
        sources: [{ label: "OECD.AI policy observatory", url: "https://oecd.ai/", confirm: true },
                  { label: "UN Digital Library (resolutions and records)", url: "https://digitallibrary.un.org/", confirm: true }] }
};

// Planned methodology: text only. The dashboard does NOT compute any of this yet.
const MAJOR_METHOD_NOTES = [
  "3-year rolling averages for the quantitative criteria, so a single large investment year does not move a country.",
  "Two consecutive assessments to enter or leave a tier, so countries do not flip between tiers.",
  "An “emerging major power” watch tier for countries at the major power level on 12 or more criteria.",
  "Compute counted by control, not location: hosted clusters count toward criterion 6 at the middle power level; only compute under domestic control counts at the major power level."
];

// ---- Pilot results ----
// Transcribed row by row from the spec's pilot table so the columns stay aligned with it.
// Cell = "<r> <note>" where r is y (yes: at the major power level), n (no: below it) or b (borderline or data gap).
// The note is the spec's evidence text without its symbol; the UI shows the symbol from r.
// Column order: US, China, EU (bloc), UK, Japan, France, Russia, India, UAE.
const MAJOR_PILOT_COLUMNS = ["United States of America", "China", "EU", "United Kingdom", "Japan", "France", "Russia", "India", "United Arab Emirates"];
const MAJOR_PILOT_ROWS = {
  A1: ["y 25.5%", "y 16.8%", "y 17.8%", "n 3.3%", "n 3.4%", "n 2.8%", "n 2.2%", "n 3.2%", "n 0.5%"],
  A2: ["y High", "y Upper-middle", "y High", "y High", "y High", "y High", "y Upper-middle or above", "n Lower-middle", "y High"],
  A3: ["y 59%", "y 11%", "b About 10% (2019)", "n 6%", "n Not reported", "n Not reported", "n Not reported", "n 2%", "n Not reported"],
  A4: ["y ~35%", "y ~26%", "b Not measured as a bloc", "n ~5%", "n Under 5%", "n Under 5%", "n Not tracked", "n Under 5%", "n Not tracked"],
  B1: ["y Chips, equipment; own controls since 2022", "y Gallium, germanium; own controls since 2023", "n ASML; controls coordinated with US", "n Arm IP; no own controls", "n Equipment, materials; controls coordinated with US", "n", "n", "n", "n"],
  B2: ["y 72–75%", "b 9.6–14.1%", "n 5.1%", "n Under 2%", "n 1.6%", "n Within EU", "n Under 2%", "n 1.6%", "n Hosted, foreign-controlled"],
  B3: ["y 14% of electricity", "y 33% of electricity; 85% of rare earth refining", "n About 8% (approx.)", "n", "n About 3% (approx.)", "n", "n About 4% (approx.)", "n 6.6%", "n"],
  B4: ["y 83%", "b 3.6% private; state funds not counted", "n 6.1%", "n Under 6%", "n Under 7%", "n Under 6%", "n Under 7%", "n Under 7%", "n Under 7%"],
  B5: ["y 57%", "y 34%; about 8 months behind frontier", "n About 2%", "n 1 of 87", "n 0–1", "n 1 of 87", "n 0–1", "n 0–1", "n 0–1"],
  C1: ["y P5; IMF blocking share", "y P5", "b Members vote separately", "y P5", "n", "y P5", "y P5", "n", "n"],
  C2: ["y American AI Exports Program (2025)", "y AI Capacity-Building Action Plan (2024)", "b A bloc; no AI-stack export programme", "n", "n", "n", "b Anchors EAEU; no AI programme", "b Global South voice; no AI-stack programme", "n"],
  C3: ["y First UNGA AI resolution (2024)", "y Annual WAIC and High-Level Meeting on Global AI Governance", "n", "b Bletchley (one summit in a series)", "y Hiroshima AI Process meetings", "b AI Action Summit (2025)", "n", "b Paris co-chair (2025); AI Impact Summit (2026)", "n"],
  C4: ["y 123 co-sponsors (2024); chip-control coalition", "y Capacity-building resolution adopted by consensus; WAICO", "b", "y Bletchley Declaration", "y Friends Group, 66 countries", "b", "n", "b", "n"],
  C5: ["y", "y Huawei Ascend is the largest chip type in its compute", "n Relies on US compute and cloud", "n", "n", "n", "n No frontier stack", "n", "n Relies on US chips"],
  D1: ["y With Russia, about 83% of stockpiles", "y 620 warheads", "n No bloc arsenal", "n Under 500", "n None", "n Under 500", "y", "n 190", "n None"],
  D2: ["y 33%", "y 12%", "n No EU-level figure", "n 3.1%", "n 2.2%", "n 2.4%", "n 6.6%", "n 3.2%", "n Not in top 40"],
  D3: ["y New START; Lima statement with China (2024)", "y Lima statement with US (2024)", "n", "n No direct major-power agreement", "n", "n No direct major-power agreement", "y New START", "n Outside NPT", "n"],
  E1: ["y AI chip export controls", "y Generative AI measures (2023), labelling rules (2025), mineral controls", "y AI Act covers foreign providers", "n No AI law", "n", "n Via EU", "n", "n", "n"],
  E2: ["y CAISI evaluates rivals' models", "y Mandatory state security assessment; CnAISDA", "b AI Office", "y AI Security Institute", "b Japan AISI", "n", "n", "b IndiaAI Safety Institute", "n"],
  E3: ["y UNGA resolution", "y Global AI Governance Action Plan (2025)", "b", "y Bletchley Declaration", "y Hiroshima Code of Conduct", "b", "n", "b", "n"]
};
// Build one actor's results { A1: {r, note}, ... } from the rows above.
function buildPilot(actor) {
  const col = MAJOR_PILOT_COLUMNS.indexOf(actor), out = {};
  Object.keys(MAJOR_PILOT_ROWS).forEach(id => {
    const cell = MAJOR_PILOT_ROWS[id][col];
    out[id] = { r: { y: "yes", n: "no", b: "borderline" }[cell[0]], note: cell.slice(2) };
  });
  return out;
}
// Countries, keyed by COUNTRIES[].name. Anyone missing here is "not assessed".
const MAJOR_PILOT = {};
MAJOR_PILOT_COLUMNS.filter(a => a !== "EU").forEach(a => { MAJOR_PILOT[a] = buildPilot(a); });

// ---- The EU as a single bloc (not a COUNTRIES entry) ----
const EU_BLOC = {
  name: "EU", label: "European Union (bloc)", region: "Europe", group: "Bloc",
  members: ["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"],
  markers: { Malta: [14.38, 35.9] },   // members too small for the 110m map are drawn as dots in bloc view
  // Headline shown for the bloc, as worded in the brief. The per-dimension breakdown beside it is computed.
  headline: "Not a major power: no criteria at the major power level in Dimension D",
  pilot: buildPilot("EU")
};

// ---- Sources for the existing middle power measures (the repo's original `ref` text, now with links) ----
// Every URL here was added by us (the spec's source list covers the major power level only), except where noted.
// confirm: true = Chris to confirm. url: null = no canonical source yet (shown as plain text with "link to add"). None remain at the moment.
const MIDDLE_SOURCES = {
  A1: [{ label: "World Bank WDI", url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD", confirm: true }, { label: "IMF WEO", url: "https://www.imf.org/en/Publications/WEO", confirm: true }],
  A2: [{ label: "World Bank income classification", url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519" }],
  A3: [{ label: "Stanford AI Index", url: "https://hai.stanford.edu/ai-index", confirm: true }, { label: "OECD.AI talent flows", url: "https://oecd.ai/", confirm: true }],
  A4: [{ label: "ITU internet users", url: "https://www.itu.int/en/ITU-D/Statistics/Pages/stat/default.aspx", confirm: true }],
  A5: [{ label: "Fairwork Cloudwork Ratings 2023 (Oxford Internet Institute): data-labelling and annotation platforms", url: "https://fairwork.oii.ox.ac.uk/en/fw/publications/fairwork-cloudwork-ratings-2023-work-in-the-planetary-labour-market/", confirm: true }],
  B1: [{ label: "SIA", url: "https://www.semiconductors.org/", confirm: true }, { label: "CSET", url: "https://cset.georgetown.edu/", confirm: true }],
  B2: [{ label: "TOP500", url: "https://www.top500.org/", confirm: true }],
  B3: [{ label: "IEA energy data", url: "https://www.iea.org/data-and-statistics", confirm: true }, { label: "USGS mineral production", url: "https://www.usgs.gov/centers/national-minerals-information-center", confirm: true }],
  B4: [{ label: "Stanford AI Index", url: "https://hai.stanford.edu/ai-index", confirm: true }, { label: "OECD.AI", url: "https://oecd.ai/", confirm: true }],
  B5: [{ label: "Epoch AI notable models", url: "https://epoch.ai/data", confirm: true }],
  C1: [{ label: "UN Security Council", url: "https://main.un.org/securitycouncil/en/content/current-members", confirm: true }, { label: "OECD members", url: "https://www.oecd.org/en/about/members-partners.html", confirm: true }, { label: "G20", url: "https://g20.org/", confirm: true }],
  C2: [{ label: "African Union", url: "https://au.int/", confirm: true }, { label: "ASEAN", url: "https://asean.org/", confirm: true }, { label: "European Union", url: "https://european-union.europa.eu/", confirm: true }],
  C3: [{ label: "Bletchley Declaration", url: "https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration", confirm: true }, { label: "CAIDP, Hiroshima AI Process", url: "https://www.caidp.org/resources/hiroshima-ai-process/" }],
  C4: [{ label: "International Campaign to Ban Landmines (Ottawa process)", url: "https://www.icbl.org/", confirm: true }],
  // C5 is a qualitative judgement. There is no standard index, so these are framework sources, not data sources.
  C5: [{ label: "Brookings, Middle power AI agency: preserving choice between the US and China", url: "https://www.brookings.edu/articles/middle-power-ai-agency-preserving-choice-between-the-united-states-and-china/", confirm: true },
       { label: "GMF, Middle Powers\u2019 Bounded Ambition in AI", url: "https://gmfus.org/news/middle-powers-bounded-ambition-ai", confirm: true },
       { label: "Chatham House, How middle powers can weather US and Chinese AI dominance", url: "https://chathamhouse.org/2026/02/how-middle-powers-can-weather-us-and-chinese-ai-dominance", confirm: true }],
  D1: [{ label: "SIPRI Yearbook", url: "https://www.sipri.org/sites/default/files/YB26%2008%20World%20Nuclear%20Forces.pdf" }],
  D2: [{ label: "SIPRI military expenditure", url: "https://www.sipri.org/sites/default/files/2026-04/2604_milex_2025.pdf" }],
  D3: [{ label: "IAEA", url: "https://www.iaea.org/", confirm: true }, { label: "CTBTO", url: "https://www.ctbto.org/", confirm: true }],
  E1: [{ label: "OECD.AI policy observatory", url: "https://oecd.ai/", confirm: true }],
  E2: [{ label: "NIST AI Safety Institute (US) and the International Network", url: "https://www.nist.gov/artificial-intelligence-safety-institute", confirm: true }],
  E3: [{ label: "CoE AI Convention", url: "https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence", confirm: true }, { label: "GPAI", url: "https://gpai.ai/", confirm: true }, { label: "CAIDP, Hiroshima AI Process", url: "https://www.caidp.org/resources/hiroshima-ai-process/" }]
};
