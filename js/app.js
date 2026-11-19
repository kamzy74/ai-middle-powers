const TIERS = [
  { id:3, name:"Major power", short:"Major", color:"var(--t3)", hex:"#0d366b", rule: t => `Overall ≥ ${t.major}` },
  { id:2, name:"Strong middle power", short:"Strong", color:"var(--t2)", hex:"#1c5cab", rule: t => `${t.strong}–${t.major-1}` },
  { id:1, name:"Weak middle power", short:"Weak", color:"var(--t1)", hex:"#3987e5", rule: t => `${t.weak}–${t.strong-1}` },
  { id:0, name:"Below threshold", short:"Below", color:"var(--t0)", hex:"#86b6ef", rule: t => `Under ${t.weak}` }
];
const DEFAULTS = { thr:{major:85, strong:55, weak:30}, w:{A:1,B:1,C:1,D:1,E:1},
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
    c.tier = c.overall>=S.thr.major?3 : c.overall>=S.thr.strong?2 : c.overall>=S.thr.weak?1 : 0;
  });
}
const tierOf = id => TIERS.find(t=>t.id===id);
const byName = Object.fromEntries(COUNTRIES.map(c=>[c.name,c]));

/* ---------- MAP ---------- */
const svg = d3.select("#map");
const proj = d3.geoNaturalEarth1().fitExtent([[5,5],[955,495]], {type:"Sphere"});
const path = d3.geoPath(proj);
const feats = topojson.feature(WORLD, WORLD.objects.countries).features.filter(f=>f.properties.name!=="Antarctica");
svg.append("path").attr("d", path({type:"Sphere"})).attr("fill","#fbfaf7");
const gC = svg.append("g");
const countryPaths = gC.selectAll("path").data(feats).join("path")
  .attr("class", f => "c" + (byName[f.properties.name] ? " scored":""))
  .attr("d", path);
const markers = svg.append("g").selectAll("circle").data(COUNTRIES.filter(c=>c.marker)).join("circle")
  .attr("class","mk").attr("r",6).attr("cx",c=>proj(c.marker)[0]).attr("cy",c=>proj(c.marker)[1]);

const seq = d3.scaleQuantize().domain([0,100]).range(["#cde2fb","#86b6ef","#3987e5","#1c5cab","#0d366b"]);
const colorBy = document.getElementById("colorBy");
colorBy.innerHTML = `<option value="tier">Overall tier</option>` + DIMENSIONS.map(d=>`<option value="${d.id}">${d.id}. ${d.name}</option>`).join("");
colorBy.onchange = renderMap;

function fillFor(c){
  if (!c) return "var(--none)";
  return colorBy.value==="tier" ? tierOf(c.tier).hex : seq(c.dim[colorBy.value]);
}
function renderMap(){
  countryPaths.attr("fill", f => fillFor(byName[f.properties.name]))
    .classed("sel", f => selected && f.properties.name===selected);
  markers.attr("fill", fillFor).classed("sel", c => c.name===selected);
  const lg = document.getElementById("legend");
  if (colorBy.value==="tier"){
    lg.innerHTML = TIERS.map(t=>`<span><i style="background:${t.hex}"></i>${t.name}</span>`).join("") + `<span><i style="background:#e6e3dc"></i>Not yet scored</span>`;
  } else {
    const d = DIMENSIONS.find(x=>x.id===colorBy.value);
    lg.innerHTML = `<span style="color:var(--ink)">${d.name} score</span>` + seq.range().map((col,i)=>`<span><i style="background:${col}"></i>${i*20}–${i===4?100:i*20+19}</span>`).join("") + `<span><i style="background:#e6e3dc"></i>Not yet scored</span>`;
  }
}
const tip = document.getElementById("tip");
function showTip(e, c, fallback){
  tip.innerHTML = c ? `<b>${c.label}</b><br>${tierOf(c.tier).name} · overall ${c.overall}` + (colorBy.value!=="tier" ? `<br>${DIMENSIONS.find(d=>d.id===colorBy.value).short}: ${c.dim[colorBy.value]}`:"") : `${fallback}<br><span style="opacity:.7">Not in test set</span>`;
  tip.style.left = (e.clientX+14)+"px"; tip.style.top = (e.clientY+12)+"px"; tip.style.opacity = 1;
}
countryPaths.on("mousemove",(e,f)=>showTip(e, byName[f.properties.name], f.properties.name)).on("mouseleave",()=>tip.style.opacity=0)
  .on("click",(e,f)=>{ if (byName[f.properties.name]) select(f.properties.name); });
