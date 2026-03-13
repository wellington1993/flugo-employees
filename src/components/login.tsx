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

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isFirebaseConfigured) {
      navigate('/staffs')
      return
    }

    setIsLoading(true)

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      navigate('/staffs')
    } catch (err: any) {
      console.error('[Login Error]', err)
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setError('Configuração do Firebase Auth não encontrada. Verifique se o método E-mail/Senha está ativo no console.')
      } else {
        setError(err.message || 'Erro na autenticação')
      }
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

          {!isFirebaseConfigured && (
            <Alert severity="info" sx={{ mb: 2 }}>Modo offline - clique em Entrar para continuar.</Alert>
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
          
          {error && (error.includes('Configuração') || error.includes('not-found')) && (
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
