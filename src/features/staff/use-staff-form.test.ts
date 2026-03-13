import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStaffForm } from './use-staff-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as container from '@/infrastructure/container'
import React from 'react'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/infrastructure/container', () => ({
  container: {
    staffRepository: {
      getAll: vi.fn(),
      getById: vi.fn(),
    },
    departmentRepository: {
      getAll: vi.fn(),
    },
    createStaffUseCase: {
      execute: vi.fn(),
    },
    updateStaffUseCase: {
      execute: vi.fn(),
    },
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)        
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()

  vi.mocked(container.container.staffRepository.getAll).mockResolvedValue({
    value: [],
    success: true,
  } as any)

  vi.mocked(container.container.departmentRepository.getAll).mockResolvedValue({
    value: [],
    success: true,
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

  describe('handleNext', () => {
    it('bloqueia avanço e seta erro quando e-mail já existe', async () => {
      vi.mocked(container.container.staffRepository.getAll).mockResolvedValue({
        value: [{ id: '1', email: 'ana@empresa.com', name: 'Ana', departmentId: 'TI', status: 'ACTIVE' }],
        success: true,
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
      vi.mocked(container.container.staffRepository.getAll).mockResolvedValue({
        value: [{ id: '1', email: 'ANA@EMPRESA.COM', name: 'Ana', departmentId: 'TI', status: 'ACTIVE' }],
        success: true,
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

    it('mantém erro de validação para e-mail com espaços nas bordas', async () => {
      vi.mocked(container.container.staffRepository.getAll).mockResolvedValue({
        value: [{ id: '1', email: '  ANA@EMPRESA.COM  ', name: 'Ana', departmentId: 'TI', status: 'ACTIVE' }],
        success: true,
      } as any)

      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.form.setValue('name', 'Ana Nova')
        result.current.form.setValue('email', ' ana@empresa.com ')
        result.current.form.setValue('status', 'ACTIVE')
      })

      let returned: boolean | undefined
      await act(async () => {
        returned = await result.current.handleNext()
      })

      expect(returned).toBe(false)
      expect(result.current.form.formState.errors.email?.message).toBe('Insira um formato de e-mail válido')
    })

    it('avança para passo 1 quando e-mail é único e dados são válidos', async () => {
      const { result } = renderHook(() => useStaffForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.form.setValue('name', 'Maria Silva')
        result.current.form.setValue('email', 'maria@empresa.com')
        result.current.form.setValue('status', 'ACTIVE')
        result.current.form.setValue('department', 'TI')
      })

      let returned: boolean | undefined
      await act(async () => {
        returned = await result.current.handleNext()
      })

      expect(returned).toBe(true)
      expect(result.current.activeStep).toBe(1)
    })
  })
})
