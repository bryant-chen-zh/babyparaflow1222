
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AtSign } from 'lucide-react';
import { CanvasNode } from '../../types';

interface PinModalProps {
    isOpen: boolean;
    initialContent?: string;
    onSave: (content: string) => void;
    onClose: () => void;
    position: { x: number, y: number }; // Screen coordinates
    nodes: CanvasNode[];
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, initialContent = '', onSave, onClose, position, nodes }) => {
    const [content, setContent] = useState(initialContent);
    const [showMentions, setShowMentions] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        // Simple trigger for mentions (if typing @ at end)
        if (val.endsWith('@') || val.endsWith(' @')) {
            setShowMentions(true);
        } else if (!val.includes('@')) {
            setShowMentions(false);
        }
    };

    const insertMention = (nodeTitle: string) => {
        const before = content.substring(0, content.lastIndexOf('@'));
        setContent(`${before}@${nodeTitle} `);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    // Calculate modal position to keep it on screen
    const modalLeft = Math.min(window.innerWidth - 340, Math.max(20, position.x));
    const modalTop = Math.min(window.innerHeight - 250, Math.max(20, position.y - 100));

    return (
        <div className="fixed inset-0 z-[110] pointer-events-none">
             <div 
                className="pointer-events-auto absolute bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
                style={{ left: modalLeft, top: modalTop }}
             >
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                    <div className="p-1.5 bg-rose-100 rounded-lg">
                        <MapPin size={16} fill="currentColor" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Add Context Note</span>
                </div>

                <div className="relative">
                    <textarea
                        ref={inputRef}
                        className="w-full text-sm text-slate-700 resize-none outline-none bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition-all min-h-[100px]"
                        placeholder="Write a note... Use @ to link to a screen or document"
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.metaKey) {
                                onSave(content);
                            }
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                    
                    {showMentions && (
                        <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl mt-2 overflow-hidden max-h-40 overflow-y-auto z-50">
                            <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mention Node</div>
                            {nodes.map(node => (
                                <button 
                                    key={node.id}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-rose-50 hover:text-rose-700 text-slate-700 truncate flex items-center gap-2 transition-colors"
                                    onClick={() => insertMention(node.title)}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                    {node.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-1">
                    <button 
                        onClick={onClose} 
                        className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave(content)}
                        disabled={!content.trim()}
                        className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-rose-500 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                    >
                        Save Note
                    </button>
                </div>
             </div>
        </div>
    );
};
