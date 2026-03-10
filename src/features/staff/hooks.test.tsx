import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useStaffs, useCreateStaff, useSyncPending } from './hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as staffsService from '@/services/staffs'
import * as localStorageService from '@/services/local-storage'
import React from 'react'

// Mocks dos serviços
vi.mock('@/services/staffs', () => ({
  listStaffs: vi.fn(),
  createStaff: vi.fn(),
  pushStaffToFirebase: vi.fn(),
  updateStaff: vi.fn(),
  deleteStaff: vi.fn(),
}))

vi.mock('@/services/local-storage', () => ({
  getPendingStaffs: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  })
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('Staff Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useStaffs', () => {
    it('deve retornar dados do serviço', async () => {
      const mockData = [{ id: '1', name: 'Test' }]
      vi.mocked(staffsService.listStaffs).mockResolvedValue(mockData as any)

      const { wrapper } = createWrapper()
      const { result } = renderHook(() => useStaffs(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockData)
    })
  })

  describe('useCreateStaff (Optimistic Updates)', () => {
    it('deve injetar colaborador no cache instantaneamente', async () => {
      // Mock com delay para capturar o estado otimista
      vi.mocked(staffsService.createStaff).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ synced: true }), 100))
      )
      
      const { queryClient, wrapper } = createWrapper()
      queryClient.setQueryData(['staffs'], [])

      const { result } = renderHook(() => useCreateStaff(), { wrapper })
      const newStaff = { name: 'Optimistic User', email: 'opt@test.com', department: 'TI', status: 'ACTIVE' }
      
      await act(async () => {
        result.current.mutate(newStaff as any)
      })

      const cached = queryClient.getQueryData<any[]>(['staffs'])
      expect(cached).toBeDefined()
      expect(cached?.length).toBe(1)
      expect(cached![0]).toMatchObject({ name: 'Optimistic User', _pendingSync: true })
    })

    it('deve restaurar cache em caso de erro', async () => {
      vi.mocked(staffsService.createStaff).mockRejectedValue(new Error('Fail'))
      
      const { queryClient, wrapper } = createWrapper()
      const previous = [{ id: 'old', name: 'Old' }]
      queryClient.setQueryData(['staffs'], previous)

      const { result } = renderHook(() => useCreateStaff(), { wrapper })
      
      await act(async () => {
        try {
          await result.current.mutateAsync({ name: 'Error' } as any)
        } catch (e) {}
      })

      expect(queryClient.getQueryData(['staffs'])).toEqual(previous)
    })
  })

  describe('useSyncPending', () => {
    it('deve contar pendentes corretamente', async () => {
      const mockStaffs = [
        { id: '1', name: 'Sincronizado', _pendingSync: false },
        { id: '2', name: 'Pendente 1', _pendingSync: true },
        { id: '3', name: 'Pendente 2', _pendingSync: true },
      ]
      vi.mocked(staffsService.listStaffs).mockResolvedValue(mockStaffs as any)

      const { wrapper, queryClient } = createWrapper()
      queryClient.setQueryData(['staffs'], mockStaffs)

      const { result } = renderHook(() => useSyncPending(), { wrapper })
      
      await waitFor(() => expect(result.current.pendingCount).toBe(2))
    })

    it('deve evitar sincronizações simultâneas', async () => {
      const mockStaffs = [{ id: '1', name: 'Pendente', _pendingSync: true, email: 'p@p.com' }]
      vi.mocked(staffsService.listStaffs).mockResolvedValue(mockStaffs as any)
      
      // Simula uma sincronização lenta
      let callCount = 0
      vi.mocked(staffsService.pushStaffToFirebase).mockImplementation(async () => {
        callCount++
        await new Promise(resolve => setTimeout(resolve, 100))
        return true
      })

      const { wrapper, queryClient } = createWrapper()
      queryClient.setQueryData(['staffs'], mockStaffs)

      const { result } = renderHook(() => useSyncPending(), { wrapper })
      
      // Dispara múltiplas sincronizações ao mesmo tempo
      await act(async () => {
        result.current.sync()
        result.current.sync()
        result.current.sync()
      })

      // Mesmo disparando 3 vezes, deve ter chamado o serviço apenas uma vez por causa da trava
      expect(callCount).toBe(1)
    })
  })
})
