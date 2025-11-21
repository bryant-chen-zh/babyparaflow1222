
import React, { useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { CanvasPin } from '../../types';

interface PinMarkerProps {
  pin: CanvasPin;
  onClick: () => void;
  onDelete?: () => void;
  scale: number;
}

export const PinMarker: React.FC<PinMarkerProps> = ({ pin, onClick, onDelete, scale }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Parse content for simple mentions (e.g., "Check @Home Page")
  const renderContent = (text: string) => {
      const parts = text.split(/(@[\w\s]+)/g);
      return parts.map((part, i) => {
          if (part.startsWith('@')) {
              return <span key={i} className="text-rose-600 font-bold bg-rose-50 px-1 py-0.5 rounded mx-0.5">{part}</span>;
          }
          return part;
      });
  };

  // Keep pin size relatively constant regardless of zoom
  const inverseScale = Math.max(0.5, Math.min(1.5, 1 / scale));

  return (
    <div
      className="absolute z-[60] group"
      style={{ 
        left: pin.x, 
        top: pin.y, 
        transform: `translate(-50%, -100%) scale(${inverseScale})`,
        transformOrigin: 'bottom center'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
        {/* Icon */}
        <div className={`p-2.5 rounded-full shadow-xl transition-all duration-300 ${
            isHovered ? 'bg-rose-500 scale-110 ring-4 ring-rose-500/20' : 'bg-rose-600'
        } text-white cursor-pointer border-2 border-white relative z-10`}>
            <MapPin size={20} fill="currentColor" />
        </div>

        {/* Hover Card */}
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 transition-all duration-200 origin-bottom ${
            isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}>
            <div className="text-sm text-slate-700 leading-relaxed font-medium break-words">
                {renderContent(pin.content)}
            </div>
            <div className="mt-3 flex justify-between items-center border-t border-slate-50 pt-2">
                 <span className="text-[10px] font-mono text-slate-300 uppercase">Note</span>
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.();
                    }}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                 >
                    <Trash2 size={10} /> Delete
                 </button>
            </div>
            {/* Triangle pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-100 -mt-1.5"></div>
        </div>
    </div>
  );
};
