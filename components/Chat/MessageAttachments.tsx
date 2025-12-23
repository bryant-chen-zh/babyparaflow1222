import React from 'react';
import { FileText, FileCode, FileJson, FileType, FileCode2, Palette, Code2 } from 'lucide-react';
import { MessageAttachment, DocumentFormat, CodeFormat } from '../../types';

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  align?: 'left' | 'right';
}

// Get icon component for document formats
const getDocumentIcon = (format: DocumentFormat) => {
  switch (format) {
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

// Get background color for document icon
const getDocumentIconStyle = (format: DocumentFormat): string => {
  switch (format) {
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

// Get icon component for code formats
const getCodeIcon = (format: CodeFormat) => {
  switch (format) {
    case 'ts':
    case 'tsx':
      return FileCode2;
    case 'js':
    case 'jsx':
      return FileCode;
    case 'css':
    case 'scss':
      return Palette;
    case 'html':
      return FileCode;
    case 'vue':
      return Code2;
    case 'py':
      return FileCode2;
    case 'yaml':
    case 'yml':
      return FileText;
    default:
      return Code2;
  }
};

// Get background color for code icon
const getCodeIconStyle = (format: CodeFormat): string => {
  switch (format) {
    case 'ts':
    case 'tsx':
      return 'bg-blue-100 text-blue-600';
    case 'js':
    case 'jsx':
      return 'bg-yellow-100 text-yellow-700';
    case 'css':
    case 'scss':
      return 'bg-purple-100 text-purple-600';
    case 'html':
      return 'bg-orange-100 text-orange-600';
    case 'vue':
      return 'bg-emerald-100 text-emerald-600';
    case 'py':
      return 'bg-sky-100 text-sky-600';
    case 'yaml':
    case 'yml':
      return 'bg-pink-100 text-pink-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

// Truncate filename
const truncateFileName = (name: string, maxLength: number = 16): string => {
  if (name.length <= maxLength) return name;
  
  const extension = name.split('.').pop() || '';
  const baseName = name.slice(0, name.length - extension.length - 1);
  const availableLength = maxLength - extension.length - 4;
  
  if (availableLength <= 0) {
    return name.slice(0, maxLength - 3) + '...';
  }
  
  return `${baseName.slice(0, availableLength)}...${extension}`;
};

// Get icon and style for any file (document or code)
const getFileIcon = (format: string, category: string) => {
  if (category === 'code') {
    return getCodeIcon(format as CodeFormat);
  }
  return getDocumentIcon(format as DocumentFormat);
};

const getFileIconStyle = (format: string, category: string) => {
  if (category === 'code') {
    return getCodeIconStyle(format as CodeFormat);
  }
  return getDocumentIconStyle(format as DocumentFormat);
};

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({ 
  attachments, 
  align = 'left' 
}) => {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(a => a.category === 'image');
  const files = attachments.filter(a => a.category === 'document' || a.category === 'code');

  return (
    <div className={`flex flex-col gap-2 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      {/* Images - Grid layout */}
      {images.length > 0 && (
        <div className={`flex gap-2 flex-wrap ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {images.map((img) => (
            <img
              key={img.id}
              src={img.previewUrl}
              alt={img.name}
              className="max-w-[120px] max-h-[120px] object-cover rounded-lg border border-moxt-line-1"
              title={img.name}
            />
          ))}
        </div>
      )}

      {/* Files (Documents + Code) - Compact list */}
      {files.length > 0 && (
        <div className={`flex gap-1.5 flex-wrap ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {files.map((file) => {
            const IconComponent = getFileIcon(file.format, file.category);
            const iconStyle = getFileIconStyle(file.format, file.category);
            
            return (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-moxt-fill-1 rounded border border-moxt-line-1"
                title={file.name}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
                  <IconComponent size={12} />
                </div>
                <span className="text-11 text-moxt-text-2 font-medium">
                  {truncateFileName(file.name)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

