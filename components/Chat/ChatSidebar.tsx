
import React, { useState, useRef, useEffect } from 'react';
import { Send, PanelLeftClose, PanelLeftOpen, Tornado, CheckCircle2, CircleDashed, Loader2, FileText, Layout, Monitor, Table, Zap, ListTodo, Globe, MousePointer2, AtSign, Play } from 'lucide-react';
import { ChatMessage, CanvasNode, CanvasSection, PlanStep } from '../../types';
import { ToolCallMessage } from './ToolCallMessage';
import { QuestionCard } from './QuestionCard';
import { FloatingTodoBar } from './FloatingTodoBar';

interface ChatSidebarProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onStartSimulation: () => void;
  isProcessing: boolean;
  isOpen: boolean;
  onToggle: () => void;
  nodes: CanvasNode[];
  sections: CanvasSection[];
  onEnterCanvasSelection: () => void;
  mentionedNodeIds: string[];
  selectedNodeForMention?: { nodeId: string; nodeTitle: string } | null;
  onClearSelectedNode?: () => void;
  onStartExecution?: (messageId: string) => void;
  onAnswerQuestion?: (messageId: string, optionId: string) => void;
  onSkipQuestion?: (messageId: string) => void;
  onContinueQuestion?: (messageId: string) => void;
  currentPlan?: PlanStep[] | null;
}

// Helper function to get node icon
const getNodeIcon = (type: string) => {
  switch (type) {
    case 'DOCUMENT': return FileText;
    case 'WHITEBOARD': return Layout;
    case 'SCREEN': return Monitor;
    case 'TABLE': return Table;
    case 'API': return Zap;
    case 'TASK': return ListTodo;
    case 'INTEGRATION': return Globe;
    default: return FileText;
  }
};

// Helper function to get node color
const getNodeColor = (type: string) => {
  switch (type) {
    case 'DOCUMENT': return 'text-blue-600';
    case 'WHITEBOARD': return 'text-purple-600';
    case 'SCREEN': return 'text-emerald-600';
    case 'TABLE': return 'text-orange-600';
    case 'API': return 'text-rose-600';
    case 'TASK': return 'text-slate-600';
    case 'INTEGRATION': return 'text-indigo-600';
    default: return 'text-slate-600';
  }
};

