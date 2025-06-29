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
    setContentProtection: (enabled: boolean) => Promise<{
      success: boolean;
      error?: string;
    }>;
    getContentProtectionSettings: () => Promise<{
      success: boolean;
      data?: { mainWindow: boolean; chatOverlayWindow: boolean };
      error?: string;
    }>;
  };
  app: {
    quit: () => Promise<{
      success: boolean;
    }>;
    checkForUpdates: () => Promise<{
      success: boolean;
      currentVersion?: string;
      latestVersion?: string;
      hasUpdate?: boolean;
      releaseUrl?: string;
      releaseNotes?: string;
      publishedAt?: string;
      error?: string;
    }>;
    downloadUpdate: (options?: any) => Promise<{
      success: boolean;
      error?: string;
    }>;
    installUpdate: () => Promise<{
      success: boolean;
      error?: string;
    }>;
    onUpdateAvailable: (callback: () => void) => () => void;
    onUpdateError: (callback: (info: { message: string }) => void) => () => void;
    onUpdateDownloaded: (
      callback: (info: { releaseNotes: string; releaseName: string; releaseDate: Date; updateURL: string }) => void
    ) => () => void;
  };
  chatOverlay: {
    open: (contentProtectionEnabled?: boolean) => Promise<{
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
    setContentProtection: (enabled: boolean) => Promise<{
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
    setContentProtection: (enabled: boolean) => {
      return ipcRenderer.invoke('window:set-content-protection', enabled);
    },
    getContentProtectionSettings: () => {
      return ipcRenderer.invoke('window:get-content-protection-settings');
    },
  },

  // App相关操作
  app: {
    // 退出应用程序
    quit: () => {
      return ipcRenderer.invoke('app:quit');
    },
    // 检查更新
    checkForUpdates: () => {
      return ipcRenderer.invoke('app:check-for-updates');
    },
    // 执行更新
    downloadUpdate: (options?: any) => {
      return ipcRenderer.invoke('app:download-update', options);
    },
    // 安装更新
    installUpdate: () => {
      return ipcRenderer.invoke('app:install-update');
    },
    // 监听更新可用事件
    onUpdateAvailable: (callback: () => void) => {
      ipcRenderer.on('app:update-available', callback);
      // 返回清理函数
      return () => {
        ipcRenderer.removeListener('app:update-available', callback);
      };
    },
    // 监听更新错误事件
    onUpdateError: (callback: (info: any) => void) => {
      ipcRenderer.on('app:update-error', (_, info) => callback(info));
      // 返回清理函数
      return () => {
        ipcRenderer.removeListener('app:update-error', callback);
      };
    },
    // 监听更新下载完成事件
    onUpdateDownloaded: (callback: (info: any) => void) => {
      ipcRenderer.on('app:update-downloaded', (_, info) => callback(info));
      // 返回清理函数
      return () => {
        ipcRenderer.removeListener('app:update-downloaded', callback);
      };
    },
  },

  // ChatOverlay相关操作
  chatOverlay: {
    // 打开聊天窗口
    open: (contentProtectionEnabled?: boolean) => {
      return ipcRenderer.invoke('chat-overlay:open', contentProtectionEnabled);
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
    setContentProtection: (enabled: boolean) => {
      return ipcRenderer.invoke('chat-overlay:set-content-protection', enabled);
    },
  },
});
