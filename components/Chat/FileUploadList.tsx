import React from 'react';
import { FileUploadItem } from './FileUploadItem';
import { UploadedFile } from '../../types';

interface FileUploadListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

export const FileUploadList: React.FC<FileUploadListProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="px-1 pt-1 pb-1">
      {/* 
        Horizontal scrollable container 
        Added p-2 to accommodate the absolute positioned close buttons (-top-2 -right-2)
        without being clipped by overflow-x-auto
      */}
      <div 
        className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-moxt-line-2 scrollbar-track-transparent p-2"
        style={{
          scrollbarWidth: 'thin',
          msOverflowStyle: 'none'
        }}
      >
        {files.map((file) => (
          <FileUploadItem
            key={file.id}
            file={file}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};

