
import React from 'react';

export type BlockType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'bullet' | 'numbered' | 'paragraph' | 'divider' | 'blockquote' | 'code_block' | 'task' | 'task_done';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  language?: string; // For code blocks
  level?: number; // Indentation level (0 for base)
}

// Parse raw markdown string into structured blocks
export const parseMarkdown = (text: string): Block[] => {
  if (!text) return [];
  
  // First, check if the text contains inline bullet points (• separated items)
  // This handles cases like "text: • item1 • item2 • item3"
  const inlineBulletPattern = /•\s*[^•]+/g;
  const hasInlineBullets = text.includes('•') && !text.includes('\n•');
  
  if (hasInlineBullets) {
    // Split by • and process
    const blocks: Block[] = [];
    
    // Find the prefix before the first bullet
    const firstBulletIndex = text.indexOf('•');
    if (firstBulletIndex > 0) {
      const prefix = text.substring(0, firstBulletIndex).trim();
      if (prefix) {
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'paragraph',
          content: prefix,
          level: 0
        });
      }
    }
    
    // Extract all bullet items
    const matches = text.match(inlineBulletPattern);
    if (matches) {
      matches.forEach(match => {
        const content = match.replace(/^•\s*/, '').trim();
        if (content) {
          blocks.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'bullet',
            content,
            level: 0
          });
        }
      });
    }
    
    return blocks;
  }
  
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const rawLine = lines[i];
    
    // Calculate indentation level (2 spaces = 1 level)
    const indentation = rawLine.match(/^\s*/)?.[0] || '';
    const level = Math.floor(indentation.length / 2);
    
    // Work with trimmed line for type detection, but preserve indentation for block content if needed
    const line = rawLine.trim();
    
    // If line is empty, skip
    if (!line) {
      i++;
      continue;
    }

    const id = Math.random().toString(36).substr(2, 9);
    
    // Code block (fenced with ```)
    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]); // Keep indentation inside code blocks
        i++;
      }
      blocks.push({
        id,
        type: 'code_block',
        content: codeLines.join('\n'),
        language,
        level: 0
      });
      i++; // Skip closing ```
      continue;
    }
    
    // H6
    if (line.startsWith('###### ')) {
      blocks.push({ id, type: 'h6', content: line.slice(7), level: 0 });
      i++;
      continue;
    }
    // H5
    if (line.startsWith('##### ')) {
      blocks.push({ id, type: 'h5', content: line.slice(6), level: 0 });
      i++;
      continue;
    }
    // H4
    if (line.startsWith('#### ')) {
      blocks.push({ id, type: 'h4', content: line.slice(5), level: 0 });
      i++;
      continue;
    }
    // H3
    if (line.startsWith('### ')) {
      blocks.push({ id, type: 'h3', content: line.slice(4), level: 0 });
      i++;
      continue;
    }
    // H2
    if (line.startsWith('## ')) {
      blocks.push({ id, type: 'h2', content: line.slice(3), level: 0 });
      i++;
      continue;
    }
    // H1
    if (line.startsWith('# ')) {
      blocks.push({ id, type: 'h1', content: line.slice(2), level: 0 });
      i++;
      continue;
    }
    
    // Task list (unchecked)
    if (line.startsWith('- [ ] ') || line.startsWith('* [ ] ')) {
      blocks.push({ id, type: 'task', content: line.slice(6), level });
      i++;
      continue;
    }
    // Task list (checked)
    if (line.startsWith('- [x] ') || line.startsWith('- [X] ') || line.startsWith('* [x] ') || line.startsWith('* [X] ')) {
      blocks.push({ id, type: 'task_done', content: line.slice(6), level });
      i++;
      continue;
    }
    
    // Bullet (standard markdown - and *, plus • character)
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      blocks.push({ id, type: 'bullet', content: line.slice(2), level });
      i++;
      continue;
    }
    
    // Numbered
    if (/^\d+\.\s/.test(line)) {
      blocks.push({ id, type: 'numbered', content: line.replace(/^\d+\.\s/, ''), level });
      i++;
      continue;
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      blocks.push({ id, type: 'blockquote', content: line.slice(2), level });
      i++;
      continue;
    }
    if (line.startsWith('>')) {
      blocks.push({ id, type: 'blockquote', content: line.slice(1), level });
      i++;
      continue;
    }
    
    // Divider
    if (line === '---' || line === '***' || line === '___') {
      blocks.push({ id, type: 'divider', content: '', level: 0 });
      i++;
      continue;
    }
    
    // Paragraph (Default)
    blocks.push({ id, type: 'paragraph', content: line, level });
    i++;
  }
  
  return blocks;
};

