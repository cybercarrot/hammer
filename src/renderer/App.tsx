import React, { useEffect } from 'react';
import MainLayout from './pages/MainLayout';
import { Theme } from '@radix-ui/themes';
import { ToastProvider } from './context/ToastContext';
import { useSettingStore } from './store/settingStore';

const App: React.FC = () => {
  const { theme, contentProtection } = useSettingStore();

  // 应用内容保护设置
  useEffect(() => {
    const applyContentProtectionSettings = async () => {
      try {
        // 应用主窗口内容保护设置
        if (contentProtection.mainWindow) {
          await window.electron.window.setContentProtection(true);
        }

        // 注意：弹幕浮层窗口的内容保护设置在窗口创建时应用，
        // 不需要在这里设置，因为浮层窗口可能还没有创建
      } catch (error) {
        console.error('应用内容保护设置时出错:', error);
      }
    };

    applyContentProtectionSettings();
  }, [contentProtection.mainWindow]);

  return (
    <Theme appearance={theme} className="radix-themes">
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </Theme>
  );
};

export default App;
