import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, ChevronDown, ChevronUp, Circle, CheckCircle2, Bot, Pause, Play } from 'lucide-react';
import { PlanStep } from '../../types';

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

  // Don't render if no plan or not running and no plan
  if (!plan || plan.length === 0) return null;

  const completedCount = plan.filter(t => t.status === 'done').length;
  const totalCount = plan.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;

  // Current task (loading or first pending)
  const currentTask = plan.find(t => t.status === 'loading') || plan.find(t => t.status === 'pending');
  const displayTaskName = currentTaskName || currentTask?.label || 'Processing...';

  // Status icon
  const getStatusIcon = (status: 'pending' | 'loading' | 'done') => {
    switch (status) {
      case 'pending':
        return <Circle className="w-3 h-3 text-moxt-text-4" strokeWidth={1.5} />;
      case 'loading':
        return <Loader2 className="w-3 h-3 animate-spin text-moxt-brand-7" strokeWidth={2} />;
      case 'done':
        return <CheckCircle2 className="w-3 h-3 text-moxt-brand-7" />;
    }
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
      {/* Main Panel */}
      <div 
        className={`
          bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-moxt-line-1
          transition-all duration-300 ease-out
          ${isExpanded ? 'w-80' : 'w-auto'}
        `}
      >
        {/* Collapsed Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-moxt-fill-opacity-1 rounded-2xl transition-colors group"
        >
          {/* Agent Icon with pulse effect when running */}
          <div className="relative">
            <div className={`
              w-8 h-8 rounded-xl flex items-center justify-center
              ${isRunning && !allCompleted ? 'bg-moxt-brand-7' : allCompleted ? 'bg-moxt-brand-7' : 'bg-moxt-fill-2'}
              transition-colors
            `}>
              <Bot className={`w-4 h-4 ${isRunning || allCompleted ? 'text-white' : 'text-moxt-text-3'}`} />
            </div>
            {isRunning && !allCompleted && (
              <span className="absolute inset-0 rounded-xl bg-moxt-brand-7 animate-ping opacity-30" />
            )}
          </div>

          {/* Task Info */}
          <div className="flex-1 text-left min-w-0">
            <div className="text-13 font-medium text-moxt-text-1 truncate">
              {allCompleted ? 'All tasks completed' : displayTaskName}
            </div>
            {!allCompleted && (
              <div className="text-11 text-moxt-text-4 mt-0.5">
                {isRunning ? 'Processing...' : 'Paused'}
              </div>
            )}
          </div>

          {/* Progress Badge */}
          <div className="flex items-center gap-2">
            <div className={`
              px-2.5 py-1 rounded-lg text-12 font-semibold tabular-nums
              ${allCompleted ? 'bg-moxt-brand-7/10 text-moxt-brand-7' : 'bg-moxt-fill-1 text-moxt-text-2'}
            `}>
              {completedCount}/{totalCount}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-moxt-text-4 group-hover:text-moxt-text-2 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-moxt-text-4 group-hover:text-moxt-text-2 transition-colors" />
            )}
          </div>
        </button>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="h-1.5 bg-moxt-fill-1 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                allCompleted ? 'bg-moxt-brand-7' : 'bg-gradient-to-r from-moxt-brand-7 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Expanded Task List */}
        {isExpanded && (
          <div className="border-t border-moxt-line-1 px-3 py-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {plan.map((task, index) => {
                const isJustCompleted = task.id === showCompletedId;
                const isCurrentTask = task.status === 'loading';
                
                return (
                  <div
                    key={task.id}
                    className={`
                      flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200
                      ${isJustCompleted ? 'bg-moxt-brand-7/10 scale-[1.02]' : ''}
                      ${isCurrentTask ? 'bg-moxt-fill-1' : ''}
                      ${task.status === 'done' && !isJustCompleted ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 relative">
                      {getStatusIcon(task.status)}
                      {isJustCompleted && (
                        <span className="absolute inset-0 rounded-full bg-moxt-brand-7 animate-ping opacity-40" />
                      )}
                    </div>

                    {/* Task Label */}
                    <span className={`
                      flex-1 text-12 truncate
                      ${isCurrentTask ? 'text-moxt-text-1 font-medium' : ''}
                      ${task.status === 'done' ? 'text-moxt-text-3 line-through' : 'text-moxt-text-2'}
                      ${isJustCompleted ? 'text-moxt-brand-7 font-medium no-underline' : ''}
                    `}>
                      {task.label}
                    </span>

                    {/* Step Number */}
                    <span className="text-10 text-moxt-text-4 font-mono">
                      {index + 1}
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

