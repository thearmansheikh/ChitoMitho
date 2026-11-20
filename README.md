# Chitto Mitho

Mobile-first ordering website for **Chitto Mitho**, a delivery service in Dharan, Nepal (food, groceries,
gifts & flowers, parcels and "anything from anywhere"; liquor is built but switched off until the shop is
ready). Customers pick items, fill a short form and the finished order opens in **WhatsApp**. There is no
online checkout or payment. The team manages menus, prices and settings from a phone-friendly `/admin` page.

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Supabase (Postgres, Auth, Storage) · next-intl (English / नेपाली) · hosted on **Vercel** (deploys from the `main` branch on GitHub)

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values (see below)
npm run dev                  # http://localhost:3000
```

Without Supabase keys the site still runs and shows **sample data** with a "Preview mode" banner, so you can
try every page. The admin area needs Supabase.

## Environment variables

Set these in `.env.local` while developing, and in **Vercel > Project > Settings > Environment Variables** for the live site.

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page, "anon public" key | Public, safe in the browser because Row Level Security protects the data |
| `NEXT_PUBLIC_SITE_URL` | The website's own address, e.g. `https://yourdomain.com` | Used for the sitemap, canonical links, Open Graph previews, structured data and the redirects below. If you leave it empty the site uses its free Vercel address, so links never point at a domain you do not own |
| `LEGACY_HOSTS` | Optional. Comma separated old addresses, e.g. `old-domain.com` | Each one redirects to `NEXT_PUBLIC_SITE_URL` |

Never put the `service_role` key in this project. It is not needed. `NEXT_PUBLIC_*` values are baked in when
the site is built, so after changing one in Vercel, **redeploy**.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor**: run every file in `supabase/migrations/` in number order (`0001` to the latest). They create the
   tables, Row Level Security, the public `media` storage bucket and the settings. `0002_seed.sql` adds sample
   data that you replace from the admin page.
3. **Authentication > Providers > Email**: turn **off** "Allow new users to sign up".
4. Put the three environment variables above in `.env.local`.

What the schema sets up: tables for places, categories, items, areas, toles, settings (one row), closures,
offers, `order_clicks` and `admins`; Row Level Security (the public can read the menu and areas, and can only
*insert* into `order_clicks`; admins can do everything); and the storage bucket for logos, covers and item
photos (only admins can upload; pictures are shrunk to about 800 px WebP in the browser first).

### Create the first admin user

1. Supabase > **Authentication > Users > Add user**: enter the team member's email and a password
   (tick "Auto confirm user").
2. Make them an admin in the SQL Editor:

   ```sql
   insert into admins (user_id)
   select id from auth.users where email = 'team@example.com';
   ```

3. Open `/admin/login` and sign in. Repeat for each team member.

A user who is not in the `admins` table cannot use `/admin` or change any data, even with a valid login.

## Using the admin page

| Page | What it does |
| --- | --- |
| Places | Add, edit, reorder, activate/deactivate; upload or remove a logo and a cover photo; warnings for places with no items or no logo |
| Items | Per place: categories, items, prices (edit right on the card), Nepali names, photos, sold-out switch (also for a whole category), duplicate an item, reference photos of the paper menu |
| Import | Paste a menu (typed list, or cells copied from Excel or Google Sheets) or upload a CSV (a template can be downloaded). Preview, then import. Adds new items, optionally updates prices of existing ones, never deletes. See `src/lib/menuImport.ts` for the accepted formats |
| Areas | The delivery-area dropdown, and a fixed delivery charge for an area where there is one |
| Toles | Streets and toles customers can pick |
| Offers / Holiday closures | Deals and promo codes; days when orders are closed |
| Settings | WhatsApp number, phone numbers, opening hours (also per weekday), **Pause orders** + message, announcement banner, delivery "starts from" amount, places without a menu (badge or hide), **Sell liquor** switch, liquor age text |
| Orders | How many WhatsApp orders were sent today / this week / this month, by service, place and hour |

Changes appear on the public site within about a minute (pages are cached for 60 seconds).

## How ordering works

The basket, parcel and "order anything" forms build a message (`src/lib/whatsapp.ts`) in the customer's
language and open `https://api.whatsapp.com/send?phone=977<number>&text=…` (this form keeps emoji intact;
`wa.me` links turn them into "�"). Before opening WhatsApp the site records one row in `order_clicks`
(service, place, items total, area). **The customer's name and phone are never stored on our servers**; they are
only saved on the customer's own phone for next time. When the shop is closed the customer can still order for
later; when orders are paused (a holiday, a closed weekday) sending is blocked.

