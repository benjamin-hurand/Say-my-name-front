import { createTheme } from '@mui/material/styles';

const neonColors = ['#ffffff', '#FF073A', '#0FF0FC', '#FC0FC0', '#FFF700']; // Example neon colors

const commonStyles = {
    '@import': "url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@200;300;400;600;700;900&display=swap')",
    '*': {
        boxSizing: 'border-box',
        margin: 0,
        padding: 0,
    },
    '*::before, *::after': {
        boxSizing: 'inherit',
    },
    body: {
        fontFamily: 'Titillium Web, sans-serif',
        fontSize: '16px',
        margin: 0,
        padding: 0,
        fontWeight: 400,
        backgroundColor: '#242424', // Dark background color for neon effect
    },
    '.neon-text': {
        color: '#ffffff',
        textShadow: '0 0 1px #000000, 0 0 2px #000000, 0 0 3px #000000, 0 0 4px #ffffff',
    },
    '.neon-button': {
        backgroundColor: '#e0e0e0',
        color: '#000000',
        boxShadow: '0 0 1px #ffffff, 0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #ffffff',
        border: '1px solid #ffffff',
    },
    '.neon-button-outlined': {
        backgroundColor: '#2f2f2f',
        color: '#e0e0e0',
        boxShadow: '0 0 1px #ffffff, 0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #ffffff',
        border: '1px solid #ffffff',
        transition: 'background-color 0.3s ease, color 0.3s ease, border 0.3s ease, box-shadow 0.3s ease',
    },
    '.neon-button-outlined:hover': {
        backgroundColor: '#e0e0e0',
        color: '#242424',
        boxShadow: '0 0 4px #ffffff, 0 0 5px #ffffff, 0 0 6px #ffffff, 0 0 6px #ffffff',
        border: '1px solid #ffffff',
    },
    '.neon-textfield .MuiInputBase-input': {
        backgroundColor: '#242424',
        color: '#ffffff',
    },
    '.neon-textfield .MuiOutlinedInput-notchedOutline': {
        borderColor: '#ffffff',
    },
    '.neon-textfield .MuiInputLabel-root': {
        color: '#ffffff',
    },
    '.neon-textfield .MuiInputLabel-root.Mui-focused': {
        color: '#ffffff',
    },
    '.neon-alert': {
        backgroundColor: '#362424',
        color: 'rgb(255, 187, 0)',
        boxShadow: '0 0 1px #a50000, 0 0 2px #a50000, 0 0 3px #a50000, 0 0 4px #a50000',
        border: '1px solid #a50000',
    },
    '.google-login-container': {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        marginTop: '10px',
    },
    '.google-login-container div': {
        width: '100%',
    },
    '.google-login-container button': {
        width: '100%',
        padding: '10px',
        fontSize: '16px',
        border: '1px solid #ffffff',
        boxShadow: '0 0 1px #ffffff, 0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #ffffff',
    },
    '.or-text': {
        color: '#ffffff',
        textAlign: 'center',
        margin: '10px 0',
    },
    '.password-info-text': {
        color: '#ffffff',
    },
    '.generate-icon svg': {
        color: '#ffffff',
    },
    '.eye-icon svg': {
        color: '#ffffff90',
    },
    '.eye-open, .eye-closed': {
        transition: 'transform 0.3s ease-in-out',
    },
    '.eye-open:hover': {
        transform: 'scale(1.1) rotate(0deg)',
        transition: 'transform 0.3s ease-in-out',
    },
    '.eye-closed:hover': {
        transform: 'scale(1.1) rotate(180deg)',
        transition: 'transform 0.3s ease-in-out',
    },
    '.password-criteria': {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        fontSize: '12px',
        marginTop: '8px',
        color: '#ffffff',
    },
    '.criteria span': {
        display: 'flex',
        alignItems: 'center',
    },
    '.criteria span svg': {
        marginRight: '4px',
        fontSize: '16px',
    },
};

declare module '@mui/material/SvgIcon' {
    interface SvgIconClasses {
        menu: string;
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonClasses {
        menu: string;
    }
}

// Dark Theme
const neonDarkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#ffffff', // Default neon color
        },
        background: {
            default: '#121212',
            paper: '#242424',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#AAAAAA',
        },
    },
    typography: {
        fontFamily: [
            'Titillium Web',
            'Roboto',
            'Helvetica',
            'Arial',
            'sans-serif',
        ].join(','),
        button: {
            textTransform: 'none',
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                ...commonStyles,
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: `0 0 8px #ffffff`,
                    textShadow: `0 0 8px #ffffff`,
                    transition: 'color 0.2s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, text-shadow 0.3s ease-in-out',
                },
                contained: {
                    backgroundColor: '#ffffff',
                    color: '#242424',
                    '&:hover': {
                        boxShadow: `0 0 30px #ffffff`,
                        
                    },
                },
                outlined: {
                    borderColor: '#ffffff',
                    '&:hover': {
                        backgroundColor: '#e0e0e0', 
                        color: '#242424', 
                        boxShadow: '0 0 4px #ffffff, 0 0 5px #ffffff, 0 0 6px #ffffff, 0 0 6px #ffffff', 
                        border: '1px solid #ffffff'
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    boxShadow: `0 0 8px #ffffff`,
                    transition: 'box-shadow 0.2s ease-in-out',
                },
                menu: {
                    color: undefined, 
                }
            },
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    // Ensuring icons are white in dark mode
                    color: '#FFFFFF',
                },
                menu: {
                    color: undefined, // to be change, I need it to be able to be rewrite
                }
            },
        },
    },
});

// Light Theme
const neonLightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#ffffff', // Default neon color
        },
        background: {
            default: '#FFFFFF',
            paper: '#f5f5f5',
        },
        text: {
            primary: '#000000',
            secondary: '#333333',
        },
    },
    typography: {
        fontFamily: [
            'Titillium Web',
            'Roboto',
            'Helvetica',
            'Arial',
            'sans-serif',
        ].join(','),
        button: {
            textTransform: 'none',
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                ...commonStyles,
                body: {
                    ...commonStyles.body,
                    backgroundColor: '#FFFFFF', // Light background
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: `0 0 8px #ffffff`,
                    textShadow: `0 0 8px #ffffff`,
                    transition: 'color 0.2s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, text-shadow 0.3s ease-in-out',
                },
                contained: {
                    backgroundColor: '#ffffff',
                    color: '#f5f5f5',
                    '&:hover': {
                        boxShadow: `0 0 30px #ffffff`,
                    },
                },
                outlined: {
                    borderColor: '#ffffff',
                    '&:hover': {
                        boxShadow: `0 0 30px #ffffff`,
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    boxShadow: `0 0 8px #ffffff`,
                    transition: 'box-shadow 0.2s ease-in-out',
                },
            },
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    // Ensuring icons are black in light mode
                    color: '#000000',
                },
            },
        },
    },
});

export { neonColors, neonDarkTheme, neonLightTheme };
