# 🏠 Household Chores

A progressive web app (PWA) for two people to manage shared household chores. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Today tab** — personal checklist of your chores due today, tap to mark complete
- **Chores tab** — add, edit, and delete chores with daily, weekly, or monthly recurrence
- **Calendar tab** — monthly overview of all household chores, colour-coded by status
- **Settings tab** — manage your profile, view your invite code, and set notification preferences
- **Push notifications** — daily reminders at your chosen time via Web Push API
- **Real-time sync** — completions and chore changes sync instantly between devices via Supabase Realtime
- **Installable PWA** — add to home screen on Android and iOS for a native app experience

## Tech Stack

| Layer              | Technology                     |
| ------------------ | ------------------------------ |
| Framework          | Next.js 15 (App Router)        |
| Database           | Supabase (PostgreSQL)          |
| Auth               | Supabase Auth (email/password) |
| Realtime           | Supabase Realtime              |
| Styling            | Tailwind CSS                   |
| Icons              | Lucide React                   |
| Push notifications | Web Push API + VAPID           |
| Deployment         | Vercel                         |
| Cron jobs          | Vercel Cron                    |

## Database Schema

```
households        id, name, invite_code, created_by
profiles          id, user_id, household_id, name, colour, notify_time
chores            id, household_id, name, assigned_to, recurrence, day_of_week, day_of_month
completions       id, chore_id, completed_by, period_key, completed_at
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

Run the following SQL in your Supabase SQL Editor to create the required tables and RLS policies. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for the full SQL.

### 3. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

### 4. Configure environment variables

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

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

> Note: Push notifications and the service worker require a production build. To test locally run `npm run build && npm run start`.

## Household Setup

**Person 1:**

1. Sign up at `/signup`
2. Create a household — an 8-character invite code is generated automatically
3. Share the invite code with your partner

**Person 2:**

1. Sign up at `/signup`
2. Enter the invite code on the household screen to join

The invite code can always be found again in the **Settings tab**.

## Push Notifications

Notifications are sent via a Vercel Cron Job that runs every hour at `:00`. Each user sets their preferred reminder time in the Settings tab — the app converts it to UTC for storage and back to local time for display.

The cron job calls `/api/send-notifications` which:

1. Finds all profiles whose `notify_time` matches the current UTC hour
2. Fetches their chores due today
3. Sends a push notification via `web-push` signed with VAPID keys

### iOS Note

Push notifications on iOS require the app to be **added to the Home Screen** first (Safari 16.4+). Standard browser tabs on iOS do not support Web Push.

## Deployment

### Deploy to Vercel

```bash
# Push to GitHub first
git add .
git commit -m "Initial commit"
git push origin main
```

Then in Vercel:

1. Import your GitHub repository
2. Add all environment variables from `.env.local`
3. Deploy

The `vercel.json` cron job configuration is included in the repository and will be picked up automatically.

### Environment Variables on Vercel

Add all variables from your `.env.local` to **Vercel → Project → Settings → Environment Variables**.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── send-notifications/
│   │       └── route.ts        # Cron job endpoint
│   ├── household/
│   │   └── page.tsx            # Create/join household
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx                # Home (redirects to correct tab)
├── components/
│   ├── AppShell.tsx            # Tab container + navigation
│   ├── CalendarTab.tsx         # Monthly calendar view
│   ├── ChoresTab.tsx           # Chores CRUD list
│   ├── ChoreSheet.tsx          # Add/edit chore bottom sheet
│   ├── TodayTab.tsx            # Personal daily checklist
│   ├── SettingsTab.tsx         # Profile, invite code, notifications
│   └── ServiceWorkerRegistration.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client
│   ├── period.ts               # Period key + date helpers
│   ├── types.ts                # TypeScript types
│   └── usePushNotifications.ts # Push subscription hook
├── middleware.ts               # Auth + household redirect guards
public/
├── sw.js                       # Service worker
├── manifest.json               # PWA manifest
├── icon-192.png
└── icon-512.png
vercel.json                     # Cron job schedule
```

## Recurrence Logic

Chores use a `period_key` string to track completions per cycle, enabling automatic resets:

| Recurrence | Period key format | Example      |
| ---------- | ----------------- | ------------ |
| Daily      | `YYYY-MM-DD`      | `2026-03-10` |
| Weekly     | `YYYY-Www`        | `2026-W10`   |
| Monthly    | `YYYY-MM`         | `2026-03`    |
