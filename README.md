# Micro-Commitment

**Commit publicly. Fail publicly.**

A social accountability app for friend groups — daily micro-commitments, public
check-ins, streaks, and miss visibility.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) — Postgres, Auth (Google OAuth), Row Level
  Security

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com).

3. Run the schema migration against it: open the SQL editor in your Supabase
   project dashboard and run the contents of
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   (Or, with the [Supabase CLI](https://supabase.com/docs/guides/cli) linked
   to your project: `supabase db push`.)

4. Enable the Google provider under **Authentication → Providers** in the
   Supabase dashboard, using OAuth credentials from the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   Add `http://localhost:3000/auth/callback` (and your production URL, once
   deployed) as an authorized redirect URI on the Google OAuth client, and
   set the Supabase-provided callback URL as the redirect URI Supabase asks
   for.

5. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and anon key (**Project Settings → API**):

   ```bash
   cp .env.local.example .env.local
   ```

6. Run the dev server:

   ```bash
   npm run dev
   ```

## Deploying the daily missed-day job (optional for local dev)

`supabase/functions/close-missed-days` marks any commitment with no check-in
for the day as missed and resets its streak. Deploy it with the Supabase CLI
and schedule it on a daily cron once you're ready to rely on it (see the
comment at the top of that file for the exact commands).
