/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom'

class LocalStorageMock {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  get length(): number {
    return this.store.size
  }
}

Object.defineProperty(global, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
})
