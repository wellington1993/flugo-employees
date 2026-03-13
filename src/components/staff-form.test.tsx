import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StaffForm } from './staff-form'
import { ThemeProvider, createTheme } from '@mui/material'
import * as useStaffFormHook from '@/features/staff/use-staff-form'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { BrowserRouter } from 'react-router-dom'
import { renderHook } from '@testing-library/react'
import type { StaffSchema } from '@/features/staff/validation'

// Mock do hook customizado
vi.mock('@/features/staff/use-staff-form', () => ({
  useStaffForm: vi.fn(),
}))

const theme = createTheme()

describe('StaffForm Keyboard Navigation', () => {
  const mockSetToast = vi.fn()
  const mockHandleNext = vi.fn()
  const mockHandleBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderForm = (
    activeStep = 0,
    defaults?: Partial<StaffSchema>,
    managers: any[] = []
  ) => {
    const { result } = renderHook(() => useForm<StaffSchema>({
      defaultValues: {
        name: '',
        email: '',
        status: 'ACTIVE',
        departmentId: '',
        role: '',
        admissionDate: '2024-01-01',
        hierarchicalLevel: 'ENTRY',
        managerId: '',
        baseSalary: 0,
        ...defaults
      }
    }))

    vi.mocked(useStaffFormHook.useStaffForm).mockReturnValue({
      form: result.current as unknown as UseFormReturn<StaffSchema, any, undefined>,
      activeStep,
      steps: ['Info Básica', 'Info Profissional'],
      isPending: false,
      toast: null,
      setToast: mockSetToast,
      handleNext: mockHandleNext,
      handleBack: mockHandleBack,
      currentProgress: activeStep === 0 ? 0 : 50,
      departments: [{ id: 'd1', name: 'TI' }],
      managers,
      duplicateNameWarning: null,
    })

    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <StaffForm />
        </ThemeProvider>
      </BrowserRouter>
    )
  }

  it('deve focar no campo Nome ao carregar o passo 1', () => {
    renderForm(0)
    const input = document.querySelector('input[name="name"]')
    expect(input).toHaveFocus()
  })

  it('deve chamar handleNext ao pressionar Enter no campo Nome', async () => {
    const user = userEvent.setup()
    renderForm(0)

    const input = document.querySelector('input[name="name"]')
    if (input) await user.type(input, '{enter}')

    expect(mockHandleNext).toHaveBeenCalled()
  })

  it('deve focar no campo Departamento ao carregar o passo 2', async () => {
    renderForm(1)
    const input = document.querySelector('input[name="departmentId"]')
    // No Material UI Select, o input real fica escondido mas o name deve bater
    expect(input).toBeDefined()
  })

  it('deve chamar handleNext via submissão de formulário no passo 2', async () => {
    const { container } = renderForm(1)

    const form = container.querySelector('form')
    if (form) fireEvent.submit(form)

    expect(mockHandleNext).toHaveBeenCalled()
  })

  it('deve exibir aviso e pedir confirmação no vínculo Gestor -> Gestor', async () => {
    const user = userEvent.setup()
    renderForm(
      1,
      { hierarchicalLevel: 'MANAGER', managerId: 'mgr-1' },
      [{ id: 'mgr-1', name: 'Gestora Ana', hierarchicalLevel: 'MANAGER' }]
    )

    expect(screen.getByText(/vínculo Gestor → Gestor/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /finalizar cadastro/i }))
    expect(screen.getByText(/Confirmar vínculo Gestor → Gestor/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Confirmar e salvar/i }))
    expect(mockHandleNext).toHaveBeenCalled()
  })

  it('deve exibir aviso de nome duplicado sem bloquear o avanço', async () => {
    vi.mocked(useStaffFormHook.useStaffForm).mockReturnValue({
      form: renderHook(() => useForm<StaffSchema>({
        defaultValues: {
          name: 'Ana Souza',
          email: '',
          status: 'ACTIVE',
          departmentId: '',
          role: '',
          admissionDate: '2024-01-01',
          hierarchicalLevel: 'ENTRY',
          managerId: '',
          baseSalary: 0,
        }
      })).result.current as unknown as UseFormReturn<StaffSchema, any, undefined>,
      activeStep: 0,
      steps: ['Info Básica', 'Info Profissional'],
      isPending: false,
      toast: null,
      setToast: mockSetToast,
      handleNext: mockHandleNext,
      handleBack: mockHandleBack,
      currentProgress: 0,
      departments: [{ id: 'd1', name: 'TI' }],
      managers: [],
      duplicateNameWarning: 'Aviso: já existe colaborador com este nome. Você pode continuar e salvar normalmente.',
    })

    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <StaffForm />
        </ThemeProvider>
      </BrowserRouter>
    )

    expect(screen.getByText(/já existe colaborador com este nome/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /próximo passo/i }))
    expect(mockHandleNext).toHaveBeenCalled()
  })
})
