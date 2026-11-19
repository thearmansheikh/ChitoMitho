// Nepali audit: with the language set to Nepali, finds English words that should have been translated.
// Looks at visible text, placeholders, aria-labels, titles and alt text on every public page and on the main pop-ups and error messages.
// Reads only; writes nothing to the database.   Usage: BASE=http://localhost:3000 node tests/e2e/nepali-audit.cjs
// Set REPORT=1 to print every finding even when it is on the allow-list.
const fs = require("fs");
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 1500) : "")); };

// English that is allowed to stay: brand and app names, units, and the names of real menu items and places (which come from the database).
const ALLOWED = [
  /^(Chitto|Mitho|Chito)$/i, /^WhatsApp$/i, /^TikTok$/i, /^Instagram$/i, /^Rs\.?$/i, /^NPR$/i, /^EN$/, /^ID$/, /^OK$/i,
  /^(kg|gm|g|ml|ltr|l|pc|pcs|lb|oz|cm|am|pm)$/i, /^[A-Z]{1,3}$/,
  // payment and technology names that are written the same in Nepali
  /^(eSewa|Khalti|Fonepay|QR|Vercel|Supabase|Google|Maps|Facebook)$/i,
  // social handles, phone-number placeholders and the preview-only banner
  /^(chitomithooo|chito_mithooo|mithooo|X+)$/i,
];
const isAllowed = (w) => ALLOWED.some((r) => r.test(w));

// Real content from the database (place, category and item names, descriptions, units). It is English because the owner typed it in
// English; the site falls back to it when there is no Nepali name. It is allowed to stay. Everything else must be translated.
let DB_STRINGS = [];
async function loadDbStrings() {
  const env = Object.fromEntries(fs.readFileSync(require("path").join(__dirname, "../../.env"), "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
  const url = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "") + (env.NEXT_PUBLIC_SUPABASE_URL.includes(".supabase.co") ? "" : ".supabase.co");
  const get = async (table, cols) => (await (await fetch(`${url}/rest/v1/${table}?select=${cols}&limit=5000`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, authorization: "Bearer " + env.NEXT_PUBLIC_SUPABASE_ANON_KEY } })).json());
  const rows = [...(await get("places", "name,description,address")), ...(await get("categories", "name")), ...(await get("items", "name,description,unit")), ...(await get("areas", "name")), ...(await get("toles", "name"))];
  DB_STRINGS = [...new Set(rows.flatMap((r) => Object.values(r)).filter((v) => typeof v === "string" && /[A-Za-z]/.test(v)).map((v) => v.trim()))].sort((x, y) => y.length - x.length);
}
const withoutDbText = (s) => { let r = s; for (const d of DB_STRINGS) if (d.length > 2 && r.includes(d)) r = r.split(d).join(" "); return r; };

const TEXT_JS = `(() => {
  const out = [];
  const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const p = n.parentElement;
    if (!p || skip.has(p.tagName)) continue;
    const s = n.nodeValue.replace(/\\s+/g, " ").trim();
    if (s) out.push({ kind: "text", where: p.tagName.toLowerCase() + (p.className && typeof p.className === "string" ? "." + p.className.split(" ")[0] : ""), text: s, data: !!p.closest("[data-i18n-data]") });
  }
  for (const el of document.querySelectorAll("[placeholder],[aria-label],[title],img[alt]")) {
    for (const a of ["placeholder", "aria-label", "title", "alt"]) {
      const v = el.getAttribute(a);
      if (v && v.trim()) out.push({ kind: a, where: el.tagName.toLowerCase(), text: v.trim() });
    }
  }
  return out;
})()`;

