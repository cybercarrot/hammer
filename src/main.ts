import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// 存储当前主窗口引用
let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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

  // 允许跨域访问
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Origin'] = 'https://chat.laplace.live';
    callback({ requestHeaders: details.requestHeaders });
  });

  // 设置CSP头
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: gap:",
        ],
        'Access-Control-Allow-Origin': ['*'],
      },
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
app.on('ready', createWindow);

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

// 设置安全策略，允许哔哩哔哩和laplace.live的加载
app.on('web-contents-created', (_, contents) => {
  contents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https://*.laplace.live https://*.bilibili.com; script-src 'self' 'unsafe-inline' https://*.laplace.live https://*.bilibili.com; style-src 'self' 'unsafe-inline' https://*.laplace.live https://*.bilibili.com",
        ],
        'Access-Control-Allow-Origin': ['*'],
      },
    });
  });

  // 设置webview权限
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // 删除预加载脚本
    delete webPreferences.preload;

    // 允许在webview中运行Node.js
    webPreferences.nodeIntegration = false;

    // 禁用同源策略
    webPreferences.webSecurity = false;

    // 启用远程模块
    webPreferences.contextIsolation = true;

    // 允许加载不安全内容
    webPreferences.allowRunningInsecureContent = true;
  });
});

// IPC 消息处理
// 示例：接收来自渲染进程的消息
ipcMain.on('app:get-version', event => {
  event.returnValue = app.getVersion();
});

// 示例：接收来自渲染进程的消息，然后异步回复
ipcMain.on('app:check-connection', event => {
  // 模拟异步操作
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.webContents.send('app:connection-status', { connected: true });
    }
  }, 500);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
