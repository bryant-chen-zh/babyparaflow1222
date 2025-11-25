
import React, { useState, useEffect, useRef } from 'react';
import { 
    ArrowLeft, Check, FileText, Plus, 
    Heading1, Heading2, Heading3, 
    List, ListOrdered, Type, Minus,
    Bold, Italic, Code, X
} from 'lucide-react';
import { parseMarkdown, blocksToMarkdown, Block, BlockType } from '../../utils/markdownUtils';

interface MarkdownModalProps {
  isOpen: boolean;
  title: string;
  initialContent: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

interface SlashMenuState {
    isOpen: boolean;
    blockId: string;
    top: number;
    left: number;
}

interface SelectionMenuState {
    isOpen: boolean;
    blockId: string;
    start: number;
    end: number;
    top: number;
    left: number;
}

export const MarkdownModal: React.FC<MarkdownModalProps> = ({ isOpen, title, initialContent, onSave, onClose }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const blockRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // Floating Menus State
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState | null>(null);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseMarkdown(initialContent);
      if (parsed.length === 0) {
          setBlocks([{ id: 'init', type: 'paragraph', content: '' }]);
      } else {
          setBlocks(parsed);
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [initialContent, isOpen]);

  useEffect(() => {
      if (focusedBlockId && blockRefs.current[focusedBlockId]) {
          const el = blockRefs.current[focusedBlockId];
          el?.focus();
      }
  }, [focusedBlockId]);

  const handleClose = () => {
    onSave(blocksToMarkdown(blocks));
    onClose();
  };

  // --- Slash Command Logic ---
  
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>, id: string) => {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
      
      const val = target.value;
      
      // Check for Slash Command trigger
      if (val === '/') {
         const rect = target.getBoundingClientRect();
         setSlashMenu({
             isOpen: true,
             blockId: id,
             top: rect.bottom + window.scrollY + 5,
             left: rect.left + window.scrollX
         });
      } else if (slashMenu && slashMenu.blockId === id && val !== '/') {
          // Close if user keeps typing (or we could filter commands)
          if (!val.startsWith('/')) setSlashMenu(null);
      } else {
          setSlashMenu(null);
      }

      updateBlockContent(id, val);
  };

  const updateBlockContent = (id: string, content: string) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const changeBlockType = (type: BlockType) => {
      if (!slashMenu) return;
      setBlocks(prev => prev.map(b => {
          if (b.id === slashMenu.blockId) {
              return { ...b, type, content: b.content.replace('/', '').trim() };
          }
          return b;
      }));
      setSlashMenu(null);
      // refocus
      setTimeout(() => blockRefs.current[slashMenu.blockId]?.focus(), 10);
  };

