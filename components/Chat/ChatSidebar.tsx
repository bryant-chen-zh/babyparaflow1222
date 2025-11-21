
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, PanelLeftClose, PanelLeftOpen, Tornado, CheckCircle2, CircleDashed, Loader2, Play } from 'lucide-react';
import { ChatMessage, PlanStep } from '../../types';

interface ChatSidebarProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onStartSimulation: () => void;
  isProcessing: boolean;
  isOpen: boolean;
  onToggle: () => void;
  simulationStarted: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  messages, 
  onSendMessage, 
  onStartSimulation,
  isProcessing,
  isOpen,
  onToggle,
  simulationStarted
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  // Collapsed State
  if (!isOpen) {
    return (
      <div className="w-14 h-full bg-white border-r border-slate-200 flex flex-col items-center py-4 z-20 shrink-0">
        <button 
          onClick={onToggle}
          className="p-2 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
          title="Expand Chat"
        >
          <PanelLeftOpen size={20} />
        </button>
        <div className="mt-4 flex flex-col gap-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Tornado className="text-white" size={16} />
            </div>
        </div>
        <div className="flex-1"></div>
        <div className="writing-vertical-rl text-xs text-slate-400 font-mono tracking-widest rotate-180 select-none py-4">
            PARAFLOW
        </div>
      </div>
    );
  }

  // Expanded State
  return (
    <div className="w-96 h-full bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl shadow-slate-200/50 flex-shrink-0">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-emerald-200 shadow-lg">
                <Tornado className="text-white" size={18} />
            </div>
            <div>
                <h1 className="font-bold text-slate-900 text-lg tracking-tight">Paraflow</h1>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Visual Agent v1.0</p>
            </div>
        </div>
        <button 
          onClick={onToggle}
          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          title="Collapse Chat"
        >
            <PanelLeftClose size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
            <div className="text-center mt-20 opacity-60">
                <Tornado className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-500 text-sm">Describe your app idea.<br/>I'll handle the PRD, Flow, and Prototype.</p>
            </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-white border border-slate-200' : 'bg-emerald-600'
            }`}>
              {msg.role === 'user' ? <User size={14} className="text-slate-600" /> : <Bot size={14} className="text-white" />}
            </div>
            <div className="flex flex-col gap-2 max-w-[80%]">
                {/* Text Content */}
                {msg.content && (
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                        ? 'bg-slate-100 text-slate-800 rounded-tr-none border border-slate-200' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                    }`}>
                    {msg.content}
                    </div>
                )}

                {/* Plan/Steps Renderer */}
                {msg.plan && (
                    <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-3 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Execution Plan</div>
                        {msg.plan.map(step => (
                            <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                {step.status === 'pending' && <CircleDashed size={16} className="text-slate-300" />}
                                {step.status === 'loading' && <Loader2 size={16} className="text-blue-500 animate-spin" />}
                                {step.status === 'done' && <CheckCircle2 size={16} className="text-emerald-500" />}
                                
                                <span className={`text-xs font-medium ${
                                    step.status === 'pending' ? 'text-slate-400' : 'text-slate-700'
                                }`}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        ))}
        {isProcessing && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 animate-pulse shadow-sm">
                    <Bot size={14} className="text-white" />
                </div>
                <div className="text-slate-400 text-xs flex items-center gap-1 pt-2">
                    Thinking <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </div>
            </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        {!simulationStarted ? (
             <button 
                onClick={onStartSimulation}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
             >
                 <Play size={18} fill="currentColor" />
                 Start Simulation
             </button>
        ) : (
            <form onSubmit={handleSubmit} className="relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Reply to agent..."
                disabled={isProcessing}
                className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-200 transition-all"
            />
            <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="absolute right-2 top-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors shadow-sm"
            >
                <Send size={16} />
            </button>
            </form>
        )}
      </div>
    </div>
  );
};
