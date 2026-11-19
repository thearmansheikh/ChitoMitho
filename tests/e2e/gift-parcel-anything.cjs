// End-to-end check of the gifts, parcel and Order anything pages. Writes nothing to the database.
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const results = [];
const ok = (name, pass, extra) => { results.push(pass); console.log((pass ? "PASS " : "FAIL ") + name + (extra ? "  -> " + extra : "")); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const ctx = browser.defaultBrowserContext();
  await ctx.overridePermissions(BASE, ["geolocation"]);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setGeolocation({ latitude: 26.8143, longitude: 87.2796, accuracy: 20 });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE ERROR:", m.text().slice(0, 300)); });

  await page.evaluateOnNewDocument(() => {
    const Real = Date; const now = Real.now(); const npt = new Real(now + 5.75 * 3600000);
    const offset = Real.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 13, 20) - 5.75 * 3600000 - now;
    class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
    window.Date = Fake;
    window.__opened = null;
    window.open = (u) => { window.__opened = u; return {}; };
  });
  await page.setRequestInterception(true);
  page.on("request", (req) => (req.method() === "POST" && req.url().includes("/rest/v1/order_clicks") ? req.abort() : req.continue()));

  const clickText = (scope, src) => page.evaluate((sc, source) => { const re = new RegExp(source); const b = [...document.querySelectorAll(sc + " button")].find((x) => re.test(x.textContent)); if (!b) return false; b.click(); return true; }, scope, src);
  const setNative = (selector, value) => page.evaluate((sel, v) => { const e = document.querySelector(sel); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(e, v); e.dispatchEvent(new Event("input", { bubbles: true })); }, selector, value);
  const tomorrow = () => page.evaluate(() => { const d = new Date(); const n = new Date(d.getTime() + 5.75 * 3600000 + 86400000); return n.toISOString().slice(0, 10); });
  async function fillDetailsAndReview() {
    await page.waitForSelector("form[role=dialog]", { visible: true });
    await new Promise((r) => setTimeout(r, 250)); // the sheet focuses the name field after 50 ms; let that happen first
    await page.type('form[role="dialog"] input[autocomplete="name"]', "Sita Rai");
    await page.type('form[role="dialog"] input[type="tel"]', "9812345678");
    const areaVal = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.value);
    await page.select('form[role="dialog"] select', areaVal);
    await page.type('form[role="dialog"] input[list="tole-suggestions"]', "Blue gate");
    console.log("-- clicking the sheet submit button --");
    const submitInfo = await page.evaluate(() => [...document.querySelectorAll('form[role="dialog"] button')].map((b) => (b.getAttribute("type") || "(none)") + ":" + b.textContent.trim().slice(0, 24)));
    console.log("sheet buttons:", JSON.stringify(submitInfo));
    await page.click('form[role="dialog"] button:not([type])');
    try {
      await page.waitForSelector("#review-title", { visible: true, timeout: 6000 });
    } catch (e) {
      const alerts = await page.evaluate(() => [...document.querySelectorAll("[role=alert]")].map((x) => x.textContent));
      const vals = await page.evaluate(() => ({ title: (document.querySelector("[role=dialog] h2") || {}).textContent, selects: [...document.querySelectorAll("form[role=dialog] select")].map((s) => s.value), inputs: [...document.querySelectorAll("form[role=dialog] input")].map((i) => i.type + "=" + i.value).slice(0, 8) }));
      console.log("REVIEW MISSING. alerts:", JSON.stringify(alerts), "state:", JSON.stringify(vals));
      const box = await page.evaluate(() => { const b = [...document.querySelectorAll('form[role="dialog"] button')].find((x) => !x.getAttribute("type")); const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vh: innerHeight, topElement: top ? top.tagName + ":" + (top.textContent || "").trim().slice(0, 30) : null, disabled: b.disabled }; });
      console.log("submit button box:", JSON.stringify(box));
      await page.evaluate(() => document.querySelector('form[role="dialog"]').requestSubmit());
      const viaSubmit = await page.waitForSelector("#review-title", { visible: true, timeout: 4000 }).then(() => true).catch(() => false);
      console.log("review appears when the form is submitted directly:", viaSubmit);
      throw e;
    }
    return page.$eval("[role='dialog'] pre", (e) => e.textContent);
  }
  async function clickSend() {
    const clicked = await page.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /Order on WhatsApp/.test(x.textContent)); if (!b) return false; b.click(); return true; });
    if (clicked) return;
    const text = await page.$eval("main", (e) => e.innerText);
    console.log("BASKET TEXT:", JSON.stringify(text.slice(0, 400)));
    console.log("STORED:", await page.evaluate(() => localStorage.getItem("cm-basket-v1")));
    throw new Error("send button not found");
  }

  // ---------- GIFTS ----------
  await page.goto(BASE + "/gifts", { waitUntil: "networkidle0" });
  ok("Gift page shows occasion chips", (await page.$$eval("fieldset button[aria-pressed]", (b) => b.length)) === 6);
  await clickText("fieldset", "^Birthday$");
  const ideas = await page.$$eval("ul button", (bs) => bs.map((b) => b.textContent).filter((t) => /birthday|returns|celebrate/i.test(t)));
  ok("Choosing Birthday shows message ideas", ideas.length === 3, String(ideas.length));
  await page.evaluate(() => { const b = [...document.querySelectorAll("ul button")].find((x) => /Happy birthday/.test(x.textContent)); b.click(); });
  await page.type('input[autocomplete="off"]', "Maya");
  await page.type('input[type="tel"]', "9801111111");
  const preview = await page.$eval("figure", (e) => e.innerText).catch(() => "");
  ok("Card preview shows recipient and message", /To Maya/.test(preview) && /Happy birthday/.test(preview), preview.replace(/\n/g, " | ").slice(0, 80));

  await setNative('input[type="date"]', "2020-01-01");
  let alert1 = await page.$eval("[role=alert]", (e) => e.textContent).catch(() => "");
  ok("A past date is refused with a clear message", /already passed/.test(alert1), alert1);
  const tm = await tomorrow();
  await setNative('input[type="date"]', tm);
  await setNative('input[type="time"]', "08:00");
  alert1 = await page.$eval("[role=alert]", (e) => e.textContent).catch(() => "");
  ok("A time before opening is refused", /between 10:00 and 22:00/.test(alert1), alert1);
  await setNative('input[type="time"]', "15:00");
  alert1 = await page.$eval("[role=alert]", (e) => e.textContent).catch(() => "");
  ok("A good date and time clear the warning", alert1 === "", alert1 || "none");

  ok("The bouquet has an Add button", await page.evaluate(() => { const b = document.querySelector('button[aria-label="Add: Red Rose Bouquet"]'); if (!b) return false; b.click(); return true; }));
  await new Promise((r) => setTimeout(r, 500)); // let the browser save the basket before a full page load
  await page.goto(BASE + "/basket", { waitUntil: "networkidle0" });
  await clickSend();
  const hasSchedule = await page.$('input[name="when"]');
  ok("Gift orders do not offer the Later choice (they pick their own date)", !hasSchedule);
  const giftMsg = await fillDetailsAndReview();
  ok("Message has the occasion", /Occasion: Birthday/.test(giftMsg));
  ok("Message has recipient and card", /Gift for: Maya/.test(giftMsg) && /Card message: Happy birthday/.test(giftMsg));
  ok("Message has the delivery day and time", new RegExp("Deliver on: " + tm + " 15:00").test(giftMsg), (giftMsg.match(/Deliver on: .*/) || [""])[0]);

  // ---------- PARCEL ----------
  await page.goto(BASE + "/parcel", { waitUntil: "networkidle0" });
  const hints = await page.$$eval("fieldset label span.text-xs", (e) => e.map((x) => x.textContent));
  ok("Parcel sizes have plain-language hints", hints.length === 3, hints.join(" / ").slice(0, 70));
  ok("Parcel page lists what cannot be carried", /What we cannot carry/.test(await page.$eval("main", (e) => e.innerText)));
  await page.type("input:not([type])", "Bhanu Chowk shop");
  const inputs = await page.$$("main input:not([type]), main input[type='tel']");
  await inputs[1].type("Hospital Road");
  await page.type("textarea", "House keys in an envelope");
  await inputs[2].type("Hari");
  await inputs[3].type("9807654321");
  ok("Two pin buttons are offered", (await page.$$eval("main button", (bs) => bs.filter((b) => /Pin the (pickup|drop)/.test(b.textContent)).length)) === 2);
  await clickText("main", "Pin the pickup");
  await page.waitForFunction(() => document.body.innerText.includes("Location added"), { timeout: 5000 }).catch(() => {});
  await clickText("main", "Pin the drop");
  await page.waitForFunction(() => (document.body.innerText.match(/Location added/g) || []).length >= 2, { timeout: 5000 }).catch(() => {});
  ok("Both pins were set", (await page.evaluate(() => (document.body.innerText.match(/Location added/g) || []).length)) === 2);
  await clickSend();
  const parcelMsg = await fillDetailsAndReview();
  console.log("---- parcel message ----\n" + parcelMsg + "\n------------------------");
  ok("Parcel message has pickup and drop map links", /Pickup map: https:\/\/www\.google\.com\/maps\?q=26\.8143/.test(parcelMsg) && /Drop map: https:\/\/www\.google\.com\/maps\?q=26\.8143/.test(parcelMsg));
  ok("Parcel message has the places, item and receiver", /Pickup from: Bhanu Chowk shop/.test(parcelMsg) && /Drop at: Hospital Road/.test(parcelMsg) && /Receiver: Hari/.test(parcelMsg));

  // ---------- ORDER ANYTHING ----------
  await page.goto(BASE + "/anything", { waitUntil: "networkidle0" });
  const chips = await page.$$eval("main ul li button", (b) => b.length);
  ok("Order anything shows example chips", chips === 6, String(chips));
  await clickText("main", "Medicine from a pharmacy");
  await clickText("main", "A phone charger");
  const need = await page.$eval("textarea", (e) => e.value);
  ok("Tapping examples fills the box, joined with a comma", need === "Medicine from a pharmacy, A phone charger", need);
  ok("Photo hint is shown", /send a photo of it on WhatsApp/i.test(await page.$eval("main", (e) => e.innerText)));

  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
