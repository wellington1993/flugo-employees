import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
      textAlign="center"
    >
      <Typography variant="h1" fontWeight={700} color="text.disabled" lineHeight={1}>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Página não encontrada
      </Typography>
      <Button component={Link} to="/staffs" variant="contained" sx={{ mt: 1 }}>
        Voltar para colaboradores
      </Button>
    </Box>
  )
}

export default NotFound
