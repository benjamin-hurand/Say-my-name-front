import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { neonColors, lightThemeColors } from '../models/commons/NeonColors';
import { darkTheme, lightTheme } from '../theme';

export type AccentMode = 'static' | 'random-hover' | 'cycle';

interface ThemeColorContextType {
  theme: 'dark' | 'light';
  color: string;
  toggleTheme: () => void;
  changeColor: (newColor: string) => void;
  randomizeColor: () => void;

  accentMode: AccentMode;
  setAccentMode: (m: AccentMode) => void;
  cycleIntervalMs: number;
  setCycleIntervalMs: (ms: number) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

export const useThemeColorContext = (): ThemeColorContextType => {
  const context = useContext(ThemeColorContext);
  if (!context) {
    throw new Error('useThemeColorContext must be used within a ThemeColorProvider');
  }
  return context;
};

interface ThemeColorProviderProps {
  children: React.ReactNode;
}

export const ThemeColorProvider: React.FC<ThemeColorProviderProps> = ({ children }) => {
  // Préférences OS (fallback si pas de localStorage)
  const prefersDarkMode = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

  // Init depuis localStorage (évite le "flicker")
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' || stored === 'light' ? (stored as 'dark' | 'light') : (prefersDarkMode ? 'dark' : 'light');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const [color, setColor] = useState<string>(() => {
    const stored = localStorage.getItem('accentColor');
    if (stored) return stored;
    return (theme === 'dark' ? neonColors[0] : lightThemeColors[0]);
  });

  const [accentMode, setAccentMode] = useState<AccentMode>(() => {
    const stored = localStorage.getItem('accentMode') as AccentMode | null;
    return stored === 'static' || stored === 'random-hover' || stored === 'cycle' ? stored : 'static';
  });

  const [cycleIntervalMs, setCycleIntervalMs] = useState<number>(() => {
    const stored = Number(localStorage.getItem('cycleIntervalMs') ?? 8000);
    return Number.isFinite(stored) && stored >= 500 ? stored : 8000;
  });

  // Mode "cycle" : fait tourner la couleur automatiquement
  useEffect(() => {
    if (accentMode !== 'cycle') return;
    const colors = theme === 'dark' ? neonColors : lightThemeColors;
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * colors.length);
      setColor(colors[idx]);
    }, cycleIntervalMs);
    return () => clearInterval(id);
  }, [accentMode, cycleIntervalMs, theme]);

  // Toggle dark/light — on aligne la couleur sur la palette du thème choisi (comportement actuel)
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      setColor(newTheme === 'dark' ? neonColors[0] : lightThemeColors[0]);
      return newTheme;
    });
  };

  const changeColor = (newColor: string) => {
    setColor(newColor);
  };

  const randomizeColor = () => {
    const colors = theme === 'dark' ? neonColors : lightThemeColors;
    const randomIndex = Math.floor(Math.random() * colors.length);
    setColor(colors[randomIndex]);
  };

  // Expose la couleur comme variable CSS
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', color);
  }, [color]);

  // Persistance simple
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('accentColor', color);
  }, [color]);

  useEffect(() => {
    localStorage.setItem('accentMode', accentMode);
  }, [accentMode]);

  useEffect(() => {
    localStorage.setItem('cycleIntervalMs', String(cycleIntervalMs));
  }, [cycleIntervalMs]);

  const themeConfig = useMemo(
    () => (theme === 'dark' ? darkTheme(color) : lightTheme(color)),
    [theme, color]
  );

  return (
    <ThemeColorContext.Provider
      value={{
        theme,
        color,
        toggleTheme,
        changeColor,
        randomizeColor,
        accentMode,
        setAccentMode,
        cycleIntervalMs,
        setCycleIntervalMs,
      }}
    >
      <MuiThemeProvider theme={themeConfig}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeColorContext.Provider>
  );
};
