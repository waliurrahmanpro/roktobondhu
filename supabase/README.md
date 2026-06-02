# Supabase setup (RoktoBondhu)

## 1. Create a project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Copy **Project URL** and **anon public** key into `.env.local` (see `.env.local.example`).

## 2. Run the database migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. In the left sidebar, click **SQL Editor**.
3. Click **New query**.
4. Copy the full contents of `supabase/migrations/001_profiles.sql` from this repo and paste into the editor.
5. Click **Run** (or press Ctrl+Enter).

You should see **Success. No rows returned**. Then open **Table Editor** → `profiles` to confirm the columns exist.

This creates the `profiles` table (`id`, `user_id`, donor fields), RLS policies, and a trigger that creates a profile when a user signs up.

**If you already ran an older version of this migration**, drop the old table first in SQL Editor: `drop table if exists public.profiles cascade;` then run the migration again.

## 2b. Profile pictures (storage)

After `001_profiles.sql`, run **`002_profile_picture_storage.sql`** in the same **SQL Editor**:

- Adds `profile_picture_url` column to `profiles`
- Creates public `avatars` storage bucket with upload policies

You can also create the bucket manually under **Storage** → **New bucket** (name: `avatars`, public: on), then run only the SQL policies from that file.

## 2c. Blood requests

Run **`003_blood_requests.sql`** in **SQL Editor** to create the `blood_requests` table used for the homepage feed and `/dashboard/requests`.

## 2d. Total points (Phase 1 display column)

Run **`004_total_points.sql`** to add `total_points` on `profiles` (defaults to `0`; no points logic yet).

## 3. Auth settings (recommended for local dev)

Dashboard → **Authentication** → **Providers** → Email:

- For quick testing, you can turn **Confirm email** off so login works immediately after register.
- For production, keep confirmation on; users verify email, then log in.

## 4. Site URL (production)

Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: add `http://localhost:3000/auth/callback` and your production callback URL.

## 5. Start the app

```bash
cp .env.local.example .env.local
# fill in keys, then:
npm run dev
```
