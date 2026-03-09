import { useState } from 'react'
import type { Staff } from '@/features/staff/types'

type Order = 'asc' | 'desc'

export function useSortTable(defaultOrderBy: keyof Staff = 'name') {
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<keyof Staff>(defaultOrderBy)

  const createSortHandler = (column: keyof Staff) => () => {
    const isAsc = orderBy === column && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(column)
  }

  return { order, orderBy, createSortHandler }
}
