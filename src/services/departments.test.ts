import { describe, it, expect, vi, beforeEach } from 'vitest'
import { departmentService } from './departments'
import {
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  query,
  where,
  collection
} from 'firebase/firestore'

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
}))

vi.mock('@/libs/firebase', () => ({
  db: {}
}))

describe('departmentService', () => {
  const mockBatch = {
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(writeBatch).mockReturnValue(mockBatch as any)
    vi.mocked(collection).mockReturnValue({ id: 'collection-ref' } as any)
  })

  describe('getAll', () => {
    it('deve buscar todos os departamentos', async () => {
      const mockDocs = [{ id: '1', data: () => ({ name: 'TI' }) }]
      vi.mocked(getDocs).mockResolvedValue({ docs: mockDocs } as any)
      const result = await departmentService.getAll()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('TI')
    })
  })

  describe('create', () => {
    it('deve criar departamento com staffIds vazio', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-id' } as any)
      const id = await departmentService.create({ name: 'RH' } as any)
      expect(id).toBe('new-id')
      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: 'RH',
        staffIds: []
      }))
    })
  })

  describe('delete', () => {
    it('deve deletar departamento e limpar referências nos colaboradores', async () => {
      const mockStaffDocs = [
        { id: 's1', ref: 'ref1' },
        { id: 's2', ref: 'ref2' }
      ]
      vi.mocked(getDocs).mockResolvedValue({ docs: mockStaffDocs } as any)

      await departmentService.delete('dept-1')

      // Verifica se buscou colaboradores do depto
      expect(where).toHaveBeenCalledWith('departmentId', '==', 'dept-1')
      // Verifica se limpou a referência em cada colaborador (2 updates)
      expect(mockBatch.update).toHaveBeenCalledTimes(2)
      // Verifica se deletou o departamento
      expect(mockBatch.delete).toHaveBeenCalled()
      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })
})
