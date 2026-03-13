import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { DepartmentForm } from './department-form'

vi.mock('@/hooks/use-connectivity', () => ({
  useConnectivity: () => true,
}))

const mockStaffGetAll = vi.fn()
const mockDepartmentGetAll = vi.fn()

vi.mock('@/infrastructure/container', () => ({
  container: {
    staffRepository: {
      getAll: () => mockStaffGetAll(),
    },
    departmentRepository: {
      getAll: () => mockDepartmentGetAll(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const theme = createTheme()

describe('DepartmentForm - edição de colaboradores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStaffGetAll.mockResolvedValue({
      success: true,
      value: [
        {
          id: 'staff-1',
          name: 'Ana Souza',
          email: 'ana@empresa.com',
          status: 'ACTIVE',
          departmentId: 'dept-1',
          role: 'Analista',
          admissionDate: '2024-01-01',
          hierarchicalLevel: 'ENTRY',
          managerId: null,
          baseSalary: 3000,
        },
        {
          id: 'staff-2',
          name: 'Bruno Lima',
          email: 'bruno@empresa.com',
          status: 'ACTIVE',
          departmentId: 'dept-1',
          role: 'Desenvolvedor',
          admissionDate: '2024-01-01',
          hierarchicalLevel: 'MID',
          managerId: null,
          baseSalary: 4000,
        },
      ],
    })
    mockDepartmentGetAll.mockResolvedValue({
      success: true,
      value: [
        { id: 'dept-1', name: 'Tecnologia', description: '', managerId: '', staffIds: ['staff-1', 'staff-2'] },
      ],
    })
  })

  it('mantém colaboradores vinculados no passo 2 e no drawer ao editar', async () => {
    render(
      <ThemeProvider theme={theme}>
        <DepartmentForm
          onCancel={vi.fn()}
          onSaved={vi.fn()}
          department={{
            id: 'dept-1',
            name: 'Tecnologia',
            description: 'Time de produto',
            managerId: '',
            staffIds: ['staff-1', 'staff-2'],
          }}
        />
      </ThemeProvider>
    )

    await waitFor(() => expect(mockStaffGetAll).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByLabelText(/nome do departamento/i)).toHaveValue('Tecnologia'))

    fireEvent.click(screen.getByRole('button', { name: /próximo passo/i }))

    await waitFor(() => expect(screen.getByText(/passo 2\/2/i)).toBeInTheDocument())
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /gerenciar colaboradores/i }))

    await waitFor(() => expect(screen.getByRole('heading', { name: /gerenciar colaboradores/i })).toBeInTheDocument())
    await waitFor(() => expect(screen.getAllByText(/^Selecionado$/i).length).toBeGreaterThanOrEqual(2))
  }, 15000)
})
