import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, ChevronDown, ChevronUp, CheckCircle2, CircleArrowRight, CircleDashed, Eye, EyeOff } from 'lucide-react';
import { PlanStep } from '../../types';
import { CountUp } from '../ReactBits';

interface AgentStatusPanelProps {
  plan: PlanStep[] | null;
  isRunning: boolean;
  currentTaskName?: string;
  isObservationMode: boolean;
  onToggleObservation: () => void;
}

export function AgentStatusPanel({ plan, isRunning, currentTaskName, isObservationMode, onToggleObservation }: AgentStatusPanelProps) {
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
        return <CircleDashed className="w-3.5 h-3.5 text-moxt-text-4" strokeWidth={1.5} />;
      case 'loading':
        return <CircleArrowRight className="w-3.5 h-3.5 text-moxt-brand-7" strokeWidth={1.5} />;
      case 'done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-moxt-brand-7" />;
    }
  };

  const isHeaderTaskJustCompleted = currentTask?.id === showCompletedId;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-auto max-w-lg pointer-events-none">
      
      {/* Main Panel - Capsule Style with Glassmorphism */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/60 overflow-hidden w-auto relative flex flex-col transition-all duration-300">
        {/* Header - always visible */}
        <div className="flex items-center h-12 px-1.5">
            {/* Left: Following Status (Only when running) */}
            {isRunning && (
                <>
                    <div className={`flex items-center gap-2 pl-3 pr-2 h-full text-xs font-medium select-none ${
                        isObservationMode ? 'text-moxt-brand-7' : 'text-slate-400'
                    }`}>
                        <div className="relative flex items-center justify-center w-2 h-2">
                            <div className={`w-2 h-2 rounded-full ${
                                isObservationMode ? 'bg-moxt-brand-7' : 'bg-slate-300'
                            }`} />
                            {isObservationMode && (
                                <div className="absolute inset-0 bg-moxt-brand-7 rounded-full animate-ping opacity-75" />
                            )}
                        </div>
                        {isObservationMode ? 'Following' : 'Paused'}
                    </div>
                    {/* Divider */}
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                </>
            )}

            {/* Middle: Task Info & Progress (Merged Button) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex-1 flex items-center justify-between gap-4 px-3 py-1.5 mx-1 h-9 rounded-full transition-all duration-200 group ${
                    isHeaderTaskJustCompleted 
                        ? 'bg-green-50 text-green-700' 
                        : 'hover:bg-slate-100 text-slate-700'
                }`}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 ${
                        isHeaderTaskJustCompleted ? 'text-green-600' : ''
                    }`}>
                        {allCompleted ? (
                            <CheckCircle2 size={16} className="text-moxt-brand-7" />
                        ) : showCompletedState ? (
                            <CheckCircle2 size={16} className="text-moxt-brand-7" />
                        ) : displayTask && displayTask.status === 'loading' ? (
                            <Loader2 size={16} className="animate-spin text-moxt-brand-7" />
                        ) : (
                            <CircleDashed size={16} className="text-slate-400" />
                        )}
                    </div>

                    {/* Task Label */}
                    <span className={`text-sm font-medium truncate max-w-[200px] ${
                        isHeaderTaskJustCompleted ? 'text-green-800' : 'group-hover:text-slate-900'
                    }`}>
                        {allCompleted ? "All tasks completed" : (displayTask ? displayTask.label : 'Initializing...')}
                    </span>
                </div>

                {/* Progress Counter */}
                <div className="flex items-center gap-1.5 pl-2">
                    <span className={`text-xs font-medium tabular-nums ${
                        isHeaderTaskJustCompleted ? 'text-green-600/80' : 'text-slate-400 group-hover:text-slate-500'
                    }`}>
                        {completedCount}/{totalCount}
                    </span>
                    {isExpanded ? (
                        <ChevronUp size={14} className={isHeaderTaskJustCompleted ? 'text-green-600' : 'text-slate-400'} />
                    ) : (
                        <ChevronDown size={14} className={isHeaderTaskJustCompleted ? 'text-green-600' : 'text-slate-400'} />
                    )}
                </div>
            </button>

            {/* Right: Action Button */}
            {isRunning && (
                <>
                    {/* Divider */}
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    
                    <button
                        onClick={onToggleObservation}
                        className={`h-9 px-3.5 ml-1 rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
                            isObservationMode 
                                ? 'text-slate-500 hover:text-red-500 hover:bg-red-50' 
                                : 'bg-moxt-brand-7 text-white hover:bg-moxt-brand-8 shadow-sm hover:shadow hover:-translate-y-0.5'
                        }`}
                    >
                        {isObservationMode ? 'Stop' : 'Resume'}
                    </button>
                </>
            )}
        </div>

        {/* Expanded content - show all tasks */}
        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-1 py-1 max-h-64 overflow-y-auto w-full min-w-[320px]">
            {plan.map((task, index) => {
                const isJustCompleted = task.id === showCompletedId;
                const isCurrentTask = task.status === 'loading';
                
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs ${
                      isJustCompleted
                        ? 'bg-green-50 text-green-700' :
                      isCurrentTask
                        ? 'bg-white shadow-sm text-slate-900 border border-slate-100' :
                      task.status === 'done'
                        ? 'text-slate-400' :
                        'text-slate-500'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {task.status === 'done' ? <CheckCircle2 size={14} /> :
                       task.status === 'loading' ? <Loader2 size={14} className="animate-spin text-moxt-brand-7" /> :
                       <CircleDashed size={14} />}
                    </div>
                    <span className="font-medium truncate">{task.label}</span>
                  </div>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
