import { describe, it, expect } from 'vitest'
import { staffSchema, departments } from './validation'

const validData = {
  name: 'Ana Lima',
  email: 'ana@empresa.com',
  department: 'TI' as const,
  status: 'ACTIVE' as const,
}

describe('staffSchema', () => {
  it('aceita dados válidos', () => {
    expect(staffSchema.safeParse(validData).success).toBe(true)
  })

  it('rejeita nome com menos de 3 caracteres', () => {
    const result = staffSchema.safeParse({ ...validData, name: 'An' })
    expect(result.success).toBe(false)
  })

  it('aceita nome com exatamente 3 caracteres', () => {
    const result = staffSchema.safeParse({ ...validData, name: 'Ana' })
    expect(result.success).toBe(true)
  })

  it('rejeita e-mail sem formato válido', () => {
    const result = staffSchema.safeParse({ ...validData, email: 'nao-e-email' })
    expect(result.success).toBe(false)
  })

  it('rejeita e-mail sem domínio', () => {
    const result = staffSchema.safeParse({ ...validData, email: 'teste@' })
    expect(result.success).toBe(false)
  })

  it('rejeita departamento não permitido', () => {
    const result = staffSchema.safeParse({ ...validData, department: 'Inexistente' })
    expect(result.success).toBe(false)
  })

  it('aceita todos os departamentos válidos', () => {
    for (const dep of departments) {
      const result = staffSchema.safeParse({ ...validData, department: dep })
      expect(result.success).toBe(true)
    }
  })

  it('aceita status ACTIVE', () => {
    expect(staffSchema.safeParse({ ...validData, status: 'ACTIVE' }).success).toBe(true)
  })

  it('aceita status INACTIVE', () => {
    expect(staffSchema.safeParse({ ...validData, status: 'INACTIVE' }).success).toBe(true)
  })

  it('rejeita status não permitido', () => {
    const result = staffSchema.safeParse({ ...validData, status: 'PENDING' })
    expect(result.success).toBe(false)
  })
})

describe('departments', () => {
  it('contém os 4 departamentos esperados', () => {
    const expected = ['TI', 'Design', 'Marketing', 'Produto']
    expect(departments).toEqual(expected)
  })

  it('não possui departamentos duplicados', () => {
    const unique = new Set(departments)
    expect(unique.size).toBe(departments.length)
  })
})