markers.on("mousemove",(e,c)=>showTip(e,c)).on("mouseleave",()=>tip.style.opacity=0).on("click",(e,c)=>select(c.name));

/* ---------- COUNTRY CARD ---------- */
function select(name){
  selected = name; renderMap(); renderCard();
  if (location.hash!=="#map" && location.hash!=="") location.hash="map";
}
function dots(v){ return "<b>"+"●".repeat(v)+"</b><s>"+"●".repeat(3-v)+"</s>"; }
function renderCard(){
  const el = document.getElementById("cc");
  const c = byName[selected];
  if (!c){ el.innerHTML = `<div class="empty">Select a country on the map</div>`; return; }
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
      </div>`).join("") + `</div><p class="hint" style="margin:10px 0 0">Click a dimension to see its criteria. Scores are draft (0–3).</p>`;
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
    (!dq || (c.dim[dq] >= S.thr.strong && c.tier!==3)));
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
  const head = ["country","group","region",...crit.map(c=>c.id),...DIMENSIONS.map(d=>"dim_"+d.id),"overall","tier"];
  const lines = [head.join(",")].concat(COUNTRIES.map(c=>[`"${c.label}"`,`"${c.group}"`,`"${c.region}"`,...crit.map(x=>c.s[x.d][x.i]),...DIMENSIONS.map(d=>c.dim[d.id]),c.overall,`"${tierOf(c.tier).name}"`].join(",")));
  try { await navigator.clipboard.writeText(lines.join("\n")); toast("Copied CSV for all " + COUNTRIES.length + " countries"); }
  catch(e){ toast("Copy was blocked by the browser"); }
};
function toast(m){ const t=document.getElementById("toast"); t.textContent=m; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,1800); }

/* ---------- CANDIDATES ---------- */
function renderCandidates(){
  document.getElementById("cols").innerHTML = TIERS.map(t => {
    const list = COUNTRIES.filter(c=>c.tier===t.id).sort((a,b)=>b.overall-a.overall);
    return `<div class="card col"><h3><i style="background:${t.hex}"></i>${t.name}</h3><div class="rule">${t.rule(S.thr)} · ${list.length} countries</div>
      <ul>${list.map(c=>`<li data-n="${c.name}">${c.label}<span>${c.overall}</span></li>`).join("") || '<li style="cursor:default;color:var(--muted)">None</li>'}</ul></div>`;
  }).join("");
  document.querySelectorAll("#cols li[data-n]").forEach(li=>li.onclick=()=>{ location.hash="map"; select(li.dataset.n); });
}

/* ---------- FRAMEWORK ---------- */
function renderFramework(){
  const n = DIMENSIONS.flatMap(d=>d.criteria).filter(c=>!S.off[c.id]).length;
  document.getElementById("fw").innerHTML = DIMENSIONS.map(d=>`<div class="card"><h3>${d.id}. ${d.name}</h3>${d.criteria.map(c=>`
    <div class="cr"><span class="id">${c.id}</span><div class="tx">${c.name}${c.proposed?'<span class="badge">proposed</span>':''}<div class="rf">Source: ${c.ref}</div>${c.note?`<div class="rf" style="color:var(--warn-ink)">${c.note}</div>`:""}</div>
    <input type="checkbox" class="switch" data-c="${c.id}" ${S.off[c.id]?"":"checked"} title="Include in scoring"></div>`).join("")}</div>`).join("")
    + `<div class="card" style="padding:16px"><h3>Scoring scale (draft)</h3><div class="rf" style="color:var(--ink2)">0 = minimal · 1 = limited · 2 = significant · 3 = leading or globally significant.<br><br>Dimension score = mean of its included criteria, rescaled to 0–100. Overall = weighted mean of dimension scores.<br><br><b>${n}</b> criteria currently in scoring.</div></div>`;
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
  slider(thr,"Major power (ceiling)",S.thr.major,50,100,1,v=>{S.thr.major=Math.max(v,S.thr.strong+1);save();refresh(false);});
  slider(thr,"Strong middle power",S.thr.strong,20,95,1,v=>{S.thr.strong=Math.min(Math.max(v,S.thr.weak+1),S.thr.major-1);save();refresh(false);});
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
