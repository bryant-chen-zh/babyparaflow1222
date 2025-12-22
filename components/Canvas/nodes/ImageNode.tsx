import React from 'react';
import { Image as ImageIcon, Download, MoreHorizontal, Maximize2 } from 'lucide-react';
import { ImageData } from '../../../types';

interface ImageNodeProps {
  title?: string;
  data: ImageData | null;
  loading?: boolean;
}

export const ImageNode: React.FC<ImageNodeProps> = ({ title, data, loading }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 mx-4 mb-4 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const isEmpty = !data?.src;

  // Format file size for display
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col bg-white group relative">
      {/* Floating Action Bar - appears on hover */}
      <div className="absolute -top-12 left-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-moxt-line-1 p-1">
        <button 
          className="p-2 hover:bg-moxt-fill-1 rounded-md text-moxt-text-2 transition-colors"
          title="Full Screen"
        >
          <Maximize2 size={16} />
        </button>
        <div className="w-px h-5 bg-moxt-line-1"></div>
        <button 
          className="p-2 hover:bg-moxt-fill-1 rounded-md text-moxt-text-2 transition-colors"
          title="Download"
        >
          <Download size={16} />
        </button>
        <div className="w-px h-5 bg-moxt-line-1"></div>
        <button 
          className="p-2 hover:bg-moxt-fill-1 rounded-md text-moxt-text-2 transition-colors"
          title="More options"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Title Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <ImageIcon size={16} className="text-violet-500" />
        <span className="text-violet-500 font-medium text-sm truncate flex-1">{title || data?.fileName || 'image.png'}</span>
        {data?.fileSize && (
          <span className="text-xs text-slate-400">{formatFileSize(data.fileSize)}</span>
        )}
      </div>

      {/* Content Area */}
      <div
        className="flex-1 mx-4 mb-4 rounded-lg overflow-hidden"
        style={{
          border: isEmpty ? '2px dashed #8b5cf6' : '2px solid #8b5cf6',
        }}
      >
        {isEmpty ? (
          // Empty placeholder
          <div className="h-full flex flex-col bg-white">
            <div 
              className="flex-1 m-4 rounded-lg flex flex-col items-center justify-center"
              style={{
                border: '2px dashed #d1d5db',
              }}
            >
              <ImageIcon size={32} className="text-slate-300 mb-3" />
              <h3 className="text-slate-800 font-semibold text-base mb-1">No Image</h3>
              <p className="text-slate-400 text-sm">Image failed to load</p>
            </div>
          </div>
        ) : (
          // Image preview
          <div className="h-full bg-slate-50 flex items-center justify-center p-2 overflow-hidden">
            <img 
              src={data.src} 
              alt={data.fileName || 'Imported image'}
              className="max-w-full max-h-full object-contain rounded"
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

