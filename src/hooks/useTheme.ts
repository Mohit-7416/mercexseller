import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(t);
  localStorage.setItem('theme', t);
};

export const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme');
  return saved === 'light' ? 'light' : 'dark';
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return { theme, setTheme: setThemeState };
};
