export const meta = {
  name: 'bsta01-lessons',
  description: 'Build all 8 lesson modules (content + interactive widgets) for the Statistik BSTA01-02 app',
  phases: [
    { title: 'Research', detail: 'Read each lesson (text + rendered pages), write a complete content spec' },
    { title: 'Author', detail: 'Write build/lektionN.js (content blocks + interactive widgets + quiz)' },
    { title: 'Verify', detail: 'Adversarially check formulas, completeness, widgets, JS validity' },
    { title: 'Fix', detail: 'Apply fixes from verification' },
  ],
};

const BASE = "C:/Users/rick_/Projkete/Statistik lern app";

// Physical PDF page = printed page + 2.  pages/page_NNN.png are pre-rendered (013..229).
const LESSONS = [
  { id:1, title:"Einführung", txt:[274,852], pages:[13,24], chapters:"1.1 Gegenstand der Statistik, 1.2 Grundbegriffe der Statistik, 1.3 Ablauf statistischer Untersuchungen",
    lead:"Leitbeispiel: Krankenhausstudie mit 25 Patient:innen.",
    widgets:"1) Skalenniveaus-Sortierer: ~10 Merkmale (z.B. Temperatur, Schulnote, Geschlecht, Einkommen, Postleitzahl, Körpergröße ...) per Klick dem richtigen Skalenniveau (nominal/ordinal/metrisch bzw. kardinal; diskret/stetig) zuordnen, mit Feedback. 2) Grundbegriffe-Quiz: klickbare Szenarien 'Grundgesamtheit oder Stichprobe?' / Merkmal vs. Merkmalsausprägung. Zu JEDEM Unterkapitel mind. ein interaktives Element." },
  { id:2, title:"Eindimensionale Daten", txt:[853,2446], pages:[25,66], chapters:"2.1 Tabellarische und grafische Darstellungsmöglichkeiten (Häufigkeitstabelle, Kreis-/Balken-/Stab-/Säulendiagramm, Histogramm, empirische Verteilungsfunktion), 2.2 Lagemaße (Modus, Median, Quantile, arithmetisches Mittel, ggf. geometrisch/harmonisch), 2.3 Streuungsmaße (Spannweite, Quartilsabstand, Varianz, Standardabweichung, Variationskoeffizient)",
    lead:"Leitbeispiel: Pflegeroboter-Datensatz (Merkmale u.a. Alter, Geschlecht, Zufriedenheit, Anzahl Kontakte).",
    widgets:"1) Datensatz-Explorer: den Original-Datensatz aus dem Skript sortierbar/filterbar darstellen. 2) Häufigkeitstabelle-Generator: eigene Werte -> Häufigkeitstabelle + Diagramm (Chart.js). 3) Histogramm-Builder: Slider für Klassenbreite/Klassenanzahl. 4) Lagemaße-Rechner: Zahlenreihe eingeben -> Modus, Median, alle Quartile, Mittelwert LIVE mit Schritt-für-Schritt-Erklärung (steps). 5) Streuungsmaße-Visualizer: Punkte + Mittelwert-Linie + Abweichungspfeile, Varianz visualisiert. 6) Boxplot-Generator mit Hover/Tooltips." },
  { id:3, title:"Zweidimensionale Daten", txt:[2447,3681], pages:[67,100], chapters:"3.1 Kontingenzanalyse (Kontingenztabelle, Chi-Quadrat, Kontingenzkoeffizient C, korrigiertes C*), 3.2 Rangkorrelationsanalyse (Spearman), 3.3 Korrelationsanalyse (Bravais-Pearson), 3.4 Zusammenhangsmaßzahlen bei verschiedenen Skalenniveaus",
    lead:"Leitbeispiele aus dem Skript exakt übernehmen (Kontingenz- und Korrelations-Beispiele).",
    widgets:"1) Kontingenztabelle-Builder: Felder ausfüllen -> Chi², C, C* live (ctx.Stats.chiSquare). 2) Korrelations-Scatter: Punkte per Drag verschieben / hinzufügen -> Pearson r und Spearman rho live + Regressionsgerade. 3) 'Was bedeutet r=0,3?': mehrere Scatter mit verschiedenen Korrelationsstärken nebeneinander." },
  { id:4, title:"Lineare Regression", txt:[3682,4273], pages:[101,118], chapters:"4.1 Grundlagen der einfachen linearen Regressionsanalyse, 4.2 Bestimmung der Regressionsgerade (Kleinste-Quadrate-Methode, Regressionskoeffizient b, Regressionskonstante a), 4.3 Qualitätsbeurteilung (Korrelationskoeffizient, Bestimmtheitsmaß R²)",
    lead:"Leitbeispiel: Alkoholkonzentration & Reaktionszeit (Originalzahlen aus dem Skript).",
    widgets:"1) Regressionsgerade-Builder: Punkte setzen oder Skript-Beispiel laden -> KQM-Gerade live, a, b, R² angezeigt; optional Residuen/Quadrate visualisieren. 2) Alkohol-Reaktionszeit-Demo: das komplette Skript-Beispiel mit schrittweiser Berechnung (steps)." },
  { id:5, title:"Wahrscheinlichkeitsrechnung", txt:[4274,5540], pages:[119,154], chapters:"5.1 Zufallsexperimente und Ereignisse (Ergebnisraum, Ereignis, Mengenoperationen, Venn-Diagramme), 5.2 Wahrscheinlichkeit von Ereignissen (Laplace, relative Häufigkeit, Axiome, Additionssatz, Multiplikationssatz, bedingte Wahrscheinlichkeit, Unabhängigkeit, Satz von Bayes), 5.3 Zufallsvariablen und ihre Verteilungen (Erwartungswert, Varianz)",
    lead:"Leitbeispiele/Würfel- und Karten-Beispiele aus dem Skript.",
    widgets:"1) Würfel-Simulator: n Würfe simulieren -> relative Häufigkeit vs. theoretische Wahrscheinlichkeit (Gesetz der großen Zahlen, Chart.js Linie). 2) Venn-Diagramm-Rechner: Wahrscheinlichkeiten/Mengen eingeben -> Venn mit Schnittmengen (Canvas). 3) Bedingte Wahrscheinlichkeit: interaktives Baumdiagramm mit editierbaren Wahrscheinlichkeiten (Canvas/DOM); Bayes durchrechnen." },
  { id:6, title:"Spezielle Verteilungen", txt:[5541,6638], pages:[155,184], chapters:"6.1 Diskrete Verteilungen (Bernoulli, Binomialverteilung, Poisson-Verteilung), 6.2 Stetige Verteilungen (Gleichverteilung, Normalverteilung inkl. Standardisierung/z-Wert/Standardnormalverteilung, Exponentialverteilung)",
    lead:"Leitbeispiele aus dem Skript (z.B. Wartezeit/Fahrtzeit-Beispiele für Normal-/Exponentialverteilung).",
    widgets:"1) Normalverteilung: Bell-Curve, Slider für μ und σ, farbige Fläche P(X<x) mit verschiebbarem x (Plot.area + Plot.pointer), Prozentanteil + integrierter Standardisierungs-/z-Wert-Rechner. 2) Binomialverteilung: Slider n und p -> Balkendiagramm (Chart.js) live, E(X)=np. 3) Poisson-Simulator: λ-Slider -> Verteilung + Erwartungswert. 4) optional Exponentialverteilung interaktiv." },
  { id:7, title:"Schätzverfahren", txt:[6639,7157], pages:[185,200], chapters:"7.1 Punktschätzung (erwartungstreue Schätzer für Erwartungswert, Varianz, Standardabweichung), 7.2 Intervallschätzung (Konfidenzintervall für μ bei bekanntem und unbekanntem σ, t-Verteilung, Bestimmung der Stichprobengröße)",
    lead:"Leitbeispiele aus dem Skript (Konfidenzintervall-Berechnungen mit Originalzahlen).",
    widgets:"1) Konfidenzintervall-Visualizer: Slider n, Konfidenzniveau (90/95/99 %), σ -> KI live eingezeichnet; Simulationsmodus: 100 Stichproben ziehen und zeigen, wie viele das wahre μ überdecken. 2) t-Verteilung vs. Normalverteilung: Freiheitsgrade-Slider, beide Kurven überlagert (Plot.func)." },
  { id:8, title:"Hypothesentests", txt:[7158,8447], pages:[201,229], chapters:"8.1 Methodik (H0/H1, Fehler 1. und 2. Art, Signifikanzniveau α, Teststatistik, Ablehnungsbereich, ein-/zweiseitig, p-Wert), 8.2 z-Test (Erwartungswert bei bekanntem σ), 8.3 t-Test (Erwartungswert bei unbekanntem σ)",
    lead:"Leitbeispiele aus dem Skript für z-Test und t-Test (Originalzahlen, schrittweise).",
    widgets:"1) Hypothesentest-Wizard: Eingaben n, x̄, σ (oder s), μ0, α, ein-/zweiseitig -> alle Schritte, z- bzw. t-Wert berechnet, Ablehnungsbereich auf der Verteilung eingezeichnet, Entscheidung. 2) p-Wert-Visualizer: Testwert in die Verteilung einzeichnen, Fläche = p. 3) Fehler-1./2.-Art-Demo: verschiebbarer Ablehnungsbereich, α- und β-Flächen zweier Verteilungen sichtbar." },
];

