import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { setupBackgroundCacheWarmup } from '@/helpers/background-cache-warmup'
import { tryRecoverChunkError } from '@/helpers/chunk-recovery'
import { queryClient } from '@/libs/tanstack-query'
import { AppRouter } from '@/routes/app-router'
import '@/index.css'

window.addEventListener('error', (event) => {
  tryRecoverChunkError(event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  tryRecoverChunkError(event.reason)
})

if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateServiceWorker = registerSW({
      immediate: false,
      onNeedRefresh() {
        const applyUpdate = () => updateServiceWorker(true)

        if (document.visibilityState === 'visible') {
          applyUpdate()
          return
        }

        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', onVisibilityChange)
            applyUpdate()
          }
        }

        document.addEventListener('visibilitychange', onVisibilityChange)
      },
      onOfflineReady() {
        console.log('Offline mode ready')
      },
    })
  }).catch(err => {
    console.error('SW registration failed:', err)
  })
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch((err) => {
      console.warn('SW cleanup failed:', err)
    })
}

setupBackgroundCacheWarmup()

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
