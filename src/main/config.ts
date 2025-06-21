// 窗口尺寸配置
export const WINDOW_CONFIG = {
  // 主窗口默认尺寸
  MAIN_WINDOW: {
    WIDTH: 1400,
    HEIGHT: 900,
  },
  // 弹幕查看器窗口尺寸
  DANMAKU_VIEWER: {
    WIDTH: 1600,
    HEIGHT: 900,
  },
} as const;

// 导出类型
export type WindowConfig = typeof WINDOW_CONFIG;
