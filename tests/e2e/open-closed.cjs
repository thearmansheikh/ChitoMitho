// Open / Closed in Nepal time, in a real browser, with the clock frozen at the moments that matter.
// 09:59 closed, 10:00 open, 21:59 open, 22:00 closed. When closed the customer sees "Closed now · Opens ..." and can still order for later.
// Writes nothing to the database. Usage: BASE=https://chitomitho.vercel.app node tests/e2e/open-closed.cjs     (LOCALE=ne for Nepali)
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const NE = (process.env.LOCALE || "en") === "ne";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 500) : "")); };

const T = NE
  ? { open: /खुला/, closed: /बन्द/, notice: (when) => (when === "today" ? /अहिले बन्द · 10:00 मा खुल्छ/ : /अहिले बन्द · भोलि 10:00 मा खुल्छ/), later: /पछिको लागि अर्डर/, order: /व्हाट्सएपमा अर्डर/, outside: /10:00 र 22:00|10:00.*22:00/, delivery: /डेलिभरी|समय/, tomorrow: /भोलि/ }
  : { open: /Open now/, closed: /Closed/, notice: (when) => (when === "today" ? /Closed now · Opens 10:00/ : /Closed now · Opens tomorrow at 10:00/), later: /order for later/, order: /Order on WhatsApp/, outside: /between 10:00 and 22:00/, delivery: /Delivery:/, tomorrow: /Tomorrow/ };

