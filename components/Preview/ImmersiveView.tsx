
import React, { useRef, useState, useCallback } from 'react';
import { X, MousePointer2 } from 'lucide-react';
import { ScreenData, ScreenElement } from '../../types';
import { ScreenElementBadge } from '../Canvas/ScreenElementBadge';

interface ImmersiveViewProps {
  data: ScreenData;
  onClose: () => void;
  onNavigate: (targetId: string) => void;
  nodeId?: string;
  isCanvasSelectionMode?: boolean;
  onElementMentionSelect?: (element: Partial<ScreenElement>) => void;
  mentionedElements?: ScreenElement[];
  onRemoveElementMention?: (elementId: string) => void;
}

// 生成 CSS 选择器路径
function generateCSSPath(element: HTMLElement, container: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== container && current.parentElement) {
    let selector = current.tagName.toLowerCase();

    // 优先使用 class
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }

    // 如果没有 class，使用 nth-child
    if (!current.className || typeof current.className !== 'string') {
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

// 提取元素标签名称
function extractElementLabel(element: HTMLElement): string {
  // 1. 优先使用 className
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).filter(c => c && !c.startsWith('animate-') && !c.startsWith('transition-'));
    if (classes.length > 0) {
      return classes[0].replace(/^(bg|text|border|hover|focus|active)-/, '');
    }
  }

  // 2. 使用 tagName + 位置
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (el): el is HTMLElement => el.tagName === element.tagName
    );
    const index = siblings.indexOf(element);
    if (index >= 0) {
      return `${element.tagName.toLowerCase()}-${index + 1}`;
    }
  }

  return element.tagName.toLowerCase();
}

export const ImmersiveView: React.FC<ImmersiveViewProps> = ({
  data,
  onClose,
  onNavigate,
  nodeId,
  isCanvasSelectionMode = false,
  onElementMentionSelect,
  mentionedElements = [],
  onRemoveElementMention
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [hoveredElementBox, setHoveredElementBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // 清除高亮
  const clearHighlight = useCallback(() => {
    if (hoveredElement) {
      setHoveredElement(null);
      setHoveredElementBox(null);
    }
  }, [hoveredElement]);

  // 处理鼠标移动 - 高亮元素（仅在 Canvas Selection Mode）
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isCanvasSelectionMode || !containerRef.current || !overlayRef.current) return;

    // 获取鼠标下的元素（忽略 overlay 层）
    overlayRef.current.style.pointerEvents = 'none';
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    overlayRef.current.style.pointerEvents = 'auto';

    // 检查是否在内容区域内
    if (element && containerRef.current.contains(element) && element !== containerRef.current) {
      // 如果是新元素，更新高亮
      if (element !== hoveredElement) {
        // 计算元素位置（相对于 containerRef）
        const contentRect = containerRef.current.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        setHoveredElement(element);
        setHoveredElementBox({
          x: elementRect.left - contentRect.left,
          y: elementRect.top - contentRect.top,
          width: elementRect.width,
          height: elementRect.height
        });
      }
    } else {
      clearHighlight();
    }
  }, [hoveredElement, isCanvasSelectionMode, clearHighlight]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (isCanvasSelectionMode) {
      clearHighlight();
    }
  }, [isCanvasSelectionMode, clearHighlight]);

  // Handle Navigation Clicks inside the rendered HTML
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // @ Mention 模式 - 选中元素
    if (isCanvasSelectionMode && hoveredElement && containerRef.current && nodeId) {
      e.preventDefault();
      e.stopPropagation();

      const cssPath = generateCSSPath(hoveredElement, containerRef.current);
      const label = extractElementLabel(hoveredElement);

      const elementData: Partial<ScreenElement> = {
        nodeId,
        cssPath,
        label,
        boundingBox: hoveredElementBox || undefined
      };

      onElementMentionSelect?.(elementData);
      clearHighlight();
      return;
    }

    // 正常导航模式
    const clickTarget = target.closest('[data-to]');

    if (clickTarget) {
        e.preventDefault();
        e.stopPropagation();
        const targetId = clickTarget.getAttribute('data-to');
        if (targetId) {
            onNavigate(targetId);
        }
    }
  };

  return (
    <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300">

      {/* Close Button - Floating Top Right */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors z-50 shadow-sm border border-slate-200 backdrop-blur"
        title="Exit Preview"
      >
        <X size={20} />
      </button>

      {/* Canvas Selection Mode Indicator */}
      {isCanvasSelectionMode && (
        <div className="absolute top-6 left-6 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          Select an element to mention
        </div>
      )}

      {/* Content Area - Full Width/Height */}
      <div className="relative w-full h-full">
        <div
            ref={containerRef}
            onClick={!isCanvasSelectionMode ? handleClick : undefined}
            className="w-full h-full overflow-y-auto custom-scrollbar relative bg-white"
            dangerouslySetInnerHTML={{ __html: data.htmlContent }}
        />

        {/* Overlay for element selection (only in Canvas Selection Mode) */}
        {isCanvasSelectionMode && (
          <div
            ref={overlayRef}
            className="absolute inset-0 z-10"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          />
        )}

        {/* 独立高亮框 - 避免修改内部元素DOM */}
        {isCanvasSelectionMode && hoveredElementBox && hoveredElement && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: hoveredElementBox.x,
              top: hoveredElementBox.y,
              width: hoveredElementBox.width,
              height: hoveredElementBox.height,
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              transition: 'all 0.1s ease-out'
            }}
          />
        )}

        {/* 渲染 Mentioned 元素的 Badges (Blue) */}
        {mentionedElements.map((element) => (
          <ScreenElementBadge
            key={element.id}
            label={element.label}
            screenTitle={data.screenName}
            position={element.boundingBox || { x: 10, y: 10 }}
            color="blue"
            onRemove={() => onRemoveElementMention?.(element.id)}
          />
        ))}
      </div>

      {/* Subtle Cursor Hint (hide in selection mode) */}
      {!isCanvasSelectionMode && (
        <div className="absolute bottom-6 right-6 pointer-events-none text-slate-900/5 mix-blend-multiply z-40">
            <MousePointer2 size={32} strokeWidth={1.5} className="fill-slate-900/5" />
        </div>
      )}
    </div>
  );
};
