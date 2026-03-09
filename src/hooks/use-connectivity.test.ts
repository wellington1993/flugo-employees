import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConnectivity } from './use-connectivity'

describe('useConnectivity', () => {
  const originalOnLine = window.navigator.onLine

  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true })
  })

  afterEach(() => {
    vi.stubGlobal('navigator', { onLine: originalOnLine })
    vi.restoreAllMocks()
  })

  it('deve iniciar com o status atual do navegador', () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { result } = renderHook(() => useConnectivity())
    expect(result.current).toBe(false)
  })

  it('deve atualizar para true quando o evento online disparar', () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { result } = renderHook(() => useConnectivity())
    
    act(() => {
      vi.stubGlobal('navigator', { onLine: true })
      window.dispatchEvent(new Event('online'))
    })
    
    expect(result.current).toBe(true)
  })

  it('deve atualizar para false quando o evento offline disparar', () => {
    vi.stubGlobal('navigator', { onLine: true })
    const { result } = renderHook(() => useConnectivity())
    
    act(() => {
      vi.stubGlobal('navigator', { onLine: false })
      window.dispatchEvent(new Event('offline'))
    })
    
    expect(result.current).toBe(false)
  })
})
