import React, { useRef, useState, useEffect, useMemo } from 'react';
import { CanvasNode, NodeType, CanvasView, ScreenData, CanvasEdge, CanvasTool, CanvasSection, CanvasPin, IntegrationData } from '../../types';
import { DocumentNode } from './nodes/DocumentNode';
import { WhiteboardNode } from './nodes/WhiteboardNode';
import { ScreenNode } from './nodes/ScreenNode';
import { TableNode } from './nodes/TableNode';
import { APINode } from './nodes/APINode';
import { TaskNode } from './nodes/TaskNode';
import { IntegrationNode } from './nodes/IntegrationNode';
import { PinMarker } from './PinMarker';
import { MentionBadge } from './MentionBadge';
import { MOBILE_SCREEN_WIDTH, MOBILE_SCREEN_HEIGHT, WEB_SCREEN_WIDTH, WEB_SCREEN_HEIGHT, MIN_ZOOM, MAX_ZOOM, SECTION_IDS } from '../../constants';
import { Plus, Minus, FileText, GitBranch, Smartphone, GripHorizontal, MousePointer2, Hand, BoxSelect, MapPin, Table as TableIcon, Globe, CheckSquare, Zap, Link2, Database } from 'lucide-react';

interface CanvasContainerProps {
  nodes: CanvasNode[];
  edges?: CanvasEdge[];
  pins?: CanvasPin[];
  view: CanvasView;
  onViewChange: (view: CanvasView) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  onBatchNodeMove: (updates: {id: string, dx: number, dy: number}[]) => void;
  onNodeSectionChange: (nodeId: string, sectionId: string | undefined) => void;
  onAddNode: (node: CanvasNode) => void;
  onEditNode: (id: string) => void;
  onRunNode: (id: string) => void;
  onAddPinClick?: (x: number, y: number) => void;
  onDeletePin?: (id: string) => void;
  onDeleteNodes?: (ids: string[]) => void;
  isCanvasSelectionMode?: boolean;
  mentionedNodeIds?: string[];
  onNodeMentionSelect?: (nodeId: string) => void;
  onRemoveMention?: (nodeId: string) => void;
}

