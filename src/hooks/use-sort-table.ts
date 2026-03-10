import { useState } from 'react'
import type { Staff } from '@/features/staff/types'

type Order = 'asc' | 'desc'

export function useSortTable(
  defaultOrderBy: keyof Staff = 'name',
  onSortChange?: (page: number) => void,
  defaultOrder: Order = 'asc'
) {
  const [order, setOrder] = useState<Order>(defaultOrder)
  const [orderBy, setOrderBy] = useState<keyof Staff>(defaultOrderBy)

  const createSortHandler = (column: keyof Staff) => () => {
    const isAsc = orderBy === column && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(column)
    onSortChange?.(0)
  }

  return { order, orderBy, createSortHandler }
}
