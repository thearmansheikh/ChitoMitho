// Which address is "the website"? One place decides, and both the app (src/lib/site.ts) and next.config.mjs use it.
// Plain JavaScript (not TypeScript) because next.config.mjs cannot import TypeScript.

/** Turns what someone typed ("chittomitho.com", "https://www.chittomitho.com/") into "https://www.chittomitho.com". Returns null if it is not an address. */
export function cleanSiteUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `${/^(localhost|127\.)/i.test(s) ? "http" : "https"}://${s}`;
  try {
    const u = new URL(s);
    if (!u.hostname) return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * The website's public address.
 * 1. NEXT_PUBLIC_SITE_URL (set this to your own domain once you have one).
 * 2. Otherwise the address Vercel gives this project (VERCEL_PROJECT_PRODUCTION_URL), so links are never pointed at a domain you do not own.
 * 3. Otherwise localhost, for development.
 */
export function resolveSiteUrl(env = process.env) {
  return cleanSiteUrl(env.NEXT_PUBLIC_SITE_URL) || cleanSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL) || "http://localhost:3000";
}

const isLocalOrVercel = (host) => /^(localhost|127\.|.*\.vercel\.app$)/i.test(host.split(":")[0]);

/**
 * Permanent redirects that send every other address of this site to the real one, keeping the path and the query:
 *  - the free Vercel address (project-name.vercel.app) once a custom domain is in use,
 *  - www and non-www (whichever is not the chosen one),
 *  - anything listed in LEGACY_HOSTS (comma separated, for example an old domain).
 * Nothing is redirected while the site address is itself the Vercel address or localhost, so today's site is untouched.
 * Preview deployments keep their own addresses and are not redirected.
 */
export function redirectRules(env = process.env) {
  const site = resolveSiteUrl(env);
  const host = new URL(site).host;
  if (isLocalOrVercel(host)) return [];
  const hostname = host.split(":")[0];
  const others = new Set();
  const vercel = cleanSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) others.add(new URL(vercel).hostname);
  for (const h of String(env.LEGACY_HOSTS || "").split(",")) { const c = cleanSiteUrl(h); if (c) others.add(new URL(c).hostname); }
  others.add(hostname.startsWith("www.") ? hostname.slice(4) : `www.${hostname}`);
  others.delete(hostname);
  return [...others].map((h) => ({
    source: "/:path*",
    has: [{ type: "host", value: h }],
    destination: `${site}/:path*`,
    permanent: true,
  }));
}
