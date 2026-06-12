/* Verifikation der gemeldeten Bugs:
   1) Themenwechsel muss OBEN auf der neuen Seite landen (scrollY ≈ 0),
      auch wenn man unten auf der alten Seite den "weiter"-Button klickt.
   2) Interaktive Elemente (Buttons/Chips/Quiz-Optionen) müssen auf Klicks
      reagieren, ohne Fehler zu werfen.
   Usage: node verify_fixes.mjs */
import puppeteer from "puppeteer-core";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const exe = CHROME_CANDIDATES.find(p => fs.existsSync(p));
if (!exe) { console.error("No browser found"); process.exit(2); }

const url = pathToFileURL(path.resolve("index.html")).href;
const fails = [];
const errors = [];

const browser = await puppeteer.launch({ executablePath: exe, headless: "new", args: ["--no-sandbox", "--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 850 });
page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
page.on("console", m => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });

await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction("typeof LESSONS !== 'undefined' && LESSONS.length>0", { timeout: 15000 });
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Test 1: Scroll-Position nach Themenwechsel ---------- */
// Für jede Lektion: Abschnitt 1 öffnen, ganz nach unten scrollen,
// den "weiter"-Link in .sec-nav wirklich anklicken, prüfen: scrollY ≈ 0.
const nLessons = await page.evaluate(() => LESSONS.length);
for (let lid = 1; lid <= nLessons; lid++) {
  await page.evaluate(l => { location.hash = `#/l/${l}/1`; }, lid);
  await sleep(600); // Widgets + MathJax rendern lassen
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(150);
  const before = await page.evaluate(() => window.scrollY);
  const clicked = await page.evaluate(() => {
    const links = [...document.querySelectorAll(".sec-nav a")];
    const next = links[links.length - 1];
    if (!next || !next.getAttribute("href")) return false;
    next.click();
    return true;
  });
  if (!clicked) { fails.push(`L${lid}: kein weiter-Link in .sec-nav gefunden`); continue; }
  await sleep(500);
  const after = await page.evaluate(() => window.scrollY);
  const ok = after < 60;
  if (!ok) fails.push(`L${lid}: nach Themenwechsel scrollY=${after} (vorher ${before}) — landet NICHT oben`);
  process.stdout.write(ok ? "·" : "✗");
}
process.stdout.write("\n");

/* ---------- Test 2: Klick-Smoke über alle Widgets ---------- */
// Jede Route besuchen, alle sichtbaren .btn/.chip in Widgets anklicken,
// danach: keine neuen page errors.
const routes = await page.evaluate(() => {
  const r = [];
  LESSONS.forEach(L => { L.sections.forEach((s, i) => r.push(`#/l/${L.id}/${i + 1}`)); });
  return r;
});
let clickedTotal = 0;
for (const h of routes) {
  await page.evaluate(hh => { location.hash = hh; }, h);
  await sleep(450);
  const before = errors.length;
  const n = await page.evaluate(() => {
    let n = 0;
    const els = [...document.querySelectorAll("#main .widget .btn, #main .widget .chip")];
    for (const e of els.slice(0, 40)) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      e.click(); n++;
    }
    return n;
  });
  clickedTotal += n;
  await sleep(150);
  if (errors.length > before) fails.push(`${h}: ${errors.length - before} Fehler nach Klicks: ${errors.slice(before).join(" | ")}`);
  process.stdout.write(errors.length > before ? "✗" : "·");
}
process.stdout.write(`\n${clickedTotal} Klicks ausgeführt.\n`);

/* ---------- Test 3: Quiz reagiert auf Klick ---------- */
await page.evaluate(() => { location.hash = "#/quiz/1"; });
await sleep(500);
const quizOk = await page.evaluate(() => {
  const opt = document.querySelector(".q-block .opt");
  if (!opt) return "keine Quiz-Option gefunden";
  opt.click();
  const marked = document.querySelector(".q-block .opt.correct, .q-block .opt.wrong");
  return marked ? true : "Klick auf Quiz-Option zeigt kein Feedback";
});
if (quizOk !== true) fails.push("Quiz L1: " + quizOk);

await browser.close();

console.log("\n===== VERIFY RESULT =====");
if (fails.length) { console.log("FEHLGESCHLAGEN:"); fails.forEach(f => console.log("  ✗ " + f)); process.exit(1); }
console.log(`✓ Scroll-Fix wirkt (alle ${nLessons} Lektionen), ${clickedTotal} Widget-Klicks ohne Fehler, Quiz reagiert.`);
