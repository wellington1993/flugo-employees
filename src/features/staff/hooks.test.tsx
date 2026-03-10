import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
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
}))

vi.mock('@/services/local-storage', () => ({
  getPendingStaffs: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Staff Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useStaffs', () => {
    it('deve chamar listStaffs e retornar dados', async () => {
      const mockData = [{ id: '1', name: 'Test' }]
      vi.mocked(staffsService.listStaffs).mockResolvedValue(mockData as any)

      const { result } = renderHook(() => useStaffs(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockData)
      expect(staffsService.listStaffs).toHaveBeenCalled()
    })
  })

  describe('useCreateStaff', () => {
    it('deve chamar createStaff ao mutar', async () => {
      vi.mocked(staffsService.createStaff).mockResolvedValue({ synced: true })
      
      const { result } = renderHook(() => useCreateStaff(), { wrapper: createWrapper() })
      
      result.current.mutate({ name: 'New', email: 'a@a.com' } as any)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(staffsService.createStaff).toHaveBeenCalled()
    })
  })

  describe('useSyncPending', () => {
    it('deve retornar a contagem correta de pendentes', () => {
      vi.mocked(localStorageService.getPendingStaffs).mockReturnValue([{}, {}] as any)
      
      const { result } = renderHook(() => useSyncPending(), { wrapper: createWrapper() })
      
      expect(result.current.pendingCount).toBe(2)
    })

    it('deve tentar sincronizar cada item pendente', async () => {
      const mockPending = [{ email: '1@a.com' }, { email: '2@a.com' }]
      vi.mocked(localStorageService.getPendingStaffs).mockReturnValue(mockPending as any)
      vi.mocked(staffsService.pushStaffToFirebase).mockResolvedValue(true)

      const { result } = renderHook(() => useSyncPending(), { wrapper: createWrapper() })
      
      await result.current.sync()

      expect(staffsService.pushStaffToFirebase).toHaveBeenCalledTimes(2)
    })
  })
})
