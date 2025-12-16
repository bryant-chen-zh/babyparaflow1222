import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, MapPin, Edit3, X, FileText, Layout, Monitor, Table, Zap, Globe, Pencil, ChevronRight, FileEdit, History, Locate } from 'lucide-react';
import { ConfirmationData, ConfirmationItem, NodeType } from '../../types';

interface ConfirmationCardProps {
  data: ConfirmationData;
  onConfirm: () => void;
  onRequestRevision: (note: string) => void;
  onLocate: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
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

// File item row component - Consistent with FileOperationCard (Neutral Colors)
const FileItemRow: React.FC<{
  item: ConfirmationItem;
  onLocate: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
}> = ({ item, onLocate, onEdit }) => {
  const IconComponent = getNodeTypeIcon(item.nodeType);
  // Use neutral gray for icon, matching FileOperationCard
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
          {item.preview && (
             <div className="text-[10px] text-moxt-text-4 truncate mt-0.5">
               {item.preview}
             </div>
          )}
        </div>

        {/* Edit button - Neutral Gray */}
        <button
          onClick={() => onEdit(item.nodeId)}
          className="flex-shrink-0 p-1 hover:bg-moxt-fill-1 rounded transition-colors text-moxt-text-3 hover:text-moxt-text-2"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

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

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  data,
  onConfirm,
  onRequestRevision,
  onLocate,
  onEdit
}) => {
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

  // --- Render Helpers based on Status ---

  const getHeaderStyles = () => {
    switch (data.status) {
      case 'confirmed':
        return {
          container: 'bg-green-50/30 border-b border-green-100/50',
          icon: <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />,
          badge: <span className="text-11 px-1.5 py-0.5 rounded bg-green-50 text-green-700 ml-auto font-medium">Confirmed</span>
        };
      case 'revision_requested':
        return {
          container: 'bg-gray-50/50 border-b border-moxt-line-1',
          icon: <History size={16} className="text-moxt-text-3 flex-shrink-0" />,
          badge: <span className="text-11 px-1.5 py-0.5 rounded bg-gray-100 text-moxt-text-2 ml-auto font-medium">Asked for Changes</span>
        };
      default: // pending
        return {
          container: 'border-b border-moxt-line-1/50',
          icon: (
            <div className="w-4 h-4 rounded-full border border-moxt-brand-7 flex items-center justify-center flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-moxt-brand-7 animate-pulse" />
            </div>
          ),
          badge: null // No badge for pending as it's the default state
        };
    }
  };

  const headerStyles = getHeaderStyles();

  return (
    <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg mb-4 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 ${headerStyles.container}`}>
        {headerStyles.icon}
        <span className="text-13 font-semibold text-moxt-text-1">{data.title}</span>
        {headerStyles.badge}
      </div>

      {/* Content */}
      <div className="px-3 py-3 pb-0">
        {/* Description */}
        <p className="text-12 text-moxt-text-2 leading-normal mb-3">{data.description}</p>

        {/* File list - Always visible in all states */}
        {data.items.length > 0 && (
          <div className="mb-3 max-h-[160px] overflow-y-auto custom-scrollbar">
            {data.items.map((item) => (
              <FileItemRow key={item.nodeId} item={item} onLocate={onLocate} onEdit={onEdit} />
            ))}
          </div>
        )}

        {/* Revision Note - Only for Revision Requested */}
        {data.status === 'revision_requested' && data.revisionNote && (
          <div className="p-2.5 mb-3 bg-gray-50 rounded-md border border-moxt-line-1 text-12 text-moxt-text-1 animate-in fade-in">
            <div className="flex items-center gap-1.5 mb-1 text-moxt-text-2 font-medium text-11">
              <Edit3 size={11} />
              Your Changes
            </div>
            {data.revisionNote}
          </div>
        )}
      </div>

      {/* Footer / Action Area */}
      
      {/* 1. Revision Input (Interactive Mode) */}
      {showRevisionInput ? (
        <div className="p-3 pt-0 border-t border-moxt-line-1 bg-gray-50/50 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2 pt-2">
            <label className="text-12 font-medium text-moxt-text-1">What needs to be changed?</label>
          </div>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the changes you need..."
            className="w-full px-3 py-2 text-12 bg-white border border-moxt-line-1 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-moxt-brand-7/20 focus:border-moxt-brand-7 transition-all placeholder:text-moxt-text-4 mb-2"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowRevisionInput(false); setRevisionNote(''); }}
              className="px-3 py-1.5 text-12 font-medium text-moxt-text-2 hover:bg-moxt-fill-1 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRevisionSubmit}
              disabled={!revisionNote.trim()}
              className="px-3 py-1.5 text-12 font-semibold text-white bg-moxt-brand-7 hover:bg-moxt-brand-8 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors shadow-sm"
            >
              Submit
            </button>
          </div>
        </div>
      ) : (
        /* 2. Action Bar - Only for Pending State */
        data.status === 'pending' && (
          <div className="bg-gray-50 border-t border-moxt-line-1 px-3 py-2 flex items-center justify-between">
            {/* Left Actions (Secondary) */}
            <div className="flex items-center">
              <button
                onClick={() => setShowRevisionInput(true)}
                className="text-12 font-medium text-moxt-text-3 hover:text-moxt-text-1 transition-colors px-2 py-1 rounded hover:bg-moxt-fill-1/50"
              >
                Ask for Changes
              </button>
            </div>

            {/* Right Action (Primary) */}
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 text-12 font-semibold text-white bg-moxt-brand-7 hover:bg-green-600 rounded-md transition-colors shadow-sm"
            >
              Confirm and Continue
            </button>
          </div>
        )
      )}
      
      {/* Bottom spacing for non-action states to let content breathe */}
      {data.status !== 'pending' && !showRevisionInput && (
        <div className="pb-3" />
      )}
    </div>
  );
};
