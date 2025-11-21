import React from 'react';
import { GitCommit, ArrowDown } from 'lucide-react';
import { FlowData } from '../../../types';

interface FlowNodeProps {
  data: FlowData | null;
  loading?: boolean;
}

export const FlowNode: React.FC<FlowNodeProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div className="w-full h-16 bg-slate-700 rounded-lg"></div>
            {i < 3 && <div className="h-6 w-1 bg-slate-700"></div>}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 flex flex-col items-center gap-1">
      {data.steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 relative group hover:border-blue-500 transition-colors">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 border border-slate-600 rounded-full flex items-center justify-center text-xs font-mono text-slate-400">
              {index + 1}
            </div>
            <div className="pl-4">
              <div className="font-bold text-slate-200 text-sm">{step.label}</div>
              <div className="text-xs text-slate-400 mt-1">{step.description}</div>
            </div>
          </div>
          
          {index < data.steps.length - 1 && (
            <div className="h-6 flex items-center justify-center text-slate-600">
              <ArrowDown size={16} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};