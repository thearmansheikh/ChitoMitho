// How menu items read: name, unit, description and price are separate, no ALL-CAPS descriptions, no price touching a word.
// Writes nothing to the database. Usage: BASE=https://chitomitho.vercel.app node tests/e2e/menu-text.cjs     (LOCALE=ne for Nepali)
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LOCALE = process.env.LOCALE || "en";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 400) : "")); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  if (LOCALE === "ne") await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });

  // The raw text of a page, the way a search engine or a screen reader reads it (textContent, not what is drawn).
  const rawText = (sel) => page.$eval(sel, (e) => e.textContent);
  // Each menu row's own text.
  const rows = () => page.$$eval("main li", (lis) => lis.map((l) => l.textContent.replace(/\s+/g, " ").trim()).filter((t) => /Rs\./.test(t)));

  // ---------- The Chicken Box ----------
  await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1500);
  const cb = await rawText("main");
  const cbRows = await rows();
  ok("Chicken Box: there are menu rows", cbRows.length >= 100, String(cbRows.length));
  ok("Chicken Box: no price touches a word or number (no 'MAYORs.' / '1 DIPRs.')", !/[A-Za-z0-9)]Rs\./.test(cb), cb.match(/.{15}[A-Za-z0-9)]Rs\..{6}/)?.[0]);
  ok("Chicken Box: every price has a space or label before it in every row", cbRows.every((r) => !/[A-Za-z0-9)]Rs\./.test(r)));
  ok("Chicken Box: no ALL-CAPS description lines", !/\b[A-Z]{3,}( [A-Z&]{2,}){2,}/.test(cb), cb.match(/.{10}\b[A-Z]{3,}( [A-Z&]{2,}){2,}.{10}/)?.[0]);
  const combos = cbRows.filter((r) => /^Combo \d+\b/.test(r));
  ok("Chicken Box: ten combos are named Combo 1 to Combo 10", combos.length === 10 && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((n) => combos.some((c) => new RegExp("^Combo " + n + " ").test(c))), JSON.stringify(combos.map((c) => c.slice(0, 20))));
  ok("Chicken Box: no 'Combo - N' left anywhere", !/Combo - \d/.test(cb));
  ok("Chicken Box: combo descriptions are joined with +", combos.every((c) => c.includes(" + ")), combos.find((c) => !c.includes(" + ")));
  const c4 = cbRows.find((r) => /^Combo 4 /.test(r)) || "";
  ok("Chicken Box: Combo 4 reads as name, description, price (then the Add button, apart)", /^Combo 4 2 pc Crispy Chicken \+ Fries \+ Cold Drink \+ Mayo (Price: |मूल्य: )?Rs\. 669 \+ /.test(c4), c4);
  ok("Chicken Box: the special bucket is described in plain capitals", /Special Bucket .*3 pc Hot & Crispy Legs \+ .*2 Spicy Dips/.test(cbRows.find((r) => /Special Bucket/.test(r)) || ""));
  const heads = await page.$$eval("main h2, main h3", (hs) => hs.map((h) => h.textContent.trim()));
  ok("Chicken Box: every item sits under a real category (no 'Other' group)", !heads.some((h) => /^(Other|अन्य)$/.test(h)), JSON.stringify(heads));

  // ---------- Groceries ----------
  await page.goto(BASE + "/groceries", { waitUntil: "networkidle2" }); await sleep(1200);
  const gr = await rows();
  const rice = gr.find((r) => /5 kg/.test(r) && /900/.test(r)) || "";
  ok("Groceries: Rice shows its unit apart from the name and the price", /^(Rice|चामल) 5 kg (Price: |मूल्य: )?Rs\. 900 \+ /.test(rice), rice);
  const gtxt = await rawText("main");
  ok("Groceries: nothing like 'Rice 5kgRs. 900' in the page text", !/kgRs\./.test(gtxt) && !/[A-Za-z0-9)]Rs\./.test(gtxt));
  const gheads = await page.$$eval("main h2, main h3", (hs) => hs.map((h) => h.textContent.trim()));
  ok("Groceries: the rice item is under 'Rice, Dal & Grains'", gheads.some((h) => /Rice, Dal & Grains|चामल, दाल र अन्न/.test(h)), JSON.stringify(gheads));
  ok("Groceries: no item sits in an 'Other' group", !gheads.some((h) => /^(Other|अन्य)$/.test(h)), JSON.stringify(gheads));
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /^(Add|थप्नुहोस्): (Rice|चामल)/.test(x.getAttribute("aria-label") || "")); b && b.click(); });
  await sleep(400);
  const line = await page.evaluate(() => (JSON.parse(localStorage.getItem("cm-basket-v1") || "{}").lines || [])[0]);
  ok("Groceries: in the basket (and the WhatsApp message) the line reads 'Rice 5 kg'", !!line && /^(Rice|चामल) 5 kg$/.test(line.name) && line.price === 900, JSON.stringify(line));

  // ---------- Food search ----------
  await page.goto(BASE + "/food?q=combo", { waitUntil: "networkidle2" }); await sleep(1500);
  const sr = await rawText("main");
  ok("Food search: results keep prices apart from words", !/[A-Za-z0-9)]Rs\./.test(sr), sr.match(/.{15}[A-Za-z0-9)]Rs\..{6}/)?.[0]);
  ok("Food search: combos are found by name", /Combo 4/.test(sr));

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
