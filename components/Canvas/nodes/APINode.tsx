import React from 'react';
import { Zap, ArrowRight, Globe } from 'lucide-react';
import { APIData } from '../../../types';

interface APINodeProps {
  title?: string;
  data: APIData | null;
  loading?: boolean;
}

export const APINode: React.FC<APINodeProps> = ({ title, data, loading }) => {
  if (loading || !data) {
    return (
      <div className="p-4 space-y-3 animate-pulse w-64">
        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded"></div>
          <div className="h-3 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  const methodColors: Record<string, string> = {
    GET: 'text-blue-600 bg-blue-50 border-blue-200',
    POST: 'text-brand-600 bg-brand-50 border-brand-200',
    PUT: 'text-orange-600 bg-orange-50 border-orange-200',
    DELETE: 'text-red-600 bg-red-50 border-red-200',
    PATCH: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  };

  const methodStyle = methodColors[data.method] || 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <div className="h-full flex flex-col bg-white group relative border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
            <Globe size={16} />
        </div>
        <div className="flex-1 min-w-0">
           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Endpoint</div>
           <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${methodStyle}`}>
                    {data.method}
                </span>
                <span className="font-mono text-xs text-slate-700 truncate">{data.path}</span>
           </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {data.description && (
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">{data.description}</p>
        )}

        {/* Params */}
        {data.params && data.params.length > 0 && (
            <div className="mb-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Parameters</h4>
                <div className="space-y-1">
                    {data.params.map((param, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs group/param">
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-700">{param.name}</span>
                                {param.required && <span className="text-[9px] text-red-500 font-medium px-1 bg-red-50 rounded">REQ</span>}
                            </div>
                            <span className="text-slate-400 font-mono text-[10px]">{param.type}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Response Preview */}
        {data.response && (
            <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Response</h4>
                <div className="bg-slate-50 border border-slate-100 rounded p-2 font-mono text-[10px] text-slate-600 overflow-x-auto">
                    <pre>{data.response}</pre>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

