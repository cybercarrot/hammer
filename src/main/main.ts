import { app, BrowserWindow, ipcMain, session, Menu, globalShortcut, Tray, nativeImage } from 'electron';
import path from 'node:path';
// @ts-expect-error electron-squirrel-startup is not a typescript module
import started from 'electron-squirrel-startup';
import windowStateKeeper from 'electron-window-state';
import { wsServer } from './websocket';
import { WINDOW_CONFIG } from './config';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// 存储当前主窗口引用
let mainWindow: BrowserWindow | null = null;
// 存储chatOverlay窗口引用
let chatOverlayWindow: BrowserWindow | null = null;
// 创建托盘变量
let tray: Tray | null = null;

// 获取资源路径的辅助函数
function getAssetPath(...paths: string[]): string {
  if (app.isPackaged) {
    // 打包后的路径
    return path.join(process.resourcesPath, ...paths);
  } else {
    // 开发环境路径
    return 'src/assets/icon.ico';
  }
}

// 图标路径
const iconPath = getAssetPath('icon.ico');
// 加载图标
const icon = nativeImage.createFromPath(iconPath);
if (icon.isEmpty()) {
  console.error('Failed to load tray icon from path:', iconPath);
}

// MARK: 创建托盘图标
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

// MARK: 创建右键菜单函数
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

