import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, ChevronDown, ChevronUp, Circle, CheckCircle2 } from 'lucide-react';
import { PlanStep } from '../../types';
import { CountUp } from '../ReactBits';

interface AgentStatusPanelProps {
  plan: PlanStep[] | null;
  isRunning: boolean;
  currentTaskName?: string;
}

export function AgentStatusPanel({ plan, isRunning, currentTaskName }: AgentStatusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCompletedId, setShowCompletedId] = useState<string | null>(null);
  const prevPlanRef = useRef<PlanStep[] | null>(null);

  // Detect just completed task
  const justCompletedTask = useMemo(() => {
    if (!plan || !prevPlanRef.current) return null;
    
    const prevPlan = prevPlanRef.current;
    const completed = plan.find((task, idx) => {
      const prevTask = prevPlan[idx];
      return prevTask && prevTask.status === 'loading' && task.status === 'done';
    });
    
    return completed || null;
  }, [plan]);

  // Manage completion animation
  useEffect(() => {
    if (justCompletedTask) {
      setShowCompletedId(justCompletedTask.id);
      const timer = setTimeout(() => {
        setShowCompletedId(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [justCompletedTask]);

  // Update ref after render
  useEffect(() => {
    prevPlanRef.current = plan;
  }, [plan]);

  // Don't render if no plan
  if (!plan || plan.length === 0) return null;

  const completedCount = plan.filter(t => t.status === 'done').length;
  const totalCount = plan.length;
  const allCompleted = completedCount === totalCount;

  // Current task (loading or first pending)
  const loadingTask = plan.find(t => t.status === 'loading');
  const currentTask = loadingTask || plan.find(t => t.status === 'pending');
  
  // Get the task to show as completed
  const completedTaskToShow = (justCompletedTask || (showCompletedId ? plan.find(t => t.id === showCompletedId) : null));
  
  // Display task: loading task takes priority, then completed, then pending
  const displayTask = loadingTask || completedTaskToShow || currentTask;
  const showCompletedState = completedTaskToShow && !loadingTask;

  // Status icon - same style as FloatingTodoBar
  const getStatusIcon = (status: 'pending' | 'loading' | 'done') => {
    switch (status) {
      case 'pending':
        return <Circle className="w-3.5 h-3.5 text-moxt-text-4" strokeWidth={1.5} />;
      case 'loading':
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-moxt-text-2" strokeWidth={1.5} />;
      case 'done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-moxt-brand-7" />;
    }
  };

  const isHeaderTaskJustCompleted = currentTask?.id === showCompletedId;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
      {/* Main Panel - styled like FloatingTodoBar */}
      <div className="bg-moxt-fill-white rounded-xl shadow-lg border border-moxt-line-1 overflow-hidden">
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-moxt-fill-opacity-1 transition-all group ${
            isHeaderTaskJustCompleted ? 'bg-moxt-fill-1' : ''
          }`}
        >
          {/* Current task icon */}
          <div className="relative flex-shrink-0">
            {showCompletedState ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-moxt-brand-7" />
            ) : allCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-moxt-brand-7" />
            ) : (
              displayTask && getStatusIcon(displayTask.status)
            )}
            {loadingTask && (
              <div className="absolute inset-0 bg-moxt-text-3/30 rounded-full animate-ping" />
            )}
          </div>

          {/* Task info - single line */}
          <span className="flex-1 text-left text-13 font-medium text-moxt-text-1 truncate min-w-[120px] max-w-[240px]">
            {allCompleted ? 'All tasks completed' : (displayTask ? displayTask.label : 'Processing...')}
          </span>

          {/* Progress counter with animated CountUp */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-12 font-medium text-moxt-text-3 tabular-nums">
              <CountUp 
                to={completedCount} 
                duration={400} 
                easing="easeOut"
              />/{totalCount}
            </span>

            {/* Expand/collapse icon */}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-moxt-text-4 group-hover:text-moxt-text-2 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-moxt-text-4 group-hover:text-moxt-text-2 transition-colors" />
            )}
          </div>
        </button>

        {/* Expanded content - show all tasks */}
        {isExpanded && (
          <div className="border-t border-moxt-line-1">
            <div className="px-2.5 py-2 space-y-1 max-h-48 overflow-y-auto">
              {plan.map((task, index) => {
                const isJustCompleted = task.id === showCompletedId;
                const isCurrentTask = task.status === 'loading';
                
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded-md transition-all ${
                      isJustCompleted
                        ? 'bg-moxt-fill-2 scale-[1.02] shadow-sm' :
                      isCurrentTask
                        ? 'bg-moxt-fill-1' :
                      task.status === 'done'
                        ? 'bg-moxt-fill-1/50' :
                        'hover:bg-moxt-fill-opacity-1'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="pt-0.5 flex-shrink-0 relative">
                      {getStatusIcon(task.status)}
                      {isJustCompleted && (
                        <div className="absolute inset-0 bg-moxt-text-3/30 rounded-full animate-ping" />
                      )}
                    </div>

                    {/* Task Label */}
                    <span className={`flex-1 text-12 transition-all ${
                      isJustCompleted
                        ? 'text-moxt-text-1 font-semibold' :
                      task.status === 'done'
                        ? 'text-moxt-text-4 line-through' :
                      isCurrentTask
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
    </div>
  );
}
