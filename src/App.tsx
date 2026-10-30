import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckSquare,
  Flame,
  WifiOff,
  Sparkles,
  Settings as SettingsIcon,
  BookOpen,
  Cloud,
  Loader2,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

import {
  Journey,
  Task,
  Habit,
  UserSettings,
  Priority,
  TaskCategory,
} from './types';
import { getTodayDateString, formatDateLabel, addDays } from './utils/date';
import { calculateJourneyStats } from './utils/journey';
import { calculateStreakStats } from './utils/streak';
import { playTickSound } from './utils/sound';
import { storage, DEFAULT_INITIAL_JOURNEY } from './services/storage';
import { getCurrentUser, subscribeToAuthChanges } from './services/supabaseClient';
import { supabaseSync, SyncStatus } from './services/supabaseSync';
import { useOnlineStatus } from './hooks/useOnlineStatus';

import { Navigation, NavTab } from './components/Navigation';
import { DeadlineHero } from './components/DeadlineHero';
import { TodayProgress } from './components/TodayProgress';
import { TaskList } from './components/TaskList';
import { TaskModal } from './components/TaskModal';
import { JournalReminder } from './components/JournalReminder';
import { JournalSection } from './components/JournalSection';
import { ProgressDashboard } from './components/ProgressDashboard';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { MorningKickoffBanner } from './components/MorningKickoffBanner';
import { WeeklyReviewModal } from './components/WeeklyReviewModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const isOnline = useOnlineStatus();

  // Settings & Timezone
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const todayStr = useMemo(() => getTodayDateString(settings.timezone), [settings.timezone]);

  // Journey state
  const [journey, setJourney] = useState<Journey>(() => {
    const existing = storage.getJourney();
    if (existing) return existing;
    return DEFAULT_INITIAL_JOURNEY;
  });

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => storage.hasOnboarded());

  // Habits & Daily Items
  const [habits, setHabits] = useState<Habit[]>(() => storage.getHabits());
  const [todayTasks, setTodayTasks] = useState<Task[]>(() => storage.getItemsForDate(todayStr));

  // Navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('today');

  // Supabase Auth & Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => supabaseSync.getStatus());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | Habit | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isEditJourneyOpen, setIsEditJourneyOpen] = useState(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);

  // Morning Kickoff state
  const [kickoffDismissedLocal, setKickoffDismissedLocal] = useState<boolean>(() =>
    storage.isKickoffDismissed(todayStr)
  );

  // Journal date redirect helper
  const [journalDirectDate, setJournalDirectDate] = useState<string>(todayStr);

  // Reload items helper
  const refreshItems = useCallback(() => {
    const existingJourney = storage.getJourney();
    if (existingJourney) setJourney(existingJourney);
    setTodayTasks(storage.getItemsForDate(todayStr));
    setHabits(storage.getHabits());
    setSettings(storage.getSettings());
  }, [todayStr]);

  // Auth & Cloud Sync Listener
  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        supabaseSync.pullFromCloud().then(() => refreshItems());
      }
    });

    const { unsubscribe } = subscribeToAuthChanges((_event, session) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        supabaseSync.pullFromCloud().then(() => refreshItems());
      }
    });

    const unsubSync = supabaseSync.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    return () => {
      unsubscribe();
      unsubSync();
    };
  }, [refreshItems]);

  // If user hasn't onboarded yet on initial run, prompt onboarding
  useEffect(() => {
    if (!hasOnboarded) {
      setIsOnboardingOpen(true);
    }
  }, [hasOnboarded]);

  // Recalculate stats dynamically
  const journeyStats = useMemo(() => {
    return calculateJourneyStats(journey.startDate, journey.deadlineDate, todayStr);
  }, [journey.startDate, journey.deadlineDate, todayStr]);

  // Streak & History
  const historyMap = useMemo(() => {
    return storage.getAllHistorySummaries(journey.startDate, todayStr);
  }, [journey.startDate, todayStr, todayTasks]);

  const streakShields = storage.getStreakShields();
  const streakStats = useMemo(() => {
    return calculateStreakStats(historyMap, journey.startDate, todayStr, streakShields);
  }, [historyMap, journey.startDate, todayStr, streakShields]);

  // Today counts
  const completedTodayCount = todayTasks.filter((t) => t.isCompleted).length;
  const totalTodayCount = todayTasks.length;
  const pendingTasksCount = todayTasks.filter((t) => !t.isCompleted).length;

  // Morning Kickoff extraction from yesterday's journal
  const yesterdayStr = useMemo(() => addDays(todayStr, -1), [todayStr]);
  const yesterdayJournal = storage.getJournalForDate(yesterdayStr);
  const kickoffPriority = yesterdayJournal?.tomorrowPriority?.trim() || '';

  const currentPinnedId = storage.getNonNegotiableTaskId(todayStr);
  const isAlreadyNonNegotiable = !!(
    currentPinnedId && todayTasks.some((t) => t.isNonNegotiable)
  );

  const todayJournal = storage.getJournalForDate(todayStr);
  const hasReflectedToday = !!(
    todayJournal &&
    (todayJournal.accomplishments ||
      todayJournal.learnings ||
      todayJournal.improvements ||
      todayJournal.gratitude ||
      todayJournal.tomorrowPriority ||
      todayJournal.freeText)
  );

  // Non-negotiable toggle handler (#1 non negotiable)
  const handleToggleNonNegotiable = (task: Task) => {
    playTickSound(settings.soundEnabled);
    const targetId = task.isHabitInstance && task.habitId ? task.habitId : task.id;
    if (currentPinnedId === targetId || currentPinnedId === task.id) {
      storage.setNonNegotiableTaskId(todayStr, null);
    } else {
      storage.setNonNegotiableTaskId(todayStr, targetId);
    }
    refreshItems();
  };

  // Morning Kickoff locking
  const handleSetKickoffAsNonNegotiable = () => {
    if (!kickoffPriority) return;
    playTickSound(settings.soundEnabled);

    // Look for matching task/habit
    const matchingTask = todayTasks.find(
      (t) =>
        t.title.toLowerCase().includes(kickoffPriority.toLowerCase()) ||
        kickoffPriority.toLowerCase().includes(t.title.toLowerCase())
    );

    if (matchingTask) {
      const targetId =
        matchingTask.isHabitInstance && matchingTask.habitId
          ? matchingTask.habitId
          : matchingTask.id;
      storage.setNonNegotiableTaskId(todayStr, targetId);
    } else {
      // Create new task and pin it as #1 non-negotiable
      const newTask = storage.createTask({
        title: kickoffPriority,
        category: 'Deep Work',
        priority: 'high',
        date: todayStr,
        isCompleted: false,
      });
      storage.setNonNegotiableTaskId(todayStr, newTask.id);
    }

    storage.dismissKickoff(todayStr);
    setKickoffDismissedLocal(true);
    refreshItems();
  };

  const handleDismissKickoff = () => {
    storage.dismissKickoff(todayStr);
    setKickoffDismissedLocal(true);
  };

  // Checkbox toggle handler
  const handleToggleTask = async (task: Task) => {
    playTickSound(settings.soundEnabled);
    if (task.isHabitInstance && task.habitId) {
      // Toggle isolated for today's date only!
      await supabaseSync.toggleHabitCompletion(task.habitId, todayStr);
    } else {
      // One-off task toggle
      await supabaseSync.toggleTaskCompletion(task.id);
    }
    refreshItems();
  };

  // Add / Edit Task or Habit
  const handleSaveTask = async (data: {
    title: string;
    description?: string;
    durationMinutes?: number;
    category: TaskCategory;
    priority: Priority;
    isHabit: boolean;
    activeDays: number[];
  }) => {
    if (editingTask) {
      if ('isHabitInstance' in editingTask && editingTask.isHabitInstance && editingTask.habitId) {
        // Updating existing habit
        const existingHabit = habits.find((h) => h.id === editingTask.habitId);
        if (existingHabit) {
          await supabaseSync.saveHabit({
            ...existingHabit,
            title: data.title,
            description: data.description,
            durationMinutes: data.durationMinutes,
            category: data.category,
            priority: data.priority,
            activeDays: data.activeDays,
          });
        }
      } else if ('frequency' in editingTask) {
        // Direct Habit update
        await supabaseSync.saveHabit({
          ...editingTask,
          title: data.title,
          description: data.description,
          durationMinutes: data.durationMinutes,
          category: data.category,
          priority: data.priority,
          activeDays: data.activeDays,
        });
      } else {
        // Updating one-off task
        await supabaseSync.saveTask({
          ...(editingTask as Task),
          title: data.title,
          description: data.description,
          durationMinutes: data.durationMinutes,
          category: data.category,
          priority: data.priority,
        });
      }
    } else {
      // Creating new item
      if (data.isHabit) {
        const newHabit: Habit = {
          id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: data.title,
          description: data.description,
          durationMinutes: data.durationMinutes,
          category: data.category,
          priority: data.priority,
          frequency: data.activeDays.length === 7 ? 'daily' : 'custom',
          activeDays: data.activeDays,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        await supabaseSync.saveHabit(newHabit);
      } else {
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: data.title,
          description: data.description,
          durationMinutes: data.durationMinutes,
          category: data.category,
          priority: data.priority,
          date: todayStr,
          isCompleted: false,
          order: todayTasks.length,
          createdAt: new Date().toISOString(),
        };
        await supabaseSync.saveTask(newTask);
      }
    }

    setEditingTask(null);
    refreshItems();
  };

  // Delete Task / Habit
  const handleDeleteTask = async (task: Task) => {
    if (confirm(`Remove "${task.title}"?`)) {
      if (task.isHabitInstance && task.habitId) {
        await supabaseSync.deleteHabit(task.habitId);
      } else {
        await supabaseSync.deleteTask(task.id);
      }
      refreshItems();
    }
  };

  const handleReorderTasks = (reordered: Task[]) => {
    setTodayTasks(reordered);
    storage.reorderItems(reordered);
    setHabits(storage.getHabits());
  };

  // Onboarding completion
  const handleCompleteOnboarding = async (newJourney: Journey) => {
    await supabaseSync.saveJourney(newJourney);
    setJourney(newJourney);
    setHasOnboarded(true);
    setIsOnboardingOpen(false);
    setIsEditJourneyOpen(false);
  };

  // Open journal for specific historical date
  const handleOpenJournalForDate = (dateStr: string) => {
    setJournalDirectDate(dateStr);
    setActiveTab('journal');
  };

  // Settings updates
  const handleUpdateSettings = async (updated: UserSettings) => {
    await supabaseSync.saveSettings(updated);
    setSettings(updated);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to clear all personal records and reset DAYMARK?')) {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
      window.location.reload();
    }
  };

  const handleLoadSeedData = () => {
    storage.seedDemoData(todayStr);
    const newJourney = storage.getJourney();
    if (newJourney) setJourney(newJourney);
    setHabits(storage.getHabits());
    setTodayTasks(storage.getItemsForDate(todayStr));
    setKickoffDismissedLocal(false);
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-black">
      {/* Offline banner if disconnected */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur text-black px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode active — Local changes are saved securely on your device.</span>
        </div>
      )}

      {/* Navigation (Mobile Bottom Bar + Desktop Sidebar) */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        pendingTasksCount={pendingTasksCount}
        streakCount={streakStats.currentStreak}
        currentUser={currentUser}
        isSyncing={syncStatus.isSyncing}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-12 px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 max-w-4xl mx-auto w-full">
        {/* Top Header on Mobile */}
        <header className="md:hidden flex items-center justify-between py-3 mb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold font-mono tracking-wider text-white">DAYMARK</h1>
              <p className="text-[10px] font-mono text-emerald-400">{formatDateLabel(todayStr)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              aria-label="Cloud Sync & Account"
              className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-colors ${
                currentUser
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {syncStatus.isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
            </button>
            <PWAInstallButton variant="compact" />
            <button
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Open Settings"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* VIEW 1: TODAY (The core focus screen) */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            {/* A. Deadline Hero Section */}
            <DeadlineHero
              journey={journey}
              stats={journeyStats}
              completedTodayCount={completedTodayCount}
              totalTodayCount={totalTodayCount}
              streakCount={streakStats.currentStreak}
              onEditJourney={() => setIsEditJourneyOpen(true)}
            />

            {/* B. Today's Progress */}
            <TodayProgress
              completedCount={completedTodayCount}
              totalCount={totalTodayCount}
            />

            {/* Morning Kickoff Commitment Banner (from last night's prompt #5) */}
            {kickoffPriority && !kickoffDismissedLocal && (
              <MorningKickoffBanner
                priorityText={kickoffPriority}
                isAlreadyNonNegotiable={isAlreadyNonNegotiable}
                onSetAsNonNegotiable={handleSetKickoffAsNonNegotiable}
                onDismiss={handleDismissKickoff}
              />
            )}

            {/* C. Today's Tasks & Habits (with #1 Non-Negotiable starring & reordering) */}
            <TaskList
              tasks={todayTasks}
              categories={settings.categories}
              soundEnabled={settings.soundEnabled}
              onToggleTask={handleToggleTask}
              onToggleNonNegotiable={handleToggleNonNegotiable}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onReorderTasks={handleReorderTasks}
              onOpenAddModal={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />

            {/* D. End-of-Day Journal Reminder */}
            <JournalReminder
              hasReflectedToday={hasReflectedToday}
              onOpenJournal={() => setActiveTab('journal')}
            />
          </div>
        )}

        {/* VIEW 2: PROGRESS (Analytics & Monthly Calendar & Streak Shields & Audit) */}
        {activeTab === 'progress' && (
          <ProgressDashboard
            journey={journey}
            stats={journeyStats}
            todayStr={todayStr}
            habits={habits}
            onOpenJournalForDate={handleOpenJournalForDate}
            onOpenWeeklyReview={() => setIsWeeklyReviewOpen(true)}
          />
        )}

        {/* VIEW 3: JOURNAL (5 Prompts & Free Reflection) */}
        {activeTab === 'journal' && (
          <JournalSection todayStr={journalDirectDate || todayStr} />
        )}
      </main>

      {/* MODALS */}

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        categories={settings.categories}
        initialItem={editingTask}
        onSaveTask={handleSaveTask}
        onAddCategory={(cat) => {
          if (!settings.categories.includes(cat)) {
            handleUpdateSettings({
              ...settings,
              categories: [...settings.categories, cat],
            });
          }
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        journey={journey}
        habits={habits}
        onUpdateSettings={handleUpdateSettings}
        onEditJourney={() => {
          setIsSettingsOpen(false);
          setIsEditJourneyOpen(true);
        }}
        onEditHabit={(habit) => {
          setEditingTask(habit);
          setIsSettingsOpen(false);
          setIsTaskModalOpen(true);
        }}
        onDeleteHabit={(id) => {
          if (confirm('Delete this recurring habit?')) {
            storage.deleteHabit(id);
            refreshItems();
          }
        }}
        onReorderHabits={(reordered) => {
          storage.reorderHabits(reordered);
          setHabits(reordered);
          refreshItems();
        }}
        onOpenNewHabit={() => {
          setEditingTask(null);
          setIsSettingsOpen(false);
          setIsTaskModalOpen(true);
        }}
        onResetData={handleResetData}
        onLoadSeedData={handleLoadSeedData}
      />

      {/* Weekly Discipline Audit Retrospective Modal */}
      <WeeklyReviewModal
        isOpen={isWeeklyReviewOpen}
        onClose={() => setIsWeeklyReviewOpen(false)}
        todayStr={todayStr}
        habits={habits}
        historyMap={historyMap}
      />

      {/* First-launch Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        todayStr={todayStr}
        initialJourney={journey}
        onComplete={handleCompleteOnboarding}
      />

      {/* Edit Journey Modal */}
      <OnboardingModal
        isOpen={isEditJourneyOpen}
        todayStr={todayStr}
        initialJourney={journey}
        onComplete={handleCompleteOnboarding}
        onClose={() => setIsEditJourneyOpen(false)}
        isEditMode={true}
      />

      {/* Supabase Authentication & Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => {
          setCurrentUser(user);
          refreshItems();
        }}
        onSyncComplete={() => {
          refreshItems();
        }}
      />
    </div>
  );
}
