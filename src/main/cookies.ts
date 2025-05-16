import { ipcMain, session } from 'electron';

// 设置IPC监听器
export function setupCookieHandlers() {
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

  console.log('Cookie handlers initialized');
}
