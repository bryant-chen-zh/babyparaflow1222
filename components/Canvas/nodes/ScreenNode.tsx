
import React, { useRef } from 'react';
import { Play, FileText, Lock, RefreshCw, Smartphone } from 'lucide-react';
import { ScreenData } from '../../../types';
import { MOBILE_SCREEN_WIDTH, MOBILE_SCREEN_HEIGHT, WEB_SCREEN_WIDTH, WEB_SCREEN_HEIGHT } from '../../../constants';

interface ScreenNodeProps {
  title?: string;
  data: ScreenData | null;
  loading?: boolean;
  onRun?: () => void;
  onEditPlan?: () => void;
}

export const ScreenNode: React.FC<ScreenNodeProps> = ({
  title,
  data,
  loading,
  onRun,
  onEditPlan
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (loading || !data) {
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center animate-pulse rounded-xl border border-slate-200">
         <div className="w-12 h-12 bg-slate-100 rounded-full mb-4"></div>
         <div className="text-slate-400 text-xs">Generating UI...</div>
      </div>
    );
  }

  const isWeb = data.variant === 'web';
  const width = isWeb ? WEB_SCREEN_WIDTH : MOBILE_SCREEN_WIDTH;
  const height = isWeb ? WEB_SCREEN_HEIGHT : MOBILE_SCREEN_HEIGHT;

  return (
    <div className="w-full h-full flex flex-col items-center">
      {/* Header / Actions Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-1" style={{ maxWidth: width }}>
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                 <Smartphone size={20} />
             </div>
             <div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Screen</div>
                 <h3 className="font-bold text-slate-900 text-lg leading-none">{data.screenName}</h3>
             </div>
         </div>
         <div className="flex items-center gap-2">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEditPlan?.();
                }}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
            >
                <FileText size={14} className="text-slate-400" />
                View Plan
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRun?.();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
                <Play size={14} fill="currentColor" />
                Run Prototype
            </button>
         </div>
      </div>

      {/* Frame Container */}
      <div
        className={`flex flex-col overflow-visible shadow-xl relative hover:ring-4 hover:ring-emerald-500/20 transition-all duration-300 bg-white
            ${isWeb ? 'rounded-lg border border-slate-300' : 'rounded-[32px] border-4 border-slate-800'}
        `}
        style={{ width, height }}
      >
        {/* WEB BROWSER CHROME */}
        {isWeb && (
            <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center px-3 gap-3 shrink-0">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                </div>
                <div className="flex-1 bg-white h-6 rounded-md border border-slate-200 flex items-center px-2 gap-2">
                    <Lock size={10} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-mono truncate">paraflow.app/events/{data.screenName.toLowerCase().replace(/\s/g, '-')}</span>
                </div>
                <RefreshCw size={12} className="text-slate-400" />
            </div>
        )}

        {/* MOBILE DEVICE BEZELS */}
        {!isWeb && (
            <>
                <div className="h-7 bg-slate-900 flex items-center justify-center shrink-0 relative z-20">
                    <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                </div>
                <div className="h-6 bg-white flex items-center justify-between px-5 shrink-0 border-b border-slate-50 select-none">
                    <div className="text-[10px] font-mono text-slate-900 font-bold">9:41</div>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    </div>
                </div>
            </>
        )}

        {/* Rendered HTML Content (Static Mode) */}
        <div className="flex-1 relative overflow-hidden">
          <div
              ref={contentRef}
              className="absolute inset-0 overflow-y-auto bg-white custom-scrollbar"
              style={{
                pointerEvents: 'none',  // 禁用原生 HTML 交互
                userSelect: 'none'       // 禁用文本选择
              }}
              dangerouslySetInnerHTML={{ __html: data.htmlContent }}
              onWheel={(e) => e.stopPropagation()} // Prevent canvas zoom when scrolling content
          />
        </div>

        {/* Mobile Bottom Bezel */}
        {!isWeb && (
            <div className="h-9 bg-slate-900 flex items-center justify-center shrink-0 z-20">
                <div className="w-28 h-1 bg-slate-700 rounded-full opacity-50"></div>
            </div>
        )}
      </div>
    </div>
  );
};
