import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StaffForm } from './staff-form'
import { ThemeProvider, createTheme } from '@mui/material'
import * as useStaffFormHook from '@/features/staff/use-staff-form'
import { useForm } from 'react-hook-form'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { renderHook } from '@testing-library/react'

// Mock do hook customizado
vi.mock('@/features/staff/use-staff-form', () => ({
  useStaffForm: vi.fn(),
}))

const theme = createTheme()

describe('StaffForm Component - Navegação e Teclado', () => {
  const mockSetToast = vi.fn()
  const mockHandleNext = vi.fn()
  const mockHandleBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderForm = (activeStep = 0) => {
    const { result } = renderHook(() => useForm({
      defaultValues: {
        name: '',
        email: '',
        status: 'ACTIVE',
        department: 'TI'
      }
    }))

    vi.mocked(useStaffFormHook.useStaffForm).mockReturnValue({
      form: result.current,
      activeStep,
      steps: ['Passo 1', 'Passo 2'],
      isPending: false,
      toast: null,
      setToast: mockSetToast,
      handleNext: mockHandleNext,
      handleBack: mockHandleBack,
      currentProgress: activeStep === 0 ? 0 : 50,
    })

    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <StaffForm />
        </ThemeProvider>
      </BrowserRouter>
    )
  }

  it('deve focar no campo Título ao carregar o passo 1', () => {
    renderForm(0)
    expect(screen.getByLabelText(/Título/i)).toHaveFocus()
  })

  it('deve chamar handleNext ao pressionar Enter no campo Título', async () => {
    const user = userEvent.setup()
    renderForm(0)
    
    const input = screen.getByLabelText(/Título/i)
    await user.type(input, '{enter}')

    expect(mockHandleNext).toHaveBeenCalled()
  })

  it('deve focar no campo Departamento ao carregar o passo 2', async () => {
    renderForm(1)
    const select = screen.getByLabelText(/Departamento/i)
    expect(select).toHaveFocus()
  })

  it('deve chamar handleNext via submissão de formulário no passo 2', async () => {
    const { container } = renderForm(1)
    
    const form = container.querySelector('form')
    if (form) fireEvent.submit(form)

    expect(mockHandleNext).toHaveBeenCalled()
  })
})
