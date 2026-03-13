/**
 * Gera um UUID v4 compatível com todos os navegadores.
 * Substitui `crypto.randomUUID()` para evitar problemas em contextos não seguros ou navegadores mais antigos.
 */
export function generateUUID(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
