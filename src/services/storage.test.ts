import { test, expect } from 'vitest';

// Mock minimal window and localStorage in test environment
const mockStorage: Record<string, string> = {};
global.window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  },
} as unknown as Window & typeof globalThis;

import { storage } from './storage';

test('completing a habit today does NOT mark it completed for tomorrow or yesterday', () => {
  const habitId = 'habit-test-1';
  const today = '2026-10-30';
  const tomorrow = '2026-10-31';
  const yesterday = '2026-10-29';

  // Initially not completed on any day
  expect(storage.isHabitCompleted(habitId, today)).toBe(false);
  expect(storage.isHabitCompleted(habitId, tomorrow)).toBe(false);

  // Complete for today
  storage.toggleHabitCompletion(habitId, today);

  // Today is completed
  expect(storage.isHabitCompleted(habitId, today)).toBe(true);
  // Tomorrow MUST remain NOT completed!
  expect(storage.isHabitCompleted(habitId, tomorrow)).toBe(false);
  // Yesterday MUST remain NOT completed!
  expect(storage.isHabitCompleted(habitId, yesterday)).toBe(false);

  // Toggle off today
  storage.toggleHabitCompletion(habitId, today);
  expect(storage.isHabitCompleted(habitId, today)).toBe(false);
});

test('reorderItems persists the new habit order in storage', () => {
  const habits = storage.getHabits();
  expect(habits.length).toBeGreaterThanOrEqual(2);

  const firstHabit = habits[0];
  const secondHabit = habits[1];

  // Invert the order
  const swapped = [secondHabit, firstHabit, ...habits.slice(2)];
  storage.reorderHabits(swapped);

  const reloaded = storage.getHabits();
  expect(reloaded[0].id).toBe(secondHabit.id);
  expect(reloaded[1].id).toBe(firstHabit.id);
});

