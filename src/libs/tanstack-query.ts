import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000, // Mantém em cache por 24 horas para suporte offline
      refetchOnWindowFocus: true,
      networkMode: 'offlineFirst', // Permite que a query execute mesmo sem rede se houver cache
    },
    mutations: {
      networkMode: 'offlineFirst', // Permite que mutações rodem e falhem graciosamente (tratamos no storage)
    },
  },
})
