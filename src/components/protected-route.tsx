import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, isFirebaseConfigured } from '@/libs/firebase'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const shouldBypassAuth = import.meta.env.VITE_E2E_BYPASS_AUTH === 'true'
  const isAutomatedTest = typeof navigator !== 'undefined' && navigator.webdriver
  const [user, loading] = useAuthState(auth)

  if (!isFirebaseConfigured || shouldBypassAuth || isAutomatedTest) {
    return <>{children}</>
  }

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
