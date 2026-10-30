import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Tag, AlertCircle, Repeat, Plus } from 'lucide-react';
import { Priority, Task, TaskCategory, Habit } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  initialItem?: Task | Habit | null;
  onSaveTask: (data: {
    title: string;
    description?: string;
    durationMinutes?: number;
    category: TaskCategory;
    priority: Priority;
    isHabit: boolean;
    activeDays: number[];
  }) => void;
  onAddCategory?: (category: string) => void;
}

const DAYS_OF_WEEK = [
  { label: 'S', day: 0, full: 'Sun' },
  { label: 'M', day: 1, full: 'Mon' },
  { label: 'T', day: 2, full: 'Tue' },
  { label: 'W', day: 3, full: 'Wed' },
  { label: 'T', day: 4, full: 'Thu' },
  { label: 'F', day: 5, full: 'Fri' },
  { label: 'S', day: 6, full: 'Sat' },
];

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  initialItem,
  onSaveTask,
  onAddCategory,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [category, setCategory] = useState<TaskCategory>('Deep Work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isHabit, setIsHabit] = useState(true);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [newCatInput, setNewCatInput] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title || '');
      setDescription(initialItem.description || '');
      setDurationMinutes(initialItem.durationMinutes || 0);
      setCategory(initialItem.category || 'Deep Work');
      setPriority(initialItem.priority || 'medium');
      if ('activeDays' in initialItem && initialItem.activeDays) {
        setIsHabit(true);
        setActiveDays(initialItem.activeDays);
      } else if ('isHabitInstance' in initialItem && initialItem.isHabitInstance) {
        setIsHabit(true);
      } else {
        setIsHabit(false);
      }
    } else {
      setTitle('');
      setDescription('');
      setDurationMinutes(30);
      setCategory(categories[0] || 'Deep Work');
      setPriority('medium');
      setIsHabit(true);
      setActiveDays([0, 1, 2, 3, 4, 5, 6]);
      setError('');
    }
  }, [initialItem, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (isHabit && activeDays.length === 0) {
      setError('Please select at least one active day for recurring habits');
      return;
    }
    setError('');
    onSaveTask({
      title: title.trim(),
      description: description.trim() || undefined,
      durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
      category,
      priority,
      isHabit,
      activeDays,
    });
    onClose();
  };

  const toggleDay = (day: number) => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day].sort());
    }
  };

  const handleCreateCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newCatInput.trim() && onAddCategory) {
      onAddCategory(newCatInput.trim());
      setCategory(newCatInput.trim());
      setNewCatInput('');
      setShowAddCat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-[#141418] border border-white/10 p-6 shadow-2xl text-left my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">
              {initialItem ? 'Edit Focus Item' : 'New Daily Focus Item'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Switcher: Habit vs Task */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsHabit(true)}
                className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors border ${
                  isHabit
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Recurring Habit</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHabit(false)}
                className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors border ${
                  !isHabit
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span>⚡ One-off Task</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="task-title" className="text-xs font-medium text-slate-400">
              Title <span className="text-emerald-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Python practice, Running, Read 20m..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Duration Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Target Duration</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[0, 15, 20, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors border ${
                    durationMinutes === mins
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {mins === 0 ? 'None' : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Active Days for Recurring Habits */}
          {isHabit && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Active Days of Week
              </label>
              <div className="flex items-center gap-1.5 justify-between">
                {DAYS_OF_WEEK.map(({ label, day, full }) => {
                  const isActive = activeDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      title={full}
                      className={`w-9 h-9 rounded-xl text-xs font-mono font-semibold flex items-center justify-center transition-colors border ${
                        isActive
                          ? 'bg-emerald-400 text-black border-emerald-400 font-bold'
                          : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="task-cat" className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-500" />
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  + New
                </button>
              </div>
              <select
                id="task-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A22] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label htmlFor="task-priority" className="text-xs font-medium text-slate-400">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A22] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* New Category Input */}
          {showAddCat && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New category name"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400"
              >
                Add
              </button>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="task-desc" className="text-xs font-medium text-slate-400">
              Optional Description or Rules
            </label>
            <textarea
              id="task-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Focus without phone. 5km target pace."
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{initialItem ? 'Save Changes' : 'Add Focus Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
