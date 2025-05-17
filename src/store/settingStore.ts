import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeType = 'light' | 'dark';

// 设置状态接口
interface SettingState {
  // 主题设置
  theme: ThemeType;
  // 设置主题
  setTheme: (theme: ThemeType) => void;
  // 切换主题
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'hammer-settings';

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
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: state => ({ theme: state.theme }),
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
