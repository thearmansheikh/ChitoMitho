// End-to-end check of the ordering flow against a local server. Writes nothing to the database.
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const results = [];
const ok = (name, pass, extra = "") => { results.push({ name, pass }); console.log((pass ? "PASS " : "FAIL ") + name + (extra ? "  -> " + extra : "")); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const clickText = (scope, src) => page.evaluate((sc, source) => { const re = new RegExp(source); const b = [...document.querySelectorAll(sc + " button")].find((x) => re.test(x.textContent)); if (!b) return false; b.click(); return true; }, scope, src);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // Pretend it is 13:20 in Nepal so the shop is open, and capture the WhatsApp link instead of leaving the page.
  await page.evaluateOnNewDocument(() => {
    const Real = Date;
    const now = Real.now();
    const npt = new Real(now + 5.75 * 3600_000);
    const target = Real.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 13, 20) - 5.75 * 3600_000;
    const offset = target - now;
    class Fake extends Real {
      constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); }
      static now() { return Real.now() + offset; }
    }
    window.Date = Fake;
    window.__opened = null;
    window.open = (u) => { window.__opened = u; return {}; };
  });

  // Never count a test order.
  let blockedCounts = 0;
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/rest/v1/order_clicks")) { blockedCounts++; return req.abort(); }
    req.continue();
  });

  // 1. Add two items from a café page
  await page.goto(BASE + "/p/olive-cafe", { waitUntil: "networkidle0" });
  // Click through the page itself: the floating bottom bar can sit over a button, and a real person would scroll.
  const tap = (sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel);
  await tap('button[aria-label="Add: Chicken Momo"]');
  await new Promise((r) => setTimeout(r, 150));
  await tap('button[aria-label^="Add one"]'); // the Add button became a stepper: add a second momo
  await tap('button[aria-label="Add: Cold Coffee"]');
  await new Promise((r) => setTimeout(r, 400));
  const bar = await page.$eval("nav[aria-label='Basket'] a[href='/basket']", (e) => e.textContent.replace(/\s+/g, " ").trim());
  ok("Bottom bar shows count and total", /Rs\./.test(bar), bar);

  // 2. Basket
  await page.goto(BASE + "/basket", { waitUntil: "networkidle0" });
  const basketText = await page.$eval("main", (e) => e.innerText);
  ok("Basket lists the items", /Chicken Momo/.test(basketText) && /Cold Coffee/.test(basketText));
  ok("Basket shows a per-café subtotal and Add more link", /Subtotal/.test(basketText) && /Add more/.test(basketText));
  const addMore = await page.$("main a[href^='/p/olive-cafe']");
  ok("Add more links back to the café", !!addMore);

  // 3. Send button is enabled (clock faked to open hours)
  const sendBtn = await page.$x ? null : null;
  const buttons = await page.$$("main button");
  let send;
  for (const b of buttons) { const t = await b.evaluate((e) => e.textContent); if (/Order on WhatsApp/.test(t)) send = b; }
  ok("Order on WhatsApp is enabled", !!send && !(await send.evaluate((e) => e.disabled)));
  await send.evaluate((e) => e.click());
  await page.waitForSelector('[role="dialog"] input', { visible: true });
  await new Promise((r) => setTimeout(r, 250)); // the sheet focuses the name field after 50 ms

  // 4. Required-field validation
  const submitLabel = await page.$eval('form[role="dialog"] button:not([type])', (e) => e.textContent.trim());
  ok("Sheet button now says Review your order", /Review your order/.test(submitLabel), submitLabel);
  await page.click('form[role="dialog"] button:not([type])');
  const errs = await page.$$eval('[role="dialog"] [role="alert"]', (els) => els.map((e) => e.textContent));
  ok("Empty form is refused with messages", errs.length >= 3, errs.length + " messages");

  // 5. Fill the form properly
  await page.type('[role="dialog"] input[autocomplete="name"]', "Sita Rai");
  await page.type('[role="dialog"] input[type="tel"]', "98 12345678");
  const areaVal = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.value);
  await page.select('form[role="dialog"] select', areaVal);
  await page.type('[role="dialog"] input[autocomplete="street-address"]', "Near Nabil Bank, blue gate");
  // choose "Later" tomorrow 14:30
  const laterLabel = await page.$x ? null : null;
  const radios = await page.$$('[role="dialog"] input[name="when"]');
  await radios[1].evaluate((e) => e.click());
  const timeInput = await page.$('[role="dialog"] input[type="time"]');
  await timeInput.evaluate((e) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(e, "14:30"); e.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.evaluate(() => { const sels = [...document.querySelectorAll('[role="dialog"] select')]; const day = sels[sels.length - 1]; if (day && [...day.options].some((o) => o.value === "tomorrow")) { day.value = "tomorrow"; day.dispatchEvent(new Event("change", { bubbles: true })); } });
  const noteBox = await page.$('[role="dialog"] textarea');
  await noteBox.type("Less spicy please");

  // 6. Review step
  await page.click('form[role="dialog"] button:not([type])');
  await page.waitForSelector("#review-title", { visible: true, timeout: 5000 }).catch(() => {});
  console.log("after submit:", JSON.stringify(await page.evaluate(() => ({ alerts: [...document.querySelectorAll("form[role=dialog] [role=alert]")].map((e) => e.textContent), selects: [...document.querySelectorAll("form[role=dialog] select")].map((x) => x.value), time: document.querySelector("form[role=dialog] input[type=time]") && document.querySelector("form[role=dialog] input[type=time]").value, when: [...document.querySelectorAll("input[name=when]")].map((r) => r.checked), dialogTitle: (document.querySelector("[role=dialog] h2")||{}).textContent }))));
  const review = await page.$eval("#review-title", (e) => e.textContent).catch(() => null);
  ok("Review screen appears", review === "Check your order", String(review));
  const msg = await page.$eval("[role='dialog'] pre", (e) => e.textContent).catch(() => "");
  console.log("---- message shown to customer ----\n" + msg + "\n-----------------------------------");
  ok("Message has the order type and café", /NEW ORDER/.test(msg) && /Olive Cafe/.test(msg));
  ok("Message has quantities and totals", /3 x Chicken Momo|2 x Chicken Momo/.test(msg) && /Items total: Rs\./.test(msg));
  ok("Message has name, phone (cleaned) and landmark", /Sita Rai/.test(msg) && /9812345678/.test(msg) && /Near Nabil Bank/.test(msg));
  ok("Message has the delivery time for Later", /Deliver: Tomorrow 14:30/.test(msg));
  ok("Message has the note", /Less spicy please/.test(msg));

  // 7. Edit keeps what was typed
  ok("Edit my details button exists", await clickText("[role=dialog]", "Edit my details"));
  await page.waitForSelector('[role="dialog"] input[autocomplete="name"]', { visible: true });
  const kept = await page.$eval('[role="dialog"] input[autocomplete="name"]', (e) => e.value);
  ok("Editing keeps the typed details", kept === "Sita Rai", kept);
  await page.click('form[role="dialog"] button:not([type])');
  await page.waitForSelector("#review-title", { visible: true });

  // 8. Send
  ok("Open WhatsApp button exists", await clickText("[role=dialog]", "Open WhatsApp"));
  await page.waitForSelector("#sent-title", { visible: true, timeout: 8000 }).catch(() => {});
  const sent = await page.$eval("#sent-title", (e) => e.textContent).catch(() => null);
  ok("Confirmation screen appears", sent === "Your order is ready in WhatsApp", String(sent));
  const sentText = await page.$eval("[role='dialog']", (e) => e.innerText).catch(() => "");
  ok("Confirmation explains what happens next", /What happens next/.test(sentText) && /delivery charge/.test(sentText) && /10:00 and 22:00/.test(sentText));
  const opened = await page.evaluate(() => window.__opened);
  ok("WhatsApp link goes to the order number", typeof opened === "string" && opened.startsWith("https://api.whatsapp.com/send?phone=9779805338257&text="), String(opened).slice(0, 60));
  ok("The link carries the whole message", decodeURIComponent(String(opened).split("text=")[1] || "") === msg.replace(/\r/g, ""));
  ok("The order count was attempted exactly once (and blocked for this test)", blockedCounts === 1, String(blockedCounts));

  // 9. Reorder
  await page.evaluate(() => localStorage.getItem("cm-last-order-v1"));
  const last = await page.evaluate(() => JSON.parse(localStorage.getItem("cm-last-order-v1") || "null"));
  ok("The order was remembered for Order again", !!last && last.lines.length === 2, last ? last.lines.length + " lines" : "none");
  ok("Remembered lines carry the café page address", !!last && last.lines.every((l) => l.placeSlug === "olive-cafe"));

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
