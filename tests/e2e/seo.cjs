// Search-engine and link-sharing checks, read from each page's HTML exactly as a search engine or WhatsApp preview sees it (no scripts run).
// Reads only. Usage: BASE=https://chitomitho.vercel.app node tests/e2e/seo.cjs
const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 500) : "")); };

const decode = (s) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
const meta = (html, attr, name) => { const m = html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`)) || html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`)); return m ? decode(m[1]) : null; };
const head = (html) => ({
  title: decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || ""),
  description: meta(html, "name", "description"),
  canonical: (html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/) || [])[1] || null,
  robots: meta(html, "name", "robots"),
  ogTitle: meta(html, "property", "og:title"), ogDescription: meta(html, "property", "og:description"), ogImage: meta(html, "property", "og:image"), ogUrl: meta(html, "property", "og:url"), ogType: meta(html, "property", "og:type"),
  twTitle: meta(html, "name", "twitter:title"), twDescription: meta(html, "name", "twitter:description"), twImage: meta(html, "name", "twitter:image"), twCard: meta(html, "name", "twitter:card"),
  jsonLd: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
  lang: (html.match(/<html[^>]*lang="([^"]*)"/) || [])[1],
});
const get = async (p) => { const r = await fetch(BASE + p, { redirect: "manual" }); return { status: r.status, text: await r.text(), type: r.headers.get("content-type") || "" }; };

const PUBLIC = ["/", "/food", "/groceries", "/gifts", "/parcel", "/anything", "/about", "/promise", "/partner", "/areas", "/help", "/privacy", "/terms", "/p/the-chicken-box"];

