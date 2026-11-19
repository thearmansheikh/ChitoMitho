// Unit tests for which places are shown (places with no menu yet). No browser, no network.
// Run: npm run test:unit
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "cm-unit-places-"));
spawnSync(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), path.join(root, "src/lib/places.ts"), "--outDir", out, "--module", "commonjs", "--target", "es2022", "--skipLibCheck"], { cwd: root, encoding: "utf8" });
const found = [path.join(out, "src/lib/places.js"), path.join(out, "places.js")].find((p) => fs.existsSync(p));
if (!found) { console.error("Could not compile src/lib/places.ts"); process.exit(2); }
const { hasMenu, noMenuModeOf, visiblePlaces } = require(found);

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`));
};

const withMenu = { id: "a", item_count: 111 };
const empty = { id: "b", item_count: 0 };
const unknown = { id: "c" };
const all = [withMenu, empty, unknown];

eq("a place with items has a menu", hasMenu(withMenu), true);
eq("a place with 0 items has no menu", hasMenu(empty), false);
eq("a place whose count is unknown counts as having one", hasMenu(unknown), true);
eq("the setting defaults to the badge", noMenuModeOf({}), "badge");
eq("the setting 'badge' is the badge", noMenuModeOf({ places_without_menu: "badge" }), "badge");
eq("the setting 'hide' hides", noMenuModeOf({ places_without_menu: "hide" }), "hide");
eq("anything unexpected falls back to the badge", noMenuModeOf({ places_without_menu: "nonsense" }), "badge");
eq("badge mode shows every place", visiblePlaces(all, "badge").map((p) => p.id), ["a", "b", "c"]);
eq("hide mode drops places with no menu", visiblePlaces(all, "hide").map((p) => p.id), ["a", "c"]);
eq("hide mode keeps the order", visiblePlaces([empty, withMenu, empty, unknown], "hide").map((p) => p.id), ["a", "c"]);
eq("no places gives no places", visiblePlaces([], "hide"), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