// MARK: 创建主窗口
const createWindow = () => {
  // 加载窗口状态管理器
  const windowState = windowStateKeeper({
    defaultWidth: WINDOW_CONFIG.MAIN_WINDOW.WIDTH,
    defaultHeight: WINDOW_CONFIG.MAIN_WINDOW.HEIGHT,
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

// MARK: 创建弹幕浮层窗口
const createChatOverlayWindow = () => {
  const windowState = windowStateKeeper({
    defaultWidth: 400,
    defaultHeight: 800,
    file: 'chat-overlay-window-state.json',
  });

  chatOverlayWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-chat-overlay.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  windowState.manage(chatOverlayWindow);

  // 监听窗口关闭事件，通知主窗口更新状态
  chatOverlayWindow.on('closed', () => {
    // 通知主窗口弹幕浮层已关闭
    mainWindow?.webContents.send('chat-overlay:closed');
    chatOverlayWindow = null;
  });

  // and load the index.html of the app.
  if (CHAT_OVERLAY_WINDOW_VITE_DEV_SERVER_URL) {
    chatOverlayWindow.loadURL(CHAT_OVERLAY_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    chatOverlayWindow.loadFile(path.join(__dirname, `../renderer/${CHAT_OVERLAY_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  // chatOverlayWindow.webContents.openDevTools();

  return chatOverlayWindow;
};

// MARK: 直接退出应用函数
const quitApp = () => {
  console.log('正在退出程序...');

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
    mainWindow = null;
  }

  if (chatOverlayWindow && !chatOverlayWindow.isDestroyed()) {
    chatOverlayWindow.close();
    chatOverlayWindow = null;
  }

  if (!tray?.isDestroyed()) {
    tray.destroy();
    tray = null;
  }

  globalShortcut.unregisterAll();

  // 关闭 WebSocket 服务器
  wsServer.stop();

  app.quit();
};

// MARK: 主窗口IPC事件
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

// 获取指定域名的cookies
ipcMain.handle('get-cookies-by-domains', async (event, domains: string[]) => {
  try {
    const cookiesMap: Record<string, Electron.Cookie[]> = {};

    for (const domain of domains) {
      const cookies = await session.defaultSession.cookies.get({ domain });
      if (cookies && cookies.length > 0) {
        cookiesMap[domain] = cookies;
      } else {
        cookiesMap[domain] = [];
      }
    }

    return { success: true, data: cookiesMap };
  } catch (error) {
    console.error('获取cookies失败:', error);
    return { success: false, error: String(error) };
  }
});

// 重置窗口大小与位置
ipcMain.handle('window:reset-size-and-position', () => {
  if (mainWindow) {
    // 重置窗口到默认大小和位置
    mainWindow.setBounds(
      {
        x: 0,
        y: 0,
        width: WINDOW_CONFIG.MAIN_WINDOW.WIDTH,
        height: WINDOW_CONFIG.MAIN_WINDOW.HEIGHT,
      },
      true
    );

    // 居中显示窗口
    mainWindow.center();

    return { success: true };
  }
  return { success: false, error: 'Main window not found' };
});

// 打开chatOverlay窗口
ipcMain.handle('chat-overlay:open', () => {
  try {
    if (chatOverlayWindow) {
      chatOverlayWindow.destroy();
    }
    chatOverlayWindow = createChatOverlayWindow();
    return { success: true, windowId: chatOverlayWindow.id };
  } catch (error) {
    console.error('Error creating chat overlay window:', error);
    return { success: false, error: error.message };
  }
});

// 关闭chatOverlay窗口
ipcMain.handle('chat-overlay:close', () => {
  try {
    if (chatOverlayWindow) {
      if (chatOverlayWindow.isDestroyed()) {
        chatOverlayWindow = null;
      } else {
        chatOverlayWindow.close();
        chatOverlayWindow = null;
      }
      return { success: true };
    }
    return { success: false, error: 'Chat overlay window not found' };
  } catch (error) {
    console.error('Error closing chat overlay window:', error);
    return { success: false, error: error.message };
  }
});

// 重置悬浮窗大小与位置
ipcMain.handle('chat-overlay:reset-size-and-position', () => {
  try {
    if (chatOverlayWindow && !chatOverlayWindow.isDestroyed()) {
      // 重置悬浮窗到默认大小和位置
      chatOverlayWindow.setBounds(
        {
          x: 0,
          y: 0,
          width: 400,
          height: 800,
        },
        true
      );

      // 居中显示悬浮窗
      chatOverlayWindow.center();

      return { success: true };
    }
    return { success: false, error: 'Chat overlay window not found or destroyed' };
  } catch (error) {
    console.error('Error resetting chat overlay window size and position:', error);
    return { success: false, error: error.message };
  }
});

// 退出程序
ipcMain.handle('app:quit', () => {
  quitApp();
  return { success: true };
});

// MARK: 弹幕浮层窗口IPC事件
// Handle opacity changes
ipcMain.on('set-window-opacity', (event, opacity) => {
  chatOverlayWindow?.setOpacity(opacity);
});

// Handle always on top toggle
ipcMain.on('set-always-on-top', (event, enabled) => {
  chatOverlayWindow?.setAlwaysOnTop(enabled);
});

// Handle click pass-through toggle
ipcMain.on('set-click-through', (event, enabled) => {
  if (enabled) {
    // Don't make the entire window click-through immediately
    // Instead, let the renderer handle mouse tracking
    chatOverlayWindow?.webContents.send('click-through-enabled', true);
  } else {
    // Disable click pass-through
    chatOverlayWindow?.setIgnoreMouseEvents(false);
    chatOverlayWindow?.webContents.send('click-through-enabled', false);
  }
});

// Handle mouse enter/leave events for click-through mode
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  chatOverlayWindow?.setIgnoreMouseEvents(ignore, { forward: true });
});

// MARK: 应用事件
app.on('ready', () => {
  // 全局移除菜单栏
  Menu.setApplicationMenu(null);

  // 允许跨域访问
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // 如果是localhost或127.0.0.1的请求，根据目标域名设置请求头
    if (details.referrer.includes('http://localhost') || details.referrer.includes('http://127.0.0.1')) {
      const url = new URL(details.url);
      details.requestHeaders['Origin'] = `${url.protocol}//${url.hostname}`;
      details.requestHeaders['Referer'] = `${url.protocol}//${url.hostname}`;
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

  // 启动 WebSocket 服务器
  wsServer.start();

  createTray();
  createWindow();
});

// 为所有新建的webContents添加右键菜单
app.on('web-contents-created', (_, webContents) => {
  webContents.on('context-menu', () => {
    createContextMenu(webContents).popup();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 不直接退出应用，保持托盘运行
    // app.quit(); - 注释掉这行
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
