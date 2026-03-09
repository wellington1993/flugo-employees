import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import { addPendingStaff, getPendingStaffs, removePendingByEmail } from '@/services/local-storage'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const staffsCollection = collection(db, 'staffs')

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Não foi possível conectar ao banco de dados.')), ms)
  )
  return Promise.race([promise, timeout])
}

export async function listStaffs(): Promise<Staff[]> {
  const pending = getPendingStaffs()

  if (!isFirebaseConfigured) {
    return pending
  }

  try {
    const snapshot = await withTimeout(getDocs(staffsCollection))
    const fromFirebase = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff))

    // Remove from localStorage any item already persisted in Firebase
    const firebaseEmails = new Set(fromFirebase.map(s => s.email))
    const stillPending = pending.filter(s => !firebaseEmails.has(s.email))
    if (stillPending.length !== pending.length) {
      localStorage.setItem('flugo_pending_staffs', JSON.stringify(stillPending))
    }

    return [...fromFirebase, ...stillPending]
  } catch {
    return pending
  }
}

export async function createStaff(data: StaffSchema): Promise<{ synced: boolean }> {
  // Always save locally first so the user gets immediate feedback
  const localEntry = addPendingStaff(data)

  if (!isFirebaseConfigured) return { synced: false }

  try {
    const duplicate = await withTimeout(
      getDocs(query(staffsCollection, where('email', '==', data.email)))
    )
    if (!duplicate.empty) {
      throw new Error('Já existe um colaborador cadastrado com esse e-mail.')
    }

    const { _localId, _pendingSync, ...payload } = localEntry
    await withTimeout(addDoc(staffsCollection, { ...payload, createdAt: Date.now() }))

    // Synced — remove from localStorage
    removePendingByEmail(data.email)
    return { synced: true }
  } catch (err) {
    // If it was a duplicate error, re-throw so the form can show it
    if (err instanceof Error && err.message.includes('e-mail')) {
      removePendingByEmail(data.email)
      throw err
    }
    // Any other error (network, config): keep in localStorage
    return { synced: false }
  }
}
