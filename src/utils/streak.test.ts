import { test, expect } from 'vitest';
import { determineDayStatus, calculateStreakStats } from './streak';
import { DayHistorySummary } from '../types';

test('determineDayStatus classifies status correctly', () => {
  const today = '2026-10-30';

  expect(determineDayStatus('2026-11-01', today, 5, 0)).toBe('future');
  expect(determineDayStatus('2026-10-29', today, 0, 0)).toBe('empty');
  expect(determineDayStatus('2026-10-29', today, 5, 5)).toBe('full');
  expect(determineDayStatus('2026-10-29', today, 5, 3)).toBe('partial');
  expect(determineDayStatus('2026-10-29', today, 5, 0)).toBe('missed');
});

test('calculateStreakStats preserves active streak when today is still in progress', () => {
  const startDate = '2026-10-25';
  const today = '2026-10-28';

  const historyMap: Record<string, DayHistorySummary> = {
    '2026-10-25': {
      date: '2026-10-25',
      totalTasks: 4,
      completedTasks: 4,
      completionRate: 100,
      status: 'full',
      hasJournal: true,
      tasksCompleted: ['a', 'b', 'c', 'd'],
      tasksMissed: [],
    },
    '2026-10-26': {
      date: '2026-10-26',
      totalTasks: 3,
      completedTasks: 3,
      completionRate: 100,
      status: 'full',
      hasJournal: true,
      tasksCompleted: ['a', 'b', 'c'],
      tasksMissed: [],
    },
    '2026-10-27': {
      date: '2026-10-27',
      totalTasks: 5,
      completedTasks: 5,
      completionRate: 100,
      status: 'full',
      hasJournal: true,
      tasksCompleted: ['a', 'b', 'c', 'd', 'e'],
      tasksMissed: [],
    },
    '2026-10-28': {
      date: '2026-10-28',
      totalTasks: 5,
      completedTasks: 2,
      completionRate: 40,
      status: 'partial',
      hasJournal: false,
      tasksCompleted: ['a', 'b'],
      tasksMissed: ['c', 'd', 'e'],
    },
  };

  const stats = calculateStreakStats(historyMap, startDate, today);

  // Even though today is partial, streak from 25, 26, 27 is 3 days
  expect(stats.currentStreak).toBe(3);
  expect(stats.longestStreak).toBe(3);
  expect(stats.totalCompletedDays).toBe(3);
});

test('Streak Shield protects streak from a single missed day (Never Miss Twice)', () => {
  const startDate = '2026-10-25';
  const today = '2026-10-28';

  const historyMap: Record<string, DayHistorySummary> = {
    '2026-10-25': {
      date: '2026-10-25',
      totalTasks: 4,
      completedTasks: 4,
      completionRate: 100,
      status: 'full',
      hasJournal: true,
      tasksCompleted: ['a'],
      tasksMissed: [],
    },
    '2026-10-26': {
      date: '2026-10-26',
      totalTasks: 4,
      completedTasks: 0,
      completionRate: 0,
      status: 'missed',
      hasJournal: false,
      tasksCompleted: [],
      tasksMissed: ['a'],
    },
    '2026-10-27': {
      date: '2026-10-27',
      totalTasks: 4,
      completedTasks: 4,
      completionRate: 100,
      status: 'full',
      hasJournal: true,
      tasksCompleted: ['a'],
      tasksMissed: [],
    },
    '2026-10-28': {
      date: '2026-10-28',
      totalTasks: 4,
      completedTasks: 4,
      completionRate: 100,
      status: 'full',
      hasJournal: true,
      tasksCompleted: ['a'],
      tasksMissed: [],
    },
  };

  // Without shield: 2026-10-26 breaks the streak, so current streak would only be 2 (27, 28)
  const unshieldedStats = calculateStreakStats(historyMap, startDate, today, []);
  expect(unshieldedStats.currentStreak).toBe(2);

  // With shield on 2026-10-26: streak is protected across all 4 days!
  const shieldedStats = calculateStreakStats(historyMap, startDate, today, ['2026-10-26']);
  expect(shieldedStats.currentStreak).toBe(4);
  expect(shieldedStats.shieldsRemaining).toBe(1);
});

test('Never Miss Twice rule rejects consecutive shield days', () => {
  const startDate = '2026-10-25';
  const today = '2026-10-28';

  const historyMap: Record<string, DayHistorySummary> = {
    '2026-10-25': { date: '2026-10-25', totalTasks: 4, completedTasks: 4, completionRate: 100, status: 'full', hasJournal: true, tasksCompleted: ['a'], tasksMissed: [] },
    '2026-10-26': { date: '2026-10-26', totalTasks: 4, completedTasks: 0, completionRate: 0, status: 'missed', hasJournal: false, tasksCompleted: [], tasksMissed: ['a'] },
    '2026-10-27': { date: '2026-10-27', totalTasks: 4, completedTasks: 0, completionRate: 0, status: 'missed', hasJournal: false, tasksCompleted: [], tasksMissed: ['a'] },
    '2026-10-28': { date: '2026-10-28', totalTasks: 4, completedTasks: 4, completionRate: 100, status: 'full', hasJournal: true, tasksCompleted: ['a'], tasksMissed: [] },
  };

  // Attempting to shield both 26 and 27 consecutively: rule only allows 26, rejecting 27
  const stats = calculateStreakStats(historyMap, startDate, today, ['2026-10-26', '2026-10-27']);
  // 27 remains unshielded/missed, so current streak starting from 28 stops at 28
  expect(stats.currentStreak).toBe(1);
});

