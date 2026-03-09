import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import { addPendingStaff, getPendingStaffs, removePendingByEmail } from '@/services/local-storage'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const staffsCollection = collection(db, 'staffs')

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Não foi possível conectar ao banco de dados.')), ms)
  )
  return Promise.race([promise, timeout])
}

export async function listStaffs(): Promise<Staff[]> {
  const pending = getPendingStaffs()

  if (!isFirebaseConfigured) {
    console.warn('Firebase não configurado. Usando apenas dados locais.')
    return pending
  }

  try {
    const snapshot = await withTimeout(getDocs(staffsCollection))
    const fromFirebase = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Staff))

    const firebaseEmails = new Set(fromFirebase.map(s => s.email))
    const stillPending = pending.filter(s => !firebaseEmails.has(s.email))
    if (stillPending.length !== pending.length) {
      localStorage.setItem('flugo_pending_staffs', JSON.stringify(stillPending))
    }

    return [...fromFirebase, ...stillPending]
  } catch (err) {
    console.error('Erro ao listar do Firebase:', err)
    return pending
  }
}

export async function createStaff(data: StaffSchema): Promise<{ synced: boolean }> {
  const existingLocal = getPendingStaffs().find(s => s.email === data.email)
  if (existingLocal) {
    throw new Error('E-mail já cadastrado localmente.')
  }

  const localEntry = addPendingStaff(data)

  if (!isFirebaseConfigured) {
    return { synced: false }
  }

  try {
    const staffDoc = doc(db, 'staffs', data.email)
    const docSnap = await withTimeout(getDoc(staffDoc))

    if (docSnap.exists()) {
      throw new Error('E-mail já cadastrado no servidor.')
    }

    const { _localId, _pendingSync, id: _localIdAlt, ...payload } = localEntry
    
    // createdAt is required by Firestore rules
    const finalData = { ...payload, createdAt: Date.now() }
    
    await withTimeout(setDoc(staffDoc, finalData))

    removePendingByEmail(data.email)
    return { synced: true }
  } catch (err: any) {
    console.error('[Firebase Error]:', err.code || err.message)
    
    if (err instanceof Error && err.message.includes('E-mail já cadastrado')) {
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
    await withTimeout(setDoc(staffDoc, { ...payload, createdAt: staff.createdAt || Date.now() }))

    removePendingByEmail(staff.email)
    return true
  } catch (err: any) {
    console.error('Erro na sincronização de fundo:', err.code || err.message)
    return false
  }
}