interface SectionBounds {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

type SectionTheme = 'blue' | 'purple' | 'emerald' | 'orange' | 'rose' | 'slate';

const THEMES: Record<SectionTheme, { border: string; bg: string; badge: string; dot: string }> = {
  blue: { border: 'border-blue-200/50', bg: 'bg-blue-50/30', badge: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' },
  purple: { border: 'border-purple-200/50', bg: 'bg-purple-50/30', badge: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500' },
  emerald: { border: 'border-emerald-200/80', bg: 'bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
  orange: { border: 'border-orange-200/50', bg: 'bg-orange-50/30', badge: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  rose: { border: 'border-rose-200/50', bg: 'bg-rose-50/30', badge: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' },
  slate: { border: 'border-slate-200/50', bg: 'bg-slate-100/30', badge: 'bg-slate-200 text-slate-600', dot: 'bg-slate-500' },
};

// Helper to get dimensions for a node type
const getNodeDimensions = (node: CanvasNode) => {
    if (node.width && node.height) return { width: node.width, height: node.height }; // Manual override

    if (node.type === NodeType.SCREEN) {
         const screenData = node.data as ScreenData;
         const isWeb = screenData?.variant === 'web';
         const width = isWeb ? WEB_SCREEN_WIDTH : MOBILE_SCREEN_WIDTH;
         const height = (isWeb ? WEB_SCREEN_HEIGHT : MOBILE_SCREEN_HEIGHT) + 80; // +80 for header/shadows
         return { width, height };
    } else if (node.type === NodeType.WHITEBOARD) {
         return { width: 850, height: 700 }; // Increased height for header
    } else if (node.type === NodeType.DOCUMENT) {
         return { width: 450, height: 550 }; // Increased height for header
    } else if (node.type === NodeType.TABLE) {
        return { width: 280, height: 320 };
    } else if (node.type === NodeType.API) {
        return { width: 320, height: 240 };
    } else if (node.type === NodeType.TASK) {
        return { width: 240, height: 160 };
    } else if (node.type === NodeType.INTEGRATION) {
        return { width: 320, height: 240 };
    }
    return { width: 400, height: 400 };
};

// Helper to calculate bounding box for a group of nodes
const getSectionBounds = (nodes: CanvasNode[], padding = 120): Omit<SectionBounds, 'id'> | null => {
    if (nodes.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
        const { width, height } = getNodeDimensions(node);
        
        if (node.x < minX) minX = node.x;
        if (node.y < minY) minY = node.y;
        if (node.x + width > maxX) maxX = node.x + width;
        if (node.y + height > maxY) maxY = node.y + height;
    });

    return {
        x: minX - padding,
        y: minY - padding,
        width: (maxX - minX) + (padding * 2),
        height: (maxY - minY) + (padding * 2)
    };
};

const SectionContainer = ({ 
    bounds, 
    title, 
    theme, 
    icon: Icon,
    onDragStart,
    onTitleChange,
    onThemeChange
}: { 
    bounds: Omit<SectionBounds, 'id'> | null, 
    title: string, 
    theme: SectionTheme, 
    icon: any,
    onDragStart: (e: React.MouseEvent) => void,
    onTitleChange: (val: string) => void,
    onThemeChange: (val: SectionTheme) => void
}) => {
    if (!bounds) return null;
    
    const themeStyles = THEMES[theme];

    return (
        <div 
            className={`absolute rounded-[48px] border-2 ${themeStyles.border} ${themeStyles.bg} backdrop-blur-[2px] transition-all duration-300 group`}
            style={{
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
                zIndex: 0 
            }}
        >
            {/* Drag Handle / Header */}
            <div 
                className="absolute -top-16 left-6 flex flex-col items-start gap-2"
            >
                 <div 
                    className="flex items-center gap-4 cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-white/40 transition-colors"
                    onMouseDown={onDragStart}
                 >
                    <div className={`p-3 rounded-xl ${themeStyles.badge} shadow-sm`}>
                        <Icon size={24} />
                    </div>
                    
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-2xl font-bold text-slate-500 uppercase tracking-wider placeholder-slate-300 focus:text-slate-800 transition-colors w-auto min-w-[200px]"
                    />

                    <GripHorizontal className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-2" size={24} />
                 </div>

                 {/* Color Picker (Visible on hover of parent group) */}
                 <div className="flex items-center gap-2 ml-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 backdrop-blur px-2 py-1.5 rounded-full shadow-sm border border-slate-100">
                     {(Object.keys(THEMES) as SectionTheme[]).map((t) => (
                         <button
                            key={t}
                            onClick={() => onThemeChange(t)}
                            className={`w-4 h-4 rounded-full ${THEMES[t].dot} ${theme === t ? 'ring-2 ring-offset-1 ring-slate-300' : 'hover:scale-110'} transition-all`}
                            title={t}
                         />
                     ))}
                 </div>
            </div>
        </div>
    );
};

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
    nodes,
    edges = [],
    pins = [],
    view,
    onViewChange,
    onNodeMove,
    onBatchNodeMove,
    onNodeSectionChange,
    onAddNode,
    onEditNode,
    onRunNode,
    onAddPinClick,
    onDeletePin,
    onDeleteNodes,
    isCanvasSelectionMode = false,
    mentionedNodeIds = [],
    onNodeMentionSelect,
    onRemoveMention
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // --- Interaction State ---
  const [activeTool, setActiveTool] = useState<CanvasTool>('SELECT');
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [ghostBox, setGhostBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  // Section Metadata State
  const [sectionSettings, setSectionSettings] = useState<Record<string, { title: string, theme: SectionTheme }>>({
      [SECTION_IDS.DOCUMENT]: { title: 'Documents & Specs', theme: 'blue' },
      [SECTION_IDS.CHART]: { title: 'Logic & Flow', theme: 'purple' },
      [SECTION_IDS.SCREEN]: { title: 'Prototype', theme: 'emerald' },
      [SECTION_IDS.BACKEND]: { title: 'Backend Development', theme: 'orange' },
  });

  const [manualSections, setManualSections] = useState<CanvasSection[]>([]);

  // Node/Section Dragging State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Selection & Hover State
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number, y: number } | null>(null);

  // Calculate Auto Sections
  const docNodes = useMemo(() => nodes.filter(n => n.sectionId === SECTION_IDS.DOCUMENT), [nodes]);
  const chartNodes = useMemo(() => nodes.filter(n => n.sectionId === SECTION_IDS.CHART), [nodes]);
  const screenNodes = useMemo(() => nodes.filter(n => n.sectionId === SECTION_IDS.SCREEN), [nodes]);
  const backendNodes = useMemo(() => nodes.filter(n => n.sectionId === SECTION_IDS.BACKEND), [nodes]);

  const docBounds = useMemo(() => getSectionBounds(docNodes), [docNodes]);
  const chartBounds = useMemo(() => getSectionBounds(chartNodes), [chartNodes]);
  const screenBounds = useMemo(() => getSectionBounds(screenNodes), [screenNodes]);
  const backendBounds = useMemo(() => getSectionBounds(backendNodes, 120), [backendNodes]);

  // Helpers
  const getCanvasCoords = (clientX: number, clientY: number) => {
      return {
          x: (clientX - view.x) / view.scale,
          y: (clientY - view.y) / view.scale
      };
  };

  const updateSectionSettings = (id: string, updates: Partial<{ title: string, theme: SectionTheme }>) => {
      if (SECTION_IDS[id as keyof typeof SECTION_IDS]) {
        setSectionSettings(prev => ({
            ...prev,
            [id]: { ...prev[id], ...updates }
        }));
      } else {
        setManualSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      }
  };

  // --- Zoom Helpers ---
  const zoomIn = () => {
    const newScale = Math.min(MAX_ZOOM, view.scale + 0.1);
    const container = containerRef.current;
    if (container) {
      const centerX = container.clientWidth / 2;
      const centerY = container.clientHeight / 2;
      const canvasX = (centerX - view.x) / view.scale;
      const canvasY = (centerY - view.y) / view.scale;
      const newX = centerX - canvasX * newScale;
      const newY = centerY - canvasY * newScale;
      onViewChange({ x: newX, y: newY, scale: newScale });
    } else {
      onViewChange({ ...view, scale: newScale });
    }
  };

  const zoomOut = () => {
    const newScale = Math.max(MIN_ZOOM, view.scale - 0.1);
    const container = containerRef.current;
    if (container) {
      const centerX = container.clientWidth / 2;
      const centerY = container.clientHeight / 2;
      const canvasX = (centerX - view.x) / view.scale;
      const canvasY = (centerY - view.y) / view.scale;
      const newX = centerX - canvasX * newScale;
      const newY = centerY - canvasY * newScale;
      onViewChange({ x: newX, y: newY, scale: newScale });
    } else {
      onViewChange({ ...view, scale: newScale });
    }
  };

  // --- Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;

      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut(); }

      if (e.code === 'Space') { setIsSpacePressed(true); }
      if (e.key === 'v' || e.key === 'V') { setActiveTool('SELECT'); }
      if (e.key === 'h' || e.key === 'H') { setActiveTool('HAND'); }
      if (e.key === 'p' || e.key === 'P') { setActiveTool('PIN'); }

      // Selection shortcuts
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedNodeIds([]);
        // Note: Canvas selection mode exit will be handled by App.tsx
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedNodeIds.length > 0) {
          // Delete selected nodes
          onDeleteNodes?.(selectedNodeIds);
          setSelectedNodeIds([]);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') { setIsSpacePressed(false); }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [view, selectedNodeIds]);

  const effectiveTool = isSpacePressed ? 'HAND' : activeTool;

  // Handle Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const canvasPos = getCanvasCoords(e.clientX, e.clientY);

    // Interaction Check (ignore UI elements but not for PIN tool which can click anywhere)
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
        // Exception: If using PIN tool, we might want to pin specific buttons, but for now prevent UI interference
        return;
    }

    // Record mouse down position for click vs drag distinction
    setMouseDownPos({ x: e.clientX, y: e.clientY });

    // 1. PIN Logic
    if (effectiveTool === 'PIN') {
        onAddPinClick?.(canvasPos.x, canvasPos.y);
        // Optional: Switch back to select or stay in pin mode?
        // Let's stay in PIN mode for multiple pins, user must switch back manually.
        return;
    }

    // 2. Drawing Logic
    if (['CREATE_SECTION', 'CREATE_DOCUMENT', 'CREATE_CHART', 'CREATE_TABLE', 'CREATE_API', 'CREATE_TASK', 'CREATE_INTEGRATION'].includes(effectiveTool)) {
        setIsDrawing(true);
        setDrawStart(canvasPos);
        setGhostBox({ x: canvasPos.x, y: canvasPos.y, w: 0, h: 0 });
        return;
    }

    // 3. Node Interaction (Canvas Selection Mode or SELECT tool)
    const nodeEl = target.closest('.canvas-node');

    // Canvas Selection Mode - just select the node for mentioning
    if (nodeEl && isCanvasSelectionMode) {
        const nodeId = nodeEl.getAttribute('data-id');
        if (nodeId) {
            e.preventDefault();
            e.stopPropagation();
            onNodeMentionSelect?.(nodeId);
        }
        return;
    }

    // Normal SELECT tool interaction
    if (nodeEl && effectiveTool === 'SELECT') {
        const nodeId = nodeEl.getAttribute('data-id');
        if (nodeId) {
            e.preventDefault();
            e.stopPropagation();
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                // If node is not selected, select it (or add to selection with Shift)
                if (!selectedNodeIds.includes(nodeId)) {
                    if (e.shiftKey) {
                        // Add to selection
                        setSelectedNodeIds(prev => [...prev, nodeId]);
                    } else {
                        // Replace selection
                        setSelectedNodeIds([nodeId]);
                    }
                } else if (e.shiftKey) {
                    // If Shift is pressed and node is already selected, deselect it
                    setSelectedNodeIds(prev => prev.filter(id => id !== nodeId));
                }
                // Start dragging
                setDraggedNodeId(nodeId);
                setDragOffset({ x: canvasPos.x - node.x, y: canvasPos.y - node.y });
            }
        }
        return;
    }

    // 4. Canvas Background Click (deselect when clicking empty space)
    if (effectiveTool === 'SELECT') {
        // Will be handled in mouseUp if it's a click (not drag)
    }

    // 5. Panning (Hand Tool or Canvas Click)
    setIsDraggingCanvas(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleSectionDragStart = (e: React.MouseEvent, sectionId: string) => {
      if (effectiveTool !== 'SELECT') return;
      if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
      
      e.preventDefault();
      e.stopPropagation();
      setDraggedSectionId(sectionId);
      const canvasPos = getCanvasCoords(e.clientX, e.clientY);
      setDragOffset({ x: canvasPos.x, y: canvasPos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const currentPos = getCanvasCoords(e.clientX, e.clientY);

    // Drawing
    if (isDrawing && ghostBox) {
        const w = currentPos.x - drawStart.x;
        const h = currentPos.y - drawStart.y;
        setGhostBox({
            x: w < 0 ? currentPos.x : drawStart.x,
            y: h < 0 ? currentPos.y : drawStart.y,
            w: Math.abs(w),
            h: Math.abs(h)
        });
        return;
    }

    // Panning
    if (isDraggingCanvas) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      onViewChange({ ...view, x: view.x + dx, y: view.y + dy });
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    // Dragging nodes
    if (draggedNodeId) {
        const draggedNode = nodes.find(n => n.id === draggedNodeId);
        if (!draggedNode) return;

        // If dragged node is in selection, move all selected nodes
        if (selectedNodeIds.includes(draggedNodeId) && selectedNodeIds.length > 1) {
            // Batch move all selected nodes
            const newX = currentPos.x - dragOffset.x;
            const newY = currentPos.y - dragOffset.y;
            const dx = newX - draggedNode.x;
            const dy = newY - draggedNode.y;

            const updates = selectedNodeIds.map(id => ({
                id,
                dx,
                dy
            }));
            onBatchNodeMove(updates);
        } else {
            // Single node move
            onNodeMove(draggedNodeId, currentPos.x - dragOffset.x, currentPos.y - dragOffset.y);
        }
    }

    if (draggedSectionId) {
        const dx = currentPos.x - dragOffset.x;
        const dy = currentPos.y - dragOffset.y;
        
        if (dx !== 0 || dy !== 0) {
            // Check if manual section
            const manualSec = manualSections.find(s => s.id === draggedSectionId);
            if (manualSec) {
                setManualSections(prev => prev.map(s => s.id === draggedSectionId ? { ...s, x: s.x + dx, y: s.y + dy } : s));
            } else {
                // Auto section - move all nodes in it
                const sectionNodes = nodes.filter(n => n.sectionId === draggedSectionId);
                if (sectionNodes.length > 0) {
                    const updates = sectionNodes.map(n => ({ id: n.id, dx, dy }));
                    onBatchNodeMove(updates);
                }
            }
            setDragOffset({ x: currentPos.x, y: currentPos.y });
        }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Check if it was a click (not drag) - distance < 5px
    const wasClick = mouseDownPos &&
      Math.abs(e.clientX - mouseDownPos.x) < 5 &&
      Math.abs(e.clientY - mouseDownPos.y) < 5;

    if (isDrawing && ghostBox) {
        // Finalize Creation
        if (ghostBox.w > 50 && ghostBox.h > 50) {
            if (effectiveTool === 'CREATE_SECTION') {
                const newSection: CanvasSection = {
                    id: `sec-${Date.now()}`,
                    x: ghostBox.x,
                    y: ghostBox.y,
                    width: ghostBox.w,
                    height: ghostBox.h,
                    title: 'New Section',
                    theme: 'slate'
                };
                setManualSections(prev => [...prev, newSection]);
            } else {
                let type = NodeType.WHITEBOARD;
                let title = 'New Node';
                let data: any = { elements: [] };

                if (effectiveTool === 'CREATE_DOCUMENT') {
                    type = NodeType.DOCUMENT;
                    title = 'New Document';
                    data = { content: '' };
                } else if (effectiveTool === 'CREATE_CHART') {
                    type = NodeType.WHITEBOARD;
                    title = 'New Chart';
                    data = { elements: [] };
                } else if (effectiveTool === 'CREATE_TABLE') {
                    type = NodeType.TABLE;
                    title = 'New Table';
                    data = { fields: [] };
                } else if (effectiveTool === 'CREATE_API') {
                    type = NodeType.API;
                    title = 'New Endpoint';
                    data = { method: 'GET', path: '/api/resource', params: [] };
                } else if (effectiveTool === 'CREATE_TASK') {
                    type = NodeType.TASK;
                    title = 'New Task';
                    data = { description: '', status: 'todo' };
                } else if (effectiveTool === 'CREATE_INTEGRATION') {
                    type = NodeType.INTEGRATION;
                    title = 'New Integration';
                    data = { provider: 'New Service', category: 'Email', description: '', requiredKeys: [] };
                }

                const newNode: CanvasNode = {
                    id: `node-${Date.now()}`,
                    type,
                    x: ghostBox.x,
                    y: ghostBox.y,
                    width: ghostBox.w,
                    height: ghostBox.h,
                    title,
                    status: 'done',
                    data
                };
                onAddNode(newNode);
            }
        }
        setIsDrawing(false);
        setGhostBox(null);
        setActiveTool('SELECT'); // Reset to Select after draw
    }

    // Handle click on canvas background (deselect all)
    if (wasClick && !draggedNodeId && effectiveTool === 'SELECT' && !e.shiftKey) {
        const target = e.target as HTMLElement;
        // Check if clicked on canvas background (not on a node)
        if (!target.closest('.canvas-node') && !target.closest('.canvas-section')) {
            setSelectedNodeIds([]);
        }
    }

    setIsDraggingCanvas(false);
    setDraggedNodeId(null);
    setDraggedSectionId(null);
    setMouseDownPos(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.scale - e.deltaY * 0.001));
      
      // Zoom around viewport center (not mouse position)
      const container = containerRef.current;
      if (container) {
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        
        // Calculate canvas point at viewport center before zoom
        const canvasX = (centerX - view.x) / view.scale;
        const canvasY = (centerY - view.y) / view.scale;
        
        // Calculate new view position to keep canvas point at viewport center
        const newX = centerX - canvasX * newScale;
        const newY = centerY - canvasY * newScale;
        
        onViewChange({ x: newX, y: newY, scale: newScale });
      } else {
      onViewChange({ ...view, scale: newScale });
      }
    } else {
      onViewChange({ ...view, x: view.x - e.deltaX, y: view.y - e.deltaY });
    }
  };

  // Edge Rendering Logic
  const renderEdges = () => {
    const edgeElements = edges.map(edge => {
        const fromNode = nodes.find(n => n.id === edge.fromNode);
        const toNode = nodes.find(n => n.id === edge.toNode);
        
        if (!fromNode || !toNode) return null;

        const fromDim = getNodeDimensions(fromNode);
        const toDim = getNodeDimensions(toNode);

        const fromCenter = {
            x: fromNode.x + fromDim.width / 2,
            y: fromNode.y + fromDim.height / 2
        };
        const toCenter = {
            x: toNode.x + toDim.width / 2,
            y: toNode.y + toDim.height / 2
        };

        const deltaX = toCenter.x - fromCenter.x;
        const cp1 = { x: fromCenter.x + deltaX * 0.5, y: fromCenter.y };
        const cp2 = { x: toCenter.x - deltaX * 0.5, y: toCenter.y };
        const pathData = `M ${fromCenter.x} ${fromCenter.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${toCenter.x} ${toCenter.y}`;

        // Style based on edge type
        const edgeType = edge.type || 'flow';
        let stroke = '#cbd5e1';
        let strokeWidth = 3;
        let strokeDasharray = '8, 6';
        
        if (edgeType === 'dependency') {
          stroke = '#f59e0b'; // orange - dependency
          strokeDasharray = '12, 8';
        } else if (edgeType === 'data') {
          stroke = '#3b82f6'; // blue - data flow
          strokeWidth = 4;
          strokeDasharray = '0'; // solid line
        } else if (edgeType === 'flow') {
          stroke = '#64748b'; // slate - workflow
          strokeDasharray = '6, 4';
        }

        return (
            <g key={edge.id}>
                <path 
                  d={pathData} 
                  stroke={stroke} 
                  strokeWidth={strokeWidth} 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeDasharray={strokeDasharray} 
                />
                {edge.label && (
                  <text 
                    x={(fromCenter.x + toCenter.x) / 2} 
                    y={(fromCenter.y + toCenter.y) / 2 - 10} 
                    fill="#64748b" 
                    fontSize="12" 
                    fontWeight="600"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {edge.label}
                  </text>
                )}
            </g>
        );
    });

    return edgeElements;
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-slate-50 overflow-hidden relative canvas-grid
        ${effectiveTool === 'HAND' || isDraggingCanvas ? 'cursor-grab active:cursor-grabbing' : ''}
        ${effectiveTool === 'SELECT' && !isDraggingCanvas ? 'cursor-default' : ''}
        ${['CREATE_SECTION', 'CREATE_DOCUMENT', 'CREATE_CHART', 'CREATE_TABLE', 'CREATE_API', 'CREATE_TASK', 'CREATE_INTEGRATION'].includes(effectiveTool) ? 'cursor-crosshair' : ''}
        ${effectiveTool === 'PIN' ? 'cursor-copy' : ''}
      `}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div 
        className="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none transition-transform duration-700 ease-in-out"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        <div className="pointer-events-auto relative w-full h-full">
            
            {/* --- AUTO SECTIONS --- */}
            <SectionContainer 
                bounds={docBounds} 
                title={sectionSettings[SECTION_IDS.DOCUMENT].title} 
                theme={sectionSettings[SECTION_IDS.DOCUMENT].theme} 
                icon={FileText}
                onDragStart={(e) => handleSectionDragStart(e, SECTION_IDS.DOCUMENT)}
                onTitleChange={(title) => updateSectionSettings(SECTION_IDS.DOCUMENT, { title })}
                onThemeChange={(theme) => updateSectionSettings(SECTION_IDS.DOCUMENT, { theme })}
            />
            <SectionContainer 
                bounds={chartBounds} 
                title={sectionSettings[SECTION_IDS.CHART].title}
                theme={sectionSettings[SECTION_IDS.CHART].theme}
                icon={GitBranch}
                onDragStart={(e) => handleSectionDragStart(e, SECTION_IDS.CHART)}
                onTitleChange={(title) => updateSectionSettings(SECTION_IDS.CHART, { title })}
                onThemeChange={(theme) => updateSectionSettings(SECTION_IDS.CHART, { theme })}
            />
            <SectionContainer 
                bounds={screenBounds} 
                title={sectionSettings[SECTION_IDS.SCREEN].title}
                theme={sectionSettings[SECTION_IDS.SCREEN].theme}
                icon={Smartphone}
                onDragStart={(e) => handleSectionDragStart(e, SECTION_IDS.SCREEN)}
                onTitleChange={(title) => updateSectionSettings(SECTION_IDS.SCREEN, { title })}
                onThemeChange={(theme) => updateSectionSettings(SECTION_IDS.SCREEN, { theme })}
            />
            <SectionContainer 
                bounds={backendBounds} 
                title={sectionSettings[SECTION_IDS.BACKEND].title}
                theme={sectionSettings[SECTION_IDS.BACKEND].theme}
                icon={Database}
                onDragStart={(e) => handleSectionDragStart(e, SECTION_IDS.BACKEND)}
                onTitleChange={(title) => updateSectionSettings(SECTION_IDS.BACKEND, { title })}
                onThemeChange={(theme) => updateSectionSettings(SECTION_IDS.BACKEND, { theme })}
            />

            {/* --- MANUAL SECTIONS --- */}
            {manualSections.map(s => (
                 <SectionContainer 
                    key={s.id}
                    bounds={{ x: s.x, y: s.y, width: s.width, height: s.height }}
                    title={s.title}
                    theme={s.theme}
                    icon={BoxSelect}
                    onDragStart={(e) => handleSectionDragStart(e, s.id)}
                    onTitleChange={(title) => updateSectionSettings(s.id, { title })}
                    onThemeChange={(theme) => updateSectionSettings(s.id, { theme })}
                />
            ))}

            {/* --- GHOST BOX --- */}
            {ghostBox && (
                <div 
                    className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-2xl z-50"
                    style={{ left: ghostBox.x, top: ghostBox.y, width: ghostBox.w, height: ghostBox.h }}
                />
            )}

            {/* --- EDGES --- */}
            <svg className="absolute top-0 left-0 w-full h-full overflow-visible z-0 pointer-events-none">
                {renderEdges()}
            </svg>

            {/* --- NODES --- */}
            {nodes.map(node => {
                const dims = getNodeDimensions(node);
                const isSelected = selectedNodeIds.includes(node.id);
                const isMentioned = mentionedNodeIds.includes(node.id);
                const isHovered = hoveredNodeId === node.id && !isSelected && !isMentioned;
                const isHoveredInSelectionMode = isCanvasSelectionMode && hoveredNodeId === node.id;
                const isDragging = draggedNodeId === node.id;

                return (
                <div
                    key={node.id}
                    data-id={node.id}
                    className={`canvas-node absolute shadow-sm transition-all duration-200 rounded-2xl bg-white
                        ${node.type === NodeType.SCREEN || isMentioned ? 'z-20 overflow-visible' : 'z-10 overflow-hidden'}
                        ${isHovered ? 'ring-4 ring-emerald-500/50 shadow-xl' : ''}
                        ${isHoveredInSelectionMode ? 'ring-4 ring-blue-500/50 shadow-xl' : ''}
                        ${isSelected ? 'ring-2 ring-emerald-500' : ''}
                        ${isMentioned ? 'ring-2 ring-blue-500' : ''}
                        ${isDragging ? 'scale-[1.02] cursor-grabbing' : ''}
                        ${isCanvasSelectionMode ? 'cursor-pointer' : ''}
                    `}
                    style={{ left: node.x, top: node.y, width: dims.width, height: dims.height }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                >
                    {node.type === NodeType.DOCUMENT && (
                        <DocumentNode title={node.title} data={node.data as any} loading={node.status === 'loading'} onEdit={() => onEditNode(node.id)} />
                    )}
                    {node.type === NodeType.WHITEBOARD && (
                        <WhiteboardNode title={node.title} data={node.data as any} loading={node.status === 'loading'} onEdit={() => onEditNode(node.id)} />
                    )}
                    {node.type === NodeType.SCREEN && (
                        <ScreenNode
                            title={node.title}
                            data={node.data as any}
                            loading={node.status === 'loading'}
                            onRun={() => onRunNode(node.id)}
                            onEditPlan={() => onEditNode(node.id)}
                        />
                    )}
                    {node.type === NodeType.TABLE && (
                        <TableNode title={node.title} data={node.data as any} loading={node.status === 'loading'} onExpand={() => onEditNode(node.id)} />
                    )}
                    {node.type === NodeType.API && (
                        <APINode title={node.title} data={node.data as any} loading={node.status === 'loading'} />
                    )}
                    {node.type === NodeType.TASK && (
                        <TaskNode title={node.title} data={node.data as any} loading={node.status === 'loading'} />
                    )}
                    {node.type === NodeType.INTEGRATION && (
                        <IntegrationNode title={node.title} data={node.data as IntegrationData} loading={node.status === 'loading'} onEdit={() => onEditNode(node.id)} />
                    )}

                    {/* Mention Badge */}
                    {isMentioned && onRemoveMention && (
                        <MentionBadge
                            nodeTitle={node.title}
                            onRemove={() => onRemoveMention(node.id)}
                        />
                    )}
                </div>
            )})}

            {/* --- PINS --- */}
            {pins.map(pin => (
                <PinMarker 
                    key={pin.id} 
                    pin={pin} 
                    scale={view.scale}
                    onClick={() => { /* Future: Open Edit */ }}
                    onDelete={() => onDeletePin?.(pin.id)}
                />
            ))}

        </div>
      </div>

      {/* --- FLOATING TOOLBAR --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl border border-slate-200 p-1.5 flex items-center gap-1 z-50 transition-transform hover:scale-105">
          <ToolbarButton 
            icon={MousePointer2} 
            active={effectiveTool === 'SELECT'} 
            onClick={() => setActiveTool('SELECT')} 
            tooltip="Select (V)"
          />
          <ToolbarButton 
            icon={Hand} 
            active={effectiveTool === 'HAND'} 
            onClick={() => setActiveTool('HAND')} 
            tooltip="Hand Tool (H / Space)"
          />
           <ToolbarButton 
            icon={MapPin} 
            active={effectiveTool === 'PIN'} 
            onClick={() => setActiveTool('PIN')} 
            tooltip="Pin Tool (P)"
          />
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          
          {/* Add Menu Group */}
          <div className="relative group">
             <button className="p-3 bg-emerald-600 text-white hover:bg-emerald-500 rounded-full transition-colors shadow-lg shadow-emerald-600/20">
                <Plus size={24} />
             </button>
             {/* Bridge */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-transparent" /> 
             {/* Hover Menu */}
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:flex flex-col gap-2 bg-white p-2 rounded-2xl shadow-xl border border-slate-100 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 after:content-[''] after:absolute after:top-full after:left-0 after:w-full after:h-4 after:bg-transparent">
                 <div className="text-[10px] font-bold text-slate-400 uppercase px-3 py-1 tracking-wider">Create Entity</div>
                 <AddMenuItem icon={BoxSelect} label="Section" onClick={() => setActiveTool('CREATE_SECTION')} active={activeTool === 'CREATE_SECTION'} />
                 <AddMenuItem icon={FileText} label="Document" onClick={() => setActiveTool('CREATE_DOCUMENT')} active={activeTool === 'CREATE_DOCUMENT'} />
                 <AddMenuItem icon={GitBranch} label="Chart" onClick={() => setActiveTool('CREATE_CHART')} active={activeTool === 'CREATE_CHART'} />
                 <AddMenuItem icon={TableIcon} label="Table" onClick={() => setActiveTool('CREATE_TABLE')} active={activeTool === 'CREATE_TABLE'} />
                 <AddMenuItem icon={Globe} label="API" onClick={() => setActiveTool('CREATE_API')} active={activeTool === 'CREATE_API'} />
                 <AddMenuItem icon={CheckSquare} label="Task" onClick={() => setActiveTool('CREATE_TASK')} active={activeTool === 'CREATE_TASK'} />
                 <AddMenuItem icon={Zap} label="Integration" onClick={() => setActiveTool('CREATE_INTEGRATION')} active={activeTool === 'CREATE_INTEGRATION'} />
             </div>
          </div>
      </div>

      {/* HUD / Controls (Zoom) */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4 pointer-events-auto z-50">
         <div className="bg-white/90 backdrop-blur shadow-xl border border-slate-200 rounded-2xl p-2 flex flex-col gap-2">
            <button onClick={zoomIn} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><Plus size={20} /></button>
            <button onClick={zoomOut} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><Minus size={20} /></button>
         </div>
         <div className="bg-slate-900/90 backdrop-blur text-white text-xs font-mono py-1.5 px-3 rounded-full shadow-lg text-center">
             {Math.round(view.scale * 100)}%
         </div>
      </div>

    </div>
  );
};

const ToolbarButton = ({ icon: Icon, active, onClick, tooltip }: { icon: any, active: boolean, onClick: () => void, tooltip: string }) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className={`p-3 rounded-full transition-all ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
    >
        <Icon size={20} />
    </button>
);

const AddMenuItem = ({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active: boolean }) => (
    <button 
        onClick={(e) => {
            onClick();
            (document.activeElement as HTMLElement)?.blur();
        }}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors w-full text-left
            ${active ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}
        `}
    >
        <Icon size={16} />
        {label}
    </button>
);
