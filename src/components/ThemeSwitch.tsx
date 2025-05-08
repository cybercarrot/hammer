import React from 'react';
import { Switch, Flex, Text } from '@radix-ui/themes';

interface ThemeSwitchProps {
  className?: string;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ className = '' }) => {
  // 检查当前主题是否为暗色
  const isDarkTheme = document.documentElement.classList.contains('dark-theme');

  // 切换主题
  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark-theme')) {
      html.classList.remove('dark-theme');
    } else {
      html.classList.add('dark-theme');
    }
  };

  return (
    <Flex gap="2" align="center" className={className}>
      <Text size="1">🌞</Text>
      <Switch checked={isDarkTheme} onCheckedChange={toggleTheme} />
      <Text size="1">🌙</Text>
    </Flex>
  );
};

export default ThemeSwitch;