const SPEC_SCHEMA = {
  type:"object", additionalProperties:false,
  required:["lessonId","specPath","subchapters","widgetsPlanned","leadExample","notes"],
  properties:{
    lessonId:{type:"integer"},
    specPath:{type:"string"},
    subchapters:{type:"array", items:{type:"object", additionalProperties:false,
      required:["num","title","keyDefinitions","formulas"],
      properties:{ num:{type:"string"}, title:{type:"string"},
        keyDefinitions:{type:"array", items:{type:"string"}},
        formulas:{type:"array", items:{type:"object", additionalProperties:false,
          required:["name","tex"], properties:{name:{type:"string"}, tex:{type:"string"}}}} }}},
    widgetsPlanned:{type:"array", items:{type:"string"}},
    leadExample:{type:"string"},
    notes:{type:"string"}
  }
};
const ISSUES_SCHEMA = {
  type:"object", additionalProperties:false,
  required:["lessonId","nodeCheckPasses","subchaptersCovered","widgetsPresent","issues","verdict"],
  properties:{
    lessonId:{type:"integer"},
    nodeCheckPasses:{type:"boolean"},
    subchaptersCovered:{type:"boolean"},
    widgetsPresent:{type:"array", items:{type:"string"}},
    issues:{type:"array", items:{type:"object", additionalProperties:false,
      required:["severity","area","problem","suggestedFix"],
      properties:{ severity:{enum:["blocker","major","minor"]}, area:{type:"string"},
        problem:{type:"string"}, suggestedFix:{type:"string"} }}},
    verdict:{type:"string"}
  }
};
const AUTHOR_SCHEMA = {
  type:"object", additionalProperties:false,
  required:["lessonId","file","sectionsCount","widgetsCount","formulasCount","quizCount","leadExampleReproduced","report"],
  properties:{ lessonId:{type:"integer"}, file:{type:"string"},
    sectionsCount:{type:"integer"}, widgetsCount:{type:"integer"}, formulasCount:{type:"integer"},
    quizCount:{type:"integer"}, leadExampleReproduced:{type:"boolean"}, report:{type:"string"} }
};
const FIX_SCHEMA = {
  type:"object", additionalProperties:false,
  required:["lessonId","fixed","remaining","nodeCheckPasses"],
  properties:{ lessonId:{type:"integer"}, fixed:{type:"array",items:{type:"string"}},
    remaining:{type:"array",items:{type:"string"}}, nodeCheckPasses:{type:"boolean"} }
};

