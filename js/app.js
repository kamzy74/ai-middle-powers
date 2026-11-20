// Major and Emerging come from the major power test (data/major-power.js, js/major.js).
// Strong / Weak / Not a middle power come from the overall score and the cut-offs in Settings.
// Colours checked with the dataviz palette validator: plum / amber / blue are well separated under colour-blind simulation.
// Strong / Weak / Not a middle power are one blue ramp (light = lower tier). Text labels carry the tier too, never colour alone.
const TIERS = [
  { id:4, name:"Major power", short:"Major", color:"var(--t4)", hex:"#6b2d8f", rule: () => `≥ ${MAJOR_RULES.major.minTotal} criteria at the major power level, and the minimum in every dimension` },
  { id:3, name:"Emerging major power", short:"Emerging", color:"var(--t3)", hex:"#c77700", rule: () => `≥ ${MAJOR_RULES.emerging.minTotal} criteria at the major power level, not Major (watchlist)` },
  { id:2, name:"Strong middle power", short:"Strong", color:"var(--t2)", hex:"#1c5cab", rule: t => `Overall ≥ ${t.strong}` },
  { id:1, name:"Weak middle power", short:"Weak", color:"var(--t1)", hex:"#3987e5", rule: t => `${t.weak}–${t.strong-1}` },
  { id:0, name:"Not a middle power", short:"Not middle", color:"var(--t0)", hex:"#86b6ef", rule: t => `Under ${t.weak}` }
];
const DEFAULTS = { thr:{strong:55, weak:30}, w:{A:1,B:1,C:1,D:1,E:1},
  off: Object.fromEntries(DIMENSIONS.flatMap(d=>d.criteria).map(c=>[c.id, !!c.proposed])) };
let S = JSON.parse(JSON.stringify(DEFAULTS));
try { const sv = JSON.parse(localStorage.getItem("mp-settings")||"null"); if (sv && sv.thr) S = Object.assign(S, sv); } catch(e){}
const save = () => { try { localStorage.setItem("mp-settings", JSON.stringify(S)); } catch(e){} };

let selected = null;

function compute(){
  COUNTRIES.forEach(c => {
    c.dim = {};
    DIMENSIONS.forEach(d => {
      const vals = d.criteria.map((cr,i) => S.off[cr.id] ? null : c.s[d.id][i]).filter(v => v!==null);
      c.dim[d.id] = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length/3*100) : 0;
    });
    const wsum = DIMENSIONS.reduce((a,d)=>a+S.w[d.id],0) || 1;
    c.overall = Math.round(DIMENSIONS.reduce((a,d)=>a+c.dim[d.id]*S.w[d.id],0)/wsum);
    // The major power test runs first. Countries not assessed, or that fail it, use the existing score-based tiers.
    c.major = MAJOR_PILOT[c.name] ? majorTest(MAJOR_PILOT[c.name]) : null;
    c.tier = c.major && c.major.isMajor ? 4 : c.major && c.major.isEmerging ? 3
           : c.overall>=S.thr.strong ? 2 : c.overall>=S.thr.weak ? 1 : 0;
  });
  EU_ENTITY.major = majorTest(EU_BLOC.pilot);
}
// The EU as one bloc has a major power result but no middle power score, so it gets its own neutral colour.
const BLOC_TIER = { id:-1, name:"EU as one bloc (major power test only)", short:"EU bloc", hex:"#9a8f7e" };
const tierOf = id => id===-1 ? BLOC_TIER : TIERS.find(t=>t.id===id);
const esc = v => String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
let blocOn = false;                         // "Show EU as one bloc" toggle
const euMembers = new Set(EU_BLOC.members);
const EU_ENTITY = { name:"EU", label:EU_BLOC.label, region:EU_BLOC.region, group:EU_BLOC.group, isBloc:true, tier:-1 };
const entityByKey = name => name==="EU" ? EU_ENTITY : byName[name];
const entityForFeature = name => blocOn && euMembers.has(name) ? EU_ENTITY : byName[name];
const byName = Object.fromEntries(COUNTRIES.map(c=>[c.name,c]));

