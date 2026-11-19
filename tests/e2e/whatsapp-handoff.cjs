// Where does the customer end up when they send an order or tap a WhatsApp button? Checked as Android Chrome, iPhone Safari,
// iPhone Chrome and a desktop browser. Writes nothing to the database (the order-count request is blocked).
// Usage: BASE=https://chitomitho.vercel.app node tests/e2e/whatsapp-handoff.cjs
// Note: this emulates the phones' screen size, touch and browser identity. The WhatsApp app itself is not part of it.
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
// These tests pretend it is 13:20 in Nepal. When the real time is outside opening hours the server's page says "Closed" and the
// pretend clock says "Open", which React reports as hydration errors #418/#423/#425. That is the test's clock, not a site fault.
const CLOCK_NOISE = /React error #(418|423|425)/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, extra = "") => { results.push(pass); console.log((pass ? "PASS " : "FAIL ") + name + (extra && !pass ? "  -> " + String(extra).slice(0, 300) : "")); };

const PROFILES = [
  { name: "Android Chrome", mobile: true, width: 412, height: 915, ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36" },
  { name: "iPhone Safari", mobile: true, width: 390, height: 844, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" },
  { name: "iPhone Chrome", mobile: true, width: 390, height: 844, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1" },
  { name: "Desktop (WhatsApp Web)", mobile: false, width: 1366, height: 800, ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" },
];

async function run(browser, prof) {
  console.log(`\n=== ${prof.name}`);
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setUserAgent(prof.ua);
  await page.setViewport({ width: prof.width, height: prof.height, isMobile: prof.mobile, hasTouch: prof.mobile });
  await page.evaluateOnNewDocument(() => {
    // Pretend it is 13:20 in Nepal so the shop is open.
    const Real = Date, now = Real.now(), npt = new Real(now + 5.75 * 3600_000);
    const target = Real.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 13, 20) - 5.75 * 3600_000;
    const offset = target - now;
    class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
    window.Date = Fake;
  });

  const log = [];                    // everything that happened, in order
  let waRequests = [];
  let navAt = 0;               // navigations to WhatsApp from the main tab
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("/rest/v1/order_clicks") && req.method() === "POST") { log.push("order-count"); return req.abort(); }
    if (u.startsWith("https://api.whatsapp.com/send") && req.isNavigationRequest()) {
      waRequests.push(u); log.push("whatsapp-navigation"); navAt = Date.now();
      return req.respond({ status: 200, contentType: "text/html", body: "<html><body>WhatsApp (stub)</body></html>" });
    }
    req.continue();
  });
  const popups = [];
  // A new tab reports its address a moment after it opens, so watch for changes too.
  const seenTabs = new Set();
  const watchTab = (t) => { const u = t.url(); if (u.startsWith("https://api.whatsapp.com/send") && !seenTabs.has(u)) { seenTabs.add(u); popups.push(u); log.push("whatsapp-new-tab"); } };
  browser.on("targetcreated", watchTab);
  browser.on("targetchanged", watchTab);
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));

  const text = (sel) => page.$eval(sel, (e) => e.innerText).catch(() => "");
  const clickByLabel = (endsWith) => page.evaluate((s) => { const b = [...document.querySelectorAll("button, a")].find((x) => (x.getAttribute("aria-label") || "").endsWith(s)); if (!b) return false; b.scrollIntoView({ block: "center" }); b.click(); return true; }, endsWith);
  const decode = (u) => { try { return new URL(u).searchParams.get("text") || ""; } catch { return ""; } };

  // --- A. WhatsApp button with an EMPTY basket: a chat that starts with a short hello, never blank
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1200);
  const hello = prof.mobile
    ? await page.evaluate(() => document.querySelector("nav[aria-label] a[aria-label][href^='https://api.whatsapp.com/send']")?.href)
    : await page.evaluate(() => document.querySelector("header a[href^='https://api.whatsapp.com/send']")?.href);
  ok("Empty basket: the WhatsApp button's link has a hello message", !!hello && /[?&]text=.{5,}/.test(hello) && decode(hello).startsWith("Hi Chitto Mitho"), hello);
  ok("Empty basket: the link goes to the order number with no + or spaces", !!hello && hello.startsWith("https://api.whatsapp.com/send?phone=9779805338257&text="), hello);
  const footerLinks = await page.$$eval("a[href^='https://api.whatsapp.com/send']", (as) => as.map((a) => a.href));
  ok("Every WhatsApp link on the home page carries a message", footerLinks.length >= 2 && footerLinks.every((h) => /[?&]text=.{5,}/.test(h)), JSON.stringify(footerLinks));

  // --- B. Put things in the basket
  await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2" }); await sleep(1500);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").startsWith("Add: Combo - 1")); b && b.click(); });
  await sleep(200);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").startsWith("Add one: Combo - 1")); b && b.click(); });
  await sleep(300);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("cm-basket-v1") || "{}").lines || []);
  ok("The basket holds 2 x Combo - 1", stored.length === 1 && stored[0].qty === 2, JSON.stringify(stored.map((l) => [l.name, l.qty])));

  // --- C. WhatsApp button WITH a full basket: goes to the order details, not a blank chat
  log.length = 0; waRequests = []; popups.length = 0;
  const btnSel = prof.mobile ? "nav[aria-label] a[aria-label][href^='https://api.whatsapp.com/send']" : "header a[href^='https://api.whatsapp.com/send']";
  const waBtn = await page.$(btnSel);
  await waBtn.scrollIntoView();
  await waBtn.click();
  await page.waitForFunction(() => location.pathname === "/basket", { timeout: 10000 }).catch(() => {});
  await page.waitForSelector("[role=dialog] input", { visible: true, timeout: 8000 }).catch(() => {});
  ok("Full basket: the WhatsApp button does NOT open a chat", waRequests.length === 0 && popups.length === 0, JSON.stringify(log));
  ok("Full basket: it opens the basket with the details form ready", (await page.url()).includes("/basket") && !!(await page.$("[role=dialog] input")), page.url());
  ok("Full basket: the ?order=1 marker is removed from the address", !(await page.url()).includes("order=1"), page.url());

  // --- D. Fill the form and send
  await sleep(400);
  await page.type('[role="dialog"] input[autocomplete="name"]', "Sita Rai");
  await page.type('[role="dialog"] input[type="tel"]', "98 12345678");
  const areaVal = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.value);
  await page.select('form[role="dialog"] select', areaVal);
  await page.type('[role="dialog"] input[list="tole-suggestions"]', "Near Nabil Bank, blue gate");
  await page.click('form[role="dialog"] button:not([type])');
  await page.waitForSelector("#review-title", { visible: true, timeout: 8000 });
  const shown = await page.$eval("[role='dialog'] pre", (e) => e.textContent);
  ok("The review screen shows the full order message", /2 x Combo - 1/.test(shown) && /Sita Rai/.test(shown), shown.slice(0, 200));

  log.length = 0; waRequests = []; popups.length = 0;
  // A real mouse click (a scripted click is not a user tap, so browsers would block a new tab).
  const clickAt = Date.now();
  const sendBtn = await page.evaluateHandle(() => [...document.querySelectorAll("[role=dialog] button")].find((x) => /Open WhatsApp/.test(x.textContent)));
  await sendBtn.scrollIntoView();
  await sendBtn.click();
  // Everything below must already have happened as a direct result of that one tap.
  await sleep(1500);
  const urls = prof.mobile ? waRequests : popups;
  ok(`Send: WhatsApp opens (${prof.mobile ? "in this tab" : "in a new tab"})`, urls.length === 1, JSON.stringify(log));
  const url = urls[0] || "";
  ok("Send: the link goes to WhatsApp, to 9779805338257", url.startsWith("https://api.whatsapp.com/send?phone=9779805338257&text=") || url.startsWith("https://api.whatsapp.com/send/?phone=9779805338257&text="), url.slice(0, 90));
  ok("Send: the chat is NOT empty: the whole order is in the link", /2 x Combo - 1 \(Rs\. 459\) = Rs\. 918/.test(decode(url)) && /Items total: Rs\. 918/.test(decode(url)) && /Sita Rai/.test(decode(url)), decode(url).slice(0, 200));
  ok("Send: the message is exactly what the customer reviewed", decode(url) === shown.replace(/\r/g, ""));
  ok("Send: the scooter emoji in the title is intact (not a broken character)", decode(url).startsWith("🛵"), decode(url).slice(0, 10));
  // On a phone the order of events is exact. A new tab reports itself late, so the order is only checked there.
  // Nothing is awaited before WhatsApp opens: the old code waited up to 0.8 s for the order count first.
  if (prof.mobile) ok("Send: WhatsApp opens straight away (nothing waits first)", navAt > 0 && navAt - clickAt < 500, navAt ? (navAt - clickAt) + " ms" : "never");
  ok("Send: the order count is still sent (in the background)", log.includes("order-count"), JSON.stringify(log));
  if (!prof.mobile) {
    const stillThere = page.url().includes("/basket") || (await text("main")).length > 0;
    const sentScreen = !!(await page.$("#sent-title"));
    ok("Desktop: the website tab stays open on the confirmation screen", stillThere && sentScreen && !page.url().startsWith("https://api.whatsapp.com"), page.url());
  }
  // --- E. The partner form (its own send code) must hand over its message the same way
  await page.bringToFront(); // on a computer the new WhatsApp tab took focus
  log.length = 0; waRequests = []; popups.length = 0; seenTabs.clear();
  await page.goto(BASE + "/partner", { waitUntil: "networkidle2" }); await sleep(1200);
  await page.type("input[autocomplete='organization']", "Test Café & Grill #1");
  await page.type("input[autocomplete='name']", "Ram Sharma");
  await page.type("input[type='tel']", "9801234567");
  const inputs = await page.$$("form input:not([type=checkbox]):not([type=tel]):not([autocomplete])");
  if (inputs[0]) await inputs[0].type("Dharan, near the bus park");
  await (await page.$("form input[type=checkbox]")).click();
  const partnerBtn = await page.evaluateHandle(() => [...document.querySelectorAll("form button")].find((b) => b.type === "submit" || !b.getAttribute("type")));
  await partnerBtn.scrollIntoView();
  await partnerBtn.click();
  await sleep(1500);
  const pUrl = (prof.mobile ? waRequests : popups)[0] || "";
  ok("Partner form: WhatsApp opens with the message in the link", pUrl.startsWith("https://api.whatsapp.com/send") && /Test Café & Grill #1/.test(decode(pUrl)) && /Ram Sharma/.test(decode(pUrl)), decode(pUrl).slice(0, 160) || "no link");
  ok("Partner form: nothing broken in the message (no replacement characters)", !decode(pUrl).includes("\uFFFD"));

  const realErrs = errs.filter((e) => !CLOCK_NOISE.test(e));
  ok("No page errors", realErrs.length === 0, JSON.stringify(realErrs));
  await ctx.close();
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  for (const p of PROFILES) { try { await run(browser, p); } catch (e) { ok(`${p.name}: ran to the end`, false, e.message); } }
  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
