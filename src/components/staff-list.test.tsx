import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaffList } from './staff-list'
import { ThemeProvider, createTheme } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import * as staffHooks from '@/features/staff/hooks'
import React from 'react'

// Mock dos hooks
vi.mock('@/features/staff/hooks', () => ({
  useStaffs: vi.fn(),
  useSyncPending: vi.fn(),
  useDeleteStaff: vi.fn(),
}))

const theme = createTheme()
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </ThemeProvider>
  )
}

describe('StaffList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(staffHooks.useSyncPending).mockReturnValue({
      pendingCount: 0,
      sync: vi.fn(),
    })
    vi.mocked(staffHooks.useDeleteStaff).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
  })

  it('deve exibir Skeletons durante o carregamento', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any)

    renderWithProviders(<StaffList />)
    
    // MUI Skeleton usa a classe MuiSkeleton-root
    const skeletons = document.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('deve exibir mensagem de erro quando falhar', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any)

    renderWithProviders(<StaffList />)
    
    expect(screen.getByText(/Não foi possível carregar os colaboradores/i)).toBeDefined()
  })

  it('deve exibir mensagem de lista vazia', () => {
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any)

    renderWithProviders(<StaffList />)
    
    expect(screen.getByText(/Nenhum colaborador cadastrado ainda/i)).toBeDefined()
  })

  it('deve renderizar a tabela com dados dos colaboradores', () => {
    const mockStaffs = [
      { id: '1', name: 'João Silva', email: 'joao@test.com', department: 'TI', status: 'ACTIVE' }
    ]
    vi.mocked(staffHooks.useStaffs).mockReturnValue({
      data: mockStaffs,
      isLoading: false,
      isError: false,
    } as any)

    renderWithProviders(<StaffList />)
    
    expect(screen.getByText('João Silva')).toBeDefined()
    expect(screen.getByText('joao@test.com')).toBeDefined()
  })
})
