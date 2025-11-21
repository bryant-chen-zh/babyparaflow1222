import React from 'react';
import { Zap, ExternalLink } from 'lucide-react';
import { IntegrationData } from '../../../types';

interface IntegrationNodeProps {
  title: string;
  data: IntegrationData | null;
  loading: boolean;
  onEdit: () => void;
}

export const IntegrationNode: React.FC<IntegrationNodeProps> = ({ title, data, loading, onEdit }) => {
  if (loading || !data) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-lg animate-pulse p-4 space-y-3">
        <div className="h-4 bg-rose-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-rose-100 rounded"></div>
          <div className="h-3 bg-rose-100 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const handleDocClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.documentation) {
      window.open(data.documentation, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-rose-400 to-pink-500 group relative rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-white/10 backdrop-blur-sm border-b border-white/20 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center shrink-0">
          <Zap size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider leading-none mb-1">Integration</div>
          <div className="font-semibold text-sm text-white truncate">{title}</div>
        </div>
        {data.documentation && (
          <button
            onClick={handleDocClick}
            className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded-md flex items-center justify-center transition-colors"
            title="View Documentation"
          >
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 bg-white overflow-y-auto custom-scrollbar">
        {/* Category Badge */}
        <div className="mb-3">
          <span className="inline-block px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
            {data.category}
          </span>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">{data.description}</p>
        )}

        {/* API Endpoint */}
        {data.apiEndpoint && (
          <div className="mb-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Endpoint</h4>
            <div className="bg-slate-50 border border-slate-100 rounded px-2 py-1.5 font-mono text-[10px] text-slate-600 truncate">
              {data.apiEndpoint}
            </div>
          </div>
        )}

        {/* Required Keys */}
        {data.requiredKeys && data.requiredKeys.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Required Keys</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.requiredKeys.map((key, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-mono rounded"
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Button (on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-rose-600 px-2 py-1 rounded text-[10px] font-bold shadow-sm"
      >
        Edit
      </button>
    </div>
  );
};

