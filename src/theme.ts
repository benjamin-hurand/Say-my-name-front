/// <reference path="./theme-augmentations.d.ts" />
import { createTheme, Theme } from '@mui/material/styles';

const commonStyles = {
  '@import':
    "url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@200;300;400;600;700;900&display=swap')",
  '*': { boxSizing: 'border-box', margin: 0, padding: 0 },
  '*::before, *::after': { boxSizing: 'inherit' },
  body: {
    fontFamily: 'Titillium Web, sans-serif',
    fontSize: '16px',
    margin: 0,
    padding: 0,
    fontWeight: 400,
  },
};

declare module '@mui/material/SvgIcon' {
  interface SvgIconClasses { menu: string; auth: string }
}
declare module '@mui/material/IconButton' {
  interface IconButtonClasses { menu: string }
}
declare module '@mui/material/Typography' {
  interface TypographyClasses { title: string }
}
declare module '@mui/material/Avatar' {
  interface AvatarClasses { auth: string }
}

/* =========================================================
   PARTS COMMUNS — variants opt-in "accent"
   ========================================================= */
const sharedTypography = {
  fontFamily: ['Titillium Web', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
  button: { textTransform: 'none' as const }, // <- IMPORTANT pour le typage
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        backdropFilter: 'blur(6px)',
        transition: 'color 0.2s, border-color 0.3s, box-shadow 0.3s, text-shadow 0.3s',
      },
      contained: {},
      outlined: {},
    },
    // ✅ Variants opt-in via color="accent"
    variants: [
      {
        props: { variant: 'contained', color: 'accent' } as const,
        style: ({ theme }: { theme: Theme }) => ({
          backgroundColor: theme.palette.accent.main,
          color: theme.palette.getContrastText(theme.palette.accent.main),
          boxShadow: `0 0 8px ${theme.palette.accent.main}`,
          textShadow: `0 0 8px ${theme.palette.accent.main}`,
          '&:hover': {
            backgroundColor: theme.palette.accent.main,
            boxShadow: `0 0 20px ${theme.palette.accent.main}`,
          },
        }),
      },
      {
        props: { variant: 'outlined', color: 'accent' } as const,
        style: ({ theme }: { theme: Theme }) => ({
          color: theme.palette.accent.main,
          borderColor: theme.palette.accent.main,
          backgroundColor: 'transparent',
          boxShadow: `0 0 8px ${theme.palette.accent.main}`,
          textShadow: `0 0 8px ${theme.palette.accent.main}`,
          '&:hover': {
            backgroundColor: theme.palette.accent.main,
            color: theme.palette.getContrastText(theme.palette.accent.main),
            boxShadow: `0 0 30px ${theme.palette.accent.main}`,
          },
        }),
      },
    ],
  },

  MuiSvgIcon: {
    styleOverrides: {
      root: { color: 'inherit' },
      menu: { color: undefined },
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: {},
      menu: {
        transition: 'box-shadow 0.2s ease-in-out',
        boxShadow: `0 0 8px transparent`,
        color: undefined,
        backdropFilter: 'blur(6px)',
      },
    },
    variants: [
      {
        props: { color: 'accent' } as const,
        style: ({ theme }: { theme: Theme }) => ({
          color: theme.palette.accent.main,
          boxShadow: `0 0 8px ${theme.palette.accent.main}`,
          backdropFilter: 'blur(6px)',
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(36,36,36,0.3)' : 'rgba(245,245,220,0.3)',
          '&:hover': { boxShadow: `0 0 16px ${theme.palette.accent.main}` },
        }),
      },
    ],
  },

  MuiTypography: {
    styleOverrides: {
      root: {},
      title: {}, // défini par thème (ombre différente)
    },
  },

  MuiAvatar: {
    styleOverrides: {
      root: { backdropFilter: 'blur(6px)' },
      auth: {},
    },
  },

  // ✅ Variant opt-in pour TextField outlined accent
  // (sélecteurs corrigés pour cibler le vrai root de l’OutlinedInput en hover/focus)
  MuiTextField: {
    styleOverrides: { root: {} },
    variants: [
      {
        props: { variant: 'outlined', color: 'accent' } as const,
        style: ({ theme }: { theme: Theme }) => ({
          backdropFilter: 'blur(6px)',
          // état normal
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.accent.main,
          },
          // HOVER (sur le OutlinedInput root)
          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.accent.main,
          },
          // FOCUS
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.accent.main,
          },
        }),
      },
    ],
  },

  // ✅ Verrouille aussi les états directement sur le composant OutlinedInput
  MuiOutlinedInput: {
    variants: [
      {
        props: { color: 'accent' } as const,
        style: ({ theme }: { theme: Theme }) => ({
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.accent.main,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.accent.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.accent.main,
          },
        }),
      },
    ],
  },

  MuiChip: {
    variants: [
      {
        props: { variant: 'outlined', color: 'accent' } as const,
        style: ({ theme }: { theme: Theme }) => ({
          borderColor: theme.palette.accent.main,
          color: theme.palette.accent.main,
        }),
      },
      {
        props: { variant: 'filled', color: 'accent' } as const,
        style: ({ theme }: { theme: Theme }) => ({
          backgroundColor: theme.palette.accent.main,
          color: theme.palette.getContrastText(theme.palette.accent.main),
        }),
      },
    ],
  },
};

