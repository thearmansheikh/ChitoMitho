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
  { ...base, itemId: "4", name: "Coca-Cola", price: 89, qty: 4 },
];
const total = lines.reduce((n, l) => n + l.qty * l.price, 0);
for (const lang of ["en", "ne"]) {
  const msg = w.basketMessage(lang, { lines, extras, total, customer });
  const url = w.buildWhatsAppUrl("9805338257", msg);
  const back = textOf(url);
  eq(`[${lang}] basket message arrives unchanged`, back, msg);
  eq(`[${lang}] every item, quantity and line total is there`,
    [/2 x Fish & Chips #5/, /1 x Cheesy Zinger Burger/, lang === "ne" ? /3 x चिकेन मोमो/ : /3 x Momo 🥟/, /4 x Coca-Cola/, /Rs\. 600/, /Rs\. 750/, /Rs\. 356/].every((r) => r.test(back)), true);
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

// ---- the delivery line: starts from an amount, a fixed charge for an area, or just "to be confirmed"
{
  const one = [lines[0]];
  const lineOf = (lang, c) => w.basketMessage(lang, { lines: one, extras, total: 600, customer: { ...customer, ...c } }).split("\n").find((l) => /^\(/.test(l));
  eq("delivery line: starts from Rs. 50", lineOf("en", { deliveryFrom: 50 }), "(Delivery charge starts from Rs. 50; depends on location and order – to be confirmed)");
  eq("delivery line: a fixed charge for BPKIHS wins", lineOf("en", { deliveryFrom: 50, deliveryFixed: { area: "BPKIHS", amount: 50 } }), "(Delivery charge for BPKIHS: Rs. 50)");
  eq("delivery line: no amount set says it depends on order and distance", lineOf("en", {}), "(Delivery charge depends on the order and distance – to be confirmed)");
  eq("delivery line (Nepali): starts from", lineOf("ne", { deliveryFrom: 50 }), "(डेलिभरी शुल्क Rs. 50 बाट सुरु; स्थान र अर्डरमा भर पर्छ – पुष्टि गरिनेछ)");
  eq("delivery line (Nepali): fixed", lineOf("ne", { deliveryFixed: { area: "बीपीकेआईएचएस", amount: 50 } }), "(बीपीकेआईएचएस को डेलिभरी शुल्क: Rs. 50)");
  const parcel = w.parcelMessage("en", { pickup: "A", drop: "B", item: "docs", size: "small", receiverName: "R", receiverPhone: "9812345678" }, { ...customer, deliveryFixed: { area: "BPKIHS", amount: 50 } });
  eq("delivery line: parcels get it too", parcel.split("\n").includes("(Delivery charge for BPKIHS: Rs. 50)"), true);
  const anything = w.anythingMessage("en", { need: "medicine", buyFrom: "", budget: "" }, { ...customer, deliveryFrom: 50 });
  eq("delivery line: order-anything gets it too", anything.split("\n").includes("(Delivery charge starts from Rs. 50; depends on location and order – to be confirmed)"), true);
}

// ---- Task 1: the full order message, in the order the team reads it
{
  const mk = (over) => ({ ...base, itemId: "x", price: 100, qty: 1, ...over });
  const cust = { name: "Sita Rai", phone: "9812345678", area: "Dharan-5", landmark: "Near Nabil Bank", payment: "cod", note: "", deliverAt: null };
  const ex = (over = {}) => ({ ...extras, ...over });

  // items from two places: grouped under their own "From:" line
  const two = [
    mk({ itemId: "a1", name: "Combo 4", price: 669, qty: 2 }),
    mk({ itemId: "a2", name: "Peri Peri Fries", price: 179, qty: 1 }),
    mk({ itemId: "b1", placeId: "p2", placeName: "Sweet Treats", placeNameNe: null, name: "Birthday Cake", price: 1500, qty: 1 }),
  ];
  const total2 = 2 * 669 + 179 + 1500;
  const m = w.basketMessage("en", { lines: two, extras: ex(), total: total2, customer: cust });
  const rows = m.split("\n");
  eq("several places: each place has its own From: line", rows.filter((r) => r.startsWith("From: ")).join("|"), "From: The Chicken Box|From: Sweet Treats");
  eq("several places: items sit under the right place", rows.indexOf("From: Sweet Treats") > rows.indexOf("• 1 x Peri Peri Fries (Rs. 179) = Rs. 179") && rows.indexOf("• 1 x Birthday Cake (Rs. 1,500) = Rs. 1,500") === rows.indexOf("From: Sweet Treats") + 1, true);
  eq("several places: one total for everything", rows.includes("Items total: Rs. " + total2.toLocaleString("en-US")), true);
  eq("several places: the order type lists both kinds only once", rows.includes("Order type: Food"), true);

  // the order of the lines
  const full = w.basketMessage("en", { lines: [two[0], two[1]], extras: ex({ promo: "first" }), total: 1517, customer: { ...cust, location: { lat: 26.8125, lng: 87.2813 }, note: "Less spicy", deliverAt: { day: "tomorrow", time: "14:30" }, tole: "Putali Line", house: "House 14" } });
  const fr = full.split("\n");
  const at = (prefix) => fr.findIndex((r) => r.includes(prefix));
  const sequence = ["NEW ORDER", "Order type:", "From:", "Items total:", "Name:", "Phone:", "Area:", "Tole / street:", "House / gate:", "Landmark:", "Payment:", "Delivery:", "Promo code:", "Map location:", "Note:"].map(at);
  eq("line order: header, items, total, name, phone, address, payment, delivery, promo, location, note", sequence.every((x, i) => x >= 0 && (i === 0 || x > sequence[i - 1])), true);
  eq("payment line", fr.includes("Payment: Cash on delivery"), true);
  eq("QR payment line", w.basketMessage("en", { lines: [two[0]], extras: ex(), total: 1338, customer: { ...cust, payment: "qr" } }).includes("Payment: QR at door"), true);
  eq("later: date and time", fr.includes("Delivery: Later – Tomorrow 14:30"), true);
  eq("promo code is written in capitals, once", fr.includes("🎟️ Promo code: FIRST") && fr.filter((r) => r.includes("Promo code")).length === 1, true);
  eq("location link is a Google Maps link", fr.some((r) => /^📍 Map location: https:\/\/www\.google\.com\/maps\?q=26\.812500,87\.281300$/.test(r)), true);
  eq("note", fr.includes("Note: Less spicy"), true);

  // lines that do not apply are left out
  const plain = w.basketMessage("en", { lines: [two[0]], extras: ex(), total: 1338, customer: cust }).split("\n");
  eq("as soon as possible when no time was chosen", plain.includes("Delivery: As soon as possible"), true);
  eq("no promo line when none was entered", plain.some((r) => r.includes("Promo code")), false);
  eq("no map line when no location was shared", plain.some((r) => r.includes("Map location")), false);
  eq("no note line when the note is empty", plain.some((r) => r.startsWith("Note:")), false);
  const gift = w.basketMessage("en", { lines: [two[0]], extras: ex(), total: 1338, customer: { ...cust, scheduled: false } }).split("\n");
  eq("gift orders (own date and time) have no Delivery: line", gift.some((r) => r.startsWith("Delivery:")), false);

  // names with & # % + survive, and so do emoji and Nepali
  const odd = [mk({ itemId: "o1", name: "Fish & Chips #5 (100% fresh) +cheese", price: 250, qty: 2, note: "no salt & pepper, 50% less oil" })];
  const mo = w.basketMessage("en", { lines: odd, extras: ex(), total: 500, customer: cust });
  eq("special characters in names and notes are kept", mo.includes("• 2 x Fish & Chips #5 (100% fresh) +cheese (Rs. 250) = Rs. 500") && mo.includes("↳ no salt & pepper, 50% less oil"), true);
  eq("special characters survive the link", textOf(w.buildWhatsAppUrl("9805338257", mo)), mo);
  const emoji = w.basketMessage("en", { lines: [mk({ itemId: "e1", name: "Momo 🥟🔥", price: 250 })], extras: ex(), total: 250, customer: cust });
  eq("emoji in an item name survive the link", textOf(w.buildWhatsAppUrl("9805338257", emoji)).includes("Momo 🥟🔥") && !w.buildWhatsAppUrl("9805338257", emoji).includes("%EF%BF%BD"), true);

  // Nepali
  const ne = w.basketMessage("ne", { lines: [two[0]], extras: ex({ promo: "first" }), total: 1338, customer: { ...cust, payment: "qr", deliverAt: { day: "today", time: "18:00" }, location: { lat: 26.8, lng: 87.28 }, note: "कम पिरो" } }).split("\n");
  eq("Nepali: delivery later, payment, promo, note labels", ne.includes("डेलिभरी: पछि – आज 18:00") && ne.some((r) => r.startsWith("भुक्तानी: ")) && ne.includes("🎟️ प्रोमो कोड: FIRST") && ne.includes("टिप्पणी: कम पिरो"), true);
  eq("Nepali: as soon as possible", w.basketMessage("ne", { lines: [two[0]], extras: ex(), total: 1338, customer: cust }).split("\n").includes("डेलिभरी: सकेसम्म चाँडो"), true);
}

// ---- Task 2: the other forms (parcel, order anything, partner, rider)
{
  const cust = { name: "Sita Rai", phone: "9812345678", area: "Dharan-5", landmark: "Near Nabil Bank", payment: "cod", note: "", deliverAt: null };
  const rows = (s) => s.split("\n");

  const parcel = rows(w.parcelMessage("en", { pickup: "Bhanu Chowk", drop: "BPKIHS gate", item: "Documents & keys", size: "small", receiverName: "Ram", receiverPhone: "9801112233" }, cust));
  eq("parcel: sender name and phone are labelled as the sender's", parcel.includes("Sender name: Sita Rai") && parcel.includes("Sender phone: 9812345678"), true);
  eq("parcel: the pickup time is asked and written (as soon as possible)", parcel.includes("Pickup time: As soon as possible"), true);
  eq("parcel: a later pickup shows the day and time", rows(w.parcelMessage("en", { pickup: "A", drop: "B", item: "x", size: "small", receiverName: "R", receiverPhone: "9801112233" }, { ...cust, deliverAt: { day: "tomorrow", time: "11:00" } })).includes("Pickup time: Later – Tomorrow 11:00"), true);
  eq("parcel: pickup, drop, item, size and receiver are all there", ["Pickup: Bhanu Chowk", "Drop: BPKIHS gate", "Item: Documents & keys"].every((l) => parcel.some((r) => r.includes(l.split(": ")[1]))) && parcel.some((r) => r.startsWith("Receiver")), true);
  eq("parcel (Nepali): sender labels", rows(w.parcelMessage("ne", { pickup: "A", drop: "B", item: "x", size: "small", receiverName: "R", receiverPhone: "9801112233" }, cust)).some((r) => r.startsWith("पठाउनेको नाम: ")), true);

  const any = (b) => rows(w.anythingMessage("en", { need: "Medicine & a charger", buyFrom: "", budget: b }, cust));
  eq("anything: a numeric budget is written as Rs.", any("500").includes("Budget: Rs. 500"), true);
  eq("anything: a large budget gets a thousands comma", any("12500").includes("Budget: Rs. 12,500"), true);
  eq("anything: no budget, no budget line", any("").some((r) => r.startsWith("Budget")), false);
  eq("anything: the need is kept as typed", any("").includes("Need: Medicine & a charger") || any("").some((r) => r.includes("Medicine & a charger")), true);

  const partner = (type, typeOther) => rows(w.partnerMessage("en", { business: "Test Café & Grill #1", type, typeOther, contactName: "Ram", phone: "9801234567", area: "Dharan", offer: "" }));
  eq("partner: a normal type is written as is", partner("cafe", "").includes("Type: Café / Restaurant"), true);
  eq("partner: the type typed for 'Other' is written", partner("other", "Bakery").includes("Type: Other – Bakery"), true);
  eq("partner: 'Other' with nothing typed is just Other", partner("other", "").includes("Type: Other"), true);

  const rider = (o) => rows(w.riderMessage("en", { name: "Hari", phone: "9801234567", area: "Dharan-9", vehicle: "bike", hasLicense: true, availability: "", ...o }));
  eq("rider: with a vehicle, the vehicle is listed", rider({ hasVehicle: true }).includes("Own vehicle: Yes") && rider({ hasVehicle: true }).includes("Vehicle: Motorbike"), true);
  eq("rider: without a vehicle there is no vehicle line", rider({ hasVehicle: false }).includes("Own vehicle: No") && !rider({ hasVehicle: false }).some((r) => r.startsWith("Vehicle:")), true);
  eq("rider: licence and availability", rider({ hasLicense: false, availability: "evenings" }).includes("Valid licence: No") && rider({ availability: "evenings" }).includes("Availability: evenings"), true);
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
