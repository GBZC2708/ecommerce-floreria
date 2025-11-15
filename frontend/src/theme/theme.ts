import { createTheme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#1A1A1A',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#C8A878',
      },
      background: {
        default: mode === 'light' ? '#FFFFFF' : '#1A1A1A',
        paper: mode === 'light' ? '#F5F5F5' : '#2A2A2A',
      },
      text: {
        primary: mode === 'light' ? '#1A1A1A' : '#FFFFFF',
        secondary: mode === 'light' ? '#4A4A4A' : '#C8C8C8',
      },
    },
    typography: {
      fontFamily: "var(--font-body)",
      h1: {
        fontFamily: "var(--font-title)",
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: "var(--font-title)",
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontFamily: "var(--font-title)",
        fontWeight: 500,
      },
      subtitle1: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '1.25rem',
        fontWeight: 500,
        letterSpacing: '0.03em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '0.75rem 1.5rem',
          },
          containedPrimary: {
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#333333',
            },
          },
          outlinedPrimary: {
            borderColor: '#1A1A1A',
            color: '#1A1A1A',
            '&:hover': {
              borderColor: '#333333',
              color: '#333333',
              backgroundColor: 'rgba(26,26,26,0.04)',
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            '&:hover': {
              color: '#C8A878',
            },
          },
        },
      },
    },
  })
