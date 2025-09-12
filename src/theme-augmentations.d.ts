import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides { accent: true }
}
declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides { accent: true }
}
declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides { accent: true }
}
declare module '@mui/material/TextField' {
  interface TextFieldPropsColorOverrides { accent: true }
}
declare module '@mui/material/OutlinedInput' {
  interface OutlinedInputPropsColorOverrides { accent: true }
}
