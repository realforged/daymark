import React, { useState } from 'react';
import { X, Award, CheckCircle, TrendingUp, AlertTriangle, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { WeeklyReview, Habit, DayHistorySummary } from '../types';
import { addDays, formatDateLabel } from '../utils/date';
import { calculateWeeklyHabitBreakdown } from '../utils/streak';
import { storage } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  todayStr: string;
  habits: Habit[];
  historyMap: Record<string, DayHistorySummary>;
}

export const WeeklyReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  todayStr,
  habits,
  historyMap,
}) => {
  const weekStartDate = addDays(todayStr, -6);
  const weekEndDate = todayStr;

  const breakdown = calculateWeeklyHabitBreakdown(historyMap, habits, todayStr);

  const existingReviews = storage.getWeeklyReviews();
  const currentWeekReview = existingReviews.find(
    (r) => r.weekStartDate === weekStartDate
  );

  const [friction, setFriction] = useState(currentWeekReview?.frictionReflection || '');
  const [adjustment, setAdjustment] = useState(currentWeekReview?.adjustmentCommitment || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const review: WeeklyReview = {
      id: currentWeekReview?.id || `review-${Date.now()}`,
      weekStartDate,
      weekEndDate,
      consistencyScore: breakdown.weekConsistencyScore,
      topHabit: breakdown.topHabit,
      missedHabit: breakdown.missedHabit,
      frictionReflection: friction.trim(),
      adjustmentCommitment: adjustment.trim(),
      completedAt: new Date().toISOString(),
    };

    storage.saveWeeklyReview(review);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-[#141418] border border-white/10 p-6 sm:p-7 shadow-2xl text-left my-8 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                WEEKLY DISCIPLINE RETROSPECTIVE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                Past 7 Days
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mt-1">
              Weekly Discipline Audit
            </h3>
            <p className="text-xs text-slate-400">
              {formatDateLabel(weekStartDate)} — {formatDateLabel(weekEndDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Weekly Review"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Consistency Score
            </span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {breakdown.weekConsistencyScore}%
            </div>
            <span className="text-[10px] text-slate-500">Execution rate</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 uppercase">
              <Award className="w-3 h-3" />
              Top Habit
            </span>
            <div className="text-xs font-semibold text-white line-clamp-2">
              {breakdown.topHabit}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 uppercase">
              <AlertTriangle className="w-3 h-3" />
              Growth Area
            </span>
            <div className="text-xs font-semibold text-white line-clamp-2">
              {breakdown.missedHabit}
            </div>
          </div>
        </div>

        {/* The 2-Question Sunday Retrospective */}
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <label className="text-xs font-semibold text-white block">
              1. What caused friction or distraction this week?
            </label>
            <textarea
              rows={2}
              value={friction}
              onChange={(e) => setFriction(e.target.value)}
              placeholder="e.g., Late nights ruined early morning deep work. Phone scrolling after lunch."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <label className="text-xs font-semibold text-white block">
              2. What is my single adjustment for next week?
            </label>
            <textarea
              rows={2}
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="e.g., Phone charged in hallway by 10:00 PM. 90m Python completed before checking any messages."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Past Reviews Archive Preview */}
          {existingReviews.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-mono text-slate-500">
                Previous Audits ({existingReviews.length})
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1.5">
                {existingReviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-xl bg-white/5 text-xs flex items-center justify-between"
                  >
                    <span className="font-mono text-slate-400">
                      {r.weekStartDate} — {r.weekEndDate}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {r.consistencyScore}% Score
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">
              Discipline = Continuous Calibration
            </span>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Audit Saved!' : 'Complete Weekly Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
