import React, { useState } from 'react';
import { ThinkingData } from '../../types';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';

// Elegant dots loader component
const DotsLoader = () => (
  <div className="loader-dots">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

interface ThinkingMessageProps {
  thinking: ThinkingData;
}

export function ThinkingMessage({ thinking }: ThinkingMessageProps) {
  const { content, status } = thinking;
  const [isExpanded, setIsExpanded] = useState(status === 'thinking');

  // When thinking is in progress, show animated indicator
  if (status === 'thinking') {
    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-moxt-text-2" />
          <span className="text-12 font-medium text-moxt-text-2">
            Thinking
          </span>
          <DotsLoader />
        </div>
      </div>
    );
  }

  // When thinking is done, show collapsible summary
  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-moxt-text-3 hover:text-moxt-text-2 transition-colors group"
      >
        <Brain className="w-4 h-4 text-moxt-text-2" />
        <span className="text-12 font-medium">Thought process</span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-moxt-text-4 group-hover:text-moxt-text-3" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-moxt-text-4 group-hover:text-moxt-text-3" />
        )}
      </button>
      
      {isExpanded && content && (
        <div className="mt-2 ml-6 pl-3 border-l-2 border-moxt-line-1">
          <p className="text-12 text-moxt-text-3 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}