/* ---------- MAP ---------- */
const svg = d3.select("#map");
const proj = d3.geoNaturalEarth1().fitExtent([[5,5],[955,495]], {type:"Sphere"});
const path = d3.geoPath(proj);
const feats = topojson.feature(WORLD, WORLD.objects.countries).features.filter(f=>f.properties.name!=="Antarctica");
svg.append("path").attr("d", path({type:"Sphere"})).attr("fill","#fbfaf7");
const gC = svg.append("g");
const countryPaths = gC.selectAll("path").data(feats).join("path")
  .attr("class", "c")
  .attr("d", path);
const markers = svg.append("g").selectAll("circle").data(COUNTRIES.filter(c=>c.marker)).join("circle")
  .attr("class","mk").attr("r",6).attr("cx",c=>proj(c.marker)[0]).attr("cy",c=>proj(c.marker)[1]);

// Bloc members too small for the 110m map (Malta) are drawn as dots, shown only in bloc view.
const blocMarkers = svg.append("g").selectAll("circle").data(Object.entries(EU_BLOC.markers)).join("circle")
  .attr("class","mk").attr("r",6).attr("cx",d=>proj(d[1])[0]).attr("cy",d=>proj(d[1])[1]);

const seq = d3.scaleQuantize().domain([0,100]).range(["#cde2fb","#86b6ef","#3987e5","#1c5cab","#0d366b"]);
const colorBy = document.getElementById("colorBy");
colorBy.innerHTML = `<option value="tier">Overall tier</option>` + DIMENSIONS.map(d=>`<option value="${d.id}">${d.id}. ${d.name}</option>`).join("");
colorBy.onchange = renderMap;

function fillFor(c){
  if (!c) return "var(--none)";
  if (c.isBloc) return colorBy.value==="tier" ? BLOC_TIER.hex : "var(--none)";   // the bloc has no dimension scores
  return colorBy.value==="tier" ? tierOf(c.tier).hex : seq(c.dim[colorBy.value]);
}
function renderMap(){
  countryPaths.attr("fill", f => fillFor(entityForFeature(f.properties.name)))
    .classed("scored", f => !!entityForFeature(f.properties.name))
    .classed("sel", f => selected && (f.properties.name===selected || (selected==="EU" && blocOn && euMembers.has(f.properties.name))));
  markers.attr("fill", fillFor).classed("sel", c => c.name===selected);
  blocMarkers.attr("display", blocOn ? null : "none").attr("fill", fillFor(EU_ENTITY)).classed("sel", selected==="EU");
  const lg = document.getElementById("legend");
  if (colorBy.value==="tier"){
    lg.innerHTML = TIERS.map(t=>`<span><i style="background:${t.hex}"></i>${t.name}</span>`).join("")
      + (blocOn ? `<span><i style="background:${BLOC_TIER.hex}"></i>${BLOC_TIER.name}</span>` : "")
      + `<span><i style="background:#e6e3dc"></i>Not yet scored</span>`;
  } else {
    const d = DIMENSIONS.find(x=>x.id===colorBy.value);
    lg.innerHTML = `<span style="color:var(--ink)">${d.name} score</span>` + seq.range().map((col,i)=>`<span><i style="background:${col}"></i>${i*20}–${i===4?100:i*20+19}</span>`).join("") + `<span><i style="background:#e6e3dc"></i>Not yet scored</span>`;
  }
}
const tip = document.getElementById("tip");
function showTip(e, c, fallback){
  tip.innerHTML = c && c.isBloc ? `<b>${c.label}</b><br>Not a major power · ${c.major.firm}–${c.major.withBorderline} of ${c.major.total} at the major power level<br><span style="opacity:.7">Middle power score not assessed for the bloc</span>`
    : c ? `<b>${c.label}</b><br>${tierOf(c.tier).name} · overall ${c.overall}` + (c.major ? `<br>Major power test: ${c.major.firm} of ${c.major.total} (${c.major.firm}–${c.major.withBorderline} with borderline)` : "") + (colorBy.value!=="tier" ? `<br>${DIMENSIONS.find(d=>d.id===colorBy.value).short}: ${c.dim[colorBy.value]}`:"")
    : `${fallback}<br><span style="opacity:.7">Not in test set</span>`;
  tip.style.left = (e.clientX+14)+"px"; tip.style.top = (e.clientY+12)+"px"; tip.style.opacity = 1;
}
countryPaths.on("mousemove",(e,f)=>showTip(e, entityForFeature(f.properties.name), f.properties.name)).on("mouseleave",()=>tip.style.opacity=0)
  .on("click",(e,f)=>{ const en = entityForFeature(f.properties.name); if (en) select(en.name); });
