const CHUNK_RECOVERY_FLAG = 'chunk-recovery-reloaded-once'

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`.toLowerCase()
  }

  if (typeof error === 'string') {
    return error.toLowerCase()
  }

  return ''
}

export function isChunkLoadError(error: unknown) {
  const message = getErrorMessage(error)
  return (
    message.includes('chunkloaderror')
    || message.includes('loading chunk')
    || message.includes('failed to fetch dynamically imported module')
    || message.includes('importing a module script failed')
  )
}

export function hasAttemptedChunkRecovery() {
  try {
    return sessionStorage.getItem(CHUNK_RECOVERY_FLAG) === '1'
  } catch {
    return false
  }
}

export function tryRecoverChunkError(error: unknown, reload: () => void = () => window.location.reload()) {
  if (!isChunkLoadError(error) || hasAttemptedChunkRecovery()) {
    return false
  }

  try {
    sessionStorage.setItem(CHUNK_RECOVERY_FLAG, '1')
  } catch {
    return false
  }

  reload()
  return true
}
