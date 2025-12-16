import React from 'react';
import { X } from 'lucide-react';

interface MentionBadgeProps {
  nodeTitle: string;
  onRemove: () => void;
  scale?: number;
}

export const MentionBadge: React.FC<MentionBadgeProps> = ({ nodeTitle, onRemove, scale = 1 }) => {
  return (
    <div 
      className="absolute left-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 origin-bottom-left"
      style={{
        top: -32 / scale,
        transform: `scale(${1 / scale})`
      }}
    >
      <div className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg">
        <span>@{nodeTitle}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-blue-600 rounded p-0.5 transition-colors"
          title="Remove mention"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
