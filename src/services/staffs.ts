import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, addDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import { addPendingStaff, getPendingStaffs, removePendingByEmail } from '@/services/local-storage'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const staffsCollection = collection(db, 'staffs')

function withTimeout<T>(promise: Promise<T>, ms = 30000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout: Banco de dados não respondeu.')), ms)
  )
  return Promise.race([promise, timeout])
}

async function logRemoteError(context: string, error: any) {
  if (!isFirebaseConfigured) return
  try {
    const logRef = collection(db, 'app_logs')
    await addDoc(logRef, {
      context,
      message: error.message || error.code || String(error),
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    })
  } catch (e) {
    console.error('Remote log failed', e)
  }
}

export async function listStaffs(): Promise<Staff[]> {
  const pending = getPendingStaffs()
  if (!isFirebaseConfigured) return pending

  try {
    const snapshot = await withTimeout(getDocs(staffsCollection))
    const fromFirebase = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Staff))

    const firebaseIds = new Set(snapshot.docs.map(d => d.id))
    const stillPending = pending.filter(s => !firebaseIds.has(s.email))
    
    if (stillPending.length !== pending.length) {
      localStorage.setItem('flugo_pending_staffs', JSON.stringify(stillPending))
    }

    return [...fromFirebase, ...stillPending]
  } catch (err) {
    console.error('Fetch failed', err)
    return pending
  }
}

export async function createStaff(data: StaffSchema): Promise<{ synced: boolean; error?: string }> {
  if (!isFirebaseConfigured) {
    addPendingStaff(data)
    return { synced: false, error: 'Firebase offline' }
  }

  try {
    const staffDoc = doc(db, 'staffs', data.email)
    await withTimeout(setDoc(staffDoc, { ...data, createdAt: Date.now() }))
    
    removePendingByEmail(data.email)
    return { synced: true }
  } catch (err: any) {
    console.error('Sync failed', err)
    
    // Fallback redundancy
    addPendingStaff(data)
    
    await logRemoteError('createStaff', err)
    return { synced: false, error: err.code || err.message }
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

    const { _localId: _, _pendingSync: __, id: ___, ...payload } = staff
    await withTimeout(setDoc(staffDoc, { ...payload, createdAt: staff.createdAt || Date.now() }))

    removePendingByEmail(staff.email)
    return true
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    console.error('Background sync failed', error.code || error.message)
    return false
  }
}

export async function updateStaff(id: string, data: StaffSchema): Promise<void> {
  const staffDoc = doc(db, 'staffs', id)
  await withTimeout(updateDoc(staffDoc, { ...data, updatedAt: Date.now() }))
}

export async function deleteStaff(id: string): Promise<void> {
  const staffDoc = doc(db, 'staffs', id)
  await withTimeout(deleteDoc(staffDoc))
}
