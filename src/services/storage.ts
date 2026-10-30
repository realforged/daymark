import {
  Journey,
  Task,
  Habit,
  HabitCompletion,
  JournalEntry,
  DayHistorySummary,
  UserSettings,
  WeeklyReview,
} from '../types';
import { getTodayDateString, addDays, getDayOfWeekIndex, differenceInDays } from '../utils/date';
import { determineDayStatus } from '../utils/streak';

const STORAGE_KEYS = {
  JOURNEY: 'daymark_journey',
  HABITS: 'daymark_habits',
  HABIT_COMPLETIONS: 'daymark_habit_completions',
  TASKS: 'daymark_tasks',
  JOURNAL_ENTRIES: 'daymark_journal_entries',
  SETTINGS: 'daymark_settings',
  HAS_ONBOARDED: 'daymark_has_onboarded',
  NON_NEGOTIABLES: 'daymark_non_negotiables',
  STREAK_SHIELDS: 'daymark_streak_shields',
  WEEKLY_REVIEWS: 'daymark_weekly_reviews',
  DISMISSED_KICKOFFS: 'daymark_dismissed_kickoffs',
};

export const DEFAULT_CATEGORIES = [
  'Deep Work',
  'Fitness',
  'Mind & Learning',
  'Health & Rest',
  'Personal',
];

export const DEFAULT_SETTINGS: UserSettings = {
  timezone: 'Asia/Kolkata',
  theme: 'dark',
  soundEnabled: true,
  categories: DEFAULT_CATEGORIES,
};

