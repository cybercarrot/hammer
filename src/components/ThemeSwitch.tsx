import React from 'react';
import { IconButton } from '@radix-ui/themes';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';
import { useSettingStore } from '../store/settingStore';

const ThemeSwitch: React.FC = () => {
  const { theme, toggleTheme } = useSettingStore();
  const isDark = theme === 'dark';

  return (
    <IconButton
      className="!m-0"
      size="2"
      variant="ghost"
      onClick={toggleTheme}
      aria-label="切换主题"
    >
      {isDark ? <MoonIcon width="18" height="18" /> : <SunIcon width="18" height="18" />}
    </IconButton>
  );
};

export default ThemeSwitch;
