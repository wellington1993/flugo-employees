import { AppBar, Box, Toolbar } from '@mui/material'
import type { ReactNode } from 'react'

interface HeaderProps {
  children?: ReactNode
}

export function Header({ children }: HeaderProps) {
  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: '#fff' }}
    >
      <Toolbar variant="dense" sx={{ px: { xs: 2, md: 4 } }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {children}
        </Box>
        <Box
          component="img"
          src="https://api.dicebear.com/9.x/personas/svg?seed=Wellington"
          alt="avatar"
          sx={{ width: 36, height: 36, borderRadius: '50%' }}
        />
      </Toolbar>
    </AppBar>
  )
}
