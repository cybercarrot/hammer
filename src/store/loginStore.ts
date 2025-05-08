import { create } from 'zustand';
import { BiliLoginService } from '../services/BiliLogin';

// 定义登录状态接口
interface LoginState {
  // 是否已登录
  isLoggedIn: boolean;
  // 登录用户名
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

// 创建登录状态管理store
export const useLoginStore = create<LoginState>((set, get) => ({
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
    // 清除本地存储中的用户信息
    BiliLoginService.clearUserInfo();

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
}));
