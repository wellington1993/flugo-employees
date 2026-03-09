import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import { addPendingStaff, getPendingStaffs, removePendingByEmail } from '@/services/local-storage'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const staffsCollection = collection(db, 'staffs')

function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
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
  // Check local storage first
  const existingLocal = getPendingStaffs().find(s => s.email === data.email)
  if (existingLocal) {
    throw new Error('Já existe um colaborador cadastrado com esse e-mail.')
  }

  const localEntry = addPendingStaff(data)

  if (!isFirebaseConfigured) return { synced: false }

  try {
    // We use email as Doc ID to ensure uniqueness without extra getDocs queries
    const staffDoc = doc(db, 'staffs', data.email)
    const docSnap = await withTimeout(getDoc(staffDoc))

    if (docSnap.exists()) {
      throw new Error('Já existe um colaborador cadastrado com esse e-mail no servidor.')
    }

    const { _localId, _pendingSync, ...payload } = localEntry
    // Removendo createdAt temporariamente para validar regras de segurança do console
    await withTimeout(setDoc(staffDoc, payload))

    removePendingByEmail(data.email)
    return { synced: true }
  } catch (err) {
    console.error('Firebase Error:', err)
    if (err instanceof Error && err.message.includes('e-mail')) {
      removePendingByEmail(data.email)
      throw err
    }
    return { synced: false }
  }
}

export async function pushStaffToFirebase(staff: Staff): Promise<boolean> {
  if (!isFirebaseConfigured) return false

  try {
    const staffDoc = doc(db, 'staffs', staff.email)
    const docSnap = await withTimeout(getDoc(staffDoc))
    
    if (docSnap.exists()) {
      removePendingByEmail(staff.email)
      return true
    }

    const { _localId, _pendingSync, id, ...payload } = staff
    await withTimeout(setDoc(staffDoc, { ...payload, createdAt: Date.now() }))

    removePendingByEmail(staff.email)
    return true
  } catch {
    return false
  }
}
