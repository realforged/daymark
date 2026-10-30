import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Edit3,
  AlignLeft,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { formatFullDate, formatDateLabel, addDays } from '../utils/date';
import { storage } from '../services/storage';
import { supabaseSync } from '../services/supabaseSync';

interface Props {
  todayStr: string;
}

export const JournalSection: React.FC<Props> = ({ todayStr }) => {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [mode, setMode] = useState<'guided' | 'freeform'>('guided');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Form fields
  const [accomplishments, setAccomplishments] = useState('');
  const [learnings, setLearnings] = useState('');
  const [improvements, setImprovements] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [tomorrowPriority, setTomorrowPriority] = useState('');
  const [freeText, setFreeText] = useState('');

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load entry when date changes
  useEffect(() => {
    const entry = storage.getJournalForDate(selectedDate);
    if (entry) {
      setAccomplishments(entry.accomplishments || '');
      setLearnings(entry.learnings || '');
      setImprovements(entry.improvements || '');
      setGratitude(entry.gratitude || '');
      setTomorrowPriority(entry.tomorrowPriority || '');
      setFreeText(entry.freeText || '');
    } else {
      setAccomplishments('');
      setLearnings('');
      setImprovements('');
      setGratitude('');
      setTomorrowPriority('');
      setFreeText('');
    }
    setSaveStatus('idle');
  }, [selectedDate]);

  // Trigger autosave with debounce
  const triggerAutosave = (updated: {
    accomplishments: string;
    learnings: string;
    improvements: string;
    gratitude: string;
    tomorrowPriority: string;
    freeText: string;
  }) => {
    setSaveStatus('saving');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      await supabaseSync.saveJournalEntry({
        id: `journal-${selectedDate}`,
        date: selectedDate,
        accomplishments: updated.accomplishments,
        learnings: updated.learnings,
        improvements: updated.improvements,
        gratitude: updated.gratitude,
        tomorrowPriority: updated.tomorrowPriority,
        freeText: updated.freeText,
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }, 600);
  };

  const handleChange = (field: string, value: string) => {
    const updated = {
      accomplishments: field === 'accomplishments' ? value : accomplishments,
      learnings: field === 'learnings' ? value : learnings,
      improvements: field === 'improvements' ? value : improvements,
      gratitude: field === 'gratitude' ? value : gratitude,
      tomorrowPriority: field === 'tomorrowPriority' ? value : tomorrowPriority,
      freeText: field === 'freeText' ? value : freeText,
    };

    if (field === 'accomplishments') setAccomplishments(value);
    if (field === 'learnings') setLearnings(value);
    if (field === 'improvements') setImprovements(value);
    if (field === 'gratitude') setGratitude(value);
    if (field === 'tomorrowPriority') setTomorrowPriority(value);
    if (field === 'freeText') setFreeText(value);

    triggerAutosave(updated);
  };

  // Historical entries list & search
  const allEntries = storage.getJournalEntries().sort((a, b) => (a.date < b.date ? 1 : -1));
  const searchResults = searchQuery.trim()
    ? allEntries.filter((e) => {
        const query = searchQuery.toLowerCase();
        return (
          e.accomplishments.toLowerCase().includes(query) ||
          e.learnings.toLowerCase().includes(query) ||
          e.improvements.toLowerCase().includes(query) ||
          e.gratitude.toLowerCase().includes(query) ||
          e.tomorrowPriority.toLowerCase().includes(query) ||
          e.freeText.toLowerCase().includes(query) ||
          e.date.includes(query)
        );
      })
    : [];

  const isToday = selectedDate === todayStr;

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
            NIGHT JOURNAL & REFLECTION
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Daily Evening Review</h2>
        </div>

        {/* Autosave status indicator */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono flex items-center gap-1.5 text-slate-400">
            {saveStatus === 'saving' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Saving draft...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            )}
            {saveStatus === 'idle' && (
              <span className="text-slate-500 text-[11px]">Autosave active</span>
            )}
          </div>

          <button
            onClick={() => setIsSearching(!isSearching)}
            aria-label="Toggle journal search"
            className={`p-2 rounded-xl border transition-colors ${
              isSearching
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-[#141418] text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar Overlay if Active */}
      {isSearching && (
        <div className="p-4 rounded-2xl bg-[#141418] border border-white/10 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search past accomplishments, lessons, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {searchQuery && (
            <div className="max-h-60 overflow-y-auto space-y-2 pt-2">
              <span className="text-[11px] font-mono text-slate-500">
                Found {searchResults.length} {searchResults.length === 1 ? 'entry' : 'entries'}
              </span>
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No matching reflections found.</p>
              ) : (
                searchResults.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => {
                      setSelectedDate(entry.date);
                      setIsSearching(false);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors space-y-1 block"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                      <span>{formatDateLabel(entry.date)}</span>
                      <span className="text-slate-500">Jump to entry →</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {entry.accomplishments || entry.freeText || 'Reflection entry'}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Date Navigator Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141418] border border-white/5">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">
            {formatFullDate(selectedDate)}
          </span>
          {isToday && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              Today
            </span>
          )}
        </div>

        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-[#141418] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setMode('guided')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'guided'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>5 Core Prompts</span>
          </button>
          <button
            onClick={() => setMode('freeform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'freeform'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Freeform Writing</span>
          </button>
        </div>

        {!isToday && (
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="text-xs text-emerald-400 hover:underline font-mono"
          >
            Return to Today
          </button>
        )}
      </div>

      {/* Guided 5-Prompt System */}
      {mode === 'guided' ? (
        <div className="space-y-4">
          {/* Prompt 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141418] border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
                1
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-white">
                What did I accomplish today?
              </h4>
            </div>
            <textarea
              rows={2}
              value={accomplishments}
              onChange={(e) => handleChange('accomplishments', e.target.value)}
              placeholder="e.g., Completed 90m Python practice, ran 5km, stayed off social media during deep work."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Prompt 2 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141418] border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
                2
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-white">
                What did I learn today?
              </h4>
            </div>
            <textarea
              rows={2}
              value={learnings}
              onChange={(e) => handleChange('learnings', e.target.value)}
              placeholder="e.g., Momentum comes after starting, never before. Small increments beat sporadic sprints."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Prompt 3 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141418] border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 font-mono text-xs flex items-center justify-center font-bold">
                3
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-white">
                What could I have done better?
              </h4>
            </div>
            <textarea
              rows={2}
              value={improvements}
              onChange={(e) => handleChange('improvements', e.target.value)}
              placeholder="e.g., Started morning routine 20 minutes late. Need to prep clothes and water the night before."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Prompt 4 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141418] border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-400 font-mono text-xs flex items-center justify-center font-bold">
                4
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-white">
                What am I grateful for?
              </h4>
            </div>
            <textarea
              rows={2}
              value={gratitude}
              onChange={(e) => handleChange('gratitude', e.target.value)}
              placeholder="e.g., Uninterrupted morning quiet, family encouragement, physical health to run."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Prompt 5 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141418] border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
                5
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-white">
                What is tomorrow's biggest priority?
              </h4>
            </div>
            <textarea
              rows={2}
              value={tomorrowPriority}
              onChange={(e) => handleChange('tomorrowPriority', e.target.value)}
              placeholder="e.g., Finish full module refactor by 11:00 AM before checking any emails."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </div>
      ) : (
        /* Freeform Writing Mode */
        <div className="p-5 rounded-2xl bg-[#141418] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Freeform Stream of Consciousness</span>
            <span>{freeText.length} characters</span>
          </div>
          <textarea
            rows={12}
            value={freeText}
            onChange={(e) => handleChange('freeText', e.target.value)}
            placeholder="Write freely about today's mindset, obstacles, breakthroughs, and reflections..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-y leading-relaxed"
          />
        </div>
      )}

      {/* Historical Entries Browser Drawer */}
      <div className="p-5 rounded-2xl bg-[#141418] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Historical Journal Entries</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {allEntries.length} total recorded
          </span>
        </div>

        {allEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pt-1">
            {allEntries.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedDate(e.date)}
                className={`p-3 rounded-xl border text-left transition-colors flex items-start justify-between gap-2 ${
                  e.date === selectedDate
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-mono font-medium text-emerald-400">
                    {formatDateLabel(e.date)}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {e.accomplishments || e.tomorrowPriority || e.freeText || 'Reflection saved'}
                  </p>
                </div>
                <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2">
            No past entries yet. Fill in today's prompts above to start your self-reflection archive!
          </p>
        )}
      </div>
    </div>
  );
};
