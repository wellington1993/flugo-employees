import { describe, it, expect } from 'vitest'
import { getComparator } from './table-sorting'
import type { Staff } from '@/features/staff/types'

function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: '1',
    name: 'Ana Lima',
    email: 'ana@empresa.com',
    department: 'TI',
    status: 'ACTIVE',
    ...overrides,
  }
}

describe('getComparator', () => {
  it('ordena em ordem crescente por nome', () => {
    const a = makeStaff({ name: 'Carlos' })
    const b = makeStaff({ name: 'Ana' })
    const cmp = getComparator('asc', 'name')
    expect(cmp(a, b)).toBeGreaterThan(0)
    expect(cmp(b, a)).toBeLessThan(0)
  })

  it('ordena em ordem decrescente por nome', () => {
    const a = makeStaff({ name: 'Carlos' })
    const b = makeStaff({ name: 'Ana' })
    const cmp = getComparator('desc', 'name')
    expect(cmp(a, b)).toBeLessThan(0)
    expect(cmp(b, a)).toBeGreaterThan(0)
  })

  it('retorna 0 para valores iguais', () => {
    const a = makeStaff({ name: 'Ana' })
    const b = makeStaff({ name: 'Ana' })
    expect(getComparator('asc', 'name')(a, b)).toBe(0)
  })

  it('trata valores ausentes como string vazia sem lançar erro', () => {
    const a = makeStaff({ createdAt: undefined })
    const b = makeStaff({ createdAt: undefined })
    expect(() => getComparator('asc', 'createdAt')(a, b)).not.toThrow()
  })

  it('ordena por e-mail em ordem crescente', () => {
    const a = makeStaff({ email: 'z@emp.com' })
    const b = makeStaff({ email: 'a@emp.com' })
    const cmp = getComparator('asc', 'email')
    expect(cmp(a, b)).toBeGreaterThan(0)
  })
})
