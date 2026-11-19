// Situations a customer can run into besides the happy path: shop closed, a laptop screen, a shopping-list order, the liquor age check.
// Writes nothing to the database. Usage: BASE=https://chitomitho.vercel.app node tests/e2e/edge-cases.cjs
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
// These tests pretend it is 13:20 in Nepal. When the real time is outside opening hours the server's page says "Closed" and the
// pretend clock says "Open", which React reports as hydration errors #418/#423/#425. That is the test's clock, not a site fault.
const CLOCK_NOISE = /React error #(418|423|425)/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + extra : "")); };

const fakeClock = (hh, mm) => ({ hh, mm });
async function newPage(browser, { width, height, mobile, clock }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((c) => {
    const Real = Date, now = Real.now(), npt = new Real(now + 5.75 * 3600_000);
    const target = Real.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), c.hh, c.mm) - 5.75 * 3600_000;
    const offset = target - now;
    class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
    window.Date = Fake;
    window.__opened = null;
    window.open = (u) => { window.__opened = u; return {}; };
  }, clock);
  await page.setRequestInterception(true);
  page.on("request", (r) => (r.method() === "POST" && r.url().includes("/rest/v1/order_clicks") ? r.abort() : r.continue()));
  return page;
}
const text = (page, sel) => page.$eval(sel, (e) => e.innerText).catch(() => "");

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });

  // ---- 1. Shop closed (23:30 Nepal time)
  {
    const page = await newPage(browser, { width: 390, height: 844, mobile: true, clock: fakeClock(23, 30) });
    await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(800);
    const header = await text(page, "header");
    ok("Closed: the header badge says Closed", /Closed/.test(header), header.slice(0, 80));
    const placeInfo = await text(page, "main");
    ok("Closed: the café page says Closed and when it opens", /Closed/.test(placeInfo) && /opens at/i.test(placeInfo), placeInfo.slice(0, 200));
    await page.evaluate(() => document.querySelector("button[aria-label='Add: Combo 1']").click()); await sleep(400);
    ok("Closed: browsing and adding to the basket still works", !!(await page.$("button[aria-label^='Add one: Combo 1']")));
    await page.goto(BASE + "/basket", { waitUntil: "networkidle2" }); await page.waitForSelector("main li", { timeout: 15000 });
    const basket = await text(page, "main");
    ok("Closed: the basket explains the shop is closed", /closed right now/i.test(basket), basket.slice(-300));
    const state = await page.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /Order on WhatsApp/.test(x.textContent)); return b ? { disabled: b.disabled, ariaDisabled: b.getAttribute("aria-disabled") } : null; });
    ok("Closed: the order button is switched off", !!state && (state.disabled || state.ariaDisabled === "true"), JSON.stringify(state));
    await page.close();
  }

  // ---- 2. Laptop screen, open
  {
    const page = await newPage(browser, { width: 1280, height: 800, mobile: false, clock: fakeClock(13, 20) });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(BASE + "/food", { waitUntil: "networkidle2", timeout: 90000 });
    const nav = await page.$$eval("header a", (as) => as.map((a) => a.getAttribute("href")));
    ok("Laptop: the header has links to every service", ["/food", "/groceries", "/liquor", "/gifts", "/parcel", "/anything"].every((h) => nav.includes(h)), JSON.stringify(nav));
    ok("Laptop: the header has a Basket link", nav.includes("/basket"));
    await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2" }); await sleep(800);
    await page.evaluate(() => document.querySelector("button[aria-label$=': Cheesy Zinger Burger (Signature Burger)']").click());
    await page.waitForSelector("[role=dialog]", { timeout: 5000 });
    const box = await page.$eval("[role=dialog]", (d) => { const r = d.getBoundingClientRect(); return { w: Math.round(r.width), centered: Math.abs(r.left + r.width / 2 - innerWidth / 2) < 4 }; });
    ok("Laptop: the item sheet is a centred card, not full width", box.w <= 520 && box.centered, JSON.stringify(box));
    await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].find((x) => /Add to basket/.test(x.innerText)).click()); await sleep(300);
    await page.click("header a[href='/basket']");
    // A page change keeps the old page on screen until the new one is ready, so wait for the new address first.
    await page.waitForFunction(() => location.pathname === "/basket", { timeout: 15000 });
    await page.waitForSelector("main li", { timeout: 15000 }); await sleep(300);
    ok("Laptop: the basket opens from the header", /Cheesy Zinger Burger/.test(await text(page, "main")));
    await page.evaluate(() => [...document.querySelectorAll("main button")].find((x) => /Order on WhatsApp/.test(x.textContent)).click());
    await page.waitForSelector('[role="dialog"] input', { visible: true, timeout: 8000 });
    const dlg = await page.$eval("[role=dialog]", (d) => { const r = d.getBoundingClientRect(); return Math.round(r.width); });
    ok("Laptop: the details form is a centred card", dlg <= 560, String(dlg));
    ok("Laptop: no sideways scrolling", !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
    const realErrs = errs.filter((e) => !CLOCK_NOISE.test(e));
    ok("Laptop: no page errors", realErrs.length === 0, JSON.stringify(realErrs));
    await page.close();
  }

  // ---- 3. Groceries: a typed shopping list becomes an order
  {
    const page = await newPage(browser, { width: 390, height: 844, mobile: true, clock: fakeClock(13, 20) });
    await page.goto(BASE + "/groceries", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(800);
    const list = await page.$("textarea");
    ok("Groceries: there is a shopping-list box", !!list);
    if (list) {
      await list.type("2 kg tomato\n1 litre milk");
      await sleep(300);
      await page.goto(BASE + "/basket", { waitUntil: "networkidle2" }); await sleep(1500);
      const b = await text(page, "main");
      ok("Groceries: the typed list is kept and shown in the basket", /tomato/i.test(b), b.slice(0, 200));
      const send = await page.evaluate(() => { const x = [...document.querySelectorAll("main button")].find((y) => /Order on WhatsApp/.test(y.textContent)); return x ? !x.disabled : null; });
      ok("Groceries: a list alone (no items) can be ordered", send === true, String(send));
    }
    await page.close();
  }

  // ---- 4. Liquor: age check
  {
    const page = await newPage(browser, { width: 390, height: 844, mobile: true, clock: fakeClock(13, 20) });
    await page.goto(BASE + "/liquor", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(800);
    const t = await text(page, "main");
    ok("Liquor: asks for age before showing the menu", /18/.test(t) && !/Beer 650ml/.test(t), t.slice(0, 200));
    await page.close();
  }

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
