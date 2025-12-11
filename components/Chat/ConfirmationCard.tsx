import React, { useState } from 'react';
import { CheckCircle, AlertCircle, MapPin, Edit3, X, CheckCircle2 } from 'lucide-react';
import { ConfirmationData, NodeType } from '../../types';

interface ConfirmationCardProps {
  data: ConfirmationData;
  onConfirm: () => void;
  onRequestRevision: (note: string) => void;
  onLocate: () => void;
}

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

  // Revision requested state
  if (data.status === 'revision_requested') {
    return (
      <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg mb-4 overflow-hidden border-l-4 border-l-red-500">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <span className="text-13 font-semibold text-moxt-text-1">{data.title}</span>
            <span className="text-11 px-1.5 py-0.5 rounded bg-red-100 text-red-700 ml-auto font-medium">Revision Requested</span>
          </div>
          <p className="text-12 text-moxt-text-2 mb-2 leading-normal">{data.summary}</p>
          {data.revisionNote && (
            <div className="p-2 bg-red-50 rounded border border-red-100 text-12 text-red-700">
              <strong>Note:</strong> {data.revisionNote}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Confirmed state
  if (data.status === 'confirmed') {
    return (
      <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg mb-4 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-moxt-fill-1/30">
          <CheckCircle2 size={16} className="text-moxt-brand-7 flex-shrink-0" />
          <span className="text-13 font-medium text-moxt-text-1">{data.title}</span>
          <span className="text-11 px-1.5 py-0.5 rounded bg-green-100 text-green-700 ml-auto font-medium">Confirmed</span>
        </div>
        <div className="px-3 py-2 border-t border-moxt-line-1/50">
          <p className="text-12 text-moxt-text-2 leading-normal">{data.summary}</p>
        </div>
      </div>
    );
  }

  // Pending state (awaiting confirmation)
  return (
    <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg mb-4 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-moxt-line-1 bg-moxt-fill-1/30">
        <div className="w-4 h-4 rounded-full border border-moxt-brand-7 flex items-center justify-center flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-moxt-brand-7 animate-pulse" />
        </div>
        <span className="text-13 font-semibold text-moxt-text-1">{data.title}</span>
        <span className="text-11 px-1.5 py-0.5 rounded bg-moxt-fill-2 text-moxt-text-2 ml-auto font-medium">Wait for confirmation</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        <p className="text-12 text-moxt-text-2 leading-normal">{data.summary}</p>

        {/* Locate Button */}
        <div>
           <button
            onClick={onLocate}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-11 font-medium text-moxt-text-2 bg-moxt-fill-1 hover:bg-moxt-fill-2 rounded transition-colors border border-moxt-line-1"
          >
            <MapPin size={11} />
            Locate {getNodeTypeName(data.targetNodeType)}
          </button>
        </div>

        {/* Revision Input (conditionally shown) */}
        {showRevisionInput && (
          <div className="space-y-2 pt-2 border-t border-moxt-line-1 border-dashed animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-12 font-medium text-moxt-text-1">What needs to be changed?</label>
              <button 
                onClick={() => { setShowRevisionInput(false); setRevisionNote(''); }}
                className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-text-3 hover:text-moxt-text-1 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the changes you need..."
              className="w-full px-3 py-2 text-12 bg-white border border-moxt-line-1 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-moxt-brand-7/20 focus:border-moxt-brand-7 transition-all placeholder:text-moxt-text-4"
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
                Submit Request
              </button>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        {!showRevisionInput && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-12 font-semibold text-white bg-moxt-brand-7 hover:bg-green-600 rounded-md transition-colors shadow-sm"
            >
              <CheckCircle2 size={14} />
              Confirm & Continue
            </button>
            <button
              onClick={() => setShowRevisionInput(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-12 font-medium text-moxt-text-2 bg-white border border-moxt-line-1 hover:bg-moxt-fill-1 hover:text-moxt-text-1 rounded-md transition-colors shadow-sm"
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
