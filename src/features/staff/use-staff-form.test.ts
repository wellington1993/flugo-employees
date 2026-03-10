import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStaffForm } from './use-staff-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as staffHooks from '@/features/staff/hooks'
import React from 'react'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/features/staff/hooks', () => ({
  useStaffs: vi.fn(),
  useCreateStaff: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockCreateStaff = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()

  vi.mocked(staffHooks.useStaffs).mockReturnValue({
    data: [],
    isLoading: false,
    isSuccess: true,
  } as any)

  vi.mocked(staffHooks.useCreateStaff).mockReturnValue({
    mutateAsync: mockCreateStaff,
    isPending: false,
  } as any)
})

describe('useStaffForm', () => {
  describe('estado inicial', () => {
    it('começa no passo 0', () => {
      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })
      expect(result.current.activeStep).toBe(0)
    })

    it('retorna 2 steps', () => {
      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })
      expect(result.current.steps).toHaveLength(2)
    })

    it('toast começa nulo', () => {
      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })
      expect(result.current.toast).toBeNull()
    })
  })

  describe('handleNext — validação de e-mail duplicado', () => {
    it('bloqueia avanço e seta erro quando e-mail já existe', async () => {
      vi.mocked(staffHooks.useStaffs).mockReturnValue({
        data: [{ id: '1', email: 'ana@empresa.com', name: 'Ana', department: 'TI', status: 'ACTIVE' }],
        isLoading: false,
        isSuccess: true,
      } as any)

      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.form.setValue('name', 'Ana Nova')
        result.current.form.setValue('email', 'ana@empresa.com')
        result.current.form.setValue('status', 'ACTIVE')
      })

      let returned: boolean | undefined
      await act(async () => {
        returned = await result.current.handleNext()
      })

      expect(returned).toBe(false)
      expect(result.current.activeStep).toBe(0)
      expect(result.current.form.formState.errors.email?.message).toBe(
        'Este e-mail já está em uso por outro colaborador.'
      )
    })

    it('ignora diferença de capitalização ao checar duplicata', async () => {
      vi.mocked(staffHooks.useStaffs).mockReturnValue({
        data: [{ id: '1', email: 'ANA@EMPRESA.COM', name: 'Ana', department: 'TI', status: 'ACTIVE' }],
        isLoading: false,
        isSuccess: true,
      } as any)

      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.form.setValue('name', 'Ana Nova')
        result.current.form.setValue('email', 'ana@empresa.com')
        result.current.form.setValue('status', 'ACTIVE')
      })

      let returned: boolean | undefined
      await act(async () => {
        returned = await result.current.handleNext()
      })

      expect(returned).toBe(false)
      expect(result.current.form.formState.errors.email).toBeDefined()
    })

    it('avança para passo 1 quando e-mail é único e dados são válidos', async () => {
      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.form.setValue('name', 'Maria Silva')
        result.current.form.setValue('email', 'maria@empresa.com')
        result.current.form.setValue('status', 'ACTIVE')
      })

      await act(async () => {
        await result.current.handleNext()
      })

      await waitFor(() => {
        expect(result.current.activeStep).toBe(1)
      })
    })
  })

  describe('handleBack', () => {
    it('navega para /staffs quando está no passo 0', () => {
      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.handleBack()
      })

      expect(mockNavigate).toHaveBeenCalledWith('/staffs')
    })

    it('volta ao passo 0 quando está no passo 1', async () => {
      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })

      // Avança para passo 1
      act(() => {
        result.current.form.setValue('name', 'Maria Silva')
        result.current.form.setValue('email', 'maria@empresa.com')
        result.current.form.setValue('status', 'ACTIVE')
      })
      await act(async () => { await result.current.handleNext() })
      await waitFor(() => expect(result.current.activeStep).toBe(1))

      // Volta ao passo 0
      act(() => { result.current.handleBack() })
      expect(result.current.activeStep).toBe(0)
    })
  })
})
