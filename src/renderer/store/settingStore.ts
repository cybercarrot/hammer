import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import shortUuid from 'short-uuid';
import { MUSIC_SOURCES, MusicSourceValue } from './songStore';

type ThemeType = 'light' | 'dark';

// 弹幕机配置接口
interface DanmakuConfig {
  password: string;
  uuid: string;
}

// OBS WebSocket 配置接口
interface OBSConfig {
  address: string;
  port: number;
  password: string;
  textTemplate: string;
  playlistTemplate: string;
}

// 设置状态接口
interface SettingState {
  // 控制台连接状态
  consoleConnected: boolean;
  // 设置控制台连接状态
  setConsoleConnected: (connected: boolean) => void;
  // 主题设置
  theme: ThemeType;
  // 设置主题
  setTheme: (theme: ThemeType) => void;
  // 切换主题
  toggleTheme: () => void;

  // 当前选中的tab
  currentTab: string;
  // 设置当前选中的tab
  setCurrentTab: (tab: string) => void;

  // 弹幕机配置
  danmakuConfig: DanmakuConfig;
  // 更新弹幕机配置
  updateDanmakuConfig: (config: Partial<DanmakuConfig>) => void;
  // 重新生成弹幕机ID
  regenerateDanmakuIds: () => void;
  // 获取合并的token
  getMergedToken: () => string;

  // OBS WebSocket 配置
  obsConfig: OBSConfig;
  // 更新OBS配置
  updateOBSConfig: (config: Partial<OBSConfig>) => void;
  // 重置OBS文字模板配置
  resetOBSTextTemplate: () => void;
  // 重置OBS连接配置
  resetOBSConnection: () => void;

  // 前缀配置
  prefixConfig: Record<MusicSourceValue, string>;
  // 获取前缀配置（用于在闭包中获取最新值）
  getPrefixConfig: () => Record<MusicSourceValue, string>;
  // 更新前缀配置
  updatePrefixConfig: (source: MusicSourceValue, value: string) => void;

  // 黑名单关键词
  blacklist: string[];
  // 添加黑名单关键词
  addToBlacklist: (keyword: string) => void;
  // 移除黑名单关键词
  removeFromBlacklist: (keyword: string) => void;
  // 检查是否包含黑名单关键词
  hasBlacklistedKeyword: (text: string) => boolean;

  // 同步歌单配置
  syncPlaylistId: string;
  syncUserId: string;
  // 设置同步歌单ID
  setSyncPlaylistId: (id: string) => void;
  // 设置同步用户ID
  setSyncUserId: (id: string) => void;
}

const SETTING_STORAGE_KEY = 'setting-store';

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

// 获取初始OBS配置
export const getInitialOBSConfig = (): OBSConfig => {
  return {
    address: 'localhost',
    port: 4455,
    password: '',
    textTemplate: `正在播放: {歌曲名} - {歌手} - {点歌者}
{点歌列表}`,
    playlistTemplate: '#{序号} - {歌曲名} - {歌手} - {点歌者}',
  };
};

// 创建设置状态管理store
export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => ({
      // 控制台连接状态
      consoleConnected: false,
      setConsoleConnected: (connected: boolean) => set({ consoleConnected: connected }),

      // 主题
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

      // 当前选中的tab
      currentTab: 'danmaku',
      // 设置当前选中的tab
      setCurrentTab: tab => set({ currentTab: tab }),

      // 弹幕机
      danmakuConfig: getInitialDanmakuConfig(),
      updateDanmakuConfig: config => {
        set(state => ({
          danmakuConfig: {
            ...state.danmakuConfig,
            ...config,
          },
        }));
      },
      regenerateDanmakuIds: () => {
        set({
          danmakuConfig: {
            password: shortUuid.generate(),
            uuid: shortUuid.generate(),
          },
        });
      },
      getMergedToken: () => {
        const { uuid, password } = get().danmakuConfig;
        return `${uuid}@${password}`;
      },

      // OBS WebSocket 配置
      obsConfig: getInitialOBSConfig(),
      updateOBSConfig: config => {
        set(state => ({
          obsConfig: {
            ...state.obsConfig,
            ...config,
          },
        }));
      },
      resetOBSTextTemplate: () => {
        set(state => ({
          obsConfig: {
            ...state.obsConfig,
            textTemplate: getInitialOBSConfig().textTemplate,
            playlistTemplate: getInitialOBSConfig().playlistTemplate,
          },
        }));
      },
      resetOBSConnection: () => {
        set(state => ({
          obsConfig: {
            ...state.obsConfig,
            address: getInitialOBSConfig().address,
            port: getInitialOBSConfig().port,
            password: getInitialOBSConfig().password,
          },
        }));
      },

      // 前缀配置
      prefixConfig: MUSIC_SOURCES.reduce(
        (acc, source) => {
          acc[source.value] = source.prefix;
          return acc;
        },
        {} as Record<MusicSourceValue, string>
      ),
      // 获取前缀配置（用于在闭包中获取最新值）
      getPrefixConfig: () => get().prefixConfig,
      updatePrefixConfig: (source, value) => {
        set(state => ({
          prefixConfig: {
            ...state.prefixConfig,
            [source]: value,
          },
        }));
      },

      // 黑名单关键词
      blacklist: [] as string[],
      addToBlacklist: keyword => {
        if (!keyword) return;
        set(state => {
          // 如果已存在，则不添加
          if (state.blacklist.includes(keyword)) {
            return state;
          }
          return {
            blacklist: [...state.blacklist, keyword],
          };
        });
      },
      removeFromBlacklist: keyword => {
        set(state => ({
          blacklist: state.blacklist.filter(item => item !== keyword),
        }));
      },
      hasBlacklistedKeyword: text => {
        const { blacklist } = get();
        if (!text || !blacklist.length) return false;
        const lowerText = text.toLowerCase();
        return blacklist.some(keyword => keyword && lowerText.includes(keyword.toLowerCase()));
      },

      // 同步歌单配置
      syncPlaylistId: '',
      syncUserId: '',
      // 设置同步歌单ID
      setSyncPlaylistId: id => set({ syncPlaylistId: id }),
      // 设置同步用户ID
      setSyncUserId: id => set({ syncUserId: id }),
    }),
    {
      name: SETTING_STORAGE_KEY, // 只保存必要的状态
      partialize: state => ({
        theme: state.theme,
        currentTab: state.currentTab,
        danmakuConfig: state.danmakuConfig,
        obsConfig: state.obsConfig,
        blacklist: state.blacklist,
        prefixConfig: state.prefixConfig,
        syncPlaylistId: state.syncPlaylistId,
        syncUserId: state.syncUserId,
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
