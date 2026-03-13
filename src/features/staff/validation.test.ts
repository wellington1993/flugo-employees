import { describe, it, expect } from 'vitest'
import { staffSchema, basicInfoSchema, professionalInfoSchema } from './validation'

const validBasicData = {
  name: 'Ana Lima',
  email: 'ana@empresa.com',
  status: 'ACTIVE' as const,
}

const validProfessionalData = {
  departmentId: 'dept-1',
  role: 'Analista',
  admissionDate: '2026-03-01',
  hierarchicalLevel: 'ENTRY' as const,
  baseSalary: 2500,
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

  it('normaliza e-mail com espaços e caixa alta', () => {
    const result = basicInfoSchema.safeParse({ ...validBasicData, email: '  ANA@EMPRESA.COM  ' })
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('ana@empresa.com')
  })

  it('ignora campos de outras etapas', () => {
    const result = basicInfoSchema.safeParse({ ...validBasicData, departmentId: 'dept-1' })
    expect(result.success).toBe(true)
  })
})

describe('professionalInfoSchema (Passo 1)', () => {
  it('aceita informações profissionais válidas', () => {
    expect(professionalInfoSchema.safeParse(validProfessionalData).success).toBe(true)
  })

  it('rejeita quando departamento não é informado', () => {
    const result = professionalInfoSchema.safeParse({
      role: 'Analista',
      admissionDate: '2026-03-01',
      hierarchicalLevel: 'ENTRY',
      baseSalary: 2500,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('O departamento é obrigatório')
  })
})
