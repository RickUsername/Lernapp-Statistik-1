/* =====================================================================
   LEKTION 8 — Hypothesentests  (IU BSTA01-02, S. 200–226)
   8.1 Methodik · 8.2 z-Test · 8.3 t-Test
   Widgets: Hypothesentest-Wizard, p-Wert-Visualizer, Fehler-1./2.-Art-Demo
   ===================================================================== */
(function(){
  "use strict";

  /* ---------- lokale Helfer (kollidieren dank IIFE nie) ---------- */

  // Datensatz aus dem Leitbeispiel
  const DEMO = [8,10,7,5,10];           // Überstunden 5 Kolleg:innen
  const MU0  = 7;                        // hypothetischer Mittelwert
  const SIG2 = 4;                        // bekannte Varianz der Grundgesamtheit -> sigma=2

  // Tabelle 36 (page_219): wichtige z-Quantile, gerundet wie im Skript
  // z-Quantile: mathematisch korrekte Werte. Das Skript druckt bei 0,995 den
  // Druckfehler 2,5788; korrekt (und hier für die Testentscheidung genutzt) ist 2,5758.
  const Z_TABLE = {0.9:1.2816, 0.95:1.6449, 0.975:1.96, 0.99:2.3263, 0.995:2.5758};

  // kritischer z-Wert (Skript rundet auf Tabellenwerte; sonst exakt über normalInv)
  function zCrit(p){ return (p in Z_TABLE) ? Z_TABLE[p] : null; }

  // Farbpalette-Kürzel
  const C = {
    curve:"#e7b54c", t:"#9d8cff", reject:"rgba(240,114,111,.32)",
    rejectS:"#f0726f", accept:"rgba(84,199,192,.16)", good:"#5ed39a",
    h1:"#5fa8ff", h1area:"rgba(95,168,255,.30)", beta:"rgba(157,140,255,.34)"
  };

  // kleine Helfer für hübsche stat-Kacheln
  function stat(ctx, val, label, cls){
    return ctx.el("div",{class:"stat"+(cls?" "+cls:"")},
      ctx.el("div",{class:"v"}, val),
      ctx.el("div",{class:"l"}, label));
  }
  function chip(ctx, label, active, on){
    const c = ctx.el("div",{class:"chip"+(active?" active":"")}, label);
    c.addEventListener("click", on);
    return c;
  }

  /* =====================================================================
     WIDGET 1 — HYPOTHESENTEST-WIZARD
     5 Schritte für z- ODER t-Test; reproduziert das Leitbeispiel exakt.
     ===================================================================== */
  function wizard(elm, ctx){
    const {Stats, fmt, Plot, PAL} = ctx;

    const S = {
      data: DEMO.slice(),
      mu0: MU0,
      mode: "z",          // "z" (sigma bekannt) | "t" (sigma unbekannt)
      sigma: Math.sqrt(SIG2),
      alpha: 0.05,
      side: "two"         // "two" | "right" | "left"
    };

    // ---- Eingabezeile ----
    const dataInp = ctx.el("input",{type:"text", value:S.data.join(", "),
      style:{minWidth:"180px"}});
    const mu0Inp  = ctx.el("input",{type:"number", value:String(S.mu0), step:"0.1",
      style:{width:"90px"}});
    const sigInp  = ctx.el("input",{type:"number", value:String(S.sigma), step:"0.1", min:"0.01",
      style:{width:"90px"}});

    const modeChips = ctx.el("div",{class:"chips"});
    const sideChips = ctx.el("div",{class:"chips"});
    const alphaChips= ctx.el("div",{class:"chips"});

    function mkChips(host, items, getActive, set){
      host.innerHTML="";
      items.forEach(it=> host.appendChild(chip(ctx, it.label, getActive()===it.val, ()=>{ set(it.val); render(); })));
    }

    const stepsBox = ctx.el("div",{class:"steps"});
    const verdict  = ctx.el("div",{class:"readout"});
    const plotHost = ctx.el("div");
    let P = null;

    // ---- Layout zusammenbauen ----
    const row1 = ctx.el("div",{class:"ctrl-row"},
      ctx.el("div",{class:"ctrl"},
        ctx.el("label",{},"Stichprobe (x-Werte)"), dataInp),
      ctx.el("div",{class:"ctrl"},
        ctx.el("label",{},"μ₀ (Behauptung)"), mu0Inp)
    );
    const sigCtrl = ctx.el("div",{class:"ctrl"},
      ctx.el("label",{}, S.mode==="z" ? "σ (bekannt)" : "σ — wird aus Daten geschätzt"), sigInp);
    const row2 = ctx.el("div",{class:"ctrl-row"},
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{},"Testart"), modeChips),
      sigCtrl,
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{},"Signifikanzniveau α"), alphaChips),
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{},"Richtung"), sideChips)
    );

    const resetBtn = ctx.el("button",{class:"btn ghost"},"↺ Leitbeispiel");
    resetBtn.addEventListener("click", ()=>{
      S.data=DEMO.slice(); S.mu0=MU0; S.mode="z"; S.sigma=Math.sqrt(SIG2); S.alpha=0.05; S.side="two";
      dataInp.value=S.data.join(", "); mu0Inp.value=String(S.mu0); sigInp.value=String(S.sigma);
      render();
    });

    elm.appendChild(row1);
    elm.appendChild(row2);
    elm.appendChild(ctx.el("div",{class:"btn-row"}, resetBtn));
    elm.appendChild(stepsBox);
    elm.appendChild(verdict);
    elm.appendChild(plotHost);

    dataInp.addEventListener("input", ()=>{ const a=ctx.parseNums(dataInp.value); if(a.length>=2){ S.data=a; render(); } });
    mu0Inp.addEventListener("input", ()=>{ const v=parseFloat(mu0Inp.value.replace(",",".")); if(isFinite(v)){ S.mu0=v; render(); } });
    sigInp.addEventListener("input", ()=>{ const v=parseFloat(sigInp.value.replace(",",".")); if(isFinite(v)&&v>0){ S.sigma=v; render(); } });

    // ---- Berechnung & Rendering ----
    function compute(){
      const a = S.data, n = a.length;
      const xbar = Stats.mean(a);
      const meanSq = Stats.mean(a.map(x=>x*x));     // Mittel der Quadrate
      // korrigierte Stichprobenvarianz via Verschiebungssatz (Nenner n-1)
      const s2 = (n/(n-1))*(meanSq - xbar*xbar);
      const s  = Math.sqrt(Math.max(0,s2));
      const denom = S.mode==="z" ? S.sigma : s;     // sigma bzw. s
      const stat = Math.sqrt(n) * (xbar - S.mu0) / denom;   // SKRIPT-FORM
      const df = n-1;
      const sumTxt = a.map(x=>fmt.n(x,0)).join("+");

      // kritischer Wert je nach Richtung
      let crit, critLabel, p1, isExact=false;
      if(S.mode==="z"){
        if(S.side==="two"){ p1 = 1-0.5*S.alpha; }
        else { p1 = 1-S.alpha; }
        crit = zCrit(p1); if(crit===null){ crit = Stats.normalInv(p1); isExact=true; }
      } else {
        if(S.side==="two"){ p1 = 1-0.5*S.alpha; }
        else { p1 = 1-S.alpha; }
        crit = Stats.tQuantile(p1, df);
      }

      // Entscheidung
      let reject;
      if(S.side==="two")      reject = Math.abs(stat) > crit;
      else if(S.side==="right") reject = stat >  crit;
      else                    reject = stat < -crit;

      return {n,xbar,meanSq,s2,s,denom,stat,df,crit,p1,reject,isExact,sumTxt};
    }

    function hypoText(){
      const op0 = S.side==="two" ? "=" : S.side==="right" ? "\\le" : "\\ge";
      const op1 = S.side==="two" ? "\\neq" : S.side==="right" ? ">" : "<";
      return {
        h0: "H_0:\\ \\mu "+op0+" "+fmt.n(S.mu0,1).replace(".",","),
        h1: "H_1:\\ \\mu "+op1+" "+fmt.n(S.mu0,1).replace(".",",")
      };
    }

    function critTex(R){
      const sub = S.mode==="z"
        ? (S.side==="two" ? "z_{1-0{,}5\\cdot\\alpha}=z_{"+fmt.n(R.p1,3).replace(".",",")+"}"
                          : "z_{1-\\alpha}=z_{"+fmt.n(R.p1,2).replace(".",",")+"}")
        : (S.side==="two" ? "t_{"+R.df+";\\,"+fmt.n(R.p1,3).replace(".",",")+"}"
                          : "t_{"+R.df+";\\,"+fmt.n(R.p1,2).replace(".",",")+"}");
      let val = fmt.n(R.crit,4).replace(".",",");
      if(S.side==="left") return "-"+sub+" = -"+val;
      return (S.side==="two"?"\\pm ":"")+sub+" = "+(S.side==="two"?"\\pm ":"")+val;
    }

    function render(){
      // Chips frisch
      mkChips(modeChips, [{label:"σ bekannt → z-Test",val:"z"},{label:"σ unbekannt → t-Test",val:"t"}],
        ()=>S.mode, v=>S.mode=v);
      mkChips(alphaChips, [{label:"10 %",val:0.10},{label:"5 %",val:0.05},{label:"1 %",val:0.01}],
        ()=>S.alpha, v=>S.alpha=v);
      mkChips(sideChips, [{label:"zweiseitig",val:"two"},{label:"rechts (>)",val:"right"},{label:"links (<)",val:"left"}],
        ()=>S.side, v=>S.side=v);

      // σ-Feld nur im z-Modus aktiv
      sigInp.disabled = (S.mode==="t");
      sigCtrl.querySelector("label").textContent = S.mode==="z" ? "σ (bekannt)" : "s — aus Daten geschätzt";

      const R = compute();
      const H = hypoText();
      const Q = S.mode==="z" ? "z" : "t";

      // ---- 5 Schritte ----
      stepsBox.innerHTML="";
      const sigTex = S.mode==="z" ? "\\sigma" : "s";
      const sumTxt = R.sumTxt;

      // Schritt 1: Hypothesen
      stepsBox.appendChild(ctx.el("div",{class:"step"},
        ctx.el("span",{class:"sk"},"Hypothesenpaar aufstellen"),
        ctx.el("div",{html:"\\("+H.h0+"\\)<br>\\("+H.h1+"\\)"})
      ));
      // Schritt 2: alpha
      stepsBox.appendChild(ctx.el("div",{class:"step"},
        ctx.el("span",{class:"sk"},"Signifikanzniveau festlegen"),
        ctx.el("div",{html:"\\(\\alpha = "+fmt.n(S.alpha,2).replace(".",",")+"\\)"
          +(S.side==="two"?"  (zweiseitig → je \\("+fmt.n(S.alpha/2,3).replace(".",",")+"\\) pro Rand)":"")})
      ));
      // Schritt 3: Prüfgröße
      let s3 = "\\(\\bar{x}=\\dfrac{"+sumTxt+"}{"+R.n+"}="+fmt.n(R.xbar,4).replace(".",",")+"\\)";
      if(S.mode==="t"){
        s3 += "<br>\\(\\overline{x^2}="+fmt.n(R.meanSq,4).replace(".",",")+"\\),\\quad "
            + "s^2=\\dfrac{"+R.n+"}{"+R.n+"-1}\\left("+fmt.n(R.meanSq,4).replace(".",",")
            + "-"+fmt.n(R.xbar*R.xbar,4).replace(".",",")+"\\right)="+fmt.n(R.s2,4).replace(".",",")+"\\)"
            + "<br>\\(s=\\sqrt{"+fmt.n(R.s2,4).replace(".",",")+"}="+fmt.n(R.s,4).replace(".",",")+"\\)";
      }
      s3 += "<br>\\("+Q+"=\\sqrt{"+R.n+"}\\cdot\\dfrac{"+fmt.n(R.xbar,2).replace(".",",")+"-"
          + fmt.n(S.mu0,2).replace(".",",")+"}{"+fmt.n(R.denom,4).replace(".",",")+"}=\\mathbf{"
          + fmt.n(R.stat,4).replace(".",",")+"}\\)";
      stepsBox.appendChild(ctx.el("div",{class:"step"},
        ctx.el("span",{class:"sk"},"Prüfgröße berechnen (Skript-Form \\(\\sqrt{n}\\cdot\\frac{\\bar x-\\mu_0}{"+sigTex+"}\\))"),
        ctx.el("div",{html:s3})
      ));
      // Schritt 4: kritischer Wert
      stepsBox.appendChild(ctx.el("div",{class:"step"},
        ctx.el("span",{class:"sk"},"Kritischen Wert bestimmen"
          +(S.mode==="t"?" (t-Verteilung, df = n−1 = "+R.df+")":" (Standardnormalverteilung)")),
        ctx.el("div",{html:"\\("+critTex(R)+"\\)"})
      ));
      // Schritt 5: Entscheidung
      const cmp = S.side==="two"
        ? "|"+Q+"| = "+fmt.n(Math.abs(R.stat),4).replace(".",",")+(R.reject?" > ":" \\not> ")+fmt.n(R.crit,4).replace(".",",")
        : S.side==="right"
        ? Q+" = "+fmt.n(R.stat,4).replace(".",",")+(R.reject?" > ":" \\not> ")+fmt.n(R.crit,4).replace(".",",")
        : Q+" = "+fmt.n(R.stat,4).replace(".",",")+(R.reject?" < ":" \\not< ")+"-"+fmt.n(R.crit,4).replace(".",",");
      stepsBox.appendChild(ctx.el("div",{class:"step"},
        ctx.el("span",{class:"sk"},"Entscheidung über die Prüfgröße"),
        ctx.el("div",{html:"\\("+cmp+"\\)"})
      ));

      // ---- Urteil ----
      verdict.innerHTML="";
      verdict.appendChild(stat(ctx, fmt.n(R.stat,4).replace(".",","), "Prüfgröße "+Q, "violet"));
      verdict.appendChild(stat(ctx, (S.side==="left"?"−":S.side==="right"?"+":"±")+fmt.n(R.crit,4).replace(".",","),
        "kritischer Wert", "blue"));
      verdict.appendChild(stat(ctx, R.reject?"H₀ ABLEHNEN":"H₀ nicht ablehnen",
        R.reject?"signifikant ✔":"nicht signifikant", R.reject?"good":"teal"));

      // ---- Verteilungs-Plot ----
      if(!P){
        P = Plot(plotHost,{xmin:-4,xmax:4,ymin:0,ymax:0.43,height:240,padB:38});
        ctx.onCleanup(()=>P.destroy());
      }
      drawDist(P, R, Q);
      P.onResize = ()=>drawDist(P, R, Q);

      ctx.typeset();
    }

    function pdf(x, R){ return S.mode==="z" ? Stats.normalPdf(x) : Stats.tPdf(x, R.df); }

    function drawDist(P, R, Q){
      const f = x=>pdf(x,R);
      P.clear();
      // Ablehnungsbereiche (rot)
      if(S.side==="two"){
        P.area(f, -4, -R.crit, {color:C.reject, n:140});
        P.area(f,  R.crit, 4,  {color:C.reject, n:140});
      } else if(S.side==="right"){
        P.area(f, R.crit, 4, {color:C.reject, n:140});
      } else {
        P.area(f, -4, -R.crit, {color:C.reject, n:140});
      }
      P.axes({xlabel: S.mode==="z" ? "z" : "t  (df="+R.df+")", ylabel:"f("+ (S.mode==="z"?"z":"t") +")", xticks:8});
      P.func(f, {color: S.mode==="z"?C.curve:C.t, width:2.4});
      // kritische Grenzen
      if(S.side==="two"||S.side==="left") P.vline(-R.crit,{color:C.rejectS});
      if(S.side==="two"||S.side==="right") P.vline( R.crit,{color:C.rejectS});
      // Prüfgröße (grüner Marker, falls im Bild)
      const sx = ctx.clamp(R.stat,-3.95,3.95);
      P.vline(sx, {color: R.reject?C.good:"#c3ccdc", dash:[2,3], width:2.2});
      P.text(sx, pdf(sx,R)+0.03, Q+"="+fmt.n(R.stat,2).replace(".",","),
        {align:"center", color: R.reject?C.good:"#e8ecf4"});
      // Beschriftung Annahme/Ablehnung
      P.text(0, 0.40, "Annahmebereich", {align:"center", color:"#8d9bb5", baseline:"middle"});
    }

    render();
  }

  /* =====================================================================
     WIDGET 2 — p-WERT-VISUALIZER
     Fläche jenseits des Testwerts = p; Ampel p vs. alpha.
     ===================================================================== */
  function pValue(elm, ctx){
    const {Stats, fmt, Plot} = ctx;

    const S = { stat:1.118, side:"two", dist:"z", df:4, alpha:0.05 };

    const slider = ctx.el("input",{type:"range", min:"-4", max:"4", step:"0.01", value:String(S.stat)});
    const statVal= ctx.el("span",{class:"val"}, fmt.n(S.stat,3).replace(".",","));
    const dfSlider= ctx.el("input",{type:"range", min:"1", max:"40", step:"1", value:String(S.df)});
    const dfVal  = ctx.el("span",{class:"val"}, String(S.df));
    const sideChips = ctx.el("div",{class:"chips"});
    const distChips = ctx.el("div",{class:"chips"});
    const alphaChips= ctx.el("div",{class:"chips"});
    const out = ctx.el("div",{class:"readout"});
    const plotHost = ctx.el("div");
    let P=null;

    const dfCtrl = ctx.el("div",{class:"ctrl"},
      ctx.el("label",{}, ctx.el("span",{},"Freiheitsgrade df "), dfVal), dfSlider);

    const row1 = ctx.el("div",{class:"ctrl-row"},
      ctx.el("div",{class:"ctrl"},
        ctx.el("label",{}, ctx.el("span",{},"Testwert "), statVal), slider),
      dfCtrl
    );
    const row2 = ctx.el("div",{class:"ctrl-row"},
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{},"Verteilung"), distChips),
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{},"Richtung"), sideChips),
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{},"α"), alphaChips)
    );

    elm.appendChild(row1); elm.appendChild(row2);
    elm.appendChild(out); elm.appendChild(plotHost);

    function mkChips(host, items, getA, set){
      host.innerHTML="";
      items.forEach(it=> host.appendChild(chip(ctx, it.label, getA()===it.val, ()=>{ set(it.val); render(); })));
    }
    slider.addEventListener("input", ()=>{ S.stat=parseFloat(slider.value); render(); });
    dfSlider.addEventListener("input", ()=>{ S.df=parseInt(dfSlider.value,10); render(); });

    function pdf(x){ return S.dist==="z"? Stats.normalPdf(x) : Stats.tPdf(x,S.df); }
    function cdf(x){ return S.dist==="z"? Stats.normalCdf(x) : Stats.tCdf(x,S.df); }

    function pVal(){
      const t = S.stat;
      if(S.side==="two") return 2*(1-cdf(Math.abs(t)));
      if(S.side==="right") return 1-cdf(t);
      return cdf(t);     // left
    }

    function render(){
      mkChips(distChips, [{label:"Normal (z)",val:"z"},{label:"t-Verteilung",val:"t"}], ()=>S.dist, v=>S.dist=v);
      mkChips(sideChips, [{label:"zweiseitig",val:"two"},{label:"rechts",val:"right"},{label:"links",val:"left"}], ()=>S.side, v=>S.side=v);
      mkChips(alphaChips, [{label:"10 %",val:0.10},{label:"5 %",val:0.05},{label:"1 %",val:0.01}], ()=>S.alpha, v=>S.alpha=v);

      dfCtrl.style.opacity = S.dist==="t" ? "1" : "0.4";
      dfSlider.disabled = S.dist!=="t";
      statVal.textContent = fmt.n(S.stat,3).replace(".",",");
      dfVal.textContent = String(S.df);

      const p = pVal();
      const reject = p < S.alpha;

      out.innerHTML="";
      out.appendChild(stat(ctx, fmt.n(p,4).replace(".",","), "p-Wert", reject?"good":"violet"));
      out.appendChild(stat(ctx, fmt.n(S.alpha,2).replace(".",","), "α", "blue"));
      out.appendChild(stat(ctx,
        reject ? "p < α → ablehnen" : "p ≥ α → nicht ablehnen",
        reject ? "🟢 signifikant" : "🔴 nicht signifikant",
        reject?"good":"teal"));

      if(!P){
        P = Plot(plotHost,{xmin:-4,xmax:4,ymin:0,ymax:0.43,height:240,padB:38});
        ctx.onCleanup(()=>P.destroy());
      }
      draw();
      P.onResize=draw;
      ctx.typeset();
    }

    function draw(){
      const f = x=>pdf(x);
      P.clear();
      const t = S.stat;
      const col = {color:"rgba(157,140,255,.40)", n:160};
      if(S.side==="two"){
        const a=Math.abs(t);
        P.area(f, a, 4, col);
        P.area(f, -4, -a, col);
        P.vline(a,{color:"#9d8cff"}); P.vline(-a,{color:"#9d8cff"});
      } else if(S.side==="right"){
        P.area(f, t, 4, col); P.vline(t,{color:"#9d8cff"});
      } else {
        P.area(f, -4, t, col); P.vline(t,{color:"#9d8cff"});
      }
      P.axes({xlabel: S.dist==="z"?"z":"t", ylabel:"Dichte", xticks:8});
      P.func(f,{color:S.dist==="z"?C.curve:C.t, width:2.4});
      P.text(t, pdf(t)+0.03, (S.dist==="z"?"z":"t")+"="+fmt.n(t,2).replace(".",","),
        {align:"center", color:"#e8ecf4"});
    }

    render();
  }

  /* =====================================================================
     WIDGET 3 — FEHLER 1./2. ART (α/β-Wippe)
     Zwei Glockenkurven (H0 um mu0, H1 um mu1), verschiebbare kritische Grenze.
     ===================================================================== */
  function alphaBeta(elm, ctx){
    const {Stats, fmt, Plot} = ctx;

    const S = { mu0:7, mu1:8, sigma:2, n:5, crit:8.2 };

    function se(){ return S.sigma/Math.sqrt(S.n); }   // Standardfehler

    const muDiff = ctx.el("input",{type:"range", min:"7", max:"11", step:"0.1", value:String(S.mu1)});
    const muDiffV= ctx.el("span",{class:"val"}, fmt.n(S.mu1,1).replace(".",","));
    const nSl    = ctx.el("input",{type:"range", min:"1", max:"60", step:"1", value:String(S.n)});
    const nV     = ctx.el("span",{class:"val"}, String(S.n));
    const sigSl  = ctx.el("input",{type:"range", min:"0.5", max:"4", step:"0.1", value:String(S.sigma)});
    const sigV   = ctx.el("span",{class:"val"}, fmt.n(S.sigma,1).replace(".",","));
    const out = ctx.el("div",{class:"readout"});
    const plotHost = ctx.el("div");
    let P=null, dragging=false;

    const row = ctx.el("div",{class:"ctrl-row"},
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{}, ctx.el("span",{},"μ₁ (wahrer Wert) "), muDiffV), muDiff),
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{}, ctx.el("span",{},"Stichprobengröße n "), nV), nSl),
      ctx.el("div",{class:"ctrl"}, ctx.el("label",{}, ctx.el("span",{},"σ "), sigV), sigSl)
    );

    const tip = ctx.el("p",{class:"widget-hint",
      html:"Ziehe die rote <b>kritische Grenze</b> direkt in der Grafik – oder regle μ₁, n und σ. Beobachte, wie α (rot) und β (violett) <b>gegenläufig</b> wandern."});

    elm.appendChild(row); elm.appendChild(tip);
    elm.appendChild(out); elm.appendChild(plotHost);

    muDiff.addEventListener("input", ()=>{ S.mu1=parseFloat(muDiff.value); render(); });
    nSl.addEventListener("input", ()=>{ S.n=parseInt(nSl.value,10); clampCrit(); render(); });
    sigSl.addEventListener("input", ()=>{ S.sigma=parseFloat(sigSl.value); clampCrit(); render(); });

    function bounds(){
      const s=se();
      const lo=Math.min(S.mu0,S.mu1)-4*s, hi=Math.max(S.mu0,S.mu1)+4*s;
      return {lo,hi,s};
    }
    function clampCrit(){ const b=bounds(); S.crit=ctx.clamp(S.crit,b.lo+0.05,b.hi-0.05); }

    function metrics(){
      const s=se();
      // rechtsseitiger Test: Ablehnung bei X > crit
      const alpha = 1 - Stats.normalCdf(S.crit, S.mu0, s);   // H0-Fläche rechts der Grenze
      const beta  = Stats.normalCdf(S.crit, S.mu1, s);       // H1-Fläche links der Grenze
      const power = 1 - beta;
      return {s,alpha,beta,power};
    }

    function render(){
      muDiffV.textContent=fmt.n(S.mu1,1).replace(".",",");
      nV.textContent=String(S.n);
      sigV.textContent=fmt.n(S.sigma,1).replace(".",",");

      const M = metrics();
      out.innerHTML="";
      // α-Kachel: rote Zahl (keine eigene CSS-Klasse 'bad' -> Inline-Farbe)
      const aTile = stat(ctx, fmt.pct(M.alpha,1), "α — Fehler 1. Art");
      aTile.querySelector(".v").style.color = ctx.PAL.bad;
      out.appendChild(aTile);
      out.appendChild(stat(ctx, fmt.pct(M.beta,1), "β — Fehler 2. Art", "violet"));
      out.appendChild(stat(ctx, fmt.pct(M.power,1), "Teststärke 1−β", "good"));

      if(!P){
        const b=bounds();
        P = Plot(plotHost,{xmin:b.lo,xmax:b.hi,ymin:0,ymax:0.05,height:260,padB:38});
        ctx.onCleanup(()=>P.destroy());
        // Drag der kritischen Grenze
        const dn = e=>{ const {x}=P.pointer(e); if(Math.abs(P.X(x)-P.X(S.crit))<22){ dragging=true; e.preventDefault(); } };
        const mv = e=>{ if(!dragging) return; const {x}=P.pointer(e); const b2=bounds(); S.crit=ctx.clamp(x,b2.lo+0.02,b2.hi-0.02); render(); e.preventDefault(); };
        const up = ()=>{ dragging=false; };
        P.cv.addEventListener("pointerdown", dn);
        P.cv.addEventListener("pointermove", mv);
        window.addEventListener("pointerup", up);
        ctx.onCleanup(()=>window.removeEventListener("pointerup", up));
        P.cv.style.touchAction="none";
        P.cv.style.cursor="ew-resize";
      }
      draw(M);
      P.onResize=()=>{ render(); };  // re-fit auf neue Größe
      ctx.typeset();
    }

    function draw(M){
      const b=bounds();
      P.setX(b.lo,b.hi);
      const peak = Stats.normalPdf(S.mu0,S.mu0,M.s);
      P.setY(0, peak*1.18);
      const f0 = x=>Stats.normalPdf(x,S.mu0,M.s);
      const f1 = x=>Stats.normalPdf(x,S.mu1,M.s);
      P.clear();
      // β-Fläche (H1 links der Grenze) zuerst (liegt "unter" α optisch ok)
      P.area(f1, b.lo, S.crit, {color:C.beta, n:160});
      // α-Fläche (H0 rechts der Grenze)
      P.area(f0, S.crit, b.hi, {color:C.reject, n:160});
      P.axes({xlabel:"Stichprobenmittel x̄", ylabel:"Dichte", xticks:7});
      P.func(f0,{color:C.curve, width:2.4});
      P.func(f1,{color:C.h1, width:2.4});
      // Mittelwert-Linien
      P.vline(S.mu0,{color:C.curve, dash:[3,3], width:1.3});
      P.vline(S.mu1,{color:C.h1, dash:[3,3], width:1.3});
      // kritische Grenze (Drag)
      P.vline(S.crit,{color:C.rejectS, width:2.6, dash:null});
      // Labels
      P.text(S.mu0, peak*1.10, "H₀ (μ₀="+fmt.n(S.mu0,1).replace(".",",")+")", {align:"center", color:C.curve});
      P.text(S.mu1, Stats.normalPdf(S.mu1,S.mu1,M.s)*1.10, "H₁ (μ₁="+fmt.n(S.mu1,1).replace(".",",")+")", {align:"center", color:C.h1});
      P.text(S.crit, peak*1.16, "krit. Grenze", {align:"center", color:C.rejectS});
    }

    render();
  }

  /* =====================================================================
     LEKTION-OBJEKT
     ===================================================================== */
  App.registerLesson({
    id: 8,
    title: "Hypothesentests",

    formulas: [
      { group:"Lektion 8 · Methodik", name:"Entscheidung (kritischer Wert)",
        tex:"\\text{Lehne } H_0 \\text{ ab, falls } \\lvert\\text{Pr\\\"ufgr\\\"oße}\\rvert > \\text{kritische Grenze}",
        note:"Diese Lektion entscheidet immer über die Prüfgröße." },
      { group:"Lektion 8 · Methodik", name:"Entscheidung (p-Wert)",
        tex:"\\text{Lehne } H_0 \\text{ ab, falls } p\\text{-Wert} < \\alpha",
        note:"p-Wert = Überschreitungswahrscheinlichkeit unter H₀." },
      { group:"Lektion 8 · z-Test", name:"Prüfgröße z (Skript-Form)",
        tex:"z=\\sqrt{n}\\cdot\\dfrac{\\bar{x}-\\mu_0}{\\sigma}",
        note:"bei bekannter Standardabweichung σ" },
      { group:"Lektion 8 · z-Test", name:"Prüfgröße z (äquivalent)",
        tex:"z=\\dfrac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt{n}}",
        note:"identisch zur Skript-Form" },
      { group:"Lektion 8 · z-Test", name:"Kritischer Wert (zweiseitig)",
        tex:"\\pm z_{1-0{,}5\\cdot\\alpha}", note:"z. B. z_{0,975}=1,96 bei α=0,05" },
      { group:"Lektion 8 · z-Test", name:"Kritischer Wert (rechts-/linksseitig)",
        tex:"z_{1-\\alpha}\\quad\\text{bzw.}\\quad -z_{1-\\alpha}",
        note:"z. B. z_{0,95}=1,6449 bei α=0,05" },
      { group:"Lektion 8 · t-Test", name:"Prüfgröße t",
        tex:"t=\\sqrt{n}\\cdot\\dfrac{\\bar{x}-\\mu_0}{s}",
        note:"bei unbekannter Standardabweichung" },
      { group:"Lektion 8 · t-Test", name:"Korrigierte Stichprobenvarianz (Verschiebungssatz)",
        tex:"s^2=\\dfrac{n}{n-1}\\left(\\overline{x^2}-\\bar{x}^2\\right)",
        note:"Nenner n−1; erwartungstreu" },
      { group:"Lektion 8 · t-Test", name:"Stichprobenvarianz (äquivalent)",
        tex:"s^2=\\dfrac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2",
        note:"gleiches Ergebnis" },
      { group:"Lektion 8 · t-Test", name:"Kritischer Wert (t-Verteilung)",
        tex:"\\pm t_{n-1;\\,1-0{,}5\\cdot\\alpha}\\quad\\text{bzw.}\\quad t_{n-1;\\,1-\\alpha}",
        note:"Freiheitsgrade df = n−1" },
    ],

    sections: [

      /* ===================== 8.1 METHODIK ===================== */
      {
        num:"8.1", title:"Methodik",
        intro:"Wie man mit <b>einer</b> Stichprobe Aussagen über die ganze Welt wagt – und dabei ehrlich angibt, wie oft man danebenliegt.",
        blocks: [

          {t:"p", lead:true, html:"Das Grundproblem der Inferenzstatistik ist herrlich unfair: Sie haben fast nie die ganze Grundgesamtheit, sondern <b>eine</b> (oft kleine) Stichprobe – und sollen trotzdem etwas über alle aussagen. Ein <b>Hypothesentest</b> (Signifikanztest) macht das ehrlich: Er liefert nicht nur ein Ja/Nein, sondern auch die Wahrscheinlichkeit, mit der man sich beim Verallgemeinern irrt."},

          {t:"p", html:"Jeder Test startet mit einem <b>Hypothesenpaar</b>: der Nullhypothese \\(H_0\\) und der Alternativhypothese \\(H_1\\). Die beiden beschreiben zwei vollkommen konträre Grundgesamtheiten. Die ganze Aufgabe lautet: Zu welcher der beiden passt meine Stichprobe besser?"},

          {t:"def", term:"Nullhypothese \\(H_0\\)", title:"Definition",
            html:"Die Nullhypothese ist <b>konservativ</b> und vermutet <b>keinen Effekt</b>. Sie beschreibt immer jenen Zustand, in dem es nichts Spannendes zu sehen gibt: kein Unterschied, kein Zusammenhang, keine Abweichung."},
          {t:"def", term:"Alternativhypothese \\(H_1\\)", title:"Definition",
            html:"Die Alternativhypothese geht von einem <b>Effekt</b> aus. Sie ist meistens das, was die Forscherin eigentlich zeigen möchte (\"das Medikament wirkt\", \"die Schulung bringt etwas\")."},

          {t:"quote", source:"Skript, S. 201",
            html:"„Die Nullhypothese … beschreibt immer jenen Zustand, in dem es keinen Effekt gibt.\""},

          {t:"h", text:"Konservativ bis zum Beweis des Gegenteils", icon:"⚖️"},
          {t:"p", html:"Ein Test geht zunächst davon aus, dass \\(H_0\\) stimmt. Die Daten müssen ihn erst <b>vom Gegenteil überzeugen</b>. Erst wenn die Stichprobe deutlich genug gegen \\(H_0\\) spricht, lehnt man \\(H_0\\) ab. Genau dann – und nur dann – heißt das Ergebnis <b>signifikant</b>."},

          {t:"quote", source:"Skript, S. 205",
            html:"„Derartige Testverfahren werden als sehr konservativ bezeichnet (Schäfer, 2011, S. 57). Sie gehen zunächst davon aus, dass die Nullhypothese die richtige Hypothese ist und die Stichprobendaten uns erstmal vom Gegenteil überzeugen müssen, um sich gegen die Nullhypothese zu entscheiden.\""},

          {t:"aha", title:"Die Gerichts-Analogie (merken Sie sich nur diese)",
            html:"\\(H_0\\) = „<b>unschuldig</b>\". Ein Gericht verurteilt (= lehnt \\(H_0\\) ab) nur bei Beweisen jenseits vernünftigen Zweifels (= Prüfgröße jenseits der kritischen Grenze). Wird jemand <i>freigesprochen</i>, heißt das „nicht schuldig\" – <b>nicht</b> „unschuldig bewiesen\". Genauso: „\\(H_0\\) nicht ablehnen\" beweist <b>nie</b>, dass \\(H_0\\) wahr ist. Und das Risiko, einen Unschuldigen zu verurteilen, ist \\(\\alpha\\)."},

          {t:"warn", title:"Die Entscheidung fällt IMMER bzgl. \\(H_0\\)", tag:"Stolperfalle",
            html:"Es gibt nur zwei Urteile: „\\(H_0\\) ablehnen\" (Effekt) oder „\\(H_0\\) nicht ablehnen\" (kein nachweisbarer Effekt). Man <b>beweist</b> \\(H_0\\) niemals. \"Nicht ablehnen\" ist kein Sieg für \\(H_0\\), sondern nur „die Beweise reichen nicht\"."},

          {t:"h", text:"Hypothesenarten", icon:"🗂️"},
          {t:"p", html:"Je nachdem, was man vermutet, unterscheidet das Skript verschiedene Hypothesentypen (Beispiel: Pflegeberuf):"},
          {t:"list", items:[
            "<b>Test auf Lageparameter:</b> prüft, ob ein bestimmter Mittelwert in der Grundgesamtheit vorliegt (z. B. „durchschnittlich 10 Überstunden\"). Genau das machen z- und t-Test.",
            "<b>Unterschiedshypothese:</b> vermutet zwischen zwei Gruppen einen Unterschied (verdienen Männer und Frauen gleich viel?).",
            "<b>Zusammenhangshypothese:</b> vermutet eine Beziehung zwischen Variablen (hängen Arbeitsstunden und Zigarettenkonsum zusammen?).",
            "<b>Veränderungshypothese:</b> eine Unterschiedshypothese über die Zeit – eine Gruppe, mehrere Messzeitpunkte."
          ]},

          {t:"h", text:"Gerichtet vs. ungerichtet", icon:"🎯"},
          {t:"p", html:"<b>Ungerichtete (zweiseitige)</b> Hypothesen vermuten <i>keine</i> Richtung: \\(H_1\\) sagt nur „anders als\". <b>Gerichtete (einseitige)</b> Hypothesen behaupten eine Richtung („mehr als\", „weniger als\"). Wichtig: Die \\(H_0\\) enthält die Gegenrichtung <b>und immer die Gleichheit</b>."},
          {t:"table", caption:"Hypothesenpaare nach Richtung (μ₀ = 10 Überstunden)",
            headers:["Richtung","\\(H_0\\)","\\(H_1\\)"],
            rows:[
              ["zweiseitig","\\(\\mu = 10\\)","\\(\\mu \\neq 10\\)"],
              ["rechtsseitig","\\(\\mu \\le 10\\)","\\(\\mu > 10\\)"],
              ["linksseitig","\\(\\mu \\ge 10\\)","\\(\\mu < 10\\)"]
            ]},

          {t:"divider"},

          {t:"h", text:"Die Werkzeuge: α, Prüfgröße, kritischer Wert, p-Wert", icon:"🧰"},
          {t:"def", term:"Signifikanzniveau \\(\\alpha\\)", title:"Definition",
            html:"Auch <b>Irrtums-</b> oder <b>Fehlerwahrscheinlichkeit</b> genannt. \\(\\alpha\\) ist die Wahrscheinlichkeit, fälschlich gegen \\(H_0\\) zu entscheiden. Gängig: <b>5 %</b>; strenger 1 %; lockerer 10 % (oft, wenn \\(H_0\\) selbst die Forschungshypothese ist). \\(\\alpha\\) wird <b>vorab</b> festgelegt."},
          {t:"def", term:"Prüfgröße", title:"Definition",
            html:"Die Prüfgröße fasst <b>alle relevanten Stichprobeninformationen in einem einzigen Wert</b> zusammen. Sie nimmt je nach Testverfahren eine andere Gestalt an (beim z-Test ein z-Wert, beim t-Test ein t-Wert)."},
          {t:"def", term:"Kritischer Wert", title:"Definition",
            html:"Der kritische Wert wird einer bestimmten <b>Verteilung</b> entnommen (Quantil) und markiert die Grenze des <b>Ablehnungsbereichs</b>. Liegt die Prüfgröße jenseits dieser Grenze, wird \\(H_0\\) abgelehnt."},
          {t:"def", term:"p-Wert", title:"Definition",
            html:"Die <b>Überschreitungswahrscheinlichkeit</b>: die Wahrscheinlichkeit, unter Gültigkeit von \\(H_0\\) das gefundene Stichprobenergebnis <i>oder ein noch extremeres</i> zu erhalten. Statistikprogramme geben ihn aus. Faustregel: \\(p < \\alpha \\Rightarrow H_0\\) ablehnen."},

          {t:"warn", title:"Diese Lektion entscheidet über die Prüfgröße", tag:"Konvention",
            html:"Das Skript fällt die Entscheidung <b>immer</b> über Prüfgröße vs. kritischen Wert, nicht über den p-Wert. Den p-Wert lernen wir verstehen (Widget 2!), aber gerechnet wird über die kritische Grenze."},

          {t:"aha", title:"Lautstärke-Schwelle",
            html:"Stellen Sie sich die Prüfgröße als <b>Lautstärke</b> des Signals aus der Stichprobe vor und den kritischen Wert als <b>Schwelle</b>, ab der Sie hinhören. Ist das Signal lauter als die Schwelle, schlagen Sie Alarm (= \\(H_0\\) ablehnen). Ein größeres \\(n\\) ist ein besseres Mikrofon: Das Rauschen wird leiser, leise Signale werden hörbar."},

          {t:"h", text:"Die fünf Schritte eines Hypothesentests", icon:"📋"},
          {t:"list", ordered:true, items:[
            "<b>Hypothesenpaar</b> aufstellen (\\(H_0\\) vs. \\(H_1\\)).",
            "<b>Signifikanzniveau</b> \\(\\alpha\\) festlegen – vorab, niemals nachträglich anpassen!",
            "<b>Prüfgröße</b> berechnen (Stichprobe → ein Wert).",
            "<b>Kritischen Wert</b> bestimmen (Quantil) bzw. p-Wert berechnen.",
            "<b>Entscheidung</b> bzgl. \\(H_0\\) treffen."
          ]},

          {t:"formula", tex:"\\text{Lehne } H_0 \\text{ ab, falls}\\quad \\lvert\\text{Pr\\\"ufgr\\\"oße}\\rvert > \\text{kritische Grenze}",
            caption:"Entscheidungsregel über den kritischen Wert (Betragsform)"},
          {t:"formula", tex:"\\text{Lehne } H_0 \\text{ ab, falls}\\quad p\\text{-Wert} < \\alpha",
            caption:"Entscheidungsregel über den p-Wert"},

          {t:"example", title:"Methodik-Durchlauf: Überstunden (zweiseitig)",
            html:"Frage: Leisten deutsche Pfleger:innen durchschnittlich 10 Überstunden/Woche?<br>"
              +"<b>1.</b> \\(H_0:\\mu=10\\) vs. \\(H_1:\\mu\\neq 10\\) (zweiseitig).<br>"
              +"<b>2.</b> \\(\\alpha=0{,}05\\).<br>"
              +"<b>3.</b> Stichprobenmittel \\(=11{,}5\\) → Prüfgröße \\(z=2{,}2\\) (Beispielwert).<br>"
              +"<b>4.</b> Kritischer Wert \\(=1{,}96\\); p-Wert \\(=0{,}03\\) (Beispielwerte).<br>"
              +"<b>5.</b> Über kritischen Wert: \\(2{,}2 > 1{,}96\\Rightarrow\\) ablehnen. Über p-Wert: \\(0{,}03 < 0{,}05\\Rightarrow\\) ablehnen.<br>"
              +"<b>Ergebnis:</b> signifikant <i>mehr</i> als 10 Überstunden – beide Wege führen zur selben Entscheidung."},

          {t:"divider"},

          {t:"h", text:"Die zwei Fehlerarten", icon:"❌"},
          {t:"p", html:"Weil wir auf Basis einer Stichprobe entscheiden, können wir uns auf zwei Arten irren – je nachdem, was in der Realität (der Population) tatsächlich gilt:"},
          {t:"def", term:"Fehler 1. Art (\\(\\alpha\\)-Fehler)", title:"Definition",
            html:"Das <b>fälschliche Ablehnen</b> der Nullhypothese: Man sieht einen Effekt, der in Wahrheit gar nicht da ist (Fehlalarm). Seine Wahrscheinlichkeit ist genau \\(\\alpha\\)."},
          {t:"def", term:"Fehler 2. Art (\\(\\beta\\)-Fehler)", title:"Definition",
            html:"Das <b>fälschliche Beibehalten</b> der Nullhypothese: Es gibt einen Effekt, aber man übersieht ihn (verpasste Entdeckung). \\(1-\\beta\\) heißt <b>Teststärke</b> (Power)."},

          {t:"table", caption:"Tabelle 35 — Vier-Felder-Schema der Fehlerarten (Skript, S. 211)",
            headers:["Entscheidung \\ Realität","In Population gilt \\(H_0\\)","In Population gilt \\(H_1\\)"],
            rows:[
              ["Entscheidung für \\(H_0\\)","✔ korrekt","Fehler 2. Art (β)"],
              ["Entscheidung für \\(H_1\\)","Fehler 1. Art (α)","✔ korrekt"]
            ]},

          {t:"aha", title:"Die Wippe α ↔ β",
            html:"\\(\\alpha\\) und \\(\\beta\\) sitzen auf einer <b>Wippe</b>: Verschiebt man die kritische Grenze so, dass \\(\\alpha\\) kleiner wird, wird \\(\\beta\\) automatisch größer. Man kann beide Fehler nicht gleichzeitig klein zaubern – außer durch ein größeres \\(n\\), das die Kurven schmaler und die Überlappung kleiner macht. Probieren Sie es im Widget unten aus!"},

          {t:"quote", source:"Skript, S. 212",
            html:"„Auch wenn wir den β-Fehler nicht direkt beeinflussen können, so können wir ihn über α steuern, denn die beiden Fehler hängen eng – und zwar entgegengesetzt – miteinander zusammen. Wünschen wir uns einen niedrigen β-Fehler, so sollten wir α möglichst groß wählen.\""},

          {t:"h", text:"Was die Testentscheidung leichter macht", icon:"🔧"},
          {t:"list", items:[
            "<b>Gerichtet statt ungerichtet:</b> Beim einseitigen Test liegt das ganze \\(\\alpha\\) auf einer Seite, der Weg über die kritische Grenze ist kürzer → leichteres Ablehnen.",
            "<b>Größeres n:</b> Ausreißer fallen weniger ins Gewicht, der Test vertraut dem Mittelwert mehr → leichteres Ablehnen.",
            "<b>Höheres α:</b> z. B. 10 % statt 5 % vergrößert den Ablehnungsbereich → leichteres Ablehnen (aber mehr Fehlalarme)."
          ]},
          {t:"quote", source:"Skript, S. 210",
            html:"„Der Weg über die kritische Grenze hinaus ist schlichtweg beim gerichteten Test kürzer als der beim zweiseitigen Test. … Der gerichtete Test erlaubt damit ein schnelleres Ablehnen der Nullhypothese.\""},

          {t:"aha", title:"Einseitig vs. zweiseitig = Zielscheibe",
            html:"Beim zweiseitigen Test müssen Sie die 5 % auf <b>zwei</b> Ränder verteilen (je 2,5 % → Grenze bei \\(1{,}96\\)). Beim einseitigen liegen alle 5 % auf <b>einer</b> Seite (→ Grenze bei \\(1{,}6449\\)). Die Latte liegt also niedriger – aber Sie dürfen vorher nur in <i>eine</i> Richtung zielen."},

          {t:"why", title:"Warum brauche ich das?",
            html:"Hypothesentests sind die Grammatik jeder empirischen Arbeit: Wirkt das Medikament? Bringt die Umstrukturierung wirklich mehr Effizienz? Sie haben nie die ganze Population – nur eine Stichprobe. Tests quantifizieren, <b>wie sehr</b> Sie dem Ergebnis trauen dürfen. Und sie schützen vor teuren Fehlentscheidungen: Fehler 1. Art = Geld in eine wirkungslose Maßnahme stecken; Fehler 2. Art = ein wirksames Krebsmedikament verwerfen. Das „\\(p<0{,}05\\)\" in jeder Studie, jeder Bachelorarbeit, jedem A/B-Test im Marketing – das ist genau das hier."},

          {t:"widget", title:"Fehler 1. & 2. Art — die α/β-Wippe", icon:"⚖️",
            hint:"Zwei Welten: \\(H_0\\) sagt μ₀, in Wahrheit gilt μ₁. Verschiebe die rote kritische Grenze und sieh zu, wie α (Fehlalarm) und β (verpasste Entdeckung) gegeneinander kippen. Größeres n schrumpft beide.",
            render: alphaBeta },
        ]
      },

      /* ===================== 8.2 z-TEST ===================== */
      {
        num:"8.2", title:"z-Test (Erwartungswert bei bekanntem σ)",
        intro:"Der Mittelwert-Test für den Luxusfall: Wir kennen die Streuung der Grundgesamtheit bereits.",
        blocks: [

          {t:"p", lead:true, html:"z- und t-Test beantworten dieselbe Frage: Gilt ein in der Stichprobe gefundener Mittelwert auch in der Grundgesamtheit? Der Unterschied steckt allein darin, ob wir die <b>Streuung der Grundgesamtheit kennen</b>."},

          {t:"def", term:"z-Test", title:"Definition",
            html:"Der z-Test wird zum Testen auf einen <b>Erwartungswert bei bekannter Varianz</b> in der Grundgesamtheit genutzt. Als kritischen Wert verwendet er ein Quantil der <b>Standardnormalverteilung</b>."},

          {t:"quote", source:"Skript, S. 212",
            html:"„Ist uns die Varianz bzw. die Standardabweichung in der Grundgesamtheit bekannt, dann verwenden wir den z-Test und nutzen zusätzlich als kritischen Wert ein Quantil der Standardnormalverteilung.\""},

          {t:"aha", title:"z oder t? Die Ein-Satz-Faustregel",
            html:"Steht \\(\\sigma\\) der <b>Grundgesamtheit</b> in der Aufgabe? → <b>z-Test</b> (Normalverteilung). Müssen Sie die Streuung erst aus den Daten <b>schätzen</b>? → <b>t-Test</b> (t-Verteilung). In Klausuren ist \\(\\sigma^2\\) meist „freundlich gegeben\", wenn ein z-Test gemeint ist."},

          {t:"h", text:"Voraussetzungen", icon:"✅"},
          {t:"list", ordered:true, items:[
            "Die Variable ist <b>kardinalskaliert</b> (metrisch).",
            "Die Variable ist in der Grundgesamtheit (näherungsweise) <b>normalverteilt</b> – das schützt vor Verzerrung durch Ausreißer.",
            "Die Daten stammen aus einer <b>einfachen Zufallsstichprobe</b> (gilt für jeden Hypothesentest)."
          ]},

          {t:"h", text:"Die Prüfgröße", icon:"🧮"},
          {t:"p", html:"Das Skript schreibt die Prüfgröße in der „\\(\\sqrt{n}\\)-vorn\"-Form. Sie ist algebraisch identisch zur klassischen Schreibweise mit dem Standardfehler \\(\\sigma/\\sqrt{n}\\) im Nenner – aber die Zwischenschritte stimmen so exakt mit dem Skript überein:"},
          {t:"formula", tex:"z=\\sqrt{n}\\cdot\\dfrac{\\bar{x}-\\mu_0}{\\sigma}=\\dfrac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt{n}}",
            caption:"Prüfgröße des z-Tests (Skript-Form = Standardfehler-Form)"},
          {t:"formula", tex:"\\bar{x}=\\dfrac{1}{n}\\sum_{i=1}^{n}x_i \\qquad \\sigma=\\sqrt{\\sigma^2}",
            caption:"benötigte Bausteine"},
          {t:"p", html:"Dabei sind \\(n\\) der Stichprobenumfang, \\(\\bar{x}\\) der Stichprobenmittelwert, \\(\\mu_0\\) der hypothetische Mittelwert und \\(\\sigma\\) die <b>bekannte</b> Standardabweichung der Grundgesamtheit."},

          {t:"h", text:"Der kritische Wert (Tabelle 36)", icon:"📏"},
          {t:"p", html:"Der kritische Wert ist ein Quantil der Standardnormalverteilung, abgelesen über die kumulierte Wahrscheinlichkeit:"},
          {t:"formula", tex:"\\text{zweiseitig: } \\pm z_{1-0{,}5\\cdot\\alpha}\\quad\\text{rechts: } z_{1-\\alpha}\\quad\\text{links: } -z_{1-\\alpha}",
            caption:"kritische Werte je nach Richtung"},
          {t:"table", caption:"Tabelle 36 — wichtige Quantile der Standardnormalverteilung (Bornewasser-Hermes, 2023). Hinweis: Das Skript druckt bei p = 0,995 den Wert 2,5788 — ein Druckfehler; korrekt ist 2,5758.",
            headers:["kumulierte Wkt. \\(p\\)","0,9","0,95","0,975","0,99","0,995"],
            rows:[["Quantil \\(z_p\\)","1,2816","1,6449","1,96","2,3263","2,5758"]]},

          {t:"formula", tex:"\\text{Lehne } H_0 \\text{ ab, falls}\\quad |z| > z_{1-0{,}5\\cdot\\alpha}\\ \\ (\\text{zweiseitig})",
            caption:"Entscheidungsregel zweiseitig"},
          {t:"formula", tex:"z > z_{1-\\alpha}\\ (\\text{rechts}) \\qquad z < -z_{1-\\alpha}\\ (\\text{links})",
            caption:"Entscheidungsregeln einseitig"},

          {t:"divider"},

          {t:"h", text:"Leitbeispiel: Überstunden (5 Kolleg:innen)", icon:"🏥"},
          {t:"p", html:"Die Chefin behauptet, im Schnitt fielen \\(\\mu_0=7\\) Überstunden an. Fünf Kolleg:innen notieren ihre Überstunden der letzten Woche. Die Varianz der Grundgesamtheit sei bekannt: \\(\\sigma^2=4\\Rightarrow\\sigma=2\\). Die Variable sei normalverteilt, \\(\\alpha=0{,}05\\)."},
          {t:"table", caption:"Datensatz",
            headers:["i","1","2","3","4","5"],
            rows:[["\\(x_i\\)","8","10","7","5","10"]]},

          {t:"example", title:"Schritt-für-Schritt (z-Test)",
            html:"<b>Mittelwert:</b> \\(\\bar{x}=\\dfrac{8+10+7+5+10}{5}=\\dfrac{40}{5}=8\\).<br>"
              +"<b>Prüfgröße:</b> \\(z=\\sqrt{5}\\cdot\\dfrac{8-7}{2}=\\sqrt{5}\\cdot\\dfrac{1}{2}=\\mathbf{1{,}118}\\).<br>"
              +"Das Vorzeichen ist positiv, weil \\(\\bar{x}=8>\\mu_0=7\\)."},

          {t:"quote", source:"Skript, S. 216",
            html:"„Das Ergebnis fällt positiv aus, da der Mittelwert der Stichprobe (8) größer als der hypothetische Mittelwert (7) ist. Wäre es andersherum, so würde ein negatives Ergebnis resultieren.\""},

          {t:"sub", text:"Variante A — zweiseitig (\\(\\mu \\neq 7\\)?)"},
          {t:"example", title:"A · zweiseitig",
            html:"\\(H_0:\\mu=7\\) vs. \\(H_1:\\mu\\neq 7\\). Kritischer Wert \\(z_{0{,}975}=1{,}96\\).<br>"
              +"Entscheidung: \\(|1{,}118|=1{,}118 \\not> 1{,}96\\Rightarrow\\) <b>\\(H_0\\) nicht ablehnen.</b> Die Überstundenzahl weicht nicht signifikant von 7 ab."},

          {t:"sub", text:"Variante B — rechtsseitig (mehr als 7?)"},
          {t:"example", title:"B · rechtsseitig",
            html:"\\(H_0:\\mu\\le 7\\) vs. \\(H_1:\\mu> 7\\). Prüfgröße bleibt \\(z=1{,}118\\). Kritischer Wert \\(z_{0{,}95}=1{,}6449\\).<br>"
              +"Entscheidung: \\(1{,}118 \\not> 1{,}6449\\Rightarrow\\) <b>\\(H_0\\) nicht ablehnen.</b> Nicht signifikant mehr als 7."},
          {t:"quote", source:"Skript, S. 219",
            html:"„Wir sehen, dass diese kritische Grenze geringer als die beim zweiseitigen Testen ist. Es ist folglich leichter, die Nullhypothese abzulehnen.\""},

          {t:"sub", text:"Variante C — linksseitig (weniger als 7?)"},
          {t:"example", title:"C · linksseitig",
            html:"\\(H_0:\\mu\\ge 7\\) vs. \\(H_1:\\mu< 7\\). Prüfgröße \\(z=1{,}118\\). Kritischer Wert \\(-z_{0{,}95}=-1{,}6449\\).<br>"
              +"Entscheidung: \\(1{,}118 \\not< -1{,}6449\\Rightarrow\\) <b>\\(H_0\\) nicht ablehnen.</b> (Schon klar, weil die Prüfgröße entgegen der Erwartung sogar positiv ist.)"},

          {t:"warn", title:"Gesamtergebnis z-Test", tag:"Fazit",
            html:"In <b>allen drei</b> Varianten kann \\(H_0\\) nicht abgelehnt werden. Die Stichprobe liefert keinen ausreichenden Beweis gegen die Behauptung der Chefin."},

          {t:"why", title:"Warum brauche ich das?",
            html:"Der z-Test ist der einfachste „Stimmt-mein-Mittelwert?\"-Test – die Blaupause für alles Weitere. Qualitätskontrolle (\"Wiegt eine Tafel Schokolade wirklich 100 g, σ aus der Maschinen-Spec bekannt?\"), Kalibrierung, Soll-Ist-Vergleiche: überall, wo die Prozessstreuung aus Erfahrung bekannt ist."},

          {t:"widget", title:"Hypothesentest-Wizard (z & t)", icon:"🧙",
            hint:"Alle fünf Schritte live: Hypothesen, α, Prüfgröße (\\(\\sqrt{n}\\)-Form wie im Skript), kritischer Wert und Entscheidung – inklusive eingezeichnetem Ablehnungsbereich. Start = Leitbeispiel (z=1,118, krit. 1,96 → nicht ablehnen). Schalte oben auf „σ unbekannt\" für den t-Test.",
            render: wizard },
        ]
      },

      /* ===================== 8.3 t-TEST ===================== */
      {
        num:"8.3", title:"t-Test (Erwartungswert bei unbekanntem σ)",
        intro:"Der realistische Fall: Die Streuung der Grundgesamtheit kennt niemand – wir schätzen sie aus den Daten und bezahlen das mit dickeren Verteilungs-Rändern.",
        blocks: [

          {t:"p", lead:true, html:"In der Praxis kennt man \\(\\sigma\\) der Grundgesamtheit fast nie. Dann tritt der <b>t-Test</b> an: Er schätzt die Streuung aus der Stichprobe selbst und benutzt die <b>t-Verteilung</b> als Maßstab."},

          {t:"def", term:"t-Test", title:"Definition",
            html:"Der t-Test testet auf einen <b>Erwartungswert bei unbekannter Varianz</b>. Statt \\(\\sigma\\) verwendet er die aus der Stichprobe geschätzte Standardabweichung \\(s\\) und als kritischen Wert ein Quantil der <b>t-Verteilung</b> mit \\(df=n-1\\) Freiheitsgraden."},

          {t:"h", text:"Was sich gegenüber dem z-Test ändert", icon:"🔁"},
          {t:"p", html:"Nur <b>drei</b> Dinge ändern sich – der Rest (Annahmen, Ablauf, Entscheidungslogik) bleibt identisch:"},
          {t:"list", ordered:true, items:[
            "Wir berechnen die <b>Stichproben-Standardabweichung selbst</b> (sie ist nicht gegeben).",
            "Die Prüfgröße wird als <b>t-Statistik</b> berechnet (\\(s\\) statt \\(\\sigma\\) im Nenner).",
            "Der kritische Wert kommt aus der <b>t-Verteilung</b> (df = n−1)."
          ]},

          {t:"quote", source:"Skript, S. 222",
            html:"„Bis auf die Standardabweichung stimmt die t-Statistik exakt mit der z-Statistik überein (Bortz & Schuster, 2010, S. 118). … Die einzige Neuerung befindet sich im Nenner der Prüfgröße. Dort müssen wir nun die Standardabweichung auf Basis der Stichprobe berechnen.\""},

          {t:"h", text:"Die Formeln", icon:"🧮"},
          {t:"formula", tex:"t=\\sqrt{n}\\cdot\\dfrac{\\bar{x}-\\mu_0}{s}",
            caption:"Prüfgröße des t-Tests (nur s statt σ)"},
          {t:"formula", tex:"\\overline{x^2}=\\dfrac{1}{n}\\sum_{i=1}^{n}x_i^2 \\qquad s^2=\\dfrac{n}{n-1}\\left(\\overline{x^2}-\\bar{x}^2\\right)",
            caption:"Mittel der Quadrate und korrigierte Varianz (Verschiebungssatz, Nenner n−1)"},
          {t:"formula", tex:"s=\\sqrt{s^2}\\qquad df=n-1",
            caption:"Standardabweichung und Freiheitsgrade"},
          {t:"p", html:"Äquivalent kann man auch direkt \\(s^2=\\frac{1}{n-1}\\sum (x_i-\\bar{x})^2\\) rechnen – das Ergebnis ist dasselbe. Wichtig: Der Nenner ist immer <b>n−1</b> (korrigierte, erwartungstreue Stichprobenvarianz)."},

          {t:"warn", title:"Nenner n − 1, nicht n!", tag:"Stolperfalle",
            html:"Hier wird gern verwechselt: Im t-Test verwenden wir die <b>korrigierte</b> Stichprobenvarianz mit Nenner \\(n-1\\). Im Beispiel macht das aus \\(\\frac{5}{5}=1\\) ein \\(\\frac{5}{4}=1{,}25\\) als Faktor – ohne Korrektur käme eine zu kleine Varianz und damit eine zu große (geschönte) Prüfgröße heraus."},

          {t:"formula", tex:"\\text{zweiseitig: } \\pm t_{n-1;\\,1-0{,}5\\cdot\\alpha}\\quad\\text{rechts: } t_{n-1;\\,1-\\alpha}\\quad\\text{links: } -t_{n-1;\\,1-\\alpha}",
            caption:"kritische Werte der t-Verteilung je nach Richtung"},

          {t:"aha", title:"t als „Sicherheitszuschlag\"",
            html:"Wer \\(\\sigma\\) nicht kennt und aus wenigen Daten schätzt, ist <b>unsicherer</b>. Die t-Verteilung trägt dem mit <b>dickeren Rändern</b> Rechnung: Der kritische Wert ist größer als beim z-Test (bei \\(df=4\\): \\(2{,}776\\) statt \\(1{,}96\\)). Mit wachsendem \\(n\\) schrumpft der Zuschlag – die t-Verteilung nähert sich der Normalverteilung an. Bei \\(df\\to\\infty\\) sind beide identisch."},

          {t:"divider"},

          {t:"h", text:"Leitbeispiel: Überstunden – jetzt ohne bekanntes σ", icon:"🏥"},
          {t:"p", html:"Derselbe Datensatz wie beim z-Test – nur ist \\(\\sigma^2\\) der Grundgesamtheit nun <b>nicht</b> bekannt. \\(n=5\\), \\(\\mu_0=7\\), \\(\\alpha=0{,}05\\), \\(df=n-1=4\\)."},
          {t:"table", caption:"Datensatz mit Quadraten",
            headers:["i","1","2","3","4","5"],
            rows:[
              ["\\(x_i\\)","8","10","7","5","10"],
              ["\\(x_i^2\\)","64","100","49","25","100"]
            ]},

          {t:"example", title:"Schritt-für-Schritt (t-Test) — exakt wie im Skript",
            html:"<b>1. Mittelwert:</b> \\(\\bar{x}=\\dfrac{8+10+7+5+10}{5}=8\\).<br>"
              +"<b>2. Mittel der Quadrate:</b> \\(\\overline{x^2}=\\dfrac{64+100+49+25+100}{5}=\\dfrac{338}{5}=67{,}6\\).<br>"
              +"<b>3. Korrigierte Varianz:</b> \\(s^2=\\dfrac{5}{5-1}(67{,}6-8^2)=\\dfrac{5}{4}(67{,}6-64)=\\dfrac{5}{4}\\cdot 3{,}6=4{,}5\\).<br>"
              +"<b>4. Standardabweichung:</b> \\(s=\\sqrt{4{,}5}=2{,}12\\).<br>"
              +"<b>5. Prüfgröße:</b> \\(t=\\sqrt{5}\\cdot\\dfrac{8-7}{2{,}12}=\\sqrt{5}\\cdot\\dfrac{1}{2{,}12}=\\mathbf{1{,}05}\\)."},

          {t:"sub", text:"Variante A — zweiseitig"},
          {t:"example", title:"A · zweiseitig",
            html:"\\(H_0:\\mu=7\\) vs. \\(H_1:\\mu\\neq 7\\). Kritischer Wert \\(t_{4;\\,0{,}975}=2{,}776\\).<br>"
              +"Entscheidung: \\(|1{,}05|=1{,}05 \\not> 2{,}776\\Rightarrow\\) <b>\\(H_0\\) nicht ablehnen.</b> Nicht signifikant von 7 verschieden."},

          {t:"sub", text:"Variante B — rechtsseitig (mehr als 7?)"},
          {t:"example", title:"B · rechtsseitig",
            html:"\\(H_0:\\mu\\le 7\\) vs. \\(H_1:\\mu> 7\\). Prüfgröße \\(t=1{,}05\\). Kritischer Wert \\(t_{4;\\,0{,}95}=2{,}132\\).<br>"
              +"Entscheidung: \\(1{,}05 \\not> 2{,}132\\Rightarrow\\) <b>\\(H_0\\) nicht ablehnen.</b>"},

          {t:"sub", text:"Variante C — linksseitig (weniger als 7?)"},
          {t:"example", title:"C · linksseitig",
            html:"\\(H_0:\\mu\\ge 7\\) vs. \\(H_1:\\mu< 7\\). Prüfgröße \\(t=1{,}05\\). Kritischer Wert \\(-t_{4;\\,0{,}95}=-2{,}132\\).<br>"
              +"Entscheidung: \\(1{,}05 \\not< -2{,}132\\Rightarrow\\) <b>\\(H_0\\) nicht ablehnen.</b>"},

          {t:"warn", title:"Gesamtergebnis t-Test", tag:"Fazit",
            html:"Auch hier kann \\(H_0\\) in allen drei Varianten nicht abgelehnt werden. Beachten Sie: Die Prüfgröße ist mit \\(1{,}05\\) sogar kleiner als beim z-Test (\\(1{,}118\\)) <i>und</i> die Latte (kritischer Wert) liegt höher – der t-Test ist also „vorsichtiger\", weil wir \\(\\sigma\\) nur schätzen."},

          {t:"quote", source:"Skript, S. 225–226 (Zusammenfassung)",
            html:"„Ausgangspunkt einer jeden Testung bildet ein Hypothesenpaar mit Null- und Alternativhypothese. Diese beiden beschreiben zwei vollkommen konträre Grundgesamtheiten. … Ist diese [die Varianz] bekannt, wird der z-Test verwendet. Sollte das nicht der Fall sein, wird auf den t-Test zurückgegriffen.\""},

          {t:"why", title:"Warum brauche ich das?",
            html:"Der t-Test ist der mit Abstand <b>häufigste</b> Test der Welt – einfach weil σ fast nie bekannt ist. Jede Studie mit kleinem n, jeder Vorher-Nachher-Vergleich, jeder „signifikant\"-Satz in einer Bachelorarbeit beruht meistens auf einem t-Test. Wer ihn beherrscht, versteht 80 % der Statistik in Praxisberichten."},

          {t:"widget", title:"p-Wert-Visualizer", icon:"🎚️",
            hint:"Schieb den Testwert und schau zu, wie die schattierte Fläche = p-Wert mitwandert. Wechsle zwischen Normal- und t-Verteilung und zwischen ein-/zweiseitig. Start = Leitbeispiel-Prüfgröße 1,118. Ampel: p < α (grün) → ablehnen.",
            render: pValue },

          {t:"aha", title:"Brücke z ↔ t ↔ p-Wert",
            html:"Der p-Wert und die kritische-Wert-Regel sind <b>zwei Seiten derselben Medaille</b>: \\(p<\\alpha\\) ist <i>genau dann</i> wahr, wenn die Prüfgröße jenseits des kritischen Werts liegt. Das Skript entscheidet über die Prüfgröße – Statistikprogramme zeigen Ihnen den p-Wert. Mit dem Visualizer sehen Sie, dass beide immer dasselbe Urteil fällen."},
        ]
      }
    ],

    quiz: [
      { q:"Was beschreibt die Nullhypothese \\(H_0\\) grundsätzlich?",
        options:["Den vermuteten Effekt","Keinen Effekt / konservativen Status quo","Den p-Wert","Die Stichprobengröße"],
        correct:1,
        explain:"\\(H_0\\) ist konservativ und vermutet stets keinen Effekt. Die Daten müssen uns erst vom Gegenteil überzeugen." },

      { q:"Sie lehnen \\(H_0\\) ab, obwohl in der Population \\(H_0\\) tatsächlich gilt. Welcher Fehler liegt vor?",
        options:["Fehler 1. Art (α-Fehler)","Fehler 2. Art (β-Fehler)","Kein Fehler","Stichprobenfehler"],
        correct:0,
        explain:"Fälschliches Ablehnen von \\(H_0\\) = Fehler 1. Art. Seine Wahrscheinlichkeit ist genau \\(\\alpha\\)." },

      { q:"Wann verwendet man den z-Test statt des t-Tests?",
        options:["Wenn n < 30","Wenn die Varianz der Grundgesamtheit bekannt ist","Wenn α = 0,01","Wenn zweiseitig getestet wird"],
        correct:1,
        explain:"Bekanntes \\(\\sigma^2\\) → z-Test (Normalverteilung). Unbekanntes \\(\\sigma^2\\) → t-Test (t-Verteilung)." },

      { q:"Beim zweiseitigen z-Test mit α = 0,05: Wie groß ist der kritische Wert?",
        options:["1,6449","1,96","2,776","2,5758"],
        correct:1,
        explain:"\\(z_{1-0{,}5\\cdot 0{,}05}=z_{0{,}975}=1{,}96\\). Die 5 % verteilen sich auf zwei Ränder à 2,5 %." },

      { q:"Leitbeispiel (8; 10; 7; 5; 10) mit \\(\\mu_0=7\\), \\(\\sigma=2\\), \\(n=5\\): Wie lautet die z-Prüfgröße?",
        options:["0,5","1,05","1,118","2,2"],
        correct:2,
        explain:"\\(\\bar{x}=8\\), also \\(z=\\sqrt{5}\\cdot\\frac{8-7}{2}=\\frac{\\sqrt5}{2}=1{,}118\\). (1,05 wäre der t-Wert mit s=2,12.)" },

      { q:"Welcher Nenner steht in der korrigierten Stichprobenvarianz des t-Tests?",
        options:["n","n−1","√n","n+1"],
        correct:1,
        explain:"\\(s^2=\\frac{n}{n-1}(\\overline{x^2}-\\bar x^2)\\). Im Beispiel: \\(\\frac{5}{4}(67{,}6-64)=4{,}5\\)." },

      { q:"Warum ist beim einseitigen Test der kritische Wert kleiner als beim zweiseitigen (gleiches α)?",
        options:["Weil n kleiner ist","Weil das gesamte α auf nur einer Seite liegt statt geteilt","Weil σ unbekannt ist","Reiner Zufall"],
        correct:1,
        explain:"Einseitig liegt das ganze \\(\\alpha\\) auf einer Seite → niedrigere Schwelle (1,6449 statt 1,96)." },

      { q:"Die Prüfgröße ist 1,118, der kritische Wert 1,96 (zweiseitig). Wie lautet die Entscheidung?",
        options:["\\(H_0\\) ablehnen","\\(H_0\\) nicht ablehnen","Test wiederholen","β berechnen"],
        correct:1,
        explain:"\\(|1{,}118| \\not> 1{,}96\\) → \\(H_0\\) wird nicht abgelehnt, das Ergebnis ist nicht signifikant." },

      { q:"Was bedeutet der p-Wert?",
        options:["Das Signifikanzniveau","Die Wkt., unter \\(H_0\\) das beobachtete oder ein extremeres Ergebnis zu erhalten","Die Stichprobenvarianz","Den kritischen Wert"],
        correct:1,
        explain:"Der p-Wert ist die Überschreitungswahrscheinlichkeit unter Gültigkeit von \\(H_0\\). Faustregel: \\(p<\\alpha\\Rightarrow\\) ablehnen." },

      { q:"Wie hängen α- und β-Fehler zusammen?",
        options:["Gleichgerichtet","Unabhängig voneinander","Gegenläufig: senkt man α, steigt β","Sie sind immer gleich groß"],
        correct:2,
        explain:"Sie sitzen auf einer Wippe: kleineres \\(\\alpha\\) → größeres \\(\\beta\\). Nur ein größeres \\(n\\) senkt beide gleichzeitig." }
    ]
  });

})();