/* -------------------- DARK THEME -------------------- */
const darkTheme = (color: string) =>
  createTheme({
    palette: {
      mode: 'dark',
      primary: { main: '#ffffff' },
      background: { default: '#121212', paper: '#242424' },
      text: { primary: '#FFFFFF', secondary: '#AAAAAA' },
      accent: { main: color },
    },
    typography: sharedTypography,
    components: {
      ...sharedComponents,
      MuiCssBaseline: {
        styleOverrides: {
          ...commonStyles,
          body: { ...commonStyles.body, backgroundColor: '#242424' },
        },
      },
      MuiButton: {
        ...sharedComponents.MuiButton,
        styleOverrides: {
          ...sharedComponents.MuiButton.styleOverrides,
          contained: {
            backgroundColor: '#ffffff',
            color: '#242424',
            boxShadow: `0 0 8px #ffffff`,
            textShadow: `0 0 8px #ffffff`,
            '&:hover': { boxShadow: `0 0 5px #ffffff`, backgroundColor: '#efefef' },
            '&.menu': {
              fontSize: '1.2rem',
              color: '#242424',
              backgroundColor: color,
              width: '100%',
              height: 'auto',
              maxHeight: '100%',
              boxShadow: `0 0 8px ${color}`,
              textShadow: `0 0 8px ${color}`,
              transition:
                'color 0.2s, border-color 0.3s, box-shadow 0.3s, text-shadow 0.3s',
              '&:hover': { boxShadow: `0 0 20px ${color}` },
            },
          },
          outlined: {
            borderColor: '#ffffff',
            backgroundColor: '#24242410',
            '&.signup-outlined-button:hover': {
              backgroundColor: '#e0e0e0',
              color: '#242424',
              boxShadow: '0 0 4px #ffffff, 0 0 5px #ffffff, 0 0 6px #ffffff, 0 0 6px #ffffff',
              border: '1px solid #ffffff',
            },
            '&.menu': {
              fontSize: '1.2rem',
              color,
              borderColor: color,
              width: '100%',
              height: 'auto',
              maxHeight: '100%',
              boxShadow: `0 0 8px ${color}`,
              textShadow: `0 0 8px ${color}`,
              transition:
                'color 0.2s, border-color 0.3s, box-shadow 0.3s, text-shadow 0.3s',
              '&:hover': {
                backgroundColor: color,
                color: '#242424',
                boxShadow: `0 0 30px ${color}`,
                transition: 'background-color 0.5s, box-shadow 0.5s, color 0.5s',
                '&.nobg': {
                  backgroundColor: '#242424',
                  color,
                  boxShadow: `0 0 15px ${color}`,
                },
              },
            },
          },
        },
      },
      MuiIconButton: {
        ...sharedComponents.MuiIconButton,
        styleOverrides: {
          ...sharedComponents.MuiIconButton.styleOverrides,
          menu: {
            ...sharedComponents.MuiIconButton.styleOverrides.menu,
            boxShadow: `0 0 8px #ffffff`,
            color: undefined,
            backgroundColor: '#24242450',
          },
        },
      },
      MuiTypography: {
        ...sharedComponents.MuiTypography,
        styleOverrides: {
          ...sharedComponents.MuiTypography.styleOverrides,
          title: {
            textShadow: '0 0 1px #000000, 0 0 2px #000000, 0 0 3px #000000, 0 0 4px #ffffff',
          },
        },
      },
      MuiAvatar: {
        ...sharedComponents.MuiAvatar,
        styleOverrides: {
          ...sharedComponents.MuiAvatar.styleOverrides,
          root: {
            ...sharedComponents.MuiAvatar.styleOverrides.root,
            backgroundColor: '#24242450',
            boxShadow: '0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #ffffff, 0 0 5px #ffffff',
          },
        },
      },
      MuiTextField: {
        ...sharedComponents.MuiTextField,
        styleOverrides: {
          root: {
            backgroundColor: '#24242450',
            color: '#ffffff',
            backdropFilter: 'blur(6px)',
          },
        },
      },
    },
  });

