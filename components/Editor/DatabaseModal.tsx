import React from 'react';
import { X, Table as TableIcon, ArrowLeft } from 'lucide-react';
import { TableData } from '../../types';

interface DatabaseModalProps {
  isOpen: boolean;
  title: string;
  data: TableData | null;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, title, data, onClose }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors group"
            title="Go Back"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-3">
             <TableIcon className="text-amber-600" size={18} />
             <h2 className="text-slate-900 font-medium text-sm tracking-wide">{title}</h2>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="px-5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <X size={14} strokeWidth={3} />
          <span>Close</span>
        </button>
      </div>

      {/* Data Grid - Full Screen */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 px-8">
            <table className="w-full text-left border-collapse bg-white shadow-sm rounded-xl overflow-hidden">
                <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                        {data.columns.map((col, idx) => (
                            <th key={idx} className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="group hover:bg-amber-50/30 transition-colors">
                            {data.columns.map((col, cIdx) => (
                                <td key={cIdx} className="px-6 py-4 text-sm text-slate-700 font-mono">
                                    {String(row[col] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {data.rows.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl">
                    <TableIcon size={48} className="mb-4 opacity-20" />
                    <p>No data records found</p>
                </div>
            )}

            {/* Footer Info */}
            <div className="mt-6 text-center text-sm text-slate-400 font-mono">
                {data.rows.length} rows × {data.columns.length} columns
            </div>
        </div>
      </div>

    </div>
  );
};
