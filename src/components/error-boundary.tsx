import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { hasAttemptedChunkRecovery, isChunkLoadError } from '@/helpers/chunk-recovery'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info)
  }

  render() {
    if (this.state.error) {
      const shouldShowChunkMessage = isChunkLoadError(this.state.error) && hasAttemptedChunkRecovery()

      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          gap={2}
          p={4}
          textAlign="center"
        >
          <Typography variant="h5" fontWeight={600}>
            Algo deu errado
          </Typography>
          <Typography color="text.secondary" maxWidth={400}>
            {shouldShowChunkMessage
              ? 'Não foi possível atualizar os arquivos do aplicativo automaticamente. Verifique sua conexão e tente recarregar novamente em instantes.'
              : this.state.error.message || 'Ocorreu um erro inesperado.'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Recarregar página
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}
