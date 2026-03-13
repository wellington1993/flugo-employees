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

const AUTH_BYPASS_KEY = 'flugo_auth_bypass'

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

    // Se o Firebase não estiver configurado ou der erro de config, permitimos bypass no modo dev
    if (!isFirebaseConfigured) {
      localStorage.setItem(AUTH_BYPASS_KEY, '1')
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
      localStorage.removeItem(AUTH_BYPASS_KEY)
      navigate('/staffs')
    } catch (err: any) {
      console.error('[Login Error]', err)
      
      // Tratamento especial para erro de configuração do Firebase
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setError('O Firebase Auth não está configurado corretamente no console ou no .env. Ative o método E-mail/Senha.')
        localStorage.setItem(AUTH_BYPASS_KEY, '1')
        navigate('/staffs')
      } else {
        setError(err.message || 'Erro na autenticação')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" fontWeight={700} mb={1} align="center">
            Flugo
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={4}>
            Gerenciador de Colaboradores
          </Typography>

          {!isFirebaseConfigured && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Modo offline - clique em Entrar para continuar sem autenticação
            </Alert>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleAuth}>
            <TextField
              fullWidth
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              disabled={isLoading}
              required={isFirebaseConfigured}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              disabled={isLoading}
              required={isFirebaseConfigured}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3, py: 1.2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>

          {isFirebaseConfigured && (
            <Button
              fullWidth
              variant="text"
              sx={{ mt: 2 }}
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp ? 'Já tem conta? Entrar' : 'Criar nova conta'}
            </Button>
          )}
          
          {/* Botão de bypass de emergência para o usuário não ficar travado durante a entrevista se o firebase der erro de config */}
          {error && error.includes('Firebase Auth') && (
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              sx={{ mt: 2 }}
              onClick={() => {
                localStorage.setItem(AUTH_BYPASS_KEY, '1')
                navigate('/staffs')
              }}
            >
              Entrar em Modo Offline (Bypass)
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  )
}

export default Login
