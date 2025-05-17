import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 定义用户状态接口
interface UserState {
  // 是否已登录
  isLoggedIn: boolean;
  // 用户名
  username: string;
  // 用户ID
  userId: string;
  // 用户头像
  avatar: string;
  // 设置登录状态
  setLoginState: (isLoggedIn: boolean, username?: string, userId?: string, avatar?: string) => void;
  // 清除登录状态
  clearLoginState: () => void;
  // 退出登录
  logout: () => void;
}

const USER_STORAGE_KEY = 'user-store';

// 创建用户状态管理store
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      username: '',
      userId: '',
      avatar: '',

      setLoginState: (isLoggedIn, username = '', userId = '', avatar = '') =>
        set({
          isLoggedIn,
          username,
          userId,
          avatar,
        }),

      clearLoginState: () =>
        set({
          isLoggedIn: false,
          username: '',
          userId: '',
          avatar: '',
        }),

      logout: () => {
        // 清除 bilibili cookie
        if (window.electron) {
          window.electron.utils.sendToMain('app:logout', null);
        }

        // 重置状态
        set({
          isLoggedIn: false,
          username: '',
          userId: '',
          avatar: '',
        });
      },
    }),
    {
      name: USER_STORAGE_KEY,
      // 只持久化这些字段
      partialize: state => ({
        isLoggedIn: state.isLoggedIn,
        username: state.username,
        userId: state.userId,
        avatar: state.avatar,
      }),
    }
  )
);
