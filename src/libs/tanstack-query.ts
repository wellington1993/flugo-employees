import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Tenta 3 vezes antes de falhar
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Backoff exponencial
      staleTime: 60_000,
      refetchOnWindowFocus: true, // Re-sincroniza ao voltar para a aba
    },
  },
})
