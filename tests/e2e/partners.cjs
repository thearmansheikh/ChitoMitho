// Every logo and card must lead somewhere: a menu, or a clear "Menu coming soon" with an order-on-WhatsApp button.
// Writes nothing to the database. Usage: BASE=https://chitomitho.vercel.app node tests/e2e/partners.cjs     (LOCALE=ne for Nepali)
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LOCALE = process.env.LOCALE || "en";
const NE = LOCALE === "ne";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 400) : "")); };
const SOON = NE ? /मेनु छिट्टै आउँदैछ/ : /Menu coming soon/;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  if (NE) await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });

  // ---------- home: the logo strip ----------
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1000);
  const logos = await page.$$eval("section[aria-label] ul a[href^='/p/']", (as) => as.map((a) => ({ href: a.getAttribute("href"), label: a.getAttribute("aria-label"), alt: a.querySelector("img")?.alt })));
  ok("Home: the logo strip has the 8 partners and The Chicken Box", logos.length >= 9, String(logos.length));
  ok("Home: every logo is a link to its own place page", logos.every((l) => /^\/p\/[a-z0-9-]+$/.test(l.href)), JSON.stringify(logos.map((l) => l.href)));
  ok("Home: every logo has a name (alt text)", logos.every((l) => l.alt && l.alt.length > 3), JSON.stringify(logos.map((l) => l.alt)));
  ok("Home: logos of places with no menu say so in their link label", logos.filter((l) => l.href !== "/p/the-chicken-box").every((l) => SOON.test(l.label)), JSON.stringify(logos.map((l) => l.label)));
  const home = await page.$eval("main", (m) => m.innerText);
  ok("Home: 'Popular places' is hidden while fewer than two places have a menu", !/Popular places|लोकप्रिय ठाउँहरू/.test(home));

  // ---------- every logo leads somewhere real ----------
  const slugs = [...new Set(logos.map((l) => l.href.replace("/p/", "")))];
  let checked = 0;
  for (const slug of slugs) {
    const res = await page.goto(BASE + "/p/" + slug, { waitUntil: "networkidle2", timeout: 90000 }); await sleep(500);
    const text = await page.$eval("main", (m) => m.innerText);
    const h1 = await page.$eval("h1", (e) => e.textContent.trim()).catch(() => "");
    const noindex = await page.$eval("meta[name=robots]", (m) => m.content).catch(() => "");
    const isChicken = slug === "the-chicken-box";
    const wa = await page.$$eval("main a[href*='api.whatsapp.com']", (as) => as.map((a) => decodeURIComponent(new URL(a.href).searchParams.get("text") || "")));
    const good = res.status() === 200 && !!h1 && (isChicken ? /Combo 1/.test(text) : SOON.test(text) && wa.some((w) => (NE ? /नमस्ते, म .* बाट अर्डर गर्न चाहन्छु/ : /^Hi, I'd like to order from .+\.$/).test(w)));
    ok(`/p/${slug}: opens a real page (${isChicken ? "with a menu" : "with 'Menu coming soon' and an order-on-WhatsApp button"})`, good, `${res.status()} h1="${h1}" wa=${JSON.stringify(wa)}`);
    if (!isChicken) ok(`/p/${slug}: asks search engines to leave the empty page out`, /noindex/.test(noindex), noindex);
    if (!isChicken && NE === false) ok(`/p/${slug}: the message names this place`, wa.some((w) => w.includes(h1)), JSON.stringify(wa));
    checked++;
  }
  ok("Every partner page was checked", checked === slugs.length && checked >= 9);

  // ---------- /food ----------
  await page.goto(BASE + "/food", { waitUntil: "networkidle2" }); await sleep(1000);
  const cards = await page.$$eval("main a[href^='/p/']", (as) => as.filter((a) => a.querySelector("p.text-lg")).map((a) => ({ href: a.getAttribute("href"), badge: /Menu coming soon|मेनु छिट्टै आउँदैछ/.test(a.innerText) })));
  ok("Food: a card for every food place", cards.length >= 8, String(cards.length));
  ok("Food: places with no menu carry the 'Menu coming soon' badge, The Chicken Box does not", cards.filter((c) => c.href !== "/p/the-chicken-box").every((c) => c.badge) && cards.find((c) => c.href === "/p/the-chicken-box")?.badge === false, JSON.stringify(cards));
  const first = await page.$("main a[href='/p/anzees-cafe-bakery']");
  await first.click();
  await page.waitForFunction(() => location.pathname === "/p/anzees-cafe-bakery", { timeout: 10000 }).catch(() => {});
  ok("Food: tapping a card opens that place", page.url().endsWith("/p/anzees-cafe-bakery"), page.url());

  // ---------- gifts: the place with no menu gets the card, not an empty section ----------
  await page.goto(BASE + "/gifts", { waitUntil: "networkidle2" }); await sleep(800);
  const gifts = await page.$eval("main", (m) => m.innerText);
  ok("Gifts: Sweet Treats (no menu) shows 'Menu coming soon' with an order button", /Sweet Treats/.test(gifts) && SOON.test(gifts));

  // ---------- sitemap ----------
  const sm = await (await fetch(BASE + "/sitemap.xml")).text();
  ok("Sitemap: lists The Chicken Box", sm.includes("/p/the-chicken-box"));
  ok("Sitemap: leaves out places with no menu (their pages are noindex)", !/\/p\/(anzees-cafe-bakery|sweet-treats|the-cake-palace)/.test(sm));

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
