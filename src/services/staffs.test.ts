import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listStaffs, createStaff } from './staffs'
import * as firebaseLib from '@/libs/firebase'
import * as localStorageService from '@/services/local-storage'
import { getDocs, setDoc } from 'firebase/firestore'

// Mocks dos módulos externos
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
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn()
}))

vi.mock('@/services/local-storage', () => ({
  getPendingStaffs: vi.fn(),
  addPendingStaff: vi.fn(),
  removePendingByEmail: vi.fn()
}))

describe('Staffs Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default behavior
    vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(true)
  })

  describe('listStaffs', () => {
    it('deve retornar apenas pendentes se Firebase não estiver configurado', async () => {
      vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(false)
      const mockPending = [{ email: 'test@test.com', name: 'Offline' }] as any
      vi.mocked(localStorageService.getPendingStaffs).mockReturnValue(mockPending)

      const result = await listStaffs()
      
      expect(result).toEqual(mockPending)
      expect(getDocs).not.toHaveBeenCalled()
    })

    it('deve mesclar dados do Firebase com pendentes locais', async () => {
      const mockFirebaseData = {
        docs: [
          { id: '1', data: () => ({ email: 'fb@test.com', name: 'Firebase User' }) }
        ]
      }
      vi.mocked(getDocs).mockResolvedValue(mockFirebaseData as any)
      
      const mockPending = [{ email: 'local@test.com', name: 'Local User' }] as any
      vi.mocked(localStorageService.getPendingStaffs).mockReturnValue(mockPending)

      const result = await listStaffs()

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(expect.objectContaining({ email: 'fb@test.com' }))
      expect(result).toContainEqual(expect.objectContaining({ email: 'local@test.com' }))
    })

    it('deve retornar pendentes se a consulta ao Firebase falhar (fallback)', async () => {
      vi.mocked(getDocs).mockRejectedValue(new Error('Firebase Error'))
      const mockPending = [{ email: 'local@test.com', name: 'Local User' }] as any
      vi.mocked(localStorageService.getPendingStaffs).mockReturnValue(mockPending)

      const result = await listStaffs()

      expect(result).toEqual(mockPending)
    })
  })

  describe('createStaff', () => {
    const validData = {
      email: 'new@test.com',
      name: 'New Staff',
      role: 'Dev',
      department: 'IT',
      status: 'active'
    } as any

    it('deve salvar no LocalStorage se Firebase não estiver configurado', async () => {
      vi.spyOn(firebaseLib, 'isFirebaseConfigured', 'get').mockReturnValue(false)
      
      const result = await createStaff(validData)

      expect(result.synced).toBe(false)
      expect(localStorageService.addPendingStaff).toHaveBeenCalledWith(validData)
    })

    it('deve salvar no Firebase com sucesso e limpar pendente', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as any)
      
      const result = await createStaff(validData)

      expect(result.synced).toBe(true)
      expect(setDoc).toHaveBeenCalled()
      expect(localStorageService.removePendingByEmail).toHaveBeenCalledWith(validData.email)
    })

    it('deve salvar no LocalStorage se o Firebase falhar', async () => {
      vi.mocked(setDoc).mockRejectedValue(new Error('Network Error'))
      
      const result = await createStaff(validData)

      expect(result.synced).toBe(false)
      expect(localStorageService.addPendingStaff).toHaveBeenCalledWith(validData)
    })
  })
})
