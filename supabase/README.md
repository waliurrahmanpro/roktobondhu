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

## 2e. Donor requests & notifications (Phase 2)

Run **`005_donor_requests_notifications.sql`** for:

- `donor_requests` — receiver → donor blood requests (`pending` / `accepted` / `rejected`)
- `notifications` — in-app alerts (created by database triggers)
- RLS policies and security-definer triggers

Then run **`006_notification_titles.sql`** to align notification titles (New request received / Request accepted / Request rejected).

## 2f. Donation completion & points (Phase 3)

Run **`007_donation_completion_points.sql`** for:

- `donations` — completion records with feedback (`fine` / `reported`)
- `profiles.total_donations` — count of confirmed donations
- `donor_requests` statuses `completed` and `reported`
- `complete_donation()` RPC — points (+10), notifications, and atomic updates

(If you need the filename `006_donation_completion_points.sql`, use the same SQL as `007`; `006` is already used for notification titles.)

## 2h. Admin panel (Phase 5)

Run **`009_admin_panel.sql`** for moderation (`is_banned`, report status, blood request status).

## 2j. Location dataset & full address

Run **`011_location_dataset_and_full_address.sql`** to add `full_address` and public `bd_*` reference tables.

The cascading dropdown dataset lives in **`lib/data/bangladesh-locations.json`** (8 divisions, 64 districts, 494 upazilas). Regenerate after updating `bd-geodata`:

```bash
node scripts/generate-bangladesh-locations.mjs
```

## 2i. Super admin (Phase 6)

Run **`010_super_admin_system.sql`** for:

- `profiles.role` — `user` | `admin` | `super_admin` (replaces `admin_users`)
- `site_settings`, `announcements`, `point_transactions`, `audit_logs`
- Super-admin RPCs (roles, points, broadcast, settings)

Grant yourself super admin:

```sql
update public.profiles
set role = 'super_admin'
where user_id = 'your-user-uuid-here';
```

Regular admins:

```sql
update public.profiles set role = 'admin' where user_id = 'another-uuid';
```

## 2m. Super admin user control

Run **`017_super_admin_user_control.sql`** for:

- Super-admin RPCs: verify/unverify, ban/unban, donation ON/OFF, cooldown add/remove/set date
- Eligibility trigger bypass when super admins edit other users
- Audit log entries: User Verified, User Unverified, User Banned, etc.

Manage users at **`/super-admin/users/[user-id]`** (super_admin role only).

Full profile editing (personal info, location, verification, donation settings, points/donations) uses the same page form and writes audit logs: Profile Edited, Phone Changed, Blood Group Changed, Points Adjusted, Donations Adjusted, Verification Changed (each with old/new values and super admin ID in `details`).

## 2n. Blacklist, shadow ban, and user notes

Run **`018_blacklist_shadow_ban_notes.sql`** for:

- `profiles.is_blacklisted` — blocks login, blood requests, donor search, matching, and earning points
- `profiles.is_shadow_banned` — can log in; hidden from search, leaderboard, matching, and incoming donor requests
- `user_notes` — private staff notes (admins and super admins only)
- RPCs: `super_admin_set_user_blacklisted`, `super_admin_set_user_shadow_banned`, `admin_create_user_note`, `admin_update_user_note`, `admin_delete_user_note`
- Updated `is_eligible_donor_profile`, `complete_donation`, and `adjust_user_points` for blacklist rules

Audit logs: User Blacklisted, User Removed From Blacklist, User Shadow Banned, User Shadow Ban Removed, Note Added, Note Updated, Note Deleted.

## 2l. Unique phone per account

Run **`016_unique_phone.sql`** for:

- `normalize_profile_phone()` and unique index on normalized phone
- `is_phone_available()` RPC for registration and profile edit
- Signup trigger rejects duplicate phones

**Note:** If duplicates already exist in production, the unique index creation may fail until you resolve them using **Admin → Duplicate Accounts**.

## 2k. Blood request owner control (audit)

Run **`015_blood_request_audit.sql`** for:

- `log_blood_request_audit()` — owners and admins can log request edit/delete/complete/reopen events

## 2j. Smart matching & donation cooldown (Phase 7B)

Run **`014_matching_and_cooldown.sql`** for:

- `profiles.next_eligible_date` — 90 days after each confirmed donation
- Cooldown excludes donors from search, matching, and emergency notifications
- Updated match scoring (verified +30, points tier bonus, etc.)
- `complete_donation()` sets cooldown and turns availability off
- Notification copy: `Urgent {blood group} blood request near your area.`

## 2i. Identity verification & eligibility (Phase 7A)

Run **`013_identity_verification.sql`** for:

- `profiles.date_of_birth`, `nid_front_url`, `nid_back_url`, `verification_status`
- `nid-documents` storage bucket (private; admins can review)
- Age rules (17+ to donate / appear in search), eligibility trigger on profiles
- `review_identity_verification()` admin RPC + approve/reject notifications
- Updated `complete_donation()` and `process_blood_request_matching()` for verified eligible donors

**Password reset:** add `http://localhost:3000/auth/callback` and production callback URLs in Supabase Auth → URL Configuration.

## 2h. Smart matching & auto alerts (Phase 7)

Run **`012_smart_matching.sql`** for:

- `match_logs` — scored donor matches per blood request
- `blood_requests.division` / `upazila` and `notifications.blood_request_id`
- `process_blood_request_matching()` — scores donors, logs top matches, notifies top 10
- Trigger to update `accepted_at` / `donation_completed_at` on `match_logs` when related `donor_requests` complete

## 2g. Reported donations & trust (Phase 4)

Run **`008_reported_donations.sql`** for:

- `profiles.reported_donations` — count of reports against a donor (for trust badges)
- Trigger to increment when a `reported` donation is recorded

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
