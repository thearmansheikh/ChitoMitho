// Unit tests for picture resizing rules, plus a real-browser check that a big photo is shrunk to ~800px WebP.
// Run: npm run test:unit
const { spawnSync } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path");
const root = path.resolve(__dirname, "../..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "cm-unit-image-"));
spawnSync(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), path.join(root, "src/lib/image.ts"), "--outDir", out, "--module", "commonjs", "--target", "es2022", "--skipLibCheck", "--lib", "es2022,dom"], { cwd: root, encoding: "utf8" });
const found = [path.join(out, "src/lib/image.js"), path.join(out, "image.js")].find((p) => fs.existsSync(p));
if (!found) { console.error("Could not compile src/lib/image.ts"); process.exit(2); }
const { fitWithin, firstLetter, imageProblem } = require(found);
let pass = 0, fail = 0;
const eq = (n, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`)); };

eq("a wide photo is shrunk to 800 on its long side", fitWithin(4000, 3000), { width: 800, height: 600 });
eq("a tall photo is shrunk to 800 on its long side", fitWithin(3000, 6000), { width: 400, height: 800 });
eq("a small logo is never enlarged", fitWithin(300, 200), { width: 300, height: 200 });
eq("exactly 800 is left alone", fitWithin(800, 800), { width: 800, height: 800 });
eq("a very thin image keeps at least 1px", fitWithin(100000, 10), { width: 800, height: 1 });
eq("zero size gives zero", fitWithin(0, 50), { width: 0, height: 0 });
eq("first letter is upper case", firstLetter("anzee's cafe"), "A");
eq("first letter skips quotes and spaces", firstLetter('  "the Cake" '), "T");
eq("first letter works for Nepali", firstLetter("स्वाद रेस्ट्रो"), "स");
eq("first letter of a digit name", firstLetter("3 Brothers"), "3");
eq("empty name gives ?", firstLetter(""), "?");
eq("missing name gives ?", firstLetter(null), "?");
eq("a picture is accepted", imageProblem({ type: "image/jpeg", size: 2e6 }), null);
eq("a PDF is refused", /picture/.test(imageProblem({ type: "application/pdf", size: 1e3 })), true);
eq("a huge file is refused", /too large/.test(imageProblem({ type: "image/png", size: 20e6 })), true);

(async () => {
  try {
    const puppeteer = require("puppeteer-core");
    const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto("about:blank");
    await page.evaluate("var exports = {};");
    await page.evaluate(fs.readFileSync(found, "utf8"));
    const r = await page.evaluate(async () => {
      const c = document.createElement("canvas"); c.width = 3000; c.height = 2000;
      const g = c.getContext("2d"); g.fillStyle = "#d22"; g.fillRect(0, 0, 3000, 2000);
      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      const file = new File([blob], "big-photo.png", { type: "image/png" });
      const { blob: small, ext } = await exports.shrinkToWebp(file);
      const bm = await createImageBitmap(small);
      return { ext, type: small.type, w: bm.width, h: bm.height, smaller: small.size < file.size };
    });
    eq("browser: a 3000x2000 photo becomes an 800x533 WebP", [r.ext, r.type, r.w, r.h], ["webp", "image/webp", 800, 533]);
    eq("browser: the shrunk file is smaller", r.smaller, true);
    await browser.close();
  } catch (e) { fail++; console.log("FAIL browser check crashed: " + e.message); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
