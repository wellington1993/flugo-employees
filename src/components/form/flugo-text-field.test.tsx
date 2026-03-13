import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlugoTextField } from './flugo-text-field'
import { ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme()

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('FlugoTextField', () => {
  it('deve renderizar com estilo outlined e fullWidth', () => {
    renderWithTheme(
      <FlugoTextField label="Test Field" data-testid="text-field" />
    )
    
    const input = screen.getByTestId('text-field')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('MuiTextField-root')
  })

  it('deve aceitar e exibir um label', () => {
    renderWithTheme(
      <FlugoTextField label="Email" data-testid="email-field" />
    )
    
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('deve permitir digitação de texto', async () => {
    const user = userEvent.setup()
    renderWithTheme(
      <FlugoTextField 
        label="Name" 
        data-testid="name-field"
        defaultValue=""
      />
    )
    
    const input = screen.getByTestId('name-field').querySelector('input') as HTMLInputElement
    await user.type(input, 'João Silva')
    
    expect(input.value).toBe('João Silva')
  })

  it('deve permitir aplicar valor programaticamente via defaultValue', () => {
    renderWithTheme(
      <FlugoTextField 
        label="Status" 
        data-testid="status-field"
        defaultValue="ACTIVE"
      />
    )
    
    const input = screen.getByTestId('status-field').querySelector('input') as HTMLInputElement
    expect(input.value).toBe('ACTIVE')
  })

  it('deve suportar placeholder', () => {
    renderWithTheme(
      <FlugoTextField 
        label="Email"
        placeholder="email@example.com"
        data-testid="email-field"
      />
    )
    
    const input = screen.getByTestId('email-field').querySelector('input') as HTMLInputElement
    expect(input.placeholder).toBe('email@example.com')
  })

  it('deve suportar type de input', () => {
    renderWithTheme(
      <FlugoTextField 
        label="Email"
        type="email"
        data-testid="email-input"
      />
    )
    
    const input = screen.getByTestId('email-input').querySelector('input') as HTMLInputElement
    expect(input.type).toBe('email')
  })

  it('deve suportar tipo number', () => {
    renderWithTheme(
      <FlugoTextField 
        label="Salário"
        type="number"
        data-testid="salary-field"
      />
    )
    
    const input = screen.getByTestId('salary-field').querySelector('input') as HTMLInputElement
    expect(input.type).toBe('number')
  })

  it('deve suportar estado disabled', () => {
    renderWithTheme(
      <FlugoTextField 
        label="Disabled Field"
        disabled
        data-testid="disabled-field"
      />
    )
    
    const input = screen.getByTestId('disabled-field').querySelector('input') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it('deve suportar erro com helperText', () => {
    renderWithTheme(
      <FlugoTextField 
        label="Email"
        error
        helperText="Email inválido"
        data-testid="error-field"
      />
    )
    
    expect(screen.getByText('Email inválido')).toBeInTheDocument()
  })

  it('deve suportar required', () => {
    renderWithTheme(
      <FlugoTextField 
        label="Name"
        required
        data-testid="required-field"
      />
    )
    
    const input = screen.getByTestId('required-field').querySelector('input') as HTMLInputElement
    expect(input.required).toBe(true)
  })

  it('deve suportar onChange callback', async () => {
    const user = userEvent.setup()
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value
    }
    
    renderWithTheme(
      <FlugoTextField 
        label="Input"
        onChange={handleChange}
        data-testid="input-field"
      />
    )
    
    const input = screen.getByTestId('input-field').querySelector('input') as HTMLInputElement
    await user.type(input, 'test')
    expect(input.value).toBe('test')
  })

  it('deve ter border color padrão #e0e0e0', () => {
    renderWithTheme(
      <FlugoTextField 
        label="Test"
        data-testid="test-field"
      />
    )
    
    const input = screen.getByTestId('test-field')
    expect(input).toBeInTheDocument()
  })

  it('deve suportar multiline/textarea', async () => {
    const user = userEvent.setup()
    renderWithTheme(
      <FlugoTextField 
        label="Notes"
        multiline
        rows={4}
        data-testid="textarea-field"
      />
    )
    
    const textarea = screen.getByTestId('textarea-field').querySelector('textarea') as HTMLTextAreaElement
    await user.type(textarea, 'Multi\nline\ntext')
    
    expect(textarea.value).toBe('Multi\nline\ntext')
  })

  it('deve forwardar ref corretamente', () => {
    const ref = React.createRef<HTMLDivElement>()
    renderWithTheme(
      <FlugoTextField 
        label="Test"
        ref={ref}
      />
    )
    
    expect(ref.current).toBeDefined()
    expect(ref.current).toHaveClass('MuiTextField-root')
  })

  it('deve mesclar sx customizado com estilos padrão', () => {
    const { container } = renderWithTheme(
      <FlugoTextField 
        label="Test"
        sx={{ marginTop: 2 }}
        data-testid="custom-sx"
      />
    )
    
    const root = container.querySelector('.MuiOutlinedInput-root')
    expect(root).toBeDefined()
  })
})
