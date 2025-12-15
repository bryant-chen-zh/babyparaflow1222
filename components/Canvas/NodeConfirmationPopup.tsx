import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Edit3, X, ChevronRight, FileText, Layout, Monitor, Table, Zap, Globe, MapPin, Pencil, FileEdit, History, Locate } from 'lucide-react';
import { CanvasNode, ConfirmationData, ConfirmationItem, NodeType } from '../../types';

interface NodeConfirmationPopupProps {
  node: CanvasNode;
  confirmationData: ConfirmationData;
  canvasScale: number;
  canvasOffset: { x: number; y: number };
  onConfirm: () => void;
  onRequestRevision: (note: string) => void;
  onLocate: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
  onClose: () => void;
}

// Get icon component for node type
const getNodeTypeIcon = (type: NodeType) => {
  switch (type) {
    case NodeType.DOCUMENT: return FileText;
    case NodeType.WHITEBOARD: return Layout;
    case NodeType.SCREEN: return Monitor;
    case NodeType.TABLE: return Table;
    case NodeType.API: return Zap;
    case NodeType.INTEGRATION: return Globe;
    default: return FileText;
  }
};

// File item row component for popup - Consistent with FileOperationCard (Neutral Colors)
const FileItemRow: React.FC<{
  item: ConfirmationItem;
  onLocate: (nodeId: string) => void;
}> = ({ item, onLocate }) => {
  const IconComponent = getNodeTypeIcon(item.nodeType);
  // Use neutral gray for icon
  const iconColor = 'text-moxt-text-2';

  return (
    <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg px-3 py-2.5 mb-2 hover:border-moxt-brand-7/50 transition-colors group">
      <div className="flex items-center gap-2.5">
        {/* Target icon */}
        <div className={`flex-shrink-0 ${iconColor}`}>
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-12 font-medium text-moxt-text-1 truncate" title={item.title}>
            {item.title}
          </div>
        </div>

        {/* Locate button - Neutral Gray */}
        <button
          onClick={() => onLocate(item.nodeId)}
          className="flex-shrink-0 p-1 hover:bg-moxt-fill-1 rounded transition-colors text-moxt-text-3 hover:text-moxt-text-2"
          title="Locate on canvas"
        >
          <Locate className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const NodeConfirmationPopup: React.FC<NodeConfirmationPopupProps> = ({
  node,
  confirmationData,
  canvasScale,
  canvasOffset,
  onConfirm,
  onRequestRevision,
  onLocate,
  onEdit,
  onClose
}) => {
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate popup position (right side of the node)
  const nodeWidth = node.width || 400;
  
  // Position the popup to the right of the node
  const popupX = (node.x + nodeWidth) * canvasScale + canvasOffset.x + 20;
  const popupY = node.y * canvasScale + canvasOffset.y;

  // Focus textarea when showing revision input
  useEffect(() => {
    if (showRevisionInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showRevisionInput]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the node itself
        const target = e.target as HTMLElement;
        if (!target.closest(`[data-id="${node.id}"]`)) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [node.id, onClose]);

  const handleRevisionSubmit = () => {
    if (revisionNote.trim()) {
      onRequestRevision(revisionNote.trim());
      setShowRevisionInput(false);
      setRevisionNote('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRevisionSubmit();
    }
    if (e.key === 'Escape') {
      if (showRevisionInput) {
        setShowRevisionInput(false);
        setRevisionNote('');
      } else {
        onClose();
      }
    }
  };

  // Handle edit directly - edit the first item
  const handleEditDirectly = () => {
    if (confirmationData.items.length > 0) {
      onEdit(confirmationData.items[0].nodeId);
    }
  };

  // Get primary node type from items for header icon
  const primaryNodeType = confirmationData.items.length > 0 
    ? confirmationData.items[0].nodeType 
    : NodeType.DOCUMENT;
  const PrimaryIcon = getNodeTypeIcon(primaryNodeType);

  return (
    <div
      ref={popupRef}
      className="fixed z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
      style={{
        left: popupX,
        top: popupY,
        maxWidth: 360,
        minWidth: 320
      }}
    >
      {/* Connector line to node */}
      <div 
        className="absolute right-full top-6 w-5 h-0.5 bg-orange-300"
        style={{ marginRight: -1 }}
      />
      
      {/* Popup Card */}
      <div className="bg-white border-2 border-orange-300 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
          <PrimaryIcon size={16} className="text-orange-600" />
          <div className="flex-1 min-w-0">
            <h3 className="text-13 font-semibold text-orange-800 truncate">
              {confirmationData.title}
            </h3>
            <p className="text-11 text-orange-600 animate-pulse">Awaiting Confirmation</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-200/50 rounded-md transition-colors"
          >
            <X size={14} className="text-orange-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Description */}
          <p className="text-12 text-moxt-text-2 leading-relaxed">
            {confirmationData.description}
          </p>

          {/* File list */}
          {confirmationData.items.length > 0 && (
            <div className="mb-3 max-h-[120px] overflow-y-auto custom-scrollbar">
              {confirmationData.items.map((item) => (
                <FileItemRow key={item.nodeId} item={item} onLocate={onLocate} />
              ))}
            </div>
          )}

          {/* Revision Note Display */}
          {confirmationData.revisionNote && (
            <div className="p-2.5 bg-gray-50 rounded-md border border-moxt-line-1 text-12 text-moxt-text-1">
              <div className="flex items-center gap-1.5 mb-1 text-moxt-text-2 font-medium text-11">
                <Edit3 size={11} />
                FEEDBACK
              </div>
              {confirmationData.revisionNote}
            </div>
          )}

          {/* Revision Input */}
          {showRevisionInput ? (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="text-11 font-medium text-moxt-text-2">
                What needs to be changed?
              </label>
              <textarea
                ref={textareaRef}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the changes you need..."
                className="w-full px-3 py-2 text-12 border border-moxt-line-1 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowRevisionInput(false); setRevisionNote(''); }}
                  className="px-3 py-1.5 text-11 font-medium text-moxt-text-2 hover:bg-moxt-fill-1 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevisionSubmit}
                  disabled={!revisionNote.trim()}
                  className="px-3 py-1.5 text-11 font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1"
                >
                  Submit
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ) : (
            /* Bottom Action Bar */
            <div className="bg-gray-50 border-t border-moxt-line-1 px-3 py-2 flex items-center justify-between -mx-3 -mb-3 mt-2">
              {/* Left Actions (Secondary) */}
              <div className="flex items-center">
                <button
                  onClick={() => setShowRevisionInput(true)}
                  className="text-11 font-medium text-moxt-text-3 hover:text-moxt-text-1 transition-colors px-2 py-1 rounded hover:bg-moxt-fill-1/50"
                >
                  Request Changes
                </button>
                <div className="w-px h-3 bg-moxt-line-1 mx-1" />
                <button
                  onClick={handleEditDirectly}
                  className="text-11 font-medium text-moxt-text-3 hover:text-moxt-text-1 transition-colors px-2 py-1 rounded hover:bg-moxt-fill-1/50"
                >
                  Edit Directly
                </button>
              </div>

              {/* Right Action (Primary) */}
              <button
                onClick={onConfirm}
                className="px-3 py-1.5 text-11 font-semibold text-white bg-moxt-brand-7 hover:bg-green-600 rounded-md transition-colors shadow-sm"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