function findings(items) {
  const bad = [];
  for (const it of items) {
    // Phone numbers, prices, links and handles are fine as they are.
    const cleaned = withoutDbText(it.text).replace(/https?:\/\/\S+/g, " ").replace(/@[\w.]+/g, " ").replace(/\S+@\S+/g, " ");
    const words = cleaned.match(/[A-Za-z][A-Za-z'’.-]*/g) || [];
    const english = words.map((w) => w.replace(/[.'’-]+$/g, "")).filter((w) => w.length > 0 && !isAllowed(w));
    if (english.length > 0) bad.push({ ...it, english });
  }
  return bad;
}

(async () => {
  await loadDbStrings();
  console.log(`(${DB_STRINGS.length} English names and descriptions from the database are allowed to stay)`);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
  await page.setRequestInterception(true);
  page.on("request", (r) => (r.method() === "POST" && /order_clicks/.test(r.url()) ? r.respond({ status: 201, body: "" }) : r.continue()));
  const go = async (p) => { await page.goto(BASE + p, { waitUntil: "networkidle2", timeout: 90000 }); await sleep(900); };
  const audit = async (label, extra = "") => {
    const items = await page.evaluate(TEXT_JS);
    const bad = findings(items);
    ok(`Nepali: ${label} has no untranslated English${extra}`, bad.length === 0, bad.slice(0, 12).map((b) => `[${b.kind} in ${b.where}] "${b.text.slice(0, 90)}" → ${b.english.join(",")}`).join("\n     "));
    if (process.env.REPORT) console.log(bad.map((b) => `   . ${b.text.slice(0, 100)}`).join("\n"));
  };

  const pages = ["/", "/food", "/p/the-chicken-box", "/groceries", "/gifts", "/liquor", "/parcel", "/anything", "/partner", "/areas", "/about", "/promise", "/help", "/privacy", "/terms", "/basket", "/this-page-does-not-exist"];
  for (const p of pages) { await go(p); await audit(`page ${p}`); }

  // ---------- pop-ups, forms and error messages (pretend it is 13:20 so ordering is open) ----------
  await page.evaluateOnNewDocument(() => {
    const Real = Date, now = Real.now(), npt = new Real(now + 5.75 * 3600_000);
    const target = Real.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 13, 20) - 5.75 * 3600_000;
    const offset = target - now;
    class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
    window.Date = Fake;
    window.open = () => ({});
    window.confirm = (m) => { (window.__confirms = window.__confirms || []).push(m); return true; };
  });
  const clickText = (scope, re) => page.evaluate((s, src) => { const b = [...document.querySelectorAll(s + " button")].find((x) => new RegExp(src).test(x.textContent) && !x.disabled); if (!b) return false; b.scrollIntoView({ block: "center" }); b.click(); return true; }, scope, re.source);

  await go("/p/the-chicken-box");
  await page.waitForSelector("button[aria-label^='थप्नुहोस्']", { timeout: 20000 });
  await page.evaluate(() => { const b = document.querySelector("button[aria-label^='थप्नुहोस्']"); b.scrollIntoView({ block: "center" }); b.click(); });
  await sleep(500);
  await audit("the shop page after adding an item (stepper, basket bar)");
  // the item detail sheet
  await page.evaluate(() => { const b = [...document.querySelectorAll("button[aria-label*=':']")].find((x) => x.getAttribute("aria-label") && !/^(थप्नुहोस्|एउटा|एउटा घटाउनुहोस्)/.test(x.getAttribute("aria-label"))); if (b) { b.scrollIntoView({ block: "center" }); b.click(); } });
  await page.waitForSelector("[role=dialog]", { timeout: 6000 }).catch(() => {});
  if (await page.$("[role=dialog]")) { await audit("the item detail sheet"); await page.keyboard.press("Escape"); await sleep(300); }

  await go("/basket");
  await page.waitForSelector("main li", { timeout: 20000 }).catch(() => {});
  await audit("the basket with an item");
  await page.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /व्हाट्सएपमा अर्डर/.test(x.textContent)); b && b.click(); });
  await page.waitForSelector('[role="dialog"] input', { visible: true, timeout: 8000 }).catch(() => {});
  await audit("the details form");
  // "later" delivery option: day names and times
  await page.evaluate(() => { const r = [...document.querySelectorAll('[role="dialog"] input[type=radio]')]; const later = r.find((x) => /later/i.test(x.value)) || r[1]; later && later.click(); });
  await sleep(400);
  await audit("the details form with 'deliver later' chosen");
  await page.click('form[role="dialog"] button:not([type])').catch(() => {});
  await sleep(500);
  await audit("the details form with error messages");
  await page.evaluate(() => { const r = document.querySelector('[role="dialog"] input[type=radio]'); r && r.click(); }); // back to "as soon as possible"
  await sleep(300);
  const areaVal = await page.$eval('form[role="dialog"] select option[value]:not([value=""]):not([value="other"])', (o) => o.value).catch(() => "");
  if (areaVal) {
    await page.type('[role="dialog"] input[autocomplete="name"]', "सीता राई");
    await page.type('[role="dialog"] input[type="tel"]', "9812345678");
    await page.select('form[role="dialog"] select', areaVal);
    await page.type('[role="dialog"] input[list="tole-suggestions"]', "नबिल बैंक नजिक");
    await page.click('form[role="dialog"] button:not([type])');
    await page.waitForSelector("#review-title", { visible: true, timeout: 8000 }).catch(() => {});
    ok("Nepali: the review screen was reached", !!(await page.$("#review-title")));
    await audit("the review screen", " (the order message itself is checked separately)");
  }

  for (const [path, btn, label] of [["/parcel", /व्हाट्सएपमा अर्डर/, "parcel form errors"], ["/anything", /व्हाट्सएपमा अर्डर/, "order-anything form errors"], ["/partner", /पठाउनुहोस्|व्हाट्सएप/, "partner form errors"]]) {
    await go(path);
    await clickText("main", btn);
    await sleep(400);
    await audit(label);
  }

  // The page language and the toggle
  await go("/");
  const lang = await page.$eval("html", (h) => h.lang);
  ok("Nepali: <html lang> is 'ne'", lang === "ne", lang);
  const pressed = await page.$$eval("header [aria-pressed]", (bs) => bs.map((b) => b.textContent.trim() + ":" + b.getAttribute("aria-pressed")));
  ok("Nepali: the toggle shows नेपाली as selected", pressed.includes("नेपाली:true") && pressed.includes("EN:false"), JSON.stringify(pressed));

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
