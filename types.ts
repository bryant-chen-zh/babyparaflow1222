
export enum NodeType {
  DOCUMENT = 'DOCUMENT',
  WHITEBOARD = 'WHITEBOARD',
  SCREEN = 'SCREEN',
  TABLE = 'TABLE',
  API = 'API',
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

export interface IntegrationData {
  provider: string;        // 'SendGrid', 'Stripe', 'Google Calendar'
  category: string;        // 'Email', 'Payment', 'Auth', 'Storage'
  description?: string;
  apiEndpoint?: string;
  requiredKeys?: string[]; // ['API_KEY', 'SECRET']
  documentation?: string;  // URL to docs
}

export interface CanvasNode extends BaseNode {
  data: DocumentData | WhiteboardData | ScreenData | FlowData | TableData | APIData | IntegrationData | null;
  variant?: 'web' | 'mobile'; // For ScreenNode
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

// Tool call type enum
export type ToolType = 'grep' | 'read' | 'bash' | 'edit' | 'write' | 'glob' | 'list_dir' | 'todo_read' | 'todo_write';

// Tool call message data
export interface ToolCallData {
  tool: ToolType;
  action: string;       // Friendly action description, e.g. "Search Code"
  filePath?: string;    // File path being operated on
  status: 'loading' | 'success' | 'error';
  details?: string;     // Optional details
}

// Question option
export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

// Question message data (支持单题和多题模式)
export interface QuestionData {
  questionId: string;
  questionText: string;
  options: QuestionOption[];
  currentPage: number;
  totalPages: number;
  selectedOptionId?: string;
  answered?: boolean;
  // 多题模式：传递所有问题
  allQuestions?: QuestionData[];
  currentIndex?: number;
}

// File operation types
export type FileOperationType = 'create' | 'write' | 'edit' | 'delete' | 'move';
export type FileOperationTarget = 'file' | 'document' | 'whiteboard' | 'screen' | 'table' | 'integration' | 'section';

// File operation message data
export interface FileOperationData {
  operation: FileOperationType;
  target: FileOperationTarget;
  title: string;           // Display name
  nodeId?: string;         // Associated node ID (for navigation)
  status: 'loading' | 'success' | 'error';
}

// Thinking/reasoning message data
export interface ThinkingData {
  content: string;
  status: 'thinking' | 'done';
}

// Extended message types
export type MessageType = 'user' | 'ai' | 'tool_call' | 'question' | 'file_operation' | 'thinking';

export interface ChatMessage {
  id: string;
  type: MessageType;    // Message type
  role?: 'user' | 'ai'; // For backward compatibility, used by user/ai types
  content: string;
  timestamp: number;
  images?: string[];           // Base64 encoded images
  plan?: PlanStep[];           // Optional To-Do list for this message
  toolCall?: ToolCallData;     // Tool call data
  question?: QuestionData;     // Question data
  fileOperation?: FileOperationData;  // File operation data
  thinking?: ThinkingData;     // Thinking/reasoning data
  executionStarted?: boolean;  // Whether "Start Execution" has been clicked
  collapsed?: boolean;         // Whether the question card is collapsed
}

export interface CanvasView {
  x: number;
  y: number;
  scale: number;
}

export type CanvasTool = 'SELECT' | 'HAND' | 'PIN' | 'CREATE_SECTION' | 'CREATE_DOCUMENT' | 'CREATE_CHART' | 'CREATE_TABLE' | 'CREATE_API' | 'CREATE_INTEGRATION' | 'CREATE_EDGE';

export interface CanvasSection {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    theme: 'blue' | 'purple' | 'emerald' | 'orange' | 'rose' | 'slate';
}
