
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

export const SECTION_IDS = {
  DOCUMENT: 'section-document',
  CHART: 'section-chart',
  SCREEN: 'section-screen',
  BACKEND: 'section-backend'
};
