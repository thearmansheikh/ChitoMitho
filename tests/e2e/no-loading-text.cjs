// Public pages must carry their real content in the HTML the server sends, with no "Loading" placeholder text.
// Reads the raw HTML (what search engines and screen readers get before any script runs). Writes nothing.
// Usage: BASE=https://chitomitho.vercel.app node tests/e2e/no-loading-text.cjs
const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const PAGES = ["/", "/food", "/p/the-chicken-box", "/groceries", "/liquor", "/gifts", "/parcel", "/anything", "/basket", "/about", "/promise", "/partner", "/areas", "/help", "/privacy", "/terms"];
let pass = 0, fail = 0;
const ok = (n, p, extra = "") => { p ? pass++ : fail++; console.log((p ? "PASS " : "FAIL ") + n + (extra && !p ? "  -> " + String(extra).slice(0, 300) : "")); };

(async () => {
  for (const locale of ["en", "ne"]) {
    for (const path of PAGES) {
      const tag = `${locale} ${path}`;
      const look = async () => {
        const res = await fetch(BASE + path, { headers: { cookie: `NEXT_LOCALE=${locale}`, "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } });
        const html = await res.text();
        const bad = [];
        if (/Loading|लोड हुँदै/.test(html)) bad.push("the word Loading appears: " + (html.match(/.{40}(Loading|लोड हुँदै).{20}/)?.[0] ?? ""));
        if (/aria-busy="true"/.test(html)) bad.push("an aria-busy placeholder is in the page");
        if (/<template id="B:\d+"/.test(html)) bad.push("the page is streamed behind a placeholder (content comes later)");
        if (!/<h1[ >]/.test(html)) bad.push("no <h1> in the server HTML");
        return { status: res.status, bad };
      };
      let r = await look();
      if (r.bad.length) r = await look(); // the first request after the data cache expires can stream; the second shows the steady state
      ok(`${tag}: real content, no loading placeholder`, r.status === 200 && r.bad.length === 0, `${r.status} ${r.bad.join("; ")}`);
    }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message); process.exit(2); });
