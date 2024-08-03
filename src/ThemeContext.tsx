import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { darkTheme, lightTheme } from './theme';
import { useMediaQuery } from '@mui/material';

interface ThemeContextProps {
    toggleTheme: () => void;
    theme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    // Détecte la préférence de thème du système
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    const [theme, setTheme] = useState<'dark' | 'light'>(prefersDarkMode ? 'dark' : 'light');

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ toggleTheme, theme }}>
            <MuiThemeProvider theme={currentTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
