// The EN / नेपाली toggle: it switches the whole page, sets <html lang>, is remembered, and names fall back to English.
// Reads only; writes nothing to the database.   Usage: BASE=https://chitomitho.vercel.app node tests/e2e/language-toggle.cjs
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 400) : "")); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const lang = () => page.$eval("html", (h) => h.lang);
  const body = () => page.$eval("body", (b) => b.innerText);
  const press = (label) => page.evaluate((l) => { const b = [...document.querySelectorAll("header [aria-pressed]")].find((x) => x.textContent.trim() === l); b.click(); }, label);
  const devanagari = (s) => (s.match(/[\u0900-\u097F]/g) || []).length;

  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1200);
  ok("A first-time visitor gets English, <html lang='en'>", (await lang()) === "en" && devanagari(await page.$eval("main", (m) => m.innerText)) < 5);
  ok("Toggle: EN is marked selected", await page.$eval("header button[aria-pressed=true]", (b) => b.textContent.trim() === "EN"));

  await press("नेपाली");
  await page.waitForFunction(() => document.documentElement.lang === "ne", { timeout: 15000 }).catch(() => {});
  await sleep(800);
  ok("Tapping नेपाली switches <html lang> to 'ne'", (await lang()) === "ne", await lang());
  const neMain = await page.$eval("main", (m) => m.innerText);
  ok("The page itself is now in Nepali (no reload by hand)", devanagari(neMain) > 100, String(devanagari(neMain)));
  ok("Toggle: नेपाली is marked selected", await page.$eval("header button[aria-pressed=true]", (b) => b.textContent.trim() === "नेपाली"));
  const cookie = (await page.cookies()).find((c) => c.name === "NEXT_LOCALE");
  ok("The choice is saved in a cookie for about a year", !!cookie && cookie.value === "ne" && cookie.expires > Date.now() / 1000 + 300 * 86400, JSON.stringify(cookie));

  // moving around keeps Nepali
  await page.evaluate(() => document.querySelector("a[href='/food']").click());
  await page.waitForFunction(() => location.pathname === "/food", { timeout: 15000 });
  await sleep(1000);
  ok("Going to another page keeps Nepali", (await lang()) === "ne" && devanagari(await body()) > 50);
  await page.reload({ waitUntil: "networkidle2" }); await sleep(800);
  ok("A reload keeps Nepali", (await lang()) === "ne");
  const page2 = await browser.newPage();
  await page2.goto(BASE + "/about", { waitUntil: "networkidle2", timeout: 90000 });
  ok("A new tab (same browser) is Nepali straight away: remembered", (await page2.$eval("html", (h) => h.lang)) === "ne");
  await page2.close();

  // names: a Nepali name is used when there is one, English otherwise
  await page.goto(BASE + "/food", { waitUntil: "networkidle2" }); await sleep(900);
  const food = await page.$eval("main", (m) => m.innerText);
  ok("Place with a Nepali name (Swad Restro) shows it in Nepali", /स्वाद रेस्ट्रो/.test(food), food.slice(0, 200));
  ok("Place with no Nepali name (Anzee's Cafe & Bakery) falls back to English, not blank", /Anzee's Cafe & Bakery/.test(food), food.slice(0, 300));
  await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2" }); await sleep(1200);
  const menu = await page.$eval("main", (m) => m.innerText);
  ok("Menu items with no Nepali name show their English name (nothing is blank)", /Combo 1/.test(menu), menu.slice(0, 200));
  ok("Prices are still shown in Nepali pages", /Rs\.|रु/.test(menu));

  // back to English
  await press("EN");
  await page.waitForFunction(() => document.documentElement.lang === "en", { timeout: 15000 }).catch(() => {});
  await sleep(800);
  ok("Tapping EN switches back: <html lang='en'>", (await lang()) === "en");
  ok("…and the page is English again", devanagari(await page.$eval("main", (m) => m.innerText)) < 30);

  // the Nepali order message
  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
