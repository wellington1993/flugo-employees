import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    background: {
      default: '#F9FAFB',
      paper: '#fff',
    },
    primary: {
      main: '#53bf53', // Verde Flugo
      contrastText: '#fff',
    },
    success: {
      main: '#53bf53',
      light: '#e8f5e9',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
    },
    text: {
      primary: '#111827',
      secondary: '#525252',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
})
