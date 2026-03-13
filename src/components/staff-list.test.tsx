import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaffList } from './staff-list'
import { ThemeProvider, createTheme } from '@mui/material'
import * as staffHooks from '@/features/staff/hooks'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/features/staff/hooks', () => ({
  useStaffs: vi.fn(),
  useDepartments: vi.fn(),
  useBulkDeleteStaff: vi.fn(),
  useSyncPending: vi.fn(),
  useDeleteStaff: vi.fn(),
}))

const theme = createTheme()
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('StaffList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(staffHooks.useSyncPending).mockReturnValue({
      pendingCount: 0,
      sync: vi.fn().mockResolvedValue(true),
    })
    vi.mocked(staffHooks.useDepartments).mockReturnValue({
      data: [{ id: 'd1', name: 'TI' }],
      isLoading: false,
    } as any)
    vi.mocked(staffHooks.useBulkDeleteStaff).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any)
  })

  it('deve exibir Skeletons durante o carregamento', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      isLoading: true,
    } as any)

    renderWithProviders(<StaffList />)
    // Skeletons + Cabeçalho
    expect(screen.getAllByRole('row')).toBeDefined()
  })

  it('deve renderizar a tabela com dados dos colaboradores', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      data: [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@teste.com',
          departmentId: 'd1',
          role: 'Dev',
          status: 'ACTIVE',
        },
      ],
      isLoading: false,
      isError: false,
    } as any)

    renderWithProviders(<StaffList />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('joao@teste.com')).toBeInTheDocument()
    expect(screen.getByText('TI')).toBeInTheDocument() // Nome do depto via departmentId
  })
})
