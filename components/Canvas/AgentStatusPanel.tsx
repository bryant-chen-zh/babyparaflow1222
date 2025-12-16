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

  // Simplified UI Styles
  const pillBaseClass = "pointer-events-auto rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden w-auto relative flex items-center h-9 p-1 gap-1 select-none";
  
  // 1. Solid Green (Following) - Use Theme Brand Color
  const pillGreenFilled = "bg-moxt-brand-7 text-white border border-moxt-brand-7";
  
  // 2. White with Green Border (Working but not following) - Use Theme Brand Color
  const pillGreenOutlined = "bg-white text-moxt-brand-7 border-2 border-moxt-brand-7/20 shadow-lg";

  const pillGrayClass = "bg-white text-slate-600 border border-slate-200/60";

  // 1. Observation Mode (Running + Following) -> No UI, just follow silently
  if (isObservationMode) {
     return null;
  }

  // 2. Paused State (!isRunning) -> No UI
  if (!isRunning) {
    return null;
  }

  // 3. Running but NOT Following (isObservationMode = false) -> No UI
  return null;
}
