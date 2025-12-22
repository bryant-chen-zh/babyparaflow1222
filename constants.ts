
export const CANVAS_START_X = 100;
export const CANVAS_START_Y = 100;
export const NODE_SPACING_X = 550; 
export const WEB_NODE_SPACING_X = 1200; // Wider spacing for Web Screens
export const WEB_NODE_SPACING_Y = 900;  // Vertical spacing for Web Screens

export const MOBILE_SCREEN_WIDTH = 320;
export const MOBILE_SCREEN_HEIGHT = 640;

// Web Dimensions
export const WEB_SCREEN_WIDTH = 1000;
export const WEB_SCREEN_HEIGHT = 700;

// Layout Anchors (Center of the canvas universe)
export const LAYOUT_CENTER_X = 2000; 
export const LAYOUT_CENTER_Y = 1500; 

// Section Offsets relative to Center (Adjusted for tighter layout)
export const SECTION_GAP = 200;
export const DOCUMENT_SECTION_Y_OFFSET = -900; // Moved closer to Screens (was -1800)
export const CHART_SECTION_X_OFFSET = -2200; // Moved closer to Screens (was -2800)

// Backend Development Section
export const BACKEND_SECTION_X_OFFSET = 2600;  // Right side of Screens with much more spacing
export const BACKEND_SECTION_Y_OFFSET = -800;  // Aligned higher to avoid overlap

export const INITIAL_ZOOM = 0.3; 
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;

// Section IDs for Define-centric workflow
export const SECTION_IDS = {
  // Legacy IDs for backward compatibility
  DOCUMENT: 'section-document',
  CHART: 'section-chart',
  SCREEN: 'section-screen',
  BACKEND: 'section-backend',
  // New Define-centric IDs
  DEFINE: 'section-define',       // Define phase (D1/D5/D9 artifacts)
  PROTOTYPE: 'section-prototype', // Design phase (S1/S5 screens)
  BUILD: 'section-build'          // Build phase artifacts
};

// ============================================
// File Upload Constants
// ============================================

// Supported image formats (MIME types)
export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml'
] as const;

// Supported document formats (extensions)
export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  '.txt',
  '.pdf',
  '.html',
  '.json',
  '.md'
] as const;

// Combined accept string for file input
export const FILE_INPUT_ACCEPT = [
  ...SUPPORTED_IMAGE_MIME_TYPES,
  ...SUPPORTED_DOCUMENT_EXTENSIONS
].join(',');

// File size limits
export const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024;  // 10MB per file
export const MAX_TOTAL_FILE_SIZE = 100 * 1024 * 1024;  // 100MB total
export const MAX_FILE_COUNT = 10;                       // Max 10 files

// Format to extension mapping (for display)
export const FORMAT_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'text/plain': 'txt',
  'application/pdf': 'pdf',
  'text/html': 'html',
  'application/json': 'json',
  'text/markdown': 'md'
};

// Error messages
export const UPLOAD_ERROR_MESSAGES = {
  unsupported_format: 'Unsupported file type. Please upload a supported format.',
  file_too_large: 'Each file must be smaller than 10MB.',
  too_many_files: 'You may only upload up to 10 files at a time.',
  total_size_exceeded: 'Total file size exceeds the 100MB limit.',
  network_error: 'Network error. Upload interrupted. Please try again.',
  unknown_error: 'Unknown error occurred',
  upload_failed: (fileName: string) => `Failed to upload ${fileName}. Please try again.`
} as const;
