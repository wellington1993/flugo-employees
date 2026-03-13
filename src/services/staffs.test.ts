import { describe, it, expect, vi, beforeEach } from 'vitest'
import { staffService } from './staffs'
import {
  getDocs,
  getDoc,
  writeBatch,
  doc,
  query,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'

// Mock do Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
  writeBatch: vi.fn(),
  where: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
}))

vi.mock('@/libs/firebase', () => ({
  db: {}
}))

describe('staffService', () => {
  const mockBatch = {
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(writeBatch).mockReturnValue(mockBatch as any)
    vi.mocked(arrayUnion).mockImplementation((...ids) => ({ union: ids } as any))
    vi.mocked(arrayRemove).mockImplementation((...ids) => ({ remove: ids } as any))
  })

  describe('getAll', () => {
    it('deve buscar todos os colaboradores ordenados por data', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ name: 'João Silva' }) },
        { id: '2', data: () => ({ name: 'Maria Santos' }) }
      ]
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs
      } as any)

      const result = await staffService.getAll()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('João Silva')
      expect(query).toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('deve criar colaborador e atualizar o departamento (integridade bidirecional)', async () => {
      const staffData = {
        name: 'João Silva',
        email: 'joao@test.com',
        status: 'ACTIVE' as const,
        departmentId: 'dept-1',
        role: 'Desenvolvedor',
        admissionDate: '2024-01-01',
        hierarchicalLevel: 'MID' as const,
        baseSalary: 5000
      }

      vi.mocked(doc).mockReturnValue({ id: 'new-staff-id' } as any)

      const id = await staffService.create(staffData)

      expect(id).toBe('new-staff-id')

      // 1. Criação do staff
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'new-staff-id' }),
        expect.objectContaining({ name: 'João Silva', departmentId: 'dept-1' })
      )

      // 2. Atualização do departamento
      expect(arrayUnion).toHaveBeenCalledWith('new-staff-id')
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          staffIds: expect.objectContaining({ union: ['new-staff-id'] })
        })
      )

      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('deve atualizar colaborador e sincronizar departamentos na troca', async () => {
      const oldStaff = {
        id: '1',
        departmentId: 'dept-old',
        name: 'João'
      }
      vi.spyOn(staffService, 'getById').mockResolvedValue(oldStaff as any)
      vi.mocked(doc).mockImplementation((_db, coll, id) => ({ id, collection: coll } as any))

      await staffService.update('1', { departmentId: 'dept-new' })

      // 1. Update do staff
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' }),
        { departmentId: 'dept-new' }
      )

      // 2. Remove do antigo e adiciona no novo
      expect(arrayRemove).toHaveBeenCalledWith('1')
      expect(arrayUnion).toHaveBeenCalledWith('1')
      expect(mockBatch.update).toHaveBeenCalledTimes(3) // staff + 2 depts

      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })

  describe('bulkDelete', () => {
    it('deve processar exclusão em massa e limpar referências nos departamentos', async () => {
      const mockStaffs = [
        { id: 's1', departmentId: 'd1' },
        { id: 's2', departmentId: 'd1' }
      ]

      vi.mocked(getDoc).mockImplementation((docRef: any) => {
        const id = docRef.id
        const staff = mockStaffs.find(s => s.id === id)
        return Promise.resolve({
          exists: () => !!staff,
          id,
          data: () => staff
        } as any)
      })

      vi.mocked(doc).mockImplementation((_db, coll, id) => ({ id, collection: coll } as any))

      await staffService.bulkDelete(['s1', 's2'])

      expect(mockBatch.delete).toHaveBeenCalledTimes(2)
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'd1' }),
        expect.objectContaining({ staffIds: expect.objectContaining({ remove: ['s1', 's2'] }) })
      )
      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })
})
