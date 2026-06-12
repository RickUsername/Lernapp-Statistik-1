/* Lektion 2 — Auswertung eindimensionaler Daten (BSTA01-02, Kap. 2).
   Quelle: IU-Skript, Heike Bornewasser-Hermes, 2022, S. 24–62.
   Alle Zahlen 1:1 aus den Seitenbildern verifiziert. */
(function(){
  "use strict";

  /* ============================================================
     LOKALE DATEN & HELFER  (in der IIFE eingeschlossen)
     ============================================================ */

  // Vollständige Patiententabelle (Tabelle 1, S.25–26). null = fehlende Angabe.
  var PATIENTS = [
    {id:1,  sex:"weiblich", zuf:"gut",          kon:1, age:16},
    {id:2,  sex:"weiblich", zuf:"gut",          kon:5, age:null},
    {id:3,  sex:"weiblich", zuf:"gut",          kon:0, age:50},
    {id:4,  sex:"weiblich", zuf:"gut",          kon:0, age:35},
    {id:5,  sex:"männlich", zuf:"befriedigend", kon:1, age:null},
    {id:6,  sex:"weiblich", zuf:"befriedigend", kon:1, age:47},
    {id:7,  sex:"weiblich", zuf:"befriedigend", kon:2, age:15},
    {id:8,  sex:"weiblich", zuf:"befriedigend", kon:1, age:20},
    {id:9,  sex:"männlich", zuf:"gut",          kon:1, age:47},
    {id:10, sex:"männlich", zuf:"befriedigend", kon:1, age:48},
    {id:11, sex:"weiblich", zuf:"befriedigend", kon:1, age:44},
    {id:12, sex:"männlich", zuf:null,           kon:1, age:null},
    {id:13, sex:"weiblich", zuf:"gut",          kon:2, age:55},
    {id:14, sex:"weiblich", zuf:"gut",          kon:1, age:56},
    {id:15, sex:"weiblich", zuf:"gut",          kon:0, age:35},
    {id:16, sex:"weiblich", zuf:"ausreichend",  kon:3, age:48},
    {id:17, sex:"weiblich", zuf:"gut",          kon:1, age:null},
    {id:18, sex:"weiblich", zuf:"gut",          kon:1, age:52},
    {id:19, sex:"männlich", zuf:"sehr gut",     kon:0, age:49},
    {id:20, sex:"weiblich", zuf:"ausreichend",  kon:3, age:null},
    {id:21, sex:"weiblich", zuf:"gut",          kon:0, age:68},
    {id:22, sex:"weiblich", zuf:"befriedigend", kon:1, age:17},
    {id:23, sex:"weiblich", zuf:"gut",          kon:1, age:26},
    {id:24, sex:"weiblich", zuf:"befriedigend", kon:2, age:39},
    {id:25, sex:"weiblich", zuf:"befriedigend", kon:1, age:null}
  ];

  // Aufbereitete Urlisten (so im Skript für die Rechnungen verwendet).
  var KON = [1,5,0,0,1,1,2,1,1,1,1,1,2,1,0,3,1,1,0,3,0,1,1,2,1];          // n=25
  var AGE = [16,50,35,47,15,20,47,48,44,55,56,35,48,52,49,68,17,26,39];   // n=19
  // Urliste Zufriedenheit in Erhebungsreihenfolge (n=24, Pat.12 fehlt; Skript S.31/page_033).
  // Sortierreihenfolge best→schlecht siehe ZUF_ORDER.
  var ZUF_ORDER = ["sehr gut","gut","befriedigend","ausreichend"];
  var ZUF = ["gut","gut","gut","gut","befriedigend","befriedigend","befriedigend",
             "befriedigend","gut","befriedigend","befriedigend","gut","gut","gut",
             "ausreichend","gut","gut","sehr gut","ausreichend","gut","befriedigend",
             "gut","befriedigend","befriedigend"];

  // Skript-Klasseneinteilung Alter (unterschiedlich breit).
  var AGE_CLASSES = [
    {lo:15, hi:30, firstClosed:true},
    {lo:30, hi:45},
    {lo:45, hi:50},
    {lo:50, hi:70}
  ];

  // kleine Helfer (kollidieren nie, weil in IIFE)
  function fmtSex(s){ return s; }
  function dashIf(v){ return (v===null||v===undefined) ? "—" : v; }

  // Auszählung einer Kategorie-/Zahlenliste in {a, n}-Paare, optional in fester Reihenfolge.
  function tally(arr, order){
    var map = {}, keys = [];
    arr.forEach(function(v){
      var k = String(v);
      if(map[k]===undefined){ map[k]=0; }
      map[k]++;
    });
    if(order){
      keys = order.filter(function(k){ return map[String(k)]!==undefined; }).map(String);
    } else {
      keys = Object.keys(map);
      // numerisch sortieren wenn möglich
      var allNum = keys.every(function(k){ return k!=="" && !isNaN(Number(k)); });
      if(allNum){ keys.sort(function(a,b){ return Number(a)-Number(b); }); }
      else { keys.sort(); }
    }
    return keys.map(function(k){ return {a:k, n:map[k]}; });
  }

  /* ============================================================
     LEKTION
     ============================================================ */

  App.registerLesson({
    id: 2,
    title: "Eindimensionale Daten",

    formulas: [
      { group:"Lektion 2 · Häufigkeiten", name:"Relative Häufigkeit",
        tex:"f_j=\\frac{n_j}{n}", note:"Anteil der Ausprägung aⱼ" },
      { group:"Lektion 2 · Häufigkeiten", name:"Summe der relativen Häufigkeiten",
        tex:"\\sum_{j=1}^{k} f_j = 1", note:"alle Anteile zusammen ergeben 100 %" },
      { group:"Lektion 2 · Häufigkeiten", name:"Kumulierte Häufigkeit",
        tex:"F_m=\\sum_{j=1}^{m} f_j", note:"ab ordinal sinnvoll" },
      { group:"Lektion 2 · Häufigkeiten", name:"Kreisdiagramm-Winkel",
        tex:"\\alpha_j=f_j\\cdot 360^\\circ", note:"Pizza-Stück je Ausprägung" },
      { group:"Lektion 2 · Häufigkeiten", name:"Klassenbreite",
        tex:"\\Delta_j=x^{*}_{j}-x^{*}_{j-1}", note:"Breite der Klasse j" },
      { group:"Lektion 2 · Häufigkeiten", name:"Dichte (Histogramm)",
        tex:"\\hat f(x)=\\frac{f_j}{\\Delta_j}", note:"y-Achse beim Histogramm" },

      { group:"Lektion 2 · Lagemaße", name:"Modus",
        tex:"x_{\\text{mod}}=\\text{häufigste Ausprägung}", note:"jedes Skalenniveau" },
      { group:"Lektion 2 · Lagemaße", name:"Quantil aus Urliste (Bamberg)",
        tex:"x_p=\\begin{cases}x_{(\\lceil n\\,p\\rceil)} & n\\,p \\text{ nicht ganzzahlig}\\\\[4pt] \\dfrac{x_{(n p)}+x_{(n p+1)}}{2} & n\\,p \\text{ ganzzahlig}\\end{cases}",
        note:"deutsche / Bamberg-Methode" },
      { group:"Lektion 2 · Lagemaße", name:"Arithmetisches Mittel (Urliste)",
        tex:"\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i", note:"nur Kardinalskala" },
      { group:"Lektion 2 · Lagemaße", name:"Mittel aus Häufigkeitstabelle (diskret)",
        tex:"\\bar{x}=\\frac{1}{n}\\sum_{j=1}^{k} a_j\\,n_j=\\sum_{j=1}^{k} a_j\\,f_j", note:"" },
      { group:"Lektion 2 · Lagemaße", name:"Mittel aus Häufigkeitstabelle (stetig)",
        tex:"\\bar{x}=\\sum_{j=1}^{k} m_j\\,f_j,\\quad m_j=\\frac{x^{*}_{j-1}+x^{*}_{j}}{2}", note:"Klassenmitte m_j" },
      { group:"Lektion 2 · Lagemaße", name:"Quantil aus stetiger Tabelle",
        tex:"x_p=x^{*}_{j-1}+\\frac{p-F_{j-1}}{f_j}\\cdot\\Delta_j", note:"lineare Interpolation in der Klasse" },
      { group:"Lektion 2 · Lagemaße", name:"Lineare Transformation (Mittel)",
        tex:"y_i=a+b\\,x_i\\ \\Rightarrow\\ \\bar{y}=a+b\\,\\bar{x}", note:"" },

      { group:"Lektion 2 · Streuungsmaße", name:"Spannweite",
        tex:"R=x_{(n)}-x_{(1)}", note:"größter minus kleinster Wert" },
      { group:"Lektion 2 · Streuungsmaße", name:"Interquartilsabstand",
        tex:"IQR=x_{0,75}-x_{0,25}", note:"Spannweite der mittleren 50 %" },
      { group:"Lektion 2 · Streuungsmaße", name:"Stichprobenvarianz (n−1)",
        tex:"s^2=\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2=\\frac{n}{n-1}\\left(\\overline{x^2}-\\bar{x}^2\\right)", note:"Verschiebungsformel" },
      { group:"Lektion 2 · Streuungsmaße", name:"Mittel der Quadrate",
        tex:"\\overline{x^2}=\\frac{1}{n}\\sum_{i=1}^{n}x_i^2", note:"Hilfsgröße für s²" },
      { group:"Lektion 2 · Streuungsmaße", name:"Mittel der Quadrate (diskrete Tabelle)",
        tex:"\\overline{x^2}=\\sum_{j=1}^{k} a_j^2\\,f_j", note:"Ausprägungen quadrieren, dann gewichten" },
      { group:"Lektion 2 · Streuungsmaße", name:"Mittel der Quadrate (stetige Tabelle)",
        tex:"\\overline{x^2}=\\sum_{j=1}^{k} m_j^2\\,f_j", note:"Klassenmitten quadrieren, dann gewichten" },
      { group:"Lektion 2 · Streuungsmaße", name:"Standardabweichung",
        tex:"s=\\sqrt{s^2}", note:"durchschnittliche Abweichung vom Mittel" },
      { group:"Lektion 2 · Streuungsmaße", name:"Transformation der Streuung",
        tex:"y_i=a+b\\,x_i\\ \\Rightarrow\\ s_y^2=b^2 s_x^2,\\quad s_y=|b|\\,s_x", note:"Verschiebung a ändert nichts" },
      { group:"Lektion 2 · Streuungsmaße", name:"Variationskoeffizient (Ergänzung)",
        tex:"V=\\frac{s}{\\bar{x}}", note:"dimensionsloser Vergleich; im Skript nicht behandelt" }
    ],

    sections: [

      /* ========================================================
         2.1  TABELLARISCHE UND GRAFISCHE DARSTELLUNG
         ======================================================== */
      {
        num:"2.1",
        title:"Tabellarische und grafische Darstellungsmöglichkeiten",
        intro:"Wie macht man aus 25 chaotischen Fragebögen etwas, das man in zwei Sekunden versteht? Tabelle und Diagramm.",
        blocks:[

          {t:"p", lead:true, html:"Stell dir vor, 25 Patient:innen wurden zu Pflegerobotern befragt. Du bekommst eine Tabelle mit 25 Zeilen und vier Spalten in die Hand gedrückt. Glückwunsch – das ist genauso nutzlos wie ein Kassenbon vom Großeinkauf: alles da, aber niemand blickt durch. Das Ziel von Abschnitt 2.1 ist, diese Rohdaten <b>komprimiert</b> und <b>übersichtlich</b> zusammenzufassen."},

          {t:"p", html:"Welche Tabelle und welches Diagramm erlaubt sind, entscheidet das <b>Skalenniveau</b> aus Lektion 1: nominal &lt; ordinal &lt; kardinal (diskret/stetig). Eine Faustregel vorweg: Bei <i>Wörtern</i> (Geschlecht, Zufriedenheit) ist mehr erlaubt als manche denken; bei <i>Zahlen</i> verzichtet man auf Kreisdiagramme, und bei <i>stetigen</i> Merkmalen kommt das Histogramm ins Spiel."},

          {t:"quote", html:"Eine der wichtigsten und oftmals zuerst genutzten Möglichkeiten […] bietet die sog. Häufigkeitstabelle.", source:"BSTA01-02, S.28"},

          {t:"h", text:"Die Häufigkeitstabelle", icon:"📋"},

          {t:"def", term:"Häufigkeitstabelle", html:"Fasst die gesammelten Daten eines Merkmals komprimiert zusammen: <b>welche</b> Ausprägungen vorkommen, <b>wie häufig</b> und <b>welchen Anteil</b> sie ausmachen (Bamberg et al., 2012, S.23)."},

          {t:"list", items:[
            "<b>Ausprägungsindex</b> \\(j=1,\\dots,k\\): nummeriert die \\(k\\) verschiedenen Ausprägungen durch.",
            "<b>Merkmalsausprägungen</b> \\(a_j\\): die Werte, die das Merkmal annimmt (z.B. „weiblich“, „gut“, 0,1,2 …).",
            "<b>Absolute Häufigkeit</b> \\(n_j\\): zählt das Vorkommen jeder Ausprägung ab.",
            "<b>Relative Häufigkeit</b> \\(f_j\\): der Anteil – immer zwischen 0 und 1, in Summe 1, mal 100 ergibt Prozent.",
            "<b>Kumulierte Häufigkeit</b> \\(F_m\\): summiert die relativen Häufigkeiten von oben nach unten auf (erst ab ordinal sinnvoll)."
          ]},

          {t:"formula", tex:"f_j=\\frac{n_j}{n}", caption:"Relative Häufigkeit – der Anteil der Ausprägung aⱼ an allen n Werten"},
          {t:"formula", tex:"f_1+f_2+\\dots+f_k=\\sum_{j=1}^{k} f_j = 1", caption:"Alle Anteile zusammen sind immer 1 (= 100 %)"},
          {t:"formula", tex:"F_m=f_1+f_2+\\dots+f_m=\\sum_{j=1}^{m} f_j", caption:"Kumulierte relative Häufigkeit bis zur m-ten Ausprägung"},

          {t:"example", title:"Geschlecht (nominal, n = 25) — Tabelle 3", html:
            "5 von 25 Befragten sind männlich, 20 sind weiblich.<br>"+
            "\\(f_1=\\tfrac{5}{25}=0{,}2\\) (20 %), \\(f_2=\\tfrac{20}{25}=0{,}8\\) (80 %). Summe: \\(0{,}2+0{,}8=1\\). ✔<br>"+
            "<table class='data' style='margin-top:8px'><thead><tr><th>j</th><th>aⱼ</th><th>nⱼ</th><th>fⱼ</th></tr></thead>"+
            "<tbody><tr><td>1</td><td>männlich</td><td>5</td><td>0,2</td></tr>"+
            "<tr><td>2</td><td>weiblich</td><td>20</td><td>0,8</td></tr>"+
            "<tr><td>Σ</td><td></td><td>25</td><td>1</td></tr></tbody></table>"},

          {t:"example", title:"Zufriedenheit (ordinal, n = 24) — Tabelle 5", html:
            "Achtung: Patient 12 hat keine Angabe gemacht → <b>n = 24</b>, nicht 25! Jetzt zahlt sich \\(F_j\\) aus, weil die Reihenfolge sehr gut → ausreichend eine Bedeutung hat.<br>"+
            "<table class='data' style='margin-top:8px'><thead><tr><th>j</th><th>aⱼ</th><th>nⱼ</th><th>fⱼ</th><th>Fⱼ</th></tr></thead>"+
            "<tbody><tr><td>1</td><td>sehr gut</td><td>1</td><td>1/24 ≈ 0,042</td><td>0,042</td></tr>"+
            "<tr><td>2</td><td>gut</td><td>12</td><td>12/24 = 0,5</td><td>13/24 ≈ 0,542</td></tr>"+
            "<tr><td>3</td><td>befriedigend</td><td>9</td><td>9/24 = 0,375</td><td>22/24 ≈ 0,917</td></tr>"+
            "<tr><td>4</td><td>ausreichend</td><td>2</td><td>2/24 ≈ 0,083</td><td>1</td></tr>"+
            "<tr><td>Σ</td><td></td><td>24</td><td>1</td><td></td></tr></tbody></table>"+
            "Lesart von \\(F_j\\): „54,2 % bewerten mindestens gut.“ Die letzte \\(F\\)-Zeile ist immer 1."},

          {t:"example", title:"Bisheriger Kontakt (kardinal-diskret, n = 25) — Tabelle 7", html:
            "Hier sind die Ausprägungen Zahlen (0,1,2,3,5). Kurios: die <b>4 kommt gar nicht vor</b>, deshalb springt die Tabelle von 3 direkt auf 5.<br>"+
            "<table class='data' style='margin-top:8px'><thead><tr><th>j</th><th>aⱼ</th><th>nⱼ</th><th>fⱼ</th><th>Fⱼ</th></tr></thead>"+
            "<tbody><tr><td>1</td><td>0</td><td>5</td><td>0,2</td><td>0,2</td></tr>"+
            "<tr><td>2</td><td>1</td><td>14</td><td>0,56</td><td>0,76</td></tr>"+
            "<tr><td>3</td><td>2</td><td>3</td><td>0,12</td><td>0,88</td></tr>"+
            "<tr><td>4</td><td>3</td><td>2</td><td>0,08</td><td>0,96</td></tr>"+
            "<tr><td>5</td><td>5</td><td>1</td><td>0,04</td><td>1</td></tr>"+
            "<tr><td>Σ</td><td></td><td>25</td><td>1</td><td></td></tr></tbody></table>"+
            "Aussage des Skripts: „76 % (20 % + 56 %) hatten höchstens einmal Kontakt.“"},

          {t:"h", text:"Diagramme — und wann man welches nimmt", icon:"🥧"},

          {t:"p", html:"Diagramme zeigen in der Regel <b>relative</b> Häufigkeiten (keine absoluten), denn ein Anteil ist vergleichbar, eine nackte Anzahl nicht. Welches Diagramm erlaubt ist, hängt am Skalenniveau."},

          {t:"def", term:"Kreisdiagramm", html:"Zeigt die Häufigkeitsverteilung über Flächen: Jeder Anteil bekommt ein Tortenstück proportional zu \\(f_j\\)."},
          {t:"formula", tex:"\\alpha_j=f_j\\cdot 360^\\circ\\quad\\text{für } j=1,\\dots,k", caption:"Mittelpunktswinkel des j-ten Tortenstücks"},
          {t:"p", html:"Geschlecht: \\(\\alpha_{\\text{m}}=0{,}2\\cdot360^\\circ=72^\\circ\\), \\(\\alpha_{\\text{w}}=0{,}8\\cdot360^\\circ=288^\\circ\\). Zufriedenheit: \\(15^\\circ,\\ 180^\\circ,\\ 135^\\circ,\\ 30^\\circ\\)."},

          {t:"def", term:"Balkendiagramm (Säulen-/Stabdiagramm)", html:"Zeigt die Häufigkeitsverteilung über Balken, Säulen oder Stäbe. Die <b>Höhe</b> entspricht der relativen Häufigkeit."},
          {t:"def", term:"Paretodiagramm", html:"Spezialform des Balkendiagramms, die die Ausprägungen nach Größe ihres Vorkommens sortiert (auf- oder absteigend). Nur bei <b>nominalen</b> Merkmalen sinnvoll – bei ordinalen ist die Reihenfolge ja schon fix."},

          {t:"quote", html:"Auf ein Kreisdiagramm wird in der Regel verzichtet, wenn es sich bei den Ausprägungen um Zahlen handelt.", source:"BSTA01-02, S.40"},

          {t:"table", caption:"Welches Diagramm zu welchem Skalenniveau?",
            headers:["Skalenniveau","Häufigkeitstabelle","Kreis","Balken","Pareto","Histogramm"],
            rows:[
              ["nominal","✔","✔","✔","✔","—"],
              ["ordinal","✔ (mit Fⱼ)","✔","✔","— (Reihenfolge fix)","—"],
              ["kardinal-diskret","✔","— (Zahlen!)","✔","—","—"],
              ["kardinal-stetig","✔ (klassiert)","—","—","—","✔"]
            ]},

          {t:"aha", title:"Kreisdiagramm = Pizza", html:"360° ist die ganze Pizza, jede Ausprägung bekommt ein Stück proportional zum Anteil. 80 % weiblich = ein riesiges 288°-Stück, und 5 Männer kriegen die übrige 72°-Spitze. Bei reinen Zahlen (Kontakt 0,1,2,…) wirkt eine Pizza aber absurd – deshalb der Verzicht."},

          {t:"h", text:"Der Spezialfall: Histogramm für stetige Merkmale", icon:"📊"},

          {t:"p", html:"Beim Alter (kardinal-stetig) bringt eine Tabelle mit 19 Einzelwerten nichts. Man bildet <b>Klassen</b> – und zwar im Skript bewusst <i>unterschiedlich breite</i>: \\([15;30],\\,(30;45],\\,(45;50],\\,(50;70]\\). Konvention: Die Obergrenze gehört dazu (eckige Klammer), die Untergrenze nicht (runde Klammer). Eine 20-Jährige fällt also in \\([15;30]\\), eine 30,01-Jährige in \\((30;45]\\)."},

          {t:"def", term:"Histogramm (empirische Dichtefunktion)", html:"Wird <b>nur für stetige Merkmale</b> gezeichnet. Auf der y-Achse steht die <b>Dichte</b> \\(\\hat f(x)\\) – nicht die relative Häufigkeit! – und auf der x-Achse die Klassengrenzen."},

          {t:"formula", tex:"\\Delta_j=x^{*}_{j}-x^{*}_{j-1}", caption:"Klassenbreite (z.B. (45;50] → Δ = 5)"},
          {t:"formula", tex:"\\hat f(x)=\\frac{f_j}{\\Delta_j}\\quad\\text{für alle Klassen } j=1,\\dots,k", caption:"Dichte = relative Häufigkeit geteilt durch Klassenbreite"},

          {t:"example", title:"Alter (stetig, n = 19) — Tabelle 9/10", html:
            "<table class='data' style='margin-top:4px'><thead><tr><th>j</th><th>Klasse</th><th>nⱼ</th><th>fⱼ</th><th>Fⱼ</th><th>Δⱼ</th><th>Dichte fⱼ/Δⱼ</th></tr></thead>"+
            "<tbody><tr><td>1</td><td>[15;30]</td><td>5</td><td>5/19 ≈ 0,263</td><td>0,263</td><td>15</td><td>≈ 0,018</td></tr>"+
            "<tr><td>2</td><td>(30;45]</td><td>4</td><td>4/19 ≈ 0,211</td><td>0,474</td><td>15</td><td>≈ 0,014</td></tr>"+
            "<tr><td>3</td><td>(45;50]</td><td>6</td><td>6/19 ≈ 0,316</td><td>0,789</td><td>5</td><td>≈ 0,063</td></tr>"+
            "<tr><td>4</td><td>(50;70]</td><td>4</td><td>4/19 ≈ 0,211</td><td>1</td><td>20</td><td>≈ 0,011</td></tr>"+
            "<tr><td>Σ</td><td></td><td>19</td><td>1</td><td></td><td></td><td></td></tr></tbody></table>"+
            "Klasse 2 „älter als 30, höchstens 45“ enthält 35, 44, 35, 39 → \\(n_2=4\\)."},

          {t:"aha", title:"Höhe lügt, Fläche sagt die Wahrheit", html:"Beim Balkendiagramm zählt die <b>Höhe</b>, beim Histogramm die <b>Fläche</b>. Die schmale Klasse \\((45;50]\\) ist nur 5 Jahre breit, hat aber die meisten Personen (6). Würde man nur die Höhe (rel. Häufigkeit) zeichnen, sähe sie unwichtig aus. Über die <b>Dichte</b> (0,063 – mit Abstand die höchste) wird sie korrekt zur Spitze. Wie auf einer Landkarte: ein winziges, dicht besiedeltes Bundesland kann mehr Einwohner haben als ein riesiges, leeres."},

          {t:"quote", html:"Die Fläche eines jeden Rechtecks zeichnet sich dadurch aus, dass sie die relative Häufigkeit der entsprechenden Klasse widerspiegelt. Damit muss die gesamte Fläche unter dem Histogramm 1 sein.", source:"BSTA01-02, S.41"},

          {t:"p", html:"Kontrolle: Klasse 3 hat Breite 5 · Dichte 0,063 ≈ 0,316 ≈ 6/19. Summiert man alle Rechteckflächen, kommt 1 heraus. <b>Das</b> ist der Sinn der Dichte."},

          {t:"why", title:"Warum brauche ich das?", html:"Rohdaten (25 Zeilen) sind unlesbar. Eine Häufigkeitstabelle plus Diagramm zeigt in zwei Sekunden, was 25 Befragte in Summe gesagt haben – die Basis jeder Auswertung, vom Krankenhaus-Report über die Marktanalyse bis zur Wahlprognose. Ohne diesen ersten Schritt rechnet man nie weiter."},

          {t:"divider"},

          /* ---------- WIDGET 1: Datensatz-Explorer ---------- */
          {t:"widget", title:"Datensatz-Explorer — die 25 Patient:innen", icon:"🔎",
            hint:"Klick auf einen Spaltenkopf zum Sortieren. Filtere per Chip oder Alters-Slider. Fehlende Werte sind „—“.",
            render:renderExplorer},

          /* ---------- WIDGET 2: Häufigkeitstabelle-Generator ---------- */
          {t:"widget", title:"Häufigkeitstabelle-Generator", icon:"🧮",
            hint:"Wähle ein Preset oder tippe eigene Werte (Zahlen ODER Wörter, durch Komma/Leerzeichen getrennt). Tabelle + Diagramm rechnen live.",
            render:renderFreqTable},

          /* ---------- WIDGET 3: Histogramm-Builder ---------- */
          {t:"widget", title:"Histogramm-Builder — Höhe vs. Dichte", icon:"📐",
            hint:"Schiebe die Klassenanzahl oder schalte auf die Skript-Einteilung. Der Toggle „Höhe = Dichte“ zeigt den ganzen Trick.",
            render:renderHistogram}
        ]
      },

      /* ========================================================
         2.2  LAGEMASSE
         ======================================================== */
      {
        num:"2.2",
        title:"Lagemaße",
        intro:"Wo liegt das Zentrum der Daten? Drei Antworten: Modus, Median/Quantile und Mittelwert – aber nicht jede ist überall erlaubt.",
        blocks:[

          {t:"p", lead:true, html:"Eine Häufigkeitstabelle ist schön, aber Chef:innen wollen <b>eine Zahl</b>. „Wie alt sind die Befragten im Schnitt?“ Lagemaße (auch Lageparameter) beschreiben das <b>Zentrum</b> eines Datensatzes. Es gibt drei wichtige, und der Witz ist: je nach Skalenniveau darf man sie nicht alle benutzen."},

          {t:"table", caption:"Tabelle 11 — Welches Lagemaß bei welchem Skalenniveau?",
            headers:["Skalenniveau","Modus","Quantile / Median","Mittelwert"],
            rows:[
              ["nominal","✔","—","—"],
              ["ordinal","✔","(✔) eingeschränkt","—"],
              ["kardinal (diskret/stetig)","✔","✔","✔"]
            ]},

          {t:"h", text:"Modus — der Publikumsliebling", icon:"👑"},
          {t:"def", term:"Modus \\(x_{\\text{mod}}\\)", html:"Diejenige Merkmalsausprägung, die am häufigsten in der Stichprobe vorkommt (Bamberg et al., 2022, S.16). Ein Modus = <b>unimodal</b>, zwei = bimodal, mehr = multimodal. Funktioniert auf <b>jedem</b> Skalenniveau, sogar bei reinen Wörtern."},
          {t:"formula", tex:"x_{\\text{mod}} = \\arg\\max_{a_j}\\, n_j", caption:"die Ausprägung mit der größten absoluten Häufigkeit"},
          {t:"list", items:[
            "Geschlecht: \\(x_{\\text{mod}}=\\) weiblich (20×).",
            "Zufriedenheit: \\(x_{\\text{mod}}=\\) gut (12×).",
            "Kontakt: \\(x_{\\text{mod}}=1\\) (14×, 56 %).",
            "Alter (stetig): Modus = Klasse mit größter <b>Dichte</b> = \\((45;50]\\); als Klassenmitte \\(\\tfrac{45+50}{2}=47{,}5\\)."
          ]},

          {t:"h", text:"Quantile & Median — die Sortier-Methode", icon:"📏"},

          {t:"def", term:"Quantil \\(x_p\\)", html:"Eine Merkmalsausprägung, die von einem Anteil \\(p\\) der Merkmalsträger nicht überschritten wird (Fahrmeir et al., 2016, S.60). \\(x_{0,25}\\) = unteres Quartil, \\(x_{0,75}\\) = oberes Quartil."},
          {t:"def", term:"Median \\(x_{0,5}\\)", html:"Das wichtigste Quantil und das Zentrum des <b>geordneten</b> Datensatzes: 50 % der Werte liegen darunter, 50 % darüber. Median und Quartile zerlegen die sortierten Daten in vier gleich große Bereiche."},

          {t:"sub", text:"Die Bamberg-Methode (so rechnet das Skript)"},
          {t:"p", html:"Sortiere aufsteigend zu \\(x_{(1)},\\dots,x_{(n)}\\). Berechne die <b>Position</b> \\(n\\cdot p\\). Dann gibt es zwei Fälle:"},
          {t:"formula", tex:"x_p=\\begin{cases}x_{(\\lceil n\\,p\\rceil)} & \\text{falls } n\\,p \\text{ nicht ganzzahlig (aufrunden!)}\\\\[6pt] \\dfrac{x_{(n p)}+x_{(n p+1)}}{2} & \\text{falls } n\\,p \\text{ ganzzahlig (Mittel zweier Stellen)}\\end{cases}", caption:"Quantil aus der Urliste"},

          {t:"aha", title:"Den halben Menschen gibt es nicht", html:"Bei 25 Werten und 50 % ist die Position \\(25\\cdot0{,}5=12{,}5\\). Es gibt aber keinen halben Befragten – also rundet man auf und nimmt den 13. Werts. Nur wenn die Position glatt aufgeht (z.B. \\(24\\cdot0{,}5=12\\)), nimmt man fairerweise das Mittel aus dem 12. und 13. Wert."},

          {t:"example", title:"Alter (kardinal, n = 19) — sauberster Fall", html:
            "Sortiert: 15; 16; 17; 20; 26; 35; 35; 39; 44; <b>47</b>; 47; 48; 48; 49; <b>50</b>; 52; 55; 56; 68<br>"+
            "• Median: \\(19\\cdot0{,}5=9{,}5\\) → aufrunden → <b>10. Stelle</b> → \\(x_{0,5}=47\\).<br>"+
            "• unteres Quartil: \\(19\\cdot0{,}25=4{,}75\\) → 5. Stelle → \\(x_{0,25}=26\\).<br>"+
            "• oberes Quartil: \\(19\\cdot0{,}75=14{,}25\\) → 15. Stelle → \\(x_{0,75}=50\\).<br>"+
            "Lesart: 25 % sind höchstens 26 Jahre, 50 % mindestens 47, 75 % überschreiten 50 nicht."},

          {t:"example", title:"Kontakt (diskret, n = 25) — alles ballt sich auf der 1", html:
            "Sortiert: 0;0;0;0;0; 1;1;1;1;1;1;1;1;1;1;1;1;1;1; 2;2;2; 3;3; 5<br>"+
            "• \\(25\\cdot0{,}5=12{,}5\\) → 13. Stelle → \\(x_{0,5}=1\\).<br>"+
            "• \\(25\\cdot0{,}25=6{,}25\\) → 7. Stelle → \\(x_{0,25}=1\\).<br>"+
            "• \\(25\\cdot0{,}75=18{,}75\\) → 19. Stelle → \\(x_{0,75}=1\\).<br>"+
            "Alle drei sind 1, „weil diese Ausprägung besonders häufig vorkommt“."},

          {t:"example", title:"Zufriedenheit (ordinal, n = 24) — der knifflige Fall", html:
            "Sortiert best→schlecht: sg; g×12; b×9; a×2.<br>"+
            "• \\(24\\cdot0{,}5=12\\) (ganzzahlig!) → Mittel aus 12. (gut) und 13. (gut) → \\(x_{0,5}=\\) gut.<br>"+
            "• \\(24\\cdot0{,}25=6\\) → Mittel aus 6. und 7. → gut. • \\(24\\cdot0{,}75=18\\) → Mittel aus 18. und 19. → befriedigend.<br>"+
            "Es klappt nur, weil beide Stellen <i>dieselbe</i> Ausprägung sind."},

          {t:"warn", title:"Aus zwei Wörtern lässt sich kein Durchschnitt bilden", tag:"Ordinal-Falle", html:"Bei ordinalen Daten ist die Bamberg-Formel heikel: Wenn die 18. Stelle „gut“ und die 19. „befriedigend“ wäre, gäbe es kein „(gut + befriedigend)/2“. Quantile bei ordinalen Merkmalen funktionieren nur, wenn die beiden Stellen identisch sind – sonst sind sie fragwürdig. Der Mittelwert ist hier komplett verboten."},

          {t:"sub", text:"Quantile aus einer Häufigkeitstabelle"},
          {t:"p", html:"Hat man nur die Tabelle, sucht man in der Spalte \\(F_j\\) die erste Zeile mit \\(F_j>p\\); deren Ausprägung ist das Quantil. Beispiel Zufriedenheit: \\(x_{0,5}=\\) gut, weil \\(\\tfrac{13}{24}=0{,}542>0{,}5\\)."},
          {t:"formula", tex:"x_p=x^{*}_{j-1}+\\frac{p-F_{j-1}}{f_j}\\cdot\\Delta_j", caption:"Quantil per linearer Interpolation in einer stetigen Häufigkeitstabelle"},
          {t:"example", title:"Alter aus der stetigen Tabelle (S.50)", html:
            "Median liegt in Klasse 3 \\((45;50]\\), denn dort wird \\(F_j>0{,}5\\):<br>"+
            "\\(x_{0,5}=45+\\dfrac{0{,}5-\\frac{9}{19}}{\\frac{6}{19}}\\cdot5\\approx45{,}41\\).<br>"+
            "\\(x_{0,25}=15+\\dfrac{0{,}25-0}{\\frac{5}{19}}\\cdot15\\approx29{,}25\\), \\(\\quad x_{0,75}=45+\\dfrac{0{,}75-\\frac{9}{19}}{\\frac{6}{19}}\\cdot5\\approx49{,}375\\)."},
          {t:"warn", tag:"Wichtig", html:"Diese Tabellen-Ergebnisse (45,41 statt 47) weichen von der Urliste ab, weil durch die Klassenbildung die Einzelwerte verloren gehen. <b>Urliste immer bevorzugen</b>, wenn vorhanden."},

          {t:"h", text:"Arithmetisches Mittel — „x quer“", icon:"➗"},
          {t:"def", term:"Mittelwert \\(\\bar x\\)", html:"Gibt an, welche Ausprägung im Durchschnitt angenommen wird (Fahrmeir et al., 2016, S.50). <b>Nur für Kardinalskala</b> – aus Wörtern kann man nichts summieren."},
          {t:"formula", tex:"\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i", caption:"Mittelwert aus der Urliste"},
          {t:"formula", tex:"\\bar{x}=\\frac{1}{n}\\sum_{j=1}^{k} a_j\\,n_j=\\sum_{j=1}^{k} a_j\\,f_j", caption:"… aus diskreter Häufigkeitstabelle"},
          {t:"formula", tex:"\\bar{x}=\\sum_{j=1}^{k} m_j\\,f_j,\\quad m_j=\\frac{x^{*}_{j-1}+x^{*}_{j}}{2}", caption:"… aus stetiger Häufigkeitstabelle (m_j = Klassenmitte)"},

          {t:"example", title:"Kontakt (n = 25)", html:
            "Urliste: \\(\\bar x=\\tfrac{1}{25}(1+5+0+\\dots+2+1)=1{,}24\\).<br>"+
            "Häufigkeitstabelle: \\(\\bar x=0\\cdot0{,}2+1\\cdot0{,}56+2\\cdot0{,}12+3\\cdot0{,}08+5\\cdot0{,}04=1{,}24\\). Identisch ✔"},
          {t:"example", title:"Alter (n = 19)", html:
            "Urliste: \\(\\bar x=\\tfrac{1}{19}(16+50+\\dots+26+39)=40{,}368\\).<br>"+
            "Aus Klassenmitten (22,5; 37,5; 47,5; 60): \\(\\bar x=\\tfrac{1}{19}(22{,}5\\cdot5+37{,}5\\cdot4+47{,}5\\cdot6+60\\cdot4)=41{,}447\\) – weicht ab, weil die Klassenmitte die echten Werte nur schätzt."},

          {t:"sub", text:"Lineare Transformation"},
          {t:"formula", tex:"y_i=a+b\\cdot x_i\\ \\Rightarrow\\ \\bar{y}=a+b\\cdot\\bar{x}", caption:"Transformiert man alle Werte, transformiert sich das Mittel mit"},
          {t:"p", html:"+2 Jahre für alle → \\(\\bar x: 40{,}368\\to42{,}368\\) (genau +2). Verdopplung aller Werte → der Mittelwert verdoppelt sich."},

          {t:"h", text:"Mittelwert vs. Median — der Ausreißer-Showdown", icon:"⚔️"},
          {t:"p", html:"20 Personen: 19 sind 30–35 Jahre, eine ist 63. Der Median bleibt seelenruhig zwischen 30 und 35 – er „berührt die 63-jährige Person nicht“. Der Mittelwert wird nach oben gezogen, vielleicht über 35 hinaus."},
          {t:"formula", tex:"\\bar{x}\\approx x_{0,5}\\ \\text{symm.},\\qquad \\bar{x}>x_{0,5}\\ \\text{rechtsschief},\\qquad \\bar{x}<x_{0,5}\\ \\text{linksschief}", caption:"Lage von Mittel und Median verrät die Verteilungsform"},
          {t:"p", html:"Beim Alter: \\(\\bar x=40{,}368 < x_{0,5}=47\\) → <b>linksschief</b> (ein paar junge Befragte ziehen den Mittelwert nach unten)."},

          {t:"aha", title:"Median = der mittlere Schüler in der Reihe", html:"Stellen sich alle der Größe nach auf, ist der Median schlicht der in der Mitte – egal, wie groß der Größte ist. Der Mittelwert dagegen: man legt alle Körpergrößen zusammen und teilt – ein 2,20-m-Basketballer zieht den Schnitt spürbar hoch. Genau deshalb redet die Politik über „Median-Einkommen“ und nicht über den Durchschnitt: ein einzelner Milliardär würde den Durchschnitt verzerren, den Median nicht."},

          {t:"why", title:"Warum brauche ich das?", html:"Ein einziger Vergleich Mittelwert ↔ Median verrät, ob die Daten schief sind oder ein Ausreißer das Bild verzerrt. „Durchschnittsgehalt“ vs. „Median-Gehalt“: Ein Vorstand mit 5 Mio € hebt den Schnitt der Belegschaft, am Median ändert er nichts. Wer den Unterschied nicht kennt, wird in jeder Gehaltsdebatte über den Tisch gezogen."},

          {t:"quote", html:"Der Median […] konzentriert sich auf die Mitte des Datensatzes […]. Er gilt damit grundsätzlich als robust. Der Mittelwert gilt demnach als sehr ausreißerempfindlich.", source:"BSTA01-02, S.55"},

          {t:"divider"},

          /* ---------- WIDGET 4: Lagemaße-Rechner ---------- */
          {t:"widget", title:"Lagemaße-Rechner — live mit Schritt-für-Schritt", icon:"🎯",
            hint:"Zahlen eingeben → Modus, alle Quartile, Median und Mittelwert. Die Schritt-Box spielt die Bamberg-Methode für das gewählte Quantil durch.",
            render:renderLocation}
        ]
      },

      /* ========================================================
         2.3  STREUUNGSMASSE
         ======================================================== */
      {
        num:"2.3",
        title:"Streuungsmaße",
        intro:"Ein Mittelwert allein lügt. Erst die Streuung verrät, ob „Durchschnitt“ auch „typisch“ bedeutet.",
        blocks:[

          {t:"p", lead:true, html:"Zwei Schulklassen, beide mit Notendurchschnitt 3,0. In der einen hat <i>jede:r</i> eine 3. In der anderen hat die Hälfte eine 1 und die Hälfte eine 5. Gleicher Mittelwert, völlig andere Realität. <b>Streuungsmaße</b> messen, wie ähnlich oder unterschiedlich die Merkmalsträger sind: kleine Streuung = homogen, große = heterogen."},

          {t:"warn", tag:"Voraussetzung", html:"Streuungsmaße gibt es <b>nur für kardinalskalierte</b> Merkmale (aus Urliste oder Häufigkeitstabelle). Bei „gut/befriedigend“ kann man keinen Abstand messen."},

          {t:"p", html:"Vier Maße, geordnet von grob nach präzise: Spannweite, Interquartilsabstand, Stichprobenvarianz und Standardabweichung. Die beiden letzten sind die wichtigsten."},

          {t:"h", text:"Spannweite — das grobe Maß", icon:"↔️"},
          {t:"def", term:"Spannweite \\(R\\)", html:"Zeigt den Abstand von der kleinsten zur größten Ausprägung (Bamberg et al., 2022, S.20). Nachteil: extrem ausreißerempfindlich – ein einziger Extremwert macht \\(R\\) riesig."},
          {t:"formula", tex:"R=x_{(n)}-x_{(1)}", caption:"größter minus kleinster Wert"},
          {t:"list", items:[
            "Kontakt: \\(R=5-0=5\\).",
            "Alter: \\(R=68-15=53\\)."
          ]},

          {t:"warn", tag:"Stolperfalle", title:"Spannweite aus der klassierten Tabelle? Lieber nicht!", html:"Beim <b>diskreten</b> Merkmal (Kontakt) darf man \\(R\\) auch aus der Häufigkeitstabelle ablesen: Ausprägung der letzten Zeile minus Ausprägung der ersten Zeile. Beim <b>klassierten</b> Merkmal (Alter) rät das Skript davon ab: Die kleinste Klassenuntergrenze und die größte Klassenobergrenze müssen <b>nicht</b> den echten Extremwerten entsprechen. Aus den Klassen \\([15;30]\\) bis \\((50;70]\\) käme \\(R=70-15=55\\) – in Wahrheit ist aber niemand älter als 68, also \\(R=68-15=53\\)."},

          {t:"h", text:"Interquartilsabstand — der robuste Bruder", icon:"📦"},
          {t:"def", term:"Interquartilsabstand \\(IQR\\)", html:"Zeigt den Abstand der zentralen 50 % der Merkmalsträger (Fahrmeir et al., 2016, S.61). Robuster als die Spannweite, weil Extremwerte außerhalb der Quartile ignoriert werden."},
          {t:"formula", tex:"IQR=x_{0,75}-x_{0,25}", caption:"oberes minus unteres Quartil"},
          {t:"list", items:[
            "Kontakt: \\(IQR=1-1=0\\) – die mittleren 50 % sind alle gleich, also keine Streuung.",
            "Alter (Urliste): \\(IQR=50-26=24\\).",
            "Alter (Häufigkeitstabelle): \\(IQR=49{,}375-29{,}25\\approx20{,}125\\) – Urliste bevorzugen."
          ]},

          {t:"aha", title:"Spannweite vs. IQR = Wetter vs. Klima", html:"Die Spannweite ist wie „kältester bis heißester Tag des Jahres“ – ein einziger Hitzerekord macht sie riesig. Der Interquartilsabstand ist wie „die typische Temperatur in den mittleren sechs Monaten“ – Rekorde an den Rändern stören ihn nicht. Deshalb steckt der IQR im Boxplot: die Box ist die robuste, ehrliche Mitte."},

          {t:"h", text:"Varianz & Standardabweichung — das Herzstück", icon:"🎚️"},
          {t:"def", term:"Stichprobenvarianz \\(s^2\\)", html:"Misst, wie weit jede Beobachtung im Schnitt (quadratisch) vom Mittelwert entfernt ist – und bezieht <b>jede</b> Beobachtung ein. Sie ist die Vorstufe zur Standardabweichung."},
          {t:"def", term:"Standardabweichung \\(s\\)", html:"Gibt die durchschnittliche Abweichung vom Mittelwert an. Interpretation: „Der Durchschnitt des Merkmals liegt bei \\(\\bar x \\pm s\\).“"},

          {t:"warn", tag:"Merksatz", html:"Das Skript verwendet durchgängig den Nenner \\(n-1\\) (<b>Stichprobenvarianz</b>), nicht \\(n\\). In den Widgets steckt das in <code>Stats.variance</code> / <code>Stats.sd</code>."},

          {t:"formula", tex:"s^2=\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2=\\frac{n}{n-1}\\left(\\overline{x^2}-\\bar{x}^2\\right)", caption:"Stichprobenvarianz – links Definition, rechts die bequeme Verschiebungsformel"},
          {t:"formula", tex:"\\overline{x^2}=\\frac{1}{n}\\sum_{i=1}^{n}x_i^2", caption:"Mittel der Quadrate (Hilfsgröße)"},
          {t:"formula", tex:"s=\\sqrt{s^2}", caption:"Standardabweichung = Wurzel aus der Varianz"},

          {t:"quote", html:"Die Stichprobenvarianz lässt sich aufgrund des Quadrierens nicht interpretieren. Aus diesem Grund wird die Wurzel […] gezogen.", source:"BSTA01-02, S.59"},

          {t:"example", title:"Kontakt (n = 25) — Schritt für Schritt (S.59)", html:
            "1) \\(\\bar x=\\tfrac{1}{25}(1+5+\\dots+2+1)=1{,}24\\)<br>"+
            "2) \\(\\overline{x^2}=\\tfrac{1}{25}(1^2+5^2+\\dots+2^2+1^2)=2{,}76\\)<br>"+
            "3) \\(s^2=\\tfrac{25}{24}\\,(2{,}76-1{,}24^2)=1{,}273\\)<br>"+
            "4) \\(s=\\sqrt{1{,}273}=1{,}128\\)<br>"+
            "Lesart: „Der durchschnittliche bisherige Kontakt liegt bei \\(1{,}24\\pm1{,}128\\) Mal.“"},

          {t:"example", title:"Alter (n = 19) — Schritt für Schritt (S.60)", html:
            "1) \\(\\bar x=\\tfrac{1}{19}(16+50+\\dots+26+39)=40{,}368\\)<br>"+
            "2) \\(\\overline{x^2}=\\tfrac{1}{19}(16^2+50^2+\\dots+26^2+39^2)=1851\\)<br>"+
            "3) \\(s^2=\\tfrac{19}{18}\\,(1851-40{,}368^2)=233{,}690\\)<br>"+
            "4) \\(s=\\sqrt{233{,}690}=15{,}287\\)<br>"+
            "Lesart: „Das durchschnittliche Alter liegt bei \\(40{,}368\\pm15{,}287\\) Jahren.“"},

          {t:"sub", text:"Varianz & Standardabweichung aus der Häufigkeitstabelle"},
          {t:"p", html:"Liegt nur die Häufigkeitstabelle vor, ändert sich lediglich, <b>wie</b> die beiden Mittelwerte \\(\\bar x\\) und \\(\\overline{x^2}\\) berechnet werden – Verschiebungsformel und Wurzelziehen (Schritte 3 und 4) bleiben exakt gleich. Wichtig: Für \\(\\overline{x^2}\\) werden die <b>Ausprägungen bzw. Klassenmitten quadriert</b> – niemals die Häufigkeiten!"},
          {t:"formula", tex:"\\overline{x^2}=\\sum_{j=1}^{k} a_j^2\\,f_j", caption:"Mittel der Quadrate aus der diskreten Häufigkeitstabelle (Ausprägungen quadrieren)"},
          {t:"formula", tex:"\\overline{x^2}=\\sum_{j=1}^{k} m_j^2\\,f_j", caption:"… aus der stetigen Häufigkeitstabelle (Klassenmitten quadrieren)"},

          {t:"example", title:"Kontakt aus der Häufigkeitstabelle (diskret, S.59–60)", html:
            "\\(\\bar x=0\\cdot0{,}2+1\\cdot0{,}56+\\dots+5\\cdot0{,}04=1{,}24\\)<br>"+
            "\\(\\overline{x^2}=0^2\\cdot0{,}2+1^2\\cdot0{,}56+\\dots+5^2\\cdot0{,}04=2{,}76\\)<br>"+
            "Beide Werte sind <b>identisch</b> mit der Urliste – beim diskreten Merkmal geht durch die Tabelle nichts verloren. Ab hier wie gehabt: \\(s^2=\\tfrac{25}{24}(2{,}76-1{,}24^2)=1{,}273\\), \\(s=1{,}128\\)."},

          {t:"example", title:"Alter aus der Häufigkeitstabelle (stetig, S.60–61)", html:
            "Mit den Klassenmitten 22,5; 37,5; 47,5; 60 – für \\(\\overline{x^2}\\) jeweils quadriert:<br>"+
            "1) \\(\\bar x=22{,}5\\cdot\\tfrac{5}{19}+\\dots+60\\cdot\\tfrac{4}{19}=41{,}447\\)<br>"+
            "2) \\(\\overline{x^2}=22{,}5^2\\cdot\\tfrac{5}{19}+\\dots+60^2\\cdot\\tfrac{4}{19}=1899{,}671\\)<br>"+
            "3) \\(s^2=\\tfrac{19}{18}\\,(1899{,}671-41{,}447^2)=191{,}918\\)<br>"+
            "4) \\(s=\\sqrt{191{,}918}=13{,}85\\)<br>"+
            "Das weicht deutlich von der Urliste ab (\\(s^2=233{,}690\\), \\(s=15{,}287\\)), weil die Klassenmitten die echten Werte nur schätzen → <b>Urliste bevorzugen</b>, wenn vorhanden."},

          {t:"sub", text:"Transformation der Streuung"},
          {t:"formula", tex:"y_i=a+x_i\\ \\Rightarrow\\ s_y^2=s_x^2,\\ s_y=s_x", caption:"Verschiebung um a: Abstände bleiben gleich → Streuung unverändert"},
          {t:"formula", tex:"y_i=b\\cdot x_i\\ \\Rightarrow\\ s_y^2=b^2 s_x^2,\\ s_y=|b|\\,s_x", caption:"Streckung um b: Varianz mal b², Standardabweichung mal |b|"},
          {t:"list", items:[
            "+2 Jahre für alle: \\(s^2\\) und \\(s\\) bleiben <b>unverändert</b> (233,690 bzw. 15,287).",
            "Verdopplung (\\(b=2\\)): \\(s^2\\to4\\cdot s^2\\), \\(s\\to2\\,s\\). (Beispiel: Abstand 16↔50 = 34 Jahre wird zu 32↔100 = 68 Jahre.)"
          ]},

          {t:"quote", html:"Eine Erhöhung oder Verringerung aller Werte um einen bestimmten Betrag führt zu keiner Veränderung in der Stichprobenvarianz oder Standardabweichung.", source:"BSTA01-02, S.61–62"},

          {t:"aha", title:"Warum n − 1? (Bessel-Korrektur)", html:"Mit der Stichprobe schätzt man die Streuung der ganzen Grundgesamtheit. Weil die Stichprobe die wahre Streuung systematisch <i>unterschätzt</i>, teilt man durch \\(n-1\\) statt \\(n\\) und korrigiert leicht nach oben. Bei großem \\(n\\) ist der Unterschied winzig, bei \\(n=5\\) deutlich. Und warum überhaupt die Wurzel? Weil eine Varianz von 1,273 in der Einheit „Kontakte²“ steht – das versteht niemand. Erst \\(s=1{,}128\\) „Kontakte“ ist greifbar."},

          {t:"sub", text:"Bonus: Variationskoeffizient (über das Skript hinaus)"},
          {t:"def", term:"Variationskoeffizient \\(V\\)", html:"Die Standardabweichung <b>relativ</b> zum Mittelwert – damit <b>dimensionslos</b> und über Datensätze mit unterschiedlichen Einheiten oder Größenordnungen hinweg vergleichbar. <i>Im IU-Skript (S.57–62) nicht behandelt; hier nur als Ergänzung – nur für positive, verhältnisskalierte Daten sinnvoll.</i>"},
          {t:"formula", tex:"V=\\frac{s}{\\bar{x}}", caption:"Variationskoeffizient = Standardabweichung geteilt durch Mittelwert (oft als % angegeben)"},
          {t:"p", html:"Beispiel Kontakt: \\(V=\\tfrac{1{,}128}{1{,}24}\\approx0{,}91\\) (91 %) – die Streuung ist fast so groß wie der Mittelwert selbst, die Daten sind also sehr heterogen. Beim Alter: \\(V=\\tfrac{15{,}287}{40{,}368}\\approx0{,}38\\) (38 %) – relativ homogener."},

          {t:"why", title:"Warum brauche ich das?", html:"Zwei Klassen mit identischem Notendurchschnitt 3,0 können komplett verschieden sein. Erst die Standardabweichung zeigt, ob „Durchschnitt“ auch „typisch“ bedeutet. Im Job: Lieferzeiten von „im Schnitt 3 Tage ± 0,5“ sind planbar; „im Schnitt 3 Tage ± 4“ sind ein Albtraum – gleicher Mittelwert, völlig andere Verlässlichkeit."},

          {t:"divider"},

          /* ---------- WIDGET 5: Streuungsmaße-Visualizer ---------- */
          {t:"widget", title:"Streuungsmaße-Visualizer — Abweichungen sichtbar", icon:"📈",
            hint:"Punkte, Mittelwert-Linie und Abweichungspfeile. Schalte die Quadrate ein, um zu sehen, was die Varianz wirklich aufsummiert.",
            render:renderSpread},

          /* ---------- WIDGET 6: Boxplot-Generator ---------- */
          {t:"widget", title:"Boxplot-Generator — mit Hover", icon:"📦",
            hint:"Box = Interquartilsabstand, Linie = Median, Whisker = Min/Max. Fahre mit der Maus über die Elemente.",
            render:renderBoxplot}
        ]
      }
    ],

    quiz:[
      { q:"Wofür wird ein <b>Histogramm</b> (statt eines Balkendiagramms) verwendet?",
        options:["nominale Merkmale","ordinale Merkmale","kardinal-diskrete Merkmale","kardinal-stetige (klassierte) Merkmale"],
        correct:3,
        explain:"Das Histogramm ist nur für stetige, klassierte Merkmale. Auf der y-Achse steht die Dichte, nicht die relative Häufigkeit." },

      { q:"Was wird beim Histogramm auf der <b>y-Achse</b> abgetragen?",
        options:["absolute Häufigkeit \\(n_j\\)","relative Häufigkeit \\(f_j\\)","Dichte \\(f_j/\\Delta_j\\)","kumulierte Häufigkeit \\(F_j\\)"],
        correct:2,
        explain:"Die Dichte. Erst Breite × Dichte (= Fläche) ergibt die relative Häufigkeit – und die Gesamtfläche ist 1." },

      { q:"Sortierter Kontakt (fünf 0en, vierzehn 1en, drei 2en, zwei 3en, eine 5), \\(n=25\\). Wie groß ist der Median?",
        options:["0","1","1,24","2"],
        correct:1,
        explain:"\\(25\\cdot0{,}5=12{,}5\\) → aufrunden → 13. Stelle = 1. (1,24 ist der Mittelwert, nicht der Median.)" },

      { q:"\\(24\\cdot0{,}5=12\\) ist ganzzahlig. Wie bestimmt man den Median nach Bamberg?",
        options:["12. Stelle","13. Stelle","Mittel aus 12. und 13. Stelle","12,5. Stelle interpolieren"],
        correct:2,
        explain:"Bei ganzzahligem \\(n\\cdot p\\) nimmt man das Mittel aus den Stellen \\(np\\) und \\(np+1\\)." },

      { q:"Welchen <b>Nenner</b> hat die Stichprobenvarianz in diesem Skript?",
        options:["\\(n\\)","\\(n-1\\)","\\(n+1\\)","\\(\\sqrt{n}\\)"],
        correct:1,
        explain:"\\(s^2=\\frac{n}{n-1}(\\overline{x^2}-\\bar x^2)\\). Beim Kontakt: \\(\\frac{25}{24}(2{,}76-1{,}24^2)=1{,}273\\)." },

      { q:"Mittelwert Alter = 40,368, Median = 47. Welche Verteilungsform liegt vor?",
        options:["symmetrisch","rechtsschief","linksschief","gleichverteilt"],
        correct:2,
        explain:"\\(\\bar x < x_{0,5}\\) bedeutet linksschief – ein paar junge Werte ziehen den Mittelwert unter den Median." },

      { q:"Alle Altersangaben werden <b>verdoppelt</b> (\\(b=2\\)). Was passiert mit der Standardabweichung?",
        options:["bleibt gleich","wird um 2 größer","verdoppelt sich","vervierfacht sich"],
        correct:2,
        explain:"\\(s_y=|b|\\,s_x\\) → verdoppelt. Die Varianz vervierfacht sich (\\(b^2=4\\)), die Standardabweichung verdoppelt sich." },

      { q:"Warum ist der Median <b>robuster</b> als der Mittelwert?",
        options:["er nutzt mehr Daten","er ignoriert Extremwerte und schaut nur auf die Mitte","er ist immer kleiner","er braucht keine Sortierung"],
        correct:1,
        explain:"Eine 63-jährige Person zieht den Mittelwert hoch, am Median (der Mitte des sortierten Datensatzes) ändert sie nichts." },

      { q:"\\(\\overline{x^2}\\) soll aus der <b>stetigen</b> Häufigkeitstabelle berechnet werden. Was wird quadriert?",
        options:["die relativen Häufigkeiten \\(f_j\\)","die Klassenmitten \\(m_j\\)","die Klassenbreiten \\(\\Delta_j\\)","die kumulierten Häufigkeiten \\(F_j\\)"],
        correct:1,
        explain:"\\(\\overline{x^2}=\\sum m_j^2\\,f_j\\) – die Klassenmitten werden quadriert und mit den relativen Häufigkeiten gewichtet. Beim Alter: \\(\\overline{x^2}=1899{,}671\\) → \\(s^2=191{,}918\\), \\(s=13{,}85\\) (statt 233,690 / 15,287 aus der Urliste)." },

      { q:"Warum rät das Skript davon ab, die <b>Spannweite</b> des Alters aus der klassierten Häufigkeitstabelle zu bestimmen?",
        options:["weil R nur für diskrete Merkmale definiert ist","weil die Klassengrenzen nicht den echten Extremwerten entsprechen müssen","weil man dafür erst die Dichte berechnen müsste","weil die Spannweite dort immer zu klein ausfällt"],
        correct:1,
        explain:"Aus den Klassen [15;30] … (50;70] käme R = 70 − 15 = 55, tatsächlich gilt R = 68 − 15 = 53: Die größte Klassenobergrenze (70) ist nicht der größte beobachtete Wert (68)." }
    ]
  });

  /* ============================================================
     WIDGET-IMPLEMENTIERUNGEN
     ============================================================ */

  /* ---------- W1: Datensatz-Explorer ---------- */
  function renderExplorer(el, ctx){
    var sexFilter = "alle";
    var zufFilter = "alle";
    var ageRange = [15, 68];
    var sortKey = "id", sortDir = 1;

    // --- Steuerleiste ---
    var bar = ctx.el("div", {style:{display:"flex",flexWrap:"wrap",gap:"14px",alignItems:"flex-start"}});

    // Geschlecht-Chips
    var sexChips = ctx.el("div", {class:"chips"});
    ["alle","weiblich","männlich"].forEach(function(s){
      var c = ctx.el("span", {class:"chip"+(s==="alle"?" active":""), text:s, onclick:function(){
        sexFilter=s; setActive(sexChips, s); update();
      }});
      sexChips.appendChild(c);
    });

    // Zufriedenheit-Chips
    var zufChips = ctx.el("div", {class:"chips"});
    ["alle"].concat(ZUF_ORDER).forEach(function(z){
      var c = ctx.el("span", {class:"chip"+(z==="alle"?" active":""), text:z, onclick:function(){
        zufFilter=z; setActive(zufChips, z); update();
      }});
      zufChips.appendChild(c);
    });

    function setActive(container, val){
      Array.prototype.forEach.call(container.children, function(ch){
        if(ch.textContent===val) ch.classList.add("active"); else ch.classList.remove("active");
      });
    }

    // Alters-Slider (zwei Slider für lo/hi)
    var ageLab = ctx.el("span", {class:"val"});
    var sLo = ctx.el("input", {type:"range", min:"15", max:"68", value:"15", step:"1"});
    var sHi = ctx.el("input", {type:"range", min:"15", max:"68", value:"68", step:"1"});
    function ageUpd(){
      var lo = Number(sLo.value), hi = Number(sHi.value);
      if(lo>hi){ var t=lo; lo=hi; hi=t; }
      ageRange = [lo, hi];
      ageLab.textContent = lo+"–"+hi+" J.";
      update();
    }
    sLo.addEventListener("input", ageUpd);
    sHi.addEventListener("input", ageUpd);
    var ageCtrl = ctx.el("div", {class:"ctrl"},
      ctx.el("label", {}, ctx.el("span",{text:"Alter (nur Befragte mit Angabe)"}), ageLab),
      sLo, sHi);

    bar.appendChild(ctx.el("div", {},
      ctx.el("div",{class:"sub-lbl",style:{fontSize:"12px",opacity:".8",marginBottom:"3px"},text:"Geschlecht"}), sexChips));
    bar.appendChild(ctx.el("div", {},
      ctx.el("div",{class:"sub-lbl",style:{fontSize:"12px",opacity:".8",marginBottom:"3px"},text:"Zufriedenheit"}), zufChips));
    bar.appendChild(ctx.el("div", {style:{minWidth:"200px"}}, ageCtrl));

    var resetBtn = ctx.el("button",{class:"btn ghost", text:"Zurücksetzen", onclick:function(){
      sexFilter="alle"; zufFilter="alle"; sLo.value="15"; sHi.value="68"; ageRange=[15,68]; ageLab.textContent="15–68 J.";
      sortKey="id"; sortDir=1; setActive(sexChips,"alle"); setActive(zufChips,"alle"); update();
    }});
    bar.appendChild(ctx.el("div",{}, ctx.el("div",{style:{height:"18px"}}), resetBtn));

    el.appendChild(bar);

    // Live-Zähler
    var counter = ctx.el("div", {class:"readout", style:{margin:"10px 0"}});
    el.appendChild(counter);

    // Tabelle
    var wrap = ctx.el("div", {class:"tbl-wrap"});
    el.appendChild(wrap);

    var cols = [
      {key:"id",  label:"Pat."},
      {key:"sex", label:"Geschlecht"},
      {key:"zuf", label:"Zufriedenheit"},
      {key:"kon", label:"Kontakt"},
      {key:"age", label:"Alter"}
    ];
    var zufRank = {"sehr gut":1,"gut":2,"befriedigend":3,"ausreichend":4};

    function cmp(a, b){
      var va = a[sortKey], vb = b[sortKey];
      // fehlende Werte immer ans Ende
      if(va===null && vb===null) return 0;
      if(va===null) return 1;
      if(vb===null) return -1;
      if(sortKey==="zuf"){ va=zufRank[va]; vb=zufRank[vb]; }
      if(va<vb) return -1*sortDir;
      if(va>vb) return 1*sortDir;
      return 0;
    }

    function update(){
      var rows = PATIENTS.filter(function(p){
        if(sexFilter!=="alle" && p.sex!==sexFilter) return false;
        if(zufFilter!=="alle" && p.zuf!==zufFilter) return false;
        if(p.age!==null){ if(p.age<ageRange[0] || p.age>ageRange[1]) return false; }
        // Wenn Altersfilter eingeengt ist, blende Befragte ohne Alter aus, sobald nicht der volle Bereich aktiv ist
        else if(ageRange[0]>15 || ageRange[1]<68) return false;
        return true;
      });
      rows = rows.slice().sort(cmp);

      counter.innerHTML="";
      counter.appendChild(ctx.el("b",{text:rows.length+" von 25"}));
      counter.appendChild(ctx.el("span",{text:" Patient:innen sichtbar. "}));
      counter.appendChild(ctx.el("span",{style:{opacity:".75",fontSize:"13px"},
        html:"n je Merkmal im Original: Geschlecht 25 · Kontakt 25 · Zufriedenheit 24 · Alter 19 (fehlende Werte ausgeschlossen)."}));

      wrap.innerHTML="";
      var tbl = ctx.el("table", {class:"data"});
      var thead = ctx.el("thead");
      var trh = ctx.el("tr");
      cols.forEach(function(col){
        var arrow = (sortKey===col.key) ? (sortDir===1?" ▲":" ▼") : " ⇅";
        var th = ctx.el("th", {style:{cursor:"pointer",userSelect:"none"}, html:col.label+"<span style='opacity:.5;font-size:11px'>"+arrow+"</span>",
          onclick:function(){
            if(sortKey===col.key){ sortDir*=-1; } else { sortKey=col.key; sortDir=1; }
            update();
          }});
        trh.appendChild(th);
      });
      thead.appendChild(trh);
      tbl.appendChild(thead);
      var tb = ctx.el("tbody");
      rows.forEach(function(p){
        var tr = ctx.el("tr");
        tr.appendChild(ctx.el("td",{text:String(p.id)}));
        tr.appendChild(ctx.el("td",{text:fmtSex(p.sex)}));
        tr.appendChild(ctx.el("td",{text:dashIf(p.zuf)}));
        tr.appendChild(ctx.el("td",{text:String(dashIf(p.kon))}));
        tr.appendChild(ctx.el("td",{text:String(dashIf(p.age))}));
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      wrap.appendChild(tbl);
    }

    ageLab.textContent = "15–68 J.";
    update();
  }

  /* ---------- W2: Häufigkeitstabelle-Generator ---------- */
  function renderFreqTable(el, ctx){
    var mode = "chart"; // chart type: 'bar' | 'pie'
    var chartType = "bar";
    var orderRef = null;
    var chart = null;   // aktuelle Chart.js-Instanz (muss vor Neuanlage zerstört werden)

    var presets = {
      "Kontakt (Zahlen, n=25)": {text: KON.join(", "), order:null},
      "Zufriedenheit (Wörter, n=24)": {text: ZUF.join(", "), order: ZUF_ORDER}
    };

    var input = ctx.el("input", {type:"text", value:presets["Kontakt (Zahlen, n=25)"].text,
      style:{width:"100%",boxSizing:"border-box"}});
    // Live-Berechnung beim Tippen; manuelle Eingabe hebt die Preset-Sortierreihenfolge auf
    input.addEventListener("input", function(){ orderRef = null; update(); });

    // Presets
    var pchips = ctx.el("div", {class:"chips"});
    Object.keys(presets).forEach(function(name){
      pchips.appendChild(ctx.el("span", {class:"chip", text:name, onclick:function(){
        input.value = presets[name].text;
        orderRef = presets[name].order;
        update();
      }}));
    });

    // Diagrammtyp
    var typeRow = ctx.el("div", {class:"btn-row", style:{marginTop:"8px"}});
    var btnBar = ctx.el("button", {class:"btn primary", text:"Balkendiagramm", onclick:function(){
      chartType="bar"; btnBar.classList.add("primary"); btnPie.classList.remove("primary"); update();
    }});
    var btnPie = ctx.el("button", {class:"btn", text:"Kreisdiagramm", onclick:function(){
      chartType="pie"; btnPie.classList.add("primary"); btnBar.classList.remove("primary"); update();
    }});
    typeRow.appendChild(btnBar); typeRow.appendChild(btnPie);

    el.appendChild(ctx.el("div",{style:{marginBottom:"6px",fontSize:"13px",opacity:".8"},text:"Presets:"}));
    el.appendChild(pchips);
    el.appendChild(ctx.el("div",{style:{height:"8px"}}));
    el.appendChild(input);
    el.appendChild(typeRow);

    var tblWrap = ctx.el("div", {class:"tbl-wrap", style:{marginTop:"12px"}});
    el.appendChild(tblWrap);

    var note = ctx.el("div", {class:"widget-hint", style:{marginTop:"6px"}});
    el.appendChild(note);

    var cw = ctx.el("div", {class:"canvas-wrap", style:{height:"300px",marginTop:"12px"}});
    var canvas = ctx.el("canvas");
    cw.appendChild(canvas);
    el.appendChild(cw);

    function parseItems(str){
      var parts = str.split(/[,\n;]+|\s{2,}/).map(function(s){return s.trim();}).filter(function(s){return s.length>0;});
      // Falls einzelne Leerzeichen Trenner sind und keine Mehrfach-Trenner gefunden wurden:
      if(parts.length<=1){
        parts = str.split(/[\s,;]+/).map(function(s){return s.trim();}).filter(function(s){return s.length>0;});
      }
      return parts;
    }

    function update(){
      var items = parseItems(input.value);
      var n = items.length;
      var allNum = n>0 && items.every(function(s){ return !isNaN(Number(s)); });
      var rows = tally(items, (!allNum && orderRef) ? orderRef : null);
      // numerische Werte als Zahl darstellen
      var labels = rows.map(function(r){ return r.a; });
      var cum = 0;

      // Tabelle
      tblWrap.innerHTML="";
      var tbl = ctx.el("table",{class:"data"});
      var thead = ctx.el("thead");
      thead.appendChild(htr(ctx, ["j","aⱼ","nⱼ","fⱼ","Fⱼ"]));
      tbl.appendChild(thead);
      var tb = ctx.el("tbody");
      rows.forEach(function(r, i){
        var f = r.n/n;
        cum += f;
        var tr = ctx.el("tr");
        tr.appendChild(ctx.el("td",{text:String(i+1)}));
        tr.appendChild(ctx.el("td",{text:r.a}));
        tr.appendChild(ctx.el("td",{text:String(r.n)}));
        tr.appendChild(ctx.el("td",{text:ctx.fmt.n(f,3)}));
        tr.appendChild(ctx.el("td",{text:ctx.fmt.n(cum,3)}));
        tb.appendChild(tr);
      });
      // Summenzeile
      var trs = ctx.el("tr",{style:{fontWeight:"700"}});
      trs.appendChild(ctx.el("td",{text:"Σ"}));
      trs.appendChild(ctx.el("td",{text:""}));
      trs.appendChild(ctx.el("td",{text:String(n)}));
      trs.appendChild(ctx.el("td",{text:"1"}));
      trs.appendChild(ctx.el("td",{text:""}));
      tb.appendChild(trs);
      tbl.appendChild(tb);
      tblWrap.appendChild(tbl);

      // Hinweis
      if(allNum && chartType==="pie"){
        note.innerHTML = "Bei <b>Zahlen</b> verzichtet man laut Skript auf das Kreisdiagramm – das Balkendiagramm ist hier korrekt. (Das Kreisdiagramm wird trotzdem gezeigt, damit du den Unterschied siehst.)";
      } else {
        note.innerHTML = "n = "+n+". Die Summe der relativen Häufigkeiten ist immer 1. Kreis-Winkel: \\(\\alpha_j=f_j\\cdot360^\\circ\\).";
        ctx.typeset(note);
      }

      // Diagramm
      var data = rows.map(function(r){ return r.n/n; });
      var colors = labels.map(function(_, i){ return ctx.PAL.set[i % ctx.PAL.set.length]; });
      var cfg;
      if(chartType==="pie"){
        cfg = {
          type:"pie",
          data:{ labels:labels, datasets:[{ data:data, backgroundColor:colors }] },
          options:{ responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{position:"right"},
              tooltip:{ callbacks:{ label:function(item){
                var f=item.parsed; return item.label+": "+ctx.fmt.n(f,3)+" ("+ctx.fmt.n(f*360,1)+"°)";
              }}}}}
        };
      } else {
        cfg = {
          type:"bar",
          data:{ labels:labels, datasets:[{ label:"relative Häufigkeit fⱼ", data:data, backgroundColor:colors }] },
          options:{ responsive:true, maintainAspectRatio:false,
            scales:{ y:{ beginAtZero:true, title:{display:true,text:"fⱼ"} },
                     x:{ title:{display:true,text:"aⱼ"} } },
            plugins:{ legend:{display:false},
              tooltip:{ callbacks:{ label:function(item){ return "fⱼ = "+ctx.fmt.n(item.parsed.y,3); }}}}}
        };
      }
      if(chart){ chart.destroy(); }
      chart = ctx.makeChart(canvas, cfg);
    }

    update();
  }

  function htr(ctx, arr){
    var tr = ctx.el("tr");
    arr.forEach(function(h){ tr.appendChild(ctx.el("th",{text:h})); });
    return tr;
  }

  /* ---------- W3: Histogramm-Builder ---------- */
  function renderHistogram(el, ctx){
    var data = AGE.slice();
    var useScript = true;   // Skript-Klassen vs. gleichbreite
    var nClasses = 4;
    var heightMode = "density"; // 'density' | 'rel'

    // Steuerleiste
    var modeRow = ctx.el("div", {class:"btn-row"});
    var btnScript = ctx.el("button", {class:"btn primary", text:"Skript-Einteilung", onclick:function(){
      useScript=true; btnScript.classList.add("primary"); btnEqual.classList.remove("primary"); refreshControls(); draw();
    }});
    var btnEqual = ctx.el("button", {class:"btn", text:"gleichbreite Klassen", onclick:function(){
      useScript=false; btnEqual.classList.add("primary"); btnScript.classList.remove("primary"); refreshControls(); draw();
    }});
    modeRow.appendChild(btnScript); modeRow.appendChild(btnEqual);
    el.appendChild(modeRow);

    // Slider Klassenanzahl
    var kLab = ctx.el("span",{class:"val", text:"4"});
    var kSlider = ctx.el("input",{type:"range",min:"2",max:"10",value:"4",step:"1"});
    var kCtrl = ctx.el("div",{class:"ctrl"},
      ctx.el("label",{}, ctx.el("span",{text:"Klassenanzahl"}), kLab), kSlider);
    kSlider.addEventListener("input", function(){ nClasses=Number(kSlider.value); kLab.textContent=String(nClasses); draw(); });

    // Toggle Höhe
    var hRow = ctx.el("div",{class:"btn-row",style:{marginTop:"8px"}});
    var btnDens = ctx.el("button",{class:"btn primary", text:"Höhe = Dichte (richtig)", onclick:function(){
      heightMode="density"; btnDens.classList.add("primary"); btnRel.classList.remove("primary"); draw();
    }});
    var btnRel = ctx.el("button",{class:"btn", text:"Höhe = rel. Häufigkeit (falsch)", onclick:function(){
      heightMode="rel"; btnRel.classList.add("primary"); btnDens.classList.remove("primary"); draw();
    }});
    hRow.appendChild(btnDens); hRow.appendChild(btnRel);

    var ctrlWrap = ctx.el("div",{style:{marginTop:"10px"}});
    el.appendChild(ctrlWrap);
    el.appendChild(hRow);

    function refreshControls(){
      ctrlWrap.innerHTML="";
      if(!useScript){ ctrlWrap.appendChild(kCtrl); }
    }

    var readout = ctx.el("div",{class:"readout", style:{margin:"12px 0"}});
    el.appendChild(readout);

    var cw = ctx.el("div",{class:"canvas-wrap", style:{height:"320px"}});
    el.appendChild(cw);
    var P = ctx.Plot(cw, {ymin:0, height:320});
    ctx.onCleanup(function(){ P.destroy(); });

    function buildClasses(){
      var n = data.length;
      var classes;
      if(useScript){
        classes = AGE_CLASSES.map(function(c){ return {lo:c.lo, hi:c.hi, firstClosed:!!c.firstClosed}; });
      } else {
        var mn = Math.min.apply(null, data), mx = Math.max.apply(null, data);
        var w = (mx-mn)/nClasses;
        classes = [];
        for(var i=0;i<nClasses;i++){
          classes.push({lo: mn+i*w, hi: mn+(i+1)*w, firstClosed:(i===0)});
        }
      }
      // zählen: Untergrenze offen (außer erste), Obergrenze geschlossen
      classes.forEach(function(c){ c.n=0; });
      data.forEach(function(x){
        for(var i=0;i<classes.length;i++){
          var c=classes[i];
          var inLow = (i===0 && c.firstClosed) ? (x>=c.lo) : (x>c.lo);
          var inHigh = (x<=c.hi);
          if(inLow && inHigh){ c.n++; break; }
        }
      });
      classes.forEach(function(c){
        c.f = c.n/n;
        c.delta = c.hi-c.lo;
        c.density = c.f/c.delta;
      });
      return classes;
    }

    function draw(){
      var classes = buildClasses();
      var mn = classes[0].lo, mx = classes[classes.length-1].hi;
      var maxH = 0, totalArea = 0;
      classes.forEach(function(c){
        var h = (heightMode==="density") ? c.density : c.f;
        if(h>maxH) maxH=h;
        totalArea += c.density * c.delta;
      });
      P.setX(mn - (mx-mn)*0.04, mx + (mx-mn)*0.04);
      P.setY(0, maxH*1.18 || 1);
      P.clear();

      var bars = classes.map(function(c, i){
        var h = (heightMode==="density") ? c.density : c.f;
        return {x0:c.lo, x1:c.hi, h:h, color:ctx.PAL.set[i % ctx.PAL.set.length]};
      });
      P.bars(bars, {stroke:"#fff"});
      P.axes({
        xlabel:"Alter (Jahre)",
        ylabel: heightMode==="density" ? "Dichte f̂(x)=fⱼ/Δⱼ" : "rel. Häufigkeit fⱼ",
        yfmt:function(v){ return ctx.fmt.n(v,3); },
        xfmt:function(v){ return ctx.fmt.n(v,0); }
      });

      // Beschriftung n_j auf den Balken
      classes.forEach(function(c){
        var h = (heightMode==="density") ? c.density : c.f;
        P.text((c.lo+c.hi)/2, h, "n="+c.n, {align:"center", baseline:"bottom", color:"#c3ccdc", px:false});
      });

      // Readout
      readout.innerHTML="";
      var head = ctx.el("div",{style:{marginBottom:"6px"}});
      head.appendChild(ctx.el("b",{text: heightMode==="density" ? "Höhe = Dichte ✔" : "Höhe = rel. Häufigkeit ✘"}));
      if(heightMode==="rel" && !allEqualWidth(classes)){
        head.appendChild(ctx.el("span",{style:{color:ctx.PAL.bad,marginLeft:"8px"},
          text:"Bei ungleich breiten Klassen lügt diese Darstellung – die schmale Klasse wirkt zu unwichtig!"}));
      }
      readout.appendChild(head);

      var mini = ctx.el("table",{class:"data"});
      var th = ctx.el("thead"); th.appendChild(htr(ctx,["Klasse","nⱼ","fⱼ","Δⱼ","Dichte fⱼ/Δⱼ"]));
      mini.appendChild(th);
      var tb = ctx.el("tbody");
      classes.forEach(function(c, i){
        var open = (i===0 && c.firstClosed) ? "[" : "(";
        var tr = ctx.el("tr");
        tr.appendChild(ctx.el("td",{text: open+ctx.fmt.n(c.lo,1)+"; "+ctx.fmt.n(c.hi,1)+"]"}));
        tr.appendChild(ctx.el("td",{text:String(c.n)}));
        tr.appendChild(ctx.el("td",{text:ctx.fmt.n(c.f,3)}));
        tr.appendChild(ctx.el("td",{text:ctx.fmt.n(c.delta,1)}));
        tr.appendChild(ctx.el("td",{text:ctx.fmt.n(c.density,3)}));
        tb.appendChild(tr);
      });
      mini.appendChild(tb);
      readout.appendChild(mini);
      readout.appendChild(ctx.el("div",{style:{marginTop:"6px",fontSize:"13px"},
        html:"Gesamtfläche unter dem Histogramm (Σ Dichte·Δ): <b>"+ctx.fmt.n(totalArea,3)+"</b> ≈ 1 ✔"}));
    }

    function allEqualWidth(classes){
      var w0 = classes[0].delta;
      return classes.every(function(c){ return Math.abs(c.delta-w0)<1e-9; });
    }

    P.onResize = draw;
    refreshControls();
    draw();
  }

  /* ---------- W4: Lagemaße-Rechner ---------- */
  function renderLocation(el, ctx){
    var quantP = 0.5;

    var presets = {
      "Alter (n=19)": AGE.join(", "),
      "Kontakt (n=25)": KON.join(", ")
    };
    var input = ctx.el("input",{type:"text", value:presets["Alter (n=19)"], style:{width:"100%",boxSizing:"border-box"}});
    input.addEventListener("input", update); // Live-Berechnung beim Tippen

    var pchips = ctx.el("div",{class:"chips"});
    Object.keys(presets).forEach(function(name){
      pchips.appendChild(ctx.el("span",{class:"chip", text:name, onclick:function(){ input.value=presets[name]; update(); }}));
    });

    el.appendChild(ctx.el("div",{style:{marginBottom:"6px",fontSize:"13px",opacity:".8"},text:"Presets:"}));
    el.appendChild(pchips);
    el.appendChild(ctx.el("div",{style:{height:"8px"}}));
    el.appendChild(input);

    // Stat-Kacheln
    var stats = ctx.el("div",{class:"readout", style:{margin:"12px 0"}});
    el.appendChild(stats);

    // Quantil-Auswahl für die Schritt-Box
    var qRow = ctx.el("div",{class:"btn-row", style:{marginTop:"4px"}});
    var qBtns = [
      {p:0.25, lab:"x₀,₂₅ (unteres Quartil)"},
      {p:0.5,  lab:"x₀,₅ (Median)"},
      {p:0.75, lab:"x₀,₇₅ (oberes Quartil)"}
    ];
    var qButtonEls = [];
    qBtns.forEach(function(q){
      var b = ctx.el("button",{class:"btn"+(q.p===0.5?" primary":""), text:q.lab, onclick:function(){
        quantP=q.p; qButtonEls.forEach(function(bb,i){ bb.classList.toggle("primary", qBtns[i].p===q.p); }); update();
      }});
      qButtonEls.push(b); qRow.appendChild(b);
    });
    el.appendChild(ctx.el("div",{style:{marginTop:"6px",fontSize:"13px",opacity:".8"},text:"Schrittweise zeigen für:"}));
    el.appendChild(qRow);

    var stepsBox = ctx.el("div",{class:"steps", style:{marginTop:"10px"}});
    el.appendChild(stepsBox);

    function update(){
      var a = ctx.parseNums(input.value);
      stats.innerHTML="";
      if(a.length===0){ stats.appendChild(ctx.el("div",{text:"Bitte Zahlen eingeben."})); stepsBox.innerHTML=""; return; }
      var sorted = ctx.Stats.sortAsc(a);
      var n = a.length;
      var mode = ctx.Stats.mode(a);
      var mean = ctx.Stats.mean(a);
      var med = ctx.Stats.median(a);
      var q1 = ctx.Stats.quantile(a, 0.25);
      var q3 = ctx.Stats.quantile(a, 0.75);

      addStat(ctx, stats, "stat", ctx.fmt.a(mean), "Mittelwert x̄");
      addStat(ctx, stats, "stat teal", ctx.fmt.a(med), "Median x₀,₅");
      addStat(ctx, stats, "stat violet", ctx.fmt.a(q1), "x₀,₂₅");
      addStat(ctx, stats, "stat violet", ctx.fmt.a(q3), "x₀,₇₅");
      addStat(ctx, stats, "stat good", mode.values.map(ctx.fmt.a).join(" / ")+" ("+mode.count+"×)", "Modus");
      addStat(ctx, stats, "stat blue", ctx.fmt.a(sorted[0])+" / "+ctx.fmt.a(sorted[n-1]), "Min / Max");

      // Schritt-für-Schritt Bamberg
      stepsBox.innerHTML="";
      var pos = n*quantP;
      var isInt = Math.abs(pos-Math.round(pos))<1e-9;
      var pLabel = quantP===0.5 ? "Median x₀,₅" : (quantP===0.25 ? "x₀,₂₅" : "x₀,₇₅");

      addStep(ctx, stepsBox, "Sortieren",
        "Aufsteigend: "+ sorted.map(ctx.fmt.a).join("; "));
      addStep(ctx, stepsBox, "Position berechnen",
        "n · p = "+n+" · "+ctx.fmt.a(quantP)+" = <b>"+ctx.fmt.a(pos)+"</b>");

      var result;
      if(!isInt){
        var k = Math.ceil(pos);
        addStep(ctx, stepsBox, "Ganzzahlig?",
          ctx.fmt.a(pos)+" ist <b>nicht</b> ganzzahlig → auf die nächstgrößere ganze Zahl aufrunden: ⌈"+ctx.fmt.a(pos)+"⌉ = <b>"+k+"</b>.");
        result = sorted[k-1];
        addStep(ctx, stepsBox, "Ablesen",
          "Die "+k+". Stelle der sortierten Liste = <b>"+ctx.fmt.a(result)+"</b>.");
      } else {
        var k1 = pos, k2 = pos+1;
        if(k2>n){
          // Randfall p=1 (pos=n): keine (n+1)-te Stelle → größter Wert (wie ctx.Stats.quantile)
          result = sorted[n-1];
          addStep(ctx, stepsBox, "Ganzzahlig?",
            ctx.fmt.a(pos)+" <b>ist</b> ganzzahlig, aber die "+k2+". Stelle existiert nicht (n = "+n+") → nimm die letzte Stelle.");
          addStep(ctx, stepsBox, "Ablesen",
            "Die "+n+". Stelle der sortierten Liste = <b>"+ctx.fmt.a(result)+"</b>.");
        } else {
          result = (sorted[k1-1]+sorted[k2-1])/2;
          addStep(ctx, stepsBox, "Ganzzahlig?",
            ctx.fmt.a(pos)+" <b>ist</b> ganzzahlig → Mittel aus der "+k1+". und "+k2+". Stelle.");
          addStep(ctx, stepsBox, "Mitteln",
            "( "+ctx.fmt.a(sorted[k1-1])+" + "+ctx.fmt.a(sorted[k2-1])+" ) / 2 = <b>"+ctx.fmt.a(result)+"</b>.");
        }
      }
      var fin = addStep(ctx, stepsBox, "Ergebnis", pLabel+" = <b>"+ctx.fmt.a(result)+"</b>");
      fin.style.background = "rgba(46,160,120,.12)";
    }

    update();
  }

  function addStat(ctx, container, cls, value, label){
    container.appendChild(ctx.el("div",{class:cls},
      ctx.el("div",{class:"v", text:value}),
      ctx.el("div",{class:"l", text:label})));
  }
  function addStep(ctx, container, key, html){
    var step = ctx.el("div",{class:"step"});
    step.appendChild(ctx.el("span",{class:"sk", text:key}));
    step.appendChild(ctx.el("span",{html:" "+html}));
    container.appendChild(step);
    return step;
  }

  /* ---------- W5: Streuungsmaße-Visualizer ---------- */
  function renderSpread(el, ctx){
    var showSquares = false;
    var showBand = true;

    var presets = {
      "Kontakt (n=25)": KON.join(", "),
      "Alter (n=19)": AGE.join(", ")
    };
    var input = ctx.el("input",{type:"text", value:presets["Kontakt (n=25)"], style:{width:"100%",boxSizing:"border-box"}});
    input.addEventListener("input", draw); // Live-Berechnung beim Tippen
    var pchips = ctx.el("div",{class:"chips"});
    Object.keys(presets).forEach(function(name){
      pchips.appendChild(ctx.el("span",{class:"chip", text:name, onclick:function(){ input.value=presets[name]; draw(); }}));
    });

    el.appendChild(ctx.el("div",{style:{marginBottom:"6px",fontSize:"13px",opacity:".8"},text:"Presets:"}));
    el.appendChild(pchips);
    el.appendChild(ctx.el("div",{style:{height:"8px"}}));
    el.appendChild(input);

    var togRow = ctx.el("div",{class:"btn-row", style:{marginTop:"8px"}});
    var btnSq = ctx.el("button",{class:"btn", text:"Quadrate (xᵢ−x̄)² zeigen", onclick:function(){
      showSquares=!showSquares; btnSq.classList.toggle("primary", showSquares); draw();
    }});
    var btnBand = ctx.el("button",{class:"btn primary", text:"Band x̄ ± s", onclick:function(){
      showBand=!showBand; btnBand.classList.toggle("primary", showBand); draw();
    }});
    togRow.appendChild(btnSq); togRow.appendChild(btnBand);
    el.appendChild(togRow);

    var stats = ctx.el("div",{class:"readout", style:{margin:"12px 0"}});
    el.appendChild(stats);

    var cw = ctx.el("div",{class:"canvas-wrap", style:{height:"300px"}});
    el.appendChild(cw);
    var P = ctx.Plot(cw, {height:300});
    ctx.onCleanup(function(){ P.destroy(); });

    function draw(){
      var a = ctx.parseNums(input.value);
      stats.innerHTML="";
      if(a.length<2){ stats.appendChild(ctx.el("div",{text:"Bitte mindestens 2 Zahlen eingeben."})); P.clear(); return; }
      var mean = ctx.Stats.mean(a);
      var v = ctx.Stats.variance(a);   // n-1
      var sd = ctx.Stats.sd(a);
      var R = ctx.Stats.range(a);
      var iqr = ctx.Stats.iqr(a);
      var cv = ctx.Stats.cv(a);        // = s / x̄ (dimensionslos)

      addStat(ctx, stats, "stat", ctx.fmt.a(mean), "Mittelwert x̄");
      addStat(ctx, stats, "stat violet", ctx.fmt.a(v), "Varianz s² (n−1)");
      addStat(ctx, stats, "stat teal", ctx.fmt.a(sd), "Std.abw. s");
      addStat(ctx, stats, "stat good", ctx.fmt.a(R), "Spannweite R");
      addStat(ctx, stats, "stat blue", ctx.fmt.a(iqr), "IQR");
      addStat(ctx, stats, "stat teal",
        (isFinite(cv) ? ctx.fmt.n(cv*100,1)+" %" : "—"), "Var.koeff. s/x̄");
      stats.appendChild(ctx.el("div",{class:"readout", style:{flexBasis:"100%",marginTop:"6px",fontSize:"15px"},
        html:"Der Durchschnitt liegt bei <b>"+ctx.fmt.a(mean)+" ± "+ctx.fmt.a(sd)+"</b>."}));

      var mn = Math.min.apply(null,a), mx = Math.max.apply(null,a);
      var pad = (mx-mn)*0.12 || 1;
      var x0 = Math.min(mn, mean-sd)-pad, x1 = Math.max(mx, mean+sd)+pad;
      // größte Abweichung (für maßstabsgetreue Quadrat-Skalierung)
      var maxDev = 0;
      a.forEach(function(x){ maxDev = Math.max(maxDev, Math.abs(x-mean)); });
      P.setX(x0, x1);
      P.setY(-1.2, 1.2);
      P.clear();

      // Band x̄ ± s
      if(showBand){
        var bandLeft = P.X(mean-sd), bandRight = P.X(mean+sd);
        P.ctx.save();
        P.ctx.fillStyle = "rgba(56,166,142,.12)";
        P.ctx.fillRect(bandLeft, P.Y(1.1), bandRight-bandLeft, P.Y(-1.1)-P.Y(1.1));
        P.ctx.restore();
      }

      // Mittelwert-Linie
      P.vline(mean, {color:ctx.PAL.gold, width:2});
      P.text(mean, 1.12, "x̄ = "+ctx.fmt.a(mean), {align:"center", baseline:"bottom", color:ctx.PAL.gold});

      // Nulllinie (Datenachse)
      P.hline(0, {color:"#bbb", width:1});

      // Jitter, damit gleiche Werte sichtbar sind: y-Offset pro Wiederholung
      var occ = {};
      a.forEach(function(x){
        var k=String(x);
        occ[k]=(occ[k]||0)+1;
        var rep = occ[k];
        var yoff = ((rep-1)%6) * 0.13 + 0.1;
        // Abweichungspfeil von Mittelwert zu Punkt
        P.line([[mean,yoff],[x,yoff]], {color: x>=mean?ctx.PAL.teal:ctx.PAL.bad, width:1.4});
        // Quadrat (x−x̄)² als maßstabsgetreue Fläche: Breite = Abweichung in Pixeln,
        // Höhe proportional zur selben Abweichung → Fläche ∝ (x−x̄)². Ein gemeinsamer
        // Faktor skaliert das größte Quadrat auf die verfügbare Höhe (≈70 px).
        if(showSquares){
          var sx0 = Math.min(mean, x);
          var rx0 = P.X(sx0), rxw = Math.abs(P.X(x)-P.X(mean));
          var maxW = Math.abs(P.X(mean+maxDev)-P.X(mean)) || 1;
          var rh = (rxw/maxW) * 70;   // Höhe ∝ Breite ⇒ Fläche ∝ (x−x̄)²
          P.ctx.save();
          P.ctx.fillStyle = "rgba(124,92,196,.10)";
          P.ctx.strokeStyle = "rgba(124,92,196,.4)";
          var ya = P.Y(yoff);
          P.ctx.fillRect(rx0, ya, rxw, rh);
          P.ctx.strokeRect(rx0, ya, rxw, rh);
          P.ctx.restore();
        }
        // Punkt
        P.points([[x,yoff]], {color: x>=mean?ctx.PAL.teal:ctx.PAL.bad, r:5, stroke:"#fff"});
      });

      P.axes({ xlabel:"Merkmalswert", yticks:[], xfmt:function(v){ return ctx.fmt.n(v, (mx-mn)>20?0:1); } });
    }

    P.onResize = draw;
    draw();
  }

  /* ---------- W6: Boxplot-Generator ---------- */
  function renderBoxplot(el, ctx){
    var presets = {
      "Alter (n=19)": AGE.join(", "),
      "Kontakt (n=25)": KON.join(", ")
    };
    var input = ctx.el("input",{type:"text", value:presets["Alter (n=19)"], style:{width:"100%",boxSizing:"border-box"}});
    input.addEventListener("input", draw); // Live-Berechnung beim Tippen
    var pchips = ctx.el("div",{class:"chips"});
    Object.keys(presets).forEach(function(name){
      pchips.appendChild(ctx.el("span",{class:"chip", text:name, onclick:function(){ input.value=presets[name]; draw(); }}));
    });

    el.appendChild(ctx.el("div",{style:{marginBottom:"6px",fontSize:"13px",opacity:".8"},text:"Presets:"}));
    el.appendChild(pchips);
    el.appendChild(ctx.el("div",{style:{height:"8px"}}));
    el.appendChild(input);

    var stats = ctx.el("div",{class:"readout", style:{margin:"12px 0"}});
    el.appendChild(stats);

    var cw = ctx.el("div",{class:"canvas-wrap", style:{height:"240px"}});
    el.appendChild(cw);
    var tip = ctx.el("div",{style:{
      position:"absolute", pointerEvents:"none", background:"rgba(30,30,40,.92)", color:"#fff",
      padding:"4px 8px", borderRadius:"6px", fontSize:"13px", opacity:"0", transition:"opacity .08s", zIndex:"5", whiteSpace:"nowrap"}});
    cw.style.position="relative";
    cw.appendChild(tip);

    var P = ctx.Plot(cw, {height:240, padT:30, padB:50});
    ctx.onCleanup(function(){ P.destroy(); });

    var BOXY = 0.5, BOXH = 0.42; // in Datenkoordinaten y∈[0,1]
    var current = null;

    function compute(a){
      var sorted = ctx.Stats.sortAsc(a);
      var n = sorted.length;
      return {
        min: sorted[0],
        q1: ctx.Stats.quantile(a, 0.25),
        med: ctx.Stats.median(a),
        q3: ctx.Stats.quantile(a, 0.75),
        max: sorted[n-1],
        iqr: ctx.Stats.iqr(a)
      };
    }

    function draw(){
      var a = ctx.parseNums(input.value);
      stats.innerHTML="";
      if(a.length<2){ stats.appendChild(ctx.el("div",{text:"Bitte mindestens 2 Zahlen eingeben."})); P.clear(); current=null; return; }
      var b = compute(a);
      current = b;

      addStat(ctx, stats, "stat blue", ctx.fmt.a(b.min), "Minimum");
      addStat(ctx, stats, "stat violet", ctx.fmt.a(b.q1), "x₀,₂₅");
      addStat(ctx, stats, "stat teal", ctx.fmt.a(b.med), "Median");
      addStat(ctx, stats, "stat violet", ctx.fmt.a(b.q3), "x₀,₇₅");
      addStat(ctx, stats, "stat blue", ctx.fmt.a(b.max), "Maximum");
      addStat(ctx, stats, "stat good", ctx.fmt.a(b.iqr), "IQR");

      var span = b.max-b.min;
      var pad = span*0.12 || 1;
      P.setX(b.min-pad, b.max+pad);
      P.setY(0, 1);
      P.clear();
      P.axes({ xlabel:"Merkmalswert", yticks:[], xfmt:function(v){ return ctx.fmt.n(v, span>20?0:1); } });

      var yTop = BOXY+BOXH/2, yBot = BOXY-BOXH/2;

      // Whisker-Linie min..max
      P.line([[b.min,BOXY],[b.q1,BOXY]], {color:"#888", width:2});
      P.line([[b.q3,BOXY],[b.max,BOXY]], {color:"#888", width:2});
      // Whisker-Kappen
      P.line([[b.min,yBot+0.08],[b.min,yTop-0.08]], {color:"#888", width:2});
      P.line([[b.max,yBot+0.08],[b.max,yTop-0.08]], {color:"#888", width:2});

      // Box (IQR)
      var bx0=P.X(b.q1), bx1=P.X(b.q3), by0=P.Y(yTop), by1=P.Y(yBot);
      P.ctx.save();
      P.ctx.fillStyle="rgba(56,166,142,.18)";
      P.ctx.strokeStyle=ctx.PAL.teal;
      P.ctx.lineWidth=2;
      P.ctx.fillRect(bx0, by0, bx1-bx0, by1-by0);
      P.ctx.strokeRect(bx0, by0, bx1-bx0, by1-by0);
      P.ctx.restore();

      // Median-Linie
      P.line([[b.med,yBot],[b.med,yTop]], {color:ctx.PAL.gold, width:3});

      // Labels
      P.text(b.med, yTop+0.06, "Median "+ctx.fmt.a(b.med), {align:"center", baseline:"bottom", color:ctx.PAL.gold});
      P.text(b.min, yBot-0.06, "Min", {align:"center", baseline:"top", color:"#777"});
      P.text(b.max, yBot-0.06, "Max", {align:"center", baseline:"top", color:"#777"});
    }

    function hoverInfo(x){
      if(!current) return null;
      var b=current;
      // toleranz in Datenkoordinaten
      var tol=(b.max-b.min)*0.03+0.001;
      var items=[
        {v:b.min, t:"Minimum: "+ctx.fmt.a(b.min)},
        {v:b.q1,  t:"unteres Quartil x₀,₂₅: "+ctx.fmt.a(b.q1)},
        {v:b.med, t:"Median: "+ctx.fmt.a(b.med)},
        {v:b.q3,  t:"oberes Quartil x₀,₇₅: "+ctx.fmt.a(b.q3)},
        {v:b.max, t:"Maximum: "+ctx.fmt.a(b.max)}
      ];
      var best=null, bd=Infinity;
      items.forEach(function(it){ var d=Math.abs(it.v-x); if(d<bd){bd=d;best=it;} });
      if(bd<=tol) return best.t;
      // innerhalb der Box?
      if(x>b.q1 && x<b.q3) return "Box (IQR "+ctx.fmt.a(b.iqr)+"): mittlere 50 % der Werte";
      return null;
    }

    P.cv.addEventListener("pointermove", function(e){
      var pt = P.pointer(e);
      var info = hoverInfo(pt.x);
      if(info){
        tip.textContent=info;
        tip.style.left=(pt.px+12)+"px";
        tip.style.top=(pt.py-10)+"px";
        tip.style.opacity="1";
        P.cv.style.cursor="pointer";
      } else {
        tip.style.opacity="0";
        P.cv.style.cursor="default";
      }
    });
    P.cv.addEventListener("pointerleave", function(){ tip.style.opacity="0"; });

    P.onResize = draw;
    draw();
  }

})();
