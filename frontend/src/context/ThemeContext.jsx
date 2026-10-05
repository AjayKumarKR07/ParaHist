// ThemeContext.jsx — Unified Theme System for ParaHist with Dark / Light / System support
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const THEME_STORAGE_KEY = 'parahist_theme';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read theme from localStorage', e);
    }
    return 'dark'; // Default is Dark Mode
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Track OS system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemIsDark(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Compute effective active theme (dark or light)
  const resolvedTheme = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  // Apply theme class and data-theme attribute to <html> root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
    root.style.colorScheme = resolvedTheme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Could not persist theme to localStorage', e);
    }
  }, [theme, resolvedTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const current = prev === 'system' ? (systemIsDark ? 'dark' : 'light') : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemIsDark]);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light' || newTheme === 'system') {
      setThemeState(newTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark: resolvedTheme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
