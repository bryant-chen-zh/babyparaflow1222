
import React, { useState, useRef, useEffect } from 'react';
import { Send, PanelLeftClose, PanelLeftOpen, Tornado, CheckCircle2, CircleDashed, Loader2, FileText, Layout, Monitor, Table, Zap, ListTodo, Globe, MousePointer2, AtSign, Play, Square, CheckSquare, ImagePlus, X } from 'lucide-react';
import { ChatMessage, CanvasNode, CanvasSection, PlanStep } from '../../types';
import { ToolCallMessage } from './ToolCallMessage';
import { QuestionCard } from './QuestionCard';
import { FloatingTodoBar } from './FloatingTodoBar';
import { FileOperationCard } from './FileOperationCard';
import { ThinkingMessage } from './ThinkingMessage';
import { parseMarkdown, renderInlineStyles, Block } from '../../utils/markdownUtils';

interface ChatSidebarProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, images?: string[]) => void;
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
  onLocateNode?: (nodeId: string) => void;
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
    case 'SCREEN': return 'text-moxt-brand-7';
    case 'TABLE': return 'text-orange-600';
    case 'API': return 'text-rose-600';
    case 'TASK': return 'text-moxt-text-2';
    case 'INTEGRATION': return 'text-indigo-600';
    default: return 'text-moxt-text-2';
  }
};