markers.on("mousemove",(e,c)=>showTip(e,c)).on("mouseleave",()=>tip.style.opacity=0).on("click",(e,c)=>select(c.name));
blocMarkers.on("mousemove",e=>showTip(e,EU_ENTITY)).on("mouseleave",()=>tip.style.opacity=0).on("click",()=>select("EU"));
document.getElementById("blocToggle").onchange = e => {
  blocOn = e.target.checked;
  if (!blocOn && selected==="EU") selected = null;
  renderMap(); renderCard(); renderCandidates();
};

/* ---------- COUNTRY CARD ---------- */
function select(name){
  selected = name; renderMap(); renderCard();
  if (location.hash!=="#map" && location.hash!=="") location.hash="map";
}
function dots(v){ return "<b>"+"●".repeat(v)+"</b><s>"+"●".repeat(3-v)+"</s>"; }
/* Major power test: verdict text, score range, per-dimension conditions and the 20 criteria */
function majorVerdict(m){
  const need = MAJOR_RULES.major.minTotal;
  if (m.isMajor) return { cls:"ok", text:`Major power: ${m.firm} of ${m.total} criteria at the major power level, and every dimension minimum met.` };
  const why = [];
  if (m.firm < need) why.push(`${m.firm} of ${m.total} criteria at the major power level (needs ${need})`);
  DIMENSIONS.filter(d=>m.byDim[d.id] && !m.byDim[d.id].ok).forEach(d=>why.push(`Dimension ${d.id}: ${m.byDim[d.id].yes} of ${m.byDim[d.id].total} (needs ${m.byDim[d.id].need})`));
  return { cls: m.isEmerging?"warn":"no", text:(m.isEmerging ? "Emerging major power (watchlist). Not yet a major power: " : "Not a major power: ") + why.join("; ") + "." };
}
function majorSection(m, results, headline){
  const sym = {yes:"✓", no:"✗", borderline:"~"}, word = {yes:"At the major power level", no:"Below the major power level", borderline:"Borderline or data gap"};
  const v = majorVerdict(m);
  return `<div class="mp"><h4>Major power test <span class="badge">pilot</span></h4>
    <div class="mpv ${v.cls}">${esc(headline || v.text)}</div>
    <div class="mpr"><b>${m.firm}</b> of ${m.total} firm · <b>${m.firm}–${m.withBorderline}</b> with borderline<small>Borderline results do not count toward the tier. They only widen the range.</small></div>
    <div class="mpd">${DIMENSIONS.map(d=>{ const b=m.byDim[d.id]; return `<div class="${b.ok?"pass":"fail"}"><span>${b.ok?"✓ Met":"✗ Not met"}</span> ${d.id}. ${d.short}: ${b.yes} of ${b.total} <i>(minimum ${b.need})</i></div>`; }).join("")}</div>
    <details open><summary>All ${m.total} criteria at the major power level</summary>
    ${DIMENSIONS.map(d=>`<div class="mpg">${d.id}. ${d.name}</div>` + d.criteria.filter(cr=>MAJOR_LEVEL[cr.id]).map(cr=>{ const x=results[cr.id]; return `<div class="mr"><span class="rs ${x.r}" role="img" aria-label="${word[x.r]}" title="${word[x.r]}">${sym[x.r]}</span><span class="mn">${cr.id} ${esc(cr.name)}</span><span class="mt">${esc(x.note)||"<i>no note</i>"}</span></div>`; }).join("")).join("")}
    </details></div>`;
}
function renderBlocCard(c){
  const t = tierOf(c.tier);
  document.getElementById("cc").innerHTML = `<h2>${c.label}</h2><div class="meta">${c.region} · 27 member states shown as one entity</div>
    <div class="tierpill"><i style="background:${t.hex}"></i>${t.name}</div>
    <p class="hint" style="margin:10px 0 0">Middle power score: not assessed for the bloc. Turn the bloc view off to see member countries on their own.</p>
    ${majorSection(c.major, EU_BLOC.pilot, EU_BLOC.headline)}
    <p class="hint" style="margin:10px 0 0">The headline is the brief's wording. The breakdown above is computed from the pilot data.</p>`;
}
function renderCard(){
  const el = document.getElementById("cc");
  const c = entityByKey(selected);
  if (!c){ el.innerHTML = `<div class="empty">Select a country on the map</div>`; return; }
  if (c.isBloc) return renderBlocCard(c);
  const t = tierOf(c.tier);
  el.innerHTML = `<h2>${c.label}</h2><div class="meta">${c.region} · test group: ${c.group}</div>
    <div class="tierpill"><i style="background:${t.hex}"></i>${t.name}</div>
    <div class="overall">${c.overall} <small>/ 100 overall</small></div>
    <div style="margin-top:10px">` + DIMENSIONS.map(d => `
      <div class="dim" data-d="${d.id}">
        <div class="dimhead"><span class="car">›</span><span class="nm">${d.id}. ${d.name}</span><span class="val">${c.dim[d.id]}</span></div>
        <div class="bar"><span style="width:${c.dim[d.id]}%"></span></div>
        <div class="crit">${d.criteria.map((cr,i)=>`
          <div class="r ${S.off[cr.id]?"ex":""}"><span>${cr.id} ${cr.name}${cr.proposed?'<span class="badge">proposed</span>':''}${S.off[cr.id]&&!cr.proposed?'<span class="badge">off</span>':''}</span><span class="dots" title="${c.s[d.id][i]} of 3">${dots(c.s[d.id][i])}</span></div>
          <div class="ref">${cr.ref}</div>`).join("")}</div>
      </div>`).join("") + `</div>`
    + (c.major ? majorSection(c.major, MAJOR_PILOT[c.name]) : `<p class="hint" style="margin:12px 0 0">Major power level: not assessed. The pilot covers 9 actors so far, so this country goes straight to the middle power score.</p>`)
    + `<p class="hint" style="margin:10px 0 0">Click a dimension to see its criteria. Scores are draft (0–3).</p>`;
  el.querySelectorAll(".dimhead").forEach(h => h.onclick = () => h.parentElement.classList.toggle("open"));
}

