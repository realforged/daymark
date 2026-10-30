import { getSupabaseClient, getCurrentUser } from './supabaseClient';
import { storage } from './storage';
import { Journey, Habit, HabitCompletion, Task, JournalEntry, UserSettings } from '../types';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

class SupabaseSyncService {
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private currentStatus: SyncStatus = {
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
  };

  private notify(update: Partial<SyncStatus>) {
    this.currentStatus = { ...this.currentStatus, ...update };
    this.syncListeners.forEach((l) => l(this.currentStatus));
  }

  onSyncStatusChange(listener: (status: SyncStatus) => void) {
    this.syncListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  // Pulls all remote cloud data for the user and hydrates local storage
  async pullFromCloud(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    this.notify({ isSyncing: true, error: null });

    try {
      // 1. Fetch Journey
      const { data: journeyData, error: journeyErr } = await client
        .from('journeys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (journeyErr) throw journeyErr;

      if (journeyData) {
        const journey: Journey = {
          id: journeyData.id,
          goal: journeyData.goal,
          startDate: journeyData.start_date,
          deadlineDate: journeyData.deadline_date,
          idealSelfDesc: journeyData.ideal_self_desc || undefined,
          createdAt: journeyData.created_at,
          updatedAt: journeyData.updated_at,
        };
        storage.saveJourney(journey);
      }

      // 2. Fetch Habits
      const { data: habitsData, error: habitsErr } = await client
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (habitsErr) throw habitsErr;

      if (habitsData && habitsData.length > 0) {
        const habits: Habit[] = habitsData.map((h) => ({
          id: h.id,
          title: h.title,
          description: h.description || undefined,
          durationMinutes: h.duration_minutes || undefined,
          category: h.category,
          priority: h.priority,
          frequency: h.frequency || 'daily',
          activeDays: h.active_days || [0, 1, 2, 3, 4, 5, 6],
          createdAt: h.created_at,
          isActive: h.is_active !== false,
        }));
        storage.saveHabits(habits);
      }

      // 3. Fetch Habit Completions
      const { data: hcData, error: hcErr } = await client
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id);

      if (hcErr) throw hcErr;

      if (hcData) {
        const completions: HabitCompletion[] = hcData.map((c) => ({
          id: c.id,
          habitId: c.habit_id,
          date: c.date,
          completedAt: c.completed_at,
        }));
        // Merge with existing completions or replace
        const existing = storage.getHabitCompletions();
        const mergedMap = new Map<string, HabitCompletion>();
        existing.forEach((e) => mergedMap.set(`${e.habitId}_${e.date}`, e));
        completions.forEach((c) => mergedMap.set(`${c.habitId}_${c.date}`, c));
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('daymark_habit_completions', JSON.stringify(Array.from(mergedMap.values())));
        }
      }

      // 4. Fetch Tasks
      const { data: tasksData, error: tasksErr } = await client
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (tasksErr) throw tasksErr;

      if (tasksData && tasksData.length > 0) {
        const tasks: Task[] = tasksData.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          durationMinutes: t.duration_minutes || undefined,
          category: t.category,
          priority: t.priority,
          date: t.date,
          isCompleted: t.is_completed,
          completedAt: t.completed_at || undefined,
          order: t.order_index ?? 0,
          createdAt: t.created_at,
        }));
        storage.saveTasks(tasks);
      }

      // 5. Fetch Journal Entries
      const { data: journalData, error: journalErr } = await client
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id);

      if (journalErr) throw journalErr;

      if (journalData && journalData.length > 0) {
        journalData.forEach((j) => {
          const entry: JournalEntry = {
            id: j.id,
            date: j.date,
            accomplishments: j.accomplishments || '',
            learnings: j.learnings || '',
            improvements: j.improvements || '',
            gratitude: j.gratitude || '',
            tomorrowPriority: j.tomorrow_priority || '',
            freeText: j.free_text || '',
            updatedAt: j.updated_at,
          };
          storage.saveJournalEntry(entry);
        });
      }

      // 6. Fetch Profile Settings
      const { data: profileData } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        const currentSettings = storage.getSettings();
        const updatedSettings: UserSettings = {
          ...currentSettings,
          timezone: profileData.timezone || currentSettings.timezone,
          theme: profileData.theme || currentSettings.theme,
          soundEnabled: profileData.sound_enabled ?? currentSettings.soundEnabled,
          isCloudSyncEnabled: true,
        };
        storage.saveSettings(updatedSettings);

        if (profileData.streak_shields && Array.isArray(profileData.streak_shields)) {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('daymark_streak_shields', JSON.stringify(profileData.streak_shields));
          }
        }
      }

      const now = new Date().toISOString();
      this.notify({ isSyncing: false, lastSyncedAt: now, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cloud synchronization failed';
      this.notify({ isSyncing: false, error: msg });
      return false;
    }
  }

  // Pushes existing local data to cloud (ideal after signup/login)
  async pushToCloud(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    this.notify({ isSyncing: true, error: null });

    try {
      // 1. Sync Profile
      const settings = storage.getSettings();
      const streakShields = storage.getStreakShields();
      await client.from('profiles').upsert({
        id: user.id,
        email: user.email,
        timezone: settings.timezone,
        theme: settings.theme,
        sound_enabled: settings.soundEnabled,
        streak_shields: streakShields,
        updated_at: new Date().toISOString(),
      });

      // 2. Sync Journey
      const journey = storage.getJourney();
      if (journey) {
        await client.from('journeys').upsert({
          id: journey.id,
          user_id: user.id,
          goal: journey.goal,
          start_date: journey.startDate,
          deadline_date: journey.deadlineDate,
          ideal_self_desc: journey.idealSelfDesc || null,
          updated_at: new Date().toISOString(),
        });
      }

      // 3. Sync Habits
      const habits = storage.getHabits();
      if (habits.length > 0) {
        const habitRows = habits.map((h) => ({
          id: h.id,
          user_id: user.id,
          title: h.title,
          description: h.description || null,
          duration_minutes: h.durationMinutes || null,
          category: h.category,
          priority: h.priority,
          frequency: h.frequency,
          active_days: h.activeDays,
          is_active: h.isActive,
          created_at: h.createdAt,
        }));
        await client.from('habits').upsert(habitRows);
      }

      // 4. Sync Habit Completions
      const completions = storage.getHabitCompletions();
      if (completions.length > 0) {
        const compRows = completions.map((c) => ({
          id: c.id,
          user_id: user.id,
          habit_id: c.habitId,
          date: c.date,
          completed_at: c.completedAt,
        }));
        await client.from('habit_completions').upsert(compRows, { onConflict: 'user_id,habit_id,date' });
      }

      // 5. Sync Tasks
      const tasks = storage.getTasks();
      if (tasks.length > 0) {
        const taskRows = tasks.map((t) => ({
          id: t.id,
          user_id: user.id,
          title: t.title,
          description: t.description || null,
          duration_minutes: t.durationMinutes || null,
          category: t.category,
          priority: t.priority,
          date: t.date,
          is_completed: t.isCompleted,
          completed_at: t.completedAt || null,
          order_index: t.order,
          created_at: t.createdAt,
        }));
        await client.from('tasks').upsert(taskRows);
      }

      // 6. Sync Journal Entries
      const journals = storage.getJournalEntries();
      if (journals.length > 0) {
        const journalRows = journals.map((j) => ({
          id: j.id,
          user_id: user.id,
          date: j.date,
          accomplishments: j.accomplishments,
          learnings: j.learnings,
          improvements: j.improvements,
          gratitude: j.gratitude,
          tomorrow_priority: j.tomorrowPriority,
          free_text: j.freeText,
          updated_at: j.updatedAt,
        }));
        await client.from('journal_entries').upsert(journalRows, { onConflict: 'user_id,date' });
      }

      const now = new Date().toISOString();
      this.notify({ isSyncing: false, lastSyncedAt: now, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cloud push failed';
      this.notify({ isSyncing: false, error: msg });
      return false;
    }
  }

  // Real-time Mutation Handlers
  async saveJourney(journey: Journey): Promise<void> {
    storage.saveJourney(journey);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return;

    try {
      await client.from('journeys').upsert({
        id: journey.id,
        user_id: user.id,
        goal: journey.goal,
        start_date: journey.startDate,
        deadline_date: journey.deadlineDate,
        ideal_self_desc: journey.idealSelfDesc || null,
        updated_at: new Date().toISOString(),
      });
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback already in storage
    }
  }

  async saveHabit(habit: Habit): Promise<void> {
    storage.saveHabit(habit);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return;

    try {
      await client.from('habits').upsert({
        id: habit.id,
        user_id: user.id,
        title: habit.title,
        description: habit.description || null,
        duration_minutes: habit.durationMinutes || null,
        category: habit.category,
        priority: habit.priority,
        frequency: habit.frequency,
        active_days: habit.activeDays,
        is_active: habit.isActive,
        created_at: habit.createdAt,
      });
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }
  }

  async deleteHabit(habitId: string): Promise<void> {
    storage.deleteHabit(habitId);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return;

    try {
      await client.from('habits').delete().eq('id', habitId).eq('user_id', user.id);
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }
  }

  async toggleHabitCompletion(habitId: string, dateStr: string): Promise<boolean> {
    const isCompletedNow = storage.toggleHabitCompletion(habitId, dateStr);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return isCompletedNow;

    try {
      if (isCompletedNow) {
        await client.from('habit_completions').upsert({
          id: `hc-${habitId}-${dateStr}`,
          user_id: user.id,
          habit_id: habitId,
          date: dateStr,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,habit_id,date' });
      } else {
        await client
          .from('habit_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('habit_id', habitId)
          .eq('date', dateStr);
      }
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }

    return isCompletedNow;
  }

  async saveTask(task: Task): Promise<void> {
    storage.saveTask(task);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return;

    try {
      await client.from('tasks').upsert({
        id: task.id,
        user_id: user.id,
        title: task.title,
        description: task.description || null,
        duration_minutes: task.durationMinutes || null,
        category: task.category,
        priority: task.priority,
        date: task.date,
        is_completed: task.isCompleted,
        completed_at: task.completedAt || null,
        order_index: task.order,
        created_at: task.createdAt,
      });
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    storage.deleteTask(taskId);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return;

    try {
      await client.from('tasks').delete().eq('id', taskId).eq('user_id', user.id);
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }
  }

  async toggleTaskCompletion(taskId: string): Promise<boolean> {
    const isCompleted = storage.toggleTaskCompletion(taskId);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return isCompleted;

    try {
      await client
        .from('tasks')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .eq('user_id', user.id);
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }

    return isCompleted;
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    storage.saveJournalEntry(entry);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return;

    try {
      await client.from('journal_entries').upsert({
        id: entry.id,
        user_id: user.id,
        date: entry.date,
        accomplishments: entry.accomplishments,
        learnings: entry.learnings,
        improvements: entry.improvements,
        gratitude: entry.gratitude,
        tomorrow_priority: entry.tomorrowPriority,
        free_text: entry.freeText,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' });
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    storage.saveSettings(settings);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return;

    try {
      await client.from('profiles').upsert({
        id: user.id,
        timezone: settings.timezone,
        theme: settings.theme,
        sound_enabled: settings.soundEnabled,
        updated_at: new Date().toISOString(),
      });
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }
  }

  async toggleStreakShield(dateStr: string): Promise<string[]> {
    const shields = storage.toggleStreakShield(dateStr);
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return shields;

    try {
      await client.from('profiles').update({
        streak_shields: shields,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch {
      // Offline fallback
    }

    return shields;
  }
}

export const supabaseSync = new SupabaseSyncService();
