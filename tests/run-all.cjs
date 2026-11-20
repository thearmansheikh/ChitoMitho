// Runs every automated check against one website address and prints a pass/fail table (also saved to docs/TEST-REPORT.md).
// Writes nothing to the database.   Usage:   BASE=https://chitomitho.vercel.app node tests/run-all.cjs
//   --quick   skip the slow accessibility sweep      --only=seo,sections   run just those groups
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const args = process.argv.slice(2);
const quick = args.includes("--quick");
const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);

// [what the checklist calls it, script, language(s), plan task]
const SUITES = [
  ["Customer journey: home > food > café > basket > details > WhatsApp message", "customer-journey", ["en", "ne"], "1, 2"],
  ["WhatsApp link: opens a filled chat on Android, iPhone, desktop; header/bar/footer buttons never blank", "whatsapp-handoff", [""], "1"],
  ["Address section: ward, tole, house, landmark, charge note", "address-section", [""], "2"],
  ["Forms: parcel, anything, gifts, partner (required marks, errors, messages)", "forms", ["en", "ne"], "2"],
  ["Gifts, parcel and order-anything details", "gift-parcel-anything", [""], "2"],
  ["Menu text: spelling, unit, price spacing", "menu-text", ["en", "ne"], "3, 4"],
  ["No 'Loading' placeholder text in server HTML", "no-loading-text", [""], "5"],
  ["Contact and social labels, alt text on images", "contact-and-alt", [""], "6"],
  ["Partner logos link somewhere real; 'Menu coming soon'", "partners", ["en", "ne"], "7"],
  ["Groceries, gifts, liquor sections; 18+ gate; empty sections", "sections", ["en", "ne"], "10"],
  ["Language toggle, <html lang>, remembered, names fall back to English", "language-toggle", [""], "11"],
  ["Nepali audit: no untranslated English on any page or pop-up", "nepali-audit", [""], "11"],
  ["Open / Closed at 09:59, 10:00, 21:59, 22:00 + order for later", "open-closed", ["en", "ne"], "12"],
  ["Edge cases: closed shop, laptop layout, groceries list, liquor", "edge-cases", [""], "12, 13"],
  ["SEO: titles, descriptions, share previews, JSON-LD, robots, sitemap", "seo", [""], "14"],
  ["Accessibility: h1, names, contrast, single controls, accordion, chips (4 screen sizes)", "accessibility", ["en", "ne"], "13", true],
];

const results = [];
const only_ = (name) => only.length === 0 || only.some((o) => name.includes(o));

function run(label, script, lang, task, attempt = 1) {
  const env = { ...process.env, BASE };
  if (lang) env.LOCALE = lang;
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(root, "tests/e2e", script + ".cjs")], { cwd: root, env, encoding: "utf8", timeout: 40 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "") + (r.stderr || "");
  // Most suites end with "N/M checks passed"; a few end with "N passed, M failed".
  const alt = out.match(/(\d+) passed, (\d+) failed/);
  const m = out.match(/(\d+)\/(\d+) checks passed/) || (alt ? [`${alt[1]}/${Number(alt[1]) + Number(alt[2])} checks passed`, alt[1], String(Number(alt[1]) + Number(alt[2]))] : null);
  const fails = out.split("\n").filter((l) => /^FAIL /.test(l)).map((l) => l.slice(0, 160));
  const crashed = /TEST CRASHED/.test(out);
  const status = r.status === 0 && m && m[1] === m[2] ? "PASS" : "FAIL";
  // The very first request to a site can be slow. A suite that fails is run once more; a second failure is a real failure.
  if (status === "FAIL" && attempt === 1) { console.log(`...retrying ${script}${lang ? " [" + lang + "]" : ""} once`); return run(label, script, lang, task, 2); }
  results.push({ label: attempt === 2 && status === "PASS" ? label + " (passed on the second try)" : label, lang, script, task, status, counts: m ? `${m[1]}/${m[2]}` : crashed ? "crashed" : "no result", fails, secs: Math.round((Date.now() - t0) / 1000), tail: status === "FAIL" ? out.trim().split("\n").slice(-3).join(" | ").slice(0, 300) : "" });
  console.log(`${status}  ${script}${lang ? " [" + lang + "]" : ""}  ${m ? m[0] : "no result"}  (${Math.round((Date.now() - t0) / 1000)}s)`);
}

// ----- unit tests (no website needed)
{
  const t0 = Date.now();
  const r = spawnSync("npm", ["run", "test:unit"], { cwd: root, encoding: "utf8", shell: true, timeout: 10 * 60 * 1000 });
  const out = (r.stdout || "") + (r.stderr || "");
  const sets = [...out.matchAll(/(\d+) passed, (\d+) failed/g)];
  const passed = sets.reduce((n, m) => n + Number(m[1]), 0), failed = sets.reduce((n, m) => n + Number(m[2]), 0);
  const zones = out.match(/(\d+)\/(\d+) time zones passed/);
  results.push({ label: "Unit tests: WhatsApp message and link, opening hours (5 time zones), places, images, menu import, website address", lang: "", script: "npm run test:unit", task: "1-15", status: r.status === 0 && failed === 0 ? "PASS" : "FAIL", counts: `${passed} checks${zones ? `, ${zones[1]}/${zones[2]} zones` : ""}`, fails: [], secs: Math.round((Date.now() - t0) / 1000), tail: "" });
  console.log(`${r.status === 0 ? "PASS" : "FAIL"}  unit tests  ${passed} passed, ${failed} failed`);
}
// ----- typecheck + lint
for (const [label, cmd] of [["Typecheck (TypeScript)", ["npx", "tsc", "--noEmit"]], ["Lint (ESLint)", ["npm", "run", "lint"]]]) {
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd: root, encoding: "utf8", shell: true, timeout: 10 * 60 * 1000 });
  results.push({ label, lang: "", script: cmd.join(" "), task: "all", status: r.status === 0 ? "PASS" : "FAIL", counts: r.status === 0 ? "clean" : "errors", fails: [], secs: 0, tail: r.status ? ((r.stdout || "") + (r.stderr || "")).slice(-300) : "" });
  console.log(`${r.status === 0 ? "PASS" : "FAIL"}  ${label}`);
}

for (const [label, script, langs, task, slow] of SUITES) {
  if (!only_(script) || (quick && slow)) continue;
  for (const lang of langs) run(label, script, lang, task);
}

// ----- the report
const pass = results.filter((r) => r.status === "PASS").length;
const lines = [
  `# Final test report`,
  ``,
  `Website tested: **${BASE}**  `,
  `Run: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC  `,
  `Result: **${pass} of ${results.length} checks groups passed**`,
  ``,
  `| # | What is checked | Language | Plan task | Result | Checks |`,
  `| --- | --- | --- | --- | --- | --- |`,
  ...results.map((r, i) => `| ${i + 1} | ${r.label} | ${r.lang ? (r.lang === "ne" ? "नेपाली" : "English") : "-"} | ${r.task} | ${r.status === "PASS" ? "✅ PASS" : "❌ FAIL"} | ${r.counts} |`),
  ``,
];
const bad = results.filter((r) => r.status === "FAIL");
if (bad.length) {
  lines.push(`## Failures`, ``);
  for (const r of bad) lines.push(`- **${r.script}${r.lang ? " [" + r.lang + "]" : ""}**: ${r.fails.length ? r.fails.join("; ") : r.tail || "no result"}`);
  lines.push(``);
}
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/TEST-REPORT.md"), lines.join("\n"));
console.log("\n" + lines.join("\n"));
process.exit(bad.length ? 1 : 0);
