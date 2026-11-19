// Unit tests for menu import: the downloadable CSV template and the main parsing shapes. No browser, no network.
const { spawnSync } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path");
const root = path.resolve(__dirname, "../..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "cm-unit-import-"));
spawnSync(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), path.join(root, "src/lib/menuImport.ts"), "--outDir", out, "--module", "commonjs", "--target", "es2022", "--skipLibCheck"], { cwd: root, encoding: "utf8" });
const found = [path.join(out, "src/lib/menuImport.js"), path.join(out, "menuImport.js")].find((p) => fs.existsSync(p));
if (!found) { console.error("Could not compile src/lib/menuImport.ts"); process.exit(2); }
const { CSV_TEMPLATE, EXAMPLE_MENU, parseMenu, planImport } = require(found);
let pass = 0, fail = 0;
const eq = (n, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`)); };

const t = parseMenu(CSV_TEMPLATE);
eq("the template is read as a table with a header row", [t.format, t.hadHeader], ["table", true]);
eq("the template's one sample row is found, marked as an example", t.rows.map((r) => [r.category, /EXAMPLE/.test(r.name), r.price]), [["Starters", true, 100]]);
eq("the template header names the five columns", CSV_TEMPLATE.split("\r\n")[0], "Category,Name,Price,Nepali name,Description");

const csv = parseMenu("Category,Name,Price,Nepali name,Description\nMomo,Chicken Momo,250,चिकेन मोमो,Steamed\nDrinks,\"Tea, hot\",\"1,090\",,");
eq("CSV rows: category, name, price, Nepali name", csv.rows.map((r) => [r.category, r.name, r.price, r.nameNe]), [["Momo", "Chicken Momo", 250, "चिकेन मोमो"], ["Drinks", "Tea, hot", 1090, ""]]);

const plain = parseMenu(EXAMPLE_MENU);
eq("a typed list gives categories and prices", plain.rows.map((r) => [r.category, r.name, r.price]).slice(0, 2), [["Momo", "Chicken Momo", 250], ["Momo", "Veg Momo", 200]]);

const existing = [{ id: "i1", name: "Chicken Momo", name_ne: null, price_npr: 200, category_id: "c1" }];
const plan = planImport(plain.rows, existing, true);
eq("an item already on the menu with a new price is an update, not a duplicate", plan.find((p) => p.name === "Chicken Momo").action, "update");
eq("an unknown item is new", plan.find((p) => p.name === "Veg Momo").action, "new");
eq("with 'update prices' off, a known item is left alone", planImport(plain.rows, existing, false).find((p) => p.name === "Chicken Momo").action, "skip");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