  // --- Selection Logic ---

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>, id: string) => {
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (start !== end) {
          // Text selected
          // Calculate position (approximate based on mouse would be better, but simple fallback is input top)
          // We'll use a fixed offset from the textarea for now, or try to use the mouse event if available
          // Since this is onSelect, we don't have mouse coordinates easily.
          // Better to use onMouseUp for positioning.
      } else {
          setSelectionMenu(null);
      }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>, id: string) => {
     const target = e.target as HTMLTextAreaElement;
     const start = target.selectionStart;
     const end = target.selectionEnd;

     if (start !== end) {
         // Show toolbar above cursor
         setSelectionMenu({
             isOpen: true,
             blockId: id,
             start,
             end,
             top: e.clientY - 50,
             left: e.clientX - 50
         });
     } else {
         setSelectionMenu(null);
     }
  };

  const applyFormat = (format: 'bold' | 'italic' | 'code') => {
      if (!selectionMenu) return;
      
      setBlocks(prev => prev.map(b => {
          if (b.id === selectionMenu.blockId) {
              const text = b.content;
              const s = selectionMenu.start;
              const e = selectionMenu.end;
              const selection = text.substring(s, e);
              let formatted = '';
              
              if (format === 'bold') formatted = `**${selection}**`;
              if (format === 'italic') formatted = `_${selection}_`;
              if (format === 'code') formatted = `\`${selection}\``;

              const newContent = text.substring(0, s) + formatted + text.substring(e);
              
              // Restore cursor? Difficult with React rerender, but we'll try to close menu
              return { ...b, content: newContent };
          }
          return b;
      }));
      setSelectionMenu(null);
  };

  // --- Keyboard Navigation ---
  const handleKeyDown = (e: React.KeyboardEvent, index: number, id: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // If slash menu is open, maybe select first item? (Simplified: just close it and new line)
        setSlashMenu(null);

        const newId = Math.random().toString(36).substr(2, 9);
        const currentBlock = blocks[index];
        
        // If in a list, continue list type
        let nextType: BlockType = 'paragraph';
        if (currentBlock.type === 'bullet') nextType = 'bullet';
        if (currentBlock.type === 'numbered') nextType = 'numbered';

        const newBlock: Block = { id: newId, type: nextType, content: '' };
        
        setBlocks(prev => {
            const newBlocks = [...prev];
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
        });
        setFocusedBlockId(newId);
    } else if (e.key === 'Backspace') {
        if (blocks[index].content === '') {
            // If it's a special type, revert to paragraph first
            if (blocks[index].type !== 'paragraph') {
                e.preventDefault();
                setBlocks(prev => prev.map(b => b.id === id ? { ...b, type: 'paragraph' } : b));
                return;
            }
            
            // Delete block if not the only one
            if (blocks.length > 1) {
                e.preventDefault();
                setBlocks(prev => prev.filter(b => b.id !== id));
                if (index > 0) setFocusedBlockId(blocks[index - 1].id);
            }
        }
    } else if (e.key === 'ArrowUp' && index > 0) {
        setFocusedBlockId(blocks[index - 1].id);
    } else if (e.key === 'ArrowDown' && index < blocks.length - 1) {
        setFocusedBlockId(blocks[index + 1].id);
    } else if (e.key === 'Escape') {
        setSlashMenu(null);
        setSelectionMenu(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Zen Header */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClose}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors group"
            title="Go Back"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-3">
             <FileText className="text-brand-600" size={18} />
             <h2 className="text-slate-900 font-medium text-sm tracking-wide">{title}</h2>
          </div>
        </div>

        <button 
          onClick={handleClose}
          className="px-5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Check size={14} strokeWidth={3} />
          <span>Done</span>
        </button>
      </div>

      {/* Zen Editor Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white cursor-text" onClick={() => {
          if (blocks.length > 0) {
             // Focus last block if clicking bottom empty area
             setFocusedBlockId(blocks[blocks.length - 1].id);
          }
      }}>
        <div className="max-w-3xl mx-auto py-12 px-8 pb-32 relative">
            
            {blocks.map((block, index) => {
                // List indexing
                let listIndex = 0;
                if (block.type === 'numbered') {
                    listIndex = 1;
                    for (let i = index - 1; i >= 0; i--) {
                       if (blocks[i].type === 'numbered') listIndex++;
                       else break;
                    }
                }

                return (
                    <div key={block.id} className="relative group my-1">
                        {/* Block Drag Handle / Add Hint */}
                        <div className="absolute -left-10 top-1.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer select-none">
                            <Plus size={16} className="hover:text-brand-500" onClick={() => {
                                const newId = Math.random().toString(36).substr(2, 9);
                                const newBlock: Block = { id: newId, type: 'paragraph', content: '' };
                                setBlocks(prev => {
                                    const copy = [...prev];
                                    copy.splice(index + 1, 0, newBlock);
                                    return copy;
                                });
                            }} />
                            <div className="p-1 hover:bg-slate-100 rounded">
                                <div className="w-1 h-1 bg-slate-300 rounded-full mb-0.5"></div>
                                <div className="w-1 h-1 bg-slate-300 rounded-full mb-0.5"></div>
                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                            </div>
                        </div>

                        {/* Styling based on type */}
                        <div className={`relative flex items-start
                            ${block.type === 'h1' ? 'text-4xl font-bold text-slate-900 mb-6 mt-8' : ''}
                            ${block.type === 'h2' ? 'text-3xl font-semibold text-slate-800 mb-4 mt-6' : ''}
                            ${block.type === 'h3' ? 'text-2xl font-semibold text-slate-800 mb-3 mt-4' : ''}
                            ${block.type === 'paragraph' ? 'text-lg text-slate-700 mb-2 leading-relaxed' : ''}
                            ${block.type === 'bullet' ? 'mb-1' : ''}
                            ${block.type === 'numbered' ? 'mb-1' : ''}
                            ${block.type === 'divider' ? 'py-4' : ''}
                        `}>
                            {block.type === 'bullet' && (
                                <span className="text-slate-400 text-2xl mr-2 leading-tight select-none">•</span>
                            )}
                            {block.type === 'numbered' && (
                                <span className="text-slate-400 text-lg font-mono mr-2 mt-0.5 select-none">{listIndex}.</span>
                            )}
                            
                            {block.type === 'divider' ? (
                                <hr className="w-full border-slate-200 border-t-2" />
                            ) : (
                                <textarea
                                    ref={(el) => { blockRefs.current[block.id] = el; }}
                                    rows={1}
                                    className={`w-full bg-transparent resize-none focus:outline-none placeholder-slate-300 font-inherit
                                        ${block.type === 'h1' ? 'placeholder:text-slate-200' : ''}
                                    `}
                                    value={block.content}
                                    placeholder={block.type === 'h1' ? 'Heading 1' : block.type === 'paragraph' && blocks.length === 1 ? "Type '/' for commands" : ''}
                                    onInput={(e) => handleInput(e, block.id)}
                                    onKeyDown={(e) => handleKeyDown(e, index, block.id)}
                                    onSelect={(e) => handleSelect(e, block.id)}
                                    onMouseUp={(e) => handleMouseUp(e, block.id)}
                                    style={{ height: 'auto' }}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- Slash Menu Popover --- */}
      {slashMenu && (
          <div 
            className="fixed z-[110] bg-white rounded-lg shadow-xl border border-slate-200 w-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
            style={{ top: slashMenu.top, left: slashMenu.left }}
          >
              <div className="bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Blocks</div>
              <SlashMenuItem icon={Type} label="Text" onClick={() => changeBlockType('paragraph')} />
              <SlashMenuItem icon={Heading1} label="Heading 1" onClick={() => changeBlockType('h1')} />
              <SlashMenuItem icon={Heading2} label="Heading 2" onClick={() => changeBlockType('h2')} />
              <SlashMenuItem icon={Heading3} label="Heading 3" onClick={() => changeBlockType('h3')} />
              <SlashMenuItem icon={List} label="Bullet List" onClick={() => changeBlockType('bullet')} />
              <SlashMenuItem icon={ListOrdered} label="Numbered List" onClick={() => changeBlockType('numbered')} />
              <SlashMenuItem icon={Minus} label="Divider" onClick={() => changeBlockType('divider')} />
          </div>
      )}

      {/* --- Selection Toolbar Popover --- */}
      {selectionMenu && (
          <div 
            className="fixed z-[110] bg-slate-900 text-white rounded-lg shadow-xl flex items-center p-1 animate-in fade-in zoom-in-95 duration-100 gap-0.5"
            style={{ top: selectionMenu.top, left: selectionMenu.left }}
          >
             <SelectionBtn icon={Bold} onClick={() => applyFormat('bold')} />
             <SelectionBtn icon={Italic} onClick={() => applyFormat('italic')} />
             <SelectionBtn icon={Code} onClick={() => applyFormat('code')} />
             <div className="w-px h-4 bg-slate-700 mx-1"></div>
             <SelectionBtn icon={X} onClick={() => setSelectionMenu(null)} />
          </div>
      )}

    </div>
  );
};

const SlashMenuItem = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 text-slate-700 text-sm w-full text-left transition-colors"
    >
        <div className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center bg-white text-slate-500">
            <Icon size={16} />
        </div>
        <span>{label}</span>
    </button>
);

const SelectionBtn = ({ icon: Icon, onClick }: { icon: any, onClick: () => void }) => (
    <button onClick={onClick} className="p-1.5 hover:bg-slate-700 rounded text-slate-200 hover:text-white transition-colors">
        <Icon size={16} />
    </button>
);
