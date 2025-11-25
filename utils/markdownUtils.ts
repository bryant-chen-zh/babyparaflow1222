
import React from 'react';

export type BlockType = 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'paragraph' | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

// Parse raw markdown string into structured blocks
export const parseMarkdown = (text: string): Block[] => {
  if (!text) return [];
  return text.split('\n').map(line => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // H1
    if (line.startsWith('# ')) {
      return { id, type: 'h1', content: line.slice(2) };
    }
    // H2
    if (line.startsWith('## ')) {
      return { id, type: 'h2', content: line.slice(3) };
    }
    // H3
    if (line.startsWith('### ')) {
      return { id, type: 'h3', content: line.slice(4) };
    }
    // Bullet
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return { id, type: 'bullet', content: line.slice(2) };
    }
    // Numbered
    if (/^\d+\.\s/.test(line)) {
       return { id, type: 'numbered', content: line.replace(/^\d+\.\s/, '') };
    }
    // Divider
    if (line === '---' || line === '***') {
        return { id, type: 'divider', content: '' };
    }
    // Paragraph (Default)
    return { id, type: 'paragraph', content: line };
  });
};

// Convert blocks back to markdown string
export const blocksToMarkdown = (blocks: Block[]): string => {
  return blocks.map((b, index) => {
    switch (b.type) {
      case 'h1': return `# ${b.content}`;
      case 'h2': return `## ${b.content}`;
      case 'h3': return `### ${b.content}`;
      case 'bullet': return `- ${b.content}`;
      case 'numbered': return `${index + 1}. ${b.content}`; // Simplified numbering
      case 'divider': return '---';
      default: return b.content;
    }
  }).join('\n');
};

// Simple inline formatter for bold text (e.g. **bold**)
// Note: This is a basic regex replacer for display purposes.
export const renderInlineStyles = (text: string) => {
    // Split by bold (**), italic (_), and code (`)
    // Regex explanation:
    // (\*\*.*?\*\*) -> Bold
    // (`.*?`) -> Code
    // (?:^|\s)(_.*?_)(?:$|\s) -> Italic (simplified, usually needs boundaries)
    
    // We'll do a simple pass for each.
    
    if (!text) return null;

    // 1. Split for Code
    const codeParts = text.split(/(`[^`]+`)/g);
    
    return codeParts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
            return React.createElement('code', {
                key: i,
                className: "bg-slate-100 text-brand-600 px-1.5 py-0.5 rounded text-sm font-mono"
            }, part.slice(1, -1));
        }
        
        // 2. Split for Bold
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((subPart, j) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
                 return React.createElement('strong', {
                    key: `${i}-${j}`,
                    className: "font-bold text-slate-900"
                 }, subPart.slice(2, -2));
            }

            // 3. Split for Italic (simple _text_)
            const italicParts = subPart.split(/(_[^_]+_)/g);
            return italicParts.map((innerPart, k) => {
                if (innerPart.startsWith('_') && innerPart.endsWith('_')) {
                     return React.createElement('em', {
                        key: `${i}-${j}-${k}`,
                        className: "italic text-slate-800"
                     }, innerPart.slice(1, -1));
                }
                return innerPart;
            });
        });
    });
};
