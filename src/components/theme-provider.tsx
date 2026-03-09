import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { theme } from '@/libs/mui-theme'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
