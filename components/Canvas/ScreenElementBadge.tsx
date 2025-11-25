import React from 'react';
import { X } from 'lucide-react';

interface ScreenElementBadgeProps {
  label: string;            // 如 "hero-section"
  screenTitle: string;      // 如 "首页"
  position: { x: number; y: number };  // 相对于 Screen 节点的位置
  color: 'green' | 'blue';  // 绿色（选中）或蓝色（mentioned）
  onRemove: () => void;
}

export const ScreenElementBadge: React.FC<ScreenElementBadgeProps> = ({
  label,
  screenTitle,
  position,
  color,
  onRemove
}) => {
  const bgColor = color === 'green' ? 'bg-brand-500' : 'bg-blue-500';
  const hoverBg = color === 'green' ? 'hover:bg-brand-600' : 'hover:bg-blue-600';

  return (
    <div
      className="absolute z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y - 32  // 32px 上方
      }}
    >
      <div className={`${bgColor} text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg whitespace-nowrap`}>
        <span>@{screenTitle}-{label}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`${hoverBg} rounded p-0.5 transition-colors`}
          title="Remove mention"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