// Helper function to get section color
const getSectionColor = (theme: string) => {
  switch (theme) {
    case 'blue': return 'text-blue-600';
    case 'purple': return 'text-purple-600';
    case 'emerald': return 'text-emerald-600';
    case 'orange': return 'text-orange-600';
    case 'rose': return 'text-rose-600';
    case 'slate': return 'text-slate-600';
    default: return 'text-slate-600';
  }
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  messages,
  onSendMessage,
  onStartSimulation,
  isProcessing,
  isOpen,
  onToggle,
  nodes,
  sections,
  onEnterCanvasSelection,
  mentionedNodeIds,
  selectedNodeForMention,
  onClearSelectedNode,
  onStartExecution,
  onAnswerQuestion,
  onSkipQuestion,
  onContinueQuestion,
  currentPlan
}) => {
  // State
  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionStartPos = useRef<number>(-1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Auto-insert or remove mention when node is selected from canvas
  useEffect(() => {
    if (selectedNodeForMention) {
      const { nodeTitle } = selectedNodeForMention;

      let newInput: string;
      let newCursorPos: number;

      // Check if this is a removal operation
      if (nodeTitle.startsWith('REMOVE:')) {
        const actualTitle = nodeTitle.substring(7); // Remove "REMOVE:" prefix
        // Remove @nodeName from input
        const mentionPattern = new RegExp(`@${actualTitle}\\s*`, 'g');
        newInput = input.replace(mentionPattern, '').trim();
        newCursorPos = newInput.length;
        setInput(newInput);
      } else {
        // Insert @nodeName, replacing the @ that triggered the popover if exists
        if (mentionStartPos.current !== -1) {
          // User typed @ before selecting from canvas - replace it
          const before = input.substring(0, mentionStartPos.current);
          const cursorPos = textareaRef.current?.selectionStart || input.length;
          const after = input.substring(cursorPos);

          newInput = `${before}@${nodeTitle}${after}`;
          newCursorPos = before.length + nodeTitle.length + 1; // +1 for @

          // Reset mention position
          mentionStartPos.current = -1;
        } else {
          // No @ was typed - just append
          newInput = input ? `${input} @${nodeTitle}` : `@${nodeTitle}`;
          newCursorPos = newInput.length;
        }
        setInput(newInput);
      }

      // Focus textarea with correct cursor position
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);

      // Clear the selected node
      onClearSelectedNode?.();
    }
  }, [selectedNodeForMention]);

  // Get all mentionable items (sections + nodes)
  const getMentionableItems = () => {
    const items: Array<{ id: string; title: string; type: string; icon: any; color: string }> = [];

    // Add sections
    sections.forEach(section => {
      items.push({
        id: section.id,
        title: section.title,
        type: 'SECTION',
        icon: Layout,
        color: getSectionColor(section.theme)
      });
    });

    // Add nodes
    nodes.forEach(node => {
      items.push({
        id: node.id,
        title: node.title,
        type: node.type,
        icon: getNodeIcon(node.type),
        color: getNodeColor(node.type)
      });
    });

    return items;
  };

  // Filter mentionable items based on search
  const filteredItems = getMentionableItems().filter(item =>
    item.title.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [mentionFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;

    setInput(val);

    // Check if @ was just typed
    const beforeCursor = val.substring(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if there's a space before @ or it's at the start
      const charBeforeAt = lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || lastAtIndex === 0) {
        // Extract text after @
        const afterAt = beforeCursor.substring(lastAtIndex + 1);
        // Check if there's no space after @
        if (!afterAt.includes(' ')) {
          setShowMentions(true);
          setMentionFilter(afterAt);
          mentionStartPos.current = lastAtIndex;
          return;
        }
      }
    }

    setShowMentions(false);
    setMentionFilter('');
  };

  const insertMention = (title: string) => {
    if (mentionStartPos.current === -1) return;

    const before = input.substring(0, mentionStartPos.current);
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const after = input.substring(cursorPos);

    const newInput = `${before}@${title}${after}`;
    setInput(newInput);
    setShowMentions(false);
    setMentionFilter('');
    mentionStartPos.current = -1;

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = before.length + title.length + 1;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredItems[selectedIndex].title);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    // Normal Enter to submit (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      // Send message and always trigger simulation
      onSendMessage(input);
      setInput('');
      onStartSimulation();
    }
  };

  // Render message content with colored mentions
  const renderMessageContent = (content: string) => {
    const allItems = getMentionableItems();
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all @mentions in the content
    const mentionRegex = /@(\S+)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionText = match[1];
      const fullMention = match[0];
      const matchIndex = match.index;

      // Add text before mention
      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }

      // Find matching item
      const item = allItems.find(item => item.title === mentionText);

      if (item) {
        // Add colored mention
        parts.push(
          <span key={matchIndex} className={`font-semibold ${item.color}`}>
            {fullMention}
          </span>
        );
      } else {
        // No match, render as normal text
        parts.push(fullMention);
      }

      lastIndex = matchIndex + fullMention.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
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
        {messages.map((msg) => {
          // 工具调用消息
          if (msg.type === 'tool_call' && msg.toolCall) {
            return <ToolCallMessage key={msg.id} toolCall={msg.toolCall} />;
          }

          // 问题消息
          if (msg.type === 'question' && msg.question) {
            return (
              <QuestionCard
                key={msg.id}
                question={msg.question}
                onSelectOption={(optionId) => onAnswerQuestion?.(msg.id, optionId)}
                onSkip={() => onSkipQuestion?.(msg.id)}
                onContinue={() => onContinueQuestion?.(msg.id)}
                collapsed={msg.collapsed}
              />
            );
          }

          // 用户和 AI 消息
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'max-w-[80%]' : 'w-full'}`}>
                  {/* Text Content */}
                  {msg.content && (
                      msg.role === 'user' ? (
                        // User message - keep bubble
                        <div className="p-3 rounded-2xl text-sm leading-relaxed shadow-sm bg-slate-100 text-slate-800 rounded-tr-none border border-slate-200">
                          {renderMessageContent(msg.content)}
                        </div>
                      ) : (
                        // AI message - remove bubble, plain text only
                        <div className="text-sm leading-relaxed text-slate-700">
                          {renderMessageContent(msg.content)}
                        </div>
                      )
                  )}

                  {/* Plan/Steps Renderer */}
                  {msg.plan && (
                      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-3 flex flex-col gap-2">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Execution Plan</div>
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

                          {/* Start execution button - at bottom */}
                          {!msg.executionStarted && onStartExecution && (
                            <button
                              onClick={() => onStartExecution(msg.id)}
                              className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm w-full"
                            >
                              <Play size={14} />
                              <span>Start Execution</span>
                            </button>
                          )}
                      </div>
                  )}
              </div>
            </div>
          );
        })}
        {isProcessing && (
            <div className="flex justify-start">
                <div className="text-slate-400 text-xs flex items-center gap-1">
                    Thinking <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </div>
            </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="relative">
          {/* Mention Popover */}
          {showMentions && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden max-h-64 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                @ Mention
              </div>

              {/* Select from Canvas option */}
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 border-b border-slate-200"
                onClick={() => {
                  setShowMentions(false);
                  setMentionFilter('');
                  onEnterCanvasSelection();
                }}
              >
                <MousePointer2 size={14} className="text-blue-600" />
                <AtSign size={14} className="text-blue-600" />
                <span className="font-medium flex-1">Select from Canvas</span>
              </button>

              {filteredItems.length > 0 && (
                <>
                  {filteredItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 transition-colors ${
                          index === selectedIndex
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        onClick={() => insertMention(item.title)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <IconComponent size={14} className={item.color} />
                        <span className="font-medium truncate flex-1">{item.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {item.type}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Floating Todo Bar - shows all tasks above input */}
          <FloatingTodoBar plan={currentPlan || null} />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type @ to mention files or describe your app idea..."
            disabled={isProcessing}
            rows={3}
            className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-200 transition-all resize-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 bottom-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors shadow-sm"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