/* ---------- EXPLORE ---------- */
let sortKey = "overall", sortDir = -1;
const dimFilter = document.getElementById("dimFilter"), grpFilter = document.getElementById("grpFilter"), tierFilter = document.getElementById("tierFilter"), q = document.getElementById("q");
dimFilter.innerHTML += DIMENSIONS.map(d=>`<option value="${d.id}">${d.id}. ${d.name}</option>`).join("");
grpFilter.innerHTML += [...new Set(COUNTRIES.map(c=>c.group))].map(g=>`<option>${g}</option>`).join("");
tierFilter.innerHTML += TIERS.map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
[dimFilter,grpFilter,tierFilter].forEach(x=>x.onchange=renderTable); q.oninput = renderTable;
function filtered(){
  const dq = dimFilter.value;
  return COUNTRIES.filter(c =>
    (!q.value || c.label.toLowerCase().includes(q.value.toLowerCase())) &&
    (!grpFilter.value || c.group===grpFilter.value) &&
    (tierFilter.value==="" || c.tier===+tierFilter.value) &&
    (!dq || (c.dim[dq] >= S.thr.strong && c.tier!==4)));
}
function renderTable(){
  const rows = filtered().sort((a,b)=>{
    const va = sortKey==="label"||sortKey==="group" ? a[sortKey] : sortKey.length===1 ? a.dim[sortKey] : a[sortKey];
    const vb = sortKey==="label"||sortKey==="group" ? b[sortKey] : sortKey.length===1 ? b.dim[sortKey] : b[sortKey];
    return (va>vb?1:va<vb?-1:0)*sortDir;
  });
  const cols = [["label","Country"],["group","Test group"],...DIMENSIONS.map(d=>[d.id, d.id+". "+d.short]),["overall","Overall"],["tier","Tier"]];
  const arrow = k => sortKey===k ? (sortDir>0?" ↑":" ↓") : "";
  document.getElementById("tbl").innerHTML = `<thead><tr>${cols.map(([k,l])=>`<th data-k="${k}" class="${k.length===1||k==="overall"?"num":""}">${l}${arrow(k)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(c=>`<tr data-n="${c.name}"><td class="hl">${c.label}</td><td>${c.group}</td>${DIMENSIONS.map(d=>`<td class="num"><span class="cell ${dimFilter.value===d.id?"hit":""}">${c.dim[d.id]}</span></td>`).join("")}<td class="num"><b>${c.overall}</b></td><td><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${tierOf(c.tier).hex};margin-right:6px"></i>${tierOf(c.tier).short}</td></tr>`).join("")}</tbody>`;
  document.querySelectorAll("#tbl th").forEach(th=>th.onclick=()=>{ const k=th.dataset.k; if (sortKey===k) sortDir*=-1; else {sortKey=k; sortDir=(k==="label"||k==="group")?1:-1;} renderTable(); });
  document.querySelectorAll("#tbl tbody tr").forEach(tr=>tr.onclick=()=>{ location.hash="map"; select(tr.dataset.n); });
  document.getElementById("dimHint").textContent = dimFilter.value ? `Showing countries that are not major powers and score at least ${S.thr.strong} on ${DIMENSIONS.find(d=>d.id===dimFilter.value).name} (${rows.length} found).` : `${rows.length} of ${COUNTRIES.length} test countries. Click a column to sort, or a row to open the country card.`;
}
document.getElementById("copyCsv").onclick = async () => {
  const crit = DIMENSIONS.flatMap(d=>d.criteria.map((c,i)=>({d:d.id,i,id:c.id})));
  const head = ["country","group","region",...crit.map(c=>c.id),...DIMENSIONS.map(d=>"dim_"+d.id),"overall","major_firm","major_with_borderline","tier"];
  const lines = [head.join(",")].concat(COUNTRIES.map(c=>[`"${c.label}"`,`"${c.group}"`,`"${c.region}"`,...crit.map(x=>c.s[x.d][x.i]),...DIMENSIONS.map(d=>c.dim[d.id]),c.overall,c.major?c.major.firm:"",c.major?c.major.withBorderline:"",`"${tierOf(c.tier).name}"`].join(",")));
  try { await navigator.clipboard.writeText(lines.join("\n")); toast("Copied CSV for all " + COUNTRIES.length + " countries"); }
  catch(e){ toast("Copy was blocked by the browser"); }
};
function toast(m){ const t=document.getElementById("toast"); t.textContent=m; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,1800); }

/* ---------- CANDIDATES ---------- */
function renderCandidates(){
  const bm = EU_ENTITY.major;
  document.getElementById("blocRow").innerHTML = blocOn ? `<div class="card col" data-n="EU" style="margin-bottom:14px;cursor:pointer"><h3><i style="background:${BLOC_TIER.hex}"></i>${EU_BLOC.label}</h3><div class="rule" style="margin-bottom:0">${esc(EU_BLOC.headline)} · ${bm.firm}–${bm.withBorderline} of ${bm.total} at the major power level. Its 27 members are shown as this one entity, and the bloc has no middle power score.</div></div>` : "";
  document.querySelectorAll("#blocRow [data-n]").forEach(el=>el.onclick=()=>{ location.hash="map"; select("EU"); });
  document.getElementById("cols").innerHTML = TIERS.map(t => {
    const list = COUNTRIES.filter(c=>c.tier===t.id && !(blocOn && euMembers.has(c.name))).sort((a,b)=>b.overall-a.overall);
    return `<div class="card col"><h3><i style="background:${t.hex}"></i>${t.name}</h3><div class="rule">${t.rule(S.thr)} · ${list.length} countries</div>
      <ul>${list.map(c=>`<li data-n="${c.name}">${c.label}<span>${c.overall}</span></li>`).join("") || '<li style="cursor:default;color:var(--muted)">None</li>'}</ul></div>`;
  }).join("");
  document.querySelectorAll("#cols li[data-n]").forEach(li=>li.onclick=()=>{ location.hash="map"; select(li.dataset.n); });
}

/* ---------- FRAMEWORK ---------- */
// Every source is a link that opens in a new tab. url:null means no canonical source yet, shown as plain text.
function srcLinks(list){
  return list.map(x => x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a>` : `<span>${esc(x.label)} <em>(link to add)</em></span>`).join(" · ");
}
function renderFramework(){
  const n = DIMENSIONS.flatMap(d=>d.criteria).filter(c=>!S.off[c.id]).length;
  document.getElementById("fw").innerHTML = DIMENSIONS.map(d=>`<div class="card"><h3>${d.id}. ${d.name}</h3>${d.criteria.map(c=>{ const ml = MAJOR_LEVEL[c.id]; return `
    <div class="cr"><span class="id">${c.id}</span><div class="tx">${c.name}${c.proposed?'<span class="badge">proposed</span>':''}
      <div class="lv"><b>Middle power measure:</b> ${ml ? esc(ml.middle) : "see criterion note"}</div>
      <div class="lv"><b>Major power level:</b> ${ml ? esc(ml.major) : "none (not part of the major power test)"}</div>
      <div class="rf"><b>Middle power source:</b> ${srcLinks(MIDDLE_SOURCES[c.id]||[])}</div>
      ${ml ? `<div class="rf"><b>Major power source:</b> ${srcLinks(ml.sources)}</div>` : ""}
      ${ml && ml.open ? `<div class="rf" style="color:var(--warn-ink)">${esc(ml.open)}</div>` : ""}
      ${c.note?`<div class="rf" style="color:var(--warn-ink)">${esc(c.note)}</div>`:""}</div>
    <input type="checkbox" class="switch" data-c="${c.id}" ${S.off[c.id]?"":"checked"} title="Include in scoring" aria-label="Include ${esc(c.id)} in scoring"></div>`; }).join("")}</div>`).join("")
    + `<div class="card" style="padding:16px"><h3>Scoring scale (draft)</h3><div class="rf" style="color:var(--ink2)">0 = minimal · 1 = limited · 2 = significant · 3 = leading or globally significant.<br><br>Dimension score = mean of its included criteria, rescaled to 0–100. Overall = weighted mean of dimension scores. This sets the middle power tiers.<br><br><b>${n}</b> criteria currently in scoring.</div></div>`
    + `<div class="card" style="padding:16px"><h3>Major power test (pilot)</h3><div class="rf" style="color:var(--ink2)">Runs first, on the 20 core criteria, for the 9 pilot actors only. Countries that do not pass go on to the middle power score.<br><br>
      <b>Major power:</b> at least ${MAJOR_RULES.major.minTotal} criteria at the major power level, and at least ${DIMENSIONS.map(d=>`${MAJOR_RULES.major.minPerDim[d.id]} in ${d.id}`).join(", ")}.<br>
      <b>Emerging major power (watchlist):</b> at least ${MAJOR_RULES.emerging.minTotal} criteria at the major power level, but not Major.<br>
      <b>Borderline</b> results do not count toward the tier. They only widen the score range.<br><br>
      The major power levels are proposals to test with Erik. Source of truth: docs/major-power-criteria.md.</div></div>`
    + `<div class="card" style="padding:16px"><h3>Planned methodology <span class="badge">not computed yet</span></h3><div class="rf" style="color:var(--ink2)">These rules are part of the plan. The dashboard does not compute any of them yet.<ul style="margin:8px 0 0;padding-left:18px">${MAJOR_METHOD_NOTES.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div></div>`
    + `<div class="card" style="padding:16px"><h3>Open decisions</h3><div class="rf" style="color:var(--ink2)"><ul style="margin:0;padding-left:18px"><li>Agree the major power levels for the qualitative criteria (2, 5, 10 to 15, 17 to 20).</li><li>Fix the compute measure for criterion 6 (B2): installed capacity or new chip arrivals.</li><li>Decide whether criterion 8 (B4) adds public AI investment, so that state funding is counted.</li><li>Confirm the 16-point line and the per-dimension condition after scoring the full test set.</li></ul></div></div>`;
  document.querySelectorAll("#fw .switch").forEach(cb=>cb.onchange=()=>{ S.off[cb.dataset.c] = !cb.checked; save(); refresh(); });
}

