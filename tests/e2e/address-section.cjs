// The address part of the order details: every Dharan ward can be picked, a tole or street, a house or gate number,
// a landmark and a second phone number can be given, an area that is not listed can be typed, and all of it reaches the message.
// Writes nothing to the database.
// Usage: BASE=https://chitomitho.vercel.app node tests/e2e/address-section.cjs     (LOCALE=ne for Nepali)
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LOCALE = process.env.LOCALE || "en";
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The suggestion list is checked with pretend toles served only to this browser, so nothing is written to the real database.
// Their wards are looked up from the real area list (the Supabase address and public key come from .env).
async function pretendToles() {
  try {
    const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^"|"$/g, "")]));
    const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const res = await fetch(url + "/rest/v1/areas?select=id,name", { headers: { apikey: key, Authorization: "Bearer " + key } });
    const areas = await res.json();
    const id = (n) => areas.find((a) => a.name === n)?.id;
    if (!id("Dharan-5") || !id("Dharan-9")) return null;
    return [
      { id: "t1", name: "Ward Nine Tole (test)", name_ne: "वडा नौ टोल (परीक्षण)", area_id: id("Dharan-9"), is_active: true },
      { id: "t2", name: "Ward Five Tole (test)", name_ne: null, area_id: id("Dharan-5"), is_active: true },
      { id: "t3", name: "Everywhere Tole (test)", name_ne: null, area_id: null, is_active: true },
    ];
  } catch { return null; }
}
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 400) : "")); };
const T = LOCALE === "ne"
  ? { ward5: "धरान-५", ward20: "धरान-२०", area: "क्षेत्र", tole: "टोल / सडक", house: "घर / गेट", landmark: "चिनारी", phone2: "अर्को फोन",
      toleLabel: /टोल \/ सडक/, houseLabel: /घर \/ गेट नम्बर/, landmarkLabel: /नजिकको चिनारी/, phone2Label: /अर्को फोन नम्बर/, other: /सूचीमा छैन/ }
  : { ward5: "Dharan-5", ward20: "Dharan-20", area: "Area", tole: "Tole / street", house: "House / gate", landmark: "Landmark", phone2: "Other phone",
      toleLabel: /Tole \/ street/, houseLabel: /House \/ gate number/, landmarkLabel: /Nearby landmark/, phone2Label: /Another phone number/, other: /not in the list/ };

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
  const fake = await pretendToles();
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/order_clicks")) return r.abort();
    if (fake && r.method() === "GET" && r.url().includes("/rest/v1/toles")) {
      return r.respond({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(fake) });
    }
    r.continue();
  });

  // Find a field by the text of its label, so the test reads the way a customer does.
  const field = (re) => page.evaluateHandle((src) => {
    const rx = new RegExp(src);
    const l = [...document.querySelectorAll('form[role="dialog"] label')].find((x) => rx.test(x.querySelector("span")?.textContent || ""));
    return l ? l.querySelector("input, select, textarea") : null;
  }, re.source);
  const fill = async (re, value) => { const h = await field(re); const el = h.asElement(); if (!el) throw new Error("no field " + re); await el.evaluate((e, v) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(e, v); e.dispatchEvent(new Event("input", { bubbles: true })); }, value); };
  const reopen = async () => { await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].find((x) => /Edit my details|विवरण सच्याउनुहोस्/.test(x.textContent)).click()); await page.waitForSelector('[role="dialog"] select', { visible: true }); await sleep(300); };
  const submit = () => page.click('form[role="dialog"] button:not([type])');
  const alerts = () => page.$$eval('[role="dialog"] [role="alert"]', (els) => els.map((e) => e.textContent));
  const reviewMsg = async () => { await page.waitForSelector("#review-title", { visible: true, timeout: 8000 }); return page.$eval("[role='dialog'] pre", (e) => e.textContent); };

  await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").startsWith("Add: ") || /^(थप्नुहोस्): Combo - 1/.test(x.getAttribute("aria-label") || "")).click());
  await sleep(400);
  await page.goto(BASE + "/basket", { waitUntil: "networkidle2" }); await page.waitForSelector("main li", { timeout: 15000 });
  await page.evaluate(() => [...document.querySelectorAll("main button")].find((x) => /Order on WhatsApp|व्हाट्सएपमा अर्डर/.test(x.textContent)).click());
  await page.waitForSelector('[role="dialog"] select', { visible: true, timeout: 8000 }); await sleep(300);

  // ---- what the form offers
  const opts = await page.$$eval('form[role="dialog"] select option', (os) => os.map((o) => ({ v: o.value, t: o.textContent.trim(), g: o.parentElement.tagName === "OPTGROUP" ? o.parentElement.label : "" })));
  const wards = opts.filter((o) => /^(Dharan|धरान)-[0-9०-९]+$/.test(o.t));
  ok("All 20 Dharan wards are in the list", wards.length === 20, String(wards.length));
  ok("Ward 5 and ward 20 are there by their names", wards.some((o) => o.t === T.ward5) && wards.some((o) => o.t === T.ward20));
  ok("The older places, Itahari, Biratnagar and nearby towns are still listed", ["Bhanu Chowk|भानु चोक", "Putali Line|पुतली लाइन", "Itahari|इटहरी", "Biratnagar|विराटनगर", "Inaruwa|इनरुवा"].every((p) => opts.some((o) => new RegExp(p).test(o.t))));
  const other = opts.find((o) => o.v === "other");
  ok("There is an option for an area that is not in the list", !!other && T.other.test(other.t), JSON.stringify(other));
  const dlg = await page.$eval('[role="dialog"]', (d) => d.innerText);
  ok("The form has Tole / street, House / gate, Nearby landmark and Another phone", T.toleLabel.test(dlg) && T.houseLabel.test(dlg) && T.landmarkLabel.test(dlg) && T.phone2Label.test(dlg), dlg.slice(0, 600));
  ok("The tole box offers suggestions (a datalist)", !!(await page.$('form[role="dialog"] input[list="tole-suggestions"]')) && !!(await page.$("datalist#tole-suggestions")));

  // ---- suggestions follow the chosen ward
  if (fake) {
    const suggestions = () => page.$$eval("datalist#tole-suggestions option", (os) => os.map((o) => o.value));
    await page.select('form[role="dialog"] select', wards.find((o) => o.t === (LOCALE === "ne" ? "धरान-९" : "Dharan-9")).v); await sleep(300);
    let s = await suggestions();
    ok("Ward 9: its own tole and the 'everywhere' tole are suggested", s.length === 2 && s.some((x) => /Everywhere Tole/.test(x)) && s.some((x) => (LOCALE === "ne" ? /वडा नौ टोल/ : /Ward Nine Tole/).test(x)), JSON.stringify(s));
    ok("Ward 9: another ward's tole is not suggested", !s.some((x) => /Ward Five/.test(x)), JSON.stringify(s));
    await page.select('form[role="dialog"] select', wards.find((o) => o.t === T.ward5).v); await sleep(300);
    s = await suggestions();
    ok("Ward 5: its own tole and the 'everywhere' tole are suggested", s.length === 2 && s.some((x) => /Ward Five Tole/.test(x)) && s.some((x) => /Everywhere Tole/.test(x)), JSON.stringify(s));
  } else {
    console.log("SKIP suggestion checks (could not read .env to look up the wards)");
  }

  // ---- BPKIHS has a fixed delivery charge of Rs. 50
  {
    const bp = opts.find((o) => /^(BPKIHS|बीपीकेआईएचएस)$/.test(o.t));
    ok("BPKIHS is in the area list", !!bp, JSON.stringify(opts.map((o) => o.t).slice(0, 12)));
    if (bp) {
      await page.select('form[role="dialog"] select', bp.v); await sleep(200);
      const ft = await page.$eval('[role="dialog"]', (d) => d.innerText);
      ok("Choosing BPKIHS shows that delivery there is Rs. 50", (LOCALE === "ne" ? /बीपीकेआईएचएस मा डेलिभरी शुल्क Rs\. 50 हो/ : /Delivery to BPKIHS is Rs\. 50/).test(ft), ft.slice(-400));
      await page.select('form[role="dialog"] select', wards.find((o) => o.t === T.ward5).v); await sleep(200);
      const ft2 = await page.$eval('[role="dialog"]', (d) => d.innerText);
      ok("Choosing a ward does not claim a fixed charge", !/Delivery to .* is Rs\.|मा डेलिभरी शुल्क Rs\. [0-9]+ हो/.test(ft2));
    }
  }

  // ---- rule: a tole or a landmark is needed
  await fill(/^(Your name|तपाईंको नाम)/, "Sita Rai");
  await fill(/^(Phone number|फोन नम्बर)/, "98 12345678");
  await page.select('form[role="dialog"] select', wards.find((o) => o.t === T.ward5).v);
  await submit(); await sleep(300);
  let a = await alerts();
  ok("With no tole and no landmark the form says so", a.length >= 1 && !(await page.$("#review-title")), JSON.stringify(a));
  await fill(T.toleLabel, "Putali Line");
  await sleep(150);
  ok("The message disappears once a tole is typed", (await alerts()).length === 0, JSON.stringify(await alerts()));

  // ---- rule: the second phone, when given, must be a real number
  await fill(T.phone2Label, "12345");
  await submit(); await sleep(300);
  a = await alerts();
  ok("A wrong second phone number is refused", a.length >= 1 && !(await page.$("#review-title")), JSON.stringify(a));

  // ---- everything filled in
  await fill(T.phone2Label, "98 01112233");
  await fill(T.houseLabel, "House 14, blue gate");
  await fill(T.landmarkLabel, "Near Nabil Bank");
  await submit();
  let msg = await reviewMsg();
  ok(`Message: Area reads ${T.ward5}`, msg.includes(`${T.area}: ${T.ward5}\n`) && !/Dharan – Dharan|धरान – धरान/.test(msg), msg);
  ok("Message: Tole / street", msg.includes(`${T.tole}: Putali Line`), msg);
  ok("Message: House / gate", msg.includes(`${T.house}: House 14, blue gate`), msg);
  ok("Message: Landmark", msg.includes(`${T.landmark}: Near Nabil Bank`), msg);
  ok("Message: the second phone, cleaned", msg.includes(`${T.phone2}: 9801112233`), msg);
  const order = [T.area + ":", T.tole + ":", T.house + ":", T.landmark + ":"].map((s) => msg.indexOf(s));
  ok("Message: the address lines come in a sensible order for a rider", order.every((x, i) => x >= 0 && (i === 0 || x > order[i - 1])), JSON.stringify(order));

  // ---- a landmark alone is enough, and empty extras leave no empty lines
  await reopen();
  await fill(T.toleLabel, ""); await fill(T.houseLabel, ""); await fill(T.phone2Label, "");
  await submit();
  msg = await reviewMsg();
  ok("A landmark alone is accepted", msg.includes(`${T.landmark}: Near Nabil Bank`));
  ok("Message: empty tole, house and second phone leave no empty lines", !msg.includes(`${T.tole}:`) && !msg.includes(`${T.house}:`) && !msg.includes(`${T.phone2}:`), msg);

  // ---- an area that is not in the list, typed by hand
  await reopen();
  await page.select('form[role="dialog"] select', "other"); await sleep(200);
  const typed = await page.$$('form[role="dialog"] input:not([type=radio]):not([type=tel]):not([type=time]):not([list])');
  const box = (await page.evaluateHandle(() => [...document.querySelectorAll('form[role="dialog"] label')].find((l) => /area, ward or town|क्षेत्र, वडा वा सहर/.test(l.querySelector("span")?.textContent || ""))?.querySelector("input"))).asElement();
  ok("Choosing 'not in the list' shows a box to type the area", !!box && typed.length >= 1);
  await box.evaluate((e) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(e, "Hatkhola, Dharan-9"); e.dispatchEvent(new Event("input", { bubbles: true })); });
  await submit();
  msg = await reviewMsg();
  ok("Message: the typed area is used as the area", msg.includes(`${T.area}: Hatkhola, Dharan-9\n`), msg);

  await reopen();
  await box.evaluate((e) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(e, ""); e.dispatchEvent(new Event("input", { bubbles: true })); }).catch(() => {});
  const box2 = (await page.evaluateHandle(() => [...document.querySelectorAll('form[role="dialog"] label')].find((l) => /area, ward or town|क्षेत्र, वडा वा सहर/.test(l.querySelector("span")?.textContent || ""))?.querySelector("input"))).asElement();
  await box2.evaluate((e) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(e, ""); e.dispatchEvent(new Event("input", { bubbles: true })); });
  await submit(); await sleep(300);
  ok("Leaving the typed area empty is refused with a message", (await alerts()).length >= 1 && !(await page.$("#review-title")), JSON.stringify(await alerts()));

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
