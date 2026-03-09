import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, addDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import { getPendingStaffs, removePendingByEmail } from '@/services/local-storage'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const staffsCollection = collection(db, 'staffs')

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout de conexão com o banco de dados.')), ms)
  )
  return Promise.race([promise, timeout])
}

// Remote logging for production diagnostics
async function logRemoteError(context: string, error: any) {
  if (!isFirebaseConfigured) return
  try {
    const logRef = collection(db, 'app_logs')
    await addDoc(logRef, {
      context,
      message: error.message || error.code || String(error),
      code: error.code || 'unknown',
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      env: import.meta.env.MODE
    })
  } catch (e) {
    console.error('Falha ao gravar log remoto:', e)
  }
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

    const firebaseIds = new Set(snapshot.docs.map(d => d.id))
    const stillPending = pending.filter(s => !firebaseIds.has(s.email))
    if (stillPending.length !== pending.length) {
      localStorage.setItem('flugo_pending_staffs', JSON.stringify(stillPending))
    }

    return [...fromFirebase, ...stillPending]
  } catch (err) {
    console.error('Erro ao listar do Firebase:', err)
    return pending
  }
}

export async function createStaff(data: StaffSchema): Promise<void> {
  const existingLocal = getPendingStaffs().find(s => s.email === data.email)
  if (existingLocal) {
    throw new Error('E-mail já cadastrado (aguardando sincronização).')
  }

  if (!isFirebaseConfigured) {
    throw new Error('Configuração do Firebase ausente no ambiente de produção.')
  }

  try {
    const staffDoc = doc(db, 'staffs', data.email)
    await withTimeout(setDoc(staffDoc, { ...data, createdAt: Date.now() }))
  } catch (err: any) {
    const errorMsg = `Erro ao salvar (${err.code ?? 'timeout'}): ${err.message}`
    console.error('[Firebase]', err)
    await logRemoteError('createStaff', err)
    throw new Error(errorMsg)
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
    console.error('Erro na sincronização de fundo:', error.code || error.message)
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
