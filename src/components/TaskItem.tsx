import React from 'react';
import { Reorder, useDragControls } from 'motion/react';
import {
  Check,
  Clock,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Repeat,
  GripVertical,
  Star,
} from 'lucide-react';
import { Task } from '../types';

interface Props {
  task: Task;
  isFirst: boolean;
  isLast: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMoveUp: (task: Task) => void;
  onMoveDown: (task: Task) => void;
  onToggleNonNegotiable: (task: Task) => void;
}

export const TaskItem: React.FC<Props> = ({
  task,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleNonNegotiable,
}) => {
  const dragControls = useDragControls();

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
            MED
          </span>
        );
      default:
        return null;
    }
  };

  const isNonNeg = !!task.isNonNegotiable;

  return (
    <Reorder.Item
      value={task}
      id={task.id}
      dragListener={false}
      dragControls={dragControls}
      className={`group relative flex items-center justify-between gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-xl border transition-all select-none ${
        task.isCompleted
          ? 'bg-[#121215]/80 border-white/5 opacity-75'
          : isNonNeg
          ? 'bg-gradient-to-r from-amber-500/15 via-[#16161D] to-[#141418] border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/40'
          : 'bg-[#141418] border-white/5 hover:border-white/10 shadow-sm'
      }`}
    >
      {/* Drag Grip Handle for mobile & desktop */}
      <button
        type="button"
        onPointerDown={(e) => {
          dragControls.start(e);
        }}
        aria-label={`Drag to move ${task.title}`}
        title="Hold and drag to reorder"
        className="touch-none cursor-grab active:cursor-grabbing p-1.5 -ml-1 text-slate-500 hover:text-emerald-400 active:text-emerald-400 transition-colors shrink-0 rounded-lg hover:bg-white/5 focus:outline-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Left section: Checkbox & Info */}
      <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
        {/* Custom Circular Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task)}
          aria-label={task.isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 border ${
            task.isCompleted
              ? 'bg-emerald-400 border-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
              : isNonNeg
              ? 'bg-white/5 border-amber-400 text-transparent hover:border-amber-300'
              : 'bg-white/5 border-white/20 text-transparent hover:border-emerald-400/60'
          }`}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] transition-transform ${task.isCompleted ? 'scale-100' : 'scale-0'}`} />
        </button>

        {/* Task Details */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              onClick={() => onToggle(task)}
              className={`text-sm font-medium tracking-tight cursor-pointer select-none transition-all ${
                task.isCompleted
                  ? 'text-slate-500 line-through decoration-slate-600 decoration-1'
                  : 'text-white'
              }`}
            >
              {task.title}
            </span>

            {isNonNeg && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 shadow-sm">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>#1 NON-NEGOTIABLE</span>
              </span>
            )}

            {task.isHabitInstance && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <Repeat className="w-2.5 h-2.5" />
                Habit
              </span>
            )}

            {getPriorityBadge(task.priority)}
          </div>

          {task.description && (
            <p className="text-xs text-slate-400 line-clamp-1">{task.description}</p>
          )}

          {/* Badges: Category & Duration */}
          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500 font-mono">
            <span>{task.category}</span>
            {task.durationMinutes ? (
              <span className="flex items-center gap-1 text-slate-400">
                <span>•</span>
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{task.durationMinutes}m</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right actions: Star Non-Negotiable, Move Up / Down, Edit, Delete */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {/* Star Button for Non-Negotiable Priority */}
        <button
          onClick={() => onToggleNonNegotiable(task)}
          aria-label={isNonNeg ? 'Remove from Non-Negotiable' : 'Set as today\'s #1 Non-Negotiable priority'}
          title={isNonNeg ? 'Today\'s #1 Non-Negotiable' : 'Pin as today\'s #1 Non-Negotiable priority'}
          className={`p-1.5 rounded-lg transition-colors ${
            isNonNeg
              ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25'
              : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isNonNeg ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Quick tap move buttons */}
        <div className="flex flex-col -space-y-1 sm:space-y-0">
          <button
            onClick={() => onMoveUp(task)}
            disabled={isFirst}
            aria-label={`Move ${task.title} up`}
            className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(task)}
            disabled={isLast}
            aria-label={`Move ${task.title} down`}
            className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
};
