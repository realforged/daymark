import React, { useState } from 'react';
import { Reorder } from 'motion/react';
import {
  X,
  Target,
  Repeat,
  Tag,
  Globe,
  Download,
  Upload,
  Database,
  Trash2,
  Check,
  Plus,
  Volume2,
  VolumeX,
  ExternalLink,
  Copy,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import { Habit, UserSettings, Journey } from '../types';
import { testSupabaseConnection } from '../services/supabaseClient';
import { storage } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  journey: Journey;
  habits: Habit[];
  onUpdateSettings: (settings: UserSettings) => void;
  onEditJourney: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onReorderHabits?: (reordered: Habit[]) => void;
  onOpenNewHabit: () => void;
  onResetData: () => void;
  onLoadSeedData: () => void;
}

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  journey,
  habits,
  onUpdateSettings,
  onEditJourney,
  onEditHabit,
  onDeleteHabit,
  onReorderHabits,
  onOpenNewHabit,
  onResetData,
  onLoadSeedData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'habits' | 'cloud' | 'data'>('general');
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseAnonKey || '');
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [newCat, setNewCat] = useState('');

  if (!isOpen) return null;

  const handleTestSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult({ success: false, message: 'Please enter both Supabase URL and Anon Key' });
      return;
    }
    setIsTesting(true);
    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      const updated = {
        ...settings,
        supabaseUrl,
        supabaseAnonKey: supabaseKey,
        isCloudSyncEnabled: true,
      };
      onUpdateSettings(updated);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('daymark_supabase_url', supabaseUrl);
        window.localStorage.setItem('daymark_supabase_key', supabaseKey);
      }
    }
  };

  const handleExportData = () => {
    const dataStr = storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daymark-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = storage.importData(content);
          if (success) {
            alert('Data imported successfully! The app will refresh.');
            window.location.reload();
          } else {
            alert('Invalid backup file format.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopySchema = () => {
    const schemaSql = `-- DAYMARK PostgreSQL Supabase Schema
CREATE TABLE IF NOT EXISTS public.profiles (id UUID PRIMARY KEY REFERENCES auth.users(id), email TEXT, timezone TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.journeys (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), goal TEXT NOT NULL, start_date DATE, deadline_date DATE, ideal_self_desc TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.habits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), title TEXT, duration_minutes INT, category TEXT, priority TEXT, active_days INT[], is_active BOOLEAN DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS public.habit_completions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), habit_id UUID REFERENCES public.habits(id), date DATE, completed_at TIMESTAMPTZ, UNIQUE(habit_id, date));
CREATE TABLE IF NOT EXISTS public.tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), title TEXT, duration_minutes INT, category TEXT, priority TEXT, date DATE, is_completed BOOLEAN DEFAULT FALSE);
CREATE TABLE IF NOT EXISTS public.journal_entries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), date DATE, accomplishments TEXT, learnings TEXT, improvements TEXT, gratitude TEXT, tomorrow_priority TEXT, free_text TEXT, UNIQUE(user_id, date));`;
    navigator.clipboard.writeText(schemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const addCategory = () => {
    if (newCat.trim() && !settings.categories.includes(newCat.trim())) {
      const updated = {
        ...settings,
        categories: [...settings.categories, newCat.trim()],
      };
      onUpdateSettings(updated);
      setNewCat('');
    }
  };

  const removeCategory = (cat: string) => {
    if (settings.categories.length <= 1) return;
    const updated = {
      ...settings,
      categories: settings.categories.filter((c) => c !== cat),
    };
    onUpdateSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-[#141418] border border-white/10 p-6 sm:p-7 shadow-2xl text-left my-8 animate-in fade-in zoom-in-95 duration-150 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              PREFERENCES & ARCHITECTURE
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">Settings</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Nav */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'general' ? 'bg-emerald-400 text-black font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            General & Timezone
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'habits' ? 'bg-emerald-400 text-black font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Recurring Habits ({habits.length})
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'cloud' ? 'bg-emerald-400 text-black font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Supabase Cloud
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'data' ? 'bg-emerald-400 text-black font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Backup & Reset
          </button>
        </div>

        {/* TAB 1: General */}
        {activeTab === 'general' && (
          <div className="space-y-5">
            {/* Journey Edit Section */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span>Current Journey Target</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Goal: <span className="text-white font-medium">{journey.goal}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onEditJourney();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                >
                  Edit Goal & Deadline
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Deadline: {journey.deadlineDate} • Started: {journey.startDate}
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <label htmlFor="settings-tz" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Primary Timezone</span>
              </label>
              <select
                id="settings-tz"
                value={settings.timezone}
                onChange={(e) => onUpdateSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A22] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Daymark calculates midnight day boundaries using this timezone.
              </p>
            </div>

            {/* Audio Feedback Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Tactile Audio Feedback</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Plays a satisfying pop when ticking off focus items.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${
                  settings.soundEnabled ? 'bg-emerald-500 border-emerald-400' : 'bg-white/10 border-white/10'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Category Management */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Task Categories</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {settings.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300"
                  >
                    <span>{cat}</span>
                    <button
                      onClick={() => removeCategory(cat)}
                      className="text-slate-500 hover:text-rose-400 text-xs"
                      title="Remove category"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="New category label..."
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-3 py-1.5 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Recurring Habits */}
        {activeTab === 'habits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400">
                  Drag the handle to reorder habits on mobile and desktop.
                </p>
                <span className="text-[10px] font-mono text-emerald-400">
                  Order updates both Today view and overall routine.
                </span>
              </div>
              <button
                onClick={onOpenNewHabit}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Habit</span>
              </button>
            </div>

            {onReorderHabits ? (
              <Reorder.Group
                axis="y"
                values={habits}
                onReorder={onReorderHabits}
                className="space-y-2 max-h-72 overflow-y-auto"
              >
                {habits.map((habit) => (
                  <Reorder.Item
                    key={habit.id}
                    value={habit}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="touch-none cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-emerald-400 active:text-emerald-400 shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white">{habit.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {habit.category}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {habit.durationMinutes ? `${habit.durationMinutes}m • ` : ''}
                          Active: {habit.activeDays.length === 7 ? 'Every Day' : `${habit.activeDays.length} days/wk`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditHabit(habit)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs"
                        title="Edit Habit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{habit.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {habit.category}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {habit.durationMinutes ? `${habit.durationMinutes}m • ` : ''}
                        Active: {habit.activeDays.length === 7 ? 'Every Day' : `${habit.activeDays.length} days/wk`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditHabit(habit)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs"
                        title="Edit Habit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Supabase Cloud Sync */}
        {activeTab === 'cloud' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Supabase PostgreSQL Cloud Architecture</span>
              </h4>
              <p className="text-xs text-slate-400">
                DAYMARK operates 100% offline-first. Connect your Supabase project URL and anon key to enable persistent multi-device cloud synchronization.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="settings-supa-url" className="text-xs font-mono text-slate-300">Supabase Project URL</label>
                <input
                  id="settings-supa-url"
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="settings-supa-key" className="text-xs font-mono text-slate-300">Supabase Anon Key</label>
                <input
                  id="settings-supa-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTesting}
                  className="px-4 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'Verifying Connection...' : 'Connect & Test Supabase'}
                </button>

                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="px-3 py-2 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{copiedSchema ? 'SQL Copied!' : 'Copy Supabase SQL Schema'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Data & Reset */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Quick Demo Seed */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Load Sample Journey (Day 23 / 170)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Instantly populates the 147 days left example with realistic streak history.
                </p>
              </div>
              <button
                onClick={onLoadSeedData}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 whitespace-nowrap"
              >
                Load Sample
              </button>
            </div>

            {/* Export and Import */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportData}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors text-left space-y-1 block"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export JSON</span>
                </div>
                <p className="text-[11px] text-slate-400">Download complete data backup</p>
              </button>

              <label className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors text-left space-y-1 cursor-pointer block">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Import JSON</span>
                </div>
                <p className="text-[11px] text-slate-400">Restore from backup file</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-rose-400">Reset Local Storage</h4>
                <p className="text-[11px] text-slate-500">Deletes all local tasks, journals, and history</p>
              </div>
              <button
                onClick={onResetData}
                className="px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>DAYMARK v1.0 • PWA Ready</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
