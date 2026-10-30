import { differenceInDays, addDays } from './date';
import { DayHistorySummary, DayStatus, Habit } from '../types';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  weeklyCompletionRate: number;
  shieldsRemaining: number;
  shieldedDates: string[];
}

export function determineDayStatus(
  dateStr: string,
  todayStr: string,
  totalTasks: number,
  completedTasks: number,
  isShielded: boolean = false
): DayStatus {
  if (differenceInDays(dateStr, todayStr) > 0) {
    return 'future';
  }
  if (isShielded) {
    return 'shielded';
  }
  if (totalTasks === 0) {
    return 'empty';
  }
  if (completedTasks === totalTasks && totalTasks > 0) {
    return 'full';
  }
  if (completedTasks > 0) {
    return 'partial';
  }
  return 'missed';
}

export function calculateStreakStats(
  historyMap: Record<string, DayHistorySummary>,
  startDateStr: string,
  todayStr: string,
  shieldedDates: string[] = []
): StreakStats {
  const dates: string[] = [];
  let curr = startDateStr;
  while (differenceInDays(todayStr, curr) >= 0) {
    dates.push(curr);
    curr = addDays(curr, 1);
  }

  // Filter valid shielded dates: Never Miss Twice!
  // Cannot shield two consecutive days.
  const validShieldedDates: string[] = [];
  const sortedShields = [...shieldedDates].sort();
  for (const sDate of sortedShields) {
    const prevDay = addDays(sDate, -1);
    if (!validShieldedDates.includes(prevDay)) {
      validShieldedDates.push(sDate);
    }
  }

  let totalCompletedDays = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate longest streak and total completed days chronologically
  for (const d of dates) {
    const summary = historyMap[d];
    const isShield = validShieldedDates.includes(d);
    const isDayCompleted = summary && (summary.status === 'full' || summary.status === 'shielded' || isShield);

    if (isDayCompleted) {
      if (summary && summary.status === 'full') {
        totalCompletedDays++;
      }
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      // If it's today and not yet finished, don't break historic longest streak unless day is over
      if (d !== todayStr) {
        tempStreak = 0;
      }
    }
  }

  // Calculate current streak backwards from today
  const todaySummary = historyMap[todayStr];
  const isTodayComplete = todaySummary && todaySummary.status === 'full';

  // If today is complete, start count from today.
  // If today is not yet complete (day still active), start checking from yesterday so user doesn't lose streak mid-day!
  let checkDate = isTodayComplete ? todayStr : addDays(todayStr, -1);
  if (isTodayComplete) {
    currentStreak = 1;
    checkDate = addDays(todayStr, -1);
  }

  while (differenceInDays(checkDate, startDateStr) >= 0) {
    const summary = historyMap[checkDate];
    const isShield = validShieldedDates.includes(checkDate);
    const isMaintained = summary && (summary.status === 'full' || summary.status === 'shielded' || isShield);

    if (isMaintained) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    } else {
      break;
    }
  }

  // Calculate weekly completion rate (last 7 days up to today)
  let last7TotalTasks = 0;
  let last7CompletedTasks = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(todayStr, -i);
    const summary = historyMap[d];
    if (summary) {
      last7TotalTasks += summary.totalTasks;
      last7CompletedTasks += summary.completedTasks;
    }
  }

  const weeklyCompletionRate =
    last7TotalTasks > 0
      ? Math.round((last7CompletedTasks / last7TotalTasks) * 100)
      : 0;

  const totalShieldsAllowed = 2;
  const shieldsRemaining = Math.max(0, totalShieldsAllowed - validShieldedDates.length);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCompletedDays,
    weeklyCompletionRate,
    shieldsRemaining,
    shieldedDates: validShieldedDates,
  };
}

export function calculateWeeklyHabitBreakdown(
  historyMap: Record<string, DayHistorySummary>,
  habits: Habit[],
  todayStr: string
): { topHabit: string; missedHabit: string; weekConsistencyScore: number } {
  const habitCompletionCounts: Record<string, number> = {};
  const habitScheduledCounts: Record<string, number> = {};

  habits.forEach((h) => {
    habitCompletionCounts[h.title] = 0;
    habitScheduledCounts[h.title] = 0;
  });

  for (let i = 0; i < 7; i++) {
    const d = addDays(todayStr, -i);
    const summary = historyMap[d];
    if (summary) {
      summary.tasksCompleted.forEach((title) => {
        if (habitCompletionCounts[title] !== undefined) {
          habitCompletionCounts[title]++;
        }
      });
      habits.forEach((h) => {
        habitScheduledCounts[h.title] = (habitScheduledCounts[h.title] || 0) + 1;
      });
    }
  }

  let topHabit = 'None yet';
  let bestRate = -1;
  let missedHabit = 'None';
  let worstRate = 999;

  habits.forEach((h) => {
    const scheduled = habitScheduledCounts[h.title] || 7;
    const completed = habitCompletionCounts[h.title] || 0;
    const rate = scheduled > 0 ? (completed / scheduled) * 100 : 0;

    if (rate > bestRate) {
      bestRate = rate;
      topHabit = `${h.title} (${completed}/${scheduled} days)`;
    }
    if (rate < worstRate) {
      worstRate = rate;
      missedHabit = `${h.title} (${scheduled - completed} missed)`;
    }
  });

  return {
    topHabit,
    missedHabit,
    weekConsistencyScore: bestRate >= 0 ? Math.round(bestRate) : 0,
  };
}