/** The real Nepal date, so the frozen clock lands on "today" in Nepal. */
function nptMoment(h, m, s = 0) {
  const npt = new Date(Date.now() + (5 * 60 + 45) * 60_000);
  return Date.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), h, m, s) - (5 * 60 + 45) * 60_000;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const open = async (clockMs) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    if (NE) await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
    if (clockMs !== null) {
      await page.evaluateOnNewDocument((t) => {
        const R = Date;
        class Frozen extends R { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } }
        window.Date = Frozen;
        window.open = () => ({});
      }, clockMs);
    }
    await page.setRequestInterception(true);
    page.on("request", (r) => (r.method() === "POST" && r.url().includes("/rest/v1/order_clicks") ? r.abort() : r.continue()));
    return page;
  };
  const main = (page) => page.$eval("main", (m) => m.innerText).catch(() => "");
  const header = (page) => page.$eval("header", (m) => m.innerText).catch(() => "");

  const moments = [
    { label: "09:59", at: [9, 59], isOpen: false, when: "today", day: "today" },
    { label: "10:00", at: [10, 0], isOpen: true },
    { label: "21:59", at: [21, 59], isOpen: true },
    { label: "22:00", at: [22, 0], isOpen: false, when: "tomorrow", day: "tomorrow" },
  ];

  for (const mo of moments) {
    const page = await open(nptMoment(...mo.at));
    await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
    await page.evaluate("localStorage.clear()"); // every moment starts with an empty basket (the browser shares it between tabs)
    const head = await header(page);
    const home = await main(page);
    ok(`${mo.label}: the header badge says ${mo.isOpen ? "Open" : "Closed"}`, mo.isOpen ? T.open.test(head) : T.closed.test(head) && !T.open.test(head), head.slice(0, 120));
    if (mo.isOpen) {
      ok(`${mo.label}: no "closed" notice on the home page`, !/Closed now|अहिले बन्द/.test(home));
    } else {
      ok(`${mo.label}: the home page says "${NE ? "अहिले बन्द …" : "Closed now · Opens " + (mo.when === "today" ? "10:00" : "tomorrow at 10:00")}"`, T.notice(mo.when).test(home), home.slice(0, 300));
      ok(`${mo.label}: it says you can still order for later`, T.later.test(home), home.slice(0, 300));
    }

    // basket flow
    await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2" });
    await page.waitForSelector(NE ? "button[aria-label^='थप्नुहोस्']" : "button[aria-label='Add: Combo 1']", { timeout: 20000 });
    await page.evaluate(() => { const b = document.querySelector("button[aria-label='Add: Combo 1'], button[aria-label^='थप्नुहोस्']"); b.click(); });
    await sleep(500);
    await page.goto(BASE + "/basket", { waitUntil: "networkidle2" });
    await page.waitForSelector("main li", { timeout: 20000 });
    await sleep(600);
    const basket = await main(page);
    if (!mo.isOpen) ok(`${mo.label}: the basket also says it is closed and when it opens`, T.notice(mo.when).test(basket), basket.slice(-400));
    const enabled = await page.evaluate((src) => { const b = [...document.querySelectorAll("main button")].find((x) => new RegExp(src).test(x.textContent)); return b ? !b.disabled : null; }, T.order.source);
    ok(`${mo.label}: the order button is ${mo.isOpen ? "on" : "STILL ON (order for later)"}`, enabled === true, String(enabled));
    await page.evaluate((src) => { const b = [...document.querySelectorAll("main button")].find((x) => new RegExp(src).test(x.textContent)); b && b.click(); }, T.order.source);
    await page.waitForSelector('[role="dialog"] input', { visible: true, timeout: 10000 });
    await sleep(400);
    const radios = await page.$$eval('[role="dialog"] input[name="when"]', (rs) => rs.map((r) => ({ checked: r.checked, disabled: r.disabled })));
    if (mo.isOpen) {
      ok(`${mo.label}: "as soon as possible" is available and chosen`, radios[0] && radios[0].checked && !radios[0].disabled, JSON.stringify(radios));
    } else {
      ok(`${mo.label}: "as soon as possible" is switched off and "later" is chosen`, radios[0] && radios[0].disabled && !radios[0].checked && radios[1].checked, JSON.stringify(radios));
      const day = await page.$eval('[role="dialog"] select option:checked', (o) => o.value).catch(() => "");
      const daySel = await page.$$eval('[role="dialog"] select', (ss) => ss.map((s) => s.value));
      ok(`${mo.label}: the day is already ${mo.day}`, daySel.includes(mo.day), JSON.stringify(daySel));
      ok(`${mo.label}: the form tells the customer to pick a time for later`, new RegExp(NE ? "पछिको समय" : "choose a time for later").test(await page.$eval('[role="dialog"]', (d) => d.innerText)));

      // a time outside opening hours is refused
      await page.type('[role="dialog"] input[autocomplete="name"]', "Sita Rai");
      await page.type('[role="dialog"] input[type="tel"]', "9812345678");
      const areaVal = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.value);
      await page.evaluate((v) => { const s = document.querySelector('form[role="dialog"] select:not([name])') || [...document.querySelectorAll('form[role="dialog"] select')].find((x) => [...x.options].some((o) => o.value === v)); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set; set.call(s, v); s.dispatchEvent(new Event("change", { bubbles: true })); }, areaVal);
      await page.type('[role="dialog"] input[list="tole-suggestions"]', "Near Nabil Bank");
      const setTime = (v) => page.evaluate((val) => { const i = document.querySelector('[role="dialog"] input[type="time"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); }, v);
      await setTime("23:00");
      await page.click('form[role="dialog"] button:not([type])'); await sleep(400);
      const err = (await page.$$eval('[role="dialog"] [role="alert"]', (e) => e.map((x) => x.textContent))).join(" | ");
      ok(`${mo.label}: a time after closing (23:00) is refused with the opening hours`, T.outside.test(err), err);
      await setTime("11:00");
      await page.click('form[role="dialog"] button:not([type])');
      await page.waitForSelector("#review-title", { visible: true, timeout: 8000 }).catch(() => {});
      const msg = await page.$eval("[role='dialog'] pre", (e) => e.textContent).catch(() => "");
      ok(`${mo.label}: the order can be sent for later, and the message says when`, /11:00/.test(msg) && (mo.day === "tomorrow" ? T.tomorrow.test(msg) : true), msg.slice(0, 400));
    }
    await page.close();
  }

  // The badge must follow Nepal time, not this computer's time: compare with the real Nepal clock.
  {
    const page = await open(null);
    await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
    const real = new Date(Date.now() + (5 * 60 + 45) * 60_000);
    const mins = real.getUTCHours() * 60 + real.getUTCMinutes();
    const shouldBeOpen = mins >= 600 && mins < 1320;
    const head = await header(page);
    ok(`Real clock (Nepal ${String(real.getUTCHours()).padStart(2, "0")}:${String(real.getUTCMinutes()).padStart(2, "0")}): the badge says ${shouldBeOpen ? "Open" : "Closed"}`, shouldBeOpen ? T.open.test(head) : T.closed.test(head) && !T.open.test(head), head.slice(0, 100));
    await page.close();
  }

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
