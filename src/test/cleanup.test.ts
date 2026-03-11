import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanupTestRecords } from '../../tests/e2e/utils/cleanup'
import { getDocs, deleteDoc } from 'firebase/firestore'

// Mocks do Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn()
}))

describe('cleanupTestRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve deletar apenas registros que correspondam aos padrões de teste', async () => {
    const mockDocs = {
      docs: [
        { id: '1', data: () => ({ name: 'Wellington Teste E2E 123' }) },
        { id: '2', data: () => ({ name: 'Offline Staff ABC' }) },
        { id: '3', data: () => ({ name: 'Usuario Real' }) },
        { id: '4', data: () => ({ name: 'Offline User XYZ' }) },
        { id: '5', data: () => ({ name: 'Teste Ativo 1234567890' }) },
        { id: '6', data: () => ({ name: 'Teste Inativo 1234567890' }) },
        { id: '7', data: () => ({ name: 'Primeiro 1234567890' }) },
      ]
    }
    
    vi.mocked(getDocs).mockResolvedValue(mockDocs as any)

    await cleanupTestRecords()

    // Deve chamar deleteDoc 6 vezes (ids 1, 2, 4, 5, 6 e 7)
    expect(deleteDoc).toHaveBeenCalledTimes(6)
  })

  it('não deve deletar nada se não houver registros correspondentes', async () => {
    const mockDocs = {
      docs: [
        { id: '1', data: () => ({ name: 'João Silva' }) },
        { id: '2', data: () => ({ name: 'Maria Souza' }) },
      ]
    }
    
    vi.mocked(getDocs).mockResolvedValue(mockDocs as any)

    await cleanupTestRecords()

    expect(deleteDoc).not.toHaveBeenCalled()
  })
})
