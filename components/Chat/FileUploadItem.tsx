import React from 'react';
import { X, FileText, FileCode, FileJson, FileType, Loader2 } from 'lucide-react';
import { UploadedFile, DocumentFormat } from '../../types';

interface FileUploadItemProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
}

// Get icon component for document formats
const getDocumentIcon = (format: DocumentFormat) => {
  switch (format) {
    case 'html':
      return FileCode;
    case 'json':
      return FileJson;
    case 'pdf':
      return FileType;
    case 'md':
    case 'txt':
    default:
      return FileText;
  }
};

// Get background color for document icon wrapper
const getDocumentIconBg = (format: DocumentFormat): string => {
  switch (format) {
    case 'html':
      return 'bg-orange-100 text-orange-600';
    case 'json':
      return 'bg-yellow-100 text-yellow-600';
    case 'pdf':
      return 'bg-red-100 text-red-600';
    case 'md':
      return 'bg-blue-100 text-blue-600';
    case 'txt':
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

// Truncate filename
const truncateFileName = (name: string, maxLength: number = 18): string => {
  if (name.length <= maxLength) return name;
  
  const extension = name.split('.').pop() || '';
  const baseName = name.slice(0, name.length - extension.length - 1);
  const availableLength = maxLength - extension.length - 2;
  
  if (availableLength <= 0) {
    return name.slice(0, maxLength - 2) + '..';
  }
  
  return `${baseName.slice(0, availableLength)}..${extension}`;
};

export const FileUploadItem: React.FC<FileUploadItemProps> = ({ file, onRemove }) => {
  const isImage = file.category === 'image';
  const isLoading = file.status === 'uploading';
  const hasError = file.status === 'error';

  return (
    // Outer container: NO overflow-hidden, so the close button can pop out
    <div className="relative group flex-shrink-0 h-16" title={file.name}>
      
      {/* 
        Content Container: Has overflow-hidden and border
        - Image: w-16 square
        - Document: Variable width rectangular card
      */}
      <div 
        className={`
          relative h-full rounded-lg border overflow-hidden transition-all flex items-center
          ${hasError ? 'border-red-300 bg-red-50' : 'border-moxt-line-1 bg-moxt-fill-1'}
          ${isImage ? 'w-16' : 'px-3 min-w-[140px] max-w-[200px] gap-3'}
        `}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader2 size={20} className="animate-spin text-moxt-brand-7" />
          </div>
        )}

        {isImage ? (
          /* Image: Full thumbnail */
          <img
            src={file.previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Document: Icon + Info */
          <>
            {/* Icon Wrapper */}
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getDocumentIconBg(file.format as DocumentFormat)}`}>
              {React.createElement(getDocumentIcon(file.format as DocumentFormat), { size: 18 })}
            </div>
            
            {/* File Info */}
            <div className="flex flex-col justify-center min-w-0 flex-1">
               <span className="text-12 text-moxt-text-1 font-medium truncate leading-tight">
                {truncateFileName(file.name)}
              </span>
               <span className="text-[10px] text-moxt-text-3 font-medium uppercase mt-0.5">
                {file.format}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Remove Button - Positioned relative to the outer container */}
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className={`
          absolute -top-2 -right-2 w-5 h-5 
          bg-moxt-text-1 text-white rounded-full 
          flex items-center justify-center 
          opacity-0 group-hover:opacity-100 
          transition-opacity z-20
          hover:bg-red-500 shadow-md border border-white
        `}
      >
        <X size={12} />
      </button>
    </div>
  );
};

