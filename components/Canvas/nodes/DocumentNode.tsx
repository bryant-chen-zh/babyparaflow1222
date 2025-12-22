import React, { useMemo } from 'react';
import { FileText, Maximize2, Edit3, MoreHorizontal } from 'lucide-react';
import { DocumentData } from '../../../types';
import { parseMarkdown, renderInlineStyles } from '../../../utils/markdownUtils';
import { DocumentSkeleton } from '../../ReactBits';

interface DocumentNodeProps {
  title?: string;
  data: DocumentData | null;
  loading?: boolean;
  onEdit?: () => void;
}

export const DocumentNode: React.FC<DocumentNodeProps> = ({ title, data, loading, onEdit }) => {
  const blocks = useMemo(() => data ? parseMarkdown(data.content) : [], [data]);
  const isEmpty = !data?.content || data.content.trim() === '';

  if (loading) {
    return <DocumentSkeleton />;
  }

  return (
    <div className="h-full flex flex-col bg-white group relative">
      {/* Floating Action Bar - appears on hover */}
      <div className="absolute -top-12 left-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-moxt-line-1 p-1">
         <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="p-2 hover:bg-moxt-fill-1 rounded-md text-moxt-text-2 transition-colors"
            title="Edit Document"
          >
             <Edit3 size={16} />
         </button>
         <div className="w-px h-5 bg-moxt-line-1"></div>
         <button 
            className="p-2 hover:bg-moxt-fill-1 rounded-md text-moxt-text-2 transition-colors"
            title="More options"
          >
             <MoreHorizontal size={16} />
         </button>
      </div>

      {/* Title Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
         <FileText size={16} className="text-moxt-brand-7" />
         <span className="text-moxt-brand-7 font-medium text-sm">{title || 'document.md'}</span>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 mx-4 mb-4 rounded-lg overflow-hidden cursor-pointer"
        onDoubleClick={(e) => {
            e.stopPropagation();
            onEdit?.();
        }}
        style={{
          border: isEmpty ? '2px dashed #22c55e' : '2px solid #22c55e',
        }}
      >
        {isEmpty ? (
          // Empty document placeholder with dashed border
          <div className="h-full flex flex-col bg-white">
            {/* Inner dashed area */}
            <div 
              className="flex-1 m-4 rounded-lg flex flex-col items-center justify-center"
              style={{
                border: '2px dashed #d1d5db',
              }}
            >
              <FileText size={32} className="text-slate-300 mb-3" />
              <h3 className="text-slate-800 font-semibold text-base mb-1">Untitled Document</h3>
              <p className="text-slate-400 text-sm">Double-click or click "Edit" to start writing</p>
            </div>
          </div>
        ) : (
          // Content with rendered markdown
          <div className="h-full bg-white p-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-2 pointer-events-none select-none">
              {blocks.map((block, index) => {
                  // Calculate numbered list index logic if needed (simplified here)
                  let listIndex = 0;
                  if (block.type === 'numbered') {
                     // simple lookback to find start of list
                     listIndex = 1;
                     for (let i = index - 1; i >= 0; i--) {
                         if (blocks[i].type === 'numbered') listIndex++;
                         else break;
                     }
                  }

                  switch (block.type) {
                      case 'h1':
                          return <h1 key={block.id} className="text-xl font-bold text-slate-900 mt-4 mb-2 leading-tight">{renderInlineStyles(block.content)}</h1>;
                      case 'h2':
                          return <h2 key={block.id} className="text-lg font-semibold text-slate-800 mt-3 mb-1 leading-snug">{renderInlineStyles(block.content)}</h2>;
                      case 'h3':
                          return <h3 key={block.id} className="text-base font-semibold text-slate-800 mt-2 mb-1">{renderInlineStyles(block.content)}</h3>;
                      case 'bullet':
                          return (
                              <div key={block.id} className="flex items-start gap-2 ml-1 text-sm text-slate-600 leading-relaxed">
                                  <span className="text-slate-400 mt-1.5 shrink-0">•</span>
                                  <span>{renderInlineStyles(block.content)}</span>
                              </div>
                          );
                      case 'numbered':
                          return (
                              <div key={block.id} className="flex items-start gap-2 ml-1 text-sm text-slate-600 leading-relaxed">
                                  <span className="text-slate-400 shrink-0 font-mono text-xs mt-0.5">{listIndex}.</span>
                                  <span>{renderInlineStyles(block.content)}</span>
                              </div>
                          );
                      case 'divider':
                           return <hr key={block.id} className="my-4 border-slate-100" />;
                      default:
                          return <p key={block.id} className={`text-sm text-slate-600 leading-relaxed ${block.content.trim() === '' ? 'h-2' : ''}`}>{renderInlineStyles(block.content)}</p>;
                  }
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