export const DEFAULT_INITIAL_JOURNEY: Journey = {
  id: 'journey-default',
  goal: 'Full-Stack Mastery & Elite Physical Consistency',
  startDate: getTodayDateString('Asia/Kolkata'),
  deadlineDate: addDays(getTodayDateString('Asia/Kolkata'), 147),
  idealSelfDesc: 'A disciplined, intentional creator who never misses a day of deep work, physical training, and quiet evening reflection.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Python practice',
    durationMinutes: 90,
    category: 'Deep Work',
    priority: 'high',
    frequency: 'daily',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'habit-2',
    title: 'Running',
    durationMinutes: 30,
    category: 'Fitness',
    priority: 'high',
    frequency: 'daily',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'habit-3',
    title: 'Stretching & Mobility',
    durationMinutes: 15,
    category: 'Health & Rest',
    priority: 'medium',
    frequency: 'daily',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'habit-4',
    title: 'Read core literature',
    durationMinutes: 20,
    category: 'Mind & Learning',
    priority: 'medium',
    frequency: 'daily',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'habit-5',
    title: 'Sleep before 10:30 PM',
    durationMinutes: 0,
    category: 'Health & Rest',
    priority: 'high',
    frequency: 'daily',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

class StorageService {
  private getStorage(): Storage | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
    return null;
  }

  private get<T>(key: string, fallback: T): T {
    try {
      const storage = this.getStorage();
      if (!storage) return fallback;
      const data = storage.getItem(key);
      return data ? (JSON.parse(data) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota or disabled
    }
  }

  // --- Journey ---
  getJourney(): Journey | null {
    return this.get<Journey | null>(STORAGE_KEYS.JOURNEY, null);
  }

  saveJourney(journey: Journey): void {
    journey.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.JOURNEY, journey);
    this.set(STORAGE_KEYS.HAS_ONBOARDED, true);
  }

  hasOnboarded(): boolean {
    return this.get<boolean>(STORAGE_KEYS.HAS_ONBOARDED, false);
  }

  // --- Settings ---
  getSettings(): UserSettings {
    return this.get<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  saveSettings(settings: UserSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // --- Habits ---
  getHabits(): Habit[] {
    return this.get<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_INITIAL_HABITS);
  }

  saveHabits(habits: Habit[]): void {
    this.set(STORAGE_KEYS.HABITS, habits);
  }

  createHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
    const habits = this.getHabits();
    const newHabit: Habit = {
      ...habit,
      id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    habits.push(newHabit);
    this.saveHabits(habits);
    return newHabit;
  }

  updateHabit(habit: Habit): void {
    const habits = this.getHabits();
    const idx = habits.findIndex((h) => h.id === habit.id);
    if (idx !== -1) {
      habits[idx] = habit;
      this.saveHabits(habits);
    }
  }

  saveHabit(habit: Habit): void {
    const habits = this.getHabits();
    const idx = habits.findIndex((h) => h.id === habit.id);
    if (idx !== -1) {
      habits[idx] = habit;
    } else {
      habits.push(habit);
    }
    this.saveHabits(habits);
  }

  deleteHabit(id: string): void {
    const habits = this.getHabits().filter((h) => h.id !== id);
    this.saveHabits(habits);
  }

  // --- Habit Completions (ISOLATED PER DAY) ---
  getHabitCompletions(): HabitCompletion[] {
    return this.get<HabitCompletion[]>(STORAGE_KEYS.HABIT_COMPLETIONS, []);
  }

  isHabitCompleted(habitId: string, dateStr: string): boolean {
    const completions = this.getHabitCompletions();
    return completions.some((c) => c.habitId === habitId && c.date === dateStr);
  }

  toggleHabitCompletion(habitId: string, dateStr: string): boolean {
    let completions = this.getHabitCompletions();
    const exists = completions.some((c) => c.habitId === habitId && c.date === dateStr);

    if (exists) {
      completions = completions.filter((c) => !(c.habitId === habitId && c.date === dateStr));
      this.set(STORAGE_KEYS.HABIT_COMPLETIONS, completions);
      return false;
    } else {
      completions.push({
        id: `hc-${Date.now()}`,
        habitId,
        date: dateStr,
        completedAt: new Date().toISOString(),
      });
      this.set(STORAGE_KEYS.HABIT_COMPLETIONS, completions);
      return true;
    }
  }

  // --- Daily Custom Tasks ---
  getTasks(): Task[] {
    return this.get<Task[]>(STORAGE_KEYS.TASKS, []);
  }

  saveTasks(tasks: Task[]): void {
    this.set(STORAGE_KEYS.TASKS, tasks);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'order'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      order: tasks.length,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  updateTask(updatedTask: Task): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === updatedTask.id);
    if (idx !== -1) {
      tasks[idx] = updatedTask;
      this.saveTasks(tasks);
    }
  }

  saveTask(task: Task): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      tasks[idx] = task;
    } else {
      tasks.push(task);
    }
    this.saveTasks(tasks);
  }

  deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  }

  toggleTaskCompletion(id: string): boolean {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.isCompleted = !task.isCompleted;
      task.completedAt = task.isCompleted ? new Date().toISOString() : undefined;
      this.saveTasks(tasks);
      return task.isCompleted;
    }
    return false;
  }

  reorderHabits(reorderedHabits: Habit[]): void {
    this.saveHabits(reorderedHabits);
  }

  reorderItems(reorderedItems: Task[]): void {
    // 1. Reorder habits array based on the new sequence
    const currentHabits = this.getHabits();
    const habitIdsInOrder = reorderedItems
      .filter((t) => t.isHabitInstance && t.habitId)
      .map((t) => t.habitId as string);

    if (habitIdsInOrder.length > 0) {
      const reorderedHabits: Habit[] = [];
      habitIdsInOrder.forEach((id) => {
        const found = currentHabits.find((h) => h.id === id);
        if (found && !reorderedHabits.includes(found)) {
          reorderedHabits.push(found);
        }
      });
      // Append any habits that were not in today's active schedule
      currentHabits.forEach((h) => {
        if (!reorderedHabits.includes(h)) {
          reorderedHabits.push(h);
        }
      });
      this.saveHabits(reorderedHabits);
    }

    // 2. Update custom tasks order
    const customTasks = this.getTasks();
    reorderedItems.forEach((item, index) => {
      if (!item.isHabitInstance) {
        const task = customTasks.find((t) => t.id === item.id);
        if (task) {
          task.order = index;
        }
      }
    });
    this.saveTasks(customTasks);
  }

  // --- Non-Negotiable Priority ---
  getNonNegotiables(): Record<string, string> {
    return this.get<Record<string, string>>(STORAGE_KEYS.NON_NEGOTIABLES, {});
  }

  getNonNegotiableTaskId(dateStr: string): string | null {
    const map = this.getNonNegotiables();
    return map[dateStr] || null;
  }

  setNonNegotiableTaskId(dateStr: string, taskId: string | null): void {
    const map = this.getNonNegotiables();
    if (taskId) {
      map[dateStr] = taskId;
    } else {
      delete map[dateStr];
    }
    this.set(STORAGE_KEYS.NON_NEGOTIABLES, map);
  }

  // --- Streak Shields (Never Miss Twice) ---
  getStreakShields(): string[] {
    return this.get<string[]>(STORAGE_KEYS.STREAK_SHIELDS, []);
  }

  isDayShielded(dateStr: string): boolean {
    return this.getStreakShields().includes(dateStr);
  }

  useStreakShield(dateStr: string): boolean {
    const shields = this.getStreakShields();
    if (shields.includes(dateStr)) return false;
    const prevDay = addDays(dateStr, -1);
    if (shields.includes(prevDay)) {
      return false; // Never Miss Twice: cannot shield two consecutive days!
    }
    if (shields.length >= 2) {
      return false;
    }
    shields.push(dateStr);
    this.set(STORAGE_KEYS.STREAK_SHIELDS, shields);
    return true;
  }

  removeStreakShield(dateStr: string): void {
    const shields = this.getStreakShields().filter((d) => d !== dateStr);
    this.set(STORAGE_KEYS.STREAK_SHIELDS, shields);
  }

  toggleStreakShield(dateStr: string): string[] {
    if (this.isDayShielded(dateStr)) {
      this.removeStreakShield(dateStr);
    } else {
      this.useStreakShield(dateStr);
    }
    return this.getStreakShields();
  }

  // --- Morning Kickoff ---
  isKickoffDismissed(dateStr: string): boolean {
    const dismissed = this.get<string[]>(STORAGE_KEYS.DISMISSED_KICKOFFS, []);
    return dismissed.includes(dateStr);
  }

  dismissKickoff(dateStr: string): void {
    const dismissed = this.get<string[]>(STORAGE_KEYS.DISMISSED_KICKOFFS, []);
    if (!dismissed.includes(dateStr)) {
      dismissed.push(dateStr);
      this.set(STORAGE_KEYS.DISMISSED_KICKOFFS, dismissed);
    }
  }

  // --- Weekly Reviews ---
  getWeeklyReviews(): WeeklyReview[] {
    return this.get<WeeklyReview[]>(STORAGE_KEYS.WEEKLY_REVIEWS, []);
  }

  saveWeeklyReview(review: WeeklyReview): void {
    const reviews = this.getWeeklyReviews();
    const idx = reviews.findIndex((r) => r.weekStartDate === review.weekStartDate);
    if (idx !== -1) {
      reviews[idx] = review;
    } else {
      reviews.push(review);
    }
    this.set(STORAGE_KEYS.WEEKLY_REVIEWS, reviews);
  }

  // --- Combined Today's Unified Item List ---
  /**
   * Returns all items for a given date:
   * 1. Active Habits scheduled for that day of week (mapped with today's completion state)
   * 2. Custom one-off Tasks created for that date
   */
  getItemsForDate(dateStr: string): Task[] {
    const dayOfWeek = getDayOfWeekIndex(dateStr);
    const habits = this.getHabits().filter(
      (h) => h.isActive && h.activeDays.includes(dayOfWeek)
    );
    const customTasks = this.getTasks().filter((t) => t.date === dateStr);
    const nonNegotiableId = this.getNonNegotiableTaskId(dateStr);

    const habitTasks: Task[] = habits.map((h, i) => {
      const isCompleted = this.isHabitCompleted(h.id, dateStr);
      const instanceId = `habit-instance-${h.id}-${dateStr}`;
      const isNonNegotiable = instanceId === nonNegotiableId || h.id === nonNegotiableId;
      return {
        id: instanceId,
        title: h.title,
        description: h.description,
        durationMinutes: h.durationMinutes,
        category: h.category,
        priority: h.priority,
        date: dateStr,
        isCompleted,
        order: isNonNegotiable ? -1 : i, // Pin to top
        createdAt: h.createdAt,
        isHabitInstance: true,
        habitId: h.id,
        isNonNegotiable,
      };
    });

    const mappedCustomTasks: Task[] = customTasks.map((t) => ({
      ...t,
      isNonNegotiable: t.id === nonNegotiableId,
      order: t.id === nonNegotiableId ? -1 : t.order,
    }));

    return [...habitTasks, ...mappedCustomTasks].sort((a, b) => a.order - b.order);
  }

  // --- Journal Entries ---
  getJournalEntries(): JournalEntry[] {
    return this.get<JournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, []);
  }

  getJournalForDate(dateStr: string): JournalEntry | null {
    const entries = this.getJournalEntries();
    return entries.find((e) => e.date === dateStr) || null;
  }

  saveJournalEntry(entry: Omit<JournalEntry, 'id' | 'updatedAt'>): JournalEntry {
    const entries = this.getJournalEntries();
    const idx = entries.findIndex((e) => e.date === entry.date);
    const savedEntry: JournalEntry = {
      ...entry,
      id: idx !== -1 ? entries[idx].id : `journal-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    if (idx !== -1) {
      entries[idx] = savedEntry;
    } else {
      entries.push(savedEntry);
    }
    this.set(STORAGE_KEYS.JOURNAL_ENTRIES, entries);
    return savedEntry;
  }

  // --- History & Calendar Summaries ---
  getDayHistory(dateStr: string, todayStr: string): DayHistorySummary {
    const items = this.getItemsForDate(dateStr);
    const journal = this.getJournalForDate(dateStr);
    const totalTasks = items.length;
    const completedTasks = items.filter((i) => i.isCompleted).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const isShielded = this.isDayShielded(dateStr);
    const status = determineDayStatus(dateStr, todayStr, totalTasks, completedTasks, isShielded);

    const tasksCompleted = items.filter((i) => i.isCompleted).map((i) => i.title);
    const tasksMissed = items.filter((i) => !i.isCompleted).map((i) => i.title);

    const hasJournal = !!(
      journal &&
      (journal.accomplishments ||
        journal.learnings ||
        journal.improvements ||
        journal.gratitude ||
        journal.tomorrowPriority ||
        journal.freeText)
    );

    return {
      date: dateStr,
      totalTasks,
      completedTasks,
      completionRate,
      status,
      hasJournal,
      tasksCompleted,
      tasksMissed,
      isShielded,
    };
  }

  getAllHistorySummaries(startDateStr: string, todayStr: string): Record<string, DayHistorySummary> {
    const historyMap: Record<string, DayHistorySummary> = {};
    let curr = startDateStr;
    while (differenceInDays(todayStr, curr) >= 0) {
      historyMap[curr] = this.getDayHistory(curr, todayStr);
      curr = addDays(curr, 1);
    }
    return historyMap;
  }

  // --- Data Export & Seed ---
  exportAllData(): string {
    const data = {
      journey: this.getJourney(),
      habits: this.getHabits(),
      habitCompletions: this.getHabitCompletions(),
      tasks: this.getTasks(),
      journalEntries: this.getJournalEntries(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.journey) this.set(STORAGE_KEYS.JOURNEY, data.journey);
      if (data.habits) this.set(STORAGE_KEYS.HABITS, data.habits);
      if (data.habitCompletions) this.set(STORAGE_KEYS.HABIT_COMPLETIONS, data.habitCompletions);
      if (data.tasks) this.set(STORAGE_KEYS.TASKS, data.tasks);
      if (data.journalEntries) this.set(STORAGE_KEYS.JOURNAL_ENTRIES, data.journalEntries);
      if (data.settings) this.set(STORAGE_KEYS.SETTINGS, data.settings);
      this.set(STORAGE_KEYS.HAS_ONBOARDED, true);
      return true;
    } catch {
      return false;
    }
  }

  seedDemoData(todayStr: string): void {
    // 23 days into a 170-day journey to match user prompt vision
    const startDate = addDays(todayStr, -22); // Day 23 is today
    const deadlineDate = addDays(startDate, 169); // 170 days total

    const journey: Journey = {
      id: 'journey-seed',
      goal: 'Full-Stack Mastery & Elite Physical Consistency',
      startDate,
      deadlineDate,
      idealSelfDesc: 'A disciplined, intentional creator who never misses a day of deep work, physical training, and quiet evening reflection.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveJourney(journey);
    this.saveHabits(DEFAULT_INITIAL_HABITS);

    // Pre-populate some realistic past day completions for the calendar and streak
    const completions: HabitCompletion[] = [];
    const journals: JournalEntry[] = [];

    for (let i = 22; i >= 1; i--) {
      const date = addDays(todayStr, -i);
      // Give 90% full days for a great initial streak
      const completeAll = i % 5 !== 0;
      DEFAULT_INITIAL_HABITS.forEach((h) => {
        if (completeAll || h.priority === 'high') {
          completions.push({
            id: `seed-hc-${h.id}-${date}`,
            habitId: h.id,
            date,
            completedAt: new Date().toISOString(),
          });
        }
      });

      if (i <= 7) {
        journals.push({
          id: `seed-journal-${date}`,
          date,
          accomplishments: 'Completed 90m algorithmic practice and hit 5k running target.',
          learnings: 'Consistency beats intensity. Starting small dissolves resistance.',
          improvements: 'Avoid late afternoon caffeine to fall asleep earlier.',
          gratitude: 'Grateful for good health, clear focus, and steady progress.',
          tomorrowPriority: 'Ship Daymark architecture and finish test suite.',
          freeText: 'Felt great energy throughout the morning session.',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    this.set(STORAGE_KEYS.HABIT_COMPLETIONS, completions);
    this.set(STORAGE_KEYS.JOURNAL_ENTRIES, journals);
    this.set(STORAGE_KEYS.HAS_ONBOARDED, true);
  }
}

export const storage = new StorageService();
