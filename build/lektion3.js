/* ===========================================================================
   LEKTION 3 — Auswertungsmethoden zweidimensionaler Daten
   BSTA01-02 "Statistik" (Prof. Dr. Heike Bornewasser-Hermes, 2022), S. 66–100.
   Alle Zahlen gegen die Seitenbilder page_066–page_100 verifiziert.
   =========================================================================== */
(function(){
  "use strict";

  /* ----- lokale Helfer (kollidieren dank IIFE nie mit anderen Lektionen) ----- */

  // Eltern-Leitbeispiel (Tabelle 27 Ausgangsdaten / Tabelle 28 Hilfstabelle):
  // Alter Mutter (x) / Alter Vater (y), n=12.
  // Reproduziert x̄=52, ȳ=57, Σ(x−x̄)(y−ȳ)=220, Σ(x−x̄)²=210, Σ(y−ȳ)²=546, r≈0,650.
  const ELTERN_X = [56,49,48,46,47,56,57,53,58,54,47,53];
  const ELTERN_Y = [60,55,46,52,56,51,71,60,61,58,49,65];

  // Interpretations-Etikett für |Zusammenhangsmaß| in [0,1].
  // Einteilung exakt wie im Skript (S. 75, rechtsseitig geschlossene Intervalle):
  // 0–0,2 kein · 0,2–0,4 schwach · 0,4–0,6 mittel · 0,6–0,8 stark · 0,8–1 sehr stark.
  function staerke(r){
    const a = Math.abs(r);
    if(a <= 0.2) return "kein";
    if(a <= 0.4) return "schwacher";
    if(a <= 0.6) return "mittlerer";
    if(a <= 0.8) return "starker";
    return "sehr starker";
  }

  /* =========================================================================
     WIDGET 1 — Kontingenztabellen-Builder (χ², C, C* live)
     ========================================================================= */
  function renderKontingenz(mount, ctx){
    const { el, Stats, fmt } = ctx;

    // Zustand: Zeilen-/Spaltenbeschriftungen + beobachtete Häufigkeiten.
    let rowLabels = ["weiblich","männlich"];
    let colLabels = ["Raucher:in","Nichtraucher:in"];
    let obs = [[7,27],[6,8]];   // Leitbeispiel-Vorbelegung

    const presets = {
      "Leitbeispiel (Geschlecht × Rauchen, n=48)": {
        r:["weiblich","männlich"], c:["Raucher:in","Nichtraucher:in"], o:[[7,27],[6,8]]
      },
      "Kein Zusammenhang (perfekt unabhängig)": {
        r:["A","B"], c:["X","Y"], o:[[20,30],[20,30]]
      },
      "Starker Zusammenhang (Diagonale)": {
        r:["A","B"], c:["X","Y"], o:[[40,2],[3,38]]
      },
      "3×3 (Region × Wahl)": {
        r:["Nord","Mitte","Süd"], c:["Partei 1","Partei 2","Partei 3"],
        o:[[30,12,8],[10,28,9],[7,11,25]]
      }
    };

    // ---- DOM-Gerüst ----
    const presetRow = el("div",{class:"ctrl-row"});
    const sel = el("select",{class:"chip", style:{minWidth:"260px"}});
    Object.keys(presets).forEach(k => sel.appendChild(el("option",{value:k},k)));
    presetRow.appendChild(el("label",{style:{marginRight:"8px"}},"Beispiel:"));
    presetRow.appendChild(sel);

    const sizeRow = el("div",{class:"btn-row", style:{marginTop:"8px"}});
    const btn2x2 = el("button",{class:"btn ghost"},"2 × 2");
    const btn2x3 = el("button",{class:"btn ghost"},"2 × 3");
    const btn3x3 = el("button",{class:"btn ghost"},"3 × 3");
    sizeRow.appendChild(el("span",{class:"muted",style:{marginRight:"4px"}},"Größe:"));
    sizeRow.append(btn2x2,btn2x3,btn3x3);

    const tblHost = el("div",{class:"tbl-wrap", style:{marginTop:"12px"}});
    const expHost = el("div",{style:{marginTop:"10px"}});
    const readout = el("div",{class:"readout", style:{marginTop:"12px"}});
    const verdict = el("p",{class:"widget-hint", style:{marginTop:"8px"}});

    mount.append(presetRow, sizeRow, tblHost, expHost, readout, verdict);

    // ---- Tabelle (editierbare Inputs) neu aufbauen ----
    function buildTable(){
      tblHost.innerHTML = "";
      const t = el("table",{class:"data"});
      // Kopfzeile
      const head = el("tr");
      head.appendChild(el("th",{html:"&nbsp;"}));
      colLabels.forEach((c,j)=>{
        const inp = el("input",{type:"text", value:c, style:{width:"96px",textAlign:"center"}});
        inp.addEventListener("change", ()=>{ colLabels[j] = inp.value || ("Spalte "+(j+1)); });
        const th = el("th"); th.appendChild(inp); head.appendChild(th);
      });
      head.appendChild(el("th",{html:"Σ&nbsp;Zeile"}));
      t.appendChild(el("thead",{},head));

      const tb = el("tbody");
      obs.forEach((row,i)=>{
        const tr = el("tr");
        const lblInp = el("input",{type:"text", value:rowLabels[i], style:{width:"96px",fontWeight:"600"}});
        lblInp.addEventListener("change", ()=>{ rowLabels[i] = lblInp.value || ("Zeile "+(i+1)); });
        const lblTd = el("td"); lblTd.appendChild(lblInp); tr.appendChild(lblTd);

        row.forEach((v,j)=>{
          const cell = el("input",{type:"number", min:"0", step:"1", value:v,
            style:{width:"72px", textAlign:"center"},
            "data-i":i, "data-j":j});
          cell.addEventListener("input", ()=>{
            const num = Math.max(0, Math.round(Number(cell.value)||0));
            obs[i][j] = num; recompute();
          });
          const td = el("td"); td.appendChild(cell); tr.appendChild(td);
        });
        tr.appendChild(el("td",{class:"rowsum","data-row":i, html:"–"}));
        tb.appendChild(tr);
      });
      // Spaltensummen-Zeile
      const sumTr = el("tr",{class:"hl"});
      sumTr.appendChild(el("td",{html:"<b>Σ Spalte</b>"}));
      colLabels.forEach((_,j)=> sumTr.appendChild(el("td",{class:"colsum","data-col":j, html:"–"})));
      sumTr.appendChild(el("td",{class:"grandsum", html:"–", style:{fontWeight:"700"}}));
      tb.appendChild(sumTr);

      t.appendChild(tb);
      t.appendChild(el("caption",{html:"Beobachtete Häufigkeiten \\(n_{ij}\\) — Zellen frei editierbar"}));
      tblHost.appendChild(t);
    }

    // ---- Berechnung + Anzeige ----
    function recompute(){
      const res = Stats.chiSquare(obs);    // {chi2,N,C,Cmax,Ccorr,exp,rowSums,colSums,df}
      const I = obs.length, J = obs[0].length, M = Math.min(I,J);

      // Randsummen in die Tabelle schreiben
      tblHost.querySelectorAll(".rowsum").forEach(td=>{
        td.textContent = fmt.int(res.rowSums[+td.getAttribute("data-row")]);
      });
      tblHost.querySelectorAll(".colsum").forEach(td=>{
        td.textContent = fmt.int(res.colSums[+td.getAttribute("data-col")]);
      });
      const gs = tblHost.querySelector(".grandsum");
      if(gs) gs.innerHTML = "<b>"+fmt.int(res.N)+"</b>";

      // Zelle mit größter Abweichung |n_ij − ñ_ij| hervorheben
      let maxAbs = -1, maxI = -1, maxJ = -1;
      for(let i=0;i<I;i++) for(let j=0;j<J;j++){
        const d = Math.abs(obs[i][j] - res.exp[i][j]);
        if(d > maxAbs){ maxAbs = d; maxI = i; maxJ = j; }
      }
      tblHost.querySelectorAll('input[type="number"]').forEach(inp=>{
        const i = +inp.getAttribute("data-i"), j = +inp.getAttribute("data-j");
        inp.style.outline = (i===maxI && j===maxJ && res.N>0) ? "2px solid var(--bad, #f0726f)" : "none";
      });

      // Erwartete Häufigkeiten ñ_ij als kleine Tabelle
      expHost.innerHTML = "";
      const et = el("table",{class:"data compact"});
      const eh = el("tr"); eh.appendChild(el("th",{html:"\\(\\tilde n_{ij}\\)"}));
      colLabels.forEach(c=> eh.appendChild(el("th",{html:c})));
      et.appendChild(el("thead",{},eh));
      const etb = el("tbody");
      for(let i=0;i<I;i++){
        const tr = el("tr");
        tr.appendChild(el("td",{html:"<b>"+rowLabels[i]+"</b>"}));
        for(let j=0;j<J;j++){
          const isMax = (i===maxI && j===maxJ && res.N>0);
          tr.appendChild(el("td",{
            html: fmt.n(res.exp[i][j],2),
            style: isMax ? {color:"var(--bad,#f0726f)", fontWeight:"700"} : {}
          }));
        }
        etb.appendChild(tr);
      }
      et.appendChild(etb);
      et.appendChild(el("caption",{html:"Erwartete Häufigkeiten unter Unabhängigkeit \\(\\tilde n_{ij}=n_{i.}\\,n_{.j}/n\\) — rote Zelle = größte Abweichung"}));
      expHost.appendChild(et);

      // Kennzahlen
      readout.innerHTML = "";
      const cards = [
        ["stat",        fmt.n(res.chi2,3), "χ² (Chi-Quadrat)"],
        ["stat teal",   fmt.n(res.C,3),    "C  (Kontingenzkoeff.)"],
        ["stat violet", fmt.n(res.Ccorr,3),"C*  (korrigiert)"],
        ["stat blue",   fmt.n(res.Cmax,3), "K_max  (M="+M+")"]
      ];
      cards.forEach(([cls,v,l])=>{
        readout.appendChild(el("div",{class:cls},
          el("div",{class:"v"},v), el("div",{class:"l"},l)));
      });

      verdict.innerHTML = res.N>0
        ? "<b>Interpretation:</b> C* = "+fmt.n(res.Ccorr,3)+" → "+staerke(res.Ccorr)+
          " Zusammenhang zwischen den beiden Merkmalen. "+
          (res.chi2<1e-9 ? "χ²=0 ⇒ die Merkmale sind hier <i>vollständig unabhängig</i>." : "")
        : "Trage Häufigkeiten ein, um zu rechnen.";

      ctx.typeset();
    }

    function setSize(I,J){
      const oldR = obs.length, oldC = obs[0].length;
      const ndR = [], ndL = [], ndCL = [];
      for(let i=0;i<I;i++){
        ndR.push([]);
        ndL.push(rowLabels[i] || ("Zeile "+(i+1)));
        for(let j=0;j<J;j++) ndR[i].push((i<oldR && j<oldC) ? obs[i][j] : 0);
      }
      for(let j=0;j<J;j++) ndCL.push(colLabels[j] || ("Spalte "+(j+1)));
      obs = ndR; rowLabels = ndL; colLabels = ndCL;
      buildTable(); recompute();
    }

    function applyPreset(key){
      const p = presets[key];
      rowLabels = p.r.slice(); colLabels = p.c.slice();
      obs = p.o.map(r=>r.slice());
      buildTable(); recompute();
    }

    sel.addEventListener("change", ()=> applyPreset(sel.value));
    btn2x2.addEventListener("click", ()=> setSize(2,2));
    btn2x3.addEventListener("click", ()=> setSize(2,3));
    btn3x3.addEventListener("click", ()=> setSize(3,3));

    buildTable(); recompute();
  }

  /* =========================================================================
     WIDGET 2 — Korrelations-Scatter (Pearson r & Spearman r_S + Regression)
     Punkte per Drag verschieben, klicken zum Hinzufügen, Rechtsklick löscht.
     ========================================================================= */
  function renderScatter(mount, ctx){
    const { el, Stats, Plot, fmt, PAL, onCleanup } = ctx;

    // Startdatensatz = echtes Eltern-Beispiel (12 Punkte, r≈0,65)
    let pts = ELTERN_X.map((x,i)=>[x, ELTERN_Y[i]]);

    const XMIN=40, XMAX=64, YMIN=42, YMAX=74;

    const readout = el("div",{class:"readout"});
    const note    = el("p",{class:"widget-hint"});
    const btnRow  = el("div",{class:"btn-row", style:{marginTop:"6px"}});
    const bReset  = el("button",{class:"btn ghost"},"↺ Eltern-Beispiel");
    const bClear  = el("button",{class:"btn ghost"},"Leeren");
    const bPos    = el("button",{class:"btn ghost"},"Positiv");
    const bNeg    = el("button",{class:"btn ghost"},"Negativ");
    const bCloud  = el("button",{class:"btn ghost"},"Wolke (r≈0)");
    btnRow.append(bReset,bClear,bPos,bNeg,bCloud);

    const plotHost = el("div");
    mount.append(readout, plotHost, btnRow, note);

    const P = ctx.Plot(plotHost, {xmin:XMIN, xmax:XMAX, ymin:YMIN, ymax:YMAX, height:340});
    onCleanup(()=> P.destroy());

    let dragIdx = -1;

    function stats(){
      if(pts.length < 2) return null;
      const x = pts.map(p=>p[0]), y = pts.map(p=>p[1]);
      const r  = Stats.pearson(x,y);
      const rho= Stats.spearman(x,y);
      const reg= Stats.regression(x,y); // {a,b,r,r2}
      const mx = Stats.mean(x), my = Stats.mean(y);
      return {x,y,r,rho,reg,mx,my};
    }

    function draw(){
      P.clear();
      const s = stats();

      // Quadranten-Hintergrund um (x̄, ȳ): I & III (positiv) teal-getönt, II & IV rot-getönt
      if(s){
        const cx = P.X(s.mx), cy = P.Y(s.my);
        const x0 = P.X(XMIN), x1 = P.X(XMAX), y0 = P.Y(YMAX), y1 = P.Y(YMIN);
        const g = P.ctx;
        g.save();
        g.fillStyle = "rgba(84,199,192,.07)";   // Q I (rechts-oben) + Q III (links-unten)
        g.fillRect(cx, y0, x1-cx, cy-y0);        // rechts-oben
        g.fillRect(x0, cy, cx-x0, y1-cy);        // links-unten
        g.fillStyle = "rgba(240,114,111,.07)";   // Q II + Q IV
        g.fillRect(x0, y0, cx-x0, cy-y0);        // links-oben
        g.fillRect(cx, cy, x1-cx, y1-cy);        // rechts-unten
        g.restore();
      }

      P.axes({xlabel:"Merkmal X", ylabel:"Merkmal Y", xticks:6, yticks:6});

      if(s){
        // Schwerpunkt-Fadenkreuz
        P.vline(s.mx, {color:"#8d9bb5", width:1, dash:[4,4]});
        P.hline(s.my, {color:"#8d9bb5", width:1, dash:[4,4]});
        P.text(s.mx, YMAX, " (x̄, ȳ)", {color:"#8d9bb5", align:"left", baseline:"top", px:false});

        // Regressionsgerade
        const f = xx => s.reg.a + s.reg.b*xx;
        P.line([[XMIN,f(XMIN)],[XMAX,f(XMAX)]], {color:PAL.gold, width:2.4});
      }

      // Punkte
      P.points(pts, {color:PAL.teal, r:6, stroke:"#0a0e16"});
    }

    function refresh(){
      draw();
      readout.innerHTML = "";
      const s = stats();
      if(!s){
        readout.appendChild(el("div",{class:"stat"},
          el("div",{class:"v"},"–"), el("div",{class:"l"},"zu wenig Punkte")));
        note.innerHTML = "Mindestens 2 Punkte nötig. <b>Klick</b> in die Fläche fügt einen Punkt hinzu.";
        return;
      }
      const cards = [
        ["stat teal",   fmt.n(s.r,3),   "Pearson r (linear)"],
        ["stat violet", fmt.n(s.rho,3), "Spearman r_S (Rang)"],
        ["stat gold",   fmt.n(s.reg.r2,3), "Bestimmtheit r²"],
        ["stat",        fmt.int(pts.length), "Punkte n"]
      ];
      cards.forEach(([cls,v,l])=>{
        readout.appendChild(el("div",{class:cls},
          el("div",{class:"v"},v), el("div",{class:"l"},l)));
      });

      let msg = "<b>r = "+fmt.n(s.r,2)+"</b>: "+staerke(s.r)+
                (s.r>=0?" positiver":" negativer")+" linearer Zusammenhang. ";
      msg += "Regressionsgerade: \\(\\hat y = "+fmt.n(s.reg.a,2)+
             (s.reg.b>=0?" + ":" − ")+fmt.n(Math.abs(s.reg.b),2)+"\\,x\\). ";
      if(Math.abs(s.rho) - Math.abs(s.r) > 0.18){
        msg += "<b>Achtung:</b> r_S ist deutlich größer als r → es gibt einen <i>monotonen, aber nicht-linearen</i> Zusammenhang.";
      } else {
        msg += "<span class='muted'>Tipp: Punkt ziehen, hineinklicken (neu) oder rechtsklicken (löschen).</span>";
      }
      note.innerHTML = msg;
      ctx.typeset();
    }

    // ---- Interaktion: Drag, Add, Delete ----
    function nearestIdx(x,y){
      let best=-1, bd=1e9;
      pts.forEach((p,i)=>{
        const dx=(P.X(p[0])-P.X(x)), dy=(P.Y(p[1])-P.Y(y));
        const d=dx*dx+dy*dy; if(d<bd){bd=d;best=i;}
      });
      return {idx:best, dist:Math.sqrt(bd)};
    }

    P.cv.addEventListener("pointerdown", (e)=>{
      e.preventDefault();
      const {x,y} = P.pointer(e);
      const n = nearestIdx(x,y);
      if(n.idx>=0 && n.dist < 14){
        dragIdx = n.idx;
        try{ P.cv.setPointerCapture(e.pointerId); }catch(_){}
      } else {
        // neuer Punkt am Klickort (im Bereich gehalten)
        pts.push([ ctx.clamp(x,XMIN,XMAX), ctx.clamp(y,YMIN,YMAX) ]);
        refresh();
      }
    });
    P.cv.addEventListener("pointermove", (e)=>{
      if(dragIdx<0) return;
      const {x,y} = P.pointer(e);
      pts[dragIdx] = [ ctx.clamp(x,XMIN,XMAX), ctx.clamp(y,YMIN,YMAX) ];
      refresh();
    });
    const endDrag = ()=>{ dragIdx = -1; };
    P.cv.addEventListener("pointerup", endDrag);
    P.cv.addEventListener("pointercancel", endDrag);
    P.cv.addEventListener("contextmenu", (e)=>{
      e.preventDefault();
      const {x,y} = P.pointer(e);
      const n = nearestIdx(x,y);
      if(n.idx>=0 && n.dist < 16 && pts.length>0){ pts.splice(n.idx,1); refresh(); }
    });
    P.cv.style.touchAction = "none";
    P.cv.style.cursor = "crosshair";

    bReset.addEventListener("click", ()=>{ pts = ELTERN_X.map((x,i)=>[x,ELTERN_Y[i]]); refresh(); });
    bClear.addEventListener("click", ()=>{ pts = []; refresh(); });
    bPos.addEventListener("click", ()=>{ pts = genCorr(+0.85); refresh(); });
    bNeg.addEventListener("click", ()=>{ pts = genCorr(-0.85); refresh(); });
    bCloud.addEventListener("click", ()=>{ pts = genCorr(0.0); refresh(); });

    // erzeugt 12 Punkte, deren Stichproben-r EXAKT dem Ziel entspricht:
    // Rauschvektor per Gram-Schmidt von x befreien, dann y = r·x̂ + √(1−r²)·ê.
    // Lineares Skalieren in den Y-Bereich ändert r nicht (kein clamp nötig).
    function genCorr(target){
      const n=12, xs=[], es=[];
      for(let i=0;i<n;i++){
        const t = i/(n-1);                 // 0..1
        xs.push(XMIN+4 + t*(XMAX-XMIN-8));
        const noise = (Math.sin(i*12.9898)*43758.5453); // deterministisch, ohne RNG-Seed
        es.push(noise - Math.floor(noise));
      }
      const mean = a => a.reduce((s,v)=>s+v,0)/a.length;
      const dot  = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
      const mx = mean(xs), me = mean(es);
      const cx = xs.map(v=>v-mx);
      let   ce = es.map(v=>v-me);
      const proj = dot(ce,cx)/dot(cx,cx);
      ce = ce.map((v,i)=>v-proj*cx[i]);    // Rauschen ⊥ x
      const nx = Math.sqrt(dot(cx,cx)), ne = Math.sqrt(dot(ce,ce));
      const zs = cx.map((v,i)=> target*v/nx + Math.sqrt(1-target*target)*ce[i]/ne);
      const zmax = Math.max(...zs.map(Math.abs)) || 1;
      const ymid = (YMIN+YMAX)/2, amp = (YMAX-YMIN)/2 - 2;
      return xs.map((x,i)=>[ x, ymid + zs[i]/zmax*amp ]);
    }

    P.onResize = draw;
    refresh();
  }

  /* =========================================================================
     WIDGET 3 — "Was bedeutet r = 0,3?" — Scatter-Galerie + nicht-linear
     ========================================================================= */
  function renderGallery(mount, ctx){
    const { el, Stats, fmt, PAL, onCleanup } = ctx;

    // Mini-Scatter mit fester Punktwolke; berechnet r über ctx.Stats.pearson.
    function miniScatter(host, data, label, opts={}){
      const wrap = el("div",{style:{
        flex:"1 1 200px", minWidth:"170px", maxWidth:"260px",
        background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.07)",
        borderRadius:"10px", padding:"8px"
      }});
      const head = el("div",{style:{fontWeight:"700", marginBottom:"2px"}}, label);
      const sub  = el("div",{class:"muted", style:{fontSize:".82em", marginBottom:"4px"}});
      wrap.append(head, sub);
      host.appendChild(wrap);

      const x = data.map(p=>p[0]), y = data.map(p=>p[1]);
      const r = Stats.pearson(x,y);
      const xmin=Math.min(...x)-1, xmax=Math.max(...x)+1;
      const ymin=Math.min(...y)-1, ymax=Math.max(...y)+1;

      const P = ctx.Plot(wrap, {xmin,xmax,ymin,ymax,height:150,
        padL:24,padR:8,padT:8,padB:18});
      onCleanup(()=> P.destroy());
      function draw(){
        P.clear().axes({xticks:4,yticks:3,xfmt:()=>"",yfmt:()=>""});
        if(opts.line && data.length>1){
          const reg = Stats.regression(x,y);
          P.line([[xmin,reg.a+reg.b*xmin],[xmax,reg.a+reg.b*xmax]],{color:PAL.gold,width:1.6});
        }
        P.points(data,{color:opts.color||PAL.teal, r:3.5, stroke:"#0a0e16"});
      }
      draw(); P.onResize = draw;

      sub.innerHTML = "r = <b style='color:"+(opts.color||PAL.teal)+"'>"+fmt.n(r,2)+"</b> · "+
        (opts.tag || staerke(r)+(r>=0?" +":" −"));
      ctx.typeset();
    }

    // feste, anschauliche Datensätze
    const dPlus1 = [[1,2],[2,4],[3,6],[4,8],[5,10],[6,12]];            // r=+1
    const dNeg1  = [[10,100],[20,80],[30,60],[40,40],[50,20],[60,0]]; // r=−1 (Abb. 13, page_093)
    const dPos03 = [[1,5],[2,6],[3,3],[4,2],[5,4],[6,2],[7,8],[8,7]];  // r=+0,30
    const dPos065= ELTERN_X.slice(0,12).map((x,i)=>[x,ELTERN_Y[i]]);  // Eltern, r≈0,65
    const dNeg05 = [[1,8],[2,8],[3,2],[4,3],[5,6],[6,2],[7,3],[8,5]];  // r=−0,50
    const dCloud = [[1,7],[2,2],[3,5],[4,5],[5,5],[6,5],[7,9],[8,3],[3,4],[7,3]]; // r=0,00
    const dQuad  = [];                                                 // r≈0 aber Parabel!
    for(let i=-5;i<=5;i++) dQuad.push([i, i*i]);

    mount.appendChild(el("h3",{class:"blk sub", html:"Galerie: gleiche Frage, verschiedene Stärken"}));
    const gallery = el("div",{style:{display:"flex",flexWrap:"wrap",gap:"10px"}});
    mount.appendChild(gallery);

    miniScatter(gallery, dPlus1,  "Perfekt positiv", {line:true, color:PAL.good, tag:"r = +1 · perfekt"});
    miniScatter(gallery, dPos065, "Eltern-Beispiel", {line:true, color:PAL.teal,  tag:"stark +"});
    miniScatter(gallery, dPos03,  "Schwach positiv", {line:true, color:PAL.teal});
    miniScatter(gallery, dCloud,  "Reine Wolke",     {line:true, color:PAL.violet, tag:"≈ 0 · kein linearer"});
    miniScatter(gallery, dNeg05,  "Mittel negativ",  {line:true, color:PAL.blue});
    miniScatter(gallery, dNeg1,   "Perfekt negativ", {line:true, color:PAL.bad,  tag:"r = −1 · Abb. 13"});

    // Lehrstück gegen den Fehlschluss "r=0 ⇒ kein Zusammenhang"
    mount.appendChild(el("h3",{class:"blk sub",
      html:"Die Falle: r ≈ 0, aber knallharter Zusammenhang"}));
    const trap = el("div",{style:{display:"flex",flexWrap:"wrap",gap:"10px",alignItems:"center"}});
    mount.appendChild(trap);
    miniScatter(trap, dQuad, "Parabel y = x²", {line:true, color:PAL.gold, tag:"r ≈ 0 — trotzdem 100 % Zusammenhang!"});
    trap.appendChild(el("p",{class:"widget-hint", style:{flex:"1 1 220px", minWidth:"200px"},
      html:"Pearsons r misst <b>nur Linearität</b>. Diese Parabel hat einen perfekten, "+
           "rein <i>quadratischen</i> Zusammenhang — und trotzdem r ≈ 0. "+
           "Merke: r = 0 heißt „kein <u>linearer</u> Zusammenhang“, nicht „kein Zusammenhang“."}));
  }

  /* =========================================================================
     WIDGET 4 — Spearman-Rangkorrelation (editierbare Wertetabelle, Ränge live)
     Default = Skript-Leitbeispiel "Zufriedenheit Pflegeroboter × Gesundheit"
     (Tabellen 23–26, n=4): r_S = 0,8.
     Skala: höherer Wert = bessere Ausprägung = Rang 1 (wie im Skript "Bester = 1").
     ========================================================================= */
  function renderSpearman(mount, ctx){
    const { el, Stats, fmt, PAL, Plot, onCleanup } = ctx;

    // Ordinale Stufen → numerischer Score (höher = besser). Im Skript:
    //   sehr gut(4) > gut(3) > befriedigend(2) > mangelhaft/ungenügend(1).
    // Default-Datensatz reproduziert exakt die Ränge r=[2,3,4,1], s=[1,3,4,2].
    const LEIT = [
      { obj:"1", x:3, y:4 },   // gut          / sehr gut
      { obj:"2", x:2, y:2 },   // befriedigend / befriedigend
      { obj:"3", x:1, y:1 },   // mangelhaft   / ungenügend
      { obj:"4", x:4, y:3 }    // sehr gut     / gut
    ];

    // Arbeitskopie des Zustands
    let data = LEIT.map(r => ({obj:r.obj, x:r.x, y:r.y}));

    // ---- Absteigende Anzeige-Ränge (Bester=1) inkl. Mittelwert bei Bindungen.
    // ctx.Stats.ranks() liefert AUFSTEIGENDE Durchschnittsränge; für "Bester=1"
    // (höherer Wert → kleinerer Rang) spiegeln wir: rang_desc = n+1 − rang_asc.
    function descRanks(vals){
      const asc = Stats.ranks(vals), n = vals.length;
      return asc.map(r => n + 1 - r);
    }

    // ---- DOM-Gerüst ----
    const presetRow = el("div",{class:"ctrl-row"});
    presetRow.appendChild(el("label",{style:{marginRight:"8px"}},"Beispiel:"));
    const bLeit = el("button",{class:"btn ghost"},"↺ Pflegeroboter (Skript)");
    const bSchule = el("button",{class:"btn ghost"},"Schulnoten × Sport");
    const bGegen = el("button",{class:"btn ghost"},"Gegensinnig (r_S=−1)");
    presetRow.append(bLeit, bSchule, bGegen);

    const sizeRow = el("div",{class:"btn-row", style:{marginTop:"8px"}});
    sizeRow.appendChild(el("span",{class:"muted",style:{marginRight:"4px"}},"Objekte:"));
    const bMinus = el("button",{class:"btn ghost"},"– Zeile");
    const bPlus  = el("button",{class:"btn ghost"},"+ Zeile");
    sizeRow.append(bMinus, bPlus);

    const hint = el("p",{class:"widget-hint", style:{marginTop:"8px"}},
      "Trage zwei ordinale Merkmale je Objekt ein (z. B. Zufriedenheits-Punkte 1–5, höher = besser). " +
      "Ränge, \\(d_i\\), \\(d_i^2\\) und \\(r_S\\) werden live berechnet.");

    const tblHost = el("div",{class:"tbl-wrap", style:{marginTop:"12px"}});
    const plotHost = el("div",{style:{marginTop:"12px"}});
    const readout = el("div",{class:"readout", style:{marginTop:"12px"}});
    const stepsHost = el("div",{style:{marginTop:"12px"}});
    const verdict = el("p",{class:"widget-hint", style:{marginTop:"8px"}});

    mount.append(presetRow, sizeRow, hint, tblHost, plotHost, readout, stepsHost, verdict);

    // ---- Mini-Scatter der Ränge ----
    const P = ctx.Plot(plotHost, {xmin:0.5, xmax:0.5, ymin:0.5, ymax:0.5, height:240});
    onCleanup(()=> P.destroy());

    // ---- editierbare Tabelle aufbauen ----
    function buildTable(){
      tblHost.innerHTML = "";
      const t = el("table",{class:"data"});
      const head = el("tr");
      ["Objekt","Merkmal X","Merkmal Y","Rang \\(r_i\\)","Rang \\(s_i\\)","\\(d_i\\)","\\(d_i^2\\)"]
        .forEach(h => head.appendChild(el("th",{html:h})));
      t.appendChild(el("thead",{},head));

      const tb = el("tbody");
      data.forEach((row,i)=>{
        const tr = el("tr");

        const objInp = el("input",{type:"text", value:row.obj,
          style:{width:"64px", textAlign:"center", fontWeight:"600"}});
        objInp.addEventListener("change", ()=>{ row.obj = objInp.value || ("Obj "+(i+1)); });
        tr.appendChild(el("td",{}, objInp));

        const xInp = el("input",{type:"number", step:"1", value:row.x,
          style:{width:"72px", textAlign:"center"}});
        xInp.addEventListener("input", ()=>{ row.x = Number(xInp.value)||0; recompute(); });
        tr.appendChild(el("td",{}, xInp));

        const yInp = el("input",{type:"number", step:"1", value:row.y,
          style:{width:"72px", textAlign:"center"}});
        yInp.addEventListener("input", ()=>{ row.y = Number(yInp.value)||0; recompute(); });
        tr.appendChild(el("td",{}, yInp));

        tr.appendChild(el("td",{class:"rx","data-i":i, html:"–"}));
        tr.appendChild(el("td",{class:"sx","data-i":i, html:"–"}));
        tr.appendChild(el("td",{class:"dx","data-i":i, html:"–"}));
        tr.appendChild(el("td",{class:"d2x","data-i":i, html:"–"}));
        tb.appendChild(tr);
      });

      const sumTr = el("tr",{class:"hl"});
      sumTr.appendChild(el("td",{html:"<b>Σ</b>"}));
      sumTr.appendChild(el("td",{html:"&nbsp;"}));
      sumTr.appendChild(el("td",{html:"&nbsp;"}));
      sumTr.appendChild(el("td",{class:"rsum", html:"–"}));
      sumTr.appendChild(el("td",{class:"ssum", html:"–"}));
      sumTr.appendChild(el("td",{class:"dsum", html:"–"}));
      sumTr.appendChild(el("td",{class:"d2sum", html:"–", style:{fontWeight:"700"}}));
      tb.appendChild(sumTr);

      t.appendChild(tb);
      t.appendChild(el("caption",{html:"Höherer Wert = bessere Ausprägung = Rang 1. Zellen X/Y frei editierbar."}));
      tblHost.appendChild(t);
    }

    // ---- berechnen + anzeigen ----
    function recompute(){
      const n = data.length;
      const x = data.map(r=>r.x), y = data.map(r=>r.y);
      const r = descRanks(x), s = descRanks(y);
      const d  = r.map((ri,i)=> ri - s[i]);
      const d2 = d.map(v => v*v);
      const sumD2 = Stats.sum(d2);

      // Bindungen erkennen (Werte mit identischer Ausprägung im selben Merkmal)
      const hasTiesX = new Set(x).size !== x.length;
      const hasTiesY = new Set(y).size !== y.length;
      const ties = hasTiesX || hasTiesY;

      const rhoGen = Stats.spearman(x, y);          // = Pearson auf Rängen (immer gültig)
      const rhoSimple = Stats.spearmanSimple(x, y); // Kurzformel (nur ohne Bindungen exakt)

      // Ränge/Differenzen in die Tabelle schreiben
      tblHost.querySelectorAll(".rx").forEach(td=>{ const i=+td.getAttribute("data-i"); td.textContent = fmt.a(r[i]); });
      tblHost.querySelectorAll(".sx").forEach(td=>{ const i=+td.getAttribute("data-i"); td.textContent = fmt.a(s[i]); });
      tblHost.querySelectorAll(".dx").forEach(td=>{ const i=+td.getAttribute("data-i"); td.textContent = fmt.a(d[i]); });
      tblHost.querySelectorAll(".d2x").forEach(td=>{ const i=+td.getAttribute("data-i"); td.textContent = fmt.a(d2[i]); });
      const setTxt = (cls,val)=>{ const e=tblHost.querySelector(cls); if(e) e.textContent = val; };
      setTxt(".rsum", fmt.a(Stats.sum(r)));
      setTxt(".ssum", fmt.a(Stats.sum(s)));
      setTxt(".dsum", fmt.a(Stats.sum(d)));
      const d2sum = tblHost.querySelector(".d2sum"); if(d2sum) d2sum.innerHTML = "<b>"+fmt.a(sumD2)+"</b>";

      // Kennzahlen-Karten
      readout.innerHTML = "";
      const cards = [
        ["stat violet", fmt.n(rhoGen,3),  "r_S (Pearson auf Rängen)"],
        ["stat teal",   ties ? "–" : fmt.n(rhoSimple,3), "r_S (Kurzformel)"],
        ["stat",        fmt.a(sumD2),     "Σ d²"],
        ["stat blue",   fmt.int(n),       "Objekte n"]
      ];
      cards.forEach(([cls,v,l])=>{
        readout.appendChild(el("div",{class:cls}, el("div",{class:"v"},v), el("div",{class:"l"},l)));
      });

      // Schritt-für-Schritt-Erklärung
      stepsHost.innerHTML = "";
      const steps = el("div",{class:"steps"});
      const mittelRang = (n+1)/2;
      steps.appendChild(el("div",{class:"step", html:
        "<span class='sk'>1</span> <b>Ränge vergeben</b> (Bester = Rang 1, je Merkmal getrennt). "+
        "Mittlerer Rang \\(\\bar r=\\bar s=\\tfrac{n+1}{2}="+fmt.a(mittelRang)+"\\)."}));
      steps.appendChild(el("div",{class:"step", html:
        "<span class='sk'>2</span> <b>Rangdifferenzen</b> \\(d_i=r_i-s_i\\) bilden und quadrieren → "+
        "\\(\\sum d_i^2="+fmt.a(sumD2)+"\\)."}));
      if(!ties){
        steps.appendChild(el("div",{class:"step", html:
          "<span class='sk'>3</span> <b>Kurzformel</b> (keine Bindungen): "+
          "\\[r_S=1-\\frac{6\\sum d_i^2}{n\\,(n^2-1)}=1-\\frac{6\\cdot "+fmt.a(sumD2)+"}{"+n+"\\,("+n+"^2-1)}="+
          "1-\\frac{"+fmt.a(6*sumD2)+"}{"+fmt.a(n*(n*n-1))+"}=\\mathbf{"+fmt.n(rhoSimple,3)+"}\\]"}));
        steps.appendChild(el("div",{class:"step", html:
          "<span class='sk'>4</span> <b>Gegencheck</b> über Pearson auf den Rängen: "+
          "\\(r_S="+fmt.n(rhoGen,3)+"\\) — identisch \\(\\checkmark\\)."}));
      } else {
        steps.appendChild(el("div",{class:"step", html:
          "<span class='sk'>3</span> <b>Bindungen erkannt!</b> Mehrere Objekte teilen sich eine Ausprägung → "+
          "Durchschnittsränge. Die Kurzformel ist dann <i>nur näherungsweise</i> gültig — "+
          "korrekt ist die allgemeine Form (Pearson auf den Rängen)."}));
        steps.appendChild(el("div",{class:"step", html:
          "<span class='sk'>4</span> <b>Allgemeine Form</b> \\(r_S=\\dfrac{\\sum(r_i-\\bar r)(s_i-\\bar s)}"+
          "{\\sqrt{\\sum(r_i-\\bar r)^2\\,\\sum(s_i-\\bar s)^2}}=\\mathbf{"+fmt.n(rhoGen,3)+"}\\)."}));
      }
      stepsHost.appendChild(steps);

      // Verdict
      const rho = rhoGen;
      verdict.innerHTML = "<b>Interpretation:</b> \\(r_S="+fmt.n(rho,3)+"\\) → "+staerke(rho)+
        (rho>=0 ? " <b>gleichsinniger</b> (monoton wachsender)" : " <b>gegensinniger</b> (monoton fallender)")+
        " Zusammenhang der Reihenfolgen."+
        (ties ? " <span class='muted'>Hinweis: wegen Bindungen ist die Kurzformel nicht exakt.</span>" : "");

      drawPlot(r, s, rho);
      ctx.typeset();
    }

    // ---- Rang-Scatter: Punkt je Objekt in (Rang X, Rang Y) ----
    function drawPlot(r, s, rho){
      const n = data.length;
      P.setX(0.5, n + 0.5); P.setY(0.5, n + 0.5);
      P.clear();
      P.axes({ xlabel:"Rang in X  (r_i)", ylabel:"Rang in Y  (s_i)",
        xticks:n, yticks:n, xfmt:v=>fmt.a(v), yfmt:v=>fmt.a(v) });
      // Diagonale = perfekte Rangübereinstimmung (r_S=+1)
      P.line([[0.5,0.5],[n+0.5,n+0.5]], {color:"#8d9bb5", width:1, dash:[4,4]});
      const pts = r.map((ri,i)=>[ri, s[i]]);
      P.points(pts, {color: rho>=0 ? PAL.teal : PAL.bad, r:6, stroke:"#0a0e16"});
      pts.forEach((p,i)=> P.text(p[0], p[1], " "+data[i].obj, {color:"#c9d4e8", align:"left", baseline:"middle"}));
    }

    function setData(arr){
      data = arr.map(r=>({obj:r.obj, x:r.x, y:r.y}));
      buildTable(); recompute();
    }
    function addRow(){
      data.push({obj:String(data.length+1), x:0, y:0});
      buildTable(); recompute();
    }
    function delRow(){
      if(data.length > 3){ data.pop(); buildTable(); recompute(); }
    }

    bLeit.addEventListener("click", ()=> setData(LEIT));
    bSchule.addEventListener("click", ()=> setData([
      {obj:"Anna", x:5, y:4}, {obj:"Ben", x:4, y:5}, {obj:"Cem", x:3, y:3},
      {obj:"Dana", x:2, y:1}, {obj:"Emil", x:1, y:2}
    ]));
    bGegen.addEventListener("click", ()=> setData([
      {obj:"1", x:5, y:1}, {obj:"2", x:4, y:2}, {obj:"3", x:3, y:3},
      {obj:"4", x:2, y:4}, {obj:"5", x:1, y:5}
    ]));
    bPlus.addEventListener("click", addRow);
    bMinus.addEventListener("click", delRow);

    P.onResize = ()=>{ const x=data.map(r=>r.x), y=data.map(r=>r.y);
      drawPlot(descRanks(x), descRanks(y), Stats.spearman(x,y)); };

    buildTable(); recompute();
  }

  /* =========================================================================
     LEKTION-OBJEKT
     ========================================================================= */
  App.registerLesson({
    id: 3,
    title: "Zweidimensionale Daten",

    formulas: [
      { group:"Lektion 3 · Kontingenzanalyse", name:"Erwartete Häufigkeit (Unabhängigkeit)",
        tex:"\\tilde n_{ij}=\\frac{n_{i.}\\cdot n_{.j}}{n}", note:"nominal × nominal" },
      { group:"Lektion 3 · Kontingenzanalyse", name:"Chi-Quadrat (allgemein)",
        tex:"\\chi^2=\\sum_{i=1}^{I}\\sum_{j=1}^{J}\\frac{(n_{ij}-\\tilde n_{ij})^2}{\\tilde n_{ij}}", note:"0 = Unabhängigkeit" },
      { group:"Lektion 3 · Kontingenzanalyse", name:"Chi-Quadrat (2×2-Kurzformel)",
        tex:"\\chi^2=\\frac{n\\,(n_{11}n_{22}-n_{12}n_{21})^2}{n_{1.}\\,n_{2.}\\,n_{.1}\\,n_{.2}}", note:"nur 2×2" },
      { group:"Lektion 3 · Kontingenzanalyse", name:"Kontingenzkoeffizient C (K)",
        tex:"K=\\sqrt{\\frac{\\chi^2}{\\chi^2+n}}", note:"nicht ganz bis 1" },
      { group:"Lektion 3 · Kontingenzanalyse", name:"Korrigiertes C* (K*)",
        tex:"K^{*}=\\frac{K}{K_{max}},\\quad K_{max}=\\sqrt{\\frac{M-1}{M}},\\quad M=\\min\\{I,J\\}", note:"∈ [0,1]" },
      { group:"Lektion 3 · Rangkorrelation (Spearman)", name:"Spearman (Kurzformel, ohne Bindungen)",
        tex:"r_S=1-\\frac{6\\sum_{i=1}^{n} d_i^{2}}{n\\,(n^{2}-1)},\\quad d_i=r_i-s_i", note:"ordinal" },
      { group:"Lektion 3 · Rangkorrelation (Spearman)", name:"Spearman (allgemein = Pearson auf Rängen)",
        tex:"r_S=\\frac{\\sum_{i=1}^{n}(r_i-\\bar r)(s_i-\\bar s)}{\\sqrt{\\sum_{i=1}^{n}(r_i-\\bar r)^2\\;\\sum_{i=1}^{n}(s_i-\\bar s)^2}}", note:"auch bei Bindungen" },
      { group:"Lektion 3 · Rangkorrelation (Spearman)", name:"Mittlerer Rang",
        tex:"\\bar r=\\bar s=\\frac{n+1}{2}", note:"" },
      { group:"Lektion 3 · Korrelation (Bravais-Pearson)", name:"Bravais-Pearson r (Definition)",
        tex:"r_{x,y}=\\frac{\\sum_{i=1}^{n}(x_i-\\bar x)(y_i-\\bar y)}{\\sqrt{\\sum_{i=1}^{n}(x_i-\\bar x)^2\\;\\sum_{i=1}^{n}(y_i-\\bar y)^2}}", note:"metrisch, linear" },
      { group:"Lektion 3 · Korrelation (Bravais-Pearson)", name:"Bravais-Pearson r (Rechenform)",
        tex:"r_{x,y}=\\frac{\\overline{xy}-\\bar x\\,\\bar y}{\\sqrt{(\\overline{x^2}-\\bar x^2)(\\overline{y^2}-\\bar y^2)}}", note:"mit Mittelwerten" },
      { group:"Lektion 3 · Korrelation (Bravais-Pearson)", name:"Kovarianz",
        tex:"s_{xy}=\\frac{1}{n}\\sum_{i=1}^{n}(x_i-\\bar x)(y_i-\\bar y)=\\overline{xy}-\\bar x\\,\\bar y", note:"" },
      { group:"Lektion 3 · Korrelation (Bravais-Pearson)", name:"r aus Kovarianz",
        tex:"r_{x,y}=\\frac{s_{xy}}{s_x\\,s_y}", note:"" },
      { group:"Lektion 3 · Auswahlregel", name:"Maßzahl nach schwächerem Skalenniveau",
        tex:"\\text{Ma\\ss zahl}=f\\bigl(\\min(\\text{Skala}_X,\\ \\text{Skala}_Y)\\bigr)", note:"nominal<ordinal<metrisch" }
    ],

    sections: [
      /* ----------------------------------------------------------- 3.0 Intro */
      {
        num:"3.0", title:"Worum geht's? Von einem Merkmal zu zweien",
        intro:"Lektion 2 fragte „wie sieht <i>ein</i> Merkmal aus?“. Jetzt fragen wir: „hängen <i>zwei</i> Merkmale zusammen?“",
        blocks: [
          {t:"p", lead:true, html:"Bisher haben wir Merkmale einzeln seziert: Mittelwert hier, Streuung da. Spannend wird es erst, wenn zwei Dinge <b>gemeinsam</b> auftreten. Bringt mehr Werbung mehr Umsatz? Lernen größere Kinder besser? Hängt das Geschlecht mit dem Rauchverhalten zusammen? Das ist die Welt der <b>zweidimensionalen (bivariaten)</b> Daten."},
          {t:"p", html:"Die gute Nachricht: Es gibt eine simple Leitfrage — „<b>Hängen die beiden zusammen, und wie stark?</b>“ — und drei Standard-Werkzeuge dafür. Die schlechte Nachricht: Du musst das richtige Werkzeug wählen, sonst rechnest du Unsinn."},
          {t:"h", text:"Drei Verfahren, eine Auswahlregel", icon:"🧰"},
          {t:"list", items:[
            "<b>Kontingenzanalyse</b> → für <b>nominale</b> Merkmale (Kategorien wie Geschlecht, Farbe). Liefert χ², C und C*.",
            "<b>Rangkorrelation nach Spearman</b> → für <b>ordinale</b> Merkmale (Reihenfolgen wie Schulnoten). Liefert \\(r_S\\).",
            "<b>Korrelation nach Bravais-Pearson</b> → für <b>metrische</b> Merkmale (echte Messwerte wie Größe, Umsatz). Liefert \\(r\\)."
          ]},
          {t:"def", term:"Die Auswahlregel", title:"Das schwächere Skalenniveau entscheidet",
            html:"Die Wahl der Zusammenhangsmaßzahl richtet sich nach dem <b>schwächeren der beiden Skalenniveaus</b> (nominal &lt; ordinal &lt; metrisch). Ein nominales <i>und</i> ein metrisches Merkmal → behandle wie nominal → Kontingenzanalyse."},
          {t:"aha", title:"Die Werkzeugkasten-Regel",
            html:"Skalenniveau = Schraubenkopf, Maßzahl = Schraubendreher. Du nimmst nie den stärksten Dreher, sondern den, der zum <b>schwächeren der beiden Köpfe</b> passt. Sonst dreht das Werkzeug durch — oder ruiniert die Schraube."},
          {t:"why",
            html:"Fast jede praktische Datenfrage ist eine Zusammenhangsfrage. Wer nur einzelne Merkmale beschreibt, verpasst genau die Beziehungen, auf denen Entscheidungen beruhen. Diese Lektion macht aus „ich vermute da was“ ein „ich kann es messen“."},
          {t:"warn", tag:"Die wichtigste Warnung der ganzen Lektion",
            html:"<b>Korrelation ist nicht Kausalität.</b> Zwei Größen können stramm zusammenlaufen, ohne dass die eine die andere verursacht. Merke dir das jetzt — wir kommen in 3.4 mit Störchen und Babys darauf zurück."}
        ]
      },

      /* --------------------------------------------------- 3.1 Kontingenz */
      {
        num:"3.1", title:"Kontingenzanalyse (χ², C, C*)",
        intro:"Wenn beide Merkmale Kategorien sind: zählen, vergleichen, χ² rechnen.",
        blocks: [
          {t:"p", lead:true, html:"Zwei <b>nominale</b> Merkmale (Geschlecht, Lieblingsfarbe, Region …) kannst du nicht mitteln — „der mittlere Geschlecht“ ist Quatsch. Stattdessen <b>zählst</b> du, wie oft jede Kombination vorkommt, und packst das in eine <b>Kontingenztabelle</b> (Kreuztabelle)."},
          {t:"def", term:"Kontingenztabelle", html:"Tabellarische Darstellung der gemeinsamen Häufigkeitsverteilung zweier Merkmale X (I Zeilen) und Y (J Spalten). Zelle \\((i,j)\\) enthält die absolute Häufigkeit \\(n_{ij}\\)."},
          {t:"def", term:"Randhäufigkeiten", html:"<b>Zeilensumme</b> \\(n_{i.}=\\sum_j n_{ij}\\) (alle in Zeile i), <b>Spaltensumme</b> \\(n_{.j}=\\sum_i n_{ij}\\) (alle in Spalte j), <b>Gesamtzahl</b> \\(n\\) = Stichprobenumfang."},

          {t:"h", text:"Die Kernidee: beobachtet vs. erwartet", icon:"⚖️"},
          {t:"p", html:"Wir vergleichen die <b>beobachteten</b> Häufigkeiten \\(n_{ij}\\) mit den Häufigkeiten, die wir <b>erwarten</b> würden, wenn die Merkmale komplett unabhängig wären. Je weiter beobachtet von erwartet weg ist, desto stärker der Zusammenhang."},
          {t:"def", term:"Erwartete Häufigkeit \\(\\tilde n_{ij}\\)",
            html:"Die Häufigkeit, die in Zelle \\((i,j)\\) zu erwarten wäre, wenn X und Y voneinander <b>unabhängig</b> sind. Man verteilt die Randsummen anteilig."},
          {t:"formula", tex:"\\tilde n_{ij}=\\frac{n_{i.}\\cdot n_{.j}}{n}", caption:"erwartete Häufigkeit unter Unabhängigkeit"},
          {t:"quote", html:"Die erwartete Häufigkeit gibt an, welche Häufigkeit in einer Zelle zu erwarten wäre, wenn die beiden Merkmale voneinander unabhängig wären.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"h", text:"χ² — der Gesamt-Abstand", icon:"📏"},
          {t:"def", term:"χ² (Chi-Quadrat)",
            html:"Maß für die Gesamtabweichung zwischen beobachteten und erwarteten Häufigkeiten. \\(\\chi^2=0\\) ⇔ vollständige Unabhängigkeit; \\(\\chi^2\\ge 0\\), nach oben unbegrenzt."},
          {t:"formula", tex:"\\chi^2=\\sum_{i=1}^{I}\\sum_{j=1}^{J}\\frac{(n_{ij}-\\tilde n_{ij})^2}{\\tilde n_{ij}}", caption:"Chi-Quadrat (allgemein, jede Tabellengröße)"},
          {t:"formula", tex:"\\chi^2=\\frac{n\\,(n_{11}n_{22}-n_{12}n_{21})^2}{n_{1.}\\,n_{2.}\\,n_{.1}\\,n_{.2}}", caption:"Kurzformel — nur für 2×2-Tabellen"},
          {t:"quote", html:"Je größer die Abweichung der beobachteten von den erwarteten Häufigkeiten, desto stärker ist der Zusammenhang zwischen den beiden Merkmalen.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"h", text:"Von χ² zu C und C*", icon:"📐"},
          {t:"p", html:"\\(\\chi^2\\) hat einen Haken: Es hängt von \\(n\\) und der Tabellengröße ab — 100 Personen liefern bei gleicher Struktur ein größeres χ² als 50. Für einen <b>vergleichbaren</b> Wert normieren wir es zum <b>Kontingenzkoeffizienten C</b>."},
          {t:"formula", tex:"K=\\sqrt{\\frac{\\chi^2}{\\chi^2+n}}", caption:"Kontingenzkoeffizient C (= K)"},
          {t:"p", html:"C hat <i>immer noch</i> einen Haken: Es erreicht die 1 nie ganz, sondern nur ein \\(K_{max}<1\\), das von der Tabellengröße abhängt. Deshalb teilen wir durch \\(K_{max}\\) und bekommen das schöne, auf \\([0,1]\\) normierte <b>korrigierte C*</b>."},
          {t:"formula", tex:"K^{*}=\\frac{K}{K_{max}},\\qquad K_{max}=\\sqrt{\\frac{M-1}{M}},\\qquad M=\\min\\{I,J\\}", caption:"korrigierter Kontingenzkoeffizient C* (= K*)"},
          {t:"quote", html:"Der Kontingenzkoeffizient kann seinen Maximalwert 1 nicht erreichen; sein Höchstwert hängt von der Tabellengröße (Zahl der Ausprägungen) ab. Um einen auf \\([0,1]\\) vergleichbaren Wert zu erhalten, wird er durch diesen Höchstwert \\(K_{max}\\) korrigiert.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"aha", title:"Was wäre, wenn nichts zusammenhinge?",
            html:"Die erwarteten Häufigkeiten sind die „Wenn alles Zufall wäre“-Welt — die langweiligste aller möglichen Tabellen. χ² misst nur, <b>wie weit die echte Welt von dieser Zufallswelt abweicht</b>. Kein Abstand → kein Zusammenhang."},

          {t:"h", text:"Leitbeispiel: Geschlecht × Rauchverhalten (n = 48)", icon:"🚬"},
          {t:"p", html:"Befragt wurden 48 Personen (Pflegekräfte). Zwei nominale Merkmale: <b>Geschlecht</b> (weiblich/männlich) und <b>Rauchverhalten</b> (Raucher:in/Nichtraucher:in). Die beobachteten Häufigkeiten (Tabelle 20):"},
          {t:"table",
            headers:["Geschlecht \\ Verhalten","Raucher:in","Nichtraucher:in","Σ Zeile \\(n_{i.}\\)"],
            rows:[
              ["weiblich","7","27","<b>34</b>"],
              ["männlich","6","8","<b>14</b>"],
              ["<b>Σ Spalte \\(n_{.j}\\)</b>","<b>13</b>","<b>35</b>","<b>48 = n</b>"]
            ],
            highlight:[2],
            caption:"Kontingenztabelle (Tabelle 20). I = 2, J = 2 → M = min{2,2} = 2."},

          {t:"example", title:"Schritt für Schritt durchgerechnet (Originalzahlen)",
            html:
              "<b>Schritt 1 — erwartete Häufigkeiten</b> \\(\\tilde n_{ij}=n_{i.}n_{.j}/n\\):"+
              "\\[\\tilde n_{11}=\\tfrac{34\\cdot13}{48}\\approx 9{,}21,\\quad \\tilde n_{12}=\\tfrac{34\\cdot35}{48}\\approx 24{,}79\\]"+
              "\\[\\tilde n_{21}=\\tfrac{14\\cdot13}{48}\\approx 3{,}79,\\quad \\tilde n_{22}=\\tfrac{14\\cdot35}{48}\\approx 10{,}21\\]"+
              "<i>Kontrolle:</i> 9,21 + 24,79 = 34 ✓ und 3,79 + 10,21 = 14 ✓.<br><br>"+
              "<b>Schritt 2 — χ²</b> aus \\((n_{ij}-\\tilde n_{ij})^2/\\tilde n_{ij}\\):"+
              "\\[\\tfrac{(7-9{,}21)^2}{9{,}21}\\!\\approx\\!0{,}53,\\ \\tfrac{(27-24{,}79)^2}{24{,}79}\\!\\approx\\!0{,}20,\\ \\tfrac{(6-3{,}79)^2}{3{,}79}\\!\\approx\\!1{,}29,\\ \\tfrac{(8-10{,}21)^2}{10{,}21}\\!\\approx\\!0{,}48\\]"+
              "\\[\\chi^2\\approx 0{,}53+0{,}20+1{,}29+0{,}48 = \\mathbf{2{,}49}\\]"+
              "<i>Gegencheck mit 2×2-Kurzformel:</i> \\(\\chi^2=\\tfrac{48\\,(7\\cdot8-27\\cdot6)^2}{34\\cdot14\\cdot13\\cdot35}=\\tfrac{48\\cdot(-106)^2}{216580}\\approx 2{,}49\\) ✓<br><br>"+
              "<b>Schritt 3 — Kontingenzkoeffizient C:</b>"+
              "\\[K=\\sqrt{\\tfrac{2{,}49}{2{,}49+48}}=\\sqrt{\\tfrac{2{,}49}{50{,}49}}\\approx \\mathbf{0{,}222}\\]"+
              "<b>Schritt 4 — korrigiertes C*</b> (M = 2):"+
              "\\[K_{max}=\\sqrt{\\tfrac{2-1}{2}}=\\sqrt{0{,}5}\\approx 0{,}707,\\qquad K^{*}=\\tfrac{0{,}222}{0{,}707}\\approx \\mathbf{0{,}314}\\]"+
              "<b>Ergebnis:</b> C* ≈ 0,314 → ein eher <b>schwacher Zusammenhang</b> zwischen Geschlecht und Rauchverhalten."},

          {t:"why",
            html:"Überall, wo Daten in Kategorien fallen — Geschlecht × Kaufentscheidung, Region × Wahl, Therapie × Heilung — ist das der <b>einzige</b> Weg, überhaupt „hängt das zusammen?“ zu fragen. Mittelwert und Pearson-r helfen dir bei Kategorien null."},

          {t:"widget", title:"Kontingenztabellen-Builder — χ², C, C* live", icon:"🧮",
            hint:"Trage Häufigkeiten ein (oder wähle ein Beispiel) — erwartete Häufigkeiten, χ², C und C* werden live berechnet. Die rote Zelle hat die größte Abweichung.",
            render: renderKontingenz}
        ]
      },

      /* --------------------------------------------------- 3.2 Spearman */
      {
        num:"3.2", title:"Rangkorrelationsanalyse (Spearman)",
        intro:"Für Reihenfolgen statt echter Messwerte: nur die Ränge zählen.",
        blocks: [
          {t:"p", lead:true, html:"<b>Ordinale</b> Merkmale haben eine Reihenfolge, aber keine echten Abstände: Schulnoten, Zufriedenheits-Stufen („sehr gut … sehr schlecht“), Rankings. Den Abstand zwischen „gut“ und „befriedigend“ kennt niemand — also rechnen wir nicht mit den Werten, sondern mit ihren <b>Rängen</b>. Das ist die Idee von <b>Spearman</b>."},
          {t:"def", term:"Spearman'scher Rangkorrelationskoeffizient \\(r_S\\)",
            html:"Misst den <b>monotonen</b> Zusammenhang zwischen zwei mindestens ordinalskalierten Merkmalen. Es ist schlicht die Bravais-Pearson-Korrelation, angewandt auf die <b>Ränge</b> statt auf die Werte. Wertebereich \\(-1\\le r_S\\le +1\\)."},
          {t:"def", term:"Rangvergabe",
            html:"Beste/erste Ausprägung erhält <b>Rang 1</b>, nächste Rang 2 usw. — einfach durchnummerieren (<i>kein</i> Median-/Quantilsverfahren). Bei Gleichständen (Bindungen) werden <b>Durchschnittsränge</b> vergeben; im Kurs werden Bindungen vermieden."},
          {t:"def", term:"Rangdifferenz und mittlerer Rang",
            html:"\\(d_i=r_i-s_i\\) ist die Differenz der Ränge eines Objekts in beiden Merkmalen. Der mittlere Rang ist \\(\\bar r=\\bar s=\\tfrac{n+1}{2}\\)."},

          {t:"h", text:"Die zwei Wege zu \\(r_S\\)", icon:"🛤️"},
          {t:"formula", tex:"r_S=1-\\frac{6\\sum_{i=1}^{n} d_i^{2}}{n\\,(n^{2}-1)},\\qquad d_i=r_i-s_i", caption:"Kurzformel — nur ohne Bindungen gültig (im Kurs der Standard)"},
          {t:"formula", tex:"r_S=\\frac{\\sum_{i=1}^{n}(r_i-\\bar r)(s_i-\\bar s)}{\\sqrt{\\sum_{i=1}^{n}(r_i-\\bar r)^2\\;\\sum_{i=1}^{n}(s_i-\\bar s)^2}}", caption:"allgemein = Pearson auf den Rängen (auch bei Bindungen)"},

          {t:"quote", html:"Bei der Rangkorrelation werden nicht die Merkmalswerte selbst, sondern ihre Ränge betrachtet.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"aha", title:"Platzierung statt Stoppuhr",
            html:"Beim Marathon zählt für „wer war schneller?“ nur die Reihenfolge im Ziel, nicht die Sekunden. Spearman fragt genau das: Stimmt die Platzierung in Merkmal X mit der in Merkmal Y überein? Deshalb verkraftet es auch <b>krumme, nicht-lineare, aber monotone</b> Zusammenhänge — und ist robust gegen Ausreißer."},

          {t:"h", text:"Leitbeispiel: n = 4 Beobachtungen (Tabelle 24/25)", icon:"🏅"},
          {t:"p", html:"Zwei ordinale Merkmale, vier Objekte. Nach Rangvergabe (Bester = Rang 1):"},
          {t:"table",
            headers:["Objekt","Rang X: \\(r_i\\)","Rang Y: \\(s_i\\)","\\(d_i=r_i-s_i\\)","\\(d_i^2\\)"],
            rows:[
              ["1","2","1","1","1"],
              ["2","3","3","0","0"],
              ["3","4","4","0","0"],
              ["4","1","2","−1","1"],
              ["<b>Σ</b>","10","10","0","<b>2</b>"]
            ],
            highlight:[4],
            caption:"Mittlerer Rang \\(\\bar r=\\bar s=(4+1)/2=2{,}5\\)."},

          {t:"example", title:"Schritt für Schritt durchgerechnet",
            html:
              "<b>Kurzformel</b> (bevorzugt, keine Bindungen): \\(\\sum d_i^2=1+0+0+1=2\\), \\(n=4\\):"+
              "\\[r_S=1-\\frac{6\\cdot 2}{4\\,(4^2-1)}=1-\\frac{12}{60}=1-0{,}2=\\mathbf{0{,}8}\\]"+
              "<b>Kontrolle über Pearson auf Rängen:</b><br>"+
              "Abweichungen \\(r_i-\\bar r\\): −0,5; 0,5; 1,5; −1,5 → \\(\\sum(r_i-\\bar r)^2=5\\).<br>"+
              "Abweichungen \\(s_i-\\bar s\\): −1,5; 0,5; 1,5; −0,5 → \\(\\sum(s_i-\\bar s)^2=5\\).<br>"+
              "Produkte: 0,75 + 0,25 + 2,25 + 0,75 = 4.<br>"+
              "\\[r_S=\\frac{4}{\\sqrt{5\\cdot 5}}=\\frac{4}{5}=\\mathbf{0{,}8}\\ \\checkmark\\]"+
              "<b>Ergebnis:</b> \\(r_S=0{,}8\\) → <b>starker, gleichsinniger (monoton wachsender)</b> Zusammenhang."},

          {t:"quote", html:"Ein positiver Rangkorrelationskoeffizient deutet auf einen gleichsinnigen, ein negativer auf einen gegensinnigen Zusammenhang hin.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"why",
            html:"Ordinale Daten haben keine echten Abstände — ein Mittelwert wäre fragwürdig, eine Pearson-Korrelation streng genommen unzulässig. Spearman braucht nur die <b>Reihenfolge</b>, kommt mit Schulnoten und Zufriedenheits-Skalen klar und lässt sich von Ausreißern nicht aus der Ruhe bringen."},

          {t:"widget", title:"Spearman-Rechner — Ränge, d², \\(r_S\\) live", icon:"🏅",
            hint:"Editierbare Wertetabelle zweier ordinaler Merkmale (höher = besser = Rang 1). Start: das Skript-Leitbeispiel „Zufriedenheit Pflegeroboter × Gesundheit“ (n = 4, \\(r_S=0{,}8\\)). Ändere Werte, füge Objekte hinzu — Rangvergabe, \\(d_i\\), \\(d_i^2\\) und \\(r_S\\) (Kurzformel + Pearson-auf-Rängen) rechnen live mit.",
            render: renderSpearman},

          {t:"html", html:"<p class='muted'>Tipp: Das interaktive Scatter-Widget im nächsten Abschnitt zeigt Pearson <b>und</b> Spearman gleichzeitig — verschiebe Punkte zu einer Kurve und beobachte, wie \\(r_S\\) hoch bleibt, während \\(r\\) einbricht.</p>"}
        ]
      },

      /* --------------------------------------------------- 3.3 Pearson */
      {
        num:"3.3", title:"Korrelationsanalyse (Bravais-Pearson)",
        intro:"Der Klassiker für metrische Messwerte: misst den linearen Zusammenhang.",
        blocks: [
          {t:"p", lead:true, html:"Wenn beide Merkmale <b>metrisch</b> sind (echte Messwerte mit Abständen: Größe, Umsatz, Temperatur), ist der <b>Bravais-Pearson-Korrelationskoeffizient r</b> die Standard-Kennzahl. Er misst Stärke <i>und</i> Richtung eines <b>linearen</b> Zusammenhangs."},
          {t:"def", term:"Streudiagramm (Scatterplot)",
            html:"Darstellung der n Wertepaare \\((x_i,y_i)\\) als Punkte. Wolke von links-unten nach rechts-oben → positiv; von links-oben nach rechts-unten → negativ; strukturlose Wolke → \\(r\\approx0\\)."},
          {t:"def", term:"Korrelationskoeffizient \\(r_{x,y}\\)",
            html:"Auf \\([-1,1]\\) normierte Kovarianz. \\(+1\\) = perfekt positiv linear, \\(-1\\) = perfekt negativ linear, \\(0\\) = kein linearer Zusammenhang."},

          {t:"h", text:"Die Formeln", icon:"📐"},
          {t:"formula", tex:"r_{x,y}=\\frac{\\sum_{i=1}^{n}(x_i-\\bar x)(y_i-\\bar y)}{\\sqrt{\\sum_{i=1}^{n}(x_i-\\bar x)^2\\;\\sum_{i=1}^{n}(y_i-\\bar y)^2}}", caption:"Definitionsform"},
          {t:"formula", tex:"r_{x,y}=\\frac{\\overline{xy}-\\bar x\\,\\bar y}{\\sqrt{(\\overline{x^2}-\\bar x^2)(\\overline{y^2}-\\bar y^2)}},\\qquad \\overline{xy}=\\frac{1}{n}\\sum_{i=1}^{n}x_iy_i", caption:"Rechenform (mit Mittelwerten — oft schneller)"},
          {t:"def", term:"Kovarianz \\(s_{xy}\\)",
            html:"Mittleres Produkt der Abweichungen beider Merkmale vom jeweiligen Mittelwert. Positiv = gleichgerichtet, negativ = gegenläufig. r ist die durch beide Streuungen normierte Kovarianz."},
          {t:"formula", tex:"s_{xy}=\\frac{1}{n}\\sum_{i=1}^{n}(x_i-\\bar x)(y_i-\\bar y)=\\overline{xy}-\\bar x\\,\\bar y,\\qquad r_{x,y}=\\frac{s_{xy}}{s_x\\,s_y}", caption:"Kovarianz und ihr Zusammenhang mit r"},

          {t:"aha", title:"Die vier Ecken des Tanzparketts",
            html:"Lege das Fadenkreuz \\((\\bar x,\\bar y)\\) in die Mitte der Punktwolke. Jeder Punkt im <b>rechten-oberen</b> oder <b>linken-unteren</b> Eck „stimmt für positiv“ (Produkt \\((x-\\bar x)(y-\\bar y)>0\\)), jeder im linken-oberen oder rechten-unteren „stimmt für negativ“. r ist das <b>normierte Abstimmungsergebnis</b> aller Punkte. Im Scatter-Widget unten siehst du die Quadranten farbig."},

          {t:"h", text:"Leitbeispiel: Alter der Eltern (n = 12, Tabelle 27/28)", icon:"👪"},
          {t:"p", html:"Untersucht wird der Zusammenhang zwischen dem <b>Alter der Mutter (X)</b> und dem <b>Alter des Vaters (Y)</b> bei 12 Elternpaaren junger Patient:innen. Die Originaldaten:"},
          {t:"table",
            headers:["i","\\(x_i\\) (Alter Mutter)","\\(y_i\\) (Alter Vater)","\\(x_i-\\bar x\\)","\\(y_i-\\bar y\\)","Produkt","\\((x_i-\\bar x)^2\\)","\\((y_i-\\bar y)^2\\)"],
            rows:[
              ["1","56","60","4","3","12","16","9"],
              ["2","49","55","−3","−2","6","9","4"],
              ["3","48","46","−4","−11","44","16","121"],
              ["4","46","52","−6","−5","30","36","25"],
              ["5","47","56","−5","−1","5","25","1"],
              ["6","56","51","4","−6","−24","16","36"],
              ["7","57","71","5","14","70","25","196"],
              ["8","53","60","1","3","3","1","9"],
              ["9","58","61","6","4","24","36","16"],
              ["10","54","58","2","1","2","4","1"],
              ["11","47","49","−5","−8","40","25","64"],
              ["12","53","65","1","8","8","1","64"],
              ["<b>Σ</b>","<b>624</b>","<b>684</b>","0","0","<b>220</b>","<b>210</b>","<b>546</b>"]
            ],
            highlight:[12], compact:true,
            caption:"Hilfstabelle (Tabelle 28). \\(\\bar x=624/12=52\\), \\(\\bar y=684/12=57\\)."},

          {t:"example", title:"Schritt für Schritt durchgerechnet",
            html:
              "<b>Mittelwerte:</b> \\(\\bar x=\\tfrac{624}{12}=52\\), \\(\\bar y=\\tfrac{684}{12}=57\\).<br>"+
              "<b>Zähler</b> (Summe der Produkte): \\(\\sum(x_i-\\bar x)(y_i-\\bar y)=220\\).<br>"+
              "<b>Nenner:</b> \\(\\sqrt{\\sum(x_i-\\bar x)^2\\cdot\\sum(y_i-\\bar y)^2}=\\sqrt{210\\cdot 546}=\\sqrt{114660}\\approx 338{,}6\\).<br>"+
              "\\[r_{x,y}=\\frac{220}{\\sqrt{210\\cdot 546}}=\\frac{220}{338{,}6}\\approx \\mathbf{0{,}650}\\]"+
              "<b>Ergebnis:</b> r ≈ 0,65 → <b>starker, positiver linearer Zusammenhang</b>: Wenn die Mutter älter ist, so gilt dies in der Regel auch für den Vater und umgekehrt."},

          {t:"quote", html:"Der Korrelationskoeffizient nach Bravais-Pearson misst die Stärke und Richtung des linearen Zusammenhangs zwischen zwei metrisch skalierten Merkmalen.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"warn", tag:"Stolperfalle: r = 0",
            html:"\\(r=0\\) bedeutet nur „<b>kein LINEARER</b> Zusammenhang“. Ein perfekt-quadratischer Zusammenhang (z. B. \\(y=x^2\\)) kann ein r von praktisch null haben — und trotzdem ist y vollständig durch x bestimmt. Das demonstriert das letzte Widget eindrücklich."},
          {t:"quote", html:"Für r = 0 besteht kein linearer Zusammenhang zwischen den betrachteten Merkmalen. Man spricht auch davon, dass die Merkmale unkorreliert sind. Es kann aber einen Zusammenhang geben, der nicht linear, sondern bspw. quadratisch oder exponentiell ist.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"why",
            html:"Wann immer zwei echte Messgrößen vorliegen — Werbebudget ↔ Umsatz, Temperatur ↔ Eisverkauf, Lernstunden ↔ Punktzahl — ist r die Standard-Antwort auf „wie eng laufen die zusammen?“. Und die r=0-Warnung schützt dich vor dem teuersten Anfängerfehler."},

          {t:"widget", title:"Korrelations-Scatter — Pearson r & Spearman r_S live", icon:"🎯",
            hint:"Punkte <b>ziehen</b>, in die Fläche <b>klicken</b> (neuer Punkt) oder <b>rechtsklicken</b> (löschen). Pearson r, Spearman r_S und die goldene Regressionsgerade aktualisieren sich live. Start: das Eltern-Beispiel (r ≈ 0,65).",
            render: renderScatter}
        ]
      },

      /* --------------------------------------------------- 3.4 Auswahl */
      {
        num:"3.4", title:"Maßzahlen nach Skalenniveau & Korrelation ≠ Kausalität",
        intro:"Welches Verfahren wann — und warum „korreliert“ niemals „verursacht“ heißt.",
        blocks: [
          {t:"p", lead:true, html:"Jetzt der Überblick, der alles zusammenhält. Die drei Verfahren aus 3.1–3.3 deckst du mit <b>einer</b> Regel ab: <b>das schwächere der beiden Skalenniveaus entscheidet</b>."},
          {t:"def", term:"Schwächeres Skalenniveau",
            html:"Bei der Auswahl der Maßzahl ist immer das <b>niedrigere</b> Messniveau der beiden Merkmale ausschlaggebend (Rangordnung: nominal &lt; ordinal &lt; metrisch)."},

          {t:"h", text:"Die Auswahl-Matrix (Tabelle 29)", icon:"🗺️"},
          {t:"table",
            headers:["X \\ Y","nominal","ordinal","metrisch"],
            rows:[
              ["<b>nominal</b>","Kontingenz (χ², C, C*)","Kontingenz","Kontingenz"],
              ["<b>ordinal</b>","Kontingenz","Spearman \\(r_S\\)","Spearman \\(r_S\\)"],
              ["<b>metrisch</b>","Kontingenz","Spearman \\(r_S\\)","Bravais-Pearson \\(r\\)"]
            ],
            caption:"Lies immer das schwächere der beiden Niveaus ab. Symmetrisch: die Matrix ist gespiegelt gleich."},
          {t:"formula", tex:"\\text{Ma\\ss zahl}=f\\bigl(\\min(\\text{Skala}_X,\\ \\text{Skala}_Y)\\bigr)", caption:"die Auswahlregel als Formel"},

          {t:"example", title:"Auswahlregel in Aktion",
            html:
              "<ul>"+
              "<li>Geschlecht (nominal) × Lieblingsfarbe (nominal) → <b>Kontingenz</b> (χ², C, C*).</li>"+
              "<li>Schulnote (ordinal) × Zufriedenheit (ordinal) → <b>Spearman</b> \\(r_S\\).</li>"+
              "<li>Lernstunden (metrisch) × Note-als-Rang (ordinal) → schwächer = ordinal → <b>Spearman</b> \\(r_S\\).</li>"+
              "<li>Alter Mutter (metrisch) × Alter Vater (metrisch) → <b>Bravais-Pearson</b> \\(r\\).</li>"+
              "</ul>"},

          {t:"quote", html:"Bei der Wahl des geeigneten Zusammenhangsmaßes ist stets das niedrigere der beiden Skalenniveaus ausschlaggebend.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"h", text:"Symmetrie — und die große Warnung", icon:"⚠️"},
          {t:"p", html:"Alle drei Maße sind <b>symmetrisch</b>: \\(r(X,Y)=r(Y,X)\\). Sie sagen also <i>nichts</i> über die Richtung einer Ursache. Das ist der Übergang zur wichtigsten Lektion überhaupt:"},
          {t:"def", term:"Korrelation ≠ Kausalität",
            html:"Ein gemessener Zusammenhang belegt <b>keine</b> Ursache-Wirkungs-Beziehung. Er kann zufällig sein oder auf einer dritten Variable beruhen."},
          {t:"def", term:"Scheinkorrelation",
            html:"Zwei Merkmale korrelieren nur, weil beide von einer gemeinsamen <b>dritten Größe</b> (Confounder) abhängen — z. B. Eisverkauf & Sonnenbrände, gemeinsame Ursache: Sonne/Temperatur."},
          {t:"def", term:"Nonsens-/Unsinnskorrelation",
            html:"Ein rein zufälliger statistischer Zusammenhang <b>ohne jede</b> sachlogische Beziehung und <b>ohne</b> gemeinsame dritte Größe — der Klassiker: die schrumpfende Zahl der Piraten und der Anstieg der globalen Durchschnittstemperatur. Beide verlaufen über die Jahrhunderte gegenläufig, ohne das Geringste miteinander zu tun zu haben."},

          {t:"aha", title:"Der Storch bringt die Babys — eine Scheinkorrelation",
            html:"In Regionen mit mehr Störchen werden tatsächlich mehr Babys geboren — die Korrelation ist real und hoch. Die Ursache ist aber die <b>Ländlichkeit</b> als gemeinsame dritte Größe: viel Fläche → mehr Störche <i>und</i> mehr (kinderreiche) Familien. Damit ist es das Paradebeispiel einer <b>Scheinkorrelation</b> — eine starke Korrelation täuscht eine Kausalität nur <b>vor</b>."},

          {t:"quote", html:"Eine Korrelation darf nicht mit einer Kausalität verwechselt werden. Bei einer Scheinkorrelation wird der Zusammenhang durch eine dritte Variable verursacht.", source:"Bornewasser-Hermes, 2022 (sinngemäß)"},

          {t:"why",
            html:"Damit du (a) das richtige Verfahren wählst statt blind Pearson zu rechnen, und (b) seriös bleibst und aus „korreliert“ nie voreilig „verursacht“ machst. Das ist die wichtigste Anti-Fehler-Lektion für reale Datenanalyse — und für jede Schlagzeile, die behauptet, X mache schlau/krank/reich."},

          {t:"widget", title:"„Was bedeutet r = 0,3?“ — Korrelationsstärken im Vergleich", icon:"🖼️",
            hint:"Sechs Streudiagramme mit verschiedenen Korrelationsstärken nebeneinander — plus die berühmte Falle: eine Parabel mit r ≈ 0, die trotzdem einen perfekten Zusammenhang zeigt.",
            render: renderGallery}
        ]
      }
    ],

    quiz: [
      { q:"Welche Maßzahl verwendet man für den Zusammenhang zweier <b>nominalskalierter</b> Merkmale?",
        options:["Bravais-Pearson r","Spearman \\(r_S\\)","Kontingenzkoeffizient C / χ²","arithmetisches Mittel"],
        correct:2,
        explain:"Nominale Merkmale (Kategorien) → Kontingenzanalyse mit χ², C und C*. Mitteln oder Pearson sind hier unzulässig." },

      { q:"Eine 2×2-Kontingenztabelle hat n = 48 und χ² = 2,49. Wie groß ist der Kontingenzkoeffizient C = K?",
        options:["0,222","0,314","0,707","0,051"],
        correct:0,
        explain:"K = √(χ²/(χ²+n)) = √(2,49/(2,49+48)) = √(2,49/50,49) ≈ 0,222." },

      { q:"Mit K = 0,222 und \\(K_{max}=0{,}707\\) (M = 2): Wie groß ist das korrigierte C*?",
        options:["0,157","0,314","0,470","0,707"],
        correct:1,
        explain:"C* = K/K_max = 0,222/0,707 ≈ 0,314 — ein eher schwacher Zusammenhang." },

      { q:"Was bedeuten die erwarteten Häufigkeiten \\(\\tilde n_{ij}\\)?",
        options:["die tatsächlich beobachteten Werte","die Werte bei vollständiger Unabhängigkeit der Merkmale","die Randhäufigkeiten","die größte Zelle der Tabelle"],
        correct:1,
        explain:"\\(\\tilde n_{ij}=n_{i.}n_{.j}/n\\) ist die Häufigkeit, die zu erwarten wäre, wenn X und Y unabhängig sind. χ² misst die Abweichung davon." },

      { q:"Für n = 4 Beobachtungen ist Σd² = 2. Wie groß ist Spearmans \\(r_S\\)?",
        options:["0,5","0,2","0,8","−0,8"],
        correct:2,
        explain:"r_S = 1 − 6Σd²/(n(n²−1)) = 1 − (6·2)/(4·15) = 1 − 12/60 = 0,8 — starker gleichsinniger Zusammenhang." },

      { q:"Was misst Spearmans \\(r_S\\) im Gegensatz zu Pearsons r?",
        options:["nur lineare Zusammenhänge","monotone Zusammenhänge auf Basis der Ränge","kausale Zusammenhänge","absolute Häufigkeiten"],
        correct:1,
        explain:"Spearman korreliert die Ränge → erfasst monotone (auch nicht-lineare, aber gleichgerichtete) Zusammenhänge und ist robust gegen Ausreißer." },

      { q:"Was bedeutet \\(r_{x,y}=0\\)?",
        options:["Die Merkmale sind identisch","Es besteht ein perfekter Zusammenhang","Es besteht kein LINEARER Zusammenhang (ein nicht-linearer kann existieren)","Die Stichprobe ist zu klein"],
        correct:2,
        explain:"r = 0 heißt nur „unkorreliert“ im linearen Sinn. Ein quadratischer/exponentieller Zusammenhang kann trotzdem bestehen (siehe Parabel y = x²)." },

      { q:"Mit Σ(x−x̄)(y−ȳ)=220, Σ(x−x̄)²=210, Σ(y−ȳ)²=546: Wie groß ist r?",
        options:["0,40","0,65","0,82","1,00"],
        correct:1,
        explain:"r = 220/√(210·546) = 220/√114660 ≈ 220/338,6 ≈ 0,65 — starker positiver linearer Zusammenhang (Alter der Eltern)." },

      { q:"Ein Merkmal ist metrisch, das andere ordinal. Welche Maßzahl ist korrekt?",
        options:["Pearson r","Spearman \\(r_S\\)","Kontingenz C","Kovarianz"],
        correct:1,
        explain:"Das schwächere Skalenniveau entscheidet. Metrisch + ordinal → schwächer ist ordinal → Spearman." },

      { q:"„Mehr Störche → mehr Geburten“ ist ein Beispiel für …",
        options:["Kausalität","perfekte Korrelation","Scheinkorrelation (gemeinsame dritte Variable)","negative Korrelation"],
        correct:2,
        explain:"Beide hängen von der Ländlichkeit/Fläche ab. Die Korrelation ist echt, eine Kausalität gibt es nicht — klassische Scheinkorrelation." }
    ]
  });

})();
