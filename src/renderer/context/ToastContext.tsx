import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Toast from '@radix-ui/react-toast';

// 定义通知类型
export type ToastType = 'success' | 'error' | 'info';

// 定义通知数据结构
export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// 上下文接口定义
interface ToastContextValue {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
  toasts: ToastData[];
}

// 只保留动画相关的CSS
const animationStyles = `
  @keyframes slideIn {
    from { transform: translateX(calc(100% + 16px)); }
    to { transform: translateX(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes swipeOut {
    from { transform: translateX(var(--radix-toast-swipe-end-x)); }
    to { transform: translateX(calc(100% + 16px)); }
  }
  
  .toast-root[data-state='open'] {
    animation: slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .toast-root[data-state='closed'] {
    animation: fadeOut 100ms ease-in;
  }
  
  .toast-root[data-swipe='move'] {
    transform: translateX(var(--radix-toast-swipe-move-x));
  }
  
  .toast-root[data-swipe='cancel'] {
    transform: translateX(0);
    transition: transform 200ms ease-out;
  }
  
  .toast-root[data-swipe='end'] {
    animation: swipeOut 100ms ease-out;
  }
`;

// 创建上下文
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// 提供者组件
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // 添加样式到文档
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = animationStyles;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
    };
  }, []);

  const showToast = (message: string, type: ToastType, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);

    // 如果指定了持续时间，自动移除
    if (duration !== 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 根据类型获取背景色
  const getBackgroundColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toasts }}>
      {children}

      <Toast.Provider swipeDirection="right">
        {toasts.map(toast => (
          <Toast.Root
            key={toast.id}
            duration={toast.duration}
            onOpenChange={open => {
              if (!open) dismissToast(toast.id);
            }}
            className={`toast-root rounded text-sm text-white p-3 flex items-center shadow-md w-auto max-w-[500px] ${getBackgroundColor(toast.type)}`}
          >
            <Toast.Description className="m-0 leading-tight break-words">{toast.message}</Toast.Description>
          </Toast.Root>
        ))}
        <Toast.Viewport
          className="fixed bottom-0 right-0 flex flex-col p-4 gap-2 w-auto max-w-full m-0 z-[2147483647] outline-none"
          style={{ '--viewport-padding': '16px' } as React.CSSProperties}
        />
      </Toast.Provider>
    </ToastContext.Provider>
  );
};

// 自定义hook，方便组件使用通知功能
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast必须在ToastProvider内部使用');
  }
  return context;
};
