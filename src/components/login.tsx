import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/libs/firebase'

export function getFriendlyAuthErrorMessage(err: unknown): string {
  const firebaseError = err as { code?: string; message?: string } | null
  const errorCode = firebaseError?.code || ''

  if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
    return 'E-mail ou senha incorretos. Por favor, tente novamente.'
  }

  if (errorCode === 'auth/invalid-email') {
    return 'O formato do e-mail é inválido.'
  }

  if (errorCode === 'auth/user-disabled') {
    return 'Esta conta foi desativada. Entre em contato com o suporte.'
  }

  if (errorCode === 'auth/too-many-requests') {
    return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
  }

  if (errorCode === 'auth/network-request-failed') {
    return 'Não foi possível conectar à internet. Verifique sua conexão e tente novamente.'
  }

  if (
    errorCode === 'auth/configuration-not-found' ||
    firebaseError?.message?.includes('configuration-not-found')
  ) {
    return 'Serviço de autenticação indisponível no momento. Tente novamente mais tarde.'
  }

  return 'Não foi possível fazer login agora. Tente novamente em alguns instantes.'
}

export function Login() {
  const navigate = useNavigate()
  const shouldBypassAuth = import.meta.env.VITE_E2E_BYPASS_AUTH === 'true'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isFirebaseConfigured || shouldBypassAuth) {
      navigate('/staffs')
      return
    }

    setIsLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password)
      }
      navigate('/staffs')
    } catch (err: any) {
      console.error('[Login Error]', err)
      setError(getFriendlyAuthErrorMessage(err))
    } finally {

      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" fontWeight={700} mb={1} align="center">Flugo</Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={4}>Gerenciador de Colaboradores</Typography>

          {(!isFirebaseConfigured || shouldBypassAuth) && (
            <Alert severity="info" sx={{ mb: 2 }}>Modo teste/offline - clique em Entrar para continuar.</Alert>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleAuth}>
            <TextField fullWidth label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" disabled={isLoading} required={isFirebaseConfigured} />
            <TextField fullWidth label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" disabled={isLoading} required={isFirebaseConfigured} />
            <Button fullWidth variant="contained" type="submit" sx={{ mt: 3, py: 1.2 }} disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>

          {isFirebaseConfigured && (
            <Button fullWidth variant="text" sx={{ mt: 2 }} onClick={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
              {isSignUp ? 'Já tem conta? Entrar' : 'Criar nova conta'}
            </Button>
          )}
          
          {error && error.includes('Serviço de autenticação') && (
            <Button fullWidth variant="outlined" color="warning" sx={{ mt: 2 }} onClick={() => navigate('/staffs')}>
              Entrar em Modo Offline (Bypass)
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  )
}

export default Login
