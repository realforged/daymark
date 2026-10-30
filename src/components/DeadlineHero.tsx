import React from 'react';
import { Calendar, Target, Edit3, Flame, Clock } from 'lucide-react';
import { Journey, JourneyStats } from '../types';
import { formatFullDate } from '../utils/date';
import { getMotivationalMessage } from '../utils/journey';

interface Props {
  journey: Journey;
  stats: JourneyStats;
  completedTodayCount: number;
  totalTodayCount: number;
  streakCount: number;
  onEditJourney: () => void;
}

export const DeadlineHero: React.FC<Props> = ({
  journey,
  stats,
  completedTodayCount,
  totalTodayCount,
  streakCount,
  onEditJourney,
}) => {
  const motivationalQuote = getMotivationalMessage(stats, completedTodayCount, totalTodayCount);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#141418] border border-white/5 p-5 sm:p-7 shadow-xl">
      {/* Subtle background ambient glow */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Top bar: Section Label & Goal Name & Edit Button */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              DEADLINE COUNTDOWN
            </span>
            {streakCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                <Flame className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                {streakCount}d streak
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight flex items-center gap-2 line-clamp-1">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{journey.goal}</span>
          </h2>
        </div>

        <button
          onClick={onEditJourney}
          aria-label="Edit Journey Goal and Deadline"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors shrink-0"
          title="Edit Journey Deadline"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Numbers */}
      <div className="my-5 sm:my-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono text-white">
              {stats.daysLeft}
            </span>
            <span className="text-lg sm:text-xl font-medium tracking-wide text-emerald-400 font-mono">
              DAYS LEFT
            </span>
          </div>
          <div className="mt-1 text-xs sm:text-sm font-mono text-slate-400">
            DAY <span className="text-white font-semibold">{stats.currentDay}</span> OF{' '}
            <span className="text-white font-semibold">{stats.totalDays}</span>
          </div>
        </div>

        <div className="sm:text-right space-y-1">
          <div className="flex items-center sm:justify-end gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Target: {formatFullDate(journey.deadlineDate)}</span>
          </div>
          <div className="flex items-center sm:justify-end gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Started: {formatFullDate(journey.startDate)}</span>
          </div>
        </div>
      </div>

      {/* Journey Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Journey Progress</span>
          <span className="text-emerald-400 font-semibold font-mono">
            {stats.progressPercentage}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            style={{ width: `${Math.min(100, Math.max(2, stats.progressPercentage))}%` }}
          />
        </div>
      </div>

      {/* Motivational Message */}
      <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 italic">
        <p className="line-clamp-2">"{motivationalQuote}"</p>
      </div>
    </div>
  );
};
