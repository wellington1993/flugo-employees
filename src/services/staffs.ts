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
    throw new Error('Já existe um colaborador cadastrado com esse e-mail (local).')
  }

  const localEntry = addPendingStaff(data)

  if (!isFirebaseConfigured) {
    console.warn('Firebase não configurado. Salvo apenas localmente.')
    return { synced: false }
  }

  try {
    const staffDoc = doc(db, 'staffs', data.email)
    const docSnap = await withTimeout(getDoc(staffDoc))

    if (docSnap.exists()) {
      throw new Error('Já existe um colaborador cadastrado com esse e-mail no servidor.')
    }

    const { _localId, _pendingSync, id: _localIdAlt, ...payload } = localEntry
    await withTimeout(setDoc(staffDoc, { ...payload, createdAt: Date.now() }))

    removePendingByEmail(data.email)
    return { synced: true }
  } catch (err) {
    console.error('Falha na sincronização com Firebase:', err)
    
    // Se o erro for de duplicidade, não mantemos no localstorage para evitar confusão
    if (err instanceof Error && err.message.includes('e-mail')) {
      removePendingByEmail(data.email)
      throw err
    }
    
    // Para outros erros (permissão/rede), mantemos como Pendente
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
