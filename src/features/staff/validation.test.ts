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

  it('exibe mensagem "O nome é obrigatório" para nome vazio', () => {
    const result = staffSchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find(i => i.path[0] === 'name')
    expect(issue?.message).toBe('O nome é obrigatório')
  })

  it('exibe mensagem de tamanho mínimo do nome', () => {
    const result = staffSchema.safeParse({ ...validData, name: 'An' })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find(i => i.path[0] === 'name')
    expect(issue?.message).toBe('O nome deve ter pelo menos 3 caracteres')
  })

  it('exibe mensagem "O e-mail é obrigatório" para e-mail vazio', () => {
    const result = staffSchema.safeParse({ ...validData, email: '' })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find(i => i.path[0] === 'email')
    expect(issue?.message).toBe('O e-mail é obrigatório')
  })

  it('exibe mensagem de formato inválido para e-mail malformado', () => {
    const result = staffSchema.safeParse({ ...validData, email: 'nao-e-email' })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find(i => i.path[0] === 'email')
    expect(issue?.message).toContain('e-mail válido')
  })

  it('exibe mensagem para departamento inválido', () => {
    const result = staffSchema.safeParse({ ...validData, department: 'Inexistente' })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find(i => i.path[0] === 'department')
    expect(issue?.message).toBe('Selecione um departamento')
  })

  it('exibe mensagem para status inválido', () => {
    const result = staffSchema.safeParse({ ...validData, status: 'PENDING' })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find(i => i.path[0] === 'status')
    expect(issue?.message).toBe('Selecione um status válido')
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
