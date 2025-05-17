import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import shortUuid from 'short-uuid';

type ThemeType = 'light' | 'dark';

// 弹幕机配置接口
interface DanmakuConfig {
  password: string;
  uuid: string;
}

// 设置状态接口
interface SettingState {
  // 主题设置
  theme: ThemeType;
  // 设置主题
  setTheme: (theme: ThemeType) => void;
  // 切换主题
  toggleTheme: () => void;

  // 弹幕机配置
  danmakuConfig: DanmakuConfig;
  // 更新弹幕机配置
  updateDanmakuConfig: (config: Partial<DanmakuConfig>) => void;
  // 重新生成弹幕机ID
  regenerateDanmakuIds: () => void;
  // 获取合并的token
  getMergedToken: () => string;
}

const THEME_STORAGE_KEY = 'setting-store';

// 获取初始主题
const getInitialTheme = (): ThemeType => {
  // 如果在浏览器环境
  if (typeof window !== 'undefined' && window.matchMedia) {
    // 检查系统偏好
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return userPrefersDark ? 'dark' : 'light';
  }

  return 'dark'; // 默认主题
};

// 获取初始弹幕机配置
const getInitialDanmakuConfig = (): DanmakuConfig => {
  return {
    password: shortUuid.generate(),
    uuid: shortUuid.generate(),
  };
};

// 创建设置状态管理store
export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),

      setTheme: theme => {
        set({ theme });

        // 应用主题到DOM
        const html = document.documentElement;
        if (theme === 'dark') {
          html.classList.add('dark-theme');
        } else {
          html.classList.remove('dark-theme');
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // 弹幕机配置
      danmakuConfig: getInitialDanmakuConfig(),

      // 更新弹幕机配置
      updateDanmakuConfig: config => {
        set(state => ({
          danmakuConfig: {
            ...state.danmakuConfig,
            ...config,
          },
        }));
      },

      // 重新生成弹幕机ID
      regenerateDanmakuIds: () => {
        set({
          danmakuConfig: {
            password: shortUuid.generate(),
            uuid: shortUuid.generate(),
          },
        });
      },

      // 获取合并的token
      getMergedToken: () => {
        const { uuid, password } = get().danmakuConfig;
        return `${uuid}@${password}`;
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: state => ({
        theme: state.theme,
        danmakuConfig: state.danmakuConfig,
      }),
      onRehydrateStorage: () => {
        // 当状态从存储中恢复后被调用
        return state => {
          if (state) {
            // 立即应用主题到DOM
            const html = document.documentElement;
            if (state.theme === 'dark') {
              html.classList.add('dark-theme');
            } else {
              html.classList.remove('dark-theme');
            }
          }
        };
      },
    }
  )
);
