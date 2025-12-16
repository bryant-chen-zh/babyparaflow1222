import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PlanStep } from '../../types';

interface AgentStatusPanelProps {
  plan: PlanStep[] | null;
  isRunning: boolean;
  currentTaskName?: string;
  isObservationMode: boolean;
  onToggleObservation: () => void;
}

export function AgentStatusPanel({ plan, isRunning, currentTaskName, isObservationMode, onToggleObservation }: AgentStatusPanelProps) {
  // Don't render if Agent is not running
  if (!isRunning) {
    return null;
  }

  // Positioned at top-center of the canvas area
  return (
    <div className={`absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${isObservationMode ? '-top-px' : 'top-4'}`}>
      {isObservationMode ? (
        // Following Mode: Attached to top border
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-1.5 bg-moxt-brand-7 text-white rounded-b-lg shadow-md border-x border-b border-moxt-brand-7">
          <Eye size={14} className="animate-pulse" />
          <span className="text-xs font-medium whitespace-nowrap">Following Paraflow</span>
          <div className="w-px h-3 bg-white/20 mx-1"></div>
          <button
            onClick={onToggleObservation}
            className="text-white/80 hover:text-white text-xs font-medium transition-colors"
          >
            Stop Follow
          </button>
        </div>
      ) : (
        // Working but not following: White pill with green accent
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white text-moxt-brand-7 rounded-full shadow-lg border-2 border-moxt-brand-7/20">
          <div className="w-2 h-2 bg-moxt-brand-7 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-moxt-text-2 whitespace-nowrap">Paraflow is working</span>
          <button
            onClick={onToggleObservation}
            className="ml-1 px-3 py-1 bg-moxt-brand-7 hover:bg-moxt-brand-7/90 text-white text-xs font-medium rounded-full transition-colors"
          >
            Follow
          </button>
        </div>
      )}
    </div>
  );
}
