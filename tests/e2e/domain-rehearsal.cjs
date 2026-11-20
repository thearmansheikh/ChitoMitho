// Domain rehearsal: proves the site is ready for a custom domain WITHOUT buying one.
// It builds and starts a copy of the site that believes its address is https://shop.example.test (a name that can never be a real site),
// then checks the redirects and that every link, canonical address and sitemap entry uses that address and never the free *.vercel.app one.
// Writes nothing to the database. Takes about three minutes (it builds the site once).
//   node tests/e2e/domain-rehearsal.cjs
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const PORT = 3500;
const SITE = "https://shop.example.test", SITE_HOST = "shop.example.test", OLD_HOST = "old-free-address.vercel.app", DIST = ".next-rehearsal";
const env = { ...process.env, NEXT_PUBLIC_SITE_URL: SITE, VERCEL_PROJECT_PRODUCTION_URL: OLD_HOST, NEXT_DIST_DIR: DIST };
const results = [];
const ok = (n, p, extra = "") => { results.push(p); console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 400) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A request that names the website address it is "for" (the Host header), like a browser visiting that domain. */
const get = (host, p) => new Promise((resolve, reject) => {
  const req = http.request({ host: "127.0.0.1", port: PORT, path: p, method: "GET", headers: { Host: host } }, (res) => {
    let body = ""; res.on("data", (d) => (body += d)); res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location, body }));
  });
  req.on("error", reject); req.setTimeout(60000, () => req.destroy(new Error("timeout"))); req.end();
});

(async () => {
  console.log("Building a copy of the site for " + SITE + " ...");
  const build = spawnSync(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build"], { cwd: root, env, encoding: "utf8" });
  if (build.status !== 0) { console.error(build.stdout.slice(-800), build.stderr.slice(-800)); process.exit(2); }
  const server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT)], { cwd: root, env, stdio: "ignore" });
  try {
    for (let i = 0; i < 40; i++) { try { await get(SITE_HOST, "/robots.txt"); break; } catch { await sleep(500); } }

    const a = await get(OLD_HOST, "/p/the-chicken-box?ref=ad");
    ok("The free Vercel address redirects permanently (308) to the real domain", a.status === 308, String(a.status));
    ok("…keeping the page and the query string", a.location === `${SITE}/p/the-chicken-box?ref=ad`, a.location);
    const w = await get("www." + SITE_HOST, "/food");
    ok("The www twin redirects to the real domain too", w.status === 308 && w.location === `${SITE}/food`, `${w.status} ${w.location}`);
    const home = await get(SITE_HOST, "/");
    ok("The real domain serves the site (no redirect loop)", home.status === 200, String(home.status));

    for (const p of ["/", "/food", "/p/the-chicken-box", "/about", "/help"]) {
      const r = await get(SITE_HOST, p);
      const canonical = (r.body.match(/rel="canonical" href="([^"]*)"/) || [])[1];
      ok(`${p}: canonical address is on the new domain`, canonical === SITE + (p === "/" ? "" : p), canonical);
      ok(`${p}: no mention of the old free address anywhere in the page`, !r.body.includes("vercel.app"));
      const og = (r.body.match(/property="og:image" content="([^"]*)"/) || [])[1] || "";
      ok(`${p}: the shared picture address is on the new domain`, og.startsWith(SITE + "/"), og);
    }
    const sm = await get(SITE_HOST, "/sitemap.xml");
    const locs = [...sm.body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    ok("sitemap.xml: every address is on the new domain", locs.length > 10 && locs.every((u) => u === SITE || u.startsWith(SITE + "/")), locs.find((u) => !u.startsWith(SITE)));
    const rb = await get(SITE_HOST, "/robots.txt");
    ok("robots.txt: points at the new domain's sitemap", rb.body.includes(`Sitemap: ${SITE}/sitemap.xml`), rb.body);
    const ld = (await get(SITE_HOST, "/")).body.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    const biz = ld ? JSON.parse(ld[1]) : null;
    ok("Structured data uses the new domain", !!biz && biz.url === SITE && String(biz.logo).startsWith(SITE) && String(biz.image).startsWith(SITE), JSON.stringify(biz && { url: biz.url, logo: biz.logo }));
  } finally {
    server.kill();
    await sleep(1000);
    try { fs.rmSync(path.join(root, DIST), { recursive: true, force: true }); } catch { /* leave it; it is git-ignored */ }
  }
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
