/* Headless smoke test: load index.html in real Chrome, walk every route,
   assert no console/page errors and that views + widgets render.
   Usage: node smoketest.mjs */
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

const indexPath = path.resolve("index.html");
const url = pathToFileURL(indexPath).href;

const errors = [];
const warnings = [];

const browser = await puppeteer.launch({ executablePath: exe, headless: "new", args: ["--no-sandbox","--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 850 });

page.on("console", msg => {
  const t = msg.type();
  if (t === "error") errors.push("CONSOLE: " + msg.text());
  if (t === "warning" && /MathJax|Chart/i.test(msg.text())) warnings.push("WARN: " + msg.text());
});
page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
page.on("requestfailed", r => {
  const u = r.url();
  if (/cdn|jsdelivr|mathjax|chart/i.test(u)) warnings.push("CDN-FAIL: " + u + " (" + (r.failure()?.errorText) + ")");
});

await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForFunction("typeof LESSONS !== 'undefined' && LESSONS.length>0", { timeout: 15000 });

const lessons = await page.evaluate(() => LESSONS.map(L => ({
  id: L.id, title: L.title, nSec: L.sections.length,
  nQuiz: (L.quiz||[]).length, nForm: (L.formulas||[]).length,
  secs: L.sections.map(s => ({num:s.num, title:s.title, nBlocks:s.blocks.length,
     nWidgets:s.blocks.filter(b=>b.t==='widget').length})),
})));

const routes = [];
routes.push({ hash:"#/", name:"Dashboard" });
for (const L of lessons) {
  for (let i=1;i<=L.nSec;i++) routes.push({ hash:`#/l/${L.id}/${i}`, name:`L${L.id}.${i} ${L.secs[i-1].title}` });
  if (L.nQuiz) routes.push({ hash:`#/quiz/${L.id}`, name:`Quiz L${L.id}` });
}
routes.push({ hash:"#/formelsammlung", name:"Formelsammlung" });

let widgetErrs = 0, emptyViews = 0;
for (const r of routes) {
  const before = errors.length;
  await page.evaluate(h => { location.hash = h; }, r.hash);
  await new Promise(res => setTimeout(res, 220)); // let render + widget microtasks run
  const info = await page.evaluate(() => {
    const main = document.querySelector("#main");
    const txt = main ? main.innerText.length : 0;
    const widgetErr = [...document.querySelectorAll(".widget-body .muted")]
        .filter(e => /Widget-Fehler/.test(e.textContent)).map(e=>e.textContent);
    const canvases = document.querySelectorAll("#main canvas").length;
    return { txt, widgetErr, canvases };
  });
  if (info.txt < 30) { emptyViews++; errors.push(`EMPTY VIEW: ${r.hash} (${r.name})`); }
  if (info.widgetErr.length) { widgetErrs += info.widgetErr.length; info.widgetErr.forEach(w=>errors.push(`WIDGET ERR @${r.hash}: ${w}`)); }
  const newErr = errors.length - before;
  process.stdout.write((newErr? "✗" : "·"));
}
process.stdout.write("\n");

// mobile check
await page.setViewport({ width: 390, height: 800 });
await page.evaluate(()=>{location.hash="#/l/1/1";});
await new Promise(res=>setTimeout(res,200));
const overflow = await page.evaluate(()=> document.documentElement.scrollWidth > window.innerWidth + 2 ? document.documentElement.scrollWidth : 0);
if (overflow) warnings.push(`MOBILE H-OVERFLOW: scrollWidth=${overflow} > 390`);

await browser.close();

console.log("\n===== LESSON SUMMARY =====");
for (const L of lessons) {
  const widgets = L.secs.reduce((s,x)=>s+x.nWidgets,0);
  console.log(`L${L.id} "${L.title}": ${L.nSec} Kap., ${widgets} Widgets, ${L.nForm} Formeln, Quiz ${L.nQuiz}`);
  for (const s of L.secs) console.log(`   ${s.num} ${s.title} — ${s.nBlocks} Blöcke, ${s.nWidgets} Widget(s)`);
}
console.log("\n===== RESULT =====");
console.log(`Routes tested: ${routes.length} | empty views: ${emptyViews} | widget errors: ${widgetErrs}`);
if (warnings.length){ console.log("\nWARNINGS:"); warnings.forEach(w=>console.log("  - "+w)); }
if (errors.length){ console.log("\nERRORS ("+errors.length+"):"); errors.slice(0,60).forEach(e=>console.log("  ✗ "+e)); process.exit(1); }
console.log("\n✓ No errors. All views render, all widgets mount.");
