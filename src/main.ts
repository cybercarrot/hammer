import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  Menu,
  globalShortcut,
  Tray,
  nativeImage,
} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { setupCookieHandlers } from './main/cookies';
import windowStateKeeper from 'electron-window-state';
import { WebSocketServer } from 'ws';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// 存储当前主窗口引用
let mainWindow: BrowserWindow | null = null;
// WebSocket 服务器实例
let wss: WebSocketServer | null = null;
// 创建托盘变量
let tray: Tray | null = null;
// 图标路径
const iconPath = app.isPackaged
  ? process.resourcesPath + '/icon.ico'
  : path.join(__dirname, '../../assets/icon.ico');
// 加载图标
const icon = nativeImage.createFromPath(iconPath);

// 直接退出应用的函数
const quitApp = () => {
  console.log('quitApp');
  // 关闭 WebSocket 服务器
  if (wss) {
    wss.close(() => {
      console.log('WebSocket 服务器已关闭');
    });
    wss = null;
  }
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
    mainWindow = null;
  }
  if (tray) {
    tray.destroy();
    tray = null;
  }
  globalShortcut.unregisterAll();
  app.quit();
};

const createWindow = () => {
  // 加载窗口状态管理器
  const windowState = windowStateKeeper({
    defaultWidth: 1920,
    defaultHeight: 1080,
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // 启用webview的支持
      webviewTag: true,
      // 启用nodeIntegration，允许在渲染进程中使用Node.js API
      nodeIntegration: true,
      // 启用上下文隔离
      contextIsolation: true,
      // 禁用同源策略，允许跨域请求
      webSecurity: false,
    },
  });

  // 让窗口状态管理器监视窗口（自动保存和恢复窗口位置和大小）
  windowState.manage(mainWindow);

  // 创建右键菜单函数
  const createContextMenu = (webContents: Electron.WebContents) => {
    return Menu.buildFromTemplate([
      {
        label: '后退',
        accelerator: 'Alt+Left',
        click: () => {
          const navigationHistory = webContents.navigationHistory;
          if (navigationHistory.canGoBack()) {
            navigationHistory.goBack();
          }
        },
        enabled: webContents.navigationHistory.canGoBack(),
      },
      {
        label: '刷新',
        accelerator: 'F5',
        click: () => {
          webContents.reload();
        },
      },
      { type: 'separator' },
      {
        label: '切换开发工具',
        accelerator: 'F12',
        click: () => {
          webContents.toggleDevTools();
        },
      },
    ]);
  };

  // 监听右键点击事件，显示上下文菜单
  mainWindow.webContents.on('context-menu', event => {
    createContextMenu(mainWindow.webContents).popup();
  });

  // TODO: 已弃用，给控制台模块的 webview 添加 preload，完成 websocket 的劫持
  // mainWindow.webContents.on('will-attach-webview', (e, webPreferences, params) => {
  //   if (params.src.includes('https://chat.laplace.live/dashboard')) {
  //     webPreferences.preload = path.join(__dirname, 'webSocketPreload.js');
  //     webPreferences.contextIsolation = false;
  //     console.log('will-attach-webview', webPreferences);
  //   }
  // });

  // 为所有新建的webContents添加右键菜单
  app.on('web-contents-created', (_, webContents) => {
    webContents.on('context-menu', () => {
      createContextMenu(webContents).popup();
    });
  });

  // 允许跨域访问
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // 将自身页面的来源 hack 为 bilibili.com
    if (details.referrer.includes('http://localhost')) {
      details.requestHeaders['Origin'] = 'https://www.bilibili.com';
      details.requestHeaders['Referer'] = 'https://www.bilibili.com';
    }

    callback({ requestHeaders: details.requestHeaders });
  });

  // 设置CSP头和允许跨域访问
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    // 处理Set-Cookie头，将SameSite设为None并添加Secure标志
    if (responseHeaders['set-cookie']) {
      responseHeaders['set-cookie'] = responseHeaders['set-cookie'].map((cookie: string) => {
        // 如果cookie中没有SameSite，添加SameSite=None
        if (!cookie.includes('SameSite=')) {
          cookie += '; SameSite=None';
        } else {
          // 替换已有的SameSite值
          cookie = cookie.replace(/SameSite=(Lax|Strict|None)/i, 'SameSite=None');
        }

        // 确保有Secure标志(SameSite=None需要Secure标志)
        if (!cookie.includes('Secure')) {
          cookie += '; Secure';
        }

        return cookie;
      });
    }

    callback({
      responseHeaders,
    });
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // 监听窗口关闭事件，直接最小化到托盘
  mainWindow.on('close', event => {
    if (mainWindow) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

// 创建托盘图标
const createTray = () => {
  tray = new Tray(icon);
  tray.setToolTip('锤子');

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      },
    },
    {
      label: '退出程序',
      click: () => quitApp(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  // 点击托盘图标显示窗口
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// 创建 WebSocket 服务器
const createWebSocketServer = () => {
  const port = 9696;
  wss = new WebSocketServer({ port });

  wss.on('connection', ws => {
    console.log('新的 WebSocket 连接已建立');

    // 监听消息
    ws.on('message', message => {
      console.log('收到消息:', message.toString());
      // 回复客户端
      ws.send(`服务器收到消息: ${message}`);
    });

    // 监听连接关闭
    ws.on('close', () => {
      console.log('WebSocket 连接已关闭');
    });

    // 监听错误
    ws.on('error', error => {
      console.error('WebSocket 错误:', error);
    });
  });

  console.log(`WebSocket 服务器已启动，监听端口 ${port}`);
};

app.on('ready', () => {
  // 启动 WebSocket 服务器
  createWebSocketServer();
  // 全局移除菜单栏
  Menu.setApplicationMenu(null);

  createWindow();
  createTray();

  // 注册全局快捷键
  // 后退
  globalShortcut.register('Alt+Left', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      const history = win.webContents.navigationHistory;
      if (history.canGoBack()) {
        history.goBack();
      }
    }
  });

  // 刷新
  globalShortcut.register('F5', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.webContents.reload();
    }
  });

  // 开发者工具
  globalShortcut.register('F12', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.webContents.toggleDevTools();
    }
  });

  // 设置Cookie处理程序
  setupCookieHandlers();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 不直接退出应用，保持托盘运行
    // app.quit(); - 注释掉这行
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 消息处理
// 处理登出请求，清除 bilibili 的 cookie
ipcMain.on('app:logout', async () => {
  try {
    const cookies = await session.defaultSession.cookies.get({ domain: 'bilibili.com' });
    for (const cookie of cookies) {
      const url = `https://${cookie.domain}${cookie.path}`;
      await session.defaultSession.cookies.remove(url, cookie.name);
    }
    console.log('Bilibili cookies cleared successfully');
  } catch (error) {
    console.error('Error clearing cookies:', error);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