## Deploy (Vercel)

The live site deploys automatically each time `main` is pushed to GitHub.

1. Vercel > **Add New > Project** > import the GitHub repository.
2. **Settings > Environment Variables**: add the variables above for *Production*, then deploy.
3. Check `/`, `/food`, `/admin/login` and place a test order.

(`netlify.toml` is left over from an earlier plan and is not used.)

## Connect your own domain

Do this when you have bought a domain (for example `yourdomain.com` or `yourdomain.com.np`). Nothing in the code has to
change: the whole site reads one setting, `NEXT_PUBLIC_SITE_URL`.

1. **Vercel > Project > Settings > Domains > Add** your domain (the bare `yourdomain.com`, and also `www.yourdomain.com`).
   Vercel shows the DNS records to create.
2. **At your registrar**, add those records: usually an `A` record for the bare domain pointing to the address Vercel
   shows, and a `CNAME` for `www` pointing to `cname.vercel-dns.com`. `.com.np` domains are registered through a Nepal
   registrar; the same records apply. DNS can take from a few minutes to a day.
3. Wait until Vercel shows both domains as **Valid Configuration**. HTTPS is switched on for you.
4. **Vercel > Settings > Environment Variables**: set `NEXT_PUBLIC_SITE_URL` to the address you want people to see,
   for example `https://yourdomain.com` (choose with or without `www` and stick to it). Then **Redeploy**.
5. That is the switch. From the redeploy on:
   - the free `…vercel.app` address and the other of `www` / non-`www` send visitors to your domain with a permanent
     (308) redirect, keeping the page and the search (`?…`) part, so old links and shared links keep working;
   - the sitemap, `robots.txt`, canonical links, shared-link previews and the business details for Google all use your domain.
6. **Supabase > Authentication > URL Configuration**: set **Site URL** to the same address, and add
   `https://yourdomain.com/**` (and the `www` version) to **Redirect URLs**, so the admin "forgot password" email
   opens your domain.
7. **Google Search Console**: add the domain as a property, then submit `https://yourdomain.com/sitemap.xml`.
8. Update the link in your TikTok and Instagram profiles, Google Business Profile and WhatsApp Business "Website" field.
9. Check it: open `https://yourdomain.com`, then the old `…vercel.app` address (it should jump to your domain), then
   place a test order. For a full automatic check against the live site run
   `BASE=https://yourdomain.com node tests/e2e/seo.cjs`.

Moving from one custom domain to another later? Put the old one in `LEGACY_HOSTS` and set the new one as
`NEXT_PUBLIC_SITE_URL`; the old one then redirects to the new.

**Practice without buying anything:** `node tests/e2e/domain-rehearsal.cjs` builds a copy of the site that believes
it lives at `https://shop.example.test` and checks the redirects and that every link, canonical address and sitemap
entry uses that address and never the free Vercel one.

## Tests

```bash
npm run test:unit                      # fast: WhatsApp messages, opening hours (in 5 time zones), places, images, menu import, website address
BASE=http://localhost:3000 node tests/e2e/<name>.cjs   # browser tests (need Chrome); add LOCALE=ne for Nepali
```

Browser tests live in `tests/e2e/`: `customer-journey`, `whatsapp-handoff`, `forms`, `edge-cases`, `open-closed`,
`sections`, `partners`, `language-toggle`, `nepali-audit`, `accessibility`, `seo`, `domain-rehearsal` and more. They
never write to the database. Run them against a production build (`npm run build && npm run start`) for the cleanest results.

## Project layout

```
messages/          en.json, ne.json  (all UI text and WhatsApp message labels; keep the keys identical)
supabase/migrations/   SQL schema, RLS, storage, seed data, settings (run in number order)
supabase/data/     optional one-off SQL (menu records, clean-ups)
src/app/           pages (home, food, groceries, liquor, gifts, parcel, anything, basket, about, p/[slug], admin/*)
src/components/    shop/, forms/, admin/, header, footer, bottom bar
src/context/       BasketContext (basket kept in the browser)
src/lib/           data (cached Supabase reads), whatsapp, hours/openStatus (Nepal time), seo, siteUrl (domain), format, supabase clients
tests/unit, tests/e2e   automated checks
docs/SUPABASE.md   short Supabase checklist
```

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm run test:unit`

## Before launch

Enter and double-check all menus and prices, send test orders from Android and iPhone in both languages, test
Pause orders and opening hours, connect the domain (above), and run a PageSpeed Insights mobile report on the live site.
