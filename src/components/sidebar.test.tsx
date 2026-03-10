import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from './sidebar'
import { ThemeProvider, createTheme } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

// Mock do useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o item de navegação Colaboradores', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.getByText(/Colaboradores/i)).toBeDefined()
  })

  it('deve navegar para /staffs ao clicar no item', () => {
    renderWithProviders(<Sidebar />)
    
    // O ListItemButton do MUI é renderizado como uma div com role="button"
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockNavigate).toHaveBeenCalledWith('/staffs')
  })

  it('deve renderizar a logo da Flugo', () => {
    renderWithProviders(<Sidebar />)
    const logo = screen.getByAltText('Flugo')
    expect(logo).toBeDefined()
    expect(logo.getAttribute('src')).toContain('flugo_hor.png')
  })
})
