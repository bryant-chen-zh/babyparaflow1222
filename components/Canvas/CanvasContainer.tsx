import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { CanvasNode, NodeType, CanvasView, ScreenData, CanvasEdge, CanvasTool, CanvasSection, CanvasPin, IntegrationData, ImageData, PendingConfirmation, NodeConfirmationStatus } from '../../types';
import { DocumentNode } from './nodes/DocumentNode';
import { WhiteboardNode } from './nodes/WhiteboardNode';
import { ImageNode } from './nodes/ImageNode';
import { ScreenNode } from './nodes/ScreenNode';
import { TableNode } from './nodes/TableNode';
import { APINode } from './nodes/APINode';
import { IntegrationNode } from './nodes/IntegrationNode';
import { PinMarker } from './PinMarker';
import { MentionBadge } from './MentionBadge';
import { NodeConfirmationWidget } from './NodeConfirmationWidget';
import { MOBILE_SCREEN_WIDTH, MOBILE_SCREEN_HEIGHT, WEB_SCREEN_WIDTH, WEB_SCREEN_HEIGHT, MIN_ZOOM, MAX_ZOOM, SECTION_IDS } from '../../constants';
import { Plus, Minus, FileText, GitBranch, Smartphone, GripHorizontal, MousePointer2, Hand, BoxSelect, MapPin, Table as TableIcon, Globe, Zap, Database, Layout, Upload } from 'lucide-react';

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
  // Selection change callback
  onSelectionChange?: (selectedNodes: CanvasNode[]) => void;
  // Agent progress visualization
  currentOperatingNodeId?: string | null;
  justCreatedNodeIds?: string[];
  isObservationMode?: boolean;
  onExitObservationMode?: () => void;
  currentTaskName?: string;
  // Confirmation synced with Chat
  pendingConfirmation?: PendingConfirmation | null;
  primaryConfirmationNodeId?: string | null;  // Only this node shows the interactive widget
  confirmationStatusByNodeId?: Record<string, NodeConfirmationStatus>;
  onConfirm?: (msgId: string) => void;
  onRequestRevision?: (msgId: string, note: string) => void;
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
  emerald: { border: 'border-brand-200/60', bg: 'bg-brand-50/30', badge: 'bg-brand-100 text-moxt-brand-7', dot: 'bg-moxt-brand-7' },
  orange: { border: 'border-orange-200/50', bg: 'bg-orange-50/30', badge: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  rose: { border: 'border-rose-200/50', bg: 'bg-rose-50/30', badge: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' },
  slate: { border: 'border-moxt-line-1', bg: 'bg-moxt-fill-1/30', badge: 'bg-moxt-fill-2 text-moxt-text-2', dot: 'bg-moxt-text-3' },
};

// Helper to get dimensions for a node type
const getNodeDimensions = (node: CanvasNode) => {
    if (node.width && node.height) return { width: node.width, height: node.height }; // Manual override

    if (node.type === NodeType.SCREEN) {
         // Use node.variant first (for loading state), then fallback to data.variant
         const screenData = node.data as ScreenData;
         const isWeb = node.variant === 'web' || screenData?.variant === 'web';
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
    onRemoveMention,
    onSelectionChange,
    currentOperatingNodeId = null,
    justCreatedNodeIds = [],
    isObservationMode = false,
    onExitObservationMode,
    currentTaskName,
    pendingConfirmation,
    primaryConfirmationNodeId,
    confirmationStatusByNodeId = {},
    onConfirm,
    onRequestRevision
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // --- Interaction State ---
  const [activeTool, setActiveTool] = useState<CanvasTool>('SELECT');
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [ghostBox, setGhostBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  // RAF refs for smooth animation
  const rafRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Section Metadata State
  const [sectionSettings, setSectionSettings] = useState<Record<string, { title: string, theme: SectionTheme }>>({
      [SECTION_IDS.DOCUMENT]: { title: 'Documents & Specs', theme: 'blue' },
      [SECTION_IDS.CHART]: { title: 'Logic & Flow', theme: 'purple' },
      [SECTION_IDS.SCREEN]: { title: 'Prototype', theme: 'emerald' },
      [SECTION_IDS.BACKEND]: { title: 'Backend Development', theme: 'orange' },
  });

  const [manualSections, setManualSections] = useState<CanvasSection[]>([]);

  // File input ref for import functionality
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file import
  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const GAP = 40;
    const centerScreenX = rect.width / 2;
    const centerScreenY = rect.height / 2;
    const canvasCenterX = (centerScreenX - view.x) / view.scale;
    const canvasCenterY = (centerScreenY - view.y) / view.scale;

    // Process each file
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');
      const isMarkdown = file.name.endsWith('.md') || file.type === 'text/markdown';

      reader.onload = (e) => {
        const result = e.target?.result;
        if (!result) return;

        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Find all existing nodes (documents, whiteboards, images) to avoid overlap
        const allNodes = nodes.filter(n => 
          n.type === NodeType.DOCUMENT || n.type === NodeType.WHITEBOARD || n.type === NodeType.IMAGE
        );

        let newX: number;
        let newY: number;

        if (isImage) {
          // Image node dimensions
          const width = 400;
          const height = 350;

          if (allNodes.length === 0) {
            newX = canvasCenterX - width / 2;
            newY = canvasCenterY - height / 2;
          } else {
            const rightmost = allNodes.reduce((prev, curr) => {
              const prevRight = prev.x + (prev.width || 450);
              const currRight = curr.x + (curr.width || 450);
              return currRight > prevRight ? curr : prev;
            });
            const topmostY = Math.min(...allNodes.map(n => n.y));
            newX = rightmost.x + (rightmost.width || 450) + GAP + (index * (width + GAP));
            newY = topmostY;
          }

          const imageNode: CanvasNode = {
            id: nodeId,
            type: NodeType.IMAGE,
            x: newX,
            y: newY,
            width,
            height,
            title: file.name,
            status: 'done',
            data: {
              src: result as string,
              fileName: file.name,
              fileSize: file.size
            } as ImageData
          };

          onAddNode(imageNode);

          // Center view on new node
          const newViewX = centerScreenX - (newX + width / 2) * view.scale;
          const newViewY = centerScreenY - (newY + height / 2) * view.scale;
          onViewChange({ ...view, x: newViewX, y: newViewY });

        } else if (isMarkdown) {
          // Document node dimensions
          const width = 450;
          const height = 550;

          if (allNodes.length === 0) {
            newX = canvasCenterX - width / 2;
            newY = canvasCenterY - height / 2;
          } else {
            const rightmost = allNodes.reduce((prev, curr) => {
              const prevRight = prev.x + (prev.width || 450);
              const currRight = curr.x + (curr.width || 450);
              return currRight > prevRight ? curr : prev;
            });
            const topmostY = Math.min(...allNodes.map(n => n.y));
            newX = rightmost.x + (rightmost.width || 450) + GAP + (index * (width + GAP));
            newY = topmostY;
          }

          const documentNode: CanvasNode = {
            id: nodeId,
            type: NodeType.DOCUMENT,
            x: newX,
            y: newY,
            width,
            height,
            title: file.name,
            status: 'done',
            data: {
              content: result as string
            }
          };

          onAddNode(documentNode);

          // Center view on new node
          const newViewX = centerScreenX - (newX + width / 2) * view.scale;
          const newViewY = centerScreenY - (newY + height / 2) * view.scale;
          onViewChange({ ...view, x: newViewX, y: newViewY });
        }
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else if (isMarkdown) {
        reader.readAsText(file);
      }
    });

    // Reset file input
    event.target.value = '';
  }, [nodes, view, onAddNode, onViewChange]);

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Helper function to create a node directly at the center of the visible canvas
  // If same-type nodes exist, place new node to the right of the rightmost one
  const createNodeAtCenter = (type: 'document' | 'whiteboard' | 'section') => {
    // Get container dimensions
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const GAP = 40; // Gap between nodes
    
    // Calculate center of visible area in canvas coordinates
    const centerScreenX = rect.width / 2;
    const centerScreenY = rect.height / 2;
    
    // Convert screen coordinates to canvas coordinates (for first node placement)
    const canvasCenterX = (centerScreenX - view.x) / view.scale;
    const canvasCenterY = (centerScreenY - view.y) / view.scale;
    
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (type === 'section') {
      // Find existing manual sections
      const existingSections = manualSections;
      const sectionWidth = 400;
      const sectionHeight = 300;
      
      let newX: number;
      let newY: number;
      
      if (existingSections.length === 0) {
        // First section: place at center
        newX = canvasCenterX - sectionWidth / 2;
        newY = canvasCenterY - sectionHeight / 2;
      } else {
        // Find rightmost section
        const rightmost = existingSections.reduce((prev, curr) => 
          (curr.x + curr.width) > (prev.x + prev.width) ? curr : prev
        );
        newX = rightmost.x + rightmost.width + GAP;
        newY = rightmost.y; // Same Y position
      }
      
      const newSection: CanvasSection = {
        id: `section-${Date.now()}`,
        x: newX,
        y: newY,
        width: sectionWidth,
        height: sectionHeight,
        title: 'New Section',
        theme: 'slate'
      };
      setManualSections(prev => [...prev, newSection]);
      
      // Move canvas view to center on new section
      const newCenterX = newX + sectionWidth / 2;
      const newCenterY = newY + sectionHeight / 2;
      const newViewX = centerScreenX - newCenterX * view.scale;
      const newViewY = centerScreenY - newCenterY * view.scale;
      onViewChange({ ...view, x: newViewX, y: newViewY });
      
    } else {
      // Create a node
      let nodeType: NodeType;
      let title: string;
      let data: any;
      let width: number;
      let height: number;
      
      if (type === 'document') {
        nodeType = NodeType.DOCUMENT;
        title = 'document.md';
        data = { content: '' };
        width = 450;
        height = 550;
      } else {
        nodeType = NodeType.WHITEBOARD;
        title = 'whiteboard';
        data = { elements: [] };
        width = 850;
        height = 700;
      }
      
      // Find ALL existing nodes (documents and whiteboards) to avoid overlap
      const allNodes = nodes.filter(n => n.type === NodeType.DOCUMENT || n.type === NodeType.WHITEBOARD);
      
      let newX: number;
      let newY: number;
      
      if (allNodes.length === 0) {
        // First node: place at center
        newX = canvasCenterX - width / 2;
        newY = canvasCenterY - height / 2;
      } else {
        // Find the rightmost node among ALL nodes (to avoid overlap between different types)
        const rightmost = allNodes.reduce((prev, curr) => {
          const prevRight = prev.x + (prev.width || 450);
          const currRight = curr.x + (curr.width || 450);
          return currRight > prevRight ? curr : prev;
        });
        
        // Find the topmost Y (smallest Y value) for top alignment
        const topmostY = Math.min(...allNodes.map(n => n.y));
        
        const rightmostWidth = rightmost.width || 450;
        newX = rightmost.x + rightmostWidth + GAP;
        // Use top alignment - all nodes share the same top Y position
        newY = topmostY;
      }
      
      const newNode: CanvasNode = {
        id: nodeId,
        type: nodeType,
        x: newX,
        y: newY,
        width,
        height,
        title,
        status: 'done',
        data
      };
      
      onAddNode(newNode);
      
      // Move canvas view to center on new node
      const newCenterX = newX + width / 2;
      const newCenterY = newY + height / 2;
      const newViewX = centerScreenX - newCenterX * view.scale;
      const newViewY = centerScreenY - newCenterY * view.scale;
      onViewChange({ ...view, x: newViewX, y: newViewY });
    }
  };

  // Node/Section Dragging State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Selection & Hover State
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number, y: number } | null>(null);

  // Notify parent when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
      onSelectionChange(selectedNodes);
    }
  }, [selectedNodeIds, nodes, onSelectionChange]);

  // Track previous operating node to auto-select it when generation completes
  const prevOperatingNodeIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // When currentOperatingNodeId changes
    if (currentOperatingNodeId !== prevOperatingNodeIdRef.current) {
      const prevId = prevOperatingNodeIdRef.current;
      
      // Case 1: A node just finished (currentOperatingNodeId became null)
      // -> Select the previous node
      if (prevId && !currentOperatingNodeId) {
        setSelectedNodeIds([prevId]);
      }
      
      // Case 2: A new node started generating (currentOperatingNodeId became a new ID)
      // -> Clear selection (the new node will have the operating border)
      if (currentOperatingNodeId) {
        setSelectedNodeIds([]);
      }
      
      // Update ref
      prevOperatingNodeIdRef.current = currentOperatingNodeId;
    }
  }, [currentOperatingNodeId]);

  // Close add menu when clicking outside
  useEffect(() => {
    if (!isAddMenuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    
    // Use setTimeout to avoid immediate trigger from the same click that opened the menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isAddMenuOpen]);

  // Calculate Auto Sections
  const docNodes = useMemo(() => nodes.filter(n => n.sectionId === SECTION_IDS.DOCUMENT), [nodes]);
  const chartNodes = useMemo(() => nodes.filter(n => n.sectionId === SECTION_IDS.CHART), [nodes]);
  const screenNodes = useMemo(() => nodes.filter(n => n.sectionId === SECTION_IDS.SCREEN), [nodes]);
  const backendNodes = useMemo(() => nodes.filter(n => n.sectionId === SECTION_IDS.BACKEND), [nodes]);

  const docBounds = useMemo(() => getSectionBounds(docNodes), [docNodes]);
  const chartBounds = useMemo(() => getSectionBounds(chartNodes), [chartNodes]);
  const screenBounds = useMemo(() => getSectionBounds(screenNodes), [screenNodes]);
  const backendBounds = useMemo(() => getSectionBounds(backendNodes, 120), [backendNodes]);

  // Calculate bounding box for pending confirmation nodes
  const pendingConfirmationBounds = useMemo(() => {
    if (!pendingConfirmation || pendingConfirmation.items.length === 0) return null;
    const confirmationNodeIds = pendingConfirmation.items.map(item => item.nodeId);
    const confirmationNodes = nodes.filter(n => confirmationNodeIds.includes(n.id));
    if (confirmationNodes.length === 0) return null;
    return getSectionBounds(confirmationNodes, 0); // No padding, tight to nodes
  }, [pendingConfirmation, nodes]);

  // --- Auto-Center Logic for Observation Mode ---
  useEffect(() => {
    if (isObservationMode && currentOperatingNodeId && containerRef.current) {
        const node = nodes.find(n => n.id === currentOperatingNodeId);
        if (node) {
            const { width, height } = getNodeDimensions(node);
            const containerW = containerRef.current.clientWidth;
            const containerH = containerRef.current.clientHeight;

            // Target Ratio: Node should take up about 60% of the screen
            const targetRatio = 0.6;
            
            const scaleByWidth = (containerW * targetRatio) / width;
            const scaleByHeight = (containerH * targetRatio) / height;
            
            let targetScale = Math.min(scaleByWidth, scaleByHeight);
            targetScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetScale));

            const nodeCenterX = node.x + width / 2;
            const nodeCenterY = node.y + height / 2;

            // view.x = (containerW / 2) - nodeCenterX * targetScale
            const newX = (containerW / 2) - (nodeCenterX * targetScale);
            const newY = (containerH / 2) - (nodeCenterY * targetScale);

            // Update only if significant change to prevent loops
            if (
                Math.abs(view.x - newX) > 1 || 
                Math.abs(view.y - newY) > 1 || 
                Math.abs(view.scale - targetScale) > 0.001
            ) {
                onViewChange({ x: newX, y: newY, scale: targetScale });
            }
        }
    }
  }, [isObservationMode, currentOperatingNodeId, nodes, view, onViewChange]);

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
    // Exit observation mode when user manually zooms
    if (isObservationMode) {
      onExitObservationMode?.();
    }
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
    // Exit observation mode when user manually zooms
    if (isObservationMode) {
      onExitObservationMode?.();
    }
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
  }, [view, selectedNodeIds, isObservationMode, onExitObservationMode]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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
    if (['CREATE_SECTION', 'CREATE_DOCUMENT', 'CREATE_CHART', 'CREATE_TABLE', 'CREATE_API', 'CREATE_INTEGRATION'].includes(effectiveTool)) {
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
    // Exit observation mode when user starts panning
    if (isObservationMode) {
      onExitObservationMode?.();
    }
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
    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Store event properties (React events are pooled)
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Use RAF to sync with browser refresh rate
    rafRef.current = requestAnimationFrame(() => {
      const currentPos = getCanvasCoords(clientX, clientY);

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
        const dx = clientX - lastMousePos.x;
        const dy = clientY - lastMousePos.y;
        onViewChange({ ...view, x: view.x + dx, y: view.y + dy });
        setLastMousePos({ x: clientX, y: clientY });
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
    });
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
                    title = 'document.md';
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

  // Use ref to store latest view and callbacks for the native event handler
  const viewRef = useRef(view);
  const onViewChangeRef = useRef(onViewChange);
  const isObservationModeRef = useRef(isObservationMode);
  const onExitObservationModeRef = useRef(onExitObservationMode);
  
  useEffect(() => {
    viewRef.current = view;
    onViewChangeRef.current = onViewChange;
    isObservationModeRef.current = isObservationMode;
    onExitObservationModeRef.current = onExitObservationMode;
  }, [view, onViewChange, isObservationMode, onExitObservationMode]);

  // Native wheel event handler (allows preventDefault with passive: false)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Exit observation mode on any wheel interaction (pan or zoom)
      if (isObservationModeRef.current) {
        onExitObservationModeRef.current?.();
      }
      
      // Pinch-to-zoom: browser converts it to wheel event with ctrlKey
      if (e.ctrlKey || e.metaKey) {
        // CRITICAL: Prevent browser's native page zoom
        e.preventDefault();
        
        const currentView = viewRef.current;
        const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentView.scale - e.deltaY * 0.001));
        
        // Zoom around viewport center (not mouse position)
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        
        // Calculate canvas point at viewport center before zoom
        const canvasX = (centerX - currentView.x) / currentView.scale;
        const canvasY = (centerY - currentView.y) / currentView.scale;
        
        // Calculate new view position to keep canvas point at viewport center
        const newX = centerX - canvasX * newScale;
        const newY = centerY - canvasY * newScale;
        
        onViewChangeRef.current({ x: newX, y: newY, scale: newScale });
      } else {
        // Normal scroll: pan the canvas
        const currentView = viewRef.current;
        onViewChangeRef.current({ ...currentView, x: currentView.x - e.deltaX, y: currentView.y - e.deltaY });
      }
    };

    // Safari-specific: gesturestart/gesturechange for pinch gestures
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    const handleGestureChange = (e: Event) => {
      e.preventDefault();
    };

    // Add event listeners with { passive: false } to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('gesturestart', handleGestureStart, { passive: false });
    container.addEventListener('gesturechange', handleGestureChange, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('gesturestart', handleGestureStart);
      container.removeEventListener('gesturechange', handleGestureChange);
    };
  }, []); // Empty deps - handler uses refs for latest values

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
    <>
      {/* Hidden file input for import functionality */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        multiple
        onChange={handleFileImport}
        className="hidden"
      />
      
      <div 
        ref={containerRef}
        className={`w-full h-full bg-moxt-theme-bg overflow-hidden relative canvas-grid
          ${effectiveTool === 'HAND' || isDraggingCanvas ? 'cursor-grab active:cursor-grabbing' : ''}
          ${effectiveTool === 'SELECT' && !isDraggingCanvas ? 'cursor-default' : ''}
          ${['CREATE_SECTION', 'CREATE_DOCUMENT', 'CREATE_CHART', 'CREATE_TABLE', 'CREATE_API', 'CREATE_INTEGRATION'].includes(effectiveTool) ? 'cursor-crosshair' : ''}
          ${effectiveTool === 'PIN' ? 'cursor-copy' : ''}
        `}
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
      {/* Observation Mode Border Overlay - Always on top */}
      {isObservationMode && (
        <div className="absolute inset-0 pointer-events-none z-[9999] border-[3px] border-moxt-brand-7" />
      )}
      <div
        className={`absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none ${!isDraggingCanvas ? 'transition-transform duration-150 ease-out' : ''}`}
        style={{
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          willChange: isDraggingCanvas ? 'transform' : 'auto',
          backfaceVisibility: 'hidden'
        }}
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
                    className="absolute border-2 border-moxt-brand-7 bg-moxt-brand-7/10 rounded-lg z-50"
                    style={{ left: ghostBox.x, top: ghostBox.y, width: ghostBox.w, height: ghostBox.h }}
                />
            )}

            {/* --- EDGES --- */}
            <svg className="absolute top-0 left-0 w-full h-full overflow-visible z-0 pointer-events-none">
                {renderEdges()}
            </svg>

            {/* --- NODES --- */}
            {nodes.map((node, index) => {
                const dims = getNodeDimensions(node);
                const isSelected = selectedNodeIds.includes(node.id);
                const isMentioned = mentionedNodeIds.includes(node.id);
                const isHovered = hoveredNodeId === node.id && !isSelected && !isMentioned;
                const isHoveredInSelectionMode = isCanvasSelectionMode && hoveredNodeId === node.id;
                const isDragging = draggedNodeId === node.id;
                const isOperating = currentOperatingNodeId === node.id;
                const isJustCreated = justCreatedNodeIds.includes(node.id);
                const nodeConfirmStatus = confirmationStatusByNodeId[node.id]?.status;

                // 动态计算 z-index：基础层级 + 交互状态提升
                // 基础层级：按数组顺序，后创建的节点在上层
                // 交互提升：选中/拖动/操作中的节点提升到最上层
                let zIndex = 10 + index; // 基础层级
                if (isHovered) zIndex = 100 + index;
                if (isSelected) zIndex = 200 + index;
                if (isMentioned) zIndex = 300 + index;
                if (isDragging) zIndex = 400;
                if (isOperating) zIndex = 500;
                if (nodeConfirmStatus === 'pending') zIndex = 600; // Pending confirmation nodes on top

                const showActiveBorder = isOperating;

                return (
                <div
                    key={node.id}
                    data-id={node.id}
                    className={`canvas-node absolute shadow-sm rounded-lg bg-moxt-fill-white
                        ${showActiveBorder ? 'border-2 border-moxt-brand-7 shadow-[0_0_20px_rgba(0,191,75,0.2)]' : 'border border-moxt-line-1'}
                        ${!isDragging && !isJustCreated ? 'transition-all duration-200' : ''}
                        ${node.type === NodeType.SCREEN || isMentioned || isOperating || nodeConfirmStatus === 'pending' ? 'overflow-visible' : 'overflow-hidden'}
                        ${!showActiveBorder && isHovered ? 'outline outline-2 outline-moxt-brand-7/50 shadow-lg' : ''}
                        ${!showActiveBorder && isHoveredInSelectionMode ? 'outline outline-2 outline-blue-500/50 shadow-lg' : ''}
                        ${!showActiveBorder && isSelected ? 'outline outline-2 outline-moxt-brand-7' : ''}
                        ${!showActiveBorder && isMentioned ? 'outline outline-2 outline-blue-500' : ''}
                        ${isDragging ? 'scale-[1.01] cursor-grabbing' : ''}
                        ${isCanvasSelectionMode ? 'cursor-pointer' : ''}
                        ${isJustCreated ? 'node-just-created' : ''}
                        ${nodeConfirmStatus === 'pending' ? 'outline outline-2 outline-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.3)]' : ''}
                    `}
                    style={{
                        left: node.x,
                        top: node.y,
                        width: dims.width,
                        height: dims.height,
                        zIndex,
                        willChange: isDragging ? 'transform' : 'auto'
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                >
                    {/* Observation/Generating Tab - Fixed size (counter-scaled) */}
                    {showActiveBorder && (
                        <div 
                            className="absolute left-[6px] flex items-center z-50 origin-bottom-left"
                            style={{
                                top: -34 / view.scale,
                                transform: `scale(${1 / view.scale})`
                            }}
                        >
                             <div className="bg-moxt-brand-7 text-white text-xs font-medium px-3 py-1.5 rounded-t-lg shadow-sm whitespace-nowrap flex items-center gap-2">
                                 Paraflow is working
                             </div>
                        </div>
                    )}
                    {node.type === NodeType.DOCUMENT && (
                        <DocumentNode title={node.title} data={node.data as any} loading={node.status === 'loading'} onEdit={() => onEditNode(node.id)} />
                    )}
                    {node.type === NodeType.WHITEBOARD && (
                        <WhiteboardNode title={node.title} data={node.data as any} loading={node.status === 'loading'} onEdit={() => onEditNode(node.id)} />
                    )}
                    {node.type === NodeType.IMAGE && (
                        <ImageNode title={node.title} data={node.data as ImageData} loading={node.status === 'loading'} />
                    )}
                    {node.type === NodeType.SCREEN && (
                        <ScreenNode
                            title={node.title}
                            data={node.data as any}
                            loading={node.status === 'loading'}
                            variant={node.variant || 'web'}
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
                    {node.type === NodeType.INTEGRATION && (
                        <IntegrationNode title={node.title} data={node.data as IntegrationData} loading={node.status === 'loading'} onEdit={() => onEditNode(node.id)} />
                    )}

                    {/* Mention Badge - Fixed size (counter-scaled) */}
                    {isMentioned && onRemoveMention && (
                        <MentionBadge
                            nodeTitle={node.title}
                            onRemove={() => onRemoveMention(node.id)}
                            scale={view.scale}
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

            {/* --- FLOATING CONFIRMATION WIDGET --- */}
            {/* Positioned at top-center of all pending confirmation nodes - Fixed size (counter-scaled) */}
            {pendingConfirmationBounds && pendingConfirmation && onConfirm && onRequestRevision && (
                <div
                    className="absolute z-[600] origin-bottom"
                    style={{
                        left: pendingConfirmationBounds.x + (pendingConfirmationBounds.width / 2),
                        top: pendingConfirmationBounds.y - (8 / view.scale),
                        transform: `translate(-50%, -100%) scale(${1 / view.scale})`
                    }}
                >
                    <NodeConfirmationWidget
                        msgId={pendingConfirmation.msgId}
                        title={pendingConfirmation.title}
                        status="pending"
                        intent={pendingConfirmation.intent}
                        primaryActionLabel={pendingConfirmation.primaryActionLabel}
                        onConfirm={onConfirm}
                        onRequestRevision={onRequestRevision}
                    />
                </div>
            )}

        </div>
      </div>


      {/* --- FLOATING TOOLBAR --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-moxt-fill-white rounded-full shadow-lg border border-moxt-line-1 p-1 flex items-center gap-0.5 z-50 transition-transform hover:scale-[1.02]">
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
          <div className="w-px h-5 bg-moxt-line-1 mx-1"></div>
          
          {/* Add Menu Group */}
          <div className="relative" ref={addMenuRef}>
             <button 
               onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
               className={`p-2.5 bg-moxt-brand-7 text-white hover:opacity-90 rounded-full transition-colors ${isAddMenuOpen ? 'ring-2 ring-moxt-brand-7/30' : ''}`}
             >
                <Plus size={20} />
             </button>
             {/* Menu */}
             {isAddMenuOpen && (
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex flex-col gap-1 bg-moxt-fill-white p-2 rounded-lg shadow-lg border border-moxt-line-1 min-w-[260px] animate-in fade-in slide-in-from-bottom-2 z-50">
                 {/* Create Group */}
                 <div className="text-[10px] font-medium text-moxt-text-4 px-3 py-1.5 tracking-wider">Create</div>
                 <AddMenuItem icon={FileText} label="Document" onClick={() => { createNodeAtCenter('document'); setIsAddMenuOpen(false); }} active={false} />
                 <AddMenuItem icon={Layout} label="Whiteboard" onClick={() => { createNodeAtCenter('whiteboard'); setIsAddMenuOpen(false); }} active={false} />
                 <AddMenuItem icon={BoxSelect} label="Section" onClick={() => { createNodeAtCenter('section'); setIsAddMenuOpen(false); }} active={false} />
                 
                 {/* Divider */}
                 <div className="h-px bg-moxt-line-1 my-1 mx-2"></div>
                 
                 {/* Import Group */}
                 <div className="text-[10px] font-medium text-moxt-text-4 px-3 py-1.5 tracking-wider">Import</div>
                 <AddMenuItem icon={Upload} label="Files (Markdown, image and whiteboard)" onClick={() => { openFilePicker(); setIsAddMenuOpen(false); }} active={false} />
                 <AddMenuItem icon={NotionIcon} label="Notion" onClick={() => { setIsAddMenuOpen(false); }} active={false} />
               </div>
             )}
          </div>
      </div>

      {/* HUD / Controls (Zoom) */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2 pointer-events-auto z-50">
         <div className="bg-moxt-fill-white/95 backdrop-blur shadow-md border border-moxt-line-1 rounded-lg p-1.5 flex flex-col gap-1">
            <button onClick={zoomIn} className="p-1.5 hover:bg-moxt-fill-1 rounded-md text-moxt-text-2 transition-colors"><Plus size={18} /></button>
            <button onClick={zoomOut} className="p-1.5 hover:bg-moxt-fill-1 rounded-md text-moxt-text-2 transition-colors"><Minus size={18} /></button>
         </div>
         <div className="bg-moxt-text-1/90 backdrop-blur text-white text-12 font-mono py-1 px-2.5 rounded-md shadow-md text-center">
             {Math.round(view.scale * 100)}%
         </div>
      </div>

    </div>
    </>
  );
};

// Official Notion Icon
const NotionIcon = ({ size = 14 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    fillRule="evenodd"
    clipRule="evenodd"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15.257.055l-13.31.98C.874 1.128.5 1.83.5 2.667v14.559c0 .654.233 1.213.794 1.96l3.129 4.06c.513.653.98.794 1.962.745l15.457-.932c1.307-.093 1.681-.7 1.681-1.727V4.954c0-.53-.21-.684-.829-1.135l-.106-.078L18.34.755c-1.027-.746-1.45-.84-3.083-.7zm-8.521 4.63c-1.263.086-1.549.105-2.266-.477L2.647 2.76c-.186-.187-.092-.42.375-.466l12.796-.933c1.074-.094 1.634.28 2.054.606l2.195 1.587c.093.047.326.326.047.326l-13.216.794-.162.01zM5.263 21.193V7.287c0-.606.187-.886.748-.933l15.176-.886c.515-.047.748.28.748.886v13.81c0 .609-.093 1.122-.934 1.168l-14.523.84c-.842.047-1.215-.232-1.215-.98zm14.338-13.16c.093.422 0 .842-.422.89l-.699.139v10.264c-.608.327-1.168.513-1.635.513-.747 0-.934-.232-1.495-.932l-4.576-7.185v6.952l1.448.327s0 .84-1.169.84l-3.221.186c-.094-.187 0-.654.327-.747l.84-.232V9.853L7.832 9.76c-.093-.42.14-1.026.794-1.073l3.456-.232 4.763 7.279v-6.44l-1.214-.14c-.094-.513.28-.887.747-.933l3.223-.187z"/>
  </svg>
);

const ToolbarButton = ({ icon: Icon, active, onClick, tooltip }: { icon: any, active: boolean, onClick: () => void, tooltip: string }) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className={`p-2.5 rounded-full transition-all ${active ? 'bg-moxt-text-1 text-white' : 'text-moxt-text-3 hover:bg-moxt-fill-1 hover:text-moxt-text-1'}`}
    >
        <Icon size={18} />
    </button>
);

const AddMenuItem = ({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active: boolean }) => (
    <button 
        onClick={(e) => {
            onClick();
            (document.activeElement as HTMLElement)?.blur();
        }}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-13 font-medium transition-colors w-full text-left
            ${active ? 'bg-moxt-fill-1 text-moxt-brand-7' : 'hover:bg-moxt-fill-opacity-1 text-moxt-text-2'}
        `}
    >
        <Icon size={14} />
        {label}
    </button>
);
