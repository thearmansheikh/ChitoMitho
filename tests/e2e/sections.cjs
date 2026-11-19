// Groceries, gifts and liquor sections. Reads only; writes nothing to the database.
//   Liquor OFF (the live default):  BASE=https://chitomitho.vercel.app node tests/e2e/sections.cjs
//   Liquor ON  (local sample mode, see README of the task): LIQUOR=on BASE=http://localhost:3400 node tests/e2e/sections.cjs
// LOCALE=ne for Nepali.
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const NE = (process.env.LOCALE || "en") === "ne";
const ON = (process.env.LIQUOR || "off") === "on";
const EMPTY_MODE = process.env.EMPTY === "1"; // shelves have no items (local sample mode with PREVIEW_EMPTY_SHELVES=1)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 400) : "")); };
const NOTE = NE ? "१८+ मात्र। ढोकामा परिचयपत्र जाँचिन्छ।" : "18+ only. ID checked at the door.";
const SOON = NE ? "रक्सी डेलिभरी छिट्टै आउँदैछ" : "Liquor delivery is coming soon";
const EMPTY = NE ? "यो भागका सामानहरू थपिँदैछन्" : "Items for this section are being added";
const BEER = /Beer 650ml|बियर ६५० एमएल/;
const COUNT = (text, re) => (text.match(re) || []).length;

(async () => {
  const headers = { cookie: `NEXT_LOCALE=${NE ? "ne" : "en"}` };
  const html = async (p) => { const r = await fetch(BASE + p, { headers, redirect: "manual" }); return { status: r.status, text: await r.text() }; };
  const visibleHtml = (s) => s.split("</script>").map((part) => part.split("<script")[0]).join(""); // what is on the page itself, not the script data

  // ----- the page's own HTML, before any script runs -----
  const liq = await html("/liquor");
  ok("/liquor: server HTML has exactly one h1", COUNT(liq.text, /<h1[\s>]/g) === 1, String(COUNT(liq.text, /<h1[\s>]/g)));
  if (ON) {
    ok("/liquor (on): the 18+ line is in the HTML before any script", liq.text.includes(NOTE));
    ok("/liquor (on): the beer items are NOT on the page before the gate", !BEER.test(visibleHtml(liq.text)));
  } else {
    ok("/liquor (off): says liquor is coming soon", liq.text.includes(SOON), liq.text.slice(0, 200));
    ok("/liquor (off): asks search engines not to index it", /<meta name="robots" content="noindex/.test(liq.text));
    const dr = await html("/p/drinks");
    ok("/p/drinks (off): the liquor shelf page does not exist", dr.status === 404, String(dr.status));
  }

  const home = await html("/");
  const sm = await (await fetch(BASE + "/sitemap.xml")).text();
  const liqLinks = COUNT(home.text, /href="\/liquor"/g);
  ok(`Home, header and footer: /liquor links are ${ON ? "present" : "absent"} (found ${liqLinks})`, ON ? liqLinks >= 1 : liqLinks === 0);
  ok(`Sitemap: /liquor is ${ON ? "listed" : "left out"}`, /\/liquor</.test(sm) === ON);
  if (!ON) ok("Sitemap: the drinks shelf is left out", !/\/p\/drinks/.test(sm));

  for (const path of ["/groceries", "/gifts"]) {
    const r = await html(path);
    ok(`${path}: exactly one h1 in the HTML`, COUNT(r.text, /<h1[\s>]/g) === 1);
  }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  if (NE) await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
  const go = async (p) => { await page.goto(BASE + p, { waitUntil: "networkidle2", timeout: 90000 }); await sleep(900); };
  const main = () => page.$eval("main", (m) => m.innerText);

  // A category with nothing in it must never be shown as an empty heading.
  const emptyGroups = () => page.$$eval("main div.scroll-mt-32", (ds) => ds.filter((d) => d.querySelectorAll("li").length === 0).length);
  await go("/groceries");
  const g = await main();
  ok("Groceries: no category is shown empty", (await emptyGroups()) === 0);
  ok("Groceries: the shopping list box is still there", (await page.$$("main textarea")).length >= 1);
  if (EMPTY_MODE) {
    ok("Groceries (no items yet): says so kindly", g.includes(EMPTY), g.slice(0, 300));
    ok("Groceries (no items yet): offers a WhatsApp button", (await page.$$("main a[href*='api.whatsapp.com']")).length >= 1);
    ok("Groceries (no items yet): no category names are listed", !/Vegetables|Fruits|Dairy|तरकारी|फलफूल/.test(g), g.slice(0, 300));
  }

  await go("/gifts");
  const gi = await main();
  ok("Gifts: no category is shown empty", (await emptyGroups()) === 0);
  if (EMPTY_MODE) ok("Gifts (no items yet): says so kindly", gi.includes(EMPTY), gi.slice(0, 300));

  if (ON) {
    await go("/liquor");
    await page.evaluate("localStorage.removeItem('cm-age-ok')");
    await go("/liquor");
    const gate = await main();
    ok("Liquor: the age question is visible", /18/.test(gate) && !!(await page.$("[role=dialog]")));
    ok("Liquor: the 18+ line is visible on the page", gate.includes(NOTE));
    ok("Liquor: no items are visible before saying yes", !BEER.test(gate));
    await (await page.$("[role=dialog] button")).click(); await sleep(800);
    const after = await main();
    ok("Liquor: after yes, the items show", BEER.test(after), after.slice(0, 300));
    ok("Liquor: still exactly one h1 after the gate", (await page.$$("h1")).length === 1);
    ok("Liquor: the answer is remembered on this device", (await page.evaluate("localStorage.getItem('cm-age-ok')")) === "1");
    await go("/liquor");
    ok("Liquor: coming back later does not ask again", !(await page.$("[role=dialog]")) && BEER.test(await main()));
    await go("/p/drinks");
    ok("Liquor shelf page also shows the 18+ line", (await main()).includes(NOTE));
    await page.evaluate("localStorage.removeItem('cm-age-ok')");
    await go("/p/drinks");
    ok("Liquor shelf page is gated for a new visitor", !!(await page.$("[role=dialog]")));
    await go("/liquor");
    const no = await page.$$("[role=dialog] a");
    await no[0].click();
    await page.waitForFunction(() => location.pathname === "/", { timeout: 10000 }).catch(() => {});
    ok("Liquor: 'No' takes the visitor back home", new URL(page.url()).pathname === "/", page.url());
  } else {
    await go("/liquor");
    ok("Liquor (off): the page shows 'coming soon' and no gate", (await main()).includes(SOON) && !(await page.$("[role=dialog]")));
    const nav = await page.$$eval("header a, footer a", (as) => as.map((a) => a.getAttribute("href")));
    ok("Liquor (off): no link to it in header or footer", !nav.includes("/liquor"));
  }
  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
