import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { queryClient } from '@/libs/tanstack-query'
import { AppRouter } from '@/routes/app-router'
import '@/index.css'

// Registro do PWA - Apenas em produção para não interferir no HMR/Live Reload
if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onOfflineReady() {
        console.log('App pronto para uso offline')
      },
    })
  }).catch(err => {
    console.error('Falha ao registrar Service Worker:', err)
  })
}

// Verifica se o ambiente é Vercel Produção para evitar erros de Analytics no localhost ou preview
const isVercelProduction = import.meta.env.PROD && !!import.meta.env.VITE_VERCEL_ENV

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ErrorBoundary>
          <AppRouter />
          {isVercelProduction && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
