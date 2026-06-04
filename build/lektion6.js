/* Lektion 6 – Spezielle Wahrscheinlichkeitsverteilungen (BSTA01-02)
   Inhalt: 6.1 Diskrete Verteilungen (Bernoulliprozess, Binomial, Geometrisch),
           6.2 Stetige Verteilungen (Normalverteilung inkl. Standardisierung/
               z-Wert/Standardnormalverteilung/Quantile/Schwankungsintervalle,
               t-Verteilung am Rande) + Bonus-Widgets Poisson & Exponential.
   Alle Berechnungen über ctx.Stats. */
(function () {
  "use strict";

  /* ---------- lokale Helfer (in IIFE gekapselt, kollidieren nie) ---------- */

  // Tabelle 33: wichtige Quantile der Standardnormalverteilung (Skript page_175).
  var Z_TABLE = { 0.9: 1.2816, 0.95: 1.6449, 0.975: 1.96, 0.99: 2.3263, 0.995: 2.5758 };

  /* ============================================================== *
   *  WIDGET 1 — Normalverteilungs-Explorer (Bell-Curve + z-Rechner) *
   * ============================================================== */
  function renderNormalExplorer(el, ctx) {
    var S = ctx.Stats, fmt = ctx.fmt, PAL = ctx.PAL;

    // Zustand (Default = Leitbeispiel Fahrtzeit N(40,4) -> mu=40, sigma=2)
    var st = { mu: 40, sigma: 2, x: 42, x2: 45, mode: "le", p: 0.95 };

    // ---- Bedienleiste ----
    var muVal = ctx.el("span", { class: "val" });
    var sgVal = ctx.el("span", { class: "val" });
    var muSl = ctx.el("input", { type: "range", min: "0", max: "100", step: "1", value: String(st.mu) });
    var sgSl = ctx.el("input", { type: "range", min: "0.5", max: "12", step: "0.1", value: String(st.sigma) });

    var muCtrl = ctx.el("div", { class: "ctrl" },
      ctx.el("label", {}, ctx.el("span", { text: "Erwartungswert μ" }), muVal), muSl);
    var sgCtrl = ctx.el("div", { class: "ctrl" },
      ctx.el("label", {}, ctx.el("span", { text: "Standardabweichung σ" }), sgVal), sgSl);
    var ctrlRow = ctx.el("div", { class: "ctrl-row" }, muCtrl, sgCtrl);

    // ---- Modus-Chips ----
    var chipDefs = [
      { k: "le", t: "P(X ≤ x)" },
      { k: "ge", t: "P(X ≥ x)" },
      { k: "bw", t: "P(x₁ ≤ X ≤ x₂)" },
      { k: "q", t: "Quantil xₚ" }
    ];
    var chips = ctx.el("div", { class: "chips" });
    var chipEls = {};
    chipDefs.forEach(function (c) {
      var ch = ctx.el("span", { class: "chip" + (c.k === st.mode ? " active" : ""), text: c.t,
        onclick: function () { st.mode = c.k; syncChips(); draw(); } });
      chipEls[c.k] = ch; chips.appendChild(ch);
    });
    function syncChips() {
      chipDefs.forEach(function (c) { chipEls[c.k].classList.toggle("active", c.k === st.mode); });
      pHint.style.display = (st.mode === "q") ? "" : "none";
      bwHint.style.display = (st.mode === "bw") ? "" : "none";
    }

    // ---- p-Slider für Quantil-Modus ----
    var pVal = ctx.el("span", { class: "val" });
    var pSl = ctx.el("input", { type: "range", min: "0.01", max: "0.99", step: "0.01", value: String(st.p) });
    var pHint = ctx.el("div", { class: "ctrl", style: { display: "none" } },
      ctx.el("label", {}, ctx.el("span", { text: "Wahrscheinlichkeit p (Quantil xₚ)" }), pVal), pSl);
    var bwHint = ctx.el("div", { class: "widget-hint", style: { display: "none" },
      html: "Tipp: Ziehe die <b>linke</b> Linie (x₁) bzw. <b>rechte</b> Linie (x₂) direkt im Diagramm." });

    // ---- Plot ----
    var plotWrap = ctx.el("div", { class: "canvas-wrap", style: { height: "300px" } });
    var readout = ctx.el("div", { class: "readout" });
    var calc = ctx.el("div", { class: "steps", style: { marginTop: "10px" } });

    el.appendChild(ctrlRow);
    el.appendChild(chips);
    el.appendChild(pHint);
    el.appendChild(bwHint);
    el.appendChild(plotWrap);
    el.appendChild(readout);
    el.appendChild(calc);

    var P = ctx.Plot(plotWrap, { ymin: 0, height: 300, padL: 56, padB: 42 });
    ctx.onCleanup(function () { P.destroy(); });

    function xRange() {
      var lo = st.mu - 4 * st.sigma, hi = st.mu + 4 * st.sigma;
      return [lo, hi];
    }
    function peak() { return S.normalPdf(st.mu, st.mu, st.sigma); }

    function draw() {
      var r = xRange();
      P.setX(r[0], r[1]);
      P.setY(0, peak() * 1.18);
      P.clear();
      var f = function (x) { return S.normalPdf(x, st.mu, st.sigma); };

      // Fläche je nach Modus
      var areaCol = "rgba(231,181,76,.34)";
      if (st.mode === "le") {
        P.area(f, r[0], clampX(st.x), { color: areaCol });
      } else if (st.mode === "ge") {
        P.area(f, clampX(st.x), r[1], { color: areaCol });
      } else if (st.mode === "bw") {
        var a = Math.min(st.x, st.x2), b = Math.max(st.x, st.x2);
        P.area(f, clampX(a), clampX(b), { color: areaCol });
      } else { // quantil
        st.x = quantileX();
        P.area(f, r[0], clampX(st.x), { color: "rgba(122,162,247,.34)" });
      }

      P.func(f, { color: PAL.gold, width: 2.5 });
      // mu-Linie
      P.vline(st.mu, { color: PAL.violet, width: 1.5, dash: [5, 4] });
      P.text(st.mu, peak() * 1.10, "μ", { color: PAL.violet, align: "center" });

      // x-Marker
      drawMarker(st.x, "x", PAL.teal);
      if (st.mode === "bw") drawMarker(st.x2, "x₂", PAL.blue);

      P.axes({ xlabel: "x", ylabel: "f(x)",
        xfmt: function (v) { return fmt.n(v, 0); },
        yfmt: function (v) { return fmt.n(v, 2); } });

      update();
    }

    function drawMarker(xv, lbl, col) {
      var cx = clampX(xv);
      P.vline(cx, { color: col, width: 2 });
      P.text(cx, peak() * 1.02, lbl + "=" + fmt.n(xv, 2), { color: col, align: "center" });
    }
    function clampX(xv) {
      var r = xRange();
      return ctx.clamp(xv, r[0], r[1]);
    }

    // Quantil x_p = mu + z_p*sigma  (z_p numerisch über inverse Phi)
    function zp(p) {
      // exakte Tabellenwerte bevorzugen (Skript-Konsistenz), sonst numerisch
      var key = Math.round(p * 1000) / 1000;
      if (Z_TABLE[key] != null) return Z_TABLE[key];
      var oneMinus = Math.round((1 - p) * 1000) / 1000;
      if (Z_TABLE[oneMinus] != null) return -Z_TABLE[oneMinus]; // Symmetrie z_p = -z_{1-p}
      return S.normalInv(p);
    }
    function quantileX() { return st.mu + zp(st.p) * st.sigma; }

    // ---- Stat-Ausgabe + Schritt-für-Schritt-Rechnung ----
    function statBox(v, l, cls) {
      return ctx.el("div", { class: "stat" + (cls ? " " + cls : "") },
        ctx.el("div", { class: "v", html: v }), ctx.el("div", { class: "l", html: l }));
    }
    function update() {
      readout.innerHTML = "";
      calc.innerHTML = "";
      var Phi = function (z) { return S.normalCdf(z); }; // Standardnormal-CDF

      if (st.mode === "le" || st.mode === "ge") {
        var z = (st.x - st.mu) / st.sigma;
        var Fle = S.normalCdf(st.x, st.mu, st.sigma);
        var prob = (st.mode === "le") ? Fle : 1 - Fle;
        var sym = st.mode === "le" ? "≤" : "≥";
        readout.appendChild(statBox(fmt.n(st.x, 2), "Wert x", "teal"));
        readout.appendChild(statBox(fmt.n(z, 4), "z-Wert", "violet"));
        readout.appendChild(statBox(fmt.pct ? fmt.pct(prob) : fmt.n(prob * 100, 2) + " %",
          "P(X " + sym + " x)", "gold"));
        addStep("Standardisieren", "z = (x − μ)/σ = (" + fmt.n(st.x, 2) + " − " + fmt.n(st.mu, 0) +
          ") / " + fmt.n(st.sigma, 2) + " = " + fmt.n(z, 4));
        if (st.mode === "le") {
          addStep("Verteilungsfunktion", "P(X ≤ " + fmt.n(st.x, 2) + ") = Φ(" + fmt.n(z, 4) + ") = " + fmt.n(Phi(z), 4));
        } else {
          addStep("Gegenwahrscheinlichkeit", "P(X ≥ " + fmt.n(st.x, 2) + ") = 1 − Φ(" + fmt.n(z, 4) +
            ") = 1 − " + fmt.n(Phi(z), 4) + " = " + fmt.n(prob, 4));
        }
        if (z < 0) addStep("Symmetrie nutzen", "Φ(" + fmt.n(z, 4) + ") = 1 − Φ(" + fmt.n(-z, 4) +
          ") = 1 − " + fmt.n(Phi(-z), 4) + " = " + fmt.n(Phi(z), 4));
        addStep("Ergebnis", "≈ " + fmt.n(prob * 100, 2) + " %");
      } else if (st.mode === "bw") {
        var a = Math.min(st.x, st.x2), b = Math.max(st.x, st.x2);
        var za = (a - st.mu) / st.sigma, zb = (b - st.mu) / st.sigma;
        var prob2 = S.normalCdf(b, st.mu, st.sigma) - S.normalCdf(a, st.mu, st.sigma);
        readout.appendChild(statBox(fmt.n(a, 2) + " … " + fmt.n(b, 2), "Intervall", "teal"));
        readout.appendChild(statBox(fmt.n(za, 4) + " / " + fmt.n(zb, 4), "z₁ / z₂", "violet"));
        readout.appendChild(statBox(fmt.n(prob2 * 100, 2) + " %", "P(x₁ ≤ X ≤ x₂)", "gold"));
        addStep("Beide z-Werte", "z₁ = (" + fmt.n(a, 2) + "−μ)/σ = " + fmt.n(za, 4) +
          ";  z₂ = (" + fmt.n(b, 2) + "−μ)/σ = " + fmt.n(zb, 4));
        addStep("Differenz der F-Werte", "F(x₂) − F(x₁) = Φ(" + fmt.n(zb, 4) + ") − Φ(" + fmt.n(za, 4) +
          ") = " + fmt.n(Phi(zb), 4) + " − " + fmt.n(Phi(za), 4) + " = " + fmt.n(prob2, 4));
        addStep("Ergebnis", "≈ " + fmt.n(prob2 * 100, 2) + " %");
      } else { // quantil
        var z3 = zp(st.p);
        var xq = quantileX();
        readout.appendChild(statBox(fmt.n(st.p, 2), "p (Anteil links)", "blue"));
        readout.appendChild(statBox(fmt.n(z3, 4), "z-Quantil zₚ", "violet"));
        readout.appendChild(statBox(fmt.n(xq, 3), "Quantil xₚ", "gold"));
        addStep("z-Quantil bestimmen", "z₍" + fmt.n(st.p, 2) + "₎ = " + fmt.n(z3, 4) +
          (st.p < 0.5 ? "   (Symmetrie: zₚ = − z₍" + fmt.n(1 - st.p, 2) + "₎)" : ""));
        addStep("Rück-Transformation", "xₚ = μ + zₚ · σ = " + fmt.n(st.mu, 0) + " + " +
          fmt.n(z3, 4) + " · " + fmt.n(st.sigma, 2) + " = " + fmt.n(xq, 3));
        addStep("Lesart", "An " + fmt.n(st.p * 100, 0) + " % der Fälle ist X ≤ " + fmt.n(xq, 2) + ".");
      }
    }
    function addStep(k, body) {
      calc.appendChild(ctx.el("div", { class: "step" },
        ctx.el("span", { class: "sk", text: k }), ctx.el("span", { html: body })));
    }

    // ---- Drag der x-/x2-Linie ----
    var dragging = null;
    function nearest(px) {
      var dx = Math.abs(P.X(st.x) - px);
      if (st.mode === "bw") {
        var dx2 = Math.abs(P.X(st.x2) - px);
        return dx2 < dx ? "x2" : "x";
      }
      return "x";
    }
    P.cv.addEventListener("pointerdown", function (e) {
      if (st.mode === "q") return; // im Quantil-Modus folgt x dem p-Slider
      var pt = P.pointer(e);
      dragging = nearest(pt.px);
      try { P.cv.setPointerCapture(e.pointerId); } catch (_) {}
      applyDrag(pt);
    });
    P.cv.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      applyDrag(P.pointer(e));
    });
    function endDrag() { dragging = null; }
    P.cv.addEventListener("pointerup", endDrag);
    P.cv.addEventListener("pointercancel", endDrag);
    function applyDrag(pt) {
      var r = xRange();
      var xv = ctx.clamp(pt.x, r[0], r[1]);
      if (dragging === "x2") st.x2 = xv; else st.x = xv;
      draw();
    }

    // ---- Slider-Events ----
    muSl.addEventListener("input", function () { st.mu = +muSl.value; draw(); });
    sgSl.addEventListener("input", function () { st.sigma = +sgSl.value; draw(); });
    pSl.addEventListener("input", function () { st.p = +pSl.value; draw(); });
    function syncLabels() {
      muVal.textContent = fmt.n(st.mu, 0);
      sgVal.textContent = fmt.n(st.sigma, 1);
      pVal.textContent = fmt.n(st.p, 2);
    }
    var origUpdate = update;
    update = function () { syncLabels(); origUpdate(); };

    P.onResize = draw;
    syncChips();
    draw();
  }

  /* ============================================================== *
   *  WIDGET 2 — Binomialverteilung (Slider n, p -> Balkendiagramm)  *
   * ============================================================== */
  function renderBinomial(el, ctx) {
    var S = ctx.Stats, fmt = ctx.fmt, PAL = ctx.PAL;
    var st = { n: 10, p: 0.25 };

    var nVal = ctx.el("span", { class: "val" });
    var pVal = ctx.el("span", { class: "val" });
    var nSl = ctx.el("input", { type: "range", min: "1", max: "50", step: "1", value: String(st.n) });
    var pSl = ctx.el("input", { type: "range", min: "0.01", max: "0.99", step: "0.01", value: String(st.p) });

    var ctrlRow = ctx.el("div", { class: "ctrl-row" },
      ctx.el("div", { class: "ctrl" }, ctx.el("label", {}, ctx.el("span", { text: "Anzahl Vorgänge n" }), nVal), nSl),
      ctx.el("div", { class: "ctrl" }, ctx.el("label", {}, ctx.el("span", { text: "Erfolgswahrscheinlichkeit p" }), pVal), pSl)
    );
    var cvWrap = ctx.el("div", { class: "canvas-wrap", style: { height: "300px" } });
    var cv = ctx.el("canvas");
    cvWrap.appendChild(cv);
    var readout = ctx.el("div", { class: "readout" });

    el.appendChild(ctrlRow);
    el.appendChild(cvWrap);
    el.appendChild(readout);

    var chart = ctx.makeChart(cv, {
      type: "bar",
      data: { labels: [], datasets: [{ label: "P(X = x)", data: [], backgroundColor: PAL.gold }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            title: function (it) { return "x = " + it[0].label; },
            label: function (it) { return "P(X=x) = " + fmt.n(it.parsed.y, 4) + "  ≈ " + fmt.n(it.parsed.y * 100, 2) + " %"; }
          } }
        },
        scales: {
          x: { title: { display: true, text: "Anzahl Erfolge x" }, grid: { display: false } },
          y: { title: { display: true, text: "P(X = x)" }, beginAtZero: true }
        }
      }
    });

    function statBox(v, l, cls) {
      return ctx.el("div", { class: "stat" + (cls ? " " + cls : "") },
        ctx.el("div", { class: "v", html: v }), ctx.el("div", { class: "l", html: l }));
    }

    function draw() {
      nVal.textContent = fmt.n(st.n, 0);
      pVal.textContent = fmt.n(st.p, 2);
      var labels = [], data = [];
      var ev = st.n * st.p;
      for (var k = 0; k <= st.n; k++) {
        labels.push(String(k));
        data.push(S.binomPmf(k, st.n, st.p));
      }
      // Balken am Erwartungswert hervorheben (nächstliegendes ganzes x)
      var evK = Math.round(ev);
      var colors = data.map(function (_, i) { return i === evK ? PAL.teal : PAL.gold; });
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = colors;
      chart.update();

      var varX = st.n * st.p * (1 - st.p);
      var sd = Math.sqrt(varX);
      readout.innerHTML = "";
      readout.appendChild(statBox(fmt.n(ev, 3), "E(X) = n·p", "teal"));
      readout.appendChild(statBox(fmt.n(varX, 3), "Var(X) = n·p·(1−p)", "violet"));
      readout.appendChild(statBox(fmt.n(sd, 3), "σ = √Var(X)", "gold"));
      readout.appendChild(statBox(fmt.n(data[evK] * 100, 2) + " %", "P(X = " + evK + ")", "blue"));
    }

    nSl.addEventListener("input", function () { st.n = +nSl.value; draw(); });
    pSl.addEventListener("input", function () { st.p = +pSl.value; draw(); });
    draw();
  }

  /* ============================================================== *
   *  WIDGET 3 — Poisson-Simulator (Bonus, über das Skript hinaus)   *
   * ============================================================== */
  function renderPoisson(el, ctx) {
    var S = ctx.Stats, fmt = ctx.fmt, PAL = ctx.PAL;
    var st = { lam: 2.5 };

    var lVal = ctx.el("span", { class: "val" });
    var lSl = ctx.el("input", { type: "range", min: "0.5", max: "15", step: "0.1", value: String(st.lam) });
    var ctrlRow = ctx.el("div", { class: "ctrl-row" },
      ctx.el("div", { class: "ctrl" }, ctx.el("label", {}, ctx.el("span", { text: "Rate λ (Erwartungswert)" }), lVal), lSl)
    );
    var cvWrap = ctx.el("div", { class: "canvas-wrap", style: { height: "280px" } });
    var cv = ctx.el("canvas"); cvWrap.appendChild(cv);
    var readout = ctx.el("div", { class: "readout" });

    el.appendChild(ctrlRow);
    el.appendChild(cvWrap);
    el.appendChild(readout);

    var chart = ctx.makeChart(cv, {
      type: "bar",
      data: { labels: [], datasets: [{ label: "P(X = k)", data: [], backgroundColor: PAL.violet }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (it) {
            return "P(X=" + it.label + ") = " + fmt.n(it.parsed.y, 4); } } }
        },
        scales: {
          x: { title: { display: true, text: "Anzahl Ereignisse k" }, grid: { display: false } },
          y: { title: { display: true, text: "P(X = k)" }, beginAtZero: true }
        }
      }
    });

    function statBox(v, l, cls) {
      return ctx.el("div", { class: "stat" + (cls ? " " + cls : "") },
        ctx.el("div", { class: "v", html: v }), ctx.el("div", { class: "l", html: l }));
    }

    function draw() {
      lVal.textContent = fmt.n(st.lam, 1);
      var kmax = Math.max(10, Math.ceil(st.lam + 4 * Math.sqrt(st.lam)));
      var labels = [], data = [];
      var evK = Math.round(st.lam);
      var colors = [];
      for (var k = 0; k <= kmax; k++) {
        labels.push(String(k));
        data.push(S.poissonPmf(k, st.lam));
        colors.push(k === evK ? PAL.teal : PAL.violet);
      }
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = colors;
      chart.update();

      readout.innerHTML = "";
      readout.appendChild(statBox(fmt.n(st.lam, 2), "E(X) = λ", "teal"));
      readout.appendChild(statBox(fmt.n(st.lam, 2), "Var(X) = λ", "violet"));
      readout.appendChild(statBox(fmt.n(Math.sqrt(st.lam), 3), "σ = √λ", "gold"));
    }

    lSl.addEventListener("input", function () { st.lam = +lSl.value; draw(); });
    draw();
  }

  /* ============================================================== *
   *  WIDGET 4 — Exponentialverteilung (Bonus, über das Skript)      *
   * ============================================================== */
  function renderExponential(el, ctx) {
    var S = ctx.Stats, fmt = ctx.fmt, PAL = ctx.PAL;
    var st = { lam: 0.5, x: 2 };

    var lVal = ctx.el("span", { class: "val" });
    var lSl = ctx.el("input", { type: "range", min: "0.05", max: "2", step: "0.05", value: String(st.lam) });
    var ctrlRow = ctx.el("div", { class: "ctrl-row" },
      ctx.el("div", { class: "ctrl" }, ctx.el("label", {}, ctx.el("span", { text: "Rate λ" }), lVal), lSl)
    );
    var plotWrap = ctx.el("div", { class: "canvas-wrap", style: { height: "260px" } });
    var readout = ctx.el("div", { class: "readout" });
    el.appendChild(ctrlRow);
    el.appendChild(ctx.el("div", { class: "widget-hint", html: "Ziehe die senkrechte Linie, um P(X ≤ x) (gefärbte Fläche) zu verändern." }));
    el.appendChild(plotWrap);
    el.appendChild(readout);

    var P = ctx.Plot(plotWrap, { ymin: 0, height: 260, padL: 52, padB: 40 });
    ctx.onCleanup(function () { P.destroy(); });

    function xmax() { return Math.min(40, 5 / st.lam); }
    function statBox(v, l, cls) {
      return ctx.el("div", { class: "stat" + (cls ? " " + cls : "") },
        ctx.el("div", { class: "v", html: v }), ctx.el("div", { class: "l", html: l }));
    }
    function draw() {
      lVal.textContent = fmt.n(st.lam, 2);
      var xm = xmax();
      st.x = ctx.clamp(st.x, 0, xm);
      P.setX(0, xm);
      P.setY(0, st.lam * 1.15);
      P.clear();
      var f = function (x) { return S.expPdf(x, st.lam); };
      P.area(f, 0, st.x, { color: "rgba(122,162,247,.34)" });
      P.func(f, { color: PAL.blue, width: 2.5 });
      P.vline(st.x, { color: PAL.teal, width: 2 });
      P.text(st.x, st.lam * 1.05, "x=" + fmt.n(st.x, 2), { color: PAL.teal, align: "center" });
      P.axes({ xlabel: "x (Wartezeit)", ylabel: "f(x)",
        xfmt: function (v) { return fmt.n(v, 1); }, yfmt: function (v) { return fmt.n(v, 2); } });

      var cdf = S.expCdf(st.x, st.lam);
      readout.innerHTML = "";
      readout.appendChild(statBox(fmt.n(1 / st.lam, 3), "E(X) = 1/λ", "teal"));
      readout.appendChild(statBox(fmt.n(1 / (st.lam * st.lam), 3), "Var(X) = 1/λ²", "violet"));
      readout.appendChild(statBox(fmt.n(cdf * 100, 2) + " %", "P(X ≤ x) = 1 − e^(−λx)", "gold"));
    }
    var drag = false;
    P.cv.addEventListener("pointerdown", function (e) {
      drag = true; try { P.cv.setPointerCapture(e.pointerId); } catch (_) {}
      st.x = ctx.clamp(P.pointer(e).x, 0, xmax()); draw();
    });
    P.cv.addEventListener("pointermove", function (e) {
      if (!drag) return; st.x = ctx.clamp(P.pointer(e).x, 0, xmax()); draw();
    });
    P.cv.addEventListener("pointerup", function () { drag = false; });
    P.cv.addEventListener("pointercancel", function () { drag = false; });
    lSl.addEventListener("input", function () { st.lam = +lSl.value; draw(); });
    P.onResize = draw;
    draw();
  }

  /* ============================================================== *
   *                   LEKTION-OBJEKT REGISTRIEREN                   *
   * ============================================================== */
  App.registerLesson({
    id: 6,
    title: "Spezielle Verteilungen",

    formulas: [
      { group: "Lektion 6 · Binomialverteilung", name: "Wahrscheinlichkeitsfunktion",
        tex: "P(X=x)=\\binom{n}{x}\\,p^{x}\\,(1-p)^{\\,n-x}", note: "x = 0,1,…,n Erfolge" },
      { group: "Lektion 6 · Binomialverteilung", name: "Binomialkoeffizient",
        tex: "\\binom{n}{x}=\\frac{n!}{x!\\,(n-x)!}", note: "Taschenrechner: nCr" },
      { group: "Lektion 6 · Binomialverteilung", name: "Erwartungswert",
        tex: "E(X)=n\\cdot p", note: "" },
      { group: "Lektion 6 · Binomialverteilung", name: "Varianz",
        tex: "\\operatorname{Var}(X)=n\\cdot p\\cdot(1-p)", note: "Modell-Varianz, kein n−1" },
      { group: "Lektion 6 · Binomialverteilung", name: "Standardabweichung",
        tex: "\\sigma=\\sqrt{n\\cdot p\\cdot(1-p)}", note: "" },

      { group: "Lektion 6 · Geometrische Verteilung", name: "Wahrscheinlichkeitsfunktion",
        tex: "P(X=x)=p\\cdot(1-p)^{x}", note: "x = Misserfolge bis 1. Erfolg" },
      { group: "Lektion 6 · Geometrische Verteilung", name: "Erwartungswert",
        tex: "E(X)=\\frac{1-p}{p}", note: "" },
      { group: "Lektion 6 · Geometrische Verteilung", name: "Varianz",
        tex: "\\operatorname{Var}(X)=\\frac{1-p}{p^{2}}", note: "" },

      { group: "Lektion 6 · Normalverteilung", name: "Dichtefunktion",
        tex: "f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\,e^{-\\frac12\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
        note: "Glockenkurve, X ~ N(μ, σ²)" },
      { group: "Lektion 6 · Normalverteilung", name: "Standardisierung (z-Wert)",
        tex: "z=\\frac{x-\\mu}{\\sigma}", note: "Umrechnung in Standardnormal" },
      { group: "Lektion 6 · Normalverteilung", name: "Verteilungsfunktion",
        tex: "P(X\\le x)=F_X(x)=\\Phi\\!\\left(\\frac{x-\\mu}{\\sigma}\\right)=\\Phi(z)", note: "" },
      { group: "Lektion 6 · Normalverteilung", name: "Symmetrie",
        tex: "\\Phi(-z)=1-\\Phi(z)", note: "deckt linke Tabellenhälfte ab" },
      { group: "Lektion 6 · Normalverteilung", name: "„mindestens / mehr als\"",
        tex: "P(X\\ge x)=1-F_X(x)", note: "" },
      { group: "Lektion 6 · Normalverteilung", name: "„zwischen\"",
        tex: "P(x_1\\le X\\le x_2)=F_X(x_2)-F_X(x_1)", note: "" },
      { group: "Lektion 6 · Normalverteilung", name: "Quantil (Umkehrung)",
        tex: "x_p=\\mu+z_p\\cdot\\sigma", note: "z_p aus Tabelle 33" },
      { group: "Lektion 6 · Normalverteilung", name: "Quantil-Symmetrie",
        tex: "z_p=-\\,z_{\\,1-p}", note: "für p < 0,5" }
    ],

    sections: [
      /* ====================================================== *
       *  6.1  DISKRETE VERTEILUNGEN                              *
       * ====================================================== */
      {
        num: "6.1",
        title: "Diskrete Verteilungen",
        intro: "Wenn das Leben würfelt: Bernoulli, Binomial und Geometrisch – drei Modelle, die zählen statt raten.",
        blocks: [
          { t: "p", lead: true, html: "Diskrete Verteilungsmodelle sind <b>Fertig-Bausätze</b> für Zufallsvariablen, die nur wenige, abzählbare Werte annehmen können: 0, 1, 2, 3 Erfolge – aber nie 2,7 Erfolge. Statt jede Wahrscheinlichkeit mühsam einzeln auszurechnen, setzt du nur zwei, drei Parameter ein und das Modell spuckt Wahrscheinlichkeit, Erwartungswert und Varianz aus." },

          { t: "h", text: "Der Bernoulliprozess – das Fundament", icon: "🪙" },
          { t: "p", html: "Bevor wir verteilen, müssen wir münzen. Ein <b>Bernoullivorgang</b> ist ein einzelner Versuch mit genau zwei Ausgängen: das interessierende Ereignis \\(A\\) tritt ein (<i>Erfolg</i>, Wahrscheinlichkeit \\(p\\)) – oder es tritt nicht ein (<i>Misserfolg</i>, Wahrscheinlichkeit \\(1-p\\)). Reiht man mehrere solcher Vorgänge aneinander, entsteht ein <b>Bernoulliprozess</b>." },
          { t: "def", term: "Bernoulliprozess", title: "Definition",
            html: "Ein Bernoulliprozess besteht aus mehreren Bernoullivorgängen, für die zwei Annahmen gelten: (1) die Vorgänge sind <b>unabhängig</b> voneinander, und (2) die Erfolgswahrscheinlichkeit \\(p\\) bleibt bei jedem Vorgang <b>konstant</b>. Er liegt mehreren diskreten Verteilungsmodellen zugrunde." },
          { t: "quote", html: "Ein Bernoulliprozess liegt bestimmten diskreten Verteilungsmodellen zugrunde.", source: "Originalton, Bornewasser-Hermes (2023)" },
          { t: "p", html: "Aus einem Bernoulliprozess kann man zwei verschiedene Dinge zählen – und genau daraus werden zwei Verteilungen:" },
          { t: "list", items: [
            "<b>Anzahl der Erfolge</b> bei <i>fester</i> Anzahl \\(n\\) Vorgängen → <b>Binomialverteilung</b>.",
            "<b>Anzahl der Misserfolge bis zum ersten Erfolg</b> → <b>Geometrische Verteilung</b>."
          ] },
          { t: "example", title: "Leitbeispiel: Die Single-Choice-Klausur", html:
            "Stell dir vor, du sitzt in einer Klausur, die ausschließlich aus Single-Choice-Aufgaben besteht. Jede Aufgabe hat <b>vier</b> Antwortmöglichkeiten, genau eine ist richtig. Du hast nichts gelernt und rätst.<br><br>Erfolg \\(A\\) = richtige Antwort erraten. Damit ist \\(p=P(A)=\\tfrac14=0{,}25\\) und \\(1-p=0{,}75\\). Da die Aufgaben unabhängig sind und \\(p\\) konstant bleibt, ist das ein <b>lupenreiner Bernoulliprozess</b> – die Grundlage für alles, was jetzt kommt." },
          { t: "aha", title: "Aha: Zählen vs. Warten", html:
            "Dieselbe Münze, zwei Fragen. <b>Binomial</b> fragt: „Wie viele <i>Treffer</i> in \\(n\\) Versuchen?\" <b>Geometrisch</b> fragt: „Wie viele <i>Nieten</i>, bis der erste Treffer kommt?\" Beides aus exakt demselben Klausur-Beispiel – nur die Frage ändert sich." },

          { t: "divider" },

          /* ---------- 6.1.1 Binomialverteilung ---------- */
          { t: "h", text: "6.1.1  Binomialverteilung", icon: "🎯" },
          { t: "p", html: "Eine <b>binomialverteilte</b> Zufallsvariable \\(X\\) zählt die <b>Anzahl der Erfolge</b> innerhalb einer <i>festen</i> Zahl \\(n\\) unabhängiger Bernoullivorgänge. Sie hat zwei Parameter: \\(n\\) (wie oft) und \\(p\\) (Erfolgswahrscheinlichkeit). Möglich sind \\(x \\in \\{0,1,2,\\dots,n\\}\\) Erfolge." },
          { t: "def", term: "Binomialverteilung", title: "Definition",
            html: "Eine binomialverteilte Zufallsvariable zählt die Anzahl der Erfolge bei \\(n\\) unabhängigen Bernoullivorgängen mit konstanter Erfolgswahrscheinlichkeit \\(p\\)." },
          { t: "formula", tex: "P(X=x)=\\binom{n}{x}\\cdot p^{x}\\cdot(1-p)^{\\,n-x}\\qquad x\\in\\{0,1,\\dots,n\\}", caption: "Wahrscheinlichkeitsfunktion" },
          { t: "formula", tex: "\\binom{n}{x}=\\frac{n!}{x!\\,(n-x)!}", caption: "Binomialkoeffizient (Taschenrechnertaste „nCr\")" },
          { t: "quote", html: "Der Binomialkoeffizient zählt die Möglichkeiten, bei n Vorgängen x Erfolge zu erzielen.", source: "Randspalte, Bornewasser-Hermes (2023)" },
          { t: "p", html: "Der Trick: \\(p^x\\) liefert die Wahrscheinlichkeit für \\(x\\) Erfolge, \\((1-p)^{n-x}\\) für die übrigen Misserfolge – und der Binomialkoeffizient zählt, auf wie viele <i>Reihenfolgen</i> das passieren kann." },
          { t: "formula", tex: "E(X)=n\\cdot p\\qquad\\operatorname{Var}(X)=n\\cdot p\\cdot(1-p)\\qquad\\sigma=\\sqrt{n\\,p\\,(1-p)}", caption: "Kennzahlen der Binomialverteilung" },

          { t: "example", title: "Leitbeispiel durchgerechnet: 10 Aufgaben, p = 0,25", html:
            "<b>Frage 1 – genau zwei richtig</b> (\\(x=2\\)):<br>" +
            "\\[P(X=2)=\\binom{10}{2}\\cdot 0{,}25^{2}\\cdot 0{,}75^{8}=45\\cdot 0{,}0625\\cdot 0{,}1001=0{,}282\\;\\;(28{,}2\\,\\%)\\]" +
            "<b>Frage 2 – genau sieben richtig</b> (\\(x=7\\)):<br>" +
            "\\[P(X=7)=\\binom{10}{7}\\cdot 0{,}25^{7}\\cdot 0{,}75^{3}=120\\cdot 0{,}25^{7}\\cdot 0{,}75^{3}=0{,}0031\\;\\;(0{,}31\\,\\%)\\]" +
            "<b>Frage 3 – weniger als zwei richtig</b> (\\(x<2\\), also \\(x=0\\) oder \\(x=1\\)):<br>" +
            "\\[P(X<2)=P(0)+P(1)=0{,}75^{10}+10\\cdot 0{,}25\\cdot 0{,}75^{9}=0{,}0563+0{,}1877=0{,}244\\;\\;(24{,}4\\,\\%)\\]" },
          { t: "example", title: "Erwartungswert, Varianz, Standardabweichung", html:
            "\\[E(X)=n\\cdot p=10\\cdot 0{,}25=2{,}5\\]" +
            "\\[\\operatorname{Var}(X)=n\\cdot p\\cdot(1-p)=10\\cdot 0{,}25\\cdot 0{,}75=1{,}875\\]" +
            "\\[\\sigma=\\sqrt{1{,}875}=1{,}369\\]" +
            "Heißt: Bei zehn geratenen Aufgaben erwarten wir <b>2,5 ± 1,369</b> richtige – also irgendwo zwischen 1 und 4 Treffer ist die realistische Bandbreite. Vom Bestehen sind wir damit Lichtjahre entfernt." },
          { t: "why", title: "Warum brauche ich das?", html:
            "Die Binomialverteilung steckt überall, wo etwas „funktioniert oder nicht\" und man es mehrfach wiederholt: <b>Qualitätskontrolle</b> (wie viele defekte Teile in einer Charge von 100?), <b>Conversion-Rates</b> im Marketing, <b>Wahlhochrechnungen</b>, A/B-Tests. Immer dieselbe Frage: „Wie viele Erfolge bei \\(n\\) Versuchen?\"" },

          { t: "table", caption: "Binomial-PMF für n = 10, p = 0,25 (Quelle: Skript + Formel)", compact: true,
            headers: ["x (richtige)", "P(X = x)", "kumuliert P(X ≤ x)"],
            highlight: [2, 7],
            rows: [
              ["0", "0,0563", "0,0563"],
              ["1", "0,1877", "0,2440"],
              ["2", "0,2816", "0,5256"],
              ["3", "0,2503", "0,7759"],
              ["4", "0,1460", "0,9219"],
              ["5", "0,0584", "0,9803"],
              ["6", "0,0162", "0,9965"],
              ["7", "0,0031", "0,9996"],
              ["8", "0,00039", "≈ 1,0000"],
              ["9", "0,0000295", "≈ 1,0000"],
              ["10", "0,00000095", "1,0000"]
            ] },

          { t: "widget", title: "Binomial-Labor: Slider für n und p", icon: "📊",
            hint: "Default n = 10, p = 0,25 (Klausur-Beispiel). Der teal Balken markiert den Wert, der dem Erwartungswert E(X) = n·p am nächsten liegt.",
            render: renderBinomial },

          { t: "divider" },

          /* ---------- 6.1.2 Geometrische Verteilung ---------- */
          { t: "h", text: "6.1.2  Geometrische Verteilung", icon: "⏳" },
          { t: "p", html: "Jetzt drehen wir die Frage um. Eine <b>geometrisch verteilte</b> Zufallsvariable zählt die <b>Anzahl der Misserfolge bis zum ersten Erfolg</b> – du wartest also auf den ersten Treffer und zählst die Nieten davor. Entscheidender Unterschied: Es gibt <b>nur einen Parameter</b>, nämlich \\(p\\). Die Zahl der Versuche \\(n\\) ist nicht vorgegeben – sie ist gerade das, was beobachtet wird." },
          { t: "def", term: "Geometrische Verteilung", title: "Definition",
            html: "Eine geometrisch verteilte Zufallsvariable zählt die Misserfolge bis zum ersten Erfolg. Träger: \\(x\\in\\{0,1,2,\\dots\\}\\) (theoretisch unendlich)." },
          { t: "quote", html: "Eine geometrisch verteilte Zufallsvariable zählt die Misserfolge bis zum ersten Erfolg.", source: "Randspalte, Bornewasser-Hermes (2023)" },
          { t: "warn", title: "Stolperfalle: Parametrisierung", tag: "Achtung",
            html: "Das Skript zählt die <b>Misserfolge vor</b> dem ersten Erfolg (\\(x=0,1,2,\\dots\\)) – nicht die Nummer des ersten Erfolgs. Deshalb steht im Exponenten \\(x\\) und <b>nicht</b> \\(x-1\\). Andere Bücher zählen anders; pass auf, welche Variante gemeint ist." },
          { t: "formula", tex: "P(X=x)=p\\cdot(1-p)^{x}\\qquad x\\in\\{0,1,2,\\dots\\}", caption: "Wahrscheinlichkeitsfunktion" },
          { t: "formula", tex: "E(X)=\\frac{1-p}{p}\\qquad\\operatorname{Var}(X)=\\frac{1-p}{p^{2}}\\qquad\\sigma=\\sqrt{\\frac{1-p}{p^{2}}}", caption: "Kennzahlen der geometrischen Verteilung" },

          { t: "example", title: "Leitbeispiel durchgerechnet: p = 0,25", html:
            "Eingesetzt: \\(P(X=x)=0{,}25\\cdot 0{,}75^{x}\\).<br><br>" +
            "<b>Frage 1 – die dritte Aufgabe ist die erste richtige</b> (also 2 Fehlversuche, \\(x=2\\)):<br>" +
            "\\[P(X=2)=0{,}25\\cdot 0{,}75^{2}=0{,}1406\\;\\;(14{,}06\\,\\%)\\]" +
            "<b>Frage 2 – spätestens die zweite Aufgabe wird erraten</b> (\\(x\\le 1\\)):<br>" +
            "\\[P(X\\le 1)=P(0)+P(1)=0{,}25+0{,}1875=0{,}4375\\;\\;(43{,}75\\,\\%)\\]" },
          { t: "example", title: "Erwartungswert, Varianz, Standardabweichung", html:
            "\\[E(X)=\\frac{1-p}{p}=\\frac{0{,}75}{0{,}25}=3\\]" +
            "\\[\\operatorname{Var}(X)=\\frac{1-p}{p^{2}}=\\frac{0{,}75}{0{,}0625}=12\\]" +
            "\\[\\sigma=\\sqrt{12}=3{,}46\\]" +
            "Im Schnitt produzieren wir also <b>3 ± 3,46</b> Fehlversuche, bis die erste Single-Choice-Aufgabe sitzt. Die große Streuung verrät: Beim Raten ist alles drin." },
          { t: "aha", title: "Aha: Die Varianz ist hier riesig", html:
            "Beim Warten auf den ersten Erfolg kann es ganz schnell gehen – oder ewig dauern. Diese Asymmetrie schlägt sich in einer Standardabweichung nieder, die <b>größer</b> ist als der Erwartungswert selbst (3,46 > 3). Geduld ist ein extrem schwankendes Gut." },

          { t: "table", caption: "Geometrische PMF, p = 0,25  (P(X=x) = 0,25 · 0,75ˣ)", compact: true,
            headers: ["x (Fehlversuche)", "P(X = x)"],
            highlight: [2],
            rows: [
              ["0", "0,2500"], ["1", "0,1875"], ["2", "0,1406"], ["3", "0,1055"],
              ["4", "0,0791"], ["5", "0,0593"], ["6", "0,0445"], ["7", "0,0334"], ["8", "0,0250"]
            ] },

          { t: "divider" },

          /* ---------- Bonus: Poisson ---------- */
          { t: "h", text: "Bonus: Poisson-Verteilung", icon: "🚀" },
          { t: "warn", title: "Über das Skript hinaus", tag: "Vertiefung",
            html: "Die <b>Poisson-Verteilung kommt in Lektion 6 nicht vor</b> und ist <b>nicht prüfungsrelevant</b> für diese Lektion. Sie ist als Brücke gedacht: Eine Binomialverteilung mit großem \\(n\\) und kleinem \\(p\\) verhält sich nahezu wie eine Poisson-Verteilung mit \\(\\lambda=n\\cdot p\\)." },
          { t: "p", html: "Die Poisson-Verteilung zählt <b>seltene Ereignisse pro Zeit- oder Raumintervall</b>: Anrufe pro Stunde im Callcenter, Tippfehler pro Seite, Mails pro Minute. Sie hat genau einen Parameter \\(\\lambda\\) – und kurioserweise sind Erwartungswert und Varianz beide gleich \\(\\lambda\\)." },
          { t: "formula", tex: "P(X=k)=\\frac{\\lambda^{k}\\,e^{-\\lambda}}{k!}\\qquad E(X)=\\lambda\\qquad\\operatorname{Var}(X)=\\lambda", caption: "Poisson-Verteilung (Bonus)" },
          { t: "widget", title: "Poisson-Simulator: λ-Slider", icon: "🎲",
            hint: "Default λ = 2,5 – exakt der Erwartungswert n·p des Klausur-Beispiels. Schöne Brücke zwischen Binomial und Poisson.",
            render: renderPoisson }
        ]
      },

      /* ====================================================== *
       *  6.2  STETIGE VERTEILUNGEN                               *
       * ====================================================== */
      {
        num: "6.2",
        title: "Stetige Verteilungen",
        intro: "Die Glockenkurve, der z-Wert und warum eine einzelne Fahrtzeit Wahrscheinlichkeit null hat.",
        blocks: [
          { t: "p", lead: true, html: "Bei <b>stetigen</b> Zufallsvariablen sind plötzlich <i>alle</i> Werte eines Intervalls möglich – jede Fahrtzeit zwischen 38 und 42 Minuten, auch 40,173 Minuten. Statt einer Wahrscheinlichkeitsfunktion gibt es eine <b>Dichtefunktion</b>, und Wahrscheinlichkeiten sind <b>Flächen</b> unter dieser Kurve. Die Gesamtfläche ist immer 1 (= 100 %)." },
          { t: "quote", html: "Die gesamte Fläche unterhalb der Dichtefunktion ergibt 1 bzw. 100 %, denn die Wahrscheinlichkeit, irgendeine Fahrtzeit zur Arbeit zu benötigen, liegt bei 100 %.", source: "Originalton, Bornewasser-Hermes (2023)" },
          { t: "aha", title: "Aha: Fläche statt Höhe", html:
            "Bei stetigen Variablen zählt die <b>Fläche</b>, nicht die Höhe der Kurve. Deshalb ist \\(P(X=41)=0\\): Ein einzelner Punkt ist eine Linie ohne Breite – und eine Linie hat keine Fläche. Wahrscheinlichkeit entsteht erst, wenn man ein <i>Intervall</i> betrachtet." },

          { t: "divider" },

          /* ---------- 6.2.1 Normalverteilung ---------- */
          { t: "h", text: "6.2.1  Normalverteilung", icon: "🔔" },
          { t: "p", html: "Die <b>Normalverteilung</b> ist die wichtigste stetige Verteilung überhaupt. Unzählige Alltagsgrößen folgen ihr: <b>IQ-Werte</b>, <b>Klausurpunktzahlen</b>, Körpergrößen. Typisch ist: ein mittlerer Bereich ist sehr wahrscheinlich, extreme Ränder sind selten. Das Ergebnis ist die berühmte symmetrische <b>Glockenkurve</b>." },
          { t: "def", term: "Normalverteilung", title: "Definition",
            html: "Eine normalverteilte Zufallsvariable verteilt sich symmetrisch um ihren Erwartungswert \\(\\mu\\). Sie wird durch zwei Parameter beschrieben: Erwartungswert \\(\\mu\\) und Varianz \\(\\sigma^{2}\\). Schreibweise: \\(X\\sim N(\\mu,\\sigma^{2})\\)." },
          { t: "quote", html: "Eine normalverteilte Zufallsvariable verteilt sich symmetrisch um einen Erwartungswert.", source: "Randspalte, Bornewasser-Hermes (2023)" },
          { t: "p", html: "Wegen der Symmetrie fällt der <b>Median mit dem Erwartungswert zusammen</b>: \\(P(X\\le\\mu)=0{,}5\\). Eine kleine Varianz macht die Glocke <i>steil und schmal</i>, eine große Varianz <i>flach und breit</i> – das Zentrum bleibt aber immer bei \\(\\mu\\)." },
          { t: "quote", html: "Damit entspricht der Erwartungswert einer normalverteilten Zufallsvariable exakt dem Median.", source: "Originalton, Bornewasser-Hermes (2023)" },
          { t: "formula", tex: "f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\;e^{-\\frac12\\left(\\frac{x-\\mu}{\\sigma}\\right)^{2}}", caption: "Dichtefunktion der Normalverteilung" },

          { t: "example", title: "Leitbeispiel: Die Fahrtzeit zur Arbeit", html:
            "Wir betrachten \\(X\\) = Fahrtzeit zur Arbeit. Bekannt ist: \\(X\\) ist normalverteilt mit Erwartungswert <b>40 Minuten</b> und Varianz <b>4</b>, also \\(X\\sim N(40,4)\\).<br><br>" +
            "Daraus folgt sofort die Standardabweichung: \\(\\sigma=\\sqrt{4}=2\\) Minuten. Die Glocke ist also bei \\(x=40\\) am höchsten (Dichtemaximum \\(\\approx 0{,}1995\\)) und reicht praktisch von rund 34 bis 46 Minuten. Dieses Beispiel zieht sich jetzt durch das ganze Kapitel." },

          { t: "sub", text: "Standardnormalverteilung & Standardisierung (z-Wert)" },
          { t: "p", html: "Problem: Jede Normalverteilung sieht anders aus – andere \\(\\mu\\), andere \\(\\sigma\\). Man bräuchte unendlich viele Tabellen. Die Lösung ist die <b>Standardnormalverteilung</b>: der Spezialfall mit \\(\\mu=0\\) und \\(\\sigma^2=\\sigma=1\\). Ihre standardnormalverteilte Variable heißt \\(Z\\), und für sie existiert <b>eine einzige</b> Tabelle der kumulierten Wahrscheinlichkeiten \\(\\Phi(z)\\)." },
          { t: "def", term: "Standardnormalverteilung", title: "Definition",
            html: "Die Standardnormalverteilung ist der Spezialfall der Normalverteilung mit \\(\\mu=0\\) und \\(\\sigma^{2}=\\sigma=1\\). Ihre Zufallsvariable wird mit \\(Z\\) bezeichnet." },
          { t: "p", html: "Über die <b>Standardisierung</b> lässt sich jede Normalverteilung in die Standardnormalverteilung umrechnen. Der \\(z\\)-Wert sagt: <i>Wie viele Standardabweichungen ist \\(x\\) vom Mittelwert \\(\\mu\\) entfernt?</i>" },
          { t: "formula", tex: "z=\\frac{x-\\mu}{\\sigma}\\qquad\\Longrightarrow\\qquad P(X\\le x)=F_X(x)=\\Phi\\!\\left(\\frac{x-\\mu}{\\sigma}\\right)=\\Phi(z)", caption: "Standardisierung und Verteilungsfunktion" },
          { t: "quote", html: "Das Standardisieren erfolgt, indem vom relevanten Wert x der Erwartungswert μ abgezogen und diese Differenz durch die Standardabweichung σ geteilt wird.", source: "Originalton, Bornewasser-Hermes (2023)" },
          { t: "aha", title: "Aha: z-Wert = Maßband umrechnen", html:
            "Der \\(z\\)-Wert übersetzt jeden beliebigen Wert in die genormte Frage „Wie viele \\(\\sigma\\) weg von \\(\\mu\\)?\". Egal ob Fahrtzeiten in Minuten, IQ-Punkte oder Euro – nach der Standardisierung sprechen alle dieselbe Sprache, und <b>eine</b> Tabelle reicht für <b>alle</b> Normalverteilungen. So wie °C und °F sich in eine gemeinsame Skala umrechnen lassen." },
          { t: "formula", tex: "\\Phi(-z)=1-\\Phi(z)", caption: "Symmetrie – deckt negative z-Werte gratis ab" },
          { t: "p", html: "Die Tabelle listet nur <b>positive</b> \\(z\\)-Werte. Für negative nutzt man die Symmetrie \\(\\Phi(-z)=1-\\Phi(z)\\). Ein paar Ankerwerte zum Merken: \\(\\Phi(1)=0{,}8413\\), \\(\\Phi(2)=0{,}9772\\), \\(\\Phi(0{,}5)=0{,}6915\\), \\(\\Phi(2{,}53)=0{,}9943\\)." },
          { t: "formula", tex: "P(X\\ge x)=1-F_X(x)\\qquad\\qquad P(x_1\\le X\\le x_2)=F_X(x_2)-F_X(x_1)", caption: "„mindestens\" und „zwischen\"" },

          { t: "example", title: "Fragen des Leitbeispiels – durchgerechnet (X ~ N(40, 4))", html:
            "<b>F1 – höchstens 42 Minuten:</b>" +
            "\\[P(X\\le 42)=\\Phi\\!\\left(\\tfrac{42-40}{2}\\right)=\\Phi(1)=0{,}8413\\;\\;(84{,}13\\,\\%)\\]" +
            "<b>F2 – weniger als 42 Minuten:</b> Bei stetigen Variablen gilt „&lt;\" = „≤\", also ebenfalls <b>84,13 %</b>.<br><br>" +
            "<b>F3 – weniger als 36 Minuten</b> (negativer z-Wert):" +
            "\\[P(X<36)=\\Phi\\!\\left(\\tfrac{36-40}{2}\\right)=\\Phi(-2)=1-\\Phi(2)=1-0{,}9772=0{,}0228\\;\\;(2{,}28\\,\\%)\\]" +
            "<b>F4 – mindestens 42 Minuten:</b>" +
            "\\[P(X\\ge 42)=1-\\Phi(1)=1-0{,}8413=0{,}1587\\;\\;(15{,}87\\,\\%)\\]" +
            "<b>F5 – zwischen 39 und 42 Minuten:</b>" +
            "\\[P(39\\le X\\le 42)=\\Phi(1)-\\Phi(-0{,}5)=0{,}8413-(1-0{,}6915)=0{,}8413-0{,}3085=0{,}5328\\;\\;(53{,}28\\,\\%)\\]" },
          { t: "quote", html: "Die exakte Wahrscheinlichkeit an einer ganz bestimmten Stelle geht immer in Richtung 0.", source: "Originalton (zu P(X = 41) → 0), Bornewasser-Hermes (2023)" },

          { t: "sub", text: "Quantile – die Umkehraufgabe" },
          { t: "p", html: "Bisher: Wert \\(x\\) bekannt → Wahrscheinlichkeit gesucht. Jetzt umgekehrt: <b>Wahrscheinlichkeit bekannt → Wert gesucht.</b> Man fragt etwa: „Welche Fahrtzeit wird an 95 % der Tage nicht überschritten?\" Die Antwort ist ein <b>Quantil</b>." },
          { t: "formula", tex: "x_p=\\mu+z_p\\cdot\\sigma\\qquad\\text{mit}\\qquad z_p=-\\,z_{\\,1-p}\\;\\;\\text{für }p<0{,}5", caption: "Quantil-Formel (Umkehrung der Standardisierung)" },
          { t: "table", caption: "Tabelle 33 – wichtige Quantile der Standardnormalverteilung (Quelle: Bornewasser-Hermes, 2023)", compact: true,
            headers: ["p", "0,9", "0,95", "0,975", "0,99", "0,995"],
            rows: [["zₚ", "1,2816", "1,6449", "1,96", "2,3263", "2,5758"]] },
          { t: "example", title: "Quantil-Aufgaben durchgerechnet", html:
            "<b>F6 – Fahrtzeit, die an 95 % der Tage nicht überschritten wird:</b>" +
            "\\[x_{0{,}95}=\\mu+z_{0{,}95}\\cdot\\sigma=40+1{,}6449\\cdot 2=43{,}289\\text{ Minuten}\\]" +
            "<b>F7 – Fahrtzeit, die mit 90 % überschritten</b> (= mit 10 % unterschritten) <b>wird:</b><br>" +
            "Da \\(p=0{,}1<0{,}5\\) und nur positive Quantile tabelliert sind, nutzen wir die Symmetrie:" +
            "\\[z_{0{,}1}=-z_{0{,}9}=-1{,}2816\\quad\\Rightarrow\\quad x_{0{,}1}=40-1{,}2816\\cdot 2=37{,}44\\text{ Minuten}\\]" },

          { t: "sub", text: "Zentrale Schwankungsintervalle" },
          { t: "def", term: "Zentrales Schwankungsintervall", title: "Definition",
            html: "Ein zentrales Schwankungsintervall umschließt zwischen zwei symmetrisch um \\(\\mu\\) liegenden Grenzen eine vorgegebene Wahrscheinlichkeitsmasse. Beide Grenzen sind gleich weit von \\(\\mu\\) entfernt." },
          { t: "example", title: "F8 – 90 %-Schwankungsintervall der Fahrtzeit", html:
            "90 % zentral bedeutet: 10 % liegen außen, je 5 % links und rechts. Die Grenzen sind also \\(x_{0{,}05}\\) und \\(x_{0{,}95}\\):" +
            "\\[x_{0{,}95}=40+1{,}6449\\cdot 2=43{,}29\\qquad x_{0{,}05}=40-1{,}6449\\cdot 2=36{,}71\\]" +
            "Ergebnis: Mit 90 % Wahrscheinlichkeit liegt die Fahrtzeit <b>zwischen 36,71 und 43,29 Minuten</b>." },
          { t: "aha", title: "Aha: Die 68–95–99,7-Regel", html:
            "Als Faustformel (empirische Regel): ≈ 68 % aller Werte liegen in \\(\\mu\\pm 1\\sigma\\), ≈ 95 % in \\(\\mu\\pm 2\\sigma\\) und ≈ 99,7 % in \\(\\mu\\pm 3\\sigma\\). <i>Genau</i> 95 % liegen bei \\(\\mu\\pm 1{,}96\\,\\sigma\\) – daher taucht die 1,96 später in Konfidenzintervallen auf. Auf die Fahrtzeit: grob \\(\\mu\\pm 2\\sigma = 40\\pm 4\\), also rund 95 % aller Fahrten zwischen 36 und 44 Minuten (exakt 95 % mit 1,96·σ: zwischen 36,08 und 43,92)." },
          { t: "why", title: "Warum brauche ich das?", html:
            "Quantile und Schwankungsintervalle sind das tägliche Brot der angewandten Statistik: <b>IQ-Tests</b> (oberste 2 %?), <b>Qualitäts-/Toleranzgrenzen</b> in der Produktion, <b>Lieferzeit-Garantien</b> („98 % unserer Pakete in unter 3 Tagen\"), Risikomaße in Versicherungen. Und die ganze Inferenzstatistik in Lektion 7/8 baut darauf auf." },

          { t: "widget", title: "Normalverteilungs-Explorer mit z-Rechner", icon: "🔔",
            hint: "Default: Fahrtzeit N(40, 4). Slider für μ und σ, Modi P(X≤x), P(X≥x), Intervall und Quantil. Die x-Linie ist im Diagramm verschiebbar. Live-Checks: x=42 → 84,13 %; x=36 → 2,28 %; [39;42] → 53,28 %; p=0,95 → 43,289.",
            render: renderNormalExplorer },

          { t: "divider" },

          /* ---------- 6.2.2 t-Verteilung ---------- */
          { t: "h", text: "6.2.2  t-Verteilung (am Rande)", icon: "📐" },
          { t: "p", html: "Die <b>t-Verteilung</b> ist die kleine, vorsichtigere Schwester der Standardnormalverteilung. Sie ist ebenfalls symmetrisch um 0, berücksichtigt aber zusätzlich den <b>Stichprobenumfang</b>. Bei kleinen Stichproben ist sie <i>flacher</i> und hat <i>dickere Ränder</i> – sie ist anfälliger für Ausreißer und damit ehrlicher über unsere Unsicherheit." },
          { t: "def", term: "t-Verteilung", title: "Definition",
            html: "Mit der t-Verteilung wird eine der Standardnormalverteilung nahverwandte Verteilung für kleine Stichproben beschrieben. Sie ist symmetrisch um 0 und nähert sich mit wachsendem Stichprobenumfang der Standardnormalverteilung an." },
          { t: "quote", html: "Mit der t-Verteilung wird eine der Standardnormalverteilung nahverwandte Verteilung für kleine Stichproben beschrieben.", source: "Randspalte, Bornewasser-Hermes (2023)" },
          { t: "p", html: "Je größer die Stichprobe, desto mehr schmiegt sich die t-Verteilung an die Standardnormalverteilung an, bis sie ab einem gewissen Punkt praktisch deckungsgleich sind. Im Skript: links eine t-Verteilung mit \\(n=4\\) Beobachtungen (deutlich flacher), rechts mit \\(n=40\\) (kaum vom Standardnormal zu unterscheiden)." },
          { t: "why", title: "Warum brauche ich das?", html:
            "Die t-Verteilung ist das Fundament für <b>Hypothesentests und Konfidenzintervalle bei kleinen Stichproben</b> (Lektion 7/8). Wer mit wenigen Messwerten arbeitet – und das ist im echten Leben fast immer der Fall – kommt an ihr nicht vorbei." },

          { t: "divider" },

          /* ---------- Bonus: Exponential ---------- */
          { t: "h", text: "Bonus: Exponentialverteilung", icon: "📉" },
          { t: "warn", title: "Über das Skript hinaus", tag: "Vertiefung",
            html: "Die <b>Exponentialverteilung kommt in Lektion 6 nicht vor</b> und ist <b>nicht prüfungsrelevant</b>. Sie ist das stetige Gegenstück zum „Warten\" und passt thematisch wunderbar zur geometrischen Verteilung." },
          { t: "p", html: "Die Exponentialverteilung modelliert <b>Wartezeiten bis zum nächsten Ereignis</b>: Zeit bis zum nächsten Anruf, Lebensdauer eines Bauteils, Abstand zwischen zwei Bussen. Ein Parameter \\(\\lambda\\) (Rate), und die mittlere Wartezeit ist \\(1/\\lambda\\)." },
          { t: "formula", tex: "f(x)=\\lambda\\,e^{-\\lambda x}\\;(x\\ge 0)\\qquad F(x)=1-e^{-\\lambda x}\\qquad E(X)=\\frac1\\lambda\\qquad\\operatorname{Var}(X)=\\frac1{\\lambda^{2}}", caption: "Exponentialverteilung (Bonus)" },
          { t: "widget", title: "Exponential-Explorer", icon: "📉",
            hint: "Ziehe die Linie, um P(X ≤ x) als Fläche zu sehen. Erwartungswert 1/λ und Varianz 1/λ² werden live mitgerechnet.",
            render: renderExponential },

          { t: "divider" },
          { t: "quote", html: "Für bestimmte Arten von Zufallsvariablen existieren fertige Modelle, mit denen sich Wahrscheinlichkeiten, Erwartungswerte und Varianzen leichter und schneller berechnen lassen. … Mit dem Ausgangspunkt einer Dichtefunktion wird deutlich, dass sich die gesuchten Wahrscheinlichkeiten immer mit der Fläche unterhalb der Dichtefunktion befinden. … Die Wahrscheinlichkeit einer bestimmten Ausprägung einer stetigen Zufallsvariable geht gegen Null.", source: "Zusammenfassung, Bornewasser-Hermes (2023)" }
        ]
      }
    ],

    /* ===================== QUIZ ===================== */
    quiz: [
      { q: "Eine Zufallsvariable zählt, wie viele von 10 unabhängigen Single-Choice-Aufgaben (p = 0,25) richtig erraten werden. Welche Verteilung liegt vor?",
        options: ["Geometrische Verteilung", "Binomialverteilung", "Normalverteilung", "t-Verteilung"],
        correct: 1,
        explain: "Feste Anzahl n = 10 unabhängiger Bernoullivorgänge, gezählt werden die Erfolge → Binomialverteilung." },

      { q: "Wie groß ist P(X = 2) bei n = 10 und p = 0,25?",
        options: ["≈ 14,06 %", "≈ 24,4 %", "≈ 28,2 %", "≈ 53,28 %"],
        correct: 2,
        explain: "P(X=2) = C(10,2)·0,25²·0,75⁸ = 45·0,0625·0,1001 ≈ 0,282 = 28,2 %." },

      { q: "X ist binomialverteilt mit n = 10, p = 0,25. Wie lauten E(X) und Var(X)?",
        options: ["E(X) = 2,5; Var(X) = 1,875", "E(X) = 2,5; Var(X) = 2,5", "E(X) = 10; Var(X) = 2,5", "E(X) = 1,369; Var(X) = 1,875"],
        correct: 0,
        explain: "E(X) = n·p = 10·0,25 = 2,5 und Var(X) = n·p·(1−p) = 10·0,25·0,75 = 1,875 (σ = √1,875 = 1,369)." },

      { q: "Was zählt eine geometrisch verteilte Zufallsvariable (in der Parametrisierung des Skripts)?",
        options: ["Die Erfolge in n festen Versuchen", "Die Anzahl der Misserfolge bis zum ersten Erfolg", "Die Gesamtzahl aller Versuche", "Die Erfolgswahrscheinlichkeit p"],
        correct: 1,
        explain: "Die geometrische Verteilung zählt die Misserfolge VOR dem ersten Erfolg; daher P(X=x) = p·(1−p)ˣ mit nur einem Parameter p." },

      { q: "P(X = 2) bei einer geometrischen Verteilung mit p = 0,25 (also 2 Fehlversuche, dann Erfolg)?",
        options: ["≈ 14,06 %", "≈ 18,75 %", "≈ 25 %", "≈ 43,75 %"],
        correct: 0,
        explain: "P(X=2) = 0,25·0,75² = 0,25·0,5625 = 0,1406 = 14,06 %." },

      { q: "X ~ N(40, 4). Welcher z-Wert und welche Wahrscheinlichkeit gehören zu x = 36?",
        options: ["z = −2; P(X<36) = 2,28 %", "z = −2; P(X<36) = 97,72 %", "z = 2; P(X<36) = 97,72 %", "z = −0,5; P(X<36) = 30,85 %"],
        correct: 0,
        explain: "σ = √4 = 2, also z = (36−40)/2 = −2. Mit Symmetrie: Φ(−2) = 1 − Φ(2) = 1 − 0,9772 = 0,0228 = 2,28 %." },

      { q: "P(39 ≤ X ≤ 42) bei X ~ N(40, 4)?",
        options: ["≈ 84,13 %", "≈ 53,28 %", "≈ 30,85 %", "≈ 15,87 %"],
        correct: 1,
        explain: "Φ(1) − Φ(−0,5) = 0,8413 − (1 − 0,6915) = 0,8413 − 0,3085 = 0,5328 = 53,28 %." },

      { q: "Welche Fahrtzeit wird bei X ~ N(40, 4) an 95 % der Tage nicht überschritten? (z₀,₉₅ = 1,6449)",
        options: ["43,289 Minuten", "36,711 Minuten", "41,645 Minuten", "47,29 Minuten"],
        correct: 0,
        explain: "x₀,₉₅ = μ + z₀,₉₅·σ = 40 + 1,6449·2 = 43,289 Minuten." },

      { q: "Wie groß ist P(X = 41) bei einer stetigen, normalverteilten Variable?",
        options: ["≈ 0,5", "≈ 0,2", "0 (geht gegen null)", "≈ 0,8413"],
        correct: 2,
        explain: "Bei stetigen Variablen hat ein einzelner Punkt keine Fläche – die Wahrscheinlichkeit geht gegen 0. Nur Intervalle/Flächen liefern positive Werte." },

      { q: "Wodurch unterscheidet sich die t-Verteilung von der Standardnormalverteilung?",
        options: ["Sie ist nicht symmetrisch", "Sie ist bei kleinen Stichproben flacher und nähert sich mit wachsendem n der Standardnormalverteilung an", "Sie hat immer μ = 1", "Sie ist eine diskrete Verteilung"],
        correct: 1,
        explain: "Die t-Verteilung ist symmetrisch um 0, aber bei kleinen Stichproben flacher (dickere Ränder). Mit wachsendem Stichprobenumfang wird sie praktisch deckungsgleich mit der Standardnormalverteilung." }
    ]
  });
})();
