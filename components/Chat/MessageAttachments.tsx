import React from 'react';
import { FileText, FileCode, FileJson, FileType } from 'lucide-react';
import { MessageAttachment, DocumentFormat } from '../../types';

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  align?: 'left' | 'right';
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

// Get background color for document icon
const getDocumentIconStyle = (format: DocumentFormat): string => {
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

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({ 
  attachments, 
  align = 'left' 
}) => {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(a => a.category === 'image');
  const documents = attachments.filter(a => a.category === 'document');

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

      {/* Documents - Compact list */}
      {documents.length > 0 && (
        <div className={`flex gap-1.5 flex-wrap ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {documents.map((doc) => {
            const IconComponent = getDocumentIcon(doc.format as DocumentFormat);
            const iconStyle = getDocumentIconStyle(doc.format as DocumentFormat);
            
            return (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-moxt-fill-1 rounded border border-moxt-line-1"
                title={doc.name}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
                  <IconComponent size={12} />
                </div>
                <span className="text-11 text-moxt-text-2 font-medium">
                  {truncateFileName(doc.name)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

