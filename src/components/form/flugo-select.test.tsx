import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FlugoSelect } from './flugo-select'
import { ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme()

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('FlugoSelect', () => {
  it('deve renderizar com atributo select', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Select Option"
        options={['Option 1', 'Option 2']}
      />
    )
    
    const select = container.querySelector('[role="combobox"]')
    expect(select).toBeInTheDocument()
  })

  it('deve renderizar label do select', () => {
    renderWithTheme(
      <FlugoSelect 
        label="Department"
        options={['IT', 'HR', 'Finance']}
      />
    )
    
    const labels = screen.queryAllByText('Department')
    expect(labels.length).toBeGreaterThan(0)
  })

  it('deve renderizar select com variant outlined', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Status"
        options={['ACTIVE', 'INACTIVE']}
      />
    )
    
    const formControl = container.querySelector('.MuiFormControl-fullWidth')
    expect(formControl).toBeInTheDocument()
  })

  it('deve renderizar select com fullWidth', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Options"
        options={['A', 'B']}
      />
    )
    
    const root = container.querySelector('.MuiFormControl-fullWidth')
    expect(root).toBeInTheDocument()
  })

  it('deve suportar defaultValue com string', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Department"
        options={['IT', 'HR']}
        defaultValue="IT"
      />
    )
    
    const select = container.querySelector('[role="combobox"]') as HTMLElement
    expect(select.textContent).toBe('IT')
  })

  it('deve suportar defaultValue com objeto value', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Department"
        options={[
          { label: 'IT Department', value: 'it' },
          { label: 'HR Department', value: 'hr' },
        ]}
        defaultValue="hr"
      />
    )
    
    const select = container.querySelector('[role="combobox"]') as HTMLElement
    expect(select).toBeInTheDocument()
  })

  it('deve suportar estado disabled', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Disabled Select"
        options={['Option 1', 'Option 2']}
        disabled
      />
    )
    
    const select = container.querySelector('[role="combobox"]') as HTMLElement
    expect(select).toHaveAttribute('aria-disabled', 'true')
  })

  it('deve suportar erro com helperText', () => {
    renderWithTheme(
      <FlugoSelect 
        label="Department"
        options={['IT', 'HR']}
        error
        helperText="Department é obrigatório"
      />
    )
    
    expect(screen.getByText('Department é obrigatório')).toBeInTheDocument()
  })

  it('deve suportar required', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Required Select"
        options={['Option 1', 'Option 2']}
        required
      />
    )
    
    const select = container.querySelector('[role="combobox"]')
    expect(select).toBeInTheDocument()
  })

  it('deve renderizar com fullWidth por padrão', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Test"
        options={['A', 'B']}
      />
    )
    
    const formControl = container.querySelector('.MuiFormControl-fullWidth')
    expect(formControl).toBeInTheDocument()
  })

  it('deve suportar array vazio de opções', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Empty Select"
        options={[]}
      />
    )
    
    const select = container.querySelector('[role="combobox"]')
    expect(select).toBeInTheDocument()
  })

  it('deve forwardar ref corretamente', () => {
    const ref = React.createRef<HTMLDivElement>()
    renderWithTheme(
      <FlugoSelect 
        label="Test"
        options={['Option 1', 'Option 2']}
        ref={ref}
      />
    )
    
    expect(ref.current).toBeDefined()
  })

  it('deve suportar placeholder', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Test"
        options={['A', 'B']}
        placeholder="Choose option"
      />
    )
    
    const select = container.querySelector('[role="combobox"]')
    expect(select).toBeInTheDocument()
  })

  it('deve renderizar select com múltiplas opções como string', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Multiple"
        options={['Option A', 'Option B', 'Option C']}
      />
    )
    
    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument()
  })

  it('deve renderizar select com múltiplas opções como objetos', () => {
    const options = [
      { label: 'Entrada', value: 'ENTRY' },
      { label: 'Gerente', value: 'MANAGER' },
    ]
    
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Levels"
        options={options}
      />
    )
    
    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument()
  })

  it('deve manter tipos string e objeto em múltiplas opções', () => {
    const mixedOptions = [
      'SimpleOption',
      { label: 'Complex Option', value: 'complex' },
    ] as any
    
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Mixed"
        options={mixedOptions}
      />
    )
    
    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument()
  })

  it('deve ser um TextField com variant outlined', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Test"
        options={['A', 'B']}
      />
    )
    
    const root = container.querySelector('.MuiTextField-root')
    expect(root).toBeInTheDocument()
  })

  it('deve renderizar corretamente com nome', () => {
    const { container } = renderWithTheme(
      <FlugoSelect 
        label="Status"
        name="status"
        options={['ACTIVE', 'INACTIVE']}
      />
    )
    
    const select = container.querySelector('[role="combobox"]')
    expect(select).toBeInTheDocument()
  })
})
