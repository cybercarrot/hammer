import React from 'react';
import MainLayout from './components/MainLayout';
import { Theme } from '@radix-ui/themes';
import './styles/theme-config.css';
import { ToastProvider } from './context/ToastContext';
import { useSettingStore } from './store/settingStore';

const App: React.FC = () => {
  const { theme } = useSettingStore();

  return (
    <Theme appearance={theme} className="radix-themes">
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </Theme>
  );
};

export default App;
