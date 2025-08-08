import { createTheme } from '@mui/material/styles';

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
const darkTheme = (color: string) => createTheme({
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
                    backdropFilter: 'blur(6px)', // Blurry effect
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
                        fontSize: '1.2rem', // Make the font size larger
                        color: '#242424',
                        backgroundColor: color,
                        width: '100%',
                        height:'auto',
                        maxHeight: '100%',
                        boxShadow: `0 0 8px ${color}`,
                        textShadow: `0 0 8px ${color}`,
                        transition: 'color 0.2s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, text-shadow 0.3s ease-in-out',
    
                        '&:hover': {
                            boxShadow: `0 0 20px ${color}`,
                        },
                    }
                    
                },
                outlined: {
                    borderColor: '#ffffff',
                    backgroundColor: '#24242410',
                    '&.signup-outlined-button:hover': {
                        backgroundColor: '#e0e0e0', 
                        color: '#242424', 
                        boxShadow: '0 0 4px #ffffff, 0 0 5px #ffffff, 0 0 6px #ffffff, 0 0 6px #ffffff', 
                        border: '1px solid #ffffff'
                    },
                    '&.menu': {
                        fontSize: '1.2rem', // Make the font size larger
                        color: color,
                        borderColor: color,
                        width: '100%',
                        height:'auto',
                        maxHeight: '100%',
                        boxShadow: `0 0 8px ${color}`,
                        textShadow: `0 0 8px ${color}`,
                        transition: 'color 0.2s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, text-shadow 0.3s ease-in-out',
    
                        '&:hover': {
                            backgroundColor: color,
                            color: "#242424",
                            boxShadow: `0 0 30px ${color}`, // Increased shadow on hover
                            transition: 'background-color 0.5s ease-in-out, box-shadow 0.5s ease-in-out, color 0.5s ease-in-out', // Smooth transition for background-color, box-shadow, and text color
                            '&.nobg': {
                                backgroundColor: '#242424',
                                color: color,
                                boxShadow: `0 0 15px ${color}`,
                            },
                        },
                    }
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
                    backdropFilter: 'blur(6px)',
                    backgroundColor: '#24242450',
                }
            },
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    // Ensuring icons are white in dark mode
                    color: 'inherit',
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
                    backgroundColor: '#24242450' ,
                    backdropFilter: 'blur(6px)',
                    boxShadow: '0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #ffffff, 0 0 5px #ffffff',
                },
                auth: {
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    backgroundColor: '#24242450', // Semi-transparent background for blur effect
                    color: color, // Dynamic color for text
                    backdropFilter: 'blur(6px)', // Blurry effect
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: color, // Dynamic color for border
                        },
                        '&:hover fieldset': {
                            borderColor: color, // Dynamic color for hover state
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: color, // Dynamic color for focus state
                        }
                    }
                }
            }
        }
    },
});

// Light Theme
const lightTheme = (color: string) => createTheme({
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
                    backgroundColor: '#f5f5dc',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(6px)', // Blurry effect
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
                    backgroundColor: '#ffffff10',
                    '&.signup-outlined-button:hover': {
                        backgroundColor: '#242424', 
                        color: '#e0e0e0', 
                        boxShadow: '0 0 4px #000000, 0 0 5px #000000, 0 0 6px #000000, 0 0 6px #000000', 
                        border: '1px solid #000000'
                    },
                    '&.menu': {
                            fontSize: '1.2rem', // Make the font size larger
                            color: color,
                            borderColor: color,
                            width: '100%',
                            height: 'auto',
                            maxHeight: '100%',
                            boxShadow: `0 0 8px ${color}`,
                            textShadow: `0 0 8px ${color}`,
                            transition: 'color 0.2s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, text-shadow 0.3s ease-in-out',
                            '&:hover': {
                                backgroundColor: color,
                                color: "#f5f5dc",
                                boxShadow: `0 0 30px ${color}`, // Increased shadow on hover
                                transition: 'background-color 0.5s ease-in-out, box-shadow 0.5s ease-in-out, color 0.5s ease-in-out', // Smooth transition for background-color, box-shadow, and text color
                                border: undefined
                            },
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
                    color: 'inherit', // Inherit color from parent
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
                    backgroundColor: '#f5f5dc50' ,
                    backdropFilter: 'blur(6px)',
                    boxShadow: '0 0 2px #000000, 0 0 3px #000000, 0 0 4px #000000, 0 0 5px #000000',
                },
                auth: {
                    backgroundColor: '#f5f5dc50' ,
                    backdropFilter: 'blur(6px)',
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    backgroundcolor: '#f5f5dc50',
                    color: color, // Dynamic color for text
                    backdropFilter: 'blur(6px)', // Blurry effect
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: color, // Dynamic color for border
                        },
                        '&:hover fieldset': {
                            borderColor: color, // Dynamic color for hover state
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: color, // Dynamic color for focus state
                        }
                    }
                }
            }
        }
    },
});


export { darkTheme, lightTheme };
