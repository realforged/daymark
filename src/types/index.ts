export type Priority = 'high' | 'medium' | 'low';

export type TaskCategory = 'Deep Work' | 'Fitness' | 'Mind & Learning' | 'Health & Rest' | 'Personal' | string;

export interface Journey {
  id: string;
  goal: string;
  startDate: string; // YYYY-MM-DD
  deadlineDate: string; // YYYY-MM-DD
  idealSelfDesc?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyStats {
  totalDays: number;
  currentDay: number;
  daysLeft: number;
  progressPercentage: number;
  isCompleted: boolean;
  isOverdue: boolean;
}


export interface Habit {
  id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  category: TaskCategory;
  priority: Priority;
  frequency: 'daily' | 'weekdays' | 'custom';
  activeDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  createdAt: string;
  isActive: boolean;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  accomplishments: string;
  learnings: string;
  improvements: string;
  gratitude: string;
  tomorrowPriority: string;
  freeText: string;
  updatedAt: string;
}

export type DayStatus = 'full' | 'partial' | 'missed' | 'empty' | 'future' | 'shielded';

export interface Task {
  id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  category: TaskCategory;
  priority: Priority;
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  completedAt?: string;
  order: number;
  createdAt: string;
  isHabitInstance?: boolean;
  habitId?: string;
  isNonNegotiable?: boolean;
}

export interface DayHistorySummary {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number; // 0 to 100
  status: DayStatus;
  hasJournal: boolean;
  tasksCompleted: string[];
  tasksMissed: string[];
  isShielded?: boolean;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  consistencyScore: number;
  topHabit: string;
  missedHabit: string;
  frictionReflection: string;
  adjustmentCommitment: string;
  completedAt: string;
}

export interface UserSettings {
  timezone: string;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  categories: string[];
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  isCloudSyncEnabled?: boolean;
  streakShieldsUsed?: string[]; // Array of YYYY-MM-DD
}
