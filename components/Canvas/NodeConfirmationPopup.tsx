import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Edit3, X, ChevronRight } from 'lucide-react';
import { CanvasNode, ConfirmationData, NodeType } from '../../types';

interface NodeConfirmationPopupProps {
  node: CanvasNode;
  confirmationData: ConfirmationData;
  canvasScale: number;
  canvasOffset: { x: number; y: number };
  onConfirm: () => void;
  onRequestRevision: (note: string) => void;
  onClose: () => void;
}

// Get icon for node type
const getNodeTypeIcon = (type: NodeType): string => {
  switch (type) {
    case NodeType.DOCUMENT: return '📄';
    case NodeType.WHITEBOARD: return '🎨';
    case NodeType.SCREEN: return '📱';
    case NodeType.TABLE: return '🗄️';
    case NodeType.INTEGRATION: return '⚡';
    default: return '📦';
  }
};

export const NodeConfirmationPopup: React.FC<NodeConfirmationPopupProps> = ({
  node,
  confirmationData,
  canvasScale,
  canvasOffset,
  onConfirm,
  onRequestRevision,
  onClose
}) => {
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate popup position (right side of the node)
  const nodeWidth = node.width || 400;
  const nodeHeight = node.height || 300;
  
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

  return (
    <div
      ref={popupRef}
      className="fixed z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
      style={{
        left: popupX,
        top: popupY,
        maxWidth: 320,
        minWidth: 280
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
          <span className="text-lg">{getNodeTypeIcon(confirmationData.targetNodeType)}</span>
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
          <p className="text-12 text-moxt-text-2 leading-relaxed">
            {confirmationData.summary}
          </p>

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
            /* Action Buttons */
            <div className="flex gap-2">
              <button
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-12 font-semibold text-white bg-moxt-brand-7 hover:bg-green-600 rounded-lg transition-colors shadow-sm"
              >
                <CheckCircle size={14} />
                Confirm
              </button>
              <button
                onClick={() => setShowRevisionInput(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-12 font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
              >
                <Edit3 size={14} />
                Revise
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

