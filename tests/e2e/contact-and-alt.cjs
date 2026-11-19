// Contact details are labelled, social links show their names (not URLs), no raw URL is visible, and images have alt text.
// Writes nothing to the database. Usage: BASE=https://chitomitho.vercel.app node tests/e2e/contact-and-alt.cjs
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGES = ["/", "/food", "/p/the-chicken-box", "/groceries", "/liquor", "/gifts", "/parcel", "/anything", "/basket", "/about", "/promise", "/partner", "/areas", "/help", "/privacy", "/terms"];
let pass = 0, fail = 0;
const ok = (n, p, extra = "") => { p ? pass++ : fail++; console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 400) : "")); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  for (const locale of ["en", "ne"]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.setCookie({ name: "NEXT_LOCALE", value: locale, url: BASE });
    const LABEL = locale === "ne" ? /(फोन|व्हाट्सएप):\s*$/ : /(Call|WhatsApp):\s*$/;
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 90000 }); await sleep(700);
      const info = await page.evaluate(() => {
        const text = document.body.innerText;
        const numbers = [...text.matchAll(/\b9[78]\d{8}\b/g)].map((m) => ({ n: m[0], before: text.slice(Math.max(0, m.index - 16), m.index) }));
        const tel = [...document.querySelectorAll("a[href^='tel:']")].map((a) => ({ href: a.getAttribute("href"), text: a.innerText.replace(/\s+/g, " ").trim() }));
        const social = [...document.querySelectorAll("a[href*='tiktok.com'], a[href*='instagram.com']")].map((a) => ({ href: a.getAttribute("href"), text: a.innerText.replace(/\s+/g, " ").trim(), aria: a.getAttribute("aria-label") }));
        const urls = text.match(/https?:\/\/\S+|\bwww\.\S+|\S+\.vercel\.app\S*/g) || [];
        const imgs = [...document.images].map((i) => ({ src: (i.getAttribute("src") || "").slice(0, 60), alt: i.getAttribute("alt"), hidden: i.getAttribute("aria-hidden") === "true" || i.getAttribute("role") === "presentation" }));
        return { numbers, tel, social, urls, imgs };
      });
      const tag = `${locale} ${path}`;
      const unlabelled = info.numbers.filter((x) => !LABEL.test(x.before));
      ok(`${tag}: every phone number shown has a Call / WhatsApp label`, unlabelled.length === 0, JSON.stringify(unlabelled));
      ok(`${tag}: every tel: link says Call and shows its number`, info.tel.every((t) => (locale === "ne" ? /फोन:/ : /Call:/).test(t.text) && /\b9[78]\d{8}\b/.test(t.text)), JSON.stringify(info.tel));
      ok(`${tag}: TikTok and Instagram links show their names and handles`, info.social.every((s) => (/TikTok|टिकटक/.test(s.text) && /@chitomithooo/.test(s.text)) || (/Instagram|इन्स्टाग्राम/.test(s.text) && /@chito_mithooo/.test(s.text))), JSON.stringify(info.social));
      ok(`${tag}: social links have an aria-label or readable text`, info.social.every((s) => s.aria || s.text), JSON.stringify(info.social));
      ok(`${tag}: no raw URL is visible`, info.urls.length === 0, JSON.stringify(info.urls));
      const badImgs = info.imgs.filter((i) => i.alt === null || (i.alt.trim() === "" && !i.hidden));
      ok(`${tag}: every image has alt text (or is hidden as decoration)`, badImgs.length === 0, JSON.stringify(badImgs));
    }

    // specific alt text
    await page.goto(BASE + "/", { waitUntil: "networkidle2" }); await sleep(500);
    const logos = await page.$$eval("img[src*='icons%2Flogo']", (is) => is.map((i) => i.alt));
    const wantLogo = locale === "ne" ? "चित्तो मिठो लोगो" : "Chitto Mitho logo";
    ok(`${locale}: the logo's alt text is "${wantLogo}" (header and footer)`, logos.length >= 2 && logos.every((a) => a === wantLogo), JSON.stringify(logos));
    const partners = await page.$$eval("img[src*='images%2Fpartners']", (is) => is.map((i) => i.alt));
    ok(`${locale}: partner logos are named after the business`, partners.length >= 8 && partners.every((a) => a.length > 3), JSON.stringify(partners));
    await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2" }); await sleep(800);
    const items = await page.$$eval("main li", (lis) => lis.filter((l) => l.querySelector("img[src*='menu']")).map((l) => ({ alt: l.querySelector("img[src*='menu']").alt, name: l.querySelector("span.font-bold, p.font-bold")?.textContent.trim() })));
    ok(`${locale}: item photos use the item name as alt text`, items.length > 50 && items.every((i) => i.alt && i.alt === i.name), JSON.stringify(items.find((i) => i.alt !== i.name)));
    await page.close();
  }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
