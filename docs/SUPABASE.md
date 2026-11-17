# Supabase setup

1. Create a project at supabase.com.
2. SQL Editor: run `supabase/migrations/0001_schema.sql`, `0002_seed.sql` (sample data), then `0003_restrict_is_admin.sql`.
3. Authentication > Providers > Email: **disable "Allow new users to sign up"**.
4. Authentication > Users > Add user: create the team member with email + password.
5. Make them an admin (SQL Editor):

   ```sql
   insert into admins (user_id)
   select id from auth.users where email = 'team@example.com';
   ```

6. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
7. Run `npm run dev` and sign in at `/admin/login`.

Only users listed in the `admins` table can use `/admin` and write to the database
(enforced by Row Level Security, not just the UI). Product images and logos are stored in
the public `media` bucket created by the migration.
