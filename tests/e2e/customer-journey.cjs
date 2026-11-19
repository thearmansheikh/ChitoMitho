// A customer's whole journey: home page -> food -> café -> add items -> basket -> details -> review -> WhatsApp.
// Writes nothing to the database: the order-count request is blocked and window.open is captured.
// Usage: BASE=https://chitomitho.vercel.app node tests/e2e/customer-journey.cjs     (LOCALE=ne for Nepali, REALCLOCK=1 to keep the real time)
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LOCALE = process.env.LOCALE || "en";
const SHOTS = process.env.SHOTS || "";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, extra = "") => { results.push({ name, pass }); console.log((pass ? "PASS " : "FAIL ") + name + (extra && !pass ? "  -> " + extra : "")); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|manifest|ERR_FAILED/.test(m.text())) pageErrors.push(m.text()); });
  const badResponses = [];
  page.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) badResponses.push(r.status() + " " + r.url()); });
  if (LOCALE === "ne") await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });

  await page.evaluateOnNewDocument((real) => {
    if (!real) {
      // Pretend it is 13:20 in Nepal so the shop is open.
      const Real = Date, now = Real.now(), npt = new Real(now + 5.75 * 3600_000);
      const target = Real.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 13, 20) - 5.75 * 3600_000;
      const offset = target - now;
      class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
      window.Date = Fake;
    }
    window.__opened = null;
    window.open = (u) => { window.__opened = u; return {}; };
  }, !!process.env.REALCLOCK);

  let blockedCounts = 0;
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/rest/v1/order_clicks")) { blockedCounts++; return req.abort(); }
    req.continue();
  });

  const shot = async (name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${LOCALE}-${name}.png` }); };
  const tap = (sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b) return false; b.scrollIntoView({ block: "center" }); b.click(); return true; }, sel);
  const text = (sel) => page.$eval(sel, (e) => e.innerText).catch(() => "");

  // 1. Home page
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 });
  await shot("1-home");
  const home = await text("main");
  ok("Home page loads with content", home.length > 300, String(home.length));
  const heroLinks = await page.$$eval("main a", (as) => as.map((a) => a.getAttribute("href")));
  ok("Home links to food, groceries, gifts and parcel", ["/food", "/groceries", "/gifts", "/parcel"].every((h) => heroLinks.includes(h)), JSON.stringify([...new Set(heroLinks)].slice(0, 20)));

  // 2. Food list
  await page.goto(BASE + "/food", { waitUntil: "networkidle2" });
  const chicken = await page.$("a[href='/p/the-chicken-box']");
  ok("Food page lists The Chicken Box", !!chicken);
  ok("Demo cafés are gone from the food list", !/Olive Cafe|Circle Cafe|Siblings/.test(await text("main")));
  await shot("2-food");
  await page.evaluate(() => document.querySelector("a[href='/p/the-chicken-box']").click());
  await page.waitForFunction(() => location.pathname === "/p/the-chicken-box", { timeout: 15000 });
  await page.waitForSelector("button[aria-label$=': Combo - 1']", { timeout: 15000 });
  await sleep(Number(process.env.SETTLE || 500));

  // 3. Café page
  const place = await text("main");
  ok("Café page shows the café name and menu", /The Chicken Box|द चिकेन बक्स/.test(place) && /Combo - 1/.test(place));
  const tabs = await page.$$eval("nav a[href^='#'], [aria-label] a[href^='#']", (a) => a.length);
  ok("Category tabs are present", tabs >= 5, String(tabs));
  await shot("3-cafe");

  // 4. Add items: a plain item, then the same again (stepper), then another via the detail sheet with a note
  // The aria-labels are "Add: <name>" / "Add one: <name>" in English; match by item name so Nepali works too.
  const byName = (name, prefixRe) => page.evaluate((n, src) => { const re = new RegExp(src); const b = [...document.querySelectorAll("button")].find((x) => re.test(x.getAttribute("aria-label") || "") && (x.getAttribute("aria-label") || "").endsWith(": " + n)); if (!b) return false; b.scrollIntoView({ block: "center" }); b.click(); return true; }, name, prefixRe);
  ok("Quick add works", await byName("Combo - 1", "^(Add|थप्नुहोस्):"), "no Add button for Combo - 1");
  await sleep(Number(process.env.SETTLE || 250));
  ok("Add button turns into a stepper (a second tap adds another)", await byName("Combo - 1", "^(Add one|एउटा थप्नुहोस्):"));
  await sleep(Number(process.env.SETTLE || 200));
  // detail sheet
  await tap("button[aria-label$=': Cheesy Zinger Burger (Signature Burger)']");
  await page.waitForSelector("[role=dialog]", { timeout: 5000 });
  const sheet = await text("[role=dialog]");
  ok("Item detail sheet opens with the price", /Rs\. ?299/.test(sheet), sheet.slice(0, 120));
  await page.type("[role=dialog] input[type=text], [role=dialog] input:not([type])", LOCALE === "ne" ? "प्याज नहाल्नुहोस्" : "no onions");
  await shot("4-sheet");
  await page.evaluate(() => { const b = [...document.querySelectorAll("[role=dialog] button")].find((x) => /Add to basket|बास्केटमा हाल्नुहोस्/.test(x.innerText)); b && b.click(); });
  await sleep(400);
  ok("Sheet closes after adding", !(await page.$("[role=dialog]")));
  const barText = await page.$eval("nav[aria-label='Basket'] a[href='/basket'], a[href='/basket']", (e) => e.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
  ok("Basket bar shows 3 items and Rs. 1,217", /3/.test(barText) && /1,?217/.test(barText), barText);
  await shot("5-bar");

  // 5. Basket
  await page.goto(BASE + "/basket", { waitUntil: "networkidle2" });
  await page.waitForSelector("main li", { timeout: 15000 });
  const basket = await text("main");
  ok("Basket lists both items with the right totals", /Combo - 1/.test(basket) && /Cheesy Zinger Burger/.test(basket) && /918/.test(basket) && /299/.test(basket), basket.slice(0, 300));
  ok("Basket remembers the note on the burger", await page.$$eval("main input", (is) => is.some((i) => /no onions|प्याज नहाल्नुहोस्/.test(i.value))));
  await shot("6-basket");

  // 6. Open the details sheet
  const sendClicked = await page.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /Order on WhatsApp|व्हाट्सएपमा अर्डर/.test(x.textContent)); if (!b) return "missing"; if (b.disabled) return "disabled"; b.click(); return "ok"; });
  ok("Order on WhatsApp button is available", sendClicked === "ok", sendClicked);
  await page.waitForSelector('[role="dialog"] input', { visible: true, timeout: 8000 });
  await sleep(300);
  await shot("7-details-empty");

  // 7. Validation
  await page.click('form[role="dialog"] button:not([type])');
  await sleep(Number(process.env.SETTLE || 200));
  const errs = await page.$$eval('[role="dialog"] [role="alert"]', (els) => els.map((e) => e.textContent));
  ok("An empty form is refused with messages", errs.length >= 3, errs.length + " messages");
  await shot("8-errors");

  // 8. Fill in the details like a customer
  await page.type('[role="dialog"] input[autocomplete="name"]', "Sita Rai");
  await page.type('[role="dialog"] input[type="tel"]', "98 12345678");
  const areaCount = await page.$$eval('form[role="dialog"] select option', (o) => o.length);
  ok("Area list has choices", areaCount >= 5, String(areaCount));
  const areaVal = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.value);
  const areaLabel = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.textContent.trim());
  await page.select('form[role="dialog"] select', areaVal);
  await page.type('[role="dialog"] input[autocomplete="street-address"]', "Near Nabil Bank, blue gate");
  await sleep(150);
  const staleErrors = await page.$$eval('[role="dialog"] [role="alert"]', (els) => els.map((e) => e.textContent));
  ok("Error messages clear once the fields are filled in", staleErrors.length === 0, JSON.stringify(staleErrors));
  await shot("9-details-filled");
  await page.click('form[role="dialog"] button:not([type])');
  await page.waitForSelector("#review-title", { visible: true, timeout: 8000 }).catch(() => {});
  const msg = await page.$eval("[role='dialog'] pre", (e) => e.textContent).catch(() => "");
  ok("Review screen shows the WhatsApp message", msg.length > 100, msg.slice(0, 80));
  console.log("---- message the customer sees ----\n" + msg + "\n------------------------------------");
  await shot("10-review");
  ok("Message names the café", /The Chicken Box|द चिकेन बक्स/.test(msg));
  ok("Message lists both items with quantities and prices", /2 x Combo - 1/.test(msg) && /1 x Cheesy Zinger Burger/.test(msg) && /Rs\. ?918/.test(msg) && /Rs\. ?299/.test(msg), msg);
  ok("Message carries the note", /no onions|प्याज नहाल्नुहोस्/.test(msg));
  ok("Message has the total", /1,?217/.test(msg), msg);
  ok("Message has name, cleaned phone, landmark and area", /Sita Rai/.test(msg) && /9812345678/.test(msg) && /Near Nabil Bank/.test(msg) && msg.includes(areaLabel.split(/[·(]/)[0].trim()), areaLabel);
  ok("Message says the delivery charge is confirmed later", /delivery charge|डेलिभरी शुल्क|डेलिभरी चार्ज/i.test(msg), msg.slice(-300));

  // 9. Send
  const sendOk = await page.evaluate(() => { const b = [...document.querySelectorAll("[role=dialog] button")].find((x) => /Open WhatsApp|व्हाट्सएप खोल्नुहोस्/.test(x.textContent)); if (!b) return false; b.click(); return true; });
  ok("Open WhatsApp button exists on the review screen", sendOk);
  await page.waitForSelector("#sent-title", { visible: true, timeout: 8000 }).catch(() => {});
  await shot("11-sent");
  const sentText = await text("[role='dialog']");
  ok("Confirmation screen explains what happens next", /What happens next|के हुन्छ|अब के/i.test(sentText), sentText.slice(0, 200));
  const opened = await page.evaluate(() => window.__opened);
  ok("The WhatsApp link goes to the order number", typeof opened === "string" && opened.startsWith("https://api.whatsapp.com/send?phone=9779805338257&text="), String(opened).slice(0, 70));
  ok("The link carries the whole message unchanged", new URL(String(opened)).searchParams.get("text") === msg.replace(/\r/g, ""));
  ok("The order count was attempted once (blocked for this test)", blockedCounts === 1, String(blockedCounts));

  // 10. Afterwards
  const last = await page.evaluate(() => JSON.parse(localStorage.getItem("cm-last-order-v1") || "null"));
  ok("The order is remembered for Order again", !!last && last.lines.length === 2);
  await page.goto(BASE + "/", { waitUntil: "networkidle2" });
  ok("Home page offers Order again", /Order again|फेरि अर्डर/i.test(await text("main")));

  ok("No page errors", pageErrors.length === 0, JSON.stringify(pageErrors.slice(0, 3)));
  ok("No failed requests (4xx/5xx)", badResponses.length === 0, JSON.stringify(badResponses.slice(0, 5)));

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
