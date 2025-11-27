import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, ChevronDown, ChevronUp, Circle, CheckCircle2 } from 'lucide-react';
import { PlanStep } from '../../types';

interface FloatingTodoBarProps {
  plan: PlanStep[] | null;
  onToggle?: () => void;
}

export function FloatingTodoBar({ plan, onToggle }: FloatingTodoBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCompletedId, setShowCompletedId] = useState<string | null>(null);
  const prevPlanRef = useRef<PlanStep[] | null>(null);

  // Synchronously detect just completed task (before render)
  const justCompletedTask = useMemo(() => {
    if (!plan || !prevPlanRef.current) return null;
    
    const prevPlan = prevPlanRef.current;
    const completed = plan.find((task, idx) => {
      const prevTask = prevPlan[idx];
      return prevTask && prevTask.status === 'loading' && task.status === 'done';
    });
    
    return completed || null;
  }, [plan]);

  // Update ref and manage show duration
  useEffect(() => {
    if (justCompletedTask) {
      setShowCompletedId(justCompletedTask.id);
      const timer = setTimeout(() => {
        setShowCompletedId(null);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [justCompletedTask]);

  // Update prevPlanRef after render
  useEffect(() => {
    prevPlanRef.current = plan;
  }, [plan]);

  if (!plan || plan.length === 0) return null;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  // Get status icon for each task
  const getStatusIcon = (status: 'pending' | 'loading' | 'done') => {
    switch (status) {
      case 'pending':
        return <Circle className="w-3.5 h-3.5 text-moxt-text-4 flex-shrink-0" strokeWidth={1.5} />;
      case 'loading':
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-moxt-text-2 flex-shrink-0" strokeWidth={1.5} />;
      case 'done':
        return <CheckCircle2 className="text-moxt-brand-7 flex-shrink-0" size={14} />;
    }
  };

  // Find current task (first loading task, or first pending if none loading)
  const currentTask = plan.find(t => t.status === 'loading') || plan.find(t => t.status === 'pending');
  
  // Get the task to show as completed (either just completed or still showing)
  const completedTaskToShow = (justCompletedTask || (showCompletedId ? plan.find(t => t.id === showCompletedId) : null));
  
  // Find if there's a loading task (takes priority)
  const loadingTask = plan.find(t => t.status === 'loading');
  
  // Display task: loading task takes priority, then completed, then pending
  const displayTask = loadingTask || completedTaskToShow || currentTask;
  
  // Only show completed icon if no loading task
  const showCompletedState = completedTaskToShow && !loadingTask;
  const completedCount = plan.filter(t => t.status === 'done').length;
  const totalCount = plan.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const allCompleted = completedCount === totalCount;

  // Check if the task shown in header is just completed
  const isHeaderTaskJustCompleted = currentTask?.id === showCompletedId;

  return (
    <div className="bg-moxt-fill-white border-b border-moxt-line-1">
        {/* Header - always visible */}
        <button
          onClick={handleToggle}
          className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-moxt-fill-opacity-1 transition-all group ${
            isHeaderTaskJustCompleted ? 'bg-moxt-fill-1' : ''
          }`}
        >
          {/* Current task icon */}
          <div className="relative flex-shrink-0">
            {showCompletedState ? (
              <CheckCircle2 className="text-moxt-brand-7 flex-shrink-0" size={14} />
            ) : allCompleted ? (
              <CheckCircle2 className="text-moxt-brand-7 flex-shrink-0" size={14} />
            ) : (
              displayTask && getStatusIcon(displayTask.status)
            )}
            {loadingTask && (
              <div className="absolute inset-0 bg-moxt-text-3/30 rounded-full animate-ping" />
            )}
          </div>

          {/* Task info - single line */}
          <span className="flex-1 text-left text-13 font-medium text-moxt-text-1 truncate">
            {displayTask ? displayTask.label : 'All tasks completed'}
          </span>

          {/* Progress counter */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-12 font-medium text-moxt-text-3 tabular-nums">
              {completedCount}/{totalCount}
            </span>

            {/* Expand/collapse icon */}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-moxt-text-4 group-hover:text-moxt-text-2 transition-colors" />
            ) : (
              <ChevronUp className="w-4 h-4 text-moxt-text-4 group-hover:text-moxt-text-2 transition-colors" />
            )}
          </div>
        </button>

        {/* Expanded content - show all tasks */}
        {isExpanded && (
          <div className="border-t border-moxt-line-1">
            <div className="px-2.5 py-2 space-y-1 max-h-48 overflow-y-auto">
              {plan.map((task, index) => {
                const isJustCompleted = task.id === showCompletedId;
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded-md transition-all ${
                      isJustCompleted
                        ? 'bg-moxt-fill-2 scale-[1.02] shadow-sm' :
                      task.status === 'loading'
                        ? 'bg-moxt-fill-1' :
                      task.status === 'done'
                        ? 'bg-moxt-fill-1/50' :
                        'hover:bg-moxt-fill-opacity-1'
                    }`}
                  >
                    <div className="pt-0.5 flex-shrink-0 relative">
                      {getStatusIcon(task.status)}
                      {isJustCompleted && (
                        <div className="absolute inset-0 bg-moxt-text-3/30 rounded-full animate-ping" />
                      )}
                    </div>
                    <span className={`flex-1 text-12 transition-all ${
                      isJustCompleted
                        ? 'text-moxt-text-1 font-semibold' :
                      task.status === 'done'
                        ? 'text-moxt-text-4 line-through' :
                      task.status === 'loading'
                        ? 'text-moxt-text-1 font-semibold' :
                        'text-moxt-text-2'
                    }`}>
                      {task.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
