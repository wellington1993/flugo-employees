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
  })

  it('deve exibir Skeletons durante o carregamento', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      isLoading: true,
    } as any)

    renderWithProviders(<StaffList />)
    expect(screen.getAllByRole('row')).toHaveLength(6) // Header + 5 skeletons
  })

  it('deve exibir mensagem de erro quando falhar', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      isError: true,
      isLoading: false,
    } as any)

    renderWithProviders(<StaffList />)
    expect(screen.getByText(/Não conseguimos carregar a lista/i)).toBeInTheDocument()
  })

  it('deve exibir mensagem de lista vazia', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any)

    renderWithProviders(<StaffList />)
    expect(screen.getByText(/Nenhum colaborador encontrado/i)).toBeInTheDocument()
  })

  it('deve renderizar a tabela com dados dos colaboradores', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      data: [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@teste.com',
          department: 'TI',
          status: 'ACTIVE',
        },
      ],
      isLoading: false,
      isError: false,
    } as any)

    renderWithProviders(<StaffList />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('joao@teste.com')).toBeInTheDocument()
  })
})
