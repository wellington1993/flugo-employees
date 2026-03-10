import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import { addPendingStaff, getPendingStaffs, removePendingByEmail } from '@/services/local-storage'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

// 1. Definição da Interface do Storage
export interface StaffStorage {
  list(): Promise<Staff[]>;
  create(data: StaffSchema): Promise<{ synced: boolean; error?: string }>;
  sync(staff: Staff): Promise<boolean>;
  update(id: string, data: StaffSchema): Promise<void>;
  delete(id: string): Promise<void>;
}

// Utilitário de Timeout
function withTimeout<T>(promise: Promise<T>, ms = 30000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout: Banco de dados não respondeu.')), ms)
  )
  return Promise.race([promise, timeout])
}

// Utilitário de Log Remoto
async function logRemoteError(context: string, error: unknown) {
  if (!isFirebaseConfigured) return
  try {
    const logRef = collection(db, 'app_logs')
    const err = error as { message?: string; code?: string }
    await addDoc(logRef, {
      context,
      message: err.message || err.code || String(error),
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    })
  } catch (e) {
    console.error('Remote log failed', e)
  }
}

// 2. Implementação Firebase (Online)
export const FirebaseStorage: StaffStorage = {
  async list(): Promise<Staff[]> {
    const pending = getPendingStaffs()
    if (!isFirebaseConfigured) return pending

    try {
      const staffsCollection = collection(db, 'staffs')
      const snapshot = await withTimeout(getDocs(staffsCollection))
      const fromFirebase = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Staff))

      const firebaseIds = new Set(snapshot.docs.map(d => d.id))
      const stillPending = pending.filter(s => !firebaseIds.has(s.email))
      
      if (stillPending.length !== pending.length) {
        localStorage.setItem('flugo_pending_staffs', JSON.stringify(stillPending))
      }

      return [...fromFirebase, ...stillPending]
    } catch (err) {
      console.error('[Firebase] List failed:', err)
      return pending
    }
  },

  async create(data: StaffSchema): Promise<{ synced: boolean; error?: string }> {
    if (!isFirebaseConfigured) {
      addPendingStaff(data)
      return { synced: false, error: 'Firebase não configurado' }
    }

    try {
      const staffDoc = doc(db, 'staffs', data.email)
      await withTimeout(setDoc(staffDoc, { ...data, createdAt: Date.now() }))
      
      removePendingByEmail(data.email)
      return { synced: true }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      console.error('[Firebase] Create failed:', error)
      
      addPendingStaff(data)
      logRemoteError('createStaff', err).catch(() => {})
      return { synced: false, error: error.code || error.message }
    }
  },

  async sync(staff: Staff): Promise<boolean> {
    if (!isFirebaseConfigured) return false

    try {
      const staffDoc = doc(db, 'staffs', staff.email)
      const docSnap = await withTimeout(getDoc(staffDoc))
      
      if (docSnap.exists()) {
        removePendingByEmail(staff.email)
        return true
      }

      const { _localId, _pendingSync, id, ...payload } = staff
      await withTimeout(setDoc(staffDoc, { ...payload, createdAt: staff.createdAt || Date.now() }))

      removePendingByEmail(staff.email)
      return true
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      console.error('[Firebase] Sync failed:', error.code || error.message)
      return false
    }
  },

  async update(id: string, data: StaffSchema): Promise<void> {
    const staffDoc = doc(db, 'staffs', id)
    await withTimeout(updateDoc(staffDoc, { ...data, updatedAt: Date.now() }))
  },

  async delete(id: string): Promise<void> {
    const staffDoc = doc(db, 'staffs', id)
    await withTimeout(deleteDoc(staffDoc))
  }
}

// 3. Implementação Local (Offline Fallback Permanente)
export const LocalOnlyStorage: StaffStorage = {
  async list(): Promise<Staff[]> {
    return getPendingStaffs()
  },
  async create(data: StaffSchema): Promise<{ synced: boolean; error?: string }> {
    addPendingStaff(data)
    return { synced: false, error: 'Modo Offline' }
  },
  async sync(): Promise<boolean> {
    return false
  },
  async update(): Promise<void> {
    console.warn('Update not supported in LocalOnly mode')
  },
  async delete(): Promise<void> {
    console.warn('Delete not supported in LocalOnly mode')
  }
}
