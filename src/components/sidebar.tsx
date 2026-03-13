import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useMediaQuery, useTheme } from '@mui/material'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useNavigate } from 'react-router-dom'

import { Logo } from './logo';

const drawerWidth = 240

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const content = (
    <Box sx={{ p: 3 }}>
      <Box sx={{ width: 120, mb: 4 }}>
        <Logo />
      </Box>
      <List disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate('/staffs')
              if (onClose) onClose()
            }}
            sx={{ borderRadius: 1, px: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PeopleAltIcon sx={{ fontSize: 18, color: '#637381' }} />
            </ListItemIcon>
            <ListItemText
              primary="Colaboradores"
              primaryTypographyProps={{ fontSize: 14, color: '#637381', fontWeight: 500 }}
            />
            <ChevronRightIcon sx={{ fontSize: 18, color: '#919eab' }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate('/departments')
              if (onClose) onClose()
            }}
            sx={{ borderRadius: 1, px: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <AccountTreeIcon sx={{ fontSize: 18, color: '#637381' }} />
            </ListItemIcon>
            <ListItemText
              primary="Departamentos"
              primaryTypographyProps={{ fontSize: 14, color: '#637381', fontWeight: 500 }}
            />
            <ChevronRightIcon sx={{ fontSize: 18, color: '#919eab' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        {content}
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px dashed #919eab',
          bgcolor: '#fff',
        },
      }}
    >
      {content}
    </Drawer>
  )
}
