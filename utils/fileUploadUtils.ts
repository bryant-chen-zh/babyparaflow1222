import { 
  UploadedFile, 
  UploadError, 
  FileCategory, 
  SupportedFormat,
  ImageFormat,
  DocumentFormat
} from '../types';
import {
  SUPPORTED_IMAGE_MIME_TYPES,
  SUPPORTED_DOCUMENT_EXTENSIONS,
  MAX_SINGLE_FILE_SIZE,
  MAX_TOTAL_FILE_SIZE,
  MAX_FILE_COUNT,
  FORMAT_EXTENSIONS,
  UPLOAD_ERROR_MESSAGES
} from '../constants';

// Generate unique ID
const generateId = (): string => {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Check if file is an image
const isImageFile = (file: File): boolean => {
  return SUPPORTED_IMAGE_MIME_TYPES.includes(file.type as any);
};

// Check if file is a supported document
const isDocumentFile = (file: File): boolean => {
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  return SUPPORTED_DOCUMENT_EXTENSIONS.includes(extension as any);
};

// Get file format from file
const getFileFormat = (file: File): SupportedFormat | null => {
  // Check MIME type first (for images)
  if (FORMAT_EXTENSIONS[file.type]) {
    return FORMAT_EXTENSIONS[file.type] as SupportedFormat;
  }
  
  // Fallback to extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension) {
    const imageFormats: ImageFormat[] = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
    const docFormats: DocumentFormat[] = ['txt', 'pdf', 'html', 'json', 'md'];
    
    if (imageFormats.includes(extension as ImageFormat)) {
      return extension as ImageFormat;
    }
    if (docFormats.includes(extension as DocumentFormat)) {
      return extension as DocumentFormat;
    }
  }
  
  return null;
};

// Get file category
const getFileCategory = (file: File): FileCategory | null => {
  if (isImageFile(file)) return 'image';
  if (isDocumentFile(file)) return 'document';
  return null;
};

// Validate a single file
export interface ValidationResult {
  isValid: boolean;
  error?: UploadError;
}

export const validateFile = (
  file: File,
  existingFiles: UploadedFile[]
): ValidationResult => {
  // 1. Format validation
  const category = getFileCategory(file);
  if (!category) {
    return {
      isValid: false,
      error: {
        type: 'unsupported_format',
        message: UPLOAD_ERROR_MESSAGES.unsupported_format,
        fileName: file.name
      }
    };
  }

  // 2. Single file size validation
  if (file.size > MAX_SINGLE_FILE_SIZE) {
    return {
      isValid: false,
      error: {
        type: 'file_too_large',
        message: UPLOAD_ERROR_MESSAGES.file_too_large,
        fileName: file.name
      }
    };
  }

  return { isValid: true };
};

// Validate batch of files
export const validateBatch = (
  newFiles: File[],
  existingFiles: UploadedFile[]
): ValidationResult => {
  // 1. Count validation
  const totalCount = existingFiles.length + newFiles.length;
  if (totalCount > MAX_FILE_COUNT) {
    return {
      isValid: false,
      error: {
        type: 'too_many_files',
        message: UPLOAD_ERROR_MESSAGES.too_many_files
      }
    };
  }

  // 2. Total size validation
  const existingSize = existingFiles.reduce((sum, f) => sum + f.size, 0);
  const newSize = newFiles.reduce((sum, f) => sum + f.size, 0);
  if (existingSize + newSize > MAX_TOTAL_FILE_SIZE) {
    return {
      isValid: false,
      error: {
        type: 'total_size_exceeded',
        message: UPLOAD_ERROR_MESSAGES.total_size_exceeded
      }
    };
  }

  return { isValid: true };
};

// Formats that should be read as text (PDF is handled by backend)
const TEXT_READABLE_FORMATS: DocumentFormat[] = ['txt', 'md', 'json', 'html'];

// Check if format should be read as text
const isTextReadableFormat = (format: SupportedFormat): boolean => {
  return TEXT_READABLE_FORMATS.includes(format as DocumentFormat);
};

// Read file as text
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Process and create UploadedFile from File
export const processFile = async (file: File): Promise<UploadedFile | null> => {
  const category = getFileCategory(file);
  const format = getFileFormat(file);
  
  if (!category || !format) return null;

  const uploadedFile: UploadedFile = {
    id: generateId(),
    file,
    name: file.name,
    size: file.size,
    category,
    format,
    status: 'uploading'
  };

  // For images, generate preview URL (base64)
  if (category === 'image') {
    try {
      const previewUrl = await readFileAsDataURL(file);
      uploadedFile.previewUrl = previewUrl;
    } catch {
      // If preview fails, still allow the file
      console.warn('Failed to generate preview for:', file.name);
    }
  }

  // For text-readable documents (txt, md, json, html), read content
  // Note: PDF is NOT read here - it will be processed by backend
  if (category === 'document' && isTextReadableFormat(format)) {
    try {
      const content = await readFileAsText(file);
      uploadedFile.content = content;
    } catch {
      console.warn('Failed to read content for:', file.name);
    }
  }

  return uploadedFile;
};

// Read file as base64 data URL
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Compress image (optional, for large images)
export const compressImage = (file: File, maxSize: number = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Check for duplicate files (by name)
export const filterDuplicates = (
  newFiles: UploadedFile[],
  existingFiles: UploadedFile[]
): { uniqueNew: UploadedFile[]; toRemove: string[] } => {
  const existingNames = new Set(existingFiles.map(f => f.name));
  const toRemove: string[] = [];
  
  // Find duplicates in existing files
  newFiles.forEach(newFile => {
    const duplicate = existingFiles.find(f => f.name === newFile.name);
    if (duplicate) {
      toRemove.push(duplicate.id);
    }
  });
  
  return { uniqueNew: newFiles, toRemove };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

