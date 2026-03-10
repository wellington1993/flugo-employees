import { describe, it, expect } from 'vitest'
import { staffSchema, basicInfoSchema, professionalInfoSchema, departments } from './validation'

const validBasicData = {
  name: 'Ana Lima',
  email: 'ana@empresa.com',
  status: 'ACTIVE' as const,
}

const validProfessionalData = {
  department: 'TI' as const,
}

const validFullData = {
  ...validBasicData,
  ...validProfessionalData,
}

describe('staffSchema (Schema Principal)', () => {
  it('aceita dados completos e válidos', () => {
    expect(staffSchema.safeParse(validFullData).success).toBe(true)
  })

  it('rejeita se faltar departamento', () => {
    const result = staffSchema.safeParse(validBasicData)
    expect(result.success).toBe(false)
  })
})

describe('basicInfoSchema (Passo 0)', () => {
  it('aceita informações básicas válidas', () => {
    expect(basicInfoSchema.safeParse(validBasicData).success).toBe(true)
  })

  it('rejeita nome curto', () => {
    const result = basicInfoSchema.safeParse({ ...validBasicData, name: 'An' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('O nome deve ter pelo menos 3 caracteres')
  })

  it('rejeita e-mail inválido', () => {
    const result = basicInfoSchema.safeParse({ ...validBasicData, email: 'nao-e-email' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('e-mail válido')
  })

  it('ignora campos de outras etapas', () => {
    // Deve ser válido mesmo com campos extras, pois o schema só olha para o que conhece
    const result = basicInfoSchema.safeParse({ ...validBasicData, department: 'TI' })
    expect(result.success).toBe(true)
  })
})

describe('professionalInfoSchema (Passo 1)', () => {
  it('aceita informações profissionais válidas', () => {
    expect(professionalInfoSchema.safeParse(validProfessionalData).success).toBe(true)
  })

  it('rejeita departamento inexistente', () => {
    const result = professionalInfoSchema.safeParse({ department: 'Inexistente' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Selecione um departamento')
  })
})

describe('departments', () => {
  it('contém os 4 departamentos esperados', () => {
    const expected = ['TI', 'Design', 'Marketing', 'Produto']
    expect(departments).toEqual(expected)
  })
})
