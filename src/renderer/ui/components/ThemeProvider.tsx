import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Get system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Update the document theme attribute
  const updateDocumentTheme = useCallback((theme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', theme);
    // Also add/remove dark class for compatibility
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Update the resolved theme based on current theme setting
  const updateResolvedTheme = useCallback(
    (currentTheme: Theme) => {
      if (currentTheme === 'system') {
        const systemTheme = getSystemTheme();
        setResolvedTheme(systemTheme);
        updateDocumentTheme(systemTheme);
      } else {
        setResolvedTheme(currentTheme);
        updateDocumentTheme(currentTheme);
      }
    },
    [getSystemTheme, updateDocumentTheme],
  );

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    updateResolvedTheme(newTheme);
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = getSystemTheme();
        setResolvedTheme(systemTheme);
        updateDocumentTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, getSystemTheme, updateDocumentTheme]);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
      updateResolvedTheme(savedTheme);
    } else {
      // Default to system if no saved theme
      updateResolvedTheme('system');
    }
  }, [updateResolvedTheme]);

  // Initialize theme on first render
  useEffect(() => {
    updateResolvedTheme(theme);
  }, [theme, updateResolvedTheme]);

  const value = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
