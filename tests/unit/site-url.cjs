// Unit tests for the website address and the domain redirects. No browser, no network.
// Run: npm run test:unit
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const { cleanSiteUrl, resolveSiteUrl, redirectRules } = await import(pathToFileURL(path.resolve(__dirname, "../../src/lib/siteUrl.mjs")).href);
  let pass = 0, fail = 0;
  const eq = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    ok ? pass++ : fail++;
    console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`));
  };

  // ---- cleaning what someone typed
  eq("a full address is kept", cleanSiteUrl("https://www.chittomitho.com"), "https://www.chittomitho.com");
  eq("a trailing slash and path are dropped", cleanSiteUrl("https://chittomitho.com/some/path/"), "https://chittomitho.com");
  eq("a missing https:// is added", cleanSiteUrl("chittomitho.com"), "https://chittomitho.com");
  eq("spaces around it are ignored", cleanSiteUrl("  https://chittomitho.com  "), "https://chittomitho.com");
  eq("a .com.np address works", cleanSiteUrl("chittomitho.com.np"), "https://chittomitho.com.np");
  eq("localhost gets http", cleanSiteUrl("localhost:3000"), "http://localhost:3000");
  eq("empty gives null", cleanSiteUrl(""), null);
  eq("undefined gives null", cleanSiteUrl(undefined), null);

  // ---- which address is the website
  eq("NEXT_PUBLIC_SITE_URL wins", resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://chittomitho.com", VERCEL_PROJECT_PRODUCTION_URL: "chitomitho.vercel.app" }), "https://chittomitho.com");
  eq("without it, the Vercel address is used (never a domain we do not own)", resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "chitomitho.vercel.app" }), "https://chitomitho.vercel.app");
  eq("with nothing set, development uses localhost", resolveSiteUrl({}), "http://localhost:3000");
  eq("a blank NEXT_PUBLIC_SITE_URL falls back", resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: " ", VERCEL_PROJECT_PRODUCTION_URL: "chitomitho.vercel.app" }), "https://chitomitho.vercel.app");

  // ---- redirects: nothing changes until there is a custom domain
  eq("today (site address is the Vercel address): no redirects", redirectRules({ NEXT_PUBLIC_SITE_URL: "https://chitomitho.vercel.app", VERCEL_PROJECT_PRODUCTION_URL: "chitomitho.vercel.app" }), []);
  eq("no site address at all: no redirects", redirectRules({}), []);
  eq("local development: no redirects", redirectRules({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }), []);

  // ---- redirects: a custom domain
  const env = { NEXT_PUBLIC_SITE_URL: "https://chittomitho.com", VERCEL_PROJECT_PRODUCTION_URL: "chitomitho.vercel.app" };
  const rules = redirectRules(env);
  const hosts = rules.map((r) => r.has[0].value).sort();
  eq("the Vercel address and the www twin both redirect", hosts, ["chitomitho.vercel.app", "www.chittomitho.com"]);
  eq("every redirect goes to the real address, keeping the path", rules.every((r) => r.destination === "https://chittomitho.com/:path*" && r.source === "/:path*"), true);
  eq("the redirects are permanent (301/308) so search engines move over", rules.every((r) => r.permanent === true), true);
  eq("the real address itself is never redirected", hosts.includes("chittomitho.com"), false);

  const www = redirectRules({ NEXT_PUBLIC_SITE_URL: "https://www.chittomitho.com", VERCEL_PROJECT_PRODUCTION_URL: "chitomitho.vercel.app" });
  eq("if www is the chosen address, the bare domain redirects to it", www.map((r) => r.has[0].value).sort(), ["chitomitho.vercel.app", "chittomitho.com"]);
  eq("…and goes to the www address", www.every((r) => r.destination === "https://www.chittomitho.com/:path*"), true);

  const legacy = redirectRules({ ...env, LEGACY_HOSTS: "old-shop.example, https://chittomitho.com.np/" });
  eq("LEGACY_HOSTS adds old domains (spaces, https and slashes tolerated)", legacy.map((r) => r.has[0].value).sort(), ["chitomitho.vercel.app", "chittomitho.com.np", "old-shop.example", "www.chittomitho.com"]);

  const np = redirectRules({ NEXT_PUBLIC_SITE_URL: "chittomitho.com.np" });
  eq("a .com.np domain without Vercel info still redirects its www twin", np.map((r) => r.has[0].value), ["www.chittomitho.com.np"]);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
