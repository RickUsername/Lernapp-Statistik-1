/* ============================================================
   LEKTION 7 — Statistische Schätzverfahren (BSTA01-02)
   7.1 Punktschätzung · 7.2 Intervallschätzung
   Leitbeispiel: Mitarbeiterbefragung, Unternehmenszugehörigkeit
   Daten: [12, 8, 16, 10, 6, 10, 14, 12], n=8
   ============================================================ */
(function(){
  "use strict";

  /* ---- lokale Konstanten/Helfer (kollidieren nie, weil IIFE) ---- */
  const DATA = [12, 8, 16, 10, 6, 10, 14, 12];   // Urliste aus dem Skript (S. 184)
  const MU_TRUE = 11;                            // wahrer Mittelwert (= x̄ der Stichprobe)
  const SIGMA_TRUE = 3;                          // wahres σ (Skript: σ²=9)

  // z-Quantil zu einem Konfidenzniveau (1-α) -> z_{1-α/2}
  function zFor(level){ return Math.abs(window.App.Stats.normalInv(1 - (1-level)/2)); }
  // Box-Muller: eine N(mu,sigma)-Zufallszahl
  function gauss(mu, sigma){
    let u=0,v=0;
    while(u===0) u=Math.random();
    while(v===0) v=Math.random();
    return mu + sigma*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  /* ============================================================
     WIDGET 0 — Erwartungstreue-Simulator (Abschnitt 7.1)
     Zieht Stichproben aus N(µ,σ) und zeigt die Punktschätzer
     x̄, s² (Nenner n−1) und σ̂²ₙ (Nenner n) im Vergleich.
     Viele-Stichproben-Modus: Histogramm der x̄ + Mittel der
     Schätzwerte → erwartungstreu (n−1) vs. verzerrt (n).
     ============================================================ */
  function renderPunktschaetzer(elm, ctx){
    const {el, Stats, fmt, PAL} = ctx;

    // --- State ---
    const state = { mu:11, sigma:3, n:8, sample:null };

    // ---------- Steuerelemente ----------
    // µ-Slider
    const muVal = el("span",{class:"val"}, "11");
    const muSlider = el("input",{type:"range",min:"0",max:"30",step:"1",value:"11"});
    const muCtrl = el("div",{class:"ctrl"},
      el("label",{}, "wahrer Erwartungswert µ ", muVal), muSlider);

    // σ-Slider
    const sigVal = el("span",{class:"val"}, "3,0");
    const sigSlider = el("input",{type:"range",min:"0.5",max:"8",step:"0.1",value:"3"});
    const sigCtrl = el("div",{class:"ctrl"},
      el("label",{}, "wahre Streuung σ ", sigVal), sigSlider);

    // n-Slider
    const nVal = el("span",{class:"val"}, "8");
    const nSlider = el("input",{type:"range",min:"2",max:"50",step:"1",value:"8"});
    const nCtrl = el("div",{class:"ctrl"},
      el("label",{}, "Stichprobenumfang n ", nVal), nSlider);

    const ctrlRow = el("div",{class:"ctrl-row"}, muCtrl, sigCtrl, nCtrl);

    // ---------- Buttons ----------
    const btnOne  = el("button",{class:"btn primary"},"🎲 Stichprobe ziehen");
    const btnMany = el("button",{class:"btn"},"📊 500 Stichproben simulieren");
    const btnRow  = el("div",{class:"btn-row"}, btnOne, btnMany);

    // ---------- Ausgaben ----------
    const truthLine = el("p",{class:"widget-hint"});
    const readout   = el("div",{class:"readout"});
    const sampleBox = el("div",{class:"tbl-wrap", style:{margin:"10px 0"}});
    const msg       = el("p",{class:"widget-hint"});

    elm.appendChild(ctrlRow);
    elm.appendChild(btnRow);
    elm.appendChild(truthLine);
    elm.appendChild(readout);
    elm.appendChild(sampleBox);

    // Chart-Container (nur im Viele-Modus befüllt)
    const cw = el("div",{class:"canvas-wrap", style:{height:"300px", marginTop:"12px", display:"none"}});
    const canvas = el("canvas");
    cw.appendChild(canvas);
    elm.appendChild(cw);
    elm.appendChild(msg);

    function stat(v,l,kind){
      return el("div",{class:"stat"+(kind?" "+kind:"")},
        el("div",{class:"v"}, v), el("div",{class:"l"}, l));
    }

    function drawSampleN(n){
      const arr=[];
      for(let i=0;i<n;i++) arr.push(gauss(state.mu, state.sigma));
      return arr;
    }

    function updateTruth(){
      truthLine.innerHTML = "Grundgesamtheit (das Wahre): µ = <b>"+fmt.n(state.mu,0)+"</b>, "
        + "σ = <b>"+fmt.n(state.sigma,2)+"</b>, also σ² = <b>"+fmt.n(state.sigma*state.sigma,2)+"</b>. "
        + "Die Punktschätzer kennen diese Werte <i>nicht</i> — sie sehen nur die Stichprobe.";
    }

    // ---------- Einzelne Stichprobe ----------
    function runSingle(){
      cw.style.display="none";
      const s = drawSampleN(state.n);
      state.sample = s;

      const xbar  = Stats.mean(s);
      const s2    = Stats.variance(s);      // Nenner n−1 (erwartungstreu)
      const s2pop = Stats.variancePop(s);   // Nenner n   (verzerrt, zu klein)
      const sd    = Stats.sd(s);            // √s²

      // Stichprobe als kleine Tabelle
      sampleBox.innerHTML="";
      const tbl = el("table",{class:"data"});
      const thead = el("tr",{}, el("th",{html:"i"}));
      for(let i=0;i<s.length;i++) thead.appendChild(el("th",{text:String(i+1)}));
      const trow = el("tr",{}, el("td",{html:"x<sub>i</sub>"}));
      for(let i=0;i<s.length;i++) trow.appendChild(el("td",{text:fmt.n(s[i],1)}));
      tbl.appendChild(thead); tbl.appendChild(trow);
      sampleBox.appendChild(tbl);

      readout.innerHTML="";
      readout.appendChild(stat(fmt.n(xbar,2), "x̄  (Schätzer für µ)", "teal"));
      readout.appendChild(stat(fmt.n(s2,2),   "s²  (Nenner n−1) → σ²", "good"));
      readout.appendChild(stat(fmt.n(sd,2),   "s = √s²  (Schätzer für σ)", "violet"));
      readout.appendChild(stat(fmt.n(s2pop,2),"σ̂²ₙ (Nenner n)", "bad"));

      const dxbar = xbar - state.mu;
      msg.innerHTML = "<b>Eine</b> Stichprobe vom Umfang n="+state.n+". "
        + "Der Mittelwert x̄ = "+fmt.n(xbar,2)+" liegt "
        + (Math.abs(dxbar)<0.01 ? "genau auf" : (dxbar>0?"über":"unter"))
        + " dem wahren µ = "+fmt.n(state.mu,0)+" — mal drüber, mal drunter, das ist normal. "
        + "Schau auf die letzten beiden Kacheln: <b>s²</b> (Nenner n−1, grün) gegen "
        + "<b>σ̂²ₙ</b> (Nenner n, rot). Die rote Variante ist <i>immer</i> kleiner. "
        + "Ob das systematisch ist, zeigt erst die Simulation. Drück „500 Stichproben“.";
    }

    // ---------- Viele Stichproben ----------
    function runMany(){
      const REP = 500;
      const xbars=[], s2s=[], s2pops=[];
      for(let r=0;r<REP;r++){
        const s = drawSampleN(state.n);
        xbars.push(Stats.mean(s));
        s2s.push(Stats.variance(s));     // n−1
        s2pops.push(Stats.variancePop(s)); // n
      }
      const meanXbar = Stats.mean(xbars);
      const meanS2   = Stats.mean(s2s);
      const meanS2p  = Stats.mean(s2pops);
      const sigma2   = state.sigma*state.sigma;

      // letzte Einzel-Stichprobe in der Tabelle stehen lassen oder leeren
      sampleBox.innerHTML="";

      readout.innerHTML="";
      readout.appendChild(stat(fmt.n(meanXbar,2), "Ø x̄  (≈ µ = "+fmt.n(state.mu,0)+")", "teal"));
      readout.appendChild(stat(fmt.n(meanS2,2),   "Ø s² (n−1)  (≈ σ² = "+fmt.n(sigma2,2)+")", "good"));
      readout.appendChild(stat(fmt.n(meanS2p,2),  "Ø σ̂²ₙ (n)  (zu klein)", "bad"));

      // ---- Histogramm der x̄ ----
      const lo = Math.min.apply(null, xbars), hi = Math.max.apply(null, xbars);
      const span = (hi-lo) || 1;
      const K = 18;
      const w = span / K;
      const labels=[], counts=new Array(K).fill(0);
      for(let i=0;i<K;i++) labels.push(fmt.n(lo + (i+0.5)*w, 1));
      xbars.forEach(v=>{
        let k = Math.floor((v-lo)/w);
        if(k<0) k=0; if(k>=K) k=K-1;
        counts[k]++;
      });
      // µ-Markierung: in welchen Bin fällt das wahre µ?
      const bars = counts.map((c,i)=>{
        const center = lo + (i+0.5)*w;
        const isMu = Math.abs(center - state.mu) <= w/2;
        return isMu ? PAL.gold : "rgba(94,211,154,.65)";
      });

      cw.style.display="";
      ctx.makeChart(canvas, {
        type:"bar",
        data:{ labels:labels, datasets:[{
          label:"Anzahl Stichproben mit diesem x̄",
          data:counts, backgroundColor:bars,
          borderColor:"rgba(0,0,0,0)", barPercentage:1.0, categoryPercentage:1.0
        }]},
        options:{ responsive:true, maintainAspectRatio:false,
          scales:{
            y:{ beginAtZero:true, title:{display:true, text:"Häufigkeit"} },
            x:{ title:{display:true, text:"Stichproben-Mittelwert x̄ (gold = wahres µ)"} }
          },
          plugins:{ legend:{display:false},
            tooltip:{ callbacks:{ label:function(item){ return item.parsed.y+" Stichproben"; }}}}}
      });

      const errP = (meanS2p - sigma2) / sigma2 * 100;
      msg.innerHTML = "<b>"+REP+" Stichproben</b> (je n="+state.n+"). "
        + "Das Histogramm zeigt die Verteilung der "+REP+" Mittelwerte x̄ — sie häufen sich "
        + "schön symmetrisch um das wahre µ (goldener Balken). Ihr Durchschnitt "
        + "<b>Ø x̄ = "+fmt.n(meanXbar,2)+"</b> trifft µ = "+fmt.n(state.mu,0)+" praktisch exakt: "
        + "x̄ ist <b>erwartungstreu</b>. "
        + "Genauso liegt <span style='color:"+PAL.good+"'>Ø s² (n−1) = "+fmt.n(meanS2,2)+"</span> "
        + "im Mittel bei σ² = "+fmt.n(sigma2,2)+" — auch s² ist erwartungstreu. "
        + "<span style='color:"+PAL.bad+"'>Ø σ̂²ₙ (n) = "+fmt.n(meanS2p,2)+"</span> dagegen unterschätzt σ² "
        + "systematisch um ca. "+fmt.n(Math.abs(errP),1)+" % — genau die Verzerrung, die der Faktor "
        + "\\(\\tfrac{n}{n-1}\\) korrigiert. Verkleinere n und wiederhole: bei kleinem n klafft die "
        + "Lücke weiter auf.";
      ctx.typeset(msg);
    }

    // ---------- Events ----------
    muSlider.addEventListener("input", ()=>{
      state.mu = +muSlider.value; muVal.textContent = String(state.mu); updateTruth();
    });
    sigSlider.addEventListener("input", ()=>{
      state.sigma = +sigSlider.value; sigVal.textContent = fmt.n(state.sigma,1); updateTruth();
    });
    nSlider.addEventListener("input", ()=>{
      state.n = +nSlider.value; nVal.textContent = String(state.n);
    });
    btnOne.addEventListener("click", runSingle);
    btnMany.addEventListener("click", runMany);

    // ---------- Start ----------
    updateTruth();
    runSingle();
  }

  /* ============================================================
     WIDGET 1 — Konfidenzintervall-Visualizer (Abschnitt 7.2)
     Einzel-KI: Glockenkurve der Mittelwerte + KI eingezeichnet.
     Simulation: 100 Stichproben -> wie viele überdecken µ?
     ============================================================ */
  function renderKIVisualizer(elm, ctx){
    const {el, Stats, Plot, fmt, PAL} = ctx;

    // --- State ---
    const state = { n:8, level:0.95, sigma:3, mode:"single", samples:null };

    // ---------- Steuerelemente ----------
    // Modus-Umschalter
    const tabSingle = el("button",{class:"btn primary"},"Einzel-KI");
    const tabSim    = el("button",{class:"btn ghost"},"Simulation (100 Stichproben)");
    const tabs = el("div",{class:"btn-row"}, tabSingle, tabSim);

    // n-Slider
    const nVal = el("span",{class:"val"}, "8");
    const nSlider = el("input",{type:"range",min:"2",max:"100",step:"1",value:"8"});
    const nCtrl = el("div",{class:"ctrl"},
      el("label",{}, "Stichprobenumfang n ", nVal), nSlider);

    // σ-Slider
    const sVal = el("span",{class:"val"}, "3,00");
    const sSlider = el("input",{type:"range",min:"0.5",max:"8",step:"0.1",value:"3"});
    const sCtrl = el("div",{class:"ctrl"},
      el("label",{}, "Streuung σ ", sVal), sSlider);

    // Konfidenzniveau-Chips
    const chip90 = el("button",{class:"chip"},"90 %");
    const chip95 = el("button",{class:"chip active"},"95 %");
    const chip99 = el("button",{class:"chip"},"99 %");
    const chips = el("div",{class:"chips"}, chip90, chip95, chip99);
    const chipWrap = el("div",{class:"ctrl"}, el("label",{}, "Konfidenzniveau ", el("span",{class:"val"},"1−α")), chips);

    const ctrlRow = el("div",{class:"ctrl-row"}, nCtrl, sCtrl, chipWrap);

    // Simulations-Button (nur im Sim-Modus sichtbar)
    const reroll = el("button",{class:"btn"},"🎲 Neu ziehen");
    const rerollRow = el("div",{class:"btn-row", style:{display:"none"}}, reroll);

    // ---------- Ausgabe ----------
    const readout = el("div",{class:"readout"});
    const msg = el("p",{class:"widget-hint"});

    // ---------- Plot ----------
    const plotBox = el("div");
    const P = ctx.Plot(plotBox, {height:300, padL:48, padB:40});
    ctx.onCleanup(()=>P.destroy());

    elm.appendChild(tabs);
    elm.appendChild(ctrlRow);
    elm.appendChild(rerollRow);
    elm.appendChild(readout);
    elm.appendChild(plotBox);
    elm.appendChild(msg);

    // ---------- Berechnungen ----------
    function newSamples(){
      const z = zFor(state.level), se = state.sigma/Math.sqrt(state.n);
      const arr = [];
      for(let j=0;j<100;j++){
        // Stichprobe ziehen und x̄_j bilden
        let s=0; for(let i=0;i<state.n;i++) s += gauss(MU_TRUE, state.sigma);
        const xbar = s/state.n;
        const lo = xbar - z*se, hi = xbar + z*se;
        arr.push({xbar, lo, hi, hit: (lo<=MU_TRUE && MU_TRUE<=hi)});
      }
      state.samples = arr;
    }

    // ---------- Zeichnen: Einzel-KI ----------
    function drawSingle(){
      const z = zFor(state.level);
      const se = state.sigma/Math.sqrt(state.n);
      const lo = MU_TRUE - z*se, hi = MU_TRUE + z*se;

      // x-Bereich großzügig um µ (4 SE in jede Richtung, min. ±1)
      const span = Math.max(4*se, 1);
      const xmin = MU_TRUE - span, xmax = MU_TRUE + span;
      const peak = 1/(se*Math.sqrt(2*Math.PI));
      P.setX(xmin, xmax).setY(0, peak*1.15);

      const pdf = x => Stats.normalPdf(x, MU_TRUE, se);
      P.clear().axes({xlabel:"Mittelwert x̄ (Jahre)", ylabel:"Dichte", yticks:4,
        xfmt:v=>fmt.n(v,1), yfmt:()=>""});
      // zentrale Fläche 1-α
      P.area(pdf, lo, hi, {color:"rgba(94,211,154,.22)"});
      // Randflächen α/2
      P.area(pdf, xmin, lo, {color:"rgba(240,114,111,.20)"});
      P.area(pdf, hi, xmax, {color:"rgba(240,114,111,.20)"});
      // Glocke
      P.func(pdf, {color:PAL.teal, width:2.4});
      // Grenzen + µ
      P.vline(lo, {color:PAL.gold, width:2});
      P.vline(hi, {color:PAL.gold, width:2});
      P.vline(MU_TRUE, {color:"#e8ecf4", width:1.6, dash:[3,3]});
      // Beschriftung
      P.text(lo, peak*1.02, "UG "+fmt.n(lo,2), {align:"center", color:PAL.gold, px:false});
      P.text(hi, peak*1.02, "OG "+fmt.n(hi,2), {align:"center", color:PAL.gold, px:false});
      P.text(MU_TRUE, peak*1.10, "µ="+fmt.n(MU_TRUE,0), {align:"center", color:"#e8ecf4"});

      // Readout
      const width = hi-lo;
      readout.innerHTML="";
      readout.appendChild(stat(fmt.n(MU_TRUE,0), "x̄ = µ", ""));
      readout.appendChild(stat(fmt.n(z,3), "z-Quantil", "blue"));
      readout.appendChild(stat(fmt.n(se,3), "Standardfehler σ/√n", "violet"));
      readout.appendChild(stat("["+fmt.n(lo,2)+"; "+fmt.n(hi,2)+"]", "Konfidenzintervall", "teal"));
      readout.appendChild(stat(fmt.n(width,2), "Breite", "good"));

      msg.innerHTML = "Stell dir vor, du erhöhst <b>n</b> oder senkst das <b>Konfidenzniveau</b> — "
        + "das Intervall wird schmaler (präziser). Drehst du an <b>σ</b> hoch, wird es breiter. "
        + "Das sind genau die <i>Einflussfaktoren</i> aus dem Skript (S. 196).";
    }

    // ---------- Zeichnen: Simulation ----------
    function drawSim(){
      if(!state.samples) newSamples();
      const arr = state.samples;
      const hits = arr.filter(s=>s.hit).length;

      // x-Achse: Spannweite über alle Grenzen
      let lo=Infinity, hi=-Infinity;
      arr.forEach(s=>{ lo=Math.min(lo,s.lo); hi=Math.max(hi,s.hi); });
      const pad=(hi-lo)*0.05 || 1;
      P.setX(lo-pad, hi+pad).setY(0, 101);
      P.clear().axes({xlabel:"Jahre Unternehmenszugehörigkeit", ylabel:"Stichprobe Nr.",
        yticks:5, xfmt:v=>fmt.n(v,1), yfmt:v=>fmt.n(v,0)});
      // wahres µ
      P.vline(MU_TRUE, {color:"#e8ecf4", width:1.8, dash:[4,3]});
      P.text(MU_TRUE, 100, "µ="+fmt.n(MU_TRUE,0), {align:"center", color:"#e8ecf4"});
      // jede Stichprobe als horizontaler Strich
      arr.forEach((s,j)=>{
        const y = j+1;
        const col = s.hit ? PAL.good : PAL.bad;
        P.line([[s.lo,y],[s.hi,y]], {color:col, width:1.6});
        P.points([[s.xbar,y]], {color:col, r:1.8, stroke:null});
      });

      // Readout
      readout.innerHTML="";
      readout.appendChild(stat(fmt.n(state.level*100,0)+" %", "Soll-Überdeckung", "blue"));
      readout.appendChild(stat(hits+" / 100", "treffen µ", "good"));
      readout.appendChild(stat((100-hits)+" / 100", "verfehlen µ", "bad"));
      readout.appendChild(stat(fmt.n(hits,0)+" %", "Ist-Überdeckung", "teal"));

      msg.innerHTML = "Jeder Strich ist <b>eine</b> Stichprobe mit ihrem eigenen KI. "
        + "<span style='color:"+PAL.good+"'>Grün</span> = das Intervall überdeckt das wahre µ, "
        + "<span style='color:"+PAL.bad+"'>rot</span> = es verfehlt es. "
        + "Bei "+fmt.n(state.level*100,0)+" % Konfidenz erwartet man rund "+fmt.n(state.level*100,0)
        + " grüne — <b>so</b> ist das Konfidenzniveau zu lesen, nicht als „µ liegt zu "
        + fmt.n(state.level*100,0)+" % in diesem einen Intervall“.";
    }

    function stat(v,l,kind){
      return el("div",{class:"stat"+(kind?" "+kind:"")},
        el("div",{class:"v"}, v), el("div",{class:"l"}, l));
    }

    function draw(){ state.mode==="single" ? drawSingle() : drawSim(); }
    P.onResize = draw;

    // ---------- Events ----------
    nSlider.addEventListener("input", ()=>{
      state.n = +nSlider.value; nVal.textContent = String(state.n);
      if(state.mode==="sim") newSamples();
      draw();
    });
    sSlider.addEventListener("input", ()=>{
      state.sigma = +sSlider.value; sVal.textContent = fmt.n(state.sigma,2);
      if(state.mode==="sim") newSamples();
      draw();
    });
    function setLevel(lv, active){
      state.level = lv;
      [chip90,chip95,chip99].forEach(c=>c.classList.remove("active"));
      active.classList.add("active");
      if(state.mode==="sim") newSamples();
      draw();
    }
    chip90.addEventListener("click", ()=>setLevel(0.90, chip90));
    chip95.addEventListener("click", ()=>setLevel(0.95, chip95));
    chip99.addEventListener("click", ()=>setLevel(0.99, chip99));

    function setMode(m){
      state.mode = m;
      if(m==="single"){
        tabSingle.className="btn primary"; tabSim.className="btn ghost";
        rerollRow.style.display="none";
      }else{
        tabSingle.className="btn ghost"; tabSim.className="btn primary";
        rerollRow.style.display="";
        newSamples();
      }
      draw();
    }
    tabSingle.addEventListener("click", ()=>setMode("single"));
    tabSim.addEventListener("click", ()=>setMode("sim"));
    reroll.addEventListener("click", ()=>{ newSamples(); draw(); });

    draw();
  }

  /* ============================================================
     WIDGET 2 — t-Verteilung vs. Standardnormalverteilung
     df-Slider; beide Dichten überlagert; Quantile markiert.
     ============================================================ */
  function renderTvsNormal(elm, ctx){
    const {el, Stats, fmt, PAL} = ctx;
    const state = { df:7 };

    const dfVal = el("span",{class:"val"}, "7");
    const dfSlider = el("input",{type:"range",min:"1",max:"40",step:"1",value:"7"});
    const dfCtrl = el("div",{class:"ctrl"},
      el("label",{}, "Freiheitsgrade df = n−1 ", dfVal), dfSlider);
    const ctrlRow = el("div",{class:"ctrl-row"}, dfCtrl);

    const readout = el("div",{class:"readout"});
    const plotBox = el("div");
    const P = ctx.Plot(plotBox, {height:300, padL:46, padB:40});
    ctx.onCleanup(()=>P.destroy());
    const msg = el("p",{class:"widget-hint"});

    elm.appendChild(ctrlRow);
    elm.appendChild(readout);
    elm.appendChild(plotBox);
    elm.appendChild(msg);

    function stat(v,l,kind){
      return el("div",{class:"stat"+(kind?" "+kind:"")},
        el("div",{class:"v"}, v), el("div",{class:"l"}, l));
    }

    function draw(){
      const df = state.df;
      P.setX(-4,4).setY(0,0.45);
      P.clear().axes({xlabel:"t bzw. z", ylabel:"Dichte", yticks:4,
        xfmt:v=>fmt.n(v,0), yfmt:v=>fmt.n(v,2)});

      const z975 = Math.abs(Stats.normalInv(0.975));   // 1,96
      const t975 = Math.abs(Stats.tQuantile(0.975, df));

      // Marker für die 0,975-Quantile (zur Veranschaulichung der Schwänze)
      P.vline(z975, {color:"rgba(95,168,255,.55)", width:1.4, dash:[4,3]});
      P.vline(-z975,{color:"rgba(95,168,255,.55)", width:1.4, dash:[4,3]});
      P.vline(t975, {color:"rgba(231,181,76,.65)", width:1.4, dash:[4,3]});
      P.vline(-t975,{color:"rgba(231,181,76,.65)", width:1.4, dash:[4,3]});

      // Normalverteilung (konstant) — blau
      P.func(x=>Stats.normalPdf(x), {color:PAL.blue, width:2.2});
      // t-Verteilung — gold, df live
      P.func(x=>Stats.tPdf(x, df), {color:PAL.gold, width:2.6});

      // Legende
      P.text(P.w()-12, 14, "—  Normal (z)", {px:true, align:"right", color:PAL.blue});
      P.text(P.w()-12, 30, "—  t (df="+df+")", {px:true, align:"right", color:PAL.gold});

      readout.innerHTML="";
      readout.appendChild(stat("df = "+df, "Freiheitsgrade", ""));
      readout.appendChild(stat(fmt.n(t975,3), "t-Quantil (0,975)", "gold"));
      readout.appendChild(stat(fmt.n(z975,3), "z-Quantil (0,975)", "blue"));
      readout.appendChild(stat(fmt.n(t975-z975,3), "Aufschlag t − z", "violet"));

      let note;
      if(df<=2){
        note = "Bei winzigem df sind die t-Schwänze extrem dick — du weißt fast nichts über σ.";
      }else if(Math.abs(t975-z975)<0.05){
        note = "Ab df≈30 ist t praktisch deckungsgleich mit der Normalverteilung — der „Sicherheitsaufschlag“ verschwindet.";
      }else if(df===7){
        note = "df=7 entspricht dem Leitbeispiel (n=8). Hier ist t<sub>7;0,975</sub>="+fmt.n(t975,3)
             + " — genau der Skriptwert 2,365, deutlich größer als 1,96.";
      }else{
        note = "Je kleiner df, desto dicker die t-Ränder (mehr Unsicherheit) — und desto breiter wird ein t-Konfidenzintervall.";
      }
      msg.innerHTML = "<b>"+ (df===7?"Leitbeispiel: ":"") +"</b>" + note;
    }
    P.onResize = draw;

    dfSlider.addEventListener("input", ()=>{
      state.df = +dfSlider.value; dfVal.textContent = String(state.df);
      draw();
    });

    draw();
  }

  /* ============================================================
     LEKTION-OBJEKT
     ============================================================ */
  window.App.registerLesson({
    id: 7,
    title: "Statistische Schätzverfahren",

    formulas: [
      { group:"Lektion 7 · Punktschätzung", name:"Punktschätzer Erwartungswert",
        tex:"\\hat{\\mu}=\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i", note:"Stichprobenmittel" },
      { group:"Lektion 7 · Punktschätzung", name:"Punktschätzer Varianz (Skript-Form)",
        tex:"\\hat{\\sigma}^2=s^2=\\frac{n}{n-1}\\left(\\overline{x^2}-\\bar{x}^2\\right)", note:"korrigiert, Nenner n−1" },
      { group:"Lektion 7 · Punktschätzung", name:"Varianz (äquivalente Lesart)",
        tex:"s^2=\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2", note:"erwartungstreu für σ²" },
      { group:"Lektion 7 · Punktschätzung", name:"Punktschätzer Standardabweichung",
        tex:"\\hat{\\sigma}=s=\\sqrt{s^2}", note:"nicht erwartungstreu für σ" },
      { group:"Lektion 7 · Punktschätzung", name:"Mittel der Quadrate (Hilfsgröße)",
        tex:"\\overline{x^2}=\\frac{1}{n}\\sum_{i=1}^{n}x_i^2" },
      { group:"Lektion 7 · Intervallschätzung", name:"KI für µ bei bekannter Varianz",
        tex:"\\left[\\,\\bar{x}-z_{1-0{,}5\\alpha}\\cdot\\tfrac{\\sigma}{\\sqrt{n}}\\;;\\;\\;\\bar{x}+z_{1-0{,}5\\alpha}\\cdot\\tfrac{\\sigma}{\\sqrt{n}}\\,\\right]",
        note:"z-Quantil, σ bekannt" },
      { group:"Lektion 7 · Intervallschätzung", name:"KI für µ bei unbekannter Varianz",
        tex:"\\left[\\,\\bar{x}-t_{n-1;\\,1-0{,}5\\alpha}\\cdot\\tfrac{s}{\\sqrt{n}}\\;;\\;\\;\\bar{x}+t_{n-1;\\,1-0{,}5\\alpha}\\cdot\\tfrac{s}{\\sqrt{n}}\\,\\right]",
        note:"t-Quantil, σ durch s geschätzt" },
      { group:"Lektion 7 · Intervallschätzung", name:"z-Quantil (Beispiel 95 %)",
        tex:"z_{1-0{,}5\\alpha}=z_{1-0{,}5\\cdot 0{,}05}=z_{0{,}975}=1{,}96" },
      { group:"Lektion 7 · Intervallschätzung", name:"t-Quantil (Beispiel 95 %, n=8)",
        tex:"t_{n-1;\\,1-0{,}5\\alpha}=t_{7;\\,0{,}975}=2{,}365" },
      { group:"Lektion 7 · Intervallschätzung", name:"Standardfehler",
        tex:"\\mathrm{SE}=\\frac{\\sigma}{\\sqrt{n}}\\quad\\text{bzw.}\\quad \\frac{s}{\\sqrt{n}}",
        note:"Abweichung von x̄ vom wahren Wert" },
      { group:"Lektion 7 · Intervallschätzung", name:"Freiheitsgrade",
        tex:"df=n-1" }
    ],

    sections: [

      /* ===================== 7.1 PUNKTSCHÄTZUNG ===================== */
      {
        num:"7.1",
        title:"Punktschätzung",
        intro:"Eine Stichprobe, ein einziger Wert für die ganze Grundgesamtheit — bequem, aber riskant.",
        blocks: [
          {t:"p", lead:true, html:"Du hast nie die ganze Belegschaft, alle Wähler oder sämtliche Werkstücke vor dir — du hast eine <b>Stichprobe</b>. Die Punktschätzung ist die einfachste Antwort auf die Frage „Was ist denn jetzt <i>der</i> Wert für die Grundgesamtheit?“: Man legt sich auf <b>genau eine Zahl</b> fest."},

          {t:"p", html:"Das Schöne: rechnerisch ist nichts Neues nötig. Mittelwert, Stichprobenvarianz und Standardabweichung berechnest du wie immer — und erklärst diese Stichprobenwerte zu deinen besten Schätzungen für die unbekannten Parameter der Grundgesamtheit."},

          {t:"h", icon:"✒️", text:"Notation: Wer trägt welchen Hut?"},
          {t:"p", html:"Statistik liebt ihre Buchstaben. Merke dir zwei Ebenen:"},
          {t:"list", items:[
            "<b>Grundgesamtheit</b> (das Unbekannte, Wahre): griechische Buchstaben — \\(\\mu\\) (Erwartungswert), \\(\\sigma^2\\) (Varianz), \\(\\sigma\\) (Standardabweichung).",
            "<b>Stichprobe</b> (das, was du gemessen hast): lateinische Buchstaben — \\(\\bar{x}\\), \\(s^2\\), \\(s\\).",
            "<b>Schätzwert</b> für einen Grundgesamtheits-Parameter: bekommt ein <b>Dach</b> — \\(\\hat{\\mu}\\), \\(\\hat{\\sigma}^2\\), \\(\\hat{\\sigma}\\). Das Dach heißt: „geschätzt, nicht gewusst.“"
          ]},

          {t:"def", term:"Punktschätzung", title:"Definition",
            html:"Die Punktschätzung schätzt mit <b>einem konkreten Wert</b> den wahren Parameter der Grundgesamtheit auf Basis einer Stichprobe ab. <span class='muted'>(Skript S. 184)</span>"},

          {t:"h", icon:"🎯", text:"Was macht einen Schätzer gut?"},
          {t:"def", term:"Erwartungstreu (unverzerrt)", title:"Gütekriterium 1",
            html:"Ein Schätzer ist <b>erwartungstreu</b>, wenn der über viele Stichproben gemittelte Schätzwert mit dem wahren Parameter der Grundgesamtheit übereinstimmt — also kein systematischer Versatz. <span class='muted'>(Skript S. 185)</span>"},
          {t:"def", term:"Konsistent", title:"Gütekriterium 2",
            html:"Ein Schätzer ist <b>konsistent</b>, wenn er mit wachsendem Stichprobenumfang den wahren Wert immer besser trifft. Mehr Daten ⇒ präziser. <span class='muted'>(Skript S. 185)</span>"},

          {t:"h", icon:"📐", text:"Die drei Punktschätzer"},
          {t:"p", html:"Erwartungswert: der Stichprobenmittelwert."},
          {t:"formula", tex:"\\hat{\\mu}=\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i", caption:"Punktschätzer für den Erwartungswert µ"},

          {t:"p", html:"Varianz: die <b>korrigierte</b> Stichprobenvarianz. Das Skript benutzt die rechnerisch praktische Verschiebungsform (\\(\\overline{x^2}\\) = Mittel der Quadrate):"},
          {t:"formula", tex:"\\hat{\\sigma}^2=s^2=\\frac{n}{n-1}\\left(\\overline{x^2}-\\bar{x}^2\\right)", caption:"Punktschätzer für die Varianz σ² (effektiver Nenner n−1)"},
          {t:"p", html:"Das ist algebraisch dasselbe wie die vertraute Summenform:"},
          {t:"formula", tex:"s^2=\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2", caption:"äquivalente Lesart"},

          {t:"p", html:"Standardabweichung: einfach die Wurzel daraus."},
          {t:"formula", tex:"\\hat{\\sigma}=s=\\sqrt{s^2}", caption:"Punktschätzer für die Standardabweichung σ"},

          {t:"why", title:"Warum brauche ich das?",
            html:"Jede Umfrage, jede Marktforschung, jede Stichprobenkontrolle liefert dir nur einen Ausschnitt. Der Punktschätzer ist die direkteste Antwort auf „Welcher Einzelwert beschreibt die ganze Grundgesamtheit am besten?“ — die Grundlage für Hochrechnungen, Reportings und alle weiterführenden Verfahren."},

          {t:"aha", title:"Aha — warum n−1 und nicht n?",
            html:"Du berechnest die Abweichungen gegen \\(\\bar{x}\\), das du <b>selbst aus denselben Daten</b> bestimmt hast. Der Mittelwert sitzt damit „verdächtig nah“ an den Daten — die Streuung sieht künstlich kleiner aus. Das kostet einen <b>Freiheitsgrad</b>. Teilen durch \\(n\\) würde die Varianz systematisch zu klein schätzen (verzerrt); die Korrektur \\(n-1\\) macht den Schätzer erwartungstreu."},

          {t:"warn", title:"Stolperfalle: s erbt die Bravheit von s² NICHT", tag:"wichtig",
            html:"\\(s^2\\) ist erwartungstreu <i>und</i> konsistent für \\(\\sigma^2\\). Aber: Die Standardabweichung \\(s=\\sqrt{s^2}\\) gilt <b>weder als erwartungstreuer noch als konsistenter</b> Schätzer für \\(\\sigma\\). Wurzelziehen ist eine nichtlineare Operation und verzerrt den Erwartungswert. Beliebte Klausurfalle! <span class='muted'>(Skript S. 186)</span>"},

          {t:"aha", title:"Aha — der Dartpfeil-Vergleich",
            html:"<b>Erwartungstreue</b> = du triffst <i>im Schnitt</i> die Mitte (kein systematischer Drall nach links/rechts). <b>Konsistenz</b> = je mehr Pfeile du wirfst (größeres n), desto enger der Cluster um die Mitte. Ein Schätzer kann erwartungstreu sein und trotzdem mies streuen — deshalb braucht man <i>auch</i> ein ordentliches n."},

          {t:"widget", title:"Erwartungstreue-Simulator", icon:"🎯",
            hint:"Stell die <b>wahre</b> Grundgesamtheit (µ, σ) und den Stichprobenumfang <b>n</b> ein. „<b>Stichprobe ziehen</b>“ zeigt dir die Punktschätzer x̄, s² (Nenner n−1) und zum Vergleich σ̂²ₙ (Nenner n) aus <i>einer</i> Stichprobe. Drück dann „<b>500 Stichproben simulieren</b>“: das Histogramm der Mittelwerte zeigt, dass x̄ <i>im Schnitt</i> µ trifft (erwartungstreu) und s² (n−1) im Mittel σ² — während die Variante mit Nenner n die Varianz systematisch zu klein schätzt.",
            render: renderPunktschaetzer},

          {t:"divider"},

          {t:"h", icon:"🧮", text:"Leitbeispiel: Unternehmenszugehörigkeit"},
          {t:"p", html:"Eine Mitarbeiterbefragung erfasst die Unternehmenszugehörigkeit (in Jahren) von 8 Personen. Diese acht Zahlen begleiten uns durch die <b>gesamte</b> Lektion."},
          {t:"table",
            headers:["i","1","2","3","4","5","6","7","8"],
            rows:[["Jahre","12","8","16","10","6","10","14","12"]],
            caption:"Urliste (Skript S. 184), n = 8", compact:true},

          {t:"example", title:"Schritt 1 — Schätzung des Mittelwerts",
            html:"\\[ \\hat{\\mu}=\\bar{x}=\\frac{12+8+16+10+6+10+14+12}{8}=\\frac{88}{8}=11 \\]"
              + "Die durchschnittliche Unternehmenszugehörigkeit beträgt <b>11 Jahre</b>. Weil \\(\\bar{x}\\) erwartungstreu ist, gilt die 11 als angemessener Schätzwert für die gesamte Belegschaft."},

          {t:"example", title:"Schritt 2 — Schätzung der Streuung",
            html:"Zuerst das Mittel der Quadrate: \\[ \\overline{x^2}=\\frac{12^2+8^2+16^2+10^2+6^2+10^2+14^2+12^2}{8}=\\frac{1040}{8}=130 \\]"
              + "Mit \\(\\bar{x}^2=11^2=121\\) folgt die Varianz:"
              + "\\[ \\hat{\\sigma}^2=s^2=\\frac{8}{8-1}\\,(130-121)=\\frac{8}{7}\\cdot 9 = 10{,}29 \\]"
              + "Und die Standardabweichung: \\[ \\hat{\\sigma}=s=\\sqrt{10{,}29}=3{,}21 \\]"
              + "<b>Achtung:</b> mit Nenner \\(n\\) käme \\(130-121=9\\) heraus — das Skript rechnet aber bewusst mit \\(n-1\\) und erhält <b>10,29</b>."},

          {t:"quote", source:"Skript S. 184",
            html:"„Mit einer sog. Punktschätzung würde man nun einen konkreten Wert für den Mittelwert und die Streuung festlegen, welcher dann für die Grundgesamtheit Gültigkeit haben soll.“"},

          {t:"p", html:"Skript-Fazit (S. 186): Die durchschnittliche Unternehmenszugehörigkeit wird auf Basis der Stichprobe auf <b>11 ± 3,21 Jahre</b> geschätzt."},

          {t:"quote", source:"Skript S. 187",
            html:"„Der große Nachteil von Punktschätzern ist, dass man sich auf einen speziellen Wert … festlegt. Die Chance, dass unser wahrer Wert der Grundgesamtheit durchaus mal ein wenig abweicht, ist damit nicht so gering.“"},

          {t:"p", html:"Genau dieser Nachteil — ein einziger Wert ist fast nie exakt richtig — führt direkt zum nächsten Kapitel: dem Konfidenzintervall."}
        ]
      },

      /* ===================== 7.2 INTERVALLSCHÄTZUNG ===================== */
      {
        num:"7.2",
        title:"Intervallschätzung",
        intro:"Statt einer Punktlandung lieber ein ehrlicher Korridor: das Konfidenzintervall.",
        blocks: [
          {t:"p", lead:true, html:"Ein Punktschätzer sagt „11 Jahre“ — und liegt mit ziemlicher Sicherheit ein bisschen daneben. Die Intervallschätzung ist ehrlicher: Sie gibt einen <b>Bereich</b> an, der den wahren Parameter mit einer angegebenen Wahrscheinlichkeit überdeckt."},

          {t:"def", term:"Konfidenzintervall (Vertrauensintervall)", title:"Definition",
            html:"Ein Konfidenzintervall gibt einen <b>Bereich</b> mit Unter- und Obergrenze als Schätzer für einen Parameter der Grundgesamtheit an. <span class='muted'>(Skript S. 187)</span>"},

          {t:"aha", title:"Aha — der Wetterbericht-Vergleich",
            html:"„Morgen genau 11 °C“ (Punktschätzer) trifft fast nie. „Morgen 9–13 °C“ (Konfidenzintervall) ist <i>weniger</i> präzise, aber viel <i>ehrlicher</i> — und stimmt deutlich öfter. Genau diesen Tausch macht das KI: ein bisschen Schärfe gegen viel mehr Verlässlichkeit."},

          {t:"h", icon:"⚖️", text:"Vertrauen vs. Irrtum"},
          {t:"def", term:"Vertrauenswahrscheinlichkeit / Konfidenzniveau 1−α", title:"Definition",
            html:"Gibt an, mit welcher Wahrscheinlichkeit der wahre Parameter im berechneten Intervall liegt. Gängig: 90 %, 95 %, selten 99 %. <span class='muted'>(Skript S. 187)</span>"},
          {t:"def", term:"Irrtumswahrscheinlichkeit α", title:"Definition",
            html:"Das Gegenstück: die Wahrscheinlichkeit, dass der wahre Wert <b>nicht</b> im Intervall liegt. Sie verteilt sich symmetrisch auf beide Enden — je \\(\\alpha/2 = 0{,}5\\alpha\\) unterhalb der Unter- und oberhalb der Obergrenze. <span class='muted'>(Skript S. 187)</span>"},

          {t:"def", term:"Standardfehler", title:"Definition",
            html:"Der Standardfehler \\(\\sigma/\\sqrt{n}\\) (bzw. \\(s/\\sqrt{n}\\)) gibt an, wie stark der geschätzte Mittelwert \\(\\bar{x}\\) typischerweise vom wahren Wert abweicht. Er ist das „Lineal“, mit dem die Intervallbreite abgemessen wird. <span class='muted'>(Skript S. 191)</span>"},

          {t:"h", icon:"📋", text:"Die drei Schritte zum KI (Skript S. 188)"},
          {t:"list", ordered:true, items:[
            "<b>Vertrauenswahrscheinlichkeit 1−α festlegen</b> (0,9 / 0,95 / 0,99). Vorsicht bei 99 %: fast immer richtig, aber so breit, dass es kaum noch etwas aussagt.",
            "<b>Stichprobe erheben und \\(\\bar{x}\\) berechnen.</b>",
            "<b>Symmetrische Fläche um \\(\\bar{x}\\) markieren.</b> Die Verteilung der Mittelwerte nähert sich einer Normalverteilung; innerhalb der Grenzen liegt 1−α der Wahrscheinlichkeitsmasse."
          ]},

          {t:"quote", source:"Skript S. 187",
            html:"„Ein Konfidenzintervall wird auch als Vertrauensintervall bezeichnet, da wir mit einer gewissen Wahrscheinlichkeit darauf vertrauen können, dass es den wahren Wert in der Grundgesamtheit überdeckt bzw. beinhaltet.“"},

          {t:"warn", title:"Die 99-%-Falle", tag:"interpretation",
            html:"„Zu große Vertrauenswahrscheinlichkeiten wie etwa 99 % sind … mit Vorsicht zu genießen, da sie zwar mit nahezu 100 % Wahrscheinlichkeit den wahren Erwartungswert umfassen, jedoch aufgrund ihrer Größe <b>wenig informativ</b> sind.“ <span class='muted'>(Skript S. 188)</span> Ein Intervall „irgendwo zwischen 0 und 100“ ist eben immer richtig — und nutzlos."},

          {t:"divider"},

          {t:"h", icon:"🔀", text:"Der Kern: zwei Fälle"},
          {t:"p", html:"Diese Lektion behandelt das KI <b>nur für den Erwartungswert µ</b>. Welche Verteilung du benutzt, hängt an einer einzigen Frage: <b>Kennst du die Varianz σ² der Grundgesamtheit?</b>"},
          {t:"table",
            headers:["Situation","Verteilung","Streuung", "Quantil"],
            rows:[
              ["σ² <b>bekannt</b>","Standardnormalverteilung","σ (gegeben)","z-Quantil"],
              ["σ² <b>unbekannt</b>","t-Verteilung (df=n−1)","s (geschätzt)","t-Quantil"]
            ],
            caption:"Fallunterscheidung Konfidenzintervall für µ", highlight:[1]},

          {t:"sub", text:"Fall 1 — Varianz bekannt (z-Quantil)"},
          {t:"formula", tex:"\\left[\\,\\bar{x}-z_{1-0{,}5\\alpha}\\cdot\\frac{\\sigma}{\\sqrt{n}}\\;;\\;\\;\\bar{x}+z_{1-0{,}5\\alpha}\\cdot\\frac{\\sigma}{\\sqrt{n}}\\,\\right]",
            caption:"KI für µ bei bekannter Varianz"},
          {t:"p", html:"Die Index-Schreibweise des Skripts ist \\(z_{1-0{,}5\\alpha}\\) — das ist nichts anderes als \\(z_{1-\\alpha/2}\\). Für 95 %:"},
          {t:"formula", tex:"z_{1-0{,}5\\alpha}=z_{1-0{,}5\\cdot 0{,}05}=z_{0{,}975}=1{,}96",
            caption:"z-Quantil für ein zweiseitiges 95 %-KI"},

          {t:"sub", text:"Fall 2 — Varianz unbekannt (t-Quantil)"},
          {t:"formula", tex:"\\left[\\,\\bar{x}-t_{n-1;\\,1-0{,}5\\alpha}\\cdot\\frac{s}{\\sqrt{n}}\\;;\\;\\;\\bar{x}+t_{n-1;\\,1-0{,}5\\alpha}\\cdot\\frac{s}{\\sqrt{n}}\\,\\right]",
            caption:"KI für µ bei unbekannter Varianz"},
          {t:"p", html:"Zwei Änderungen: σ wird durch \\(s\\) ersetzt, und das z-Quantil weicht dem t-Quantil mit \\(df=n-1\\) Freiheitsgraden. Für 95 % und n=8:"},
          {t:"formula", tex:"t_{n-1;\\,1-0{,}5\\alpha}=t_{8-1;\\,1-0{,}5\\cdot 0{,}05}=t_{7;\\,0{,}975}=2{,}365",
            caption:"t-Quantil für n=8"},

          {t:"h", icon:"📊", text:"Quantil-Tabelle der Standardnormalverteilung"},
          {t:"table",
            headers:["Kumulierte W. p","0,9","0,95","0,975","0,99","0,995"],
            rows:[["Quantil z_p","1,2816","1,6449","1,96","2,3263","2,5788"]],
            caption:"Tabelle 34 (Skript S. 192). Für 95 %-KI: p = 1−α/2 = 0,975 ⇒ z = 1,96.",
            compact:true, highlight:[0]},
          {t:"p", html:"Faustregel: 90 % ⇒ z=1,6449 · 95 % ⇒ z=1,96 · 99 % ⇒ z=2,5788. Das t-Quantil \\(t_{7;0,975}=2{,}365\\) ist deutlich größer als 1,96 — der Grund für das breitere t-Intervall."},

          {t:"why", title:"Warum brauche ich das?",
            html:"„±3 %“ bei Wahlumfragen, Konfidenzbänder in medizinischen Studien, Toleranzbereiche in der Qualitätskontrolle — überall ist der wahre Wert unbekannt, und eine ehrliche Aussage braucht einen <b>Bereich mit Wahrscheinlichkeit</b> statt eines scheinpräzisen Einzelwerts."},

          {t:"divider"},

          {t:"h", icon:"🧮", text:"Leitbeispiel A — KI bei BEKANNTER Varianz (95 %)"},
          {t:"p", html:"Gegeben: dieselben Daten, zusätzlich \\(\\sigma^2=9\\) (also \\(\\sigma=3\\)) bekannt, \\(1-\\alpha=0{,}95\\)."},
          {t:"example", title:"Durchrechnung (Skript S. 192/193)",
            html:"<b>1.</b> \\(\\bar{x}=88/8=11\\) <br>"
              + "<b>2.</b> \\(z_{0{,}975}=1{,}96\\) (Tabelle 34, p=0,975) <br>"
              + "<b>3.</b> \\(\\sigma=\\sqrt{9}=3\\), \\(n=8\\) <br>"
              + "<b>4.</b> Standardfehler: \\(\\sigma/\\sqrt{n}=3/\\sqrt{8}=1{,}0607\\); Spannweite: \\(1{,}96\\cdot 1{,}0607\\approx 2{,}08\\) <br>"
              + "<b>5.</b> Einsetzen: \\[ \\left[\\,11-1{,}96\\cdot\\tfrac{3}{\\sqrt{8}}\\;;\\;11+1{,}96\\cdot\\tfrac{3}{\\sqrt{8}}\\,\\right]=[\\,8{,}92\\;;\\;13{,}08\\,] \\]"
              + "→ Die wahre durchschnittliche Unternehmenszugehörigkeit liegt mit 95 % Wahrscheinlichkeit zwischen <b>8,92 und 13,08 Jahren</b>."},

          {t:"h", icon:"🧮", text:"Leitbeispiel B — KI bei UNBEKANNTER Varianz (95 %)"},
          {t:"p", html:"Gleiche Daten, aber σ² <b>unbekannt</b> — realistischer. Wir müssen die Streuung selbst aus der Stichprobe schätzen."},
          {t:"example", title:"Durchrechnung (Skript S. 194/195)",
            html:"<b>1.</b> \\(\\bar{x}=11\\) (wie zuvor) <br>"
              + "<b>2.</b> t-Quantil: \\(t_{7;\\,0{,}975}=2{,}365\\) (Zeile df=7, Spalte 0,975) <br>"
              + "<b>3.</b> Streuung schätzen: \\(\\overline{x^2}=130\\), \\(s^2=\\tfrac{8}{7}(130-121)=10{,}29\\), \\(s=\\sqrt{10{,}29}=3{,}21\\) <br>"
              + "<b>4.</b> Standardfehler: \\(s/\\sqrt{n}=3{,}21/\\sqrt{8}=1{,}1349\\); Spannweite: \\(2{,}365\\cdot 1{,}1349\\approx 2{,}68\\) <br>"
              + "<b>5.</b> Einsetzen: \\[ \\left[\\,11-2{,}365\\cdot\\tfrac{3{,}21}{\\sqrt{8}}\\;;\\;11+2{,}365\\cdot\\tfrac{3{,}21}{\\sqrt{8}}\\,\\right]=[\\,8{,}32\\;;\\;13{,}68\\,] \\]"
              + "→ … liegt mit 95 % Wahrscheinlichkeit zwischen <b>8,32 und 13,68 Jahren</b>."},

          {t:"h", icon:"🆚", text:"Vergleich: bekannt vs. unbekannt"},
          {t:"table",
            headers:["Fall","Verteilung","Streuung","95 %-KI","Breite"],
            rows:[
              ["Varianz bekannt","Normal (z=1,96)","σ=3","[8,92; 13,08]","4,16"],
              ["Varianz unbekannt","t (t=2,365)","s=3,21","[8,32; 13,68]","5,36"]
            ],
            caption:"Skript S. 196 — das unbekannte Intervall ist breiter.", highlight:[1]},
          {t:"p", html:"<b>Warum ist das unbekannte Intervall breiter?</b> Zwei Gründe wirken zusammen:"},
          {t:"list", ordered:true, items:[
            "Das <b>t-Quantil ist größer</b> als das z-Quantil (2,365 > 1,96) — gerade bei kleinen Stichproben deutlich.",
            "Die <b>geschätzte Streuung s ist hier größer</b> als das bekannte σ (3,21 > 3)."
          ]},
          {t:"p", html:"Beides vergrößert den Abstand der Grenzen zum Mittelwert."},

          {t:"quote", source:"Skript S. 196",
            html:"„Wir können demnach festhalten, dass das Intervall bei unbekannter Varianz breiter ausfällt als bei bekannter Varianz. Das ist sehr typisch …“"},

          {t:"aha", title:"Aha — t kuschelt sich an z",
            html:"Bei kleinem df sind die Ränder der t-Verteilung dick — ein <b>Sicherheitszuschlag</b>, weil du σ nur schätzt und damit zusätzliche Unsicherheit hast. Mit wachsendem df schmiegt sich t immer enger an die Normalverteilung; ab ca. <b>df ≈ 30</b> ist der Unterschied praktisch verschwunden. Genau das zeigt der df-Slider weiter unten."},

          {t:"divider"},

          {t:"h", icon:"🎚️", text:"Einflussfaktoren auf die Breite des KI (Skript S. 196)"},
          {t:"p", html:"Das Skript hat <b>keine</b> geschlossene Formel à la „so groß muss n sein“. Stattdessen beschreibt es, an welchen Schrauben man dreht — und was passiert:"},
          {t:"list", items:[
            "<b>Stichprobenumfang n erhöhen</b> → \\(\\sqrt{n}\\) im Nenner wächst → Standardfehler sinkt → <b>Intervall schmaler</b> (präziser). Der erwünschte Hebel.",
            "<b>Vertrauenswahrscheinlichkeit 1−α senken</b> (z. B. 90 % statt 95 %) → kleineres Quantil → <b>Intervall schmaler</b>, ABER die Überdeckungswahrscheinlichkeit sinkt (Irrtum steigt).",
            "<b>Zielkonflikt:</b> schmal UND zuverlässig zugleich gibt es meist nur über ein größeres n."
          ]},
          {t:"quote", source:"Skript S. 197 (Zusammenfassung)",
            html:"„… insbesondere ein großer Stichprobenumfang [lässt] ein Konfidenzintervall schmaler und damit präziser werden …“"},

          {t:"aha", title:"Aha — die 95 % richtig lesen",
            html:"Das KI [8,92; 13,08] heißt <b>nicht</b> „µ liegt zu 95 % in genau diesem Intervall“. µ ist eine feste Zahl — entweder drin oder nicht. Korrekt: <b>Bei vielen wiederholten Stichproben würden ca. 95 % der so berechneten Intervalle das wahre µ überdecken.</b> Das Konfidenzniveau ist eine Eigenschaft des <i>Verfahrens</i>, nicht des einen Intervalls. Der Simulationsmodus unten macht das sichtbar."},

          {t:"widget", title:"Konfidenzintervall-Visualizer", icon:"📐",
            hint:"Spiel mit <b>n</b>, dem <b>Konfidenzniveau</b> und <b>σ</b> — beobachte, wie sich das Intervall verändert. Wechsle dann in den <b>Simulationsmodus</b>: 100 Stichproben werden gezogen, und du siehst, wie viele Intervalle das wahre µ=11 wirklich überdecken.",
            render: renderKIVisualizer},

          {t:"widget", title:"t-Verteilung vs. Normalverteilung", icon:"🔔",
            hint:"Schieb die <b>Freiheitsgrade df</b> hin und her. Beobachte, wie sich die t-Kurve (gold) bei kleinem df mit dicken Rändern von der Normalverteilung (blau) abhebt — und sich bei großem df an sie anschmiegt. Bei df=7 (Leitbeispiel) ist t = 2,365.",
            render: renderTvsNormal},

          {t:"why", title:"Der rote Faden zu Lektion 8",
            html:"Konfidenzintervalle und Hypothesentests sind zwei Seiten derselben Medaille: Liegt ein behaupteter Wert µ₀ <b>außerhalb</b> des 95 %-KI, würde ein zweiseitiger Test zum Niveau 5 % ihn ablehnen. Wer KI verstanden hat, hat den halben Hypothesentest schon im Sack."}
        ]
      }
    ],

    quiz: [
      { q:"Welcher Nenner steckt in der vom Skript verwendeten Stichprobenvarianz \\(s^2\\)?",
        options:["n", "n−1", "n+1", "√n"], correct:1,
        explain:"Das Skript schreibt \\(s^2=\\frac{n}{n-1}(\\overline{x^2}-\\bar{x}^2)\\) — das ist die korrigierte (erwartungstreue) Varianz mit effektivem Nenner n−1. Mit Nenner n wäre der Schätzer verzerrt (zu klein)." },

      { q:"Wie groß ist der Punktschätzer für die durchschnittliche Unternehmenszugehörigkeit im Leitbeispiel (Daten 12, 8, 16, 10, 6, 10, 14, 12)?",
        options:["10", "10,5", "11", "12"], correct:2,
        explain:"\\(\\hat{\\mu}=\\bar{x}=88/8=11\\) Jahre." },

      { q:"Welcher Schätzer gilt laut Skript NICHT als erwartungstreu?",
        options:["Stichprobenmittel \\(\\bar{x}\\)", "Stichprobenvarianz \\(s^2\\)", "Standardabweichung \\(s\\)", "Alle drei sind erwartungstreu"], correct:2,
        explain:"\\(s^2\\) ist erwartungstreu für \\(\\sigma^2\\), aber \\(s=\\sqrt{s^2}\\) ist weder erwartungstreuer noch konsistenter Schätzer für \\(\\sigma\\) — das Wurzelziehen verzerrt (Skript S. 186)." },

      { q:"Welche Verteilung nutzt man für das KI des Erwartungswerts, wenn die Varianz der Grundgesamtheit UNbekannt ist?",
        options:["Standardnormalverteilung", "t-Verteilung", "Binomialverteilung", "Chi-Quadrat-Verteilung"], correct:1,
        explain:"Bei unbekannter Varianz: t-Verteilung mit df=n−1, und σ wird durch s geschätzt. Bei bekannter Varianz dagegen die Standardnormalverteilung (z)." },

      { q:"Welches Quantil verwendet man für ein zweiseitiges 95 %-KI bei bekannter Varianz?",
        options:["\\(z_{0,95}=1{,}6449\\)", "\\(z_{0,975}=1{,}96\\)", "\\(z_{0,99}=2{,}3263\\)", "\\(z_{0,90}=1{,}2816\\)"], correct:1,
        explain:"Man braucht \\(p=1-\\alpha/2=1-0{,}025=0{,}975\\) ⇒ \\(z=1{,}96\\). Die volle 0,95 wäre der einseitige Wert 1,6449." },

      { q:"Das 95 %-KI im Leitbeispiel ist [8,92; 13,08] (bekannte Varianz) bzw. [8,32; 13,68] (unbekannte Varianz). Warum ist das zweite Intervall breiter?",
        options:["Reiner Zufall", "Weil t-Quantil (2,365) > z-Quantil (1,96) UND s (3,21) > σ (3)", "Weil n kleiner gewählt wurde", "Weil α größer gewählt wurde"], correct:1,
        explain:"Zwei Effekte addieren sich: das größere t-Quantil und die größere geschätzte Streuung s vergrößern beide den Abstand der Grenzen zum Mittelwert (Skript S. 196)." },

      { q:"Was passiert mit der Breite des KI, wenn man den Stichprobenumfang n erhöht (sonst alles gleich)?",
        options:["Wird breiter", "Wird schmaler", "Bleibt gleich", "Erst breiter, dann schmaler"], correct:1,
        explain:"\\(\\sqrt{n}\\) steht im Nenner des Standardfehlers — größeres n ⇒ kleinerer SE ⇒ schmaleres, präziseres Intervall (Skript S. 196)." },

      { q:"Wie ist „95 %-Konfidenzintervall“ korrekt zu interpretieren?",
        options:[
          "µ liegt mit 95 % Wahrscheinlichkeit in genau diesem Intervall.",
          "Bei vielen wiederholten Stichproben überdecken ~95 % der berechneten Intervalle das wahre µ.",
          "95 % der Daten liegen im Intervall.",
          "Der Schätzfehler beträgt 5 %."], correct:1,
        explain:"Das Konfidenzniveau ist eine Eigenschaft des Verfahrens über viele Stichproben, nicht des einen konkreten Intervalls. Genau das demonstriert der Simulationsmodus des Visualizers." }
    ]
  });

})();
