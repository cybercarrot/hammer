// 为preload脚本中暴露的API定义类型接口
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
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
