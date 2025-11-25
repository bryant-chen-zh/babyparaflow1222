import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { ToolCallData } from '../../types';
import { getToolDisplayInfo } from '../../utils/toolCallMapper';

interface ToolCallMessageProps {
  toolCall: ToolCallData;
}

export function ToolCallMessage({ toolCall }: ToolCallMessageProps) {
  const { icon: Icon, actionText } = getToolDisplayInfo(toolCall.tool, toolCall.filePath);

  // For 'read', 'grep', 'list_dir', 'todo_read', 'todo_write', show simple text only
  const simplifiedTools = ['read', 'grep', 'list_dir', 'todo_read', 'todo_write'];
  if (simplifiedTools.includes(toolCall.tool)) {
    const getSimpleLabel = () => {
      switch (toolCall.tool) {
        case 'read': return 'Read';
        case 'grep': return 'Search';
        case 'list_dir': return 'Browsing files';
        case 'todo_read': return 'Read todo list';
        case 'todo_write': return 'Update todo list';
        default: return toolCall.tool;
      }
    };

    return (
      <div className="flex items-start gap-2 mb-2">
        <div className="text-xs">
          <span className="text-slate-600">
            {getSimpleLabel()}
          </span>
          {toolCall.filePath && toolCall.tool !== 'todo_read' && toolCall.tool !== 'todo_write' && (
            <span className="text-slate-400 ml-1">
              {toolCall.filePath}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 状态图标
  const StatusIcon = () => {
    switch (toolCall.status) {
      case 'loading':
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  return (
    <div className="flex items-start gap-2 mb-2">
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 text-sm max-w-[85%]">
        {/* Tool icon */}
        <Icon className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />

        {/* Action description */}
        <span className="text-gray-700">
          {toolCall.status === 'loading' && `${actionText}...`}
          {toolCall.status === 'success' && `${actionText} completed`}
          {toolCall.status === 'error' && `${actionText} failed`}
        </span>

        {/* File path */}
        {toolCall.filePath && (
          <span className="text-gray-500 font-mono text-xs truncate">
            {toolCall.filePath}
          </span>
        )}

        {/* Status icon */}
        <StatusIcon />
      </div>
    </div>
  );
}
