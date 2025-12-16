import React, { useState } from 'react';
import { X, ChevronRight, MessageSquarePlus, Play } from 'lucide-react';
import { ConfirmationStatus, ConfirmationIntent } from '../../types';

interface NodeConfirmationWidgetProps {
  msgId: string;
  title: string;
  status: ConfirmationStatus;
  intent?: ConfirmationIntent;           // 门禁类型：'confirm'（默认）或 'start'
  primaryActionLabel?: string;           // 主按钮自定义文案
  onConfirm: (msgId: string) => void;
  onRequestRevision: (msgId: string, note: string) => void;
}

export const NodeConfirmationWidget: React.FC<NodeConfirmationWidgetProps> = ({
  msgId,
  title,
  status,
  intent = 'confirm',
  primaryActionLabel,
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
        // Input Mode: Compact card matching chat style
        <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.15)] border border-moxt-line-1 p-3 min-w-[300px] animate-in fade-in zoom-in-95 duration-200 origin-bottom">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 text-moxt-brand-7" />
              <span className="text-12 font-semibold text-moxt-text-1">Ask for Changes</span>
            </div>
            <button
              onClick={() => { setShowRevisionInput(false); setRevisionNote(''); }}
              className="p-1 hover:bg-moxt-fill-1 rounded-full transition-colors text-moxt-text-3 hover:text-moxt-text-1"
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what needs to be changed..."
            className="w-full px-3 py-2 text-12 bg-moxt-fill-1/30 border border-moxt-line-1 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-moxt-brand-7/20 focus:border-moxt-brand-7 transition-all placeholder:text-moxt-text-4 mb-2.5"
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
              className="px-3 py-1.5 text-12 font-semibold text-white bg-moxt-brand-7 hover:bg-moxt-brand-8 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Submit
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      ) : (
        // Default Mode: Compact Capsule matching chat style
        <div className="flex items-center bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-moxt-line-1 p-1 animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-nowrap origin-bottom">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2 pl-2.5 pr-3">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                intent === 'start' ? 'bg-moxt-brand-7' : 'bg-orange-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                intent === 'start' ? 'bg-moxt-brand-7' : 'bg-orange-500'
              }`}></span>
            </span>
            <span className="text-12 font-semibold text-moxt-text-1">
              {intent === 'start' ? 'Ready to Start' : 'Confirmation Needed'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowRevisionInput(true)}
              className="px-3 py-1.5 text-12 font-medium text-moxt-text-2 hover:text-moxt-text-1 hover:bg-moxt-fill-1 rounded-full transition-all"
            >
              Ask for Changes
            </button>
            <button
              onClick={() => onConfirm(msgId)}
              className="px-3 py-1.5 text-12 font-semibold text-white bg-moxt-brand-7 hover:bg-moxt-brand-8 rounded-full transition-all shadow-sm flex items-center gap-1.5"
            >
              {intent === 'start' && <Play size={14} />}
              {primaryActionLabel || (intent === 'start' ? 'Start' : 'Confirm & Continue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
