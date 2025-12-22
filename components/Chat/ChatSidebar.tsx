
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, PanelLeftClose, PanelLeftOpen, Tornado, CheckCircle2, CircleDashed, Loader2, FileText, Layout, Monitor, Table, Zap, ListTodo, Globe, MousePointer2, AtSign, Play, Square, CheckSquare, Paperclip, X, ChevronUp, ChevronDown, Plus, History, Search, Pencil, Trash2, Check, ArrowUp, CircleArrowRight, ImagePlus } from 'lucide-react';
import { ChatMessage, CanvasNode, CanvasSection, PlanStep, UploadedFile, UploadError, MessageAttachment } from '../../types';
import { ToolCallMessage } from './ToolCallMessage';
import { QuestionCard } from './QuestionCard';
import { FloatingTodoBar } from './FloatingTodoBar';
import { FileOperationCard } from './FileOperationCard';
import { ThinkingMessage } from './ThinkingMessage';
import { ConfirmationCard } from './ConfirmationCard';
import { FileUploadList } from './FileUploadList';
import { UploadToast } from './UploadToast';
import { MessageAttachments } from './MessageAttachments';
import { parseMarkdown, renderInlineStyles, Block } from '../../utils/markdownUtils';
import { validateFile, validateBatch, processFile, filterDuplicates } from '../../utils/fileUploadUtils';
import { FILE_INPUT_ACCEPT, MAX_FILE_COUNT } from '../../constants';

// Sidebar width constraints
const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 600;

