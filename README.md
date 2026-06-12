# Statistik BSTA01-02 — Interaktive Lernapp

Eine vollständige, interaktive Weblernapp für das IU-Statistikmodul **BSTA01-02**
(„Statistik", Prof. Dr. Heike Bornewasser-Hermes). Sie deckt das gesamte Skript von
**Lektion 1 bis Lektion 8** inhaltlich ab – mit Erklärungen in Klartext, allen Formeln
(MathJax), den Original-Beispielen aus dem Skript und **interaktiven Simulationen zu jedem
Unterkapitel**.

> **Eine einzige Datei:** `index.html`. Kein Backend, kein Build-Schritt zum Ausführen.
> Läuft per Doppelklick im Browser und unverändert auf GitHub Pages.

## Schnellstart

- **Lokal:** `index.html` doppelklicken (oder im Browser öffnen). Eine Internetverbindung
  wird einmalig für die CDN-Bibliotheken (MathJax, Chart.js) benötigt.
- **Online (GitHub Pages):**
  1. Repository auf GitHub anlegen und `index.html` hochladen (push).
  2. *Settings → Pages → Build and deployment → Source: „Deploy from a branch"*, Branch
     `main`, Ordner `/ (root)`.
  3. Nach ein paar Minuten ist die App unter `https://<dein-name>.github.io/<repo>/` erreichbar.

## Funktionen

- **8 Lektionen** mit allen Unterkapiteln, Definitions-, Beispiel-, „Warum brauche ich das?"-
  und Aha-Boxen sowie Originalton-Zitaten aus dem Skript.
- **~29 interaktive Widgets**, u. a. Skalenniveau-Sortierer, Lagemaße- & Streuungsrechner,
  Histogramm-/Boxplot-Builder, Korrelations- & Regressions-Scatter (mit Drag),
  Kontingenz-/χ²-Rechner, Würfel- & Bayes-Simulationen, Normal-/Binomial-/Poisson-Explorer,
  Konfidenzintervall-Simulation und ein Hypothesentest-Wizard.
- **Formeln** sauber via MathJax; eigene **Formelsammlung** inkl. der z- und t-Tabellen
  (numerisch exakt berechnet). Sie stimmen mit der Skript-Tabelle überein – mit zwei bewusst
  korrigierten Druckfehlern des Skripts (Φ(1,95) = 0,9744 statt 0,9929; z₀,₉₉₅ = 2,5758 statt
  2,5788), jeweils per Hinweis an der Tabelle ausgewiesen.
- **Quiz** pro Lektion (Multiple-Choice, sofortiges Feedback, „bestanden" ab 80 %).
- **Lernfortschritt** wird lokal im Browser gespeichert (`localStorage`) — pro Unterkapitel
  und Quiz, mit Fortschrittsanzeige in der Seitenleiste und oben.
- **Dunkles, akademisches Design**, mobil-optimiert, mit animierten Übergängen.

## Technik

- Single-File-SPA: Inline-CSS + Inline-JS, externe Libs nur per CDN (MathJax 3, Chart.js 4).
- Hash-Router (`#/l/<lektion>/<kapitel>`, `#/quiz/<lektion>`, `#/formelsammlung`).
- Eigene Statistik-Bibliothek (Verteilungen, Korrelation, Regression, χ², t/z-Quantile)
  und ein Canvas-Plotter für die Visualisierungen.

## Projektstruktur (Entwicklung)

Die ausgelieferte App ist allein `index.html`. Sie wird aus modularen Quellen zusammengebaut:

```
index.html            ← Deliverable (zusammengebaut, single-file)
build/
  template.html       ← Shell: CSS, Framework, Stats-Bibliothek, Renderer, Quiz, Formelsammlung
  lektion1..8.js      ← je Lektion ein Modul (Inhalt + Widgets), folgt build/CONTRACT.md
  CONTRACT.md         ← Datenformat- & Widget-Vertrag der Lektion-Module
assemble.py           ← fügt die Module in die Shell ein  →  index.html
render_pages.py       ← rendert PDF-Seiten zu PNG (Entwicklungshilfe)
smoketest.mjs         ← Headless-Browser-Test (alle Views/Widgets fehlerfrei?)
```

Neu zusammenbauen: `python assemble.py` · Testen: `node smoketest.mjs`.

## Hinweis zum Skript

Das zugrunde liegende Skript (`Skript.pdf`) ist urheberrechtlich geschützt (© IU Internationale
Hochschule). Es ist – wie die daraus abgeleiteten Rohextrakte – **bewusst nicht** Teil dieses
Repositories (siehe `.gitignore`). Die App enthält eigenständige Erklärungen sowie kurze,
gekennzeichnete Zitate zu Studienzwecken.
