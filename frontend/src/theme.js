import { createContext, useContext } from 'react';

/**
 * Theme tokens — every color in the system goes through here.
 * Components read `t.bg`, `t.text`, etc. instead of hardcoded hex values.
 */
const darkTokens = {
  bg: '#000000',
  bgPanel: '#0a0a0a',
  bgInput: '#0f0f0f',
  bgHover: '#1a1a1a',
  border: '#2a2a2a',
  borderLight: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#e5e5e5',
  textMuted: '#6b7280',
  textDim: '#4b5563',
  textGhost: '#3a3a3a',
  headerBg: '#000000',
  footerText: '#4b5563',
  isDark: true,
};

const lightTokens = {
  bg: '#f5f5f5',
  bgPanel: '#ffffff',
  bgInput: '#ffffff',
  bgHover: '#e8e8e8',
  border: '#d4d4d4',
  borderLight: '#e5e5e5',
  text: '#111111',
  textSecondary: '#333333',
  textMuted: '#6b7280',
  textDim: '#9ca3af',
  textGhost: '#c4c4c4',
  headerBg: '#ffffff',
  footerText: '#9ca3af',
  isDark: false,
};

const ThemeContext = createContext(darkTokens);

export function useTheme() {
  return useContext(ThemeContext);
}

export function getTokens(isDark) {
  return isDark ? darkTokens : lightTokens;
}

export { ThemeContext, darkTokens, lightTokens };
