/* ============================================================================
 * LEKTION 4 — Lineare Regression  (IU-Skript BSTA01-02, S. 99–115)
 * Leitbeispiel: Reaktionszeit unter Alkoholeinfluss (Tabelle 30).
 * Verifiziert: b≈53,844 · a≈596,503 · r≈0,742 · R²≈0,551 · ŷ(0,4)≈618,04.
 * Methodik: Verschiebungssatz mit Nenner n (Populationsvarianz). Die Quotienten
 * b und r sind nenner-unabhängig, daher liefert die lokale Funktion kennzahlen()
 * exakt die Skriptzahlen.
 * ========================================================================== */
(function(){
  "use strict";

  /* ---- Leitdatensatz (Tabelle 30, S. 101) -------------------------------- */
  const ALK = {
    x: [0, 0.3, 0.5, 0.7, 1, 1.2, 1.4, 1.8, 2.3, 2.5],
    y: [590, 581, 687, 658, 632, 645, 687, 624, 702, 789],
    xLabel: "Alkoholkonzentration (Promille)",
    yLabel: "Reaktionszeit (ms)"
  };
  /* ---- Illustrativer 3-Punkte-Datensatz (Abb. 16, S. 105) ---------------- */
  const DEMO3 = { x: [2, 5, 7], y: [2, 10, 7] };

  /* Helfer: alle Kennzahlen über den Verschiebungssatz (Nenner n).
     b/a/r/R² sind nenner-unabhängig und stimmen mit dem Skript überein. */
  function kennzahlen(x, y){
    const n = x.length;
    if(n < 2) return null;
    const m = a => a.reduce((s,v)=>s+v,0)/a.length;
    const xb = m(x), yb = m(y);
    const x2b = m(x.map(v=>v*v));
    const y2b = m(y.map(v=>v*v));
    const xyb = m(x.map((v,i)=>v*y[i]));
    const xbsq = xb*xb, ybsq = yb*yb;
    const cov = xyb - xb*yb;          // Kovarianz-Zähler
    const varX = x2b - xbsq;          // Varianz von x (Nenner n)
    const varY = y2b - ybsq;          // Varianz von y (Nenner n)
    const b = varX !== 0 ? cov/varX : NaN;
    const a = yb - b*xb;
    const r = (varX>0 && varY>0) ? cov/Math.sqrt(varX*varY) : NaN;
    return { n, xb, yb, x2b, y2b, xyb, xbsq, ybsq, cov, varX, varY, b, a, r, r2:r*r,
             sumX:xb*n, sumY:yb*n, sumX2:x2b*n, sumY2:y2b*n, sumXY:xyb*n };
  }

  App.registerLesson({
    id: 4,
    title: "Lineare Regression",

    /* ---------------------------------------------------------------- FORMELN */
    formulas: [
      { group:"Lektion 4 · Regression", name:"Regressionsgleichung",
        tex:"\\hat{y} = a + b\\cdot x_i", note:"geschätzter y-Wert (mit „Dach“)" },
      { group:"Lektion 4 · Regression", name:"Regressionskoeffizient b (Steigung)",
        tex:"b = \\dfrac{\\overline{xy} - \\bar{x}\\cdot\\bar{y}}{\\overline{x^2} - \\bar{x}^2}",
        note:"ZUERST berechnen; Zähler = Kovarianz, Nenner = Varianz von x (Nenner n)" },
      { group:"Lektion 4 · Regression", name:"Regressionskonstante a (y-Achsenabschnitt)",
        tex:"a = \\bar{y} - b\\cdot\\bar{x}", note:"DANACH berechnen — braucht b" },
      { group:"Lektion 4 · Qualität", name:"Korrelationskoeffizient (Bravais-Pearson)",
        tex:"r_{x,y} = \\dfrac{\\overline{xy} - \\bar{x}\\cdot\\bar{y}}{\\sqrt{\\left(\\overline{x^2}-\\bar{x}^2\\right)\\left(\\overline{y^2}-\\bar{y}^2\\right)}}",
        note:"misst die Linearität; im Regressionskontext sollte |r| ≥ 0,5 sein" },
      { group:"Lektion 4 · Qualität", name:"Bestimmtheitsmaß R²",
        tex:"R^2 = r_{x,y}^2 = \\dfrac{\\text{erklärte Streuung}}{\\text{Gesamtstreuung}}",
        note:"Erklärungsgehalt; Praxis-Faustregel R² ≥ 0,3" },
      { group:"Lektion 4 · Qualität", name:"Relativer Standardfehler",
        tex:"\\hat{\\sigma}_0 = \\dfrac{\\hat{\\sigma}_{x,y}}{\\bar{y}}",
        note:"durchschnittlicher Prognosefehler in Prozent" }
    ],

    /* --------------------------------------------------------------- SECTIONS */
    sections: [

      /* ============================================================ 4.1 ==== */
      {
        num:"4.1",
        title:"Grundlagen der einfachen linearen Regressionsanalyse",
        intro:"Korrelation fragt „<i>hängen x und y zusammen?</i>“. Regression geht einen Schritt weiter und fragt: „<i>Wenn ich x kenne — welchen y-Wert darf ich erwarten?</i>“",
        blocks:[
          {t:"p", lead:true, html:"Bei der Korrelation waren x und y gleichberechtigte Partner — wir haben nur gemessen, wie eng sie zusammen tanzen, ganz egal wer führt. Die <b>Regression</b> bricht mit dieser Gleichberechtigung: Hier behaupten wir mutig, dass <b>x die Variable y beeinflusst — und zwar nur in diese Richtung, niemals umgekehrt</b>."},
          {t:"p", html:"Damit das kein wildes Raten ist, brauchen wir für die Einflussrichtung einen <b>begründeten Verdacht</b>: entweder Vorwissen aus anderen Untersuchungen oder eine klare zeitliche Reihenfolge (erst der Wein, dann die lahme Reaktion — nicht umgekehrt)."},

          {t:"def", term:"Unabhängige Variable (x)",
            html:"„Eine unabhängige Variable kann Einfluss auf eine andere Variable nehmen.“ Sie wird auch <b>Prädiktor</b> genannt und immer auf der <b>x-Achse</b> abgetragen. <span class=\"muted\">(Bortz &amp; Schuster, 2010, S. 184)</span>"},
          {t:"def", term:"Abhängige Variable (y)",
            html:"„Eine abhängige Variable wird durch eine oder mehrere unabhängige Variablen beeinflusst.“ Sie heißt auch <b>Kriterium</b> und steht immer auf der <b>y-Achse</b>. <span class=\"muted\">(Bortz &amp; Schuster, 2010, S. 184)</span>"},

          {t:"h", text:"Was die einfache lineare Regression leistet", icon:"📈"},
          {t:"p", html:"Die einfache lineare Regression bestimmt die <b>Regressionsgerade</b> für den Zusammenhang zwischen <i>einer</i> unabhängigen Variablen x und <i>einer</i> abhängigen Variablen y. „Einfach“ heißt: genau ein Einflussfaktor. „Linear“ heißt: wir legen eine Gerade durch die Punktwolke."},
          {t:"list", items:[
            "Vor der Rechnung schaut man sich — wie bei der Korrelation — das <b>Streudiagramm</b> an.",
            "Die <b>Achszuordnung ist entscheidend</b>: unabhängige Variable auf die x-Achse, abhängige auf die y-Achse. Vertauschen liefert eine andere Gerade!",
            "Ein hoher Korrelationskoeffizient ist „eine sehr gute Grundlage“, um die Gerade überhaupt zu bestimmen."
          ]},

          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 100",
            html:"Anders als bei der Korrelation gehen wir aber jetzt konkret davon aus, dass die Variable x die Variable y beeinflusst und in keinem Fall andersherum."},

          {t:"h", text:"Das Leitbeispiel: Alkohol & Reaktionszeit", icon:"🍷"},
          {t:"p", html:"Auf einer Party wird bei 10 Gästen die <b>Alkoholkonzentration</b> (Promille) gemessen, anschließend ein <b>Reaktionstest</b> am Laptop (in Millisekunden). Person 1 ist nüchtern (0 Promille) und reagiert in 590 ms; Person 7 hat 1,4 Promille und braucht schon 687 ms."},
          {t:"table",
            caption:"Tabelle 30 — Ausgangsdaten für die einfache lineare Regression (n = 10)",
            headers:["Person i","x — Alkohol (Promille)","y — Reaktionszeit (ms)"],
            rows: ALK.x.map((xv,i)=>[i+1, ctxFmtComma(xv), ALK.y[i]])
          },
          {t:"p", html:"Das Streudiagramm (Abb. 15) zeigt einen klar <b>positiven Zusammenhang</b>: je mehr Promille, desto länger tendenziell die Reaktionszeit. Der vorab genannte Korrelationskoeffizient \\(r_{x,y}=0{,}742\\) bestätigt einen <b>starken, positiv linearen Zusammenhang</b> — die berechnen wir aber erst in 4.3 selbst."},

          {t:"why", title:"Warum brauche ich das?",
            html:"Regression ist die Maschine für <b>Prognosen</b>. Ein einziger Messwert (Promille) liefert eine Schätzung für die Zielgröße (Reaktionszeit). Genau dasselbe Prinzip steckt hinter: Werbebudget → Umsatz, Lernstunden → Klausurnote, Medikamentendosis → Wirkung. Wer x messen kann, kann y abschätzen."},
          {t:"aha", title:"Korrelation = Diagnose, Regression = Rezept",
            html:"Die <b>Korrelation</b> sagt dir nur, <i>wie stark</i> zwei Dinge zusammenhängen — wie ein Arzt, der „Sie haben da was“ murmelt. Die <b>Regression</b> liefert eine konkrete Gleichung zum Vorhersagen — das passende Rezept. Korrelation ist symmetrisch (kennt keine Richtung), Regression ist gerichtet (x → y)."},

          {t:"widget", title:"Streudiagramm-Explorer: Alkohol vs. Reaktionszeit", icon:"🔎",
            hint:"Fahre mit der Maus über die Punkte. Der Zusammenhang steigt sichtbar an.",
            render: renderScatterIntro },

          {t:"divider"},
          {t:"p", html:"Soweit das Setup. In <b>4.2</b> bauen wir die Gerade tatsächlich — mit der berühmten Methode der kleinsten Quadrate."}
        ]
      },

      /* ============================================================ 4.2 ==== */
      {
        num:"4.2",
        title:"Bestimmung der Regressionsgerade (Methode der kleinsten Quadrate)",
        intro:"Gesucht: die <i>eine</i> Gerade, die am besten durch die Punktwolke passt. Gefunden: über die Methode der kleinsten Quadrate und genau zwei Zahlen — a und b.",
        blocks:[
          {t:"p", lead:true, html:"Durch jede Punktwolke kann man unendlich viele Geraden legen. Wir suchen die <b>beste</b>. „Beste“ heißt: die Punkte sollen <i>möglichst nah</i> an der Geraden liegen. Eine Gerade hat genau zwei Stellschrauben — den Achsenabschnitt \\(a\\) und die Steigung \\(b\\)."},

          {t:"formula", tex:"\\hat{y} = a + b\\cdot x_i",
            caption:"Die Regressionsgleichung. Das „Dach“ auf ŷ zeigt: das ist ein geschätzter, kein gemessener Wert."},

          {t:"h", text:"Residuen — warum überhaupt „Fehler“?", icon:"📏"},
          {t:"p", html:"Kein realer Punkt liegt exakt auf der Geraden (das wäre auch verdächtig). Der senkrechte Abstand zwischen dem <b>beobachteten</b> Wert \\(y_i\\) und dem <b>geschätzten</b> Wert \\(\\hat{y}_i\\) heißt <b>Residuum</b>."},
          {t:"def", term:"Residuum",
            html:"„Ein Residuum ist der Abstand zwischen dem tatsächlichen y-Wert und dem auf Basis der Regressionsgeraden geschätzten y-Wert.“ <span class=\"muted\">(Bortz &amp; Schuster, 2010, S. 186)</span>"},
          {t:"p", html:"Die <b>Methode der kleinsten Quadrate (KQM)</b> sucht nun jene Gerade, bei der die <b>Summe der quadrierten Residuen minimal</b> wird. Warum quadriert? Weil Punkte mal nach oben, mal nach unten abweichen — ohne Quadrat würden sich die Vorzeichen aufheben und jede beliebige Gerade durch die Mitte wäre „perfekt“."},

          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 106",
            html:"Man nimmt die quadrierten Abweichungen, da einige Punkte nach oben und andere nach unten von der Regressionsgeraden abweichen."},

          {t:"aha", title:"Die Gummiband-Analogie",
            html:"Stell dir von jedem Punkt ein <b>senkrechtes Gummiband</b> zur Geraden vor. Jedes Band zieht. Die Gerade pendelt sich genau dort ein, wo die Summe der <i>quadrierten</i> Längen am kleinsten ist — daher „kleinste Quadrate“. Quadrieren bestraft große Ausreißer übrigens überproportional: ein Punkt doppelt so weit weg zieht viermal so stark."},

          {t:"h", text:"Die beiden Formeln — Reihenfolge beachten!", icon:"🧮"},
          {t:"warn", tag:"Merken", title:"Erst b, dann a",
            html:"Der Regressionskoeffizient \\(b\\) muss <b>immer zuerst</b> berechnet werden, weil die Formel für \\(a\\) das fertige \\(b\\) als Zutat braucht."},
          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 106",
            html:"Dieser Parameter [b] muss stets zuerst ausgerechnet werden, da wir für die Berechnung von a das Ergebnis von b benötigen."},

          {t:"formula", tex:"b = \\frac{\\overline{xy} - \\bar{x}\\cdot\\bar{y}}{\\overline{x^2} - \\bar{x}^2}",
            caption:"Regressionskoeffizient b (Steigung). Zähler = Kovarianz, Nenner = Varianz von x (Nenner n)."},
          {t:"formula", tex:"a = \\bar{y} - b\\cdot\\bar{x}",
            caption:"Regressionskonstante a (y-Achsenabschnitt)."},

          {t:"warn", tag:"Stolperfalle", title:"x̄² ist NICHT x²-quer",
            html:"\\(\\bar{x}^2\\) = erst mitteln, dann quadrieren (Quadrat des Mittels = 1,3689). \\(\\overline{x^2}\\) = erst quadrieren, dann mitteln (Mittel der Quadrate = 2,001). Zwei verschiedene Zahlen! Der Querstrich gehört im einen Fall über das ganze \\(x^2\\), im anderen nur über das \\(x\\)."},

          {t:"def", term:"Regressionskoeffizient b",
            html:"„Der Regressionskoeffizient beschreibt die Steigung der linearen Regressionsgerade.“ Er gibt an, um wie viele Einheiten sich y verändert, wenn x um <b>eine Einheit</b> zunimmt. <span class=\"muted\">(Bortz &amp; Schuster, 2010, S. 188)</span>"},
          {t:"def", term:"Regressionskonstante a",
            html:"„Die Regressionskonstante beschreibt den y-Achsenabschnitt der linearen Regressionsgerade.“ Sie gibt an, welchen Wert y annimmt, wenn \\(x = 0\\) ist."},

          {t:"h", text:"Das Leitbeispiel komplett durchgerechnet", icon:"✍️"},
          {t:"example", title:"Schritt 1 — die fünf Mittelwerte (S. 107)",
            html:
              "\\[\\bar{x}=\\tfrac{1}{10}(0+0{,}3+\\dots+2{,}5)=1{,}17\\qquad \\bar{y}=\\tfrac{1}{10}(590+581+\\dots+789)=659{,}5\\]"+
              "\\[\\bar{x}^2 = 1{,}17^2 = 1{,}3689\\qquad \\overline{x^2}=\\tfrac{1}{10}(0^2+0{,}3^2+\\dots+2{,}5^2)=2{,}001\\]"+
              "\\[\\overline{xy}=\\tfrac{1}{10}(0\\cdot590+0{,}3\\cdot581+\\dots+2{,}5\\cdot789)=805{,}65\\]"},
          {t:"example", title:"Schritt 2 — Koeffizient b (zuerst!)",
            html:
              "\\[b=\\frac{\\overline{xy}-\\bar{x}\\cdot\\bar{y}}{\\overline{x^2}-\\bar{x}^2}"+
              "=\\frac{805{,}65-1{,}17\\cdot659{,}5}{2{,}001-1{,}3689}"+
              "=\\frac{34{,}035}{0{,}6321}\\approx 53{,}844\\]"+
              "<p>Zähler: \\(805{,}65 - 771{,}615 = 34{,}035\\). Nenner: \\(2{,}001 - 1{,}3689 = 0{,}6321\\).</p>"},
          {t:"example", title:"Schritt 3 — Konstante a (danach)",
            html:"\\[a=\\bar{y}-b\\cdot\\bar{x}=659{,}5-53{,}844\\cdot1{,}17=596{,}503\\]"},
          {t:"example", title:"Schritt 4 — die fertige Regressionsgleichung",
            html:
              "\\[\\hat{y}=596{,}503+53{,}844\\cdot x\\]"+
              "<p>oder ausgeschrieben:</p>"+
              "\\[\\widehat{\\text{Reaktionszeit}}=596{,}503+53{,}844\\cdot \\text{Alkohol}\\]"},

          {t:"h", text:"Interpretation der beiden Zahlen", icon:"💬"},
          {t:"list", items:[
            "<b>b = 53,844:</b> Pro zusätzlichem Promille verlängert sich die Reaktionszeit um rund 53,8 ms. Positives b ⇒ positiver Einfluss; je größer \\(|b|\\), desto steiler die Gerade.",
            "<b>a = 596,503:</b> Bei 0 Promille erwarten wir eine Reaktionszeit von ca. 596,5 ms — die nüchterne Grundreaktionszeit.",
            "Die Konstante a kann inhaltlich auch mal sinnlos oder negativ sein (z. B. „negativer Umsatz bei 0 € Werbung“) — hier ist sie zum Glück plausibel."
          ]},
          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 107",
            html:"Der Regressionskoeffizient … gibt uns an, um wie viele Einheiten sich y verändert, wenn x um eine Einheit zunimmt."},

          {t:"h", text:"Der eigentliche Lohn: Prognosen", icon:"🔮"},
          {t:"p", html:"Die Polizei misst bei einem verdächtigen Verkehrsteilnehmer 0,4 Promille. Welche Reaktionszeit ist zu erwarten? Einfach x einsetzen:"},
          {t:"example", title:"Prognose für 0,4 Promille (S. 108)",
            html:"\\[\\hat{y}=596{,}503+53{,}844\\cdot0{,}4 = 618{,}041\\text{ ms}\\]<p>Wir sagen bewusst „abschätzen“, denn nicht alle realen Punkte liegen exakt auf der Geraden.</p>"},
          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 108",
            html:"Der große Vorteil der aufgestellten Regressionsgerade liegt darin, dass wir mit ihr Prognosen anstellen können."},

          {t:"why", title:"Warum brauche ich das?",
            html:"Genau das ist der praktische Kern jeder Regression: aus einem bekannten x ein unbekanntes y vorhersagen. Ob Verkehrskontrolle, Verkaufsprognose oder Notenvorhersage — die zwei Zahlen a und b sind das ganze Modell. Mehr brauchst du nicht, um zu prognostizieren."},

          {t:"widget", title:"Regressionsgerade-Builder (KQM live)", icon:"🛠️",
            hint:"Klicke, um Punkte zu setzen, oder lade ein Beispiel. Die KQM-Gerade folgt sofort.",
            render: renderBuilder },

          {t:"p", html:"Das Zeichnen der Geraden ist laut Skript „von untergeordneter Bedeutung“ — entscheidend sind die <b>Berechnung</b> und die <b>Interpretation</b> der Koeffizienten. Trotzdem hilft das Bild beim Verstehen, deshalb gibt's das Widget oben."}
        ]
      },

      /* ============================================================ 4.3 ==== */
      {
        num:"4.3",
        title:"Qualitätsbeurteilung (Korrelationskoeffizient & Bestimmtheitsmaß R²)",
        intro:"Die KQM findet für <b>jede</b> Punktwolke eine Gerade — auch für völligen Unsinn. Deshalb müssen wir prüfen, ob die Gerade überhaupt etwas taugt.",
        blocks:[
          {t:"p", lead:true, html:"Die Methode der kleinsten Quadrate ist gnadenlos hilfsbereit: Sie spuckt selbst dann eine Gerade aus, wenn die Punkte aussehen wie ein Spritzer Tomatensoße. Eine Gerade <i>haben</i> heißt also nicht, eine <i>gute</i> Gerade haben."},
          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 110",
            html:"Die Methode der kleinsten Quadrate findet für jede beliebige Konstellation an Punkten im Streudiagramm eine lineare Gerade; und sei sie auch noch so schlecht geeignet, um den Zusammenhang abzubilden."},
          {t:"p", html:"Zur Qualitätsprüfung gibt es <b>drei Maßzahlen</b>, die Hand in Hand gehen:"},
          {t:"list", ordered:true, items:[
            "<b>Korrelationskoeffizient (Bravais-Pearson):</b> misst den Grad der Linearität.",
            "<b>Bestimmtheitsmaß R²:</b> der Erklärungsgehalt — <i>das wichtigste Kriterium</i>.",
            "<b>Standardfehler:</b> der durchschnittliche absolute (bzw. relative) Prognosefehler."
          ]},

          {t:"h", text:"4.3.1 Korrelationskoeffizient von Bravais-Pearson", icon:"🔗"},
          {t:"p", html:"Er beurteilt, wie gut die Punkte überhaupt auf einer Geraden liegen (die Linearität). Wertebereich \\(-1\\) bis \\(+1\\); je näher an \\(\\pm 1\\), desto stärker der lineare Zusammenhang. Im Regressionskontext gilt als Daumenregel: <b>\\(|r| \\geq 0{,}5\\)</b> für einen angemessenen linearen Zusammenhang."},
          {t:"formula", tex:"r_{x,y} = \\frac{\\overline{xy} - \\bar{x}\\cdot\\bar{y}}{\\sqrt{\\left(\\overline{x^2}-\\bar{x}^2\\right)\\cdot\\left(\\overline{y^2}-\\bar{y}^2\\right)}}",
            caption:"Korrelationskoeffizient. Der Zähler ist identisch mit dem Zähler von b — die Kovarianz."},
          {t:"p", html:"Wir brauchen 7 Mittelwerte; <b>5 davon kennen wir schon aus 4.2</b>. Neu sind nur \\(\\bar{y}^2\\) (Quadrat von ȳ) und \\(\\overline{y^2}\\) (Mittel der quadrierten y)."},

          {t:"example", title:"Die zwei neuen Mittelwerte (S. 111)",
            html:
              "\\[\\bar{y}^2 = 659{,}5^2 = 434\\,940{,}25\\]"+
              "\\[\\overline{y^2}=\\tfrac{1}{10}(590^2+581^2+\\dots+789^2)=438\\,271{,}3\\]"},
          {t:"example", title:"Korrelationskoeffizient einsetzen (S. 111)",
            html:
              "\\[r_{x,y}=\\frac{805{,}65-1{,}17\\cdot659{,}5}{\\sqrt{(2{,}001-1{,}3689)\\cdot(438\\,271{,}3-434\\,940{,}25)}}"+
              "=\\frac{34{,}035}{\\sqrt{0{,}6321\\cdot 3331{,}05}}=0{,}742\\]"+
              "<p>\\(r=0{,}742\\) ⇒ starker, positiv linearer Zusammenhang. Da \\(|r| &gt; 0{,}5\\): sehr gute Qualität bei der Linearität.</p>"},

          {t:"h", text:"4.3.2 Bestimmtheitsmaß R² — der Star", icon:"⭐"},
          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 112",
            html:"Das Bestimmtheitsmaß ist das wohl wichtigste Kriterium, um eine aufgestellte Regressionsgerade zu beurteilen."},
          {t:"p", html:"Idee: Die Reaktionszeiten streuen. Ein Teil dieser Streuung erklärt unsere Gerade (über x), der Rest bleibt unerklärt. R² misst den <b>erklärten Anteil</b>."},
          {t:"def", term:"Erklärte Streuung",
            html:"„Die erklärte Streuung ist auf die unabhängige Variable zurückzuführen.“ — der Teil der y-Schwankung, den x erklärt."},
          {t:"def", term:"Nicht erklärte Streuung",
            html:"„Die nicht erklärte Streuung entsteht durch nicht berücksichtigte Variablen und Messfehler.“ — alles, was unsere Gerade <i>nicht</i> erfasst."},
          {t:"def", term:"Bestimmtheitsmaß R²",
            html:"„Das Bestimmtheitsmaß gibt den Erklärungsgehalt eines Regressionsmodells wider.“ <span class=\"muted\">(Benesch, 2013, S. 119)</span>"},

          {t:"formula", tex:"\\text{Gesamtstreuung} = \\text{erklärte Streuung} + \\text{nicht erklärte Streuung}",
            caption:"Streuungszerlegung (S. 112)."},
          {t:"formula", tex:"R^2 = \\frac{\\text{erklärte Streuung}}{\\text{erklärte Streuung} + \\text{nicht erklärte Streuung}} = \\frac{\\text{erklärte Streuung}}{\\text{Gesamtstreuung}}",
            caption:"R² als Definition über die Streuungen."},

          {t:"p", html:"Klingt aufwendig — ist aber geschenkt. Der einfachste Rechenweg ist <b>einfach r quadrieren</b>:"},
          {t:"formula", tex:"R^2 = r_{x,y}^2",
            caption:"Der bequemste Weg zu R²."},
          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 113",
            html:"Das Einzige, was wir demnach machen müssen, ist, das Ergebnis des Korrelationskoeffizienten von Bravais-Pearson zu quadrieren."},

          {t:"example", title:"R² im Leitbeispiel (S. 113)",
            html:
              "\\[R^2 = 0{,}742^2 = 0{,}551\\]"+
              "<p><b>Interpretation:</b> 55,1 % der Streuung der Reaktionszeiten lassen sich auf die Alkoholkonzentration zurückführen. Die restlichen \\(1-0{,}551 = 0{,}449\\), also <b>44,9 %</b>, gehen auf andere Faktoren und Messfehler.</p>"},

          {t:"aha", title:"r=0,742 fühlt sich besser an, als es ist",
            html:"Ein r von 0,742 klingt nach „ziemlich gut“. Quadriert wird daraus aber nur 0,551 — also „nur“ 55 % erklärte Streuung. Genau das ist die Lehre: <b>ein hoher r täuscht über den tatsächlichen Erklärungsanteil hinweg</b>. R² ehrlicher als r."},
          {t:"aha", title:"Fast die Hälfte bleibt im Dunkeln",
            html:"R² = 0,551 heißt im Klartext: <b>44,9 % der Streuung kommen NICHT vom Alkohol</b> — sondern von Alter, Tageszeit, Tagesform, Messfehlern. Modelle sind nie vollständig; das ist normal, kein Mangel."},

          {t:"sub", text:"Skala &amp; Faustregeln für R²"},
          {t:"list", items:[
            "\\(R^2 \\in [0,1]\\); mal 100 ergibt einen Prozentwert.",
            "\\(R^2 = 0\\): kein Erklärungsgehalt. \\(R^2 = 1\\): vollständig (alle Punkte exakt auf der Geraden, \\(r=\\pm1\\)).",
            "Praxis-Faustregel: <b>R² ≥ 0,3 (30 %)</b> ⇒ „sehr zufrieden“. Unsere 0,551 liegt klar darüber — die Gerade taugt gut für Prognosen."
          ]},
          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 113",
            html:"In der Praxis gilt, dass man mit einem Bestimmtheitsmaß von mindestens 0,3 bzw. 30 % sehr zufrieden ist."},

          {t:"h", text:"4.3.3 Standardfehler (zur Vollständigkeit)", icon:"📐"},
          {t:"def", term:"Standardfehler",
            html:"„Der Standardfehler beschreibt den absoluten Schätzfehler bei der Nutzung des Regressionsmodells.“ <span class=\"muted\">(Bortz &amp; Schuster, 2010, S. 190)</span>"},
          {t:"p", html:"Das Skript verzichtet auf die Herleitung und nennt nur das Ergebnis: \\(\\hat{\\sigma}_{x,y}=43{,}279\\) ms. Heißt: Im Durchschnitt weichen wir um rund 43,3 ms vom wahren Wert ab. In Prozent ausgedrückt:"},
          {t:"formula", tex:"\\hat{\\sigma}_0 = \\frac{\\hat{\\sigma}_{x,y}}{\\bar{y}} = \\frac{43{,}279}{659{,}5} = 0{,}066 \\;(=6{,}6\\,\\%)",
            caption:"Relativer Standardfehler — durchschnittliche prozentuale Abweichung. Je näher an 0 %, desto besser."},

          {t:"sub", text:"Die drei Kriterien gehen Hand in Hand (S. 115)"},
          {t:"p", html:"Hohe Korrelation → hohes R² → niedriger Standardfehler. Und umgekehrt: niedrige Korrelation → niedriges R² → großer Fehler. Sie erzählen alle dieselbe Geschichte aus verschiedenen Blickwinkeln."},

          {t:"quote", source:"Bornewasser-Hermes, BSTA01-02, S. 115 (Zusammenfassung)",
            html:"Die einfache lineare Regression wird genutzt, um den Einfluss einer kardinalskalierten, unabhängigen Variable auf eine kardinalskalierte, abhängige Variable zu untersuchen."},

          {t:"widget", title:"Alkohol-Reaktionszeit: die komplette Skript-Rechnung", icon:"🧪",
            hint:"Klicke dich Schritt für Schritt durch die Original-Berechnung — jede Zahl wie im Skript.",
            render: renderStepsDemo },

          {t:"why", title:"Warum brauche ich das?",
            html:"Eine Gerade ist schnell gerechnet — aber wertlos, wenn sie nicht passt. R² und r sind dein Qualitäts-TÜV: Erst sie sagen dir, ob du deinen Prognosen trauen darfst. Ohne diese Prüfung baust du Vorhersagen auf Sand."}
        ]
      }
    ],

    /* ------------------------------------------------------------------ QUIZ */
    quiz: [
      { q:"Auf welcher Achse wird die <b>unabhängige</b> Variable abgetragen?",
        options:["y-Achse","x-Achse","beliebig","z-Achse"], correct:1,
        explain:"Konvention: unabhängige Variable (Prädiktor) immer auf die x-Achse, abhängige (Kriterium) auf die y-Achse. Vertauschen liefert eine andere Gerade." },
      { q:"Welcher Koeffizient muss <b>zuerst</b> berechnet werden – und warum?",
        options:[
          "a, weil es der Achsenabschnitt ist",
          "b, weil die Formel für a das Ergebnis von b benötigt (a = ȳ − b·x̄)",
          "egal, beide sind unabhängig",
          "r, weil R² daraus folgt"],
        correct:1,
        explain:"b muss stets zuerst ausgerechnet werden, da a = ȳ − b·x̄ das fertige b als Zutat braucht (S. 106)." },
      { q:"Was minimiert die Methode der kleinsten Quadrate?",
        options:["die Summe der Residuen","die Summe der quadrierten Residuen","das größte einzelne Residuum","die Steigung b"],
        correct:1,
        explain:"Die KQM minimiert die Summe der quadrierten Abweichungen. Quadriert, weil sich sonst positive und negative Residuen aufheben würden." },
      { q:"Im Alkohol-Beispiel ist b = 53,844. Wie interpretiert man das?",
        options:[
          "Bei 0 Promille beträgt die Reaktionszeit 53,844 ms",
          "Pro zusätzlichem Promille verlängert sich die Reaktionszeit um 53,844 ms",
          "53,844 % der Streuung sind erklärt",
          "Die Reaktionszeit halbiert sich alle 53,844 ms"],
        correct:1,
        explain:"b ist die Steigung: Nimmt x (Promille) um 1 zu, steigt y (Reaktionszeit) um 53,844 ms. Positives b ⇒ positiver Einfluss." },
      { q:"Wie berechnet man das Bestimmtheitsmaß am einfachsten aus r = 0,742?",
        options:["R² = 2·r = 1,484","R² = √r = 0,861","R² = r² = 0,742² = 0,551","R² = 1 − r = 0,258"],
        correct:2,
        explain:"Der bequemste Weg: einfach r quadrieren. 0,742² ≈ 0,551." },
      { q:"Was bedeutet R² = 0,551 inhaltlich?",
        options:[
          "55,1 % der Reaktionszeiten sind falsch gemessen",
          "Die Gerade hat eine Steigung von 55,1 %",
          "55,1 % der Streuung der Reaktionszeit werden durch die Alkoholkonzentration erklärt; 44,9 % durch andere Faktoren",
          "Mit 55,1 % Wahrscheinlichkeit ist die Gerade richtig"],
        correct:2,
        explain:"R² ist der erklärte Streuungsanteil: 55,1 % erklärt der Alkohol, die übrigen 44,9 % gehen auf andere Faktoren und Messfehler." },
      { q:"Welche Reaktionszeit prognostiziert das Modell für 0,4 Promille? (ŷ = 596,503 + 53,844·x)",
        options:["≈ 596,5 ms","≈ 618,0 ms","≈ 659,5 ms","≈ 789,0 ms"],
        correct:1,
        explain:"ŷ = 596,503 + 53,844·0,4 = 618,041 ms." },
      { q:"Welchen Mindestwert sollte R² laut Skript in der Praxis überschreiten?",
        options:["0,9","0,7","0,5","0,3"],
        correct:3,
        explain:"Faustregel: Mit einem R² von mindestens 0,3 (30 %) ist man in der Praxis „sehr zufrieden“." },
      { q:"Verwendet das Skript im Nenner der Varianz n oder n−1?",
        options:[
          "n−1 (Stichprobenvarianz)",
          "n (Verschiebungssatz: Mittel der Quadrate minus Quadrat des Mittels; 2,001 − 1,3689 = 0,6321)",
          "n+1",
          "abwechselnd"],
        correct:1,
        explain:"Das Skript nutzt durchgängig den Verschiebungssatz mit Nenner n. Bei b und r kürzt sich der Nenner ohnehin heraus, aber die Zwischenwerte folgen der n-Form." },
      { q:"Was ist ein Residuum?",
        options:[
          "der Mittelwert aller y-Werte",
          "die Steigung der Geraden",
          "der vertikale Abstand zwischen tatsächlichem y-Wert und dem geschätzten ŷ-Wert auf der Geraden",
          "die Korrelation zwischen x und y"],
        correct:2,
        explain:"Das Residuum ist der senkrechte Abstand zwischen beobachtetem y_i und geschätztem ŷ_i. Die KQM minimiert die Summe ihrer Quadrate." }
    ]
  });

  /* Kleiner String-Helfer für Tabellen-Strings (Komma statt Punkt). */
  function ctxFmtComma(v){ return String(v).replace(".", ","); }

  /* ======================================================================== *
   *  WIDGET 1a — Streudiagramm-Explorer (Intro, 4.1)
   * ======================================================================== */
  function renderScatterIntro(el, ctx){
    const wrap = ctx.el("div", {class:"canvas-wrap", style:{height:"340px"}});
    el.appendChild(wrap);
    const read = ctx.el("div", {class:"readout"});
    el.appendChild(read);

    const P = ctx.Plot(wrap, {xmin:-0.2, xmax:2.7, ymin:560, ymax:810, height:340, grid:true});
    ctx.onCleanup(()=>P.destroy());
    const pts = ALK.x.map((xv,i)=>({x:xv, y:ALK.y[i], i:i+1}));
    let hover = -1;

    function draw(){
      P.clear();
      P.axes({xlabel:ALK.xLabel, ylabel:ALK.yLabel, xticks:6, yticks:6,
              xfmt:v=>ctx.fmt.a(v), yfmt:v=>ctx.fmt.int(v)});
      // Punkte
      pts.forEach(p=>{
        const big = p.i-1===hover;
        P.points([[p.x,p.y]], {color: big?ctx.PAL.gold:ctx.PAL.teal, r: big?7:5, stroke:"#0c1426"});
      });
      if(hover>=0){
        const p = pts[hover];
        P.text(p.x, p.y, "  P"+p.i, {align:"left", baseline:"middle", color:ctx.PAL.gold, px:false});
      }
    }
    draw();
    P.onResize = draw;

    P.cv.addEventListener("pointermove", e=>{
      const {x,y} = P.pointer(e);
      let best=-1, bd=1e9;
      pts.forEach((p,idx)=>{
        const dpx = Math.hypot(P.X(p.x)-P.X(x), P.Y(p.y)-P.Y(y));
        if(dpx<bd){bd=dpx; best=idx;}
      });
      const nh = bd<22 ? best : -1;
      if(nh!==hover){ hover=nh; draw();
        read.innerHTML = hover>=0
          ? "Person <b>"+pts[hover].i+"</b>: "+ctx.fmt.a(pts[hover].x)+" Promille → "+ctx.fmt.int(pts[hover].y)+" ms"
          : "Fahre über einen Punkt für Details.";
      }
    });
    P.cv.addEventListener("pointerleave", ()=>{ hover=-1; draw(); read.innerHTML="Fahre über einen Punkt für Details."; });
    read.innerHTML = "Fahre über einen Punkt für Details. <span class=\"muted\">Klar erkennbar: mehr Promille → längere Reaktionszeit (positiver Zusammenhang).</span>";
  }

  /* ======================================================================== *
   *  WIDGET 2 — Regressionsgerade-Builder (KQM live, 4.2)
   * ======================================================================== */
  function renderBuilder(el, ctx){
    // Arbeitskopie der Punkte (frei editierbar)
    let X = ALK.x.slice(), Y = ALK.y.slice();
    let showRes = false, showSq = false;
    // Plot-Grenzen werden datenabhängig gesetzt
    let bounds = {xmin:0,xmax:1,ymin:0,ymax:1};

    /* ---- Bedienleiste ---- */
    const btnAlk  = ctx.el("button",{class:"btn primary"}, "🍷 Skript-Beispiel (10 Punkte)");
    const btnDemo = ctx.el("button",{class:"btn"}, "△ 3-Punkte-Demo (Abb. 16)");
    const btnClr  = ctx.el("button",{class:"btn ghost"}, "✕ Leeren");
    const btnUndo = ctx.el("button",{class:"btn ghost"}, "↶ Letzten entfernen");
    el.appendChild(ctx.el("div",{class:"btn-row"}, btnAlk, btnDemo, btnUndo, btnClr));

    const chipRes = ctx.el("span",{class:"chip"}, "Residuen anzeigen");
    const chipSq  = ctx.el("span",{class:"chip"}, "Fehler-Quadrate anzeigen");
    el.appendChild(ctx.el("div",{class:"chips"}, chipRes, chipSq));

    /* ---- Canvas ---- */
    const wrap = ctx.el("div",{class:"canvas-wrap", style:{height:"360px"}});
    el.appendChild(wrap);

    /* ---- Kennzahlen-Panel ---- */
    const stats = ctx.el("div",{class:"readout"});
    el.appendChild(stats);
    const eqn = ctx.el("div",{class:"readout"});
    el.appendChild(eqn);

    el.appendChild(ctx.el("p",{class:"widget-hint"},
      "Tipp: In den Plot klicken setzt einen neuen Punkt. Mit dem Skript-Beispiel müssen b ≈ 53,84 · a ≈ 596,5 · r ≈ 0,742 · R² ≈ 55,0 % erscheinen."));

    const P = ctx.Plot(wrap, {xmin:0,xmax:1,ymin:0,ymax:1, height:360, grid:true});
    ctx.onCleanup(()=>P.destroy());

    function computeBounds(){
      if(X.length===0){ bounds={xmin:0,xmax:3,ymin:0,ymax:10}; return; }
      let xmin=Math.min(...X), xmax=Math.max(...X), ymin=Math.min(...Y), ymax=Math.max(...Y);
      let px=(xmax-xmin)||1, py=(ymax-ymin)||1;
      bounds = { xmin:xmin-0.12*px, xmax:xmax+0.12*px, ymin:ymin-0.15*py, ymax:ymax+0.15*py };
      // y-Achsenabschnitt einbeziehen, damit Gerade sichtbar bleibt
    }

    function draw(){
      computeBounds();
      P.setX(bounds.xmin, bounds.xmax);
      P.setY(bounds.ymin, bounds.ymax);
      P.clear();
      P.axes({xlabel:"x", ylabel:"y", xticks:6, yticks:6,
              xfmt:v=>ctx.fmt.a(v), yfmt:v=>ctx.fmt.a(v)});

      const k = kennzahlen(X, Y);

      if(k && isFinite(k.b)){
        const a=k.a, b=k.b;
        const f = xv => a + b*xv;
        // Fehler-Quadrate (Flächen) zuerst, damit sie hinter allem liegen
        if(showSq){
          for(let i=0;i<X.length;i++){
            const xi=X[i], yi=Y[i], yh=f(xi);
            const side = yi - yh;                       // Residuum (Daten-Einheiten y)
            // quadratische Fläche: Seite = |Residuum| in y; gleiche Pixellänge in x
            const pxPerY = Math.abs(P.Y(yh+1)-P.Y(yh));
            const pxLen  = Math.abs(side)*pxPerY;       // Pixelhöhe
            const dxData = pxLen / Math.abs(P.X(xi+1)-P.X(xi)); // gleiche Pixel-Breite -> Daten-x
            const y0 = Math.min(yi,yh), y1 = Math.max(yi,yh);
            // Quadrat zur Plot-Innenseite zeichnen, damit es nie über den Rand ragt:
            // ragt es nach rechts hinaus, wird es nach links gespiegelt.
            const xL = (xi + dxData > bounds.xmax) ? xi - dxData : xi;
            const xR = xL + dxData;
            P.line([[xL,y0],[xR,y0],[xR,y1],[xL,y1],[xL,y0]],
                   {color:"rgba(240,114,111,.45)", width:1});
          }
        }
        // Residuen (senkrechte Linien)
        if(showRes){
          for(let i=0;i<X.length;i++){
            P.line([[X[i],Y[i]],[X[i],f(X[i])]], {color:ctx.PAL.bad, width:1.5, dash:[4,3]});
          }
        }
        // KQM-Gerade
        P.line([[bounds.xmin,f(bounds.xmin)],[bounds.xmax,f(bounds.xmax)]],
               {color:ctx.PAL.gold, width:2.5});
      }
      // Punkte oben drauf
      for(let i=0;i<X.length;i++){
        P.points([[X[i],Y[i]]], {color:ctx.PAL.teal, r:5, stroke:"#0c1426"});
      }
      updatePanel(k);
    }

    function statCard(v,l,cls){
      return ctx.el("div",{class:"stat"+(cls?" "+cls:"")},
        ctx.el("div",{class:"v"}, v), ctx.el("div",{class:"l"}, l));
    }

    function updatePanel(k){
      stats.innerHTML=""; eqn.innerHTML="";
      if(!k || !isFinite(k.b)){
        stats.appendChild(ctx.el("span",{class:"muted"},
          "Mindestens 2 Punkte mit unterschiedlichen x-Werten setzen…"));
        return;
      }
      stats.appendChild(statCard(ctx.fmt.a(k.b), "b (Steigung)", "gold"));
      stats.appendChild(statCard(ctx.fmt.a(k.a), "a (Achsenabschnitt)", "teal"));
      stats.appendChild(statCard(ctx.fmt.a(k.r), "r (Korrelation)", "violet"));
      stats.appendChild(statCard(isFinite(k.r2)?ctx.fmt.pct(k.r2):"–", "R² (erklärt)",
                                 (k.r2>=0.3?"good":"blue")));
      stats.appendChild(statCard(String(k.n), "n (Punkte)", "blue"));
      // Regressionsgleichung als Text mit korrekten Vorzeichen
      const sign = k.b>=0 ? "+" : "−";
      eqn.appendChild(ctx.el("div",{class:"stat", style:{flex:"1 1 100%"}},
        ctx.el("div",{class:"v", style:{fontSize:"1.05rem"}},
          "ŷ = "+ctx.fmt.a(k.a)+" "+sign+" "+ctx.fmt.a(Math.abs(k.b))+" · x"),
        ctx.el("div",{class:"l"}, "Regressionsgleichung")));
    }

    /* ---- Interaktionen ---- */
    function setData(nx,ny){ X=nx.slice(); Y=ny.slice(); draw(); }
    btnAlk.addEventListener("click", ()=>setData(ALK.x, ALK.y));
    btnDemo.addEventListener("click", ()=>setData(DEMO3.x, DEMO3.y));
    btnClr.addEventListener("click", ()=>setData([], []));
    btnUndo.addEventListener("click", ()=>{ if(X.length){ X.pop(); Y.pop(); draw(); } });

    chipRes.addEventListener("click", ()=>{ showRes=!showRes; chipRes.classList.toggle("active",showRes); draw(); });
    chipSq.addEventListener("click",  ()=>{ showSq =!showSq;  chipSq.classList.toggle("active",showSq);  draw(); });

    // Klick in den Plot = neuer Punkt (nur innerhalb der Datenfläche)
    // Padding entspricht den Plot-Defaults (padL/padR/padT/padB der Shell).
    const PAD = {L:46, R:14, T:14, B:34};
    P.cv.addEventListener("pointerdown", e=>{
      const {x,y,px,py} = P.pointer(e);
      // Plausibilität: nur akzeptieren, wenn im Zeichenbereich (nicht in Achsen/Beschriftung)
      if(px < PAD.L || px > P.w()-PAD.R || py < PAD.T || py > P.h()-PAD.B) return;
      X.push(+x); Y.push(+y); draw();
    });

    draw();
    P.onResize = draw;
  }

  /* ======================================================================== *
   *  WIDGET 3 — Alkohol-Reaktionszeit-Demo (Steps, 4.3)
   * ======================================================================== */
  function renderStepsDemo(el, ctx){
    const k = kennzahlen(ALK.x, ALK.y);     // exakte Werte (für die Grafik)
    const f = xv => k.a + k.b*xv;
    /* ANZEIGE-Werte: Rundungskette wie im Skript (jeder Zwischenschritt auf
       3 Dezimalen gerundet), damit jede gezeigte Zahl exakt dem Skript,
       dem Lektionstext und dem Quiz entspricht. */
    const bD  = Math.round(k.b*1000)/1000;                 // 53,844
    const aD  = Math.round((k.yb - bD*k.xb)*1000)/1000;    // 596,503
    const yhD = Math.round((aD + bD*0.4)*1000)/1000;       // 618,041
    const rD  = Math.round(k.r*1000)/1000;                 // 0,742
    const r2D = Math.round(rD*rD*1000)/1000;               // 0,551

    let cur = 0;
    const TOTAL = 8;

    /* Navigation */
    const prev = ctx.el("button",{class:"btn ghost"}, "← Zurück");
    const next = ctx.el("button",{class:"btn primary"}, "Weiter →");
    const lbl  = ctx.el("span",{class:"chip active"}, "");
    el.appendChild(ctx.el("div",{class:"btn-row"}, prev, lbl, next));

    /* Inhalts-Container */
    const body = ctx.el("div",{class:"steps"});
    el.appendChild(body);

    /* Canvas für die Schritte mit Grafik */
    const wrap = ctx.el("div",{class:"canvas-wrap", style:{height:"320px", display:"none"}});
    el.appendChild(wrap);
    let P = null;

    function ensurePlot(){
      if(P) return P;
      P = ctx.Plot(wrap, {xmin:-0.2, xmax:2.7, ymin:560, ymax:810, height:320, grid:true});
      ctx.onCleanup(()=>{ if(P) P.destroy(); });
      return P;
    }

    function drawScatter(withLine, predX){
      ensurePlot();
      P.setX(-0.2, 2.7); P.setY(560, 810);
      P.clear();
      P.axes({xlabel:ALK.xLabel, ylabel:ALK.yLabel, xticks:6, yticks:6,
              xfmt:v=>ctx.fmt.a(v), yfmt:v=>ctx.fmt.int(v)});
      if(withLine){
        P.line([[-0.2,f(-0.2)],[2.7,f(2.7)]], {color:ctx.PAL.gold, width:2.5});
      }
      for(let i=0;i<ALK.x.length;i++){
        P.points([[ALK.x[i],ALK.y[i]]], {color:ctx.PAL.teal, r:5, stroke:"#0c1426"});
      }
      if(predX!=null){
        const yh=f(predX);
        P.line([[predX,560],[predX,yh]], {color:ctx.PAL.violet, width:1.5, dash:[4,3]});
        P.line([[-0.2,yh],[predX,yh]], {color:ctx.PAL.violet, width:1.5, dash:[4,3]});
        P.points([[predX,yh]], {color:ctx.PAL.violet, r:6, stroke:"#0c1426"});
        P.text(predX, yh, "  ŷ≈"+ctx.fmt.int(yh), {align:"left", baseline:"bottom", color:ctx.PAL.violet});
      }
      P.onResize = ()=>drawScatter(withLine, predX);
    }

    function stepBox(title, html){
      const d = ctx.el("div",{class:"step"});
      d.appendChild(ctx.el("div",{class:"sk"}, title));
      d.appendChild(ctx.el("div",{html:html}));
      return d;
    }

    function render(){
      body.innerHTML="";
      wrap.style.display = "none";
      lbl.textContent = "Schritt "+(cur+1)+" / "+TOTAL;
      prev.disabled = cur===0;
      next.disabled = cur===TOTAL-1;

      if(cur===0){
        // Datentabelle + Streudiagramm
        let rows = ALK.x.map((xv,i)=>
          "<tr><td>"+(i+1)+"</td><td>"+ctx.fmt.a(xv)+"</td><td>"+ctx.fmt.int(ALK.y[i])+"</td></tr>").join("");
        body.appendChild(stepBox("① Die Ausgangsdaten (Tabelle 30, n = 10)",
          "<div class=\"tbl-wrap\"><table class=\"data\"><thead><tr><th>i</th><th>x (Promille)</th><th>y (ms)</th></tr></thead><tbody>"+rows+"</tbody></table></div>"+
          "<p>x = Alkohol (unabhängig, x-Achse), y = Reaktionszeit (abhängig, y-Achse). Wir sehen einen positiven Trend.</p>"));
        wrap.style.display="block"; drawScatter(false, null);
      }
      else if(cur===1){
        body.appendChild(stepBox("② Die fünf Mittelwerte",
          "\\[\\bar{x}=\\tfrac{1}{10}\\cdot"+ctx.fmt.a(k.sumX)+"="+ctx.fmt.a(k.xb)+"\\qquad "+
          "\\bar{y}=\\tfrac{1}{10}\\cdot"+ctx.fmt.int(k.sumY)+"="+ctx.fmt.a(k.yb)+"\\]"+
          "\\[\\bar{x}^2="+ctx.fmt.a(k.xb)+"^2="+ctx.fmt.n(k.xbsq,4)+"\\qquad "+
          "\\overline{x^2}=\\tfrac{1}{10}\\cdot"+ctx.fmt.a(k.sumX2)+"="+ctx.fmt.n(k.x2b,3)+"\\]"+
          "\\[\\overline{xy}=\\tfrac{1}{10}\\cdot"+ctx.fmt.a(k.sumXY)+"="+ctx.fmt.n(k.xyb,2)+"\\]"+
          "<p class=\"muted\">Achtung: \\(\\bar{x}^2="+ctx.fmt.n(k.xbsq,4)+"\\) (Quadrat des Mittels) ist nicht \\(\\overline{x^2}="+ctx.fmt.n(k.x2b,3)+"\\) (Mittel der Quadrate)!</p>"));
      }
      else if(cur===2){
        body.appendChild(stepBox("③ Regressionskoeffizient b — ZUERST",
          "\\[b=\\frac{\\overline{xy}-\\bar{x}\\cdot\\bar{y}}{\\overline{x^2}-\\bar{x}^2}"+
          "=\\frac{"+ctx.fmt.n(k.xyb,2)+"-"+ctx.fmt.a(k.xb)+"\\cdot"+ctx.fmt.a(k.yb)+"}{"+ctx.fmt.n(k.x2b,3)+"-"+ctx.fmt.n(k.xbsq,4)+"}\\]"+
          "\\[=\\frac{"+ctx.fmt.n(k.cov,3)+"}{"+ctx.fmt.n(k.varX,4)+"}\\approx "+ctx.fmt.n(bD,3)+"\\]"+
          "<p>Der Zähler ist die Kovarianz, der Nenner die Varianz von x (Nenner n).</p>"));
      }
      else if(cur===3){
        body.appendChild(stepBox("④ Regressionskonstante a — DANACH",
          "\\[a=\\bar{y}-b\\cdot\\bar{x}="+ctx.fmt.a(k.yb)+"-"+ctx.fmt.n(bD,3)+"\\cdot"+ctx.fmt.a(k.xb)+"="+ctx.fmt.n(aD,3)+"\\]"+
          "<p>a braucht b — deshalb die feste Reihenfolge.</p>"));
      }
      else if(cur===4){
        body.appendChild(stepBox("⑤ Die fertige Regressionsgleichung",
          "\\[\\hat{y}="+ctx.fmt.n(aD,3)+"+"+ctx.fmt.n(bD,3)+"\\cdot x\\]"+
          "<p><b>b="+ctx.fmt.n(bD,3)+":</b> +1 Promille ⇒ +"+ctx.fmt.n(bD,3)+" ms.<br>"+
          "<b>a="+ctx.fmt.n(aD,3)+":</b> bei 0 Promille ≈ "+ctx.fmt.n(aD,3)+" ms.</p>"));
        wrap.style.display="block"; drawScatter(true, null);
      }
      else if(cur===5){
        const px=0.4;
        body.appendChild(stepBox("⑥ Prognose: 0,4 Promille",
          "\\[\\hat{y}="+ctx.fmt.n(aD,3)+"+"+ctx.fmt.n(bD,3)+"\\cdot0{,}4="+ctx.fmt.n(yhD,3)+"\\text{ ms}\\]"+
          "<p>Erwartete Reaktionszeit ≈ "+ctx.fmt.n(yhD,3)+" ms. Wir „schätzen ab“, da nicht alle Punkte exakt auf der Geraden liegen.</p>"));
        wrap.style.display="block"; drawScatter(true, px);
      }
      else if(cur===6){
        body.appendChild(stepBox("⑦ Qualität: r und R²",
          "<p>Zwei neue Mittelwerte:</p>"+
          "\\[\\bar{y}^2="+ctx.fmt.a(k.yb)+"^2="+ctx.fmt.n(k.ybsq,2)+"\\qquad "+
          "\\overline{y^2}=\\tfrac{1}{10}\\cdot"+ctx.fmt.int(k.sumY2)+"="+ctx.fmt.n(k.y2b,1)+"\\]"+
          "\\[r_{x,y}=\\frac{"+ctx.fmt.n(k.cov,3)+"}{\\sqrt{"+ctx.fmt.n(k.varX,4)+"\\cdot"+ctx.fmt.n(k.varY,2)+"}}\\approx "+ctx.fmt.n(rD,3)+"\\]"+
          "\\[R^2=r_{x,y}^2="+ctx.fmt.n(rD,3)+"^2\\approx "+ctx.fmt.n(r2D,3)+"\\]"));
      }
      else if(cur===7){
        body.appendChild(stepBox("⑧ Interpretation & Fazit",
          "<p><b>r ≈ "+ctx.fmt.n(rD,3)+":</b> starker positiv-linearer Zusammenhang (|r| &gt; 0,5).</p>"+
          "<p><b>R² ≈ "+ctx.fmt.n(r2D,3)+":</b> 55,1 % der Streuung erklärt der Alkohol — "+
          "44,9 % gehen auf andere Faktoren/Fehler.</p>"+
          "<p>R² &gt; 0,3 ⇒ die Gerade ist gut für Prognosen geeignet.</p>"+
          "<p class=\"muted\">Zum Vergleich nennt das Skript noch den Standardfehler 43,279 ms (relativ ≈ 6,6 %).</p>"));
        // kleine Stat-Reihe als Zusammenfassung
        const sumRow = ctx.el("div",{class:"readout"});
        function sc(v,l,cls){ return ctx.el("div",{class:"stat"+(cls?" "+cls:"")},
          ctx.el("div",{class:"v"},v), ctx.el("div",{class:"l"},l)); }
        sumRow.appendChild(sc(ctx.fmt.n(bD,3),"b","gold"));
        sumRow.appendChild(sc(ctx.fmt.n(aD,3),"a","teal"));
        sumRow.appendChild(sc(ctx.fmt.n(rD,3),"r","violet"));
        sumRow.appendChild(sc("55,1 %","R²","good"));
        body.appendChild(sumRow);
      }

      if(ctx.typeset) ctx.typeset();
    }

    prev.addEventListener("click", ()=>{ if(cur>0){ cur--; render(); } });
    next.addEventListener("click", ()=>{ if(cur<TOTAL-1){ cur++; render(); } });
    render();
  }

})();
