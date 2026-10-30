import React, { useState, useMemo } from 'react';
import {
  Flame,
  CheckCircle2,
  Calendar as CalendarIcon,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Journey, JourneyStats, DayHistorySummary, Habit } from '../types';
import { calculateStreakStats, calculateWeeklyHabitBreakdown } from '../utils/streak';
import { addDays } from '../utils/date';
import { storage } from '../services/storage';
import { supabaseSync } from '../services/supabaseSync';
import { DayDetailModal } from './DayDetailModal';

interface Props {
  journey: Journey;
  stats: JourneyStats;
  todayStr: string;
  habits: Habit[];
  onOpenJournalForDate: (dateStr: string) => void;
  onOpenWeeklyReview: () => void;
}

export const ProgressDashboard: React.FC<Props> = ({
  journey,
  stats,
  todayStr,
  habits,
  onOpenJournalForDate,
  onOpenWeeklyReview,
}) => {
  const [shieldVersion, setShieldVersion] = useState(0);

  // Calendar month state
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);

  // Retrieve recorded history & shields
  const historyMap = useMemo(() => {
    return storage.getAllHistorySummaries(journey.startDate, todayStr);
  }, [journey.startDate, todayStr, shieldVersion]);

  const streakShields = storage.getStreakShields();
  const streakStats = calculateStreakStats(historyMap, journey.startDate, todayStr, streakShields);

  // Weekly review breakdown
  const weeklyBreakdown = useMemo(() => {
    return calculateWeeklyHabitBreakdown(historyMap, habits, todayStr);
  }, [historyMap, habits, todayStr]);

  const weeklyReviews = storage.getWeeklyReviews();
  const weekStartDate = addDays(todayStr, -6);
  const currentWeekReview = weeklyReviews.find((r) => r.weekStartDate === weekStartDate);

  // Yesterday shield eligibility
  const yesterdayStr = addDays(todayStr, -1);
  const dayBeforeYesterdayStr = addDays(yesterdayStr, -1);
  const isYesterdayShielded = storage.isDayShielded(yesterdayStr);
  const isDayBeforeShielded = storage.isDayShielded(dayBeforeYesterdayStr);
  const yesterdaySummary = historyMap[yesterdayStr];
  const isYesterdayMissed = yesterdaySummary ? yesterdaySummary.status === 'missed' : false;

  const canShieldYesterday =
    streakStats.shieldsRemaining > 0 &&
    !isYesterdayShielded &&
    !isDayBeforeShielded &&
    isYesterdayMissed;

  const handleUseShieldForYesterday = async () => {
    await supabaseSync.toggleStreakShield(yesterdayStr);
    setShieldVersion((v) => v + 1);
  };

  const handleRemoveShieldForYesterday = async () => {
    await supabaseSync.toggleStreakShield(yesterdayStr);
    setShieldVersion((v) => v + 1);
  };

  const prevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  // Generate calendar days for the current displayed month
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push(formatted);
  }

  const getDayColorClass = (dateStr: string) => {
    if (dateStr > todayStr) {
      return 'bg-white/5 border-dashed border-white/5 text-slate-600 hover:border-white/10';
    }
    if (storage.isDayShielded(dateStr)) {
      return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)] hover:bg-cyan-500/30';
    }
    const daySummary = storage.getDayHistory(dateStr, todayStr);
    switch (daySummary.status) {
      case 'shielded':
        return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)] hover:bg-cyan-500/30';
      case 'full':
        return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)] hover:bg-emerald-500/30';
      case 'partial':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25';
      case 'missed':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20';
      default:
        return 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10';
    }
  };

  const selectedSummary = selectedDayModal
    ? storage.getDayHistory(selectedDayModal, todayStr)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
            PERFORMANCE & DISCIPLINE
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Journey Progress Dashboard</h2>
        </div>

        <button
          onClick={onOpenWeeklyReview}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold text-slate-200 transition-all hover:border-emerald-500/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Weekly Discipline Audit</span>
          {currentWeekReview && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
          )}
        </button>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Current Streak */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CURRENT STREAK</span>
            <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {streakStats.currentStreak}{' '}
            <span className="text-xs font-normal text-emerald-400">days</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Best streak: <span className="text-slate-300 font-mono">{streakStats.longestStreak}d</span>
          </div>
        </div>

        {/* Metric 2: Total Days Completed */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>DAYS COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {streakStats.totalCompletedDays}
          </div>
          <div className="text-[11px] text-slate-500">
            Out of {stats.currentDay} elapsed days
          </div>
        </div>

        {/* Metric 3: Journey Progress */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>JOURNEY PROGRESS</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            {stats.progressPercentage}%
          </div>
          <div className="text-[11px] text-slate-500">
            Day {stats.currentDay} of {stats.totalDays}
          </div>
        </div>

        {/* Metric 4: Weekly Completion */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>WEEKLY RATE</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {streakStats.weeklyCompletionRate}%
          </div>
          <div className="text-[11px] text-slate-500">Past 7 days execution</div>
        </div>
      </div>

      {/* FEATURE 3: NEVER MISS TWICE (STREAK SHIELDS) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-cyan-500/20 relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                NEVER MISS TWICE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Rule of Discipline
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Streak Emergency Shields</span>
            </h3>
          </div>

          {/* Shields count visual */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <div className="flex items-center gap-1.5">
              {[0, 1].map((idx) => {
                const isAvailable = idx < streakStats.shieldsRemaining;
                return (
                  <div
                    key={idx}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isAvailable
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'bg-white/5 border border-white/10 text-slate-600'
                    }`}
                    title={isAvailable ? 'Available Streak Shield' : 'Shield Consumed'}
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                );
              })}
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 pl-1">
              {streakStats.shieldsRemaining} / 2 Shields Available
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed relative z-10">
          <strong className="text-slate-200">The Golden Rule:</strong> Missing one day is an accident; missing two consecutive days is the start of a bad habit. Streak Shields prevent your streak from resetting to 0 during an unavoidable emergency, but can <span className="text-cyan-300 underline underline-offset-2">never</span> be used on two back-to-back days.
        </p>

        {/* Yesterday Shield Action Bar */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="text-xs text-slate-400">
            {isYesterdayShielded ? (
              <span className="flex items-center gap-1.5 text-cyan-300 font-mono">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Yesterday ({yesterdayStr}) is shielded. Your streak is guarded.
              </span>
            ) : isYesterdayMissed ? (
              <span className="flex items-center gap-1.5 text-amber-300 font-mono">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Yesterday ({yesterdayStr}) was missed.
              </span>
            ) : (
              <span className="font-mono text-slate-500">
                Yesterday ({yesterdayStr}): {yesterdaySummary?.status === 'full' ? 'Completed 100%' : 'All good'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isYesterdayShielded && (
              <button
                onClick={handleRemoveShieldForYesterday}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revoke Shield</span>
              </button>
            )}

            {canShieldYesterday && (
              <button
                onClick={handleUseShieldForYesterday}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Shield Yesterday ({yesterdayStr})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FEATURE 4: WEEKLY DISCIPLINE RETROSPECTIVE CARD */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              7-DAY DISCIPLINE AUDIT
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Weekly Consistency Breakdown
            </h3>
          </div>

          <button
            onClick={onOpenWeeklyReview}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 self-start sm:self-auto"
          >
            <span>{currentWeekReview ? 'View / Update Review' : 'Start Weekly Audit'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[11px] font-mono text-slate-400">7-Day Score</span>
            <div className="text-xl font-mono font-bold text-emerald-400">
              {weeklyBreakdown.weekConsistencyScore}%
            </div>
            <p className="text-[10px] text-slate-500">Overall execution level</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[11px] font-mono text-slate-400">Top Solid Habit</span>
            <div className="text-sm font-semibold text-white truncate" title={weeklyBreakdown.topHabit}>
              {weeklyBreakdown.topHabit}
            </div>
            <p className="text-[10px] text-slate-500">Highest consistent streak</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[11px] font-mono text-slate-400">Primary Friction Area</span>
            <div className="text-sm font-semibold text-amber-300 truncate" title={weeklyBreakdown.missedHabit}>
              {weeklyBreakdown.missedHabit}
            </div>
            <p className="text-[10px] text-slate-500">Most missed this past week</p>
          </div>
        </div>

        {currentWeekReview && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Weekly Retrospective Completed</span>
            </div>
            <p className="text-slate-300 italic">
              Adjustment: "{currentWeekReview.adjustmentCommitment || currentWeekReview.frictionReflection}"
            </p>
          </div>
        )}
      </div>

      {/* Monthly Interactive Calendar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-semibold text-white">{monthName}</h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            Fully Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            Shielded (Grace)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Partially Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            Missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            Future
          </span>
          <span className="ml-auto text-slate-500 hidden sm:inline">
            Click any past day to see details
          </span>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono text-slate-500">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarCells.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`empty-${idx}`} className="h-10 sm:h-12 rounded-xl" />;
            }
            const dayNum = parseInt(dateStr.split('-')[2], 10);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const colorClass = getDayColorClass(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => !isFuture && setSelectedDayModal(dateStr)}
                disabled={isFuture}
                aria-label={`View details for ${dateStr}`}
                className={`h-10 sm:h-12 rounded-xl border flex flex-col items-center justify-center p-1 transition-all ${colorClass} ${
                  isToday ? 'ring-2 ring-emerald-400' : ''
                }`}
              >
                <span className={`text-xs sm:text-sm font-mono ${isToday ? 'font-bold' : ''}`}>
                  {dayNum}
                </span>
                {isToday && (
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDayModal && (
        <DayDetailModal
          dateStr={selectedDayModal}
          summary={selectedSummary}
          onClose={() => setSelectedDayModal(null)}
          onOpenJournalForDate={onOpenJournalForDate}
        />
      )}
    </div>
  );
};
