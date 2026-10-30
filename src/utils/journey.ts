import { differenceInDays } from './date';
import { JourneyStats } from '../types';

/**
 * Calculates dynamic journey stats based on start date, deadline date, and today.
 * Follows exact formula where:
 * totalDays = diff(deadline, start) + 1
 * currentDay = diff(today, start) + 1
 * daysLeft = Math.max(0, totalDays - currentDay)
 * progress = Math.min(100, Math.max(0, (currentDay / totalDays) * 100))
 */
export function calculateJourneyStats(
  startDateStr: string,
  deadlineDateStr: string,
  todayStr: string
): JourneyStats {
  const diffStartToDeadline = differenceInDays(deadlineDateStr, startDateStr);
  const totalDays = Math.max(1, diffStartToDeadline + 1);

  const diffStartToToday = differenceInDays(todayStr, startDateStr);
  const rawCurrentDay = diffStartToToday + 1;
  const currentDay = Math.min(totalDays, Math.max(1, rawCurrentDay));

  const diffTodayToDeadline = differenceInDays(deadlineDateStr, todayStr);
  const daysLeft = Math.max(0, diffTodayToDeadline);

  const isCompleted = daysLeft === 0 || todayStr >= deadlineDateStr;
  const isOverdue = differenceInDays(todayStr, deadlineDateStr) > 0;

  // Calculate percentage: (currentDay / totalDays) * 100 rounded to 1 decimal place
  let progressPercentage = 0;
  if (totalDays > 0) {
    if (rawCurrentDay <= 0) {
      progressPercentage = 0;
    } else if (rawCurrentDay >= totalDays) {
      progressPercentage = 100;
    } else {
      progressPercentage = Number(((currentDay / totalDays) * 100).toFixed(1));
    }
  }

  return {
    totalDays,
    currentDay,
    daysLeft,
    progressPercentage,
    isCompleted,
    isOverdue,
  };
}

export function getMotivationalMessage(stats: JourneyStats, completedTodayCount: number, totalTodayCount: number): string {
  if (stats.isCompleted) {
    return 'Journey complete. Reflect on the mountain you just climbed.';
  }

  if (totalTodayCount > 0 && completedTodayCount === totalTodayCount) {
    return 'Flawless execution today. Rest well knowing you moved the needle.';
  }

  if (stats.progressPercentage >= 75) {
    return 'The final stretch. Stay relentlessly disciplined.';
  }

  if (stats.progressPercentage >= 50) {
    return 'Past halfway. Momentum is your greatest asset.';
  }

  if (stats.progressPercentage >= 25) {
    return 'Consistency compounding. Every tick builds the person you will become.';
  }

  return 'Win today. Do the essential work without hesitation.';
}
