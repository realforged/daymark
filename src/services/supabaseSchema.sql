-- ====================================================================
-- DAYMARK — PRODUCTION SUPABASE POSTGRESQL SCHEMA WITH RLS
-- ====================================================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Holds user metadata and preferences)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  theme TEXT DEFAULT 'dark',
  sound_enabled BOOLEAN DEFAULT TRUE,
  streak_shields TEXT[] DEFAULT '{}',
  non_negotiables JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Journeys Table (Holds long-term countdown and goal)
CREATE TABLE IF NOT EXISTS public.journeys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  start_date DATE NOT NULL,
  deadline_date DATE NOT NULL,
  ideal_self_desc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own journeys" ON public.journeys;
CREATE POLICY "Users can view own journeys" 
  ON public.journeys FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journeys" ON public.journeys;
CREATE POLICY "Users can insert own journeys" 
  ON public.journeys FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journeys" ON public.journeys;
CREATE POLICY "Users can update own journeys" 
  ON public.journeys FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journeys" ON public.journeys;
CREATE POLICY "Users can delete own journeys" 
  ON public.journeys FOR DELETE 
  USING (auth.uid() = user_id);

-- 3. Habits Table (Definitions of daily recurring habits)
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT,
  category TEXT DEFAULT 'Deep Work',
  priority TEXT DEFAULT 'medium',
  frequency TEXT DEFAULT 'daily',
  active_days INT[] DEFAULT '{0,1,2,3,4,5,6}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own habits" ON public.habits;
CREATE POLICY "Users can manage own habits" 
  ON public.habits FOR ALL 
  USING (auth.uid() = user_id);

-- 4. Habit Completions (Tracks individual habit check-offs by date)
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id TEXT NOT NULL,
  date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, habit_id, date)
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own habit completions" ON public.habit_completions;
CREATE POLICY "Users can manage own habit completions" 
  ON public.habit_completions FOR ALL 
  USING (auth.uid() = user_id);

-- 5. Tasks Table (One-off and daily tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT,
  category TEXT DEFAULT 'Deep Work',
  priority TEXT DEFAULT 'medium',
  date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks" 
  ON public.tasks FOR ALL 
  USING (auth.uid() = user_id);

-- 6. Journal Entries Table (1 evening reflection per day per user)
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  accomplishments TEXT DEFAULT '',
  learnings TEXT DEFAULT '',
  improvements TEXT DEFAULT '',
  gratitude TEXT DEFAULT '',
  tomorrow_priority TEXT DEFAULT '',
  free_text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own journal entries" ON public.journal_entries;
CREATE POLICY "Users can manage own journal entries" 
  ON public.journal_entries FOR ALL 
  USING (auth.uid() = user_id);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON public.habit_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON public.journal_entries(user_id, date);
