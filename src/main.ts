import { app, BrowserWindow, ipcMain, session, Menu, MenuItem, globalShortcut } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { setupCookieHandlers } from './main/cookies';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// 存储当前主窗口引用
let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
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

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 监听窗口关闭事件，释放窗口对象
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // 全局移除菜单栏
  Menu.setApplicationMenu(null);

  createWindow();

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

// 禁用安全警告
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
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

// 在应用退出前注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