/* -------------------- LIGHT THEME -------------------- */
const lightTheme = (color: string) =>
  createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#242424' },
      background: { default: '#FFFFFF', paper: '#f5f5f5' },
      text: { primary: '#000000', secondary: '#333333' },
      accent: { main: color },
    },
    typography: sharedTypography,
    components: {
      ...sharedComponents,
      MuiCssBaseline: {
        styleOverrides: {
          ...commonStyles,
          body: { ...commonStyles.body, backgroundColor: '#f5f5dc' },
        },
      },
      MuiButton: {
        ...sharedComponents.MuiButton,
        styleOverrides: {
          ...sharedComponents.MuiButton.styleOverrides,
          contained: {
            backgroundColor: '#242424',
            color: '#ffffff',
            boxShadow: `0 0 8px #242424`,
            textShadow: `0 0 8px #242424`,
            '&:hover': { boxShadow: `0 0 5px #242424`, backgroundColor: '#444444' },
            '&.menu': { '&:hover': { boxShadow: `0 0 30px #242424` } },
          },
          outlined: {
            borderColor: '#242424',
            backgroundColor: '#ffffff10',
            '&.signup-outlined-button:hover': {
              backgroundColor: '#242424',
              color: '#e0e0e0',
              boxShadow: '0 0 4px #000000, 0 0 5px #000000, 0 0 6px #000000, 0 0 6px #000000',
              border: '1px solid #000000',
            },
            '&.menu': {
              fontSize: '1.2rem',
              color: color,
              borderColor: color,
              width: '100%',
              height: 'auto',
              maxHeight: '100%',
              boxShadow: `0 0 8px ${color}`,
              textShadow: `0 0 8px ${color}`,
              transition: 'color 0.2s, border-color 0.3s, box-shadow 0.3s, text-shadow 0.3s',
              '&:hover': {
                backgroundColor: color,
                color: '#f5f5dc',
                boxShadow: `0 0 30px ${color}`,
                transition: 'background-color 0.5s, box-shadow 0.5s, color 0.5s',
                border: undefined,
              },
            },
          },
        },
      },
      MuiIconButton: {
        ...sharedComponents.MuiIconButton,
        styleOverrides: {
          ...sharedComponents.MuiIconButton.styleOverrides,
          menu: {
            ...sharedComponents.MuiIconButton.styleOverrides.menu,
            boxShadow: `0 0 8px #242424`,
            color: undefined,
          },
        },
      },
      MuiTypography: {
        ...sharedComponents.MuiTypography,
        styleOverrides: {
          ...sharedComponents.MuiTypography.styleOverrides,
          title: {
            textShadow: '0 0 1px #ffffff, 0 0 2px #ffffff, 0 0 3px #ffffff, 0 0 4px #000000',
          },
        },
      },
      MuiAvatar: {
        ...sharedComponents.MuiAvatar,
        styleOverrides: {
          ...sharedComponents.MuiAvatar.styleOverrides,
          root: {
            ...sharedComponents.MuiAvatar.styleOverrides.root,
            backgroundColor: '#f5f5dc50',
            boxShadow: '0 0 2px #000000, 0 0 3px #000000, 0 0 4px #000000, 0 0 5px #000000',
          },
          auth: {
            backgroundColor: '#f5f5dc50',
            backdropFilter: 'blur(6px)',
          },
        },
      },
      MuiTextField: {
        ...sharedComponents.MuiTextField,
        styleOverrides: {
          root: {
            backgroundColor: '#f5f5dc50',
            color: '#242424',
            backdropFilter: 'blur(6px)',
          },
        },
      },
    },
  });

export { darkTheme, lightTheme };