(async () => {
  const seenTitles = new Map(), seenDescs = new Map();
  let siteOrigin = null;
  for (const p of PUBLIC) {
    const r = await get(p);
    const h = head(r.text);
    const label = p === "/" ? "Home" : p;
    ok(`${label}: opens (200)`, r.status === 200, String(r.status));
    ok(`${label}: has a title of 15-70 characters (${h.title.length})`, h.title.length >= 15 && h.title.length <= 70, h.title);
    ok(`${label}: the title ends with the brand name`, /Chitto Mitho$/.test(h.title), h.title);
    ok(`${label}: has a description of 70-165 characters (${(h.description || "").length})`, !!h.description && h.description.length >= 70 && h.description.length <= 165, h.description);
    ok(`${label}: shared-link title (Open Graph) is the page title`, h.ogTitle === h.title, `${h.ogTitle} | ${h.title}`);
    ok(`${label}: shared-link description is the page description`, h.ogDescription === h.description, `${h.ogDescription} | ${h.description}`);
    ok(`${label}: Twitter/X title and description match too`, h.twTitle === h.title && h.twDescription === h.description && h.twCard === "summary_large_image", JSON.stringify([h.twTitle, h.twDescription, h.twCard]));
    ok(`${label}: has a canonical address that ends with the page path`, !!h.canonical && /^https?:\/\//.test(h.canonical) && h.canonical.replace(/^https?:\/\/[^/]+/, "") === (p === "/" ? "" : p) || (p === "/" && /^https?:\/\/[^/]+\/?$/.test(h.canonical || "")), h.canonical);
    ok(`${label}: shared-link address (og:url) is the canonical address`, (h.ogUrl || "").replace(/\/$/, "") === (h.canonical || "").replace(/\/$/, ""), `${h.ogUrl} | ${h.canonical}`);
    ok(`${label}: is open to search engines (no noindex)`, !/noindex/.test(h.robots || ""), h.robots);
    ok(`${label}: <html lang> is set`, h.lang === "en", h.lang);
    if (h.canonical) siteOrigin = siteOrigin || new URL(h.canonical).origin;
    seenTitles.set(h.title, [...(seenTitles.get(h.title) || []), p]); seenDescs.set(h.description, [...(seenDescs.get(h.description) || []), p]);
    // the shared picture exists
    if (h.ogImage) {
      const img = h.ogImage.startsWith("http") ? h.ogImage : BASE + h.ogImage;
      const url = img.replace(/^https?:\/\/[^/]+/, BASE.replace(/\/$/, "")).replace(BASE + BASE, BASE);
      const ir = await fetch(/^https?:\/\/localhost/.test(BASE) ? url : img, { method: "GET" }).catch(() => ({ status: 0, headers: new Map() }));
      ok(`${label}: the shared picture is a full address and loads as an image`, /^https?:\/\//.test(h.ogImage) && ir.status === 200 && /^image\//.test(ir.headers.get("content-type") || ""), `${h.ogImage} -> ${ir.status}`);
    } else ok(`${label}: has a shared picture`, false);
    // structured data is valid JSON
    const parsed = h.jsonLd.map((s) => { try { return JSON.parse(s); } catch { return null; } });
    ok(`${label}: structured data (JSON-LD) is valid JSON`, parsed.length > 0 && parsed.every(Boolean), String(h.jsonLd.length));
    if (p === "/") {
      const biz = parsed.flat().find((x) => x && x["@type"] === "LocalBusiness");
      ok("Home: LocalBusiness data has name, phone, address, area served, hours and logo", !!biz && !!biz.name && Array.isArray(biz.telephone) && biz.telephone.every((t) => /^\+977\d{9,10}$/.test(t)) && biz.address?.addressCountry === "NP" && biz.areaServed?.length >= 3 && !!biz.openingHoursSpecification && !!biz.logo && !!biz.url, JSON.stringify(biz).slice(0, 300));
    }
    if (p === "/p/the-chicken-box") {
      ok("Café page: title is 'Order from The Chicken Box — delivered in Dharan | Chitto Mitho'", h.title === "Order from The Chicken Box — delivered in Dharan | Chitto Mitho", h.title);
      const flat = parsed.flat();
      const place = flat.find((x) => x && /FoodEstablishment|Restaurant/.test(x["@type"]));
      const crumbs = flat.find((x) => x && x["@type"] === "BreadcrumbList");
      ok("Café page: has FoodEstablishment data with name, address area and menu link", !!place && place.name === "The Chicken Box" && place.address?.addressLocality === "Dharan" && !!place.hasMenu && !!place.url, JSON.stringify(place));
      ok("Café page: has a 3-step breadcrumb (Home, Food, café)", !!crumbs && crumbs.itemListElement?.length === 3, JSON.stringify(crumbs));
      ok("Café page: no invented details (address only if one is saved)", !place || !place.address.streetAddress || place.address.streetAddress.length > 3);
      ok("Café page: the script data cannot close its own tag", !/<\/script>[^]*<\/script>/.test(h.jsonLd.join("")) && h.jsonLd.every((s) => !s.includes("</")));
    }
  }
  ok("No two pages share a title", [...seenTitles.values()].every((v) => v.length === 1), JSON.stringify([...seenTitles].filter(([, v]) => v.length > 1)));
  ok("No two pages share a description", [...seenDescs.values()].every((v) => v.length === 1), JSON.stringify([...seenDescs].filter(([, v]) => v.length > 1)));

  // pages that must stay out of search results
  for (const p of ["/basket", "/p/sam-cafe-restro", "/liquor"]) {
    const h = head((await get(p)).text);
    ok(`${p}: asks search engines to leave it out (noindex)`, /noindex/.test(h.robots || ""), h.robots);
  }
  const admin = await get("/admin");
  ok("/admin: sends visitors to the sign-in page (not public)", admin.status >= 300 && admin.status < 400, String(admin.status));
  const missing = await get("/this-page-does-not-exist");
  ok("An unknown address gives a real 404 (not a blank 200)", missing.status === 404, String(missing.status));

  // robots.txt
  const robots = await get("/robots.txt");
  ok("robots.txt: allows the public site", /User-agent: \*/i.test(robots.text) && /Allow: \//.test(robots.text));
  ok("robots.txt: blocks /admin and /basket", /Disallow: \/admin/.test(robots.text) && /Disallow: \/basket/.test(robots.text), robots.text);
  ok("robots.txt: points to the sitemap", /Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/.test(robots.text), robots.text);

  // sitemap.xml
  const sm = await get("/sitemap.xml");
  const urls = [...sm.text.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  const paths = urls.map((u) => new URL(u).pathname.replace(/\/$/, "") || "/");
  ok("sitemap.xml: is valid XML with addresses", sm.status === 200 && /<urlset/.test(sm.text) && urls.length >= 14, String(urls.length));
  ok("sitemap.xml: lists every public page", PUBLIC.every((p) => paths.includes(p)), JSON.stringify(PUBLIC.filter((p) => !paths.includes(p))));
  ok("sitemap.xml: leaves out /basket and /admin", !paths.some((p) => p.startsWith("/basket") || p.startsWith("/admin")), JSON.stringify(paths));
  ok("sitemap.xml: leaves out liquor while it is switched off", !paths.some((p) => p === "/liquor" || p === "/p/drinks"), JSON.stringify(paths));
  ok("sitemap.xml: leaves out places with no menu (their pages are noindex)", !paths.some((p) => /^\/p\/(sam-cafe-restro|anzees-cafe-bakery|the-cake-palace|sweet-treats|tiffin-by-saze|swad-restro|youberry-restaurant|circle-cafe-bar)$/.test(p)), JSON.stringify(paths.filter((p) => p.startsWith("/p/"))));
  ok("sitemap.xml: every address uses the same website address as the canonical links", urls.every((u) => !siteOrigin || new URL(u).origin === siteOrigin), `${siteOrigin} vs ${urls[0]}`);

  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
