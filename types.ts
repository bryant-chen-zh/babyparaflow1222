
export enum NodeType {
  DOCUMENT = 'DOCUMENT',
  WHITEBOARD = 'WHITEBOARD',
  SCREEN = 'SCREEN',
  TABLE = 'TABLE',
  API = 'API',
  TASK = 'TASK',
  INTEGRATION = 'INTEGRATION'
}

export interface BaseNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width?: number; 
  height?: number;
  title: string;
  status: 'loading' | 'done' | 'error';
  sectionId?: string; // The ID of the section this node belongs to
}

export interface DocumentData {
  content: string; // Markdown content
}

export interface WhiteboardElement {
  id: string;
  type: 'rect' | 'circle' | 'diamond' | 'text' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
}

export interface WhiteboardData {
  elements: WhiteboardElement[];
}

// Screen 内部元素的引用
export interface ScreenElement {
  id: string;                    // 唯一标识
  nodeId: string;                // 所属 Screen 节点 ID
  cssPath: string;               // CSS 选择器路径
  label: string;                 // 显示名称（如 "hero-section"）
  boundingBox?: {                // 元素位置（用于定位 Badge）
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ScreenData {
  htmlContent: string; // Raw HTML/Tailwind
  screenName: string;
  variant?: 'mobile' | 'web'; // Default to mobile if undefined
  plan?: string; // Markdown explanation of the screen logic
}

export interface FlowStep {
  id?: string;
  label: string;
  description: string;
}

export interface FlowData {
  steps: FlowStep[];
}

export interface TableData {
  columns: string[];
  rows: Record<string, any>[];
}

export interface APIData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description?: string;
  params?: { name: string, type: string, required: boolean }[];
  response?: string; // Short JSON snippet or description
}

export interface TaskData {
  description: string;
  status: 'todo' | 'in_progress' | 'done';
}

export interface IntegrationData {
  provider: string;        // 'SendGrid', 'Stripe', 'Google Calendar'
  category: string;        // 'Email', 'Payment', 'Auth', 'Storage'
  description?: string;
  apiEndpoint?: string;
  requiredKeys?: string[]; // ['API_KEY', 'SECRET']
  documentation?: string;  // URL to docs
}

export interface CanvasNode extends BaseNode {
  data: DocumentData | WhiteboardData | ScreenData | FlowData | TableData | APIData | TaskData | IntegrationData | null;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  type?: 'flow' | 'dependency' | 'data';  // 区分不同类型的连线
  label?: string;  // 连线上的文字说明
}

export interface CanvasPin {
  id: string;
  x: number; // Canvas coordinate X
  y: number; // Canvas coordinate Y
  content: string;
  targetNodeId?: string; // Optional: ID of the node it is pinned to (for potential sticking logic later)
}

export interface PlanStep {
    id: string;
    label: string;
    status: 'pending' | 'loading' | 'done';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  plan?: PlanStep[]; // Optional To-Do list for this message
}

export interface CanvasView {
  x: number;
  y: number;
  scale: number;
}

export type CanvasTool = 'SELECT' | 'HAND' | 'PIN' | 'CREATE_SECTION' | 'CREATE_DOCUMENT' | 'CREATE_CHART' | 'CREATE_TABLE' | 'CREATE_API' | 'CREATE_TASK' | 'CREATE_INTEGRATION' | 'CREATE_EDGE';

export interface CanvasSection {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    theme: 'blue' | 'purple' | 'emerald' | 'orange' | 'rose' | 'slate';
}
