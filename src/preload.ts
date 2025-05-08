// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

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
    // 移除监听
    removeListener: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback);
    },
  },
});
