import React, { useMemo } from 'react';
import { FileText, Maximize2, Edit3 } from 'lucide-react';
import { DocumentData } from '../../../types';
import { parseMarkdown, renderInlineStyles } from '../../../utils/markdownUtils';

interface DocumentNodeProps {
  title?: string;
  data: DocumentData | null;
  loading?: boolean;
  onEdit?: () => void;
}

export const DocumentNode: React.FC<DocumentNodeProps> = ({ title, data, loading, onEdit }) => {
  const blocks = useMemo(() => data ? parseMarkdown(data.content) : [], [data]);

  if (loading || !data) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded"></div>
          <div className="h-3 bg-slate-100 rounded"></div>
          <div className="h-3 bg-slate-100 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white group relative">
      {/* Prominent Header */}
      <div className="h-14 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                 <FileText size={16} />
             </div>
             <div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Document</div>
                 <h3 className="font-bold text-slate-800 text-sm leading-none truncate max-w-[250px]">{title || 'Untitled Document'}</h3>
             </div>
         </div>
         <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
            title="Edit Document"
          >
             <Edit3 size={14} className="opacity-70" />
             Edit
         </button>
      </div>

      {/* Rich Content Preview */}
      <div
        className="flex-1 p-6 overflow-y-auto custom-scrollbar cursor-text"
        onDoubleClick={(e) => {
            e.stopPropagation();
            onEdit?.();
        }}
      >
        {blocks.length === 0 ? (
          // Empty document placeholder
          <div className="flex flex-col h-full pt-12 px-8">
            <h2 className="text-2xl font-normal text-slate-800 mb-2">Untitled Document</h2>
            <p className="text-sm text-slate-400 mb-8">Double-click or click "Edit" to start writing</p>
          </div>
        ) : (
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
        )}
      </div>
      
      {/* Footer status */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between font-mono select-none shrink-0">
         <span>MARKDOWN</span>
         <span className="opacity-70">{blocks.length} blocks</span>
      </div>
    </div>
  );
};

