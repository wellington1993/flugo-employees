import { Box, Chip, Slide } from '@mui/material'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import { useConnectivity } from '@/hooks/use-connectivity'

export function ConnectivityIndicator() {
  const isOnline = useConnectivity()

  return (
    <Slide direction="down" in={!isOnline} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <Chip
          icon={<WifiOffIcon sx={{ color: 'white !important' }} />}
          label="Você está offline. Ações de salvamento desativadas."
          sx={{
            bgcolor: 'warning.main',
            color: 'white',
            fontWeight: 700,
            boxShadow: 3,
            '& .MuiChip-label': { px: 2 },
          }}
        />
      </Box>
    </Slide>
  )
}
