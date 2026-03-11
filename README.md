# 🏠 Household Chores

A progressive web app (PWA) for two people to manage shared household chores. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Today tab** — personal checklist of your chores due today, tap to mark complete
- **Chores tab** — add, edit, and delete chores with daily, weekly, or monthly recurrence
- **Calendar tab** — monthly overview of all household chores, colour-coded by status
- **Settings tab** — manage your profile, view your invite code, and toggle notifications
- **Push notifications** — daily morning reminders via Web Push API (Vercel Cron)
- **Real-time sync** — completions and chore changes sync instantly between devices via Supabase Realtime
- **Installable PWA** — add to home screen on Android and iOS for a native app experience

## Tech Stack

| Layer              | Technology                                          |
| ------------------ | --------------------------------------------------- |
| Framework          | Next.js 15 (App Router)                             |
| Database           | Supabase (PostgreSQL)                               |
| Auth               | Supabase Auth (email/password + email verification) |
| Realtime           | Supabase Realtime                                   |
| Styling            | Tailwind CSS                                        |
| Icons              | Lucide React                                        |
| Push notifications | Web Push API + VAPID                                |
| Deployment         | Vercel                                              |
| Cron jobs          | Vercel Cron (Hobby plan — once daily)               |

## Database Schema

```
households          id, name, invite_code, created_by
profiles            id, user_id, household_id, name, colour
chores              id, household_id, name, assigned_to, recurrence, day_of_week, day_of_month
completions         id, chore_id, completed_by, period_key, completed_at
push_subscriptions  id, user_id, profile_id, subscription
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Vercel account (for deployment and cron jobs)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/household-chores.git
cd household-chores
npm install
```

### 2. Set up Supabase

Run the SQL in your Supabase SQL Editor to create the required tables, RLS policies, and the `get_my_household_id()` security definer function. See the Database Schema section above for the full table structure.

Enable **Row Level Security** on all tables and enable **Realtime** on the `chores` and `completions` tables.

### 3. Enable email verification

In **Supabase → Authentication → Providers → Email**, toggle **"Confirm email"** to ON. This ensures users must verify their email address before accessing the app.

### 4. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

### 5. Configure environment variables

Create a `.env.local` file in the root of the project:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_MAILTO=mailto:your@email.com

# Cron job protection
CRON_SECRET=any_long_random_string
```

### 6. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

> Note: Push notifications and the service worker require a production build. To test locally run `npm run build && npm run start`.

## User Flow

### Sign up

1. Go to `/signup` — enter your name, email, password, and pick a colour
2. Check your email for a verification link and click it
3. Sign in at `/login`
4. On first login, your profile is created automatically
5. Create a new household — an 8-character invite code is generated
6. Share the invite code with your partner

### Your partner joins

1. Goes to `/signup` and creates their account
2. Verifies their email and signs in
3. Enters your invite code on the household screen to join

The invite code can always be found again in the **Settings tab**.

## Push Notifications

Notifications are sent via a **Vercel Cron Job** that runs once daily at midnight UTC (8am SGT). All subscribed users with chores due that day receive a push notification.

> **Vercel Hobby plan limitation:** Cron jobs are limited to once per day. Per-person custom notification times are not supported on the free tier. All users are notified at the same fixed daily time.

The cron job calls `/api/send-notifications` which:

1. Fetches all profiles that belong to a household
2. Checks which chores are due today for each profile
3. Sends a push notification via `web-push` signed with VAPID keys to each subscribed user with chores due

### iOS Note

Push notifications on iOS require the app to be **added to the Home Screen** first (Safari 16.4+). Standard browser tabs on iOS do not support Web Push.

## Deployment

### Deploy to Vercel

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

Then in Vercel:

1. Import your GitHub repository
2. Add all environment variables from `.env.local`
3. Deploy

The `vercel.json` cron job configuration is included in the repository and will be picked up automatically.

### Add your Vercel URL to Supabase

In **Supabase → Authentication → URL Configuration**:

- **Site URL** → `https://your-app.vercel.app`
- **Redirect URLs** → `https://your-app.vercel.app/**`

This ensures email verification links redirect back to your app correctly.

## Installing on your phone

**Android (Chrome):**

1. Open your Vercel URL in Chrome
2. Tap the install banner or browser menu → **Add to Home Screen**
3. Open the installed app → Settings tab → turn on notifications

**iOS (Safari):**

1. Open your Vercel URL in Safari
2. Tap the Share button → **Add to Home Screen**
3. Open the installed app from the home screen icon
4. Go to Settings tab → turn on notifications

> On iOS, always open the app from the home screen icon — not from Safari — for push notifications to work.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── send-notifications/
│   │       └── route.ts            # Cron job endpoint
│   ├── complete-profile/
│   │   └── page.tsx                # Creates profile after email verification
│   ├── household/
│   │   └── page.tsx                # Create/join household
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx                    # Home (redirects based on auth state)
├── components/
│   ├── AppShell.tsx                # Tab container + navigation
│   ├── CalendarTab.tsx             # Monthly calendar view
│   ├── ChoresTab.tsx               # Chores CRUD list
│   ├── ChoreSheet.tsx              # Add/edit chore bottom sheet
│   ├── TodayTab.tsx                # Personal daily checklist
│   ├── SettingsTab.tsx             # Profile, invite code, notifications
│   └── ServiceWorkerRegistration.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   ├── period.ts                   # Period key + date helpers
│   ├── types.ts                    # TypeScript types
│   └── usePushNotifications.ts     # Push subscription hook
├── middleware.ts                   # Auth + household redirect guards
public/
├── sw.js                           # Service worker
├── manifest.json                   # PWA manifest
├── apple-touch-icon.png            # iOS home screen icon (512x512)
└── icon-512.png                    # PWA icon
vercel.json                         # Cron job schedule (0 0 * * *)
```

## Recurrence Logic

Chores use a `period_key` string to track completions per cycle, enabling automatic resets each period:

| Recurrence   | Period key format | Example      |
| ------------ | ----------------- | ------------ |
| Daily        | `YYYY-MM-DD`      | `2026-03-10` |
| Weekly       | `YYYY-Www`        | `2026-W10`   |
| Monthly      | `YYYY-MM`         | `2026-03`    |
| Biweekly     | `YYYY-Www`        | `2026-W10`   |
| Twice Weekly | `YYYY-MM`         | `2026-W10`   |

A new period = a fresh slate. No manual resets needed.

## Timezone

All dates are handled in local time on the client. The `getPeriodKey` helper uses `date.getFullYear()`, `date.getMonth()`, and `date.getDate()` directly rather than `toISOString()` to avoid UTC conversion issues for users in non-UTC timezones.

The cron job runs in UTC. The notification time is fixed at midnight UTC (`0 0 * * *`) which corresponds to 8am SGT (UTC+8).
