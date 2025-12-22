import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface MarkdownModalProps {
  isOpen: boolean;
  title: string;
  initialContent: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

export const MarkdownModal: React.FC<MarkdownModalProps> = ({ 
  isOpen, 
  title, 
  initialContent, 
  onSave, 
  onClose 
}) => {
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setHasChanges(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [initialContent, isOpen]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasChanges(newContent.trim() !== initialContent.trim());
  };

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const canSave = content.trim().length > 0;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Edit Markdown</h2>
          <button 
            onClick={handleCancel}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Enter your markdown content here..."
            className="w-full h-80 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-moxt-brand-7/30 focus:border-moxt-brand-7 text-slate-700 text-sm leading-relaxed placeholder:text-slate-400 transition-all"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              canSave 
                ? 'bg-moxt-brand-7 text-white hover:bg-moxt-brand-7/90 shadow-sm' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
