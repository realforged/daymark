import React from 'react';
import { BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

interface Props {
  hasReflectedToday: boolean;
  onOpenJournal: () => void;
}

export const JournalReminder: React.FC<Props> = ({ hasReflectedToday, onOpenJournal }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#141418] to-[#171720] border border-white/5 p-5 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            {hasReflectedToday ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <BookOpen className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white tracking-tight">
              "Your day isn't over until you've reflected."
            </h4>
            <p className="text-xs text-slate-400">
              {hasReflectedToday
                ? 'Great job. You captured your daily reflection.'
                : 'Pause for 2 minutes to record accomplishments, learnings, and gratitude.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenJournal}
          className="self-start sm:self-center px-4 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
        >
          <span>{hasReflectedToday ? 'Review Journal' : 'Write Reflection'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
