/* Lektion 5 — Grundlagen der Wahrscheinlichkeitsrechnung (BSTA01-02, IU-Skript) */
(function(){
  "use strict";

  // ----------------------------------------------------------------------------
  // Lokale Helfer (in IIFE gekapselt, kollidieren nie mit anderen Lektionen)
  // ----------------------------------------------------------------------------

  // Mengen-Helfer für den Würfel/Venn-Kram
  function setUnion(a,b){ const s=new Set(a); b.forEach(x=>s.add(x)); return Array.from(s).sort((p,q)=>p-q); }
  function setInter(a,b){ const sb=new Set(b); return a.filter(x=>sb.has(x)).sort((p,q)=>p-q); }
  function setDiff(a,b){ const sb=new Set(b); return a.filter(x=>!sb.has(x)).sort((p,q)=>p-q); }
  function setComp(a,omega){ const sa=new Set(a); return omega.filter(x=>!sa.has(x)); }
  function fmtSet(arr){ return arr.length ? "{"+arr.join(", ")+"}" : "∅"; }

  // ----------------------------------------------------------------------------
  // Widget 1 — Würfel-Simulator (Gesetz der großen Zahlen)
  // ----------------------------------------------------------------------------
  function widgetWuerfel(elm, ctx){
    const { el, fmt, makeChart, PAL } = ctx;

    // Ereignis-Definitionen (Menge der "Treffer"-Augenzahlen) + theoretische Wkt
    const EVENTS = {
      gerade: { label:"Gerade Zahl {2,4,6}", set:[2,4,6] },
      sechs:  { label:"Augenzahl = 6", set:[6] },
      A:      { label:"A = {1,2,4}", set:[1,2,4] },
      B:      { label:"B = {3,4,5}", set:[3,4,5] },
      C:      { label:"C = {5,6}",   set:[5,6] },
      hoch:   { label:"Mind. 4 {4,5,6}", set:[4,5,6] }
    };
    let curKey = "gerade";

    // laufender Zustand der Simulation
    let trials = 0, hits = 0;
    // Datenpunkte fürs Chart: wir sampeln logarithmisch, damit auch 10000 Würfe
    // performant bleiben (sonst 10000 Punkte im Chart).
    let labels = [];
    let dataRel = [];

    const chipRow = el("div",{class:"chips"});
    const chipEls = {};
    Object.keys(EVENTS).forEach(k=>{
      const c = el("button",{class:"chip"+(k===curKey?" active":""),text:EVENTS[k].label,
        onclick:()=>{ curKey=k; Object.keys(chipEls).forEach(j=>chipEls[j].classList.toggle("active", j===k)); reset(); }});
      chipEls[k]=c; chipRow.appendChild(c);
    });

    const btnRow = el("div",{class:"btn-row"});
    function rollBtn(n,label){
      return el("button",{class:"btn",text:label,onclick:()=>run(n)});
    }
    btnRow.appendChild(rollBtn(10,"+10"));
    btnRow.appendChild(rollBtn(100,"+100"));
    btnRow.appendChild(rollBtn(1000,"+1 000"));
    btnRow.appendChild(rollBtn(10000,"+10 000"));
    const resetBtn = el("button",{class:"btn ghost",text:"Reset",onclick:()=>reset()});
    btnRow.appendChild(resetBtn);

    const readout = el("div",{class:"readout"});

    const wrap = el("div",{class:"canvas-wrap",style:{height:"320px"}});
    const cv = el("canvas");
    wrap.appendChild(cv);

    elm.appendChild(chipRow);
    elm.appendChild(btnRow);
    elm.appendChild(readout);
    elm.appendChild(wrap);

    const theo = ()=> EVENTS[curKey].set.length/6;

    let chart = makeChart(cv, {
      type:"line",
      data:{ labels:[], datasets:[
        { label:"relative Häufigkeit hₙ", data:[], borderColor:PAL.teal, backgroundColor:"rgba(45,178,170,.12)",
          borderWidth:2, pointRadius:0, tension:0.15, fill:false },
        { label:"theoretischer Wert p", data:[], borderColor:PAL.gold, borderDash:[6,5],
          borderWidth:2, pointRadius:0, fill:false }
      ]},
      options:{
        responsive:true, maintainAspectRatio:false, animation:false,
        scales:{
          x:{ title:{display:true,text:"Anzahl Würfe n"} },
          y:{ min:0, max:1, title:{display:true,text:"relative Häufigkeit"} }
        },
        plugins:{ legend:{ labels:{ usePointStyle:true } } }
      }
    });

    function pushPoint(){
      labels.push(trials);
      dataRel.push(hits/trials);
    }

    function run(n){
      const set = new Set(EVENTS[curKey].set);
      // Wir würfeln n Mal, sampeln aber nicht jeden Wurf in die Kurve.
      // Schrittweite: so dass insgesamt ~120 Punkte sichtbar sind.
      const targetPts = 120;
      const totalAfter = trials + n;
      const step = Math.max(1, Math.round(totalAfter/targetPts));
      for(let i=0;i<n;i++){
        const w = 1 + Math.floor(Math.random()*6);
        trials++;
        if(set.has(w)) hits++;
        if(trials % step === 0) pushPoint();
      }
      pushPoint(); // letzten Stand immer mitnehmen
      redraw();
    }

    function reset(){
      trials=0; hits=0; labels=[]; dataRel=[];
      redraw();
    }

    function redraw(){
      const p = theo();
      // Theorie-Linie auf gleiche Länge wie Datenpunkte bringen
      const theoArr = labels.map(()=>p);
      chart.data.labels = labels.slice();
      chart.data.datasets[0].data = dataRel.slice();
      chart.data.datasets[1].data = theoArr;
      chart.update();

      const rel = trials ? hits/trials : 0;
      const diff = trials ? Math.abs(rel-p) : 0;
      readout.innerHTML="";
      readout.appendChild(el("div",{class:"stat teal"},
        el("div",{class:"v"}, trials ? fmt.n(rel,3) : "–"),
        el("div",{class:"l"},"rel. Häufigkeit hₙ")));
      readout.appendChild(el("div",{class:"stat gold"},
        el("div",{class:"v"}, fmt.n(p,3)),
        el("div",{class:"l"},"theoretisch p")));
      readout.appendChild(el("div",{class:"stat"},
        el("div",{class:"v"}, hits+" / "+trials),
        el("div",{class:"l"},"Treffer / Würfe")));
      readout.appendChild(el("div",{class:"stat "+(diff<0.02?"good":"violet")},
        el("div",{class:"v"}, trials ? fmt.n(diff,3) : "–"),
        el("div",{class:"l"},"|hₙ − p|")));
    }

    reset();
  }

  // ----------------------------------------------------------------------------
  // Widget 2 — Venn-Diagramm-Rechner (zwei Ereignisse)
  // ----------------------------------------------------------------------------
  function widgetVenn(elm, ctx){
    const { el, fmt, Plot, onCleanup, clamp, PAL } = ctx;

    let mode = "mengen"; // "mengen" | "wkt"
    const omega = [1,2,3,4,5,6];
    let A = [1,2,4];
    let B = [3,4,5];

    // Wahrscheinlichkeits-Modus
    let pA = 0.8, pB = 0.7, pAB = 0.5;

    // --- Modus-Umschalter ---
    const modeRow = el("div",{class:"chips"});
    const chipMengen = el("button",{class:"chip active",text:"Mengen-Modus (Würfel)",onclick:()=>setMode("mengen")});
    const chipWkt    = el("button",{class:"chip",text:"Wahrscheinlichkeits-Modus (Klausur)",onclick:()=>setMode("wkt")});
    modeRow.appendChild(chipMengen); modeRow.appendChild(chipWkt);

    // --- Mengen-Modus: Würfel-Chips ---
    const setBox = el("div");
    const rowA = el("div",{class:"ctrl-row"});
    const rowB = el("div",{class:"ctrl-row"});
    rowA.appendChild(el("span",{class:"ctrl",style:{minWidth:"auto"},html:"<b style='color:"+PAL.gold+"'>Ereignis A:</b>"}));
    rowB.appendChild(el("span",{class:"ctrl",style:{minWidth:"auto"},html:"<b style='color:"+PAL.teal+"'>Ereignis B:</b>"}));
    const aChips={}, bChips={};
    omega.forEach(n=>{
      const ca = el("button",{class:"chip"+(A.includes(n)?" active":""),text:String(n),
        onclick:()=>{ toggle(A,n); aChips[n].classList.toggle("active"); A.sort((p,q)=>p-q); draw(); }});
      const cb = el("button",{class:"chip"+(B.includes(n)?" active":""),text:String(n),
        onclick:()=>{ toggle(B,n); bChips[n].classList.toggle("active"); B.sort((p,q)=>p-q); draw(); }});
      aChips[n]=ca; bChips[n]=cb; rowA.appendChild(ca); rowB.appendChild(cb);
    });
    setBox.appendChild(rowA); setBox.appendChild(rowB);
    function toggle(arr,n){ const i=arr.indexOf(n); if(i<0) arr.push(n); else arr.splice(i,1); }

    // --- Wkt-Modus: Slider ---
    const wktBox = el("div");
    wktBox.style.display="none";
    function slider(labelTxt, getVal, setVal, color){
      const ctrl = el("div",{class:"ctrl"});
      const lab = el("label",{html:labelTxt});
      const val = el("span",{class:"val"});
      lab.appendChild(val);
      const inp = el("input",{type:"range",min:"0",max:"1",step:"0.01",value:String(getVal())});
      inp.addEventListener("input",()=>{ setVal(parseFloat(inp.value)); syncWkt(); draw(); });
      ctrl.appendChild(lab); ctrl.appendChild(inp);
      ctrl._inp=inp; ctrl._val=val;
      if(color) val.style.color=color;
      return ctrl;
    }
    const sA  = slider("P(A) Statistik", ()=>pA,  v=>pA=v,  PAL.gold);
    const sB  = slider("P(B) Mathe",     ()=>pB,  v=>pB=v,  PAL.teal);
    const sAB = slider("P(A∩B) beide",   ()=>pAB, v=>pAB=v, PAL.violet);
    const wktRow = el("div",{class:"ctrl-row"});
    wktRow.appendChild(sA); wktRow.appendChild(sB); wktRow.appendChild(sAB);
    const disjBtn = el("button",{class:"btn ghost",text:"Disjunkt setzen (A∩B = 0)",
      onclick:()=>{ pAB=0; syncWkt(); draw(); }});
    const wktBtnRow = el("div",{class:"btn-row"});
    wktBtnRow.appendChild(disjBtn);
    wktBox.appendChild(wktRow); wktBox.appendChild(wktBtnRow);

    function syncWkt(){
      // Plausibilität: P(A∩B) <= min(P(A),P(B)) und >= P(A)+P(B)-1
      const lo = Math.max(0, pA+pB-1);
      const hi = Math.min(pA,pB);
      pAB = clamp(pAB, lo, hi);
      sA._inp.value=pA; sB._inp.value=pB; sAB._inp.value=pAB;
      sA._val.textContent=fmt.n(pA,2); sB._val.textContent=fmt.n(pB,2); sAB._val.textContent=fmt.n(pAB,2);
      sAB._inp.min=String(lo.toFixed(2)); sAB._inp.max=String(hi.toFixed(2));
    }

    const readout = el("div",{class:"readout"});
    const setReadout = el("div",{class:"readout"});

    const wrap = el("div",{class:"canvas-wrap",style:{height:"300px"}});
    const P = Plot(wrap,{xmin:0,xmax:10,ymin:0,ymax:6,padL:6,padR:6,padT:6,padB:6,height:300});
    onCleanup(()=>P.destroy());

    elm.appendChild(modeRow);
    elm.appendChild(setBox);
    elm.appendChild(wktBox);
    elm.appendChild(wrap);
    elm.appendChild(readout);
    elm.appendChild(setReadout);

    function setMode(m){
      mode=m;
      chipMengen.classList.toggle("active", m==="mengen");
      chipWkt.classList.toggle("active", m==="wkt");
      setBox.style.display = m==="mengen" ? "" : "none";
      wktBox.style.display = m==="wkt" ? "" : "none";
      if(m==="wkt") syncWkt();
      draw();
    }

    // Werte (P) je Modus berechnen
    function values(){
      if(mode==="mengen"){
        const inter = setInter(A,B), uni = setUnion(A,B);
        const aOnly = setDiff(A,B), bOnly = setDiff(B,A);
        const n = omega.length;
        return {
          pA:A.length/n, pB:B.length/n, pAB:inter.length/n,
          pUni:uni.length/n, pAonly:aOnly.length/n, pBonly:bOnly.length/n,
          pNotA:1-A.length/n, pNotUni:1-uni.length/n,
          inter, uni, aOnly, bOnly,
          notUni: setComp(uni,omega), disjoint: inter.length===0
        };
      } else {
        const pUni = pA+pB-pAB;
        return {
          pA, pB, pAB,
          pUni, pAonly:pA-pAB, pBonly:pB-pAB,
          pNotA:1-pA, pNotUni:1-pUni,
          disjoint: Math.abs(pAB)<1e-9
        };
      }
    }

    function draw(){
      const v = values();
      const ctx2 = P.ctx;
      P.clear();
      // Omega-Rahmen
      const x0=P.X(0.3), y0=P.Y(5.7), x1=P.X(9.7), y1=P.Y(0.3);
      ctx2.save();
      ctx2.strokeStyle = "rgba(255,255,255,.45)";
      ctx2.lineWidth=1.5;
      ctx2.strokeRect(x0,y0,x1-x0,y1-y0);
      ctx2.fillStyle="rgba(255,255,255,.55)";
      ctx2.font="13px system-ui";
      ctx2.textBaseline="top"; ctx2.textAlign="left";
      ctx2.fillText("Ω", x0+6, y0+4);

      // Kreis-Geometrie: bei Disjunkt auseinander, sonst überlappend.
      // Radius an Breite UND Höhe koppeln (Canvas-Höhe ist fix 300px, Breite variiert),
      // damit die Kreise immer in den Ω-Kasten passen.
      const cy = P.Y(3);
      const rMaxH = (P.Y(0.3)-P.Y(5.7))/2.4; // Kastenhöhe in px, mit Rand-Reserve
      let r = Math.min(P.X(2)-P.X(0), rMaxH);
      let cxA, cxB;
      if(v.disjoint){
        cxA=P.X(2.6); cxB=P.X(7.4);
        r = Math.min(r, (cxB-cxA)/2 - 6); // sichtbar getrennt: kein Überlappen mehr
      } else {
        // Zentren an r koppeln (Abstand 1,1·r) → Überlappung auf jeder Bildbreite garantiert
        const mid = (P.X(0.3)+P.X(9.7))/2;
        cxA = mid - r*0.55; cxB = mid + r*0.55;
      }

      function disc(cx,cy,r,fill){
        ctx2.beginPath(); ctx2.arc(cx,cy,r,0,Math.PI*2);
        ctx2.fillStyle=fill; ctx2.fill();
      }
      // additive Mischung über Transparenz
      disc(cxA,cy,r,"rgba(231,181,76,.40)");   // A gold
      disc(cxB,cy,r,"rgba(45,178,170,.40)");   // B teal
      // Konturen
      ctx2.lineWidth=2;
      ctx2.strokeStyle=PAL.gold; ctx2.beginPath(); ctx2.arc(cxA,cy,r,0,Math.PI*2); ctx2.stroke();
      ctx2.strokeStyle=PAL.teal; ctx2.beginPath(); ctx2.arc(cxB,cy,r,0,Math.PI*2); ctx2.stroke();

      // Beschriftungen A / B
      ctx2.fillStyle=PAL.gold; ctx2.font="bold 16px system-ui"; ctx2.textAlign="center";
      ctx2.fillText("A", cxA - (v.disjoint?0:r*0.55), cy - r*0.65);
      ctx2.fillStyle=PAL.teal;
      ctx2.fillText("B", cxB + (v.disjoint?0:r*0.55), cy - r*0.65);

      if(mode==="mengen"){
        // Zahlen an die richtigen Stellen
        ctx2.font="14px system-ui"; ctx2.fillStyle="#fff"; ctx2.textBaseline="middle";
        // A only links, B only rechts, Schnitt mitte, Rest aussen unten
        placeNums(v.aOnly, v.disjoint?cxA:cxA - r*0.45, cy);
        placeNums(v.bOnly, v.disjoint?cxB:cxB + r*0.45, cy);
        if(!v.disjoint) placeNums(v.inter, (cxA+cxB)/2, cy);
        placeNums(v.notUni, P.X(5), P.Y(0.8));
        function placeNums(arr,px,py){
          if(!arr.length) return;
          ctx2.fillStyle="#fff";
          ctx2.fillText(arr.join("  "), px, py);
        }
      }
      ctx2.restore();

      // Statboxen
      readout.innerHTML="";
      function box(cls,val,lab){ readout.appendChild(el("div",{class:"stat "+cls},
        el("div",{class:"v"},val), el("div",{class:"l"},lab))); }
      box("gold", fmt.n(v.pA,3),    "P(A)");
      box("teal", fmt.n(v.pB,3),    "P(B)");
      box("violet", fmt.n(v.pAB,3), "P(A∩B)");
      box("good", fmt.n(v.pUni,3),  "P(A∪B)");
      box("",   fmt.n(v.pAonly,3),  "P(A\\B) nur A");
      box("",   fmt.n(v.pBonly,3),  "P(B\\A) nur B");
      box("",   fmt.n(v.pNotA,3),   "P(Ā)");
      box("",   fmt.n(v.pNotUni,3), "P(A∪B Komplement)");

      // Mengen ausschreiben (nur Mengen-Modus)
      setReadout.innerHTML="";
      if(mode==="mengen"){
        const line = el("div",{class:"widget-hint"});
        line.innerHTML =
          "A = "+fmtSet(A)+" &nbsp;·&nbsp; B = "+fmtSet(B)+" &nbsp;·&nbsp; "+
          "A∩B = "+fmtSet(v.inter)+" &nbsp;·&nbsp; A∪B = "+fmtSet(v.uni)+
          (v.disjoint ? " &nbsp;→ <b>disjunkt!</b> Additionssatz vereinfacht sich zu P(A)+P(B)." : "");
        setReadout.appendChild(line);
      } else {
        const line = el("div",{class:"widget-hint"});
        line.innerHTML = "Additionssatz: P(A∪B) = "+fmt.n(v.pA,2)+" + "+fmt.n(v.pB,2)+" − "+fmt.n(v.pAB,2)+" = <b>"+fmt.n(v.pUni,3)+"</b>"+
          (v.disjoint ? " &nbsp;→ <b>disjunkt</b>: nichts abzuziehen." : "");
        setReadout.appendChild(line);
      }
    }

    P.onResize = draw;
    setMode("mengen");
  }

  // ----------------------------------------------------------------------------
  // Widget 3 — Baumdiagramm / Bayes (Erweiterung)
  // ----------------------------------------------------------------------------
  function widgetBayes(elm, ctx){
    const { el, fmt, Plot, onCleanup, clamp } = ctx;

    // Default: medizinischer Test
    const presets = {
      test:    { label:"Medizinischer Test", pK:0.01, pPosK:0.99, pPosNK:0.05,
                 names:{K:"krank", nK:"gesund", pos:"Test +", neg:"Test −"} },
      // Klausur-Preset konsistent zu den Skript-Daten der Lektion (P(Stat)=0,8; P(Mathe)=0,7; P(beide)=0,5):
      // P(Mathe)=0,7 · P(Stat|Mathe)=0,5/0,7≈0,714 · P(Stat|Mathe̅)=0,3/0,3=1
      // → totale Wkt P(Stat)=0,8 und Bayes P(Mathe|Stat)=0,5/0,8=0,625
      klausur: { label:"Klausuren (Statistik|Mathe)", pK:0.7, pPosK:0.5/0.7, pPosNK:1,
                 names:{K:"Mathe best.", nK:"Mathe nicht", pos:"Stat. best.", neg:"Stat. nicht"} }
    };
    let cur = "test";
    let pK = presets.test.pK;      // P(erste Stufe = "K")
    let pPosK = presets.test.pPosK;  // P(+|K)
    let pPosNK = presets.test.pPosNK; // P(+|nicht K)
    let names = Object.assign({}, presets.test.names);

    const presetRow = el("div",{class:"chips"});
    const pc = {};
    Object.keys(presets).forEach(k=>{
      pc[k]=el("button",{class:"chip"+(k===cur?" active":""),text:presets[k].label,
        onclick:()=>{ cur=k; Object.keys(pc).forEach(j=>pc[j].classList.toggle("active",j===k));
          pK=presets[k].pK; pPosK=presets[k].pPosK; pPosNK=presets[k].pPosNK;
          names=Object.assign({},presets[k].names); sync(); draw(); }});
      presetRow.appendChild(pc[k]);
    });

    function slider(labelTxt, getVal, setVal){
      const ctrl = el("div",{class:"ctrl"});
      const lab = el("label",{html:labelTxt});
      const val = el("span",{class:"val"});
      lab.appendChild(val);
      const inp = el("input",{type:"range",min:"0",max:"1",step:"0.01",value:String(getVal())});
      inp.addEventListener("input",()=>{ setVal(parseFloat(inp.value)); sync(); draw(); });
      ctrl.appendChild(lab); ctrl.appendChild(inp);
      ctrl._inp=inp; ctrl._val=val;
      return ctrl;
    }
    const s1 = slider("P(K) – Prävalenz / 1. Stufe", ()=>pK,    v=>pK=v);
    const s2 = slider("P(+ | K) – Sensitivität",     ()=>pPosK, v=>pPosK=v);
    const s3 = slider("P(+ | K̄) – Falsch-Positiv",   ()=>pPosNK,v=>pPosNK=v);
    const sliderRow = el("div",{class:"ctrl-row"});
    sliderRow.appendChild(s1); sliderRow.appendChild(s2); sliderRow.appendChild(s3);

    const wrap = el("div",{class:"canvas-wrap",style:{height:"300px"}});
    const P = Plot(wrap,{xmin:0,xmax:10,ymin:0,ymax:6,padL:4,padR:4,padT:4,padB:4,height:300});
    onCleanup(()=>P.destroy());

    const readout = el("div",{class:"readout"});
    const steps = el("div",{class:"steps"});

    elm.appendChild(presetRow);
    elm.appendChild(sliderRow);
    elm.appendChild(wrap);
    elm.appendChild(readout);
    elm.appendChild(steps);

    function sync(){
      pK=clamp(pK,0,1); pPosK=clamp(pPosK,0,1); pPosNK=clamp(pPosNK,0,1);
      s1._inp.value=pK; s2._inp.value=pPosK; s3._inp.value=pPosNK;
      s1._val.textContent=fmt.n(pK,3); s2._val.textContent=fmt.n(pPosK,3); s3._val.textContent=fmt.n(pPosNK,3);
    }

    function calc(){
      const pNK = 1-pK;
      const pNegK = 1-pPosK, pNegNK = 1-pPosNK;
      const pKpos  = pK*pPosK;    // P(K ∩ +)
      const pKneg  = pK*pNegK;    // P(K ∩ −)
      const pNKpos = pNK*pPosNK;  // P(K̄ ∩ +)
      const pNKneg = pNK*pNegNK;  // P(K̄ ∩ −)
      const pPos = pKpos + pNKpos;
      const pNeg = pKneg + pNKneg;
      const bayesPos = pPos>0 ? pKpos/pPos : 0;  // P(K|+)
      const bayesNeg = pNeg>0 ? pKneg/pNeg : 0;  // P(K|−)
      return {pNK,pNegK,pNegNK,pKpos,pKneg,pNKpos,pNKneg,pPos,pNeg,bayesPos,bayesNeg};
    }

    function draw(){
      const c = calc();
      const ctx2 = P.ctx;
      P.clear();
      ctx2.save();
      ctx2.lineWidth=2; ctx2.font="13px system-ui";

      // Knotenpositionen (Datenkoordinaten 0..10 / 0..6)
      const root = {x:P.X(0.6), y:P.Y(3)};
      const n1   = {x:P.X(4.4), y:P.Y(4.5)}; // K
      const n2   = {x:P.X(4.4), y:P.Y(1.5)}; // K̄
      const leaf = [
        {x:P.X(9.2), y:P.Y(5.2), txt:names.pos, p:c.pKpos,  col:ctx.PAL.bad},   // K∩+
        {x:P.X(9.2), y:P.Y(3.8), txt:names.neg, p:c.pKneg,  col:ctx.PAL.teal},  // K∩−
        {x:P.X(9.2), y:P.Y(2.2), txt:names.pos, p:c.pNKpos, col:ctx.PAL.gold},  // K̄∩+
        {x:P.X(9.2), y:P.Y(0.8), txt:names.neg, p:c.pNKneg, col:ctx.PAL.good}   // K̄∩−
      ];

      function edge(a,b,label){
        ctx2.strokeStyle="rgba(255,255,255,.45)";
        ctx2.beginPath(); ctx2.moveTo(a.x,a.y); ctx2.lineTo(b.x,b.y); ctx2.stroke();
        ctx2.fillStyle="rgba(255,255,255,.85)";
        ctx2.textAlign="center"; ctx2.textBaseline="bottom";
        ctx2.fillText(label,(a.x+b.x)/2,(a.y+b.y)/2-2);
      }
      // 1. Stufe
      edge(root,n1,fmt.n(pK,2));
      edge(root,n2,fmt.n(c.pNK,2));
      // 2. Stufe
      edge(n1,leaf[0],fmt.n(pPosK,2));
      edge(n1,leaf[1],fmt.n(c.pNegK,2));
      edge(n2,leaf[2],fmt.n(pPosNK,2));
      edge(n2,leaf[3],fmt.n(c.pNegNK,2));

      function node(p,label,col){
        ctx2.fillStyle=col||"rgba(255,255,255,.12)";
        ctx2.beginPath(); ctx2.arc(p.x,p.y,5,0,Math.PI*2); ctx2.fill();
        ctx2.fillStyle="#fff"; ctx2.textAlign="left"; ctx2.textBaseline="middle";
        if(label) ctx2.fillText(label,p.x+8,p.y);
      }
      node(root,"",ctx.PAL.violet);
      node(n1,names.K,ctx.PAL.bad);
      node(n2,names.nK,ctx.PAL.good);
      leaf.forEach(L=>{
        ctx2.fillStyle=L.col;
        ctx2.beginPath(); ctx2.arc(L.x,L.y,5,0,Math.PI*2); ctx2.fill();
        ctx2.fillStyle="#fff"; ctx2.textAlign="right"; ctx2.textBaseline="middle";
        ctx2.fillText(L.txt+" : "+fmt.n(L.p,4), L.x-9, L.y);
      });
      ctx2.restore();

      // Statboxen
      readout.innerHTML="";
      function box(cls,val,lab){ readout.appendChild(el("div",{class:"stat "+cls},
        el("div",{class:"v"},val), el("div",{class:"l"},lab))); }
      box("gold", fmt.n(c.pPos,4),       "P(+) total");
      box("violet", fmt.pct(c.bayesPos), "P(K|+) Bayes");
      box("good", fmt.pct(c.bayesNeg),   "P(K|−)");
      const sum = c.pKpos+c.pKneg+c.pNKpos+c.pNKneg;
      box(Math.abs(sum-1)<1e-9?"good":"violet", fmt.n(sum,3), "Σ Pfade (Probe)");

      // Schritte
      steps.innerHTML="";
      function step(k,html){ steps.appendChild(el("div",{class:"step"},
        el("div",{class:"sk"},k), el("div",{html}))); }
      step("1","Pfadwkt (Multiplikationssatz): P(K∩+) = P(K)·P(+|K) = "+
        fmt.n(pK,3)+"·"+fmt.n(pPosK,3)+" = <b>"+fmt.n(c.pKpos,4)+"</b>");
      step("2","Totale Wahrscheinlichkeit: P(+) = P(K)P(+|K) + P(K̄)P(+|K̄) = "+
        fmt.n(c.pKpos,4)+" + "+fmt.n(c.pNKpos,4)+" = <b>"+fmt.n(c.pPos,4)+"</b>");
      step("3","Satz von Bayes: P(K|+) = P(K∩+) / P(+) = "+
        fmt.n(c.pKpos,4)+" / "+fmt.n(c.pPos,4)+" = <b>"+fmt.pct(c.bayesPos)+"</b>");
    }

    P.onResize = draw;
    sync(); draw();
  }

  // ----------------------------------------------------------------------------
  // Widget 4 (Bonus) — Diskrete Zufallsvariable: E(X), Var(X), σ
  // ----------------------------------------------------------------------------
  function widgetZV(elm, ctx){
    const { el, fmt, makeChart, PAL } = ctx;

    // Münzwurf-Default: x={0,1,2}, f={0.25,0.5,0.25}
    let rows = [ {x:0,f:0.25}, {x:1,f:0.5}, {x:2,f:0.25} ];

    const table = el("div",{class:"tbl-wrap"});
    const readout = el("div",{class:"readout"});
    const note = el("div",{class:"widget-hint"});
    const wrap = el("div",{class:"canvas-wrap",style:{height:"240px"}});
    const cv = el("canvas"); wrap.appendChild(cv);

    const btnRow = el("div",{class:"btn-row"});
    btnRow.appendChild(el("button",{class:"btn",text:"Zeile +",onclick:()=>{ rows.push({x:rows.length,f:0}); render(); }}));
    btnRow.appendChild(el("button",{class:"btn ghost",text:"Zeile −",onclick:()=>{ if(rows.length>1){rows.pop(); render();} }}));
    btnRow.appendChild(el("button",{class:"btn ghost",text:"Münzwurf laden",
      onclick:()=>{ rows=[{x:0,f:0.25},{x:1,f:0.5},{x:2,f:0.25}]; render(); }}));

    elm.appendChild(btnRow);
    elm.appendChild(table);
    elm.appendChild(readout);
    elm.appendChild(note);
    elm.appendChild(wrap);

    let chart = makeChart(cv,{
      type:"bar",
      data:{labels:[],datasets:[{label:"fₓ(x)",data:[],backgroundColor:PAL.teal}]},
      options:{responsive:true,maintainAspectRatio:false,animation:false,
        scales:{y:{min:0,max:1,title:{display:true,text:"fₓ(x)"}},x:{title:{display:true,text:"x"}}},
        plugins:{legend:{display:false}}}
    });

    function calc(){
      const sumF = rows.reduce((s,r)=>s+r.f,0);
      const EX = rows.reduce((s,r)=>s+r.x*r.f,0);
      const EX2 = rows.reduce((s,r)=>s+r.x*r.x*r.f,0);
      const varX = EX2 - EX*EX;
      const sd = Math.sqrt(Math.max(0,varX));
      return {sumF,EX,EX2,varX,sd};
    }

    function render(){
      // Tabelle bauen
      const tbl = el("table",{class:"data"});
      const thead = el("tr");
      ["x","fₓ(x)","x·fₓ(x)","x²·fₓ(x)"].forEach(h=>thead.appendChild(el("th",{text:h})));
      tbl.appendChild(thead);
      rows.forEach((r,i)=>{
        const tr = el("tr");
        const tdx = el("td");
        const ix = el("input",{type:"number",step:"1",value:String(r.x),style:{width:"64px"}});
        ix.addEventListener("input",()=>{ r.x=parseFloat(ix.value)||0; recompute(); });
        tdx.appendChild(ix);
        const tdf = el("td");
        const ifv = el("input",{type:"number",step:"0.05",min:"0",max:"1",value:String(r.f),style:{width:"72px"}});
        ifv.addEventListener("input",()=>{ r.f=parseFloat(ifv.value)||0; recompute(); });
        tdf.appendChild(ifv);
        tr.appendChild(tdx); tr.appendChild(tdf);
        tr.appendChild(el("td",{text:fmt.n(r.x*r.f,3)}));
        tr.appendChild(el("td",{text:fmt.n(r.x*r.x*r.f,3)}));
        tbl.appendChild(tr);
      });
      table.innerHTML=""; table.appendChild(tbl);
      recompute();
    }

    function recompute(){
      const c = calc();
      // Tabellenspalten 3/4 aktualisieren (einfach neu rendern wäre teuer bei Tippen → direkt update)
      const trs = table.querySelectorAll("tr");
      rows.forEach((r,i)=>{
        const tr = trs[i+1];
        if(tr){ const tds=tr.querySelectorAll("td");
          if(tds[2]) tds[2].textContent=fmt.n(r.x*r.f,3);
          if(tds[3]) tds[3].textContent=fmt.n(r.x*r.x*r.f,3);
        }
      });
      readout.innerHTML="";
      function box(cls,val,lab){ readout.appendChild(el("div",{class:"stat "+cls},
        el("div",{class:"v"},val), el("div",{class:"l"},lab))); }
      box(Math.abs(c.sumF-1)<1e-9?"good":"violet", fmt.n(c.sumF,3), "Σ fₓ(x) (=1?)");
      box("gold", fmt.n(c.EX,3),  "E(X) = μ");
      box("teal", fmt.n(c.EX2,3), "E(X²)");
      box("violet", fmt.n(c.varX,3), "Var(X) = σ²");
      box("blue", fmt.n(c.sd,3),  "σ = √Var");

      note.innerHTML = "Verschiebungssatz: Var(X) = E(X²) − [E(X)]² = "+
        fmt.n(c.EX2,3)+" − "+fmt.n(c.EX,3)+"² = <b>"+fmt.n(c.varX,3)+"</b> &nbsp;·&nbsp; σ = "+fmt.n(c.sd,3)+
        (Math.abs(c.sumF-1)>1e-6 ? " &nbsp;⚠️ Summe der Wahrscheinlichkeiten ist nicht 1!" : "");

      chart.data.labels = rows.map(r=>String(r.x));
      chart.data.datasets[0].data = rows.map(r=>r.f);
      chart.update();
    }

    render();
  }

  // ----------------------------------------------------------------------------
  // Lektion registrieren
  // ----------------------------------------------------------------------------
  App.registerLesson({
    id: 5,
    title: "Wahrscheinlichkeitsrechnung",

    formulas: [
      // 5.1 Mengen-Ebene
      { group:"Lektion 5 · Mengen & Ereignisse", name:"Ergebnismenge (Würfel)", tex:"\\Omega=\\{1,2,3,4,5,6\\}", note:"alle möglichen Ergebnisse" },
      { group:"Lektion 5 · Mengen & Ereignisse", name:"Komplement", tex:"\\bar{A}=\\Omega\\setminus A", note:"alles außer A" },
      { group:"Lektion 5 · Mengen & Ereignisse", name:"Vereinigung", tex:"A\\cup B", note:"mindestens eines (oder)" },
      { group:"Lektion 5 · Mengen & Ereignisse", name:"Durchschnitt", tex:"A\\cap B", note:"beide gleichzeitig (und)" },
      { group:"Lektion 5 · Mengen & Ereignisse", name:"Differenz", tex:"A\\setminus B", note:"A, aber nicht B (ohne)" },
      { group:"Lektion 5 · Mengen & Ereignisse", name:"Disjunkt", tex:"A\\cap B=\\emptyset", note:"keine Gemeinsamkeit" },
      // 5.2 Wahrscheinlichkeiten
      { group:"Lektion 5 · Wahrscheinlichkeit", name:"Laplace-Wahrscheinlichkeit", tex:"P(A)=\\dfrac{|A|}{|\\Omega|}", note:"günstige / mögliche Ergebnisse" },
      { group:"Lektion 5 · Wahrscheinlichkeit", name:"Axiome", tex:"P(A)\\ge 0,\\quad P(\\Omega)=1,\\quad 0\\le P(A)\\le 1", note:"Grundregeln" },
      { group:"Lektion 5 · Wahrscheinlichkeit", name:"Komplementärregel", tex:"P(\\bar A)=1-P(A)", note:"Gegenwahrscheinlichkeit" },
      { group:"Lektion 5 · Wahrscheinlichkeit", name:"Additionssatz (allgemein)", tex:"P(A\\cup B)=P(A)+P(B)-P(A\\cap B)", note:"Schnitt einmal abziehen" },
      { group:"Lektion 5 · Wahrscheinlichkeit", name:"Additionssatz (disjunkt)", tex:"P(A\\cup B)=P(A)+P(B)", note:"nur wenn A∩B=∅" },
      { group:"Lektion 5 · Wahrscheinlichkeit", name:"Differenzregel", tex:"P(A\\setminus B)=P(A)-P(A\\cap B)", note:"A allein" },
      { group:"Lektion 5 · Wahrscheinlichkeit", name:"Multiplikationssatz (Unabhängigkeit)", tex:"P(A\\cap B)=P(A)\\cdot P(B)", note:"nur für unabhängige A,B" },
      // 5.2-E Erweiterung
      { group:"Lektion 5 · Bedingt & Bayes (Erweiterung)", name:"Bedingte Wahrscheinlichkeit", tex:"P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}", note:"über das Skript hinaus" },
      { group:"Lektion 5 · Bedingt & Bayes (Erweiterung)", name:"Allg. Multiplikationssatz", tex:"P(A\\cap B)=P(B)\\cdot P(A\\mid B)", note:"auch für abhängige Ereignisse" },
      { group:"Lektion 5 · Bedingt & Bayes (Erweiterung)", name:"Totale Wahrscheinlichkeit", tex:"P(B)=P(B\\mid A)P(A)+P(B\\mid \\bar A)P(\\bar A)", note:"Aufteilung über A, Ā" },
      { group:"Lektion 5 · Bedingt & Bayes (Erweiterung)", name:"Satz von Bayes", tex:"P(A\\mid B)=\\dfrac{P(B\\mid A)P(A)}{P(B\\mid A)P(A)+P(B\\mid \\bar A)P(\\bar A)}", note:"Umkehrung der Bedingung" },
      // 5.3 Zufallsvariablen
      { group:"Lektion 5 · Zufallsvariablen", name:"Zufallsvariable", tex:"X:\\Omega\\to\\mathbb{R}", note:"ordnet jedem Ergebnis eine Zahl zu" },
      { group:"Lektion 5 · Zufallsvariablen", name:"Wahrscheinlichkeitsfunktion", tex:"f_X(x)=P(X=x)", note:"für alle x im Träger T_X" },
      { group:"Lektion 5 · Zufallsvariablen", name:"Bedingungen", tex:"f_X(x)\\ge 0,\\quad \\sum_{x\\in T_X} f_X(x)=1", note:"keine negativen, Summe 1" },
      { group:"Lektion 5 · Zufallsvariablen", name:"Erwartungswert", tex:"\\mu=E(X)=\\sum_{x\\in T_X} x\\cdot f_X(x)", note:"Langzeit-Durchschnitt" },
      { group:"Lektion 5 · Zufallsvariablen", name:"E(X²)", tex:"E(X^2)=\\sum_{x\\in T_X} x^2\\cdot f_X(x)", note:"für die Varianz" },
      { group:"Lektion 5 · Zufallsvariablen", name:"Varianz (Verschiebungssatz)", tex:"\\sigma^2=Var(X)=E(X^2)-[E(X)]^2", note:"kein n bzw. n-1!" },
      { group:"Lektion 5 · Zufallsvariablen", name:"Standardabweichung", tex:"\\sigma=\\sqrt{\\sigma^2}", note:"erwartete Abweichung" },
      { group:"Lektion 5 · Zufallsvariablen", name:"Wahrscheinlichkeit = Fläche (Gleichvert.)", tex:"P(a\\le X\\le b)=\\text{Höhe}\\cdot\\text{Breite}", note:"stetige Gleichverteilung" }
    ],

    sections: [

      // ======================================================================
      // 5.1
      // ======================================================================
      {
        num:"5.1",
        title:"Zufallsexperimente und Ereignisse",
        intro:"Bevor man rechnet, muss man <b>sauber benennen</b>, was überhaupt passieren kann — und wofür man sich interessiert.",
        blocks:[
          {t:"p", lead:true, html:"Geh in die Mensa. Schmeckt das Essen? Wie lange stehst du an? Wie viele Leute sind vor dir? Du weißt es vorher nicht — der Ausgang hängt vom <b>Zufall</b> ab. Genau solche Vorgänge sind das Spielfeld der Wahrscheinlichkeitsrechnung."},

          {t:"def", term:"Zufallsexperiment / Zufallsvorgang", html:"Ein Vorgang, dessen Ausgang vom Zufall abhängt — man kann ihn im Voraus nicht sicher vorhersagen (z. B. ein Würfelwurf, eine Klausur, eine Wartezeit)."},
          {t:"def", term:"Ergebnismenge \\(\\Omega\\)", title:"Ergebnisraum", html:"Die Menge <b>aller</b> möglichen Ergebnisse eines Zufallsexperiments. Beim sechsseitigen Würfel: \\(\\Omega=\\{1,2,3,4,5,6\\}\\)."},
          {t:"def", term:"Ereignis", html:"Eine <b>Teilmenge</b> von \\(\\Omega\\) — genau das, wofür man sich interessiert. Ereignisse schreibt man mit Großbuchstaben \\(A, B, C, \\dots\\)"},

          {t:"formula", tex:"\\Omega=\\{1,2,3,4,5,6\\}", caption:"Ergebnismenge eines fairen Würfels"},

          {t:"sub", text:"Spezialereignisse"},
          {t:"list", items:[
            "<b>Sicheres Ereignis:</b> tritt immer ein — das ist genau \\(\\Omega\\) selbst.",
            "<b>Unmögliches Ereignis:</b> kann nie eintreten (eine 7 mit dem 6-Würfel) — die leere Menge \\(\\emptyset\\).",
            "<b>Elementarereignis:</b> ein einzelnes Ergebnis aus \\(\\Omega\\), z. B. \\(\\{3\\}\\).",
            "<b>Komplementär-/Gegenereignis \\(\\bar A\\):</b> genau das Gegenteil von \\(A\\) — alles in \\(\\Omega\\), das nicht in \\(A\\) liegt."
          ]},

          {t:"quote", html:"Sehr viele Vorgänge im alltäglichen Leben sind zufällig. Man weiß also im Voraus nicht, wie ein bestimmter Vorgang ausgehen wird.", source:"BSTA01-02, S. 118"},

          {t:"h", text:"Mengenoperationen — die vier Bausteine", icon:"🧩"},
          {t:"p", html:"Aus Ereignissen baut man mit Mengenoperationen neue Ereignisse. Es sind genau vier — und jede entspricht einem Alltagswort:"},

          {t:"def", term:"Komplement \\(\\bar A\\)", html:"Alle Ergebnisse, die <b>nicht</b> in \\(A\\) liegen: \\(\\bar A=\\Omega\\setminus A\\). Sprachlich: „<b>nicht</b> A“."},
          {t:"def", term:"Vereinigung \\(A\\cup B\\)", html:"Alle Ergebnisse, die in <b>mindestens einem</b> der beiden Ereignisse stecken. Sprachlich: „A <b>oder</b> B“ (mindestens eines tritt ein)."},
          {t:"def", term:"Durchschnitt \\(A\\cap B\\)", html:"Die <b>Gemeinsamkeit</b>: alle Ergebnisse, die in <b>beiden</b> Ereignissen liegen. Sprachlich: „A <b>und</b> B“ (beide treten gleichzeitig ein)."},
          {t:"def", term:"Differenz \\(A\\setminus B\\)", html:"\\(A\\), aber <b>ohne</b> die Gemeinsamkeit mit \\(B\\) — das <b>alleinige</b> Eintreten von \\(A\\). Sprachlich: „A <b>ohne</b> B“."},
          {t:"def", term:"Disjunkt / unvereinbar", html:"Zwei Ereignisse sind disjunkt, wenn sie <b>keine</b> Gemeinsamkeit haben: \\(A\\cap B=\\emptyset\\). Sie können nie gleichzeitig eintreten."},

          {t:"formula", tex:"\\bar{A}=\\Omega\\setminus A \\qquad A\\cup B \\qquad A\\cap B \\qquad A\\setminus B \\qquad A\\cap B=\\emptyset", caption:"Die Operationen auf einen Blick"},

          {t:"aha", title:"Vier Wörter, die alles entscheiden", html:"Mengenoperationen sind nichts anderes als die <b>logischen Bausteine der Alltagssprache</b>:<br><b>„oder“</b> (mindestens eins) → \\(\\cup\\) · <b>„und“</b> (beides) → \\(\\cap\\) · <b>„nicht“</b> → \\(\\bar A\\) · <b>„ohne“</b> → \\(\\setminus\\).<br>Wer diese vier Wörter übersetzen kann, kann jede Wahrscheinlichkeitsaufgabe formal hinschreiben — der Rest ist nur noch einsetzen."},

          {t:"h", text:"Das Venn-Diagramm", icon:"⭕"},
          {t:"def", term:"Venn-Diagramm", html:"Eine Veranschaulichung von Ereignisoperationen: ein <b>rechteckiger Kasten</b> ist \\(\\Omega\\), <b>Kreise</b> sind die Ereignisse. Überlappende Kreise zeigen den Durchschnitt."},
          {t:"quote", html:"Ein Venn-Diagramm besteht grundsätzlich aus einem rechteckigen Kasten. Dieser Kasten enthält alle Elemente der Ergebnismenge.", source:"BSTA01-02, S. 121"},

          {t:"h", text:"Leitbeispiel: Würfelspiel mit A, B, C", icon:"🎲"},
          {t:"p", html:"Ein Würfel wird einmal geworfen, \\(\\Omega=\\{1,2,3,4,5,6\\}\\). Drei Spieler:innen gewinnen bei jeweils eigenen Zahlen:<br>\\(A=\\{1,2,4\\}\\) · \\(B=\\{3,4,5\\}\\) · \\(C=\\{5,6\\}\\)."},

          {t:"example", title:"Komplemente (Niederlage)", html:
            "\\(\\bar A=\\{3,5,6\\}\\) — A verliert bei diesen Zahlen.<br>"+
            "\\(\\bar B=\\{1,2,6\\}\\)<br>"+
            "\\(\\bar C=\\{1,2,3,4\\}\\)"},
          {t:"example", title:"Vereinigungen (mind. eine:r gewinnt)", html:
            "\\(A\\cup B=\\{1,2,3,4,5\\}\\) — bei fünf von sechs Zahlen gewinnt mindestens eine:r.<br>"+
            "\\(A\\cup C=\\{1,2,4,5,6\\}\\)<br>"+
            "\\(B\\cup C=\\{3,4,5,6\\}\\)"},
          {t:"example", title:"Durchschnitte (beide gleichzeitig)", html:
            "\\(A\\cap B=\\{4\\}\\) — nur die 4 lässt A und B gemeinsam gewinnen.<br>"+
            "\\(B\\cap C=\\{5\\}\\)<br>"+
            "\\(A\\cap C=\\emptyset\\) — <b>disjunkt!</b> A und C haben keine gemeinsame Zahl."},
          {t:"example", title:"Differenzen (allein gewinnen)", html:
            "\\(A\\setminus B=\\{1,2\\}\\), \\(B\\setminus A=\\{3,5\\}\\)<br>"+
            "\\(A\\setminus C=\\{1,2,4\\}\\) (A gewinnt immer allein, da disjunkt zu C), \\(C\\setminus A=\\{5,6\\}\\)<br>"+
            "\\(B\\setminus C=\\{3,4\\}\\), \\(C\\setminus B=\\{6\\}\\)"},

          {t:"quote", html:"Solche Ereignisse, welche keine Gemeinsamkeit und damit keine Schnittmenge haben, werden als disjunkte bzw. unvereinbare Ereignisse bezeichnet.", source:"BSTA01-02, S. 129"},

          {t:"h", text:"Zweites Leitbeispiel: Klausurergebnis", icon:"📝"},
          {t:"p", html:"Zufallsexperiment „Ergebnis der Klausur“: \\(\\Omega=\\{\\text{Statistik bestehen},\\ \\text{nicht bestehen}\\}\\), Ereignis \\(A=\\{\\text{bestehen}\\}\\), \\(\\bar A=\\{\\text{nicht bestehen}\\}\\). Bei zwei Klausuren (Statistik \\(=A\\), Mathe \\(=B\\)) ist \\(A\\cap B\\) = beide bestanden, \\(A\\cup B\\) = mindestens eine bestanden, \\(A\\setminus B\\) = nur Statistik."},

          {t:"why", html:"Bevor man <i>irgendeine</i> Wahrscheinlichkeit ausrechnet, muss man wissen, <b>welches Ereignis</b> gemeint ist. „Mindestens einer“, „beide“, „genau einer“, „keiner“ sind völlig verschiedene Mengen — und damit verschiedene Wahrscheinlichkeiten. Die Mengensprache verhindert teure Denkfehler (und falsche Klausurantworten)."},

          {t:"widget", title:"Venn-Diagramm-Rechner", icon:"⭕",
            hint:"Mengen-Modus: klicke die Würfelzahlen für A (Gold) und B (Teal) an. Wkt-Modus: P(A), P(B), P(A∩B) per Slider. „Disjunkt setzen“ trennt die Kreise.",
            render:widgetVenn}
        ]
      },

      // ======================================================================
      // 5.2
      // ======================================================================
      {
        num:"5.2",
        title:"Wahrscheinlichkeit von Ereignissen",
        intro:"Jetzt kommen die <b>Zahlen</b>: Wie wahrscheinlich ist ein Ereignis — und wie kombiniert man Wahrscheinlichkeiten korrekt?",
        blocks:[
          {t:"p", lead:true, html:"Eine Wahrscheinlichkeit beschreibt die <b>Chance</b>, dass ein Ereignis eintritt. Solange \\(\\Omega\\) bekannt und endlich ist und alle Ergebnisse gleich möglich sind (Laplace), ist die Rechnung herrlich simpel: <b>günstige durch mögliche</b> Ergebnisse."},

          {t:"def", term:"Wahrscheinlichkeit", html:"Mit einer Wahrscheinlichkeit wird die Chance für das Eintreten eines Ereignisses beschrieben. Beim fairen Würfel hat jede Seite die gleiche Wahrscheinlichkeit \\(1/6\\)."},
          {t:"def", term:"Mächtigkeit \\(|A|\\)", html:"Die Anzahl der Ergebnisse in einem Ereignis (oder in \\(\\Omega\\)). \\(|\\{1,2,4\\}|=3\\), \\(|\\Omega|=6\\)."},

          {t:"formula", tex:"P(A)=\\frac{\\text{Anzahl der Ergebnisse in } A}{\\text{Anzahl der Ergebnisse in } \\Omega}=\\frac{|A|}{|\\Omega|}", caption:"Laplace-Wahrscheinlichkeit: günstige durch mögliche"},

          {t:"quote", html:"Beim Würfel hat demnach jede Seite die gleiche Wahrscheinlichkeit in Höhe von 1/6, dass sie gewürfelt wird.", source:"BSTA01-02, S. 132"},

          {t:"sub", text:"Die Axiome (Spielregeln jeder Wahrscheinlichkeit)"},
          {t:"formula", tex:"P(A)\\ge 0 \\qquad P(\\Omega)=1 \\qquad 0\\le P(A)\\le 1", caption:"Nichtnegativität · Normierung · Wertebereich"},
          {t:"quote", html:"Negative Wahrscheinlichkeiten kann es demzufolge nicht geben.", source:"BSTA01-02, S. 133"},

          {t:"h", text:"Die vier Rechenregeln", icon:"🧮"},
          {t:"formula", tex:"P(\\bar A)=1-P(A)", caption:"Komplementärregel — Gegenwahrscheinlichkeit"},
          {t:"formula", tex:"P(A\\cup B)=P(A)+P(B)-P(A\\cap B)", caption:"Additionssatz (allgemein)"},
          {t:"formula", tex:"P(A\\cup B)=P(A)+P(B)\\quad\\text{falls } A\\cap B=\\emptyset", caption:"Additionssatz für disjunkte Ereignisse"},
          {t:"formula", tex:"P(A\\setminus B)=P(A)-P(A\\cap B)", caption:"Differenzregel — A allein"},

          {t:"aha", title:"Warum „minus P(A∩B)“?", html:"Im Additionssatz wird der Schnitt abgezogen, damit man die <b>gemeinsamen Ergebnisse nicht doppelt zählt</b> — bei \\(A\\cup B\\) steckt die 4 einmal in \\(P(A)\\) und einmal in \\(P(B)\\). Bild: zwei überlappende Pizzastücke — das Überlappungsstück darf man nur <b>einmal</b> essen. Bei disjunkten Ereignissen ist \\(P(A\\cap B)=0\\), also fällt der Abzug weg."},

          {t:"quote", html:"Da dies für zwei nicht disjunkte Ereignisse immer der Fall ist, muss stets die Wahrscheinlichkeit für die Schnittmenge … einmal abgezogen werden.", source:"BSTA01-02, S. 136 (Additionssatz)"},

          {t:"h", text:"Leitbeispiel: Würfelspiel — die Wahrscheinlichkeiten", icon:"🎲"},
          {t:"example", title:"Einzelwahrscheinlichkeiten (|Ω|=6)", html:
            "\\(P(A)=\\dfrac{3}{6}=0{,}5\\) · \\(P(B)=\\dfrac{3}{6}=0{,}5\\) · \\(P(C)=\\dfrac{2}{6}=0{,}33\\)"},
          {t:"example", title:"Niederlagen (Komplement)", html:
            "\\(P(\\bar A)=1-0{,}5=0{,}5\\) · \\(P(\\bar B)=1-0{,}5=0{,}5\\) · \\(P(\\bar C)=1-0{,}33=0{,}67\\)"},
          {t:"example", title:"Additionssatz (Vereinigung)", html:
            "\\(P(A\\cup B)=\\dfrac{3}{6}+\\dfrac{3}{6}-\\dfrac{1}{6}=\\dfrac{5}{6}=0{,}83\\) (Schnitt \\(\\{4\\}\\))<br>"+
            "\\(P(B\\cup C)=\\dfrac{3}{6}+\\dfrac{2}{6}-\\dfrac{1}{6}=\\dfrac{4}{6}\\) (Schnitt \\(\\{5\\}\\))<br>"+
            "\\(P(A\\cup C)=\\dfrac{3}{6}+\\dfrac{2}{6}-\\dfrac{0}{6}=\\dfrac{5}{6}\\) (disjunkt → nichts abziehen)"},
          {t:"example", title:"Differenzregel (alleiniger Sieg)", html:
            "\\(P(A\\setminus B)=\\dfrac{3}{6}-\\dfrac{1}{6}=\\dfrac{2}{6}\\) · \\(P(B\\setminus C)=\\dfrac{3}{6}-\\dfrac{1}{6}=\\dfrac{2}{6}\\)<br>"+
            "\\(P(A\\setminus C)=\\dfrac{3}{6}-0=\\dfrac{3}{6}\\) (A gewinnt immer allein, disjunkt zu C) · \\(P(C\\setminus B)=\\dfrac{2}{6}-\\dfrac{1}{6}=\\dfrac{1}{6}\\)"},

          {t:"h", text:"Leitbeispiel: Klausuren", icon:"📝"},
          {t:"p", html:"Aus vergangenen Terminen: \\(P(A)=0{,}8\\) (Statistik), \\(P(B)=0{,}7\\) (Mathe), \\(P(A\\cap B)=0{,}5\\) (beide). Achtung: \\(P(A\\cap B)\\) ist hier <b>gegeben</b>, nicht aus Unabhängigkeit berechnet."},
          {t:"example", title:"Durchrechnung", html:
            "\\(P(\\bar A)=1-0{,}8=0{,}2\\) · \\(P(\\bar B)=1-0{,}7=0{,}3\\)<br>"+
            "\\(P(A\\cup B)=0{,}8+0{,}7-0{,}5=1{,}0\\) — mit 100 % wird mindestens eine Klausur bestanden.<br>"+
            "\\(P(A\\setminus B)=0{,}8-0{,}5=0{,}3\\) (nur Statistik) · \\(P(B\\setminus A)=0{,}7-0{,}5=0{,}2\\) (nur Mathe)"},

          {t:"h", text:"Unabhängigkeit & Multiplikationssatz", icon:"✖️"},
          {t:"def", term:"Unabhängige Ereignisse", html:"Wenn das Eintreten des einen Ereignisses <b>keinen Einfluss</b> auf das Eintreten des anderen hat, sind die Ereignisse unabhängig — z. B. zwei getrennte Würfelwürfe."},
          {t:"formula", tex:"P(A\\cap B)=P(A)\\cdot P(B)\\qquad\\text{(nur bei Unabhängigkeit!)}", caption:"Multiplikationssatz"},
          {t:"example", title:"Würfel zweimal werfen", html:
            "\\(A=\\{1\\}\\) (erster Wurf 1), \\(B=\\{4\\}\\) (zweiter Wurf 4). Die Würfe beeinflussen sich nicht → unabhängig:<br>"+
            "\\(P(A\\cap B)=\\dfrac{1}{6}\\cdot\\dfrac{1}{6}=\\dfrac{1}{36}\\)"},
          {t:"quote", html:"Man würde in dem Fall die beiden Einzelwahrscheinlichkeiten einfach miteinander multiplizieren, um die Wahrscheinlichkeit für das gemeinsame Eintreten zu erhalten.", source:"BSTA01-02, S. 139 (Unabhängigkeit)"},

          {t:"warn", title:"Stolperfalle: multiplizieren darf man NICHT immer", tag:"Wichtig", html:"Bei den Klausuren wäre bei Unabhängigkeit \\(P(A\\cap B)=0{,}8\\cdot0{,}7=0{,}56\\). Gegeben ist aber \\(0{,}5\\) — also sind die Klausuren <b>nicht</b> unabhängig! Der Multiplikationssatz gilt laut Skript <b>ausschließlich</b> für unabhängige Ereignisse. Und Vorsicht: „disjunkt“ ist <b>nicht</b> dasselbe wie „unabhängig“ — disjunkte Ereignisse mit \\(P>0\\) sind sogar maximal abhängig."},

          {t:"aha", title:"Der Komplement-Trick", html:"„Mindestens eins“ ist oft nervig direkt auszurechnen — viel leichter ist häufig: <b>Gegenteil ausrechnen und von 1 abziehen</b>. Regenwahrscheinlichkeit 30 % ⇒ „kein Regen“ 70 %. Bei „mindestens ein Treffer in n Versuchen“ rechnet man fast immer \\(1-P(\\text{kein Treffer})\\)."},

          {t:"why", html:"Wahrscheinlichkeiten sind die Brücke von „was kann passieren“ (Mengen) zu „wie oft passiert es“ (Zahlen). Versicherungen, Medizintests, Qualitätskontrolle, Glücksspiel — alles steht und fällt mit \\(P(A)=|A|/|\\Omega|\\) und den vier Rechenregeln."},

          {t:"divider"},
          {t:"h", text:"Würfel-Simulator: das Gesetz der großen Zahlen", icon:"📈"},
          {t:"p", html:"Woher „weiß“ ein Würfel, dass die 6 mit Wahrscheinlichkeit \\(1/6\\) fällt? Gar nicht — aber je öfter man wirft, desto näher rückt die <b>relative Häufigkeit</b> an den theoretischen Wert. Probier’s aus: bei 10 Würfen zappelt die Kurve wild, bei 10 000 klebt sie an der gestrichelten Linie."},
          {t:"widget", title:"Würfel-Simulator (Gesetz der großen Zahlen)", icon:"🎲",
            hint:"Wähle ein Ereignis, dann würfle in Schritten. Die teal Linie ist die relative Häufigkeit hₙ, die goldene Gestrichelte der theoretische Wert p = |A|/6.",
            render:widgetWuerfel}
        ]
      },

      // ======================================================================
      // 5.2-E Erweiterung (eigener Abschnitt, klar gekennzeichnet)
      // ======================================================================
      {
        num:"5.2+",
        title:"Ein Schritt weiter: Bedingte Wahrscheinlichkeit & Bayes",
        intro:"<b>Über das Skript hinaus</b> — didaktische Vertiefung, damit das Baumdiagramm-Widget eine Grundlage hat. <i>Kein</i> Skript-Zitat, aber mathematisch sauber.",
        blocks:[
          {t:"warn", title:"Hinweis: über das Skript hinaus", tag:"Erweiterung", html:"Bedingte Wahrscheinlichkeit und der Satz von Bayes stehen <b>nicht</b> im Text der Lektion 5. Sie schließen aber nahtlos an den Multiplikationssatz an und gehören zum Standard-Werkzeug. Wir ergänzen sie hier als Vertiefung — fachlich korrekt, aber bewusst als „Bonus“ markiert."},

          {t:"p", lead:true, html:"Manchmal hat man eine <b>Zusatzinfo</b>: „Gegeben, dass B eingetreten ist — wie wahrscheinlich ist dann A?“ Das ist die <b>bedingte Wahrscheinlichkeit</b> \\(P(A\\mid B)\\). Man verkleinert gedanklich die Welt auf „B ist passiert“ und fragt, welcher Anteil davon auch in A liegt."},

          {t:"def", term:"Bedingte Wahrscheinlichkeit \\(P(A\\mid B)\\)", html:"Die Wahrscheinlichkeit von \\(A\\), <b>wenn</b> \\(B\\) bereits eingetreten ist — der Anteil des Schnitts an \\(B\\)."},
          {t:"formula", tex:"P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}", caption:"Bedingte Wahrscheinlichkeit (nur für \\(P(B)>0\\))"},
          {t:"formula", tex:"P(A\\cap B)=P(B)\\cdot P(A\\mid B)=P(A)\\cdot P(B\\mid A)", caption:"Allgemeiner Multiplikationssatz (auch für abhängige Ereignisse)"},
          {t:"formula", tex:"P(A\\mid B)=P(A)\\;\\Longleftrightarrow\\; P(A\\cap B)=P(A)\\cdot P(B)", caption:"Unabhängigkeit: die Bedingung ändert nichts"},

          {t:"example", title:"Anschluss an die Klausurdaten", html:
            "Aus \\(P(A)=0{,}8\\), \\(P(B)=0{,}7\\), \\(P(A\\cap B)=0{,}5\\):<br>"+
            "\\(P(A\\mid B)=\\dfrac{0{,}5}{0{,}7}=0{,}714\\) — Wahrscheinlichkeit, Statistik zu bestehen, <i>wenn</i> Mathe bestanden ist.<br>"+
            "Vergleich mit \\(P(A)=0{,}8\\): \\(0{,}714\\neq0{,}8\\) ⇒ <b>abhängig</b> (hier senkt Mathe-Bestehen die Statistik-Chance sogar leicht)."},

          {t:"h", text:"Satz von der totalen Wahrscheinlichkeit & Bayes", icon:"🌳"},
          {t:"p", html:"Will man \\(P(B)\\) aus den Ästen eines Baums zusammensetzen, zerlegt man nach \\(A\\) und \\(\\bar A\\). Und kehrt man die Bedingung um (von \\(P(B\\mid A)\\) zu \\(P(A\\mid B)\\)), landet man beim Satz von Bayes:"},
          {t:"formula", tex:"P(B)=P(B\\mid A)\\,P(A)+P(B\\mid \\bar A)\\,P(\\bar A)", caption:"Totale Wahrscheinlichkeit"},
          {t:"formula", tex:"P(A\\mid B)=\\frac{P(B\\mid A)\\,P(A)}{P(B\\mid A)\\,P(A)+P(B\\mid \\bar A)\\,P(\\bar A)}", caption:"Satz von Bayes"},

          {t:"example", title:"Der berühmte medizinische Test", html:
            "Prävalenz \\(P(K)=0{,}01\\) (1 % wirklich krank), Sensitivität \\(P(+\\mid K)=0{,}99\\), Falsch-Positiv-Rate \\(P(+\\mid \\bar K)=0{,}05\\).<br>"+
            "\\(P(+)=0{,}99\\cdot0{,}01+0{,}05\\cdot0{,}99=0{,}0099+0{,}0495=0{,}0594\\)<br>"+
            "\\(P(K\\mid +)=\\dfrac{0{,}99\\cdot0{,}01}{0{,}0594}=\\dfrac{0{,}0099}{0{,}0594}\\approx0{,}167\\approx16{,}7\\,\\%\\)"},

          {t:"aha", title:"Der Schock des positiven Tests", html:"Trotz eines 99 %-Tests ist man bei positivem Befund nur zu <b>~17 %</b> wirklich krank! Grund: Die Krankheit ist <b>selten</b> (1 %), und 5 % Falsch-Positive von den vielen Gesunden erzeugen mehr falsche als echte Alarme. Das ist der berüchtigte <b>Basisraten-Effekt</b> — selbst Ärzt:innen tappen regelmäßig hinein. Ziehe im Widget die Prävalenz hoch und beobachte, wie \\(P(K\\mid+)\\) explodiert."},

          {t:"why", html:"Bedingte Wahrscheinlichkeit ist das Werkzeug der <b>Diagnostik und des Lernens aus Evidenz</b>: medizinische Tests, Spam-Filter, Betrugserkennung, Gerichtsstatistik. Wer Bayes nicht kann, verwechselt \\(P(\\text{Test}+\\mid\\text{krank})\\) mit \\(P(\\text{krank}\\mid\\text{Test}+)\\) — und das ist einer der teuersten Denkfehler überhaupt."},

          {t:"widget", title:"Baumdiagramm & Satz von Bayes", icon:"🌳",
            hint:"Editiere die Wahrscheinlichkeiten per Slider; die Komplemente (1−p) aktualisieren sich automatisch. Die Pfadwahrscheinlichkeiten und die Bayes-Umkehr werden live durchgerechnet. (Erweiterung über das Skript hinaus.)",
            render:widgetBayes}
        ]
      },

      // ======================================================================
      // 5.3
      // ======================================================================
      {
        num:"5.3",
        title:"Zufallsvariablen und ihre Verteilungen",
        intro:"Wenn keine Stichprobe vorliegt, man aber trotzdem über eine zufällige Größe sprechen will: <b>Zufallsvariablen</b>, Erwartungswert und Varianz.",
        blocks:[
          {t:"p", lead:true, html:"Mengen und Wahrscheinlichkeiten sind schön — aber oft will man <b>rechnen</b>: Wie viel Gewinn erwarte ich? Wie lange warte ich im Schnitt? Dafür ordnet eine <b>Zufallsvariable</b> jedem Ergebnis eine Zahl zu."},

          {t:"def", term:"Zufallsvariable \\(X\\)", html:"Eine Abbildung, die jedem Ergebnis aus \\(\\Omega\\) eine <b>reelle Zahl</b> zuordnet: \\(X:\\Omega\\to\\mathbb{R}\\). Variablen, deren Ausgänge vom Zufall abhängen."},
          {t:"formula", tex:"X:\\Omega\\to\\mathbb{R}", caption:"Zufallsvariable als Abbildung"},
          {t:"def", term:"Diskret vs. stetig", html:"<b>Diskret:</b> abzählbar viele Ausprägungen (Anzahl Kopf: 0, 1, 2). <b>Stetig:</b> überabzählbar viele Werte in einem Intervall (Wartezeit: 3,52 min …)."},
          {t:"def", term:"Träger \\(T_X\\)", html:"Die Menge aller möglichen Ausprägungen \\(x\\) der Zufallsvariablen."},

          {t:"quote", html:"Solche Variablen, deren Ausgänge (Ausprägungen) vom Zufall abhängig sind, nennt man Zufallsvariablen.", source:"BSTA01-02, S. 140"},

          {t:"h", text:"Die Wahrscheinlichkeitsfunktion", icon:"📊"},
          {t:"def", term:"Wahrscheinlichkeitsfunktion \\(f_X(x)\\)", html:"Das Pendant zur relativen Häufigkeit: sie gibt jeder Ausprägung ihre Wahrscheinlichkeit. Zwei Bedingungen: (1) keine negativen Werte, (2) alle Werte summieren sich zu 1."},
          {t:"formula", tex:"f_X(x)=P(X=x)\\quad\\text{für alle } x\\in T_X", caption:"Wahrscheinlichkeitsfunktion (diskret)"},
          {t:"formula", tex:"f_X(x)\\ge 0\\qquad \\sum_{x\\in T_X} f_X(x)=1", caption:"Bedingungen einer Wahrscheinlichkeitsfunktion"},

          {t:"h", text:"Leitbeispiel: zweimaliger Münzwurf", icon:"🪙"},
          {t:"p", html:"Münze zweimal werfen: \\(\\Omega=\\{KK,KZ,ZK,ZZ\\}\\) (K = Kopf, Z = Zahl), jedes Ergebnis mit \\(P=0{,}25\\). Zufallsvariable \\(X\\) = „Anzahl Kopf“: \\(KK\\to2\\), \\(KZ\\to1\\), \\(ZK\\to1\\), \\(ZZ\\to0\\). Träger \\(T_X=\\{0,1,2\\}\\)."},
          {t:"example", title:"Wahrscheinlichkeitsfunktion herleiten", html:
            "\\(f_X(0)=P(ZZ)=0{,}25\\)<br>"+
            "\\(f_X(1)=P(KZ)+P(ZK)=0{,}25+0{,}25=0{,}5\\)<br>"+
            "\\(f_X(2)=P(KK)=0{,}25\\)"},
          {t:"formula", tex:"f_X(x)=\\begin{cases}0{,}25 & x=0\\\\ 0{,}5 & x=1\\\\ 0{,}25 & x=2\\\\ 0 & \\text{sonst}\\end{cases}", caption:"Wahrscheinlichkeitsfunktion des Münzwurfs"},

          {t:"table", caption:"Tabelle 31 — Wahrscheinlichkeitsfunktion (S. 143)",
            headers:["x","fₓ(x)"],
            rows:[["0","0,25"],["1","0,5"],["2","0,25"],["Summe","1"]],
            highlight:[3]},

          {t:"example", title:"Wahrscheinlichkeiten aus fₓ ablesen", html:
            "\\(P(X\\le1)=f_X(0)+f_X(1)=0{,}25+0{,}5=0{,}75\\) (höchstens einmal Kopf → 75 %)<br>"+
            "\\(P(X>1)=f_X(2)=0{,}25\\) (mehr als einmal Kopf → 25 %)<br>"+
            "\\(P(1\\le X\\le2)=f_X(1)+f_X(2)=0{,}5+0{,}25=0{,}75\\)"},

          {t:"h", text:"Erwartungswert, Varianz, Standardabweichung", icon:"🎯"},
          {t:"def", term:"Erwartungswert \\(E(X)=\\mu\\)", html:"Die erwartete Ausprägung — das Pendant zum Mittelwert, aber für eine Zufallsvariable. Jeder Wert wird mit seiner Wahrscheinlichkeit gewichtet."},
          {t:"formula", tex:"\\mu=E(X)=\\sum_{x\\in T_X} x\\cdot f_X(x)", caption:"Erwartungswert"},
          {t:"def", term:"Varianz \\(Var(X)=\\sigma^2\\)", html:"Die Streuung einer Zufallsvariablen — berechnet über den <b>Verschiebungssatz</b>. Wichtig: <b>kein</b> Divisor \\(n\\) oder \\(n-1\\); gewichtet wird über \\(f_X(x)\\)."},
          {t:"formula", tex:"E(X^2)=\\sum_{x\\in T_X} x^2\\cdot f_X(x)", caption:"Erwartungswert von X²"},
          {t:"formula", tex:"\\sigma^2=Var(X)=E(X^2)-[E(X)]^2", caption:"Varianz (Verschiebungssatz)"},
          {t:"formula", tex:"\\sigma=\\sqrt{\\sigma^2}", caption:"Standardabweichung"},

          {t:"warn", title:"Kein n, kein n−1!", tag:"Genauigkeit", html:"Anders als bei der Stichprobenvarianz aus der deskriptiven Statistik gibt es hier <b>keinen</b> Nenner \\(n\\) oder \\(n-1\\). Die Gewichtung erfolgt vollständig über die Wahrscheinlichkeiten \\(f_X(x)\\). Die Standardabweichung \\(0{,}707\\) entsteht aus \\(\\sqrt{0{,}5}\\) — nicht aus einer Stichprobenformel."},
          {t:"quote", html:"Während wir im Rahmen der deskriptiven Statistik von einer Stichprobenvarianz sprechen …, wird hier nur noch der Begriff ‚Varianz‘ genutzt.", source:"BSTA01-02, S. 146 (sinngemäß)"},

          {t:"example", title:"Maßzahlen des Münzwurfs", html:
            "\\(\\mu=E(X)=0\\cdot0{,}25+1\\cdot0{,}5+2\\cdot0{,}25=1\\)<br>"+
            "\\(E(X^2)=0^2\\cdot0{,}25+1^2\\cdot0{,}5+2^2\\cdot0{,}25=0+0{,}5+1=1{,}5\\)<br>"+
            "\\(\\sigma^2=Var(X)=1{,}5-1^2=0{,}5\\)<br>"+
            "\\(\\sigma=\\sqrt{0{,}5}=0{,}707\\)<br>"+
            "→ Ergebnis: erwartungsgemäß \\(1\\pm0{,}707\\) Mal Kopf."},

          {t:"aha", title:"Der Erwartungswert ist nicht der „typische“ Wert", html:"\\(E(X)=1\\) heißt <b>nicht</b>, dass „1 Mal Kopf“ sicher ist — das passiert nur in 50 % der Würfe. Der Erwartungswert ist der <b>Langzeit-Durchschnitt</b> über viele Wiederholungen, nicht der wahrscheinlichste Einzelausgang. (Bei „2,4 Kinder pro Familie“ hat auch niemand 2,4 Kinder.)"},
          {t:"aha", title:"Der Verschiebungssatz = die faule Varianz", html:"\\(Var=E(X^2)-[E(X)]^2\\) ist die bequeme Variante: erst das Mittel der Quadrate, dann das Quadrat des Mittels abziehen — keine einzelnen Abstände zum Erwartungswert nötig. Spart bei jeder Klausur Zeit und Vorzeichenfehler."},

          {t:"quote", html:"Wir sprechen hier von einem Erwartungswert und nicht von einem Mittelwert, da aufgrund der Ungewissheit … nur Ergebnisse ‚erwartet‘ werden können. Mittelwerte basieren hingegen auf konkreten Beobachtungen.", source:"BSTA01-02, S. 145"},

          {t:"widget", title:"Erwartungswert & Varianz-Rechner", icon:"🎯",
            hint:"Trage Ausprägungen x und Wahrscheinlichkeiten fₓ(x) ein (Summe sollte 1 sein). E(X), E(X²), Var(X) und σ werden über den Verschiebungssatz live berechnet. „Münzwurf laden“ reproduziert das Leitbeispiel.",
            render:widgetZV},

          {t:"divider"},
          {t:"h", text:"Stetige Zufallsvariablen: Wahrscheinlichkeit = Fläche", icon:"⏳"},
          {t:"p", html:"Bei stetigen Größen (Wartezeit, Gewicht, Zeit) gibt es unendlich viele mögliche Werte. Statt einer Wahrscheinlichkeitsfunktion gibt es eine <b>Dichtefunktion</b> — und Wahrscheinlichkeiten sind <b>Flächen</b> darunter."},
          {t:"def", term:"Dichtefunktion", html:"Enthält die Ausprägungen und die Dichten einer stetigen Zufallsvariablen. Die Dichte selbst hat keine direkte Bedeutung — relevant ist die Fläche darunter."},
          {t:"def", term:"Gleichverteilung / Rechteckverteilung", html:"Hat über den gesamten Ausprägungsbereich die <b>gleiche</b> Dichte — die Dichtefunktion ist ein Rechteck."},
          {t:"quote", html:"Wichtig zu erwähnen ist, dass diese Dichten keinerlei inhaltliche Interpretationen bieten. Die entscheidenden Werte befinden sich mit der Fläche unterhalb dieser Dichte.", source:"BSTA01-02, S. 148"},

          {t:"h", text:"Leitbeispiel: Wartezeit beim Bäcker", icon:"🥨"},
          {t:"p", html:"\\(X\\) = Wartezeit in der Schlange, jede Zeit zwischen 0 und 10 Minuten gleich wahrscheinlich ⇒ stetige Gleichverteilung mit konstanter Dichte."},
          {t:"formula", tex:"f_X(x)=\\begin{cases}0{,}1 & 0\\le x\\le 10\\\\ 0 & \\text{sonst}\\end{cases}", caption:"Dichte der Gleichverteilung auf [0;10]"},
          {t:"formula", tex:"P(a\\le X\\le b)=\\text{Höhe}\\cdot\\text{Breite}", caption:"Wahrscheinlichkeit als Rechteckfläche"},
          {t:"example", title:"Wahrscheinlichkeiten = Flächen", html:
            "Gesamtfläche (Probe): \\(0{,}1\\cdot10=1\\) (=100 %).<br>"+
            "\\(P(X\\le3)=0{,}1\\cdot3=0{,}3\\) (max. 3 min → 30 %)<br>"+
            "\\(P(4\\le X\\le6)=0{,}1\\cdot2=0{,}2\\) (zwischen 4 und 6 min → 20 %)<br>"+
            "\\(P(X\\ge6)=0{,}1\\cdot4=0{,}4\\) (mind. 6 min → 40 %)"},

          {t:"aha", title:"Warum P(X = 3,000…) ≈ 0 ist", html:"Bei stetigen Größen ist die Wahrscheinlichkeit für <b>genau einen</b> Punkt praktisch null — die Fläche eines Striches ist 0. Es zählen nur <b>Intervalle</b>. Wie beim Histogramm: die Höhe (Dichte) ist Mittel zum Zweck, die <b>Fläche</b> ist die Wahrscheinlichkeit."},
          {t:"why", html:"Mit Zufallsvariablen modelliert man Größen <b>ohne</b> Stichprobe: Würfelgewinn, Wartezeit, Schadenshöhe. Der Erwartungswert ist die <b>Kalkulationsgrundlage</b> (was erwarte ich im Schnitt), Varianz und Standardabweichung beschreiben das <b>Risiko</b> drumherum — die Basis jeder Versicherungs- und Investmentrechnung."}
        ]
      }
    ],

    quiz: [
      { q:"Würfel \\(\\Omega=\\{1,2,3,4,5,6\\}\\), \\(A=\\{1,2,4\\}\\). Wie groß ist \\(P(A)\\)?",
        options:["1/6","3/6 = 0,5","2/6","4/6"], correct:1,
        explain:"Laplace: günstige (3) durch mögliche (6) Ergebnisse: 3/6 = 0,5." },

      { q:"\\(A=\\{1,2,4\\}\\), \\(B=\\{3,4,5\\}\\). Was ist \\(P(A\\cup B)\\)?",
        options:["6/6","4/6","5/6","3/6"], correct:2,
        explain:"Additionssatz: 3/6 + 3/6 − 1/6 = 5/6. Die gemeinsame 4 (A∩B) darf nur einmal zählen." },

      { q:"Warum wird im Additionssatz \\(P(A\\cap B)\\) abgezogen?",
        options:["Damit das Ergebnis kleiner wird","Weil die gemeinsamen Ergebnisse sonst doppelt gezählt würden","Weil Wahrscheinlichkeiten immer < 1 sein müssen","Nur bei disjunkten Ereignissen"], correct:1,
        explain:"Der Schnitt steckt sowohl in P(A) als auch in P(B) — ohne Abzug zählt man ihn doppelt. Bei disjunkten Ereignissen ist P(A∩B)=0, dann entfällt der Abzug." },

      { q:"Wann gilt \\(P(A\\cap B)=P(A)\\cdot P(B)\\)?",
        options:["immer","nie","nur wenn A und B unabhängig sind","nur wenn A und B disjunkt sind"], correct:2,
        explain:"Der Multiplikationssatz gilt laut Skript ausschließlich für unabhängige Ereignisse. Disjunkt heißt P(A∩B)=0 — das ist sogar das Gegenteil von unabhängig (bei P>0)." },

      { q:"Zweimaliger Münzwurf, \\(X=\\) Anzahl Kopf. Was ist \\(P(X\\le1)\\)?",
        options:["0,25","0,5","0,75","1"], correct:2,
        explain:"f(0)+f(1) = 0,25 + 0,5 = 0,75 — höchstens einmal Kopf." },

      { q:"Wie berechnet das Skript die Varianz einer diskreten Zufallsvariable?",
        options:["\\(\\frac{1}{n}\\sum(x_i-\\bar x)^2\\)","\\(\\frac{1}{n-1}\\sum(x_i-\\bar x)^2\\)","\\(E(X^2)-[E(X)]^2\\)","\\(\\sqrt{E(X)}\\)"], correct:2,
        explain:"Verschiebungssatz, kein Stichproben-Nenner n/(n−1); gewichtet wird über fₓ(x). Beispiel Münzwurf: 1,5 − 1² = 0,5." },

      { q:"Stetige Gleichverteilung mit Dichte 0,1 auf [0;10]. Wie groß ist \\(P(4\\le X\\le6)\\)?",
        options:["0,1","0,2","0,4","1"], correct:1,
        explain:"Wahrscheinlichkeit = Fläche = Höhe · Breite = 0,1 · 2 = 0,2." },

      { q:"Was beschreibt das Komplementärereignis \\(\\bar A\\)?",
        options:["die Schnittmenge von A und B","alles in \\(\\Omega\\), das nicht in A liegt","die Vereinigung von A und B","den Erwartungswert von A"], correct:1,
        explain:"Ā = Ω \\ A, daher P(Ā) = 1 − P(A) (Komplementärregel)." },

      { q:"(Erweiterung) Bayes-Test: \\(P(K)=1\\%\\), Sensitivität 99 %, Falsch-Positiv 5 %. Wie wahrscheinlich ist man bei positivem Test wirklich krank?",
        options:["99 %","95 %","≈17 %","1 %"], correct:2,
        explain:"P(K|+) = (0,99·0,01)/(0,99·0,01 + 0,05·0,99) ≈ 0,167. Basisraten-Effekt: seltene Krankheit + viele Falsch-Positive." },

      { q:"Klausuren: \\(P(A)=0{,}8\\), \\(P(B)=0{,}7\\), \\(P(A\\cap B)=0{,}5\\). Sind A und B unabhängig?",
        options:["Ja, denn beide Wahrscheinlichkeiten sind hoch","Nein, denn 0,8·0,7 = 0,56 ≠ 0,5","Ja, denn P(A∪B)=1","Das lässt sich nicht entscheiden"], correct:1,
        explain:"Bei Unabhängigkeit müsste P(A∩B)=P(A)·P(B)=0,56 sein. Da gegeben 0,5 ≠ 0,56, sind A und B abhängig." }
    ]
  });

})();