// Convert blocks back to markdown string
export const blocksToMarkdown = (blocks: Block[]): string => {
  return blocks.map((b, index) => {
    const indent = b.level ? '  '.repeat(b.level) : '';
    switch (b.type) {
      case 'h1': return `# ${b.content}`;
      case 'h2': return `## ${b.content}`;
      case 'h3': return `### ${b.content}`;
      case 'h4': return `#### ${b.content}`;
      case 'h5': return `##### ${b.content}`;
      case 'h6': return `###### ${b.content}`;
      case 'bullet': return `${indent}- ${b.content}`;
      case 'numbered': return `${indent}${index + 1}. ${b.content}`;
      case 'task': return `${indent}- [ ] ${b.content}`;
      case 'task_done': return `${indent}- [x] ${b.content}`;
      case 'blockquote': return `${indent}> ${b.content}`;
      case 'code_block': return `\`\`\`${b.language || ''}\n${b.content}\n\`\`\``;
      case 'divider': return '---';
      default: return `${indent}${b.content}`;
    }
  }).join('\n');
};

// Render inline styles: bold, italic, code, links, strikethrough
export const renderInlineStyles = (text: string, keyPrefix: string = ''): React.ReactNode => {
  if (!text) return null;

  // Process in order: code, links, strikethrough, bold, italic
  const processText = (input: string, depth: number = 0): React.ReactNode[] => {
    const results: React.ReactNode[] = [];
    
    // 1. Inline code `code`
    const codeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    const codeParts: { start: number; end: number; content: string }[] = [];
    
    while ((match = codeRegex.exec(input)) !== null) {
      codeParts.push({ start: match.index, end: match.index + match[0].length, content: match[1] });
    }
    
    if (codeParts.length > 0) {
      codeParts.forEach((part, idx) => {
        // Text before code
        if (part.start > lastIndex) {
          const before = input.slice(lastIndex, part.start);
          results.push(...processOtherStyles(before, `${keyPrefix}-${depth}-pre-${idx}`));
        }
        // Code element
        results.push(
          React.createElement('code', {
            key: `${keyPrefix}-code-${depth}-${idx}`,
            className: "bg-moxt-fill-1 text-moxt-text-1 px-1.5 py-0.5 rounded text-[12px] font-mono border border-moxt-line-1"
          }, part.content)
        );
        lastIndex = part.end;
      });
      // Remaining text after last code
      if (lastIndex < input.length) {
        results.push(...processOtherStyles(input.slice(lastIndex), `${keyPrefix}-${depth}-post`));
      }
      return results;
    }
    
    return processOtherStyles(input, `${keyPrefix}-${depth}`);
  };

  // Process bold, italic, links, strikethrough
  const processOtherStyles = (input: string, keyPrefix: string): React.ReactNode[] => {
    const results: React.ReactNode[] = [];
    
    // Combined regex for all inline styles
    // Order: links, strikethrough, bold, italic
    const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\))|(~~([^~]+)~~)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)/g;
    
    let lastIndex = 0;
    let match;
    let matchIdx = 0;
    
    while ((match = combinedRegex.exec(input)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        results.push(input.slice(lastIndex, match.index));
      }
      
      if (match[1]) {
        // Link: [text](url)
        const linkText = match[2];
        const linkUrl = match[3];
        results.push(
          React.createElement('a', {
            key: `${keyPrefix}-link-${matchIdx}`,
            href: linkUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: "text-moxt-brand-7 hover:underline"
          }, linkText)
        );
      } else if (match[4]) {
        // Strikethrough: ~~text~~
        results.push(
          React.createElement('del', {
            key: `${keyPrefix}-strike-${matchIdx}`,
            className: "line-through text-moxt-text-3"
          }, match[5])
        );
      } else if (match[6]) {
        // Bold: **text**
        results.push(
          React.createElement('strong', {
            key: `${keyPrefix}-bold-${matchIdx}`,
            className: "font-semibold text-moxt-text-1"
          }, match[7])
        );
      } else if (match[8]) {
        // Italic with *: *text*
        results.push(
          React.createElement('em', {
            key: `${keyPrefix}-em-${matchIdx}`,
            className: "italic"
          }, match[9])
        );
      } else if (match[10]) {
        // Italic with _: _text_
        results.push(
          React.createElement('em', {
            key: `${keyPrefix}-em2-${matchIdx}`,
            className: "italic"
          }, match[11])
        );
      }
      
      lastIndex = match.index + match[0].length;
      matchIdx++;
    }
    
    // Remaining text
    if (lastIndex < input.length) {
      results.push(input.slice(lastIndex));
    }
    
    return results.length > 0 ? results : [input];
  };

  return processText(text);
};
