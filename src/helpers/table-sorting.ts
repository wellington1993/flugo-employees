import type { Staff } from '@/features/staff/types'

type Order = 'asc' | 'desc'

export function getComparator(order: Order, orderBy: keyof Staff) {
  return (a: Staff, b: Staff): number => {
    let aVal = a[orderBy]
    let bVal = b[orderBy]

    // Coerção para garantir comparação segura
    if (typeof aVal === 'number' || typeof bVal === 'number' || orderBy === 'createdAt') {
      aVal = (aVal ?? 0) as number
      bVal = (bVal ?? 0) as number
    } else {
      aVal = (aVal ?? '') as string
      bVal = (bVal ?? '') as string
    }

    if (bVal < aVal) {
      return order === 'desc' ? -1 : 1
    }
    if (bVal > aVal) {
      return order === 'desc' ? 1 : -1
    }
    return 0
  }
}
