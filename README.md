# Chitto Mitho

Mobile-first ordering website for **Chitto Mitho**, a delivery service in Dharan, Nepal (food, groceries,
liquor, gifts & flowers, parcels and "anything from anywhere"). Customers pick items, fill a short form and
the finished order opens in **WhatsApp**. There is no online checkout or payment. The team manages menus,
prices and settings from a phone-friendly `/admin` page.

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Supabase (Postgres, Auth, Storage) · next-intl (English / नेपाली) · Netlify

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values (see below)
npm run dev                  # http://localhost:3000
```

Without Supabase keys the site still runs and shows **sample data** with a "Preview mode" banner, so you can
try every page. The admin area needs Supabase.

## Environment variables

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page, "anon public" key | Public, safe in the browser because Row Level Security protects the data |
| `NEXT_PUBLIC_SITE_URL` | Your domain, e.g. `https://chittomitho.com` | Used for sitemap, canonical links and Open Graph |

Never put the `service_role` key in this project. It is not needed.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor**: run `supabase/migrations/0001_schema.sql`, `0002_seed.sql` and then `0003_restrict_is_admin.sql`
   (sample places, items, areas and settings; replace them from the admin page).
3. **Authentication > Providers > Email**: turn **off** "Allow new users to sign up".
4. Put the three environment variables above in `.env.local`.

What the migration sets up: tables `places`, `categories`, `items`, `areas`, `settings` (one row),
`order_clicks` and `admins`; Row Level Security (the public can read the menu and areas, and can only
*insert* into `order_clicks`; admins can do everything); and a public `media` storage bucket for logos and
item photos (only admins can upload).

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
| Places | Add, edit, reorder, activate/deactivate, upload a logo |
| Items | Per place: categories, items, prices, Nepali names, photos, sold-out switch |
| Areas | The delivery-area dropdown (grouped Dharan / Itahari / Biratnagar / Nearby) |
| Settings | Order WhatsApp number, phone numbers, opening hours, **Pause orders** + message, announcement banner, liquor age text |
| Orders | How many WhatsApp orders were sent today / this week / this month, by service and place |

Changes appear on the public site within about a minute (pages are cached for 60 seconds).

## How ordering works

The basket, parcel and "order anything" forms build a message (`src/lib/whatsapp.ts`) in the customer's
language and open `https://wa.me/977<number>?text=…`. Before opening WhatsApp the site records one row in
`order_clicks` (service, place, items total, area). **The customer's name and phone are never stored on our
servers**; they are only saved on the customer's own phone for next time. Sending is disabled outside opening
hours or when orders are paused.

## Deploy to Netlify

1. Push the project to GitHub (Netlify builds from a Git repository).
2. Netlify > **Add new site > Import from Git** and choose the repo. `netlify.toml` already sets the build
   command and the Next.js plugin.
3. **Site configuration > Environment variables**: add the three variables above, then deploy.
4. Check `/`, `/food`, `/admin/login` and place a test order.

## Connect the domain

1. Netlify > **Domain management > Add a domain** (`chittomitho.com` or `chittomitho.com.np`).
2. At your registrar either switch to Netlify DNS, or add the records Netlify shows (usually an `A`/`ALIAS`
   record for the root domain and a `CNAME` for `www`). `.com.np` domains are registered through a Nepal
   registrar; the same DNS records apply.
3. Wait for DNS, then enable HTTPS (Let's Encrypt) in Netlify.
4. Set `NEXT_PUBLIC_SITE_URL` to the final `https://…` address and redeploy.
5. In Supabase > **Authentication > URL Configuration**, set the Site URL to the same address.

## Project layout

```
messages/          en.json, ne.json  (all UI text and WhatsApp message labels)
supabase/migrations/   SQL schema, RLS, storage, seed data
src/app/           pages (home, food, groceries, liquor, gifts, parcel, anything, basket, about, p/[slug], admin/*)
src/components/    shop/, forms/, admin/, header, footer, bottom bar
src/context/       BasketContext (basket kept in the browser)
src/lib/           data (cached Supabase reads), whatsapp, details, format (NPR + Nepal time), supabase clients
docs/SUPABASE.md   short Supabase checklist
```

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint`

## Before launch

See the launch checklist in the website plan: enter and double-check all menus and prices, send test orders
from Android and iPhone in both languages, test Pause orders and opening hours, and run a Lighthouse mobile
report on the live site.
