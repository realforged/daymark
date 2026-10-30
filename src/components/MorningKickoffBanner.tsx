import React from 'react';
import { Sun, Star, CheckCircle, X, ArrowRight } from 'lucide-react';

interface Props {
  priorityText: string;
  isAlreadyNonNegotiable: boolean;
  onSetAsNonNegotiable: () => void;
  onDismiss: () => void;
}

export const MorningKickoffBanner: React.FC<Props> = ({
  priorityText,
  isAlreadyNonNegotiable,
  onSetAsNonNegotiable,
  onDismiss,
}) => {
  if (!priorityText.trim()) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#16161D] to-[#141418] border border-amber-500/30 p-4 sm:p-5 shadow-xl animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Sun className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                MORNING KICKOFF COMMITMENT
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">• From Last Night</span>
            </div>
            <p className="text-xs text-slate-400">
              Before going to sleep, you decided your #1 focus today is:
            </p>
            <p className="text-sm font-semibold text-white tracking-tight line-clamp-2 italic">
              "{priorityText}"
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          aria-label="Dismiss Morning Kickoff"
          className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-mono text-slate-400">
          Zero decision fatigue. Execute first thing.
        </div>

        <div className="flex items-center gap-2">
          {!isAlreadyNonNegotiable ? (
            <button
              onClick={onSetAsNonNegotiable}
              className="px-3 py-1.5 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Star className="w-3.5 h-3.5 fill-black" />
              <span>Lock as #1 Non-Negotiable</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-amber-300 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Locked as Today's #1</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
