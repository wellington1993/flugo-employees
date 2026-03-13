import { describe, it, expect } from 'vitest'
import { getDuplicateNameWarning } from './use-staff-form'
import type { Staff } from '@/domain/entities/staff'

describe('getDuplicateNameWarning', () => {
  const staffs: Staff[] = [
    {
      id: '1',
      name: 'Ana Souza',
      email: 'ana@empresa.com',
      status: 'ACTIVE',
      departmentId: 'd1',
      role: 'Dev',
      admissionDate: '2024-01-01',
      hierarchicalLevel: 'MID',
      baseSalary: 4000,
    },
  ]

  it('deve retornar aviso quando nome já existe', () => {
    const warning = getDuplicateNameWarning('  ANA SOUZA ', staffs)
    expect(warning).toMatch(/já existe colaborador com este nome/i)
  })

  it('não deve retornar aviso quando nome é único', () => {
    const warning = getDuplicateNameWarning('Bruno Lima', staffs)
    expect(warning).toBeNull()
  })
})
