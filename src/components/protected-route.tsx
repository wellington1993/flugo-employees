import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, isFirebaseConfigured } from '@/libs/firebase'

const AUTH_BYPASS_KEY = 'flugo_auth_bypass'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const bypassEnabled = localStorage.getItem(AUTH_BYPASS_KEY) === '1'

  if (!isFirebaseConfigured || bypassEnabled) {
    return <>{children}</>
  }

  const [user, loading] = useAuthState(auth)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
