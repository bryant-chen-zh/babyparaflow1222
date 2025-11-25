import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Square, Circle, Type, MousePointer2, Move, Trash2, Diamond, ArrowRight } from 'lucide-react';
import { WhiteboardElement, WhiteboardData } from '../../types';

interface WhiteboardModalProps {
  isOpen: boolean;
  title: string;
  initialData: WhiteboardData;
  onSave: (data: WhiteboardData) => void;
  onClose: () => void;
}

type ToolType = 'select' | 'rect' | 'circle' | 'diamond' | 'text' | 'arrow';

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({ isOpen, title, initialData, onSave, onClose }) => {
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Canvas References
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 600 });

  useEffect(() => {
    if (isOpen) {
      setElements(JSON.parse(JSON.stringify(initialData.elements || [])));
      document.body.style.overflow = 'hidden';
      setViewBox({ x: -100, y: -100, w: 1000, h: 800 });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialData]);

  const handleClose = () => {
    onSave({ elements });
    onClose();
  };

  // --- Interaction Handlers ---

  const getMouseCoords = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getMouseCoords(e);

    if (activeTool === 'select') {
        if (e.target === svgRef.current) {
            setSelectedId(null);
        }
        return;
    }

    // Create new element
    const id = Date.now().toString();
    const newElement: WhiteboardElement = {
        id,
        type: activeTool,
        x,
        y,
        width: 0,
        height: 0,
        color: '#0f172a', // Dark for light mode
        content: activeTool === 'text' ? 'Text' : ''
    };
    
    if (activeTool === 'text') {
        newElement.width = 100; 
        newElement.height = 30;
    }

    setElements(prev => [...prev, newElement]);
    setSelectedId(id);
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return;
    const { x, y } = getMouseCoords(e);

    setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;

        if (activeTool === 'select') {
            const dx = x - dragStart.x;
            const dy = y - dragStart.y;
            return { ...el, x: el.x + dx, y: el.y + dy };
        } else {
            return { 
                ...el, 
                width: x - el.x, 
                height: y - el.y 
            };
        }
    }));
    
    if (activeTool === 'select') {
        setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setElements(prev => prev.map(el => {
        if (el.id === selectedId) {
            let newX = el.x;
            let newY = el.y;
            let newW = el.width;
            let newH = el.height;

            if (newW < 0) { newX += newW; newW = Math.abs(newW); }
            if (newH < 0) { newY += newH; newH = Math.abs(newH); }
            
            if (activeTool !== 'select' && newW < 10) newW = 50;
            if (activeTool !== 'select' && newH < 10) newH = 50;
            if (el.type === 'text') { newW = Math.max(newW, 50); newH = 30; }

            return { ...el, x: newX, y: newY, width: newW, height: newH };
        }
        return el;
    }));
    
    if (activeTool !== 'select') {
        setActiveTool('select');
    }
  };

  const handleDelete = () => {
    if (selectedId) {
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
    }
  };

  // --- Render Helpers ---

  const renderElement = (el: WhiteboardElement) => {
     const isSelected = selectedId === el.id;
     const stroke = isSelected ? '#059669' : '#64748b'; // Emerald-600 for selection
     const strokeWidth = isSelected ? 3 : 2;
     const fill = '#ffffff'; // White fill for shapes

     const commonProps = {
         onMouseDown: (e: React.MouseEvent) => {
             e.stopPropagation();
             setSelectedId(el.id);
             if (activeTool === 'select') {
                 setIsDragging(true);
                 const { x, y } = getMouseCoords(e);
                 setDragStart({ x, y });
             }
         },
         style: { cursor: activeTool === 'select' ? 'move' : 'default' }
     };

     switch (el.type) {
         case 'rect':
             return <rect x={el.x} y={el.y} width={el.width} height={el.height} stroke={stroke} strokeWidth={strokeWidth} fill={fill} rx={4} {...commonProps} />;
         case 'circle':
             return <ellipse cx={el.x + el.width/2} cy={el.y + el.height/2} rx={el.width/2} ry={el.height/2} stroke={stroke} strokeWidth={strokeWidth} fill={fill} {...commonProps} />;
         case 'diamond':
             const mx = el.x + el.width / 2;
             const my = el.y + el.height / 2;
             return <polygon points={`${mx},${el.y} ${el.x + el.width},${my} ${mx},${el.y + el.height} ${el.x},${my}`} stroke={stroke} strokeWidth={strokeWidth} fill={fill} {...commonProps} />;
         case 'text':
             return (
                 <g {...commonProps}>
                     {isSelected && <rect x={el.x - 5} y={el.y - 5} width={el.width + 10} height={el.height + 10} stroke="#059669" strokeDasharray="4" fill="none" />}
                     <foreignObject x={el.x} y={el.y} width={Math.max(el.width, 50)} height={Math.max(el.height, 30)}>
                         <input 
                            className="w-full h-full bg-transparent text-slate-900 font-mono text-sm border-none focus:outline-none text-center placeholder-slate-400"
                            value={el.content}
                            onChange={(e) => {
                                setElements(prev => prev.map(item => item.id === el.id ? { ...item, content: e.target.value } : item));
                            }}
                         />
                     </foreignObject>
                 </g>
             );
         case 'arrow':
             const headLen = 10;
             const angle = Math.atan2(el.height, el.width);
             const endX = el.x + el.width;
             const endY = el.y + el.height;
             return (
                 <g {...commonProps}>
                    <line x1={el.x} y1={el.y} x2={endX} y2={endY} stroke={stroke} strokeWidth={strokeWidth} />
                    <polygon 
                        points={`${endX},${endY} ${endX - headLen * Math.cos(angle - Math.PI / 6)},${endY - headLen * Math.sin(angle - Math.PI / 6)} ${endX - headLen * Math.cos(angle + Math.PI / 6)},${endY - headLen * Math.sin(angle + Math.PI / 6)}`}
                        fill={stroke}
                    />
                    {isSelected && <rect x={el.x} y={el.y} width={el.width} height={el.height} stroke="#059669" strokeWidth={1} fill="none" strokeDasharray="4" />}
                 </g>
             );
         default: return null;
     }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-slate-50 flex flex-col animate-in fade-in duration-200">
       {/* Header */}
       <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white z-10 shadow-sm">
          <button onClick={handleClose} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Canvas</span>
          </button>
          <div className="flex items-center gap-2">
             <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">Chart Editor</span>
          </div>
          <button onClick={handleClose} className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-md flex items-center gap-2 shadow-md">
              <Check size={14} /> Save & Close
          </button>
       </div>

       <div className="flex-1 flex overflow-hidden">
           {/* Toolbar */}
           <div className="w-14 border-r border-slate-200 bg-white flex flex-col items-center py-4 gap-4 z-10 shadow-sm">
               <ToolBtn icon={MousePointer2} active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
               <div className="w-8 h-px bg-slate-100 my-1"></div>
               <ToolBtn icon={Square} active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} />
               <ToolBtn icon={Circle} active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} />
               <ToolBtn icon={Diamond} active={activeTool === 'diamond'} onClick={() => setActiveTool('diamond')} />
               <ToolBtn icon={ArrowRight} active={activeTool === 'arrow'} onClick={() => setActiveTool('arrow')} />
               <ToolBtn icon={Type} active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
               
               <div className="flex-1"></div>
               <button 
                disabled={!selectedId}
                onClick={handleDelete}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
               >
                   <Trash2 size={20} />
               </button>
           </div>

           {/* Canvas Area */}
           <div className="flex-1 relative bg-slate-50 overflow-hidden cursor-crosshair">
                {/* Dot Grid Background */}
                <div className="absolute inset-0 opacity-40 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                <svg 
                    ref={svgRef}
                    className="w-full h-full touch-none"
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {elements.map(renderElement)}
                </svg>

                {/* Hint */}
                <div className="absolute bottom-4 left-4 text-xs text-slate-400 font-mono pointer-events-none bg-white/50 px-2 py-1 rounded backdrop-blur-sm">
                    {activeTool === 'select' ? 'Select & Drag elements' : 'Click & Drag to create'}
                </div>
           </div>
       </div>
    </div>
  );
};

const ToolBtn = ({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`p-2 rounded-lg transition-all ${active ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
    >
        <Icon size={20} />
    </button>
);