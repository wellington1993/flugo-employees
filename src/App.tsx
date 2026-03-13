import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Container, IconButton, useMediaQuery, useTheme } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Breadcrumb } from '@/components/breadcrumb'
import { useSyncPending } from '@/features/staff/hooks'
import { ConnectivityIndicator } from '@/components/connectivity-indicator'

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  useSyncPending()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <ConnectivityIndicator />
      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Header>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Header>
        <Box component="main" sx={{ flex: 1, p: { xs: 1.5, sm: 2.5, md: 4 }, width: '100%' }}>
          <Container maxWidth="xl" disableGutters>
            <Breadcrumb />
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

export default App
