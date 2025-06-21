// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

interface ElectronAPI {
  utils: {
    sendToMain: (channel: string, data: any) => void;
    onFromMain: (channel: string, callback: (...args: any[]) => void) => void;
  };
  cookies: {
    getCookiesByDomains: (domains: string[]) => Promise<{
      success: boolean;
      data?: Record<string, Electron.Cookie[]>;
      error?: string;
    }>;
  };
  window: {
    resetSizeAndPosition: () => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
  app: {
    quit: () => Promise<{
      success: boolean;
    }>;
  };
  chatOverlay: {
    open: () => Promise<{
      success: boolean;
      windowId?: number;
      error?: string;
    }>;
    close: () => Promise<{
      success: boolean;
      error?: string;
    }>;
    onClosed: (callback: () => void) => () => void;
    resetSizeAndPosition: () => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 提供一些通用工具函数
  utils: {
    // 向主进程发送消息
    sendToMain: (channel: string, data: any) => {
      ipcRenderer.send(channel, data);
    },
    // 接收来自主进程的消息
    onFromMain: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    },
  },

  // Cookies相关操作
  cookies: {
    // 获取指定域名的cookies
    getCookiesByDomains: (domains: string[]) => {
      return ipcRenderer.invoke('get-cookies-by-domains', domains);
    },
  },

  // Window相关操作
  window: {
    // 重置窗口大小与位置
    resetSizeAndPosition: () => {
      return ipcRenderer.invoke('window:reset-size-and-position');
    },
  },

  // App相关操作
  app: {
    // 退出应用程序
    quit: () => {
      return ipcRenderer.invoke('app:quit');
    },
  },

  // ChatOverlay相关操作
  chatOverlay: {
    // 打开聊天窗口
    open: () => {
      return ipcRenderer.invoke('chat-overlay:open');
    },
    // 关闭聊天窗口
    close: () => {
      return ipcRenderer.invoke('chat-overlay:close');
    },
    // 监听弹幕浮层关闭事件
    onClosed: (callback: () => void) => {
      ipcRenderer.on('chat-overlay:closed', callback);
      // 返回清理函数
      return () => {
        ipcRenderer.removeListener('chat-overlay:closed', callback);
      };
    },
    // 重置聊天窗口大小与位置
    resetSizeAndPosition: () => {
      return ipcRenderer.invoke('chat-overlay:reset-size-and-position');
    },
  },
});