function pageList(L){ const out=[]; for(let p=L.pages[0]; p<=L.pages[1]; p++) out.push("page_"+String(p).padStart(3,"0")+".png"); return out.join(", "); }

const results = await pipeline(LESSONS,

  // ---------- Stage 1: RESEARCH + SPEC ----------
  (L) => agent(
`Du recherchierst LEKTION ${L.id} ("${L.title}") des IU-Statistikskripts BSTA01-02 und schreibst eine VOLLSTÄNDIGE inhaltliche Spezifikation.

QUELLEN (lies sie GRÜNDLICH):
- Fließtext (schnell): Datei "${BASE}/skript_layout.txt", Zeilen ${L.txt[0]}–${L.txt[1]} (mit Read offset/limit, ggf. in mehreren Reads).
- Originalseiten als Bilder (für EXAKTE Formeln, Tabellen, Abbildungen, Beispielzahlen): "${BASE}/pages/" Dateien ${pageList(L)}. LIES ALLE diese Seiten visuell mit dem Read-Tool. Im Fließtext sind Formeln/Indizes oft verstümmelt – die Bilder sind maßgeblich.

INHALT DER LEKTION: ${L.chapters}
${L.lead}

AUFGABE – schreibe nach "${BASE}/build/spec_lektion${L.id}.md" eine ausführliche Markdown-Spezifikation mit:
- Pro Unterkapitel (${L.chapters}): Kernaussagen, ALLE Definitionen (wörtlich sinngemäß), ALLE Formeln als korrektes LaTeX (geprüft an den Seitenbildern), und das Leitbeispiel/die Beispiele MIT EXAKTEN ZAHLEN aus dem Skript inkl. der schrittweisen Rechnung und der Ergebnisse.
- Den/die Original-Datensätze als konkrete Zahlentabellen (damit Widgets echte Daten nutzen).
- Wörtliche, prägnante Zitate aus dem Skript (für "Originalton Prof. Bornewasser-Hermes").
- Ideen für Aha-Momente/Analogien und "Warum brauche ich das?".
- Mind. 6 gute Quiz-Fragen-Ideen mit korrekter Antwort.
- Die geplanten interaktiven Widgets (siehe unten), je mit Datengrundlage und was live berechnet wird.

GEFORDERTE WIDGETS: ${L.widgets}

WICHTIG: Genauigkeit der Formeln und Beispielzahlen hat höchste Priorität – verifiziere sie an den Seitenbildern. Achte auf die im Skript verwendete QUANTILS-/Median-Methode (prüfe am gerechneten Beispiel) und die Varianz-Definition (Nenner n oder n-1) – notiere das explizit.

Gib am Ende das strukturierte Ergebnis zurück (specPath = der geschriebene Pfad).`,
    { label:`research:L${L.id}`, phase:'Research', schema: SPEC_SCHEMA }),

  // ---------- Stage 2: AUTHOR ----------
  (spec, L) => agent(
`Du schreibst das vollständige Lektion-Modul "${BASE}/build/lektion${L.id}.js" für die Statistik-Lernapp (LEKTION ${L.id}: "${L.title}").

PFLICHTLEKTÜRE ZUERST:
1. Den Vertrag: "${BASE}/build/CONTRACT.md" – Datenformat, Block-Typen, Widget-API (ctx.Stats, ctx.Plot, ctx.makeChart, CSS-Klassen). HALTE IHN EXAKT EIN (inkl. IIFE-Wrapping, KEINE Top-Level-Deklarationen).
2. Deine Spezifikation: "${BASE}/build/spec_lektion${L.id}.md".
3. Als Referenz für ein funktionierendes Beispiel-Modul: "${BASE}/build/lektion1.js" ist aktuell ein DUMMY${L.id===1?" (DEN DU JETZT ERSETZT)":" – zeigt Stil/Struktur; NICHT inhaltlich übernehmen"}.
4. Bei Unklarheit zu Formeln/Zahlen: konsultiere die Seitenbilder "${BASE}/pages/" (${pageList(L)}).

ANFORDERUNGEN:
- EIN section-Eintrag pro Unterkapitel (${L.chapters}). JEDES Unterkapitel inhaltlich VOLLSTÄNDIG abgedeckt – nicht zusammengefasst.
- Pro Unterkapitel: Kernaussage in eigenen Worten (kurze Absätze), def-Boxen, ALLE Formeln (formula-Blöcke, sauberes LaTeX), das Leitbeispiel als example-Box nachgerechnet, mind. ein aha-Block, eine why-Box, gern ein quote-Block (Originalton), und das/die geforderten interaktive(n) Widget(s).
- GEFORDERTE WIDGETS (voll funktionsfähig, rechnen über ctx.Stats, responsiv): ${L.widgets}
- formulas:[...] am Lektion-Objekt füllen (für die globale Formelsammlung).
- quiz: mind. 5 (gern 6–8) gute Multiple-Choice-Fragen mit explain.
- Stil: für jemanden, der Statistik können MUSS, aber nicht WILL – mit Humor und Alltagsbezug, fachlich exakt, Deutsch, Komma-Dezimalzahlen (ctx.fmt).

QUALITÄT vor Quantität bei Widgets: lieber ein wirklich gut gemachtes interaktives Element als fünf halbgare – aber die geforderten müssen alle da und korrekt sein.

ABSCHLUSS: Führe \`node --check "${BASE}/build/lektion${L.id}.js"\` via Bash aus, bis es fehlerfrei ist. Dann gib das strukturierte Ergebnis zurück.`,
    { label:`author:L${L.id}`, phase:'Author', schema: AUTHOR_SCHEMA }),

  // ---------- Stage 3: VERIFY ----------
  (auth, L) => agent(
`Adversariale QUALITÄTSPRÜFUNG von "${BASE}/build/lektion${L.id}.js" (LEKTION ${L.id}: "${L.title}").

Sei streng und konkret. Prüfe gegen die Originalquelle und den Vertrag:
1. Lies "${BASE}/build/lektion${L.id}.js" komplett und "${BASE}/build/CONTRACT.md".
2. Lies die Seitenbilder "${BASE}/pages/" (${pageList(L)}) und vergleiche – KORREKTHEIT zuerst:
   - Sind ALLE Formeln mathematisch korrekt und vollständig (LaTeX)? Stichproben gegen die Seiten.
   - Stimmen die Zahlen des Leitbeispiels und die Zwischenergebnisse mit dem Skript überein?
   - Median/Quantils-Methode und Varianz-Nenner konsistent mit dem Skript?
3. VOLLSTÄNDIGKEIT: Ist jedes Unterkapitel (${L.chapters}) als section vorhanden und inhaltlich abgedeckt (Definitionen, Formeln, Beispiel, aha/why)?
4. WIDGETS: Sind alle geforderten Widgets vorhanden (${L.widgets})? Lies den Widget-Code: rechnen sie korrekt (nutzen ctx.Stats), behandeln sie Edge-Cases (leere Eingabe, n<2), zeichnen sie sinnvoll? Nenne konkrete Bugs.
5. VERTRAG: IIFE-Wrapper vorhanden? Genau ein App.registerLesson? Keine Top-Level-Deklarationen/keine verbotenen Libs? Block-Typen korrekt benutzt? Mathe-Delimiter richtig (tex ohne \\[ \\], html mit \\( \\))?
6. Führe \`node --check "${BASE}/build/lektion${L.id}.js"\` aus.

Liefere die Probleme strukturiert (severity blocker/major/minor, area, problem, konkreter suggestedFix). widgetsPresent = Liste der tatsächlich gefundenen Widgets. Wenn alles top ist: leere issues-Liste.`,
    { label:`verify:L${L.id}`, phase:'Verify', schema: ISSUES_SCHEMA }),

  // ---------- Stage 4: FIX ----------
  (issues, L) => {
    const real = (issues.issues||[]).filter(i=>i.severity!=='minor');
    if(!issues || (issues.nodeCheckPasses && real.length===0 && issues.subchaptersCovered)){
      return Promise.resolve({lessonId:L.id, fixed:[], remaining:(issues&&issues.issues||[]).map(i=>i.problem), nodeCheckPasses:true, _skipped:true});
    }
    const list = (issues.issues||[]).map((i,n)=>`${n+1}. [${i.severity}] (${i.area}) ${i.problem}\n   FIX: ${i.suggestedFix}`).join("\n");
    return agent(
`Behebe die in der Prüfung gefundenen Probleme in "${BASE}/build/lektion${L.id}.js" (LEKTION ${L.id}).

Gefundene Probleme:
${list}

Vorgehen:
1. Lies "${BASE}/build/lektion${L.id}.js" und "${BASE}/build/CONTRACT.md".
2. Behebe ALLE blocker/major Probleme; minor wenn sinnvoll. Erfinde keine Zahlen – bei Formel-/Zahlen-Korrekturen konsultiere die Seitenbilder "${BASE}/pages/" (${pageList(L)}).
3. Achte darauf, die Datei vollständig und gültig zu halten (IIFE, ein App.registerLesson, Vertrag).
4. Führe abschließend \`node --check "${BASE}/build/lektion${L.id}.js"\` aus, bis fehlerfrei.

Gib zurück, was gefixt wurde (fixed), was bewusst offen blieb (remaining), und ob node --check besteht.`,
      { label:`fix:L${L.id}`, phase:'Fix', schema: FIX_SCHEMA });
  }
);

return results.map((r,i)=>({lesson:LESSONS[i].id, result:r}));
