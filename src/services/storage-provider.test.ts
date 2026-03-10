import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FirebaseStorage, LocalOnlyStorage } from './storage-provider'
import * as firebaseLib from '@/libs/firebase'
import * as localStorageService from '@/services/local-storage'
import { getDocs, setDoc } from 'firebase/firestore'

// Mocks
vi.mock('@/libs/firebase', () => ({
  db: {},
  isFirebaseConfigured: true
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn()
}))

vi.mock('@/services/local-storage', () => ({
  getPendingStaffs: vi.fn(),
  addPendingStaff: vi.fn(),
  removePendingByEmail: vi.fn()
}))

describe('Storage Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(true)
  })

  describe('FirebaseStorage', () => {
    it('deve listar mesclando Firebase e Pendentes', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [{ id: '1', data: () => ({ email: 'fb@a.com', name: 'FB' }) }]
      } as any)
      vi.mocked(localStorageService.getPendingStaffs).mockReturnValue([{ email: 'local@a.com' }] as any)

      const result = await FirebaseStorage.list()
      expect(result).toHaveLength(2)
      expect(getDocs).toHaveBeenCalled()
    })

    it('deve salvar no Firebase com sucesso', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as any)
      const data = { email: 'test@a.com', name: 'Test' } as any
      
      const result = await FirebaseStorage.create(data)
      expect(result.synced).toBe(true)
      expect(localStorageService.removePendingByEmail).toHaveBeenCalledWith('test@a.com')
    })
  })

  describe('LocalOnlyStorage', () => {
    it('deve listar apenas pendentes do LocalStorage', async () => {
      const mockPending = [{ email: 'local@a.com' }] as any
      vi.mocked(localStorageService.getPendingStaffs).mockReturnValue(mockPending)

      const result = await LocalOnlyStorage.list()
      expect(result).toEqual(mockPending)
      expect(getDocs).not.toHaveBeenCalled()
    })

    it('deve sempre salvar como pendente e retornar synced: false', async () => {
      const data = { email: 'off@a.com', name: 'Offline' } as any
      const result = await LocalOnlyStorage.create(data)
      
      expect(result.synced).toBe(false)
      expect(localStorageService.addPendingStaff).toHaveBeenCalledWith(data)
    })
  })
})
