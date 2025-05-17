import React from 'react';
import MainLayout from './components/MainLayout';
import { Theme } from '@radix-ui/themes';
import './styles/theme-config.css';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
  // 检测是否为暗黑模式
  const isDarkMode = () => {
    return document.documentElement.classList.contains('dark-theme');
  };

  // 监听主题变化
  React.useEffect(() => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // 强制更新组件以反映主题变化
          setThemeAppearance(isDarkMode() ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // 设置主题外观
  const [themeAppearance, setThemeAppearance] = React.useState<'light' | 'dark'>('light');

  return (
    <Theme appearance={themeAppearance} className="radix-themes">
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </Theme>
  );
};

export default App;
