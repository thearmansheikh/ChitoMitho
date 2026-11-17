# Browser tests

Three scripts that drive a real (headless) Chrome against a running copy of the site. They never write to the
database: the order-count request is blocked, and the browser clock is moved to Nepal daytime so ordering is open.

| Script | What it checks |
| --- | --- |
| `order-flow.cjs` | Add to basket, the basket, validation, the review screen, editing, sending, the WhatsApp link, Order again |
| `gift-parcel-anything.cjs` | Gift occasions, card preview, date and time rules, parcel pins and sizes, Order anything examples |
| `phone-overflow.cjs` | No page is wider than a phone screen (this once broke every page at 390px) |

## Run them

```bash
npm run build && npm run start          # in one terminal: the site on http://localhost:3000
npm install --no-save puppeteer-core    # once; uses the Chrome already on your computer

BASE=http://localhost:3000 node tests/e2e/order-flow.cjs
BASE=http://localhost:3000 node tests/e2e/gift-parcel-anything.cjs
# page paths are arguments; W is the phone width, LOCALE=ne checks Nepali
BASE=http://localhost:3000 W=360 node tests/e2e/phone-overflow.cjs / /food /basket /gifts /parcel
```

Set `CHROME_PATH` if Chrome is not in the usual Windows location. Each script prints PASS or FAIL per check and
exits with a non-zero code if anything fails.

The scripts use the demo data (Olive Cafe, Chicken Momo, Red Rose Bouquet). Change those names if you replace the menu.
