import React, { useState } from 'react';
import { CheckCircle, AlertCircle, MapPin, ChevronDown, ChevronUp, Edit3, X } from 'lucide-react';
import { ConfirmationData, NodeType } from '../../types';

interface ConfirmationCardProps {
  data: ConfirmationData;
  onConfirm: () => void;
  onRequestRevision: (note: string) => void;
  onLocate: () => void;
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

// Get friendly name for node type
const getNodeTypeName = (type: NodeType): string => {
  switch (type) {
    case NodeType.DOCUMENT: return 'Document';
    case NodeType.WHITEBOARD: return 'Whiteboard';
    case NodeType.SCREEN: return 'Screen';
    case NodeType.TABLE: return 'Table';
    case NodeType.INTEGRATION: return 'Integration';
    default: return 'Node';
  }
};

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  data,
  onConfirm,
  onRequestRevision,
  onLocate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

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
      setShowRevisionInput(false);
      setRevisionNote('');
    }
  };

  // Collapsed state (after confirmation)
  if (data.status === 'confirmed' && !isExpanded) {
    return (
      <div 
        className="flex items-center gap-2 py-2 px-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <CheckCircle size={16} className="text-green-600" />
        <span className="text-13 font-medium text-green-700">{data.title}</span>
        <span className="text-12 text-green-500">- Confirmed</span>
        <ChevronDown size={14} className="text-green-500 ml-auto" />
      </div>
    );
  }

  // Revision requested state
  if (data.status === 'revision_requested') {
    return (
      <div className="border border-red-200 rounded-lg overflow-hidden bg-white">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border-b border-red-200">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-13 font-semibold text-red-700">{data.title}</span>
          <span className="text-12 text-red-500 ml-auto">Revision Requested</span>
        </div>
        <div className="p-3">
          <p className="text-12 text-moxt-text-2 mb-2">{data.summary}</p>
          {data.revisionNote && (
            <div className="p-2 bg-red-50 rounded border border-red-100 text-12 text-red-700">
              <strong>Note:</strong> {data.revisionNote}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Confirmed expanded state
  if (data.status === 'confirmed') {
    return (
      <div className="border border-green-200 rounded-lg overflow-hidden bg-white">
        <div 
          className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border-b border-green-200 cursor-pointer"
          onClick={() => setIsExpanded(false)}
        >
          <CheckCircle size={16} className="text-green-600" />
          <span className="text-13 font-semibold text-green-700">{data.title}</span>
          <span className="text-12 text-green-500 ml-auto">Confirmed</span>
          <ChevronUp size={14} className="text-green-500" />
        </div>
        <div className="p-3">
          <p className="text-12 text-moxt-text-2">{data.summary}</p>
        </div>
      </div>
    );
  }

  // Pending state (awaiting confirmation)
  return (
    <div className="border border-orange-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 border-b border-orange-200">
        <span className="text-base">{getNodeTypeIcon(data.targetNodeType)}</span>
        <span className="text-13 font-semibold text-orange-700">{data.title}</span>
        <span className="text-12 text-orange-500 ml-auto animate-pulse">Awaiting Confirmation</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        <p className="text-12 text-moxt-text-2">{data.summary}</p>

        {/* Action buttons row 1 */}
        <div className="flex gap-2">
          <button
            onClick={onLocate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-medium text-moxt-text-2 bg-moxt-fill-1 hover:bg-moxt-fill-2 rounded-lg transition-colors"
          >
            <MapPin size={12} />
            Locate on Canvas
          </button>
        </div>

        {/* Revision input (conditionally shown) */}
        {showRevisionInput && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-12 font-medium text-moxt-text-2">What needs to be changed?</label>
              <button 
                onClick={() => { setShowRevisionInput(false); setRevisionNote(''); }}
                className="p-1 hover:bg-moxt-fill-1 rounded"
              >
                <X size={14} className="text-moxt-text-3" />
              </button>
            </div>
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the changes you need..."
              className="w-full px-3 py-2 text-12 border border-moxt-line-1 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRevisionInput(false); setRevisionNote(''); }}
                className="px-3 py-1.5 text-12 font-medium text-moxt-text-2 hover:bg-moxt-fill-1 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevisionSubmit}
                disabled={!revisionNote.trim()}
                className="px-3 py-1.5 text-12 font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Action buttons row 2 */}
        {!showRevisionInput && (
          <div className="flex gap-2 pt-1 border-t border-moxt-line-1">
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-12 font-semibold text-white bg-moxt-brand-7 hover:bg-green-600 rounded-lg transition-colors"
            >
              <CheckCircle size={14} />
              Confirm & Continue
            </button>
            <button
              onClick={() => setShowRevisionInput(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-12 font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
            >
              <Edit3 size={14} />
              Request Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
