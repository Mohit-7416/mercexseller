import { useEffect, useRef, useState } from 'react';

export type Theme = 'dark' | 'light';
export type Accent = 'sea' | 'brown' | 'ocean' | 'sunset' | 'forest' | 'plum';

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: 'sea', label: 'Sea Green', swatch: 'hsl(165 45% 40%)' },
  { id: 'brown', label: 'Warm Brown', swatch: 'hsl(32 65% 45%)' },
  { id: 'ocean', label: 'Ocean Blue', swatch: 'hsl(200 70% 45%)' },
  { id: 'sunset', label: 'Sunset', swatch: 'hsl(18 80% 55%)' },
  { id: 'forest', label: 'Forest', swatch: 'hsl(140 40% 35%)' },
  { id: 'plum', label: 'Plum', swatch: 'hsl(285 45% 45%)' },
];

const applyAccentDom = (a: Accent) => {
  const root = document.documentElement;
  ACCENTS.forEach(x => root.classList.remove(`accent-${x.id}`));
  root.classList.add(`accent-${a}`);
};

export const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(t);
  localStorage.setItem('theme', t);
};

/** Apply and persist immediately. */
export const applyAccent = (a: Accent) => {
  applyAccentDom(a);
  localStorage.setItem('accent', a);
};

/** Preview only – DOM class swap, no persistence. */
export const previewAccentDom = (a: Accent) => applyAccentDom(a);

export const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme');
  return saved === 'light' ? 'light' : 'dark';
};

export const getInitialAccent = (): Accent => {
  const saved = localStorage.getItem('accent') as Accent | null;
  return (saved && ACCENTS.find(a => a.id === saved)) ? saved : 'sea';
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [accent, setAccentState] = useState<Accent>(getInitialAccent);
  const committedAccentRef = useRef<Accent>(accent);
  useEffect(() => { applyTheme(theme); }, [theme]);

  /** Change accent visually without persisting. Used for live preview in Settings. */
  const previewAccent = (a: Accent) => previewAccentDom(a);
  /** Persist the chosen accent (called on Save Changes). */
  const commitAccent = (a: Accent) => {
    committedAccentRef.current = a;
    setAccentState(a);
    applyAccent(a);
  };
  /** Revert DOM back to last-saved accent (called on unmount/cancel). */
  const restoreSavedAccent = () => applyAccentDom(committedAccentRef.current);

  return { theme, setTheme: setThemeState, accent, setAccent: setAccentState, previewAccent, commitAccent, restoreSavedAccent };
};
