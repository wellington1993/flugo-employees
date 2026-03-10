import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useMediaQuery, useTheme } from '@mui/material'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useNavigate } from 'react-router-dom'

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
      <Box
        component="img"
        src="https://flugo.com.br/images/flugo_hor.png"
        alt="Flugo"
        sx={{ width: '100px', mb: 4 }}
      />
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
