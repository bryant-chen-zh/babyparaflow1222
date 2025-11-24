import React, { useState } from 'react';
import { Loader2, ChevronDown, ChevronUp, Circle, CheckCircle2 } from 'lucide-react';
import { PlanStep } from '../../types';

interface FloatingTodoBarProps {
  plan: PlanStep[] | null;
  onToggle?: () => void;
}

export function FloatingTodoBar({ plan, onToggle }: FloatingTodoBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!plan || plan.length === 0) return null;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  // Get status icon for each task
  const getStatusIcon = (status: 'pending' | 'loading' | 'done') => {
    switch (status) {
      case 'pending':
        return <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-emerald-600 flex-shrink-0" />;
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 fill-emerald-600/20" />;
    }
  };

  // Find current task (first loading task, or first pending if none loading)
  const currentTask = plan.find(t => t.status === 'loading') || plan.find(t => t.status === 'pending');
  const completedCount = plan.filter(t => t.status === 'done').length;
  const totalCount = plan.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const allCompleted = completedCount === totalCount;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden mb-3">
        {/* Header - always visible */}
        <button
          onClick={handleToggle}
          className="w-full px-3 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors group"
        >
          {/* Current task icon */}
          <div className="relative flex-shrink-0 pt-0.5">
            {currentTask && getStatusIcon(currentTask.status)}
            {currentTask?.status === 'loading' && (
              <div className="absolute inset-0 bg-emerald-400/30 rounded-full animate-ping" />
            )}
          </div>

          {/* Task info */}
          <div className="flex-1 text-left min-w-0">
            <div className={`text-sm font-semibold ${
              allCompleted ? 'text-emerald-600' : 'text-slate-800'
            }`}>
              {currentTask ? currentTask.label : '✓ All tasks completed'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {allCompleted ? 'Execution complete' : 'Processing...'}
            </div>
          </div>

          {/* Progress counter */}
          <div className="flex items-start gap-3 flex-shrink-0 pt-0.5">
            <span className="text-xs font-semibold text-slate-600 tabular-nums">
              {completedCount} / {totalCount}
            </span>

            {/* Expand/collapse icon */}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </div>
        </button>

        {/* Expanded content - show all tasks */}
        {isExpanded && (
          <div className="border-t border-slate-100">
            <div className="px-3 py-2 space-y-2 max-h-64 overflow-y-auto">
              {plan.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 px-2 py-2 rounded-xl transition-all ${
                    task.status === 'loading'
                      ? 'bg-emerald-50/80' :
                    task.status === 'done'
                      ? 'bg-slate-50/50' :
                      'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="pt-0.5 flex-shrink-0">
                    {getStatusIcon(task.status)}
                  </div>
                  <span className={`flex-1 text-xs transition-all ${
                    task.status === 'done'
                      ? 'text-slate-400 line-through' :
                    task.status === 'loading'
                      ? 'text-slate-800 font-semibold' :
                      'text-slate-600'
                  }`}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
