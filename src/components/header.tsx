import { AppBar, Box, Toolbar, IconButton, Menu, MenuItem, Typography, Divider, Avatar } from '@mui/material'
import { useState, useEffect, type ReactNode } from 'react'
import { auth } from '@/libs/firebase'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import LogoutIcon from '@mui/icons-material/Logout'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

interface HeaderProps {
  children?: ReactNode
}

export function Header({ children }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleMenuClose()
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U'

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
        
        <IconButton
          onClick={handleMenuOpen}
          sx={{ p: 0.5 }}
          aria-controls="user-menu"
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl)}
          aria-label="Abrir menu do usuário"
        >
          <Avatar 
            src={user?.photoURL || `https://api.dicebear.com/9.x/personas/svg?seed=${user?.email || 'Wellington'}`}
            sx={{ width: 36, height: 36 }}
          >
            {userInitial}
          </Avatar>
        </IconButton>

        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 180,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {user?.displayName || 'Usuário'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user?.email || 'Sem e-mail'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleMenuClose} sx={{ py: 1 }}>
            <AccountCircleIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
            Meu Perfil
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ py: 1, color: 'error.main' }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
