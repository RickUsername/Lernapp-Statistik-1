/* LEKTION 1 – "Einführung" (BSTA01-02)
   Konzeptionelle Lektion: Gegenstand der Statistik, Grundbegriffe, Ablauf.
   Quelle/Originalton: Heike Bornewasser-Hermes, 2022. Skriptseiten 12–20.
   Leitbeispiel der Lektion ist DURCHGEHEND die fiktive Studie zu den
   "deutschen Krankenhäusern" (S.14 ff.). Der Pflegeroboter-/25-Patient:innen-
   Datensatz (Tabelle 1) gehört zu LEKTION 2 und wird hier NICHT als
   Leitbeispiel geführt – nur als ausdrücklich gekennzeichneter Ausblick:
   Urliste-Notation + Urliste-Explorer in 1.3 (spec_lektion1.md, Widget C Teil 2).
   Alles in IIFE gewickelt – keine Top-Level-Deklarationen (Vertrag). */
(function () {
  "use strict";

  /* ============================================================
     WIDGET A0 (1.1) – "Statistik im Alltag: Bauchgefühl oder Daten?"
     Reines Konzept-Quiz mit Begründung.
     ============================================================ */
  function widgetAlltag(el, ctx) {
    var E = ctx.el;

    var cards = [
      {
        titel: "Corona-Intensivbetten",
        text: "Ein Klinikleiter soll heute entscheiden, ob er noch weitere COVID-Patient:innen aufnehmen kann.",
        antwort: "daten",
        warum: "Reines Bauchgefühl reicht nicht. Man braucht tagesaktuelle Zahlen: belegte vs. freie Intensivbetten und den Anteil Infizierter. Die statistische Frage: <i>Wann sind die Kapazitäten erschöpft?</i>"
      },
      {
        titel: "Gesundheitsförderung im Betrieb",
        text: "Eine Firma überlegt, ob sich Yoga-Kurse, Fitnessstudio-Zuschuss und Job-Rad wirklich lohnen.",
        antwort: "daten",
        warum: "„Fühlt sich gut an“ ist kein Beweis. Man braucht Daten zu Leistung, Krankenstand und Wohlbefinden – idealerweise vorher/nachher, um die Wirkung der Investition zu messen."
      },
      {
        titel: "Therapieplatz-Wartezeit",
        text: "Eine Behörde fragt sich, ob die therapeutische Versorgung bei psychischen Erkrankungen ausreicht.",
        antwort: "daten",
        warum: "Hier braucht man die <b>durchschnittliche</b> Wartezeit bis zum Therapieplatz und die Entwicklung der Fallzahlen. Erst die Statistik zeigt, ob die Versorgung Schritt hält."
      },
      {
        titel: "„Mir schmeckt der Kaffee hier!“",
        text: "Du suchst dir morgens dein Lieblingscafé aus.",
        antwort: "bauch",
        warum: "Persönlicher Geschmack ist eine Einzelmeinung ohne Verallgemeinerungsanspruch. Hier ist Bauchgefühl völlig in Ordnung – niemand muss daraus eine repräsentative Studie machen."
      }
    ];

    var wrap = E("div");
    var score = E("div", { class: "readout", style: { marginBottom: "10px" } });
    var answered = {};

    function renderScore() {
      var done = Object.keys(answered).length;
      var right = 0;
      cards.forEach(function (c, i) { if (answered[i] === c.antwort) right++; });
      score.innerHTML = "";
      score.appendChild(E("div", { class: "stat teal" },
        E("div", { class: "v" }, String(done) + "/" + cards.length),
        E("div", { class: "l" }, "beantwortet")));
      score.appendChild(E("div", { class: "stat good" },
        E("div", { class: "v" }, String(right)),
        E("div", { class: "l" }, "richtig")));
    }

    cards.forEach(function (c, i) {
      var box = E("div", {
        style: {
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: "12px",
          padding: "12px 14px",
          marginBottom: "10px",
          background: "rgba(255,255,255,.02)"
        }
      });
      box.appendChild(E("div", { style: { fontWeight: "700", marginBottom: "4px" }, text: c.titel }));
      box.appendChild(E("div", { style: { opacity: ".85", marginBottom: "8px", fontSize: ".95em" }, html: c.text }));

      var fb = E("div", { style: { marginTop: "8px", fontSize: ".92em", display: "none" } });
      var row = E("div", { class: "btn-row" });

      function choose(val) {
        answered[i] = val;
        var ok = val === c.antwort;
        fb.style.display = "block";
        fb.style.color = ok ? "var(--good, #6bd3a0)" : "var(--bad, #e8836b)";
        fb.innerHTML = (ok ? "✓ Richtig. " : "✗ Nicht ganz. ") + c.warum;
        Array.prototype.forEach.call(row.children, function (b) { b.classList.remove("active"); });
        if (val === "bauch") bBauch.classList.add("active");
        else bDaten.classList.add("active");
        renderScore();
      }

      var bBauch = E("button", { class: "btn ghost", text: "Bauchgefühl reicht", onclick: function () { choose("bauch"); } });
      var bDaten = E("button", { class: "btn ghost", text: "Daten nötig", onclick: function () { choose("daten"); } });
      row.appendChild(bBauch);
      row.appendChild(bDaten);
      box.appendChild(row);
      box.appendChild(fb);
      wrap.appendChild(box);
    });

    renderScore();
    el.appendChild(score);
    el.appendChild(wrap);
    ctx.typeset();
  }

  /* ============================================================
     WIDGET A (1.2) – "Skalenniveau-Sortierer"
     ~12 Merkmale per Klick einordnen, mit Feedback + Begründung.
     ============================================================ */
  function widgetSkalen(el, ctx) {
    var E = ctx.el;

    // skala: nominal | ordinal | kardinal
    var items = [
      { m: "Geschlecht (w/m/divers)", skala: "nominal",  extra: "", b: "Kategorien ohne sinnvolle Reihenfolge." },
      { m: "Postleitzahl",            skala: "nominal",  extra: "", b: "Zahl, aber keine Ordnung und kein Abstand – 50667 ist nicht „mehr“ als 10115." },
      { m: "Krankenhaus-Station (Onkologie/Chirurgie …)", skala: "nominal", extra: "", b: "Nicht sinnvoll ordenbar – nur Namen." },
      { m: "Universitätsklinik (ja/nein)", skala: "nominal", extra: "dichotom", b: "Genau zwei Ausprägungen → dichotom, aber ohne Ordnung → nominal." },
      { m: "Schulnote (1–6)",         skala: "ordinal",  extra: "", b: "Reihenfolge ja, aber die Abstände sind nicht gleich/interpretierbar." },
      { m: "Patientenzufriedenheit (sehr gut … sehr schlecht)", skala: "ordinal", extra: "", b: "Geordnete Kategorien – aber „sehr gut“ ist nicht „doppelt so gut“ wie „gut“." },
      { m: "Bildungsabschluss (Hauptschule < Realschule < Abitur)", skala: "ordinal", extra: "", b: "Rangordnung vorhanden, aber keine gleichen Abstände." },
      { m: "Temperatur in °C",        skala: "kardinal", extra: "stetig · intervall", b: "Abstände sinnvoll (10°→20° = +10°), aber 0 °C ist willkürlich (≠ 0 °F) → kein natürlicher Nullpunkt → intervallskaliert." },
      { m: "Einkommen / Kontoguthaben", skala: "kardinal", extra: "stetig · verhältnis", b: "Abstände sinnvoll UND 0 € = kein Geld in jeder Währung → natürlicher Nullpunkt → verhältnisskaliert." },
      { m: "Körpergröße in cm",       skala: "kardinal", extra: "stetig · verhältnis", b: "Beliebige Werte eines Intervalls, 0 cm = keine Höhe → verhältnisskaliert, stetig." },
      { m: "Anzahl freie Intensivbetten", skala: "kardinal", extra: "diskret · verhältnis", b: "Abzählbar (0,1,2 …), 20 Betten sind doppelt so viele wie 10 → verhältnisskaliert, diskret." },
      { m: "Alter in Jahren",         skala: "kardinal", extra: "stetig", b: "Sehr viele verschiedene Werte → wird wie stetig behandelt; Abstände voll interpretierbar." }
    ];

    var labels = {
      nominal:  "nominal",
      ordinal:  "ordinal",
      kardinal: "kardinal (metrisch)"
    };

    var wrap = E("div");
    var score = E("div", { class: "readout", style: { marginBottom: "12px" } });
    var assigned = {}; // index -> gewählte skala
    var fbList = [];   // alle Feedback-Divs (für sauberes Zurücksetzen)

    function renderScore() {
      var done = Object.keys(assigned).length;
      var right = 0;
      items.forEach(function (it, i) { if (assigned[i] === it.skala) right++; });
      var pct = done ? Math.round(100 * right / done) : 0;
      score.innerHTML = "";
      score.appendChild(E("div", { class: "stat teal" },
        E("div", { class: "v" }, String(done) + "/" + items.length),
        E("div", { class: "l" }, "zugeordnet")));
      score.appendChild(E("div", { class: "stat good" },
        E("div", { class: "v" }, String(right)),
        E("div", { class: "l" }, "richtig")));
      score.appendChild(E("div", { class: "stat violet" },
        E("div", { class: "v" }, ctx.fmt.n(pct, 0) + " %"),
        E("div", { class: "l" }, "Trefferquote")));
    }

    items.forEach(function (it, i) {
      var box = E("div", {
        style: {
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: "12px",
          padding: "10px 12px",
          marginBottom: "8px",
          background: "rgba(255,255,255,.02)",
          transition: "border-color .2s, background .2s"
        }
      });
      var head = E("div", {
        style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", justifyContent: "space-between" }
      });
      head.appendChild(E("div", { style: { fontWeight: "600" }, text: it.m }));

      var chipRow = E("div", { class: "chips" });
      var fb = E("div", { style: { marginTop: "8px", fontSize: ".9em", display: "none" } });
      fbList.push(fb);

      ["nominal", "ordinal", "kardinal"].forEach(function (sk) {
        var chip = E("button", { class: "chip", text: labels[sk] });
        chip.addEventListener("click", function () {
          assigned[i] = sk;
          Array.prototype.forEach.call(chipRow.children, function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          var ok = sk === it.skala;
          box.style.borderColor = ok ? "rgba(107,211,160,.55)" : "rgba(232,131,107,.55)";
          box.style.background = ok ? "rgba(107,211,160,.07)" : "rgba(232,131,107,.07)";
          fb.style.display = "block";
          fb.style.color = ok ? "var(--good, #6bd3a0)" : "var(--bad, #e8836b)";
          var extra = it.extra ? " <span style=\"opacity:.85\">(" + it.extra + ")</span>" : "";
          fb.innerHTML = (ok ? "✓ Korrekt: <b>" + labels[it.skala] + "</b>" + extra + ". "
                             : "✗ Richtig wäre <b>" + labels[it.skala] + "</b>" + extra + ". ") + it.b;
          renderScore();
        });
        chipRow.appendChild(chip);
      });

      head.appendChild(chipRow);
      box.appendChild(head);
      box.appendChild(fb);
      wrap.appendChild(box);
    });

    var resetRow = E("div", { class: "btn-row", style: { marginTop: "6px" } });
    resetRow.appendChild(E("button", {
      class: "btn ghost", text: "Zurücksetzen",
      onclick: function () {
        assigned = {};
        Array.prototype.forEach.call(wrap.querySelectorAll(".chip"), function (c) { c.classList.remove("active"); });
        Array.prototype.forEach.call(wrap.children, function (b) {
          b.style.borderColor = "rgba(255,255,255,.12)";
          b.style.background = "rgba(255,255,255,.02)";
        });
        fbList.forEach(function (f) { f.style.display = "none"; });
        renderScore();
      }
    }));

    renderScore();
    el.appendChild(score);
    el.appendChild(wrap);
    el.appendChild(resetRow);
    ctx.typeset();
  }

  /* ============================================================
     WIDGET B (1.2) – "Grundbegriffe-Quiz"
     Modus 1: Grundgesamtheit vs. Stichprobe
     Modus 2: Merkmal vs. Merkmalsausprägung
     Modus 3: Stichprobenart erkennen
     ============================================================ */
  function widgetGrundbegriffe(el, ctx) {
    var E = ctx.el;

    var modi = {
      gs: {
        label: "Grundgesamtheit oder Stichprobe?",
        opts: [["gg", "Grundgesamtheit"], ["sp", "Stichprobe"]],
        fragen: [
          { t: "Alle deutschen Krankenhäuser",                       l: "gg", w: "Alle infrage kommenden Merkmalsträger → Grundgesamtheit." },
          { t: "Die 50 tatsächlich befragten Krankenhäuser",          l: "sp", w: "Nur die tatsächlich untersuchten Merkmalsträger → Stichprobe." },
          { t: "Alle Universitätskrankenhäuser Deutschlands",         l: "gg", w: "Wenn nur Uni-Kliniken interessieren, sind ALLE von ihnen die Grundgesamtheit." },
          { t: "Alle Wahlberechtigten Deutschlands",                  l: "gg", w: "Die komplette interessierende Menge → Grundgesamtheit." },
          { t: "1 000 telefonisch Befragte einer Wahlumfrage",        l: "sp", w: "Eine Teilmenge der Wähler:innen → Stichprobe." }
        ]
      },
      mm: {
        label: "Merkmal oder Merkmalsausprägung?",
        opts: [["me", "Merkmal"], ["ma", "Merkmalsausprägung"]],
        fragen: [
          { t: "Umgebung des Krankenhauses", l: "me", w: "Eine interessierende Eigenschaft des Krankenhauses → Merkmal." },
          { t: "städtisch",                  l: "ma", w: "Ein konkreter Wert des Merkmals „Umgebung“ → Merkmalsausprägung." },
          { t: "Patientenzufriedenheit",     l: "me", w: "Die untersuchte Eigenschaft → Merkmal." },
          { t: "gut",                        l: "ma", w: "Eine mögliche Beobachtung der Zufriedenheit → Merkmalsausprägung." },
          { t: "Anzahl freier Intensivbetten", l: "me", w: "Die Eigenschaft selbst → Merkmal." },
          { t: "20",                         l: "ma", w: "Ein konkreter Betten-Wert → Merkmalsausprägung." },
          { t: "Universitätsklinik",         l: "me", w: "Das erhobene (dichotome) Merkmal." },
          { t: "ja",                         l: "ma", w: "Eine der zwei Ausprägungen von „Universitätsklinik“ → Merkmalsausprägung." }
        ]
      },
      sa: {
        label: "Welche Stichprobenart?",
        opts: [["zufall", "einfache Zufalls-"], ["geschichtet", "geschichtete"], ["klumpen", "Klumpen-"], ["adhoc", "Ad-hoc-"]],
        fragen: [
          { t: "Aus 294 Landkreisen zufällig einige wählen und dort ALLE Krankenhäuser nehmen", l: "klumpen", w: "Natürlich existierende Klumpen (Landkreise) werden zufällig gezogen und dann vollständig untersucht → Klumpenstichprobe." },
          { t: "Drei Größenklassen bilden (bis 500 / 500–1000 / ab 1000) und aus jeder ziehen",   l: "geschichtet", w: "Grundgesamtheit erst in Schichten teilen, dann je Schicht ziehen → geschichtete Stichprobe." },
          { t: "Passant:innen in der Kölner Innenstadt befragen",                                  l: "adhoc", w: "Es werden nur die gerade Verfügbaren genommen → Ad-hoc-Stichprobe (keine gute Verallgemeinerungsbasis)." },
          { t: "Jedes Krankenhaus hat exakt die gleiche Chance, gezogen zu werden",                l: "zufall", w: "Gleiche Auswahlwahrscheinlichkeit für alle → einfache Zufallsstichprobe." }
        ]
      }
    };

    var current = "gs";
    var answered = {};

    var modeRow = E("div", { class: "chips", style: { marginBottom: "12px" } });
    var score = E("div", { class: "readout", style: { marginBottom: "12px" } });
    var listWrap = E("div");

    function key(mode, i) { return mode + ":" + i; }

    function renderScore() {
      var f = modi[current].fragen;
      var done = 0, right = 0;
      f.forEach(function (q, i) {
        var a = answered[key(current, i)];
        if (a !== undefined) { done++; if (a === q.l) right++; }
      });
      score.innerHTML = "";
      score.appendChild(E("div", { class: "stat teal" },
        E("div", { class: "v" }, String(done) + "/" + f.length),
        E("div", { class: "l" }, "beantwortet")));
      score.appendChild(E("div", { class: "stat good" },
        E("div", { class: "v" }, String(right)),
        E("div", { class: "l" }, "richtig")));
    }

    function renderList() {
      listWrap.innerHTML = "";
      var mode = modi[current];
      mode.fragen.forEach(function (q, i) {
        var box = E("div", {
          style: {
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: "12px",
            padding: "10px 12px",
            marginBottom: "8px",
            background: "rgba(255,255,255,.02)"
          }
        });
        box.appendChild(E("div", { style: { fontWeight: "600", marginBottom: "8px" }, text: "„" + q.t + "“" }));
        var chipRow = E("div", { class: "chips" });
        var fb = E("div", { style: { marginTop: "8px", fontSize: ".9em", display: "none" } });

        // Bereits gegebene Antwort dieses Modus wiederherstellen,
        // damit Score-Anzeige und Chips/Feedback konsistent bleiben.
        var prev = answered[key(current, i)];

        mode.opts.forEach(function (o) {
          var chip = E("button", { class: "chip" + (prev === o[0] ? " active" : ""), text: o[1] });
          chip.addEventListener("click", function () {
            answered[key(current, i)] = o[0];
            Array.prototype.forEach.call(chipRow.children, function (c) { c.classList.remove("active"); });
            chip.classList.add("active");
            var ok = o[0] === q.l;
            fb.style.display = "block";
            fb.style.color = ok ? "var(--good, #6bd3a0)" : "var(--bad, #e8836b)";
            fb.innerHTML = (ok ? "✓ " : "✗ ") + q.w;
            renderScore();
          });
          chipRow.appendChild(chip);
        });

        if (prev !== undefined) {
          var okPrev = prev === q.l;
          fb.style.display = "block";
          fb.style.color = okPrev ? "var(--good, #6bd3a0)" : "var(--bad, #e8836b)";
          fb.innerHTML = (okPrev ? "✓ " : "✗ ") + q.w;
        }

        box.appendChild(chipRow);
        box.appendChild(fb);
        listWrap.appendChild(box);
      });
    }

    Object.keys(modi).forEach(function (mk) {
      var chip = E("button", { class: "chip" + (mk === current ? " active" : ""), text: modi[mk].label });
      chip.addEventListener("click", function () {
        current = mk;
        Array.prototype.forEach.call(modeRow.children, function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        renderList();
        renderScore();
      });
      modeRow.appendChild(chip);
    });

    renderList();
    renderScore();
    el.appendChild(modeRow);
    el.appendChild(score);
    el.appendChild(listWrap);
  }

  /* ============================================================
     WIDGET C1 (1.3) – "Ablauf einer statistischen Untersuchung" (Stepper)
     Spielt den dreischrittigen Ablauf der Krankenhaus-Studie nach
     (Datensammlung → Datenaufbereitung → Datenanalyse), Schritt für Schritt.
     ============================================================ */
  function widgetAblauf(el, ctx) {
    var E = ctx.el;

    // Drei Schritte exakt nach Skript (S.18–20), am Krankenhaus-Beispiel.
    var schritte = [
      {
        sk: "Schritt 1 · Datensammlung",
        icon: "🛒",
        html: "Wir sammeln die Daten der <b>50 befragten Krankenhäuser</b> selbst per Fragebogen → <b>Primärdaten</b>. Weil wir nur einmal über ca. 3 Wochen erheben, ist es ein <b>Querschnittsdesign</b> (eine Momentaufnahme).",
        detail: "Herkunft: Primärdaten (selbst erhoben) vs. Sekundärdaten (vorhandene Daten, z. B. Vorjahr). Zeitdimension: Querschnitt (ein Zeitpunkt) vs. Längsschnitt (Trend = wechselnde, Panel = immer dieselben Merkmalsträger)."
      },
      {
        sk: "Schritt 2 · Datenaufbereitung",
        icon: "🧹",
        html: "Die Rohbögen wandern in eine Statistiksoftware (<b>Excel, SPSS, R, Stata</b>). Dort prüfen wir auf <b>fehlende</b> und <b>fehlerhaft übertragene</b> Werte. Beispiel: Ein Krankenhaus hat versehentlich „300“ statt „30“ Intensivbetten eingetragen – solche Übertragungsfehler müssen gefunden und korrigiert werden.",
        detail: "Der langweiligste, aber entscheidende Schritt: „Garbage in, garbage out.“ Ohne saubere Daten ist jede spätere Auswertung wertlos."
      },
      {
        sk: "Schritt 3 · Datenanalyse",
        icon: "🔬",
        html: "Jetzt wird ausgewertet. Drei Bereiche: <b>deskriptiv</b> (z. B. die durchschnittliche Bettenbelegung beschreiben), <b>inferenziell</b> (die Hypothese „Uni-Kliniken haben einen größeren Einzugsbereich“ auf die Grundgesamtheit verallgemeinern) und <b>explorativ</b> (ein neues, unerforschtes Gebiet erkunden).",
        detail: "Deskriptiv = komprimiert beschreiben. Inferenz = von der Stichprobe auf die Grundgesamtheit schließen (mit Hypothesen). Explorativ = Erkundung ohne feste Hypothese."
      }
    ];

    var pos = 0; // aktuell freigeschalteter Schritt (0..2)

    var stepsBox = E("div", { class: "steps" });
    var detail = E("div", { class: "widget-hint", style: { marginTop: "12px" } });
    var btnRow = E("div", { class: "btn-row", style: { marginTop: "12px" } });

    function render() {
      stepsBox.innerHTML = "";
      schritte.forEach(function (s, i) {
        var step = E("div", {
          class: "step",
          style: {
            opacity: i <= pos ? "1" : ".35",
            transition: "opacity .25s"
          }
        });
        step.appendChild(E("span", { class: "sk", html: s.icon + " " + s.sk }));
        step.appendChild(E("span", { html: i <= pos ? s.html : "<i>… noch nicht freigeschaltet</i>" }));
        stepsBox.appendChild(step);
      });
      detail.innerHTML = "<b>Worauf es ankommt:</b> " + schritte[pos].detail;

      btnRow.innerHTML = "";
      btnRow.appendChild(E("button", {
        class: "btn ghost", text: "◀ zurück",
        onclick: function () { if (pos > 0) { pos--; render(); } }
      }));
      if (pos < schritte.length - 1) {
        btnRow.appendChild(E("button", {
          class: "btn primary", text: "weiter ▶",
          onclick: function () { pos++; render(); }
        }));
      } else {
        btnRow.appendChild(E("button", {
          class: "btn ghost", text: "↺ von vorn",
          onclick: function () { pos = 0; render(); }
        }));
      }
      ctx.typeset();
    }

    el.appendChild(stepsBox);
    el.appendChild(detail);
    el.appendChild(btnRow);
    render();
  }

  /* ============================================================
     WIDGET C2 (1.3) – "Studien-Design-Navigator"
     Design-Szenarien der Krankenhaus-Studie einordnen
     (Datenquelle / Zeitdesign / Analyse-Bereich).
     ============================================================ */
  function widgetDesign(el, ctx) {
    var E = ctx.el;

    /* ---------- Teil 1: Design einordnen ---------- */
    var teil1 = E("div");
    teil1.appendChild(E("div", { class: "sub", text: "Studien-Design einordnen", style: { fontWeight: "700", marginBottom: "8px" } }));

    var dimensionen = {
      quelle: { label: "Datenquelle", opts: [["primaer", "Primärdaten"], ["sekundaer", "Sekundärdaten"]] },
      zeit:   { label: "Zeitdesign", opts: [["quer", "Querschnitt"], ["panel", "Panel"], ["trend", "Trend"]] },
      analyse:{ label: "Analyse-Bereich", opts: [["deskr", "Deskriptiv"], ["infer", "Inferenz"], ["explo", "Explorativ"]] }
    };

    var szenarien = [
      { t: "Wir befragen selbst 50 Krankenhäuser per Fragebogen.", dim: "quelle", l: "primaer", w: "Selbst erhobene Daten → Primärdaten." },
      { t: "Wir verwenden die Belegungsdaten aus dem Vorjahr erneut.", dim: "quelle", l: "sekundaer", w: "Bereits vorhandene Daten → Sekundärdaten." },
      { t: "Einmalige Bestandsaufnahme der Intensivbetten in 3 Wochen.", dim: "zeit", l: "quer", w: "Nur ein kurzer Zeitraum (2–4 Wochen) → Querschnittsdesign." },
      { t: "Halbjährlich werden IMMER DIESELBEN Krankenhäuser befragt.", dim: "zeit", l: "panel", w: "Gleiche Merkmalsträger über die Zeit → Paneldesign (höchster Informationsgehalt)." },
      { t: "Jedes Jahr werden WECHSELNDE Krankenhäuser befragt.", dim: "zeit", l: "trend", w: "Regelmäßig, aber nicht dieselben Merkmalsträger → Trenddesign." },
      { t: "Wir berechnen die durchschnittliche Bettenbelegung und zeichnen ein Diagramm.", dim: "analyse", l: "deskr", w: "Daten komprimiert beschreiben → deskriptive Statistik." },
      { t: "Wir prüfen die Hypothese „Uni-Kliniken haben einen größeren Einzugsbereich“.", dim: "analyse", l: "infer", w: "Schluss von der Stichprobe auf die Grundgesamtheit per Hypothese → Inferenzstatistik." },
      { t: "Erste Analysen zu Beginn der Corona-Pandemie auf völlig neuem Gebiet.", dim: "analyse", l: "explo", w: "Erkundung eines unerforschten Bereichs → explorative Statistik." }
    ];

    var t1answered = {};
    var t1score = E("div", { class: "readout", style: { marginBottom: "10px" } });

    function renderT1Score() {
      var done = Object.keys(t1answered).length, right = 0;
      szenarien.forEach(function (s, i) { if (t1answered[i] === s.l) right++; });
      t1score.innerHTML = "";
      t1score.appendChild(E("div", { class: "stat teal" },
        E("div", { class: "v" }, String(done) + "/" + szenarien.length),
        E("div", { class: "l" }, "beantwortet")));
      t1score.appendChild(E("div", { class: "stat good" },
        E("div", { class: "v" }, String(right)),
        E("div", { class: "l" }, "richtig")));
    }

    szenarien.forEach(function (s, i) {
      var box = E("div", {
        style: { border: "1px solid rgba(255,255,255,.12)", borderRadius: "12px", padding: "10px 12px", marginBottom: "8px", background: "rgba(255,255,255,.02)" }
      });
      box.appendChild(E("div", { style: { fontWeight: "600", marginBottom: "6px" }, text: s.t }));
      box.appendChild(E("div", { style: { fontSize: ".8em", opacity: ".7", marginBottom: "6px" }, text: dimensionen[s.dim].label + ":" }));
      var chipRow = E("div", { class: "chips" });
      var fb = E("div", { style: { marginTop: "8px", fontSize: ".9em", display: "none" } });
      dimensionen[s.dim].opts.forEach(function (o) {
        var chip = E("button", { class: "chip", text: o[1] });
        chip.addEventListener("click", function () {
          t1answered[i] = o[0];
          Array.prototype.forEach.call(chipRow.children, function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          var ok = o[0] === s.l;
          fb.style.display = "block";
          fb.style.color = ok ? "var(--good, #6bd3a0)" : "var(--bad, #e8836b)";
          fb.innerHTML = (ok ? "✓ " : "✗ ") + s.w;
          renderT1Score();
        });
        chipRow.appendChild(chip);
      });
      box.appendChild(chipRow);
      box.appendChild(fb);
      teil1.appendChild(box);
    });

    renderT1Score();
    teil1.insertBefore(t1score, teil1.children[1]);

    el.appendChild(teil1);

    /* ---------- Teil 2: Urliste-Explorer (Ausblick auf Lektion 2) ----------
       Tabelle 1 (Pflegeroboter-Befragung, 25 Patient:innen) aus spec_lektion1.md.
       Live: n je Spalte (NA-Behandlung: 25/24/25/19), Distinct-Werte,
       automatisch erkanntes Skalenniveau, Häufigkeitstabelle. */
    var NA = null;
    var spalten = [
      {
        label: "Geschlecht", ordnung: null,
        werte: ["weiblich", "weiblich", "weiblich", "weiblich", "männlich", "weiblich", "weiblich", "weiblich", "männlich", "männlich", "weiblich", "männlich", "weiblich", "weiblich", "weiblich", "weiblich", "weiblich", "weiblich", "männlich", "weiblich", "weiblich", "weiblich", "weiblich", "weiblich", "weiblich"]
      },
      {
        label: "Zufriedenheit", ordnung: ["sehr gut", "gut", "befriedigend", "ausreichend", "mangelhaft"],
        werte: ["gut", "gut", "gut", "gut", "befriedigend", "befriedigend", "befriedigend", "befriedigend", "gut", "befriedigend", "befriedigend", NA, "gut", "gut", "gut", "ausreichend", "gut", "gut", "sehr gut", "ausreichend", "gut", "befriedigend", "gut", "befriedigend", "befriedigend"]
      },
      {
        label: "bisheriger Kontakt", ordnung: null,
        werte: [1, 5, 0, 0, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 0, 3, 1, 1, 0, 3, 0, 1, 1, 2, 1]
      },
      {
        label: "Alter", ordnung: null,
        werte: [16, NA, 50, 35, NA, 47, 15, 20, 47, 48, 44, NA, 55, 56, 35, 48, NA, 52, 49, NA, 68, 17, 26, 39, NA]
      }
    ];

    function analysiere(sp) {
      var gueltig = sp.werte.filter(function (v) { return v !== NA; });
      var n = gueltig.length;
      var fehlend = sp.werte.length - n;
      var numerisch = gueltig.every(function (v) { return typeof v === "number"; });
      var counts = {};
      gueltig.forEach(function (v) { var k = String(v); counts[k] = (counts[k] || 0) + 1; });
      var distinct = Object.keys(counts);
      if (sp.ordnung) {
        distinct.sort(function (a, b) { return sp.ordnung.indexOf(a) - sp.ordnung.indexOf(b); });
      } else if (numerisch) {
        distinct.sort(function (a, b) { return Number(a) - Number(b); });
      }
      var skala, zusatz, grund;
      if (!numerisch) {
        if (sp.ordnung) {
          skala = "ordinal"; zusatz = "";
          grund = "Kategorien MIT sinnvoller Reihenfolge („" + sp.ordnung[0] + "“ … „" + sp.ordnung[sp.ordnung.length - 1] + "“), aber die Abstände sind nicht interpretierbar → ordinal.";
        } else {
          skala = "nominal"; zusatz = distinct.length === 2 ? "dichotom" : "";
          grund = "Kategorien ohne sinnvolle Reihenfolge → nominal" +
            (distinct.length === 2 ? "; genau zwei Ausprägungen → dichotom." : ".");
        }
      } else {
        skala = "kardinal";
        if (distinct.length <= 10) {
          zusatz = "diskret";
          grund = "Zahlen mit interpretierbaren Abständen → kardinal; nur " + ctx.fmt.int(distinct.length) + " verschiedene Werte → wie ein diskretes Merkmal behandeln.";
        } else {
          zusatz = "wie stetig";
          grund = "Zahlen mit interpretierbaren Abständen → kardinal; " + ctx.fmt.int(distinct.length) + " verschiedene Werte bei " + ctx.fmt.int(n) + " Angaben → wie ein stetiges Merkmal behandeln (in Lektion 2: Klassen bilden).";
        }
      }
      return { n: n, fehlend: fehlend, counts: counts, distinct: distinct, numerisch: numerisch, skala: skala, zusatz: zusatz, grund: grund };
    }

    var teil2 = E("div");
    teil2.appendChild(E("div", { class: "sub", text: "Teil 2 · Urliste-Explorer (Ausblick auf Lektion 2)", style: { fontWeight: "700", marginBottom: "4px" } }));
    teil2.appendChild(E("div", {
      style: { fontSize: ".9em", opacity: ".8", marginBottom: "10px" },
      html: "Tabelle 1 aus dem Skript: <b>25 Patient:innen</b> wurden zu Pflegerobotern befragt. Wähle eine Spalte – das Widget zeigt live den Stichprobenumfang \\(n\\) (fehlende Angaben zählen nicht mit!), die Anzahl verschiedener Ausprägungen, das automatisch erkannte Skalenniveau und die Häufigkeitstabelle. Ausgewertet wird der Datensatz erst in Lektion 2."
    }));

    var colRow = E("div", { class: "chips", style: { marginBottom: "10px" } });
    var t2read = E("div", { class: "readout", style: { marginBottom: "10px" } });
    var t2grund = E("div", { class: "widget-hint", style: { marginBottom: "12px" } });
    var freqWrap = E("div", { style: { marginBottom: "14px" } });
    var tabWrap = E("div");
    var selected = 0;

    function renderTabelle1() {
      tabWrap.innerHTML = "";
      var tw = E("div", { class: "tbl-wrap" });
      var tbl = E("table", { class: "data" });
      var thead = E("thead");
      var hr = E("tr");
      hr.appendChild(E("th", { text: "Patient:in" }));
      spalten.forEach(function (sp, si) {
        hr.appendChild(E("th", { text: sp.label, style: si === selected ? { color: "var(--teal, #5fd0c5)" } : {} }));
      });
      thead.appendChild(hr);
      tbl.appendChild(thead);
      var tbody = E("tbody");
      spalten[0].werte.forEach(function (_, p) {
        var tr = E("tr");
        tr.appendChild(E("td", { text: ctx.fmt.int(p + 1) }));
        spalten.forEach(function (sp, si) {
          var v = sp.werte[p];
          var txt = v === NA ? "–" : (typeof v === "number" ? ctx.fmt.int(v) : String(v));
          tr.appendChild(E("td", {
            text: txt,
            style: {
              background: si === selected ? "rgba(95,208,197,.10)" : "transparent",
              opacity: v === NA ? ".45" : "1"
            }
          }));
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      tw.appendChild(tbl);
      tabWrap.appendChild(tw);
      tabWrap.appendChild(E("div", {
        style: { fontSize: ".78em", opacity: ".6", marginTop: "4px" },
        html: "Tabelle 1: Ergebnisse der Patientenbefragung („–“ = fehlende Angabe). Quelle: Heike Bornewasser-Hermes, 2022."
      }));
    }

    function renderExplorer() {
      var sp = spalten[selected];
      var a = analysiere(sp);

      Array.prototype.forEach.call(colRow.children, function (c, i) {
        c.classList.toggle("active", i === selected);
      });

      t2read.innerHTML = "";
      t2read.appendChild(E("div", { class: "stat teal" },
        E("div", { class: "v" }, ctx.fmt.int(a.n)),
        E("div", { class: "l" }, "n (gültige Werte)")));
      t2read.appendChild(E("div", { class: "stat" },
        E("div", { class: "v" }, ctx.fmt.int(a.fehlend)),
        E("div", { class: "l" }, "fehlend (NA)")));
      t2read.appendChild(E("div", { class: "stat violet" },
        E("div", { class: "v" }, ctx.fmt.int(a.distinct.length)),
        E("div", { class: "l" }, "verschiedene Ausprägungen")));
      t2read.appendChild(E("div", { class: "stat blue" },
        E("div", { class: "v" }, a.skala),
        E("div", { class: "l" }, "Skalenniveau" + (a.zusatz ? " · " + a.zusatz : ""))));

      t2grund.innerHTML = "<b>Warum?</b> " + a.grund +
        " Von 25 Befragten liegen " + ctx.fmt.int(a.n) + " Antworten vor → Urliste \\(x_1, \\dots, x_{" + a.n + "}\\), also \\(n = " + a.n + "\\).";

      freqWrap.innerHTML = "";
      freqWrap.appendChild(E("div", { style: { fontWeight: "600", fontSize: ".92em", marginBottom: "6px" }, text: "Häufigkeitstabelle „" + sp.label + "“ (Ausblick auf Lektion 2)" }));
      var tw = E("div", { class: "tbl-wrap" });
      var tbl = E("table", { class: "data" });
      var thead = E("thead");
      var hr = E("tr");
      hr.appendChild(E("th", { text: "Ausprägung" }));
      hr.appendChild(E("th", { text: "absolute Häufigkeit" }));
      thead.appendChild(hr);
      tbl.appendChild(thead);
      var tbody = E("tbody");
      a.distinct.forEach(function (k) {
        var tr = E("tr");
        tr.appendChild(E("td", { text: a.numerisch ? ctx.fmt.int(Number(k)) : k }));
        tr.appendChild(E("td", { text: ctx.fmt.int(a.counts[k]) + "×" }));
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      tw.appendChild(tbl);
      freqWrap.appendChild(tw);

      renderTabelle1();
      ctx.typeset();
    }

    spalten.forEach(function (sp, i) {
      var chip = E("button", { class: "chip" + (i === 0 ? " active" : ""), text: sp.label });
      chip.addEventListener("click", function () { selected = i; renderExplorer(); });
      colRow.appendChild(chip);
    });

    teil2.appendChild(colRow);
    teil2.appendChild(t2read);
    teil2.appendChild(t2grund);
    teil2.appendChild(freqWrap);
    teil2.appendChild(tabWrap);

    el.appendChild(E("div", { style: { borderTop: "1px solid rgba(255,255,255,.12)", margin: "18px 0" } }));
    el.appendChild(teil2);
    renderExplorer();
  }

  /* ============================================================
     LEKTION-OBJEKT
     ============================================================ */
  App.registerLesson({
    id: 1,
    title: "Einführung",

    // Lektion 1 ist konzeptionell ohne Rechenformeln. Die einzigen "Formeln"
    // sind die Urlisten-Notation (Spec Abschnitt 5), hier als Ausblick auf
    // Lektion 2 eingeführt (Abschnitt 1.3 + Urliste-Explorer).
    formulas: [
      {
        group: "Lektion 1 · Notation", name: "Urliste / Rohdaten",
        tex: "x_1, x_2, \\dots, x_n",
        note: "Ausgangsdaten eines Merkmals; \\(n\\) = Stichprobenumfang (Ausblick Lektion 2)"
      },
      {
        group: "Lektion 1 · Notation", name: "Merkmalswert der i-ten Person",
        tex: "x_i,\\quad i = 1, \\dots, n",
        note: "Personenindex \\(i\\) durchläuft alle \\(n\\) Merkmalsträger"
      }
    ],

    sections: [

      /* ================= 1.1 ================= */
      {
        num: "1.1",
        title: "Gegenstand der Statistik",
        intro: "Statistik ist kein Selbstzweck-Rechnen, sondern der Übersetzer von Zahlen-Chaos in Entscheidungen.",
        blocks: [
          { t: "p", lead: true, html: "In fast jeder Wissenschaft ist das oberste Ziel, <b>neue Erkenntnisse zu gewinnen</b>. Daten allein bringen einen aber keinen Schritt weiter – erst statistische Verfahren machen aus Rohdaten Erkenntnisse und daraus <b>Handlungsempfehlungen</b>. Genau das ist der Gegenstand der Statistik: Daten sammeln, auswerten und Schlüsse ziehen." },

          { t: "p", html: "Statistik steckt überall: In der <b>Wirtschaft</b> (Arbeitslosenzahlen, Inflationsrate, Prognosen), in der <b>Medizin</b> (Wirkt das neue Medikament wirklich? – Experimentalgruppe gegen Kontrollgruppe mit Placebo) und in der <b>Psychologie</b> (Wie erleben Menschen Stress in bestimmten Situationen?)." },

          { t: "why", title: "Warum brauche ich das?", html: "Jede Schlagzeile mit „Studie zeigt …“, jede Inflations-Prognose, jede Impf-Wirksamkeit von „95 %“ ist Statistik. Wer Statistik versteht, kann beurteilen, ob eine Aussage trägt – oder ob in Wahrheit nur 12 Leute auf der Straße befragt wurden (eine sogenannte Ad-hoc-Stichprobe, dazu gleich mehr)." },

          { t: "h", text: "Drei Fälle, die zeigen, wie wichtig Statistik ist", icon: "🦠" },
          { t: "p", html: "Im Herbst 2022, mitten im Corona-Kontext, war Statistik kein abstraktes Schulfach mehr, sondern Entscheidungsgrundlage:" },
          {
            t: "list", ordered: true, items: [
              "<b>Krankenhaus-Kapazitäten:</b> Tagesaktuell ermitteln, wie viele Intensivbetten belegt bzw. frei sind und wie hoch der Anteil Corona-Infizierter unter den Intensivpatient:innen ist – um abzuschätzen, wann die Kapazitäten erschöpft sind.",
              "<b>Betriebliche Gesundheitsförderung:</b> Wirken Yoga, Fitnessstudio oder Job-Rad messbar auf Leistung, Krankenstand und Wohlbefinden? Lohnt sich die Investition überhaupt?",
              "<b>Psychische Erkrankungen:</b> Verändert sich das Auftreten? Reicht die therapeutische Versorgung? Wie lange dauert es im Durchschnitt bis zum Therapieplatz?"
            ]
          },

          { t: "example", title: "Leitbeispiel: Krankenhaus-Studie „deutsche Krankenhäuser“", html: "Durch die ganze Lektion zieht sich eine fiktive Studie, die einen <b>Überblick über die Situation in deutschen Krankenhäusern</b> verschaffen will. An ihr werden später alle Grundbegriffe erklärt. Schon hier ein Vorgeschmack auf interpretierbare Abstände: Krankenhaus A hat <b>20</b> freie Intensivbetten, Krankenhaus B nur <b>10</b>. Dann hat A „doppelt so viele“ bzw. „10 Betten mehr“ – diese Aussage ergibt Sinn, weil bei Zähldaten die Abstände echte Bedeutung haben. (Diese „metrische“ Eigenschaft betrachten wir in 1.2 genauer.)" },

          { t: "aha", title: "Aha: Statistik ist der Übersetzer", html: "Während der Pandemie hat Statistik (mit-)entschieden, ob ein Krankenhaus noch Patient:innen aufnehmen kann. <b>Daten ohne Statistik sind wie ein Tacho ohne Zahlen</b> – das Auto fährt, aber keiner weiß, wie schnell. Und die Medikamentenstudie zeigt das Prinzip im Kleinen: Die Experimentalgruppe bekommt das echte Rezept, die Kontrollgruppe nur eine Zucker-Pille (Placebo). Erst der <b>Vergleich</b> verrät, ob das Mittel wirkt – nicht das bloße „Mir geht's besser“." },

          { t: "quote", html: "„Um aus all diesen Beispielen und den damit verbundenen Daten Erkenntnisse und damit geeignete Schlussfolgerungen ziehen zu können, sind statistische Verfahren notwendig.“", source: "Bornewasser-Hermes, 2022" },

          {
            t: "widget", title: "Statistik im Alltag: Bauchgefühl oder Daten?", icon: "🤔",
            hint: "Entscheide pro Karte, ob das Bauchgefühl reicht – oder ob man Daten braucht. Das Feedback verrät, welche statistische Frage dahintersteckt.",
            render: widgetAlltag
          }
        ]
      },

      /* ================= 1.2 ================= */
      {
        num: "1.2",
        title: "Grundbegriffe der Statistik",
        intro: "Bevor man rechnet, muss man die Sprache der Statistik können: Wer wird untersucht, was wird gemessen – und auf welcher Skala?",
        blocks: [
          { t: "p", lead: true, html: "Die Krankenhaus-Studie soll z. B. klären: Liegt das Krankenhaus städtisch oder ländlich? Ist es ein Universitätsklinikum (ja/nein)? Wie groß ist das Einzugsgebiet in Kilometern? Welche Stationen gibt es? Wie viele Intensiv- und Normalbetten sind belegt? Und wie zufrieden sind die Patient:innen? An diesen Fragen lassen sich alle Grundbegriffe sauber erklären." },

          { t: "h", text: "Wer wird untersucht? Merkmalsträger, Grundgesamtheit, Stichprobe", icon: "🏥" },
          { t: "def", term: "Merkmalsträger", html: "Eine interessierende Person oder ein Objekt, über die/das man Aussagen gewinnen möchte. Im Beispiel: <b>jedes einzelne deutsche Krankenhaus</b>. Merkmalsträger können auch Einzelpersonen, Unternehmen oder Gegenstände sein." },
          { t: "def", term: "Grundgesamtheit", html: "Die Grundgesamtheit umfasst <b>alle</b> Merkmalsträger, die für die Studie in Frage kommen. Im Beispiel: alle deutschen Krankenhäuser." },
          { t: "def", term: "Stichprobe", html: "Die Stichprobe umfasst alle <b>tatsächlich untersuchten</b> Merkmalsträger. Sie sollte <b>repräsentativ</b> sein. Faustregel: Je größer die Stichprobe, desto präziser die Aussagen – aber eine große, nicht repräsentative Stichprobe nützt nichts." },

          { t: "quote", html: "„Bei der Zusammensetzung der Stichprobe ist es von besonderer Bedeutung, dass die Merkmalsträger repräsentativ für die Grundgesamtheit sind.“", source: "Bornewasser-Hermes, 2022" },

          { t: "sub", html: "Wie zieht man eine Stichprobe? Vier Arten" },
          {
            t: "list", items: [
              "<b>Einfache Zufallsstichprobe:</b> Jeder Merkmalsträger hat die <i>gleiche</i> Auswahlwahrscheinlichkeit. Beste Grundlage – setzt aber voraus, dass die Grundgesamtheit vollständig bekannt ist.",
              "<b>Geschichtete Stichprobe:</b> Die Grundgesamtheit wird erst in Teilpopulationen (Schichten) aufgeteilt, dann wird aus jeder Schicht zufällig gezogen. Beispiel: Schichten <i>bis 500</i> / <i>mehr als 500 bis 1000</i> / <i>ab 1000</i> Patient:innen.",
              "<b>Klumpenstichprobe:</b> Natürlich existierende Teilmengen (Klumpen) werden zufällig ausgewählt und dann <i>vollständig</i> untersucht. Beispiel: Aus den <b>294</b> deutschen Landkreisen werden einige zufällig gewählt; dort werden ALLE Krankenhäuser untersucht.",
              "<b>Ad-hoc-Stichprobe:</b> Man nimmt, was gerade verfügbar ist (z. B. Straßenumfrage). „Keine gute Grundlage, um allgemeingültige Aussagen treffen zu können.“"
            ]
          },
          { t: "quote", html: "„Nur Zufallsstichproben bilden eine geeignete Basis für statistische Analysen, mithilfe derer man Rückschlüsse auf die Allgemeinheit ziehen möchte.“", source: "Bornewasser-Hermes, 2022" },

          { t: "h", text: "Was wird gemessen? Merkmal & Merkmalsausprägung", icon: "📋" },
          { t: "def", term: "Merkmal", html: "Eine interessierende Eigenschaft eines Merkmalsträgers (auch „Variable“ genannt). Beispiel: „Geschlecht“, „Zufriedenheit“, „Alter“." },
          { t: "def", term: "Merkmalsausprägung", html: "Eine mögliche Beobachtung eines Merkmals – also ein konkreter Wert, den das Merkmal annehmen kann. Beim Merkmal „Geschlecht“ sind das z. B. „weiblich“ oder „männlich“." },
          { t: "aha", title: "Merkmal vs. Ausprägung – der Schubladen-Trick", html: "Das <b>Merkmal</b> ist die Schublade („Geschlecht“), die <b>Merkmalsausprägung</b> ist das, was drin liegt („weiblich“). Frage zur Sicherheit immer: „Wovon ist das ein konkreter Wert?“ – „weiblich“ ist ein Wert von „Geschlecht“, also Ausprägung." },

          { t: "h", text: "Auf welcher Skala? Die Skalenniveaus", icon: "📏" },
          { t: "def", term: "Skalenniveau", html: "Das Skalenniveau <b>entscheidet über die möglichen statistischen Analysen</b>. Man unterscheidet drei Niveaus: Nominal-, Ordinal- und Kardinalskala (= metrische Skala)." },
          { t: "def", term: "Nominalskala", html: "Erlaubt am <b>wenigsten</b> Auswertungen. Die Ausprägungen sind Namen/Kategorien <b>ohne</b> sinnvolle Reihenfolge (z. B. Stationen: Onkologie, Chirurgie, Orthopädie). Spezialfall <b>dichotom</b>: genau zwei Ausprägungen (städtisch/ländlich, Uni-Klinik ja/nein)." },
          { t: "def", term: "Ordinalskala", html: "Erlaubt <b>mehr</b> als die Nominal-, aber <b>weniger</b> als die Kardinalskala. Kategorien mit <b>sinnvoller Reihenfolge</b>, aber die <b>Abstände</b> sind nicht mathematisch interpretierbar. Beispiel: Patientenzufriedenheit (sehr gut → gut → mittelmäßig → schlecht → sehr schlecht)." },
          { t: "def", term: "Kardinalskala (metrisch)", html: "Erlaubt die <b>meisten</b> Auswertungen. Die Ausprägungen sind Zahlen <b>und</b> die Abstände sind mathematisch sinnvoll interpretierbar. Beispiel: Anzahl freier Intensivbetten." },
          { t: "def", term: "Intervall- vs. Verhältnisskala", html: "Innerhalb der Kardinalskala: Die <b>Intervallskala</b> hat <b>keinen</b> natürlichen Nullpunkt (z. B. Temperatur in °C), die <b>Verhältnisskala</b> hat einen <b>natürlichen Nullpunkt</b> (z. B. Geldbetrag: 0 € = kein Geld, in jeder Währung)." },
          { t: "def", term: "Diskret vs. stetig", html: "Ein <b>diskretes</b> Merkmal hat nur wenige (endlich oder abzählbar unendlich viele) Ausprägungen (z. B. Anzahl Betten). Ein <b>stetiges</b> Merkmal kann alle Werte eines Intervalls annehmen, also sehr viele verschiedene (z. B. Geldbeträge auf den Cent)." },

          { t: "sub", html: "Abbildung 1 – Variablenklassifizierung nach Skalenniveaus" },
          {
            t: "html", html:
              "<div style=\"border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:16px;background:rgba(255,255,255,.02);line-height:1.7\">" +
              "<div style=\"font-weight:700;color:var(--teal,#5fd0c5);margin-bottom:6px\">Qualitative Merkmale</div>" +
              "<div style=\"padding-left:18px\">├── Nominalskala</div>" +
              "<div style=\"padding-left:18px\">└── Ordinalskala</div>" +
              "<div style=\"font-weight:700;color:var(--violet,#b79be8);margin:12px 0 6px\">Quantitative Merkmale</div>" +
              "<div style=\"padding-left:18px\">└── Kardinalskala</div>" +
              "<div style=\"padding-left:48px\">├── nach Anzahl Ausprägungen → <b>diskret</b> / <b>stetig</b></div>" +
              "<div style=\"padding-left:48px\">└── nach Nullpunkt → <b>Intervallskala</b> / <b>Verhältnisskala</b></div>" +
              "<div style=\"opacity:.6;font-size:.82em;margin-top:10px\">Quelle: Heike Bornewasser-Hermes, 2022.</div>" +
              "</div>"
          },
          { t: "p", html: "Merksatz für die Oberbegriffe: Nominal + Ordinal = <b>qualitative</b> Merkmale; Kardinal = <b>quantitative</b> Merkmale." },

          { t: "sub", html: "Die Krankenhaus-Merkmale auf einen Blick" },
          {
            t: "table",
            headers: ["Merkmal", "Ausprägungen", "Skalenniveau"],
            rows: [
              ["Umgebung", "städtisch / ländlich", "nominal, dichotom"],
              ["Universitätsklinik", "ja / nein", "nominal, dichotom"],
              ["Stationen", "Onkologie, Chirurgie, …", "nominal"],
              ["Patientenzufriedenheit", "sehr gut … sehr schlecht", "ordinal"],
              ["Anzahl freie Intensivbetten", "0, 1, 2, … (z. B. 20 vs. 10)", "kardinal, diskret"],
              ["Ausgaben (auf den Cent)", "beliebiger Geldbetrag", "kardinal, stetig"]
            ],
            caption: "Vier Merkmale, drei Skalenniveaus – die Skala bestimmt, was man rechnen darf."
          },

          { t: "warn", title: "Klassiker-Falle: Zahl ≠ metrisch", tag: "Klausur", html: "Eine Ausprägung in Zahlenform bedeutet <b>nicht automatisch</b> kardinal/metrisch! <b>Postleitzahl</b>, <b>Schulnote</b> und <b>Trikotnummer</b> sind Zahlen, aber nominal bzw. ordinal. Das ist der häufigste Klausurfehler zu dieser Lektion." },

          { t: "aha", title: "Die Skalen-Treppe (und drei Fallen)", html: "<b>Nominal &lt; Ordinal &lt; Kardinal</b> – je höher die Treppe, desto mehr darf man rechnen: nominal nur zählen, ordinal zusätzlich sortieren (Rang), kardinal zusätzlich addieren und Abstände/Durchschnitte bilden.<br><br>" +
            "• <b>Postleitzahl-Falle:</b> 50667 (Köln) ist nicht „mehr“ als 10115 (Berlin) → nominal.<br>" +
            "• <b>Schulnoten-Falle:</b> Der „Notendurchschnitt 2,3“ ist streng genommen ein beliebter Regelbruch – Noten sind ordinal, die Abstände nicht gleich.<br>" +
            "• <b>Temperatur-Trick:</b> 20 °C ist NICHT „doppelt so warm“ wie 10 °C (kein natürlicher Nullpunkt → intervall), aber 20 € sind doppelt so viel wie 10 € (natürlicher Nullpunkt → verhältnis)." },

          { t: "quote", html: "„So könnte man bspw. nicht anbringen, dass eine ‚sehr gute‘ Beurteilung eines Krankenhauses doppelt so gut wie eine ‚gute‘ Bewertung ist.“", source: "Bornewasser-Hermes, 2022 (zur Ordinalskala)" },

          { t: "why", title: "Warum brauche ich das?", html: "Das Skalenniveau ist der <b>Türsteher</b> für jede Berechnung: Es entscheidet, ob du den Mittelwert (kardinal), den Median/eine Rangfolge (ab ordinal) oder nur den Modus und Häufigkeiten (nominal) bilden darfst. Wer die Skala falsch einschätzt, produziert Unsinn wie eine „durchschnittliche Postleitzahl von 41 234“." },

          {
            t: "widget", title: "Skalenniveau-Sortierer", icon: "🪜",
            hint: "Ordne jedes Merkmal dem richtigen Skalenniveau zu. Das Feedback erklärt sofort, warum – und nennt bei kardinalen Merkmalen Zusatz wie diskret/stetig und intervall/verhältnis.",
            render: widgetSkalen
          },

          {
            t: "widget", title: "Grundbegriffe-Quiz", icon: "🧩",
            hint: "Drei Modi: Grundgesamtheit vs. Stichprobe, Merkmal vs. Merkmalsausprägung und Stichprobenart erkennen. Wähle oben den Modus.",
            render: widgetGrundbegriffe
          }
        ]
      },

      /* ================= 1.3 ================= */
      {
        num: "1.3",
        title: "Ablauf statistischer Untersuchungen",
        intro: "Statistisches Arbeiten ist Kochen: einkaufen, putzen, kochen. Der unterschätzte Schritt ist das Putzen.",
        blocks: [
          { t: "p", lead: true, html: "Wir bleiben bei unserer Studie über die <b>deutschen Krankenhäuser</b>. Eine statistische Untersuchung läuft immer in drei Schritten ab: erst <b>Datensammlung</b>, dann <b>Datenaufbereitung</b>, schließlich <b>Datenanalyse</b>. Klingt simpel – aber jeder Schritt hat seine Fallstricke." },
          {
            t: "list", ordered: true, items: [
              "<b>Datensammlung:</b> Wo kommen die Daten her und über welchen Zeitraum?",
              "<b>Datenaufbereitung:</b> Daten mit Statistiksoftware sauber machen – auf fehlende und fehlerhaft übertragene Werte prüfen.",
              "<b>Datenanalyse:</b> Auswerten – deskriptiv, inferenziell oder explorativ."
            ]
          },

          { t: "h", text: "Schritt 1 – Datensammlung", icon: "🛒" },
          { t: "p", html: "Bei der <b>Herkunft</b> unterscheidet man <b>Primärdaten</b> (selbst erhoben – Befragung, Beobachtung, Experiment) und <b>Sekundärdaten</b> (Rückgriff auf bereits vorhandene Daten, z. B. aus dem Vorjahr)." },
          { t: "p", html: "Bei der <b>zeitlichen Dimension</b> wird es spannend:" },
          { t: "def", term: "Querschnittsdesign", html: "Die Erhebung findet nur zu einem Zeitpunkt bzw. in einer kurzen Zeitspanne statt (ca. 2 bis 4 Wochen). Eine Momentaufnahme." },
          { t: "def", term: "Längsschnittdesign", html: "Erfasst immer wieder die gleichen Daten zu mehreren aufeinanderfolgenden Zeitpunkten. Zwei Unterarten: <b>Trenddesign</b> (regelmäßig, aber nicht notwendig dieselben Merkmalsträger) und <b>Paneldesign</b> (regelmäßig und <b>immer dieselben</b> Merkmalsträger)." },
          { t: "def", term: "Paneldesign", html: "Bringt die Ergebnisse mit den meisten Informationen hervor: Weil immer dieselben Merkmalsträger befragt werden, sind <b>intraindividuelle Veränderungen</b> über die Zeit sichtbar. Nachteile: <b>Paneleffekte/Lerneffekte</b> (Befragte ändern sich durchs Befragtwerden) und <b>Panelmortalität</b> (Teilnehmende fallen über die Zeit weg)." },
          { t: "p", html: "Informationsgehalt-Rangfolge laut Skript: <b>Panel &gt; Trend &gt; Querschnitt</b>." },
          { t: "quote", html: "„Dennoch liefern Studien im Paneldesign den höchsten Informationsgehalt, gefolgt vom Trenddesign und abschließend vom Querschnittsdesign.“", source: "Bornewasser-Hermes, 2022" },

          { t: "h", text: "Schritt 2 – Datenaufbereitung", icon: "🧹" },
          { t: "p", html: "Die Rohdaten werden mit Statistiksoftware wie <b>Excel, SPSS, R oder Stata</b> aufbereitet und auf <b>fehlende</b> sowie <b>fehlerhaft übertragene</b> Daten geprüft. Der langweiligste, aber entscheidende Schritt – die Grundlage für eine saubere Auswertung." },

          { t: "h", text: "Schritt 3 – Datenanalyse", icon: "🔬" },
          { t: "def", term: "Deskriptive Statistik", html: "Beschreibt die gesammelten Daten mit Tabellen, Grafiken und Maßzahlen (z. B. dem Mittelwert). Ziel: die Daten <b>komprimiert zusammenfassen</b>." },
          { t: "def", term: "Inferenzstatistik", html: "Prüft, ob sich die deskriptiven Ergebnisse der Stichprobe auf die <b>Grundgesamtheit verallgemeinern</b> lassen. Arbeitet mit <b>Hypothesen</b>, z. B.: „Universitätskrankenhäuser haben einen größeren Einzugsbereich als Nicht-Universitätskrankenhäuser.“" },
          { t: "def", term: "Explorative Statistik", html: "Erkundet neue, noch wenig erforschte Bereiche. Beispiel: Zu Beginn der Corona-Pandemie waren sämtliche Analysen zunächst explorativer Natur." },

          { t: "aha", title: "Aha: Statistik ist Kochen", html: "<b>Datensammlung = einkaufen</b>, <b>Datenaufbereitung = Zutaten putzen und schneiden</b> (langweilig, aber ohne saubere Zutaten wird das Essen schlecht), <b>Datenanalyse = kochen und servieren</b>. Der unterschätzte Schritt ist das Putzen: „Garbage in, garbage out.“<br><br>Und der Unterschied Panel vs. Trend ist wie ein <b>Klassenfoto</b>: Trend = jedes Jahr irgendeine Schulklasse fotografieren; Panel = jedes Jahr <b>dieselbe</b> Klasse fotografieren – nur beim Panel sieht man, wie ein einzelnes Kind wächst." },

          { t: "why", title: "Warum brauche ich das?", html: "Bevor man rechnet, muss man wissen, <b>wie</b> die Daten entstanden sind. Eine geniale Analyse auf einer Ad-hoc-Straßenumfrage bleibt wertlos. Das Untersuchungsdesign entscheidet, welche Schlüsse überhaupt erlaubt sind – Veränderung über Zeit z. B. nur mit Längsschnitt/Panel." },

          { t: "quote", html: "„Die Statistik umfasst die statistische Analyse von Daten mit dem Ziel, neue Erkenntnisse zu gewinnen. … In der Regel untersucht man nur Daten einer Stichprobe.“", source: "Bornewasser-Hermes, 2022 (Zusammenfassung)" },

          {
            t: "widget", title: "Ablauf einer statistischen Untersuchung", icon: "🧭",
            hint: "Klick dich Schritt für Schritt durch die drei Phasen der Krankenhaus-Studie: Datensammlung → Datenaufbereitung → Datenanalyse.",
            render: widgetAblauf
          },

          { t: "divider" },

          { t: "h", text: "Ausblick: Die Urliste – die erste Notation der Statistik", icon: "🔢" },
          { t: "p", html: "Am Ende der Datensammlung steht für jedes Merkmal erst einmal eine schlichte, unsortierte Liste aller erhobenen Werte. Diese Liste hat einen eigenen Namen – und eine eigene Schreibweise, die dich ab Lektion 2 ständig begleitet. <i>(Das Skript führt die Urliste formal erst zu Beginn von Lektion 2 ein – hier kommt sie als ausdrücklich gekennzeichneter Vorgriff, damit die Notation beim ersten Rechnen schon sitzt.)</i>" },
          { t: "def", term: "Urliste / Rohdaten", html: "Die Urliste bzw. Rohdaten beinhalten die <b>gesammelten Daten eines Merkmals</b> – unsortiert, in der Reihenfolge der Erhebung. Sie ist der Ausgangspunkt jeder Datenanalyse und liegt für <b>jedes beliebige Skalenniveau</b> vor." },
          { t: "formula", tex: "x_1, x_2, \\dots, x_n", caption: "Die Urliste eines Merkmals. Kurzschreibweise: \\(x_i\\) für \\(i = 1, \\dots, n\\)." },
          { t: "p", html: "Dabei ist \\(x_1\\) die Merkmalsausprägung der ersten Person, \\(x_2\\) die der zweiten und \\(x_n\\) die der letzten. \\(n\\) steht für die Gesamtanzahl an Personen, den <b>Stichprobenumfang</b>. Der <b>Personenindex</b> \\(i = 1, \\dots, n\\) durchläuft einmal alle Merkmalsträger." },
          { t: "example", title: "Vier Urlisten, vier verschiedene n (Pflegeroboter-Befragung, Tabelle 1)", html: "In Lektion 2 startet ein konkreter Datensatz: <b>25 Patient:innen</b> wurden zu Pflegerobotern befragt. Jede der vier Merkmalsspalten ist eine eigene Urliste – mit eigenem \\(n\\):<br>• <b>Geschlecht:</b> alle 25 haben geantwortet → \\(n = 25\\)<br>• <b>Zufriedenheit:</b> eine Person hat die Bewertung ausgelassen → \\(n = 24\\)<br>• <b>Bisheriger Kontakt:</b> wieder alle → \\(n = 25\\)<br>• <b>Alter:</b> nur 19 wollten es verraten → \\(n = 19\\)" },
          { t: "aha", title: "Aha: n zählt Antworten, nicht Fragebögen", html: "Obwohl 25 Fragebögen eingesammelt wurden, ist \\(n\\) <b>pro Merkmal</b> verschieden: Jede fehlende Angabe (NA) drückt das \\(n\\) genau dieser Spalte – deshalb 25 / 24 / 25 / 19. Und genau das ist ein Ergebnis von <b>Schritt 2 (Datenaufbereitung)</b>: fehlende Werte erst einmal finden, bevor man rechnet." },

          {
            t: "widget", title: "Studien-Design-Navigator & Urliste-Explorer", icon: "🗂️",
            hint: "Teil 1: Ordne jedes Szenario der Krankenhaus-Studie dem richtigen Design zu (Datenquelle, Zeitdesign, Analyse-Bereich). Teil 2 (Ausblick auf Lektion 2): Erkunde Tabelle 1 – wähle eine Spalte und sieh live n, Ausprägungen, Skalenniveau und Häufigkeitstabelle.",
            render: widgetDesign
          },

          { t: "aha", title: "Ausblick: gleich kommen echte Zahlen", html: "Lektion 1 bleibt bewusst <b>begrifflich</b> – gerechnet wird hier noch nichts. Den Datensatz der 25 Patient:innen (Geschlecht, Zufriedenheit, bisheriger Kontakt, Alter) hast du im Urliste-Explorer schon beschnuppert; <b>ausführlich ausgewertet</b> (Häufigkeiten, Grafiken, Mittelwerte) wird er erst <b>in Lektion 2</b>. Dort beginnt jede Analyse mit genau so einer <b>Urliste</b> \\(x_1, x_2, \\dots, x_n\\)." }
        ]
      }
    ],

    quiz: [
      {
        q: "Was beschreibt die <b>Grundgesamtheit</b>?",
        options: [
          "alle tatsächlich untersuchten Merkmalsträger",
          "alle Merkmalsträger, die für die Studie in Frage kommen",
          "nur die repräsentativen Fälle",
          "die fehlenden Werte"
        ],
        correct: 1,
        explain: "Die Grundgesamtheit umfasst ALLE infrage kommenden Merkmalsträger. Die tatsächlich untersuchten sind die Stichprobe."
      },
      {
        q: "Welches Skalenniveau hat die <b>Patientenzufriedenheit</b> (sehr gut … sehr schlecht)?",
        options: ["nominal", "ordinal", "kardinal / metrisch", "verhältnisskaliert"],
        correct: 1,
        explain: "Geordnete Kategorien, aber die Abstände sind nicht interpretierbar → ordinal. „Sehr gut“ ist nicht doppelt so gut wie „gut“."
      },
      {
        q: "Warum ist die Temperatur in °C <b>intervall-</b> und nicht verhältnisskaliert?",
        options: [
          "weil sie negativ werden kann",
          "weil sie keinen natürlichen Nullpunkt hat (0 °C ≠ 0 °F)",
          "weil sie nominal ist",
          "weil sie diskret ist"
        ],
        correct: 1,
        explain: "0 °C ist ein willkürlich gesetzter Nullpunkt (in °F ein anderer Wert). Ohne natürlichen Nullpunkt sind Verhältnisse („doppelt so warm“) nicht sinnvoll → Intervallskala."
      },
      {
        q: "Eine <b>Postleitzahl</b> ist …",
        options: [
          "kardinalskaliert, weil es eine Zahl ist",
          "ordinalskaliert",
          "nominalskaliert",
          "verhältnisskaliert"
        ],
        correct: 2,
        explain: "Trotz Zahlenform gibt es keine sinnvolle Ordnung oder Abstände – 50667 ist nicht „mehr“ als 10115 → nominal. Klassische „Zahl ≠ metrisch“-Falle."
      },
      {
        q: "Welches Untersuchungsdesign liefert laut Skript den <b>höchsten Informationsgehalt</b>?",
        options: ["Querschnittsdesign", "Trenddesign", "Paneldesign", "Ad-hoc-Design"],
        correct: 2,
        explain: "Rangfolge: Panel > Trend > Querschnitt. Beim Panel werden immer dieselben Merkmalsträger befragt → intraindividuelle Veränderungen werden sichtbar."
      },
      {
        q: "Man befragt Passant:innen in der Kölner Innenstadt zur Wahlabsicht. Welche <b>Stichprobenart</b> ist das?",
        options: [
          "einfache Zufallsstichprobe",
          "geschichtete Stichprobe",
          "Klumpenstichprobe",
          "Ad-hoc-Stichprobe"
        ],
        correct: 3,
        explain: "Es werden nur die gerade Verfügbaren befragt → Ad-hoc-Stichprobe. Sie ist keine gute Grundlage für allgemeingültige Aussagen."
      },
      {
        q: "„städtisch“ ist beim Krankenhaus-Merkmal „Umgebung“ ein/eine …",
        options: ["Merkmal", "Merkmalsausprägung", "Merkmalsträger", "Grundgesamtheit"],
        correct: 1,
        explain: "Das Merkmal ist „Umgebung“; „städtisch“ ist ein konkreter Wert davon → Merkmalsausprägung."
      },
      {
        q: "Welcher Statistik-Bereich prüft, ob Stichproben-Ergebnisse auf die Grundgesamtheit <b>übertragbar</b> sind?",
        options: ["deskriptive Statistik", "Inferenzstatistik", "explorative Statistik", "Datenaufbereitung"],
        correct: 1,
        explain: "Die Inferenzstatistik verallgemeinert von der Stichprobe auf die Grundgesamtheit und arbeitet dabei mit Hypothesen."
      },
      {
        q: "Eine Studie befragt <b>jedes Jahr immer dieselben</b> Krankenhäuser. Welches Design ist das?",
        options: ["Querschnittsdesign", "Trenddesign", "Paneldesign", "Ad-hoc-Design"],
        correct: 2,
        explain: "Regelmäßig UND immer dieselben Merkmalsträger → Paneldesign. (Wechselnde Merkmalsträger wären ein Trenddesign.)"
      },
      {
        q: "Welches Merkmal ist <b>dichotom</b>?",
        options: [
          "Stationszugehörigkeit",
          "Universitätsklinik (ja/nein)",
          "Patientenzufriedenheit",
          "Anzahl freier Betten"
        ],
        correct: 1,
        explain: "Dichotom = genau zwei Ausprägungen. „Universitätsklinik ja/nein“ hat genau zwei → dichotom (und nominal)."
      },
      {
        q: "Das Merkmal „Anzahl freier Intensivbetten“ (0, 1, 2, … Betten) ist …",
        options: ["ordinal", "kardinal, diskret", "kardinal, stetig", "nominal"],
        correct: 1,
        explain: "Zahlen mit interpretierbaren Abständen (20 Betten sind doppelt so viele wie 10) → kardinal; abzählbar/wenige Werte → diskret."
      },
      {
        q: "Selbst erhobene Befragungsdaten heißen …",
        options: ["Primärdaten", "Sekundärdaten", "Urliste", "Paneldaten"],
        correct: 0,
        explain: "Primärdaten erhebt man selbst (Befragung, Beobachtung, Experiment). Sekundärdaten greifen auf bereits vorhandene Daten zurück."
      },
      {
        q: "Ausblick auf Tabelle 1 (Pflegeroboter-Befragung, 25 Patient:innen): Wie groß ist \\(n\\) für das Merkmal „Alter“?",
        options: ["25", "24", "19", "16"],
        correct: 2,
        explain: "6 Patient:innen (Nr. 2, 5, 12, 17, 20, 25) haben keine Altersangabe gemacht → 25 − 6 = 19 gültige Werte. n zählt nur die tatsächlich vorliegenden Antworten – pro Merkmal!"
      },
      {
        q: "Was bezeichnet in der Urliste \\(x_1, x_2, \\dots, x_n\\) das Symbol \\(n\\)?",
        options: [
          "die Anzahl der untersuchten Merkmale",
          "den Stichprobenumfang (Anzahl der vorliegenden Antworten)",
          "den größten gemessenen Wert",
          "den Personenindex"
        ],
        correct: 1,
        explain: "n ist die Gesamtanzahl an Personen bzw. der Stichprobenumfang. Der Personenindex ist \\(i = 1, \\dots, n\\); \\(x_i\\) ist der Merkmalswert der i-ten Person."
      }
    ]
  });
})();
