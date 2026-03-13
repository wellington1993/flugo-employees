import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './header'
import { onAuthStateChanged, signOut } from 'firebase/auth'

vi.mock('@/libs/firebase', () => ({
  auth: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      callback({
        email: 'user@example.com',
        displayName: 'Usuário Teste',
        photoURL: null,
      } as any)
      return vi.fn()
    })
  })

  it('abre o menu do avatar e fecha com Escape', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    const avatarButton = screen.getByRole('button', { name: /abrir menu do usuário/i })
    await user.click(avatarButton)

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Sair')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('executa logout ao clicar em sair e redireciona para /login', async () => {
    const user = userEvent.setup()
    vi.mocked(signOut).mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /abrir menu do usuário/i }))
    await user.click(screen.getByRole('menuitem', { name: /sair/i }))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
