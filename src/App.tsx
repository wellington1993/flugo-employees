import { Outlet } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Breadcrumb } from '@/components/breadcrumb'

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box component="main" sx={{ flex: 1, p: { xs: 3, md: 5 } }}>
          <Container maxWidth="md" disableGutters>
            <Breadcrumb />
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

export default App
