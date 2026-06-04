export const meta = {
  name: 'bsta01-polish',
  description: 'Targeted fixes: L1 lead-example fidelity, L3+L7 missing widgets, L8 citation cleanup',
  phases: [{ title: 'Polish', detail: 'Independent targeted fixes per lesson file' }],
};
const BASE = "C:/Users/rick_/Projkete/Statistik lern app";
function pages(a,b){const o=[];for(let p=a;p<=b;p++)o.push("page_"+String(p).padStart(3,"0")+".png");return o.join(", ");}

const FIX_SCHEMA = { type:"object", additionalProperties:false,
  required:["lesson","changes","nodeCheckPasses"],
  properties:{ lesson:{type:"integer"}, changes:{type:"array",items:{type:"string"}}, nodeCheckPasses:{type:"boolean"} } };

const tasks = [
  { id:1, label:"fix:L1-fidelity", prompt:
`Korrigiere "${BASE}/build/lektion1.js" (Lektion 1 "Einführung").

PROBLEM: Das Modul verwendet als durchgehendes Leitbeispiel den "Pflegeroboter-Befragung / 25 Patient:innen"-Datensatz (Urliste-Explorer, Tabelle in 1.3). Dieser Datensatz gehört aber laut Skript zu LEKTION 2 (er erscheint erst ab gedruckt S.23). Das eigentliche Leitbeispiel von Lektion 1 ist die fiktive Studie zu den "deutschen Krankenhäusern".

VORGEHEN:
1. Lies "${BASE}/build/lektion1.js" komplett und "${BASE}/build/CONTRACT.md".
2. Lies die Originalseiten "${BASE}/pages/" (${pages(13,24)}) und stelle fest, welches Leitbeispiel Lektion 1 tatsächlich nutzt (Krankenhäuser-Studie) und wie 1.3 "Ablauf statistischer Untersuchungen" im Skript dargestellt ist.
3. Passe Lektion 1 so an, dass die Inhalte/Beispiele der tatsächlichen Skript-Quelle von Lektion 1 entsprechen. Den großen Pflegeroboter-25-Patienten-Datensatz NICHT als Leitbeispiel von Lektion 1 führen (er ist das Leitbeispiel von Lektion 2). Wenn ein kleiner Vorgriff didaktisch sinnvoll ist, klar als "ausführlich in Lektion 2" kennzeichnen — aber 1.3 soll das echte L1-Beispiel (Krankenhäuser/Untersuchungsablauf) nachspielen.
4. Behalte die geforderten interaktiven Elemente: Skalenniveaus-Sortierer und Grundbegriffe-Quiz (Grundgesamtheit vs. Stichprobe). Stelle sicher, dass JEDES Unterkapitel (1.1, 1.2, 1.3) mind. ein passendes interaktives Element hat (für 1.3 z.B. ein "Ablauf einer statistischen Untersuchung"-Stepper, falls der Datensatz-Explorer entfällt).
5. Vertrag einhalten (IIFE, ein App.registerLesson, Block-Typen). KEINE erfundenen Zahlen.
6. \`node --check "${BASE}/build/lektion1.js"\` muss bestehen.` },

  { id:3, label:"fix:L3-spearman", prompt:
`Ergänze "${BASE}/build/lektion3.js" (Lektion 3) um ein fehlendes interaktives Element und behebe eine Anzeige-Panne.

AUFGABE A – Unterkapitel 3.2 "Rangkorrelationsanalyse (Spearman)" hat aktuell KEIN Widget. Der Auftrag verlangt pro Unterkapitel mind. ein interaktives Element. Baue ein gutes Spearman-Widget, z.B.:
- Eine kleine editierbare Wertetabelle (zwei ordinale/metrische Merkmale, mehrere Objekte). Default = das Spearman-Leitbeispiel aus dem Skript (lies "${BASE}/pages/" ${pages(76,83)} für die echten Zahlen und die Rangbildung inkl. Behandlung von Bindungen/Rangplätzen).
- Live: Rangvergabe sichtbar machen, d und d² je Zeile, und Spearman-ρ (nutze ctx.Stats.spearman bzw. ctx.Stats.ranks; zeige bei bindungsfreien Daten auch die Formel 1−6·Σd²/(n(n²−1)) via ctx.Stats.spearmanSimple).
- Schrittweise Erklärung (steps) und ggf. ein kleiner Scatter (ctx.Plot).

AUFGABE B – In der Beispiel-Box (ca. Zeile 698) steht in einer table-Caption "(Tabelle 28, page_092)". Entferne den internen Dateibezug "page_092" (Nutzer-sichtbar!). "Tabelle 28" darf bleiben.

VORGEHEN: Lies zuerst "${BASE}/build/lektion3.js" und "${BASE}/build/CONTRACT.md". Halte den Vertrag ein (IIFE, ctx.Stats, Block-Typen). \`node --check "${BASE}/build/lektion3.js"\` muss bestehen.` },

  { id:7, label:"fix:L7-punktschaetzung", prompt:
`Ergänze "${BASE}/build/lektion7.js" (Lektion 7) um ein fehlendes interaktives Element.

PROBLEM: Unterkapitel 7.1 "Punktschätzung" hat KEIN Widget. Der Auftrag verlangt pro Unterkapitel mind. ein interaktives Element.

AUFGABE: Baue ein lehrreiches Punktschätzungs-Widget, z.B. einen "Erwartungstreue-Simulator":
- Nutzer wählt eine Grundgesamtheit (μ, σ) und Stichprobengröße n (Slider).
- Button "Stichprobe ziehen" zieht n Werte (normalverteilt, via ctx.Stats.normalInv auf Zufallszahlen oder Box-Muller) und zeigt den Stichproben-Mittelwert x̄ und die Stichproben-Varianz s² (Nenner n−1, ctx.Stats.variance) als Punktschätzer.
- "Viele Stichproben"-Modus: z.B. 500 Stichproben ziehen, Verteilung der x̄ als Histogramm/Chart zeigen und veranschaulichen, dass der Mittelwert der x̄ ≈ μ ist (Erwartungstreue) und dass s² im Mittel ≈ σ² trifft, während die Schätzung mit Nenner n den Wert systematisch unterschätzt (zeige beide zum Vergleich → didaktischer Kern von 7.1).
- Bezug zum Skript-Inhalt 7.1 (erwartungstreue Schätzer für Erwartungswert, Varianz, Standardabweichung). Lies bei Bedarf "${BASE}/pages/" ${pages(185,188)}.

VORGEHEN: Lies "${BASE}/build/lektion7.js" und "${BASE}/build/CONTRACT.md". Vertrag einhalten (IIFE, ctx.Stats/ctx.Plot/ctx.makeChart, Block-Typen, responsiv). \`node --check "${BASE}/build/lektion7.js"\` muss bestehen.` },

  { id:8, label:"fix:L8-citations", prompt:
`Bereinige die Quellenangaben in "${BASE}/build/lektion8.js" (Lektion 8 "Hypothesentests").

PROBLEME:
1. Mehrere quote-"source"-Felder und table-"caption"-Felder enthalten Nutzer-sichtbare interne Dateibezüge wie "(page_201)", "(page_211)", "(page_219)" usw. ENTFERNE alle "(page_NNN)" aus Nutzer-sichtbaren Texten (sources und captions).
2. Die gedruckten Seitenzahlen ("Skript, S. NNN") wurden teils fälschlich mit der Bilddatei-Nummer gleichgesetzt. Es gilt: gedruckte Seite = Bilddateinummer − 2 (z.B. page_213.png = gedruckt S. 211). Korrigiere die "S. NNN"-Angaben so, dass sie die TATSÄCHLICHE gedruckte Seite nennen, auf der der Inhalt steht. Verifiziere durch Lesen der Seitenbilder "${BASE}/pages/" (${pages(201,229)}).
3. Der quote-Block mit "Skript, S. 206": das wörtliche Zitat stimmt nicht. Im Skript (gedruckt S. 205, Datei page_207.png) steht sinngemäß "Derartige Testverfahren werden als konservativ formuliert (Schäfer, 2011, S. 57)." Korrigiere den Zitatwortlaut exakt auf die Quelle und die Seitenangabe.
4. Prüfe die übrigen als wörtlich (Anführungszeichen) ausgewiesenen Zitate stichprobenartig gegen die Seiten und korrigiere falsche Wortlaute/Seiten.

VORGEHEN: Lies "${BASE}/build/lektion8.js" und "${BASE}/build/CONTRACT.md". Erfinde nichts; bei Unsicherheit lieber das Zitat sinngemäß (ohne Anführungszeichen) als Paraphrase kennzeichnen. \`node --check "${BASE}/build/lektion8.js"\` muss bestehen.` },
];

const results = await parallel(tasks.map(t => () =>
  agent(t.prompt, { label:t.label, phase:'Polish', schema: FIX_SCHEMA })
    .then(r => ({...r, _id:t.id})).catch(e => ({lesson:t.id, changes:["ERROR: "+e.message], nodeCheckPasses:false}))
));
return results;
