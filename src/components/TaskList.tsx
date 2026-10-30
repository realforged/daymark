import React, { useState } from 'react';
import { Reorder } from 'motion/react';
import { Plus, Sparkles, ArrowUpDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task } from '../types';
import { TaskItem } from './TaskItem';
import { playCelebrationSound } from '../utils/sound';

interface Props {
  tasks: Task[];
  categories: string[];
  soundEnabled: boolean;
  onToggleTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onReorderTasks: (reordered: Task[]) => void;
  onToggleNonNegotiable: (task: Task) => void;
  onOpenAddModal: () => void;
}

export const TaskList: React.FC<Props> = ({
  tasks,
  categories,
  soundEnabled,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onReorderTasks,
  onToggleNonNegotiable,
  onOpenAddModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

  const handleToggle = (task: Task) => {
    const isNowCompleted = !task.isCompleted;
    onToggleTask(task);

    // If this toggle completes the final pending task, trigger celebration!
    const pendingCount = tasks.filter((t) => !t.isCompleted).length;
    if (isNowCompleted && pendingCount === 1) {
      playCelebrationSound(soundEnabled);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10B981', '#34D399', '#6EE7B7', '#FFFFFF'],
        });
      } catch {
        // Safe fallback
      }
    }
  };

  const handleDragReorder = (newFilteredOrder: Task[]) => {
    if (selectedCategory === 'All') {
      newFilteredOrder.forEach((t, i) => (t.order = i));
      onReorderTasks(newFilteredOrder);
    } else {
      // Merge reordered subset into the full tasks list preserving relative order
      const result: Task[] = [];
      let filteredIdx = 0;
      tasks.forEach((item) => {
        if (item.category === selectedCategory) {
          result.push(newFilteredOrder[filteredIdx]);
          filteredIdx++;
        } else {
          result.push(item);
        }
      });
      result.forEach((t, i) => (t.order = i));
      onReorderTasks(result);
    }
  };

  const handleMoveUp = (task: Task) => {
    const currentList = selectedCategory === 'All' ? tasks : filteredTasks;
    const idx = currentList.findIndex((t) => t.id === task.id);
    if (idx > 0) {
      const copy = [...currentList];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      handleDragReorder(copy);
    }
  };

  const handleMoveDown = (task: Task) => {
    const currentList = selectedCategory === 'All' ? tasks : filteredTasks;
    const idx = currentList.findIndex((t) => t.id === task.id);
    if (idx < currentList.length - 1 && idx !== -1) {
      const copy = [...currentList];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      handleDragReorder(copy);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              TODAY'S FOCUS
            </span>
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-emerald-400" />
              <span>Drag handle to reorder</span>
            </span>
          </div>
          <h3 className="text-base font-semibold text-white">Daily Execution List</h3>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Focus</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && tasks.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap border ${
              selectedCategory === 'All'
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
            }`}
          >
            All ({tasks.length})
          </button>
          {categories.map((cat) => {
            const count = tasks.filter((t) => t.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap border ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* List of items wrapped in Reorder.Group for smooth mobile & desktop dragging */}
      {filteredTasks.length > 0 ? (
        <Reorder.Group
          axis="y"
          values={filteredTasks}
          onReorder={handleDragReorder}
          className="space-y-2.5"
        >
          {filteredTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              isFirst={index === 0}
              isLast={index === filteredTasks.length - 1}
              onToggle={handleToggle}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onToggleNonNegotiable={onToggleNonNegotiable}
            />
          ))}
        </Reorder.Group>
      ) : (
        <div className="p-8 rounded-2xl bg-[#141418] border border-dashed border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">No items for this view</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Add today's high-leverage actions or configure recurring habits.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Focus Item</span>
          </button>
        </div>
      )}
    </div>
  );
};
