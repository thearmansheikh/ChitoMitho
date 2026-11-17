const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const pages = process.argv.slice(2);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  for (const path of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: Number(process.env.W || 390), height: 844, isMobile: true, hasTouch: true });
    if (process.env.LOCALE) await page.setCookie({ name: "NEXT_LOCALE", value: process.env.LOCALE, url: BASE });
    await page.goto(BASE + path, { waitUntil: "networkidle0" });
    const r = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      // Anything wider than the screen only matters if no ancestor clips it.
      const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "hidden" || o === "auto" || o === "scroll") return true; } return false; };
      const bad = [...document.querySelectorAll("body *")]
        .map((e) => ({ e, r: e.getBoundingClientRect() }))
        .filter(({ e, r }) => r.width > 0 && r.right > w + 1 && !clipped(e))
        .slice(0, 8)
        .map(({ e, r }) => `${e.tagName.toLowerCase()}.${(e.className && e.className.toString ? e.className.toString() : "").slice(0, 70)} right=${Math.round(r.right)} width=${Math.round(r.width)} text="${(e.textContent || "").trim().slice(0, 30)}"`);
      return { clientWidth: w, scrollWidth: document.documentElement.scrollWidth, innerHeight: innerHeight, bad };
    });
    console.log(path, JSON.stringify({ clientWidth: r.clientWidth, scrollWidth: r.scrollWidth, innerHeight: r.innerHeight }));
    r.bad.forEach((b) => console.log("   wider than screen:", b));
    await page.close();
  }
  await browser.close();
})();
