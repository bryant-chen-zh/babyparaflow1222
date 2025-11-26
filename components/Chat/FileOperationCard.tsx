import React from 'react';
import { FileOperationData, FileOperationTarget } from '../../types';
import { 
  FileText,
  Layout,
  Monitor,
  Table,
  Globe,
  FileCode2,
  Loader2,
  Locate,
  FolderPlus
} from 'lucide-react';

interface FileOperationCardProps {
  fileOperation: FileOperationData;
  onLocate?: (nodeId: string) => void;
}

// Get icon based on target type
function getTargetIcon(target: FileOperationTarget) {
  switch (target) {
    case 'document':
      return FileText;
    case 'whiteboard':
      return Layout;
    case 'screen':
      return Monitor;
    case 'table':
      return Table;
    case 'integration':
      return Globe;
    case 'section':
      return FolderPlus;
    case 'file':
    default:
      return FileCode2;
  }
}

// Get status text based on operation and status
function getStatusText(operation: string, status: string): string {
  if (status === 'loading') {
    switch (operation) {
      case 'create':
        return 'Creating...';
      case 'write':
        return 'Writing...';
      case 'edit':
        return 'Editing...';
      case 'delete':
        return 'Deleting...';
      case 'move':
        return 'Moving...';
      default:
        return 'Processing...';
    }
  }
  
  if (status === 'error') {
    return 'Failed';
  }
  
  // Success status
  switch (operation) {
    case 'create':
      return 'Created';
    case 'write':
      return 'Created';
    case 'edit':
      return 'Edited';
    case 'delete':
      return 'Deleted';
    case 'move':
      return 'Moved';
    default:
      return 'Done';
  }
}

export function FileOperationCard({ fileOperation, onLocate }: FileOperationCardProps) {
  const { operation, target, title, nodeId, status } = fileOperation;
  const TargetIcon = getTargetIcon(target);
  const statusText = getStatusText(operation, status);
  
  const handleLocate = () => {
    if (nodeId && onLocate) {
      onLocate(nodeId);
    }
  };

  return (
    <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg px-3 py-2.5 mb-2 max-w-[280px]">
      <div className="flex items-center gap-2.5">
        {/* Target icon */}
        <div className="flex-shrink-0 text-moxt-text-2">
          <TargetIcon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="text-12 font-medium text-moxt-text-1 truncate">
            {title}
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-moxt-text-4">
            {status === 'loading' && (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            )}
            {statusText}
          </div>
        </div>

        {/* Locate button - only show when success and has nodeId */}
        {status === 'success' && nodeId && onLocate && (
          <button
            onClick={handleLocate}
            className="flex-shrink-0 p-1 hover:bg-moxt-fill-1 rounded transition-colors text-moxt-text-3 hover:text-moxt-text-2"
            title="Locate on canvas"
          >
            <Locate className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
