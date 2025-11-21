
import React, { useRef } from 'react';
import { X, MousePointer2 } from 'lucide-react';
import { ScreenData } from '../../types';

interface ImmersiveViewProps {
  data: ScreenData;
  onClose: () => void;
  onNavigate: (targetId: string) => void;
}

export const ImmersiveView: React.FC<ImmersiveViewProps> = ({ data, onClose, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle Navigation Clicks inside the rendered HTML
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const clickTarget = target.closest('[data-to]');
    
    if (clickTarget) {
        e.preventDefault();
        e.stopPropagation();
        const targetId = clickTarget.getAttribute('data-to');
        if (targetId) {
            onNavigate(targetId);
        }
    }
  };

  return (
    <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300">
      
      {/* Close Button - Floating Top Right */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors z-50 shadow-sm border border-slate-200 backdrop-blur"
        title="Exit Preview"
      >
        <X size={20} />
      </button>

      {/* Content Area - Full Width/Height */}
      <div 
          ref={containerRef}
          onClick={handleClick}
          className="w-full h-full overflow-y-auto custom-scrollbar relative bg-white"
          dangerouslySetInnerHTML={{ __html: data.htmlContent }}
      />

      {/* Subtle Cursor Hint */}
      <div className="absolute bottom-6 right-6 pointer-events-none text-slate-900/5 mix-blend-multiply z-40">
          <MousePointer2 size={32} strokeWidth={1.5} className="fill-slate-900/5" />
      </div>
    </div>
  );
};
