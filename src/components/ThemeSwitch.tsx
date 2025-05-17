import React from 'react';
import { IconButton } from '@radix-ui/themes';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';
import { useSettingStore } from '../store/settingStore';

interface ThemeSwitchProps {
  className?: string;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useSettingStore();
  const isDark = theme === 'dark';

  return (
    <IconButton
      size="2"
      variant="ghost"
      onClick={toggleTheme}
      aria-label="切换主题"
      className={className}
    >
      {isDark ? <MoonIcon width="18" height="18" /> : <SunIcon width="18" height="18" />}
    </IconButton>
  );
};

export default ThemeSwitch;