/* ---------- FINDINGS ---------- */
document.getElementById("fd").innerHTML = FINDINGS.map(f=>`<div class="card"><div class="tg">${f.tag}</div><h3>${f.title}</h3><p>${f.body}</p></div>`).join("");
document.getElementById("defn").textContent = DEFINITION;

/* ---------- SETTINGS ---------- */
function slider(host, label, val, min, max, step, on){
  const w = document.createElement("div"); w.className="sl";
  w.innerHTML = `<span>${label}</span><output>${val}</output><input type="range" min="${min}" max="${max}" step="${step}" value="${val}">`;
  const inp = w.querySelector("input"), out = w.querySelector("output");
  inp.oninput = () => { out.textContent = inp.value; on(+inp.value); };
  host.appendChild(w);
}
function renderSettings(){
  const thr = document.getElementById("thr"), wts = document.getElementById("wts"); thr.innerHTML=""; wts.innerHTML="";
  slider(thr,"Strong middle power",S.thr.strong,20,100,1,v=>{S.thr.strong=Math.max(v,S.thr.weak+1);save();refresh(false);});
  slider(thr,"Weak middle power (floor)",S.thr.weak,0,90,1,v=>{S.thr.weak=Math.min(v,S.thr.strong-1);save();refresh(false);});
  DIMENSIONS.forEach(d=>slider(wts,`${d.id}. ${d.name}`,S.w[d.id],0,3,0.5,v=>{S.w[d.id]=v;save();refresh(false);}));
}
document.getElementById("openSettings").onclick=()=>document.getElementById("settings").classList.add("on");
document.getElementById("closeSettings").onclick=()=>document.getElementById("settings").classList.remove("on");
document.getElementById("reset").onclick=()=>{ S=JSON.parse(JSON.stringify(DEFAULTS)); save(); renderSettings(); refresh(); };

/* ---------- ROUTING ---------- */
function route(){
  const v = (location.hash||"#map").slice(1);
  const ok = ["map","explore","candidates","framework","findings"].includes(v) ? v : "map";
  document.querySelectorAll(".view").forEach(s=>s.classList.toggle("on", s.id==="v-"+ok));
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on", a.dataset.v===ok));
}
window.addEventListener("hashchange", route);

function refresh(redrawFw=true){ compute(); renderMap(); renderCard(); renderTable(); renderCandidates(); if (redrawFw) renderFramework(); }
renderSettings(); refresh(); route();
