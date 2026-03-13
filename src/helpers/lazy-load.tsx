import { lazy, type ComponentType } from 'react'

export function safeLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await importFn()
    } catch (error) {
      console.error('Falha ao carregar módulo dinâmico:', error)

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return await importFn()
      } catch (retryError) {
        if (navigator.onLine) {
          window.location.reload()
        }
        throw retryError
      }
    }
  })
}
