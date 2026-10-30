import React, { useState } from 'react';
import { Target, Calendar, User, ArrowRight, Sparkles, Check, Clock } from 'lucide-react';
import { Journey } from '../types';
import { addDays, differenceInDays } from '../utils/date';
import { calculateJourneyStats } from '../utils/journey';

interface Props {
  isOpen: boolean;
  todayStr: string;
  initialJourney?: Journey | null;
  onComplete: (journey: Journey) => void;
  onClose?: () => void;
  isEditMode?: boolean;
}

export const OnboardingModal: React.FC<Props> = ({
  isOpen,
  todayStr,
  initialJourney,
  onComplete,
  onClose,
  isEditMode = false,
}) => {
  const [goal, setGoal] = useState(
    initialJourney?.goal || 'Full-Stack Mastery & Peak Physical Fitness'
  );
  const [startDate, setStartDate] = useState(initialJourney?.startDate || todayStr);
  const [deadlineDate, setDeadlineDate] = useState(
    initialJourney?.deadlineDate || addDays(todayStr, 147)
  );
  const [idealSelfDesc, setIdealSelfDesc] = useState(
    initialJourney?.idealSelfDesc ||
      'A disciplined, focused builder who executes every single day without excuses.'
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Live preview calculations
  const previewStats = calculateJourneyStats(startDate, deadlineDate, todayStr);

  const setPresetDeadline = (days: number) => {
    setDeadlineDate(addDays(startDate, days));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      setError('Please define your main journey goal.');
      return;
    }
    if (differenceInDays(deadlineDate, startDate) <= 0) {
      setError('Target deadline must be after the journey start date.');
      return;
    }

    const journey: Journey = {
      id: initialJourney?.id || `journey-${Date.now()}`,
      goal: goal.trim(),
      startDate,
      deadlineDate,
      idealSelfDesc: idealSelfDesc.trim() || undefined,
      createdAt: initialJourney?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onComplete(journey);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-[#141418] border border-white/10 p-6 sm:p-8 shadow-2xl text-left my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-2 pb-6 border-b border-white/5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DAYMARK • JOURNEY PROTOCOL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEditMode ? 'Adjust Journey Parameters' : 'Set Your Mountain'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            "Make every day count. Focus on today's actions. Track the bigger journey."
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* 1. Main Goal */}
          <div className="space-y-1.5">
            <label htmlFor="onboarding-goal" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>What is the main goal of this journey? *</span>
            </label>
            <input
              id="onboarding-goal"
              type="text"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Master Full-Stack & Run a Half-Marathon"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* 2. Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label htmlFor="onboarding-start" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Date</span>
              </label>
              <input
                id="onboarding-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A22] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Target Deadline */}
            <div className="space-y-1.5">
              <label htmlFor="onboarding-deadline" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Deadline *</span>
              </label>
              <input
                id="onboarding-deadline"
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A22] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quick Deadline Presets */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className="text-slate-500 text-[11px] whitespace-nowrap">Presets:</span>
            {[30, 90, 100, 147, 170, 365].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setPresetDeadline(days)}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors whitespace-nowrap"
              >
                +{days}d
              </button>
            ))}
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Dynamic Calculation:</span>
              <span className="text-emerald-400 font-semibold">{previewStats.progressPercentage}% completed</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-mono font-extrabold text-white">
                  {previewStats.daysLeft}
                </span>
                <span className="text-xs font-mono text-emerald-400 ml-1.5">DAYS REMAINING</span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                DAY {previewStats.currentDay} OF {previewStats.totalDays}
              </div>
            </div>
          </div>

          {/* 3. The person you want to become */}
          <div className="space-y-1.5">
            <label htmlFor="onboarding-desc" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Who do you want to become? (Optional)</span>
            </label>
            <textarea
              id="onboarding-desc"
              rows={2}
              value={idealSelfDesc}
              onChange={(e) => setIdealSelfDesc(e.target.value)}
              placeholder="e.g. A focused engineer and athlete who embraces discomfort and stays consistent."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
            {isEditMode && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono">
                Editable anytime in Settings
              </span>
            )}

            <button
              type="submit"
              className="px-6 py-3 text-xs sm:text-sm font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all flex items-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.4)] active:scale-95"
            >
              <span>{isEditMode ? 'Save Journey' : 'Lock in Deadline & Begin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
