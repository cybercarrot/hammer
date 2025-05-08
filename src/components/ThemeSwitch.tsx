import React, { useState, useEffect } from 'react';
import { IconButton } from '@radix-ui/themes';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';

interface ThemeSwitchProps {
  className?: string;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ className = '' }) => {
  // 使用state跟踪当前主题
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark-theme');
  });

  // 切换主题
  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark-theme')) {
      html.classList.remove('dark-theme');
      setIsDark(false);
    } else {
      html.classList.add('dark-theme');
      setIsDark(true);
    }
  };

  // 监听主题变化（以防其他地方也会改变主题）
  useEffect(() => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark-theme'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <IconButton
      size="1"
      variant="ghost"
      onClick={toggleTheme}
      aria-label="切换主题"
      style={{ height: '26px', width: '26px' }}
      className={className}
    >
      {isDark ? <MoonIcon width="16" height="16" /> : <SunIcon width="16" height="16" />}
    </IconButton>
  );
};

export default ThemeSwitch;
