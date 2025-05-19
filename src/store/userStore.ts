import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BiliLoginService } from '../services/BiliLogin';

// 定义用户状态接口
interface UserState {
  // 是否已登录
  isLoggedIn: boolean;
  // 用户名
  username: string;
  // 用户ID
  userId: number;
  // 用户头像
  avatar: string;
  // 直播间ID
  roomId: number;
  // 设置登录状态
  setLoginState: (
    isLoggedIn: boolean,
    username?: string,
    userId?: number,
    avatar?: string,
    roomId?: number
  ) => void;
  // 清除登录状态
  clearLoginState: () => void;
  // 退出登录
  logout: () => void;
  // 检查现有登录状态
  checkExistingLogin: () => Promise<boolean>;
}

const USER_STORAGE_KEY = 'user-store';

// 创建用户状态管理store
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      username: '',
      userId: 0,
      avatar: '',
      roomId: 0,

      setLoginState: (isLoggedIn, username = '', userId = 0, avatar = '', roomId = 0) =>
        set({
          isLoggedIn,
          username,
          userId,
          avatar,
          roomId,
        }),

      clearLoginState: () =>
        set({
          isLoggedIn: false,
          username: '',
          userId: 0,
          avatar: '',
          roomId: 0,
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
          userId: 0,
          avatar: '',
          roomId: 0,
        });
      },

      // 检查是否已经登录，验证登录状态
      checkExistingLogin: async () => {
        try {
          // 尝试获取用户信息，验证登录状态
          const userInfo = await BiliLoginService.getUserInfo();

          // 如果登录有效，更新登录状态
          if (userInfo && userInfo.isLogin) {
            set({
              isLoggedIn: true,
              username: userInfo.uname,
              userId: userInfo.mid,
              avatar: userInfo.face,
            });
            return true;
          } else {
            // 如果登录已失效，更新为未登录状态
            set({
              isLoggedIn: false,
              username: '',
              userId: 0,
              avatar: '',
            });
            return false;
          }
        } catch (error) {
          console.error('验证登录状态失败', error);
          // 出错时也更新为未登录状态
          set({
            isLoggedIn: false,
            username: '',
            userId: 0,
            avatar: '',
          });
          return false;
        }
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
