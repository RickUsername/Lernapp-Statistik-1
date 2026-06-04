# Lektion-Modul-Vertrag (BSTA01-02 Lernapp)

Jede Lektion ist eine Datei `build/lektionN.js`, die in die fertige `index.html` eingefügt wird.
Die Datei läuft im **globalen Scope** zusammen mit den anderen Lektionen. **Pflicht:** Wickle das
gesamte Modul in eine IIFE, damit keine Top-Level-Namen mit anderen Lektionen kollidieren:

```js
(function(){
  "use strict";
  // ...optionale Helfer-Funktionen/Konstanten hier (lokal, kollidieren nie)...
  App.registerLesson({ /* siehe unten */ });
})();
```

> ❌ NIE Top-Level `const/let/function` außerhalb der IIFE. ❌ Keine neuen `<script>`-Tags, keine `import`,
> keine externen Libraries außer den bereits geladenen (MathJax, Chart.js). ❌ Kein `localStorage`-Zugriff
> (macht die Shell). ❌ Keine globalen Variablen anlegen.

## Lektion-Objekt

```js
App.registerLesson({
  id: 2,                         // 1..8 (Pflicht, eindeutig)
  title: "Auswertung eindimensionaler Daten",   // Kurztitel (Sidebar/Dashboard)
  formulas: [                    // optional: erscheinen in der globalen Formelsammlung
    { group:"Lektion 2 · Lagemaße", name:"Arithmetisches Mittel",
      tex:"\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i", note:"für metrische Daten" },
    // ...alle wichtigen Formeln der Lektion...
  ],
  sections: [                    // EIN Eintrag pro Unterkapitel des Skripts (z.B. 2.1, 2.2, 2.3)
    {
      num:"2.1",                 // Kapitelnummer (string)
      title:"Tabellarische und grafische Darstellung",
      intro:"Kurzer Teaser-Satz (HTML erlaubt).",   // optional
      blocks: [ /* siehe Block-Typen */ ]
    },
    // ...
  ],
  quiz: [                        // >= 5 Fragen pro Lektion (Multiple-Choice)
    { q:"Fragetext (HTML/Mathe erlaubt)", options:["A","B","C","D"], correct:1,
      explain:"Warum B richtig ist." },
    // ...
  ]
});
```

## Block-Typen (Array `section.blocks`)

| `t` | Felder | Zweck |
|-----|--------|-------|
| `p` | `html`, optional `lead:true` | Fließtext-Absatz (HTML + Inline-Mathe via `\\( ... \\)`) |
| `h` | `text`, optional `icon` | Zwischenüberschrift (H2) |
| `sub` | `html` oder `text` | kleinere Überschrift (teal) |
| `list` | `items:[html...]`, optional `ordered:true` | Aufzählung |
| `def` | `term`, `html`, optional `title` | **Definitions-Box** (Gold) – wichtige Begriffe |
| `example` | `html`, optional `title` | **Beispiel-Box** (Teal) – Durchrechnungen |
| `why` | `html`, optional `title` | „Warum brauche ich das?"-Box (Blau) |
| `aha` | `html`, optional `title` | **Aha-Moment**-Box (Analogie/Witz/Alltag) |
| `warn` | `html`, optional `title`,`tag` | Achtung/Stolperfalle (Rot) |
| `quote` | `html`, `source` | „Originalton Prof. Bornewasser-Hermes" |
| `formula` | `tex` (OHNE `\\[ \\]`), optional `caption` | hervorgehobene Formel (display) |
| `table` | `headers:[...]`, `rows:[[...]]`, optional `caption`,`compact:true`,`highlight:[rowIdx]` | Datentabelle |
| `widget` | `title`, optional `icon`,`hint`, **`render:(el,ctx)=>{}}`** | interaktives Element |
| `divider` | – | Trennlinie |
| `html` | `html` | beliebiges HTML (Notausgang) |

**Mathe:** In `tex` (formula/formulas) KEINE Delimiter. In `html`-Feldern Inline-Mathe mit `\\( ... \\)`
(im JS-String **doppelter** Backslash: `"... \\(\\bar{x}\\) ..."`). Display-Mathe in html: `\\[ ... \\]`.

**Zahlen:** Deutsche Schreibweise (Komma). In Fließtext direkt als Text ("3,14"). In Widgets immer
`ctx.fmt.a(x)` / `ctx.fmt.n(x,d)` benutzen.

## Widget-Vertrag

`render` bekommt `(el, ctx)`:
- `el` = Mount-Container (leeres `<div>`), hänge dein UI hier rein.
- `ctx` enthält: `el, Stats, Plot, fmt, makeChart, Chart, onCleanup, PAL, typeset, clamp, range, parseNums, niceTicks`.
- `ctx.el(tag, attrs, ...kids)` – DOM-Helfer. attrs: `class, html, text, style(obj), on<Event>(fn)`, sonst Attribut.
- Nutze die **fertigen CSS-Klassen** (kein eigenes `<style>` nötig):
  `ctrl-row, ctrl (mit <label> + .val), input[type=range], btn / btn.primary / btn.ghost, btn-row,
   chips/chip(.active), readout, stat(.teal/.violet/.good/.blue) > .v + .l, steps>.step(>.sk),
   canvas-wrap, widget-hint, tbl-wrap + table.data`.
