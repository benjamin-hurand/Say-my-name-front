import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { neonColors, lightThemeColors } from '../models/commons/NeonColors';
import { darkTheme, lightTheme } from '../theme';

interface ThemeColorContextType {
    theme: 'dark' | 'light';
    color: string;
    toggleTheme: () => void;
    changeColor: (newColor: string) => void;
    randomizeColor: () => void;
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
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [theme, setTheme] = useState<'dark' | 'light'>(prefersDarkMode ? 'dark' : 'light');
    const initialColors = theme === 'dark' ? neonColors : lightThemeColors;
    const [color, setColor] = useState<string>(initialColors[0]);

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
            // Switch colors based on theme change
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

    useEffect(() => {
        document.documentElement.style.setProperty('--theme-color', color);
      }, [color]);

    const themeConfig = useMemo(() => theme === 'dark' ? darkTheme(color) : lightTheme(color), [theme, color]);

    return (
        <ThemeColorContext.Provider value={{ theme, color, toggleTheme, changeColor, randomizeColor }}>
            <MuiThemeProvider theme={themeConfig}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeColorContext.Provider>
    );
};

