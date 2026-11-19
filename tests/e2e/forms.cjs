// Parcel, Order anything, Gifts and Partner (café and rider): required marks, friendly errors, and the message that goes to WhatsApp.
// Writes nothing to the database. Usage: BASE=https://chitomitho.vercel.app node tests/e2e/forms.cjs     (LOCALE=ne for Nepali)
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LOCALE = process.env.LOCALE || "en";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 500) : "")); };
const CLOCK_NOISE = /React error #(418|423|425)/;
const NE = LOCALE === "ne";

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const newPage = async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    if (NE) await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
    await page.evaluateOnNewDocument(() => {
      const Real = Date, now = Real.now(), npt = new Real(now + 5.75 * 3600_000);
      const target = Real.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 13, 20) - 5.75 * 3600_000;
      const offset = target - now;
      class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
      window.Date = Fake;
      window.__opened = null;
      window.open = (u) => { window.__opened = u; return {}; };
    });
    await page.setRequestInterception(true);
    page.on("request", (r) => (r.method() === "POST" && r.url().includes("/rest/v1/order_clicks") ? r.abort() : r.continue()));
    page.__errors = [];
    page.on("pageerror", (e) => page.__errors.push(e.message));
    return page;
  };
  const labelOf = (re, scope) => (page) => page.evaluateHandle((src, sc) => {
    const rx = new RegExp(src);
    const root = document.querySelector(sc) || document;
    const l = [...root.querySelectorAll("label")].find((x) => rx.test(x.querySelector("span")?.textContent || ""));
    return l ? l.querySelector("input:not([type=radio]):not([type=checkbox]), select, textarea") : null;
  }, re.source, scope);
  const setVal = (el, v) => el.evaluate((e, val) => { const proto = e instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : e instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(e, val); e.dispatchEvent(new Event(e instanceof HTMLSelectElement ? "change" : "input", { bubbles: true })); }, v);
  const fill = async (page, re, v, scope = "main") => { const el = (await labelOf(re, scope)(page)).asElement(); if (!el) throw new Error("no field " + re); await setVal(el, v); };
  const alertsIn = (page, sc = "main") => page.$$eval(sc + " [role=alert]", (els) => els.map((e) => e.textContent.trim()).filter(Boolean));
  const clickBtn = (page, re, sc = "main") => page.evaluate((src, s) => { const b = [...document.querySelectorAll(s + " button")].find((x) => new RegExp(src).test(x.textContent)); if (!b) return false; b.scrollIntoView({ block: "center" }); b.click(); return true; }, re.source, sc);
  const T = NE
    ? { order: /व्हाट्सएपमा अर्डर/, check: /तल चिन्ह लगाइएका/, name: /^(तपाईंको नाम)/, phone: /^(फोन नम्बर)/, review: /अर्डर जाँच्नुहोस्|अर्डर हेर्नुहोस्|जाँच्नुहोस्/, senderName: "पठाउनेको नाम: ", pickupTime: "पिकअप समय: ", pickupQ: /हामीले कहिले लिन आउनु पर्छ/ }
    : { order: /Order on WhatsApp/, check: /Please check the fields marked below/, name: /^Your name/, phone: /^Phone number/, review: /Review your order/, senderName: "Sender name: ", pickupTime: "Pickup time: ", pickupQ: /When should we pick it up/ };

  // ======================= PARCEL =======================
  {
    const page = await newPage();
    await page.goto(BASE + "/parcel", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
    const txt = await page.$eval("main", (m) => m.textContent);
    ok("Parcel: required fields are marked with *", (await page.$$eval("main label span[aria-hidden]", (s) => s.filter((x) => x.textContent === "*").length)) >= 5);
    ok("Parcel: a note says what * means", /\*/.test(txt) && (NE ? /आवश्यक छ/ : /required field/).test(txt));
    ok("Parcel: no label runs into its hint text", !/[a-z]e\.g\./.test(txt), txt.match(/.{20}[a-z]e\.g\..{10}/)?.[0]);
    await clickBtn(page, T.order);
    await sleep(300);
    const a1 = await alertsIn(page);
    ok("Parcel: an empty form shows a message under each required field", a1.length >= 6 && a1.some((x) => T.check.test(x)), JSON.stringify(a1));
    await fill(page, NE ? /^(सामान लिने ठाउँ)/ : /^Pickup place/, "Bhanu Chowk, near the temple");
    await fill(page, NE ? /^(सामान पुर्‍याउने ठाउँ)/ : /^Drop place/, "BPKIHS main gate");
    await fill(page, NE ? /^(सामान के हो)/ : /^What is the item/, "Documents and keys");
    await fill(page, NE ? /^(प्राप्तकर्ताको नाम)/ : /^Receiver name/, "Ram Thapa");
    await fill(page, NE ? /^(प्राप्तकर्ताको फोन)/ : /^Receiver phone/, "12345");
    await clickBtn(page, T.order); await sleep(300);
    const a2 = await alertsIn(page);
    ok("Parcel: a wrong receiver phone number is refused with a clear message", a2.some((x) => /97|98|९७|९८/.test(x)) && !(await page.$("[role=dialog]")), JSON.stringify(a2));
    await fill(page, NE ? /^(प्राप्तकर्ताको फोन)/ : /^Receiver phone/, "98 01112233");
    await sleep(200);
    ok("Parcel: the message disappears once the field is fixed", (await alertsIn(page)).length === 0, JSON.stringify(await alertsIn(page)));
    await clickBtn(page, T.order);
    await page.waitForSelector('[role="dialog"] input', { visible: true, timeout: 8000 }); await sleep(300);
    ok("Parcel: the sheet asks when we should pick it up", T.pickupQ.test(await page.$eval("[role=dialog]", (d) => d.innerText)));
    await fill(page, T.name, "Sita Rai", '[role="dialog"]');
    await fill(page, T.phone, "98 12345678", '[role="dialog"]');
    const area = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.value);
    await page.select('form[role="dialog"] select', area);
    await page.type('[role="dialog"] input[list="tole-suggestions"]', "Near Nabil Bank");
    await page.click('form[role="dialog"] button:not([type])');
    await page.waitForSelector("#review-title", { visible: true, timeout: 8000 });
    const msg = await page.$eval("[role='dialog'] pre", (e) => e.textContent);
    ok("Parcel: the message names the sender and the pickup time", msg.includes(T.senderName + "Sita Rai") && msg.includes(T.pickupTime), msg);
    ok("Parcel: the message has pickup, drop, item and receiver", ["Bhanu Chowk", "BPKIHS main gate", "Documents and keys", "Ram Thapa", "9801112233"].every((s) => msg.includes(s)), msg);
    ok("Parcel: no page errors", page.__errors.filter((e) => !CLOCK_NOISE.test(e)).length === 0, JSON.stringify(page.__errors));
    await page.close();
  }

  // ======================= ORDER ANYTHING =======================
  {
    const page = await newPage();
    await page.goto(BASE + "/anything", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
    const txt = await page.$eval("main", (m) => m.textContent);
    ok("Anything: the need is marked required", (await page.$$eval("main label span[aria-hidden]", (s) => s.filter((x) => x.textContent === "*").length)) >= 1);
    ok("Anything: no label runs into its hint text", !/[a-z]e\.g\./.test(txt), txt.match(/.{20}[a-z]e\.g\..{10}/)?.[0]);
    await clickBtn(page, T.order); await sleep(300);
    ok("Anything: an empty need is refused with a message", (await alertsIn(page)).length >= 1 && !(await page.$("[role=dialog]")), JSON.stringify(await alertsIn(page)));
    const budget = await page.$("input[inputmode='numeric'][pattern]");
    ok("Anything: the budget box shows Rs. in front of the number", !!budget && /Rs\./.test(await page.$eval("main", (m) => m.innerText)));
    await budget.type("5a0b0 .,x");
    ok("Anything: only digits can be typed in the budget", (await budget.evaluate((e) => e.value)) === "500", await budget.evaluate((e) => e.value));
    await fill(page, NE ? /^(तपाईंलाई के चाहिन्छ)/ : /^What do you need/, "Medicine from a pharmacy & a phone charger");
    await clickBtn(page, T.order);
    await page.waitForSelector('[role="dialog"] input', { visible: true, timeout: 8000 }); await sleep(300);
    await fill(page, T.name, "Sita Rai", '[role="dialog"]');
    await fill(page, T.phone, "98 12345678", '[role="dialog"]');
    const area = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.value);
    await page.select('form[role="dialog"] select', area);
    await page.type('[role="dialog"] input[list="tole-suggestions"]', "Near Nabil Bank");
    await page.click('form[role="dialog"] button:not([type])');
    await page.waitForSelector("#review-title", { visible: true, timeout: 8000 });
    const msg = await page.$eval("[role='dialog'] pre", (e) => e.textContent);
    ok("Anything: the message has the need, the budget as Rs. 500, and the customer", msg.includes("Medicine from a pharmacy & a phone charger") && msg.includes("Rs. 500") && msg.includes("Sita Rai") && msg.includes("9812345678"), msg);
    await page.close();
  }

  // ======================= GIFTS =======================
  {
    const page = await newPage();
    await page.goto(BASE + "/gifts", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
    const btn = () => page.evaluateHandle((src) => [...document.querySelectorAll("main button")].find((x) => new RegExp(src).test(x.textContent)), NE ? "व्हाट्सएपमा उपहार अर्डर" : "gift order on WhatsApp");
    const b0 = (await btn()).asElement();
    ok("Gifts: there is a clear 'order on WhatsApp' button", !!b0);
    ok("Gifts: it is switched off while the basket is empty, with a hint", !!b0 && (await b0.evaluate((e) => e.disabled)) && /(first|पहिले)/.test(await page.$eval("main", (m) => m.innerText)));
    await page.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /^(Add|थप्नुहोस्):/.test(x.getAttribute("aria-label") || "")); b && b.click(); }); await sleep(400);
    const b1 = (await btn()).asElement();
    ok("Gifts: it switches on once a gift is in the basket", !!b1 && !(await b1.evaluate((e) => e.disabled)));
    await b1.click();
    await page.waitForFunction(() => location.pathname === "/basket", { timeout: 10000 }).catch(() => {});
    ok("Gifts: the button takes the customer to the order", page.url().includes("/basket"), page.url());
    await page.close();
  }

  // ======================= PARTNER: café / shop =======================
  {
    const page = await newPage();
    await page.goto(BASE + "/partner", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
    const txt = await page.$eval("form", (m) => m.textContent);
    ok("Partner: required fields are marked with *", (await page.$$eval("form label span[aria-hidden]", (s) => s.filter((x) => x.textContent === "*").length)) >= 5);
    ok("Partner: 'Address / area' no longer runs into its hint ('areae.g.')", !/[a-z]e\.g\./.test(txt) && !/areae\.g\./.test(txt), txt.match(/.{20}[a-z]e\.g\..{10}/)?.[0]);
    await clickBtn(page, NE ? /व्हाट्सएपमा पठाउनुहोस्/ : /Send on WhatsApp/, "form");
    await sleep(300);
    const a1 = await alertsIn(page, "form");
    ok("Partner: an empty form shows a message under each required field", a1.length >= 5, JSON.stringify(a1));
    ok("Partner: choosing 'Other' shows a box for the type of business", await (async () => {
      const sel = (await labelOf(NE ? /^(व्यवसायको प्रकार)/ : /^Type of business/, "form")(page)).asElement();
      await setVal(sel, "other"); await sleep(200);
      return !!(await labelOf(NE ? /^(व्यवसायको प्रकार लेख्नुहोस्)/ : /^Tell us the type of business/, "form")(page)).asElement();
    })());
    await fill(page, NE ? /^(व्यवसायको नाम)/ : /^Business name/, "Test Bakery & Café #1", "form");
    await fill(page, NE ? /^(व्यवसायको प्रकार लेख्नुहोस्)/ : /^Tell us the type of business/, "Bakery", "form");
    await fill(page, NE ? /^(सम्पर्क व्यक्ति)/ : /^Contact person/, "Ram Sharma", "form");
    await fill(page, NE ? /^(फोन नम्बर)/ : /^Phone number/, "98 01234567", "form");
    await fill(page, NE ? /^(ठेगाना)/ : /^Address \/ area/, "Dharan-9, Hatkhola", "form");
    await page.evaluate(() => document.querySelector("form input[type=checkbox]").click());
    await clickBtn(page, NE ? /व्हाट्सएपमा पठाउनुहोस्/ : /Send on WhatsApp/, "form"); await sleep(500);
    const opened = await page.evaluate(() => window.__opened);
    const text = opened ? new URL(opened).searchParams.get("text") : "";
    ok("Partner: the message has the business, its type (Other – Bakery), contact and phone", /Test Bakery & Café #1/.test(text) && /Bakery/.test(text) && /Ram Sharma/.test(text) && /9801234567/.test(text), text);
    ok("Partner: it goes to the order number", !!opened && opened.includes("phone=9779805338257"), opened);
    ok("Partner: no page errors", page.__errors.filter((e) => !CLOCK_NOISE.test(e)).length === 0, JSON.stringify(page.__errors));
    await page.close();
  }

  // ======================= PARTNER: rider =======================
  {
    const page = await newPage();
    await page.goto(BASE + "/partner", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
    await page.evaluate(() => [...document.querySelectorAll("[role=tab]")][1].click()); await sleep(300);
    const txt = await page.$eval("form", (m) => m.textContent);
    ok("Rider: the rider tab has its own form (name, phone, area, vehicle, licence, hours)", (NE ? /तपाईंको नाम/ : /Your name/).test(txt) && (NE ? /आफ्नै सवारी साधन/ : /own vehicle/i).test(txt) && (NE ? /अनुमतिपत्र/ : /licence/i).test(txt) && (NE ? /कहिले/ : /When can you ride/).test(txt), txt.slice(0, 300));
    ok("Rider: required fields are marked with *", (await page.$$eval("form label span[aria-hidden]", (s) => s.filter((x) => x.textContent === "*").length)) >= 3);
    await clickBtn(page, NE ? /व्हाट्सएपमा पठाउनुहोस्/ : /Send on WhatsApp/, "form"); await sleep(300);
    ok("Rider: an empty form shows messages", (await alertsIn(page, "form")).length >= 3, JSON.stringify(await alertsIn(page, "form")));
    await fill(page, NE ? /^(तपाईंको नाम)/ : /^Your name/, "Hari Gurung", "form");
    await fill(page, NE ? /^(फोन नम्बर)/ : /^Phone number/, "98 01234567", "form");
    await fill(page, NE ? /^(तपाईं बस्ने)/ : /^Area where you live/, "Dharan-9", "form");
    ok("Rider: the vehicle choice is shown while 'own vehicle' is Yes", !!(await labelOf(NE ? /^(सवारी)/ : /^Vehicle/, "form")(page)).asElement());
    await page.evaluate(() => { const r = [...document.querySelectorAll("form input[name=hasVehicle]")][1]; r.click(); }); await sleep(250);
    ok("Rider: the vehicle choice disappears when they have no vehicle", !(await labelOf(NE ? /^(सवारी)/ : /^Vehicle/, "form")(page)).asElement());
    await clickBtn(page, NE ? /व्हाट्सएपमा पठाउनुहोस्/ : /Send on WhatsApp/, "form"); await sleep(500);
    const opened = await page.evaluate(() => window.__opened);
    const text = opened ? new URL(opened).searchParams.get("text") : "";
    ok("Rider: the message has name, phone, area and 'Own vehicle: No'", /Hari Gurung/.test(text) && /9801234567/.test(text) && /Dharan-9/.test(text) && (NE ? /आफ्नै सवारी साधन: छैन/ : /Own vehicle: No/).test(text), text);
    await page.close();
  }

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