- Wenn du MathJax in dynamisch eingefügtem HTML brauchst: `ctx.typeset()` nach dem Einfügen aufrufen.
- Bei Chart.js: **immer** `ctx.makeChart(canvas, config)` (auto-cleanup). Bei `Plot`: `const p=ctx.Plot(el,opts); ctx.onCleanup(()=>p.destroy());`
- Responsiv: Plot/Chart passen sich an; setze für Chart.js `options.responsive=true, maintainAspectRatio:false` und gib dem Canvas-Wrapper eine Höhe.

### `ctx.Stats` (alle Berechnungen hierüber – nicht selbst implementieren!)
```
sum(a) mean(a) median(a) quantile(a,p) mode(a)->{values,count}
variance(a)[n-1] variancePop(a)[n] sd(a) sdPop(a) cv(a) range(a) iqr(a)
ranks(a) covariance(x,y) pearson(x,y) spearman(x,y) spearmanSimple(x,y)
regression(x,y)->{a,b,r,r2}
chiSquare(obs2D)->{chi2,N,C,Cmax,Ccorr,exp,rowSums,colSums,df}
erf(x) gammaln(x) factorial(n) choose(n,k) gammp(a,x) chiSquareCdf(x,k) betai(a,b,x)
normalPdf(x,mu=0,s=1) normalCdf(x,mu=0,s=1) normalInv(p)
tPdf(x,df) tCdf(x,df) tQuantile(p,df)
binomPmf(k,n,p) binomCdf(k,n,p) poissonPmf(k,l) poissonCdf(k,l)
expPdf(x,l) expCdf(x,l) uniPdf(x,a,b) uniCdf(x,a,b) sortAsc(a)
```
Hinweis Quantile: Shell nutzt die **deutsche/Bamberg-Methode** (pos=n·p; ganzzahlig→Mittel von x_(pos),x_(pos+1);
sonst x_(⌈pos⌉)). Prüfe am Skript-Beispiel, ob das passt; wenn das Skript anders rechnet, rechne im Widget
explizit nach und erkläre die Methode.

### `ctx.Plot(container, opts)` – Canvas-Plotter für eigene Visualisierungen
```
opts: {xmin,xmax,ymin,ymax, padL,padR,padT,padB, height, bg, grid}
P.clear()  P.axes({xticks,yticks,xlabel,ylabel,xfmt,yfmt})
P.func(f,{color,width,n})  P.area(f,x0,x1,{color,n})
P.line(pts,{color,width,dash})  P.vline(x,{...})  P.hline(y,{...})
P.points(pts,{color,r,stroke})  P.bars([{x0,x1,h,color}],{stroke})
P.text(x,y,str,{align,baseline,color,px})   // px:true => x,y sind Pixel
P.X(x) P.Y(y) P.invX(px) P.invY(py)  P.w() P.h()  P.setX(a,b) P.setY(a,b)
P.pointer(evt)->{px,py,x,y}    // Maus/Touch -> Datenkoordinaten (für Drag)
P.cv (Canvas)  P.ctx (2D)  P.onResize=fn  P.resize()  P.destroy()
```
Muster „neu zeichnen": eine `draw()`-Funktion schreiben, bei Slider-`input` und `P.onResize=draw` aufrufen.
Drag-Punkte: `P.cv.addEventListener('pointerdown'/'pointermove'/'pointerup', e=>{const {x,y}=P.pointer(e); ...})`.

`ctx.PAL`: `{gold,teal,violet,blue,good,bad, set:[...8 Farben]}` für konsistente Farben.

## Inhalts-Qualität (Pflicht je Unterkapitel)
1. Kernaussage in **eigenen Worten** (kein Copy-Paste), kurze Absätze, gute Überschriften.
2. Wichtigste **Definitionen** als `def`-Box (mit Skript-Bezug).
3. **Alle relevanten Formeln** als `formula`-Block, sauber in LaTeX.
4. Das **Leitbeispiel aus dem Skript** nachgespielt (`example`-Box, echte Zahlen aus dem PDF), möglichst
   mit schrittweiser Berechnung (`steps` im Widget oder als Liste).
5. Mind. ein **Aha-Moment** (`aha`) – Analogie, Witz oder Alltagsbeispiel.
6. Sinnvolle **„Warum brauche ich das?"**-Box (`why`).
7. Gern ein **Originalton-Zitat** (`quote`) aus dem Skript.
8. Das/die geforderten **interaktiven Widgets** für diesen Abschnitt (siehe Aufgabenliste der Lektion).

**Stil:** Schreibe für jemanden, der Statistik lernen *muss*, aber nicht *will*. Trockenheit mit Humor
und Kontext aufbrechen. Fachlich exakt, aber zugänglich. Deutsch durchgängig.

## Technische Checks vor „fertig"
- `node --check build/lektionN.js` läuft fehlerfrei.
- Modul ist in IIFE gewickelt, ruft genau einmal `App.registerLesson`.
- Alle Unterkapitel des Skripts sind als `sections` vorhanden.
- Quiz hat ≥ 5 Fragen mit korrektem `correct`-Index und `explain`.
- Alle geforderten Widgets sind implementiert und rechnen korrekt (über `ctx.Stats`).
