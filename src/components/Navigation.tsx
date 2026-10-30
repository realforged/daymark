import React from 'react';
import { CheckSquare, BarChart2, BookOpen, Settings, Flame, Cloud, Loader2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { User } from '@supabase/supabase-js';

export type NavTab = 'today' | 'progress' | 'journal' | 'settings';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingTasksCount: number;
  streakCount: number;
  currentUser?: User | null;
  isSyncing?: boolean;
  onOpenAuth?: () => void;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  pendingTasksCount,
  streakCount,
  currentUser,
  isSyncing,
  onOpenAuth,
}) => {
  return (
    <>
      {/* ========================================================
          MOBILE BOTTOM NAVIGATION (Fixed, high-priority mobile UI)
          ======================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0F]/95 backdrop-blur-lg border-t border-white/5 px-2 py-1.5 flex items-center justify-around safe-bottom"
      >
        {/* Tab 1: Today */}
        <button
          onClick={() => onSelectTab('today')}
          aria-label="Today View"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative ${
            activeTab === 'today'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5" />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-black font-mono text-[9px] font-bold flex items-center justify-center">
                {pendingTasksCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-mono tracking-tight">Today</span>
        </button>

        {/* Tab 2: Progress */}
        <button
          onClick={() => onSelectTab('progress')}
          aria-label="Progress View"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'progress'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-mono tracking-tight">Progress</span>
        </button>

        {/* Tab 3: Journal */}
        <button
          onClick={() => onSelectTab('journal')}
          aria-label="Journal View"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'journal'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-mono tracking-tight">Journal</span>
        </button>

        {/* Tab 4: Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          aria-label="Settings View"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-mono tracking-tight">Settings</span>
        </button>
      </nav>

      {/* ========================================================
          DESKTOP SIDEBAR NAVIGATION
          ======================================================== */}
      <aside
        aria-label="Desktop Sidebar"
        className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#101013] border-r border-white/5 p-5 z-30 justify-between select-none"
      >
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider text-white font-mono">
                DAYMARK
              </h1>
              <p className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">
                DISCIPLINE ENGINE
              </p>
            </div>
          </div>

          {/* Quick Streak Badge */}
          {streakCount > 0 && (
            <div className="mx-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs font-mono text-emerald-300">
              <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>
                <strong className="text-white font-bold">{streakCount} Day</strong> Streak
              </span>
            </div>
          )}

          {/* Nav Items */}
          <div className="space-y-1">
            <button
              onClick={() => onSelectTab('today')}
              aria-label="Navigate to Today"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'today'
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4" />
                <span>Today's Focus</span>
              </div>
              {pendingTasksCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  {pendingTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('progress')}
              aria-label="Navigate to Progress"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'progress'
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Journey Progress</span>
            </button>

            <button
              onClick={() => onSelectTab('journal')}
              aria-label="Navigate to Journal"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'journal'
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Night Journal</span>
            </button>

            <button
              onClick={() => onSelectTab('settings')}
              aria-label="Navigate to Settings"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings & Cloud</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              aria-label="Cloud Account & Synchronization"
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-left transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Cloud className={`w-3.5 h-3.5 shrink-0 ${currentUser ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate text-slate-300 font-medium">
                  {currentUser ? currentUser.email : 'Supabase Sync'}
                </span>
              </div>
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
              ) : (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${currentUser ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {currentUser ? 'Cloud' : 'Offline'}
                </span>
              )}
            </button>
          )}
          <PWAInstallButton variant="compact" />
          <div className="text-[11px] font-mono text-slate-500 px-2">
            "Make every day count."
          </div>
        </div>
      </aside>
    </>
  );
};
