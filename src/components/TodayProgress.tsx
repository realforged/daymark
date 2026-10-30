import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface Props {
  completedCount: number;
  totalCount: number;
}

export const TodayProgress: React.FC<Props> = ({ completedCount, totalCount }) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllComplete = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="rounded-2xl bg-[#141418] border border-white/5 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            TODAY'S PROGRESS
          </span>
          {isAllComplete && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
              <Sparkles className="w-3 h-3" />
              Day Complete
            </span>
          )}
        </div>
        <span className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
          {percentage}%
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-2xl font-extrabold text-emerald-400">
            {completedCount}
          </span>
          <span className="text-slate-500 text-lg">/</span>
          <span className="text-slate-300 text-lg font-medium">{totalCount}</span>
          <span className="text-xs text-slate-400 ml-1">COMPLETED</span>
        </div>

        {totalCount > 0 && (
          <span className="text-xs text-slate-500 font-mono">
            {totalCount - completedCount} remaining
          </span>
        )}
      </div>

      {/* Smooth animated progress bar */}
      <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isAllComplete
              ? 'bg-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
              : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {isAllComplete && (
        <div className="mt-3.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All focus items executed for today. Time for your evening reflection!</span>
        </div>
      )}
    </div>
  );
};
