import React from 'react';
import { Table as TableIcon, Maximize2 } from 'lucide-react';
import { TableData } from '../../../types';

interface TableNodeProps {
  title?: string;
  data: TableData | null;
  loading?: boolean;
  onExpand?: () => void;
}

export const TableNode: React.FC<TableNodeProps> = ({ title, data, loading, onExpand }) => {
  if (loading || !data) {
    return (
      <div className="p-4 space-y-3 animate-pulse w-72">
        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded"></div>
          <div className="h-3 bg-slate-100 rounded"></div>
          <div className="h-3 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  const previewRows = data.rows.slice(0, 5);

  return (
    <div 
        className="h-full flex flex-col bg-white group relative border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        onDoubleClick={(e) => {
            e.stopPropagation();
            onExpand?.();
        }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded flex items-center justify-center shrink-0">
            <TableIcon size={14} />
            </div>
            <div>
            <div className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider leading-none mb-0.5">Data Table</div>
            <h3 className="font-bold text-slate-800 text-sm leading-none">{title || 'Untitled Table'}</h3>
            </div>
        </div>
        
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onExpand?.();
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 text-slate-600 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm opacity-0 group-hover:opacity-100"
            title="View Data"
        >
            <Maximize2 size={14} className="opacity-70" />
            View Data
        </button>
      </div>

      {/* Data Grid Preview */}
      <div className="flex-1 overflow-hidden relative bg-white">
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 text-slate-400 font-medium border-b border-slate-100 sticky top-0 z-10">
                    <tr>
                        {data.columns.map((col, idx) => (
                            <th key={idx} className="px-3 py-1.5 font-mono uppercase tracking-tight border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="group/row hover:bg-slate-50 transition-colors">
                            {data.columns.map((col, cIdx) => (
                                <td key={cIdx} className="px-3 py-1.5 text-slate-600 font-mono border-r border-slate-50 last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                    {String(row[col] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between font-mono">
          <span>{data.rows.length} rows</span>
          <span className="text-slate-400">{data.columns.length} cols</span>
      </div>
    </div>
  );
};
