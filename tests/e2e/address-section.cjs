// The address part of the order details: every Dharan ward can be picked, an area that is not listed can be typed,
// and the full address goes into the WhatsApp message. Writes nothing to the database.
// Usage: BASE=https://chitomitho.vercel.app node tests/e2e/address-section.cjs     (LOCALE=ne for Nepali)
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LOCALE = process.env.LOCALE || "en";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 300) : "")); };
const T = LOCALE === "ne"
  ? { ward5: "धरान-५", ward20: "धरान-२०", addr: "ठेगाना", fullLabel: /पूरा ठेगाना/, other: /सूचीमा छैन/ }
  : { ward5: "Dharan-5", ward20: "Dharan-20", addr: "Address", fullLabel: /Full address/, other: /not in the list/ };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  if (LOCALE === "ne") await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
  await page.evaluateOnNewDocument(() => {
    const Real = Date, now = Real.now(), npt = new Real(now + 5.75 * 3600_000);
    const target = Real.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 13, 20) - 5.75 * 3600_000;
    const offset = target - now;
    class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
    window.Date = Fake;
    window.open = () => ({});
  });
  await page.setRequestInterception(true);
  page.on("request", (r) => (r.method() === "POST" && r.url().includes("/rest/v1/order_clicks") ? r.abort() : r.continue()));

  await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").startsWith("Add: ") || /^(थप्नुहोस्): Combo - 1/.test(x.getAttribute("aria-label") || "")).click());
  await sleep(400);
  await page.goto(BASE + "/basket", { waitUntil: "networkidle2" }); await page.waitForSelector("main li", { timeout: 15000 });
  await page.evaluate(() => [...document.querySelectorAll("main button")].find((x) => /Order on WhatsApp|व्हाट्सएपमा अर्डर/.test(x.textContent)).click());
  await page.waitForSelector('[role="dialog"] select', { visible: true, timeout: 8000 }); await sleep(300);

  // The area list
  const opts = await page.$$eval('form[role="dialog"] select option', (os) => os.map((o) => ({ v: o.value, t: o.textContent.trim(), g: o.parentElement.tagName === "OPTGROUP" ? o.parentElement.label : "" })));
  const wards = opts.filter((o) => /^(Dharan|धरान)-[0-9०-९]+$/.test(o.t));
  ok("All 20 Dharan wards are in the list", wards.length === 20, String(wards.length));
  ok("Ward 5 and ward 20 are there by their names", wards.some((o) => o.t === T.ward5) && wards.some((o) => o.t === T.ward20), JSON.stringify(wards.map((w) => w.t)));
  ok("Wards sit inside the Dharan group", wards.every((o) => /Dharan|धरान/.test(o.g)));
  ok("The older places are still listed", opts.some((o) => /Bhanu Chowk|भानु चोक/.test(o.t)) && opts.some((o) => /Putali Line|पुतली लाइन/.test(o.t)));
  ok("Itahari, Biratnagar and nearby towns are still listed", opts.some((o) => /Itahari|इटहरी/.test(o.t)) && opts.some((o) => /Biratnagar|विराटनगर/.test(o.t)) && opts.some((o) => /Inaruwa|इनरुवा/.test(o.t)));
  const other = opts.find((o) => o.v === "other");
  ok("There is an option for an area that is not in the list", !!other && T.other.test(other.t), JSON.stringify(other));
  const dlgText = await page.$eval('[role="dialog"]', (d) => d.innerText);
  ok("The address box is called Full address, with an example", T.fullLabel.test(dlgText), dlgText.slice(0, 400));

  // A ward + a full manual address
  await page.type('[role="dialog"] input[autocomplete="name"]', "Sita Rai");
  await page.type('[role="dialog"] input[type="tel"]', "9812345678");
  await page.select('form[role="dialog"] select', wards.find((o) => o.t === T.ward5).v);
  await page.type('[role="dialog"] input[autocomplete="street-address"]', "Putali Line, house 14, near Nabil Bank, blue gate");
  await page.click('form[role="dialog"] button:not([type])');
  await page.waitForSelector("#review-title", { visible: true, timeout: 8000 });
  let msg = await page.$eval("[role='dialog'] pre", (e) => e.textContent);
  ok(`Message: the area reads ${T.ward5} (not "Dharan – Dharan-5")`, msg.includes(`: ${T.ward5}\n`) && !/Dharan – Dharan|धरान – धरान/.test(msg), msg);
  ok("Message: the full address typed by hand is there", msg.includes(`${T.addr}: Putali Line, house 14, near Nabil Bank, blue gate`), msg);

  // An area that is not in the list, typed by hand
  await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].find((x) => /Edit my details|विवरण सच्याउनुहोस्/.test(x.textContent)).click());
  await page.waitForSelector('[role="dialog"] select', { visible: true }); await sleep(300);
  await page.select('form[role="dialog"] select', "other");
  await sleep(200);
  const typedBox = await page.$$('form[role="dialog"] input:not([type=radio]):not([type=tel]):not([type=time]):not([autocomplete])');
  ok("Choosing 'not in the list' shows a box to type the area", typedBox.length >= 1);
  await typedBox[0].type("Hatkhola, Dharan-9");
  await page.click('form[role="dialog"] button:not([type])');
  await page.waitForSelector("#review-title", { visible: true, timeout: 8000 });
  msg = await page.$eval("[role='dialog'] pre", (e) => e.textContent);
  ok("Message: the typed area is used as the area", /: Hatkhola, Dharan-9\n/.test(msg), msg);
  ok("Message: the address is still there", msg.includes("Putali Line, house 14"), msg);

  // The typed area is required when 'not in the list' is chosen
  await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].find((x) => /Edit my details|विवरण सच्याउनुहोस्/.test(x.textContent)).click());
  await page.waitForSelector('[role="dialog"] select', { visible: true }); await sleep(300);
  const box2 = await page.$$('form[role="dialog"] input:not([type=radio]):not([type=tel]):not([type=time]):not([autocomplete])');
  // Empty the box the way React expects (a triple-click does not select text on a phone-style browser).
  await box2[0].evaluate((e) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(e, ""); e.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.click('form[role="dialog"] button:not([type])'); await sleep(300);
  const alerts = await page.$$eval('[role="dialog"] [role="alert"]', (els) => els.map((e) => e.textContent));
  ok("Leaving the typed area empty is refused with a message", alerts.length >= 1 && !(await page.$("#review-title")), JSON.stringify(alerts));

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
