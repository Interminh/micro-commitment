# Micro-Commitment

**Commit publicly. Fail publicly.**

A social accountability app for friend groups. Everyone sets their own daily
goals, checks in once a day, and the whole group can see who's keeping their
streak and who isn't. No private tracking, no hiding a bad week: visibility
is the whole point.

## How it works

- Create a group and invite friends with a link, no approval step needed.
- Each person sets their own goals inside the group (as many as they want),
  each with its own day-of-week schedule.
- Check in once a day: done or missed. Miss a scheduled day without checking
  in and it gets marked missed automatically overnight.
- Everyone in the group sees a GitHub-style calendar heatmap of your history,
  plus a live streak count per goal.
- Leave or delete a group whenever you want; the person who created it can
  delete it for everyone, anyone else can just leave.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com): Postgres, Auth (Google sign-in), Row Level
  Security
- Deployed on [Vercel](https://vercel.com)

## Project structure

```
app/                  routes (App Router)
  goals/new/          create a goal
  group/[groupId]/    the main group view: heatmaps, member list, check-ins
  join/[inviteCode]/  invite link landing page
  onboarding/         create or join your first group
components/           UI components
lib/                  server actions, Supabase clients, shared helpers
supabase/
  migrations/         SQL migrations, run these in order against a fresh project
  functions/          the missed-day cron (Supabase Edge Function)
```

## Running it locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a project at [supabase.com](https://supabase.com).

3. Run every file in `supabase/migrations/` against it, in order, from the
   SQL editor in your Supabase dashboard. (Or `supabase db push` if you've
   got the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to
   the project.)

4. Turn on Google sign-in under **Authentication → Providers** in the
   Supabase dashboard. You'll need an OAuth client from the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   add `http://localhost:3000/auth/callback` as an authorized redirect URI
   there, along with the callback URL Supabase shows you on that same
   provider settings page.

5. Copy the env file and fill in your project's URL and anon key, both
   under **Project Settings → API** in Supabase:

   ```bash
   cp .env.local.example .env.local
   ```

6. Start the dev server:

   ```bash
   npm run dev
   ```

## Deploying

The app deploys to Vercel with no special configuration beyond setting the
same two environment variables from `.env.local` in the Vercel project
settings. Once you've got a production URL, add two more things:

- `https://your-app.vercel.app/auth/callback` as another authorized redirect
  URI on the Google OAuth client
- `https://your-app.vercel.app/**` under **Redirect URLs** in Supabase's
  Authentication → URL Configuration, and update **Site URL** there too,
  otherwise Supabase falls back to redirecting through `localhost`

### The missed-day job

`supabase/functions/close-missed-days` is what actually marks a missed day
as missed. It's not required for local development, but without deploying
and scheduling it, missed days just never get recorded. Deploy it with the
Supabase CLI and set it to run hourly:

```bash
supabase functions deploy close-missed-days
supabase functions schedule close-missed-days --cron "0 * * * *"
```
