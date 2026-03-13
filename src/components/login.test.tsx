import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Login, getFriendlyAuthErrorMessage } from './login'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
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
    expect(screen.getByText(/modo teste\/offline/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/staffs')
  })

  it('normaliza e-mail antes de autenticar no login', async () => {
    vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(true)
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({} as any)

    render(<MemoryRouter><Login /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: '  USER@Example.COM  ' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(firebaseLib.auth, 'user@example.com', 'password123')
    )
  })

  it('normaliza e-mail antes de autenticar no cadastro', async () => {
    vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(true)
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({} as any)

    render(<MemoryRouter><Login /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /criar nova conta/i }))
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: '  NEWUSER@Example.COM  ' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() =>
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(firebaseLib.auth, 'newuser@example.com', 'password123')
    )
  })

  it('exibe mensagem amigável para erro auth/too-many-requests', async () => {
    vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(true)
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue({ code: 'auth/too-many-requests' })

    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.')).toBeInTheDocument()
  })

  it('não vaza mensagem técnica no fallback de erro desconhecido', async () => {
    vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(true)
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue({
      code: 'auth/something-new',
      message: 'Firebase: random internal detail',
    })

    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    const fallback = await screen.findByText('Não foi possível fazer login agora. Tente novamente em alguns instantes.')
    expect(fallback).toBeInTheDocument()
    expect(screen.queryByText(/Firebase: random internal detail/i)).not.toBeInTheDocument()
  })
})

describe('getFriendlyAuthErrorMessage', () => {
  it.each([
    ['auth/invalid-credential', 'E-mail ou senha incorretos. Por favor, tente novamente.'],
    ['auth/invalid-email', 'O formato do e-mail é inválido.'],
    ['auth/user-disabled', 'Esta conta foi desativada. Entre em contato com o suporte.'],
    ['auth/too-many-requests', 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'],
    ['auth/network-request-failed', 'Não foi possível conectar à internet. Verifique sua conexão e tente novamente.'],
    ['auth/configuration-not-found', 'Serviço de autenticação indisponível no momento. Tente novamente mais tarde.'],
  ])('mapeia %s para mensagem amigável', (code, expectedMessage) => {
    expect(getFriendlyAuthErrorMessage({ code })).toBe(expectedMessage)
  })

  it('retorna fallback seguro para erros não mapeados', () => {
    expect(getFriendlyAuthErrorMessage({ code: 'auth/unknown', message: 'raw technical detail' }))
      .toBe('Não foi possível fazer login agora. Tente novamente em alguns instantes.')
  })
})