// Helper function to get section color
const getSectionColor = (theme: string) => {
  switch (theme) {
    case 'blue': return 'text-blue-600';
    case 'purple': return 'text-purple-600';
    case 'emerald': return 'text-moxt-brand-7';
    case 'orange': return 'text-orange-600';
    case 'rose': return 'text-rose-600';
    case 'slate': return 'text-moxt-text-2';
    default: return 'text-moxt-text-2';
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
  onLocateNode,
  currentPlan
}) => {
  // State
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionStartPos = useRef<number>(-1);

  const MAX_IMAGES = 4;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Compress image and convert to base64
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1200;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files)
      .filter(f => f.type.startsWith('image/') && f.size <= MAX_FILE_SIZE)
      .slice(0, MAX_IMAGES - images.length);
    
    for (const file of validFiles) {
      try {
        const base64 = await compressImage(file);
        setImages(prev => [...prev, base64].slice(0, MAX_IMAGES));
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle paste event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
      if (imageItems.length > 0) {
        e.preventDefault();
        const files = imageItems.map(item => item.getAsFile()).filter(Boolean) as File[];
        handleFileSelect(files as unknown as FileList);
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [images.length]);

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

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
    if ((input.trim() || images.length > 0) && !isProcessing) {
      // Send message with images and always trigger simulation
      onSendMessage(input, images);
      setInput('');
      setImages([]);
      onStartSimulation();
    }
  };

  // Render text with colored mentions and inline styles
  const renderTextWithMentions = (content: string, key?: string) => {
    const allItems = getMentionableItems();
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all @mentions in the content
    const mentionRegex = /@(\S+)/g;
    let match;
    let partIndex = 0;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionText = match[1];
      const fullMention = match[0];
      const matchIndex = match.index;

      // Add text before mention (with inline styles)
      if (matchIndex > lastIndex) {
        const textBefore = content.substring(lastIndex, matchIndex);
        const styledBefore = renderInlineStyles(textBefore, `${key}-${partIndex}`);
        parts.push(<React.Fragment key={`${key}-text-${partIndex}`}>{styledBefore}</React.Fragment>);
        partIndex++;
      }

      // Find matching item
      const item = allItems.find(item => item.title === mentionText);

      if (item) {
        // Add colored mention
        parts.push(
          <span key={`${key}-mention-${matchIndex}`} className={`font-semibold ${item.color}`}>
            {fullMention}
          </span>
        );
      } else {
        // No match, render as normal text
        parts.push(fullMention);
      }

      lastIndex = matchIndex + fullMention.length;
    }

    // Add remaining text (with inline styles)
    if (lastIndex < content.length) {
      const remaining = content.substring(lastIndex);
      const styledRemaining = renderInlineStyles(remaining, `${key}-${partIndex}`);
      parts.push(<React.Fragment key={`${key}-text-final`}>{styledRemaining}</React.Fragment>);
    }

    return parts.length > 0 ? parts : renderInlineStyles(content, key || 'default');
  };

  // Render a single block with proper styling
  const renderBlock = (block: Block, index: number) => {
    const content = renderTextWithMentions(block.content, block.id);
    
    switch (block.type) {
      case 'h1':
        return (
          <h1 key={block.id} className="text-lg font-bold text-moxt-text-1 mt-3 mb-1.5 first:mt-0">
            {content}
          </h1>
        );
      case 'h2':
        return (
          <h2 key={block.id} className="text-base font-semibold text-moxt-text-1 mt-2.5 mb-1 first:mt-0">
            {content}
          </h2>
        );
      case 'h3':
        return (
          <h3 key={block.id} className="text-sm font-semibold text-moxt-text-1 mt-2 mb-1 first:mt-0">
            {content}
          </h3>
        );
      case 'h4':
        return (
          <h4 key={block.id} className="text-sm font-medium text-moxt-text-1 mt-1.5 mb-0.5 first:mt-0">
            {content}
          </h4>
        );
      case 'h5':
        return (
          <h5 key={block.id} className="text-[13px] font-medium text-moxt-text-1 mt-1.5 mb-0.5 first:mt-0">
            {content}
          </h5>
        );
      case 'h6':
        return (
          <h6 key={block.id} className="text-[12px] font-medium text-moxt-text-2 mt-1.5 mb-0.5 first:mt-0">
            {content}
          </h6>
        );
      case 'bullet':
        return (
          <li key={block.id} className="flex items-start gap-2 ml-1">
            <span className="text-moxt-text-2 mt-1.5 text-[8px]">●</span>
            <span className="flex-1">{content}</span>
          </li>
        );
      case 'numbered':
        return (
          <li key={block.id} className="flex items-start gap-2 ml-1">
            <span className="text-moxt-text-2 font-medium min-w-[1.25rem]">{index + 1}.</span>
            <span className="flex-1">{content}</span>
          </li>
        );
      case 'task':
        return (
          <li key={block.id} className="flex items-start gap-2 ml-1">
            <Square size={14} className="text-moxt-text-3 mt-0.5 flex-shrink-0" />
            <span className="flex-1">{content}</span>
          </li>
        );
      case 'task_done':
        return (
          <li key={block.id} className="flex items-start gap-2 ml-1">
            <CheckSquare size={14} className="text-moxt-brand-7 mt-0.5 flex-shrink-0" />
            <span className="flex-1 line-through text-moxt-text-3">{content}</span>
          </li>
        );
      case 'blockquote':
        return (
          <blockquote key={block.id} className="border-l-2 border-moxt-line-2 pl-3 py-0.5 my-1 text-moxt-text-3 italic">
            {content}
          </blockquote>
        );
      case 'code_block':
        return (
          <pre key={block.id} className="bg-moxt-fill-1 border border-moxt-line-1 rounded-md p-3 my-1.5 overflow-x-auto">
            <code className="text-[12px] font-mono text-moxt-text-1 whitespace-pre">
              {block.content}
            </code>
          </pre>
        );
      case 'divider':
        return <hr key={block.id} className="border-moxt-line-1 my-2" />;
      case 'paragraph':
      default:
        if (!block.content.trim()) return null;
        return (
          <p key={block.id} className="my-0.5">
            {content}
          </p>
        );
    }
  };

  // Render message content with Markdown support
  const renderMessageContent = (content: string, isAI: boolean = false) => {
    if (!isAI) {
      // User messages: just render with mentions
      return renderTextWithMentions(content);
    }

    // AI messages: parse and render Markdown
    const blocks = parseMarkdown(content);
    
    // Group consecutive list items (bullet, numbered, task, task_done) for proper list rendering
    const elements: React.ReactNode[] = [];
    let currentListItems: { block: Block; index: number }[] = [];
    let currentListType: 'bullet' | 'numbered' | 'task' | null = null;
    let numberedIndex = 0;

    const isListType = (type: string): type is 'bullet' | 'numbered' | 'task' | 'task_done' => {
      return type === 'bullet' || type === 'numbered' || type === 'task' || type === 'task_done';
    };

    const getListCategory = (type: string): 'bullet' | 'numbered' | 'task' | null => {
      if (type === 'bullet') return 'bullet';
      if (type === 'numbered') return 'numbered';
      if (type === 'task' || type === 'task_done') return 'task';
      return null;
    };

    const flushList = () => {
      if (currentListItems.length > 0) {
        const ListTag = currentListType === 'numbered' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${currentListItems[0].block.id}`} className="my-1.5 space-y-0.5">
            {currentListItems.map(({ block, index }) => renderBlock(block, index))}
          </ListTag>
        );
        currentListItems = [];
        currentListType = null;
      }
    };

    blocks.forEach((block, idx) => {
      if (isListType(block.type)) {
        const listCategory = getListCategory(block.type);
        if (currentListType && currentListType !== listCategory) {
          flushList();
        }
        if (block.type === 'numbered') {
          if (currentListType !== 'numbered') numberedIndex = 0;
          currentListItems.push({ block, index: numberedIndex });
          numberedIndex++;
        } else {
          currentListItems.push({ block, index: idx });
        }
        currentListType = listCategory;
      } else {
        flushList();
        const rendered = renderBlock(block, idx);
        if (rendered) elements.push(rendered);
      }
    });

    flushList();

    return <div className="space-y-0.5">{elements}</div>;
  };

  // Collapsed State
  if (!isOpen) {
    return (
      <div className="w-14 h-full bg-moxt-fill-white border-r border-moxt-line-1 flex flex-col items-center py-4 z-20 shrink-0">
        <button 
          onClick={onToggle}
          className="p-2 bg-moxt-fill-1 hover:bg-moxt-fill-opacity-1 text-moxt-text-3 hover:text-moxt-brand-7 rounded-md transition-colors"
          title="Expand Chat"
        >
          <PanelLeftOpen size={20} />
        </button>
        <div className="mt-4 flex flex-col gap-4">
            <div className="w-8 h-8 bg-moxt-brand-7 rounded-lg flex items-center justify-center">
                <Tornado className="text-white" size={16} />
            </div>
        </div>
        <div className="flex-1"></div>
        <div className="writing-vertical-rl text-12 text-moxt-text-4 font-mono tracking-widest rotate-180 select-none py-4">
            PARAFLOW
        </div>
      </div>
    );
  }

  // Expanded State
  return (
    <div className="w-[420px] h-full bg-moxt-fill-white border-r border-moxt-line-1 flex flex-col z-20 flex-shrink-0">
      <div className="px-4 py-3 border-b border-moxt-line-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-moxt-brand-7 rounded-lg flex items-center justify-center">
                <Tornado className="text-white" size={16} />
            </div>
            <div>
                <h1 className="font-semibold text-moxt-text-1 text-16 tracking-tight">Paraflow</h1>
                <p className="text-[10px] text-moxt-text-4 font-mono uppercase tracking-wider">Visual Agent v1.0</p>
            </div>
        </div>
        <button 
          onClick={onToggle}
          className="p-1.5 hover:bg-moxt-fill-opacity-1 text-moxt-text-3 hover:text-moxt-text-2 rounded-md transition-colors"
          title="Collapse Chat"
        >
            <PanelLeftClose size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
            <div className="text-center mt-20 opacity-60">
                <Tornado className="w-12 h-12 text-moxt-brand-7 mx-auto mb-4 opacity-50" />
                <p className="text-moxt-text-3 text-13">Describe your app idea.<br/>I'll handle the PRD, Flow, and Prototype.</p>
            </div>
        )}
        {messages.map((msg) => {
          // Tool call message
          if (msg.type === 'tool_call' && msg.toolCall) {
            return <ToolCallMessage key={msg.id} toolCall={msg.toolCall} />;
          }

          // Question message
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

          // File operation message
          if (msg.type === 'file_operation' && msg.fileOperation) {
            return (
              <FileOperationCard
                key={msg.id}
                fileOperation={msg.fileOperation}
                onLocate={onLocateNode}
              />
            );
          }

          // Thinking message
          if (msg.type === 'thinking' && msg.thinking) {
            return <ThinkingMessage key={msg.id} thinking={msg.thinking} />;
          }

          // User and AI messages
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'max-w-[80%]' : 'w-full'}`}>
                  {/* User Images */}
                  {msg.role === 'user' && msg.images && msg.images.length > 0 && (
                    <div className={`flex gap-2 flex-wrap justify-end`}>
                      {msg.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="max-w-[200px] max-h-[200px] object-cover rounded-lg border border-moxt-line-1"
                        />
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  {msg.content && (
                      msg.role === 'user' ? (
                        // User message - keep bubble
                        <div className="px-3 py-2.75 rounded-lg text-13 leading-relaxed bg-moxt-fill-2 text-moxt-text-1 rounded-tr-none">
                          {renderMessageContent(msg.content, false)}
                        </div>
                      ) : (
                        // AI message - with Markdown support
                        <div className="text-13 leading-relaxed text-moxt-text-2">
                          {renderMessageContent(msg.content, true)}
                        </div>
                      )
                  )}

                  {/* Plan/Steps Renderer */}
                  {msg.plan && (
                      <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg p-3 flex flex-col gap-2">
                          <div className="text-[10px] font-bold text-moxt-text-4 uppercase tracking-wider mb-1">Execution Plan</div>
                          {msg.plan.map(step => (
                              <div key={step.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-moxt-fill-1 border border-moxt-line-1">
                                  {step.status === 'pending' && <CircleDashed size={14} className="text-moxt-text-4" />}
                                  {step.status === 'loading' && <Loader2 size={14} className="text-blue-500 animate-spin" />}
                                  {step.status === 'done' && <CheckCircle2 size={14} className="text-moxt-brand-7" />}

                                  <span className={`text-12 font-medium ${
                                      step.status === 'pending' ? 'text-moxt-text-3' : 'text-moxt-text-1'
                                  }`}>
                                      {step.label}
                                  </span>
                              </div>
                          ))}

                          {/* Start execution button - at bottom */}
                          {!msg.executionStarted && onStartExecution && (
                            <button
                              onClick={() => onStartExecution(msg.id)}
                              className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-moxt-brand-7 hover:opacity-90 text-white text-13 font-medium rounded-md transition-colors w-full"
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
                <div className="text-moxt-text-3 text-12 flex items-center gap-1">
                    Thinking <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </div>
            </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3">
        {/* 统一容器：FloatingTodoBar + 输入框 */}
        <div className="bg-moxt-fill-white rounded-xl border border-moxt-line-1 overflow-hidden">
          {/* Floating Todo Bar */}
          <FloatingTodoBar plan={currentPlan || null} />

          {/* 输入区域 */}
          <form 
            onSubmit={handleSubmit} 
            className="relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-moxt-brand-7/10 border-2 border-dashed border-moxt-brand-7 rounded-lg z-50 flex items-center justify-center">
              <div className="text-moxt-brand-7 font-medium text-13">Drop images here</div>
            </div>
          )}

          {/* Mention Popover */}
          {showMentions && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-moxt-fill-white border border-moxt-line-1 shadow-lg rounded-lg overflow-hidden max-h-64 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 bg-moxt-fill-1 text-[10px] font-bold text-moxt-text-4 uppercase tracking-wider border-b border-moxt-line-1">
                @ Mention
              </div>

              {/* Select from Canvas option */}
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-12 flex items-center gap-2.5 transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 border-b border-moxt-line-1"
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
                        className={`w-full text-left px-3 py-2.5 text-12 flex items-center gap-2.5 transition-colors ${
                          index === selectedIndex
                            ? 'bg-moxt-fill-1 text-moxt-brand-7'
                            : 'hover:bg-moxt-fill-opacity-1 text-moxt-text-1'
                        }`}
                        onClick={() => insertMention(item.title)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <IconComponent size={14} className={item.color} />
                        <span className="font-medium truncate flex-1">{item.title}</span>
                        <span className="text-[10px] text-moxt-text-4 uppercase tracking-wider">
                          {item.type}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="flex gap-2 px-3 pt-3 pb-1 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Upload ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-moxt-line-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-moxt-text-1 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type @ to mention files or describe your app idea..."
            disabled={isProcessing}
            rows={3}
            className="w-full bg-transparent text-moxt-text-1 placeholder-moxt-text-4 text-13 py-2 px-3 focus:outline-none focus:ring-0 border-none resize-none"
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 pb-2">
            {/* Left: Image Button */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES || isProcessing}
                className="p-1.5 hover:bg-moxt-fill-1 disabled:opacity-50 text-moxt-text-3 hover:text-moxt-text-2 rounded-md transition-colors"
                title={`Add image (${images.length}/${MAX_IMAGES})`}
              >
                <ImagePlus size={18} />
              </button>
            </div>

            {/* Right: Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && images.length === 0) || isProcessing}
              className="p-1.5 bg-moxt-brand-7 hover:opacity-90 disabled:bg-moxt-fill-2 disabled:text-moxt-text-4 text-white rounded-md transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
