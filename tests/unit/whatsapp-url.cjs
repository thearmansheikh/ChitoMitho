// Unit tests for the WhatsApp link and message builders. No browser, no network.
// Run: npm run test:unit
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "cm-unit-"));
// tsc reports type errors for the "@/..." path aliases here, but still writes the JavaScript we need.
spawnSync(process.execPath, [
  path.join(root, "node_modules/typescript/bin/tsc"), path.join(root, "src/lib/whatsapp.ts"),
  "--outDir", out, "--module", "commonjs", "--target", "es2022", "--skipLibCheck", "--resolveJsonModule", "--esModuleInterop",
], { cwd: root, encoding: "utf8" });
const found = [path.join(out, "src/lib/whatsapp.js"), path.join(out, "whatsapp.js")].find((p) => fs.existsSync(p));
if (!found) { console.error("Could not compile src/lib/whatsapp.ts"); process.exit(2); }
const w = require(found);

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`));
};
const textOf = (url) => new URL(url).searchParams.get("text");

// ---- the number
const N = "https://api.whatsapp.com/send?phone=9779805338257&text=";
for (const n of ["9805338257", "+977 9805338257", "977-9805338257", "+977-980-5338257", " 9779805338257 "]) {
  eq(`number "${n}" becomes 9779805338257`, w.buildWhatsAppUrl(n, "hi").startsWith(N), true);
}
eq("the link is api.whatsapp.com/send with phone= and text= only", w.buildWhatsAppUrl("9805338257", "hi"), N + "hi");

// ---- the message survives the trip
const tricky = [
  ["line breaks", "Line one\nLine two\n\nLine four"],
  ["& and # in names", "2 x Fish & Chips #5 (Rs. 300)\nTom & Jerry's #1 = Rs. 50"],
  ["emoji", "🛵 NEW ORDER 🍔🍟 ✅ ❤️"],
  ["Nepali text", "नयाँ अर्डर – चित्तो मिठो\nचिकेन मोमो २ x"],
  ["percent, plus, equals, question mark, quotes", "100% sure? a+b=c \"quoted\" 'single' <b>html</b> https://x.y/?a=1&b=2#top"],
  ["a very long single line", "x".repeat(2500)],
];
for (const [name, msg] of tricky) {
  const url = w.buildWhatsAppUrl("9805338257", msg);
  eq(`${name}: arrives unchanged`, textOf(url), msg);
  const query = url.split("&text=")[1];
  eq(`${name}: nothing unsafe is left in the link`, /^[A-Za-z0-9\-_.!~*'()%]*$/.test(query), true);
}
eq("line break is %0A, never +", w.buildWhatsAppUrl("9805338257", "a\nb").endsWith("a%0Ab"), true);
eq("an empty message still gives a valid link", w.buildWhatsAppUrl("9805338257", ""), N);

// ---- emoji must not be damaged on the way (wa.me turned them into "�"; this address keeps them)
{
  const url = w.buildWhatsAppUrl("9805338257", "🛵 NEW ORDER 📍🕒🎟️✅🍔");
  eq("emoji are percent-encoded as proper UTF-8", url.includes("%F0%9F%9B%B5") && url.includes("%F0%9F%93%8D") && url.includes("%E2%9C%85"), true);
  eq("no replacement character (%EF%BF%BD) anywhere", url.includes("%EF%BF%BD"), false);
  eq("the link host is api.whatsapp.com, not wa.me", new URL(url).host, "api.whatsapp.com");
}

// ---- a real basket message with several items
const base = { placeId: "p1", placeName: "The Chicken Box", placeNameNe: "द चिकेन बक्स", placeType: "food", nameNe: null, note: "" };
const extras = { shoppingList: "", promo: "", gift: { occasion: "", recipientName: "", recipientPhone: "", message: "", date: "", time: "" } };
const customer = { name: "Sita Rai & Co", phone: "9812345678", area: "Dharan – Bhanu Chowk", landmark: "Near the #5 gate 🏠", payment: "cod", note: "Ring the bell\nthen wait" };
const lines = [
  { ...base, itemId: "1", name: "Fish & Chips #5", price: 300, qty: 2, note: "no salt & no pepper" },
  { ...base, itemId: "2", name: "Cheesy Zinger Burger (Signature Burger)", price: 299, qty: 1 },
  { ...base, itemId: "3", name: "Momo 🥟", nameNe: "चिकेन मोमो", price: 250, qty: 3 },
  { ...base, itemId: "4", name: "Cocacola", price: 89, qty: 4 },
];
const total = lines.reduce((n, l) => n + l.qty * l.price, 0);
for (const lang of ["en", "ne"]) {
  const msg = w.basketMessage(lang, { lines, extras, total, customer });
  const url = w.buildWhatsAppUrl("9805338257", msg);
  const back = textOf(url);
  eq(`[${lang}] basket message arrives unchanged`, back, msg);
  eq(`[${lang}] every item, quantity and line total is there`,
    [/2 x Fish & Chips #5/, /1 x Cheesy Zinger Burger/, lang === "ne" ? /3 x चिकेन मोमो/ : /3 x Momo 🥟/, /4 x Cocacola/, /Rs\. 600/, /Rs\. 750/, /Rs\. 356/].every((r) => r.test(back)), true);
  eq(`[${lang}] the total is there`, back.includes("Rs. " + total.toLocaleString("en-US")), true);
  eq(`[${lang}] the customer's details are there`, /Sita Rai & Co/.test(back) && /9812345678/.test(back) && /#5 gate 🏠/.test(back) && /Ring the bell\nthen wait/.test(back), true);
  eq(`[${lang}] the note under the item is there`, /no salt & no pepper/.test(back), true);
  eq(`[${lang}] a normal basket stays under the limit`, back.length <= w.MAX_MESSAGE_CHARS, true);
}

