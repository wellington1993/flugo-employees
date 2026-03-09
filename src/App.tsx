import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
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
          <Breadcrumb />
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default App
