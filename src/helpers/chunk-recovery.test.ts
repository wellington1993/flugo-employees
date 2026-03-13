import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasAttemptedChunkRecovery, isChunkLoadError, tryRecoverChunkError } from './chunk-recovery'

describe('chunk-recovery', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('identifica erros de carregamento de chunk', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Loading chunk 12 failed'))).toBe(true)
    expect(isChunkLoadError(new Error('outro erro qualquer'))).toBe(false)
  })

  it('recarrega apenas uma vez para autocorreção', () => {
    const reloadMock = vi.fn()

    const firstAttempt = tryRecoverChunkError(new Error('Loading chunk 10 failed'), reloadMock)
    const secondAttempt = tryRecoverChunkError(new Error('Loading chunk 10 failed'), reloadMock)

    expect(firstAttempt).toBe(true)
    expect(secondAttempt).toBe(false)
    expect(hasAttemptedChunkRecovery()).toBe(true)
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})