interface ChatSidebarProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, images?: string[], attachments?: MessageAttachment[]) => void;
  onStartSimulation: () => void;
  isProcessing: boolean;
  isOpen: boolean;
  onToggle: () => void;
  width?: number;
  onWidthChange?: (width: number) => void;
  nodes: CanvasNode[];
  sections: CanvasSection[];
  onEnterCanvasSelection: () => void;
  mentionedNodeIds: string[];
  selectedNodeForMention?: { nodeId: string; nodeTitle: string } | null;
  onClearSelectedNode?: () => void;
  onStartExecution?: (messageId: string) => void;
  onAnswerQuestion?: (messageId: string, questionId: string, optionId: string) => void;
  onSkipQuestion?: (messageId: string) => void;
  onContinueQuestion?: (messageId: string) => void;
  onLocateNode?: (nodeId: string) => void;
  onEditNode?: (nodeId: string) => void;
  currentPlan?: PlanStep[] | null;
  onNewChat?: () => void;
  onViewHistory?: () => void;
  onConfirm?: (messageId: string) => void;
  onRequestRevision?: (messageId: string, note: string) => void;
  // Canvas selection state
  selectedCanvasNodes?: CanvasNode[];
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
  width = 420,
  onWidthChange,
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
  onEditNode,
  currentPlan,
  onNewChat,
  onViewHistory,
  onConfirm,
  onRequestRevision,
  selectedCanvasNodes = []
}) => {
  // State
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [collapsedPlans, setCollapsedPlans] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const mentionStartPos = useRef<number>(-1);
  const [historySearch, setHistorySearch] = useState('');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [currentChatId] = useState('current'); // Current chat ID
  
  // Derived states
  const isUploading = uploadedFiles.some(f => f.status === 'uploading');
  const canSend = (input.trim() || uploadedFiles.length > 0) && !isProcessing && !isUploading;

  // Mock history data with timestamps for grouping
  const [historyItems, setHistoryItems] = useState([
    { id: 'current', title: 'New Chat', timestamp: Date.now() },
    { id: '1', title: 'Trip酒店预订', timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 }, // 2 days ago
    { id: '2', title: 'E-commerce Platform', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 }, // 5 days ago
    { id: '3', title: 'Social Media Dashboard', timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 }, // 10 days ago
    { id: '4', title: 'Task Management Tool', timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000 }, // 15 days ago
  ]);

  // Group history items by time period
  const groupHistoryItems = () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    const filtered = historyItems.filter(item => 
      item.title.toLowerCase().includes(historySearch.toLowerCase())
    );

    const today: typeof historyItems = [];
    const previous7Days: typeof historyItems = [];
    const earlier: typeof historyItems = [];

    filtered.forEach(item => {
      const age = now - item.timestamp;
      if (age < oneDayMs) {
        today.push(item);
      } else if (age < sevenDaysMs) {
        previous7Days.push(item);
      } else {
        earlier.push(item);
      }
    });

    return { today, previous7Days, earlier };
  };

  const handleDeleteHistory = (id: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleStartEdit = (id: string, title: string) => {
    setEditingHistoryId(id);
    setEditingTitle(title);
  };

  const handleSaveEdit = (id: string) => {
    if (editingTitle.trim()) {
      setHistoryItems(prev => prev.map(item => 
        item.id === id ? { ...item, title: editingTitle.trim() } : item
      ));
    }
    setEditingHistoryId(null);
    setEditingTitle('');
  };

  // Close history popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    if (showHistory) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory]);

  // Resize drag handling
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX));
      onWidthChange?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle file selection (core upload logic)
  const handleFileSelect = useCallback(async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    // 1. Validate batch first (count and total size)
    const batchValidation = validateBatch(fileArray, uploadedFiles);
    if (!batchValidation.isValid && batchValidation.error) {
      setUploadError(batchValidation.error);
      return;
    }
    
    // 2. Validate and process each file
    const processedFiles: UploadedFile[] = [];
    
    for (const file of fileArray) {
      // Validate individual file
      const fileValidation = validateFile(file, uploadedFiles);
      if (!fileValidation.isValid && fileValidation.error) {
        setUploadError(fileValidation.error);
        continue; // Skip invalid files but continue with others
      }
      
      // Process valid file
      const uploadedFile = await processFile(file);
      if (uploadedFile) {
        processedFiles.push(uploadedFile);
      }
    }
    
    if (processedFiles.length === 0) return;
    
    // 3. Handle duplicates (keep newest)
    const { uniqueNew, toRemove } = filterDuplicates(processedFiles, uploadedFiles);
    
    // 4. Update state
    setUploadedFiles(prev => {
      // Remove duplicates from existing
      const filtered = prev.filter(f => !toRemove.includes(f.id));
      // Add new files
      const updated = [...filtered, ...uniqueNew];
      // Ensure we don't exceed max count
      return updated.slice(0, MAX_FILE_COUNT);
    });
    
    // 5. Simulate upload completion (since we're doing local processing)
    // Add a small delay to show loading state for better UX
    setTimeout(() => {
      setUploadedFiles(prev => 
        prev.map(f => 
          uniqueNew.some(n => n.id === f.id) 
            ? { ...f, status: 'done' as const } 
            : f
        )
      );
    }, 300);
  }, [uploadedFiles]);

  // Remove uploaded file
  const removeUploadedFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Dismiss upload error
  const dismissUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  // Handle paste event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      // Get all files from clipboard (images and other files)
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      
      if (files.length > 0) {
        e.preventDefault();
        handleFileSelect(files);
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleFileSelect]);

  // Handle drag events (enhanced for better UX)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

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
    if (canSend) {
      // Extract preview URLs from uploaded files for backward compatibility
      const imageUrls = uploadedFiles
        .filter(f => f.category === 'image' && f.previewUrl)
        .map(f => f.previewUrl!);
      
      // Convert uploaded files to message attachments (including content for text files)
      const attachments: MessageAttachment[] = uploadedFiles.map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        category: f.category,
        format: f.format,
        previewUrl: f.previewUrl,
        content: f.content  // Text content for txt/md/json/html; undefined for images and PDF
      }));
      
      // Send message with images (for backward compat) and attachments
      onSendMessage(
        input, 
        imageUrls.length > 0 ? imageUrls : undefined,
        attachments.length > 0 ? attachments : undefined
      );
      setInput('');
      setUploadedFiles([]);
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
    const indentLevel = block.level || 0;
    const indentStyle = indentLevel > 0 ? { marginLeft: `${indentLevel * 1.5}rem` } : undefined;
    
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
          <li key={block.id} className="flex gap-2 ml-1" style={indentStyle}>
            <span className="w-[6px] h-[22px] flex items-center justify-center flex-shrink-0">
              <span className="text-moxt-text-2 text-[6px]">●</span>
            </span>
            <span className="flex-1 leading-[22px]">{content}</span>
          </li>
        );
      case 'numbered':
        return (
          <li key={block.id} className="flex items-start gap-2 ml-1" style={indentStyle}>
            <span className="text-moxt-text-2 font-medium min-w-[1.25rem] leading-[22px]">{index + 1}.</span>
            <span className="flex-1 leading-[22px]">{content}</span>
          </li>
        );
      case 'task':
        return (
          <li key={block.id} className="flex items-start gap-2 ml-1" style={indentStyle}>
            <Square size={14} className="text-moxt-text-3 mt-[4px] flex-shrink-0" />
            <span className="flex-1 leading-[22px]">{content}</span>
          </li>
        );
      case 'task_done':
        return (
          <li key={block.id} className="flex items-start gap-2 ml-1" style={indentStyle}>
            <CheckSquare size={14} className="text-moxt-brand-7 mt-[4px] flex-shrink-0" />
            <span className="flex-1 line-through text-moxt-text-3 leading-[22px]">{content}</span>
          </li>
        );
      case 'blockquote':
        return (
          <blockquote key={block.id} className="border-l-2 border-moxt-line-2 pl-3 py-0.5 my-1 text-moxt-text-3 italic" style={indentStyle}>
            {content}
          </blockquote>
        );
      case 'code_block':
        return (
          <pre key={block.id} className="bg-moxt-fill-1 border border-moxt-line-1 rounded-md p-3 my-1.5 overflow-x-auto" style={indentStyle}>
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
          <p key={block.id} className="my-0.5 leading-[22px]" style={indentStyle}>
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
    
    // Group consecutive list items for proper list rendering
    // Track numbered indices by level to handle nested lists correctly
    const elements: React.ReactNode[] = [];
    let currentListItems: { block: Block; index: number }[] = [];
    let numberedIndices: Record<number, number> = {}; // level -> current index

    const isListType = (type: string): type is 'bullet' | 'numbered' | 'task' | 'task_done' => {
      return type === 'bullet' || type === 'numbered' || type === 'task' || type === 'task_done';
    };

    const flushList = () => {
      if (currentListItems.length > 0) {
        // Determine list tag based on first item
        const firstItem = currentListItems[0].block;
        const ListTag = firstItem.type === 'numbered' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${currentListItems[0].block.id}`} className="my-1.5 space-y-0.5">
            {currentListItems.map(({ block, index }) => renderBlock(block, index))}
          </ListTag>
        );
        currentListItems = [];
      }
    };

    blocks.forEach((block, idx) => {
      if (isListType(block.type)) {
        const level = block.level || 0;
        
        if (block.type === 'numbered') {
          // Initialize or get the numbered index for this level
          if (numberedIndices[level] === undefined) {
            numberedIndices[level] = 0;
          }
          currentListItems.push({ block, index: numberedIndices[level] });
          numberedIndices[level]++;
        } else {
          // For bullets and tasks, use original idx (not used for display anyway)
          currentListItems.push({ block, index: idx });
        }
      } else {
        // Non-list block encountered
        flushList();
        // Reset numbered indices when we exit list context
        numberedIndices = {};
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
    <div 
      className="h-full bg-moxt-fill-white border-r border-moxt-line-1 flex flex-col z-20 flex-shrink-0 relative"
      style={{ width: `${width}px` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Upload Error Toast */}
      <UploadToast error={uploadError} onDismiss={dismissUploadError} />
      
      {/* Resize Handle */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors hover:bg-moxt-brand-7/30 ${isResizing ? 'bg-moxt-brand-7/50' : 'bg-transparent'}`}
        onMouseDown={handleResizeStart}
      />
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

      {/* Chat Actions Bar */}
      <div className="px-4 py-2.5 border-b border-moxt-line-1 flex items-center justify-between">
        <span className="text-13 font-medium text-moxt-text-1">New Chat</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className="p-1.5 hover:bg-moxt-fill-1 text-moxt-text-3 hover:text-moxt-text-2 rounded-md transition-colors"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 hover:bg-moxt-fill-1 text-moxt-text-3 hover:text-moxt-text-2 rounded-md transition-colors ${showHistory ? 'bg-moxt-fill-1' : ''}`}
              title="View History"
            >
              <History size={16} />
            </button>
            
            {/* History Popover */}
            {showHistory && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-moxt-line-1 rounded-lg shadow-lg z-50 overflow-hidden">
                {/* Search Box */}
                <div className="px-3 py-2.5 border-b border-moxt-line-1">
                  <div className="flex items-center gap-2 text-moxt-text-3">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="flex-1 bg-transparent text-13 text-moxt-text-1 placeholder-moxt-text-4 outline-none"
                    />
                  </div>
                </div>
                
                {/* History List */}
                <div className="max-h-80 overflow-y-auto">
                  {(() => {
                    const { today, previous7Days, earlier } = groupHistoryItems();
                    return (
                      <>
                        {today.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-11 font-medium text-moxt-text-4">Today</div>
                            {today.map((item) => (
                              <div
                                key={item.id}
                                className={`group flex items-center px-3 py-2 transition-colors cursor-pointer ${
                                  item.id === currentChatId 
                                    ? 'bg-moxt-fill-2' 
                                    : 'hover:bg-moxt-brand-7/10'
                                }`}
                                onClick={() => {
                                  if (editingHistoryId !== item.id) {
                                    setShowHistory(false);
                                    onViewHistory?.();
                                  }
                                }}
                              >
                                {editingHistoryId === item.id ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit(item.id);
                                        if (e.key === 'Escape') setEditingHistoryId(null);
                                      }}
                                      className="flex-1 bg-white border border-moxt-line-1 rounded px-2 py-1 text-13 outline-none focus:border-moxt-brand-7"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(item.id); }}
                                      className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-brand-7"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="flex-1 text-13 text-moxt-text-1 truncate">{item.title}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleStartEdit(item.id, item.title); }}
                                        className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-text-3 hover:text-moxt-text-2"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id); }}
                                        className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-text-3 hover:text-red-500"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {previous7Days.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-11 font-medium text-moxt-text-4">Previous 7 Days</div>
                            {previous7Days.map((item) => (
                              <div
                                key={item.id}
                                className={`group flex items-center px-3 py-2 transition-colors cursor-pointer ${
                                  item.id === currentChatId 
                                    ? 'bg-moxt-fill-2' 
                                    : 'hover:bg-moxt-brand-7/10'
                                }`}
                                onClick={() => {
                                  if (editingHistoryId !== item.id) {
                                    setShowHistory(false);
                                    onViewHistory?.();
                                  }
                                }}
                              >
                                {editingHistoryId === item.id ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit(item.id);
                                        if (e.key === 'Escape') setEditingHistoryId(null);
                                      }}
                                      className="flex-1 bg-white border border-moxt-line-1 rounded px-2 py-1 text-13 outline-none focus:border-moxt-brand-7"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(item.id); }}
                                      className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-brand-7"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="flex-1 text-13 text-moxt-text-1 truncate">{item.title}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleStartEdit(item.id, item.title); }}
                                        className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-text-3 hover:text-moxt-text-2"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id); }}
                                        className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-text-3 hover:text-red-500"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {earlier.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-11 font-medium text-moxt-text-4">Earlier</div>
                            {earlier.map((item) => (
                              <div
                                key={item.id}
                                className={`group flex items-center px-3 py-2 transition-colors cursor-pointer ${
                                  item.id === currentChatId 
                                    ? 'bg-moxt-fill-2' 
                                    : 'hover:bg-moxt-brand-7/10'
                                }`}
                                onClick={() => {
                                  if (editingHistoryId !== item.id) {
                                    setShowHistory(false);
                                    onViewHistory?.();
                                  }
                                }}
                              >
                                {editingHistoryId === item.id ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit(item.id);
                                        if (e.key === 'Escape') setEditingHistoryId(null);
                                      }}
                                      className="flex-1 bg-white border border-moxt-line-1 rounded px-2 py-1 text-13 outline-none focus:border-moxt-brand-7"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(item.id); }}
                                      className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-brand-7"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="flex-1 text-13 text-moxt-text-1 truncate">{item.title}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleStartEdit(item.id, item.title); }}
                                        className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-text-3 hover:text-moxt-text-2"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id); }}
                                        className="p-1 hover:bg-moxt-fill-1 rounded text-moxt-text-3 hover:text-red-500"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {today.length === 0 && previous7Days.length === 0 && earlier.length === 0 && (
                          <div className="px-3 py-4 text-center text-13 text-moxt-text-4">
                            No results found
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
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
            return <ToolCallMessage toolCall={msg.toolCall} />;
          }

          // Question message - render in message list
          if (msg.type === 'question' && msg.question) {
            return (
              <div key={msg.id}>
                <QuestionCard
                  question={msg.question}
                  onSelectOption={(questionId, optionId) => onAnswerQuestion?.(msg.id, questionId, optionId)}
                  onSkip={() => onSkipQuestion?.(msg.id)}
                  onContinue={() => onContinueQuestion?.(msg.id)}
                  collapsed={msg.collapsed}
                />
              </div>
            );
          }

          // File operation message
          if (msg.type === 'file_operation' && msg.fileOperation) {
            return (
              <FileOperationCard
                fileOperation={msg.fileOperation}
                onLocate={onLocateNode}
              />
            );
          }

          // Thinking message
          if (msg.type === 'thinking' && msg.thinking) {
            return <ThinkingMessage thinking={msg.thinking} />;
          }

          // Confirmation message - Chat confirmation mode
          if (msg.type === 'confirmation' && msg.confirmation) {
            return (
              <ConfirmationCard
                key={msg.id}
                data={msg.confirmation}
                onConfirm={() => onConfirm?.(msg.id)}
                onRequestRevision={(note) => onRequestRevision?.(msg.id, note)}
                onLocate={(nodeId) => onLocateNode?.(nodeId)}
                onEdit={(nodeId) => onEditNode?.(nodeId)}
              />
            );
          }

          // User and AI messages
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'max-w-[80%]' : 'w-full'}`}>
                  {/* User Attachments (new) */}
                  {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                    <MessageAttachments attachments={msg.attachments} align="right" />
                  )}
                  
                  {/* Legacy: User Images (for backward compatibility) */}
                  {msg.role === 'user' && !msg.attachments && msg.images && msg.images.length > 0 && (
                    <div className={`flex gap-2 flex-wrap justify-end`}>
                      {msg.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="max-w-[120px] max-h-[120px] object-cover rounded-lg border border-moxt-line-1"
                        />
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  {msg.content && (
                      msg.role === 'user' ? (
                        // User message - keep bubble
                        <div 
                          className="rounded-xl rounded-tr-none"
                          style={{
                            backgroundColor: '#F6F6F7',
                            color: '#0D0E13',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            fontWeight: 400,
                            lineHeight: '22px',
                            padding: '12px 16px'
                          }}
                        >
                          {renderMessageContent(msg.content, false)}
                        </div>
                      ) : (
                        // AI message - with Markdown support
                        <div 
                          style={{
                            color: '#0D0E13',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            fontWeight: 400,
                            lineHeight: '22px'
                          }}
                        >
                          {renderMessageContent(msg.content, true)}
                        </div>
                      )
                  )}

                  {/* Plan/Steps Renderer - Cursor-style */}
                  {msg.plan && (() => {
                    const isCollapsed = collapsedPlans.has(msg.id);
                    const toggleCollapse = () => {
                      setCollapsedPlans(prev => {
                        const next = new Set(prev);
                        if (next.has(msg.id)) {
                          next.delete(msg.id);
                        } else {
                          next.add(msg.id);
                        }
                        return next;
                      });
                    };
                    const doneCount = msg.plan.filter(s => s.status === 'done').length;
                    const totalCount = msg.plan.length;

                    return (
                      <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg overflow-hidden">
                          {/* Header */}
                          <button 
                            onClick={toggleCollapse}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-moxt-fill-1/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <ListTodo size={16} className="text-moxt-brand-7" />
                              <span className="text-13 font-semibold text-moxt-text-1">
                                To-dos ({doneCount}/{totalCount})
                              </span>
                            </div>
                            {isCollapsed ? (
                              <ChevronDown size={16} className="text-moxt-text-3" />
                            ) : (
                              <ChevronUp size={16} className="text-moxt-text-3" />
                            )}
                          </button>

                          {/* Todo List - Collapsible */}
                          {!isCollapsed && (
                            <>
                              <div className="px-4 py-3 border-t border-moxt-line-1" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {msg.plan.map(step => (
                                  <div key={step.id} className="flex items-start gap-2">
                                      {step.status === 'pending' && (
                                        <CircleDashed size={16} className="text-moxt-text-4 flex-shrink-0 mt-1" />
                                      )}
                                      {step.status === 'loading' && (
                                        <CircleArrowRight size={16} className="text-moxt-brand-7 flex-shrink-0 mt-1" />
                                      )}
                                      {step.status === 'done' && (
                                        <CheckCircle2 size={16} className="text-moxt-brand-7 flex-shrink-0 mt-1" />
                                      )}

                                      <span 
                                        style={{
                                          color: step.status === 'pending' ? '#9CA3AF' : '#0D0E13',
                                          fontFamily: 'Inter, sans-serif',
                                          fontSize: '13px',
                                          fontWeight: 400,
                                          lineHeight: '24px',
                                          textDecoration: 'none'
                                        }}
                                      >
                                          {step.label}
                                      </span>
                                  </div>
                                ))}
                              </div>

                              {/* Footer with Button */}
                              {!msg.executionStarted && onStartExecution && (
                                <div className="px-3 py-2 border-t border-moxt-line-1 bg-moxt-fill-1/30 flex items-center justify-between">
                                  <span className="text-12 text-moxt-text-2 pl-1 font-medium">
                                    Ready to start
                                  </span>
                                  <button
                                    onClick={() => onStartExecution(msg.id)}
                                    className="px-3 py-1.5 bg-moxt-brand-7 hover:bg-moxt-brand-7/90 text-white text-12 font-medium rounded-lg transition-colors shadow-sm"
                                  >
                                    Start
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                      </div>
                    );
                  })()}
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

      <div className="px-4 py-3 flex flex-col gap-2">
        {/* 统一容器：FloatingTodoBar + 输入框 */}
        <div className="bg-moxt-fill-white rounded-xl border border-moxt-line-1 overflow-hidden">
          {/* Floating Todo Bar */}
          <FloatingTodoBar plan={currentPlan || null} />

          {/* Canvas Selection Indicator */}
          {selectedCanvasNodes.length > 0 && (
            <div className="px-4 py-2.5 border-b border-moxt-line-1 bg-moxt-fill-1/30 flex items-center gap-2 overflow-hidden">
              <span className="text-13 text-moxt-text-3 flex-shrink-0">Selected:</span>
              {selectedCanvasNodes.length === 1 ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  {(() => {
                    const node = selectedCanvasNodes[0];
                    const IconComponent = getNodeIcon(node.type);
                    const colorClass = getNodeColor(node.type);
                    return (
                      <>
                        <IconComponent size={14} className={`${colorClass} flex-shrink-0`} />
                        <span className="text-13 font-medium text-moxt-text-1 truncate">{node.title}</span>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <span className="text-13 font-semibold text-moxt-text-1">{selectedCanvasNodes.length} items</span>
              )}
            </div>
          )}

          {/* 输入区域 */}
          <form 
            onSubmit={handleSubmit} 
            className="relative"
          >
          {/* Input Area Drag Overlay - Styled exactly like screenshot */}
          {isDragging && (
            <div className="absolute inset-0 z-[100] bg-[#ECFDF5]/95 border-2 border-dashed border-emerald-500 rounded-xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
              <div className="flex flex-col items-center gap-3">
                {/* Icon */}
                <div className="w-12 h-12 flex items-center justify-center relative">
                  <ImagePlus size={36} className="text-[#334155]" strokeWidth={1.5} />
                  <div className="absolute top-1/2 left-1/2 ml-2 mt-2 bg-[#ECFDF5] rounded-full p-[1px]">
                    <Plus size={12} className="text-[#334155]" strokeWidth={2.5} />
                  </div>
                </div>
                
                {/* Text */}
                <p className="text-[15px] font-medium text-[#0F172A] text-center px-4">
                  Drop files here to add to message
                </p>
              </div>
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

          {/* File Upload Preview */}
          <FileUploadList files={uploadedFiles} onRemove={removeUploadedFile} />

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
            {/* Left: File Upload Button */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_INPUT_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFileSelect(e.target.files);
                  // Reset input value to allow re-selecting same file
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadedFiles.length >= MAX_FILE_COUNT || isProcessing}
                className="p-1.5 hover:bg-moxt-fill-1 disabled:opacity-50 text-moxt-text-3 hover:text-moxt-text-2 rounded-md transition-colors"
                title={`Add files (${uploadedFiles.length}/${MAX_FILE_COUNT})`}
              >
                <Paperclip size={18} />
              </button>
            </div>

            {/* Right: Send Button */}
            <div className="relative group">
              <button
                type="submit"
                disabled={!canSend}
                className="p-1.5 bg-moxt-brand-7 hover:opacity-90 disabled:bg-moxt-fill-2 disabled:text-moxt-text-4 text-white rounded-lg transition-colors"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
              {/* Tooltip for uploading state */}
              {isUploading && (
                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-moxt-text-1 text-white text-11 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  File upload pending
                </div>
              )}
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
