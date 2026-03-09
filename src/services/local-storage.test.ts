import { describe, it, expect, beforeEach } from 'vitest'
import { getPendingStaffs, addPendingStaff, removePendingStaff, removePendingByEmail } from './local-storage'

const staff1 = {
  name: 'Ana Lima',
  email: 'ana@empresa.com',
  department: 'TI' as const,
  status: 'ACTIVE' as const,
}

const staff2 = {
  name: 'Bruno Costa',
  email: 'bruno@empresa.com',
  department: 'RH' as const,
  status: 'ACTIVE' as const,
}

beforeEach(() => {
  localStorage.clear()
})

describe('getPendingStaffs', () => {
  it('retorna array vazio quando não há dados salvos', () => {
    expect(getPendingStaffs()).toEqual([])
  })

  it('retorna array vazio quando o JSON armazenado é inválido', () => {
    localStorage.setItem('flugo_pending_staffs', 'json-invalido')
    expect(getPendingStaffs()).toEqual([])
  })

  it('retorna os colaboradores armazenados', () => {
    addPendingStaff(staff1)
    addPendingStaff(staff2)
    expect(getPendingStaffs()).toHaveLength(2)
  })

  it('deduplica entradas com o mesmo e-mail mantendo a mais recente', () => {
    addPendingStaff(staff1)
    addPendingStaff({ ...staff1, name: 'Ana Duplicada' })
    const pending = getPendingStaffs()
    expect(pending).toHaveLength(1)
    expect(pending[0].name).toBe('Ana Duplicada')
  })
})

describe('addPendingStaff', () => {
  it('cria colaborador com id local e flag de sincronização pendente', () => {
    const result = addPendingStaff(staff1)
    expect(result._pendingSync).toBe(true)
    expect(result._localId).toMatch(/^local_/)
    expect(result.id).toMatch(/^local_/)
  })

  it('substitui entrada existente com o mesmo e-mail', () => {
    addPendingStaff(staff1)
    addPendingStaff({ ...staff1, name: 'Ana Atualizada' })
    const pending = getPendingStaffs()
    expect(pending).toHaveLength(1)
    expect(pending[0].name).toBe('Ana Atualizada')
  })

  it('mantém colaboradores com e-mails distintos', () => {
    addPendingStaff(staff1)
    addPendingStaff(staff2)
    expect(getPendingStaffs()).toHaveLength(2)
  })
})

describe('removePendingStaff', () => {
  it('remove colaborador pelo localId', () => {
    const added = addPendingStaff(staff1)
    removePendingStaff(added._localId!)
    expect(getPendingStaffs()).toHaveLength(0)
  })

  it('não remove nada quando o localId não existe', () => {
    addPendingStaff(staff1)
    removePendingStaff('local_inexistente')
    expect(getPendingStaffs()).toHaveLength(1)
  })

  it('remove somente o colaborador com o localId correspondente', () => {
    const added = addPendingStaff(staff1)
    addPendingStaff(staff2)
    removePendingStaff(added._localId!)
    const pending = getPendingStaffs()
    expect(pending).toHaveLength(1)
    expect(pending[0].email).toBe(staff2.email)
  })
})

describe('removePendingByEmail', () => {
  it('remove colaborador pelo e-mail', () => {
    addPendingStaff(staff1)
    removePendingByEmail(staff1.email)
    expect(getPendingStaffs()).toHaveLength(0)
  })

  it('mantém os demais colaboradores ao remover por e-mail', () => {
    addPendingStaff(staff1)
    addPendingStaff(staff2)
    removePendingByEmail(staff1.email)
    const pending = getPendingStaffs()
    expect(pending).toHaveLength(1)
    expect(pending[0].email).toBe(staff2.email)
  })

  it('não lança erro quando o e-mail não existe', () => {
    addPendingStaff(staff1)
    expect(() => removePendingByEmail('naoexiste@empresa.com')).not.toThrow()
    expect(getPendingStaffs()).toHaveLength(1)
  })
})
