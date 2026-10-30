# DAYMARK — Discipline Engine & Daily Execution Tracker

> **"Focus on today's actions. Track the bigger journey."**

DAYMARK is an offline-first, high-performance personal self-improvement Progressive Web App (PWA) built for daily habits, strict deadline countdowns, evening reflections, and streak protection.

---

## Architecture Overview

DAYMARK is engineered with a modern, serverless cloud architecture designed for zero latency, offline resilience, and high security:

- **Frontend & PWA:** Built with [React 19](https://react.dev/), [Vite](https://vite.dev/), [Tailwind CSS 4](https://tailwindcss.com/), and [Lucide Icons](https://lucide.dev/).
- **PWA Service Worker:** Powered by `vite-plugin-pwa` with Workbox caching, offline support, install banners, and responsive layouts for Android and iOS.
- **Database & Auth:** [Supabase](https://supabase.com/) PostgreSQL database with Row Level Security (RLS), auto-trigger user profiles, and session persistence.
- **Deployment Platform:** [Vercel](https://vercel.com/) with global edge CDN routing and headers configured in `vercel.json`.
- **Source Control:** GitHub with automated CI/CD continuous deployment to Vercel on push.

---

## Features

1. **Journey Countdown & Hero:** Real-time deadline calculation, day counters, milestone pacing, and progress percentage.
2. **Daily Habits & Single-Day Completions:** Check-offs are strictly isolated per day; completing a habit today never marks tomorrow or yesterday completed.
3. **#1 Non-Negotiable Item:** Pin your most critical task or habit of the day with high visual priority.
4. **Never Miss Twice (Streak Shields):** Up to 2 emergency shields to protect streaks from unavoidable emergencies, enforcing the rule that two consecutive days can never be shielded.
5. **Night Journal & Reflection:** 5 guided prompts (accomplishments, learnings, improvements, gratitude, tomorrow's priority) and free-form notes with autosave.
6. **Morning Kickoff Banner:** Automatically inherits the top priority defined during last night's journal reflection.
7. **Offline-First & Cloud Sync:** 100% functional without an internet connection. When signed in to Supabase, data synchronizes to the cloud with PostgreSQL RLS security.
8. **Installable PWA:** Add to Android or iOS home screens with standalone display mode and custom icons.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
- [npm](https://www.npmjs.com/) (version 9 or higher)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/hvhvhvm/daymark.git
cd daymark
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Supabase credentials:

```env
# Supabase Project URL
VITE_SUPABASE_URL="https://your-project-id.supabase.co"

# Supabase Anon Public Key (Safe for browser / client)
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

> **Security Note:** Never expose the `SUPABASE_SERVICE_ROLE_KEY` in frontend code or client-facing environment variables. Only the public `anon` key should be used.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Quality Assurance

DAYMARK includes automated testing for all core deadline algorithms, streak calculations, and storage invariants:

```bash
# Run unit test suite (Vitest)
npm test

# Run TypeScript type-checking
npm run lint

# Test production build
npm run build
```

---

## Supabase Database Setup & Migrations

To connect your Supabase database:

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Open `src/services/supabaseSchema.sql` from this repository, copy its entire contents, paste it into the SQL Editor, and click **Run**.

### Schema Summary:
- **`public.profiles`**: Stores timezone, theme, sound settings, and streak shields.
- **`public.journeys`**: Stores start date, deadline date, goal, and ideal self vision.
- **`public.habits`**: Stores recurring habit definitions, categories, and active days.
- **`public.habit_completions`**: Records check-offs with a `UNIQUE(user_id, habit_id, date)` constraint.
- **`public.tasks`**: Individual tasks for specific calendar dates.
- **`public.journal_entries`**: Daily reflections with a `UNIQUE(user_id, date)` constraint.
- **Row Level Security (RLS):** Enabled on every table. Users can only read, write, update, and delete their own records (`auth.uid() = user_id`).
- **Auth Trigger:** An automated `AFTER INSERT ON auth.users` trigger automatically provisions a matching profile row in `public.profiles`.

---

## Vercel Deployment Instructions

### Method A: Deploy via GitHub & Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete DAYMARK production build"
   git remote add origin https://github.com/<your-username>/daymark.git
   git branch -M main
   git push -u origin main
   ```

2. **Import into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository (`daymark`).
   - Framework Preset: **Vite** (auto-detected).
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Configure Environment Variables in Vercel:**
   Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-anon-public-key`
   - Apply to both **Production** and **Preview** environments.

4. **Deploy:**
   - Click **Deploy**. Vercel will build and assign your production URL (e.g., `https://daymark-app.vercel.app`).

### Method B: Deploy via Vercel CLI

```bash
# 1. Log in to Vercel CLI
vercel login

# 2. Deploy to preview
vercel

# 3. Deploy to production
vercel --prod
```

---

## PWA & Android Installation

1. Open your production URL in Chrome on an Android phone.
2. Tap the **Install App** button in the header or sidebar, or tap the Chrome three-dot menu and select **"Install app"** / **"Add to Home screen"**.
3. Launch DAYMARK from your home screen for full-screen, offline-enabled experience.

---

## Project Structure

```
daymark/
├── public/                 # Static assets & PWA icons (192x192, 512x512, maskable)
│   ├── icon.svg
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── pwa-maskable-512x512.png
├── src/
│   ├── components/         # UI components & modals
│   │   ├── AuthModal.tsx           # Supabase Auth & Cloud Sync Modal
│   │   ├── DeadlineHero.tsx        # Journey countdown hero
│   │   ├── JournalSection.tsx      # Night reflection section
│   │   ├── Navigation.tsx          # Mobile bottom bar & Desktop sidebar
│   │   ├── ProgressDashboard.tsx   # Monthly calendar & streak shields
│   │   ├── PWAInstallButton.tsx    # Install trigger & guide modal
│   │   └── TaskList.tsx            # Daily habits & non-negotiables
│   ├── hooks/              # Custom hooks (PWA install, online status)
│   ├── services/           # Data & storage services
│   │   ├── storage.ts              # LocalStorage cache & invariants
│   │   ├── supabaseClient.ts       # Supabase client & auth helpers
│   │   ├── supabaseSchema.sql      # PostgreSQL schema with RLS
│   │   └── supabaseSync.ts         # Bidirectional sync service
│   ├── types/              # TypeScript interface definitions
│   └── utils/              # Date, journey, and streak calculations
├── vercel.json             # Vercel SPA routing and cache headers
├── vite.config.ts          # Vite configuration & PWA manifest
└── package.json            # Dependencies and npm scripts
```

---

## License

MIT © 2026 DAYMARK
