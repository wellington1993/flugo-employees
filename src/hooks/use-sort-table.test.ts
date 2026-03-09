import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSortTable } from './use-sort-table'

describe('useSortTable', () => {
  it('inicia com ordem crescente e coluna padrão "name"', () => {
    const { result } = renderHook(() => useSortTable())
    expect(result.current.order).toBe('asc')
    expect(result.current.orderBy).toBe('name')
  })

  it('usa a coluna padrão fornecida como argumento', () => {
    const { result } = renderHook(() => useSortTable('email'))
    expect(result.current.orderBy).toBe('email')
  })

  it('alterna para decrescente ao clicar na coluna já selecionada em asc', () => {
    const { result } = renderHook(() => useSortTable('name'))
    act(() => result.current.createSortHandler('name')())
    expect(result.current.order).toBe('desc')
    expect(result.current.orderBy).toBe('name')
  })

  it('volta para crescente ao clicar novamente na coluna em desc', () => {
    const { result } = renderHook(() => useSortTable('name'))
    act(() => result.current.createSortHandler('name')())
    act(() => result.current.createSortHandler('name')())
    expect(result.current.order).toBe('asc')
  })

  it('muda a coluna ativa e redefine a ordem para crescente', () => {
    const { result } = renderHook(() => useSortTable('name'))
    act(() => result.current.createSortHandler('email')())
    expect(result.current.orderBy).toBe('email')
    expect(result.current.order).toBe('asc')
  })

  it('chama onSortChange com 0 ao mudar a ordenação', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useSortTable('name', callback))
    act(() => result.current.createSortHandler('name')())
    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith(0)
  })

  it('chama onSortChange ao trocar a coluna', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useSortTable('name', callback))
    act(() => result.current.createSortHandler('email')())
    expect(callback).toHaveBeenCalledWith(0)
  })
})
