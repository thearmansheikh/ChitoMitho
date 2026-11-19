// Unit tests for "is the shop open?" in Nepal time. No browser, no network.
// The same checks run again under several computer time zones, to prove a visitor's phone clock does not change the answer.
// Run: npm run test:unit
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ZONES = ["Asia/Kathmandu", "UTC", "America/Los_Angeles", "Asia/Tokyo", "Pacific/Auckland"];
if (!process.env.CM_TZ_CHILD) {
  let failed = 0;
  for (const tz of ZONES) {
    const r = spawnSync(process.execPath, [__filename], { env: { ...process.env, TZ: tz, CM_TZ_CHILD: "1" }, encoding: "utf8" });
    const last = (r.stdout || "").trim().split("\n").filter(Boolean).pop() || "";
    const bad = (r.stdout || "").split("\n").filter((l) => l.startsWith("FAIL") || l.startsWith("   "));
    console.log(`[${tz}] ${last}${r.status ? "  <-- FAILED" : ""}`);
    if (r.status) { failed++; console.log(bad.join("\n")); }
  }
  console.log(`\n${ZONES.length - failed}/${ZONES.length} time zones passed`);
  process.exit(failed ? 1 : 0);
}

const root = path.resolve(__dirname, "../..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "cm-unit-hours-"));
spawnSync(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), path.join(root, "src/lib/openStatus.ts"), "--outDir", out, "--module", "commonjs", "--target", "es2022", "--skipLibCheck"], { cwd: root, encoding: "utf8" });
const found = [path.join(out, "src/lib/openStatus.js"), path.join(out, "openStatus.js")].find((p) => fs.existsSync(p));
if (!found) { console.error("Could not compile src/lib/openStatus.ts"); process.exit(2); }
const { openStatus, todayStillPossible } = require(found);
const fmt = require(path.join(path.dirname(found), "format.js"));

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`));
};

/** The moment it is hh:mm:ss on 19 Nov 2026 in Nepal (UTC+5:45). */
const npt = (hh, mm, ss = 0, day = 19) => new Date(Date.UTC(2026, 10, day, hh, mm, ss) - (5 * 60 + 45) * 60_000);
const H = { open: "10:00", close: "22:00" };
const isOpen = (d, h = H) => openStatus(h, null, d).open;

// ---- the four moments from the checklist
eq("09:59 is closed", isOpen(npt(9, 59)), false);
eq("10:00 is open", isOpen(npt(10, 0)), true);
eq("21:59 is open", isOpen(npt(21, 59)), true);
eq("22:00 is closed", isOpen(npt(22, 0)), false);

// ---- the seconds around them
eq("09:59:59 is still closed", isOpen(npt(9, 59, 59)), false);
eq("21:59:59 is still open", isOpen(npt(21, 59, 59)), true);
eq("22:00:00 is closed", isOpen(npt(22, 0, 0)), false);
eq("22:00:01 is closed", isOpen(npt(22, 0, 1)), false);

// ---- the rest of the day
eq("midnight is closed", isOpen(npt(0, 0)), false);
eq("03:00 is closed", isOpen(npt(3, 0)), false);
eq("noon is open", isOpen(npt(12, 0)), true);
eq("23:59 is closed", isOpen(npt(23, 59)), false);

// ---- the day rolls over at Nepal midnight, not UTC midnight
eq("Nepal 00:30 on the 20th (UTC 18:45 on the 19th) is closed", isOpen(npt(0, 30, 0, 20)), false);
eq("Nepal 10:30 on the 20th is open", isOpen(npt(10, 30, 0, 20)), true);
eq("Nepal clock reads 09:59", fmt.nowMinutesNPT(npt(9, 59)), 9 * 60 + 59);
eq("Nepal date is 19 Nov at 23:59 even though UTC says 18:14 on the 19th", fmt.nepalDates(npt(23, 59)).today, "2026-11-19");
eq("Nepal date is 20 Nov at 00:00", fmt.nepalDates(npt(0, 0, 0, 20)).today, "2026-11-20");

// ---- what to tell a customer who finds it closed
eq("09:59: closed, opens today at 10:00", openStatus(H, null, npt(9, 59)), { open: false, opensAt: "10:00", opensTomorrow: false });
eq("22:00: closed, opens tomorrow at 10:00", openStatus(H, null, npt(22, 0)), { open: false, opensAt: "10:00", opensTomorrow: true });
eq("23:30: closed, opens tomorrow at 10:00", openStatus(H, null, npt(23, 30)), { open: false, opensAt: "10:00", opensTomorrow: true });
eq("03:00: closed, opens later today (not tomorrow)", openStatus(H, null, npt(3, 0)), { open: false, opensAt: "10:00", opensTomorrow: false });
eq("10:00: open, closes at 22:00", openStatus(H, null, npt(10, 0)), { open: true, closesAt: "22:00" });
eq("seconds in the stored time are ignored ('10:00:00')", openStatus({ open: "10:00:00", close: "22:00:00" }, null, npt(9, 59)), { open: false, opensAt: "10:00", opensTomorrow: false });

// ---- different hours tomorrow (weekday hours)
const tom = { open: "11:30", close: "21:00" };
eq("after closing, 'opens tomorrow' uses tomorrow's own opening time", openStatus(H, tom, npt(22, 5)), { open: false, opensAt: "11:30", opensTomorrow: true });
eq("before opening, 'opens today' still uses today's time", openStatus(H, tom, npt(9, 0)), { open: false, opensAt: "10:00", opensTomorrow: false });

// ---- other hours
eq("a shop open 08:00 to 20:30 is open at 20:29", isOpen(npt(20, 29), { open: "08:00", close: "20:30" }), true);
eq("…and closed at 20:30", isOpen(npt(20, 30), { open: "08:00", close: "20:30" }), false);
eq("an overnight shop (18:00 to 02:00) is open at 01:59", isOpen(npt(1, 59), { open: "18:00", close: "02:00" }), true);
eq("…closed at 02:00", isOpen(npt(2, 0), { open: "18:00", close: "02:00" }), false);
eq("…closed at 17:59, opens today at 18:00", openStatus({ open: "18:00", close: "02:00" }, null, npt(17, 59)), { open: false, opensAt: "18:00", opensTomorrow: false });

// ---- ordering for later: is "today" still a choice?
eq("at 21:29 today is still possible with a 30 minute lead", todayStillPossible(H, 30, npt(21, 29)), true);
eq("at 21:30 today is no longer possible", todayStillPossible(H, 30, npt(21, 30)), false);
eq("at 09:00 today is possible (choose a time after opening)", todayStillPossible(H, 30, npt(9, 0)), true);
eq("at 23:00 today is not possible", todayStillPossible(H, 30, npt(23, 0)), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
