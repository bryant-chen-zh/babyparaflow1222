
import React from 'react';
import { Maximize2, GitCommit, GitBranch, MousePointer2 } from 'lucide-react';
import { WhiteboardData } from '../../../types';

interface WhiteboardNodeProps {
  title?: string;
  data: WhiteboardData | null;
  loading?: boolean;
  onEdit?: () => void;
}

export const WhiteboardNode: React.FC<WhiteboardNodeProps> = ({ title, data, loading, onEdit }) => {
  if (loading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center animate-pulse p-8">
         <div className="w-full h-full border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center">
            <GitCommit className="text-slate-200" size={32} />
         </div>
      </div>
    );
  }

  // Calculate bounds for viewBox to center content in preview
  const xs = data.elements.map(e => e.x);
  const ys = data.elements.map(e => e.y);
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxX = Math.max(...data.elements.map(e => e.x + e.width), 800);
  const maxY = Math.max(...data.elements.map(e => e.y + e.height), 600);
  
  const viewBox = `${minX - 50} ${minY - 50} ${maxX - minX + 100} ${maxY - minY + 100}`;

  return (
    <div className="w-full h-full bg-white relative group flex flex-col">
      {/* Prominent Header */}
      <div className="h-14 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                 <GitBranch size={16} />
             </div>
             <div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Flow Chart</div>
                 <h3 className="font-bold text-slate-800 text-sm leading-none truncate max-w-[250px]">{title || 'Untitled Flow'}</h3>
             </div>
         </div>
         <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
            title="Open Board"
          >
             <Maximize2 size={14} className="opacity-70" />
             Open Board
         </button>
      </div>

      {/* Preview Content (SVG) */}
      <div className="flex-1 overflow-hidden bg-slate-50 relative" onDoubleClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
         {/* Dot Grid for Chart Background */}
         <div className="absolute inset-0 opacity-30 pointer-events-none" 
              style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
         </div>

         <svg 
            className="w-full h-full pointer-events-none select-none"
            viewBox={viewBox} 
            preserveAspectRatio="xMidYMid meet"
         >
            {data.elements.map(el => {
                const stroke = '#64748b';
                const fill = '#ffffff';
                const textFill = '#0f172a';
                switch (el.type) {
                    case 'rect':
                        return <rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} stroke={stroke} fill={fill} rx={4} strokeWidth={2} />;
                    case 'circle':
                        return <ellipse key={el.id} cx={el.x + el.width/2} cy={el.y + el.height/2} rx={el.width/2} ry={el.height/2} stroke={stroke} fill={fill} strokeWidth={2} />;
                    case 'diamond':
                         const mx = el.x + el.width / 2;
                         const my = el.y + el.height / 2;
                         return <polygon key={el.id} points={`${mx},${el.y} ${el.x + el.width},${my} ${mx},${el.y + el.height} ${el.x},${my}`} stroke={stroke} fill={fill} strokeWidth={2} />;
                    case 'text':
                        return (
                            <text key={el.id} x={el.x + el.width/2} y={el.y + el.height/2} dominantBaseline="middle" textAnchor="middle" fill={textFill} fontSize={14} fontFamily="monospace">
                                {el.content}
                            </text>
                        );
                    case 'arrow':
                        const endX = el.x + el.width;
                        const endY = el.y + el.height;
                        return <line key={el.id} x1={el.x} y1={el.y} x2={endX} y2={endY} stroke={stroke} strokeWidth={2} markerEnd="url(#arrowhead-preview)" />;
                    default: return null;
                }
            })}
            <defs>
                <marker id="arrowhead-preview" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
            </defs>
         </svg>
         
         {/* Hover Hint */}
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] text-slate-500 font-bold uppercase tracking-wide shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2">
             <MousePointer2 size={12} /> Double Click to Edit
         </div>
      </div>
      
      {/* Footer */}
      <div className="h-8 px-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-white shrink-0">
          <GitCommit size={12} />
          <span>SVG RENDERER</span>
          <span className="flex-1"></span>
          <span>{data.elements.length} ELEMENTS</span>
      </div>
    </div>
  );
};
