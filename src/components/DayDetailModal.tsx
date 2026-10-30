import React from 'react';
import { X, CheckCircle2, XCircle, BookOpen, Calendar, Award } from 'lucide-react';
import { DayHistorySummary, JournalEntry } from '../types';
import { formatFullDate } from '../utils/date';
import { storage } from '../services/storage';

interface Props {
  dateStr: string;
  summary: DayHistorySummary | null;
  onClose: () => void;
  onOpenJournalForDate?: (dateStr: string) => void;
}

export const DayDetailModal: React.FC<Props> = ({
  dateStr,
  summary,
  onClose,
  onOpenJournalForDate,
}) => {
  if (!summary) return null;

  const journal = storage.getJournalForDate(dateStr);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shielded':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            Shielded (Never Miss Twice Grace)
          </span>
        );
      case 'full':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Fully Completed (100%)
          </span>
        );
      case 'partial':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Partially Completed ({summary.completionRate}%)
          </span>
        );
      case 'missed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            Missed (0%)
          </span>
        );
      case 'future':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-white/10 text-slate-400 border border-white/10">
            Upcoming Day
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-white/5 text-slate-400">
            No Records
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[#141418] border border-white/10 p-6 shadow-2xl text-left my-8 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>DAY BREAKDOWN</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {formatFullDate(dateStr)}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status & Stats */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono text-slate-400">Execution Status</span>
            <div>{getStatusBadge(summary.status)}</div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-400">Tasks Ratio</span>
            <div className="text-sm font-mono font-bold text-white">
              {summary.completedTasks} / {summary.totalTasks} executed
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasks Completed ({summary.tasksCompleted.length})</span>
          </h4>
          {summary.tasksCompleted.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {summary.tasksCompleted.map((title, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-white/5">
              No tasks marked completed on this day.
            </p>
          )}
        </div>

        {/* Missed Tasks */}
        {summary.tasksMissed.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>Tasks Missed ({summary.tasksMissed.length})</span>
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {summary.tasksMissed.map((title, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs text-rose-300"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="line-through opacity-80">{title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Journal Reflection */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evening Reflection</span>
            </h4>
            {journal && onOpenJournalForDate && (
              <button
                onClick={() => {
                  onClose();
                  onOpenJournalForDate(dateStr);
                }}
                className="text-xs text-emerald-400 hover:underline"
              >
                Open in Journal Editor →
              </button>
            )}
          </div>

          {journal ? (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2.5 text-xs text-slate-300">
              {journal.accomplishments && (
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 block">Accomplishments:</span>
                  <p>{journal.accomplishments}</p>
                </div>
              )}
              {journal.learnings && (
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 block">Learnings:</span>
                  <p>{journal.learnings}</p>
                </div>
              )}
              {journal.tomorrowPriority && (
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 block">Tomorrow's Priority:</span>
                  <p>{journal.tomorrowPriority}</p>
                </div>
              )}
              {journal.freeText && (
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 block">Free Reflection:</span>
                  <p className="whitespace-pre-wrap">{journal.freeText}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-white/5">
              No journal entry recorded for this day.
            </p>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
