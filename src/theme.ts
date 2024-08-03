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
};

declare module '@mui/material/SvgIcon' {
    interface SvgIconClasses {
        menu: string;
        auth: string;
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonClasses {
        menu: string;
    }
}

declare module '@mui/material/Typography' {
    interface TypographyClasses {
        title: string;
    }
}

declare module '@mui/material/Avatar' {
    interface AvatarClasses {
        auth: string;
    }
}

// Dark Theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#ffffff', 
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
                        boxShadow: `0 0 5px #ffffff`,
                        backgroundColor: '#efefef',
                    },
                    '&.menu': {
                        '&:hover': {
                            boxShadow: `0 0 30px #ffffff`,
                        },
                    }
                    
                },
                outlined: {
                    borderColor: '#ffffff',
                    '&.signup-outlined-button:hover': {
                        backgroundColor: '#e0e0e0', 
                        color: '#242424', 
                        boxShadow: '0 0 4px #ffffff, 0 0 5px #ffffff, 0 0 6px #ffffff, 0 0 6px #ffffff', 
                        border: '1px solid #ffffff'
                    },
                    '&.menu:hover': {
                        backgroundColor: "#242424", // Exemple: changement de couleur de fond
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                },
                menu: {
                    boxShadow: `0 0 8px #ffffff`,
                    transition: 'box-shadow 0.2s ease-in-out',
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
                    color: undefined, 
                }
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {

                },
                title: {
                    textShadow: '0 0 1px #000000, 0 0 2px #000000, 0 0 3px #000000, 0 0 4px #ffffff'
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#242424' ,
                    boxShadow: '0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #ffffff, 0 0 5px #ffffff',
                },
                auth: {
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    backgroundcolor: '#242424',
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { 
                        borderColor: '#ffffff' 
                    }
                }
            }
        }
    },
});

// Light Theme
const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#242424', 
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
                    backgroundColor: '#f5f5dc', // Light background color for neon effect
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: `0 0 8px #242424`,
                    textShadow: `0 0 8px #242424`,
                    transition: 'color 0.2s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, text-shadow 0.3s ease-in-out',
                },
                contained: {
                    backgroundColor: '#242424',
                    color: '#ffffff',
                    '&:hover': {
                        boxShadow: `0 0 5px #242424`,
                        backgroundColor: '#444444',
                    },'&.menu': {
                        '&:hover': {
                            boxShadow: `0 0 30px #242424`,
                        },
                    }
                },
                outlined: {
                    borderColor: '#242424',
                    '&:hover': {
                        backgroundColor: '#343434',
                        color: '#ffffff',
                        boxShadow: '0 0 4px #242424, 0 0 5px #242424, 0 0 6px #242424, 0 0 6px #242424',
                        border: '1px solid #242424',
                        '&.menu': {
                            // styles spécifiques pour les boutons contained avec la classe menu
                            backgroundColor: "#ffffff", // Exemple: changement de couleur de fond
                        }
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                },
                menu: {
                    boxShadow: `0 0 8px #242424`,
                    transition: 'box-shadow 0.2s ease-in-out',
                    color: undefined,
                }
            },
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    // Ensuring icons are black in light mode
                    color: '#000000',
                },
                menu: {
                    color: undefined,                
                },
                auth: {
                    backgroundColor: '#f5f5dc' ,
                    boxShadow: '0 0 2px #000000, 0 0 3px #000000, 0 0 4px #000000, 0 0 5px #000000',
                }
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {

                },
                title: {
                    textShadow: '0 0 1px #ffffff, 0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #000000'
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#f5f5dc' ,
                    boxShadow: '0 0 2px #000000, 0 0 3px #000000, 0 0 4px #000000, 0 0 5px #000000',
                },
                auth: {
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    backgroundcolor: '#ffffff',
                    color: '#242424',
                    '& .MuiOutlinedInput-notchedOutline': { 
                        borderColor: '#242424' 
                    }
                }
            }
        }
    },
});


export { neonColors, darkTheme, lightTheme };
