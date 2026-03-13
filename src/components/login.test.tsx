import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './login'
import { signInWithEmailAndPassword } from 'firebase/auth'
import * as firebaseLib from '@/libs/firebase'

// Mock de libs
vi.mock('firebase/auth')
vi.mock('@/libs/firebase', () => ({
  auth: {},
  isFirebaseConfigured: true,
  db: {}
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('desabilita campos e botão durante o login (loading state)', async () => {
    vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(true)
    let resolveLogin: (value: any) => void
    const loginPromise = new Promise((resolve) => { resolveLogin = resolve })
    vi.mocked(signInWithEmailAndPassword).mockReturnValue(loginPromise as any)

    render(<MemoryRouter><Login /></MemoryRouter>)

    const emailInput = screen.getByLabelText(/e-mail/i)
    const passwordInput = screen.getByLabelText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(emailInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    resolveLogin!({})
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/staffs'))
  })

  it('permite bypass em modo offline sem Firebase configurado', async () => {
    vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(false)
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByText(/modo offline/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/staffs')
  })
})
