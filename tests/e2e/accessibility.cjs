// Accessibility checks on every public page, at phone and laptop width, in English and Nepali.
// One h1 per page, every button/link/field has a name, the Help accordion is announced correctly, text contrast meets WCAG AA,
// and the basket / WhatsApp controls are not shown twice. Reads only; writes nothing to the database.
// Usage: BASE=http://localhost:3000 node tests/e2e/accessibility.cjs      (LOCALE=ne for Nepali, REPORT=1 to list every contrast failure)
const puppeteer = require("puppeteer-core");
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const NE = (process.env.LOCALE || "en") === "ne";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 700) : "")); };

const PAGES = ["/", "/food", "/p/the-chicken-box", "/p/sam-cafe-restro", "/groceries", "/gifts", "/liquor", "/parcel", "/anything", "/partner", "/areas", "/about", "/promise", "/help", "/privacy", "/terms", "/basket", "/does-not-exist"];

// Runs inside the page. Returns problems found.
const CHECK = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0"; };
  const nameOf = (el) => {
    const lb = el.getAttribute("aria-labelledby");
    if (lb) return lb.split(" ").map((id) => document.getElementById(id)?.textContent || "").join(" ").trim();
    const al = el.getAttribute("aria-label"); if (al && al.trim()) return al.trim();
    if (el.labels && el.labels.length) return [...el.labels].map((l) => l.textContent).join(" ").trim();
    const t = [...el.childNodes].map((n) => n.nodeType === 3 ? n.nodeValue : (n.nodeType === 1 && n.getAttribute("aria-hidden") !== "true" ? n.textContent : "")).join(" ").replace(/\\s+/g, " ").trim();
    if (t) return t;
    const img = el.querySelector("img[alt]"); if (img && img.alt.trim()) return img.alt.trim();
    return (el.getAttribute("title") || el.getAttribute("placeholder") || "").trim();
  };
  const out = { h1: [...document.querySelectorAll("h1")].filter(vis).map((h) => h.textContent.trim().slice(0, 60)), unnamed: [], skippedLevel: [], contrast: [], dupes: {} };
  for (const el of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, [role=button]")) {
    if (!vis(el) && !el.classList.contains("sr-only")) continue;
    if (!nameOf(el)) out.unnamed.push(el.tagName.toLowerCase() + (el.getAttribute("href") ? "[" + el.getAttribute("href") + "]" : "") + "." + String(el.className).split(" ")[0]);
  }
  // heading levels must not skip downwards (h1 -> h3)
  let last = 0;
  for (const h of document.querySelectorAll("h1,h2,h3,h4,h5,h6")) { if (!vis(h)) continue; const l = Number(h.tagName[1]); if (last && l > last + 1) out.skippedLevel.push(h.tagName + ' "' + h.textContent.trim().slice(0, 30) + '" after h' + last); last = l; }
  // contrast
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = (el) => {
    let layers = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== "none" && !/^url/.test(s.backgroundImage) ) { return { image: true }; }
      if (/url\\(/.test(s.backgroundImage)) return { image: true };
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (const l of layers.reverse()) base = over(l, base);
    return base;
  };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const txt = n.nodeValue.trim(); if (!txt) continue;
    const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (!vis(el) || el.closest("script,style,noscript,[aria-hidden=true]")) continue;
    if (el.closest("[disabled]") || (el.closest("label") && el.closest("label").querySelector("input:disabled"))) continue;
    const s = getComputedStyle(el);
    const fg = parse(s.color); const bg = bgOf(el);
    if (!fg || bg.image) continue;
    const op = Number(s.opacity);
    const f = over({ ...fg, a: fg.a * (el.closest("[class*=opacity-]") ? 1 : 1) }, bg);
    const L1 = lum(f), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) out.contrast.push({ text: txt.slice(0, 40), ratio: Math.round(ratio * 100) / 100, need, size, color: s.color, bg: "rgb(" + Math.round(bg.r) + "," + Math.round(bg.g) + "," + Math.round(bg.b) + ")" });
  }
  // duplicated controls: visible basket links and visible WhatsApp buttons
  const basket = [...document.querySelectorAll("a[href='/basket']")].filter(vis);
  const wa = [...document.querySelectorAll("a[href*='api.whatsapp.com'], a[href*='wa.me']")].filter(vis).filter((a) => /header|nav/i.test(a.closest("header,nav,footer,main")?.tagName || "") || a.closest("header,nav"));
  out.dupes = { basket: basket.length, whatsappChrome: wa.length, basketWhere: basket.map((a) => a.closest("header,nav,footer,main")?.tagName), whatsappWhere: wa.map((a) => a.closest("header,nav,footer,main")?.tagName) };
  return out;
})()`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const sizes = [{ name: "phone 390px", width: 390, height: 844, mobile: true }, { name: "tablet 768px", width: 768, height: 900, mobile: false }, { name: "small laptop 1024px", width: 1024, height: 768, mobile: false }, { name: "laptop 1280px", width: 1280, height: 800, mobile: false }];
  for (const sz of sizes) {
    const page = await browser.newPage();
    await page.setViewport({ width: sz.width, height: sz.height, isMobile: sz.mobile, hasTouch: sz.mobile });
    if (NE) await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
    for (const p of PAGES) {
      await page.goto(BASE + p, { waitUntil: "networkidle2", timeout: 90000 }); await sleep(900);
      const r = await page.evaluate(CHECK);
      const label = `[${sz.name}] ${p}`;
      const htmlH1 = (await (await fetch(BASE + p, { headers: { cookie: `NEXT_LOCALE=${NE ? "ne" : "en"}` } })).text()).replace(/<script[\s\S]*?<\/script>/g, "").match(/<h1[\s>]/g)?.length ?? 0;
      ok(`${label}: exactly one h1 (page: ${r.h1.length}, server HTML: ${htmlH1})`, r.h1.length === 1 && htmlH1 === 1, JSON.stringify(r.h1));
      ok(`${label}: every button, link and field has a name`, r.unnamed.length === 0, r.unnamed.join(", "));
      ok(`${label}: nothing sticks out sideways (no horizontal scrolling)`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "page is wider than the screen");
      ok(`${label}: headings do not skip a level`, r.skippedLevel.length === 0, r.skippedLevel.join("; "));
      ok(`${label}: text contrast meets WCAG AA`, r.contrast.length === 0, r.contrast.slice(0, 6).map((c) => `"${c.text}" ${c.ratio}:1 (needs ${c.need}) ${c.color} on ${c.bg}`).join("\n     "));
      if (p !== "/basket" && p !== "/does-not-exist") {
        ok(`${label}: the basket link is shown exactly once (${r.dupes.basketWhere.join("+") || "none"})`, r.dupes.basket === 1, JSON.stringify(r.dupes));
        ok(`${label}: the WhatsApp button in the page chrome is shown exactly once (${r.dupes.whatsappWhere.join("+") || "none"})`, r.dupes.whatsappChrome === 1, JSON.stringify(r.dupes));
      }
    }
    await page.close();
  }
  // ---------- the Help accordion ----------
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    if (NE) await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
    await page.goto(BASE + "/help", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(800);
    const summaries = await page.$$eval("details > summary", (ss) => ss.map((s) => ({ marks: [...s.querySelectorAll("[aria-hidden=true]")].map((m) => m.textContent.trim()), height: Math.round(s.getBoundingClientRect().height) })));
    ok("Help: there are question rows", summaries.length >= 8, String(summaries.length));
    ok("Help: the '+' sign is hidden from screen readers", summaries.every((s) => s.marks.includes("+")), JSON.stringify(summaries[0]));
    ok("Help: every row is at least 44px tall to tap", summaries.every((s) => s.height >= 44), JSON.stringify(summaries.map((s) => s.height)));
    const snap = async () => { const tree = await page.accessibility.snapshot({ interestingOnly: false }); const out = []; (function walk(n) { if (!n) return; if (/button|disclosure/i.test(n.role) && n.expanded !== undefined) out.push({ name: n.name, expanded: n.expanded }); (n.children || []).forEach(walk); })(tree); return out; };
    const before = await snap();
    ok("Help: each question is announced as expandable and starts collapsed", before.length >= 8 && before.every((b) => b.expanded === false), JSON.stringify(before.slice(0, 2)));
    await page.click("details > summary"); await sleep(300);
    const after = await snap();
    ok("Help: after tapping, that question is announced as expanded (and only that one)", after.filter((a) => a.expanded).length === 1, JSON.stringify(after.filter((a) => a.expanded)));
    await page.focus("details > summary"); await page.keyboard.press("Enter"); await sleep(300);
    const closed = await snap();
    ok("Help: the keyboard (Enter) closes it again", closed.filter((a) => a.expanded).length === 0, JSON.stringify(closed.filter((a) => a.expanded)));
    await page.close();
  }

  // ---------- the basket count is announced ----------
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    if (NE) await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
    await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(800);
    await page.evaluate("localStorage.clear()");
    await page.goto(BASE + "/p/the-chicken-box", { waitUntil: "networkidle2" }); await sleep(800);
    await page.evaluate(() => { const b = document.querySelector("button[aria-label='Add: Combo 1'], button[aria-label^='थप्नुहोस्']"); b.click(); });
    await sleep(600);
    const tree = await page.accessibility.snapshot({ interestingOnly: false });
    const links = []; (function walk(n) { if (!n) return; if (n.role === "link" && /Basket|बास्केट|झोला/.test(n.name || "")) links.push(n.name); (n.children || []).forEach(walk); })(tree);
    ok("Basket: the link's spoken name includes how many items and the total", links.some((n) => /1/.test(n) && /Rs./.test(n)), JSON.stringify(links));
    const visible = await page.$$eval("a[href='/basket']", (as) => as.filter((a) => a.getBoundingClientRect().width > 0).map((a) => a.innerText.replace(/\s+/g, " ")).join(" "));
    ok("Basket: the count badge and total are shown on screen", /1/.test(visible) && /Rs./.test(visible), visible);
    await page.evaluate("localStorage.clear()");
    await page.close();
  }

  // ---------- /food craving chips ----------
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    if (NE) await page.setCookie({ name: "NEXT_LOCALE", value: "ne", url: BASE });
    await page.goto(BASE + "/food", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(1000);
    const chips = await page.$$eval("main [role=group] button[aria-pressed]", (bs) => bs.map((b) => ({ label: b.textContent.trim(), pressed: b.getAttribute("aria-pressed"), h: Math.round(b.getBoundingClientRect().height) })));
    ok("Food: craving chips exist, are buttons with a pressed state, and are 44px+ tall", chips.length >= 6 && chips.every((c) => c.pressed === "false" && c.h >= 44), JSON.stringify(chips.slice(0, 3)));
    const idx = await page.evaluate(() => [...document.querySelectorAll("main [role=group] button[aria-pressed]")].findIndex((b) => /Pizza|पिज्जा/.test(b.textContent)));
    await page.evaluate((i) => document.querySelectorAll("main [role=group] button[aria-pressed]")[i].click(), idx); await sleep(700);
    const status = await page.$eval("[role=status]", (e) => e.textContent).catch(() => "");
    ok("Food: tapping a chip fills the search and announces the result count", (await page.$eval("#food-search", (i) => i.value)).length > 0 && status.length > 0, status);
    ok("Food: the chip is marked pressed", (await page.$$eval("main [role=group] button[aria-pressed=true]", (b) => b.length)) === 1);
    const dishes = await page.$$eval("section[aria-labelledby=dishes-h] li", (l) => l.length);
    ok("Food: matching dishes are listed", dishes > 0, String(dishes));
    await page.evaluate((i) => document.querySelectorAll("main [role=group] button[aria-pressed]")[i].click(), idx); await sleep(500);
    ok("Food: tapping the chip again clears the filter", (await page.$eval("#food-search", (i) => i.value)) === "");
    await page.type("#food-search", "zzzqqq"); await sleep(600);
    const empty = await page.$eval("main", (m) => m.innerText);
    ok("Food: a search with no match says so", /Nothing found|केही भेटिएन/.test(empty), empty.slice(0, 300));
    const waLinks = await page.$$eval("main a[href*='api.whatsapp.com']", (as) => as.map((a) => decodeURIComponent(new URL(a.href).searchParams.get("text") || "")));
    ok("Food: there is an 'order it on WhatsApp' button, and its message names what was searched", waLinks.some((w) => w.length > 15 && w.includes("zzzqqq")), JSON.stringify(waLinks));
    await page.close();
  }

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
