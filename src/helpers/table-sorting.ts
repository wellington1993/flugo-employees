import type { Staff } from '@/features/staff/types'

type Order = 'asc' | 'desc'

export function getComparator(order: Order, orderBy: keyof Staff) {
  return (a: Staff, b: Staff) => {
    const aVal = a[orderBy]
    const bVal = b[orderBy]
    if (bVal < aVal) return order === 'desc' ? -1 : 1
    if (bVal > aVal) return order === 'desc' ? 1 : -1
    return 0
  }
}
