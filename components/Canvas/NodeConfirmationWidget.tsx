import React, { useState } from 'react';
import { X, ChevronRight, MessageSquarePlus } from 'lucide-react';
import { ConfirmationStatus } from '../../types';

interface NodeConfirmationWidgetProps {
  msgId: string;
  title: string;
  status: ConfirmationStatus;
  onConfirm: (msgId: string) => void;
  onRequestRevision: (msgId: string, note: string) => void;
}

export const NodeConfirmationWidget: React.FC<NodeConfirmationWidgetProps> = ({
  msgId,
  title,
  status,
  onConfirm,
  onRequestRevision
}) => {
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  const handleRevisionSubmit = () => {
    if (revisionNote.trim()) {
      onRequestRevision(msgId, revisionNote.trim());
      setShowRevisionInput(false);
      setRevisionNote('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRevisionSubmit();
    }
    if (e.key === 'Escape') {
      setShowRevisionInput(false);
      setRevisionNote('');
    }
  };

  // Only render for pending state
  if (status !== 'pending') {
    return null;
  }

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {showRevisionInput ? (
        // Input Mode: Larger, cleaner card
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.2)] border border-moxt-line-1 p-4 min-w-[360px] animate-in fade-in zoom-in-95 duration-200 origin-bottom">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-moxt-brand-7" />
              <span className="text-sm font-semibold text-moxt-text-1">Ask for Changes</span>
            </div>
            <button
              onClick={() => { setShowRevisionInput(false); setRevisionNote(''); }}
              className="p-1.5 hover:bg-moxt-fill-1 rounded-full transition-colors text-moxt-text-3 hover:text-moxt-text-1"
            >
              <X size={16} />
            </button>
          </div>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what needs to be changed..."
            className="w-full px-4 py-3 text-sm bg-moxt-fill-1/30 border border-moxt-line-1 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-moxt-brand-7/20 focus:border-moxt-brand-7 transition-all placeholder:text-moxt-text-4 mb-4 shadow-inner"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => { setShowRevisionInput(false); setRevisionNote(''); }}
              className="px-4 py-2 text-sm font-medium text-moxt-text-2 hover:bg-moxt-fill-1 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRevisionSubmit}
              disabled={!revisionNote.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-moxt-brand-7 hover:bg-moxt-brand-8 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              Submit Feedback
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        // Default Mode: Clean Capsule
        <div className="flex items-center bg-white rounded-full shadow-[0_12px_40px_rgb(0,0,0,0.15)] border border-moxt-line-1 p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-nowrap origin-bottom">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2.5 pl-3 pr-4">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <span className="text-sm font-bold text-moxt-text-1">Confirmation Needed</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowRevisionInput(true)}
              className="px-4 py-2.5 text-sm font-medium text-moxt-text-2 hover:text-moxt-text-1 hover:bg-moxt-fill-1 rounded-full transition-all flex items-center gap-2"
            >
              Ask for Changes
            </button>
            <button
              onClick={() => onConfirm(msgId)}
              className="px-5 py-2.5 text-sm font-bold text-white bg-moxt-brand-7 hover:bg-moxt-brand-8 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
