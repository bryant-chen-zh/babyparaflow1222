import React from 'react';
import { CheckCircle2, Circle, Clock, Ticket } from 'lucide-react';
import { TaskData } from '../../../types';

interface TaskNodeProps {
  title?: string;
  data: TaskData | null;
  loading?: boolean;
  onStatusChange?: (status: TaskData['status']) => void;
}

export const TaskNode: React.FC<TaskNodeProps> = ({ title, data, loading, onStatusChange }) => {
  if (loading || !data) {
    return (
      <div className="p-4 space-y-3 animate-pulse w-56">
        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
        <div className="h-3 bg-slate-100 rounded w-full"></div>
      </div>
    );
  }

  const statusConfig = {
    todo: { icon: Circle, color: 'text-slate-400', bg: 'bg-white', border: 'border-slate-200' },
    in_progress: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    done: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  };

  const currentConfig = statusConfig[data.status];
  const StatusIcon = currentConfig.icon;

  return (
    <div className={`h-full flex flex-col bg-white group relative border-2 ${currentConfig.border} rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden`}>
      <div className="p-4 flex flex-col h-full">
        
        {/* Header / Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
            <div className={`w-8 h-8 ${currentConfig.bg} ${currentConfig.color} rounded-full flex items-center justify-center shrink-0 transition-colors`}>
                <StatusIcon size={18} />
            </div>
            <div className="flex-1 pt-0.5">
                 <h3 className={`font-bold text-sm leading-snug ${data.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {title || 'Untitled Task'}
                 </h3>
            </div>
        </div>

        {/* Description */}
        <div className="flex-1">
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
                {data.description}
            </p>
        </div>

        {/* Actions (Quick Status Toggle) */}
        <div className="mt-4 pt-3 border-t border-slate-50 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {(['todo', 'in_progress', 'done'] as const).map((s) => (
                <button
                    key={s}
                    onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange?.(s);
                    }}
                    className={`flex-1 h-1.5 rounded-full transition-all ${data.status === s ? statusConfig[s].color.replace('text-', 'bg-') : 'bg-slate-100 hover:bg-slate-200'}`}
                    title={s.replace('_', ' ')}
                />
            ))}
        </div>
      </div>
    </div>
  );
};


