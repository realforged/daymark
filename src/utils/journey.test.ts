import { test, expect } from 'vitest';
import { calculateJourneyStats } from './journey';

test('matches user journey example: 170 days total, Day 23, 147 days left, 13.5% progress', () => {
  // Let's create dates where totalDays = 170 and currentDay = 23
  // Start: 2026-01-01
  // Today: 2026-01-23 (day 23)
  // Deadline: 2026-06-19 (169 days after 2026-01-01 = 170 days total)
  const startDate = '2026-01-01';
  const todayDate = '2026-01-23';
  const deadlineDate = '2026-06-19';

  const stats = calculateJourneyStats(startDate, deadlineDate, todayDate);

  expect(stats.totalDays).toBe(170);
  expect(stats.currentDay).toBe(23);
  expect(stats.daysLeft).toBe(147);
  expect(stats.progressPercentage).toBe(13.5);
  expect(stats.isCompleted).toBe(false);
});

test('handles day 1 of journey correctly', () => {
  const startDate = '2026-10-30';
  const todayDate = '2026-10-30';
  const deadlineDate = '2026-11-29'; // 31 days total

  const stats = calculateJourneyStats(startDate, deadlineDate, todayDate);

  expect(stats.currentDay).toBe(1);
  expect(stats.totalDays).toBe(31);
  expect(stats.daysLeft).toBe(30);
  expect(stats.isCompleted).toBe(false);
});

test('handles final deadline day correctly', () => {
  const startDate = '2026-10-01';
  const todayDate = '2026-10-31';
  const deadlineDate = '2026-10-31';

  const stats = calculateJourneyStats(startDate, deadlineDate, todayDate);

  expect(stats.totalDays).toBe(31);
  expect(stats.currentDay).toBe(31);
  expect(stats.daysLeft).toBe(0);
  expect(stats.isCompleted).toBe(true);
  expect(stats.progressPercentage).toBe(100);
});