// ---- the address block a rider reads
{
  const one = [lines[0]];
  const withAll = { ...customer, phone2: "9801112233", tole: "Putali Line", house: "House 14, blue gate", landmark: "Near Nabil Bank", area: "Dharan-5" };
  const full = w.basketMessage("en", { lines: one, extras, total: 600, customer: withAll });
  const rows = full.split("\n");
  const has = (list, line) => list.includes(line);
  const at = (label) => full.indexOf(label + ":");
  eq("address block: every part is there", ["Phone", "Other phone", "Area", "Tole / street", "House / gate", "Landmark"].every((l) => at(l) >= 0), true);
  eq("address block: parts come in the order a rider needs them", ["Area", "Tole / street", "House / gate", "Landmark"].map(at).every((x, i, a) => i === 0 || x > a[i - 1]), true);
  eq("address block: each value is on its own line", [
    "Other phone: 9801112233", "Area: Dharan-5", "Tole / street: Putali Line", "House / gate: House 14, blue gate", "Landmark: Near Nabil Bank",
  ].every((line) => has(rows, line)), true);

  const bare = w.basketMessage("en", { lines: one, extras, total: 600, customer: { ...customer, landmark: "Near Nabil Bank", area: "Dharan-5" } });
  eq("address block: empty optional parts leave no lines", ["Other phone:", "Tole / street:", "House / gate:"].every((l) => !bare.includes(l)), true);

  const toleOnly = w.basketMessage("en", { lines: one, extras, total: 600, customer: { ...customer, landmark: "", tole: "Hatkhola", area: "Dharan-9" } });
  eq("address block: a tole alone is enough (no empty Landmark line)", toleOnly.split("\n").includes("Tole / street: Hatkhola") && !toleOnly.includes("Landmark:"), true);

  const ne = w.basketMessage("ne", { lines: one, extras, total: 600, customer: { ...withAll, tole: "पुतली लाइन", house: "घर नं. १४", landmark: "नबिल बैंक नजिक", area: "धरान-५" } });
  const neRows = ne.split("\n");
  eq("address block (Nepali): labels and values", [
    "अर्को फोन: 9801112233", "क्षेत्र: धरान-५", "टोल / सडक: पुतली लाइन", "घर / गेट: घर नं. १४", "चिनारी: नबिल बैंक नजिक",
  ].every((line) => has(neRows, line)), true);
}

// ---- a very long basket gets shorter lines but keeps every item, quantity and the total
const big = Array.from({ length: 30 }, (_, i) => ({ ...base, itemId: "b" + i, name: `Crispy Boneless Strips - ${i + 1}pc special`, price: 100 + i, qty: 2 + (i % 3), note: "extra crispy please, not too salty and well done" }));
const bigTotal = big.reduce((n, l) => n + l.qty * l.price, 0);
const bigMsg = w.basketMessage("en", { lines: big, extras, total: bigTotal, customer });
eq("long basket: all 30 items are still listed", big.every((l, i) => bigMsg.includes(`Crispy Boneless Strips - ${i + 1}pc special`)), true);
eq("long basket: every quantity is kept", big.every((l, i) => bigMsg.includes(`${l.qty} x Crispy Boneless Strips - ${i + 1}pc special`)), true);
eq("long basket: the total is kept", bigMsg.includes("Rs. " + bigTotal.toLocaleString("en-US")), true);
eq("long basket: unit prices are dropped to save space", !/\(Rs\. 1\d\d\)/.test(bigMsg), true);
eq("long basket: notes are shortened to 40 characters", !bigMsg.includes("extra crispy please, not too salty and well done") && bigMsg.includes("extra crispy please, not too salty and w"), true);
eq("long basket: link still round-trips", textOf(w.buildWhatsAppUrl("9805338257", bigMsg)), bigMsg);

// ---- a short hello for the plain WhatsApp buttons
eq("greeting (English)", w.greetingMessage("en"), "Hi Chitto Mitho, I have a question.");
eq("greeting (Nepali) is not empty", w.greetingMessage("ne").length > 5, true);
eq("greeting link is not blank", textOf(w.buildWhatsAppUrl("9805338257", w.greetingMessage("en"))).length > 5, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
