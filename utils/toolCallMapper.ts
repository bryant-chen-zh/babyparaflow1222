import { ToolType } from '../types';
import {
  Search,
  FileText,
  Terminal,
  Edit,
  FileEdit,
  FolderSearch,
  FolderOpen,
  ListChecks,
  ClipboardEdit
} from 'lucide-react';

/**
 * 工具调用配置映射
 * 将 Claude Agent SDK 的工具名称映射为用户友好的展示信息
 */

export interface ToolConfig {
  friendlyName: string;
  icon: any; // lucide-react 图标组件
  getActionText: (filePath?: string) => string;
}

export const TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  grep: {
    friendlyName: 'Search Code',
    icon: Search,
    getActionText: (filePath) => filePath ? `Search Code` : 'Search Code'
  },

  glob: {
    friendlyName: 'Find Files',
    icon: FolderSearch,
    getActionText: (filePath) => 'Find Files'
  },

  read: {
    friendlyName: 'Read File',
    icon: FileText,
    getActionText: (filePath) => `Read File`
  },

  bash: {
    friendlyName: 'Execute Command',
    icon: Terminal,
    getActionText: (filePath) => {
      // Smart descriptions based on common commands
      if (filePath?.includes('git')) return 'Git Operation';
      if (filePath?.includes('npm') || filePath?.includes('yarn')) return 'Run Build Command';
      if (filePath?.includes('test')) return 'Run Tests';
      return 'Execute Command';
    }
  },

  edit: {
    friendlyName: 'Edit File',
    icon: Edit,
    getActionText: (filePath) => `Edit File`
  },

  write: {
    friendlyName: 'Create File',
    icon: FileEdit,
    getActionText: (filePath) => `Create File`
  },

  list_dir: {
    friendlyName: 'Browsing files',
    icon: FolderOpen,
    getActionText: () => 'Browsing files'
  },

  todo_read: {
    friendlyName: 'Read Todo List',
    icon: ListChecks,
    getActionText: () => 'Read todo list'
  },

  todo_write: {
    friendlyName: 'Update Todo List',
    icon: ClipboardEdit,
    getActionText: () => 'Update todo list'
  }
};

/**
 * 获取工具的友好展示信息
 */
export function getToolDisplayInfo(tool: ToolType, filePath?: string) {
  const config = TOOL_CONFIGS[tool];

  return {
    friendlyName: config.friendlyName,
    icon: config.icon,
    actionText: config.getActionText(filePath)
  };
}
